import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { categoryEmoji, fDateShort } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

export default function CalendarPage({ data }: { data: LifeOSData }) {
  const upcoming = useMemo(() => {
    const t = new Date().toISOString().split('T')[0];
    return data.events.filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const past = useMemo(() => {
    const t = new Date().toISOString().split('T')[0];
    return data.events.filter(e => e.date < t).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  }, [data]);

  const totalCost = useMemo(() => upcoming.reduce((s, e) => s + (e.cost || 0), 0), [upcoming]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={20} style={{ color: 'var(--purple)' }} /> Events
      </h2>
      <div className="panel fade d1" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12 }}>Upcoming</span>
          {totalCost > 0 && <span className="font-data" style={{ fontSize: 10, color: 'var(--amber)' }}>~{totalCost} lei</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!upcoming.length && <span style={{ fontSize: 10, color: 'var(--t3)' }}>Nothing upcoming</span>}
          {upcoming.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ flexShrink: 0 }}>{categoryEmoji(e.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                {e.location && <div style={{ fontSize: 9, color: 'var(--t3)' }}>{e.location}</div>}
              </div>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', flexShrink: 0 }}>{e.cost}</span>}
              <span className="font-data" style={{ color: 'var(--t2)', flexShrink: 0, fontSize: 9 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </div>
      {past.length > 0 && (
        <div className="panel fade d2" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Past</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {past.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--t2)' }}>
                <span>{categoryEmoji(e.type)}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9 }}>{fDateShort(e.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
