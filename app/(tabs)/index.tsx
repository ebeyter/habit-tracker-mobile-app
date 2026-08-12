import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PermissionBanner } from '@/components/PermissionBanner';
import { PlantTile } from '@/components/PlantTile';
import { StreakHeader } from '@/components/StreakHeader';
import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { gardenSummary, identityLine, plantStateFor } from '@/lib/garden';
import type { Goal, GoalCategory } from '@/lib/types';

type CategoryFilter = GoalCategory | 'all';

export default function GardenScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const {
    goals,
    streak,
    permissionStatus,
    loading,
    completeGoal,
    toggleRecurringToday,
    deleteGoal,
    categories,
  } = useGoals();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredGoals = useMemo(
    () => (categoryFilter === 'all' ? goals : goals.filter((g) => g.category === categoryFilter)),
    [goals, categoryFilter]
  );

  const summary = useMemo(() => gardenSummary(goals), [goals]);

  const needsWater = useMemo(
    () =>
      filteredGoals.filter((g) => {
        const s = plantStateFor(g);
        return s.dueToday && !s.doneToday;
      }),
    [filteredGoals]
  );

  /** Tapping a plant waters it: completes today for a habit, finishes a one-time goal. */
  function water(goal: Goal) {
    if (goal.kind === 'recurring') toggleRecurringToday(goal.id);
    else if (goal.status === 'active') completeGoal(goal.id);
  }

  function openActions(goal: Goal) {
    Alert.alert(goal.title, identityLine(goal), [
      { text: 'Düzenle', onPress: () => router.push({ pathname: '/goal-form', params: { id: goal.id } }) },
      { text: 'Sil', style: 'destructive', onPress: () => deleteGoal(goal.id) },
      { text: 'Kapat', style: 'cancel' },
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
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Bahçem</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {hasGoals
              ? `${summary.total} bitki · ${summary.thriving} serpiliyor${summary.wilting ? ` · ${summary.wilting} solmuş` : ''}`
              : 'Kim olmak istediğini ek, birlikte büyütelim'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
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
            {needsWater.length > 0 && (
              <View
                style={[
                  styles.waterBanner,
                  { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
                ]}
              >
                <Text style={styles.waterEmoji}>💧</Text>
                <Text style={[styles.waterText, { color: colors.text }]}>
                  {needsWater.length} bitki bugün su bekliyor — üzerine dokunarak sula.
                </Text>
              </View>
            )}

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

            {filteredGoals.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted, marginTop: spacing.lg }]}>
                Bu kategoride bitki yok.
              </Text>
            ) : (
              <View style={[styles.grid, { marginTop: spacing.md }]}>
                {filteredGoals.map((goal) => (
                  <View key={goal.id} style={styles.gridCell}>
                    <PlantTile
                      goal={goal}
                      onPress={() => water(goal)}
                      onLongPress={() => openActions(goal)}
                    />
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.tip, { color: colors.textMuted }]}>
              Sulamak için dokun · Düzenlemek için basılı tut
            </Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  waterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterEmoji: {
    fontSize: 20,
  },
  waterText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCell: {
    width: '48%',
  },
  empty: {
    fontSize: 13,
  },
  tip: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
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
