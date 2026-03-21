// ═══════════════════════════════════════════════
// Life OS — Helper Functions
// ═══════════════════════════════════════════════

/** Delta between two values */
export function d(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null) return null;
  return Math.round((curr - prev) * 100) / 100;
}

/** Color for a delta value */
export function dColor(val: number | null, lowerBetter = false): string {
  if (val == null || val === 0) return 'var(--text3)';
  const good = lowerBetter ? val < 0 : val > 0;
  return good ? 'var(--neon-green)' : 'var(--neon-red)';
}

/** Format number with fallback */
export function f(v: number | null, dec = 1): string {
  if (v == null) return '\u2014';
  return v.toFixed(dec);
}

/** Format date as "Mar 21" style */
export function fDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format date as "21 mar" style (Romanian) */
export function fDateRo(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

/** ROI flag color */
export function roiColor(flag: string): string {
  if (flag === '+') return 'var(--neon-green)';
  if (flag === '-') return 'var(--neon-red)';
  return 'var(--text3)';
}

/** Category to emoji */
export function categoryEmoji(cat: string | null): string {
  const map: Record<string, string> = {
    food: '🍽️', transport: '🚗', social: '🍻', health: '💊',
    household: '🏠', subscriptions: '📱', other: '📦',
    sport: '🏃', event: '📅', bill: '💳', birthday: '🎂',
    reminder: '🔔', salary: '💰', running: '🏃',
    'cardio+sauna+cold plunge': '🧊', 'cardio+sauna': '🔥',
    indoor_cardio: '🚴',
  };
  return map[cat?.toLowerCase() ?? ''] ?? '📌';
}

/** Workout type emoji */
export function workoutEmoji(type: string): string {
  const map: Record<string, string> = {
    running: '🏃', indoor_cardio: '🚴', 'cardio+sauna': '🔥',
    'cardio+sauna+cold plunge': '🧊', gym: '🏋️', strength: '💪',
  };
  return map[type.toLowerCase()] ?? '🏃';
}

/** Days since a date */
export function daysAgo(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Score to color */
export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--neon-green)';
  if (score >= 60) return 'var(--neon-blue)';
  if (score >= 40) return 'var(--neon-orange)';
  return 'var(--neon-red)';
}

/** Score to label */
export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}
