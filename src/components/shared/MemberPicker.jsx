// @ts-check
import { useStore } from '../../state/store.js';
import Avatar from './Avatar.jsx';

const wrap = { display: 'flex', alignItems: 'center', gap: '8px' };

/**
 * Household-member picker. Lists only active members; optional "No one"
 * option for the paid-by field (e.g. joint purchases).
 */
export default function MemberPicker({ value, onChange, allowNone = false, placeholder }) {
  const members = useStore((s) => s.members);
  const active = members.filter((m) => m.isActive);
  const selected = members.find((m) => m.id === value);

  return (
    <div style={wrap}>
      <select
        className="select"
        style={{ minWidth: '150px' }}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        {allowNone && <option value="">No one</option>}
        {!allowNone && !value && <option value="">{placeholder ?? 'Select member…'}</option>}
        {active.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {selected && <Avatar member={selected} />}
    </div>
  );
}