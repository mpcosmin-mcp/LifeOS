import { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { fDateShort, categoryEmoji, roiColor, daysAgo } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

type TimeFilter = '7d' | '30d' | 'all';

export default function FinancePage({ data }: { data: LifeOSData }) {
  const [period, setPeriod] = useState<TimeFilter>('30d');
  const [catFilter, setCatFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let txns = data.transactions;
    if (period !== 'all') {
      const days = period === '7d' ? 7 : 30;
      txns = txns.filter(t => daysAgo(t.date) <= days);
    }
    if (catFilter !== 'all') txns = txns.filter(t => t.category === catFilter);
    return txns;
  }, [data.transactions, period, catFilter]);

  const totalSpent = filtered.reduce((s, t) => s + t.amount, 0);

  const dailySpending = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => map.set(t.date, (map.get(t.date) || 0) + t.amount));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date: fDateShort(date), amount: Math.round(amount) }));
  }, [filtered]);

  const cumulative = useMemo(() => {
    let sum = 0;
    return dailySpending.map(d => { sum += d.amount; return { ...d, cumulative: sum }; });
  }, [dailySpending]);

  const byCat = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filtered.forEach(t => {
      const cat = t.category || 'other';
      const cur = map.get(cat) || { total: 0, count: 0 };
      cur.total += t.amount; cur.count++;
      map.set(cat, cur);
    });
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const roiStats = useMemo(() => {
    const g = { '+': { amount: 0, count: 0 }, '0': { amount: 0, count: 0 }, '-': { amount: 0, count: 0 } };
    filtered.forEach(t => { const r = g[t.roi_flag as keyof typeof g]; if (r) { r.amount += t.amount; r.count++; } });
    return g;
  }, [filtered]);

  const colors: Record<string, string> = {
    food: '#00ff88', social: '#ec4899', transport: '#3b82f6',
    subscriptions: '#a855f7', household: '#f97316', health: '#facc15', other: '#475569',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 anim-fade">
        <h2 className="font-black text-xl flex items-center gap-2"><Wallet size={20} style={{ color: 'var(--neon-green)' }} /> Finance</h2>
        <div className="tab-bar">
          {(['7d', '30d', 'all'] as TimeFilter[]).map(p => (
            <button key={p} className={`tab ${period === p ? 'on' : ''}`} onClick={() => setPeriod(p)}>{p === 'all' ? 'All' : p.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards — 2 cols mobile, 4 tablet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        <SummaryCard label="Total Spent" value={`${Math.round(totalSpent)} lei`} color="var(--text)" />
        <SummaryCard label="+ROI" value={`${Math.round(roiStats['+'].amount)} lei`} sub={`${roiStats['+'].count} txns`} color="var(--neon-green)" />
        <SummaryCard label="Neutral" value={`${Math.round(roiStats['0'].amount)} lei`} sub={`${roiStats['0'].count} txns`} color="var(--text3)" />
        <SummaryCard label="-ROI" value={`${Math.round(roiStats['-'].amount)} lei`} sub={`${roiStats['-'].count} txns`} color="var(--neon-red)" />
      </div>

      {/* Charts — stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass p-4 md:p-5 anim-fade d2">
          <h3 className="font-bold text-sm mb-3">Daily Spending</h3>
          <div className="chart-fluid h-[160px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={dailySpending}>
                <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="lei" color="#00ff88" />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} interval="preserveStartEnd" />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#00ff88" fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-4 md:p-5 anim-fade d3">
          <h3 className="font-bold text-sm mb-3">Cumulative</h3>
          <div className="chart-fluid h-[160px] md:h-[200px]" style={{ '--chart-accent': 'rgba(59,130,246,0.4)' } as any}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={cumulative}>
                <defs><linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="lei" color="#3b82f6" />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} interval="preserveStartEnd" />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gCum)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass p-4 md:p-5 anim-fade d4">
        <h3 className="font-bold text-sm mb-3">By Category</h3>
        <div className="space-y-2">
          {byCat.map(c => (
            <div key={c.name} className="flex items-center gap-2 md:gap-3 cursor-pointer min-h-[36px]" onClick={() => setCatFilter(catFilter === c.name ? 'all' : c.name)}>
              <span className="text-base shrink-0">{categoryEmoji(c.name)}</span>
              <span className={`text-[11px] md:text-sm capitalize w-16 md:w-24 ${catFilter === c.name ? 'text-[var(--neon-blue)] font-bold' : 'text-[var(--text2)]'}`}>{c.name}</span>
              <div className="flex-1 min-w-0"><div className="progress-track"><div className="progress-fill" style={{ width: `${(c.total / (byCat[0]?.total || 1)) * 100}%`, background: colors[c.name] || '#475569' }} /></div></div>
              <span className="font-mono-data text-xs font-bold shrink-0">{Math.round(c.total)}</span>
              <span className="font-mono-data text-[10px] text-[var(--text3)] shrink-0">{c.count}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass p-4 md:p-5 anim-fade d5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Transactions</h3>
          <span className="chip text-[10px]" style={{ background: 'rgba(255,255,255,0.06)' }}>{filtered.length} items</span>
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {filtered.map(t => (
            <div key={t.id} className="flex items-center gap-2 md:gap-3 py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-sm shrink-0">{categoryEmoji(t.category)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] md:text-sm leading-tight">{t.description}</div>
                <div className="text-[10px] text-[var(--text3)]">{t.category} · {fDateShort(t.date)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono-data text-sm font-bold" style={{ color: roiColor(t.roi_flag) }}>{t.amount} lei</div>
                <div className="text-[10px] font-mono-data" style={{ color: roiColor(t.roi_flag) }}>
                  {t.roi_flag === '+' ? '+ROI' : t.roi_flag === '-' ? '-ROI' : '~'}
                  {t.quantity ? ` · ${t.quantity}x` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass p-3 md:p-4 anim-fade">
      <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] mb-1">{label}</div>
      <div className="font-mono-data font-black text-base md:text-lg" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--text3)]">{sub}</div>}
    </div>
  );
}
