import { daysUntil } from './date';

/**
 * Purely local, rule-based pacing suggestion — no external/AI API involved.
 * Splits the optional target amount evenly across the days remaining until the deadline.
 */
export function suggestPlan(deadlineIso: string, targetAmount?: number, targetUnit?: string): string {
  const days = Math.max(daysUntil(deadlineIso), 0);
  const unit = targetUnit?.trim() || 'birim';

  if (days === 0) {
    return targetAmount
      ? `Bugün son gün — ${targetAmount} ${unit} tamamlaman gerekiyor.`
      : 'Bugün son gün, hadi bitir!';
  }

  if (targetAmount && targetAmount > 0) {
    const perDay = Math.ceil(targetAmount / days);
    return `${days} gün kaldı. Günde ortalama ${perDay} ${unit} yaparsan yetişir.`;
  }

  return `${days} gün kaldı. Küçük parçalara böl, her gün biraz ilerle.`;
}
