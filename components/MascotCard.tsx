import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import {
  DEFAULT_MASCOT_NAME,
  findAnimal,
  getMascotConfig,
  MASCOT_ANIMALS,
  saveMascotConfig,
  type MascotConfig,
  type MascotMood,
} from '@/lib/mascot';
import type { StreakData } from '@/lib/types';

function moodFor(streak: StreakData): MascotMood {
  if (streak.currentStreak > 0) return 'happy';
  if (streak.lastCompletionDate !== null) return 'sad';
  return 'neutral';
}

const MOOD_MESSAGE: Record<MascotMood, (name: string, streak: StreakData) => string> = {
  happy: (name, streak) => `${streak.currentStreak} gündür ara vermiyorsun, harikasın! 🔥`,
  sad: () => 'Serin kırıldı ama önemli değil — bugün yeniden başlayalım!',
  neutral: () => 'Merhaba! İlk hedefini tamamla, birlikte seriye başlayalım.',
};

const DEFAULT_CONFIG: MascotConfig = {
  name: DEFAULT_MASCOT_NAME,
  animalId: MASCOT_ANIMALS[0].id,
};

export function MascotCard({ streak }: { streak: StreakData }) {
  const { colors, spacing, radius } = useAppTheme();
  const [config, setConfig] = useState<MascotConfig>(DEFAULT_CONFIG);
  const [renaming, setRenaming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draftName, setDraftName] = useState('');

  const bounce = useRef(new Animated.Value(0)).current;
  const previousStreak = useRef(streak.currentStreak);

  useEffect(() => {
    getMascotConfig().then(setConfig);
  }, []);

  // Celebrate when the streak grows — a short hop, the way a companion would react.
  useEffect(() => {
    if (streak.currentStreak > previousStreak.current) {
      bounce.setValue(0);
      Animated.sequence([
        Animated.spring(bounce, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.spring(bounce, { toValue: 0, useNativeDriver: true, friction: 5 }),
      ]).start();
    }
    previousStreak.current = streak.currentStreak;
  }, [streak.currentStreak, bounce]);

  const mood = moodFor(streak);
  const animal = findAnimal(config.animalId);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  async function persist(next: MascotConfig) {
    setConfig(next);
    await saveMascotConfig(next);
  }

  async function saveName() {
    const trimmed = draftName.trim();
    setRenaming(false);
    if (trimmed && trimmed !== config.name) await persist({ ...config, name: trimmed });
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: radius.lg, padding: spacing.lg }]}
    >
      <Pressable onPress={() => setPicking((v) => !v)} style={styles.mascotWrap}>
        <Animated.Image
          source={animal.art[mood]}
          style={[styles.mascot, { transform: [{ translateY }, { scale }] }]}
          resizeMode="contain"
        />
      </Pressable>

      {renaming ? (
        <View style={styles.editRow}>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder={config.name}
            placeholderTextColor="rgba(255,255,255,0.6)"
            autoFocus
            onSubmitEditing={saveName}
            onBlur={saveName}
            style={styles.nameInput}
          />
          <Pressable onPress={saveName} hitSlop={8}>
            <Text style={styles.saveText}>Kaydet</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setDraftName(config.name);
            setRenaming(true);
          }}
        >
          <Text style={styles.name}>{config.name}</Text>
          <Text style={styles.message}>{MOOD_MESSAGE[mood](config.name, streak)}</Text>
        </Pressable>
      )}

      <Text style={styles.hint}>
        {picking ? 'Arkadaşını seç' : 'İsim için yazıya, arkadaşını değiştirmek için karaktere dokun'}
      </Text>

      {picking && (
        <View style={styles.animalRow}>
          {MASCOT_ANIMALS.map((a) => {
            const active = a.id === config.animalId;
            return (
              <Pressable
                key={a.id}
                onPress={() => persist({ ...config, animalId: a.id })}
                style={[styles.animalChip, active && styles.animalChipActive]}
              >
                <Image source={a.art.neutral} style={styles.animalThumb} resizeMode="contain" />
                <Text style={styles.animalLabel}>{a.label}</Text>
                <Text style={styles.animalBlurb}>{a.blurb}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // The generated art sits on a white plate; clipping to a circle turns that into a
  // deliberate spotlight instead of a stray square against the gradient.
  mascotWrap: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mascot: {
    width: 168,
    height: 168,
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
  },
  nameInput: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 4,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  animalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  animalChip: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  animalChipActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: '#fff',
  },
  animalThumb: {
    width: 44,
    height: 44,
  },
  animalLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  animalBlurb: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
  },
});
