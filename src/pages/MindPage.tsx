import { Brain, Heart, Shield, BookOpen } from 'lucide-react';
import { fDateShort } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

export default function MindPage({ data }: { data: LifeOSData }) {
  const { triggers, sessions, homework } = data.psychology;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="font-display anim-fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={20} style={{ color: 'var(--neon-purple)' }} /> Mind
      </h2>

      {/* Core Belief */}
      <div className="glass accent-strip anim-fade d1" style={{ '--strip-color': 'var(--neon-purple)', padding: 16 } as any}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Shield size={22} style={{ color: 'var(--neon-purple)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Core Belief Being Reconsolidated</h3>
            <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.4 }}>"Nevoile mele nu sunt suficient de importante ca să fie văzute."</p>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="chip" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--neon-purple)' }}>Origin: Father</span>
              <span className="chip" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--neon-blue)' }}>Reinforced: School</span>
              <span className="chip" style={{ background: 'rgba(236,72,153,0.15)', color: 'var(--neon-pink)' }}>Repeated: Ex-partner</span>
              <span className="chip" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--neon-orange)' }}>Current: Work</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Signature */}
      <div className="glass anim-fade d2" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Heart size={16} style={{ color: 'var(--neon-red)' }} />
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Physical Signature</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,59,59,0.06)' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🦶</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>Right Foot</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Numbness</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,59,59,0.06)' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>✋</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>Right Palm</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Numbness</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,59,59,0.06)' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>💪</div>
            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Right Shoulder</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Tension</div>
          </div>
        </div>
      </div>

      {/* Identified Patterns */}
      <div className="glass anim-fade d3" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={16} style={{ color: 'var(--neon-blue)' }} />
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Identified Patterns</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PatternCard emoji="🧊" label="Freeze Response" desc="Verbal and emotional shutdown when needs are dismissed" color="var(--neon-blue)" />
          <PatternCard emoji="🧠" label="Intellectualization" desc="Using analysis as a defense to avoid feeling" color="var(--neon-purple)" />
          <PatternCard emoji="🔄" label="Victim Loop" desc="Comfort in victimhood — familiar but limiting" color="var(--neon-orange)" />
          <PatternCard emoji="🏗️" label="Building Loop" desc="Endless building as dopamine substitute — 30s satisfaction → anxiety → build more" color="var(--neon-red)" />
        </div>
      </div>

      {/* Reconsolidation Protocol */}
      <div className="glass anim-fade d4" style={{ padding: 16 }}>
        <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Reconsolidation Protocol</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatCard label="Sessions" value={sessions.length.toString()} sub="1/week" color="var(--neon-purple)" />
          <StatCard label="Triggers" value={triggers.length.toString()} sub="Logged" color="var(--neon-red)" />
          <StatCard label="Homework" value={homework.length.toString()} sub="Done" color="var(--neon-green)" />
        </div>
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>
            {sessions.length === 0 && triggers.length === 0
              ? '🌱 Protocol initialized. Start logging triggers and sessions to see progress here.'
              : `${sessions.length} sessions completed. Keep going.`}
          </p>
        </div>
      </div>

      {/* Trigger Log */}
      {triggers.length > 0 && (
        <div className="glass anim-fade d5" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Recent Triggers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {triggers.slice(-5).reverse().map(t => (
              <div key={t.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="chip" style={{ background: 'rgba(255,59,59,0.12)', color: 'var(--neon-red)' }}>
                    {t.trigger_type || 'Unknown'}{t.freeze_occurred ? ' · Freeze' : ''}
                  </span>
                  <span className="font-mono-data" style={{ fontSize: 10, color: 'var(--text3)' }}>{fDateShort(t.date)}</span>
                </div>
                {t.situation && <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3, marginTop: 4 }}>{t.situation}</p>}
                {t.dominant_thought && <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text3)', marginTop: 4 }}>"{t.dominant_thought}"</p>}
                {t.right_side_intensity != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--text3)', flexShrink: 0 }}>R-Side</span>
                    <div className="progress-track" style={{ maxWidth: 80 }}>
                      <div className="progress-fill" style={{ width: `${(t.right_side_intensity / 10) * 100}%`, background: 'var(--neon-red)' }} />
                    </div>
                    <span className="font-mono-data" style={{ fontSize: 10, color: 'var(--neon-red)' }}>{t.right_side_intensity}/10</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Log */}
      {sessions.length > 0 && (
        <div className="glass anim-fade d6" style={{ padding: 16 }}>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Session Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.slice(-5).reverse().map(s => (
              <div key={s.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="font-display" style={{ fontWeight: 700, fontSize: 12 }}>Session #{s.session_number}</span>
                  <span className="font-mono-data" style={{ fontSize: 10, color: 'var(--text3)' }}>{fDateShort(s.date)}</span>
                </div>
                {s.target_memory && <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3, marginTop: 4 }}>{s.target_memory}</p>}
                {s.mismatch_used && <p style={{ fontSize: 11, color: 'var(--neon-green)', marginTop: 4 }}>Mismatch: {s.mismatch_used}</p>}
                {s.belief_update && <p style={{ fontSize: 11, color: 'var(--neon-blue)', marginTop: 4 }}>Update: {s.belief_update}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method */}
      <div className="glass anim-fade d7" style={{ padding: 16 }}>
        <h3 className="font-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Method: Memory Reconsolidation</h3>
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }} className="sm:!flex-row">
          <Step num={1} label="Activate" desc="Access the emotional memory" color="var(--neon-red)" />
          <Step num={2} label="Mismatch" desc="Introduce contradicting experience" color="var(--neon-orange)" />
          <Step num={3} label="Integrate" desc="New belief replaces old" color="var(--neon-green)" />
        </div>
      </div>
    </div>
  );
}

function PatternCard({ emoji, label, desc, color }: { emoji: string; label: string; desc: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
      <div style={{ minWidth: 0 }}>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 12, color }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3 }}>{desc}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="glass" style={{ padding: 12, textAlign: 'center' }}>
      <div className="font-mono-data" style={{ fontWeight: 800, fontSize: 22, color }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 9, color: 'var(--text3)' }}>{sub}</div>
    </div>
  );
}

function Step({ num, label, desc, color }: { num: number; label: string; desc: string; color: string }) {
  return (
    <div style={{ flex: 1, padding: 12, borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
      <div className="font-mono-data" style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 6px', fontWeight: 800, fontSize: 13,
        background: `color-mix(in srgb, ${color} 15%, transparent)`, color,
      }}>{num}</div>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
    </div>
  );
}
