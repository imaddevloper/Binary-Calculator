import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ActionButton, AppText, Card, ChoiceRow, Page, SectionTitle } from '@/components/ui';
import { ThemeChoice, useApp } from '@/src/state/AppProvider';
import { Base } from '@/src/core/calculations';

const INSTAGRAM_PROFILE = 'https://www.instagram.com/andercode1?srtk=ZDIyZjg2OXI1YmUx';

export default function SettingsScreen() {
  const { t, language, setLanguage, themeChoice, setTheme, colors, isRTL, preferences, updatePreferences, clearHistory } = useApp();

  const openInstagram = async () => {
    try {
      const supported = await Linking.canOpenURL(INSTAGRAM_PROFILE);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(INSTAGRAM_PROFILE);
    } catch {
      Alert.alert(t('openFailed'), undefined, [
        { text: t('cancel'), style: 'cancel' },
        { text: t('copyLink'), onPress: () => Clipboard.setStringAsync(INSTAGRAM_PROFILE) },
      ]);
    }
  };

  const changeTheme = (next: ThemeChoice, event: import('react-native').GestureResponderEvent) => {
    setTheme(next, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
  };
  const confirmClear = () => {
    Alert.alert(t('clearHistory'), t('clearHistoryConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <Page title={t('settingsTitle')} subtitle={t('savedLocally')}>
      <SectionTitle>{t('appearance')}</SectionTitle>
      <ChoiceRow
        options={[
          { value: 'system' as const, label: t('system') },
          { value: 'light' as const, label: t('light') },
          { value: 'dark' as const, label: t('dark') },
        ]}
        value={themeChoice}
        onChange={changeTheme}
        accessibilityLabel={t('appearance')}
      />

      <SectionTitle>{t('language')}</SectionTitle>
      <ChoiceRow
        options={[
          { value: 'en' as const, label: t('english') },
          { value: 'ar' as const, label: t('arabic') },
        ]}
        value={language}
        onChange={(next) => setLanguage(next)}
        accessibilityLabel={t('language')}
      />

      <SectionTitle>{t('preferences')}</SectionTitle>
      <Card style={styles.preferenceCard}>
        <AppText muted style={styles.preferenceLabel}>{t('defaultBase')}</AppText>
        <ChoiceRow
          options={[
            { value: 2 as const, label: t('base2') },
            { value: 10 as const, label: t('base10') },
            { value: 16 as const, label: t('base16') },
          ]}
          value={preferences.defaultBase}
          onChange={(value: Base) => updatePreferences({ defaultBase: value })}
          accessibilityLabel={t('defaultBase')}
        />
        <ToggleRow title={t('hapticFeedback')} value={preferences.haptics} onChange={(value) => updatePreferences({ haptics: value })} />
        <ToggleRow title={t('reducedMotion')} value={preferences.reducedMotion} onChange={(value) => updatePreferences({ reducedMotion: value })} />
        <AppText muted style={styles.preferenceFootnote}>{t('resetPreferences')}</AppText>
      </Card>

      <SectionTitle>{t('dataPrivacy')}</SectionTitle>
      <Card style={styles.privacyCard}>
        <View style={[styles.privacyTitleRow, isRTL && styles.rowReverse]}>
          <View style={[styles.privacyIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
          </View>
          <AppText style={styles.privacyTitle}>{t('savedLocally')}</AppText>
        </View>
        <AppText muted>{t('aboutText')}</AppText>
        <ActionButton title={t('clearHistory')} icon="trash-outline" kind="outline" onPress={confirmClear} />
      </Card>

      <SectionTitle>{t('about')}</SectionTitle>
      <Card style={styles.aboutCard}>
        <AppText style={styles.aboutTitle}>{t('appName')}</AppText>
        <AppText muted>{t('aboutText')}</AppText>
        <Pressable accessibilityRole="button" onPress={openInstagram} style={[styles.contact, isRTL && styles.rowReverse]}>
          <View style={[styles.contactIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="logo-instagram" size={20} color={colors.primary} />
          </View>
          <View style={styles.contactText}>
            <AppText style={styles.contactTitle}>{t('helpContact')}</AppText>
            <AppText muted style={styles.contactSubtitle}>{t('instagramDescription')}</AppText>
          </View>
          <Ionicons name={isRTL ? 'arrow-back-outline' : 'arrow-forward-outline'} size={17} color={colors.mutedForeground} />
        </Pressable>
      </Card>
    </Page>
  );
}

function ToggleRow({ title, value, onChange }: { title: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors, isRTL } = useApp();
  return (
    <View style={[styles.toggleRow, isRTL && styles.rowReverse]}>
      <AppText style={styles.toggleTitle}>{title}</AppText>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  preferenceCard: { gap: 13 },
  preferenceLabel: { fontSize: 12, fontWeight: '600' },
  preferenceFootnote: { fontSize: 11 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toggleTitle: { flex: 1, fontWeight: '600' },
  privacyCard: { gap: 12 },
  privacyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  privacyTitle: { fontSize: 14, flex: 1, fontWeight: '600' },
  aboutCard: { gap: 12 },
  aboutTitle: { fontSize: 16, fontWeight: '700' },
  contact: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1, gap: 2 },
  contactTitle: { fontSize: 13, fontWeight: '700' },
  contactSubtitle: { fontSize: 11 },
  rowReverse: { flexDirection: 'row-reverse' },
});
