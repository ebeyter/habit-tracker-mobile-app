import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { allCategories, getCustomCategories, saveCustomCategories } from '@/lib/categories';
import { dayKey } from '@/lib/date';
import { generateId } from '@/lib/id';
import {
  cancelGoalReminders,
  configureNotificationHandler,
  getPermissionStatus,
  rescheduleGoalReminder,
  scheduleEventReminder,
  scheduleGoalReminder,
  type PermissionStatus,
  type ScheduleResult,
} from '@/lib/notifications';
import { getEvents, getTodos, saveEvents, saveTodos } from '@/lib/planner-storage';
import { getGoals, getStreak, saveGoals, saveStreak } from '@/lib/storage';
import { computeStreak } from '@/lib/streak';
import type { CalendarEvent, Category, Goal, NewGoalInput, StreakData, TodoItem } from '@/lib/types';

type SaveOutcome = { goal: Goal; scheduleReason: ScheduleResult['reason'] };

type GoalsContextValue = {
  goals: Goal[];
  streak: StreakData;
  permissionStatus: PermissionStatus;
  loading: boolean;
  addGoal: (input: NewGoalInput) => Promise<SaveOutcome>;
  updateGoal: (id: string, input: NewGoalInput) => Promise<SaveOutcome>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  undoComplete: (id: string) => Promise<void>;
  toggleRecurringToday: (id: string) => Promise<void>;
  toggleRecurringOnDate: (id: string, date: Date) => Promise<void>;
  toggleSubtask: (goalId: string, subtaskId: string) => Promise<void>;
  categories: Category[];
  addCategory: (label: string, emoji: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  todos: TodoItem[];
  addTodo: (title: string, dueDate?: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  clearDoneTodos: () => Promise<void>;
  events: CalendarEvent[];
  addEvent: (input: { title: string; date: string; time?: string; note?: string }) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refreshPermission: () => Promise<void>;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastCompletionDate: null,
  });
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const goalsRef = useRef<Goal[]>([]);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  useEffect(() => {
    configureNotificationHandler();
    (async () => {
      const [loadedGoals, status, cachedStreak, loadedCategories, loadedTodos, loadedEvents] =
        await Promise.all([
          getGoals(),
          getPermissionStatus(),
          getStreak(),
          getCustomCategories(),
          getTodos(),
          getEvents(),
        ]);
      goalsRef.current = loadedGoals;
      setGoals(loadedGoals);
      setPermissionStatus(status);
      setCustomCategories(loadedCategories);
      setTodos(loadedTodos);
      setEvents(loadedEvents);
      // Recompute from goals as the source of truth; falls back to cached value only if goals are empty.
      const freshStreak = computeStreak(loadedGoals);
      setStreak(loadedGoals.length ? freshStreak : cachedStreak ?? freshStreak);
      await saveStreak(freshStreak);
      setLoading(false);
    })();
  }, []);

  async function commit(nextGoals: Goal[]) {
    goalsRef.current = nextGoals;
    setGoals(nextGoals);
    await saveGoals(nextGoals);
    const nextStreak = computeStreak(nextGoals);
    setStreak(nextStreak);
    await saveStreak(nextStreak);
  }

  async function addGoal(input: NewGoalInput): Promise<SaveOutcome> {
    const { notificationIds, reason } = await scheduleGoalReminder(input);
    setPermissionStatus(await getPermissionStatus());

    const base = {
      id: generateId(),
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      subtasks: input.subtasks,
      createdAt: new Date().toISOString(),
      notificationIds,
    };

    const goal: Goal =
      input.kind === 'onetime'
        ? {
            ...base,
            kind: 'onetime',
            deadline: input.deadline,
            reminderDaysBefore: input.reminderDaysBefore,
            targetAmount: input.targetAmount,
            targetUnit: input.targetUnit,
            status: 'active',
          }
        : {
            ...base,
            kind: 'recurring',
            recurrence: input.recurrence,
            reminderTimes: input.reminderTimes,
            completedDates: [],
          };

    await commit([goal, ...goalsRef.current]);
    return { goal, scheduleReason: reason };
  }

  async function updateGoal(id: string, input: NewGoalInput): Promise<SaveOutcome> {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing) throw new Error(`Goal ${id} not found`);

    let notificationIds = existing.notificationIds;
    let scheduleReason: ScheduleResult['reason'] = null;
    let updated: Goal;

    if (input.kind === 'onetime' && existing.kind === 'onetime') {
      const scheduleRelevantChange =
        existing.deadline !== input.deadline || existing.reminderDaysBefore !== input.reminderDaysBefore;
      if (scheduleRelevantChange) {
        const res = await rescheduleGoalReminder({ ...input, notificationIds: existing.notificationIds });
        notificationIds = res.notificationIds;
        scheduleReason = res.reason;
        setPermissionStatus(await getPermissionStatus());
      }
      updated = {
        ...existing,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        subtasks: input.subtasks,
        deadline: input.deadline,
        reminderDaysBefore: input.reminderDaysBefore,
        targetAmount: input.targetAmount,
        targetUnit: input.targetUnit,
        notificationIds,
      };
    } else if (input.kind === 'recurring' && existing.kind === 'recurring') {
      const scheduleRelevantChange =
        JSON.stringify(existing.reminderTimes) !== JSON.stringify(input.reminderTimes) ||
        JSON.stringify(existing.recurrence) !== JSON.stringify(input.recurrence);
      if (scheduleRelevantChange) {
        const res = await rescheduleGoalReminder({ ...input, notificationIds: existing.notificationIds });
        notificationIds = res.notificationIds;
        scheduleReason = res.reason;
        setPermissionStatus(await getPermissionStatus());
      }
      updated = {
        ...existing,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        subtasks: input.subtasks,
        recurrence: input.recurrence,
        reminderTimes: input.reminderTimes,
        notificationIds,
      };
    } else {
      throw new Error('Goal kind cannot change after creation');
    }

    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
    return { goal: updated, scheduleReason };
  }

  async function deleteGoal(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    await cancelGoalReminders(existing?.notificationIds);
    await commit(goalsRef.current.filter((g) => g.id !== id));
  }

  async function completeGoal(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing || existing.kind !== 'onetime') return;
    await cancelGoalReminders(existing.notificationIds);
    const updated: Goal = {
      ...existing,
      status: 'completed',
      completedAt: new Date().toISOString(),
      notificationIds: [],
    };
    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
  }

  async function undoComplete(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing || existing.kind !== 'onetime') return;
    const { notificationIds } = await scheduleGoalReminder({
      kind: 'onetime',
      title: existing.title,
      category: existing.category,
      priority: existing.priority,
      subtasks: existing.subtasks,
      deadline: existing.deadline,
      reminderDaysBefore: existing.reminderDaysBefore,
    });
    setPermissionStatus(await getPermissionStatus());
    const updated: Goal = {
      ...existing,
      status: 'active',
      completedAt: undefined,
      notificationIds,
    };
    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
  }

  async function toggleRecurringOnDate(id: string, date: Date) {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing || existing.kind !== 'recurring') return;
    const key = dayKey(date);
    const done = existing.completedDates.includes(key);
    const updated: Goal = {
      ...existing,
      completedDates: done
        ? existing.completedDates.filter((d) => d !== key)
        : [...existing.completedDates, key],
    };
    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
  }

  async function toggleRecurringToday(id: string) {
    await toggleRecurringOnDate(id, new Date());
  }

  async function toggleSubtask(goalId: string, subtaskId: string) {
    const existing = goalsRef.current.find((g) => g.id === goalId);
    if (!existing) return;
    const updated: Goal = {
      ...existing,
      subtasks: existing.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)),
    };
    await commit(goalsRef.current.map((g) => (g.id === goalId ? updated : g)));
  }

  async function addCategory(label: string, emoji: string): Promise<Category> {
    const category: Category = { id: generateId(), label: label.trim(), emoji, custom: true };
    const next = [...customCategories, category];
    setCustomCategories(next);
    await saveCustomCategories(next);
    return category;
  }

  /** Goals in a deleted category fall back to "genel" so nothing ends up orphaned. */
  async function deleteCategory(id: string) {
    const next = customCategories.filter((c) => c.id !== id);
    setCustomCategories(next);
    await saveCustomCategories(next);
    if (goalsRef.current.some((g) => g.category === id)) {
      await commit(goalsRef.current.map((g) => (g.category === id ? { ...g, category: 'genel' } : g)));
    }
  }

  async function commitTodos(next: TodoItem[]) {
    setTodos(next);
    await saveTodos(next);
  }

  async function addTodo(title: string, dueDate?: string) {
    const todo: TodoItem = {
      id: generateId(),
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      dueDate,
    };
    await commitTodos([...todos, todo]);
  }

  async function toggleTodo(id: string) {
    await commitTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  async function deleteTodo(id: string) {
    await commitTodos(todos.filter((t) => t.id !== id));
  }

  async function clearDoneTodos() {
    await commitTodos(todos.filter((t) => !t.done));
  }

  async function commitEvents(next: CalendarEvent[]) {
    setEvents(next);
    await saveEvents(next);
  }

  async function addEvent(input: { title: string; date: string; time?: string; note?: string }) {
    const { notificationIds } = await scheduleEventReminder(input.title, input.date, input.time);
    setPermissionStatus(await getPermissionStatus());
    const event: CalendarEvent = { id: generateId(), ...input, notificationIds };
    await commitEvents([...events, event]);
  }

  async function deleteEvent(id: string) {
    const existing = events.find((e) => e.id === id);
    await cancelGoalReminders(existing?.notificationIds);
    await commitEvents(events.filter((e) => e.id !== id));
  }

  async function refreshPermission() {
    setPermissionStatus(await getPermissionStatus());
  }

  const value = useMemo<GoalsContextValue>(
    () => ({
      goals,
      streak,
      permissionStatus,
      loading,
      addGoal,
      updateGoal,
      deleteGoal,
      completeGoal,
      undoComplete,
      toggleRecurringToday,
      toggleRecurringOnDate,
      toggleSubtask,
      categories: allCategories(customCategories),
      addCategory,
      deleteCategory,
      todos,
      addTodo,
      toggleTodo,
      deleteTodo,
      clearDoneTodos,
      events,
      addEvent,
      deleteEvent,
      refreshPermission,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goals, streak, permissionStatus, loading, customCategories, todos, events]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within a GoalsProvider');
  return ctx;
}
