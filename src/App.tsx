import { useState, useEffect } from 'react';
import { Activity, Wallet, Calendar, Brain, LayoutDashboard, Plus, Lock, Unlock } from 'lucide-react';
import { PrivacyProvider, usePrivacy } from './lib/privacy';
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
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 8 }}>
      <div className="font-display fade" style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>Life OS</div>
      <div className="font-data fade d1" style={{ fontSize: 11, color: 'var(--t3)' }}>Loading...</div>
    </div>
  );

  return (
    <PrivacyProvider>
    <div className="safe-bottom" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="sidebar" style={{
        flexDirection: 'column', width: 240, minHeight: '100vh',
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, zIndex: 40,
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => go('overview')}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--t1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, filter: 'grayscale(0.3)' }}>📓</span>
            </div>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, color: 'var(--t1)', fontStyle: 'italic' }}>Life OS</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, letterSpacing: '0.5px' }}>1% better every day</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '8px 12px', flex: 1 }}>
          {NAV.map(n => {
            const active = page === n.key;
            return (
              <button key={n.key} onClick={() => go(n.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%',
                borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                background: active ? 'var(--bg3)' : 'transparent',
                color: active ? 'var(--t1)' : 'var(--t2)',
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: active ? 600 : 500,
                transition: 'all .15s',
              }}>
                <n.icon size={18} strokeWidth={active ? 2 : 1.5} />
                {n.label}
              </button>
            );
          })}
        </nav>
        <PrivacyToggles />
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--t4)', fontStyle: 'italic' }}>
          Updated 2× daily
        </div>
      </aside>

      <div className="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <header className="hdr-mob" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => go('overview')}>
            <span style={{ fontSize: 16 }}>📓</span>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)', fontStyle: 'italic' }}>Life OS</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>
            {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
          </span>
        </header>

        <main style={{ padding: 16, flex: 1, overflowX: 'hidden', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          {page === 'overview' && <OverviewPage data={data} onNavigate={go} />}
          {page === 'health' && <HealthPage data={data} />}
          {page === 'finance' && <FinancePage data={data} />}
          {page === 'calendar' && <CalendarPage data={data} />}
          {page === 'psychology' && <MindPage data={data} />}
          {page === 'input' && <InputPage />}
        </main>
      </div>

      <nav className="dock">
        {NAV.map(n => (
          <button key={n.key} onClick={() => go(n.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 0', minWidth: 48, background: 'none', border: 'none', cursor: 'pointer',
            color: page === n.key ? 'var(--t1)' : 'var(--t3)', transition: 'color .15s',
          }}>
            <n.icon size={20} strokeWidth={page === n.key ? 2.2 : 1.5} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
    </PrivacyProvider>
  );
}

function PrivacyToggles() {
  const { financeLocked, mindLocked, toggleFinance, toggleMind } = usePrivacy();
  return (
    <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button onClick={toggleFinance} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', width: '100%',
        borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
        background: financeLocked ? 'var(--bg3)' : 'var(--green-bg)',
        color: financeLocked ? 'var(--t2)' : 'var(--green)',
        fontFamily: "'Inter', sans-serif",
      }}>
        {financeLocked ? <Lock size={13} /> : <Unlock size={13} />}
        Finance {financeLocked ? 'locked' : 'visible'}
      </button>
      <button onClick={toggleMind} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', width: '100%',
        borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
        background: mindLocked ? 'var(--bg3)' : 'var(--green-bg)',
        color: mindLocked ? 'var(--t2)' : 'var(--green)',
        fontFamily: "'Inter', sans-serif",
      }}>
        {mindLocked ? <Lock size={13} /> : <Unlock size={13} />}
        Mind {mindLocked ? 'locked' : 'visible'}
      </button>
    </div>
  );
}
