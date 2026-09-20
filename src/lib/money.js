// @ts-check
/**
 * Money helpers — ALL amounts are integer minor units ("cents").
 * JPY uses 0 fraction digits but is still stored scaled by 100 so switching
 * currencies never corrupts stored values. No float arithmetic, ever.
 */

/** @enum {number} currency code -> fraction digits for input parsing */
export const CURRENCIES = {
  USD: { code: 'USD', label: 'US Dollar', fractionDigits: 2, symbol: '$' },
  EUR: { code: 'EUR', label: 'Euro', fractionDigits: 2, symbol: '€' },
  GBP: { code: 'GBP', label: 'British Pound', fractionDigits: 2, symbol: '£' },
  CAD: { code: 'CAD', label: 'Canadian Dollar', fractionDigits: 2, symbol: 'CA$' },
  AUD: { code: 'AUD', label: 'Australian Dollar', fractionDigits: 2, symbol: 'A$' },
  JPY: { code: 'JPY', label: 'Japanese Yen', fractionDigits: 0, symbol: '¥' },
  INR: { code: 'INR', label: 'Indian Rupee', fractionDigits: 2, symbol: '₹' }
};

export const DEFAULT_CURRENCY = 'USD';

/** @param {string} code */
export function currencyMeta(code) {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Parse a human amount string into integer cents for the given currency.
 * "12.34" (USD) -> 1234. "12345" (JPY) -> 1234500. Handles "$", ",", spaces.
 * Returns null when not parseable.
 *
 * @param {string} raw
 * @param {string} currencyCode
 * @returns {number | null}
 */
export function parseCents(raw, currencyCode) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[$€£¥₹,\s]/g, '').trim();
  if (!cleaned || !/^-?\d*([.,]\d*)?$/.test(cleaned)) return null;

  const negative = cleaned.startsWith('-');
  let abs = negative ? cleaned.slice(1) : cleaned;
  let [whole = '', frac = ''] = abs.split(/[.,]/);
  const fracLen = currencyMeta(currencyCode).fractionDigits;

  let scaled = BigInt(whole || '0') * 100n;
  if (frac) {
    // pad or truncate the fraction to 2 digits (cents)
    const padded = (frac + '0000').slice(0, 2);
    const fracValue = BigInt(padded);
    scaled += fracValue;
  }
  const cents = Number(scaled);
  return negative ? -cents : cents;
}

/**
 * Format integer cents into a display string for the currency.
 *
 * @param {number} cents
 * @param {string} currencyCode
 * @param {object} [opts]
 * @param {boolean} [opts.signed] show explicit +/-
 * @param {boolean} [opts.compact] no trailing .00 for whole amounts (display-only nicety)
 */
export function formatCents(cents, currencyCode, opts = {}) {
  if (!Number.isFinite(cents)) return '—';
  const meta = currencyMeta(currencyCode);
  const sign = opts.signed ? (cents > 0 ? '+' : cents < 0 ? '−' : '') : '';
  const abs = Math.abs(cents);
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: meta.fractionDigits,
    maximumFractionDigits: meta.fractionDigits
  });
  const base = formatter.format(abs / 100);
  return sign + base;
}

/**
 * Integer floor div (EUR rounding style for cents): rounds toward negative
 * infinity, which keeps split totals summing correctly.
 *
 * @param {number} a
 * @param {number} b
 */
export function floorDiv(a, b) {
  return Math.floor(a / b);
}

/**
 * Split amountCents across `count` shares as fairly as possible in integer
 * cents (remainder distributed to the last shares). Sum of shares === amountCents.
 *
 * @param {number} amountCents
 * @param {number} count
 * @returns {number[]}
 */
export function fairShares(amountCents, count) {
  if (!Number.isSafeInteger(amountCents) || count <= 0) return [];
  const base = floorDiv(amountCents, count);
  const rem = amountCents - base * count;
  const shares = new Array(count).fill(base);
  for (let i = 0; i < rem; i++) shares[i] += 1;
  return shares;
}

/** True when a value is an integer cents amount. */
export function isCents(n) {
  return Number.isSafeInteger(n);
}