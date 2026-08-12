export type GoalStatus = 'active' | 'completed';
export type GoalKind = 'onetime' | 'recurring';
export type GoalCategory = 'genel' | 'saglik' | 'egitim' | 'is' | 'kisisel';

export const CATEGORIES: { id: GoalCategory; label: string; emoji: string }[] = [
  { id: 'genel', label: 'Genel', emoji: '🎯' },
  { id: 'saglik', label: 'Sağlık', emoji: '💪' },
  { id: 'egitim', label: 'Eğitim', emoji: '📚' },
  { id: 'is', label: 'İş', emoji: '💼' },
  { id: 'kisisel', label: 'Kişisel', emoji: '🌱' },
];

type BaseGoal = {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  createdAt: string;
  /** expo-notifications identifier; null if not scheduled (permission denied or, for one-time goals, reminder time already passed) */
  notificationId?: string | null;
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
  /** "HH:mm" local time the daily reminder fires at */
  reminderTime: string;
  /** yyyy-mm-dd day keys on which this habit was marked done */
  completedDates: string[];
};

export type Goal = OneTimeGoal | RecurringGoal;

export type StreakData = {
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate: string | null;
};

export type NewOneTimeGoalInput = {
  kind: 'onetime';
  title: string;
  description?: string;
  category: GoalCategory;
  deadline: string;
  reminderDaysBefore: number;
  targetAmount?: number;
  targetUnit?: string;
};

export type NewRecurringGoalInput = {
  kind: 'recurring';
  title: string;
  description?: string;
  category: GoalCategory;
  reminderTime: string;
};

export type NewGoalInput = NewOneTimeGoalInput | NewRecurringGoalInput;
