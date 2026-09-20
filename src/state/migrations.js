// @ts-check
/**
 * Named state migrations. `migrate(persistedState, version)` is wired into
 * Zustand's `persist` middleware. Map `v N -> N+1` as the schema evolves.
 */

const MIGRATIONS = {
  // 1 -> 2 example (add defaultMemberId to settings):
  // 2: (state) => ({
  //   ...state,
  //   settings: { ...state.settings, defaultMemberId: state.settings.defaultMemberId ?? null }
  // })
};

/**
 * @param {any} persisted
 * @param {number} version
 */
export const SCHEMA_VERSION = 1;

export function migrate(persisted, version) {
  let state = { ...(persisted ?? {}) };
  const base = version ?? 1;
  for (let v = base; v < SCHEMA_VERSION; v++) {
    const fn = MIGRATIONS[v];
    if (fn) state = fn(state);
  }
  return state;
}