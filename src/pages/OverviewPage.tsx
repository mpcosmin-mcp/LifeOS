import { useMemo } from 'react';
import { Heart, Flame, Wallet, Calendar, Droplets, Activity, ArrowRight, AlertTriangle } from 'lucide-react';
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

  // ── Health intelligence ──
  const health = useMemo(() => {
    const h = data.health;
    const metrics = [
      { k: 'weight_kg' as const, l: 'Weight', u: 'kg', tgt: TARGETS.weight, low: true, c: 'var(--cyan)' },
      { k: 'body_fat_pct' as const, l: 'Body Fat', u: '%', tgt: TARGETS.bf, low: true, c: 'var(--amber)' },
      { k: 'visceral_fat' as const, l: 'Visceral', u: '', tgt: TARGETS.vf, low: true, c: 'var(--red)' },
      { k: 'rhr' as const, l: 'RHR', u: 'bpm', tgt: TARGETS.rhr, low: true, c: 'var(--red)' },
      { k: 'hrv' as const, l: 'HRV', u: 'ms', tgt: TARGETS.hrv, low: false, c: 'var(--green)' },
      { k: 'sleep_score' as const, l: 'Sleep', u: '', tgt: TARGETS.sleep, low: false, c: 'var(--purple)' },
    ];
    return metrics.map(m => {
      const cur = avg(h, m.k, 7);
      const tr = trend(h, m.k);
      const gap = cur != null ? (m.low ? cur - m.tgt : m.tgt - cur) : null;
      const onTrack = gap != null && gap <= 0;
      const weeksToTarget = gap != null && tr != null && tr !== 0
        ? (m.low ? (tr < 0 ? Math.ceil(gap / Math.abs(tr)) : null) : (tr > 0 ? Math.ceil(gap / tr) : null))
        : null;
      return { ...m, cur, tr, gap, onTrack, weeksToTarget };
    });
  }, [data]);

  // ── Health actions for next 7 days ──
  const healthActions = useMemo(() => {
    const actions: string[] = [];
    const bf = health.find(h => h.k === 'body_fat_pct');
    const rhr = health.find(h => h.k === 'rhr');
    const hrv = health.find(h => h.k === 'hrv');
    const slp = health.find(h => h.k === 'sleep_score');

    const recentWorkouts = data.workouts.filter(w => daysAgo(w.date) <= 7);
    if (recentWorkouts.length < 3) actions.push(`${3 - recentWorkouts.length} more workouts needed this week (target: 3)`);
    if (bf && !bf.onTrack) actions.push('Maintain caloric deficit (~300cal/day below 2200)');
    if (rhr && !rhr.onTrack) actions.push('4x cardio sessions to bring RHR down');
    if (hrv && !hrv.onTrack) actions.push('Prioritize recovery: sauna + cold plunge 3x');
    if (slp && !slp.onTrack) actions.push('Sleep before 23:00, no screens after 22:00');

    const avgWater = data.nutrition.filter(n => daysAgo(n.date) <= 7).reduce((s, n) => s + n.water_ml, 0);
    const daysWithData = new Set(data.nutrition.filter(n => daysAgo(n.date) <= 7).map(n => n.date)).size || 1;
    if (avgWater / daysWithData < 2500) actions.push('Increase water intake to 3L/day');

    return actions;
  }, [data, health]);

  // ── Money intelligence ──
  const money = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const in7 = new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const thisMonth = data.transactions.filter(t => t.date.substring(0, 7) === today.substring(0, 7));
    const spent = Math.round(thisMonth.reduce((s, t) => s + t.amount, 0));
    const available = 2505;
    const remaining = available - spent;

    const committed7 = data.events.filter(e => e.date >= today && e.date <= in7 && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const committedMonth = data.events.filter(e => e.date >= today && e.date <= monthEnd && e.cost > 0).reduce((s, e) => s + e.cost, 0);
    const freeAfterCommitted = remaining - committedMonth;
    const dailyBudget = daysLeft > 0 ? Math.max(0, Math.round(freeAfterCommitted / daysLeft)) : 0;

    const viceSpend = thisMonth.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);

    return { spent, available, remaining, committed7, committedMonth, freeAfterCommitted, dailyBudget, daysLeft, viceSpend };
  }, [data]);

  const moneyActions = useMemo(() => {
    const actions: string[] = [];
    if (money.dailyBudget < 50) actions.push(`⚠️ Only ${money.dailyBudget} lei/day budget left`);
    if (money.viceSpend > 100) actions.push(`Cut vice spending (${Math.round(money.viceSpend)} lei this month)`);
    if (money.freeAfterCommitted < 0) actions.push(`Over budget by ${Math.abs(money.freeAfterCommitted)} lei — reduce discretionary`);
    else if (money.freeAfterCommitted < 300) actions.push('Tight month — essential spending only');
    return actions;
  }, [money]);

  // ── Semi-marathon intelligence ──
  const race = useMemo(() => {
    const daysUntil = Math.max(0, Math.ceil((RACE.date.getTime() - Date.now()) / 864e5));
    const weeksUntil = Math.ceil(daysUntil / 7);
    const runs = data.workouts.filter(w => w.type === 'running' && w.distance_km);
    const totalKm = runs.reduce((s, w) => s + (w.distance_km || 0), 0);
    const longestRun = Math.max(0, ...runs.map(w => w.distance_km || 0));
    const kmNeeded = RACE.km - longestRun;
    const weeklyIncrease = weeksUntil > 0 ? Math.round(kmNeeded / weeksUntil * 10) / 10 : 0;
    const nextWeekTarget = Math.round((longestRun + weeklyIncrease) * 10) / 10;
    const runsThisWeek = runs.filter(w => daysAgo(w.date) <= 7).length;
    return { daysUntil, weeksUntil, totalKm: Math.round(totalKm * 10) / 10, longestRun, nextWeekTarget, weeklyIncrease, runsThisWeek };
  }, [data]);

  // ── Events ──
  const events = useMemo(() => {
    const now = new Date(), today = now.toISOString().split('T')[0];
    const in7 = new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0];
    const in30 = new Date(now.getTime() + 30 * 864e5).toISOString().split('T')[0];
    const all = data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    return { week: all.filter(e => e.date <= in7), month: all.filter(e => e.date > in7 && e.date <= in30) };
  }, [data]);

  // ── Fuel ──
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

      {/* ═══ HEALTH: Current → Target → Actions ═══ */}
      <div className="panel fade d1" style={{ padding: 14 }}>
        <SectionHeader icon={<Heart size={14} />} color="var(--cyan)" title="Health" subtitle="7-day avg → target" />
        <div className="grid-kpi" style={{ marginBottom: 10 }}>
          {health.map(m => (
            <div key={m.k} style={{ textAlign: 'center', padding: '6px 2px' }}>
              <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 3 }}>{m.l}</div>
              <div className="font-data" style={{ fontWeight: 800, fontSize: 18, color: m.onTrack ? 'var(--green)' : 'var(--t1)', lineHeight: 1 }}>
                {m.cur != null ? (Number.isInteger(m.tgt) && m.u !== 'kg' ? Math.round(m.cur) : m.cur.toFixed(1)) : '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 2 }}>
                <ArrowRight size={8} style={{ color: 'var(--t3)' }} />
                <span className="font-data" style={{ fontSize: 9, color: m.onTrack ? 'var(--green)' : 'var(--t3)' }}>{m.tgt}{m.u}</span>
              </div>
              {m.weeksToTarget != null && m.weeksToTarget > 0 && (
                <div className="font-data" style={{ fontSize: 7, color: 'var(--t3)', marginTop: 2 }}>~{m.weeksToTarget}w</div>
              )}
              <div style={{ margin: '3px auto 0', width: '70%' }}>
                <div className="bar-track" style={{ height: 2 }}>
                  <div className="bar-fill" style={{ width: `${m.onTrack ? 100 : Math.min(95, Math.max(5, m.low ? Math.max(0, (1 - (m.gap || 0) / (m.cur || 1)) * 100) : Math.min(100, ((m.cur || 0) / m.tgt) * 100)))}%`, background: m.onTrack ? 'var(--green)' : m.c }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {healthActions.length > 0 && (
          <div style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.08)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 5 }}>This week's focus</div>
            {healthActions.map((a, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--t2)', padding: '2px 0', display: 'flex', gap: 5 }}>
                <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>→</span>{a}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MONEY: Spent → Committed → Budget → Actions ═══ */}
      <div className="panel fade d2" style={{ padding: 14 }}>
        <SectionHeader icon={<Wallet size={14} />} color="var(--green)" title="Money" subtitle={`${money.daysLeft} days left this month`} />
        <div className="grid-2" style={{ marginBottom: 10 }}>
          <div>
            <div className="font-data" style={{ fontWeight: 800, fontSize: 24, color: money.remaining < 300 ? 'var(--red)' : 'var(--t1)', lineHeight: 1 }}>
              {money.spent}<span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 3 }}>/ {money.available} lei</span>
            </div>
            <div style={{ margin: '6px 0 4px' }}>
              <div className="bar-track" style={{ height: 5 }}>
                <div className="bar-fill" style={{ width: `${Math.min(100, (money.spent / money.available) * 100)}%`, background: money.remaining < 300 ? 'var(--red)' : money.remaining < 800 ? 'var(--amber)' : 'var(--green)' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Row l="Remaining" v={`${money.remaining} lei`} c={money.remaining < 300 ? 'var(--red)' : 'var(--t1)'} />
            <Row l="Committed (7d)" v={`${money.committed7} lei`} c="var(--amber)" />
            <Row l="Committed (month)" v={`${money.committedMonth} lei`} c="var(--amber)" />
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 3, marginTop: 1 }}>
              <Row l="Free after committed" v={`${money.freeAfterCommitted} lei`} c={money.freeAfterCommitted < 0 ? 'var(--red)' : 'var(--green)'} bold />
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(0,255,136,0.03)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: 'var(--t2)' }}>Daily budget</span>
          <span className="font-data" style={{ fontWeight: 800, fontSize: 16, color: money.dailyBudget < 50 ? 'var(--red)' : 'var(--green)' }}>{money.dailyBudget} lei<span style={{ fontSize: 9, color: 'var(--t3)' }}>/day</span></span>
        </div>
        {moneyActions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {moneyActions.map((a, i) => (
              <div key={i} style={{ fontSize: 10, color: a.startsWith('⚠') ? 'var(--amber)' : 'var(--t2)', padding: '2px 0', display: 'flex', gap: 5 }}>
                <span style={{ color: 'var(--green)', flexShrink: 0 }}>→</span>{a}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ FUEL ═══ */}
      <div className="panel fade d3" style={{ padding: 14 }}>
        <SectionHeader icon={<Flame size={14} />} color="var(--amber)" title="Fuel" subtitle={`${fuel.lbl} · ${fuel.n} meals`} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ring v={fuel.cal} max={2200} c={fuel.cal > 2200 ? 'var(--red)' : 'var(--green)'} label="cal" />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <MacroBar l="Protein" v={fuel.p} t={120} u="g" c="var(--green)" />
            <MacroBar l="Carbs" v={fuel.c} t={200} u="g" c="var(--cyan)" />
            <MacroBar l="Fat" v={fuel.f} t={70} u="g" c="var(--amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Droplets size={11} style={{ color: 'var(--cyan)' }} />
            <span className="font-data" style={{ fontSize: 10, fontWeight: 700 }}>{fuel.w ? `${(fuel.w / 1000).toFixed(1)}L` : '—'}<span style={{ color: 'var(--t3)' }}>/3</span></span>
          </div>
        </div>
      </div>

      {/* ═══ NEXT UP ═══ */}
      <div className="grid-2">
        <EventList title="Next 7 Days" icon={<Calendar size={13} />} color="var(--purple)" events={events.week} onNavigate={onNavigate} />
        <EventList title="Next Month" icon={<Calendar size={13} />} color="var(--amber)" events={events.month} onNavigate={onNavigate} />
      </div>

      {/* ═══ SEMI-MARATHON + WORKOUTS ═══ */}
      <div className="panel fade d6" style={{ padding: 14 }}>
        <SectionHeader icon={<Activity size={14} />} color="var(--green)" title="Training" subtitle={`${race.daysUntil} days to race`} />
        <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.08)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)' }}>🏃 Semi-Marathon</span>
              <div className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginTop: 1 }}>30 Mai · {RACE.km}km</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-data" style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)', lineHeight: 1 }}>{race.daysUntil}</div>
              <div style={{ fontSize: 7, color: 'var(--t3)' }}>days</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Stat label="longest" value={`${race.longestRun}km`} />
            <Stat label="total ran" value={`${race.totalKm}km`} />
            <Stat label="runs/week" value={`${race.runsThisWeek}`} />
          </div>
          <div className="bar-track" style={{ height: 4, marginBottom: 4 }}>
            <div className="bar-fill" style={{ width: `${Math.min(100, (race.longestRun / RACE.km) * 100)}%`, background: 'var(--green)' }} />
          </div>
          <div className="font-data" style={{ fontSize: 8, color: 'var(--t3)' }}>{Math.round((race.longestRun / RACE.km) * 100)}% of race distance</div>
          <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(0,255,136,0.06)', borderRadius: 6, fontSize: 10, color: 'var(--t2)' }}>
            <span style={{ color: 'var(--green)' }}>→</span> Next week target: <span className="font-data" style={{ fontWeight: 700, color: 'var(--green)' }}>{race.nextWeekTarget}km</span> long run
            <span style={{ color: 'var(--t3)', marginLeft: 4 }}>(+{race.weeklyIncrease}km/week needed)</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.workouts.slice(0, 4).map(w => (
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

// ── Shared components ──

function SectionHeader({ icon, color, title, subtitle }: { icon: React.ReactNode; color: string; title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
      <span style={{ color }}>{icon}</span>
      <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
      {subtitle && <span className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginLeft: 'auto' }}>{subtitle}</span>}
    </div>
  );
}

