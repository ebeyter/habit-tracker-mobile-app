export type GoalStatus = 'active' | 'completed';
export type GoalKind = 'onetime' | 'recurring';
/** Ids of the built-in categories plus any the user creates, so this stays an open string type. */
export type GoalCategory = string;
export type Priority = 'low' | 'normal' | 'high';

export type Category = { id: GoalCategory; label: string; emoji: string; custom?: boolean };

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'genel', label: 'Genel', emoji: '🎯' },
  { id: 'saglik', label: 'Sağlık', emoji: '💪' },
  { id: 'egitim', label: 'Eğitim', emoji: '📚' },
  { id: 'is', label: 'İş', emoji: '💼' },
  { id: 'kisisel', label: 'Kişisel', emoji: '🌱' },
];

export const PRIORITIES: { id: Priority; label: string; symbol: string }[] = [
  { id: 'low', label: 'Düşük', symbol: '!' },
  { id: 'normal', label: 'Orta', symbol: '!!' },
  { id: 'high', label: 'Yüksek', symbol: '!!!' },
];

/** 0 = Sunday … 6 = Saturday, matching Date#getDay */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Recurrence =
  | { type: 'daily' }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'everyN'; n: number };

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

type BaseGoal = {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: Priority;
  subtasks: Subtask[];
  createdAt: string;
  /** expo-notifications identifiers; empty when nothing is scheduled (permission denied, or reminder time already passed) */
  notificationIds: string[];
};

export type OneTimeGoal = BaseGoal & {
  kind: 'onetime';
  /** ISO date string, local midnight of the deadline day */
  deadline: string;
  /** How many days before the deadline to send the reminder (0 = same day) */
  reminderDaysBefore: number;
  status: GoalStatus;
  completedAt?: string;
  /** Optional total amount to complete by the deadline (e.g. 300 "sayfa") — powers the local Smart Plan suggestion */
  targetAmount?: number;
  targetUnit?: string;
};

export type RecurringGoal = BaseGoal & {
  kind: 'recurring';
  recurrence: Recurrence;
  /** "HH:mm" local times the reminder fires at on due days — one entry per repetition that day */
  reminderTimes: string[];
  /** yyyy-mm-dd day keys on which this habit was marked done */
  completedDates: string[];
};

export type Goal = OneTimeGoal | RecurringGoal;

/** Lightweight checklist item — deliberately separate from Goal: no deadline, no streak impact. */
export type TodoItem = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  /** Optional yyyy-mm-dd the task is pencilled in for */
  dueDate?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  /** yyyy-mm-dd */
  date: string;
  /** "HH:mm" local time, or undefined for an all-day entry */
  time?: string;
  note?: string;
  notificationIds: string[];
};

export type StreakData = {
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate: string | null;
};

type NewGoalShared = {
  title: string;
  description?: string;
  category: GoalCategory;
  priority: Priority;
  subtasks: Subtask[];
};

export type NewOneTimeGoalInput = NewGoalShared & {
  kind: 'onetime';
  deadline: string;
  reminderDaysBefore: number;
  targetAmount?: number;
  targetUnit?: string;
};

export type NewRecurringGoalInput = NewGoalShared & {
  kind: 'recurring';
  recurrence: Recurrence;
  reminderTimes: string[];
};

export type NewGoalInput = NewOneTimeGoalInput | NewRecurringGoalInput;
