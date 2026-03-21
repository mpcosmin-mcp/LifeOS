// ═══════════════════════════════════════════════
// Life OS — Life Score Engine
// Composite score from real health/finance data
// ═══════════════════════════════════════════════

import type { HealthMetric, NutritionEntry, Transaction, Workout, LifeScore } from './types';

// ── Sleep Score (0-100) ──
// Garmin sleep score maps directly (already 0-100)
function scoreSleep(recent: HealthMetric[]): number {
  const scores = recent.filter(h => h.sleep_score != null).map(h => h.sleep_score!);
  if (!scores.length) return 50;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(100, Math.max(0, avg));
}

// ── Activity Score (0-100) ──
// Based on steps + workouts in last 7 days
function scoreActivity(recent: HealthMetric[], workouts: Workout[]): number {
  // Steps component (target: 8000/day avg)
  const stepsData = recent.filter(h => h.steps != null).map(h => h.steps!);
  const avgSteps = stepsData.length ? stepsData.reduce((a, b) => a + b, 0) / stepsData.length : 0;
  const stepsScore = Math.min(100, (avgSteps / 8000) * 100);

  // Workout component (target: 3+ per week)
  const recentWorkouts = workouts.filter(w => {
    const d = daysDiff(w.date);
    return d <= 7;
  });
  const workoutScore = Math.min(100, (recentWorkouts.length / 3) * 100);

  return stepsScore * 0.6 + workoutScore * 0.4;
}

// ── Nutrition Score (0-100) ──
// Protein target, calorie range, water intake
function scoreNutrition(nutrition: NutritionEntry[]): number {
  const today = todayStr();
  const last3 = getLast3Days();
  const recent = nutrition.filter(n => last3.includes(n.date));

  if (!recent.length) return 30;

  // Group by day
  const byDay = new Map<string, NutritionEntry[]>();
  recent.forEach(n => {
    const arr = byDay.get(n.date) || [];
    arr.push(n);
    byDay.set(n.date, arr);
  });

  let totalScore = 0;
  let days = 0;

  byDay.forEach((meals, date) => {
    const cal = meals.reduce((s, m) => s + m.calories, 0);
    const protein = meals.reduce((s, m) => s + m.protein_g, 0);
    const water = meals.reduce((s, m) => s + m.water_ml, 0);

    // Calories: target 1800-2200
    let calScore = cal >= 1600 && cal <= 2400 ? 100 : cal < 1200 ? 30 : cal > 3000 ? 20 : 60;
    // Protein: target 120g+
    let proteinScore = Math.min(100, (protein / 120) * 100);
    // Water: target 3000ml
    let waterScore = Math.min(100, (water / 3000) * 100);

    totalScore += calScore * 0.3 + proteinScore * 0.4 + waterScore * 0.3;
    days++;
  });

  return days ? totalScore / days : 30;
}

// ── Finance Score (0-100) ──
// Based on ROI discipline: fewer - flags, more + flags
function scoreFinance(transactions: Transaction[]): number {
  const last7 = transactions.filter(t => daysDiff(t.date) <= 7);
  if (!last7.length) return 70;

  const total = last7.length;
  const positive = last7.filter(t => t.roi_flag === '+').length;
  const negative = last7.filter(t => t.roi_flag === '-').length;
  const neutral = last7.filter(t => t.roi_flag === '0').length;

  // Negative spending penalty
  const negativeRatio = negative / total;
  const positiveRatio = positive / total;

  // Vice spending (bere, tigari) extra penalty
  const viceAmount = last7
    .filter(t => t.roi_flag === '-' && t.category === 'social')
    .reduce((s, t) => s + t.amount, 0);
  const vicePenalty = Math.min(30, viceAmount / 5);

  return Math.max(0, Math.min(100, 70 + positiveRatio * 30 - negativeRatio * 40 - vicePenalty));
}

// ── Recovery Score (0-100) ──
// HRV + RHR trends (higher HRV = better, lower RHR = better)
function scoreRecovery(recent: HealthMetric[]): number {
  const hrvData = recent.filter(h => h.hrv != null).map(h => h.hrv!);
  const rhrData = recent.filter(h => h.rhr != null).map(h => h.rhr!);

  // HRV: target 40+ (currently baseline ~34)
  const avgHrv = hrvData.length ? hrvData.reduce((a, b) => a + b, 0) / hrvData.length : 34;
  const hrvScore = Math.min(100, (avgHrv / 50) * 100);

  // RHR: target <60 (currently ~67)
  const avgRhr = rhrData.length ? rhrData.reduce((a, b) => a + b, 0) / rhrData.length : 67;
  const rhrScore = avgRhr <= 55 ? 100 : avgRhr >= 80 ? 20 : Math.max(20, 100 - (avgRhr - 55) * 3.2);

  return hrvScore * 0.5 + rhrScore * 0.5;
}

// ── Composite Life Score ──
export function calculateLifeScore(
  health: HealthMetric[],
  nutrition: NutritionEntry[],
  transactions: Transaction[],
  workouts: Workout[],
): LifeScore {
  const recent7 = health.filter(h => daysDiff(h.date) <= 7);

  const sleep = scoreSleep(recent7);
  const activity = scoreActivity(recent7, workouts);
  const nutri = scoreNutrition(nutrition);
  const finance = scoreFinance(transactions);
  const recovery = scoreRecovery(recent7);

  const total = sleep * 0.2 + activity * 0.25 + nutri * 0.25 + finance * 0.15 + recovery * 0.15;

  return {
    total: Math.round(total),
    sleep: Math.round(sleep),
    activity: Math.round(activity),
    nutrition: Math.round(nutri),
    finance: Math.round(finance),
    recovery: Math.round(recovery),
  };
}

// ── Helpers ──
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getLast3Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function daysDiff(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
