// @ts-check
/** Simple chart legend: color swatch + label + optional value. */
export default function ChartLegend({ items }) {
  return (
    <div style={{ display: 'grid', gap: '6px', marginTop: '12px' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color, flex: 'none' }} />
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.value != null && <span className="mono" style={{ fontWeight: 650 }}>{it.value}</span>}
        </div>
      ))}
    </div>
  );
}