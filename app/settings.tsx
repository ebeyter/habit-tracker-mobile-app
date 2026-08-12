import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoals } from '@/context/GoalsContext';
import { ACCENTS, useSettings, type ThemeMode } from '@/context/SettingsContext';
import { useAppTheme } from '@/hooks/use-app-theme';

const THEME_MODES: { id: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'light', label: 'Açık', icon: 'sunny' },
  { id: 'dark', label: 'Koyu', icon: 'moon' },
  { id: 'system', label: 'Sistem', icon: 'phone-portrait' },
];

export default function SettingsScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { settings, setThemeMode, setAccent } = useSettings();
  const { goals, todos, events, permissionStatus, refreshPermission } = useGoals();

  async function exportData() {
    const payload = JSON.stringify({ goals, todos, events, exportedAt: new Date().toISOString() }, null, 2);
    await Share.share({ message: payload });
  }

  function confirmResetNotifications() {
    Alert.alert(
      'Bildirimleri sıfırla',
      'Planlanmış tüm hatırlatmalar iptal edilecek. Hedeflerini düzenleyerek yeniden kurabilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await refreshPermission();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={[styles.title, { color: colors.text }]}>Ayarlar</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Görünüm">
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Tema</Text>
          <View style={styles.chipRow}>
            {THEME_MODES.map((m) => {
              const active = settings.themeMode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setThemeMode(m.id)}
                  style={[
                    styles.themeChip,
                    {
                      borderRadius: radius.md,
                      backgroundColor: active ? colors.tint : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Ionicons name={m.icon} size={18} color={active ? '#fff' : colors.textMuted} />
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: spacing.md }]}>
            Vurgu Rengi
          </Text>
          <View style={styles.chipRow}>
            {ACCENTS.map((a) => {
              const active = settings.accentId === a.id;
              const swatch = a.dark;
              return (
                <Pressable key={a.id} onPress={() => setAccent(a.id)} style={styles.accentWrap}>
                  <View
                    style={[
                      styles.accentSwatch,
                      {
                        backgroundColor: swatch,
                        borderColor: active ? colors.text : 'transparent',
                      },
                    ]}
                  />
                  <Text style={[styles.accentLabel, { color: active ? colors.text : colors.textMuted }]}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Bildirimler">
          <Row
            icon="notifications"
            label="Bildirim izni"
            value={
              permissionStatus === 'granted'
                ? 'Verildi'
                : permissionStatus === 'denied'
                  ? 'Reddedildi'
                  : 'Henüz sorulmadı'
            }
            onPress={() => Linking.openSettings()}
          />
          <Row
            icon="refresh"
            label="Planlanmış bildirimleri sıfırla"
            onPress={confirmResetNotifications}
            destructive
          />
        </Section>

        <Section title="Veri">
          <Row icon="download" label="Verilerimi dışa aktar (JSON)" onPress={exportData} />
          <Text style={[styles.note, { color: colors.textMuted }]}>
            {goals.length} hedef · {todos.length} görev · {events.length} etkinlik cihazında saklanıyor.
          </Text>
        </Section>

        <Section title="Gizlilik">
          <View
            style={[
              styles.privacyCard,
              { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
            ]}
          >
            <Text style={[styles.privacyTitle, { color: colors.text }]}>Verilerin cihazından çıkmıyor</Text>
            <Text style={[styles.privacyText, { color: colors.textMuted }]}>
              Bu uygulamanın sunucusu yok. Hedeflerin, alışkanlıkların, takvimin ve serin yalnızca bu
              cihazda saklanır; hiçbir veri internete gönderilmez, hesap açman veya giriş yapman
              gerekmez. Uygulamayı silersen veriler de silinir — bu yüzden yedek almak istersen
              yukarıdaki dışa aktarma seçeneğini kullan.
            </Text>
          </View>
        </Section>

        <Section title="Hakkında">
          <Row icon="information-circle" label="Sürüm" value="1.0.0" />
          <Row icon="logo-github" label="Kaynak kod" value="github.com/ebeyter" />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, spacing, radius } = useAppTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View
        style={[
          styles.sectionBody,
          { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();
  const tone = destructive ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed && onPress ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={destructive ? colors.danger : colors.textMuted} />
      <Text style={[styles.rowLabel, { color: tone }]}>{label}</Text>
      {!!value && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>}
      {!!onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionBody: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  accentWrap: {
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  accentSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
  },
  accentLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 13,
  },
  note: {
    fontSize: 12,
    marginTop: 8,
  },
  privacyCard: {},
  privacyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
