import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, AppText, Card, Input, Message, Page, ResultCard, SectionTitle } from '@/components/ui';
import { analyzeIPv4, getBitBreakdown } from '@/src/core/calculations';
import { useApp } from '@/src/state/AppProvider';
import * as Clipboard from 'expo-clipboard';
import type { TranslationKey } from '@/src/i18n/strings';

export default function IPv4Screen() {
  const params = useLocalSearchParams<{ address?: string }>();
  const { t, colors, isRTL, addHistory } = useApp();
  const [address, setAddress] = useState(typeof params.address === 'string' ? params.address : '');
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeIPv4> | null>(null);
  const [error, setError] = useState('');
  const [showBits, setShowBits] = useState(false);

  const analyze = () => {
    try {
      const value = analyzeIPv4(address);
      setAnalysis(value);
      setError('');
      addHistory({ kind: 'ipv4', input: value.address, result: value.hexadecimal });
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : 'format';
      setError(
        code === 'empty'
          ? 'validationEmpty'
          : code === 'range'
            ? 'validationIPv4Range'
            : code === 'leadingZero'
              ? 'validationLeadingZero'
              : 'validationIPv4Format',
      );
      setAnalysis(null);
    }
  };

  const paste = async () => {
    const value = await Clipboard.getStringAsync();
    if (value) {
      setAddress(value.trim());
      setError('');
    }
  };

  const reset = () => {
    setAddress('');
    setAnalysis(null);
    setError('');
    setShowBits(false);
  };

  const categoryText = analysis ? t(analysis.category.key as TranslationKey) : '';
  const classKey = analysis ? (`class${analysis.historicalClass}` as TranslationKey) : null;

  return (
    <Page title={t('ipv4')} subtitle={t('ipv4Subtitle')} back={false}>
      <Card>
        <Input
          label={t('enterIPv4')}
          value={address}
          onChangeText={(value) => { setAddress(value); setError(''); }}
          placeholder="192.168.1.10"
          keyboardType="decimal-pad"
          testID="ipv4-input"
          technical
          autoCapitalize="none"
          onSubmitEditing={analyze}
        />
        <View style={[styles.inputActions, isRTL && styles.rowReverse]}>
          <Pressable accessibilityRole="button" onPress={paste} style={[styles.pasteButton, { backgroundColor: colors.secondary }]}>
            <Ionicons name="clipboard-outline" size={16} color={colors.secondaryForeground} />
            <AppText style={styles.pasteText}>{t('paste')}</AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={reset} style={[styles.pasteButton, { backgroundColor: colors.secondary }]}>
            <Ionicons name="close-outline" size={17} color={colors.secondaryForeground} />
            <AppText style={styles.pasteText}>{t('clear')}</AppText>
          </Pressable>
        </View>
        <ActionButton title={t('analyzeAddress')} icon="analytics-outline" onPress={analyze} testID="analyze-ipv4" />
        {error ? <Message>{t(error as TranslationKey)}</Message> : null}
      </Card>

      {analysis ? (
        <>
          <Card style={styles.classification}>
            <View style={[styles.categoryHeader, isRTL && styles.rowReverse]}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.categoryText}>
                <AppText style={styles.categoryTitle}>{categoryText}</AppText>
                <AppText muted style={styles.categoryRange}>{analysis.category.cidr || 'CIDR depends on routing policy'}</AppText>
              </View>
            </View>
            <AppText muted style={styles.note}>{t('reachabilityNote')}</AppText>
          </Card>

          <SectionTitle>{t('address')}</SectionTitle>
          <ResultCard label={t('address')} value={analysis.address} />
          {analysis.octets.map((octet) => (
            <Card key={octet.position} style={styles.octetCard}>
              <View style={[styles.octetHeading, isRTL && styles.rowReverse]}>
                <AppText style={styles.octetTitle}>{t('octet')} {octet.position}</AppText>
                <AppText muted>{octet.decimal}</AppText>
              </View>
              <AppText mono style={styles.octetBinary}>{octet.binary}</AppText>
              <View style={styles.placeRow}>
                {getBitBreakdown(BigInt(octet.decimal), 8).map(({ bit, position, placeValue }) => (
                  <View key={position} style={[styles.place, { backgroundColor: bit === '1' ? colors.accent : colors.secondary }]}>
                    <AppText style={[styles.placeBit, { color: bit === '1' ? colors.accentForeground : colors.mutedForeground }]}>{bit}</AppText>
                    <AppText muted style={styles.placeLabel}>{placeValue.toString()}</AppText>
                  </View>
                ))}
              </View>
            </Card>
          ))}
          <ResultCard label={t('combinedBinary')} value={analysis.combinedBinary} />
          <ResultCard label={t('addressHex')} value={analysis.hexadecimal} />
          <ResultCard label={t('addressDecimal')} value={analysis.decimal32} />
          <Card style={styles.historicalCard}>
            <AppText style={styles.historicalTitle}>{t('historicalClass')}: {classKey ? t(classKey) : ''}</AppText>
            <AppText muted>{t('historicalNote')}</AppText>
          </Card>
          <ActionButton
            title={showBits ? t('hideSteps') : t('showOctetSteps')}
            icon={showBits ? 'chevron-up-outline' : 'list-outline'}
            kind="secondary"
            onPress={() => setShowBits((current) => !current)}
          />
          {showBits ? (
            <Card>
              <AppText style={styles.historicalTitle}>{t('showSteps')}</AppText>
              <AppText muted>{analysis.octets.map((octet) => `${octet.decimal} = ${getBitBreakdown(BigInt(octet.decimal), 8).filter((bit) => bit.bit === '1').map((bit) => bit.placeValue.toString()).join(' + ') || '0'}`).join('\n')}</AppText>
            </Card>
          ) : null}
          <ActionButton title={t('analyzeAnother')} icon="refresh-outline" kind="outline" onPress={reset} />
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  inputActions: { flexDirection: 'row', gap: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  pasteButton: { minHeight: 40, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pasteText: { fontSize: 12, fontWeight: '600' },
  classification: { gap: 12 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  categoryIcon: { height: 42, width: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  categoryText: { flex: 1, gap: 3 },
  categoryTitle: { fontSize: 15, fontWeight: '700' },
  categoryRange: { fontSize: 12 },
  note: { fontSize: 12, lineHeight: 18 },
  octetCard: { gap: 10 },
  octetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  octetTitle: { fontWeight: '700' },
  octetBinary: { fontSize: 19, letterSpacing: 1.2, fontWeight: '700' },
  placeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  place: { flex: 1, minWidth: 0, height: 42, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  placeBit: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  placeLabel: { fontSize: 8, lineHeight: 11 },
  historicalCard: { gap: 6 },
  historicalTitle: { fontSize: 14, fontWeight: '700' },
});
