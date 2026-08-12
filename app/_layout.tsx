import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { GoalsProvider } from '@/context/GoalsContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function ThemedApp() {
  const { scheme } = useSettings();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="goal-form" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GoalsProvider>
          <ThemedApp />
        </GoalsProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
