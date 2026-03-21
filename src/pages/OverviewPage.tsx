import { useMemo } from 'react';
import { Heart, Flame, Wallet, Calendar, Droplets, Activity, ArrowRight } from 'lucide-react';
import { f, fDateShort, categoryEmoji, workoutEmoji, daysAgo } from '../lib/helpers';
import { generateInsights } from '../lib/insights';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }

const avg = (h: HealthMetric[], k: keyof HealthMetric, days = 7) => {
  const r = h.filter(x => daysAgo(x.date) <= days && x[k] != null);
  return r.length ? Math.round(r.reduce((s, x) => s + (x[k] as number), 0) / r.length * 10) / 10 : null;
};
const trend = (h: HealthMetric[], k: keyof HealthMetric) => {
  const pts = h.filter(x => x[k] != null).slice(-14);
  if (pts.length < 4) return null;
  const half = Math.floor(pts.length / 2);
  const first = pts.slice(0, half).reduce((s, x) => s + (x[k] as number), 0) / half;
  const second = pts.slice(half).reduce((s, x) => s + (x[k] as number), 0) / (pts.length - half);
  return Math.round((second - first) * 100) / 100;
};

const RACE = { date: new Date('2026-05-30'), km: 21 };
const TARGETS = { weight: 82, bf: 15, vf: 6, rhr: 58, hrv: 50, sleep: 75 };

