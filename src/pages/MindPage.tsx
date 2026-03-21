import { Brain } from 'lucide-react';
import { fDateShort } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

export default function MindPage({ data }: { data: LifeOSData }) {
  const { triggers, sessions } = data.psychology;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={20} style={{ color: 'var(--purple)' }} /> Mind
      </h2>
      <div className="panel fade d1" style={{ padding: 14 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Trigger Log</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!triggers.length && <span style={{ fontSize: 10, color: 'var(--t3)' }}>No triggers logged</span>}
          {triggers.slice(0, 10).map(t => (
            <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontWeight: 600 }}>{t.trigger_type || 'Unknown'}</span>
                <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9 }}>{fDateShort(t.date)}</span>
              </div>
              {t.situation && <div style={{ color: 'var(--t2)', marginBottom: 2 }}>{t.situation}</div>}
              {t.right_side_intensity != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--t3)' }}>R-side</span>
                  <div style={{ flex: 1, maxWidth: 80 }}><div className="bar-track"><div className="bar-fill" style={{ width: `${t.right_side_intensity * 10}%`, background: t.right_side_intensity > 6 ? 'var(--red)' : 'var(--amber)' }} /></div></div>
                  <span className="font-data" style={{ fontSize: 9, fontWeight: 700 }}>{t.right_side_intensity}/10</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {sessions.length > 0 && (
        <div className="panel fade d2" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Reconsolidation Sessions</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>Session #{s.session_number}</span>
                  <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9 }}>{fDateShort(s.date)}</span>
                </div>
                {s.target_memory && <div style={{ color: 'var(--t2)', marginBottom: 2 }}>{s.target_memory}</div>}
                {s.mismatch_used && <div style={{ color: 'var(--purple)', fontSize: 9 }}>Mismatch: {s.mismatch_used}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {s.right_shoulder != null && <span className="font-data" style={{ fontSize: 8, color: 'var(--t3)' }}>Shoulder: {s.right_shoulder}</span>}
                  {s.right_palm != null && <span className="font-data" style={{ fontSize: 8, color: 'var(--t3)' }}>Palm: {s.right_palm}</span>}
                  {s.right_foot != null && <span className="font-data" style={{ fontSize: 8, color: 'var(--t3)' }}>Foot: {s.right_foot}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
