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

  // ══ OVERALL JOURNAL STATE — holistic analysis ══
  const journalState = useMemo(() => {
    const total = journalArr.length;
    if (!total) return null;

    // Mood distribution
    const moods = journalArr.map(j => j.mood).filter(Boolean) as string[];
    const negativeMoods = moods.filter(m => /overwhelm|absent|obosit|dureros|neputincios/.test(m || '')).length;
    const positiveMoods = moods.filter(m => /bun|prezent|pragmatic|lucid|deschis/.test(m || '')).length;
    const moodRatio = total > 0 ? Math.round((positiveMoods / moods.length) * 100) : 50;

    // Energy distribution
    const energies = journalArr.map(j => j.energy).filter(Boolean) as string[];
    const lowEnergy = energies.filter(e => e === 'low' || e === 'low-medium').length;
    const highEnergy = energies.filter(e => e === 'high' || e === 'medium').length;

    // Top 3 dominant patterns (by tag frequency)
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const dominantThemes = sortedTags.slice(0, 5);

    // Awareness trajectory: are later entries deeper than earlier?
    const earlyTags = journalArr.slice(Math.floor(total / 2)).flatMap(j => (j.tags || '').split(','));
    const lateTags = journalArr.slice(0, Math.floor(total / 2)).flatMap(j => (j.tags || '').split(','));
    const deepTags = ['awareness', 'clarity', 'breakthrough', 'self-healing', 'resilience'];
    const earlyDepth = earlyTags.filter(t => deepTags.includes(t.trim())).length;
    const lateDepth = lateTags.filter(t => deepTags.includes(t.trim())).length;
    const growthTrend = lateDepth > earlyDepth ? 'growing' : lateDepth === earlyDepth ? 'stable' : 'declining';

    // Core struggle (most repeated negative tag clusters)
    const struggleTags = ['vice', 'vice-loop', 'overwhelm', 'nutrition-fail', 'underfed', 'fog', 'absence', 'self-sabotage'];
    const struggleCount = sortedTags.filter(([t]) => struggleTags.includes(t)).reduce((s, [, c]) => s + c, 0);
    const growthTags = ['awareness', 'clarity', 'breakthrough', 'resilience', 'honesty', 'presence', 'self-healing'];
    const growthCount = sortedTags.filter(([t]) => growthTags.includes(t)).reduce((s, [, c]) => s + c, 0);

    return {
      total, moodRatio, negativeMoods, positiveMoods,
      lowEnergy, highEnergy,
      dominantThemes, growthTrend,
      struggleCount, growthCount,
      struggleRatio: Math.round((struggleCount / (struggleCount + growthCount || 1)) * 100),
    };
  }, [journalArr, tagCounts]);

  // 1% Better — holistic prescription based on overall state
  const dailyAction = useMemo(() => {
    if (!journalState) return { action: 'Scrie primul jurnal. Doar 3 rânduri: ce simți, ce observi, ce vrei.', source: 'No data yet', diagnosis: '' };

    const { moodRatio, dominantThemes, struggleRatio, growthTrend, lowEnergy, total } = journalState;
    const topTag = dominantThemes[0]?.[0] || '';

    // Overall diagnosis
    let diagnosis = '';
    if (struggleRatio > 65) {
      diagnosis = 'Pattern dominant: auto-sabotare activă. Viciile și overwhelm-ul ocupă >65% din jurnale. Sistemul nervos cere pauze, nu productivitate.';
    } else if (struggleRatio > 40) {
      diagnosis = 'Luptă activă cu pattern-urile. Awareness crește, dar acțiunea nu urmează constant. Gap între "știu" și "fac".';
    } else {
      diagnosis = 'Echilibru în construcție. Pattern-urile sunt identificate, acțiunile încep să prindă tracțiune.';
    }

    // Prescribe based on the dominant pattern
    const prescriptions: { condition: boolean; action: string; source: string }[] = [
      {
        condition: (tagCounts['vice'] || 0) + (tagCounts['vice-loop'] || 0) + (tagCounts['self-sabotage'] || 0) >= 3,
        action: 'Imediat când simți impulsul (bere, telefon, scroll): pune un timer de 10 min. Dacă după 10 min tot vrei — ok. Dar observă ce simțeai ÎNAINTE.',
        source: `Vice/self-sabotage apare în ${(tagCounts['vice'] || 0) + (tagCounts['vice-loop'] || 0)} din ${total} jurnale`,
      },
      {
        condition: (tagCounts['overwhelm'] || 0) + (tagCounts['physical-mess'] || 0) >= 2,
        action: 'Alege UN obiect din camera în care ești acum. Pune-l la locul lui. Atât. Mâine altul. Nu curățenie — doar un obiect.',
        source: `Overwhelm apare în ${tagCounts['overwhelm'] || 0} jurnale — paralizia vine din "totul deodată"`,
      },
      {
        condition: lowEnergy >= Math.ceil(total * 0.5),
        action: 'Culcă-te cu 30 min mai devreme diseară. Nu telefon în pat. Energie scăzută e cronică — somnul e singurul fix real.',
        source: `${lowEnergy}/${total} jurnale au energie low — deficit cronic`,
      },
      {
        condition: (tagCounts['awareness'] || 0) + (tagCounts['clarity'] || 0) >= 2 && growthTrend === 'growing',
        action: 'Continuă exact ce faci. Awareness crește. Azi: scrie ce ai observat DIFERIT față de acum o săptămână.',
        source: `Growth trend: ${growthTrend} — awareness tags cresc în jurnalele recente`,
      },
      {
        condition: moodRatio < 40,
        action: 'Ieși afară 15 min. Fără destinație, fără căști. Doar mers și respirat. Mood-ul se resetează prin mișcare, nu prin gândire.',
        source: `Mood pozitiv doar ${moodRatio}% din jurnale — corpul trebuie mișcat`,
      },
      {
        condition: (tagCounts['nutrition-fail'] || 0) + (tagCounts['underfed'] || 0) >= 2,
        action: 'Pregătește mâncarea de mâine AZI seara. Ouă fierte + iaurt = 5 min. Underfed → cravings → vices → regret.',
        source: `Nutriție problematică în ${(tagCounts['nutrition-fail'] || 0) + (tagCounts['underfed'] || 0)} jurnale`,
      },
    ];

    const match = prescriptions.find(p => p.condition);
    if (match) return { ...match, diagnosis };

    // Fallback
    return {
      action: 'Recitește jurnalul de ieri. Găsește UN lucru pe care l-ai făcut bine. Construiește pe el azi.',
      source: `${total} jurnale analizate`,
      diagnosis,
    };
  }, [journalState, tagCounts]);

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

      {/* ── Overall Diagnosis + 1% Action ── */}
      {journalState && (
        <div className="panel fade d1" style={{ padding: 16 }}>
          {/* Diagnosis */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Brain size={16} style={{ color: 'var(--purple)' }} />
              <span className="font-display" style={{ fontWeight: 700, fontSize: 13 }}>Overall State</span>
              <span style={{ fontSize: 9, color: 'var(--t3)' }}>from {journalState.total} journals</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>
              {dailyAction.diagnosis}
            </div>

            {/* Mini gauges */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <MiniGauge label="Mood +" pct={journalState.moodRatio} color={journalState.moodRatio > 50 ? 'var(--green)' : 'var(--red)'} />
              <MiniGauge label="Struggle" pct={journalState.struggleRatio} color={journalState.struggleRatio > 50 ? 'var(--red)' : 'var(--green)'} />
              <MiniGauge label="Growth" pct={100 - journalState.struggleRatio} color={journalState.struggleRatio < 50 ? 'var(--green)' : 'var(--amber)'} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <span style={{ color: 'var(--t3)' }}>Trend:</span>
                <span style={{
                  fontWeight: 700, fontSize: 10,
                  color: journalState.growthTrend === 'growing' ? 'var(--green)' : journalState.growthTrend === 'stable' ? 'var(--amber)' : 'var(--red)',
                }}>
                  {journalState.growthTrend === 'growing' ? '📈 Growing' : journalState.growthTrend === 'stable' ? '➡️ Stable' : '📉 Declining'}
                </span>
              </div>
            </div>
          </div>

          {/* 1% Action */}
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--green-bg)', borderLeft: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Target size={14} style={{ color: 'var(--green)' }} />
              <span className="font-display" style={{ fontWeight: 700, fontSize: 12, color: 'var(--green)' }}>1% Better Today</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.6, fontWeight: 500 }}>
              {dailyAction.action}
            </div>
            <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4, fontStyle: 'italic' }}>
              {dailyAction.source}
            </div>
          </div>
        </div>
      )}

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

function MiniGauge({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, color: 'var(--t3)', width: 44, flexShrink: 0 }}>{label}</span>
      <div className="bar-track" style={{ height: 5, width: 60 }}>
        <div className="bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: color, opacity: 0.6 }} />
      </div>
      <span className="font-data" style={{ fontSize: 9, fontWeight: 700, color, width: 26 }}>{pct}%</span>
    </div>
  );
}
