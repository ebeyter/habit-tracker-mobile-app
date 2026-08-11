export type GoalStatus = 'active' | 'completed';
export type GoalKind = 'onetime' | 'recurring';

type BaseGoal = {
  id: string;
  title: string;
  description?: string;
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
  deadline: string;
  reminderDaysBefore: number;
};

export type NewRecurringGoalInput = {
  kind: 'recurring';
  title: string;
  description?: string;
  reminderTime: string;
};

export type NewGoalInput = NewOneTimeGoalInput | NewRecurringGoalInput;
