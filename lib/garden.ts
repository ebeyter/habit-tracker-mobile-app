import { dayKey, isPastDay, startOfDay, today } from './date';
import { isDueOn } from './recurrence';
import type { Goal } from './types';

export type GrowthStage = 'seed' | 'sprout' | 'seedling' | 'budding' | 'blooming' | 'wilted';

export const STAGE_LABEL: Record<GrowthStage, string> = {
  seed: 'Tohum',
  sprout: 'Filiz',
  seedling: 'Fidan',
  budding: 'Tomurcuk',
  blooming: 'Çiçekte',
  wilted: 'Solgun',
};

/** Completions needed to reach each stage. */
const THRESHOLDS: { stage: Exclude<GrowthStage, 'wilted'>; min: number }[] = [
  { stage: 'blooming', min: 21 },
  { stage: 'budding', min: 10 },
  { stage: 'seedling', min: 4 },
  { stage: 'sprout', min: 1 },
  { stage: 'seed', min: 0 },
];

/** How many scheduled days a habit may be missed before its plant wilts. */
const WILT_AFTER_MISSED_DUE_DAYS = 3;

export type PlantState = {
  stage: GrowthStage;
  /** Completions banked so far */
  growth: number;
  /** Completions needed for the next stage, or null once fully grown */
  nextAt: number | null;
  /** 0..1 progress toward the next stage */
  progress: number;
  doneToday: boolean;
  dueToday: boolean;
};

function stageFor(growth: number): Exclude<GrowthStage, 'wilted'> {
  return THRESHOLDS.find((t) => growth >= t.min)!.stage;
}

function nextThreshold(growth: number): number | null {
  const ascending = [...THRESHOLDS].reverse();
  const next = ascending.find((t) => t.min > growth);
  return next ? next.min : null;
}

/** Counts how many scheduled days in a row were missed, walking back from yesterday. */
function missedDueDays(goal: Extract<Goal, { kind: 'recurring' }>): number {
  const done = new Set(goal.completedDates);
  let missed = 0;
  for (let back = 1; back <= 30; back++) {
    const day = new Date(today());
    day.setDate(day.getDate() - back);
    if (startOfDay(day).getTime() < startOfDay(new Date(goal.createdAt)).getTime()) break;
    if (!isDueOn(goal, day)) continue;
    if (done.has(dayKey(day))) break;
    missed++;
    if (missed >= WILT_AFTER_MISSED_DUE_DAYS) break;
  }
  return missed;
}

export function plantStateFor(goal: Goal): PlantState {
  if (goal.kind === 'recurring') {
    const growth = goal.completedDates.length;
    const doneToday = goal.completedDates.includes(dayKey(new Date()));
    const dueToday = isDueOn(goal, new Date());
    const wilted = missedDueDays(goal) >= WILT_AFTER_MISSED_DUE_DAYS;
    const base = stageFor(growth);
    const nextAt = nextThreshold(growth);
    const prevMin = THRESHOLDS.find((t) => t.stage === base)!.min;

    return {
      stage: wilted ? 'wilted' : base,
      growth,
      nextAt,
      progress: nextAt ? (growth - prevMin) / (nextAt - prevMin) : 1,
      doneToday,
      dueToday,
    };
  }

  // One-time goals grow with their subtasks and burst into bloom when completed.
  const doneSubtasks = goal.subtasks.filter((s) => s.done).length;
  const completed = goal.status === 'completed';
  const overdue = !completed && isPastDay(new Date(goal.deadline));
  const totalSubtasks = goal.subtasks.length;

  const stage: GrowthStage = completed
    ? 'blooming'
    : overdue
      ? 'wilted'
      : totalSubtasks === 0
        ? 'sprout'
        : doneSubtasks === 0
          ? 'seed'
          : doneSubtasks < totalSubtasks
            ? 'seedling'
            : 'budding';

  return {
    stage,
    growth: doneSubtasks,
    nextAt: totalSubtasks || null,
    progress: completed ? 1 : totalSubtasks ? doneSubtasks / totalSubtasks : 0,
    doneToday: completed,
    dueToday: !completed,
  };
}

/** One-line identity framing — "you are becoming someone who…" rather than a task label. */
export function identityLine(goal: Goal): string {
  return goal.kind === 'recurring'
    ? `${goal.completedDates.length} kez "${goal.title}" yapan biri`
    : goal.status === 'completed'
      ? `"${goal.title}" hedefini tamamlayan biri`
      : `"${goal.title}" için çalışan biri`;
}

export function gardenSummary(goals: Goal[]): { thriving: number; wilting: number; total: number } {
  let thriving = 0;
  let wilting = 0;
  for (const goal of goals) {
    const state = plantStateFor(goal);
    if (state.stage === 'wilted') wilting++;
    else if (state.stage === 'budding' || state.stage === 'blooming') thriving++;
  }
  return { thriving, wilting, total: goals.length };
}
