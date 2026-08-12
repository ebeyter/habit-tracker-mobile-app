import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { DEFAULT_MASCOT_NAME, getMascotName, saveMascotName } from '@/lib/mascot';
import type { StreakData } from '@/lib/types';

type Mood = 'neutral' | 'happy' | 'sad';

function moodFor(streak: StreakData): Mood {
  if (streak.currentStreak > 0) return 'happy';
  if (streak.lastCompletionDate !== null) return 'sad';
  return 'neutral';
}

// Emoji stand-in for now — swap the <Text>{emoji}</Text> below for an <Image> once
// the fal.ai-generated mascot artwork (neutral/happy/sad poses) is available.
const MOOD_CONTENT: Record<
  Mood,
  { emoji: string; message: (name: string, streak: StreakData) => string }
> = {
  happy: {
    emoji: '🦊✨',
    message: (name, streak) => `${name}: ${streak.currentStreak} gündür ara vermiyorsun, harikasın! 🔥`,
  },
  sad: {
    emoji: '🦊💧',
    message: (name) => `${name}: Serin kırıldı ama önemli değil, bugün yeniden başlayalım!`,
  },
  neutral: {
    emoji: '🦊',
    message: (name) => `${name}: Merhaba! İlk hedefini tamamla, birlikte seriye başlayalım.`,
  },
};

export function MascotCard({ streak }: { streak: StreakData }) {
  const { colors, spacing, radius } = useAppTheme();
  const [name, setName] = useState(DEFAULT_MASCOT_NAME);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    getMascotName().then(setName);
  }, []);

  const mood = moodFor(streak);
  const content = MOOD_CONTENT[mood];

  async function saveName() {
    const trimmed = draft.trim();
    if (trimmed) {
      setName(trimmed);
      await saveMascotName(trimmed);
    }
    setEditing(false);
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}
    >
      <Text style={styles.emoji}>{content.emoji}</Text>
      <View style={styles.textCol}>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={name}
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
              setDraft(name);
              setEditing(true);
            }}
          >
            <Text style={[styles.message, { color: colors.text }]}>{content.message(name, streak)}</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>İsmi değiştirmek için dokun</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 36,
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
});
