import { StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/ProgressRing';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { StreakData } from '@/lib/types';

export function StreakHeader({ streak }: { streak: StreakData }) {
  const { colors, spacing, radius } = useAppTheme();

  // The current streak is drawn as a share of the personal best, so the ring fills
  // as the user approaches their record (and sits full once they match it).
  const target = Math.max(streak.bestStreak, 1);
  const progress = streak.currentStreak / target;

  const subtitle =
    streak.currentStreak === 0
      ? 'Bugün bir hedef tamamla ve seriyi başlat'
      : streak.currentStreak >= streak.bestStreak
        ? 'Rekordasın — böyle devam! 🏆'
        : `Rekoruna ${streak.bestStreak - streak.currentStreak} gün kaldı`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
      ]}
    >
      <View style={styles.row}>
        <ProgressRing
          progress={progress}
          color={colors.streak}
          value={String(streak.currentStreak)}
          label="Güncel Seri 🔥"
        />
        <ProgressRing
          progress={streak.bestStreak > 0 ? 1 : 0}
          color={colors.tint}
          value={String(streak.bestStreak)}
          label="En İyi Seri 🏆"
        />
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});
