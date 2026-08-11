import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function PermissionBanner() {
  const { colors, spacing, radius } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.warningMuted,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]}>
        Bildirim izni verilmedi. Hatırlatmaların çalışması için izni Ayarlar&apos;dan açman gerekiyor.
      </Text>
      <Pressable
        onPress={() => Linking.openSettings()}
        style={({ pressed }) => [
          styles.button,
          { borderRadius: radius.pill, backgroundColor: colors.warning, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>Ayarlar&apos;a Git</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 12,
  },
});
