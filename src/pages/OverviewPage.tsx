import { useMemo } from 'react';
import { Check, X, AlertTriangle, Zap, Shield } from 'lucide-react';
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
const FIXED_TOTAL = 4495;

export default function OverviewPage({ data, onNavigate }: Props) {

  // ══ STATUS BANNER — algorithmic diagnosis ══
  const diagnosis = useMemo(() => {
    const h = data.health;
    const hrv = avg(h, 'hrv', 3);
    const rhr = avg(h, 'rhr', 3);
    const sleep = avg(h, 'sleep_score', 3);

    // Determine system state
    let level: 'red' | 'amber' | 'green' = 'green';
    let message = '';
    let protocol: string[] = [];

    if ((hrv && hrv < 35) || (sleep && sleep < 50)) {
      level = 'red';
      message = 'Sistem nervos suprasolicitat. Protocol de recuperare azi.';
      protocol = ['Fără decizii financiare majore', 'Fără antrenamente intense', 'Somn înainte de 22:00', 'Hidratare 3L+'];
    } else if ((hrv && hrv < 45) || (sleep && sleep < 60) || (rhr && rhr > 65)) {
      level = 'amber';
      message = 'Recuperare parțială. Zi ușoară cu focus pe basics.';
      protocol = ['Antrenament moderat OK', 'Prioritizează somnul', 'Mâncare reală, nu sandvișuri'];
    } else {
      level = 'green';
      message = 'Sistem în parametri. Go mode.';
      protocol = ['Antrenament intens OK', 'Zi de execuție', 'Push boundaries'];
    }

    return { level, message, protocol, hrv, rhr, sleep };
  }, [data]);

  // ══ TRIAD SCORE — Health, Wealth, Time ══
  const triad = useMemo(() => {
    const h = data.health;
    // Health: composite from sleep + hrv + rhr progress to targets
    const sleepScore = avg(h, 'sleep_score', 7);
    const hrvScore = avg(h, 'hrv', 7);
    const rhrScore = avg(h, 'rhr', 7);
    const healthPct = Math.round(
      ((sleepScore ? Math.min(100, (sleepScore / TGT.sleep) * 100) : 0) +
       (hrvScore ? Math.min(100, (hrvScore / TGT.hrv) * 100) : 0) +
       (rhrScore ? Math.min(100, (TGT.rhr / rhrScore) * 100) : 0)) / 3
    );

    // Wealth: savings rate
    const mo = new Date().toISOString().substring(0, 7);
    const moSpent = data.transactions.filter(t => t.date.substring(0, 7) === mo).reduce((s, t) => s + t.amount, 0);
    const wealthPct = Math.max(0, Math.round(((INCOME - FIXED_TOTAL - moSpent) / INCOME) * 100 * 5)); // ×5 to scale 20% savings = 100%

    // Time: based on events this week
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const weekEvents = data.events.filter(e => e.date >= today && e.date <= in7).length;
    const timePct = Math.max(0, Math.min(100, Math.round((1 - weekEvents / 10) * 100)));

    return {
      health: Math.min(100, healthPct),
      wealth: Math.min(100, wealthPct),
      time: timePct,
    };
  }, [data]);

  // ══ FRICTION INSIGHTS — cross-module correlations ══
  const frictionInsights = useMemo(() => {
    const insights: string[] = [];
    const h = data.health;

    // Sleep < 50 → next day spending correlation
    const badSleepDays = h.filter(x => x.sleep_score != null && x.sleep_score < 50);
    if (badSleepDays.length >= 2) {
      const mo = new Date().toISOString().substring(0, 7);
      const viceSpend = data.transactions.filter(t => t.date.substring(0, 7) === mo && t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
      if (viceSpend > 100) {
        insights.push(`Ultimele ${badSleepDays.length} nopți cu sleep sub 50 au corelat cu ${Math.round(viceSpend)} lei cheltuieli impulsive luna asta.`);
      }
    }

    // Vice spending pattern
    const mo = new Date().toISOString().substring(0, 7);
    const viceDays = new Set(data.transactions.filter(t => t.date.substring(0, 7) === mo && t.roi_flag === '-').map(t => t.date));
    if (viceDays.size >= 5) {
      insights.push(`Ai avut cheltuieli -ROI în ${viceDays.size} din ${new Date().getDate()} zile luna asta. Pattern activ.`);
    }

    // Nutrition under-eating
    const recentNutrition = data.nutrition.filter(n => daysAgo(n.date) <= 7);
    const nutDays = new Set(recentNutrition.map(n => n.date));
    const avgCal = nutDays.size > 0
      ? recentNutrition.reduce((s, n) => s + n.calories, 0) / nutDays.size
      : 0;
    if (avgCal > 0 && avgCal < 1500) {
      insights.push(`Media caloriilor ultimele 7 zile: ${Math.round(avgCal)} kcal. Sub-alimentat cronic → cravings + decizii proaste.`);
    }

    return insights;
  }, [data]);

  // ══ ACTIONS — Non-Negotiables (max 3) ══
  const actions = useMemo(() => {
    const a: { icon: string; text: string; urgency: 'red' | 'amber' | 'green' }[] = [];

    // Financial urgency
    const mo = new Date().toISOString().substring(0, 7);
    const moSpent = data.transactions.filter(t => t.date.substring(0, 7) === mo).reduce((s, t) => s + t.amount, 0);
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    const free = INCOME - FIXED_TOTAL - moSpent;
    if (free < 0) {
      a.push({ icon: '🚨', text: `Over budget by ${Math.abs(Math.round(free))} lei — freeze spending`, urgency: 'red' });
    }

    // Health based on diagnosis
    if (diagnosis.level === 'red') {
      a.push({ icon: '🛌', text: 'Recovery day — no intense training', urgency: 'red' });
    } else {
      const wk = data.workouts.filter(w => daysAgo(w.date) <= 7).length;
      if (wk < 3) a.push({ icon: '🏃', text: `${3 - wk} workouts needed this week`, urgency: 'amber' });
    }

    // Nutrition
    const sleepAvg = avg(data.health, 'sleep_score', 3);
    if (sleepAvg && sleepAvg < 50) {
      a.push({ icon: '😴', text: 'Sleep before 22:00 tonight', urgency: 'red' });
    }

    // Vice check
    const viceToday = data.transactions.filter(t => t.date === new Date().toISOString().split('T')[0] && t.roi_flag === '-');
    if (viceToday.length === 0) {
      a.push({ icon: '✅', text: 'Zero vices today — keep it clean', urgency: 'green' });
    }

    // Calorie target
    if (diagnosis.level !== 'red') {
      a.push({ icon: '🍽️', text: 'Stay under 1900 kcal, protein 120g+', urgency: 'green' });
    }

    return a.slice(0, 3); // Max 3 non-negotiables
  }, [data, diagnosis]);

  // ══ NEXT 7 DAYS — with energy + cost tags ══
  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today && e.date <= in7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
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

  // ══ Weekend Readiness (mid-week check) ══
  const weekendReady = useMemo(() => {
    const dow = new Date().getDay(); // 0=Sun
    if (dow === 0 || dow === 6) return null; // already weekend
    const mo = new Date().toISOString().substring(0, 7);
    const moSpent = data.transactions.filter(t => t.date.substring(0, 7) === mo).reduce((s, t) => s + t.amount, 0);
    const budget = INCOME - FIXED_TOTAL;
    const remaining = budget - moSpent;
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    return { remaining: Math.round(remaining), safe: remaining > 200, daysLeft };
  }, [data]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {diagnosis.level === 'red' ? <AlertTriangle size={18} style={{ color: bc.text }} /> :
           diagnosis.level === 'amber' ? <Shield size={18} style={{ color: bc.text }} /> :
           <Zap size={18} style={{ color: bc.text }} />}
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 700, color: bc.text, fontStyle: 'italic' }}>
              {diagnosis.message}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
              HRV {diagnosis.hrv ?? '—'}ms · RHR {diagnosis.rhr ?? '—'}bpm · Sleep {diagnosis.sleep ?? '—'}
            </div>
          </div>
          {/* Triad inline in banner */}
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            {[
              { label: 'Health', pct: triad.health, color: '#5c7a6f' },
              { label: 'Wealth', pct: triad.wealth, color: '#8b7355' },
              { label: 'Time', pct: triad.time, color: '#6b6e8a' },
            ].map(t => (
              <div key={t.label} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 48, height: 48 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg3)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={t.color} strokeWidth="3"
                      strokeDasharray={`${t.pct} ${100 - t.pct}`} strokeLinecap="round" opacity="0.7" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-data" style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{t.pct}</span>
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

      {/* ═══ LEFT COLUMN: Diagnosis ═══ */}

      {/* Collision Zone + Non-Negotiables combined */}
      <section className="card fade d1" style={{ padding: '16px 20px' }}>
        {/* Non-Negotiables */}
        <div className="font-display" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🎯 Non-Negotiables</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: frictionInsights.length > 0 ? 16 : 0 }}>
          {actions.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 10px', borderRadius: 8,
              background: a.urgency === 'red' ? 'var(--red-bg)' : a.urgency === 'amber' ? 'var(--amber-bg)' : 'var(--surface)',
              border: `1px solid ${a.urgency === 'red' ? 'var(--red)' : a.urgency === 'amber' ? 'var(--amber)' : 'var(--border)'}`,
            }}>
              <span style={{ fontSize: 14 }}>{a.icon}</span>
              <span style={{ color: a.urgency === 'red' ? 'var(--red)' : 'var(--t1)', fontWeight: a.urgency === 'red' ? 600 : 400 }}>{a.text}</span>
            </div>
          ))}
        </div>

        {/* Collision Zone */}
        {frictionInsights.length > 0 && (
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div className="font-display" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--amber)' }}>⚡ Collision Zone</div>
            {frictionInsights.map((insight, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--t2)', padding: '3px 0', lineHeight: 1.5 }}>
                {insight}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ RIGHT COLUMN: Planning ═══ */}

      {/* Next 7 Days + Semi-Marathon combined */}
      <section className="card fade d2" style={{ padding: '16px 20px' }}>
        {/* Events */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 700 }}>📅 Next 7 Days</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {events.map(e => {
            const days = Math.ceil((new Date(e.date).getTime() - Date.now()) / 864e5);
            const dayLabel = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`;
            const energyTag = e.type === 'wedding' || e.type === 'bill' ? 'drain' : e.type === 'social' ? 'recharge' : '';
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="font-data" style={{ width: 36, textAlign: 'center', fontSize: 9, fontWeight: 700, color: days <= 1 ? 'var(--red)' : 'var(--t3)', flexShrink: 0 }}>
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

        {/* Semi-Marathon — inline below events */}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="font-display" style={{ fontSize: 12, fontWeight: 700 }}>🏃 Semi-Marathon</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span className="font-data" style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{race.d}</span>
              <span style={{ fontSize: 9, color: 'var(--t3)' }}>days</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-data" style={{ fontSize: 14, fontWeight: 800 }}>{race.lon}<span style={{ fontSize: 9, color: 'var(--t3)' }}>km</span></span>
            <div style={{ flex: 1 }}>
              <div className="bar-track" style={{ height: 5 }}><div className="bar-fill" style={{ width: `${race.pct}%`, background: 'var(--green)' }} /></div>
            </div>
            <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>{race.pct}%</span>
            <span style={{ fontSize: 9, color: 'var(--t2)' }}>Next: <span className="font-data" style={{ fontWeight: 700 }}>{race.nextKm}km</span></span>
          </div>
        </div>
      </section>
    </div>
  );
}
