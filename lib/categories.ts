import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_CATEGORIES, type Category } from './types';

const CUSTOM_CATEGORIES_KEY = '@habit-tracker/custom-categories';

export async function getCustomCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Category[]) : [];
  } catch {
    return [];
  }
}

export async function saveCustomCategories(categories: Category[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
}

export function allCategories(custom: Category[]): Category[] {
  return [...DEFAULT_CATEGORIES, ...custom];
}

export function findCategory(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function categoryEmoji(categories: Category[], id: string): string {
  return findCategory(categories, id)?.emoji ?? '🎯';
}
