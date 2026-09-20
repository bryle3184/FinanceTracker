// @ts-check
/**
 * Settlement engine.
 * Conventions: for each transaction the PAYER effectively covered the whole
 * amount; every participant who has a `splits` share owes their share minus
 * what they paid. Netted per member, then reduced to the fewest transfers.
 */

/**
 * Compute per-member net position over transactions in a month range.
 * Positive net = is owed money (creditor). Negative = owes.
 *
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} [fromMonthKey] 'YYYY-MM' inclusive
 * @param {string} [toMonthKey] 'YYYY-MM' inclusive
 * @returns {Map<string, number>} memberId -> netCents
 */
export function netPositions(transactions, fromMonthKey, toMonthKey) {
  const nets = new Map();
  for (const tx of transactions) {
    const mk = tx.date.slice(0, 7);
    if (fromMonthKey && mk < fromMonthKey) continue;
    if (toMonthKey && mk > toMonthKey) continue;
    const payer = tx.paidByMemberId;
    if (!payer) continue;

    // The payer fronted the full amount.
    nets.set(payer, (nets.get(payer) || 0) + tx.amountCents);

    // Everyone with a split share owes their portion.
    for (const split of tx.splits || []) {
      nets.set(split.memberId, (nets.get(split.memberId) || 0) - split.shareCents);
    }
  }
  return nets;
}

/**
 * Reduce a map of net positions to the fewest transfer instructions.
 * Greedy reducer: repeatedly match the largest creditor with the largest
 * debtor, transferring `min(owed, due)`. Terminates once every |net| < 1 unit.
 *
 * @param {Map<string, number>} positions
 * @returns {Array<{fromMemberId:string, toMemberId:string, amountCents:number}>}
 */
export function minimalSettlements(positions) {
  const creditors = [];
  const debtors = [];
  for (const [memberId, net] of positions) {
    if (Math.abs(net) < 1) continue; // epsilon / sub-unit residual
    if (net > 0) creditors.push({ memberId, net });
    else debtors.push({ memberId, net: -net });
  }
  creditors.sort((a, b) => b.net - a.net);
  debtors.sort((a, b) => b.net - a.net); // most-indebted first

  const transfers = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.net, d.net);
    // Residual below 1 unit is rounded into the creditor and we stop — avoids
    // an infinite 1-cent ping-pong.
    if (amount < 1) break;
    transfers.push({ fromMemberId: d.memberId, toMemberId: c.memberId, amountCents: amount });
    c.net -= amount;
    d.net -= amount;
    if (c.net < 1) {
      if (d.net < 1) { ci++; di++; } else ci++;
    } else if (d.net < 1) di++;
  }
  return transfers;
}

/**
 * Full settlement summary for a date-range-filtered view.
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {import('../../types.js').Member[]} members
 * @param {object} [range]
 * @param {string} [range.fromMonthKey]
 * @param {string} [range.toMonthKey]
 * @returns {{nets:Array<{memberId:string, name:string, initials:string, color:string, netCents:number}>, settlements:Array<{fromMemberId:string, toMemberId:string, amountCents:number}>}}
 */
export function computeSettlements(transactions, members, range = {}) {
  const positions = netPositions(transactions, range.fromMonthKey, range.toMonthKey);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const nets = Array.from(positions.entries())
    .filter(([, net]) => Math.abs(net) >= 1)
    .map(([memberId, netCents]) => {
      const m = memberById.get(memberId) || {};
      return {
        memberId,
        name: m.name || 'Unknown',
        initials: m.initials || '?',
        color: m.color || '#adb5bd',
        netCents
      };
    })
    .filter((n) => n.name !== 'Unknown'); // only real members participate

  const settlements = minimalSettlements(
    new Map(nets.map((n) => [n.memberId, n.netCents]))
  );
  return { nets, settlements };
}