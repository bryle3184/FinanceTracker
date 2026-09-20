// @ts-check
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage, STORAGE_KEY, migrate, SCHEMA_VERSION } from './persist.js';
import { uid, nowISO } from '../lib/id.js';
import { DEFAULT_CURRENCY } from '../lib/money.js';
import { currentMonthKey } from '../lib/date.js';

/**
 * Single Zustand store, slice-shaped. Derived analytics are NOT stored — they
 * are recomputed in selectors. Only `ui` (selectedMonth, activeModal, toasts,
 * sidebarOpen) is transient and excluded from persistence.
 */

// Default first-run household member so transactions are never empty.
function seedMembers() {
  const id = uid();
  return [
    {
      id,
      name: 'You',
      color: '#4cc9a4',
      initials: 'YO',
      isActive: true,
      createdAt: nowISO()
    }
  ];
}

function initialState() {
  return {
    settings: {
      currency: DEFAULT_CURRENCY,
      theme: 'light',
      whatIsNewLastSeenVersion: '0.0.0',
      defaultMemberId: null
    },
    members: seedMembers(),
    transactions: [],
    comments: [],
    recurring: [],
    budgets: [],
    goals: [],
    netWorth: [],
    meta: { lastSyncedAt: null, outboxDirty: false },
    ui: {
      selectedMonth: null, // null => current month resolved in selectors
      activeModal: null,   // { key, payload }
      toasts: [],
      sidebarOpen: false
    },
    hydrated: false
  };
}

