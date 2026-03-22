// ═══════════════════════════════════════════════
// Life OS — Core Types (mapped to real DB schemas)
// ═══════════════════════════════════════════════

// ── Health Metrics (from health_metrics table) ──
export interface HealthMetric {
  id: number;
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
  notes: string | null;
}

// ── Nutrition (from nutrition table) ──
export interface NutritionEntry {
  id: number;
  date: string;
  time: string | null;
  item: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  fiber_g: number;
  sugar_g: number;
  water_ml: number;
  sat_fat_g: number | null;
  unsat_fat_g: number | null;
  notes: string | null;
}

// ── Workouts (from workouts table) ──
export interface Workout {
  id: number;
  date: string;
  type: string;
  duration_min: number | null;
  distance_km: number | null;
  pace_min_km: number | null;
  heart_rate_avg: number | null;
  calories: number | null;
  notes: string | null;
  hr_zone1_min: number | null;
  hr_zone2_min: number | null;
  hr_zone3_min: number | null;
  hr_zone4_min: number | null;
  hr_zone5_min: number | null;
  max_hr: number | null;
}

// ── Finance (from transactions table) ──
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

// ── Calendar (from events table) ──
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
  recurring_pattern: string | null;
}

// ── Psychology ──
export interface TriggerEntry {
  id: number;
  date: string;
  time: string | null;
  trigger_type: string | null;
  situation: string | null;
  body_response: string | null;
  right_side_intensity: number | null;
  freeze_occurred: boolean;
  dominant_thought: string | null;
  action_taken: string | null;
  notes: string | null;
}

export interface ReconsolidationSession {
  id: number;
  session_number: number;
  date: string;
  target_memory: string | null;
  core_belief_activation: string | null;
  right_shoulder: number | null;
  right_palm: number | null;
  right_foot: number | null;
  verbal_freeze: boolean;
  dominant_thought: string | null;
  mismatch_used: string | null;
  physical_change: string | null;
  emotional_change: string | null;
  belief_update: string | null;
  homework: string | null;
  escalation_flag: boolean;
  notes: string | null;
}

// ── Journal ──
export interface JournalEntry {
  id: number;
  date: string;
  mood: string | null;
  energy: string | null;
  raw_text: string;
  tags: string | null;
  created_at: string;
}

export interface JournalInsight {
  id: number;
  date_generated: string;
  insight_type: 'pattern' | 'observation' | 'breakthrough' | 'improvement' | 'warning';
  content: string;
  source_dates: string | null;
  created_at: string;
}

// ── Unified Response ──
export interface LifeOSData {
  health: HealthMetric[];
  nutrition: NutritionEntry[];
  workouts: Workout[];
  transactions: Transaction[];
  events: CalendarEvent[];
  psychology: {
    triggers: TriggerEntry[];
    sessions: ReconsolidationSession[];
    homework: any[];
    journal: JournalEntry[];
    insights: JournalInsight[];
  };
  lastUpdated: string;
}

// ── Navigation ──
export type Page = 'overview' | 'health' | 'finance' | 'calendar' | 'psychology';

// ── Life Score ──
export interface LifeScore {
  total: number;       // 0-100
  sleep: number;       // 0-100
  activity: number;    // 0-100
  nutrition: number;   // 0-100
  finance: number;     // 0-100
  recovery: number;    // 0-100
}
