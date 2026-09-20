// @ts-check
import Papa from 'papaparse';

/**
 * CSV import/export helpers for the import/export page.
 *
 * We support a pragmatic column set that maps onto our transaction model.
 * Columns:
 *   date,type,amount,description,category,paidBy,notes
 *   (+ optional memberName column when importing with payer as a person)
 */

/** Build the header row used by the downloadable template. */
export const CSV_TEMPLATE_HEADERS = [
  'date',
  'type',
  'amount',
  'description',
  'category',
  'paidBy',
  'members',
  'notes'
];

export function buildCsvTemplate() {
  return Papa.unparse([
    {
      date: '2026-09-01',
      type: 'expense',
      amount: '12.50',
      description: 'Example groceries',
      category: 'groceries',
      paidBy: 'Alex',
      members: 'Alex',
      notes: 'dinner ingredients'
    }
  ], { header: true });
}

/**
 * Parse a CSV string into rows, returning valid + quarantined rows.
 * `paidBy` and `members` are matched against provided memberName->id maps.
 *
 * @param {string} text
 * @param {{byName: Map<string,string>, byId: Map<string,string>}} memberIndex
 * @param {string} currency
 * @returns {{valid: Array<object>, errors: Array<{row:number, reason:string}>}}
 */
export function parseTransactions(text, memberIndex, currency) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase()
  });
  const valid = [];
  const errors = [];
  const { byName, byId } = memberIndex;

  result.data.forEach((raw, i) => {
    const rowNum = result.errors && result.errors[0] && result.errors[0].row != null ? i + 2 : i + 2; // header is row 1
    const date = raw['date'] || raw['date\n' + ''] || '';
    const type = (raw['type'] || '').toLowerCase();
    const amount = raw['amount'];
    const description = raw['description'] || '';
    const category = (raw['category'] || '').toLowerCase();
    const paidByName = raw['paidby'];
    const membersRaw = raw['members'] || '';

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
      errors.push({ row: rowNum, reason: `Invalid date '${date}' (expected YYYY-MM-DD)` });
      return;
    }
    if (type !== 'expense' && type !== 'income') {
      errors.push({ row: rowNum, reason: `Invalid type '${type}'` });
      return;
    }
    if (amount == null || amount === '') {
      errors.push({ row: rowNum, reason: 'Missing amount' });
      return;
    }
    const amountCents = parseAmountCentsInner(String(amount));
    if (amountCents == null || amountCents < 0) {
      errors.push({ row: rowNum, reason: `Invalid amount '${amount}'` });
      return;
    }
    const categoryId = normalizeCategory(category);
    if (!categoryId) {
      errors.push({ row: rowNum, reason: `Unknown category '${category}'` });
      return;
    }

    const paidByMemberId = resolveMember(paidByName, byId, byName);
    if (!paidByMemberId) {
      errors.push({ row: rowNum, reason: `Unknown payer '${paidByName}'` });
      return;
    }

    const splitNames = membersRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const splitMemberIds = splitNames.map((n) => resolveMember(n, byId, byName)).filter(Boolean);
    if (splitMemberIds.length === 0) splitMemberIds.push(paidByMemberId);

    valid.push({
      type,
      amountCents,
      date: String(date).trim(),
      description,
      categoryId,
      paidByMemberId,
      splitMemberIds: [...new Set(splitMemberIds)],
      notes: raw['notes'] || ''
    });
  });

  return { valid, errors };
}

/** Parse a human amount into integer cents (2-decimal import format). */
function parseAmountCentsInner(raw) {
  const cleaned = String(raw).replace(/[$€£¥₹,\s]/g, '').trim();
  if (!cleaned) return null;
  const m = cleaned.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1n : 1n;
  const cents = sign * (BigInt(m[2]) * 100n + BigInt((m[3] || '').padEnd(2, '0')));
  return Number(cents);
}

function normalizeCategory(cat) {
  // Map free-text or our ids; case-insensitive with whitespace stripped.
  const key = String(cat).trim().toLowerCase().replace(/[\s&]+/g, '_').replace(/-/g, '_');
  const aliases = {
    groceries: 'groceries', grocery: 'groceries', food: 'food', 'food_&_misc': 'food',
    dining: 'dining', 'dining_&_coffee': 'dining', coffee: 'dining',
    transport: 'transport', gas: 'transport', 'transport_&_gas': 'transport',
    housing: 'housing', rent: 'housing', utilities: 'utilities', electric: 'utilities',
    health: 'health', 'health_&_fitness': 'health', insurance: 'insurance',
    entertainment: 'entertainment', shopping: 'shopping', 'personal_care': 'personal', personal: 'personal',
    kids: 'kids', education: 'education', travel: 'travel', bills: 'bills', 'bills_&_fees': 'bills',
    debt: 'debt', 'debt_&_loans': 'debt', investments: 'investments', other_expense: 'other_expense', other: 'other_expense',
    salary: 'salary', freelance: 'freelance', 'side_gig': 'freelance', 'investments_income': 'investments_income',
    gifts: 'gifts', refunds: 'refunds', 'other_income': 'other_income'
  };
  return aliases[key] || null;
}

function resolveMember(raw, byId, byName) {
  if (!raw) return null;
  const t = String(raw).trim();
  if (byId.has(t)) return t;
  return byName.get(t.toLowerCase()) || null;
}