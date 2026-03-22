import { useMemo } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { categoryEmoji, fDateShort, daysAgo } from '../lib/helpers';
import type { LifeOSData } from '../lib/types';

const INCOME = 7000;

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 864e5);
}

function monthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleString('ro-RO', { month: 'short', year: 'numeric' });
}

export default function CalendarPage({ data }: { data: LifeOSData }) {
  const today = new Date().toISOString().split('T')[0];

  const upcoming = useMemo(() =>
    data.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
  [data, today]);

  // ══ NEXT 7 DAYS ══
  const next7 = useMemo(() => {
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    return upcoming.filter(e => e.date <= in7);
  }, [upcoming]);

  const next7Cost = next7.reduce((s, e) => s + (e.cost || 0), 0);

  // White space: assume 16 usable hrs/day × 7 = 112 hrs. Each event ~2hrs.
  const eventHours = next7.length * 2;
  const totalHours = 112;
  const freeHoursPct = Math.max(0, Math.round(((totalHours - eventHours) / totalHours) * 100));

  // ══ NEXT 30 DAYS — grouped by week ══
  const next30 = useMemo(() => {
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    return upcoming.filter(e => e.date <= in30);
  }, [upcoming]);

  const next30Cost = next30.reduce((s, e) => s + (e.cost || 0), 0);

  // Social tax: non-bill events with cost, or social/wedding/birthday types
  const socialTax = useMemo(() => {
    const in90 = new Date(Date.now() + 90 * 864e5).toISOString().split('T')[0];
    return upcoming.filter(e =>
      e.date <= in90 &&
      (e.type === 'wedding' || e.type === 'birthday' || e.type === 'nameday' || e.type === 'social')
    );
  }, [upcoming]);

  const socialTaxTotal = socialTax.reduce((s, e) => s + (e.cost || 0), 0);

  // ══ MONTHLY DISTRIBUTION (quarter + year heatmap) ══
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

  // ══ WARNING ZONES — months where cost > income ══
  const warningMonths = monthlyDist.filter(m => m.cost > INCOME * 0.7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={20} style={{ color: 'var(--purple)' }} /> Time & Wealth
      </h2>

      {/* ── Pattern Finder + 1% Action ── */}
      <EventsDiagnosis data={data} />

      {/* ═══ 1. NEXT 7 DAYS — Execution Mode ═══ */}
      <div className="panel fade d1" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Next 7 Days</span>
          <span className="font-data" style={{ fontSize: 10, color: next7Cost > 500 ? 'var(--red)' : 'var(--t3)' }}>
            {next7Cost > 0 ? `${next7Cost} lei` : 'no costs'}
          </span>
        </div>

        {/* White Space Indicator */}
        <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: freeHoursPct < 30 ? 'var(--red-bg)' : 'var(--green-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--t3)', letterSpacing: '0.5px' }}>Free Time</span>
            <span className="font-data" style={{ fontSize: 14, fontWeight: 800, color: freeHoursPct < 30 ? 'var(--red)' : 'var(--green)' }}>
              {freeHoursPct}%
            </span>
          </div>
          <div className="bar-track" style={{ height: 6 }}>
            <div className="bar-fill" style={{ width: `${freeHoursPct}%`, background: freeHoursPct < 30 ? 'var(--red)' : freeHoursPct < 60 ? 'var(--amber)' : 'var(--green)' }} />
          </div>
          {freeHoursPct < 30 && (
            <div style={{ fontSize: 9, color: 'var(--red)', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={10} /> At capacity — say no to new commitments
            </div>
          )}
        </div>

        {/* Timeline */}
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

      {/* ═══ 2. NEXT 30 DAYS — Anticipation Radar ═══ */}
      <div className="panel fade d2" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 13 }}>Next 30 Days</span>
          <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: next30Cost > INCOME ? 'var(--red)' : 'var(--t1)' }}>
            {next30Cost} lei committed
          </span>
        </div>

        {/* Cost timeline — grouped by date */}
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

        {/* Cash availability */}
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--t2)' }}>Cash needed vs available</span>
          <div style={{ textAlign: 'right' }}>
            <span className="font-data" style={{ fontSize: 12, fontWeight: 700, color: next30Cost > INCOME ? 'var(--red)' : 'var(--green)' }}>
              {next30Cost > INCOME ? '−' : '+'}{Math.abs(INCOME - next30Cost)} lei
            </span>
          </div>
        </div>
      </div>

      {/* ═══ 3. SOCIAL TAX PIPELINE ═══ */}
      {socialTax.length > 0 && (
        <div className="panel fade d3" style={{ padding: 16 }}>
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

      {/* ═══ 4. YEARLY HEATMAP — Seasonal Pressure ═══ */}
      <div className="panel fade d4" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'block' }}>
          Pressure Map <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>monthly load</span>
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }} className="pressure-grid">
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
        {warningMonths.length > 0 && (
          <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 6, background: 'var(--red-bg)', fontSize: 10, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} />
            <span>Warning months: {warningMonths.map(m => monthLabel(m.mo + '-01')).join(', ')} — plan reserves ahead</span>
          </div>
        )}
      </div>

      {/* ═══ 5. ALL UPCOMING (condensed) ═══ */}
      <div className="panel fade d5" style={{ padding: 16 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block', color: 'var(--t2)' }}>All Upcoming</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {upcoming.slice(0, 25).map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
              <span>{categoryEmoji(e.type)}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
              {e.cost > 0 && <span className="font-data" style={{ color: 'var(--red)', fontWeight: 600, flexShrink: 0 }}>{e.cost}</span>}
              <span className="font-data" style={{ color: 'var(--t3)', fontSize: 9, flexShrink: 0 }}>{fDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
