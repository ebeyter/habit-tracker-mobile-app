import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

const MASCOT_CONFIG_KEY = '@habit-tracker/mascot-config';
export const DEFAULT_MASCOT_NAME = 'Bilge';

export type MascotMood = 'neutral' | 'happy' | 'sad';

export type MascotAnimal = {
  id: string;
  label: string;
  /** Short line explaining what this companion is like, shown in the picker */
  blurb: string;
  art: Record<MascotMood, ImageSourcePropType>;
};

// Generated via scripts/generate-mascot-art.mjs (fal.ai, dev-time only — no runtime API calls).
export const MASCOT_ANIMALS: MascotAnimal[] = [
  {
    id: 'owl',
    label: 'Baykuş',
    blurb: 'Bilge rehber',
    art: {
      neutral: require('@/assets/mascot/owl-neutral.png'),
      happy: require('@/assets/mascot/owl-happy.png'),
      sad: require('@/assets/mascot/owl-sad.png'),
    },
  },
  {
    id: 'dog',
    label: 'Köpek',
    blurb: 'Sadık dost',
    art: {
      neutral: require('@/assets/mascot/dog-neutral.png'),
      happy: require('@/assets/mascot/dog-happy.png'),
      sad: require('@/assets/mascot/dog-sad.png'),
    },
  },
  {
    id: 'fox',
    label: 'Tilki',
    blurb: 'Zeki yardımcı',
    art: {
      neutral: require('@/assets/mascot/fox-neutral.png'),
      happy: require('@/assets/mascot/fox-happy.png'),
      sad: require('@/assets/mascot/fox-sad.png'),
    },
  },
  {
    id: 'cat',
    label: 'Kedi',
    blurb: 'Sakin eşlikçi',
    art: {
      neutral: require('@/assets/mascot/cat-neutral.png'),
      happy: require('@/assets/mascot/cat-happy.png'),
      sad: require('@/assets/mascot/cat-sad.png'),
    },
  },
  {
    id: 'panda',
    label: 'Panda',
    blurb: 'Neşeli destek',
    art: {
      neutral: require('@/assets/mascot/panda-neutral.png'),
      happy: require('@/assets/mascot/panda-happy.png'),
      sad: require('@/assets/mascot/panda-sad.png'),
    },
  },
  {
    id: 'rabbit',
    label: 'Tavşan',
    blurb: 'Enerjik arkadaş',
    art: {
      neutral: require('@/assets/mascot/rabbit-neutral.png'),
      happy: require('@/assets/mascot/rabbit-happy.png'),
      sad: require('@/assets/mascot/rabbit-sad.png'),
    },
  },
];

export type MascotConfig = {
  name: string;
  animalId: string;
};

const DEFAULT_CONFIG: MascotConfig = {
  name: DEFAULT_MASCOT_NAME,
  animalId: MASCOT_ANIMALS[0].id,
};

export function findAnimal(id: string): MascotAnimal {
  return MASCOT_ANIMALS.find((a) => a.id === id) ?? MASCOT_ANIMALS[0];
}

export async function getMascotConfig(): Promise<MascotConfig> {
  const raw = await AsyncStorage.getItem(MASCOT_CONFIG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(raw) as Partial<MascotConfig>;
    return {
      name: parsed.name?.trim() || DEFAULT_CONFIG.name,
      animalId: findAnimal(parsed.animalId ?? '').id,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveMascotConfig(config: MascotConfig): Promise<void> {
  await AsyncStorage.setItem(MASCOT_CONFIG_KEY, JSON.stringify(config));
}
