import { useMemo } from 'react';
import { ArrowDown, ArrowUp, Droplets, Check, X } from 'lucide-react';
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
const FIXED = { rent: 1000, credit: 2200, mama: 500, subs: 595, transport: 200 }; // total 4495

export default function OverviewPage({ data, onNavigate }: Props) {
  // ── Health: binary green/red ──
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

  // ── Actions: conglomerate ──
  const actions = useMemo(() => {
    const a: { icon: string; text: string }[] = [];
    const wk = data.workouts.filter(w => daysAgo(w.date) <= 7).length;
    if (wk < 3) a.push({ icon: '🏃', text: `${3 - wk} more workouts this week` });
    if (!health.find(h => h.k === 'body_fat_pct')?.hit) a.push({ icon: '🍽️', text: 'Stay under 1900 cal/day' });
    if (!health.find(h => h.k === 'sleep_score')?.hit) a.push({ icon: '😴', text: 'Sleep before 23:00' });
    if (!health.find(h => h.k === 'hrv')?.hit) a.push({ icon: '🧊', text: 'Sauna + cold plunge 3x' });
    if (!health.find(h => h.k === 'rhr')?.hit) a.push({ icon: '❤️', text: '4x cardio to lower RHR' });
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === new Date().toISOString().substring(0, 7));
    const vice = mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
    if (vice > 30) a.push({ icon: '🚫', text: `Zero vices this week (${Math.round(vice)} lei wasted)` });
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const w = Math.ceil(d / 7);
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    a.push({ icon: '🏃', text: `Long run target: ${Math.round((lon + inc) * 10) / 10}km` });
    return a;
  }, [data, health]);

  // ── Money: full income statement ──
  const money = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const mo = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(mo.reduce((s, t) => s + t.amount, 0));
    const avail = INCOME - Object.values(FIXED).reduce((s, v) => s + v, 0); // 2505
    const rem = avail - spent;
    const cM = data.events.filter(e => e.date >= today && e.date <= mEnd && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const free = rem - cM, daily = daysLeft > 0 ? Math.max(0, Math.round(free / daysLeft)) : 0;

    // Categories from transactions
    const catMap = new Map<string, number>();
    mo.forEach(t => catMap.set(t.category || 'other', (catMap.get(t.category || 'other') || 0) + t.amount));
    const cats = [...catMap.entries()].map(([n, v]) => ({ n, v: Math.round(v) })).sort((a, b) => b.v - a.v);

    // Vices
    const viceTotal = Math.round(mo.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0));
    const goodTotal = Math.round(mo.filter(t => t.roi_flag === '+').reduce((s, t) => s + t.amount, 0));

    return { spent, avail, rem, cM, free, daily, daysLeft, cats, viceTotal, goodTotal };
  }, [data]);

  // ── Nutrition: week + month with targets ──
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
        sugar: Math.round(meals.reduce((s, n) => s + (n.sugar_g || 0), 0) / d),
        w: Math.round(meals.reduce((s, n) => s + n.water_ml, 0) / d),
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
    const plan = Array.from({ length: 4 }, (_, i) => ({ wk: i + 1, km: Math.round((lon + inc * (i + 1)) * 10) / 10 }));
    return { d, lon, pct: Math.round((lon / RACE.km) * 100), inc, plan };
  }, [data]);

  // ── Events ──
  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today && e.date <= in7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ═══ ROW 1: Health + Actions ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="top-row">
        <div className="card fade" style={{ padding: 14 }}>
          <SH>💊 Health — Actual vs Target</SH>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="grid-6-inner">
            {health.map(m => (
              <div key={m.k} style={{
                padding: '10px 8px', textAlign: 'center', borderRadius: 10,
                background: m.hit ? 'var(--green-bg)' : 'var(--red-bg)',
                border: `1.5px solid ${m.hit ? '#86efac' : '#fca5a5'}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: m.hit ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  {m.hit ? <Check size={10} /> : <X size={10} />}{m.l}
                </div>
                <div className="font-data" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: m.hit ? 'var(--green)' : 'var(--red)' }}>
                  {m.cur != null ? (m.u === 'kg' ? m.cur.toFixed(1) : Math.round(m.cur)) : '—'}
                  <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 2 }}>{m.u}</span>
                </div>
                <div style={{ fontSize: 11, color: m.hit ? 'var(--green)' : 'var(--t2)', marginTop: 4 }}>
                  {m.low ? <ArrowDown size={10} style={{ display: 'inline', verticalAlign: -1 }} /> : <ArrowUp size={10} style={{ display: 'inline', verticalAlign: -1 }} />}
                  {' '}<span className="font-data">{m.tgt}{m.u}</span>
                </div>
                <div style={{ margin: '5px auto 0', width: '85%' }}>
                  <div className="bar-track" style={{ height: 4 }}>
                    <div className="bar-fill" style={{ width: `${m.pct}%`, background: m.hit ? 'var(--green)' : 'var(--red)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card fade d1" style={{ padding: 14, borderLeft: '3px solid var(--blue)' }}>
          <SH>🎯 This Week</SH>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '5px 0', borderBottom: i < actions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span>{a.icon}</span><span style={{ color: 'var(--t1)' }}>{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ROW 2: Money + Nutrition ═══ */}
      <div className="grid-2">
        {/* MONEY — Income Statement */}
        <div className="card fade d2" style={{ padding: 14 }}>
          <SH>💰 Money — Income Statement</SH>
          {/* Daily Budget HERO */}
          <div style={{ textAlign: 'center', padding: '8px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Daily Budget</div>
            <div className="font-data" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: money.daily <= 0 ? 'var(--red)' : money.daily < 80 ? 'var(--amber)' : 'var(--green)', marginTop: 4 }}>
              {money.daily}<span style={{ fontSize: 16, color: 'var(--t3)' }}> lei/day</span>
            </div>
          </div>
          {/* Income breakdown */}
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6 }}>From {INCOME} lei income</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <IRow l="🏠 Chirie" v={FIXED.rent} total={INCOME} c="var(--t2)" />
            <IRow l="💳 Rată Credit" v={FIXED.credit} total={INCOME} c="var(--t2)" />
            <IRow l="👩 Mamă" v={FIXED.mama} total={INCOME} c="var(--t2)" />
            <IRow l="📱 Subscripții" v={FIXED.subs} total={INCOME} c="var(--t2)" />
            <IRow l="🚗 Transport" v={FIXED.transport} total={INCOME} c="var(--t2)" />
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                <span>Available</span>
                <span className="font-data" style={{ color: 'var(--green)' }}>{money.avail} lei</span>
              </div>
            </div>
          </div>
          {/* Variable spending */}
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginTop: 10, marginBottom: 6 }}>Variable Spending</div>
          {money.cats.map(c => (
            <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginBottom: 3 }}>
              <span>{categoryEmoji(c.n)}</span>
              <span style={{ width: 60, color: 'var(--t2)', textTransform: 'capitalize' }}>{c.n}</span>
              <div style={{ flex: 1 }}><div className="bar-track" style={{ height: 3 }}><div className="bar-fill" style={{ width: `${(c.v / (money.cats[0]?.v || 1)) * 100}%`, background: 'var(--blue)' }} /></div></div>
              <span className="font-data" style={{ fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{c.v}</span>
            </div>
          ))}
          {/* Vices callout */}
          {money.viceTotal > 0 && (
            <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--red-bg)', border: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>🚫 Vices (alcool, țigări, junk)</span>
              <span className="font-data" style={{ fontWeight: 800, color: 'var(--red)' }}>{money.viceTotal} lei</span>
            </div>
          )}
          {/* Bottom line */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
              <span>Free after committed</span>
              <span className="font-data" style={{ color: money.free < 0 ? 'var(--red)' : 'var(--green)' }}>{money.free} lei</span>
            </div>
          </div>
        </div>

        {/* NUTRITION — Targets big */}
        <div className="card fade d3" style={{ padding: 14 }}>
          <SH>🍽️ Nutrition — Targets</SH>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <NCol label="Week Average" d={nutri.week} />
            <NCol label="Month Average" d={nutri.month} />
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: Race Plan + Events ═══ */}
      <div className="grid-2">
        <div className="card fade d4" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SH>🏃 Semi-Marathon Plan</SH>
            <div style={{ textAlign: 'right' }}>
              <span className="font-data" style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{race.d}</span>
              <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 2 }}>days</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="font-data" style={{ fontSize: 20, fontWeight: 800 }}>{race.lon}<span style={{ fontSize: 10, color: 'var(--t3)' }}>km</span></span>
            <div style={{ flex: 1 }}>
              <div className="bar-track" style={{ height: 8 }}><div className="bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} /></div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>{race.pct}% of {RACE.km}km</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {race.plan.map(w => (
              <div key={w.wk} style={{
                textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                background: w.wk === 1 ? 'var(--green-bg)' : 'var(--bg)',
                border: `1px solid ${w.wk === 1 ? '#86efac' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600 }}>Wk {w.wk}</div>
                <div className="font-data" style={{ fontSize: 16, fontWeight: 800, color: w.wk === 1 ? 'var(--green)' : 'var(--t1)', marginTop: 2 }}>{w.km}<span style={{ fontSize: 8, color: 'var(--t3)' }}>km</span></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t2)' }}>
            → <span className="font-data" style={{ fontWeight: 700, color: 'var(--green)' }}>+{race.inc}km</span>/week. 2 easy runs between long runs.
          </div>
        </div>

        <div className="card fade d5" style={{ padding: 14 }}>
          <SH>📅 This Week</SH>
          {!events.length && <div style={{ fontSize: 13, color: 'var(--t3)', padding: '12px 0' }}>Clear week ✨</div>}
          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 15 }}>{categoryEmoji(e.type)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{e.title}</span>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600 }}>{e.cost}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 11 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Components ═══ */

