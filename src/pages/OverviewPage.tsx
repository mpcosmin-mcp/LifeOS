import { useMemo, useState } from 'react';
import { AlertTriangle, Zap, Shield } from 'lucide-react';
import { fDateShort, categoryEmoji, daysAgo } from '../lib/helpers';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }

const avg = (h: HealthMetric[], k: keyof HealthMetric, days = 7) => {
  const r = h.filter(x => daysAgo(x.date) <= days && x[k] != null);
  return r.length ? Math.round(r.reduce((s, x) => s + (x[k] as number), 0) / r.length * 10) / 10 : null;
};

const latest = (h: HealthMetric[], k: keyof HealthMetric) => {
  const r = [...h].reverse().find(x => x[k] != null);
  return r ? r[k] as number : null;
};

const RACE = { date: new Date('2026-05-30'), km: 21 };
const TGT = { weight: 82, bf: 15, vf: 6, rhr: 58, hrv: 50, sleep: 75 };
const INCOME = 7000;
const FIXED_TOTAL = 4479;
const CREDIT_TOTAL = 82073;
const CREDIT_MONTHLY = 2188;
const VICE_LIMIT = 125;
const BUDGET = 2505;

// ── Trend arrow logic ──
function trendArrow(current: number | null, avg7: number | null): { arrow: string; color: string; delta: string } | null {
  if (current == null || avg7 == null || avg7 === 0) return null;
  const diff = current - avg7;
  const pctDiff = Math.round((diff / avg7) * 100);
  if (Math.abs(pctDiff) < 3) return { arrow: '→', color: 'var(--t3)', delta: `${pctDiff > 0 ? '+' : ''}${pctDiff}%` };
  if (pctDiff > 0) return { arrow: '↑', color: 'var(--green)', delta: `+${pctDiff}%` };
  return { arrow: '↓', color: 'var(--red)', delta: `${pctDiff}%` };
}

function trendArrowInverted(current: number | null, avg7: number | null): { arrow: string; color: string; delta: string } | null {
  const t = trendArrow(current, avg7);
  if (!t) return null;
  // For inverted metrics (RHR, fat, vices) — going DOWN is good
  if (t.arrow === '↑') return { ...t, color: 'var(--red)' };
  if (t.arrow === '↓') return { ...t, color: 'var(--green)' };
  return t;
}

type TimeRange = 'today' | '7d' | '30d';

function RangeSelector({ value, onChange }: { value: TimeRange; onChange: (r: TimeRange) => void }) {
  return (
    <div className="ov-range-group">
      {(['today', '7d', '30d'] as const).map(r => (
        <button key={r} className={`ov-range-btn${value === r ? ' active' : ''}`} onClick={() => onChange(r)}>
          {r === 'today' ? 'Today' : r}
        </button>
      ))}
    </div>
  );
}

