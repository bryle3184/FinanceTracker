// @ts-check
import { useEffect, useRef, useState } from 'react';
import { parseCents, formatCents } from '../../lib/money.js';

/**
 * Money input working in integer cents.
 *
 * - Typing is free-form; parseCents turns "12.34" (or "¥1,234") into cents.
 * - `value` is either `null` (empty/invalid) or integer cents.
 * - On blur the field re-renders back to the localized currency format.
 */
export default function AmountInput({
  value,
  onChange,
  currency,
  placeholder,
  autoFocus,
  className = 'input',
  style
}) {
  const toDisplay = (cents) =>
    cents === null || !Number.isFinite(cents)
      ? ''
      : formatCents(Math.abs(cents), currency, { compact: true });

  const [raw, setRaw] = useState(() => toDisplay(value));
  const focusedRef = useRef(false);

  // Sync internal text when the value or currency changes externally. Skip
  // while focused: every keystroke updates `value` via onChange, and re-running
  // toDisplay here would clobber in-progress typing. Blur handles reformatting.
  useEffect(() => {
    if (!focusedRef.current) setRaw(toDisplay(value));
  }, [value, currency]);

  const handleChange = (e) => {
    const text = e.target.value;
    setRaw(text);
    onChange(parseCents(text, currency));
  };

  // `value` already reflects every keystroke, so trust it on blur. Reset the
  // focus flag here too, so external value changes can re-sync the field again.
  const handleBlur = () => {
    setRaw(toDisplay(value));
    focusedRef.current = false;
  };

  return (
    <input
      className={className}
      style={style}
      inputMode="decimal"
      placeholder={placeholder ?? '0.00'}
      value={raw}
      autoFocus={autoFocus}
      onChange={handleChange}
      onFocus={() => (focusedRef.current = true)}
      onBlur={handleBlur}
      aria-label={placeholder ?? 'Amount'}
    />
  );
}