import { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Heart, Flame, Moon, Wallet, Calendar, Zap, Droplets, Activity } from 'lucide-react';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { f, fDateShort, d, dColor, categoryEmoji, workoutEmoji, scoreColor, scoreLabel, daysAgo } from '../lib/helpers';
import { calculateLifeScore } from '../lib/scoring';
import { generateInsights } from '../lib/insights';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }

function last(h: HealthMetric[], k: keyof HealthMetric) { for (let i = h.length - 1; i >= 0; i--) if (h[i][k] != null) return h[i]; return null; }
function prev(h: HealthMetric[], k: keyof HealthMetric) { let f = false; for (let i = h.length - 1; i >= 0; i--) { if (h[i][k] != null) { if (f) return h[i]; f = true; } } return null; }

export default function OverviewPage({ data, onNavigate }: Props) {
  const ls = useMemo(() => calculateLifeScore(data.health, data.nutrition, data.transactions, data.workouts), [data]);
  const insights = useMemo(() => generateInsights(data.health, data.nutrition, data.transactions), [data]);
  const weightData = useMemo(() => data.health.filter(h => h.weight_kg).map(h => ({ d: fDateShort(h.date), v: h.weight_kg })), [data.health]);
  const sleepData = useMemo(() => data.health.filter(h => h.sleep_score).slice(-14).map(h => ({ d: fDateShort(h.date), v: h.sleep_score })), [data.health]);
  const rhrData = useMemo(() => data.health.filter(h => h.rhr).slice(-14).map(h => ({ d: fDateShort(h.date), v: h.rhr })), [data.health]);

  const fuel = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let m = data.nutrition.filter(n => n.date === today); let lbl = 'Today';
    if (!m.length) { m = data.nutrition.filter(n => n.date === yday); lbl = 'Yesterday'; }
    return { lbl, n: m.length, cal: m.reduce((s, x) => s + x.calories, 0), p: m.reduce((s, x) => s + x.protein_g, 0), c: m.reduce((s, x) => s + x.carbs_g, 0), fa: m.reduce((s, x) => s + x.fat_g, 0), w: m.reduce((s, x) => s + x.water_ml, 0) };
  }, [data.nutrition]);

  const upcoming = useMemo(() => {
    const t = new Date().toISOString().split('T')[0];
    return data.events.filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [data.events]);

  const spend = useMemo(() => {
    const l30 = data.transactions.filter(t => daysAgo(t.date) <= 30);
    const m = new Map<string, number>();
    l30.forEach(t => m.set(t.category || 'other', (m.get(t.category || 'other') || 0) + t.amount));
    const c: Record<string, string> = { food: '#00ff88', social: '#ec4899', transport: '#3b82f6', subscriptions: '#a855f7', household: '#f59e0b', health: '#facc15', other: '#475569' };
    return { cats: Array.from(m.entries()).map(([n, v]) => ({ n, v: Math.round(v), c: c[n] || '#475569' })).sort((a, b) => b.v - a.v), total: Math.round(l30.reduce((s, t) => s + t.amount, 0)) };
  }, [data.transactions]);

  const kpis = [
    { l: 'Weight', u: 'kg', c: 'var(--neon-blue)', lb: true, v: f(last(data.health, 'weight_kg')?.weight_kg ?? null), dt: d(last(data.health, 'weight_kg')?.weight_kg ?? null, prev(data.health, 'weight_kg')?.weight_kg ?? null) },
    { l: 'Body Fat', u: '%', c: 'var(--neon-orange)', lb: true, v: f(last(data.health, 'body_fat_pct')?.body_fat_pct ?? null), dt: d(last(data.health, 'body_fat_pct')?.body_fat_pct ?? null, prev(data.health, 'body_fat_pct')?.body_fat_pct ?? null) },
    { l: 'RHR', u: 'bpm', c: 'var(--neon-red)', lb: true, v: f(last(data.health, 'rhr')?.rhr ?? null, 0), dt: d(last(data.health, 'rhr')?.rhr ?? null, prev(data.health, 'rhr')?.rhr ?? null) },
    { l: 'HRV', u: 'ms', c: 'var(--neon-green)', lb: false, v: f(last(data.health, 'hrv')?.hrv ?? null, 0), dt: d(last(data.health, 'hrv')?.hrv ?? null, prev(data.health, 'hrv')?.hrv ?? null) },
    { l: 'Sleep', u: '', c: 'var(--neon-purple)', lb: false, v: f(last(data.health, 'sleep_score')?.sleep_score ?? null, 0), dt: d(last(data.health, 'sleep_score')?.sleep_score ?? null, prev(data.health, 'sleep_score')?.sleep_score ?? null) },
    { l: 'Steps', u: '', c: 'var(--neon-yellow)', lb: false, v: last(data.health, 'steps')?.steps ? `${((last(data.health, 'steps')?.steps ?? 0) / 1000).toFixed(1)}k` : '—', dt: d(last(data.health, 'steps')?.steps ?? null, prev(data.health, 'steps')?.steps ?? null) },
  ];

  const factors = [
    { k: 'activity', l: 'Activity', v: ls.activity, i: <Zap size={12} />, c: 'var(--neon-green)' },
    { k: 'nutrition', l: 'Nutrition', v: ls.nutrition, i: <Flame size={12} />, c: 'var(--neon-orange)' },
    { k: 'sleep', l: 'Sleep', v: ls.sleep, i: <Moon size={12} />, c: 'var(--neon-purple)' },
    { k: 'recovery', l: 'Recovery', v: ls.recovery, i: <Heart size={12} />, c: 'var(--neon-red)' },
    { k: 'finance', l: 'Finance', v: ls.finance, i: <Wallet size={12} />, c: 'var(--neon-blue)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Ticker ── */}
      {insights.length > 0 && (
        <div className="anim-fade" style={{ overflow: 'hidden', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="animate-ticker" style={{ display: 'flex', whiteSpace: 'nowrap', padding: '8px 0' }}>
            {[...insights, ...insights].map((ins, i) => (
              <span key={i} className="font-mono-data" style={{ display: 'inline-block', margin: '0 20px', fontSize: 10, fontWeight: 600, flexShrink: 0, color: ins.tone === 'good' ? 'var(--neon-green)' : ins.tone === 'warn' ? 'var(--neon-orange)' : 'var(--text2)' }}>
                {ins.emoji} {ins.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Life Score ── */}
      <div className="glass anim-fade" style={{ padding: 16, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor(ls.total)} strokeWidth="7"
                strokeLinecap="round" strokeDasharray={`${ls.total * 2.64} 264`}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor(ls.total)})`, transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-mono-data" style={{ fontWeight: 800, fontSize: 20 }}>{ls.total}</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Score</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 15, color: scoreColor(ls.total) }}>{scoreLabel(ls.total)}</div>
            <div className="font-mono-data" style={{ fontSize: 9, color: 'var(--text2)', marginBottom: 8 }}>Last 7 days</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {factors.map(sf => (
                <div key={sf.k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, width: 58, color: sf.c }}>
                    {sf.i}<span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{sf.l}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${sf.v}%`, background: sf.c }} /></div></div>
                  <span className="font-mono-data" style={{ fontSize: 9, fontWeight: 700, flexShrink: 0, color: sf.c }}>{sf.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {kpis.map((s, i) => (
          <div key={s.l} className={`glass trading-card anim-fade d${i + 1}`} style={{ padding: 12, position: 'relative', cursor: 'pointer' }} onClick={() => onNavigate('health')}>
            <div className="accent-strip" style={{ background: s.c }} />
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text3)', marginBottom: 4, marginTop: 2 }}>{s.l}</div>
            <div className="font-mono-data" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
              {s.v}<span style={{ fontSize: 9, color: 'var(--text2)', marginLeft: 3 }}>{s.u}</span>
            </div>
            {s.dt != null && (
              <div className="font-mono-data" style={{ fontSize: 10, marginTop: 2, color: dColor(s.dt, s.lb) }}>
                {s.dt > 0 ? '+' : ''}{s.dt.toFixed(1)}
                {s.dt !== 0 && (s.dt > 0 === !s.lb ? <TrendingUp size={9} style={{ display: 'inline', marginLeft: 2 }} /> : <TrendingDown size={9} style={{ display: 'inline', marginLeft: 2 }} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Weight + Fuel Row ── */}
      <div className="trio-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      <div className="glass anim-fade d3" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Weight Trend</span>
          <span className="chip" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--neon-blue)' }}>{weightData.length} pts</span>
        </div>
        <div className="chart-fluid" style={{ height: 160, '--chart-accent': 'rgba(59,130,246,0.4)' } as any}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}><animate attributeName="stop-opacity" values="0.25;0.1;0.25" dur="4s" repeatCount="indefinite" /></stop>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="kg" color="#3b82f6" />} isAnimationActive={false} />
              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="url(#gW)" activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
              <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontWeight: 700 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass anim-fade d4" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Flame size={14} style={{ color: 'var(--neon-orange)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Fuel</span>
          <span className="font-mono-data" style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 'auto' }}>{fuel.lbl} · {fuel.n} meals</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={fuel.cal > 2200 ? 'var(--neon-red)' : 'var(--neon-green)'} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${Math.min(100, (fuel.cal / 2200) * 100) * 2.51} 251`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-mono-data" style={{ fontWeight: 800, fontSize: 12 }}>{fuel.cal || '—'}</span>
              <span style={{ fontSize: 7, color: 'var(--text3)' }}>/ 2200</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Macro l="Protein" v={fuel.p} t={120} u="g" c="var(--neon-green)" />
            <Macro l="Carbs" v={fuel.c} t={200} u="g" c="var(--neon-blue)" />
            <Macro l="Fat" v={fuel.fa} t={70} u="g" c="var(--neon-orange)" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplets size={13} style={{ color: 'var(--neon-blue)' }} />
          <div style={{ flex: 1 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, (fuel.w / 3000) * 100)}%`, background: 'var(--neon-blue)' }} /></div></div>
          <span className="font-mono-data" style={{ fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{fuel.w ? `${(fuel.w / 1000).toFixed(1)}L` : '—'}<span style={{ color: 'var(--text3)' }}> /3L</span></span>
        </div>
      </div>

      </div>{/* end trio-grid */}

      {/* ── Mini Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Mini t="Sleep" data={sleepData} c="#a855f7" u="" i={<Moon size={12} />} />
        <Mini t="RHR" data={rhrData} c="#ff3b3b" u="bpm" i={<Heart size={12} />} />
      </div>

      {/* ── Spending + Events Row ── */}
      <div className="duo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      {/* ── Spending ── */}
      <div className="glass anim-fade d5" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet size={14} style={{ color: 'var(--neon-green)' }} />
            <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Spending</span>
          </div>
          <span className="font-mono-data" style={{ fontSize: 13, fontWeight: 800, color: spend.total > 2500 ? 'var(--neon-red)' : 'var(--text)' }}>{spend.total} lei</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {spend.cats.map(cat => (
            <div key={cat.n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{categoryEmoji(cat.n)}</span>
              <span style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'capitalize', width: 56, flexShrink: 0 }}>{cat.n}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${(cat.v / (spend.cats[0]?.v || 1)) * 100}%`, background: cat.c }} /></div></div>
              <span className="font-mono-data" style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>{cat.v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--glass-border)' }}>
          <ROI tx={data.transactions} />
        </div>
      </div>

      {/* ── Upcoming ── */}
      <div className="glass anim-fade d6" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Calendar size={14} style={{ color: 'var(--neon-purple)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Upcoming</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!upcoming.length && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Nothing upcoming</span>}
          {upcoming.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }} onClick={() => onNavigate('calendar')}>
              <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
              {e.cost > 0 && <span className="font-mono-data" style={{ color: 'var(--neon-red)', flexShrink: 0 }}>{e.cost}</span>}
              <span className="font-mono-data" style={{ color: 'var(--text3)', flexShrink: 0, fontSize: 10 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </div>

      </div>{/* end duo-grid */}

      {/* ── Workouts ── */}
      <div className="glass anim-fade d7" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Activity size={14} style={{ color: 'var(--neon-green)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Workouts</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!data.workouts.length && <span style={{ fontSize: 11, color: 'var(--text3)' }}>No workouts</span>}
          {data.workouts.slice(0, 4).map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{ flexShrink: 0 }}>{workoutEmoji(w.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{w.type.replace(/[_+]/g, ' ')}{w.duration_min ? ` · ${Math.round(w.duration_min)}m` : ''}{w.distance_km ? ` · ${w.distance_km}km` : ''}</span>
              {w.heart_rate_avg && <span className="font-mono-data" style={{ flexShrink: 0, color: w.heart_rate_avg > 160 ? 'var(--neon-red)' : 'var(--neon-green)' }}>♥{w.heart_rate_avg}</span>}
              <span className="font-mono-data" style={{ color: 'var(--text3)', flexShrink: 0, fontSize: 10 }}>{fDateShort(w.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Macro({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
        <span style={{ color: 'var(--text3)' }}>{l}</span>
        <span className="font-mono-data" style={{ fontWeight: 700, flexShrink: 0 }}>{v || '—'}{u}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div>
    </div>
  );
}

function Mini({ t, data, c, u, i }: { t: string; data: { d: string; v: number | null }[]; c: string; u: string; i: React.ReactNode }) {
  const gid = `g${t.replace(/\s/g, '')}`;
  return (
    <div className="glass anim-fade d5" style={{ padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, color: c }}>
        {i}<span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)' }}>{t}</span>
        {data.length > 0 && <span className="font-mono-data" style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 13, color: c }}>{data[data.length - 1].v}{u && <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 2 }}>{u}</span>}</span>}
      </div>
      <div className="chart-fluid" style={{ height: 60, '--chart-accent': `${c}66` } as any}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.2} /><stop offset="95%" stopColor={c} stopOpacity={0} /></linearGradient></defs>
            <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit={u} color={c} />} isAnimationActive={false} />
            <Area type="monotone" dataKey="v" stroke={c} strokeWidth={2} fill={`url(#${gid})`} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ROI({ tx }: { tx: { roi_flag: string; amount: number; date: string }[] }) {
  const l30 = tx.filter(t => daysAgo(t.date) <= 30);
  const g = { '+': 0, '0': 0, '-': 0 };
  l30.forEach(t => { g[t.roi_flag as keyof typeof g] += t.amount; });
  const tot = g['+'] + g['0'] + g['-'] || 1;
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text3)', marginBottom: 6 }}>ROI Split</div>
      <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', gap: 2 }}>
        <div style={{ width: `${(g['+'] / tot) * 100}%`, background: 'var(--neon-green)', borderRadius: 2 }} />
        <div style={{ width: `${(g['0'] / tot) * 100}%`, background: 'var(--text3)', borderRadius: 2 }} />
        <div style={{ width: `${(g['-'] / tot) * 100}%`, background: 'var(--neon-red)', borderRadius: 2 }} />
      </div>
      <div className="font-mono-data" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9 }}>
        <span style={{ color: 'var(--neon-green)' }}>+{Math.round(g['+'])}</span>
        <span style={{ color: 'var(--text3)' }}>~{Math.round(g['0'])}</span>
        <span style={{ color: 'var(--neon-red)' }}>-{Math.round(g['-'])}</span>
      </div>
    </div>
  );
}
