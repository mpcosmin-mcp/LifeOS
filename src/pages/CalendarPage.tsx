import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { fDateShort, categoryEmoji } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

export default function CalendarPage({ data }: { data: LifeOSData }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

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

  const upcomingCosts = useMemo(() => {
    return data.events
      .filter(e => e.date >= today && e.cost > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [data.events, today]);

  const totalUpcomingCost = upcomingCosts.reduce((s, e) => s + e.cost, 0);

  const upcoming = useMemo(() => {
    return data.events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.events, today]);

  // Group upcoming by month
  const upcomingByMonth = useMemo(() => {
    const groups = new Map<string, typeof upcoming>();
    upcoming.forEach(e => {
      const d = new Date(e.date + 'T00:00:00');
      const key = d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
      const arr = groups.get(key) || [];
      arr.push(e);
      groups.set(key, arr);
    });
    return Array.from(groups.entries());
  }, [upcoming]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="font-display anim-fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={20} style={{ color: 'var(--neon-purple)' }} /> Calendar
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="lg:!grid-cols-3">
        {/* Calendar Grid */}
        <div className="glass anim-fade d1" style={{ padding: 16 }} >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => setMonthOffset(o => o - 1)}
              style={{ padding: 8, borderRadius: 12, background: 'transparent', border: 'none', color: 'var(--text1)', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-display" style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{monthLabel}</h3>
            <button onClick={() => setMonthOffset(o => o + 1)}
              style={{ padding: 8, borderRadius: 12, background: 'transparent', border: 'none', color: 'var(--text1)', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = eventsByDate.get(dateStr) || [];
              const isToday = dateStr === today;
              const hasCost = events.some(e => e.cost > 0);
              return (
                <div key={dateStr} style={{
                  position: 'relative',
                  padding: 6,
                  borderRadius: 12,
                  textAlign: 'center',
                  minHeight: 40,
                  background: events.length ? 'rgba(255,255,255,0.03)' : 'transparent',
                  boxShadow: isToday ? 'inset 0 0 0 1px var(--neon-blue)' : 'none',
                }}>
                  <div className="font-mono-data" style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'var(--neon-blue)' : 'var(--text2)' }}>{day}</div>
                  {events.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2, flexWrap: 'wrap' }}>
                      {events.slice(0, 3).map((e, j) => (
                        <div key={j} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: e.type === 'bill' ? 'var(--neon-red)' : e.type === 'birthday' ? 'var(--neon-yellow)' :
                            e.type === 'sport' ? 'var(--neon-green)' : 'var(--neon-purple)',
                        }} />
                      ))}
                    </div>
                  )}
                  {hasCost && <DollarSign size={8} style={{ position: 'absolute', top: 2, right: 2, color: 'var(--neon-red)', opacity: 0.6 }} />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 10, color: 'var(--text3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-red)' }} />Bill</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-yellow)' }} />Birthday</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)' }} />Sport</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-purple)' }} />Event</span>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Upcoming Costs */}
          <div className="glass anim-fade d2" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DollarSign size={16} style={{ color: 'var(--neon-red)' }} />
              <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Upcoming Costs</h3>
            </div>
            <div className="font-mono-data" style={{ fontWeight: 800, fontSize: 24, marginBottom: 12, color: totalUpcomingCost > 2000 ? 'var(--neon-red)' : 'var(--text1)' }}>
              {Math.round(totalUpcomingCost)} lei
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingCosts.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, minHeight: 28 }}>
                  <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                  <span className="font-mono-data" style={{ fontWeight: 700, color: 'var(--neon-red)', flexShrink: 0, fontSize: 11 }}>{e.cost}</span>
                  <span className="font-mono-data" style={{ color: 'var(--text3)', flexShrink: 0, fontSize: 10 }}>{fDateShort(e.date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All Upcoming grouped by month */}
          <div className="glass anim-fade d3" style={{ padding: 16 }}>
            <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>All Upcoming</h3>
            <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingByMonth.map(([monthName, events]) => (
                <div key={monthName}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.06em' }}>{monthName}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {events.map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, minHeight: 28 }}>
                        <span style={{ flexShrink: 0, marginTop: 1 }}>{categoryEmoji(e.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, lineHeight: 1.3 }}>{e.title}</div>
                          {e.location && <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.3 }}>📍 {e.location}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="font-mono-data" style={{ fontSize: 10, color: 'var(--text3)' }}>{fDateShort(e.date)}</div>
                          {e.cost > 0 && <div className="font-mono-data" style={{ fontSize: 10, color: 'var(--neon-red)' }}>{e.cost} lei</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!upcoming.length && <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>No upcoming events</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
