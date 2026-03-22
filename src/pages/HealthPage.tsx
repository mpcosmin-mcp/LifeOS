import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { fDateShort, workoutEmoji, daysAgo } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

const TGT: Record<string, { value: number; direction: 'down' | 'up'; label: string }> = {
  weight_kg:    { value: 82,  direction: 'down', label: '82kg' },
  body_fat_pct: { value: 15,  direction: 'down', label: '15%' },
  visceral_fat: { value: 6,   direction: 'down', label: '6' },
  rhr:          { value: 58,  direction: 'down', label: '58bpm' },
  hrv:          { value: 50,  direction: 'up',   label: '50ms' },
  sleep_score:  { value: 75,  direction: 'up',   label: '75' },
};

export default function HealthPage({ data }: { data: LifeOSData }) {
  // Dynamic colors: green if on target, red if not
  const metrics = [
    { k: 'weight_kg' as const, l: 'Weight', u: 'kg', low: true },
    { k: 'body_fat_pct' as const, l: 'Body Fat', u: '%', low: true },
    { k: 'visceral_fat' as const, l: 'Visceral Fat', u: '', low: true },
    { k: 'rhr' as const, l: 'RHR', u: 'bpm', low: true },
    { k: 'hrv' as const, l: 'HRV', u: 'ms', low: false },
    { k: 'sleep_score' as const, l: 'Sleep', u: '', low: false },
  ].map(m => {
    const tgt = TGT[m.k];
    const pts = data.health.filter(h => h[m.k] != null);
    const latestVal = pts.length ? pts[pts.length - 1][m.k] as number : null;
    const hit = latestVal != null && tgt && (m.low ? latestVal <= tgt.value * 1.05 : latestVal >= tgt.value * 0.95);
    const c = hit ? 'var(--green)' : 'var(--red)';
    return { ...m, c };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>💊</span> Health
      </h2>

      {/* ── Pattern Finder + 1% Action ── */}
      <HealthDiagnosis data={data} />

      {/* ── KPI Summary Row ── */}
      <div className="panel fade" style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="health-kpi-grid">
          {metrics.map(m => {
            const pts = data.health.filter(h => h[m.k] != null);
            const latest = pts.length ? pts[pts.length - 1][m.k] as number : null;
            const tgt = TGT[m.k];
            if (!tgt || latest == null) return null;
            const hit = tgt.direction === 'down' ? latest <= tgt.value * 1.05 : latest >= tgt.value * 0.95;
            const pct = tgt.direction === 'down'
              ? Math.min(100, Math.max(5, (tgt.value / latest) * 100))
              : Math.min(100, Math.max(5, (latest / tgt.value) * 100));
            const diff = latest - tgt.value;
            const diffStr = tgt.direction === 'down'
              ? (diff > 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(m.u === 'kg' ? 1 : 0)} to go` : '✓ on target')
              : (diff < 0 ? `${Math.abs(diff).toFixed(0)} to go` : '✓ on target');

            return (
              <div key={m.k} style={{
                padding: '10px 12px', borderRadius: 8, textAlign: 'center',
                background: hit ? 'var(--green-bg)' : 'var(--surface)',
                border: `1px solid ${hit ? 'var(--green)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  {m.l}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                  <span className="font-data" style={{ fontSize: 22, fontWeight: 800, color: hit ? 'var(--green)' : 'var(--t1)' }}>
                    {m.u === 'kg' ? latest.toFixed(1) : Math.round(latest)}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--t3)' }}>{m.u}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <div className="bar-track" style={{ height: 4, marginBottom: 4 }}>
                    <div className="bar-fill" style={{ width: `${pct}%`, background: hit ? 'var(--green)' : m.c, opacity: 0.7 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8 }}>
                    <span style={{ color: 'var(--t3)' }}>Target: {tgt.label}</span>
                    <span style={{ color: hit ? 'var(--green)' : 'var(--t2)', fontWeight: 600 }}>{diffStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts with target lines ── */}
      {metrics.map((m, i) => {
        const pts = data.health.filter(h => h[m.k] != null).map(h => ({ d: fDateShort(h.date), v: h[m.k] as number }));
        if (!pts.length) return null;
        const latest = pts[pts.length - 1].v;
        const tgt = TGT[m.k];

        // Calculate Y domain to include target line
        const values = pts.map(p => p.v);
        const minV = Math.min(...values, tgt?.value ?? Infinity);
        const maxV = Math.max(...values, tgt?.value ?? -Infinity);
        const pad = (maxV - minV) * 0.15 || 5;
        const domain: [number, number] = [Math.floor(minV - pad), Math.ceil(maxV + pad)];

        return (
          <div key={m.k} className={`panel fade d${i + 1}`} style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="font-display" style={{ fontWeight: 600, fontSize: 12 }}>{m.l}</span>
                {tgt && (
                  <span style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 500 }}>
                    Target: {tgt.label} {tgt.direction === 'down' ? '↓' : '↑'}
                  </span>
                )}
              </div>
              <span className="font-data" style={{ fontSize: 14, fontWeight: 800, color: m.c }}>
                {latest.toFixed(m.u === 'kg' ? 1 : 0)}{m.u && <span style={{ fontSize: 9, color: 'var(--t3)', marginLeft: 2 }}>{m.u}</span>}
              </span>
            </div>
            <div className="chart-wrap" style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={pts}>
                  <defs><linearGradient id={`h${m.k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={m.c} stopOpacity={.2} /><stop offset="95%" stopColor={m.c} stopOpacity={0} /></linearGradient></defs>
                  <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit={m.u} color={m.c} />} isAnimationActive={false} />
                  {tgt && (
                    <ReferenceLine
                      y={tgt.value}
                      stroke="#7a9a6b"
                      strokeDasharray="6 3"
                      strokeWidth={1}
                      label={{ value: `Target ${tgt.label}`, position: 'right', fill: '#7a9a6b', fontSize: 8, fontWeight: 600 }}
                    />
                  )}
                  <Area type="monotone" dataKey="v" stroke={m.c} strokeWidth={2} fill={`url(#h${m.k})`} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'var(--t3)', fontSize: 8, fontWeight: 700 }} />
                  <YAxis domain={domain} hide />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}

      {/* ── Recent Workouts ── */}
      {data.workouts.length > 0 && (
        <div className="panel fade d7" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Recent Workouts</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.workouts.slice(0, 8).map(w => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
                <span>{workoutEmoji(w.type)}</span>
                <span style={{ flex: 1, textTransform: 'capitalize' }}>{w.type.replace(/[_+]/g, ' ')}</span>
                {w.duration_min && <span className="font-data" style={{ color: 'var(--t2)' }}>{Math.round(w.duration_min)}m</span>}
                {w.distance_km && <span className="font-data" style={{ color: 'var(--t2)' }}>{w.distance_km}km</span>}
                {w.heart_rate_avg && <span className="font-data" style={{ color: w.heart_rate_avg > 160 ? 'var(--red)' : 'var(--t2)' }}>♥{w.heart_rate_avg}</span>}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9 }}>{fDateShort(w.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HealthDiagnosis({ data }: { data: LifeOSData }) {
  const diagnosis = useMemo(() => {
    const h = data.health;
    const n = data.nutrition;
    const w = data.workouts;
    if (!h.length) return null;

    // Recent metrics (7d)
    const recent = h.filter(x => daysAgo(x.date) <= 7);
    const avgSleep = recent.filter(x => x.sleep_score).reduce((s, x) => s + (x.sleep_score || 0), 0) / (recent.filter(x => x.sleep_score).length || 1);
    const avgHrv = recent.filter(x => x.hrv).reduce((s, x) => s + (x.hrv || 0), 0) / (recent.filter(x => x.hrv).length || 1);
    const avgRhr = recent.filter(x => x.rhr).reduce((s, x) => s + (x.rhr || 0), 0) / (recent.filter(x => x.rhr).length || 1);

    // Weight trend (last 14d)
    const weights = h.filter(x => x.weight_kg && daysAgo(x.date) <= 30).map(x => x.weight_kg as number);
    const weightTrend = weights.length >= 2 ? (weights[weights.length - 1] - weights[0] < 0 ? 'down' : 'up') : 'stable';

    // Workout frequency (7d)
    const wk7 = w.filter(x => daysAgo(x.date) <= 7).length;

    // Nutrition (7d avg)
    const nutDays = new Set(n.filter(x => daysAgo(x.date) <= 7).map(x => x.date));
    const avgCal = nutDays.size > 0 ? n.filter(x => daysAgo(x.date) <= 7).reduce((s, x) => s + x.calories, 0) / nutDays.size : 0;
    const avgProt = nutDays.size > 0 ? n.filter(x => daysAgo(x.date) <= 7).reduce((s, x) => s + x.protein_g, 0) / nutDays.size : 0;

    // Patterns
    const patterns: string[] = [];
    if (avgSleep > 0 && avgSleep < 50) patterns.push(`Sleep avg ${Math.round(avgSleep)} — cronic sub target (75). Recovery compromisă.`);
    if (avgHrv > 0 && avgHrv < 40) patterns.push(`HRV avg ${Math.round(avgHrv)}ms — stres cronic. Nervos system overloaded.`);
    if (avgRhr > 0 && avgRhr > 65) patterns.push(`RHR avg ${Math.round(avgRhr)}bpm — fitness cardiovascular sub target (58).`);
    if (wk7 < 2) patterns.push(`Doar ${wk7} workout-uri în 7 zile. Sub minimum (3x/săpt).`);
    if (avgCal > 0 && avgCal < 1500) patterns.push(`Calorii avg ${Math.round(avgCal)}/zi — sub-alimentare cronică. Corpul nu poate recupera.`);
    if (avgProt > 0 && avgProt < 80) patterns.push(`Proteină avg ${Math.round(avgProt)}g/zi — sub 120g target. Muscle recovery blocked.`);
    if (weightTrend === 'down') patterns.push(`Weight trending ↓ — progres real spre 82kg target.`);

    // 1% Action
    let action = '';
    if (avgSleep > 0 && avgSleep < 50) action = 'Culcă-te la 22:00 fix. Fără telefon în pat. Somnul e foundation-ul — restul cade fără el.';
    else if (wk7 < 2) action = 'Ieși la alergare 20 min. Nu viteză, nu distanță — doar mișcare. Corpul trebuie activat.';
    else if (avgProt > 0 && avgProt < 80) action = '4 ouă + iaurt la mic dejun = 44g proteină. Cel mai simplu fix cu cel mai mare impact.';
    else if (avgRhr > 65) action = 'Cardio ușor 30 min (mers rapid, bicicletă). RHR scade cu consistență, nu intensitate.';
    else action = 'Continuă rutina. Adaugă 1km la următoarea alergare — progress prin micro-increments.';

    return { patterns, action, wk7, avgSleep, avgHrv, avgCal };
  }, [data]);

  if (!diagnosis) return null;

  return (
    <div className="panel fade d1" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span>🔍</span>
        <span className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Health Patterns</span>
      </div>
      {diagnosis.patterns.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {diagnosis.patterns.map((p, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.5, paddingLeft: 8, borderLeft: `2px solid ${p.includes('progres') || p.includes('↓') ? 'var(--green)' : 'var(--amber)'}` }}>
              {p}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 12, fontStyle: 'italic' }}>All metrics on track ✨</div>
      )}
      <div style={{ padding: 10, borderRadius: 8, background: 'var(--green-bg)', borderLeft: '4px solid var(--green)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>🎯 1% Better</div>
        <div style={{ fontSize: 11, color: 'var(--t1)', lineHeight: 1.5 }}>{diagnosis.action}</div>
      </div>
    </div>
  );
}
