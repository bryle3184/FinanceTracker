// @ts-check
/**
 * Date helpers — accounting dates are ISO `YYYY-MM-DD` strings end-to-end.
 * Month grouping is pure string (YYYY-MM). Date arithmetic uses UTC internally
 * and slices back to ISO so local timezone offsets never shift our grouping.
 * Use `new Date(y, m-1, d)` ONLY for calendar/display rendering.
 */

/** @param {string} iso */
export function monthKey(iso) {
  return iso.slice(0, 7);
}

/** @param {Date} d */
export function toISO(d) {
  return d.toISOString().slice(0, 10);
}

/** Today as ISO YYYY-MM-DD (in local time). */
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Add (or subtract) whole days to an ISO date, keeping string form.
 * @param {string} iso 'YYYY-MM-DD'
 * @param {number} n
 */
export function addDaysISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86400000;
  return toISO(new Date(t));
}

/** @param {string} isoA @param {string} isoB @returns {number} full days between (b - a) */
export function daysBetween(isoA, isoB) {
  const a = new Date(`${isoA}T00:00:00Z`).getTime();
  const b = new Date(`${isoB}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

/** Start-of-month ISO for a 'YYYY-MM' key, e.g. '2026-09' -> '2026-09-01'. */
export function monthStartISO(monthKeyStr) {
  return `${monthKeyStr}-01`;
}

/** Last day ISO of a month key ('2026-02' -> '2026-02-28'). */
export function monthEndISO(monthKeyStr) {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${monthKeyStr}-${String(days).padStart(2, '0')}`;
}

/** 'YYYY-MM' -> 'YYYY-MM' one month offset. */
export function addMonths(monthKeyStr, delta) {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = idx - ny * 12 + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

/** Number of months between two month keys (b - a). */
export function monthsBetween(a, b) {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by * 12 + bm) - (ay * 12 + am);
}

/**
 * Clamp a `dayOfPeriod` (1..31) into the actual days of a month key.
 * @returns {string} ISO date
 */
export function clampDayToMonth(monthKeyStr, dayOfPeriod) {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const clamped = Math.min(Math.max(dayOfPeriod, 1), maxDay);
  return `${monthKeyStr}-${String(clamped).padStart(2, '0')}`;
}

/** Human label for a month key, e.g. 'Sep 2026'. */
export function monthLabel(monthKeyStr) {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
}

/** Current month key 'YYYY-MM'. */
export function currentMonthKey() {
  return todayISO().slice(0, 7);
}

/** Ordinal-friendly short date for list rows ('Sep 12'). */
export function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Full-ish date label for reviews ('Sat, Sep 12, 2026'). */
export function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}