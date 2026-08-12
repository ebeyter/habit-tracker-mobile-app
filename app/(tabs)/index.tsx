import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { MascotCard } from '@/components/MascotCard';
import { PermissionBanner } from '@/components/PermissionBanner';
import { SectionHeader } from '@/components/SectionHeader';
import { StreakHeader } from '@/components/StreakHeader';
import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { isPastDay } from '@/lib/date';
import type { Goal, GoalCategory, OneTimeGoal, RecurringGoal } from '@/lib/types';

type CategoryFilter = GoalCategory | 'all';

export default function GoalsScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const {
    goals,
    streak,
    permissionStatus,
    loading,
    completeGoal,
    undoComplete,
    toggleRecurringToday,
    toggleSubtask,
    deleteGoal,
    categories,
  } = useGoals();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredGoals = useMemo(
    () => (categoryFilter === 'all' ? goals : goals.filter((g) => g.category === categoryFilter)),
    [goals, categoryFilter]
  );

  const sections = useMemo(() => {
    const recurring: RecurringGoal[] = [];
    const overdue: OneTimeGoal[] = [];
    const active: OneTimeGoal[] = [];
    const completed: OneTimeGoal[] = [];

    for (const goal of filteredGoals) {
      if (goal.kind === 'recurring') {
        recurring.push(goal);
      } else if (goal.status === 'completed') {
        completed.push(goal);
      } else if (isPastDay(new Date(goal.deadline))) {
        overdue.push(goal);
      } else {
        active.push(goal);
      }
    }

    const byDeadline = (a: OneTimeGoal, b: OneTimeGoal) => a.deadline.localeCompare(b.deadline);
    overdue.sort(byDeadline);
    active.sort(byDeadline);
    completed.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    recurring.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return { recurring, overdue, active, completed };
  }, [filteredGoals]);

  function confirmDelete(goal: Goal) {
    Alert.alert('Hedefi sil', `"${goal.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const hasGoals = goals.length > 0;
  const hasFilteredGoals = filteredGoals.length > 0;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Hedeflerim</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        <MascotCard streak={streak} />

        <View style={{ marginTop: spacing.md }}>
          <StreakHeader streak={streak} />
        </View>

        {permissionStatus === 'denied' && (
          <View style={{ marginTop: spacing.md }}>
            <PermissionBanner />
          </View>
        )}

        {hasGoals && (
          <View style={[styles.chipRow, { marginTop: spacing.md }]}>
            <CategoryChip
              label="Tümü"
              emoji="✨"
              active={categoryFilter === 'all'}
              onPress={() => setCategoryFilter('all')}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.label}
                emoji={c.emoji}
                active={categoryFilter === c.id}
                onPress={() => setCategoryFilter(c.id)}
              />
            ))}
          </View>
        )}

        {!hasGoals ? (
          <EmptyState onCreate={() => router.push('/goal-form')} />
        ) : !hasFilteredGoals ? (
          <Text style={[styles.sectionEmpty, { color: colors.textMuted, marginTop: spacing.lg }]}>
            Bu kategoride hedef yok.
          </Text>
        ) : (
          <>
            {sections.recurring.length > 0 && (
              <>
                <SectionHeader title="Tekrarlayan Alışkanlıklar" count={sections.recurring.length} />
                {sections.recurring.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onComplete={() => {}}
                    onUndo={() => {}}
                    onToggleToday={() => toggleRecurringToday(goal.id)}
                    onToggleSubtask={(sid) => toggleSubtask(goal.id, sid)}
                    onEdit={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
                    onDelete={() => confirmDelete(goal)}
                  />
                ))}
              </>
            )}

            {sections.overdue.length > 0 && (
              <>
                <SectionHeader title="Gecikti" count={sections.overdue.length} />
                {sections.overdue.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onComplete={() => completeGoal(goal.id)}
                    onUndo={() => undoComplete(goal.id)}
                    onToggleToday={() => {}}
                  onToggleSubtask={(sid) => toggleSubtask(goal.id, sid)}
                    onEdit={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
                    onDelete={() => confirmDelete(goal)}
                  />
                ))}
              </>
            )}

            <SectionHeader title="Aktif" count={sections.active.length} />
            {sections.active.length === 0 ? (
              <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>Aktif hedef yok.</Text>
            ) : (
              sections.active.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onComplete={() => completeGoal(goal.id)}
                  onUndo={() => undoComplete(goal.id)}
                  onToggleToday={() => {}}
                  onToggleSubtask={(sid) => toggleSubtask(goal.id, sid)}
                  onEdit={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
                  onDelete={() => confirmDelete(goal)}
                />
              ))
            )}

            {sections.completed.length > 0 && (
              <>
                <SectionHeader title="Tamamlandı" count={sections.completed.length} />
                {sections.completed.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onComplete={() => completeGoal(goal.id)}
                    onUndo={() => undoComplete(goal.id)}
                    onToggleToday={() => {}}
                  onToggleSubtask={(sid) => toggleSubtask(goal.id, sid)}
                    onEdit={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
                    onDelete={() => confirmDelete(goal)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {hasGoals && (
        <Pressable
          onPress={() => router.push('/goal-form')}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.tint,
              borderRadius: radius.pill,
              bottom: spacing.md,
              right: spacing.lg,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function CategoryChip({
  label,
  emoji,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, radius } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.surface },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
        {emoji} {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionEmpty: {
    fontSize: 13,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
});
