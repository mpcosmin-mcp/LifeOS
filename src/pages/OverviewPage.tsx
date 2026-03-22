import { useMemo } from 'react';
import { ArrowDown, ArrowUp, Check, X, Droplets } from 'lucide-react';
import { fDateShort, categoryEmoji, daysAgo } from '../lib/helpers';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }

const avg = (h: HealthMetric[], k: keyof HealthMetric, days = 7) => {
  const r = h.filter(x => daysAgo(x.date) <= days && x[k] != null);
  return r.length ? Math.round(r.reduce((s, x) => s + (x[k] as number), 0) / r.length * 10) / 10 : null;
};

const RACE = { date: new Date('2026-05-30'), km: 21 };
const TGT = { weight: 82, bf: 15, vf: 6, rhr: 58, hrv: 50, sleep: 75 };
const INCOME = 7000;
const FIXED_ITEMS = [
  { l: '🏠 Chirie', v: 1000 }, { l: '💳 Rată Credit', v: 2200 }, { l: '👩 Mamă', v: 500 },
  { l: '📱 Subscripții', v: 595 }, { l: '🚗 Transport', v: 200 },
];
const FIXED_TOTAL = FIXED_ITEMS.reduce((s, x) => s + x.v, 0);

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
      const hit = cur != null && (m.low ? cur <= m.tgt * 1.05 : cur >= m.tgt * 0.95);
      return { ...m, cur, hit };
    });
  }, [data]);

  // ── Actions ──
  const actions = useMemo(() => {
    const a: { icon: string; text: string }[] = [];
    const wk = data.workouts.filter(w => daysAgo(w.date) <= 7).length;
    if (wk < 3) a.push({ icon: '🏃', text: `${3 - wk} more workouts` });
    if (!health.find(h => h.k === 'body_fat_pct')?.hit) a.push({ icon: '🍽️', text: 'Stay under 1900 cal' });
    if (!health.find(h => h.k === 'sleep_score')?.hit) a.push({ icon: '😴', text: 'Sleep before 23:00' });
    if (!health.find(h => h.k === 'hrv')?.hit) a.push({ icon: '🧊', text: 'Sauna + cold 3x' });
    if (!health.find(h => h.k === 'rhr')?.hit) a.push({ icon: '❤️', text: '4x cardio for RHR' });
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === new Date().toISOString().substring(0, 7));
    const vice = mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
    if (vice > 30) a.push({ icon: '🚫', text: `Zero vices (${Math.round(vice)} lei)` });
    return a;
  }, [data, health]);

  // ── Calendar ──
  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today && e.date <= in7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [data]);

  // ── Money ──
  const money = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(mo.reduce((s, t) => s + t.amount, 0));
    const avail = INCOME - FIXED_TOTAL, rem = avail - spent;
    const cM = data.events.filter(e => e.date >= today && e.date <= mEnd && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const free = rem - cM, daily = daysLeft > 0 ? Math.max(0, Math.round(free / daysLeft)) : 0;
    const catMap = new Map<string, number>();
    mo.forEach(t => catMap.set(t.category || 'other', (catMap.get(t.category || 'other') || 0) + t.amount));
    const cats = [...catMap.entries()].map(([n, v]) => ({ n, v: Math.round(v) })).sort((a, b) => b.v - a.v).slice(0, 5);
    const viceTotal = Math.round(mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0));
    return { spent, avail, rem, cM, free, daily, daysLeft, cats, viceTotal };
  }, [data]);

  // ── Nutrition ──
  const nutri = useMemo(() => {
    const t = new Date().toISOString().split('T')[0], y = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    let m = data.nutrition.filter(n => n.date === t), lbl = 'Today';
    if (!m.length) { m = data.nutrition.filter(n => n.date === y); lbl = 'Yesterday'; }
    return {
      lbl,
      cal: m.reduce((s, x) => s + x.calories, 0),
      p: m.reduce((s, x) => s + x.protein_g, 0),
      c: m.reduce((s, x) => s + x.carbs_g, 0),
      f: m.reduce((s, x) => s + x.fat_g, 0),
      sugar: m.reduce((s, x) => s + (x.sugar_g || 0), 0),
      w: m.reduce((s, x) => s + x.water_ml, 0),
    };
  }, [data]);

  const nColor = (metric: string, v: number) => {
    switch (metric) {
      case 'cal': return Math.abs(v - 2200) <= 50 ? 'var(--green)' : 'var(--red)';
      case 'p': return v >= 120 ? 'var(--green)' : 'var(--red)';
      case 'c': return v >= 200 ? 'var(--green)' : 'var(--red)';
      case 'f': return Math.abs(v - 70) <= 10 ? 'var(--green)' : 'var(--red)';
      case 'sugar': return v <= 30 ? 'var(--green)' : 'var(--red)';
      case 'w': return Math.abs(v - 3000) <= 500 ? 'var(--green)' : 'var(--red)';
      default: return 'var(--t3)';
    }
  };

  // ── Race ──
  const race = useMemo(() => {
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const w = Math.ceil(d / 7);
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    const plan = Array.from({ length: 4 }, (_, i) => ({ wk: i + 1, km: Math.round((lon + inc * (i + 1)) * 10) / 10 }));
    return { d, lon, pct: Math.round((lon / RACE.km) * 100), inc, plan };
  }, [data]);

  return (
    <div className="overview-grid">

      {/* ═══ HEALTH — Hero row, full width ═══ */}
      <section className="card fade ov-health" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }} className="font-display">💊 Health — Actual vs Target</div>
        <div className="health-grid">
          {health.map(m => (
            <div key={m.k} className="health-pill" style={{
              background: m.hit ? 'var(--green-bg)' : 'var(--red-bg)',
              border: `1px solid ${m.hit ? '#86efac33' : '#fca5a533'}`,
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: m.hit ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {m.hit ? <Check size={8} /> : <X size={8} />}{m.l}
              </div>
              <div className="font-data" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: m.hit ? 'var(--green)' : 'var(--red)' }}>
                {m.cur != null ? (m.u === 'kg' ? m.cur.toFixed(1) : Math.round(m.cur)) : '—'}
                <span style={{ fontSize: 9, fontWeight: 500, marginLeft: 1 }}>{m.u}</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)' }}>
                {m.low ? '↓' : '↑'} {m.tgt}{m.u}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ACTIONS ═══ */}
      <section className="card fade d1 ov-actions" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }} className="font-display">🎯 Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 0', color: 'var(--t1)' }}>
              <span style={{ fontSize: 12, width: 20, textAlign: 'center', flexShrink: 0 }}>{a.icon}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CALENDAR ═══ */}
      <section className="card fade d2 ov-calendar" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }} className="font-display">📅 This Week</div>
        {!events.length && <div style={{ fontSize: 11, color: 'var(--t3)' }}>Clear week ✨</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 0' }}>
              <span style={{ fontSize: 12, width: 20, textAlign: 'center', flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600, fontSize: 10 }}>{e.cost}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 10, flexShrink: 0 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MARATHON ═══ */}
      <section className="card fade d3 ov-race" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }} className="font-display">🏃 Semi-Marathon</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span className="font-data" style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{race.d}</span>
            <span style={{ fontSize: 9, color: 'var(--t3)' }}>days</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="font-data" style={{ fontSize: 18, fontWeight: 800 }}>{race.lon}<span style={{ fontSize: 9, color: 'var(--t3)' }}>km</span></span>
          <div style={{ flex: 1 }}>
            <div className="bar-track" style={{ height: 6 }}><div className="bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} /></div>
          </div>
          <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>{race.pct}%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {race.plan.map(w => (
            <div key={w.wk} style={{
              textAlign: 'center', padding: '6px 2px', borderRadius: 8,
              background: w.wk === 1 ? 'var(--green-bg)' : 'var(--bg)',
              border: `1px solid ${w.wk === 1 ? '#86efac66' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 8, color: 'var(--t3)', fontWeight: 600 }}>Wk{w.wk}</div>
              <div className="font-data" style={{ fontSize: 15, fontWeight: 800, color: w.wk === 1 ? 'var(--green)' : 'var(--t1)' }}>{w.km}<span style={{ fontSize: 7, color: 'var(--t3)' }}>km</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MONEY ═══ */}
      <section className="card fade d4 ov-money" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }} className="font-display">💰 Money</div>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>{money.daysLeft}d left</span>
        </div>

        <div className="money-body">
          {/* Col 1: Daily budget hero */}
          <div style={{ textAlign: 'center', padding: '4px 16px 4px 0', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Budget</div>
            <div className="font-data" style={{
              fontSize: 40, fontWeight: 800, lineHeight: 1.1,
              color: money.daily <= 0 ? 'var(--red)' : money.daily < 80 ? 'var(--amber)' : 'var(--green)',
            }}>
              {money.daily}<span style={{ fontSize: 14, color: 'var(--t3)' }}> lei</span>
            </div>
            {money.viceTotal > 0 && (
              <div style={{ marginTop: 8, padding: '4px 8px', borderRadius: 6, background: 'var(--red-bg)', fontSize: 10, display: 'inline-flex', gap: 4 }}>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>🚫 Vices</span>
                <span className="font-data" style={{ fontWeight: 700, color: 'var(--red)' }}>{money.viceTotal} lei</span>
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <span>Free</span>
              <span className="font-data" style={{ color: money.free < 0 ? 'var(--red)' : 'var(--green)' }}>{money.free} lei</span>
            </div>
          </div>

          {/* Col 2: Fixed */}
          <div>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Fixed ({FIXED_TOTAL} lei)</div>
            {FIXED_ITEMS.map(f => (
              <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', color: 'var(--t2)' }}>
                <span>{f.l}</span><span className="font-data" style={{ fontWeight: 600, color: 'var(--t1)' }}>{f.v}</span>
              </div>
            ))}
          </div>

          {/* Col 3: Variable */}
          <div>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Variable ({money.spent} lei)</div>
            {money.cats.map(c => (
              <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 3 }}>
                <span style={{ fontSize: 11, width: 18, textAlign: 'center', flexShrink: 0 }}>{categoryEmoji(c.n)}</span>
                <span style={{ width: 48, color: 'var(--t2)', textTransform: 'capitalize', fontSize: 10, flexShrink: 0 }}>{c.n}</span>
                <div style={{ flex: 1 }}><div className="bar-track" style={{ height: 3 }}><div className="bar-fill" style={{ width: `${(c.v / (money.cats[0]?.v || 1)) * 100}%`, background: 'var(--blue)' }} /></div></div>
                <span className="font-data" style={{ fontWeight: 600, fontSize: 10, minWidth: 30, textAlign: 'right' }}>{c.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NUTRITION ═══ */}
      <section className="card fade d5 ov-nutrition" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }} className="font-display">🍽️ Nutrition <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>{nutri.lbl}</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NRow l="Calories" v={nutri.cal} t={2200} u="" c={nColor('cal', nutri.cal)} />
          <NRow l="Protein" v={nutri.p} t={120} u="g" c={nColor('p', nutri.p)} />
          <NRow l="Carbs" v={nutri.c} t={200} u="g" c={nColor('c', nutri.c)} />
          <NRow l="Fat" v={nutri.f} t={70} u="g" c={nColor('f', nutri.f)} />
          <NRow l="Sugar" v={nutri.sugar} t={30} u="g" c={nColor('sugar', nutri.sugar)} />
          <NRow l="Water" v={Math.round(nutri.w / 100) / 10} t={3} u="L" c={nColor('w', nutri.w)} />
        </div>
      </section>
    </div>
  );
}

function NRow({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  const hit = c === 'var(--green)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {hit ? <Check size={10} style={{ color: 'var(--green)' }} /> : <X size={10} style={{ color: 'var(--red)' }} />}
          {l}
        </span>
        <span className="font-data" style={{ fontSize: 16, fontWeight: 800, color: c }}>
          {v}{u}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', marginLeft: 2 }}>/{t}</span>
        </span>
      </div>
      <div className="bar-track" style={{ height: 4 }}>
        <div className="bar-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} />
      </div>
    </div>
  );
}
