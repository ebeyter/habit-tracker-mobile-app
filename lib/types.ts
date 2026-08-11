export type GoalStatus = 'active' | 'completed';

export type Goal = {
  id: string;
  title: string;
  description?: string;
  /** ISO date string, local midnight of the deadline day */
  deadline: string;
  /** How many days before the deadline to send the reminder (0 = same day) */
  reminderDaysBefore: number;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  /** expo-notifications identifier; null if not scheduled (permission denied or reminder time already passed) */
  notificationId?: string | null;
};

export type StreakData = {
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate: string | null;
};

export type NewGoalInput = {
  title: string;
  description?: string;
  deadline: string;
  reminderDaysBefore: number;
};
