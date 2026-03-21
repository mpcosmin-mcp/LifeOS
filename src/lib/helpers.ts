// ═══════════════════════════════════════════════
// Life OS — Helper Functions
// ═══════════════════════════════════════════════

/** Delta between two values */
export function d(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null) return null;
  return Math.round((curr - prev) * 100) / 100;
}

/** Percentage delta */
export function dPct(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 10000) / 100;
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

/** Format date for display */
export function fDate(dateStr: string, short = false): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (short) {
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Format date as "Mar 21" style */
export function fDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    sport: '🏃', event: '📅', bill: '📋', birthday: '🎂',
  };
  return map[cat?.toLowerCase() ?? ''] ?? '📦';
}
