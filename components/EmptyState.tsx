import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { colors, spacing, radius } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: spacing.xxl }]}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={[styles.title, { color: colors.text }]}>Henüz hedefin yok</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        İlk hedefini oluştur, bitiş tarihini belirle ve hatırlatma kur.
      </Text>
      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.tint, borderRadius: radius.pill, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>+ Yeni Hedef</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
