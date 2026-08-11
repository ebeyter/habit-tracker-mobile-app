import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, startOfDay } from './date';
import type { NewGoalInput } from './types';

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
  notificationId: string | null;
  reason: 'past' | 'permission' | null;
};

async function scheduleOneTimeReminder(
  goal: Pick<Extract<NewGoalInput, { kind: 'onetime' }>, 'title' | 'deadline' | 'reminderDaysBefore'>
): Promise<ScheduleResult> {
  const when = oneTimeReminderDate(goal.deadline, goal.reminderDaysBefore);
  if (when.getTime() <= Date.now()) {
    return { notificationId: null, reason: 'past' };
  }

  const status = await ensurePermission();
  if (status !== 'granted') {
    return { notificationId: null, reason: 'permission' };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
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

  return { notificationId, reason: null };
}

async function scheduleRecurringReminder(
  goal: Pick<Extract<NewGoalInput, { kind: 'recurring' }>, 'title' | 'reminderTime'>
): Promise<ScheduleResult> {
  const status = await ensurePermission();
  if (status !== 'granted') {
    return { notificationId: null, reason: 'permission' };
  }

  const [hour, minute] = goal.reminderTime.split(':').map(Number);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Günlük hatırlatma',
      body: `"${goal.title}" için bugünü unutma!`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return { notificationId, reason: null };
}

export async function scheduleGoalReminder(goal: NewGoalInput): Promise<ScheduleResult> {
  return goal.kind === 'onetime' ? scheduleOneTimeReminder(goal) : scheduleRecurringReminder(goal);
}

export async function cancelGoalReminder(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already fired or cancelled — safe to ignore
  }
}

export async function rescheduleGoalReminder(
  goal: NewGoalInput & { notificationId?: string | null }
): Promise<ScheduleResult> {
  await cancelGoalReminder(goal.notificationId);
  return scheduleGoalReminder(goal);
}
