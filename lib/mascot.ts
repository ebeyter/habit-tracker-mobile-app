import AsyncStorage from '@react-native-async-storage/async-storage';

const MASCOT_NAME_KEY = '@habit-tracker/mascot-name';
export const DEFAULT_MASCOT_NAME = 'Foksi';

export async function getMascotName(): Promise<string> {
  const raw = await AsyncStorage.getItem(MASCOT_NAME_KEY);
  return raw?.trim() || DEFAULT_MASCOT_NAME;
}

export async function saveMascotName(name: string): Promise<void> {
  await AsyncStorage.setItem(MASCOT_NAME_KEY, name.trim() || DEFAULT_MASCOT_NAME);
}
