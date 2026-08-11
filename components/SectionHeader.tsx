import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function SectionHeader({ title, count }: { title: string; count: number }) {
  const { colors, spacing } = useAppTheme();

  return (
    <View style={[styles.row, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={[styles.badge, { backgroundColor: colors.border }]}>
        <Text style={[styles.badgeText, { color: colors.textMuted }]}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
