import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const SETTINGS_KEY = '@habit-tracker/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * An accent carries its own neutral ramp as well as its highlight color — otherwise the
 * surfaces stay tinted with the old hue and switching accents barely changes the app.
 */
export type Surfaces = { background: string; surface: string; surfaceAlt: string; border: string };

export type AccentPreset = {
  id: string;
  label: string;
  light: string;
  dark: string;
  end: string;
  surfacesDark: Surfaces;
  surfacesLight: Surfaces;
};

export const ACCENTS: AccentPreset[] = [
  {
    id: 'neon',
    label: 'Neon Mor',
    light: '#7C3AED',
    dark: '#A855F7',
    end: '#F472B6',
    surfacesDark: { background: '#120B23', surface: '#1E1438', surfaceAlt: '#2A1C4D', border: '#33245C' },
    surfacesLight: { background: '#F6F2FF', surface: '#FFFFFF', surfaceAlt: '#F0E9FF', border: '#E4DBF7' },
  },
  {
    id: 'sunset',
    label: 'Gün Batımı',
    light: '#EA580C',
    dark: '#FB923C',
    end: '#F43F5E',
    surfacesDark: { background: '#1C0E08', surface: '#2C1810', surfaceAlt: '#3D2117', border: '#4A2A1C' },
    surfacesLight: { background: '#FFF7F1', surface: '#FFFFFF', surfaceAlt: '#FFEDE0', border: '#F8DCC8' },
  },
  {
    id: 'ocean',
    label: 'Okyanus',
    light: '#0284C7',
    dark: '#38BDF8',
    end: '#22D3EE',
    surfacesDark: { background: '#06131F', surface: '#0E2233', surfaceAlt: '#153046', border: '#1C3D57' },
    surfacesLight: { background: '#F0F9FF', surface: '#FFFFFF', surfaceAlt: '#E2F2FD', border: '#CBE6F8' },
  },
  {
    id: 'forest',
    label: 'Orman',
    light: '#059669',
    dark: '#34D399',
    end: '#A3E635',
    surfacesDark: { background: '#07160F', surface: '#0F2419', surfaceAlt: '#173323', border: '#1E422C' },
    surfacesLight: { background: '#F1FBF5', surface: '#FFFFFF', surfaceAlt: '#E4F7EC', border: '#CCEBD9' },
  },
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