function SH({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{children}</h2>;
}

function IRow({ l, v, total, c }: { l: string; v: number; total: number; c: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ flex: 1, color: c }}>{l}</span>
      <div style={{ width: 60 }}><div className="bar-track" style={{ height: 2 }}><div className="bar-fill" style={{ width: `${(v / total) * 100}%`, background: 'var(--t3)' }} /></div></div>
      <span className="font-data" style={{ fontWeight: 600, minWidth: 36, textAlign: 'right', color: 'var(--t1)' }}>{v}</span>
    </div>
  );
}

// Nutrition targets
const NT = { cal: 2200, p: 120, c: 200, f: 70, sugar: 30, w: 3000 };

function NCol({ label, d }: { label: string; d: { cal: number; p: number; c: number; f: number; sugar: number; w: number } }) {
  const metrics = [
    { l: 'Calories', v: d.cal, t: NT.cal, u: '', low: true },
    { l: 'Protein', v: d.p, t: NT.p, u: 'g', low: false },
    { l: 'Carbs', v: d.c, t: NT.c, u: 'g', low: true },
    { l: 'Fat', v: d.f, t: NT.f, u: 'g', low: true },
    { l: 'Sugar', v: d.sugar, t: NT.sugar, u: 'g', low: true },
    { l: 'Water', v: Math.round(d.w / 1000 * 10) / 10, t: 3, u: 'L', low: false },
  ];
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {metrics.map(m => {
        const hit = m.low ? m.v <= m.t * 1.05 : m.v >= m.t * 0.9;
        return (
          <div key={m.l} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--t2)' }}>{m.l}</span>
              <span className="font-data" style={{ fontSize: 14, fontWeight: 800, color: hit ? 'var(--green)' : 'var(--red)' }}>
                {m.v}{m.u}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', marginLeft: 2 }}>/{m.t}</span>
              </span>
            </div>
            <div className="bar-track" style={{ height: 4 }}>
              <div className="bar-fill" style={{ width: `${Math.min(100, m.low ? Math.min(100, (m.v / m.t) * 100) : (m.v / m.t) * 100)}%`, background: hit ? 'var(--green)' : 'var(--red)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
