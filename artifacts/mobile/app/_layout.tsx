import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppText, Loading } from '@/components/ui';
import { AppProvider, useApp } from '@/src/state/AppProvider';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="binary" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ headerShown: false }} />
      <Stack.Screen name="challenges" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppFrame() {
  const { ready, colors, activeTheme, t } = useApp();
  const [introElapsed, setIntroElapsed] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const timer = setTimeout(() => setIntroElapsed(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!introElapsed) return <BrandedIntro />;
  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Loading label={t('saved')} />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      <RootLayoutNav />
    </>
  );
}

function BrandedIntro() {
  const { colors, t, activeTheme } = useApp();
  const progress = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.88)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = setTimeout(() => {
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, damping: 18, stiffness: 100, useNativeDriver: true }),
      ]).start();
    }, 500);
    const title = setTimeout(() => {
      Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, 1500);
    const bar = setTimeout(() => {
      Animated.timing(progress, { toValue: 1, duration: 3000, useNativeDriver: false }).start();
    }, 2500);
    return () => {
      clearTimeout(intro);
      clearTimeout(title);
      clearTimeout(bar);
    };
  }, [iconOpacity, iconScale, progress, titleOpacity]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={[styles.intro, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: iconOpacity, transform: [{ scale: iconScale }] }}>
        <Image source={require('../assets/images/icon.png')} resizeMode="contain" style={styles.introIcon} />
      </Animated.View>
      <Animated.View style={{ opacity: titleOpacity, marginTop: 18 }}>
        <AppText style={styles.introTitle}>{t('appName')}</AppText>
      </Animated.View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressBar, { width: barWidth, backgroundColor: colors.primary }]} />
      </View>
      <AppText muted style={styles.introFoot}>{t('offline')}</AppText>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AppProvider>
                <AppFrame />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  introIcon: { width: 164, height: 164, borderRadius: 30 },
  introTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700', textAlign: 'center' },
  progressTrack: { position: 'absolute', left: '20%', right: '20%', bottom: '19%', height: 4, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  introFoot: { position: 'absolute', bottom: '14%', fontSize: 12 },
});
