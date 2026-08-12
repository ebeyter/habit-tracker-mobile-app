import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { dayKey, daysUntil, formatDate, formatTimeOfDay, isPastDay } from '@/lib/date';
import { describeRecurrence, isDueOn } from '@/lib/recurrence';
import { suggestPlan } from '@/lib/smart-plan';
import { CATEGORIES, PRIORITIES, type Goal } from '@/lib/types';

function categoryEmoji(id: Goal['category']): string {
  return CATEGORIES.find((c) => c.id === id)?.emoji ?? '🎯';
}

type Props = {
  goal: Goal;
  onComplete: () => void;
  onUndo: () => void;
  onToggleToday: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function GoalCard({
  goal,
  onComplete,
  onUndo,
  onToggleToday,
  onToggleSubtask,
  onEdit,
  onDelete,
}: Props) {
  const { colors, spacing, radius } = useAppTheme();

  const prioritySymbol =
    goal.priority === 'normal' ? null : PRIORITIES.find((p) => p.id === goal.priority)?.symbol;

  const subtaskSection =
    goal.subtasks.length > 0 ? (
      <View style={styles.subtasks}>
        {goal.subtasks.map((s) => (
          <Pressable key={s.id} onPress={() => onToggleSubtask(s.id)} style={styles.subtaskRow}>
            <Text style={{ color: s.done ? colors.success : colors.textMuted, fontSize: 13 }}>
              {s.done ? '☑' : '☐'}
            </Text>
            <Text
              style={[
                styles.subtaskText,
                {
                  color: s.done ? colors.textMuted : colors.text,
                  textDecorationLine: s.done ? 'line-through' : 'none',
                },
              ]}
            >
              {s.title}
            </Text>
          </Pressable>
        ))}
      </View>
    ) : null;

  if (goal.kind === 'recurring') {
    const doneToday = goal.completedDates.includes(dayKey(new Date()));
    const dueToday = isDueOn(goal, new Date());
    const badge = !dueToday
      ? { label: 'Bugün planlı değil', bg: colors.border, fg: colors.textMuted }
      : doneToday
        ? { label: 'Bugün tamamlandı', bg: colors.successMuted, fg: colors.success }
        : { label: 'Bugün bekliyor', bg: colors.warningMuted, fg: colors.warning };

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {categoryEmoji(goal.category)} {goal.title}
            {prioritySymbol ? <Text style={{ color: colors.danger }}> {prioritySymbol}</Text> : null}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
          </View>
        </View>

        {!!goal.description && (
          <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={3}>
            {goal.description}
          </Text>
        )}

        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {describeRecurrence(goal.recurrence)} · {formatTimeOfDay(goal.reminderTime)} ·{' '}
          {goal.completedDates.length} kez tamamlandı
          {goal.notificationIds.length === 0 ? ' · bildirim yok' : ''}
        </Text>

        {subtaskSection}

        <View style={[styles.actions, { gap: spacing.sm }]}>
          <ActionButton
            label={doneToday ? 'Geri Al' : 'Bugün Tamamla'}
            onPress={onToggleToday}
            bg={doneToday ? colors.border : colors.success}
            fg={doneToday ? colors.text : '#fff'}
          />
          <ActionButton label="Düzenle" onPress={onEdit} bg={colors.border} fg={colors.text} />
          <ActionButton label="Sil" onPress={onDelete} bg={colors.dangerMuted} fg={colors.danger} />
        </View>
      </View>
    );
  }

  const isOverdue = goal.status === 'active' && isPastDay(new Date(goal.deadline));
  const daysLeft = daysUntil(goal.deadline);

  const badge = goal.status === 'completed'
    ? { label: 'Tamamlandı', bg: colors.successMuted, fg: colors.success }
    : isOverdue
      ? { label: 'Gecikti', bg: colors.dangerMuted, fg: colors.danger }
      : daysLeft === 0
        ? { label: 'Bugün son gün', bg: colors.warningMuted, fg: colors.warning }
        : { label: `${daysLeft} gün kaldı`, bg: colors.border, fg: colors.textMuted };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          opacity: goal.status === 'completed' ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            { color: colors.text, textDecorationLine: goal.status === 'completed' ? 'line-through' : 'none' },
          ]}
        >
          {categoryEmoji(goal.category)} {goal.title}
          {prioritySymbol ? <Text style={{ color: colors.danger }}> {prioritySymbol}</Text> : null}
        </Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
        </View>
      </View>

      {!!goal.description && (
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={3}>
          {goal.description}
        </Text>
      )}

      <Text style={[styles.meta, { color: colors.textMuted }]}>
        Bitiş: {formatDate(goal.deadline)} · Hatırlatma: {goal.reminderDaysBefore === 0 ? 'aynı gün' : `${goal.reminderDaysBefore} gün önce`}
        {goal.notificationIds.length === 0 && goal.status === 'active' ? ' · bildirim yok' : ''}
      </Text>

      {goal.status === 'active' && (
        <Text style={[styles.plan, { color: colors.tint }]}>
          💡 {suggestPlan(goal.deadline, goal.targetAmount, goal.targetUnit)}
        </Text>
      )}

      {subtaskSection}

      <View style={[styles.actions, { gap: spacing.sm }]}>
        {goal.status === 'active' ? (
          <ActionButton label="Tamamla" onPress={onComplete} bg={colors.success} fg="#fff" />
        ) : (
          <ActionButton label="Geri Al" onPress={onUndo} bg={colors.border} fg={colors.text} />
        )}
        <ActionButton label="Düzenle" onPress={onEdit} bg={colors.border} fg={colors.text} />
        <ActionButton label="Sil" onPress={onDelete} bg={colors.dangerMuted} fg={colors.danger} />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  bg,
  fg,
}: {
  label: string;
  onPress: () => void;
  bg: string;
  fg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, { backgroundColor: bg, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={[styles.actionText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    marginTop: 8,
  },
  plan: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  subtasks: {
    marginTop: 8,
    gap: 6,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskText: {
    flex: 1,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
