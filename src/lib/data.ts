// ═══════════════════════════════════════════════
// Life OS — Data Layer
// Static JSON (exported daily) + API fallback
// ═══════════════════════════════════════════════

import type { LifeOSData } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const BASE_URL = import.meta.env.BASE_URL || '/';

export async function fetchLifeOSData(): Promise<LifeOSData> {
  // 1. Try static JSON (works on GitHub Pages)
  try {
    const res = await fetch(`${BASE_URL}data/all.json`);
    if (res.ok) {
      const data = await res.json();
      if (data.health?.length || data.transactions?.length) {
        console.log('📊 Loaded static data from', data.lastUpdated);
        return data;
      }
    }
  } catch { /* fall through */ }

  // 2. Try live API (works locally)
  try {
    const res = await fetch(`${API_BASE}/api/all`);
    if (res.ok) return await res.json();
  } catch { /* fall through */ }

  // 3. Empty fallback
  console.warn('No data source available');
  return EMPTY_DATA;
}

const EMPTY_DATA: LifeOSData = {
  health: [],
  nutrition: [],
  workouts: [],
  transactions: [],
  events: [],
  psychology: { triggers: [], sessions: [], homework: [], journal: [], insights: [] },
  lastUpdated: new Date().toISOString(),
};
