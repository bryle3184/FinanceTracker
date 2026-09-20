// @ts-check
/**
 * Colored initials avatar for a household member.
 * `member` is `{ name, color, initials }`; falls back to computed initials.
 */
export default function Avatar({ member, size = 28 }) {
  const initials = member?.initials || (member?.name || '?').slice(0, 2).toUpperCase();
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: member?.color || 'var(--color-brand)',
        fontSize: Math.max(10, size * 0.38)
      }}
      title={member?.name}
    >
      {initials}
    </span>
  );
}