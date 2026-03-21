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
  const load = () => { fetchLifeOSData().then(d => { setData(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);
  const go = (p: AppPage) => { if (page === 'input' && p !== 'input') load(); setPage(p); };

  if (loading || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 36 }} className="fade">🧬</span>
      <span className="font-data fade d2" style={{ fontSize: 10, color: 'var(--t3)' }}>LIFE OS</span>
    </div>
  );

  const dt = new Date().toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="safe-bottom">
      {/* Desktop */}
      <header className="hdr-desk" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => go('overview')}>
          <span style={{ fontSize: 20 }}>🧬</span>
          <span className="font-display" style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>LIFE OS</span>
        </div>
        <div className="tabs">
          {NAV.map(n => <button key={n.key} className={page === n.key ? 'on' : ''} onClick={() => go(n.key)}><n.icon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />{n.label}</button>)}
        </div>
        <span className="font-data" style={{ fontSize: 10, color: 'var(--t3)' }}>{dt}</span>
      </header>

      {/* Mobile */}
      <header className="hdr-mob" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => go('overview')}>
          <span style={{ fontSize: 16 }}>🧬</span>
          <span className="font-display" style={{ fontWeight: 700, fontSize: 12 }}>LIFE OS</span>
        </div>
        <span className="font-data" style={{ fontSize: 9, color: 'var(--t3)' }}>{dt}</span>
      </header>

      {/* Content */}
      <main style={{ padding: '0 12px 12px', maxWidth: 1280, margin: '0 auto', width: '100%', flex: 1, overflowX: 'hidden' }}>
        {page === 'overview' && <OverviewPage data={data} onNavigate={go} />}
        {page === 'health' && <HealthPage data={data} />}
        {page === 'finance' && <FinancePage data={data} />}
        {page === 'calendar' && <CalendarPage data={data} />}
        {page === 'psychology' && <MindPage data={data} />}
        {page === 'input' && <InputPage />}
      </main>

      {/* Dock */}
      <nav className="dock">
        {NAV.map(n => (
          <button key={n.key} onClick={() => go(n.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            padding: '6px 0', minWidth: 48, background: 'none', border: 'none', cursor: 'pointer',
            color: page === n.key ? (n.key === 'input' ? 'var(--green)' : 'var(--cyan)') : 'var(--t3)',
            transition: 'color .15s',
          }}>
            <n.icon size={18} strokeWidth={page === n.key ? 2.5 : 1.5} />
            <span className="font-data" style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.03em' }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
