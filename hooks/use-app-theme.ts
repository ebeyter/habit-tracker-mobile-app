import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const scheme = useColorScheme() ?? 'light';
  return {
    colors: Colors[scheme],
    spacing: Spacing,
    radius: Radius,
    scheme,
  };
}
