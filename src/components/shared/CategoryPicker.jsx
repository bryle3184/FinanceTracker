// @ts-check
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../lib/categories.js';

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '6px'
};

const chip = (selected, color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  border: '1px solid var(--border-strong)',
  background: selected ? 'color-mix(in srgb, ' + color + ' 18%, transparent)' : 'var(--surface)',
  color: 'var(--text)',
  cursor: 'pointer',
  textAlign: 'left'
});

/**
 * Category picker. `type` switches between the expense and income catalogs;
 * both share a stable color per category id.
 */
export default function CategoryPicker({ type = 'expense', value, onChange }) {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div style={grid}>
      {list.map((c) => {
        const selected = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            style={chip(selected, c.color)}
            onClick={() => onChange(selected ? null : c.id)}
            aria-pressed={selected}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '3px',
                background: c.color,
                flex: 'none'
              }}
            />
            {c.label}
            {c.essential && <span title="Essential" style={{ color: 'var(--color-accent)' }}>•</span>}
          </button>
        );
      })}
    </div>
  );
}