import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActionButton, AppText, Card, IconButton, ResultCard, SectionTitle } from '@/components/ui';
import { useApp } from '@/src/state/AppProvider';
import { Base, convertBetweenBases } from '@/src/core/calculations';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURE_ROUTES = [
  { key: 'converter', route: '/converter', icon: 'swap-horizontal-outline' as const },
  { key: 'calculator', route: '/binary', icon: 'calculator-outline' as const },
  { key: 'ipAnalyzer', route: '/ipv4', icon: 'git-network-outline' as const },
  { key: 'scanImage', route: '/scanner', icon: 'scan-outline' as const },
  { key: 'learn', route: '/learning', icon: 'book-outline' as const },
  { key: 'challenges', route: '/challenges', icon: 'flash-outline' as const },
  { key: 'history', route: '/history', icon: 'time-outline' as const },
  { key: 'settings', route: '/settings', icon: 'settings-outline' as const },
] as const;

const BASE_OPTIONS: Array<{ value: Base; label: string }> = [
  { value: 2, label: 'BIN' },
  { value: 10, label: 'DEC' },
  { value: 16, label: 'HEX' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, t, toggleTheme, isRTL, history, preferences } = useApp();
  const [quickValue, setQuickValue] = useState('192');
  const [quickBase, setQuickBase] = useState<Base>(preferences.defaultBase);
  const insets = useSafeAreaInsets();
  useEffect(() => setQuickBase(preferences.defaultBase), [preferences.defaultBase]);
  const conversion = useMemo(() => {
    if (!quickValue.trim()) return null;
    try {
      return convertBetweenBases(quickValue, quickBase);
    } catch {
      return null;
    }
  }, [quickValue, quickBase]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, isRTL && styles.rowReverse, Platform.OS === 'web' ? { paddingTop: 67, minHeight: 130 } : null]}>
        <View style={[styles.brand, isRTL && styles.rowReverse]}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="cover" />
          <View>
            <AppText style={styles.brandTitle}>{t('appName')}</AppText>
            <AppText muted style={styles.brandCaption}>{t('tagline')}</AppText>
          </View>
        </View>
        <View style={[styles.topActions, isRTL && styles.rowReverse]}>
          <IconButton
            icon={colors.background === '#111014' ? 'sunny-outline' : 'moon-outline'}
            label={t('appearance')}
            testID="theme-toggle"
            onPress={(event) => toggleTheme({ x: event.nativeEvent.pageX, y: Math.max(1, event.nativeEvent.pageY - insets.top) })}
          />
          <IconButton icon="settings-outline" label={t('settings')} onPress={() => router.push('/settings')} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: 28 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.welcome}>
          <View style={[styles.welcomeLabel, { backgroundColor: colors.accent }]}>
            <Ionicons name="wifi-outline" size={14} color={colors.primary} />
            <AppText style={[styles.offline, { color: colors.accentForeground }]}>{t('offline')}</AppText>
          </View>
          <AppText style={styles.welcomeText}>{t('welcome')}</AppText>
        </View>

        <SectionTitle>{t('tour')}</SectionTitle>
        <View style={styles.featureGrid}>
          {FEATURE_ROUTES.map((feature) => (
            <Pressable
              accessibilityRole="button"
              key={feature.key}
              onPress={() => router.push(feature.route)}
              style={({ pressed }) => [
                styles.featureCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name={feature.icon} size={21} color={colors.primary} />
              </View>
              <AppText style={styles.featureTitle}>{t(feature.key)}</AppText>
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <SectionTitle>{t('quickConvert')}</SectionTitle>
        <Card>
          <View style={[styles.quickHeader, isRTL && styles.rowReverse]}>
            <AppText muted style={styles.helper}>{t('sourceBase')}</AppText>
            <AppText muted style={styles.helper}>{t('noFractions')}</AppText>
          </View>
          <View style={[styles.quickInputRow, isRTL && styles.rowReverse]}>
            <TextInput
              accessibilityLabel={t('enterValue')}
              testID="quick-convert-input"
              value={quickValue}
              onChangeText={setQuickValue}
              keyboardType={quickBase === 16 ? 'default' : 'numeric'}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="192"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={colors.primary}
              style={[styles.quickInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            />
            <ChoiceRowCompact value={quickBase} onChange={setQuickBase} colors={colors} />
          </View>
          {conversion ? (
            <View style={styles.quickResults}>
              <QuickResult label={t('binary')} value={conversion.binary} />
              <QuickResult label={t('decimal')} value={conversion.decimal} />
              <QuickResult label={t('hexadecimal')} value={conversion.hexadecimal} />
            </View>
          ) : (
            <AppText muted style={styles.helper}>{t('validationNumber')}</AppText>
          )}
          <ActionButton title={t('openTool')} icon="arrow-forward-outline" kind="outline" onPress={() => router.push('/converter')} />
        </Card>

        {history.length > 0 ? (
          <>
            <SectionTitle
              right={
                <Pressable accessibilityRole="button" onPress={() => router.push('/history')}>
                  <AppText style={[styles.viewAll, { color: colors.primary }]}>{t('history')}</AppText>
                </Pressable>
              }
            >
              {t('recent')}
            </SectionTitle>
            {history.slice(0, 2).map((entry) => (
              <Card key={entry.id} style={styles.recentCard}>
                <AppText muted style={styles.helper}>
                  {entry.kind === 'ipv4'
                    ? t('ipv4')
                    : entry.kind === 'ipv6'
                      ? t('ipv6')
                      : entry.kind === 'arithmetic'
                        ? t('calculator')
                        : t('converter')}
                </AppText>
                <AppText mono style={styles.recentValue}>{entry.input} → {entry.result}</AppText>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChoiceRowCompact({
  value,
  onChange,
  colors,
}: {
  value: Base;
  onChange: (value: Base) => void;
  colors: ReturnType<typeof useApp>['colors'];
}) {
  return (
    <View style={styles.baseChoices}>
      {BASE_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[styles.baseChoice, { backgroundColor: value === option.value ? colors.primary : colors.secondary }]}
        >
          <AppText style={[styles.baseChoiceText, { color: value === option.value ? colors.primaryForeground : colors.secondaryForeground }]}>{option.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

function QuickResult({ label, value }: { label: string; value: string }) {
  const { colors } = useApp();
  return (
    <View style={[styles.quickResult, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <AppText muted style={styles.quickResultLabel}>{label}</AppText>
      <AppText mono numberOfLines={2} style={styles.quickResultValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { minHeight: 76, paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  logo: { width: 46, height: 46, borderRadius: 14 },
  brandTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  brandCaption: { fontSize: 12, marginTop: 1 },
  topActions: { flexDirection: 'row', gap: 8 },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  welcome: { gap: 12, paddingTop: 3, paddingBottom: 6 },
  welcomeLabel: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  offline: { fontSize: 11, fontWeight: '700' },
  welcomeText: { fontSize: 22, lineHeight: 29, fontWeight: '700', maxWidth: 340 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  featureCard: { minHeight: 106, width: '48%', borderRadius: 18, borderWidth: 1, padding: 13, gap: 7, justifyContent: 'space-between' },
  featureIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  featureTitle: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  quickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  helper: { fontSize: 11, lineHeight: 16 },
  quickInputRow: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  quickInput: { height: 48, flex: 1, minWidth: 60, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 17, fontFamily: 'monospace' },
  baseChoices: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: 'transparent' },
  baseChoice: { minWidth: 39, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingHorizontal: 6 },
  baseChoiceText: { fontSize: 11, fontWeight: '700' },
  quickResults: { flexDirection: 'row', gap: 7 },
  quickResult: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 12, padding: 9, gap: 4 },
  quickResultLabel: { fontSize: 10, fontWeight: '600' },
  quickResultValue: { fontSize: 12, fontWeight: '600' },
  viewAll: { fontSize: 12, fontWeight: '700' },
  recentCard: { padding: 12, gap: 5 },
  recentValue: { fontSize: 13 },
  rowReverse: { flexDirection: 'row-reverse' },
});
