import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hedefler',
          tabBarIcon: ({ color, size }) => <Ionicons name="flag" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="day"
        options={{
          title: 'Gün Gün',
          tabBarIcon: ({ color, size }) => <Ionicons name="today" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'Yapılacak',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapor',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
