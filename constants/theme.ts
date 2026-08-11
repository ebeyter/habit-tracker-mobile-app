/**
 * Design tokens for the app: colors (light/dark), spacing, radius and typography.
 */

import { Platform } from 'react-native';

const tintColorLight = '#5B5BD6';
const tintColorDark = '#8B8BF5';

export const Colors = {
  light: {
    text: '#11181C',
    textMuted: '#5C6670',
    background: '#F5F6FA',
    surface: '#FFFFFF',
    border: '#E4E7ED',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    success: '#1E9E63',
    successMuted: '#E4F7EE',
    danger: '#E5484D',
    dangerMuted: '#FDECEC',
    warning: '#F5A524',
    warningMuted: '#FEF3DD',
    streak: '#FF7A45',
  },
  dark: {
    text: '#ECEDEE',
    textMuted: '#9BA1A6',
    background: '#0E0F13',
    surface: '#1A1B20',
    border: '#2A2C33',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    success: '#3DD68C',
    successMuted: '#123324',
    danger: '#FF6369',
    dangerMuted: '#3A1618',
    warning: '#FFC069',
    warningMuted: '#3A2A0F',
    streak: '#FF9466',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
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
