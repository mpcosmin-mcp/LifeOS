import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { fDateShort, workoutEmoji } from '../lib/helpers';
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
  const metrics = [
    { k: 'weight_kg' as const, l: 'Weight', u: 'kg', c: '#06b6d4' },
    { k: 'body_fat_pct' as const, l: 'Body Fat', u: '%', c: '#f59e0b' },
    { k: 'visceral_fat' as const, l: 'Visceral Fat', u: '', c: '#e879f9' },
    { k: 'rhr' as const, l: 'RHR', u: 'bpm', c: '#ff3b3b' },
    { k: 'hrv' as const, l: 'HRV', u: 'ms', c: '#00ff88' },
    { k: 'sleep_score' as const, l: 'Sleep', u: '', c: '#a855f7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>💊</span> Health
      </h2>
      {metrics.map((m, i) => {
        const pts = data.health.filter(h => h[m.k] != null).map(h => ({ d: fDateShort(h.date), v: h[m.k] as number }));
        if (!pts.length) return null;
        const latest = pts[pts.length - 1].v;
        const tgt = TGT[m.k];

        // Y domain includes target line
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
                      stroke="var(--green)"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: `Target ${tgt.label}`, position: 'right', fill: 'var(--green)', fontSize: 9, fontWeight: 600 }}
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
      {data.workouts.length > 0 && (
        <div className="panel fade d7" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Recent Workouts</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.workouts.slice(0, 8).map(w => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
                <span>{workoutEmoji(w.type)}</span>
                <span style={{ flex: 1, textTransform: 'capitalize' }}>{w.type.replace(/[_+]/g, ' ')}</span>
                {w.duration_min && <span className="font-data" style={{ color: 'var(--t2)' }}>{Math.round(w.duration_min)}m</span>}
                {w.distance_km && <span className="font-data" style={{ color: 'var(--cyan, #0891b2)' }}>{w.distance_km}km</span>}
                {w.heart_rate_avg && <span className="font-data" style={{ color: w.heart_rate_avg > 160 ? 'var(--red)' : 'var(--green)' }}>♥{w.heart_rate_avg}</span>}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9 }}>{fDateShort(w.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
