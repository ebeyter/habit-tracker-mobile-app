import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Goal, StreakData } from './types';

const GOALS_KEY = '@habit-tracker/goals';
const STREAK_KEY = '@habit-tracker/streak';

function isValidGoal(g: unknown): g is Goal {
  const kind = (g as { kind?: unknown } | null)?.kind;
  return kind === 'onetime' || kind === 'recurring';
}

/** Backfills fields added after a goal was first saved, so older local data keeps working. */
function normalizeGoal(g: Goal): Goal {
  const legacyNotificationId = (g as { notificationId?: string | null }).notificationId;
  const base = {
    ...g,
    category: g.category ?? 'genel',
    priority: g.priority ?? 'normal',
    subtasks: g.subtasks ?? [],
    notificationIds: g.notificationIds ?? (legacyNotificationId ? [legacyNotificationId] : []),
  };
  if (base.kind !== 'recurring') {
    return { ...base, reminderTime: base.reminderTime ?? '09:00' };
  }
  const legacyTime = (base as { reminderTime?: string }).reminderTime;
  return {
    ...base,
    recurrence: base.recurrence ?? { type: 'daily' },
    reminderTimes: base.reminderTimes ?? (legacyTime ? [legacyTime] : ['09:00']),
  };
}

export async function getGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Drops entries from an older, incompatible schema (e.g. missing `kind`) instead of crashing.
    return parsed.filter(isValidGoal).map(normalizeGoal);
  } catch {
    return [];
  }
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function getStreak(): Promise<StreakData | null> {
  const raw = await AsyncStorage.getItem(STREAK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StreakData;
  } catch {
    return null;
  }
}

export async function saveStreak(streak: StreakData): Promise<void> {
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}
