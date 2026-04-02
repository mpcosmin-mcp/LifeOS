// ═══════════════════════════════════════════════
// Life OS — Data Layer
// Static JSON (exported daily) + API fallback
// ═══════════════════════════════════════════════

import type { LifeOSData } from './types';

// Auto-detect API host: use same hostname as the page (works for localhost + Tailscale)
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
const BASE_URL = import.meta.env.BASE_URL || '/';

export async function fetchLifeOSData(): Promise<LifeOSData> {
  // 1. Try live API FIRST (local FastAPI server)
  try {
    const res = await fetch(`${API_BASE}/api/all`);
    if (res.ok) {
      const data = await res.json();
      console.log('📊 Loaded LIVE data from FastAPI API:', data.lastUpdated);
      return data;
    }
  } catch (err) {
    console.warn('Live API unavailable, falling back to static JSON:', err);
  }

  // 2. Try static JSON fallback (works on GitHub Pages / offline)
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

  // 3. Empty fallback
  console.warn('⚠️ No data source available (API + static JSON both failed)');
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
