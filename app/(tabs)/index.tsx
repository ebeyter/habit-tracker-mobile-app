import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { PermissionBanner } from '@/components/PermissionBanner';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sapling } from '@/components/Sapling';
import { SectionHeader } from '@/components/SectionHeader';
import { StreakHeader } from '@/components/StreakHeader';
import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { isPastDay } from '@/lib/date';
import { saplingState } from '@/lib/garden';
import type { Goal, GoalCategory, OneTimeGoal, RecurringGoal } from '@/lib/types';

type CategoryFilter = GoalCategory | 'all';

export default function HomeScreen() {
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

  const sapling = useMemo(() => saplingState(goals), [goals]);

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
      if (goal.kind === 'recurring') recurring.push(goal);
      else if (goal.status === 'completed') completed.push(goal);
      else if (isPastDay(new Date(goal.deadline))) overdue.push(goal);
      else active.push(goal);
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

  function renderCard(goal: Goal) {
    return (
      <GoalCard
        key={goal.id}
        goal={goal}
        onComplete={() => completeGoal(goal.id)}
        onUndo={() => undoComplete(goal.id)}
        onToggleToday={() => toggleRecurringToday(goal.id)}
        onToggleSubtask={(sid) => toggleSubtask(goal.id, sid)}
        onEdit={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
        onDelete={() => confirmDelete(goal)}
      />
    );
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
      <ScreenHeader title="Hedeflerim" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        <Sapling state={sapling} />

        <View style={{ marginTop: spacing.lg }}>
          <StreakHeader streak={streak} />
        </View>

        {permissionStatus === 'denied' && (
          <View style={{ marginTop: spacing.md }}>
            <PermissionBanner />
          </View>
        )}

        {!hasGoals ? (
          <EmptyState onCreate={() => router.push('/goal-form')} />
        ) : (
          <>
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

            {!hasFilteredGoals ? (
              <Text style={[styles.empty, { color: colors.textMuted, marginTop: spacing.lg }]}>
                Bu kategoride hedef yok.
              </Text>
            ) : (
              <>
                {sections.recurring.length > 0 && (
                  <>
                    <SectionHeader title="Tekrarlayan Alışkanlıklar" count={sections.recurring.length} />
                    {sections.recurring.map(renderCard)}
                  </>
                )}

                {sections.overdue.length > 0 && (
                  <>
                    <SectionHeader title="Gecikti" count={sections.overdue.length} />
                    {sections.overdue.map(renderCard)}
                  </>
                )}

                <SectionHeader title="Aktif" count={sections.active.length} />
                {sections.active.length === 0 ? (
                  <Text style={[styles.empty, { color: colors.textMuted }]}>Aktif hedef yok.</Text>
                ) : (
                  sections.active.map(renderCard)
                )}

                {sections.completed.length > 0 && (
                  <>
                    <SectionHeader title="Tamamlandı" count={sections.completed.length} />
                    {sections.completed.map(renderCard)}
                  </>
                )}
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
          <Ionicons name="add" size={30} color="#fff" />
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
  empty: {
    fontSize: 13,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
