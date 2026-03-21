import { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingDown, TrendingUp, Heart, Flame,
  Moon, Wallet, Calendar, Zap, Droplets, Activity,
} from 'lucide-react';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { f, fDateShort, d, dColor, categoryEmoji, workoutEmoji, scoreColor, scoreLabel, daysAgo } from '../lib/helpers';
import { calculateLifeScore } from '../lib/scoring';
import { generateInsights } from '../lib/insights';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }

function lastWith(health: HealthMetric[], field: keyof HealthMetric): HealthMetric | null {
  for (let i = health.length - 1; i >= 0; i--) {
    if (health[i][field] != null) return health[i];
  }
  return null;
}

function prevWith(health: HealthMetric[], field: keyof HealthMetric): HealthMetric | null {
  let found = false;
  for (let i = health.length - 1; i >= 0; i--) {
    if (health[i][field] != null) {
      if (found) return health[i];
      found = true;
    }
  }
  return null;
}

export default function OverviewPage({ data, onNavigate }: Props) {
  const lifeScore = useMemo(() =>
    calculateLifeScore(data.health, data.nutrition, data.transactions, data.workouts), [data]);

  const insights = useMemo(() =>
    generateInsights(data.health, data.nutrition, data.transactions), [data]);

  const weightData = useMemo(() =>
    data.health.filter(h => h.weight_kg).map(h => ({ date: fDateShort(h.date), val: h.weight_kg })), [data.health]);

  const sleepData = useMemo(() =>
    data.health.filter(h => h.sleep_score).slice(-14).map(h => ({ date: fDateShort(h.date), val: h.sleep_score })), [data.health]);

  const rhrData = useMemo(() =>
    data.health.filter(h => h.rhr).slice(-14).map(h => ({ date: fDateShort(h.date), val: h.rhr })), [data.health]);

  const todayNutrition = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let meals = data.nutrition.filter(n => n.date === today);
    let dateLabel = 'Today';
    if (!meals.length) { meals = data.nutrition.filter(n => n.date === yesterday); dateLabel = 'Yesterday'; }
    return {
      dateLabel, meals: meals.length,
      calories: meals.reduce((s, m) => s + m.calories, 0),
      protein: meals.reduce((s, m) => s + m.protein_g, 0),
      carbs: meals.reduce((s, m) => s + m.carbs_g, 0),
      fat: meals.reduce((s, m) => s + m.fat_g, 0),
      water: meals.reduce((s, m) => s + m.water_ml, 0),
    };
  }, [data.nutrition]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [data.events]);

  const spendingByCategory = useMemo(() => {
    const last30 = data.transactions.filter(t => daysAgo(t.date) <= 30);
    const map = new Map<string, number>();
    last30.forEach(t => map.set(t.category || 'other', (map.get(t.category || 'other') || 0) + t.amount));
    const colors: Record<string, string> = {
      food: '#00ff88', social: '#ec4899', transport: '#3b82f6',
      subscriptions: '#a855f7', household: '#f97316', health: '#facc15', other: '#475569',
    };
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value), color: colors[name] || '#475569' }))
      .sort((a, b) => b.value - a.value);
  }, [data.transactions]);

  const monthSpending = useMemo(() =>
    data.transactions.filter(t => daysAgo(t.date) <= 30).reduce((s, t) => s + t.amount, 0), [data.transactions]);

  const stats = [
    { label: 'Weight', unit: 'kg', color: 'var(--neon-blue)', lowerBetter: true,
      value: f(lastWith(data.health, 'weight_kg')?.weight_kg ?? null),
      delta: d(lastWith(data.health, 'weight_kg')?.weight_kg ?? null, prevWith(data.health, 'weight_kg')?.weight_kg ?? null) },
    { label: 'Body Fat', unit: '%', color: 'var(--neon-orange)', lowerBetter: true,
      value: f(lastWith(data.health, 'body_fat_pct')?.body_fat_pct ?? null),
      delta: d(lastWith(data.health, 'body_fat_pct')?.body_fat_pct ?? null, prevWith(data.health, 'body_fat_pct')?.body_fat_pct ?? null) },
    { label: 'RHR', unit: 'bpm', color: 'var(--neon-red)', lowerBetter: true,
      value: f(lastWith(data.health, 'rhr')?.rhr ?? null, 0),
      delta: d(lastWith(data.health, 'rhr')?.rhr ?? null, prevWith(data.health, 'rhr')?.rhr ?? null) },
    { label: 'HRV', unit: 'ms', color: 'var(--neon-green)', lowerBetter: false,
      value: f(lastWith(data.health, 'hrv')?.hrv ?? null, 0),
      delta: d(lastWith(data.health, 'hrv')?.hrv ?? null, prevWith(data.health, 'hrv')?.hrv ?? null) },
    { label: 'Sleep', unit: '', color: 'var(--neon-purple)', lowerBetter: false,
      value: f(lastWith(data.health, 'sleep_score')?.sleep_score ?? null, 0),
      delta: d(lastWith(data.health, 'sleep_score')?.sleep_score ?? null, prevWith(data.health, 'sleep_score')?.sleep_score ?? null) },
    { label: 'Steps', unit: '', color: 'var(--neon-yellow)', lowerBetter: false,
      value: lastWith(data.health, 'steps')?.steps ? `${((lastWith(data.health, 'steps')?.steps ?? 0) / 1000).toFixed(1)}k` : '—',
      delta: d(lastWith(data.health, 'steps')?.steps ?? null, prevWith(data.health, 'steps')?.steps ?? null) },
  ];

  const scoreFactors = [
    { key: 'activity', label: 'Activity', value: lifeScore.activity, icon: <Zap size={14} />, color: 'var(--neon-green)' },
    { key: 'nutrition', label: 'Nutrition', value: lifeScore.nutrition, icon: <Flame size={14} />, color: 'var(--neon-orange)' },
    { key: 'sleep', label: 'Sleep', value: lifeScore.sleep, icon: <Moon size={14} />, color: 'var(--neon-purple)' },
    { key: 'recovery', label: 'Recovery', value: lifeScore.recovery, icon: <Heart size={14} />, color: 'var(--neon-red)' },
    { key: 'finance', label: 'Finance', value: lifeScore.finance, icon: <Wallet size={14} />, color: 'var(--neon-blue)' },
  ];

  return (
    <div className="space-y-4 overflow-x-hidden">

      {/* ═══ Insights Ticker ═══ */}
      {insights.length > 0 && (
        <div className="overflow-hidden rounded-2xl anim-fade"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex animate-ticker whitespace-nowrap py-2.5">
            {[...insights, ...insights].map((ins, i) => (
              <span key={i} className="inline-block mx-6 text-[11px] font-bold shrink-0"
                style={{ color: ins.tone === 'good' ? 'var(--neon-green)' : ins.tone === 'warn' ? 'var(--neon-orange)' : 'var(--text2)' }}>
                {ins.emoji} {ins.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Life Score Hero ═══ */}
      <div className="glass p-4 md:p-6 relative overflow-hidden anim-fade">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-[0.04]" style={{ background: scoreColor(lifeScore.total) }} />
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor(lifeScore.total)} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${lifeScore.total * 2.64} 264`}
                style={{
                  filter: `drop-shadow(0 0 8px ${scoreColor(lifeScore.total)})`,
                  transition: 'stroke-dasharray 1s ease',
                  '--pulse-color': scoreColor(lifeScore.total),
                  animation: 'scorePulse 3s ease-in-out infinite',
                } as any} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-data font-black text-xl">{lifeScore.total}</span>
              <span className="text-[8px] font-bold text-[var(--text3)] uppercase">Score</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h2 className="font-black text-base" style={{ color: scoreColor(lifeScore.total) }}>{scoreLabel(lifeScore.total)}</h2>
            <p className="text-[10px] text-[var(--text2)] mt-0.5 mb-2">Last 7 days</p>
            <div className="space-y-1">
              {scoreFactors.map(sf => (
                <div key={sf.key} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 shrink-0" style={{ color: sf.color, width: 62 }}>
                    {sf.icon}
                    <span className="text-[8px] font-bold uppercase text-[var(--text3)]">{sf.label}</span>
                  </div>
                  <div className="flex-1 min-w-0"><div className="progress-track"><div className="progress-fill" style={{ width: `${sf.value}%`, background: sf.color }} /></div></div>
                  <span className="font-mono-data text-[10px] font-bold shrink-0" style={{ color: sf.color }}>{sf.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPI Grid — 2 cols mobile, 3 tablet, 6 desktop ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {stats.map((s, i) => (
          <div key={s.label} className={`glass p-3 md:p-4 relative overflow-hidden trading-card cursor-pointer anim-fade d${i + 1}`}
            onClick={() => onNavigate('health')}>
            <div className="accent-strip" style={{ background: s.color }} />
            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] mb-1">{s.label}</div>
            <div className="font-mono-data font-black text-lg md:text-xl leading-tight">{s.value}
              {s.unit && <span className="text-[9px] md:text-xs text-[var(--text2)] ml-0.5">{s.unit}</span>}
            </div>
            {s.delta != null && (
              <div className="font-mono-data text-[10px] mt-0.5" style={{ color: dColor(s.delta, s.lowerBetter) }}>
                {s.delta > 0 ? '+' : ''}{s.delta.toFixed(1)}
                {s.delta !== 0 && (s.delta > 0 === !s.lowerBetter
                  ? <TrendingUp size={9} style={{ display: 'inline', marginLeft: 2 }} />
                  : <TrendingDown size={9} style={{ display: 'inline', marginLeft: 2 }} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ Weight Chart — 160px mobile, 200px desktop ═══ */}
      <div className="glass p-4 md:p-5 anim-fade d3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Weight Trend</h3>
          <span className="chip text-[10px]" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--neon-blue)' }}>{weightData.length} entries</span>
        </div>
        <div className="chart-fluid h-[160px] md:h-[200px]" style={{ '--chart-accent': 'rgba(59,130,246,0.4)' } as any}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="gWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}><animate attributeName="stop-opacity" values="0.3;0.12;0.3" dur="4s" repeatCount="indefinite" /></stop>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.08}><animate attributeName="stop-opacity" values="0.08;0.2;0.08" dur="4s" begin="1s" repeatCount="indefinite" /></stop>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="kg" color="#3b82f6" />} isAnimationActive={false} />
              <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gWeight)"
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} interval="preserveStartEnd" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Fuel + Hydration ═══ */}
      <div className="glass p-4 pr-5 md:p-5 anim-fade d4">
        <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><Flame size={16} style={{ color: 'var(--neon-orange)' }} /> Fuel</h3>
        <p className="text-[10px] text-[var(--text3)] mb-3">{todayNutrition.dateLabel} · {todayNutrition.meals} meals</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-14 h-14 md:w-20 md:h-20 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={todayNutrition.calories > 2200 ? 'var(--neon-red)' : 'var(--neon-green)'} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${Math.min(100, (todayNutrition.calories / 2200) * 100) * 2.51} 251`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-data font-black text-sm md:text-lg">{todayNutrition.calories || '—'}</span>
              <span className="text-[7px] md:text-[8px] text-[var(--text3)]">/ 2200</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <MacroBar label="Protein" value={todayNutrition.protein} target={120} unit="g" color="var(--neon-green)" />
            <MacroBar label="Carbs" value={todayNutrition.carbs} target={200} unit="g" color="var(--neon-blue)" />
            <MacroBar label="Fat" value={todayNutrition.fat} target={70} unit="g" color="var(--neon-orange)" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets size={14} style={{ color: 'var(--neon-blue)' }} />
          <div className="flex-1 progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, (todayNutrition.water / 3000) * 100)}%`, background: 'var(--neon-blue)' }} /></div>
          <span className="font-mono-data text-xs font-bold">{todayNutrition.water ? `${(todayNutrition.water / 1000).toFixed(1)}L` : '—'}<span className="text-[var(--text3)]"> / 3L</span></span>
        </div>
      </div>

      {/* ═══ Mini Charts Row — stacked on mobile, 2 cols desktop ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MiniChart title="Sleep" data={sleepData} color="#a855f7" unit="" icon={<Moon size={14} />} />
        <MiniChart title="RHR" data={rhrData} color="#ff3b3b" unit="bpm" icon={<Heart size={14} />} />
      </div>

      {/* ═══ Spending ═══ */}
      <div className="glass p-4 pr-5 md:p-5 anim-fade d5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Wallet size={16} style={{ color: 'var(--neon-green)' }} /> Spending</h3>
          <span className="font-mono-data text-sm font-black" style={{ color: monthSpending > 2500 ? 'var(--neon-red)' : 'var(--text)' }}>{Math.round(monthSpending)} lei</span>
        </div>
        <p className="text-[10px] text-[var(--text3)] -mt-2 mb-3">Last 30 days</p>
        <div className="space-y-2">
          {spendingByCategory.map(cat => (
            <div key={cat.name} className="flex items-center gap-2">
              <span className="text-sm shrink-0">{categoryEmoji(cat.name)}</span>
              <span className="text-[11px] text-[var(--text2)] capitalize w-16 md:w-20">{cat.name}</span>
              <div className="flex-1 min-w-0"><div className="progress-track"><div className="progress-fill" style={{ width: `${(cat.value / (spendingByCategory[0]?.value || 1)) * 100}%`, background: cat.color }} /></div></div>
              <span className="font-mono-data text-xs font-bold shrink-0">{cat.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
          <ROISplit transactions={data.transactions} />
        </div>
      </div>

      {/* ═══ Upcoming + Workouts — stacked on mobile, side by side on desktop ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass p-4 md:p-5 anim-fade d6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Calendar size={16} style={{ color: 'var(--neon-purple)' }} /> Upcoming</h3>
          <div className="space-y-2">
            {!upcomingEvents.length && <p className="text-xs text-[var(--text3)]">Nothing upcoming</p>}
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-xs cursor-pointer group min-h-[36px]" onClick={() => onNavigate('calendar')}>
                <span className="shrink-0">{categoryEmoji(e.type)}</span>
                <span className="flex-1 min-w-0 text-[11px] leading-tight group-hover:text-[var(--neon-blue)] transition-colors">{e.title}</span>
                {e.cost > 0 && <span className="font-mono-data text-[var(--neon-red)] shrink-0">{e.cost}</span>}
                <span className="font-mono-data text-[var(--text3)] shrink-0">{fDateShort(e.date)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass p-4 md:p-5 anim-fade d7">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Activity size={16} style={{ color: 'var(--neon-green)' }} /> Workouts</h3>
          <div className="space-y-2">
            {!data.workouts.length && <p className="text-xs text-[var(--text3)]">No workouts</p>}
            {data.workouts.slice(0, 3).map(w => (
              <div key={w.id} className="flex items-center gap-2 text-xs min-h-[36px]">
                <span className="shrink-0">{workoutEmoji(w.type)}</span>
                <div className="flex-1 min-w-0">
                  <span className="capitalize text-[11px]">{w.type.replace(/[_+]/g, ' ')}</span>
                  {w.duration_min && <span className="text-[var(--text3)]"> · {Math.round(w.duration_min)}m</span>}
                  {w.distance_km ? <span className="text-[var(--text3)]"> · {w.distance_km}km</span> : null}
                </div>
                {w.heart_rate_avg && <span className="font-mono-data shrink-0" style={{ color: w.heart_rate_avg > 160 ? 'var(--neon-red)' : 'var(--neon-green)' }}>♥{w.heart_rate_avg}</span>}
                <span className="font-mono-data text-[var(--text3)] shrink-0">{fDateShort(w.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-[var(--text3)]">{label}</span>
        <span className="font-mono-data font-bold shrink-0">{value || '—'}{unit}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, (value / target) * 100)}%`, background: color }} /></div>
    </div>
  );
}

function MiniChart({ title, data, color, unit, icon }: { title: string; data: { date: string; val: number | null }[]; color: string; unit: string; icon: React.ReactNode }) {
  const gid = `g-${title.replace(/\s/g, '')}`;
  return (
    <div className="glass p-3 md:p-4 anim-fade d5">
      <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text3)]">{title}</span>
        {data.length > 0 && <span className="ml-auto font-mono-data font-black text-sm" style={{ color }}>{data[data.length - 1].val}{unit && <span className="text-[10px] text-[var(--text3)] ml-0.5">{unit}</span>}</span>}
      </div>
      <div className="chart-fluid h-[80px] md:h-[100px]" style={{ '--chart-accent': `${color}66` } as any}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.25} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
            <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit={unit} color={color} />} isAnimationActive={false} />
            <Area type="monotone" dataKey="val" stroke={color} strokeWidth={2} fill={`url(#${gid})`} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ROISplit({ transactions }: { transactions: { roi_flag: string; amount: number; date: string }[] }) {
  const last30 = transactions.filter(t => daysAgo(t.date) <= 30);
  const g = { '+': 0, '0': 0, '-': 0 };
  last30.forEach(t => { g[t.roi_flag as keyof typeof g] += t.amount; });
  const total = g['+'] + g['0'] + g['-'] || 1;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] mb-2">ROI Split</div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div style={{ width: `${(g['+'] / total) * 100}%`, background: 'var(--neon-green)', borderRadius: 4 }} />
        <div style={{ width: `${(g['0'] / total) * 100}%`, background: 'var(--text3)', borderRadius: 4 }} />
        <div style={{ width: `${(g['-'] / total) * 100}%`, background: 'var(--neon-red)', borderRadius: 4 }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] font-mono-data">
        <span style={{ color: 'var(--neon-green)' }}>+{Math.round(g['+'])}</span>
        <span style={{ color: 'var(--text3)' }}>~{Math.round(g['0'])}</span>
        <span style={{ color: 'var(--neon-red)' }}>-{Math.round(g['-'])}</span>
      </div>
    </div>
  );
}
