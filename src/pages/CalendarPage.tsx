import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { categoryEmoji, fDateShort, fDateRo } from '../lib/helpers';
import type { LifeOSData, CalendarEvent } from '../lib/types';

// ══════════════════════════════════════════════
// HELPER: Event type → color mapping
// ══════════════════════════════════════════════
function typeColor(type: string, title: string): string {
  const t = type.toLowerCase();
  const ti = title.toLowerCase();
  
  if (t === 'birthday' || ti.includes('ziua')) return '#f472b6';
  if (t === 'wedding' || ti.includes('nuntă')) return '#e879f9';
  if (t === 'bill' || ti.includes('taxe') || ti.includes('rate')) return '#fb923c';
  if (t === 'health' || t === 'sport' || ti.includes('itp')) return '#34d399';
  if (t === 'event') return '#818cf8';
  
  return 'var(--t3)';
}

// ══════════════════════════════════════════════
// HELPER: Days until
// ══════════════════════════════════════════════
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 864e5);
}

// ══════════════════════════════════════════════
// HELPER: Month calendar grid
// ══════════════════════════════════════════════
function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Convert to Monday-start (0 = Mon, 1 = Tue, ..., 6 = Sun)
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  
  const weeks: Array<Array<{ day: number; date: string; isCurrentMonth: boolean }>> = [];
  let currentWeek: Array<{ day: number; date: string; isCurrentMonth: boolean }> = [];
  
  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const actualMonth = prevMonth < 0 ? 11 : prevMonth;
    currentWeek.push({
      day,
      date: `${prevYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }
  
  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push({
      day,
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Next month padding
  if (currentWeek.length > 0) {
    let day = 1;
    while (currentWeek.length < 7) {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const actualMonth = nextMonth > 11 ? 0 : nextMonth;
      currentWeek.push({
        day,
        date: `${nextYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
      day++;
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
}

// ══════════════════════════════════════════════
// HELPER: Get week range (Mon-Sun)
// ══════════════════════════════════════════════
function getWeekRange(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(monday);
    curr.setDate(monday.getDate() + i);
    week.push(curr);
  }
  
  return week;
}

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
export default function CalendarPage({ data }: { data: LifeOSData }) {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Events lookup by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    data.events.forEach(e => {
      const events = map.get(e.date) || [];
      events.push(e);
      map.set(e.date, events);
    });
    return map;
  }, [data.events]);
  
  // Current month/year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Month grid
  const monthGrid = useMemo(() => getMonthGrid(year, month), [year, month]);
  
  // Week range
  const weekRange = useMemo(() => getWeekRange(currentDate), [currentDate]);
  
  // Navigation
  const goToPrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
    setSelectedDay(null);
  };
  
  const goToNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
    setSelectedDay(null);
  };
  
  const goToPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  
  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };
  
  // Monthly stats
  const monthEvents = useMemo(() => {
    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
    return data.events.filter(e => e.date >= startOfMonth && e.date <= endOfMonth);
  }, [data.events, year, month]);
  
  const monthCost = monthEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
  
  // Weekly stats
  const weekEvents = useMemo(() => {
    const weekStart = weekRange[0].toISOString().split('T')[0];
    const weekEnd = weekRange[6].toISOString().split('T')[0];
    return data.events.filter(e => e.date >= weekStart && e.date <= weekEnd);
  }, [data.events, weekRange]);
  
  const weekCost = weekEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
  
  // Selected day events
  const selectedDayEvents = selectedDay ? (eventsByDate.get(selectedDay) || []) : [];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={20} style={{ color: 'var(--purple)' }} /> Calendar
      </h2>

      {/* EventsDiagnosis at the top */}
      <EventsDiagnosis data={data} />

      {/* View Tabs */}
      <div className="panel fade d1" style={{ padding: 8, display: 'flex', gap: 4 }}>
        <button
          onClick={() => setView('month')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: view === 'month' ? 'var(--purple)' : 'transparent',
            color: view === 'month' ? '#fff' : 'var(--t2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Lună
        </button>
        <button
          onClick={() => setView('week')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: view === 'week' ? 'var(--purple)' : 'transparent',
            color: view === 'week' ? '#fff' : 'var(--t2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Săptămână
        </button>
        <button
          onClick={() => setView('list')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: view === 'list' ? 'var(--purple)' : 'transparent',
            color: view === 'list' ? '#fff' : 'var(--t2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Listă
        </button>
      </div>

      {/* Monthly View */}
      {view === 'month' && (
        <>
          {/* Month Navigation */}
          <div className="panel fade d2" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                onClick={goToPrevMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>
                  {currentDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                </div>
                <div className="font-data" style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {monthEvents.length} events · {monthCost} lei
                </div>
              </div>
              
              <button
                onClick={goToNextMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--t2)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Azi
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="panel fade d3" style={{ padding: 12 }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--t3)',
                    textTransform: 'uppercase',
                    padding: '4px 0',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Week rows */}
            {monthGrid.map((week, weekIdx) => (
              <div
                key={weekIdx}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}
              >
                {week.map((cell, dayIdx) => {
                  const dayEvents = eventsByDate.get(cell.date) || [];
                  const isToday = cell.date === today;
                  const isSelected = cell.date === selectedDay;
                  
                  return (
                    <div
                      key={dayIdx}
                      onClick={() => setSelectedDay(cell.date)}
                      style={{
                        minHeight: 50,
                        padding: 6,
                        borderRadius: 6,
                        border: isToday ? '2px solid var(--cyan)' : '1px solid var(--border)',
                        background: isSelected
                          ? 'var(--surface)'
                          : isToday
                          ? 'rgba(34, 211, 238, 0.1)'
                          : 'var(--bg3)',
                        opacity: cell.isCurrentMonth ? 1 : 0.4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        className="font-data"
                        style={{
                          fontSize: 11,
                          fontWeight: isToday ? 700 : 600,
                          color: isToday ? 'var(--cyan)' : cell.isCurrentMonth ? 'var(--t1)' : 'var(--t3)',
                          marginBottom: 4,
                        }}
                      >
                        {cell.day}
                      </div>
                      
                      {/* Event dots */}
                      {dayEvents.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: typeColor(event.type, event.title),
                              }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div
                              style={{
                                fontSize: 8,
                                color: 'var(--t3)',
                                fontWeight: 600,
                              }}
                            >
                              +{dayEvents.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected Day Detail Panel */}
          {selectedDay && selectedDayEvents.length > 0 && (
            <div className="panel fade d4" style={{ padding: 12 }}>
              <div
                className="font-display"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{fDateRo(selectedDay)}</span>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--t3)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  închide
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDayEvents.map(event => (
                  <div
                    key={event.id}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      borderLeft: `3px solid ${typeColor(event.type, event.title)}`,
                      background: 'var(--bg3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{categoryEmoji(event.type)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{event.title}</span>
                    </div>
                    
                    {event.cost > 0 && (
                      <div className="font-data" style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
                        {event.cost} {event.currency}
                      </div>
                    )}
                    
                    {event.location && (
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
                        📍 {event.location}
                      </div>
                    )}
                    
                    {event.notes && (
                      <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 4, fontStyle: 'italic' }}>
                        {event.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Weekly View */}
      {view === 'week' && (
        <>
          {/* Week Navigation */}
          <div className="panel fade d2" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                onClick={goToPrevWeek}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>
                  {fDateRo(weekRange[0].toISOString().split('T')[0])} - {fDateRo(weekRange[6].toISOString().split('T')[0])}
                </div>
                <div className="font-data" style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {weekEvents.length} events · {weekCost} lei
                </div>
              </div>
              
              <button
                onClick={goToNextWeek}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Week Grid */}
          <div
            className="panel fade d3"
            style={{
              padding: 8,
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
            }}
          >
            {weekRange.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayEvents = eventsByDate.get(dateStr) || [];
              const isToday = dateStr === today;
              const dayName = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'][idx];
              
              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 120,
                    padding: 8,
                    borderRadius: 6,
                    border: isToday ? '2px solid var(--cyan)' : '1px solid var(--border)',
                    background: isToday ? 'rgba(34, 211, 238, 0.1)' : 'var(--bg3)',
                  }}
                >
                  {/* Date header */}
                  <div style={{ marginBottom: 8, textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--t3)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {dayName}
                    </div>
                    <div
                      className="font-data"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isToday ? 'var(--cyan)' : 'var(--t1)',
                      }}
                    >
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Event cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        style={{
                          padding: 6,
                          borderRadius: 4,
                          borderLeft: `3px solid ${typeColor(event.type, event.title)}`,
                          background: 'var(--surface)',
                          fontSize: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 12 }}>{categoryEmoji(event.type)}</span>
                          <span
                            style={{
                              flex: 1,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </span>
                        </div>
                        
                        {event.cost > 0 && (
                          <div
                            className="font-data"
                            style={{ fontSize: 9, color: 'var(--red)', fontWeight: 600 }}
                          >
                            {event.cost} lei
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* List View */}
      {view === 'list' && <ListView data={data} />}
    </div>
  );
}

// ══════════════════════════════════════════════
// LIST VIEW (original functionality)
// ══════════════════════════════════════════════
function ListView({ data }: { data: LifeOSData }) {
  const today = new Date().toISOString().split('T')[0];
  const INCOME = 7000;

  const upcoming = useMemo(() =>
    data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
  [data, today]);

  // Next 7 days
  const next7 = useMemo(() => {
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return upcoming.filter(e => e.date <= in7);
  }, [upcoming]);

  const next7Cost = next7.reduce((s, e) => s + (e.cost || 0), 0);

  // Next 30 days
  const next30 = useMemo(() => {
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    return upcoming.filter(e => e.date <= in30);
  }, [upcoming]);

  const next30Cost = next30.reduce((s, e) => s + (e.cost || 0), 0);

  // Social tax
  const socialTax = useMemo(() => {
    const in90 = new Date(Date.now() + 90 * 864e5).toISOString().split('T')[0];
    return upcoming.filter(e =>
      e.date <= in90 &&
      (e.type === 'wedding' || e.type === 'birthday' || e.type === 'nameday' || e.type === 'social')
    );
  }, [upcoming]);

  const socialTaxTotal = socialTax.reduce((s, e) => s + (e.cost || 0), 0);

  // Monthly distribution
  const monthlyDist = useMemo(() => {
    const months = new Map<string, { count: number; cost: number; types: Set<string> }>();
    upcoming.forEach(e => {
      const mo = e.date.substring(0, 7);
      const cur = months.get(mo) || { count: 0, cost: 0, types: new Set() };
      cur.count++;
      cur.cost += e.cost || 0;
      cur.types.add(e.type);
      months.set(mo, cur);
    });
    return [...months.entries()].map(([mo, d]) => ({
      mo, ...d, types: [...d.types],
    }));
  }, [upcoming]);

  const maxMonthlyCost = Math.max(...monthlyDist.map(m => m.cost), 1);
  const warningMonths = monthlyDist.filter(m => m.cost > INCOME * 0.7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Next 7 Days */}
      <div className="panel fade d2" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Next 7 Days</span>
          <span className="font-data" style={{ fontSize: 10, color: next7Cost > 500 ? 'var(--red)' : 'var(--t3)' }}>
            {next7Cost > 0 ? `${next7Cost} lei` : 'no costs'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!next7.length && <span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Clear week ✨</span>}
          {next7.map(e => {
            const days = daysUntil(e.date);
            const dayLabel = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`;
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                <span className="font-data" style={{ width: 40, textAlign: 'center', fontSize: 10, fontWeight: 700, color: days <= 1 ? 'var(--red)' : 'var(--t2)', flexShrink: 0 }}>
                  {dayLabel}
                </span>
                <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                {e.cost > 0 && (
                  <span className="font-data" style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', flexShrink: 0 }}>{e.cost} lei</span>
                )}
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next 30 Days */}
      <div className="panel fade d3" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Next 30 Days</span>
          <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: next30Cost > INCOME ? 'var(--red)' : 'var(--t1)' }}>
            {next30Cost} lei committed
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {next30.filter(e => e.cost > 0).map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
              <span className="font-data" style={{ width: 52, color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
              <span style={{ flexShrink: 0, fontSize: 10 }}>{categoryEmoji(e.type)}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t2)' }}>{e.title}</span>
              <span className="font-data" style={{ fontWeight: 700, color: e.cost > 500 ? 'var(--red)' : 'var(--t1)', flexShrink: 0 }}>{e.cost} lei</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--t2)' }}>Cash needed vs available</span>
          <div style={{ textAlign: 'right' }}>
            <span className="font-data" style={{ fontSize: 12, fontWeight: 700, color: next30Cost > INCOME ? 'var(--red)' : 'var(--green)' }}>
              {next30Cost > INCOME ? '−' : '+'}{Math.abs(INCOME - next30Cost)} lei
            </span>
          </div>
        </div>
      </div>

      {/* Social Tax */}
      {socialTax.length > 0 && (
        <div className="panel fade d4" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Social Tax <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>next 90 days</span></span>
            <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)' }}>{socialTaxTotal} lei</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {socialTax.map(e => {
              const days = daysUntil(e.date);
              const budgeted = e.cost > 0;
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)' }}>{fDateShort(e.date)} · {days}d away</div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 600,
                    background: budgeted ? 'var(--green-bg)' : 'var(--red-bg)',
                    color: budgeted ? 'var(--green)' : 'var(--red)',
                  }}>
                    {budgeted ? `${e.cost} lei ✓` : 'needs budget'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pressure Map */}
      <div className="panel fade d5" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'block' }}>
          Pressure Map <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>monthly load</span>
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {monthlyDist.slice(0, 12).map(m => {
            const intensity = m.cost / maxMonthlyCost;
            const isWarning = m.cost > INCOME * 0.7;
            const moName = new Date(m.mo + '-01').toLocaleString('ro-RO', { month: 'short' });
            return (
              <div key={m.mo} style={{
                padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                background: isWarning ? 'var(--red-bg)' : `rgba(156, 107, 94, ${0.05 + intensity * 0.3})`,
                border: `1px solid ${isWarning ? 'var(--red)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: isWarning ? 'var(--red)' : 'var(--t3)', marginBottom: 2 }}>
                  {moName}
                </div>
                <div className="font-data" style={{ fontSize: 16, fontWeight: 800, color: isWarning ? 'var(--red)' : 'var(--t1)' }}>
                  {(m.cost / 1000).toFixed(1)}k
                </div>
                <div style={{ fontSize: 8, color: 'var(--t3)' }}>{m.count} events</div>
                {isWarning && <div style={{ fontSize: 7, color: 'var(--red)', fontWeight: 600, marginTop: 2 }}>⚠ HIGH</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// EVENTS DIAGNOSIS (kept from original)
// ══════════════════════════════════════════════
function EventsDiagnosis({ data }: { data: LifeOSData }) {
  const diagnosis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = data.events.filter(e => e.date >= today);
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    const next30 = upcoming.filter(e => e.date <= in30);
    const patterns: string[] = [];

    // Cost pressure
    const cost30 = next30.reduce((s, e) => s + (e.cost || 0), 0);
    if (cost30 > 5000) patterns.push(`${cost30} lei committed în 30 zile. Presiune financiară ridicată — pregătește cash flow.`);

    // Event density
    if (next30.length > 10) patterns.push(`${next30.length} events în 30 zile. Calendar dens — protejează-ți white space.`);

    // Social tax
    const socialEvents = upcoming.filter(e => ['wedding', 'birthday', 'nameday', 'social'].includes(e.type));
    const socialCost = socialEvents.reduce((s, e) => s + (e.cost || 0), 0);
    if (socialCost > 1000) patterns.push(`Social tax: ${socialCost} lei în obligații sociale. Bugetează-le acum, nu atunci.`);

    // Drain events
    const drains = next30.filter(e => e.type === 'bill' || e.type === 'wedding');
    if (drains.length > 5) patterns.push(`${drains.length} drain events în 30 zile. Planifică zile de recharge între ele.`);

    // Warning months ahead
    const monthCosts = new Map<string, number>();
    upcoming.forEach(e => {
      const mo = e.date.substring(0, 7);
      monthCosts.set(mo, (monthCosts.get(mo) || 0) + (e.cost || 0));
    });
    const hotMonths = [...monthCosts.entries()].filter(([, c]) => c > 5000).map(([m]) => new Date(m + '-01').toLocaleString('ro-RO', { month: 'short' }));
    if (hotMonths.length > 0) patterns.push(`Luni fierbinți: ${hotMonths.join(', ')}. Pune deoparte bani din timp.`);

    // 1% Action
    let action = '';
    if (cost30 > 5000) action = 'Fă o listă cu toate costurile din luna care vine. Blochează sumele în cont acum — nu atunci.';
    else if (socialCost > 500) action = 'Alege UN cadou pe care îl poți pregăti azi pt următorul event social. Mai devreme = mai ieftin + mai personal.';
    else if (next30.length > 8) action = 'Blochează o seară liberă săptămâna asta — fără obligații, fără ecrane. Calendar dens cere pauze planificate.';
    else action = 'Calendar curat. Folosește spațiul liber pt un proiect personal — nu lăsa timpul gol să se umple cu urgențe false.';

    return { patterns, action };
  }, [data]);

  return (
    <div className="panel fade" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span>🔍</span>
        <span className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Time Patterns</span>
      </div>
      {diagnosis.patterns.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {diagnosis.patterns.map((p, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.5, paddingLeft: 8, borderLeft: '2px solid var(--amber)' }}>
              {p}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 12, fontStyle: 'italic' }}>Calendar balanced ✨</div>
      )}
      <div style={{ padding: 10, borderRadius: 8, background: 'var(--green-bg)', borderLeft: '4px solid var(--green)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>🎯 1% Better</div>
        <div style={{ fontSize: 11, color: 'var(--t1)', lineHeight: 1.5 }}>{diagnosis.action}</div>
      </div>
    </div>
  );
}
