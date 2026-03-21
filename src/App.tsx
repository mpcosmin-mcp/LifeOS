import { useState, useEffect } from 'react';
import { Activity, Wallet, Calendar, Brain, LayoutDashboard, Plus } from 'lucide-react';
import { fetchLifeOSData } from './lib/data';
import type { LifeOSData, Page } from './lib/types';
import OverviewPage from './pages/OverviewPage';
import HealthPage from './pages/HealthPage';
import FinancePage from './pages/FinancePage';
import CalendarPage from './pages/CalendarPage';
import MindPage from './pages/MindPage';
import InputPage from './pages/InputPage';

type AppPage = Page | 'input';

const NAV: { key: AppPage; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Home', icon: LayoutDashboard },
  { key: 'health', label: 'Health', icon: Activity },
  { key: 'finance', label: 'Money', icon: Wallet },
  { key: 'calendar', label: 'Events', icon: Calendar },
  { key: 'psychology', label: 'Mind', icon: Brain },
  { key: 'input', label: 'Log', icon: Plus },
];

export default function App() {
  const [page, setPage] = useState<AppPage>('overview');
  const [data, setData] = useState<LifeOSData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => { fetchLifeOSData().then(d => { setData(d); setLoading(false); }); };
  useEffect(() => { loadData(); }, []);

  const go = (p: AppPage) => {
    if (page === 'input' && p !== 'input') loadData();
    setPage(p);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }} className="anim-fade">🧬</div>
          <div className="font-mono-data" style={{ fontSize: 11, color: 'var(--text3)' }}>Loading Life OS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-safe">
      {/* ── Desktop Header ── */}
      <header className="desktop-header" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => go('overview')}>
          <span style={{ fontSize: 22 }}>🧬</span>
          <span className="font-display" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>LIFE OS</span>
        </div>
        <div className="tab-bar">
          {NAV.map(n => (
            <button key={n.key} className={`tab ${page === n.key ? 'on' : ''}`} onClick={() => go(n.key)}>
              <n.icon size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
              {n.label}
            </button>
          ))}
        </div>
        <div className="font-mono-data" style={{ fontSize: 11, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <header className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => go('overview')}>
          <span style={{ fontSize: 18 }}>🧬</span>
          <span className="font-display" style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>LIFE OS</span>
        </div>
        <div className="font-mono-data" style={{ fontSize: 10, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ padding: '0 12px 12px', maxWidth: 1280, margin: '0 auto', width: '100%', flex: 1, overflowX: 'hidden' }}>
        {page === 'overview' && <OverviewPage data={data} onNavigate={go} />}
        {page === 'health' && <HealthPage data={data} />}
        {page === 'finance' && <FinancePage data={data} />}
        {page === 'calendar' && <CalendarPage data={data} />}
        {page === 'psychology' && <MindPage data={data} />}
        {page === 'input' && <InputPage />}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mob-nav">
        {NAV.map(n => {
          const active = page === n.key;
          return (
            <button key={n.key} onClick={() => go(n.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '4px 8px', minWidth: 44, background: 'none', border: 'none', cursor: 'pointer',
                color: active ? (n.key === 'input' ? 'var(--neon-green)' : 'var(--neon-blue)') : 'var(--text3)',
                transition: 'color .15s',
              }}>
              <n.icon size={18} strokeWidth={active ? 2.5 : 1.5} />
              <span className="font-mono-data" style={{ fontSize: 8, fontWeight: 700 }}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
