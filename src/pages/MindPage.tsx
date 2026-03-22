import { useMemo } from 'react';
import { Brain, BookOpen, Lightbulb, AlertTriangle, TrendingUp, Eye, Zap, Target } from 'lucide-react';
import { fDateShort } from '../lib/helpers';
import type { LifeOSData, JournalInsight } from '../lib/types';

const INSIGHT_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  pattern:      { icon: TrendingUp,     color: 'var(--amber)',  label: 'Pattern' },
  observation:  { icon: Eye,            color: 'var(--blue)',   label: 'Observation' },
  breakthrough: { icon: Lightbulb,      color: 'var(--green)',  label: 'Breakthrough' },
  improvement:  { icon: TrendingUp,     color: 'var(--purple)', label: 'Improvement' },
  warning:      { icon: AlertTriangle,  color: 'var(--red)',    label: 'Warning' },
};

function InsightCard({ insight }: { insight: JournalInsight }) {
  const cfg = INSIGHT_CONFIG[insight.insight_type] || INSIGHT_CONFIG.observation;
  const Icon = cfg.icon;
  return (
    <div style={{ padding: '10px 12px', borderLeft: `3px solid ${cfg.color}`, background: 'var(--bg2)', borderRadius: '0 6px 6px 0', fontSize: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Icon size={13} style={{ color: cfg.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: cfg.color, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cfg.label}</span>
      </div>
      <div style={{ color: 'var(--t1)', lineHeight: 1.5 }}>{insight.content}</div>
      {insight.source_dates && (
        <div className="font-data" style={{ color: 'var(--t3)', fontSize: 8, marginTop: 4 }}>
          Sources: {insight.source_dates}
        </div>
      )}
    </div>
  );
}

export default function MindPage({ data }: { data: LifeOSData }) {
  const { triggers, sessions, journal, insights } = data.psychology || {};
  const journalArr = journal || [];
  const insightsArr = insights || [];

  // Group insights by type
  const patterns = insightsArr.filter(i => i.insight_type === 'pattern');
  const breakthroughs = insightsArr.filter(i => i.insight_type === 'breakthrough');
  const warnings = insightsArr.filter(i => i.insight_type === 'warning');
  const observations = insightsArr.filter(i => i.insight_type === 'observation');
  const improvements = insightsArr.filter(i => i.insight_type === 'improvement');

  // Stats
  const totalEntries = journalArr.length;
  const allTags = journalArr.flatMap(j => (j.tags || '').split(',').map(t => t.trim())).filter(Boolean);
  const tagCounts = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // 1% Better Action — derived from latest journal + patterns
  const dailyAction = useMemo(() => {
    // Priority: warnings > patterns > improvements
    const latestJournal = journalArr[0]; // most recent (DESC order)
    const latestMood = latestJournal?.mood || '';
    const latestTags = (latestJournal?.tags || '').split(',').map(t => t.trim());

    // Rules based on recurring tags and patterns
    const rules: { condition: () => boolean; action: string; source: string }[] = [
      {
        condition: () => latestTags.includes('vice') || latestTags.includes('vice-loop') || tagCounts['vice'] >= 2,
        action: '20 min rule: nu te așeza când ajungi acasă. Duș sau plimbare ÎNAINTE de orice ecran.',
        source: 'Pattern: Vice loop 18-22h',
      },
      {
        condition: () => latestTags.includes('overwhelm') || latestTags.includes('physical-mess'),
        action: 'Un singur lucru fizic. Nu plan complet. Alege cel mai mic: o haină, un pahar, o crămă.',
        source: 'Pattern: Dezordine → paralizie',
      },
      {
        condition: () => latestTags.includes('nutrition-fail') || latestTags.includes('underfed') || tagCounts['nutrition-fail'] >= 1,
        action: 'Proteină la mic dejun: 4 ouă + iaurt grecesc = 44g. Non-negociabil.',
        source: 'Pattern: Nutriție sub target',
      },
      {
        condition: () => latestTags.includes('digital-detox') || latestTags.includes('attention'),
        action: '30 min fără telefon. Lasă-l într-o altă cameră. Doar tu și gândurile tale.',
        source: 'Pattern: Digital consumption ca self-medication',
      },
      {
        condition: () => latestMood.includes('overwhelm') || latestMood.includes('absent') || latestMood.includes('obosit'),
        action: 'Plimbare 15 min afară. Fără căști, fără telefon. Doar pași și aer.',
        source: 'Mood: ' + latestMood,
      },
      {
        condition: () => latestTags.includes('awareness') || latestTags.includes('clarity'),
        action: 'Scrie 3 lucruri concrete pentru care ești recunoscător azi. Nu abstracte — concrete.',
        source: 'Breakthrough: Awareness crește',
      },
      {
        condition: () => tagCounts['self-healing'] >= 1 || latestTags.includes('self-healing'),
        action: 'Stai 2 min cu ochii închiși. Respiră. Observă ce simți în corp, fără să judeci.',
        source: 'Intenție: Self-healing',
      },
    ];

    // Find first matching rule
    const match = rules.find(r => r.condition());
    if (match) return match;

    // Fallback: based on most common warning/pattern
    if (warnings.length > 0) return { action: warnings[0].content.split('.')[0] + '.', source: 'Warning activ' };
    if (patterns.length > 0) return { action: 'Recitește ultimul pattern identificat și alege UN pas mic contra lui.', source: 'Patterns active: ' + patterns.length };
    return { action: 'Scrie un jurnal de 3 rânduri despre cum te simți acum.', source: 'Default: journaling' };
  }, [journalArr, insightsArr, tagCounts, warnings, patterns]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={20} style={{ color: 'var(--purple)' }} /> Mind
      </h2>

      {/* ── Summary Stats ── */}
      <div className="panel fade d1" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: 'var(--purple)' }}>{totalEntries}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>Journal Entries</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>{patterns.length}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>Patterns Found</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{breakthroughs.length}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>Breakthroughs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{warnings.length}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>Warnings</div>
          </div>
        </div>
      </div>

      {/* ── 1% Better Action ── */}
      <div className="panel fade d1" style={{ padding: 16, borderLeft: '4px solid var(--green)', background: 'var(--green-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Target size={16} style={{ color: 'var(--green)' }} />
          <span className="font-display" style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)' }}>1% Better Today</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6, fontWeight: 500 }}>
          {dailyAction.action}
        </div>
        <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 6, fontStyle: 'italic' }}>
          Based on: {dailyAction.source}
        </div>
      </div>

      {/* ── Top Tags ── */}
      {topTags.length > 0 && (
        <div className="panel fade d1" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>Recurring Themes</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topTags.map(([tag, count]) => (
              <span key={tag} style={{
                padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                background: 'var(--bg3)', color: 'var(--t2)', border: '1px solid var(--border)',
              }}>
                {tag} <span style={{ color: 'var(--t3)', fontWeight: 400 }}>×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Key Insights ── */}
      {(insights?.length || 0) > 0 && (
        <div className="panel fade d2" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} style={{ color: 'var(--amber)' }} /> Key Findings
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Show warnings first, then patterns, breakthroughs, observations, improvements */}
            {[...warnings, ...patterns, ...breakthroughs, ...observations, ...improvements]
              .slice(0, 12)
              .map(insight => <InsightCard key={insight.id} insight={insight} />)}
          </div>
        </div>
      )}

      {/* ── Recent Journal ── */}
      {(journal?.length || 0) > 0 && (
        <div className="panel fade d3" style={{ padding: 14 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={14} style={{ color: 'var(--blue)' }} /> Recent Journal
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {journal.slice(0, 8).map(j => (
              <div key={j.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9 }}>{fDateShort(j.date)}</span>
                    {j.mood && <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{j.mood}</span>}
                  </div>
                  {j.energy && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 8, fontSize: 8, fontWeight: 600,
                      background: j.energy === 'high' ? 'rgba(var(--green-rgb, 76,175,80), 0.15)' :
                                  j.energy === 'low' ? 'rgba(var(--red-rgb, 244,67,54), 0.15)' : 'var(--bg3)',
                      color: j.energy === 'high' ? 'var(--green)' :
                             j.energy === 'low' ? 'var(--red)' : 'var(--t2)',
                    }}>
                      {j.energy}
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--t2)', lineHeight: 1.4 }}>
                  {j.raw_text.length > 180 ? j.raw_text.slice(0, 180) + '…' : j.raw_text}
                </div>
                {j.tags && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {j.tags.split(',').map(t => (
                      <span key={t} style={{ fontSize: 8, color: 'var(--t3)', padding: '1px 4px', background: 'var(--bg3)', borderRadius: 4 }}>
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Trigger Log (existing) ── */}
      <div className="panel fade d4" style={{ padding: 14 }}>
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

      {/* ── Reconsolidation Sessions (existing) ── */}
      {sessions.length > 0 && (
        <div className="panel fade d5" style={{ padding: 14 }}>
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
