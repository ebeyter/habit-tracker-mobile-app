import { dayKey, today } from './date';
import type { Goal, StreakData } from './types';

function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffInDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Recomputes streak data from scratch out of the goals array (source of truth).
 * Recomputing rather than incrementing keeps undo, multi-completion-per-day and
 * app-restart scenarios correct without extra bookkeeping.
 */
function completionDayKeys(goals: Goal[]): string[] {
  const keys: string[] = [];
  for (const goal of goals) {
    if (goal.kind === 'onetime') {
      if (goal.status === 'completed' && goal.completedAt) {
        keys.push(dayKey(new Date(goal.completedAt)));
      }
    } else {
      keys.push(...goal.completedDates);
    }
  }
  return keys;
}

export function computeStreak(goals: Goal[]): StreakData {
  const dayKeys = Array.from(new Set(completionDayKeys(goals))).sort();

  if (dayKeys.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastCompletionDate: null };
  }

  let bestStreak = 1;
  let runLength = 1;

  for (let i = 1; i < dayKeys.length; i++) {
    const gap = diffInDays(keyToDate(dayKeys[i]), keyToDate(dayKeys[i - 1]));
    runLength = gap === 1 ? runLength + 1 : 1;
    bestStreak = Math.max(bestStreak, runLength);
  }

  const lastKey = dayKeys[dayKeys.length - 1];
  const gapToToday = diffInDays(today(), keyToDate(lastKey));

  let currentStreak = 0;
  if (gapToToday === 0 || gapToToday === 1) {
    // last completion was today or yesterday: walk backwards to find the run length
    currentStreak = 1;
    for (let i = dayKeys.length - 1; i > 0; i--) {
      const gap = diffInDays(keyToDate(dayKeys[i]), keyToDate(dayKeys[i - 1]));
      if (gap === 1) currentStreak++;
      else break;
    }
  }

  return { currentStreak, bestStreak, lastCompletionDate: lastKey };
}
