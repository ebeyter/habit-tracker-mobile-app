import { addDays, dayKey, today } from './date';
import { completionDayKeys } from './streak';
import type { Category, Goal, GoalCategory } from './types';

export type ReportRange = 'week' | 'month';

export type DayBucket = { key: string; label: string; count: number };

export type Report = {
  days: DayBucket[];
  activeDays: number;
  totalDays: number;
  totalCompletions: number;
  byCategory: { category: GoalCategory; label: string; emoji: string; count: number }[];
};

function completionsForGoalOnDay(goal: Goal, key: string): number {
  if (goal.kind === 'recurring') {
    return goal.completedDates.includes(key) ? 1 : 0;
  }
  return goal.status === 'completed' && goal.completedAt && dayKey(new Date(goal.completedAt)) === key
    ? 1
    : 0;
}

export function buildReport(goals: Goal[], categories: Category[], range: ReportRange): Report {
  const totalDays = range === 'week' ? 7 : 30;
  const start = addDays(today(), -(totalDays - 1));

  const allKeys = completionDayKeys(goals);
  const countByKey = new Map<string, number>();
  for (const k of allKeys) {
    countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
  }

  const days: DayBucket[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(start, i);
    const key = dayKey(date);
    days.push({
      key,
      label:
        range === 'week'
          ? date.toLocaleDateString('tr-TR', { weekday: 'short' })
          : String(date.getDate()),
      count: countByKey.get(key) ?? 0,
    });
  }

  const windowKeys = new Set(days.map((d) => d.key));
  const byCategory = categories.map((c) => {
    let count = 0;
    for (const goal of goals) {
      if (goal.category !== c.id) continue;
      for (const key of windowKeys) {
        count += completionsForGoalOnDay(goal, key);
      }
    }
    return { category: c.id, label: c.label, emoji: c.emoji, count };
  }).filter((c) => c.count > 0);

  return {
    days,
    activeDays: days.filter((d) => d.count > 0).length,
    totalDays,
    totalCompletions: days.reduce((sum, d) => sum + d.count, 0),
    byCategory,
  };
}
