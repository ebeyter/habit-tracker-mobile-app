import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CalendarEvent, TodoItem } from './types';

const TODOS_KEY = '@habit-tracker/todos';
const EVENTS_KEY = '@habit-tracker/events';

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function getTodos(): Promise<TodoItem[]> {
  return readList<TodoItem>(TODOS_KEY);
}

export async function saveTodos(todos: TodoItem[]): Promise<void> {
  await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export function getEvents(): Promise<CalendarEvent[]> {
  return readList<CalendarEvent>(EVENTS_KEY);
}

export async function saveEvents(events: CalendarEvent[]): Promise<void> {
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}
