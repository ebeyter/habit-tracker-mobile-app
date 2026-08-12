import { StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/ProgressRing';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { StreakData } from '@/lib/types';

/** Compact vitality strip — kept small so the garden itself stays the hero of the screen. */
export function StreakHeader({ streak }: { streak: StreakData }) {
  const { colors, spacing, radius } = useAppTheme();

  // The current streak is drawn as a share of the personal best, so the ring fills
  // as the user approaches their record (and sits full once they match it).
  const target = Math.max(streak.bestStreak, 1);

  const subtitle =
    streak.currentStreak === 0
      ? 'Bugün bir bitkini sula, seri başlasın'
      : streak.currentStreak >= streak.bestStreak
        ? 'Rekordasın — bahçen hiç bu kadar canlı olmamıştı 🏆'
        : `Rekoruna ${streak.bestStreak - streak.currentStreak} gün kaldı`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
      ]}
    >
      <ProgressRing
        progress={streak.currentStreak / target}
        size={66}
        stroke={7}
        color={colors.streak}
        value={String(streak.currentStreak)}
        label="Seri 🔥"
      />
      <View style={styles.textCol}>
        <Text style={[styles.headline, { color: colors.text }]}>
          {streak.currentStreak} günlük seri
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        <Text style={[styles.best, { color: colors.tint }]}>En iyi: {streak.bestStreak} gün 🏆</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  best: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
