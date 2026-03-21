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

const NAV_ITEMS: { key: AppPage; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'health', label: 'Health', icon: Activity },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'psychology', label: 'Mind', icon: Brain },
  { key: 'input', label: 'Log', icon: Plus },
];

export default function App() {
  const [page, setPage] = useState<AppPage>('overview');
  const [data, setData] = useState<LifeOSData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetchLifeOSData().then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  // Refresh data when navigating away from input page
  const navigate = (p: AppPage) => {
    if (page === 'input' && p !== 'input') loadData();
    setPage(p);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center anim-fade">
          <div className="text-4xl mb-4 float">🧬</div>
          <div className="font-mono-data text-sm text-[var(--text2)]">Loading Life OS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-safe">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('overview')}>
          <span className="text-2xl">🧬</span>
          <span className="font-black text-lg tracking-tight">LIFE OS</span>
        </div>
        <div className="tab-bar">
          {NAV_ITEMS.map(n => (
            <button key={n.key}
              className={`tab ${page === n.key ? 'on' : ''} ${n.key === 'input' ? '!text-[var(--neon-green)]' : ''}`}
              onClick={() => navigate(n.key)}>
              <n.icon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
              {n.label}
            </button>
          ))}
        </div>
        <div className="font-mono-data text-xs text-[var(--text3)]">
          {new Date().toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2" onClick={() => navigate('overview')}>
          <span className="text-xl">🧬</span>
          <span className="font-black text-sm tracking-tight">LIFE OS</span>
        </div>
        <div className="font-mono-data text-xs text-[var(--text3)]">
          {new Date().toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </header>

      {/* Page Content */}
      <main className="px-3 md:px-6 py-4 max-w-7xl mx-auto w-full flex-1 overflow-x-hidden">
        {page === 'overview' && <OverviewPage data={data} onNavigate={navigate} />}
        {page === 'health' && <HealthPage data={data} />}
        {page === 'finance' && <FinancePage data={data} />}
        {page === 'calendar' && <CalendarPage data={data} />}
        {page === 'psychology' && <MindPage data={data} />}
        {page === 'input' && <InputPage />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mob-nav">
        {NAV_ITEMS.map(n => {
          const active = page === n.key;
          return (
            <button key={n.key}
              onClick={() => navigate(n.key)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[44px]"
              style={{ color: active ? (n.key === 'input' ? 'var(--neon-green)' : 'var(--neon-blue)') : 'var(--text3)' }}>
              <n.icon size={18} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[8px] font-bold">{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
