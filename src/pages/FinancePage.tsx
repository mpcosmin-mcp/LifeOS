import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { categoryEmoji, daysAgo, fDateShort } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

export default function FinancePage({ data }: { data: LifeOSData }) {
  const tx30 = useMemo(() => data.transactions.filter(t => daysAgo(t.date) <= 30), [data]);
  const total = useMemo(() => Math.round(tx30.reduce((s, t) => s + t.amount, 0)), [tx30]);
  const byCat = useMemo(() => {
    const m = new Map<string, number>(); tx30.forEach(t => m.set(t.category || 'other', (m.get(t.category || 'other') || 0) + t.amount));
    return [...m.entries()].map(([n, v]) => ({ n, v: Math.round(v) })).sort((a, b) => b.v - a.v);
  }, [tx30]);
  const roi = useMemo(() => { const g = { '+': 0, '0': 0, '-': 0 }; tx30.forEach(t => { g[t.roi_flag as keyof typeof g] += t.amount; }); return g; }, [tx30]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wallet size={20} style={{ color: 'var(--green)' }} /> Finance
      </h2>
      <div className="panel fade d1" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--t2)' }}>Last 30 days</span>
          <span className="font-data" style={{ fontSize: 18, fontWeight: 800, color: total > 2500 ? 'var(--red)' : 'var(--t1)' }}>{total} lei</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {byCat.map(c => (
            <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12 }}>{categoryEmoji(c.n)}</span>
              <span style={{ fontSize: 10, color: 'var(--t2)', textTransform: 'capitalize', width: 60, flexShrink: 0 }}>{c.n}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="bar-track"><div className="bar-fill" style={{ width: `${(c.v / (byCat[0]?.v || 1)) * 100}%`, background: 'var(--cyan)' }} /></div></div>
              <span className="font-data" style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>{c.v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>ROI Split</div>
          <div style={{ display: 'flex', height: 3, borderRadius: 2, gap: 1 }}>
            {['+', '0', '-'].map(k => <div key={k} style={{ width: `${(roi[k as keyof typeof roi] / (total || 1)) * 100}%`, background: k === '+' ? 'var(--green)' : k === '-' ? 'var(--red)' : 'var(--t3)', borderRadius: 2 }} />)}
          </div>
          <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 8 }}>
            <span style={{ color: 'var(--green)' }}>+{Math.round(roi['+'])}</span>
            <span style={{ color: 'var(--t3)' }}>~{Math.round(roi['0'])}</span>
            <span style={{ color: 'var(--red)' }}>-{Math.round(roi['-'])}</span>
          </div>
        </div>
      </div>
      <div className="panel fade d2" style={{ padding: 14 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Transactions</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.transactions.slice(0, 20).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
              <span style={{ color: t.roi_flag === '+' ? 'var(--green)' : t.roi_flag === '-' ? 'var(--red)' : 'var(--t3)', fontWeight: 700, width: 8 }}>{t.roi_flag}</span>
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