// ── Reusable metric bar with optional trend ──
function MetricBar({ label, value, target, unit, inverted, color, avg7, marker, markerLabel }: {
  label: string; value: number | null; target: number; unit?: string; inverted?: boolean; color?: string; avg7?: number | null; marker?: number | null; markerLabel?: string;
}) {
  const v = value ?? 0;
  const pct = Math.min(100, Math.round((v / target) * 100));
  const barColor = color ?? (inverted
    ? (v > target ? 'var(--red)' : v > target * 0.85 ? 'var(--amber)' : 'var(--green)')
    : (pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'));

  const trend = avg7 != null ? (inverted ? trendArrowInverted(value, avg7) : trendArrow(value, avg7)) : null;

  return (
    <div className="ov-metric-row">
      <span className="ov-metric-label">{label}</span>
      <span className="ov-metric-value font-data">{value != null ? Math.round(v) : '—'}</span>
      <div className="ov-metric-bar">
        <div className="ov-bar-track">
          <div className="ov-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
          {/* avg marker on the bar */}
          {(marker !== undefined ? marker : avg7) != null && (
            <div style={{
              position: 'absolute', left: `${Math.min(100, Math.round(((marker !== undefined ? marker : avg7)! / target) * 100))}%`,
              top: -2, bottom: -2, width: 2, background: 'var(--t2)', borderRadius: 1, opacity: 0.5,
              transform: 'translateX(-1px)',
            }} title={`${markerLabel ?? '7d avg'}: ${Math.round((marker !== undefined ? marker : avg7)!)}`} />
          )}
        </div>
      </div>
      <span className="ov-metric-unit font-data">/{target}{unit ?? ''}</span>
      {/* Trend indicator */}
      {trend && (
        <span className="font-data" style={{ fontSize: 9, color: trend.color, fontWeight: 700, marginLeft: 4, minWidth: 36, textAlign: 'right' }}>
          {trend.arrow}{trend.delta}
        </span>
      )}
      {!trend && avg7 == null && (
        <span style={{ minWidth: 36 }} />
      )}
    </div>
  );
}

export default function OverviewPage({ data, onNavigate }: Props) {

  // ══ STATUS BANNER — algorithmic diagnosis ══
  const diagnosis = useMemo(() => {
    const h = data.health;
    const hrv = avg(h, 'hrv', 7);
    const rhr = avg(h, 'rhr', 7);
    const sleep = avg(h, 'sleep_score', 7);

    const latestWithData = [...h].reverse().find(x => x.sleep_score != null || x.hrv != null || x.rhr != null);
    const dataAge = latestWithData ? daysAgo(latestWithData.date) : 999;
    const stale = dataAge > 2;

    let level: 'red' | 'amber' | 'green' = 'green';
    let message = '';
    let protocol: string[] = [];

    if (stale && !hrv && !sleep) {
      level = 'amber';
      message = `Date lipsă — ultimul sync: ${dataAge > 30 ? '30+' : dataAge} zile în urmă. Verifică Garmin sync.`;
      protocol = ['Sync Garmin', 'Presupune recuperare', 'Fără decizii riscante'];
    } else if ((hrv && hrv < 35) || (sleep && sleep < 50)) {
      level = 'red';
      message = 'Sistem nervos suprasolicitat. Protocol de recuperare azi.';
      protocol = ['Fără decizii financiare majore', 'Fără antrenamente intense', 'Somn înainte de 22:00', 'Hidratare 3L+'];
    } else if ((hrv && hrv < 45) || (sleep && sleep < 60) || (rhr && rhr > 65)) {
      level = 'amber';
      message = stale ? `Date vechi (${dataAge}d). Ultimele: recuperare parțială.` : 'Recuperare parțială. Zi ușoară cu focus pe basics.';
      protocol = ['Antrenament moderat OK', 'Prioritizează somnul', 'Mâncare reală, nu sandvișuri'];
    } else {
      level = 'green';
      message = stale ? `Sistem OK (date de ${dataAge}d ago). Sync Garmin pt acuratețe.` : 'Sistem în parametri. Go mode.';
      protocol = stale ? ['Sync Garmin', 'Antrenament OK', 'Zi de execuție'] : ['Antrenament intens OK', 'Zi de execuție', 'Push boundaries'];
    }

    return { level, message, protocol, hrv, rhr, sleep, dataAge, stale };
  }, [data]);

  // ══ TRIAD SCORE ══
  const triad = useMemo(() => {
    const h = data.health;
    const sleepScore = avg(h, 'sleep_score', 7);
    const hrvScore = avg(h, 'hrv', 7);
    const rhrScore = avg(h, 'rhr', 7);
    const healthPct = Math.round(
      ((sleepScore ? Math.min(100, (sleepScore / TGT.sleep) * 100) : 0) +
       (hrvScore ? Math.min(100, (hrvScore / TGT.hrv) * 100) : 0) +
       (rhrScore ? Math.min(100, (TGT.rhr / rhrScore) * 100) : 0)) / 3
    );

    const mo = new Date().toISOString().substring(0, 7);
    const moSpent = data.transactions.filter(t => t.date.substring(0, 7) === mo).reduce((s, t) => s + t.amount, 0);
    const wealthPct = Math.max(0, Math.round(((INCOME - FIXED_TOTAL - moSpent) / INCOME) * 100 * 5));

    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const weekEvents = data.events.filter(e => e.date >= today && e.date <= in7).length;
    const timePct = Math.max(0, Math.min(100, Math.round((1 - weekEvents / 10) * 100)));

    return { health: Math.min(100, healthPct), wealth: Math.min(100, wealthPct), time: timePct };
  }, [data]);

  // ══ FRICTION INSIGHTS ══
  const frictionInsights = useMemo(() => {
    const insights: string[] = [];
    const h = data.health;
    const badSleepDays = h.filter(x => x.sleep_score != null && x.sleep_score < 50);
    if (badSleepDays.length >= 2) {
      const mo = new Date().toISOString().substring(0, 7);
      const viceSpend = data.transactions.filter(t => t.date.substring(0, 7) === mo && t.category === 'vices').reduce((s, t) => s + t.amount, 0);
      if (viceSpend > 100) {
        insights.push(`Ultimele ${badSleepDays.length} nopți cu sleep sub 50 au corelat cu ${Math.round(viceSpend)} lei cheltuieli impulsive luna asta.`);
      }
    }
    const mo = new Date().toISOString().substring(0, 7);
    const viceDays = new Set(data.transactions.filter(t => t.date.substring(0, 7) === mo && t.category === 'vices').map(t => t.date));
    if (viceDays.size >= 5) {
      insights.push(`Ai avut cheltuieli vicii în ${viceDays.size} din ${new Date().getDate()} zile luna asta. Pattern activ.`);
    }
    const recentNutrition = data.nutrition.filter(n => daysAgo(n.date) <= 7);
    const nutDays = new Set(recentNutrition.map(n => n.date));
    const avgCal = nutDays.size > 0 ? recentNutrition.reduce((s, n) => s + n.calories, 0) / nutDays.size : 0;
    if (avgCal > 0 && avgCal < 1500) {
      insights.push(`Media caloriilor ultimele 7 zile: ${Math.round(avgCal)} kcal. Sub-alimentat cronic → cravings + decizii proaste.`);
    }
    return insights;
  }, [data]);

  // ══ NON-NEGOTIABLES ══
  const actions = useMemo(() => {
    const a: { icon: string; text: string; urgency: 'red' | 'amber' | 'green' }[] = [];
    const mo = new Date().toISOString().substring(0, 7);
    const moSpent = data.transactions.filter(t => t.date.substring(0, 7) === mo).reduce((s, t) => s + t.amount, 0);
    const free = INCOME - FIXED_TOTAL - moSpent;
    if (free < 0) {
      a.push({ icon: '🚨', text: `Over budget by ${Math.abs(Math.round(free))} lei — freeze spending`, urgency: 'red' });
    }
    if (diagnosis.level === 'red') {
      a.push({ icon: '🛌', text: 'Recovery day — no intense training', urgency: 'red' });
    } else {
      const wk = data.workouts.filter(w => daysAgo(w.date) <= 7).length;
      if (wk < 3) a.push({ icon: '🏃', text: `${3 - wk} workouts needed this week`, urgency: 'amber' });
    }
    const sleepAvg = avg(data.health, 'sleep_score', 3);
    if (sleepAvg && sleepAvg < 50) {
      a.push({ icon: '😴', text: 'Sleep before 22:00 tonight', urgency: 'red' });
    }
    const viceToday = data.transactions.filter(t => t.date === new Date().toISOString().split('T')[0] && t.category === 'vices');
    if (viceToday.length === 0) {
      a.push({ icon: '✅', text: 'Zero vices today — keep it clean', urgency: 'green' });
    }
    if (diagnosis.level !== 'red') {
      a.push({ icon: '🍽️', text: 'Stay under 2200 kcal, protein 125g+', urgency: 'green' });
    }
    return a.slice(0, 3);
  }, [data, diagnosis]);

  // ══ EVENTS ══
  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today && e.date <= in7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  }, [data]);

  // ══ RACE ══
  const race = useMemo(() => {
    const d = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const w = Math.ceil(d / 7);
    const runs = data.workouts.filter(x => x.type === 'running' && x.distance_km);
    const lon = Math.max(0, ...runs.map(x => x.distance_km || 0));
    const inc = w > 0 ? Math.round((RACE.km - lon) / w * 10) / 10 : 0;
    return { d, lon, pct: Math.round((lon / RACE.km) * 100), nextKm: Math.round((lon + inc) * 10) / 10 };
  }, [data]);

  // ══ HEALTH VITALS (latest + 7d avg + 30d avg) ══
  const vitals = useMemo(() => {
    const h = data.health;
    return {
      sleep: latest(h, 'sleep_score'),
      sleepAvg7: avg(h, 'sleep_score', 7),
      sleepAvg30: avg(h, 'sleep_score', 30),
      hrv: latest(h, 'hrv'),
      hrvAvg7: avg(h, 'hrv', 7),
      hrvAvg30: avg(h, 'hrv', 30),
      rhr: latest(h, 'rhr'),
      rhrAvg7: avg(h, 'rhr', 7),
      rhrAvg30: avg(h, 'rhr', 30),
      weight: latest(h, 'weight_kg'),
      weightAvg7: avg(h, 'weight_kg', 7),
      weightAvg30: avg(h, 'weight_kg', 30),
      bf: latest(h, 'body_fat_pct'),
      bfAvg7: avg(h, 'body_fat_pct', 7),
      bfAvg30: avg(h, 'body_fat_pct', 30),
      steps: latest(h, 'steps'),
      stepsAvg7: avg(h, 'steps', 7),
      stepsAvg30: avg(h, 'steps', 30),
    };
  }, [data]);

  // ══ NUTRITION TODAY + 7d avg + 30d avg ══
  const nutrition = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = data.nutrition.filter(n => n.date === today);

    const buildDayAvg = (days: number) => {
      const entries = data.nutrition.filter(n => daysAgo(n.date) <= days && n.date !== today);
      const dayMap = new Map<string, { cal: number; pro: number; fat: number; carb: number; water: number }>();
      for (const n of entries) {
        const d = dayMap.get(n.date) ?? { cal: 0, pro: 0, fat: 0, carb: 0, water: 0 };
        d.cal += n.calories; d.pro += n.protein_g; d.fat += n.fat_g; d.carb += n.carbs_g; d.water += n.water_ml;
        dayMap.set(n.date, d);
      }
      const numDays = dayMap.size || 1;
      const totals = Array.from(dayMap.values());
      const a = (fn: (d: typeof totals[0]) => number) => totals.length ? Math.round(totals.reduce((s, d) => s + fn(d), 0) / numDays) : null;
      return { cal: a(d => d.cal), pro: a(d => d.pro), fat: a(d => d.fat), carb: a(d => d.carb), water: a(d => d.water), days: dayMap.size };
    };

    const a7 = buildDayAvg(7);
    const a30 = buildDayAvg(30);

    return {
      calories: todayEntries.reduce((s, n) => s + n.calories, 0),
      protein: todayEntries.reduce((s, n) => s + n.protein_g, 0),
      fat: todayEntries.reduce((s, n) => s + n.fat_g, 0),
      carbs: todayEntries.reduce((s, n) => s + n.carbs_g, 0),
      water: todayEntries.reduce((s, n) => s + n.water_ml, 0),
      items: todayEntries.length,
      avg7cal: a7.cal, avg7pro: a7.pro, avg7fat: a7.fat, avg7carb: a7.carb, avg7water: a7.water,
      avg30cal: a30.cal, avg30pro: a30.pro, avg30fat: a30.fat, avg30carb: a30.carb, avg30water: a30.water,
      days7: a7.days, days30: a30.days,
    };
  }, [data]);

  // ══ FINANCE MTD ══
  const finance = useMemo(() => {
    const mo = new Date().toISOString().substring(0, 7);
    const moTx = data.transactions.filter(t => t.date.substring(0, 7) === mo);
    const spent = moTx.reduce((s, t) => s + t.amount, 0);
    const viceSpent = moTx.filter(t => t.category === 'vices').reduce((s, t) => s + t.amount, 0);
    return { spent: Math.round(spent), viceSpent: Math.round(viceSpent) };
  }, [data]);

  // ══ WORKOUTS THIS WEEK ══
  const weekWorkouts = useMemo(() => {
    return data.workouts.filter(w => daysAgo(w.date) <= 7);
  }, [data]);

  // ══ WEEKEND READINESS ══
  const weekendReady = useMemo(() => {
    const dow = new Date().getDay();
    if (dow === 0 || dow === 6) return null;
    const mo = new Date().toISOString().substring(0, 7);
    const moSpent = data.transactions.filter(t => t.date.substring(0, 7) === mo).reduce((s, t) => s + t.amount, 0);
    const budget = INCOME - FIXED_TOTAL;
    const remaining = budget - moSpent;
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    return { remaining: Math.round(remaining), safe: remaining > 200, daysLeft };
  }, [data]);

  const [healthRange, setHealthRange] = useState<TimeRange>('today');
  const [nutritionRange, setNutritionRange] = useState<TimeRange>('today');

  const bannerColors = {
    red: { bg: 'var(--red-bg)', border: 'var(--red)', text: 'var(--red)' },
    amber: { bg: 'var(--amber-bg)', border: 'var(--amber)', text: 'var(--amber)' },
    green: { bg: 'var(--green-bg)', border: 'var(--green)', text: 'var(--green)' },
  };
  const bc = bannerColors[diagnosis.level];

  return (
    <div className="overview-grid">

      {/* ═══ ROW 1: STATUS BANNER — full width ═══ */}
      <section className="card fade ov-banner" style={{ padding: '16px 20px', borderLeft: `4px solid ${bc.border}`, background: bc.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 0 }}>
            {diagnosis.level === 'red' ? <AlertTriangle size={18} style={{ color: bc.text, flexShrink: 0 }} /> :
             diagnosis.level === 'amber' ? <Shield size={18} style={{ color: bc.text, flexShrink: 0 }} /> :
             <Zap size={18} style={{ color: bc.text, flexShrink: 0 }} />}
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 700, color: bc.text, fontStyle: 'italic' }}>
                {diagnosis.message}
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
                HRV {diagnosis.hrv ?? '—'}ms · RHR {diagnosis.rhr ?? '—'}bpm · Sleep {diagnosis.sleep ?? '—'}
                {diagnosis.stale && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>· ⚠ {diagnosis.dataAge}d old</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[
              { label: 'Health', pct: triad.health, color: '#5c7a6f' },
              { label: 'Wealth', pct: triad.wealth, color: '#8b7355' },
              { label: 'Time', pct: triad.time, color: '#6b6e8a' },
            ].map(t => (
              <div key={t.label} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 42, height: 42 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg3)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={t.color} strokeWidth="3"
                      strokeDasharray={`${t.pct} ${100 - t.pct}`} strokeLinecap="round" opacity="0.7" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-data" style={{ fontSize: 12, fontWeight: 800, color: t.color }}>{t.pct}</span>
                  </div>
                </div>
                <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {diagnosis.protocol.map((p, i) => (
            <span key={i} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.6)', color: 'var(--t2)', fontWeight: 500 }}>
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ ROW 2 COL 1: Health Vitals ═══ */}
      <section className="card fade d1 ov-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="font-display ov-card-title" style={{ marginBottom: 0 }}>❤️ Health Vitals</div>
          <RangeSelector value={healthRange} onChange={setHealthRange} />
        </div>
        <div style={{ fontSize: 9, color: 'var(--t4)', marginBottom: 6 }}>
          {healthRange === 'today' ? 'Latest value' : healthRange === '7d' ? '7-day avg' : '30-day avg'}
          {healthRange !== '30d' && <> · <span style={{ borderBottom: '2px solid var(--t2)', opacity: 0.5 }}>|</span> = {healthRange === 'today' ? '7d' : '30d'} avg · arrow = trend</>}
        </div>
        {([
          { label: 'Sleep', target: 85, v: vitals.sleep, a7: vitals.sleepAvg7, a30: vitals.sleepAvg30 },
          { label: 'HRV', target: 40, unit: 'ms', v: vitals.hrv, a7: vitals.hrvAvg7, a30: vitals.hrvAvg30 },
          { label: 'RHR', target: 65, unit: 'bpm', inverted: true, v: vitals.rhr, a7: vitals.rhrAvg7, a30: vitals.rhrAvg30 },
          { label: 'Weight', target: 85, unit: 'kg', color: 'var(--blue)', v: vitals.weight, a7: vitals.weightAvg7, a30: vitals.weightAvg30 },
          { label: 'BF%', target: 15, unit: '%', inverted: true, v: vitals.bf, a7: vitals.bfAvg7, a30: vitals.bfAvg30 },
          { label: 'Steps', target: 10000, v: vitals.steps, a7: vitals.stepsAvg7, a30: vitals.stepsAvg30 },
        ] as { label: string; target: number; unit?: string; inverted?: boolean; color?: string; v: number | null; a7: number | null; a30: number | null }[]).map(m => (
          <MetricBar
            key={m.label}
            label={m.label}
            value={healthRange === 'today' ? m.v : healthRange === '7d' ? m.a7 : m.a30}
            target={m.target}
            unit={m.unit}
            inverted={m.inverted}
            color={m.color}
            avg7={healthRange === 'today' ? m.a7 : healthRange === '7d' ? m.a30 : null}
            marker={healthRange === '30d' ? null : undefined}
            markerLabel={healthRange === '7d' ? '30d avg' : '7d avg'}
          />
        ))}
      </section>

      {/* ═══ ROW 2 COL 2: Nutrition ═══ */}
      <section className="card fade d2 ov-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 4 }}>
          <div className="font-display ov-card-title" style={{ marginBottom: 0 }}>🍽️ Nutrition</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RangeSelector value={nutritionRange} onChange={setNutritionRange} />
            <span className="font-data" style={{ fontSize: 9, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
              {nutritionRange === 'today'
                ? (nutrition.items > 0 ? `${nutrition.items} items` : '')
                : `${nutritionRange === '7d' ? nutrition.days7 : nutrition.days30}d avg`}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'var(--t4)', marginBottom: 6 }}>
          {nutritionRange === 'today' ? 'Today' : nutritionRange === '7d' ? '7-day avg' : '30-day avg'}
          {nutritionRange !== '30d' && <> · <span style={{ borderBottom: '2px solid var(--t2)', opacity: 0.5 }}>|</span> = {nutritionRange === 'today' ? '7d' : '30d'} avg · arrow = trend</>}
        </div>
        {([
          { label: 'Cals', target: 2200, unit: 'kcal', v: nutrition.calories, a7: nutrition.avg7cal, a30: nutrition.avg30cal },
          { label: 'Protein', target: 125, unit: 'g', v: nutrition.protein, a7: nutrition.avg7pro, a30: nutrition.avg30pro },
          { label: 'Fat', target: 80, unit: 'g', inverted: true, v: nutrition.fat, a7: nutrition.avg7fat, a30: nutrition.avg30fat },
          { label: 'Carbs', target: 245, unit: 'g', v: nutrition.carbs, a7: nutrition.avg7carb, a30: nutrition.avg30carb },
          { label: 'Water', target: 3000, unit: 'ml', v: nutrition.water, a7: nutrition.avg7water, a30: nutrition.avg30water },
        ] as { label: string; target: number; unit?: string; inverted?: boolean; v: number | null; a7: number | null; a30: number | null }[]).map(m => (
          <MetricBar
            key={m.label}
            label={m.label}
            value={nutritionRange === 'today' ? m.v : nutritionRange === '7d' ? m.a7 : m.a30}
            target={m.target}
            unit={m.unit}
            inverted={m.inverted}
            avg7={nutritionRange === 'today' ? m.a7 : nutritionRange === '7d' ? m.a30 : null}
            marker={nutritionRange === '30d' ? null : undefined}
            markerLabel={nutritionRange === '7d' ? '30d avg' : '7d avg'}
          />
        ))}
        {nutritionRange === 'today' && nutrition.items === 0 && (
          <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
            No food logged yet today
          </div>
        )}
      </section>

      {/* ═══ ROW 2 COL 3: Finance MTD ═══ */}
      <section className="card fade d3 ov-card">
        <div className="font-display ov-card-title">💰 Finance MTD</div>
        <MetricBar label="Budget" value={finance.spent} target={BUDGET} unit=" lei" inverted />
        <MetricBar label="Vices" value={finance.viceSpent} target={VICE_LIMIT} unit=" lei" inverted />

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.03em' }}>
            Credit Situation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Total debt</div>
              <div className="font-data" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>
                {(CREDIT_TOTAL).toLocaleString('ro-RO')}
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}> lei</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Monthly</div>
              <div className="font-data" style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)' }}>
                {(CREDIT_MONTHLY).toLocaleString('ro-RO')}
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}> lei</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, padding: '6px 10px', borderRadius: 8, background: 'var(--amber-bg)', color: 'var(--amber)', fontWeight: 600 }}>
            📋 Plan: Refinanțare în curs
          </div>
        </div>
      </section>

      {/* ═══ ROW 3 COL 1: Non-Negotiables + Collision Zone ═══ */}
      <section className="card fade d4 ov-card">
        <div className="font-display ov-card-title">🎯 Non-Negotiables</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: frictionInsights.length > 0 ? 16 : 0 }}>
          {actions.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 10px', borderRadius: 8,
              background: a.urgency === 'red' ? 'var(--red-bg)' : a.urgency === 'amber' ? 'var(--amber-bg)' : 'var(--surface)',
              border: `1px solid ${a.urgency === 'red' ? 'var(--red)' : a.urgency === 'amber' ? 'var(--amber)' : 'var(--border)'}`,
            }}>
              <span style={{ fontSize: 14 }}>{a.icon}</span>
              <span style={{ color: a.urgency === 'red' ? 'var(--red)' : 'var(--t1)', fontWeight: a.urgency === 'red' ? 600 : 400 }}>{a.text}</span>
            </div>
          ))}
        </div>

        {frictionInsights.length > 0 && (
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div className="font-display" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--amber)' }}>⚡ Collision Zone</div>
            {frictionInsights.map((insight, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--t2)', padding: '3px 0', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {insight}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ ROW 3 COL 2: Next 7 Days ═══ */}
      <section className="card fade d5 ov-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="font-display ov-card-title" style={{ marginBottom: 0 }}>📅 Next 7 Days</div>
          {weekendReady && (
            <span style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 10, fontWeight: 600,
              background: weekendReady.safe ? 'var(--green-bg)' : 'var(--red-bg)',
              color: weekendReady.safe ? 'var(--green)' : 'var(--red)',
            }}>
              Weekend: {weekendReady.safe ? 'safe' : 'tight'}
            </span>
          )}
        </div>
        {!events.length && <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Clear week ✨</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map(e => {
            const days = Math.ceil((new Date(e.date).getTime() - Date.now()) / 864e5);
            const dayLabel = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`;
            const energyTag = e.type === 'wedding' || e.type === 'bill' ? 'drain' : e.type === 'social' ? 'recharge' : '';
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="font-data" style={{ width: 42, textAlign: 'center', fontSize: 10, fontWeight: 700, color: days <= 1 ? 'var(--red)' : 'var(--t3)', flexShrink: 0 }}>
                  {dayLabel}
                </span>
                <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                {energyTag && (
                  <span style={{
                    fontSize: 8, padding: '1px 5px', borderRadius: 6, fontWeight: 600,
                    background: energyTag === 'drain' ? 'var(--red-bg)' : 'var(--green-bg)',
                    color: energyTag === 'drain' ? 'var(--red)' : 'var(--green)',
                  }}>{energyTag}</span>
                )}
                {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600, fontSize: 10, flexShrink: 0 }}>{e.cost}</span>}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ ROW 3 COL 3: Semi-Marathon + Workouts ═══ */}
      <section className="card fade d6 ov-card">
        <div className="font-display ov-card-title">🏃 Semi-Marathon</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span className="font-data" style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>{race.d}</span>
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>days left</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="font-data" style={{ fontSize: 24, fontWeight: 800 }}>{race.lon}</span>
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 2 }}>km longest</span>
          </div>
        </div>
        <div style={{ marginBottom: 6 }}>
          <div className="ov-bar-track">
            <div className="ov-bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>{race.pct}% ready</span>
            <span style={{ fontSize: 10, color: 'var(--t2)' }}>Next target: <span className="font-data" style={{ fontWeight: 700 }}>{race.nextKm}km</span></span>
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Workouts this week
            </div>
            <span className="font-data" style={{ fontSize: 20, fontWeight: 800, color: weekWorkouts.length >= 3 ? 'var(--green)' : 'var(--amber)' }}>
              {weekWorkouts.length}
              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>/3</span>
            </span>
          </div>
          {weekWorkouts.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>No workouts yet this week</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {weekWorkouts.slice(0, 5).map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12 }}>{w.type === 'running' ? '🏃' : w.type === 'gym' || w.type === 'strength' ? '🏋️' : '💪'}</span>
                <span style={{ flex: 1, textTransform: 'capitalize' }}>{w.type}</span>
                {w.duration_min && <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>{w.duration_min}min</span>}
                {w.distance_km && <span className="font-data" style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>{w.distance_km}km</span>}
                <span className="font-data" style={{ fontSize: 9, color: 'var(--t4)' }}>{fDateShort(w.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
