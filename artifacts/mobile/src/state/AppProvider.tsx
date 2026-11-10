import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import palette from '@/constants/colors';
import { ar, en, Language, TranslationKey } from '@/src/i18n/strings';
import { Base } from '@/src/core/calculations';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type HistoryKind = 'conversion' | 'arithmetic' | 'ipv4' | 'ipv6';
export type HistoryEntry = {
  id: string;
  kind: HistoryKind;
  input: string;
  result: string;
  createdAt: number;
};
export type ChallengeProgress = {
  correct: number;
  attempted: number;
};
export type CalculatorPreferences = {
  defaultBase: Base;
  haptics: boolean;
  reducedMotion: boolean;
};

type StoredState = {
  version: 1;
  language: Language;
  theme: ThemeChoice;
  history: HistoryEntry[];
  completedLessons: string[];
  challenge: ChallengeProgress;
  preferences: CalculatorPreferences;
};

type AppContextValue = {
  language: Language;
  isRTL: boolean;
  themeChoice: ThemeChoice;
  activeTheme: 'light' | 'dark';
  colors: (typeof palette)['light'];
  history: HistoryEntry[];
  completedLessons: string[];
  challenge: ChallengeProgress;
  preferences: CalculatorPreferences;
  ready: boolean;
  t: (key: TranslationKey) => string;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeChoice, point?: { x: number; y: number }) => void;
  updatePreferences: (patch: Partial<CalculatorPreferences>) => void;
  toggleTheme: (point?: { x: number; y: number }) => void;
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  markLessonComplete: (id: string) => void;
  recordChallenge: (correct: boolean) => void;
};