/** Ensure a transaction's splits sum to its amount (canonicalize on save). */
function normalizeTransaction(tx) {
  if (tx.type === 'income' || !Array.isArray(tx.splits) || tx.splits.length === 0) {
    return { ...tx, splits: [] };
  }
  // React state may carry a first-pass draft; ensure exact sum.
  const sum = tx.splits.reduce((a, s) => a + (s.shareCents || 0), 0);
  const remainder = tx.amountCents - sum;
  const copy = tx.splits.map((s) => ({ ...s }));
  if (remainder !== 0 && remainder > 0 && copy.length > 0) {
    copy[copy.length - 1].shareCents += remainder;
  }
  return { ...tx, splits: copy };
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState(),

      // ---- settings ----
      setSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      // ---- members ----
      addMember(name, color) {
        const member = {
          id: uid(),
          name: name.trim(),
          color,
          initials: name.trim().slice(0, 2).toUpperCase(),
          isActive: true,
          createdAt: nowISO()
        };
        set((s) => {
          const defaultMemberId = s.settings.defaultMemberId ?? member.id;
          return {
            members: [...s.members, member],
            settings: { ...s.settings, defaultMemberId }
          };
        });
        return member;
      },
      updateMember(id, patch) {
        set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
      },
      /** Soft-delete: deactivate so historical transactions stay intact. */
      deactivateMember(id) {
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, isActive: false } : m))
        }));
      },
      reactivateMember(id) {
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, isActive: true } : m))
        }));
      },
      /**
       * Permanently remove a member. Historical transactions/splits/comments that
       * reference them keep their ids — the app already renders missing members as
       * "Unknown". If the deleted member was the default, reassign to the first
       * surviving active member so new transactions/comments still default somewhere.
       */
      deleteMember(id) {
        set((s) => {
          const members = s.members.filter((m) => m.id !== id);
          const defaultMemberId =
            s.settings.defaultMemberId === id
              ? (members.find((m) => m.isActive)?.id ?? null)
              : s.settings.defaultMemberId;
          return { members, settings: { ...s.settings, defaultMemberId } };
        });
        get().markOutboxDirty();
      },

      // ---- transactions ----
      addTransaction(payload) {
        const now = nowISO();
        const tx = normalizeTransaction({
          ...payload,
          id: uid(),
          date: payload.date || now.slice(0, 10),
          recurringId: payload.recurringId ?? null,
          createdAt: now,
          updatedAt: now
        });
        set((s) => ({ transactions: [...s.transactions, tx] }));
        get().markOutboxDirty();
        return tx;
      },
      updateTransaction(id, patch) {
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? normalizeTransaction({ ...t, ...patch, updatedAt: nowISO() }) : t
          )
        }));
        get().markOutboxDirty();
      },
      deleteTransaction(id) {
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
          comments: s.comments.filter((c) => c.transactionId !== id)
        }));
        get().markOutboxDirty();
      },

      // ---- comments ----
      addComment({ transactionId, authorMemberId, body, parentId = null }) {
        const comment = {
          id: uid(),
          transactionId,
          authorMemberId,
          body,
          parentId,
          createdAt: nowISO()
        };
        set((s) => ({ comments: [...s.comments, comment] }));
        get().markOutboxDirty();
        return comment;
      },
      deleteComment(id) {
        set((s) => ({ comments: s.comments.filter((c) => c.id !== id && c.parentId !== id) }));
        get().markOutboxDirty();
      },

      // ---- recurring ----
      addRecurring(payload) {
        const rec = { ...payload, id: uid(), updatedAt: nowISO() };
        set((s) => ({ recurring: [...s.recurring, rec] }));
        get().markOutboxDirty();
        return rec;
      },
      updateRecurring(id, patch) {
        set((s) => ({
          recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: nowISO() } : r))
        }));
        get().markOutboxDirty();
      },
      deleteRecurring(id) {
        set((s) => ({ recurring: s.recurring.filter((r) => r.id !== id) }));
        get().markOutboxDirty();
      },

      // ---- budgets ----
      addBudget(payload) {
        const budget = { ...payload, id: uid(), updatedAt: nowISO() };
        set((s) => ({ budgets: [...s.budgets, budget] }));
        get().markOutboxDirty();
        return budget;
      },
      upsertBudget(payload) {
        // one budget per (category, month)
        const existing = get().budgets.find(
          (b) => b.categoryId === payload.categoryId && b.monthKey === payload.monthKey
        );
        if (existing) {
          get().updateBudget(existing.id, payload);
          return existing.id;
        }
        return get().addBudget(payload);
      },
      updateBudget(id, patch) {
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: nowISO() } : b))
        }));
        get().markOutboxDirty();
      },
      deleteBudget(id) {
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
        get().markOutboxDirty();
      },

      // ---- goals ----
      addGoal(payload) {
        const goal = {
          ...payload,
          id: uid(),
          contributions: [],
          createdAt: nowISO(),
          updatedAt: nowISO()
        };
        set((s) => ({ goals: [...s.goals, goal] }));
        get().markOutboxDirty();
        return goal;
      },
      updateGoal(id, patch) {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: nowISO() } : g))
        }));
        get().markOutboxDirty();
      },
      deleteGoal(id) {
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
        get().markOutboxDirty();
      },
      addContribution(goalId, { amountCents, date, note = '' }) {
        const contribution = { id: uid(), amountCents, date, note, createdAt: nowISO() };
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, contributions: [...g.contributions, contribution], updatedAt: nowISO() }
              : g
          )
        }));
        get().markOutboxDirty();
      },
      deleteContribution(goalId, contributionId) {
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  contributions: g.contributions.filter((c) => c.id !== contributionId),
                  updatedAt: nowISO()
                }
              : g
          )
        }));
        get().markOutboxDirty();
      },

      // ---- net worth ----
      upsertNetWorth(snapshotPayload) {
        const existing = get().netWorth.find((n) => n.monthKey === snapshotPayload.monthKey);
        if (existing) {
          const updated = {
            ...existing,
            ...snapshotPayload,
            id: existing.id,
            updatedAt: nowISO()
          };
          set((s) => ({ netWorth: s.netWorth.map((n) => (n.monthKey === snapshotPayload.monthKey ? updated : n)) }));
          get().markOutboxDirty();
          return existing.id;
        }
        const snapshot = { ...snapshotPayload, id: uid(), createdAt: nowISO(), updatedAt: nowISO() };
        set((s) => ({ netWorth: [...s.netWorth, snapshot] }));
        get().markOutboxDirty();
        return snapshot.id;
      },
      deleteNetWorth(monthKeyStr) {
        set((s) => ({ netWorth: s.netWorth.filter((n) => n.monthKey !== monthKeyStr) }));
        get().markOutboxDirty();
      },

      // ---- ui ----
      setActiveModal(key, payload = null) {
        set((s) => ({ ui: { ...s.ui, activeModal: key ? { key, payload } : null } }));
      },
      setSelectedMonth(monthKeyStr) {
        set((s) => ({ ui: { ...s.ui, selectedMonth: monthKeyStr } }));
      },
      toggleSidebar(open) {
        set((s) => ({ ui: { ...s.ui, sidebarOpen: open ?? !s.ui.sidebarOpen } }));
      },
      pushToast(message, kind = 'info', durationMs = 4000) {
        const id = uid();
        set((s) => ({ ui: { ...s.ui, toasts: [...s.ui.toasts, { id, message, kind }] } }));
        if (typeof window !== 'undefined' && durationMs > 0) {
          setTimeout(() => get().dismissToast(id), durationMs);
        }
        return id;
      },
      dismissToast(id) {
        set((s) => ({ ui: { ...s.ui, toasts: s.ui.toasts.filter((t) => t.id !== id) } }));
      },

      // ---- meta / sync ----
      markOutboxDirty(dirty = true) {
        set((s) => ({ meta: { ...s.meta, outboxDirty: dirty } }));
      },
      setLastSyncedAt(iso) {
        set((s) => ({ meta: { ...s.meta, lastSyncedAt: iso, outboxDirty: false } }));
      },
      setHydrated() {
        set({ hydrated: true });
      },

      // ---- bulk ----
      /** Full replace from a backup / remote sync. Keeps ui + meta.lastSyncedAt. */
      importState(data) {
        set((s) => ({
          settings: { ...data.settings },
          members: Array.isArray(data.members) ? data.members : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          comments: Array.isArray(data.comments) ? data.comments : [],
          recurring: Array.isArray(data.recurring) ? data.recurring : [],
          budgets: Array.isArray(data.budgets) ? data.budgets : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          netWorth: Array.isArray(data.netWorth) ? data.netWorth : [],
          ui: s.ui
        }));
      },
      /** Persisted (non-ui) slices snapshot for backup/sync. */
      getPersistedData() {
        const s = get();
        return {
          settings: s.settings,
          members: s.members,
          transactions: s.transactions,
          comments: s.comments,
          recurring: s.recurring,
          budgets: s.budgets,
          goals: s.goals,
          netWorth: s.netWorth
        };
      }
    }),
    {
      name: STORAGE_KEY,
      storage: persistStorage,
      version: SCHEMA_VERSION,
      migrate,
      partialize: (state) => {
        const { ui, hydrated, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      }
    }
  )
);

/** Hook: resolved current month key (null => today's month). */
export function useResolvedMonth() {
  return useStore((s) => s.ui.selectedMonth ?? currentMonthKey());
}

/**
 * navMonth needs the resolved current month plus delta.
 * Provides `navMonth(delta)` implemented here against the live store.
 */
export function useNavMonth() {
  const selected = useStore((s) => s.ui.selectedMonth);
  const set = useStore((s) => s.setSelectedMonth);
  return (delta) => {
    const base = selected ?? currentMonthKey();
    const [y, m] = base.split('-').map(Number);
    const idx = y * 12 + (m - 1) + delta;
    set(`${Math.floor(idx / 12)}-${String((((idx % 12) + 12) % 12) + 1).padStart(2, '0')}`);
  };
}