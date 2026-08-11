import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { dayKey, daysUntil, formatDate, formatTimeOfDay, isPastDay } from '@/lib/date';
import type { Goal } from '@/lib/types';

type Props = {
  goal: Goal;
  onComplete: () => void;
  onUndo: () => void;
  onToggleToday: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function GoalCard({ goal, onComplete, onUndo, onToggleToday, onEdit, onDelete }: Props) {
  const { colors, spacing, radius } = useAppTheme();

  if (goal.kind === 'recurring') {
    const doneToday = goal.completedDates.includes(dayKey(new Date()));
    const badge = doneToday
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
          <Text style={[styles.title, { color: colors.text }]}>{goal.title}</Text>
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
          Her gün {formatTimeOfDay(goal.reminderTime)} · {goal.completedDates.length} kez tamamlandı
          {goal.notificationId === null ? ' · bildirim yok' : ''}
        </Text>

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
          {goal.title}
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
        {goal.notificationId === null && goal.status === 'active' ? ' · bildirim yok' : ''}
      </Text>

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
