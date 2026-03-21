// ═══════════════════════════════════════════════
// TradingView-Style Chart Components
// ═══════════════════════════════════════════════

export function CrosshairCursor({ points, height }: any) {
  if (!points?.length) return null;
  const x = points[0].x;
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={x} y1={0} x2={x} y2={height}
        stroke="rgba(255,255,255,0.04)" strokeWidth={20} />
    </g>
  );
}

export function FloatingTooltip({ active, payload, label, unit, color }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  if (val == null) return null;

  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${color || 'rgba(255,255,255,0.1)'}`,
      borderRadius: 12,
      padding: '8px 12px',
      boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${color || 'rgba(59,130,246,0.15)'}`,
    }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 16, color: color || '#fff' }}>
        {Number(val).toFixed(1)}
        {unit && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

export function MultiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{label}</div>
      {payload.filter((p: any) => p.value != null).map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.color }} />
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{p.name}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 13, marginLeft: 'auto' }}>
            {Number(p.value).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
