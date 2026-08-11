import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, startOfDay } from './date';
import type { Goal } from './types';

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

function reminderDate(goal: Pick<Goal, 'deadline' | 'reminderDaysBefore'>): Date {
  const deadlineDay = startOfDay(new Date(goal.deadline));
  const day = addDays(deadlineDay, -goal.reminderDaysBefore);
  day.setHours(9, 0, 0, 0);
  return day;
}

export type ScheduleResult = {
  notificationId: string | null;
  reason: 'past' | 'permission' | null;
};

export async function scheduleGoalReminder(
  goal: Pick<Goal, 'title' | 'deadline' | 'reminderDaysBefore'>
): Promise<ScheduleResult> {
  const when = reminderDate(goal);
  if (when.getTime() <= Date.now()) {
    return { notificationId: null, reason: 'past' };
  }

  let status = await getPermissionStatus();
  if (status === 'undetermined') {
    status = await requestPermission();
  }
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

export async function cancelGoalReminder(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already fired or cancelled — safe to ignore
  }
}

export async function rescheduleGoalReminder(
  goal: Pick<Goal, 'title' | 'deadline' | 'reminderDaysBefore'> & {
    notificationId?: string | null;
  }
): Promise<ScheduleResult> {
  await cancelGoalReminder(goal.notificationId);
  return scheduleGoalReminder(goal);
}
