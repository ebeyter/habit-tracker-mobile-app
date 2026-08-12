import { startOfDay } from './date';
import type { Recurrence, RecurringGoal, Weekday } from './types';

export const WEEKDAY_LABELS: { day: Weekday; short: string }[] = [
  { day: 1, short: 'Pzt' },
  { day: 2, short: 'Sal' },
  { day: 3, short: 'Çar' },
  { day: 4, short: 'Per' },
  { day: 5, short: 'Cum' },
  { day: 6, short: 'Cmt' },
  { day: 0, short: 'Paz' },
];

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / (24 * 60 * 60 * 1000));
}

/** Whether a recurring habit is scheduled to happen on the given date. */
export function isDueOn(goal: Pick<RecurringGoal, 'recurrence' | 'createdAt'>, date: Date): boolean {
  const start = new Date(goal.createdAt);
  if (daysBetween(date, start) < 0) return false;

  switch (goal.recurrence.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return goal.recurrence.days.includes(date.getDay() as Weekday);
    case 'everyN':
      return daysBetween(date, start) % goal.recurrence.n === 0;
  }
}

export function describeRecurrence(recurrence: Recurrence): string {
  switch (recurrence.type) {
    case 'daily':
      return 'Her gün';
    case 'weekdays': {
      if (recurrence.days.length === 0) return 'Gün seçilmedi';
      const labels = WEEKDAY_LABELS.filter((w) => recurrence.days.includes(w.day)).map((w) => w.short);
      return labels.join(', ');
    }
    case 'everyN':
      return recurrence.n === 1 ? 'Her gün' : `${recurrence.n} günde bir`;
  }
}
