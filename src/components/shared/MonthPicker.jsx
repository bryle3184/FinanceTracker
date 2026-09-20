// @ts-check
/**
 * Month picker backed by the native <input type="month">. Value is a
 * 'YYYY-MM' month key (matches the app's string month domain exactly).
 */
export default function MonthPicker({ value, onChange, className = 'input' }) {
  return (
    <input
      type="month"
      className={className}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Month"
    />
  );
}