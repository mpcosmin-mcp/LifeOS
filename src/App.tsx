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
const NAV: { key: AppPage; label: string; icon: typeof Activity; emoji: string }[] = [
  { key: 'overview', label: 'Home', icon: LayoutDashboard, emoji: '🧬' },
  { key: 'health', label: 'Health', icon: Activity, emoji: '💊' },
  { key: 'finance', label: 'Money', icon: Wallet, emoji: '💰' },
  { key: 'calendar', label: 'Events', icon: Calendar, emoji: '📅' },
  { key: 'psychology', label: 'Mind', icon: Brain, emoji: '🧠' },
  { key: 'input', label: 'Log', icon: Plus, emoji: '✏️' },
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

  const dt = new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="safe-bottom" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="sidebar" style={{
        display: 'none', flexDirection: 'column', width: 220, minHeight: '100vh',
        background: 'rgba(8,11,20,0.95)', borderRight: '1px solid var(--border)',
        padding: '20px 0', position: 'fixed', top: 0, left: 0, zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => go('overview')}>
            <span style={{ fontSize: 22 }}>🧬</span>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', lineHeight: 1 }}>LIFE OS</div>
              <div className="font-data" style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2 }}>{dt}</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => {
            const active = page === n.key;
            return (
              <button key={n.key} onClick={() => go(n.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                background: active ? 'rgba(6,182,212,0.08)' : 'transparent',
                color: active ? 'var(--cyan)' : 'var(--t2)',
                transition: 'all .15s',
              }}>
                <n.icon size={18} strokeWidth={active ? 2.2 : 1.5} />
                <span className="font-display" style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <div className="font-data" style={{ fontSize: 8, color: 'var(--t3)' }}>v0.3 · Updated 2x/day</div>
        </div>
      </aside>

      {/* ═══ Main Area ═══ */}
      <div className="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Header */}
        <header className="hdr-mob" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => go('overview')}>
            <span style={{ fontSize: 16 }}>🧬</span>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 12 }}>LIFE OS</span>
          </div>
          <span className="font-data" style={{ fontSize: 9, color: 'var(--t3)' }}>
            {new Date().toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </header>

        {/* Content */}
        <main style={{ padding: '0 16px 16px', flex: 1, overflowX: 'hidden' }}>
          {page === 'overview' && <OverviewPage data={data} onNavigate={go} />}
          {page === 'health' && <HealthPage data={data} />}
          {page === 'finance' && <FinancePage data={data} />}
          {page === 'calendar' && <CalendarPage data={data} />}
          {page === 'psychology' && <MindPage data={data} />}
          {page === 'input' && <InputPage />}
        </main>
      </div>

      {/* ═══ Mobile Dock ═══ */}
      <nav className="dock">
        {NAV.map(n => (
          <button key={n.key} onClick={() => go(n.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            padding: '6px 0', minWidth: 48, background: 'none', border: 'none', cursor: 'pointer',
            color: page === n.key ? (n.key === 'input' ? 'var(--green)' : 'var(--cyan)') : 'var(--t3)',
            transition: 'color .15s',
          }}>
            <n.icon size={18} strokeWidth={page === n.key ? 2.5 : 1.5} />
            <span className="font-data" style={{ fontSize: 7, fontWeight: 700 }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
