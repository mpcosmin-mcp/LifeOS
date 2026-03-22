import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { categoryEmoji, daysAgo, fDateShort } from '../lib/helpers';
import type { LifeOSData, Transaction } from '../lib/types';

const INCOME = 7000;
const FIXED = [
  { l: 'Chirie', v: 1000 },
  { l: 'Rată Credit', v: 2200 },
  { l: 'Mamă', v: 500 },
  { l: 'Subscripții', v: 595 },
  { l: 'Transport', v: 200 },
];
const FIXED_TOTAL = FIXED.reduce((s, x) => s + x.v, 0);
const FLEXIBLE = INCOME - FIXED_TOTAL; // 2505

const BUDGETS: Record<string, number> = {
  food: 600,
  vices: 0,
  other: 500,
  health: 200,
  social: 200,
};

const NEEDS = ['subscriptions', 'transport'];
const WANTS = ['food', 'social', 'vices', 'other', 'health'];

export default function FinancePage({ data }: { data: LifeOSData }) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const timePct = (dayOfMonth / daysInMonth) * 100;

  const moTx = useMemo(() => {
    const mo = now.toISOString().substring(0, 7);
    return data.transactions.filter(t => t.date.substring(0, 7) === mo);
  }, [data]);

  const totalSpent = Math.round(moTx.reduce((s, t) => s + t.amount, 0));
  const savingsRate = Math.max(0, Math.round(((INCOME - FIXED_TOTAL - totalSpent) / INCOME) * 100));

  // ROI split
  const roi = useMemo(() => {
    const g = { '+': 0, '0': 0, '-': 0 };
    moTx.forEach(t => { g[t.roi_flag as keyof typeof g] = (g[t.roi_flag as keyof typeof g] || 0) + t.amount; });
    return g;
  }, [moTx]);

  // Category breakdown
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    moTx.forEach(t => m.set(t.category || 'other', (m.get(t.category || 'other') || 0) + t.amount));
    return [...m.entries()].map(([n, v]) => ({ n, v: Math.round(v) })).sort((a, b) => b.v - a.v);
  }, [moTx]);

  // Micro spending (<50 lei)
  const micro = useMemo(() => {
    const small = moTx.filter(t => t.amount < 50);
    return { count: small.length, total: Math.round(small.reduce((s, t) => s + t.amount, 0)) };
  }, [moTx]);

  // Day-of-week heatmap
  const dowMap = useMemo(() => {
    const days = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    moTx.forEach(t => {
      const d = new Date(t.date).getDay();
      totals[d] += t.amount;
      counts[d]++;
    });
    const max = Math.max(...totals, 1);
    return days.map((name, i) => ({ name, total: Math.round(totals[i]), count: counts[i], pct: totals[i] / max }));
  }, [moTx]);

  // Daily spending for calendar heatmap
  const dailySpend = useMemo(() => {
    const m = new Map<number, number>();
    moTx.forEach(t => {
      const day = parseInt(t.date.split('-')[2]);
      m.set(day, (m.get(day) || 0) + t.amount);
    });
    const max = Math.max(...m.values(), 1);
    return { map: m, max };
  }, [moTx]);

  // Subscriptions annualized
  const subs = useMemo(() => {
    return moTx.filter(t => t.category === 'subscriptions').map(t => ({
      name: t.description,
      monthly: t.amount,
      annual: t.amount * 12,
    }));
  }, [moTx]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wallet size={20} style={{ color: 'var(--green)' }} /> Finance
      </h2>

      {/* ═══ 1. REALITY CHECK — Hero ═══ */}
      <div className="panel fade d1" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 12, display: 'block', color: 'var(--t2)' }}>Reality Check</span>

        {/* Cashflow bars */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Income</div>
            <div style={{ height: 24, background: 'var(--green-bg)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: 'var(--green)', opacity: 0.3, borderRadius: 4 }} />
              <span className="font-data" style={{ position: 'absolute', right: 8, top: 4, fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>{INCOME} lei</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Spent (fixed + variable)</div>
            <div style={{ height: 24, background: 'var(--bg3)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((FIXED_TOTAL + totalSpent) / INCOME) * 100}%`, background: (FIXED_TOTAL + totalSpent) > INCOME ? 'var(--red)' : 'var(--t2)', opacity: 0.3, borderRadius: 4 }} />
              <span className="font-data" style={{ position: 'absolute', right: 8, top: 4, fontSize: 12, fontWeight: 800, color: 'var(--t1)' }}>{FIXED_TOTAL + totalSpent} lei</span>
            </div>
          </div>
        </div>

        {/* Savings rate gauge */}
        <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Savings Rate</div>
          <div className="font-data" style={{
            fontSize: 42, fontWeight: 800, lineHeight: 1.1,
            color: savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--amber)' : 'var(--red)',
          }}>
            {savingsRate}<span style={{ fontSize: 16, color: 'var(--t3)' }}>%</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--t3)' }}>Target: 20%</div>
          <div className="bar-track" style={{ height: 6, maxWidth: 200, margin: '6px auto 0' }}>
            <div className="bar-fill" style={{
              width: `${Math.min(100, (savingsRate / 20) * 100)}%`,
              background: savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--amber)' : 'var(--red)',
            }} />
          </div>
        </div>

        {/* ROI split */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>ROI Split</div>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, gap: 2 }}>
            {['+', '0', '-'].map(k => {
              const v = roi[k as keyof typeof roi] || 0;
              return <div key={k} style={{
                width: `${(v / (totalSpent || 1)) * 100}%`,
                background: k === '+' ? 'var(--green)' : k === '-' ? 'var(--red)' : 'var(--t3)',
                borderRadius: 3, opacity: 0.6,
              }} />;
            })}
          </div>
          <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 9 }}>
            <span style={{ color: 'var(--green)' }}>+ROI {Math.round(roi['+'])} lei</span>
            <span style={{ color: 'var(--t3)' }}>Neutral {Math.round(roi['0'])} lei</span>
            <span style={{ color: 'var(--red)' }}>−ROI {Math.round(roi['-'])} lei</span>
          </div>
        </div>
      </div>

      {/* ═══ 2. PACING BARS — Budget vs Reality ═══ */}
      <div className="panel fade d2" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 10, display: 'block', color: 'var(--t2)' }}>Budget vs Reality</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {byCat.filter(c => c.n !== 'subscriptions').map(c => {
            const budget = BUDGETS[c.n] || 300;
            const spentPct = (c.v / budget) * 100;
            const overpace = spentPct > timePct;
            return (
              <div key={c.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{categoryEmoji(c.n)}</span>
                    <span style={{ textTransform: 'capitalize' }}>{c.n}</span>
                  </span>
                  <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: overpace ? 'var(--red)' : 'var(--t1)' }}>
                    {c.v}<span style={{ color: 'var(--t3)', fontWeight: 400 }}>/{budget} lei</span>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div className="bar-track" style={{ height: 8 }}>
                    <div className="bar-fill" style={{
                      width: `${Math.min(100, spentPct)}%`,
                      background: overpace ? 'var(--red)' : c.v > budget * 0.8 ? 'var(--amber)' : 'var(--green)',
                      opacity: 0.6,
                    }} />
                  </div>
                  {/* Time pacing line */}
                  <div style={{
                    position: 'absolute', top: -2, bottom: -2,
                    left: `${timePct}%`,
                    width: 2, background: 'var(--t1)', borderRadius: 1, opacity: 0.4,
                  }} />
                </div>
                <div style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2, textAlign: 'right' }}>
                  {overpace ? '⚠️ ahead of pace' : `${Math.round(budget - c.v)} lei remaining`}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 8, color: 'var(--t3)', textAlign: 'center', marginTop: 4 }}>
            Vertical line = day {dayOfMonth}/{daysInMonth} ({Math.round(timePct)}% through month)
          </div>
        </div>
      </div>

      {/* ═══ 3. BLIND SPOTS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="finance-blindspots">
        {/* Subscriptions annualized */}
        <div className="panel fade d3" style={{ padding: 16 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block', color: 'var(--t2)' }}>Subscriptions</span>
          {subs.length === 0 && <div style={{ fontSize: 10, color: 'var(--t3)' }}>None logged</div>}
          {subs.map(s => (
            <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{s.name}</span>
              <div style={{ textAlign: 'right' }}>
                <span className="font-data" style={{ fontWeight: 600 }}>{s.monthly} lei/mo</span>
                <div style={{ fontSize: 8, color: 'var(--amber)' }}>{s.annual} lei/yr</div>
              </div>
            </div>
          ))}
          {subs.length > 0 && (
            <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 6, background: 'var(--amber-bg)', textAlign: 'center' }}>
              <span className="font-data" style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>
                {subs.reduce((s, x) => s + x.annual, 0)} lei/year
              </span>
              <div style={{ fontSize: 8, color: 'var(--t3)' }}>total annual cost</div>
            </div>
          )}
        </div>

        {/* Micro spending (Factor Latte) */}
        <div className="panel fade d3" style={{ padding: 16 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block', color: 'var(--t2)' }}>Micro Spending (&lt;50 lei)</span>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="font-data" style={{ fontSize: 28, fontWeight: 800, color: micro.total > 300 ? 'var(--red)' : 'var(--t1)' }}>
              {micro.total}<span style={{ fontSize: 12, color: 'var(--t3)' }}> lei</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>{micro.count} transactions</div>
            <div style={{ marginTop: 6, fontSize: 9, color: 'var(--amber)', fontWeight: 600 }}>
              ≈ {micro.total * 12} lei/year at this pace
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 4. BEHAVIORAL PATTERNS ═══ */}
      <div className="panel fade d4" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 10, display: 'block', color: 'var(--t2)' }}>Spending Patterns</span>

        {/* Day-of-week heatmap */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>By Day of Week</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {dowMap.map(d => (
              <div key={d.name} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: 'var(--t3)', marginBottom: 3, fontWeight: 600 }}>{d.name}</div>
                <div style={{
                  height: 32, borderRadius: 4,
                  background: d.total === 0 ? 'var(--bg3)' : `rgba(156, 107, 94, ${0.15 + d.pct * 0.7})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="font-data" style={{ fontSize: 9, fontWeight: 700, color: d.pct > 0.6 ? '#fff' : 'var(--t2)' }}>
                    {d.total || '—'}
                  </span>
                </div>
                <div style={{ fontSize: 7, color: 'var(--t3)', marginTop: 2 }}>{d.count}tx</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar heatmap */}
        <div>
          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Daily Heatmap — {now.toLocaleString('ro-RO', { month: 'long' })}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const spent = dailySpend.map.get(day) || 0;
              const intensity = spent / dailySpend.max;
              const isToday = day === dayOfMonth;
              const isFuture = day > dayOfMonth;
              return (
                <div key={day} style={{
                  aspectRatio: '1', borderRadius: 4, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: isFuture ? 'var(--bg)' : spent === 0 ? 'var(--green-bg)' : `rgba(156, 107, 94, ${0.1 + intensity * 0.65})`,
                  border: isToday ? '2px solid var(--t1)' : '1px solid var(--border)',
                  opacity: isFuture ? 0.4 : 1,
                }}>
                  <span style={{ fontSize: 8, fontWeight: 600, color: intensity > 0.5 ? '#fff' : 'var(--t2)' }}>{day}</span>
                  {spent > 0 && <span className="font-data" style={{ fontSize: 7, fontWeight: 700, color: intensity > 0.5 ? '#fff' : 'var(--t1)' }}>{Math.round(spent)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ 5. TRANSACTIONS LOG ═══ */}
      <div className="panel fade d5" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block', color: 'var(--t2)' }}>Recent Transactions</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.transactions.slice(0, 20).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
              <span style={{
                color: t.roi_flag === '+' ? 'var(--green)' : t.roi_flag === '-' ? 'var(--red)' : 'var(--t3)',
                fontWeight: 700, width: 10, textAlign: 'center',
              }}>{t.roi_flag}</span>
              <span style={{ fontSize: 8, color: 'var(--t3)', textTransform: 'capitalize', width: 50, flexShrink: 0 }}>{t.category}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</span>
              <span className="font-data" style={{ fontWeight: 700, flexShrink: 0 }}>{t.amount}</span>
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(t.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
