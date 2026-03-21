import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { fDateShort, categoryEmoji, daysAgo } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

export default function CalendarPage({ data }: { data: LifeOSData }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
    const days: (number | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  // Events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof data.events>();
    data.events.forEach(e => {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [data.events]);

  const today = now.toISOString().split('T')[0];

  // Upcoming with costs
  const upcomingCosts = useMemo(() => {
    return data.events
      .filter(e => e.date >= today && e.cost > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [data.events, today]);

  const totalUpcomingCost = upcomingCosts.reduce((s, e) => s + e.cost, 0);

  // All upcoming
  const upcoming = useMemo(() => {
    return data.events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.events, today]);

  return (
    <div className="space-y-5">
      <h2 className="font-black text-xl flex items-center gap-2 anim-fade">
        <Calendar size={20} style={{ color: 'var(--neon-purple)' }} /> Calendar
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 glass p-5 anim-fade d1">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonthOffset(o => o - 1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><ChevronLeft size={18} /></button>
            <h3 className="font-bold text-sm capitalize">{monthLabel}</h3>
            <button onClick={() => setMonthOffset(o => o + 1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(d => (
              <div key={d} className="text-center text-[9px] font-bold uppercase text-[var(--text3)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = eventsByDate.get(dateStr) || [];
              const isToday = dateStr === today;
              const hasCost = events.some(e => e.cost > 0);
              return (
                <div key={dateStr} className={`relative p-2 rounded-xl text-center min-h-[48px] transition-colors ${isToday ? 'ring-1 ring-[var(--neon-blue)]' : ''}`}
                  style={{ background: events.length ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                  <div className={`text-xs font-mono-data font-bold ${isToday ? 'text-[var(--neon-blue)]' : 'text-[var(--text2)]'}`}>{day}</div>
                  {events.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                      {events.slice(0, 3).map((e, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full" style={{
                          background: e.type === 'bill' ? 'var(--neon-red)' : e.type === 'birthday' ? 'var(--neon-yellow)' :
                            e.type === 'sport' ? 'var(--neon-green)' : 'var(--neon-purple)',
                        }} />
                      ))}
                    </div>
                  )}
                  {hasCost && <DollarSign size={8} className="absolute top-1 right-1" style={{ color: 'var(--neon-red)', opacity: 0.6 }} />}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-[var(--text3)]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-red)' }} />Bill</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-yellow)' }} />Birthday</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-green)' }} />Sport</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-purple)' }} />Event</span>
          </div>
        </div>

        {/* Sidebar: Upcoming costs + events */}
        <div className="lg:col-span-4 space-y-4">
          {/* Cost forecast */}
          <div className="glass p-5 anim-fade d2">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <DollarSign size={16} style={{ color: 'var(--neon-red)' }} /> Upcoming Costs
            </h3>
            <div className="font-mono-data font-black text-2xl mb-3" style={{ color: totalUpcomingCost > 2000 ? 'var(--neon-red)' : 'var(--text)' }}>
              {Math.round(totalUpcomingCost)} lei
            </div>
            <div className="space-y-2">
              {upcomingCosts.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span className="shrink-0">{categoryEmoji(e.type)}</span>
                  <span className="truncate flex-1">{e.title}</span>
                  <span className="font-mono-data font-bold text-[var(--neon-red)] shrink-0">{e.cost} lei</span>
                  <span className="font-mono-data text-[var(--text3)] shrink-0">{fDateShort(e.date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full upcoming list */}
          <div className="glass p-5 anim-fade d3">
            <h3 className="font-bold text-sm mb-3">All Upcoming</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-start gap-2 text-xs py-1.5">
                  <span className="shrink-0 mt-0.5">{categoryEmoji(e.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{e.title}</div>
                    {e.location && <div className="text-[var(--text3)] truncate">📍 {e.location}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-data text-[var(--text3)]">{fDateShort(e.date)}</div>
                    {e.cost > 0 && <div className="font-mono-data text-[var(--neon-red)]">{e.cost} lei</div>}
                  </div>
                </div>
              ))}
              {!upcoming.length && <p className="text-xs text-[var(--text3)] text-center py-4">No upcoming events</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
