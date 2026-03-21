// ═══════════════════════════════════════════════
// Life OS — Core Types
// ═══════════════════════════════════════════════

// ── Health ────────────────────────────────────
export interface HealthMetric {
  date: string;
  sleep_score: number | null;
  rhr: number | null;
  hrv: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  visceral_fat: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  calories: number | null;
  water_pct: number | null;
  steps: number | null;
}

export interface NutritionEntry {
  id: number;
  date: string;
  time: string | null;
  item: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  water_ml: number;
}

export interface Workout {
  id: number;
  date: string;
  type: string;
  duration_min: number | null;
  distance_km: number | null;
  pace_min_km: number | null;
  heart_rate_avg: number | null;
  calories: number | null;
}

// ── Finance ──────────────────────────────────
export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  roi_flag: '+' | '-' | '0';
  quantity: number | null;
  unit_price: number | null;
}

// ── Calendar ─────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  cost: number;
  currency: string;
  location: string;
  notes: string;
  recurring: boolean;
}

// ── Psychology ───────────────────────────────
export interface TriggerEntry {
  id: number;
  date: string;
  time: string | null;
  trigger_type: string | null;
  situation: string | null;
  right_side_intensity: number | null;
  freeze_occurred: boolean;
  dominant_thought: string | null;
  action_taken: string | null;
}

// ── Unified ──────────────────────────────────
export interface LifeOSData {
  health: HealthMetric[];
  nutrition: NutritionEntry[];
  workouts: Workout[];
  transactions: Transaction[];
  events: CalendarEvent[];
  triggers: TriggerEntry[];
  lastUpdated: string;
}

// ── Metric Definition ────────────────────────
export interface MetricDef {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  icon: string;
  lowerBetter?: boolean;
  category: 'health' | 'finance' | 'calendar' | 'psychology';
  color: string;
}

// ── Navigation ───────────────────────────────
export type Page = 'overview' | 'health' | 'finance' | 'calendar' | 'psychology';
