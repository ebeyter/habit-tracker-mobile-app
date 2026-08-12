import { Colors, Radius, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';

export function useAppTheme() {
  const { scheme, accent } = useSettings();
  const base = Colors[scheme];

  const tint = scheme === 'dark' ? accent.dark : accent.light;
  const surfaces = scheme === 'dark' ? accent.surfacesDark : accent.surfacesLight;

  return {
    // The accent preset supplies both the highlight color and the neutral ramp, so picking
    // a different accent in Settings repaints the whole app rather than just the buttons.
    colors: {
      ...base,
      ...surfaces,
      tint,
      tabIconSelected: tint,
      gradientStart: tint,
      gradientEnd: accent.end,
    },
    spacing: Spacing,
    radius: Radius,
    scheme,
  };
}
