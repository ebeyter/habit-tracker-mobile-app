import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { StreakData } from '@/lib/types';

export function StreakHeader({ streak }: { streak: StreakData }) {
  const { colors, spacing, radius } = useAppTheme();

  const subtitle =
    streak.currentStreak > 0
      ? 'Bugün de bir hedef tamamlayarak devam ettir 🔥'
      : 'Bugün bir hedef tamamla ve seriyi başlat';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.value, { color: colors.streak }]}>{streak.currentStreak}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Güncel Seri 🔥</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.value, { color: colors.tint }]}>{streak.bestStreak}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>En İyi Seri 🏆</Text>
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});
