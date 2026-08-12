/**
 * Design tokens for the app: colors (light/dark), spacing, radius and typography.
 *
 * The app is dark-first: the neon purple/pink palette is designed against a deep
 * indigo ground, and the light scheme is a softened counterpart of the same hues.
 */

import { Platform } from 'react-native';

const tintDark = '#A855F7';
const tintLight = '#7C3AED';

export const Colors = {
  light: {
    text: '#1B1030',
    textMuted: '#6B6486',
    background: '#F6F2FF',
    surface: '#FFFFFF',
    surfaceAlt: '#F0E9FF',
    border: '#E4DBF7',
    tint: tintLight,
    accent: '#EC4899',
    icon: '#6B6486',
    tabIconDefault: '#9B93B4',
    tabIconSelected: tintLight,
    success: '#12A150',
    successMuted: '#DEF7E9',
    danger: '#E5484D',
    dangerMuted: '#FDECEC',
    warning: '#D97706',
    warningMuted: '#FEF0DC',
    streak: '#F5620F',
    gradientStart: '#7C3AED',
    gradientEnd: '#EC4899',
  },
  dark: {
    text: '#F4F1FF',
    textMuted: '#A79FC4',
    background: '#120B23',
    surface: '#1E1438',
    surfaceAlt: '#2A1C4D',
    border: '#33245C',
    tint: tintDark,
    accent: '#F472B6',
    icon: '#A79FC4',
    tabIconDefault: '#7D74A0',
    tabIconSelected: tintDark,
    success: '#3DD68C',
    successMuted: '#123A28',
    danger: '#FF6369',
    dangerMuted: '#41171C',
    warning: '#FFC069',
    warningMuted: '#402C12',
    streak: '#FF8A4C',
    gradientStart: '#A855F7',
    gradientEnd: '#F472B6',
  },
};

/** Per-category accent colors so lists read as more than one flat surface. */
export const CategoryColors: Record<string, string> = {
  genel: '#A855F7',
  saglik: '#3DD68C',
  egitim: '#38BDF8',
  is: '#FBBF24',
  kisisel: '#F472B6',
};

export const FALLBACK_CATEGORY_COLOR = '#A855F7';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