const STORAGE_KEY = 'binary-calculator-state-v1';
const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_STATE: StoredState = {
  version: 1,
  language: 'en',
  theme: 'system',
  history: [],
  completedLessons: [],
  challenge: { correct: 0, attempted: 0 },
  preferences: { defaultBase: 10, haptics: true, reducedMotion: false },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [language, setLanguageState] = useState<Language>(DEFAULT_STATE.language);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(DEFAULT_STATE.theme);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<ChallengeProgress>(DEFAULT_STATE.challenge);
  const [preferences, setPreferences] = useState<CalculatorPreferences>(DEFAULT_STATE.preferences);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const themeTransitioning = useRef(false);
  const [revealState, setRevealState] = useState<{
    x: number;
    y: number;
    target: 'light' | 'dark';
  } | null>(null);

  const activeTheme =
    themeChoice === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeChoice;
  const colors = palette[activeTheme];

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setSystemReducedMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        try {
          const stored = JSON.parse(raw) as Partial<StoredState>;
          if (stored.version !== 1) return;
          if (stored.language === 'en' || stored.language === 'ar') setLanguageState(stored.language);
          if (stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system') {
            setThemeChoice(stored.theme);
          }
          if (Array.isArray(stored.history)) setHistory(stored.history.slice(0, 100));
          if (Array.isArray(stored.completedLessons)) setCompletedLessons(stored.completedLessons);
          if (stored.preferences && typeof stored.preferences === 'object') {
            const storedPreferences = stored.preferences as Partial<CalculatorPreferences>;
            setPreferences({
              defaultBase:
                storedPreferences.defaultBase === 2 || storedPreferences.defaultBase === 10 || storedPreferences.defaultBase === 16
                  ? storedPreferences.defaultBase
                  : DEFAULT_STATE.preferences.defaultBase,
              haptics: typeof storedPreferences.haptics === 'boolean' ? storedPreferences.haptics : DEFAULT_STATE.preferences.haptics,
              reducedMotion: typeof storedPreferences.reducedMotion === 'boolean' ? storedPreferences.reducedMotion : DEFAULT_STATE.preferences.reducedMotion,
            });
          }
          if (
            stored.challenge &&
            Number.isFinite(stored.challenge.correct) &&
            Number.isFinite(stored.challenge.attempted)
          ) {
            setChallenge(stored.challenge);
          }
        } catch {
          // Invalid local data is ignored; the app continues with safe defaults.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const state: StoredState = {
      version: 1,
      language,
      theme: themeChoice,
      history,
      completedLessons,
      challenge,
      preferences,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // A storage failure must not prevent in-memory calculator use.
    });
  }, [ready, language, themeChoice, history, completedLessons, challenge, preferences]);

  const setTheme = useCallback(
    (next: ThemeChoice, point?: { x: number; y: number }) => {
      if (themeTransitioning.current) return;
      const target = next === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : next;
      if (!point || target === activeTheme || preferences.reducedMotion || systemReducedMotion) {
        setThemeChoice(next);
        return;
      }
      themeTransitioning.current = true;
      setRevealState({ ...point, target });
      reveal.setValue(0);
      const circleRadius = 30;
      const farthest = Math.max(
        Math.hypot(point.x, point.y),
        Math.hypot(width - point.x, point.y),
        Math.hypot(point.x, height - point.y),
        Math.hypot(width - point.x, height - point.y),
      );
      Animated.timing(reveal, {
        toValue: Math.max(1, (farthest * 1.12) / circleRadius),
        duration: 620,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        themeTransitioning.current = false;
        if (finished) {
          setThemeChoice(next);
          setRevealState(null);
          reveal.setValue(0);
        } else {
          setRevealState(null);
          reveal.setValue(0);
        }
      });
    },
    [activeTheme, height, preferences.reducedMotion, reveal, systemReducedMotion, systemScheme, width],
  );

  const toggleTheme = useCallback(
    (point?: { x: number; y: number }) => {
      setTheme(activeTheme === 'dark' ? 'light' : 'dark', point);
    },
    [activeTheme, setTheme],
  );

  const addHistory = useCallback((item: Omit<HistoryEntry, 'id' | 'createdAt'>) => {
    setHistory((current) => [
      { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now() },
      ...current,
    ].slice(0, 100));
  }, []);
  const removeHistory = useCallback((id: string) => {
    setHistory((current) => current.filter((item) => item.id !== id));
  }, []);
  const clearHistory = useCallback(() => setHistory([]), []);
  const markLessonComplete = useCallback((id: string) => {
    setCompletedLessons((current) => (current.includes(id) ? current : [...current, id]));
  }, []);
  const recordChallenge = useCallback((correctAnswer: boolean) => {
    setChallenge((current) => ({
      attempted: current.attempted + 1,
      correct: current.correct + (correctAnswer ? 1 : 0),
    }));
  }, []);
  const updatePreferences = useCallback((patch: Partial<CalculatorPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => (language === 'ar' ? ar[key] : en[key]),
    [language],
  );
  const value = useMemo<AppContextValue>(
    () => ({
      language,
      isRTL: language === 'ar',
      themeChoice,
      activeTheme,
      colors,
      history,
      completedLessons,
      challenge,
      preferences,
      ready,
      t,
      setLanguage: setLanguageState,
      setTheme,
      updatePreferences,
      toggleTheme,
      addHistory,
      removeHistory,
      clearHistory,
      markLessonComplete,
      recordChallenge,
    }),
    [
      language,
      themeChoice,
      activeTheme,
      colors,
      history,
      completedLessons,
      challenge,
      preferences,
      ready,
      t,
      setTheme,
      updatePreferences,
      toggleTheme,
      addHistory,
      removeHistory,
      clearHistory,
      markLessonComplete,
      recordChallenge,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      <View style={[styles.root, { backgroundColor: colors.background }]} testID="app-root">
        {revealState && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.revealLayer]}>
            <Animated.View
              style={{
                position: 'absolute',
                left: revealState.x - 30,
                top: revealState.y - 30,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: palette[revealState.target].background,
                transform: [{ scale: reveal }],
              }}
            />
          </View>
        )}
        <View style={styles.contentLayer}>{children}</View>
      </View>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  revealLayer: { zIndex: 0, elevation: 0 },
  contentLayer: { flex: 1, zIndex: 1 },
});
