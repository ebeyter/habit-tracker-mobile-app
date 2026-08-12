import { Colors, Radius, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';

export function useAppTheme() {
  const { scheme, accent } = useSettings();
  const base = Colors[scheme];

  return {
    // The accent preset overrides the palette's tint/gradient so the whole UI follows
    // whichever color the user picked in Settings.
    colors: {
      ...base,
      tint: scheme === 'dark' ? accent.dark : accent.light,
      tabIconSelected: scheme === 'dark' ? accent.dark : accent.light,
      gradientStart: scheme === 'dark' ? accent.dark : accent.light,
      gradientEnd: accent.end,
    },
    spacing: Spacing,
    radius: Radius,
    scheme,
  };
}
