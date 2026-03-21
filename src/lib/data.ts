// ═══════════════════════════════════════════════
// Life OS — Data Layer
// Fetches from unified API or falls back to demo
// ═══════════════════════════════════════════════

import type { LifeOSData } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function fetchLifeOSData(): Promise<LifeOSData> {
  try {
    const res = await fetch(`${API_BASE}/api/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.warn('API unavailable, using demo data');
    return DEMO_DATA;
  }
}

// Minimal demo data for offline/dev use
const DEMO_DATA: LifeOSData = {
  health: [
    { date: '2026-03-09', sleep_score: 48, rhr: 67, hrv: 34, weight_kg: 79.8, body_fat_pct: 22.5, visceral_fat: 10, protein_g: 80, carbs_g: 120, fat_g: 60, calories: 1800, water_pct: 54, steps: 6200 },
    { date: '2026-03-10', sleep_score: 55, rhr: 65, hrv: 38, weight_kg: 79.5, body_fat_pct: 22.3, visceral_fat: 10, protein_g: 90, carbs_g: 110, fat_g: 55, calories: 1700, water_pct: 56, steps: 7100 },
    { date: '2026-03-11', sleep_score: 62, rhr: 64, hrv: 40, weight_kg: 79.3, body_fat_pct: 22.1, visceral_fat: 9, protein_g: 95, carbs_g: 100, fat_g: 50, calories: 1650, water_pct: 58, steps: 8400 },
  ],
  nutrition: [
    { id: 1, date: '2026-03-09', time: '12:00', item: 'Piept de pui + orez', protein_g: 40, carbs_g: 50, fat_g: 8, calories: 450, water_ml: 500 },
    { id: 2, date: '2026-03-09', time: '19:00', item: 'Salam + ouă + pâine', protein_g: 30, carbs_g: 40, fat_g: 35, calories: 600, water_ml: 700 },
  ],
  workouts: [
    { id: 1, date: '2026-03-09', type: 'running', duration_min: 42, distance_km: 7.0, pace_min_km: 6.0, heart_rate_avg: 155, calories: 520 },
  ],
  transactions: [
    { id: 1, date: '2026-03-09', description: 'Cafea oraș', amount: 20, category: 'social', roi_flag: '0', quantity: null, unit_price: null },
    { id: 2, date: '2026-03-09', description: 'Bere x3', amount: 15, category: 'social', roi_flag: '-', quantity: 3, unit_price: 5 },
  ],
  events: [
    { id: '1', title: 'Alergare outdoor', date: '2026-03-09', type: 'sport', cost: 0, currency: 'lei', location: 'Parc', notes: '', recurring: false },
    { id: '2', title: 'Meeting Gagea', date: '2026-03-10', type: 'event', cost: 0, currency: 'lei', location: 'Cafenea', notes: 'AI + Business', recurring: false },
  ],
  triggers: [],
  lastUpdated: new Date().toISOString(),
};
