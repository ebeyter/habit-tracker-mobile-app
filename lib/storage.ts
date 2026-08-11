import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Goal, StreakData } from './types';

const GOALS_KEY = '@habit-tracker/goals';
const STREAK_KEY = '@habit-tracker/streak';

export async function getGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Goal[];
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
