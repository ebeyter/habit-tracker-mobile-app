import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { dayKey } from '@/lib/date';
import { generateId } from '@/lib/id';
import {
  cancelGoalReminder,
  configureNotificationHandler,
  getPermissionStatus,
  rescheduleGoalReminder,
  scheduleGoalReminder,
  type PermissionStatus,
  type ScheduleResult,
} from '@/lib/notifications';
import { getGoals, getStreak, saveGoals, saveStreak } from '@/lib/storage';
import { computeStreak } from '@/lib/streak';
import type { Goal, NewGoalInput, StreakData } from '@/lib/types';

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
  const [loading, setLoading] = useState(true);

  const goalsRef = useRef<Goal[]>([]);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  useEffect(() => {
    configureNotificationHandler();
    (async () => {
      const [loadedGoals, status, cachedStreak] = await Promise.all([
        getGoals(),
        getPermissionStatus(),
        getStreak(),
      ]);
      goalsRef.current = loadedGoals;
      setGoals(loadedGoals);
      setPermissionStatus(status);
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
    const { notificationId, reason } = await scheduleGoalReminder(input);
    setPermissionStatus(await getPermissionStatus());

    const base = {
      id: generateId(),
      title: input.title,
      description: input.description,
      createdAt: new Date().toISOString(),
      notificationId,
    };

    const goal: Goal =
      input.kind === 'onetime'
        ? {
            ...base,
            kind: 'onetime',
            deadline: input.deadline,
            reminderDaysBefore: input.reminderDaysBefore,
            status: 'active',
          }
        : { ...base, kind: 'recurring', reminderTime: input.reminderTime, completedDates: [] };

    await commit([goal, ...goalsRef.current]);
    return { goal, scheduleReason: reason };
  }

  async function updateGoal(id: string, input: NewGoalInput): Promise<SaveOutcome> {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing) throw new Error(`Goal ${id} not found`);

    let notificationId = existing.notificationId ?? null;
    let scheduleReason: ScheduleResult['reason'] = null;
    let updated: Goal;

    if (input.kind === 'onetime' && existing.kind === 'onetime') {
      const scheduleRelevantChange =
        existing.deadline !== input.deadline || existing.reminderDaysBefore !== input.reminderDaysBefore;
      if (scheduleRelevantChange) {
        const res = await rescheduleGoalReminder({ ...input, notificationId: existing.notificationId });
        notificationId = res.notificationId;
        scheduleReason = res.reason;
        setPermissionStatus(await getPermissionStatus());
      }
      updated = {
        ...existing,
        title: input.title,
        description: input.description,
        deadline: input.deadline,
        reminderDaysBefore: input.reminderDaysBefore,
        notificationId,
      };
    } else if (input.kind === 'recurring' && existing.kind === 'recurring') {
      const scheduleRelevantChange = existing.reminderTime !== input.reminderTime;
      if (scheduleRelevantChange) {
        const res = await rescheduleGoalReminder({ ...input, notificationId: existing.notificationId });
        notificationId = res.notificationId;
        scheduleReason = res.reason;
        setPermissionStatus(await getPermissionStatus());
      }
      updated = {
        ...existing,
        title: input.title,
        description: input.description,
        reminderTime: input.reminderTime,
        notificationId,
      };
    } else {
      throw new Error('Goal kind cannot change after creation');
    }

    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
    return { goal: updated, scheduleReason };
  }

  async function deleteGoal(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    await cancelGoalReminder(existing?.notificationId);
    await commit(goalsRef.current.filter((g) => g.id !== id));
  }

  async function completeGoal(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing || existing.kind !== 'onetime') return;
    await cancelGoalReminder(existing.notificationId);
    const updated: Goal = {
      ...existing,
      status: 'completed',
      completedAt: new Date().toISOString(),
      notificationId: null,
    };
    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
  }

  async function undoComplete(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing || existing.kind !== 'onetime') return;
    const { notificationId } = await scheduleGoalReminder({
      kind: 'onetime',
      title: existing.title,
      deadline: existing.deadline,
      reminderDaysBefore: existing.reminderDaysBefore,
    });
    setPermissionStatus(await getPermissionStatus());
    const updated: Goal = {
      ...existing,
      status: 'active',
      completedAt: undefined,
      notificationId,
    };
    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
  }

  async function toggleRecurringToday(id: string) {
    const existing = goalsRef.current.find((g) => g.id === id);
    if (!existing || existing.kind !== 'recurring') return;
    const key = dayKey(new Date());
    const done = existing.completedDates.includes(key);
    const updated: Goal = {
      ...existing,
      completedDates: done
        ? existing.completedDates.filter((d) => d !== key)
        : [...existing.completedDates, key],
    };
    await commit(goalsRef.current.map((g) => (g.id === id ? updated : g)));
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
      refreshPermission,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goals, streak, permissionStatus, loading]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within a GoalsProvider');
  return ctx;
}
