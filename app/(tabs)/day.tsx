import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { addDays, dayKey, formatDayLabel, isSameDay, startOfDay, today } from '@/lib/date';
import { isDueOn } from '@/lib/recurrence';
import { CATEGORIES, type OneTimeGoal, type RecurringGoal } from '@/lib/types';

function categoryEmoji(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.emoji ?? '🎯';
}

export default function DayScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { goals, toggleRecurringOnDate } = useGoals();
  const [selectedDate, setSelectedDate] = useState(() => today());

  const key = dayKey(selectedDate);
  const isFuture = startOfDay(selectedDate).getTime() > today().getTime();

  const { habits, dueGoals, doneCount } = useMemo(() => {
    const habits: RecurringGoal[] = [];
    const dueGoals: OneTimeGoal[] = [];

    for (const goal of goals) {
      if (goal.kind === 'recurring') {
        if (isDueOn(goal, selectedDate)) {
          habits.push(goal);
        }
      } else if (isSameDay(new Date(goal.deadline), selectedDate)) {
        dueGoals.push(goal);
      }
    }

    habits.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const doneCount = habits.filter((h) => h.completedDates.includes(key)).length;
    return { habits, dueGoals, doneCount };
  }, [goals, selectedDate, key]);

  const progress = habits.length > 0 ? doneCount / habits.length : 0;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.dayNav, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Pressable
          onPress={() => setSelectedDate((d) => addDays(d, -1))}
          hitSlop={12}
          style={[styles.navButton, { backgroundColor: colors.surface, borderRadius: radius.pill }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <Pressable onPress={() => setSelectedDate(today())} style={styles.dayLabelWrap}>
          <Text style={[styles.dayLabel, { color: colors.text }]}>{formatDayLabel(selectedDate)}</Text>
          <Text style={[styles.daySub, { color: colors.textMuted }]}>
            {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedDate((d) => addDays(d, 1))}
          hitSlop={12}
          style={[styles.navButton, { backgroundColor: colors.surface, borderRadius: radius.pill }]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {habits.length > 0 && (
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
            ]}
          >
            <Text style={[styles.progressText, { color: colors.text }]}>
              {doneCount} / {habits.length} alışkanlık tamamlandı
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: colors.success },
                ]}
              />
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
          Alışkanlıklar
        </Text>
        {habits.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Bu gün için tekrarlayan alışkanlık yok.
          </Text>
        ) : (
          habits.map((habit) => {
            const done = habit.completedDates.includes(key);
            return (
              <Pressable
                key={habit.id}
                onPress={() => !isFuture && toggleRecurringOnDate(habit.id, selectedDate)}
                disabled={isFuture}
                style={[
                  styles.habitRow,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    opacity: isFuture ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: done ? colors.success : colors.border,
                      backgroundColor: done ? colors.success : 'transparent',
                    },
                  ]}
                >
                  {done && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text
                  style={[
                    styles.habitTitle,
                    { color: colors.text, textDecorationLine: done ? 'line-through' : 'none' },
                  ]}
                >
                  {categoryEmoji(habit.category)} {habit.title}
                </Text>
              </Pressable>
            );
          })
        )}

        {dueGoals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
              Bu Gün Biten Hedefler
            </Text>
            {dueGoals.map((goal) => (
              <View
                key={goal.id}
                style={[
                  styles.habitRow,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <Ionicons
                  name={goal.status === 'completed' ? 'checkmark-circle' : 'flag'}
                  size={20}
                  color={goal.status === 'completed' ? colors.success : colors.warning}
                />
                <Text style={[styles.habitTitle, { color: colors.text }]}>
                  {categoryEmoji(goal.category)} {goal.title}
                </Text>
              </View>
            ))}
          </>
        )}

        {isFuture && (
          <Text style={[styles.empty, { color: colors.textMuted, marginTop: spacing.md }]}>
            Gelecek günler işaretlenemez.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelWrap: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '800',
  },
  daySub: {
    fontSize: 12,
    marginTop: 2,
  },
  progressCard: {
    gap: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  empty: {
    fontSize: 13,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
