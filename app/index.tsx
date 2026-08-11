import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { PermissionBanner } from '@/components/PermissionBanner';
import { SectionHeader } from '@/components/SectionHeader';
import { StreakHeader } from '@/components/StreakHeader';
import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { isPastDay } from '@/lib/date';
import type { Goal } from '@/lib/types';

export default function GoalsScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { goals, streak, permissionStatus, loading, completeGoal, undoComplete, deleteGoal } = useGoals();

  const sections = useMemo(() => {
    const overdue: Goal[] = [];
    const active: Goal[] = [];
    const completed: Goal[] = [];

    for (const goal of goals) {
      if (goal.status === 'completed') completed.push(goal);
      else if (isPastDay(new Date(goal.deadline))) overdue.push(goal);
      else active.push(goal);
    }

    const byDeadline = (a: Goal, b: Goal) => a.deadline.localeCompare(b.deadline);
    overdue.sort(byDeadline);
    active.sort(byDeadline);
    completed.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

    return { overdue, active, completed };
  }, [goals]);

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

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Hedeflerim</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        <StreakHeader streak={streak} />

        {permissionStatus === 'denied' && (
          <View style={{ marginTop: spacing.md }}>
            <PermissionBanner />
          </View>
        )}

        {!hasGoals ? (
          <EmptyState onCreate={() => router.push('/goal-form')} />
        ) : (
          <>
            {sections.overdue.length > 0 && (
              <>
                <SectionHeader title="Gecikti" count={sections.overdue.length} />
                {sections.overdue.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onComplete={() => completeGoal(goal.id)}
                    onUndo={() => undoComplete(goal.id)}
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
              bottom: spacing.xl,
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
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
