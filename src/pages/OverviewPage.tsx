import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowDown, ArrowUp, Droplets } from 'lucide-react';
import { fDateShort, categoryEmoji, workoutEmoji, daysAgo } from '../lib/helpers';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }

const avg = (h: HealthMetric[], k: keyof HealthMetric, days = 7) => {
  const r = h.filter(x => daysAgo(x.date) <= days && x[k] != null);
  return r.length ? Math.round(r.reduce((s, x) => s + (x[k] as number), 0) / r.length * 10) / 10 : null;
};

const RACE = { date: new Date('2026-05-30'), km: 21 };
const TGT = { weight: 82, bf: 15, vf: 6, rhr: 58, hrv: 50, sleep: 75 };

export default function OverviewPage({ data, onNavigate }: Props) {
  // ── Health ──
  const health = useMemo(() => {
    const h = data.health;
    return [
      { k: 'weight_kg' as const, l: 'Weight', u: 'kg', tgt: TGT.weight, low: true },
      { k: 'body_fat_pct' as const, l: 'Body Fat', u: '%', tgt: TGT.bf, low: true },
      { k: 'visceral_fat' as const, l: 'Visceral', u: '', tgt: TGT.vf, low: true },
      { k: 'rhr' as const, l: 'RHR', u: 'bpm', tgt: TGT.rhr, low: true },
      { k: 'hrv' as const, l: 'HRV', u: 'ms', tgt: TGT.hrv, low: false },
      { k: 'sleep_score' as const, l: 'Sleep', u: '', tgt: TGT.sleep, low: false },
    ].map(m => {
      const cur = avg(h, m.k, 7);
      const gap = cur != null ? (m.low ? cur - m.tgt : m.tgt - cur) : null;
      const hit = gap != null && gap <= 0;
      let pct = 0;
      if (cur != null) pct = hit ? 100 : m.low ? Math.max(5, (m.tgt / cur) * 100) : Math.max(5, (cur / m.tgt) * 100);
      // Color based on proximity to target: green=hit, amber=close, red=far
      const proximity = pct;
      const barColor = hit ? 'var(--green)' : proximity > 80 ? 'var(--green)' : proximity > 60 ? 'var(--amber)' : 'var(--red)';
      const numColor = hit ? 'var(--green)' : proximity > 80 ? 'var(--t1)' : proximity > 60 ? 'var(--amber)' : 'var(--red)';
      return { ...m, cur, hit, pct: Math.min(100, pct), barColor, numColor };
    });
  }, [data]);

  // ── Actions (conglomerate from all modules) ──
  const actions = useMemo(() => {
    const a: { area: string; text: string; color: string }[] = [];
    const wk = data.workouts.filter(w => daysAgo(w.date) <= 7).length;
    if (wk < 3) a.push({ area: '🏃', text: `${3 - wk} more workouts`, color: 'var(--green)' });
    if (!health.find(h => h.k === 'body_fat_pct')?.hit) a.push({ area: '🍽️', text: 'Deficit ~1900 cal/day', color: 'var(--amber)' });
    if (!health.find(h => h.k === 'sleep_score')?.hit) a.push({ area: '😴', text: 'Sleep by 23:00', color: 'var(--purple)' });
    if (!health.find(h => h.k === 'hrv')?.hit) a.push({ area: '💊', text: 'Sauna + cold 3x', color: 'var(--cyan)' });

    const mo = data.transactions.filter(t => t.date.substring(0, 7) === new Date().toISOString().substring(0, 7));
    const vice = mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
    if (vice > 50) a.push({ area: '💰', text: `Cut vices (${Math.round(vice)} lei)`, color: 'var(--red)' });

    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const w = Math.ceil(d / 7);
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    a.push({ area: '🏃', text: `Long run: ${Math.round((lon + inc) * 10) / 10}km`, color: 'var(--green)' });
    return a;
  }, [data, health]);

  // ── Money ──
  const money = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(mo.reduce((s, t) => s + t.amount, 0));
    const avail = 2505, rem = avail - spent;
    const cM = data.events.filter(e => e.date >= today && e.date <= mEnd && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const free = rem - cM, daily = daysLeft > 0 ? Math.max(0, Math.round(free / daysLeft)) : 0;
    // Spending by category
    const catMap = new Map<string, number>();
    mo.forEach(t => catMap.set(t.category || 'other', (catMap.get(t.category || 'other') || 0) + t.amount));
    const cats = [...catMap.entries()].map(([n, v]) => ({ n, v: Math.round(v) })).sort((a, b) => b.v - a.v).slice(0, 5);
    // ROI split
    const pos = mo.filter(t => t.roi_flag === '+').reduce((s, t) => s + t.amount, 0);
    const neg = mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
    const neu = mo.filter(t => t.roi_flag === '0').reduce((s, t) => s + t.amount, 0);
    return { spent, avail, rem, cM, free, daily, daysLeft, cats, pos, neg, neu };
  }, [data]);

  // ── Nutrition: week + month averages ──
  const nutri = useMemo(() => {
    const calc = (days: number) => {
      const meals = data.nutrition.filter(n => daysAgo(n.date) <= days);
      const daySet = new Set(meals.map(n => n.date));
      const d = daySet.size || 1;
      return {
        cal: Math.round(meals.reduce((s, n) => s + n.calories, 0) / d),
        p: Math.round(meals.reduce((s, n) => s + n.protein_g, 0) / d),
        c: Math.round(meals.reduce((s, n) => s + n.carbs_g, 0) / d),
        f: Math.round(meals.reduce((s, n) => s + n.fat_g, 0) / d),
        w: Math.round(meals.reduce((s, n) => s + n.water_ml, 0) / d),
        days: d,
      };
    };
    return { week: calc(7), month: calc(30) };
  }, [data]);

  // ── Race plan ──
  const race = useMemo(() => {
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const w = Math.ceil(d / 7);
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    // Build weekly plan (next 4 weeks)
    const plan = Array.from({ length: 4 }, (_, i) => ({
      week: i + 1,
      longRun: Math.round((lon + inc * (i + 1)) * 10) / 10,
      easyRuns: 2,
      totalKm: Math.round((lon + inc * (i + 1) + 8) * 10) / 10, // long + 2 easy ~4km each
    }));
    return { d, w, lon, inc, pct: Math.round((lon / RACE.km) * 100), plan };
  }, [data]);

  // ── Events ──
  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today && e.date <= in7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ═══ TOP ROW: Health + Actions ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="top-row">
        {/* Health scorecards */}
        <div className="card fade" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>💊 Health — Actual vs Target</h2>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>7-day avg</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="grid-6-inner">
            {health.map(m => (
              <div key={m.k} style={{ padding: '8px 6px', textAlign: 'center', borderRadius: 8, background: m.hit ? 'var(--green-bg)' : 'transparent', border: `1px solid ${m.hit ? '#bbf7d0' : 'var(--border)'}` }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 4 }}>{m.l}</div>
                <div className="font-data" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: m.numColor }}>
                  {m.cur != null ? (m.u === 'kg' ? m.cur.toFixed(1) : Math.round(m.cur)) : '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
                  {m.low ? '↓' : '↑'} {m.tgt}{m.u}
                </div>
                <div style={{ margin: '4px auto 0', width: '80%' }}>
                  <div className="bar-track" style={{ height: 4 }}>
                    <div className="bar-fill" style={{ width: `${m.pct}%`, background: m.barColor }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions standalone module */}
        <div className="card fade d1" style={{ padding: 14, borderLeft: '3px solid var(--blue)' }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>🎯 This Week's Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {actions.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 0' }}>
                <span>{a.area}</span>
                <span style={{ flex: 1, color: 'var(--t1)' }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MONEY + NUTRITION ROW ═══ */}
      <div className="grid-2">
        {/* Money */}
        <div className="card fade d2" style={{ padding: 14 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>💰 Money <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--t3)' }}>{money.daysLeft}d left</span></h2>
          {/* Daily budget hero */}
          <div style={{ textAlign: 'center', padding: '10px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Daily Budget</div>
            <div className="font-data" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: money.daily < 50 ? 'var(--red)' : money.daily < 100 ? 'var(--amber)' : 'var(--green)' }}>
              {money.daily}<span style={{ fontSize: 14, color: 'var(--t3)' }}> lei/day</span>
            </div>
          </div>
          {/* Spent bar */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span className="font-data" style={{ fontSize: 20, fontWeight: 800 }}>{money.spent}</span>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>/ {money.avail} lei spent</span>
          </div>
          <div className="bar-track" style={{ height: 6, marginBottom: 10 }}>
            <div className="bar-fill" style={{ width: `${Math.min(100, (money.spent / money.avail) * 100)}%`, background: money.rem < 300 ? 'var(--red)' : money.rem < 800 ? 'var(--amber)' : 'var(--green)' }} />
          </div>
          {/* Categories breakdown */}
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6 }}>By Category</div>
          {money.cats.map(c => (
            <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginBottom: 4 }}>
              <span>{categoryEmoji(c.n)}</span>
              <span style={{ width: 56, color: 'var(--t2)', textTransform: 'capitalize' }}>{c.n}</span>
              <div style={{ flex: 1 }}><div className="bar-track" style={{ height: 3 }}><div className="bar-fill" style={{ width: `${(c.v / (money.cats[0]?.v || 1)) * 100}%`, background: 'var(--blue)' }} /></div></div>
              <span className="font-data" style={{ fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{c.v}</span>
            </div>
          ))}
          {/* ROI split */}
          <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 10 }}>
            <span style={{ color: 'var(--green)' }}>+ROI: {Math.round(money.pos)}</span>
            <span style={{ color: 'var(--t3)' }}>Neutral: {Math.round(money.neu)}</span>
            <span style={{ color: 'var(--red)' }}>-ROI: {Math.round(money.neg)}</span>
          </div>
          {/* Forecast */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--t2)' }}>Free after committed</span>
            <span className="font-data" style={{ fontWeight: 800, color: money.free < 0 ? 'var(--red)' : 'var(--green)' }}>{money.free} lei</span>
          </div>
        </div>

        {/* Nutrition */}
        <div className="card fade d3" style={{ padding: 14 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🍽️ Nutrition Averages</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NutriCol label="Last 7 days" d={nutri.week} />
            <NutriCol label="Last 30 days" d={nutri.month} />
          </div>
          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: nutri.week.p < 100 ? 'var(--red-bg)' : 'var(--green-bg)', fontSize: 11 }}>
            {nutri.week.p < 100
              ? <span style={{ color: 'var(--red)' }}>⚠️ Protein avg {nutri.week.p}g — target 120g. Increase by {120 - nutri.week.p}g/day</span>
              : <span style={{ color: 'var(--green)' }}>✓ Protein on track ({nutri.week.p}g avg)</span>}
          </div>
        </div>
      </div>

      {/* ═══ RACE + EVENTS ROW ═══ */}
      <div className="grid-2">
        {/* Semi-marathon plan */}
        <div className="card fade d4" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>🏃 Semi-Marathon Plan</h2>
            <div style={{ textAlign: 'right' }}>
              <span className="font-data" style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{race.d}</span>
              <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 3 }}>days</span>
            </div>
          </div>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="font-data" style={{ fontSize: 24, fontWeight: 800 }}>{race.lon}<span style={{ fontSize: 11, color: 'var(--t3)' }}>km</span></div>
            <div style={{ flex: 1 }}>
              <div className="bar-track" style={{ height: 8 }}>
                <div className="bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>{race.pct}% of {RACE.km}km</div>
            </div>
          </div>
          {/* Weekly plan */}
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6 }}>4-Week Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {race.plan.map(w => (
              <div key={w.week} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: w.week === 1 ? 'var(--green-bg)' : 'transparent', border: `1px solid ${w.week === 1 ? '#bbf7d0' : 'var(--border)'}` }}>
                <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600 }}>Week {w.week}</div>
                <div className="font-data" style={{ fontSize: 16, fontWeight: 800, color: w.week === 1 ? 'var(--green)' : 'var(--t1)', marginTop: 2 }}>{w.longRun}<span style={{ fontSize: 8, color: 'var(--t3)' }}>km</span></div>
                <div style={{ fontSize: 8, color: 'var(--t3)', marginTop: 1 }}>long run</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t2)' }}>
            → Add <span className="font-data" style={{ fontWeight: 700, color: 'var(--green)' }}>+{race.inc}km</span>/week to long run. 2 easy runs (4-5km) between.
          </div>
        </div>

        {/* Events this week */}
        <div className="card fade d5" style={{ padding: 14 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📅 This Week</h2>
          {!events.length && <div style={{ fontSize: 12, color: 'var(--t3)', padding: '10px 0' }}>Clear week ✨</div>}
          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14 }}>{categoryEmoji(e.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{e.title}</div>
              </div>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600 }}>{e.cost}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 10 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NutriCol({ label, d }: { label: string; d: { cal: number; p: number; c: number; f: number; w: number; days: number } }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div className="font-data" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: d.cal > 2200 ? 'var(--red)' : 'var(--t1)' }}>
        {d.cal}<span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 2 }}>cal/day</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        <MacroRow l="Protein" v={d.p} t={120} u="g" c={d.p >= 100 ? 'var(--green)' : 'var(--red)'} />
        <MacroRow l="Carbs" v={d.c} t={200} u="g" c="var(--blue)" />
        <MacroRow l="Fat" v={d.f} t={70} u="g" c="var(--amber)" />
        <MacroRow l="Water" v={Math.round(d.w / 1000 * 10) / 10} t={3} u="L" c="var(--cyan)" />
      </div>
    </div>
  );
}

function MacroRow({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
      <span style={{ color: 'var(--t2)' }}>{l}</span>
      <span className="font-data" style={{ fontWeight: 600 }}>{v}{u}<span style={{ color: 'var(--t3)' }}>/{t}</span></span>
    </div>
    <div className="bar-track" style={{ height: 3 }}><div className="bar-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div>
  </div>;
}
