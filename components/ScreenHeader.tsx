import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';

/** Shared screen title row — carries the settings entry point on every tab. */
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { colors, spacing } = useAppTheme();

  return (
    <View style={[styles.row, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
      <View style={styles.titleCol}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <View style={styles.actions}>
        {action}
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    gap: 12,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
