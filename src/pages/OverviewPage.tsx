import { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Heart, Flame, Footprints, Moon, Wallet, Calendar } from 'lucide-react';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { f, fDateShort, d, dColor, categoryEmoji } from '../lib/helpers';
import type { LifeOSData, Page } from '../lib/types';

interface Props {
  data: LifeOSData;
  onNavigate: (p: Page) => void;
}

export default function OverviewPage({ data, onNavigate }: Props) {
  const latest = data.health[data.health.length - 1];
  const prev = data.health.length > 1 ? data.health[data.health.length - 2] : null;

  const weightData = useMemo(() =>
    data.health.filter(h => h.weight_kg).map(h => ({ date: fDateShort(h.date), val: h.weight_kg })),
    [data.health]
  );

  const todayNutrition = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const meals = data.nutrition.filter(n => n.date === today);
    return {
      calories: meals.reduce((s, m) => s + m.calories, 0),
      protein: meals.reduce((s, m) => s + m.protein_g, 0),
      water: meals.reduce((s, m) => s + m.water_ml, 0),
    };
  }, [data.nutrition]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return data.events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [data.events]);

  const recentSpending = useMemo(() => {
    return [...data.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [data.transactions]);

  const stats = [
    { label: 'Weight', value: f(latest?.weight_kg ?? null), unit: 'kg', icon: <TrendingDown size={16} />,
      delta: d(latest?.weight_kg ?? null, prev?.weight_kg ?? null), lowerBetter: true, color: 'var(--neon-blue)' },
    { label: 'Body Fat', value: f(latest?.body_fat_pct ?? null), unit: '%', icon: <Flame size={16} />,
      delta: d(latest?.body_fat_pct ?? null, prev?.body_fat_pct ?? null), lowerBetter: true, color: 'var(--neon-orange)' },
    { label: 'RHR', value: f(latest?.rhr ?? null, 0), unit: 'bpm', icon: <Heart size={16} />,
      delta: d(latest?.rhr ?? null, prev?.rhr ?? null), lowerBetter: true, color: 'var(--neon-red)' },
    { label: 'HRV', value: f(latest?.hrv ?? null, 0), unit: 'ms', icon: <Heart size={16} />,
      delta: d(latest?.hrv ?? null, prev?.hrv ?? null), lowerBetter: false, color: 'var(--neon-green)' },
    { label: 'Sleep', value: f(latest?.sleep_score ?? null, 0), unit: '', icon: <Moon size={16} />,
      delta: d(latest?.sleep_score ?? null, prev?.sleep_score ?? null), lowerBetter: false, color: 'var(--neon-purple)' },
    { label: 'Steps', value: latest?.steps ? `${(latest.steps / 1000).toFixed(1)}k` : '—', unit: '', icon: <Footprints size={16} />,
      delta: d(latest?.steps ?? null, prev?.steps ?? null), lowerBetter: false, color: 'var(--neon-yellow)' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <div key={s.label}
            className={`glass p-4 relative overflow-hidden trading-card cursor-pointer anim-fade d${i + 1}`}
            onClick={() => onNavigate('health')}>
            <div className="accent-strip" style={{ background: s.color }} />
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.06]"
              style={{ background: s.color }} />
            <div className="flex items-center gap-1.5 mb-2" style={{ color: s.color }}>
              {s.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)]">{s.label}</span>
            </div>
            <div className="font-mono-data font-black text-xl">{s.value}
              {s.unit && <span className="text-xs text-[var(--text2)] ml-1">{s.unit}</span>}
            </div>
            {s.delta != null && (
              <div className="font-mono-data text-xs mt-1" style={{ color: dColor(s.delta, s.lowerBetter) }}>
                {s.delta > 0 ? '+' : ''}{s.delta.toFixed(1)}
                {s.delta !== 0 && (s.delta > 0 === !s.lowerBetter
                  ? <TrendingUp size={10} style={{ display: 'inline', marginLeft: 2 }} />
                  : <TrendingDown size={10} style={{ display: 'inline', marginLeft: 2 }} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Weight Chart */}
        <div className="lg:col-span-8 glass p-5 anim-fade d3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Weight Trend</h3>
            <span className="chip text-[10px]" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--neon-blue)' }}>
              {data.health.length} days
            </span>
          </div>
          <div className="chart-fluid" style={{ height: 200, '--chart-accent': 'rgba(59,130,246,0.4)' } as any}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="gWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={<CrosshairCursor />}
                  content={<FloatingTooltip unit="kg" color="#3b82f6" />}
                  isAnimationActive={false} />
                <Area type="monotone" dataKey="val"
                  stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#gWeight)"
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Nutrition */}
        <div className="lg:col-span-4 glass p-5 anim-fade d4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Flame size={16} style={{ color: 'var(--neon-orange)' }} /> Today
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[var(--text2)] text-xs">Calories</span>
              <span className="font-mono-data font-black text-lg">{todayNutrition.calories || '—'}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${Math.min(100, (todayNutrition.calories / 2200) * 100)}%`,
                background: todayNutrition.calories > 2200 ? 'var(--neon-red)' : 'var(--neon-green)',
              }} />
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[var(--text2)] text-xs">Protein</span>
              <span className="font-mono-data font-bold">{todayNutrition.protein || '—'}g</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[var(--text2)] text-xs">Water</span>
              <span className="font-mono-data font-bold">{todayNutrition.water ? `${(todayNutrition.water / 1000).toFixed(1)}L` : '—'}</span>
            </div>
          </div>

          {/* Upcoming Events */}
          <h3 className="font-bold text-sm mt-6 mb-3 flex items-center gap-2">
            <Calendar size={16} style={{ color: 'var(--neon-purple)' }} /> Upcoming
          </h3>
          <div className="space-y-2">
            {upcomingEvents.length === 0 && <div className="text-xs text-[var(--text3)]">No upcoming events</div>}
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80"
                onClick={() => onNavigate('calendar')}>
                <span>{categoryEmoji(e.type)}</span>
                <span className="truncate flex-1">{e.title}</span>
                <span className="font-mono-data text-[var(--text3)] shrink-0">{fDateShort(e.date)}</span>
              </div>
            ))}
          </div>

          {/* Recent Spending */}
          <h3 className="font-bold text-sm mt-6 mb-3 flex items-center gap-2">
            <Wallet size={16} style={{ color: 'var(--neon-green)' }} /> Recent
          </h3>
          <div className="space-y-2">
            {recentSpending.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80"
                onClick={() => onNavigate('finance')}>
                <span>{categoryEmoji(t.category)}</span>
                <span className="truncate flex-1">{t.description}</span>
                <span className="font-mono-data font-bold" style={{ color: t.roi_flag === '-' ? 'var(--neon-red)' : 'var(--text)' }}>
                  {t.amount} lei
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
