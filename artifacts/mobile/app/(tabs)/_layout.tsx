import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/src/state/AppProvider';

export default function TabLayout() {
  const { colors, t, isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const web = Platform.OS === 'web';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: web ? 84 : 60 + insets.bottom,
            paddingBottom: web ? 0 : Math.max(5, insets.bottom),
            direction: isRTL ? 'rtl' : 'ltr',
          },
        ],
        tabBarBackground: () => <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('home'), tabBarLabel: t('home'), tabBarIcon: ({ focused }) => <Ionicons name="home-outline" size={21} color={focused ? colors.primary : colors.mutedForeground} /> }} />
      <Tabs.Screen name="converter" options={{ title: t('converter'), tabBarLabel: t('converter'), tabBarIcon: ({ focused }) => <Ionicons name="swap-horizontal-outline" size={21} color={focused ? colors.primary : colors.mutedForeground} /> }} />
      <Tabs.Screen name="ipv4" options={{ title: t('ipAnalyzer'), tabBarLabel: t('ipTab'), tabBarIcon: ({ focused }) => <Ionicons name="git-network-outline" size={21} color={focused ? colors.primary : colors.mutedForeground} /> }} />
      <Tabs.Screen name="learning" options={{ title: t('learn'), tabBarLabel: t('learn'), tabBarIcon: ({ focused }) => <Ionicons name="book-outline" size={21} color={focused ? colors.primary : colors.mutedForeground} /> }} />
      <Tabs.Screen name="history" options={{ title: t('history'), tabBarLabel: t('history'), tabBarIcon: ({ focused }) => <Ionicons name="time-outline" size={21} color={focused ? colors.primary : colors.mutedForeground} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { borderTopWidth: 1, elevation: 0, paddingTop: 5 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});
