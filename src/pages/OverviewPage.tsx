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
      let pct = 0;
      if (cur != null) pct = hit ? 100 : m.low ? Math.max(5, (m.tgt / cur) * 100) : Math.max(5, (cur / m.tgt) * 100);
      return { ...m, cur, hit, pct: Math.min(100, pct) };
    });
  }, [data]);

  // ── Actions (orchestrator — auto from all modules) ──
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
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const w = Math.ceil(d / 7);
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    a.push({ icon: '🏃', text: `Long run: ${Math.round((lon + inc) * 10) / 10}km` });
    return a;
  }, [data, health]);

  // ── Calendar events (static — this week) ──
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

  // ── Nutrition: CURRENT (today or yesterday) ──
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

  // Nutrition color logic (exact per Cosmin's rules)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ═══ ROW 1: Health + Actions + Calendar ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }} className="row-top3">
        {/* Health */}
        <div className="card fade" style={{ padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }} className="font-display">💊 Health — Actual vs Target</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }} className="grid-6-inner">
            {health.map(m => (
              <div key={m.k} style={{
                padding: '8px 4px', textAlign: 'center', borderRadius: 8,
                background: m.hit ? 'var(--green-bg)' : 'var(--red-bg)',
                border: `1px solid ${m.hit ? '#86efac' : '#fca5a5'}`,
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: m.hit ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  {m.hit ? <Check size={8} /> : <X size={8} />}{m.l}
                </div>
                <div className="font-data" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: m.hit ? 'var(--green)' : 'var(--red)' }}>
                  {m.cur != null ? (m.u === 'kg' ? m.cur.toFixed(1) : Math.round(m.cur)) : '—'}
                  <span style={{ fontSize: 9, fontWeight: 500, marginLeft: 1 }}>{m.u}</span>
                </div>
                <div style={{ fontSize: 9, color: m.hit ? 'var(--green)' : 'var(--t3)', marginTop: 2 }}>
                  {m.low ? '↓' : '↑'} {m.tgt}{m.u}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions (orchestrator) */}
        <div className="card fade d1" style={{ padding: 12, borderLeft: '3px solid var(--blue)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }} className="font-display">🎯 Actions <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>auto-generated</span></div>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '3px 0' }}>
              <span style={{ fontSize: 11 }}>{a.icon}</span><span>{a.text}</span>
            </div>
          ))}
        </div>

        {/* Calendar (static events) */}
        <div className="card fade d2" style={{ padding: 12, borderLeft: '3px solid var(--purple)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }} className="font-display">📅 This Week <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>calendar</span></div>
          {!events.length && <div style={{ fontSize: 11, color: 'var(--t3)' }}>Clear week ✨</div>}
          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '3px 0' }}>
              <span style={{ fontSize: 12 }}>{categoryEmoji(e.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600, fontSize: 11 }}>{e.cost}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 10 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ROW 2: Marathon + Money + Nutrition ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }} className="row-bottom3">
        {/* Semi-Marathon */}
        <div className="card fade d3" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }} className="font-display">🏃 Semi-Marathon</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span className="font-data" style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{race.d}</span>
              <span style={{ fontSize: 9, color: 'var(--t3)' }}>days</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="font-data" style={{ fontSize: 16, fontWeight: 800 }}>{race.lon}<span style={{ fontSize: 9, color: 'var(--t3)' }}>km</span></span>
            <div style={{ flex: 1 }}>
              <div className="bar-track" style={{ height: 6 }}><div className="bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} /></div>
            </div>
            <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>{race.pct}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {race.plan.map(w => (
              <div key={w.wk} style={{
                textAlign: 'center', padding: '5px 2px', borderRadius: 6,
                background: w.wk === 1 ? 'var(--green-bg)' : 'var(--bg)',
                border: `1px solid ${w.wk === 1 ? '#86efac' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 8, color: 'var(--t3)' }}>Wk{w.wk}</div>
                <div className="font-data" style={{ fontSize: 14, fontWeight: 800, color: w.wk === 1 ? 'var(--green)' : 'var(--t1)' }}>{w.km}<span style={{ fontSize: 7 }}>km</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Money */}
        <div className="card fade d4" style={{ padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }} className="font-display">💰 Money <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>{money.daysLeft}d left</span></div>
          {/* Daily budget */}
          <div style={{ textAlign: 'center', padding: '6px 0 10px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase' }}>Daily Budget</div>
            <div className="font-data" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: money.daily <= 0 ? 'var(--red)' : money.daily < 80 ? 'var(--amber)' : 'var(--green)', marginTop: 2 }}>
              {money.daily}<span style={{ fontSize: 13, color: 'var(--t3)' }}> lei</span>
            </div>
          </div>
          {/* Fixed */}
          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Fixed ({FIXED_TOTAL} lei)</div>
          {FIXED_ITEMS.map(f => (
            <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '1px 0', color: 'var(--t2)' }}>
              <span>{f.l}</span><span className="font-data" style={{ fontWeight: 600, color: 'var(--t1)' }}>{f.v}</span>
            </div>
          ))}
          {/* Variable */}
          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginTop: 6, marginBottom: 4 }}>Variable ({money.spent} lei)</div>
          {money.cats.map(c => (
            <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 2 }}>
              <span style={{ fontSize: 10 }}>{categoryEmoji(c.n)}</span>
              <span style={{ width: 50, color: 'var(--t2)', textTransform: 'capitalize', fontSize: 10 }}>{c.n}</span>
              <div style={{ flex: 1 }}><div className="bar-track" style={{ height: 3 }}><div className="bar-fill" style={{ width: `${(c.v / (money.cats[0]?.v || 1)) * 100}%`, background: 'var(--blue)' }} /></div></div>
              <span className="font-data" style={{ fontWeight: 600, fontSize: 10, minWidth: 26, textAlign: 'right' }}>{c.v}</span>
            </div>
          ))}
          {money.viceTotal > 0 && (
            <div style={{ marginTop: 4, padding: '4px 8px', borderRadius: 6, background: 'var(--red-bg)', display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>🚫 Vices</span>
              <span className="font-data" style={{ fontWeight: 700, color: 'var(--red)' }}>{money.viceTotal} lei</span>
            </div>
          )}
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
            <span>Free</span>
            <span className="font-data" style={{ color: money.free < 0 ? 'var(--red)' : 'var(--green)' }}>{money.free} lei</span>
          </div>
        </div>

        {/* Nutrition — CURRENT */}
        <div className="card fade d5" style={{ padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }} className="font-display">🍽️ Nutrition <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>{nutri.lbl}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <NRow l="Calories" v={nutri.cal} t={2200} u="" c={nColor('cal', nutri.cal)} />
            <NRow l="Protein" v={nutri.p} t={120} u="g" c={nColor('p', nutri.p)} />
            <NRow l="Carbs" v={nutri.c} t={200} u="g" c={nColor('c', nutri.c)} />
            <NRow l="Fat" v={nutri.f} t={70} u="g" c={nColor('f', nutri.f)} />
            <NRow l="Sugar" v={nutri.sugar} t={30} u="g" c={nColor('sugar', nutri.sugar)} />
            <NRow l="Water" v={Math.round(nutri.w / 100) / 10} t={3} u="L" c={nColor('w', nutri.w)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NRow({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  const hit = c === 'var(--green)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 3 }}>
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