function Row({ l, v, c, bold }: { l: string; v: string; c: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
      <span style={{ color: 'var(--t2)' }}>{l}</span>
      <span className="font-data" style={{ fontWeight: bold ? 800 : 700, color: c }}>{v}</span>
    </div>
  );
}

function MacroBar({ l, v, t, u, c }: { l: string; v: number; t: number; u: string; c: string }) {
  return <div style={{ minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginBottom: 1 }}>
      <span style={{ color: 'var(--t3)' }}>{l}</span>
      <span className="font-data" style={{ fontWeight: 700, flexShrink: 0 }}>{v || '—'}{u}<span style={{ color: 'var(--t3)', marginLeft: 2 }}>/{t}</span></span>
    </div>
    <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div>
  </div>;
}

function Ring({ v, max, c, label }: { v: number; max: number; c: string; label: string }) {
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.min(100, (v / max) * 100) * 2.51} 251`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-data" style={{ fontWeight: 800, fontSize: 10 }}>{v || '—'}</span>
        <span style={{ fontSize: 6, color: 'var(--t3)' }}>/{max}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div>
    <div className="font-data" style={{ fontSize: 13, fontWeight: 800 }}>{value}</div>
    <div style={{ fontSize: 7, color: 'var(--t3)' }}>{label}</div>
  </div>;
}

function EventList({ title, icon, color, events, onNavigate }: { title: string; icon: React.ReactNode; color: string; events: any[]; onNavigate: (p: Page) => void }) {
  return (
    <div className="panel fade d5" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12 }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!events.length && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Nothing planned</span>}
        {events.map((e: any) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer' }} onClick={() => onNavigate('calendar')}>
            <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
            {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', flexShrink: 0 }}>{e.cost}</span>}
            <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
