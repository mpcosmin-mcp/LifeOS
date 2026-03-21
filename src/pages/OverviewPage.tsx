import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Heart, Flame, Moon, Wallet, Calendar, Zap, Droplets, Activity, Target } from 'lucide-react';
import { f, fDateShort, d, dColor, categoryEmoji, workoutEmoji, daysAgo } from '../lib/helpers';
import { generateInsights } from '../lib/insights';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }
const L = (h: HealthMetric[], k: keyof HealthMetric) => { for (let i = h.length - 1; i >= 0; i--) if (h[i][k] != null) return h[i]; return null; };
const avg = (h: HealthMetric[], k: keyof HealthMetric, days = 7) => {
  const recent = h.filter(x => daysAgo(x.date) <= days && x[k] != null);
  if (!recent.length) return null;
  return Math.round(recent.reduce((s, x) => s + (x[k] as number), 0) / recent.length * 10) / 10;
};

// Semi-marathon target
const RACE_DATE = new Date('2026-05-30');
const RACE_KM = 21;

export default function OverviewPage({ data, onNavigate }: Props) {
  const insights = useMemo(() => generateInsights(data.health, data.nutrition, data.transactions), [data]);

  // ── Health: Current vs Target ──
  const health = useMemo(() => {
    const h = data.health;
    return [
      { l: 'Weight', u: 'kg', c: 'var(--cyan)', cur: avg(h, 'weight_kg', 7), tgt: 82, low: true },
      { l: 'Body Fat', u: '%', c: 'var(--amber)', cur: avg(h, 'body_fat_pct', 7), tgt: 15, low: true },
      { l: 'Visceral', u: '', c: 'var(--red)', cur: avg(h, 'visceral_fat', 7), tgt: 6, low: true },
      { l: 'RHR', u: 'bpm', c: 'var(--red)', cur: avg(h, 'rhr', 7), tgt: 58, low: true },
      { l: 'HRV', u: 'ms', c: 'var(--green)', cur: avg(h, 'hrv', 7), tgt: 50, low: false },
      { l: 'Sleep', u: '', c: 'var(--purple)', cur: avg(h, 'sleep_score', 7), tgt: 75, low: false },
    ];
  }, [data]);

  // ── Money: Current vs Planned ──
  const money = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in7 = new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const thisMonth = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(thisMonth.reduce((s, t) => s + t.amount, 0));

    const upcoming7 = data.events.filter(e => e.date >= today && e.date <= in7 && e.cost > 0);
    const upcomingMonth = data.events.filter(e => e.date >= today && e.date <= monthEnd && e.cost > 0);

    return {
      spent,
      available: 2505, // from MEMORY.md
      income: 7000,
      fixed: 4495,
      next7cost: upcoming7.reduce((s, e) => s + e.cost, 0),
      nextMonthCost: upcomingMonth.reduce((s, e) => s + e.cost, 0),
      next7events: upcoming7,
      pctUsed: Math.round((spent / 2505) * 100),
    };
  }, [data]);

  // ── Events: Next 7 days + Next 30 days ──
  const events = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in7 = new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0];
    const in30 = new Date(now.getTime() + 30 * 864e5).toISOString().split('T')[0];
    const all = data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    return { week: all.filter(e => e.date <= in7), month: all.filter(e => e.date > in7 && e.date <= in30) };
  }, [data]);

  // ── Workouts + Semi-marathon ──
  const workout = useMemo(() => {
    const daysUntil = Math.max(0, Math.ceil((RACE_DATE.getTime() - Date.now()) / 864e5));
    const totalKm = data.workouts.filter(w => w.type === 'running' && w.distance_km).reduce((s, w) => s + (w.distance_km || 0), 0);
    const longestRun = Math.max(0, ...data.workouts.filter(w => w.type === 'running').map(w => w.distance_km || 0));
    return { daysUntil, totalKm: Math.round(totalKm * 10) / 10, longestRun, recent: data.workouts.slice(0, 4) };
  }, [data]);

  // ── Fuel today ──
  const fuel = useMemo(() => {
    const t = new Date().toISOString().split('T')[0], y = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    let m = data.nutrition.filter(n => n.date === t), lbl = 'Today';
    if (!m.length) { m = data.nutrition.filter(n => n.date === y); lbl = 'Yesterday'; }
    const s = (k: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'water_ml') => m.reduce((a, x) => a + x[k], 0);
    return { lbl, n: m.length, cal: s('calories'), p: s('protein_g'), c: s('carbs_g'), f: s('fat_g'), w: s('water_ml') };
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Ticker ── */}
      {insights.length > 0 && (
        <div className="fade" style={{ overflow: 'hidden', borderRadius: 10, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="ticker" style={{ display: 'flex', whiteSpace: 'nowrap', padding: '7px 0' }}>
            {[...insights, ...insights].map((ins, i) => (
              <span key={i} className="font-data" style={{ display: 'inline-block', margin: '0 16px', fontSize: 9, fontWeight: 600, flexShrink: 0, color: ins.tone === 'good' ? 'var(--green)' : ins.tone === 'warn' ? 'var(--amber)' : 'var(--t2)' }}>
                {ins.emoji} {ins.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ HEALTH STATUS — Current vs Target ═══ */}
      <div className="panel fade d1" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Heart size={14} style={{ color: 'var(--cyan)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Health Status</span>
          <span className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginLeft: 'auto' }}>7-day avg vs target</span>
        </div>
        <div className="grid-kpi">
          {health.map(m => {
            const pct = m.cur != null && m.tgt ? (m.low ? Math.max(0, 100 - ((m.cur - m.tgt) / m.tgt) * 100) : Math.min(100, (m.cur / m.tgt) * 100)) : 0;
            const good = m.cur != null && (m.low ? m.cur <= m.tgt * 1.05 : m.cur >= m.tgt * 0.95);
            return (
              <div key={m.l} style={{ textAlign: 'center', padding: '8px 4px' }}>
                <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>{m.l}</div>
                <div className="font-data" style={{ fontWeight: 800, fontSize: 20, color: good ? 'var(--green)' : 'var(--t1)', lineHeight: 1 }}>
                  {m.cur != null ? (m.u === 'bpm' || m.u === 'ms' || m.u === '' ? Math.round(m.cur) : m.cur.toFixed(1)) : '—'}
                </div>
                <div className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2 }}>
                  target {m.tgt}{m.u}
                </div>
                <div style={{ margin: '4px auto 0', width: '80%' }}>
                  <div className="bar-track" style={{ height: 3 }}>
                    <div className="bar-fill" style={{ width: `${Math.min(100, Math.max(5, pct))}%`, background: good ? 'var(--green)' : m.c }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ MONEY STATUS ═══ */}
      <div className="panel fade d2" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Wallet size={14} style={{ color: 'var(--green)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Money</span>
        </div>
        <div className="grid-2">
          <div>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>This Month</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="font-data" style={{ fontWeight: 800, fontSize: 22, color: money.pctUsed > 80 ? 'var(--red)' : 'var(--t1)' }}>{money.spent}</span>
              <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>/ {money.available} lei</span>
            </div>
            <div style={{ margin: '6px 0' }}>
              <div className="bar-track" style={{ height: 4 }}>
                <div className="bar-fill" style={{ width: `${Math.min(100, money.pctUsed)}%`, background: money.pctUsed > 80 ? 'var(--red)' : money.pctUsed > 50 ? 'var(--amber)' : 'var(--green)' }} />
              </div>
            </div>
            <div className="font-data" style={{ fontSize: 9, color: 'var(--t2)' }}>{money.pctUsed}% used</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Upcoming Costs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--t2)' }}>Next 7 days</span>
                <span className="font-data" style={{ fontWeight: 700, color: money.next7cost > 0 ? 'var(--amber)' : 'var(--t3)' }}>{money.next7cost} lei</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--t2)' }}>Rest of month</span>
                <span className="font-data" style={{ fontWeight: 700, color: money.nextMonthCost > 0 ? 'var(--amber)' : 'var(--t3)' }}>{money.nextMonthCost} lei</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--t2)' }}>Remaining after</span>
                <span className="font-data" style={{ fontWeight: 800, color: (money.available - money.spent - money.nextMonthCost) > 0 ? 'var(--green)' : 'var(--red)' }}>
                  {money.available - money.spent - money.nextMonthCost} lei
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FUEL ═══ */}
      <div className="panel fade d3" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Flame size={14} style={{ color: 'var(--amber)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Fuel</span>
          <span className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginLeft: 'auto' }}>{fuel.lbl} · {fuel.n} meals</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={fuel.cal > 2200 ? 'var(--red)' : 'var(--green)'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.min(100, (fuel.cal / 2200) * 100) * 2.51} 251`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-data" style={{ fontWeight: 800, fontSize: 11 }}>{fuel.cal || '—'}</span>
              <span style={{ fontSize: 6, color: 'var(--t3)' }}>/2200</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Bar l="Protein" v={fuel.p} t={120} u="g" c="var(--green)" />
            <Bar l="Carbs" v={fuel.c} t={200} u="g" c="var(--cyan)" />
            <Bar l="Fat" v={fuel.f} t={70} u="g" c="var(--amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Droplets size={11} style={{ color: 'var(--cyan)' }} />
            <span className="font-data" style={{ fontSize: 10, fontWeight: 700 }}>{fuel.w ? `${(fuel.w / 1000).toFixed(1)}L` : '—'}<span style={{ color: 'var(--t3)' }}>/3</span></span>
          </div>
        </div>
      </div>

      {/* ═══ NEXT UP — Events ═══ */}
      <div className="grid-2">
        <div className="panel fade d4" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Calendar size={13} style={{ color: 'var(--purple)' }} />
            <span className="font-display" style={{ fontWeight: 600, fontSize: 12 }}>Next 7 Days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!events.week.length && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Clear week ahead</span>}
            {events.week.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', flexShrink: 0 }}>{e.cost}</span>}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel fade d5" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Calendar size={13} style={{ color: 'var(--amber)' }} />
            <span className="font-display" style={{ fontWeight: 600, fontSize: 12 }}>Next Month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!events.month.length && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Nothing planned</span>}
            {events.month.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', flexShrink: 0 }}>{e.cost}</span>}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ WORKOUTS + SEMI-MARATHON ═══ */}
      <div className="panel fade d6" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Activity size={14} style={{ color: 'var(--green)' }} />
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Workouts</span>
        </div>
        {/* Semi-marathon countdown */}
        <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.08)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 12, color: 'var(--green)' }}>🏃 Semi-Marathon</div>
              <div className="font-data" style={{ fontSize: 9, color: 'var(--t2)', marginTop: 2 }}>30 Mai 2026 · {RACE_KM}km</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-data" style={{ fontWeight: 800, fontSize: 22, color: 'var(--green)', lineHeight: 1 }}>{workout.daysUntil}</div>
              <div style={{ fontSize: 8, color: 'var(--t3)' }}>days left</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div>
              <div className="font-data" style={{ fontSize: 14, fontWeight: 800 }}>{workout.totalKm}<span style={{ fontSize: 9, color: 'var(--t3)' }}>km</span></div>
              <div style={{ fontSize: 8, color: 'var(--t3)' }}>total ran</div>
            </div>
            <div>
              <div className="font-data" style={{ fontSize: 14, fontWeight: 800 }}>{workout.longestRun}<span style={{ fontSize: 9, color: 'var(--t3)' }}>km</span></div>
              <div style={{ fontSize: 8, color: 'var(--t3)' }}>longest run</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="bar-track" style={{ height: 4, marginTop: 6 }}>
                <div className="bar-fill" style={{ width: `${Math.min(100, (workout.longestRun / RACE_KM) * 100)}%`, background: 'var(--green)' }} />
              </div>
              <div className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2 }}>{Math.round((workout.longestRun / RACE_KM) * 100)}% of race distance</div>
            </div>
          </div>
        </div>
        {/* Recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {workout.recent.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
              <span style={{ flexShrink: 0 }}>{workoutEmoji(w.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{w.type.replace(/[_+]/g, ' ')}{w.duration_min ? ` · ${Math.round(w.duration_min)}m` : ''}{w.distance_km ? ` · ${w.distance_km}km` : ''}</span>
              {w.heart_rate_avg && <span className="font-data" style={{ flexShrink: 0, color: w.heart_rate_avg > 160 ? 'var(--red)' : 'var(--green)' }}>♥{w.heart_rate_avg}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', flexShrink: 0, fontSize: 9 }}>{fDateShort(w.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  return <div style={{ minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginBottom: 1 }}>
      <span style={{ color: 'var(--t3)' }}>{l}</span>
      <span className="font-data" style={{ fontWeight: 700, flexShrink: 0 }}>{v || '—'}{u}</span>
    </div>
    <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div>
  </div>;
}
