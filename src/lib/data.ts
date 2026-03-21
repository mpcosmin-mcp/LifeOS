// ═══════════════════════════════════════════════
// Life OS — Data Layer (real API)
// ═══════════════════════════════════════════════

import type { LifeOSData } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function fetchLifeOSData(): Promise<LifeOSData> {
  try {
    const res = await fetch(`${API_BASE}/api/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('API unavailable, using empty data', e);
    return EMPTY_DATA;
  }
}

const EMPTY_DATA: LifeOSData = {
  health: [],
  nutrition: [],
  workouts: [],
  transactions: [],
  events: [],
  psychology: { triggers: [], sessions: [], homework: [] },
  lastUpdated: new Date().toISOString(),
};
