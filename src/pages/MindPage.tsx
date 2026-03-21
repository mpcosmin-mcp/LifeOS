import { Brain, Heart, Shield, BookOpen } from 'lucide-react';
import type { LifeOSData } from '../lib/types';

export default function MindPage({ data }: { data: LifeOSData }) {
  const { triggers, sessions, homework } = data.psychology;

  return (
    <div className="space-y-5">
      <h2 className="font-black text-xl flex items-center gap-2 anim-fade">
        <Brain size={20} style={{ color: 'var(--neon-purple)' }} /> Mind
      </h2>

      {/* Core Belief Card */}
      <div className="glass p-6 anim-fade d1 relative overflow-hidden">
        <div className="accent-strip" style={{ background: 'var(--neon-purple)' }} />
        <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-[0.04]" style={{ background: 'var(--neon-purple)' }} />
        <div className="flex items-start gap-4">
          <Shield size={24} style={{ color: 'var(--neon-purple)' }} className="shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-sm mb-2">Core Belief Being Reconsolidated</h3>
            <p className="text-lg italic text-[var(--text2)]">"Nevoile mele nu sunt suficient de importante ca să fie văzute."</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
              <span className="chip" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--neon-purple)' }}>Origin: Father</span>
              <span className="chip" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--neon-blue)' }}>Reinforced: School</span>
              <span className="chip" style={{ background: 'rgba(236,72,153,0.15)', color: 'var(--neon-pink)' }}>Repeated: Ex-partner</span>
              <span className="chip" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--neon-orange)' }}>Current: Work</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Signature */}
      <div className="glass p-5 anim-fade d2">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Heart size={16} style={{ color: 'var(--neon-red)' }} /> Physical Signature
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,59,59,0.08)' }}>
            <div className="text-2xl mb-2">🦶</div>
            <div className="text-xs font-bold">Right Foot</div>
            <div className="text-[10px] text-[var(--text3)]">Numbness</div>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,59,59,0.08)' }}>
            <div className="text-2xl mb-2">✋</div>
            <div className="text-xs font-bold">Right Palm</div>
            <div className="text-[10px] text-[var(--text3)]">Numbness</div>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,59,59,0.08)' }}>
            <div className="text-2xl mb-2">💪</div>
            <div className="text-xs font-bold">Right Shoulder</div>
            <div className="text-[10px] text-[var(--text3)]">Tension</div>
          </div>
        </div>
      </div>

      {/* Defense Patterns */}
      <div className="glass p-5 anim-fade d3">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <BookOpen size={16} style={{ color: 'var(--neon-blue)' }} /> Identified Patterns
        </h3>
        <div className="space-y-3">
          <PatternCard emoji="🧊" label="Freeze Response" desc="Verbal and emotional shutdown when needs are dismissed" color="var(--neon-blue)" />
          <PatternCard emoji="🧠" label="Intellectualization" desc="Using analysis as a defense to avoid feeling" color="var(--neon-purple)" />
          <PatternCard emoji="🔄" label="Victim Loop" desc="Comfort in victimhood — familiar but limiting" color="var(--neon-orange)" />
          <PatternCard emoji="🏗️" label="Building Loop" desc="Endless building as dopamine substitute — 30s satisfaction → anxiety → build more" color="var(--neon-red)" />
        </div>
      </div>

      {/* Protocol Status */}
      <div className="glass p-5 anim-fade d4">
        <h3 className="font-bold text-sm mb-4">Reconsolidation Protocol</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Sessions Logged" value={sessions.length.toString()} sub="Target: 1/week" color="var(--neon-purple)" />
          <StatCard label="Triggers Tracked" value={triggers.length.toString()} sub="Journal entries" color="var(--neon-red)" />
          <StatCard label="Homework Done" value={homework.length.toString()} sub="Integration exercises" color="var(--neon-green)" />
        </div>
        <div className="mt-4 p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-sm text-[var(--text2)]">
            {sessions.length === 0 && triggers.length === 0
              ? '🌱 Protocol initialized. Start logging triggers and sessions to see progress here.'
              : `${sessions.length} sessions completed. Keep going.`}
          </p>
        </div>
      </div>

      {/* Method */}
      <div className="glass p-5 anim-fade d5">
        <h3 className="font-bold text-sm mb-3">Method: Memory Reconsolidation</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Step num={1} label="Activate" desc="Access the emotional memory" color="var(--neon-red)" />
          <div className="hidden sm:flex items-center text-[var(--text3)]">→</div>
          <Step num={2} label="Mismatch" desc="Introduce contradicting experience" color="var(--neon-orange)" />
          <div className="hidden sm:flex items-center text-[var(--text3)]">→</div>
          <Step num={3} label="Integrate" desc="New belief replaces old" color="var(--neon-green)" />
        </div>
      </div>
    </div>
  );
}

function PatternCard({ emoji, label, desc, color }: { emoji: string; label: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <span className="text-xl shrink-0">{emoji}</span>
      <div>
        <div className="font-bold text-sm" style={{ color }}>{label}</div>
        <div className="text-xs text-[var(--text2)]">{desc}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="glass p-4 text-center">
      <div className="font-mono-data font-black text-2xl" style={{ color }}>{value}</div>
      <div className="text-xs font-bold mt-1">{label}</div>
      <div className="text-[10px] text-[var(--text3)]">{sub}</div>
    </div>
  );
}

function Step({ num, label, desc, color }: { num: number; label: string; desc: string; color: string }) {
  return (
    <div className="flex-1 p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-mono-data font-black" style={{ background: `${color}20`, color }}>{num}</div>
      <div className="font-bold text-sm">{label}</div>
      <div className="text-[10px] text-[var(--text2)] mt-1">{desc}</div>
    </div>
  );
}
