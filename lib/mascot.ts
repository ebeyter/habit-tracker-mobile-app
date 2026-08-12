import AsyncStorage from '@react-native-async-storage/async-storage';

const MASCOT_CONFIG_KEY = '@habit-tracker/mascot-config';
export const DEFAULT_MASCOT_NAME = 'Foksi';

export type MascotColor = { id: string; label: string; hex: string };
export const MASCOT_COLORS: MascotColor[] = [
  { id: 'orange', label: 'Turuncu', hex: '#FF7A45' },
  { id: 'purple', label: 'Mor', hex: '#5B5BD6' },
  { id: 'green', label: 'Yeşil', hex: '#1E9E63' },
  { id: 'pink', label: 'Pembe', hex: '#E5487D' },
  { id: 'blue', label: 'Mavi', hex: '#3B82F6' },
];

export type MascotOutfit = { id: string; label: string; emoji: string | null };
export const MASCOT_OUTFITS: MascotOutfit[] = [
  { id: 'none', label: 'Yok', emoji: null },
  { id: 'hat', label: 'Şapka', emoji: '🎩' },
  { id: 'glasses', label: 'Gözlük', emoji: '🕶️' },
  { id: 'scarf', label: 'Atkı', emoji: '🧣' },
  { id: 'bow', label: 'Fiyonk', emoji: '🎀' },
  { id: 'crown', label: 'Taç', emoji: '👑' },
];

export type MascotConfig = {
  name: string;
  colorId: string;
  outfitId: string;
};

const DEFAULT_CONFIG: MascotConfig = {
  name: DEFAULT_MASCOT_NAME,
  colorId: MASCOT_COLORS[0].id,
  outfitId: MASCOT_OUTFITS[0].id,
};

export async function getMascotConfig(): Promise<MascotConfig> {
  const raw = await AsyncStorage.getItem(MASCOT_CONFIG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<MascotConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveMascotConfig(config: MascotConfig): Promise<void> {
  await AsyncStorage.setItem(MASCOT_CONFIG_KEY, JSON.stringify(config));
}
