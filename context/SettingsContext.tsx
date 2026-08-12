import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const SETTINGS_KEY = '@habit-tracker/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentPreset = { id: string; label: string; light: string; dark: string; end: string };

export const ACCENTS: AccentPreset[] = [
  { id: 'neon', label: 'Neon Mor', light: '#7C3AED', dark: '#A855F7', end: '#F472B6' },
  { id: 'sunset', label: 'Gün Batımı', light: '#EA580C', dark: '#FB923C', end: '#F43F5E' },
  { id: 'ocean', label: 'Okyanus', light: '#0284C7', dark: '#38BDF8', end: '#22D3EE' },
  { id: 'forest', label: 'Orman', light: '#059669', dark: '#34D399', end: '#A3E635' },
];

export type Settings = {
  themeMode: ThemeMode;
  accentId: string;
};

const DEFAULT_SETTINGS: Settings = { themeMode: 'dark', accentId: 'neon' };

type SettingsContextValue = {
  settings: Settings;
  /** Resolved scheme after applying the user's preference over the OS setting. */
  scheme: 'light' | 'dark';
  accent: AccentPreset;
  loading: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setAccent: (id: string) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
        } catch {
          // keep defaults on unreadable data
        }
      }
      setLoading(false);
    })();
  }, []);

  async function persist(next: Settings) {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  const value = useMemo<SettingsContextValue>(() => {
    const scheme =
      settings.themeMode === 'system' ? (systemScheme ?? 'dark') : settings.themeMode;
    const accent = ACCENTS.find((a) => a.id === settings.accentId) ?? ACCENTS[0];
    return {
      settings,
      scheme,
      accent,
      loading,
      setThemeMode: (mode) => persist({ ...settings, themeMode: mode }),
      setAccent: (id) => persist({ ...settings, accentId: id }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, systemScheme, loading]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
