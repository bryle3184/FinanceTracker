// @ts-check
/**
 * Net worth aggregation.
 */

/**
 * Chromatic series of net worth snapshots, oldest -> newest.
 * @param {import('../../types.js').NetWorthSnapshot[]} snapshots
 * @returns {Array<{monthKey:string, totalAssets:number, totalLiabilities:number, netWorth:number}>}
 */
export function netWorthSeries(snapshots) {
  return [...snapshots]
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((s) => {
      const totalAssets = s.assets.reduce((acc, a) => acc + a.valueCents, 0);
      const totalLiabilities = s.liabilities.reduce((acc, l) => acc + l.valueCents, 0);
      return {
        monthKey: s.monthKey,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities
      };
    });
}

/**
 * Asset/liability allocation for one snapshot (nonzero entries).
 * @param {import('../../types.js').NetWorthSnapshot} snapshot
 * @returns {Array<{class:string, name:string|null, valueCents:number, pct:number, kind:'asset'|'liability'}>}
 */
export function assetAllocation(snapshot) {
  const totalAssets = snapshot.assets.reduce((acc, a) => acc + a.valueCents, 0);
  const totalLiabilities = snapshot.liabilities.reduce((acc, l) => acc + l.valueCents, 0);
  const total = totalAssets + totalLiabilities || 1;
  const out = [];
  for (const a of snapshot.assets) {
    if (a.valueCents === 0) continue;
    out.push({ class: a.class, name: a.name, valueCents: a.valueCents, pct: (a.valueCents / total) * 100, kind: 'asset' });
  }
  for (const l of snapshot.liabilities) {
    if (l.valueCents === 0) continue;
    out.push({ class: l.class, name: l.name, valueCents: l.valueCents, pct: (l.valueCents / total) * 100, kind: 'liability' });
  }
  return out.sort((a, b) => b.valueCents - a.valueCents);
}