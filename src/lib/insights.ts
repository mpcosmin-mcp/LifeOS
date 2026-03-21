// ═══════════════════════════════════════════════
// Life OS — Data Insights Engine
// Finds correlations and patterns in real data
// ═══════════════════════════════════════════════

import type { HealthMetric, NutritionEntry, Transaction } from './types';

export interface Insight {
  text: string;
  emoji: string;
  tone: 'good' | 'neutral' | 'warn';
}

export function generateInsights(
  health: HealthMetric[],
  nutrition: NutritionEntry[],
  transactions: Transaction[],
): Insight[] {
  const insights: Insight[] = [];

  // Weight trend
  const weights = health.filter(h => h.weight_kg).map(h => ({ date: h.date, v: h.weight_kg! }));
  if (weights.length >= 3) {
    const first = weights[0].v;
    const last = weights[weights.length - 1].v;
    const diff = last - first;
    if (diff < -1) insights.push({ text: `Down ${Math.abs(diff).toFixed(1)}kg since ${weights[0].date.slice(5)}`, emoji: '📉', tone: 'good' });
    else if (diff > 1) insights.push({ text: `Up ${diff.toFixed(1)}kg since ${weights[0].date.slice(5)}`, emoji: '📈', tone: 'warn' });
  }

  // Sleep-RHR correlation
  const paired = health.filter(h => h.sleep_score && h.rhr);
  if (paired.length >= 5) {
    const goodSleep = paired.filter(h => h.sleep_score! >= 55);
    const badSleep = paired.filter(h => h.sleep_score! < 45);
    if (goodSleep.length && badSleep.length) {
      const avgRhrGood = goodSleep.reduce((s, h) => s + h.rhr!, 0) / goodSleep.length;
      const avgRhrBad = badSleep.reduce((s, h) => s + h.rhr!, 0) / badSleep.length;
      if (avgRhrBad - avgRhrGood > 2) {
        insights.push({
          text: `Better sleep → ${(avgRhrBad - avgRhrGood).toFixed(0)}bpm lower RHR next day`,
          emoji: '💤', tone: 'good',
        });
      }
    }
  }

  // Protein tracking
  const byDay = new Map<string, number>();
  nutrition.forEach(n => byDay.set(n.date, (byDay.get(n.date) || 0) + n.protein_g));
  const proteinDays = Array.from(byDay.entries());
  if (proteinDays.length >= 3) {
    const avg = proteinDays.reduce((s, [, v]) => s + v, 0) / proteinDays.length;
    if (avg < 100) insights.push({ text: `Avg protein ${Math.round(avg)}g/day — target 120g`, emoji: '🥩', tone: 'warn' });
    else insights.push({ text: `Protein on track: ${Math.round(avg)}g avg`, emoji: '💪', tone: 'good' });
  }

  // Vice spending
  const last7Txns = transactions.filter(t => {
    const d = new Date();
    const td = new Date(t.date);
    return (d.getTime() - td.getTime()) / 86400000 <= 7;
  });
  const viceSpend = last7Txns.filter(t => t.roi_flag === '-').reduce((s, t) => s + t.amount, 0);
  if (viceSpend > 50) {
    insights.push({ text: `${Math.round(viceSpend)} lei on -ROI this week`, emoji: '⚠️', tone: 'warn' });
  } else if (viceSpend === 0 && last7Txns.length > 0) {
    insights.push({ text: 'Zero -ROI spending this week!', emoji: '🎯', tone: 'good' });
  }

  // Steps trend
  const stepDays = health.filter(h => h.steps).slice(-7);
  if (stepDays.length >= 3) {
    const avg = stepDays.reduce((s, h) => s + h.steps!, 0) / stepDays.length;
    if (avg >= 8000) insights.push({ text: `${(avg / 1000).toFixed(1)}k avg steps — great!`, emoji: '🚶', tone: 'good' });
    else insights.push({ text: `${(avg / 1000).toFixed(1)}k avg steps — target 8k`, emoji: '🚶', tone: 'neutral' });
  }

  // HRV trend
  const hrvDays = health.filter(h => h.hrv).slice(-7);
  if (hrvDays.length >= 3) {
    const avg = hrvDays.reduce((s, h) => s + h.hrv!, 0) / hrvDays.length;
    if (avg < 30) insights.push({ text: `HRV avg ${Math.round(avg)}ms — recovery needed`, emoji: '❤️‍🩹', tone: 'warn' });
  }

  return insights.slice(0, 6);
}
