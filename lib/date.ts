export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function today(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** yyyy-mm-dd in local time, used as a de-duplication key for streak days */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isPastDay(date: Date): boolean {
  return startOfDay(date).getTime() < today().getTime();
}

export function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysUntil(dateIso: string): number {
  const d = startOfDay(new Date(dateIso));
  const diffMs = d.getTime() - today().getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}
