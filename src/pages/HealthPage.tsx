import { useMemo, useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Heart, Moon, Footprints, Droplets, Flame, Scale, Activity, Zap } from 'lucide-react';
import { CrosshairCursor, FloatingTooltip, MultiTooltip } from '../components/ChartCrosshair';
import { f, fDateShort, workoutEmoji } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

type Period = '7d' | '14d' | '30d' | 'all';

export default function HealthPage({ data }: { data: LifeOSData }) {
  const [period, setPeriod] = useState<Period>('30d');

  const filtered = useMemo(() => {
    if (period === 'all') return data.health;
    const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    return data.health.slice(-days);
  }, [data.health, period]);

  const weightBf = useMemo(() => filtered.filter(h => h.weight_kg || h.body_fat_pct).map(h => ({
    date: fDateShort(h.date), weight: h.weight_kg, bf: h.body_fat_pct,
  })), [filtered]);

  const sleepHrv = useMemo(() => filtered.filter(h => h.sleep_score || h.hrv).map(h => ({
    date: fDateShort(h.date), sleep: h.sleep_score, hrv: h.hrv,
  })), [filtered]);

  const heartData = useMemo(() => filtered.filter(h => h.rhr).map(h => ({
    date: fDateShort(h.date), rhr: h.rhr,
  })), [filtered]);

  const stepsData = useMemo(() => filtered.filter(h => h.steps).map(h => ({
    date: fDateShort(h.date), steps: h.steps,
  })), [filtered]);

  const nutritionByDay = useMemo(() => {
    const map = new Map<string, { cal: number; protein: number; water: number; carbs: number; fat: number }>();
    data.nutrition.forEach(n => {
      const cur = map.get(n.date) || { cal: 0, protein: 0, water: 0, carbs: 0, fat: 0 };
      cur.cal += n.calories; cur.protein += n.protein_g; cur.water += n.water_ml;
      cur.carbs += n.carbs_g; cur.fat += n.fat_g;
      map.set(n.date, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({ date: fDateShort(date), ...v }));
  }, [data.nutrition]);

  const latest = (field: string) => {
    for (let i = data.health.length - 1; i >= 0; i--) {
      const v = (data.health[i] as any)[field];
      if (v != null) return v;
    }
    return null;
  };

  const periods: { key: Period; label: string }[] = [
    { key: '7d', label: '7D' }, { key: '14d', label: '14D' },
    { key: '30d', label: '30D' }, { key: 'all', label: 'All' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div className="anim-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="font-display" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} style={{ color: 'var(--neon-green)' }} /> Health
        </h2>
        <div className="tab-bar">
          {periods.map(p => (
            <button key={p.key} className={`tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }} className="sm:!grid-cols-4 lg:!grid-cols-8">
        <KpiMini label="Weight" value={f(latest('weight_kg'))} unit="kg" color="var(--neon-blue)" icon={<Scale size={12} />} />
        <KpiMini label="Body Fat" value={f(latest('body_fat_pct'))} unit="%" color="var(--neon-orange)" icon={<Flame size={12} />} />
        <KpiMini label="Visceral" value={f(latest('visceral_fat'), 0)} unit="" color="var(--neon-red)" icon={<Heart size={12} />} />
        <KpiMini label="RHR" value={f(latest('rhr'), 0)} unit="bpm" color="var(--neon-red)" icon={<Heart size={12} />} />
        <KpiMini label="HRV" value={f(latest('hrv'), 0)} unit="ms" color="var(--neon-green)" icon={<Zap size={12} />} />
        <KpiMini label="Sleep" value={f(latest('sleep_score'), 0)} unit="" color="var(--neon-purple)" icon={<Moon size={12} />} />
        <KpiMini label="Steps" value={latest('steps') ? `${(latest('steps') / 1000).toFixed(1)}k` : '—'} unit="" color="var(--neon-yellow)" icon={<Footprints size={12} />} />
        <KpiMini label="Water" value={f(latest('water_pct'))} unit="%" color="var(--neon-blue)" icon={<Droplets size={12} />} />
      </div>

      {/* Weight + Body Fat */}
      <div className="glass anim-fade d2" style={{ padding: 16 }}>
        <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Weight & Body Fat</h3>
        <div className="chart-fluid" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={weightBf}>
              <Tooltip cursor={<CrosshairCursor />} content={<MultiTooltip />} isAnimationActive={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="w" orientation="left" domain={['auto', 'auto']} axisLine={false} tickLine={false} width={32} />
              <YAxis yAxisId="bf" orientation="right" domain={['auto', 'auto']} axisLine={false} tickLine={false} width={32} />
              <Line yAxisId="w" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls />
              <Line yAxisId="bf" type="monotone" dataKey="bf" name="Body Fat (%)" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 3" activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sleep & HRV + RHR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }} className="lg:!grid-cols-2">
        <div className="glass anim-fade d3" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Sleep & HRV</h3>
          <div className="chart-fluid" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={sleepHrv}>
                <Tooltip cursor={<CrosshairCursor />} content={<MultiTooltip />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Line type="monotone" dataKey="sleep" name="Sleep Score" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#00ff88" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass anim-fade d4" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Resting Heart Rate</h3>
          <div className="chart-fluid" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={heartData}>
                <defs>
                  <linearGradient id="gRhr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3b3b" stopOpacity={0.25} /><stop offset="95%" stopColor="#ff3b3b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="bpm" color="#ff3b3b" />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Area type="monotone" dataKey="rhr" stroke="#ff3b3b" strokeWidth={2.5} fill="url(#gRhr)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Steps + Nutrition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }} className="lg:!grid-cols-2">
        <div className="glass anim-fade d5" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Daily Steps</h3>
          <div className="chart-fluid" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stepsData}>
                <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="steps" color="#facc15" />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                  {stepsData.map((d, i) => (
                    <Cell key={i} fill={(d.steps ?? 0) >= 8000 ? '#00ff88' : (d.steps ?? 0) >= 5000 ? '#facc15' : '#ff3b3b'} fillOpacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass anim-fade d6" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Daily Calories & Protein</h3>
          <div className="chart-fluid" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={nutritionByDay}>
                <Tooltip cursor={<CrosshairCursor />} content={<MultiTooltip />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Bar dataKey="cal" name="Calories" fill="#f59e0b" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="protein" name="Protein (g)" fill="#00ff88" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workouts Log */}
      <div className="glass anim-fade d7" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Activity size={16} style={{ color: 'var(--neon-green)' }} />
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Workout Log</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.workouts.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{workoutEmoji(w.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{w.type.replace(/[_+]/g, ' ')}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3 }}>{w.notes || 'No notes'}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="font-mono-data" style={{ fontSize: 13, fontWeight: 700 }}>
                  {w.duration_min ? `${Math.round(w.duration_min)}min` : ''}
                  {w.distance_km ? ` · ${w.distance_km}km` : ''}
                </div>
                <div className="font-mono-data" style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {w.heart_rate_avg && <span style={{ color: w.heart_rate_avg > 160 ? 'var(--neon-red)' : 'var(--neon-green)' }}>♥{w.heart_rate_avg} </span>}
                  {fDateShort(w.date)}
                </div>
              </div>
            </div>
          ))}
          {!data.workouts.length && <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>No workouts logged yet</p>}
        </div>
      </div>
    </div>
  );
}

function KpiMini({ label, value, unit, color, icon }: { label: string; value: string; unit: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="glass accent-strip anim-fade" style={{ '--strip-color': color, padding: 12 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)' }}>{label}</span>
      </div>
      <div className="font-mono-data" style={{ fontWeight: 800, fontSize: 18 }}>
        {value}
        {unit && <span style={{ fontSize: 10, color: 'var(--text2)', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}
