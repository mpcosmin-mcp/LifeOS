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
    subscriptions: '#a855f7', household: '#f59e0b', health: '#facc15', other: '#475569',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="font-display anim-fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={20} style={{ color: 'var(--neon-green)' }} /> Finance
        </h2>
        <div className="tab-bar">
          {(['7d', '30d', 'all'] as TimeFilter[]).map(p => (
            <button key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p === 'all' ? 'All' : p.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }} className="sm:!grid-cols-4">
        <SummaryCard label="Total Spent" value={`${Math.round(totalSpent)} lei`} color="var(--text1)" />
        <SummaryCard label="+ROI" value={`${Math.round(roiStats['+'].amount)} lei`} sub={`${roiStats['+'].count} txns`} color="var(--neon-green)" />
        <SummaryCard label="Neutral" value={`${Math.round(roiStats['0'].amount)} lei`} sub={`${roiStats['0'].count} txns`} color="var(--text3)" />
        <SummaryCard label="-ROI" value={`${Math.round(roiStats['-'].amount)} lei`} sub={`${roiStats['-'].count} txns`} color="var(--neon-red)" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }} className="lg:!grid-cols-2">
        <div className="glass anim-fade d2" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Daily Spending</h3>
          <div className="chart-fluid" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={dailySpending}>
                <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="lei" color="#00ff88" />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#00ff88" fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass anim-fade d3" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Cumulative</h3>
          <div className="chart-fluid" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={cumulative}>
                <defs><linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <Tooltip cursor={<CrosshairCursor />} content={<FloatingTooltip unit="lei" color="#3b82f6" />} isAnimationActive={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gCum)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass anim-fade d4" style={{ padding: 16 }}>
        <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>By Category</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {byCat.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minHeight: 32 }}
              onClick={() => setCatFilter(catFilter === c.name ? 'all' : c.name)}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{categoryEmoji(c.name)}</span>
              <span style={{
                fontSize: 11, textTransform: 'capitalize', width: 64, flexShrink: 0,
                color: catFilter === c.name ? 'var(--neon-blue)' : 'var(--text2)',
                fontWeight: catFilter === c.name ? 700 : 400,
              }}>{c.name}</span>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${(c.total / (byCat[0]?.total || 1)) * 100}%`, background: colors[c.name] || '#475569' }} /></div>
              <span className="font-mono-data" style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{Math.round(c.total)}</span>
              <span className="font-mono-data" style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{c.count}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass anim-fade d5" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Transactions</h3>
          <span className="chip">{filtered.length} items</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
          {filtered.slice(0, 20).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{categoryEmoji(t.category)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{t.category} · {fDateShort(t.date)}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="font-mono-data" style={{ fontSize: 13, fontWeight: 700, color: roiColor(t.roi_flag) }}>{t.amount} lei</div>
                <div className="font-mono-data" style={{ fontSize: 10, color: roiColor(t.roi_flag) }}>
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
    <div className="glass anim-fade" style={{ padding: 12 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div className="font-mono-data" style={{ fontWeight: 800, fontSize: 16, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
