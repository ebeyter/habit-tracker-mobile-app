import { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import {
  DEFAULT_MASCOT_NAME,
  getMascotConfig,
  MASCOT_COLORS,
  MASCOT_OUTFITS,
  saveMascotConfig,
  type MascotConfig,
} from '@/lib/mascot';
import type { StreakData } from '@/lib/types';

type Mood = 'neutral' | 'happy' | 'sad';

function moodFor(streak: StreakData): Mood {
  if (streak.currentStreak > 0) return 'happy';
  if (streak.lastCompletionDate !== null) return 'sad';
  return 'neutral';
}

// Generated via scripts/generate-mascot-art.mjs (fal.ai, dev-time only — not called at runtime).
const MOOD_IMAGE: Record<Mood, ImageSourcePropType> = {
  neutral: require('@/assets/mascot/neutral.png'),
  happy: require('@/assets/mascot/happy.png'),
  sad: require('@/assets/mascot/sad.png'),
};

const MOOD_MESSAGE: Record<Mood, (name: string, streak: StreakData) => string> = {
  happy: (name, streak) => `${name}: ${streak.currentStreak} gündür ara vermiyorsun, harikasın! 🔥`,
  sad: (name) => `${name}: Serin kırıldı ama önemli değil, bugün yeniden başlayalım!`,
  neutral: (name) => `${name}: Merhaba! İlk hedefini tamamla, birlikte seriye başlayalım.`,
};

const DEFAULT_CONFIG: MascotConfig = {
  name: DEFAULT_MASCOT_NAME,
  colorId: MASCOT_COLORS[0].id,
  outfitId: MASCOT_OUTFITS[0].id,
};

export function MascotCard({ streak }: { streak: StreakData }) {
  const { colors, spacing, radius } = useAppTheme();
  const [config, setConfig] = useState<MascotConfig>(DEFAULT_CONFIG);
  const [renaming, setRenaming] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    getMascotConfig().then(setConfig);
  }, []);

  const mood = moodFor(streak);
  const mascotColor = MASCOT_COLORS.find((c) => c.id === config.colorId) ?? MASCOT_COLORS[0];
  const outfit = MASCOT_OUTFITS.find((o) => o.id === config.outfitId) ?? MASCOT_OUTFITS[0];

  async function persist(next: MascotConfig) {
    setConfig(next);
    await saveMascotConfig(next);
  }

  async function saveName() {
    const trimmed = draftName.trim();
    setRenaming(false);
    if (trimmed && trimmed !== config.name) {
      await persist({ ...config, name: trimmed });
    }
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={() => setCustomizing((v) => !v)}
          style={[styles.avatar, { borderColor: mascotColor.hex }]}
        >
          <Image source={MOOD_IMAGE[mood]} style={styles.avatarImage} resizeMode="contain" />
          {!!outfit.emoji && <Text style={styles.outfitBadge}>{outfit.emoji}</Text>}
        </Pressable>

        <View style={styles.textCol}>
          {renaming ? (
            <View style={styles.editRow}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder={config.name}
                placeholderTextColor={colors.textMuted}
                autoFocus
                onSubmitEditing={saveName}
                onBlur={saveName}
                style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
              />
              <Pressable onPress={saveName} hitSlop={8}>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Kaydet</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setDraftName(config.name);
                setRenaming(true);
              }}
            >
              <Text style={[styles.message, { color: colors.text }]}>
                {MOOD_MESSAGE[mood](config.name, streak)}
              </Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                İsim için mesaja, kişiselleştirmek için maskota dokun
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {customizing && (
        <View style={[styles.customizePanel, { borderTopColor: colors.border }]}>
          <Text style={[styles.customizeLabel, { color: colors.textMuted }]}>Renk</Text>
          <View style={styles.swatchRow}>
            {MASCOT_COLORS.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => persist({ ...config, colorId: c.id })}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: c.hex,
                    borderWidth: config.colorId === c.id ? 3 : 0,
                    borderColor: colors.text,
                  },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.customizeLabel, { color: colors.textMuted, marginTop: spacing.sm }]}>
            Kıyafet
          </Text>
          <View style={styles.chipRow}>
            {MASCOT_OUTFITS.map((o) => {
              const active = config.outfitId === o.id;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => persist({ ...config, outfitId: o.id })}
                  style={[
                    styles.outfitChip,
                    { borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.border },
                  ]}
                >
                  <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>
                    {o.emoji ? `${o.emoji} ` : ''}
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  outfitBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    fontSize: 18,
  },
  textCol: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  hint: {
    fontSize: 11,
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 4,
    fontSize: 14,
  },
  customizePanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  customizeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outfitChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
