import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowDown, ArrowUp, Droplets } from 'lucide-react';
import { fDateShort, categoryEmoji, workoutEmoji, daysAgo } from '../lib/helpers';
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
  const a = pts.slice(0, half).reduce((s, x) => s + (x[k] as number), 0) / half;
  const b = pts.slice(half).reduce((s, x) => s + (x[k] as number), 0) / (pts.length - half);
  return Math.round((b - a) * 100) / 100;
};

const RACE = { date: new Date('2026-05-30'), km: 21 };
const TGT = { weight: 82, bf: 15, vf: 6, rhr: 58, hrv: 50, sleep: 75 };

export default function OverviewPage({ data, onNavigate }: Props) {
  const health = useMemo(() => {
    const h = data.health;
    return [
      { k: 'weight_kg' as const, l: 'Weight', u: 'kg', tgt: TGT.weight, low: true, color: 'var(--cyan)', bg: 'var(--blue-bg)' },
      { k: 'body_fat_pct' as const, l: 'Body Fat', u: '%', tgt: TGT.bf, low: true, color: 'var(--amber)', bg: 'var(--amber-bg)' },
      { k: 'visceral_fat' as const, l: 'Visceral Fat', u: '', tgt: TGT.vf, low: true, color: 'var(--red)', bg: 'var(--red-bg)' },
      { k: 'rhr' as const, l: 'Resting HR', u: 'bpm', tgt: TGT.rhr, low: true, color: 'var(--red)', bg: 'var(--red-bg)' },
      { k: 'hrv' as const, l: 'HRV', u: 'ms', tgt: TGT.hrv, low: false, color: 'var(--green)', bg: 'var(--green-bg)' },
      { k: 'sleep_score' as const, l: 'Sleep Score', u: '', tgt: TGT.sleep, low: false, color: 'var(--purple)', bg: 'var(--purple-bg)' },
    ].map(m => {
      const cur = avg(h, m.k, 7), tr = trend(h, m.k);
      const gap = cur != null ? (m.low ? cur - m.tgt : m.tgt - cur) : null;
      const hit = gap != null && gap <= 0;
      let pct = 0;
      if (cur != null) pct = hit ? 100 : m.low ? Math.max(5, (m.tgt / cur) * 100) : Math.max(5, (cur / m.tgt) * 100);
      const improving = tr != null ? (m.low ? tr < 0 : tr > 0) : null;
      return { ...m, cur, tr, gap, hit, pct: Math.min(100, pct), improving };
    });
  }, [data]);

  const actions = useMemo(() => {
    const a: string[] = [];
    const wk = data.workouts.filter(w => daysAgo(w.date) <= 7).length;
    if (wk < 3) a.push(`Complete ${3 - wk} more workouts this week`);
    if (!health.find(h => h.k === 'body_fat_pct')?.hit) a.push('Stay in caloric deficit (~1900 cal/day)');
    if (!health.find(h => h.k === 'sleep_score')?.hit) a.push('Sleep by 23:00, no screens after 22:00');
    if (!health.find(h => h.k === 'hrv')?.hit) a.push('Recovery: sauna + cold plunge 3x this week');
    return a;
  }, [data, health]);

  const money = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(mo.reduce((s, t) => s + t.amount, 0));
    const avail = 2505, rem = avail - spent;
    const cM = data.events.filter(e => e.date >= today && e.date <= mEnd && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const free = rem - cM, daily = daysLeft > 0 ? Math.max(0, Math.round(free / daysLeft)) : 0;
    const vice = Math.round(mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0));
    return { spent, avail, rem, cM, free, daily, daysLeft, vice };
  }, [data]);

  const race = useMemo(() => {
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const w = Math.ceil(d / 7);
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    return { d, lon, next: Math.round((lon + inc) * 10) / 10, inc, pct: Math.round((lon / RACE.km) * 100) };
  }, [data]);

  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today && e.date <= in7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [data]);

  const fuel = useMemo(() => {
    const t = new Date().toISOString().split('T')[0], y = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    let m = data.nutrition.filter(n => n.date === t), lbl = 'Today';
    if (!m.length) { m = data.nutrition.filter(n => n.date === y); lbl = 'Yesterday'; }
    const s = (k: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'water_ml') => m.reduce((a, x) => a + x[k], 0);
    return { lbl, cal: s('calories'), p: s('protein_g'), c: s('carbs_g'), f: s('fat_g'), w: s('water_ml') };
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ═══ PAGE TITLE ═══ */}
      <div className="fade">
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, Cosmin</h1>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Here's where you stand today. 1% better every day.</p>
      </div>

      {/* ═══ HEALTH — Actual vs Target ═══ */}
      <section className="fade d1">
        <SectionHead emoji="💊" title="Health" sub="7-day average → target" />
        <div className="grid-3" style={{ marginTop: 12 }}>
          {health.map(m => (
            <div key={m.k} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => onNavigate('health')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{m.l}</span>
                {m.improving != null && (
                  <span className="tag" style={{ background: m.improving ? 'var(--green-bg)' : 'var(--red-bg)', color: m.improving ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>
                    {m.improving ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {m.improving ? 'Improving' : 'Declining'}
                  </span>
                )}
              </div>
              {/* BIG actual number */}
              <div className="font-data" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: m.hit ? 'var(--green)' : 'var(--t1)' }}>
                {m.cur != null ? (m.u === 'kg' ? m.cur.toFixed(1) : Math.round(m.cur)) : '—'}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t3)', marginLeft: 3 }}>{m.u}</span>
              </div>
              {/* Target line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                {m.low ? <ArrowDown size={12} style={{ color: m.hit ? 'var(--green)' : 'var(--t3)' }} /> : <ArrowUp size={12} style={{ color: m.hit ? 'var(--green)' : 'var(--t3)' }} />}
                <span className="font-data" style={{ fontSize: 13, color: m.hit ? 'var(--green)' : 'var(--t3)' }}>Target: {m.tgt}{m.u}</span>
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: 8 }}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${m.pct}%`, background: m.hit ? 'var(--green)' : m.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Actions */}
        {actions.length > 0 && (
          <div className="card" style={{ marginTop: 12, padding: 14, background: 'var(--blue-bg)', borderColor: '#dbeafe' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 6 }}>🎯 This week's focus</div>
            {actions.map((a, i) => <div key={i} style={{ fontSize: 13, color: 'var(--t1)', padding: '3px 0' }}>→ {a}</div>)}
          </div>
        )}
      </section>

      {/* ═══ MONEY ═══ */}
      <section className="fade d2">
        <SectionHead emoji="💰" title="Money" sub={`${money.daysLeft} days left this month`} />
        <div className="card" style={{ marginTop: 12, padding: 20 }}>
          {/* Daily Budget HERO */}
          <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Daily Budget</div>
            <div className="font-data" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: money.daily < 50 ? 'var(--red)' : money.daily < 100 ? 'var(--amber)' : 'var(--green)' }}>
              {money.daily}<span style={{ fontSize: 20, color: 'var(--t3)', marginLeft: 4 }}>lei</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 6 }}>
              {money.daily < 50 ? '⚠️ Critical — essentials only' : money.daily < 100 ? 'Tight — be mindful' : '✓ On track'}
            </div>
          </div>
          <div className="grid-2" style={{ gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase' }}>Spent</div>
              <div className="font-data" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                {money.spent}<span style={{ fontSize: 13, color: 'var(--t3)', marginLeft: 3 }}>/ {money.avail} lei</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="bar-track" style={{ height: 8 }}>
                  <div className="bar-fill" style={{ width: `${Math.min(100, (money.spent / money.avail) * 100)}%`, background: money.rem < 300 ? 'var(--red)' : money.rem < 800 ? 'var(--amber)' : 'var(--green)' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Row l="Remaining" v={`${money.rem} lei`} c={money.rem < 300 ? 'var(--red)' : 'var(--t1)'} bold />
              <Row l="Committed (month)" v={`-${money.cM} lei`} c="var(--amber)" />
              {money.vice > 50 && <Row l="Vice spending" v={`-${money.vice} lei`} c="var(--red)" />}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                <Row l="Free after all" v={`${money.free} lei`} c={money.free < 0 ? 'var(--red)' : 'var(--green)'} bold />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FUEL ═══ */}
      <section className="fade d3">
        <SectionHead emoji="🍽️" title="Nutrition" sub={fuel.lbl} />
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div className="font-data" style={{ fontSize: 28, fontWeight: 800, color: fuel.cal > 2200 ? 'var(--red)' : 'var(--t1)' }}>{fuel.cal || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>/ 2200 cal</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <Macro l="Protein" v={fuel.p} t={120} u="g" c="var(--green)" />
              <Macro l="Carbs" v={fuel.c} t={200} u="g" c="var(--blue)" />
              <Macro l="Fat" v={fuel.f} t={70} u="g" c="var(--amber)" />
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <Droplets size={16} style={{ color: 'var(--blue)', margin: '0 auto 4px' }} />
              <div className="font-data" style={{ fontSize: 16, fontWeight: 700 }}>{fuel.w ? (fuel.w / 1000).toFixed(1) : '—'}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>/ 3L</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRAINING ═══ */}
      <section className="fade d4">
        <SectionHead emoji="🏃" title="Semi-Marathon" sub={`${race.d} days to go`} />
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="font-data" style={{ fontSize: 36, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{race.d}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>days until 30 Mai</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-data" style={{ fontSize: 24, fontWeight: 800 }}>{race.lon}<span style={{ fontSize: 12, color: 'var(--t3)' }}>km</span></div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>longest run</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-data" style={{ fontSize: 24, fontWeight: 800 }}>{race.pct}<span style={{ fontSize: 12, color: 'var(--t3)' }}>%</span></div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>of 21km</div>
            </div>
          </div>
          <div className="bar-track" style={{ height: 8 }}>
            <div className="bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} />
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--green-bg)', borderRadius: 8, fontSize: 13 }}>
            → Next week target: <span className="font-data" style={{ fontWeight: 700, color: 'var(--green)' }}>{race.next}km</span>
            <span style={{ color: 'var(--t3)', marginLeft: 4 }}>(+{race.inc}km/week)</span>
          </div>
          {/* Recent workouts */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.workouts.slice(0, 4).map(w => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span>{workoutEmoji(w.type)}</span>
                <span style={{ flex: 1, textTransform: 'capitalize', color: 'var(--t2)' }}>{w.type.replace(/[_+]/g, ' ')}{w.duration_min ? ` · ${Math.round(w.duration_min)}m` : ''}{w.distance_km ? ` · ${w.distance_km}km` : ''}</span>
                {w.heart_rate_avg && <span className="font-data" style={{ color: w.heart_rate_avg > 160 ? 'var(--red)' : 'var(--green)', fontSize: 12 }}>♥{w.heart_rate_avg}</span>}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 11 }}>{fDateShort(w.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EVENTS ═══ */}
      <section className="fade d5">
        <SectionHead emoji="📅" title="This Week" sub={`${events.length} events`} />
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          {!events.length && <div style={{ fontSize: 13, color: 'var(--t3)' }}>Clear week ahead ✨</div>}
          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onNavigate('calendar')}>
              <span style={{ fontSize: 16 }}>{categoryEmoji(e.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
              </div>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600 }}>{e.cost} lei</span>}
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 11 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div>
        <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{title}</h2>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{sub}</span>
      </div>
    </div>
  );
}

function Row({ l, v, c, bold }: { l: string; v: string; c: string; bold?: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
    <span style={{ color: 'var(--t2)' }}>{l}</span>
    <span className="font-data" style={{ fontWeight: bold ? 800 : 600, color: c }}>{v}</span>
  </div>;
}

function Macro({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  return <div style={{ minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
      <span style={{ color: 'var(--t2)' }}>{l}</span>
      <span className="font-data" style={{ fontWeight: 600 }}>{v || '—'}{u}<span style={{ color: 'var(--t3)', marginLeft: 2 }}>/{t}</span></span>
    </div>
    <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div>
  </div>;
}
