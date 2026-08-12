import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, startOfDay, today } from './date';
import { isDueOn } from './recurrence';
import type { NewGoalInput, Recurrence } from './types';

/** How many future occurrences to pre-schedule for "every N days" rules, which have no native repeating trigger. */
const EVERY_N_HORIZON = 30;

let handlerConfigured = false;

export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

export async function requestPermission(): Promise<PermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionStatus;
}

async function ensurePermission(): Promise<PermissionStatus> {
  let status = await getPermissionStatus();
  if (status === 'undetermined') {
    status = await requestPermission();
  }
  return status;
}

function oneTimeReminderDate(deadline: string, reminderDaysBefore: number): Date {
  const deadlineDay = startOfDay(new Date(deadline));
  const day = addDays(deadlineDay, -reminderDaysBefore);
  day.setHours(9, 0, 0, 0);
  return day;
}

export type ScheduleResult = {
  notificationIds: string[];
  reason: 'past' | 'permission' | null;
};

async function scheduleOneTimeReminder(
  goal: Pick<Extract<NewGoalInput, { kind: 'onetime' }>, 'title' | 'deadline' | 'reminderDaysBefore'>
): Promise<ScheduleResult> {
  const when = oneTimeReminderDate(goal.deadline, goal.reminderDaysBefore);
  if (when.getTime() <= Date.now()) {
    return { notificationIds: [], reason: 'past' };
  }

  const status = await ensurePermission();
  if (status !== 'granted') {
    return { notificationIds: [], reason: 'permission' };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hedef hatırlatması',
      body:
        goal.reminderDaysBefore === 0
          ? `"${goal.title}" bugün son gün!`
          : `"${goal.title}" hedefinin bitişine ${goal.reminderDaysBefore} gün kaldı.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });

  return { notificationIds: [id], reason: null };
}

async function scheduleRecurringReminder(
  goal: Pick<Extract<NewGoalInput, { kind: 'recurring' }>, 'title' | 'reminderTimes' | 'recurrence'>
): Promise<ScheduleResult> {
  const status = await ensurePermission();
  if (status !== 'granted') {
    return { notificationIds: [], reason: 'permission' };
  }

  const content = {
    title: 'Alışkanlık hatırlatması',
    body: `"${goal.title}" için bugünü unutma!`,
  };

  const ids: string[] = [];
  for (const time of goal.reminderTimes) {
    const [hour, minute] = time.split(':').map(Number);
    ids.push(...(await scheduleTriggersFor(goal.recurrence, content, hour, minute)));
  }
  return { notificationIds: ids, reason: null };
}

async function scheduleTriggersFor(
  recurrence: Recurrence,
  content: { title: string; body: string },
  hour: number,
  minute: number
): Promise<string[]> {
  if (recurrence.type === 'daily' || (recurrence.type === 'everyN' && recurrence.n === 1)) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return [id];
  }

  if (recurrence.type === 'weekdays') {
    const ids: string[] = [];
    for (const day of recurrence.days) {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          // expo-notifications weekday is 1-based starting Sunday, Date#getDay is 0-based
          weekday: day + 1,
          hour,
          minute,
        },
      });
      ids.push(id);
    }
    return ids;
  }

  // "every N days" has no native repeating trigger — pre-schedule a horizon of one-off dates.
  const ids: string[] = [];
  const start = today();
  for (let offset = 0; offset < EVERY_N_HORIZON; offset++) {
    const date = addDays(start, offset);
    if (!isDueOn({ recurrence, createdAt: start.toISOString() }, date)) continue;
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() <= Date.now()) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
    ids.push(id);
  }
  return ids;
}

export async function scheduleGoalReminder(goal: NewGoalInput): Promise<ScheduleResult> {
  return goal.kind === 'onetime' ? scheduleOneTimeReminder(goal) : scheduleRecurringReminder(goal);
}

export async function scheduleEventReminder(
  title: string,
  date: string,
  time?: string
): Promise<ScheduleResult> {
  if (!time) return { notificationIds: [], reason: null };

  const [y, m, d] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const when = new Date(y, m - 1, d, hour, minute, 0, 0);
  if (when.getTime() <= Date.now()) return { notificationIds: [], reason: 'past' };

  const status = await ensurePermission();
  if (status !== 'granted') return { notificationIds: [], reason: 'permission' };

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Takvim hatırlatması', body: title },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
  return { notificationIds: [id], reason: null };
}

export async function cancelGoalReminders(notificationIds: string[] = []): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already fired or cancelled — safe to ignore
    }
  }
}

export async function rescheduleGoalReminder(
  goal: NewGoalInput & { notificationIds?: string[] }
): Promise<ScheduleResult> {
  await cancelGoalReminders(goal.notificationIds);
  return scheduleGoalReminder(goal);
}