export default function OverviewPage({ data, onNavigate }: Props) {
  const insights = useMemo(() => generateInsights(data.health, data.nutrition, data.transactions), [data]);

  const health = useMemo(() => {
    const h = data.health;
    const m = [
      { k: 'weight_kg' as const, l: 'Weight', u: 'kg', tgt: TARGETS.weight, low: true, c: 'var(--cyan)' },
      { k: 'body_fat_pct' as const, l: 'Body Fat', u: '%', tgt: TARGETS.bf, low: true, c: 'var(--amber)' },
      { k: 'visceral_fat' as const, l: 'Visceral', u: '', tgt: TARGETS.vf, low: true, c: 'var(--red)' },
      { k: 'rhr' as const, l: 'RHR', u: 'bpm', tgt: TARGETS.rhr, low: true, c: 'var(--red)' },
      { k: 'hrv' as const, l: 'HRV', u: 'ms', tgt: TARGETS.hrv, low: false, c: 'var(--green)' },
      { k: 'sleep_score' as const, l: 'Sleep', u: '', tgt: TARGETS.sleep, low: false, c: 'var(--purple)' },
    ];
    return m.map(x => {
      const cur = avg(h, x.k, 7), tr = trend(h, x.k);
      const gap = cur != null ? (x.low ? cur - x.tgt : x.tgt - cur) : null;
      const onTrack = gap != null && gap <= 0;
      const wks = gap != null && tr != null && tr !== 0 ? (x.low ? (tr < 0 ? Math.ceil(gap / Math.abs(tr)) : null) : (tr > 0 ? Math.ceil(gap / tr) : null)) : null;
      let pct = 0;
      if (cur != null) { pct = onTrack ? 100 : x.low ? Math.max(5, Math.min(95, (x.tgt / cur) * 100)) : Math.max(5, Math.min(95, (cur / x.tgt) * 100)); }
      return { ...x, cur, tr, gap, onTrack, wks, pct };
    });
  }, [data]);

  const healthActions = useMemo(() => {
    const a: string[] = [];
    const wk = data.workouts.filter(w => daysAgo(w.date) <= 7);
    if (wk.length < 3) a.push(`${3 - wk.length} more workouts this week`);
    if (!health.find(h => h.k === 'body_fat_pct')?.onTrack) a.push('Caloric deficit ~300cal/day');
    if (!health.find(h => h.k === 'rhr')?.onTrack) a.push('4x cardio sessions');
    if (!health.find(h => h.k === 'hrv')?.onTrack) a.push('Recovery: sauna + cold 3x');
    if (!health.find(h => h.k === 'sleep_score')?.onTrack) a.push('Sleep before 23:00');
    return a;
  }, [data, health]);

  const money = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const in7 = new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0];
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(mo.reduce((s, t) => s + t.amount, 0));
    const avail = 2505, rem = avail - spent;
    const c7 = data.events.filter(e => e.date >= today && e.date <= in7 && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const cM = data.events.filter(e => e.date >= today && e.date <= mEnd && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const free = rem - cM, daily = daysLeft > 0 ? Math.max(0, Math.round(free / daysLeft)) : 0;
    const vice = mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
    return { spent, avail, rem, c7, cM, free, daily, daysLeft, vice };
  }, [data]);

  const race = useMemo(() => {
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5)), w = Math.ceil(d / 7);
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const tot = runs.reduce((s, x) => s + (x.distance_km || 0), 0);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    return { d, w, tot: Math.round(tot * 10) / 10, lon, inc, next: Math.round((lon + inc) * 10) / 10, thisWeek: runs.filter(x => daysAgo(x.date) <= 7).length };
  }, [data]);

  const events = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const in7 = new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0];
    const in30 = new Date(now.getTime() + 30 * 864e5).toISOString().split('T')[0];
    const all = data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    return { week: all.filter(e => e.date <= in7), month: all.filter(e => e.date > in7 && e.date <= in30) };
  }, [data]);

  const fuel = useMemo(() => {
    const t = new Date().toISOString().split('T')[0], y = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    let m = data.nutrition.filter(n => n.date === t), lbl = 'Today';
    if (!m.length) { m = data.nutrition.filter(n => n.date === y); lbl = 'Yesterday'; }
    const s = (k: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'water_ml') => m.reduce((a, x) => a + x[k], 0);
    return { lbl, n: m.length, cal: s('calories'), p: s('protein_g'), c: s('carbs_g'), f: s('fat_g'), w: s('water_ml') };
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Ticker ── */}
      {insights.length > 0 && (
        <div className="fade" style={{ overflow: 'hidden', borderRadius: 10, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="ticker" style={{ display: 'flex', whiteSpace: 'nowrap', padding: '7px 0' }}>
            {[...insights, ...insights].map((ins, i) => (
              <span key={i} className="font-data" style={{ display: 'inline-block', margin: '0 16px', fontSize: 10, fontWeight: 600, flexShrink: 0, color: ins.tone === 'good' ? 'var(--green)' : ins.tone === 'warn' ? 'var(--amber)' : 'var(--t2)' }}>
                {ins.emoji} {ins.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ MODULE: HEALTH ═══ */}
      <Module accent="var(--cyan)" accentBg="rgba(6,182,212,0.04)" borderColor="rgba(6,182,212,0.1)" emoji="💊" title="Health" subtitle="Current → Target" onClick={() => onNavigate('health')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {health.map(m => (
            <div key={m.k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4, letterSpacing: '.03em' }}>{m.l}</div>
              <div className="font-data" style={{ fontWeight: 800, fontSize: 26, color: m.onTrack ? 'var(--green)' : 'var(--t1)', lineHeight: 1 }}>
                {m.cur != null ? (Number.isInteger(m.tgt) && m.u !== 'kg' ? Math.round(m.cur) : m.cur.toFixed(1)) : '—'}
              </div>
              <div style={{ fontSize: 10, color: m.onTrack ? 'var(--green)' : 'var(--t3)', marginTop: 3 }}>
                {m.low ? '↓' : '↑'} <span className="font-data">{m.tgt}{m.u}</span>
                {m.wks != null && m.wks > 0 && <span className="font-data" style={{ marginLeft: 4, fontSize: 8, color: 'var(--t3)' }}>~{m.wks}w</span>}
              </div>
              <div style={{ margin: '5px auto 0', width: '80%' }}>
                <div className="bar-track" style={{ height: 3 }}>
                  <div className="bar-fill" style={{ width: `${m.pct}%`, background: m.onTrack ? 'var(--green)' : m.c }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {healthActions.length > 0 && (
          <div style={{ marginTop: 12, padding: 10, background: 'rgba(6,182,212,0.03)', borderRadius: 8, border: '1px solid rgba(6,182,212,0.06)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 4 }}>This week's focus</div>
            {healthActions.map((a, i) => <div key={i} style={{ fontSize: 11, color: 'var(--t2)', padding: '2px 0' }}><span style={{ color: 'var(--cyan)' }}>→ </span>{a}</div>)}
          </div>
        )}
      </Module>

      {/* ═══ MODULE: MONEY ═══ */}
      <Module accent="var(--green)" accentBg="rgba(0,255,136,0.03)" borderColor="rgba(0,255,136,0.08)" emoji="💰" title="Money" subtitle={`${money.daysLeft} days left`} onClick={() => onNavigate('finance')}>
        <div className="grid-2" style={{ gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>SPENT THIS MONTH</div>
            <div className="font-data" style={{ fontWeight: 800, fontSize: 32, color: money.rem < 300 ? 'var(--red)' : 'var(--t1)', lineHeight: 1 }}>
              {money.spent}<span style={{ fontSize: 14, color: 'var(--t3)', marginLeft: 4 }}>/ {money.avail}</span>
            </div>
            <div style={{ margin: '8px 0' }}>
              <div className="bar-track" style={{ height: 6 }}>
                <div className="bar-fill" style={{ width: `${Math.min(100, (money.spent / money.avail) * 100)}%`, background: money.rem < 300 ? 'var(--red)' : money.rem < 800 ? 'var(--amber)' : 'var(--green)' }} />
              </div>
            </div>
            <div style={{ background: 'rgba(0,255,136,0.05)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--t2)' }}>Daily budget</span>
              <span className="font-data" style={{ fontWeight: 800, fontSize: 18, color: money.daily < 50 ? 'var(--red)' : 'var(--green)' }}>{money.daily} lei<span style={{ fontSize: 10, color: 'var(--t3)' }}>/day</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>FORECAST</div>
            <Ln l="Remaining" v={`${money.rem} lei`} c={money.rem < 300 ? 'var(--red)' : 'var(--t1)'} big />
            <Ln l="Committed (7d)" v={`-${money.c7} lei`} c="var(--amber)" />
            <Ln l="Committed (month)" v={`-${money.cM} lei`} c="var(--amber)" />
            {money.vice > 50 && <Ln l="Vice spending" v={`-${Math.round(money.vice)} lei`} c="var(--red)" />}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
              <Ln l="Free after all" v={`${money.free} lei`} c={money.free < 0 ? 'var(--red)' : 'var(--green)'} big />
            </div>
          </div>
        </div>
      </Module>

      {/* ═══ MODULE: FUEL ═══ */}
      <Module accent="var(--amber)" accentBg="rgba(245,158,11,0.03)" borderColor="rgba(245,158,11,0.08)" emoji="🍽️" title="Fuel" subtitle={`${fuel.lbl} · ${fuel.n} meals`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Ring v={fuel.cal} max={2200} c={fuel.cal > 2200 ? 'var(--red)' : 'var(--green)'} size={64} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <MacroBar l="Protein" v={fuel.p} t={120} u="g" c="var(--green)" />
            <MacroBar l="Carbs" v={fuel.c} t={200} u="g" c="var(--cyan)" />
            <MacroBar l="Fat" v={fuel.f} t={70} u="g" c="var(--amber)" />
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <Droplets size={16} style={{ color: 'var(--cyan)', margin: '0 auto 4px' }} />
            <div className="font-data" style={{ fontSize: 14, fontWeight: 800 }}>{fuel.w ? `${(fuel.w / 1000).toFixed(1)}` : '—'}</div>
            <div style={{ fontSize: 8, color: 'var(--t3)' }}>/ 3L</div>
          </div>
        </div>
      </Module>

      {/* ═══ MODULE: EVENTS ═══ */}
      <div className="grid-2" style={{ gap: 14 }}>
        <Module accent="var(--purple)" accentBg="rgba(168,85,247,0.03)" borderColor="rgba(168,85,247,0.08)" emoji="📅" title="Next 7 Days" small onClick={() => onNavigate('calendar')}>
          {!events.week.length && <span style={{ fontSize: 11, color: 'var(--t3)' }}>Clear week ✨</span>}
          {events.week.map(e => <Evt key={e.id} e={e} />)}
        </Module>
        <Module accent="var(--amber)" accentBg="rgba(245,158,11,0.02)" borderColor="rgba(245,158,11,0.06)" emoji="🗓️" title="Next Month" small onClick={() => onNavigate('calendar')}>
          {!events.month.length && <span style={{ fontSize: 11, color: 'var(--t3)' }}>Nothing planned</span>}
          {events.month.map(e => <Evt key={e.id} e={e} />)}
        </Module>
      </div>

      {/* ═══ MODULE: TRAINING ═══ */}
      <Module accent="var(--green)" accentBg="rgba(0,255,136,0.03)" borderColor="rgba(0,255,136,0.08)" emoji="🏃" title="Training" subtitle={`${race.d} days to race`}>
        <div style={{ background: 'rgba(0,255,136,0.04)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid rgba(0,255,136,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>Semi-Marathon</div>
              <div className="font-data" style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>30 Mai 2026 · {RACE.km}km</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-data" style={{ fontWeight: 800, fontSize: 28, color: 'var(--green)', lineHeight: 1 }}>{race.d}</div>
              <div style={{ fontSize: 8, color: 'var(--t3)' }}>days</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <Stat l="longest" v={`${race.lon}km`} /><Stat l="total" v={`${race.tot}km`} /><Stat l="runs/wk" v={`${race.thisWeek}`} />
          </div>
          <div className="bar-track" style={{ height: 5, marginBottom: 4 }}>
            <div className="bar-fill" style={{ width: `${Math.min(100, (race.lon / RACE.km) * 100)}%`, background: 'var(--green)' }} />
          </div>
          <div className="font-data" style={{ fontSize: 9, color: 'var(--t3)' }}>{Math.round((race.lon / RACE.km) * 100)}% of race distance</div>
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,255,136,0.06)', borderRadius: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t2)' }}><span style={{ color: 'var(--green)' }}>→</span> Next week: </span>
            <span className="font-data" style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)' }}>{race.next}km</span>
            <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 4 }}>(+{race.inc}km/week)</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {data.workouts.slice(0, 4).map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{ flexShrink: 0 }}>{workoutEmoji(w.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{w.type.replace(/[_+]/g, ' ')}{w.duration_min ? ` · ${Math.round(w.duration_min)}m` : ''}{w.distance_km ? ` · ${w.distance_km}km` : ''}</span>
              {w.heart_rate_avg && <span className="font-data" style={{ flexShrink: 0, color: w.heart_rate_avg > 160 ? 'var(--red)' : 'var(--green)' }}>♥{w.heart_rate_avg}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', flexShrink: 0, fontSize: 10 }}>{fDateShort(w.date)}</span>
            </div>
          ))}
        </div>
      </Module>
    </div>
  );
}

/* ═══ SHARED COMPONENTS ═══ */

function Module({ accent, accentBg, borderColor, emoji, title, subtitle, children, small, onClick }: {
  accent: string; accentBg: string; borderColor: string; emoji: string; title: string; subtitle?: string;
  children: React.ReactNode; small?: boolean; onClick?: () => void;
}) {
  return (
    <div className="panel fade" style={{ padding: small ? 14 : 18, borderColor, cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
      {/* Module header with accent band */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: small ? 10 : 14, paddingBottom: small ? 8 : 10, borderBottom: `1px solid ${borderColor}` }}>
        <span style={{ fontSize: small ? 18 : 22 }}>{emoji}</span>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, fontSize: small ? 14 : 16, color: accent }}>{title}</div>
          {subtitle && <div className="font-data" style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Ln({ l, v, c, big }: { l: string; v: string; c: string; big?: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: big ? 12 : 11 }}>
    <span style={{ color: 'var(--t2)' }}>{l}</span>
    <span className="font-data" style={{ fontWeight: big ? 800 : 700, color: c }}>{v}</span>
  </div>;
}

function MacroBar({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  return <div style={{ minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
      <span style={{ color: 'var(--t3)' }}>{l}</span>
      <span className="font-data" style={{ fontWeight: 700, flexShrink: 0 }}>{v || '—'}{u}<span style={{ color: 'var(--t3)', marginLeft: 2 }}>/{t}</span></span>
    </div>
    <div className="bar-track" style={{ height: 4 }}><div className="bar-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div>
  </div>;
}

function Ring({ v, max, c, size = 48 }: { v: number; max: number; c: string; size?: number }) {
  return <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.min(100, (v / max) * 100) * 2.51} 251`} />
    </svg>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span className="font-data" style={{ fontWeight: 800, fontSize: size > 56 ? 14 : 10 }}>{v || '—'}</span>
      <span style={{ fontSize: size > 56 ? 7 : 6, color: 'var(--t3)' }}>/{max}</span>
    </div>
  </div>;
}

function Stat({ l, v }: { l: string; v: string }) {
  return <div><div className="font-data" style={{ fontSize: 16, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 8, color: 'var(--t3)' }}>{l}</div></div>;
}

function Evt({ e }: { e: any }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 0' }}>
    <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
    {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', flexShrink: 0 }}>{e.cost}</span>}
    <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
  </div>;
}
