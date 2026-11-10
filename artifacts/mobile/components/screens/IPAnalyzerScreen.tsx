import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ActionButton, AppText, Card, Input, Message, Page, ResultCard, SectionTitle } from '@/components/ui';
import { analyzeIPv4, analyzeIPv6, getBitBreakdown, validateIPv4, validateIPv6 } from '@/src/core/calculations';
import { useApp } from '@/src/state/AppProvider';
import type { TranslationKey } from '@/src/i18n/strings';

type Version = 'auto' | 'ipv4' | 'ipv6';

export default function IPAnalyzerScreen() {
  const params = useLocalSearchParams<{ address?: string; version?: string }>();
  const { t, colors, isRTL, addHistory } = useApp();
  const [address, setAddress] = useState(typeof params.address === 'string' ? params.address : '');
  const [version, setVersion] = useState<Version>(params.version === 'ipv6' ? 'ipv6' : params.version === 'ipv4' ? 'ipv4' : 'auto');
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeIPv4> | ReturnType<typeof analyzeIPv6> | null>(null);
  const [analysisVersion, setAnalysisVersion] = useState<'ipv4' | 'ipv6' | null>(null);
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (typeof params.address === 'string' && params.address.trim()) {
      setAddress(params.address);
      setVersion(params.version === 'ipv6' ? 'ipv6' : params.version === 'ipv4' ? 'ipv4' : 'auto');
    }
  }, [params.address, params.version]);

  const resetResult = () => { setAnalysis(null); setAnalysisVersion(null); setError(''); setShowSteps(false); };
  const selectVersion = (next: Version) => { setVersion(next); resetResult(); };

  const analyze = () => {
    const trimmed = address.trim();
    if (!trimmed) { resetResult(); setError('validationEmpty'); return; }
    const detected: 'ipv4' | 'ipv6' = trimmed.includes(':') ? 'ipv6' : 'ipv4';
    const selected = version === 'auto' ? detected : version;
    if (selected === 'ipv4') {
      const validation = validateIPv4(trimmed);
      if (!validation.valid) {
        const other = validateIPv6(trimmed);
        setAnalysis(null); setAnalysisVersion(null);
        setError(other.valid ? 'validationSelectedIPv4' : validation.reason === 'empty' ? 'validationEmpty' : validation.reason === 'range' ? 'validationIPv4Range' : validation.reason === 'leadingZero' ? 'validationLeadingZero' : 'validationIPv4Format');
        return;
      }
      const value = analyzeIPv4(trimmed);
      setAnalysis(value); setAnalysisVersion('ipv4'); setError(''); setShowSteps(false);
      addHistory({ kind: 'ipv4', input: value.address, result: value.hexadecimal });
      return;
    }
    const validation = validateIPv6(trimmed);
    if (!validation.valid) {
      const other = validateIPv4(trimmed);
      setAnalysis(null); setAnalysisVersion(null);
      setError(other.valid ? 'validationSelectedIPv6' : 'validationIPv6Format');
      return;
    }
    const value = analyzeIPv6(trimmed);
    setAnalysis(value); setAnalysisVersion('ipv6'); setError(''); setShowSteps(false);
    addHistory({ kind: 'ipv6', input: value.address, result: value.hexadecimal });
  };

  const paste = async () => {
    const value = await Clipboard.getStringAsync();
    if (value) { setAddress(value.trim()); resetResult(); }
  };
  const categoryText = analysis ? t(analysis.category.key as TranslationKey) : '';
  const formatText = (key: TranslationKey, values: Record<string, string | number>) =>
    Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), t(key));

  return (
    <Page title={t('ipAnalyzer')} subtitle={t('ipAnalyzerSubtitle')} back={false}>
      <Card>
        <AppText muted style={styles.label}>{t('ipVersion')}</AppText>
        <View style={[styles.versionRow, isRTL && styles.rowReverse]}>
          {(['ipv4', 'ipv6', 'auto'] as const).map((item) => {
            const selected = version === item;
            const label = item === 'auto' ? t('autoDetect') : item === 'ipv4' ? 'IPv4' : 'IPv6';
            return (
              <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => selectVersion(item)} style={[styles.versionButton, { backgroundColor: selected ? colors.primary : colors.secondary, borderColor: selected ? colors.primary : colors.border }]}>
                <AppText style={[styles.versionText, { color: selected ? colors.primaryForeground : colors.secondaryForeground }]}>{label}</AppText>
              </Pressable>
            );
          })}
        </View>
        <Input
          label={t('enterIPAddress')}
          value={address}
          onChangeText={(value) => { setAddress(value); resetResult(); }}
          placeholder={t('autoDetectPlaceholder')}
          keyboardType="default"
          testID="ip-address-input"
          technical
          autoCapitalize="none"
          onSubmitEditing={analyze}
        />
        <View style={[styles.inputActions, isRTL && styles.rowReverse]}>
          <Pressable accessibilityRole="button" onPress={paste} style={[styles.smallAction, { backgroundColor: colors.secondary }]}>
            <Ionicons name="clipboard-outline" size={16} color={colors.secondaryForeground} /><AppText style={styles.smallActionText}>{t('paste')}</AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setAddress(''); resetResult(); }} style={[styles.smallAction, { backgroundColor: colors.secondary }]}>
            <Ionicons name="close-outline" size={17} color={colors.secondaryForeground} /><AppText style={styles.smallActionText}>{t('clear')}</AppText>
          </Pressable>
        </View>
        <ActionButton title={t('analyzeAddress')} icon="analytics-outline" onPress={analyze} testID="analyze-ip-address" />
        {error ? <Message>{t(error as TranslationKey)}</Message> : null}
      </Card>

      {analysis && analysisVersion === 'ipv4' && 'octets' in analysis ? (
        <>
          <Card style={styles.classification}>
            <View style={[styles.categoryHeader, isRTL && styles.rowReverse]}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.accent }]}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} /></View>
              <View style={styles.categoryText}><AppText style={styles.categoryTitle}>{categoryText}</AppText><AppText muted style={styles.categoryRange}>{analysis.category.cidr || t('policyDependent')}</AppText></View>
            </View>
            <AppText muted style={styles.note}>{t('reachabilityNote')}</AppText>
          </Card>
          <SectionTitle>{t('address')}</SectionTitle>
          <ResultCard label={t('address')} value={analysis.address} />
          {analysis.octets.map((octet) => (
            <Card key={octet.position} style={styles.octetCard}>
              <View style={[styles.octetHeading, isRTL && styles.rowReverse]}><AppText style={styles.octetTitle}>{t('octet')} {octet.position}</AppText><AppText muted>{octet.decimal}</AppText></View>
              <AppText mono style={styles.octetBinary}>{octet.binary}</AppText>
              <ResultCard label={t('hexadecimal')} value={octet.hexadecimal} />
              <View style={styles.placeRow}>{getBitBreakdown(BigInt(octet.decimal), 8).map(({ bit, position, placeValue }) => <View key={position} style={[styles.place, { backgroundColor: bit === '1' ? colors.accent : colors.secondary }]}><AppText style={[styles.placeBit, { color: bit === '1' ? colors.accentForeground : colors.mutedForeground }]}>{bit}</AppText><AppText muted style={styles.placeLabel}>{placeValue.toString()}</AppText></View>)}</View>
            </Card>
          ))}
          <ResultCard label={t('combinedBinary')} value={analysis.combinedBinary} />
          <ResultCard label={t('addressHex')} value={analysis.hexadecimal} />
          <ResultCard label={t('addressDecimal')} value={analysis.decimal32} />
          <Card style={styles.historicalCard}><AppText style={styles.historicalTitle}>{t('historicalClass')}: {analysis.historicalClass === 'special' ? t('special') : t((`class${analysis.historicalClass}`) as TranslationKey)}</AppText><AppText muted>{t('historicalNote')}</AppText></Card>
          <ActionButton title={showSteps ? t('hideSteps') : t('showOctetSteps')} icon={showSteps ? 'chevron-up-outline' : 'list-outline'} kind="secondary" onPress={() => setShowSteps((current) => !current)} />
          {showSteps ? <Card><AppText style={styles.historicalTitle}>{t('ipv4Steps')}</AppText>{analysis.conversionSteps.octets.map((octet) => <AppText key={octet.position} muted>{formatText('ipv4StepOctet', { position: octet.position, decimal: octet.decimal, binary: octet.binary, hexadecimal: octet.hexadecimal })}</AppText>)}<AppText muted>{t('ipv4StepAssemble')}</AppText></Card> : null}
        </>
      ) : null}

      {analysis && analysisVersion === 'ipv6' && 'groups' in analysis ? (
        <>
          <Card style={styles.classification}>
            <View style={[styles.categoryHeader, isRTL && styles.rowReverse]}><View style={[styles.categoryIcon, { backgroundColor: colors.accent }]}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} /></View><View style={styles.categoryText}><AppText style={styles.categoryTitle}>{categoryText}</AppText><AppText muted style={styles.categoryRange}>{analysis.category.cidr || t('policyDependent')}</AppText></View></View>
            <AppText muted style={styles.note}>{t('addressScope')}: {t(analysis.category.scopeKey as TranslationKey)}</AppText>
          </Card>
          <SectionTitle>{t('expandedIPv6')}</SectionTitle>
          <ResultCard label={t('address')} value={analysis.address} />
          <ResultCard label={t('expandedIPv6')} value={analysis.expandedAddress} />
          {analysis.groups.map((group) => (
            <Card key={group.position} style={styles.octetCard}>
              <View style={[styles.octetHeading, isRTL && styles.rowReverse]}><AppText style={styles.octetTitle}>{t('ipv6Group')} {group.position}</AppText><AppText muted>{group.decimal}</AppText></View>
              <ResultCard label={t('hexadecimal')} value={group.hexadecimal} />
              <ResultCard label={t('binary')} value={group.binary} />
            </Card>
          ))}
          <ResultCard label={t('ipv6Binary128')} value={analysis.binary128} />
          <ResultCard label={t('ipv6Hex128')} value={analysis.hexadecimal} />
          <ResultCard label={t('ipv6Decimal128')} value={analysis.decimal128} />
          <ActionButton title={showSteps ? t('hideSteps') : t('showSteps')} icon={showSteps ? 'chevron-up-outline' : 'list-outline'} kind="secondary" onPress={() => setShowSteps((current) => !current)} />
          {showSteps ? <Card><AppText style={styles.historicalTitle}>{t('ipv6Steps')}</AppText>{analysis.steps.map((step, index) => {
            if (step.kind === 'embeddedIPv4') return <AppText key={index} muted>{formatText('ipv6StepEmbedded', { address: step.address, groups: step.groups })}</AppText>;
            if (step.kind === 'expansion') return <AppText key={index} muted>{formatText('ipv6StepExpansion', { count: step.zeroGroups, address: step.address })}</AppText>;
            if (step.kind === 'alreadyExpanded') return <AppText key={index} muted>{t('ipv6StepAlreadyExpanded')}</AppText>;
            if (step.kind === 'group') return <AppText key={index} muted>{formatText('ipv6StepGroup', { position: step.position, hexadecimal: step.hexadecimal, binary: step.binary })}</AppText>;
            return <AppText key={index} muted>{t('ipv6StepAssemble')}</AppText>;
          })}</Card> : null}
        </>
      ) : null}
      {analysis ? <ActionButton title={t('analyzeAnother')} icon="refresh-outline" kind="outline" onPress={() => { setAddress(''); resetResult(); }} /> : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600' },
  versionRow: { flexDirection: 'row', gap: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  versionButton: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  versionText: { fontSize: 12, fontWeight: '700' },
  inputActions: { flexDirection: 'row', gap: 8 },
  smallAction: { minHeight: 38, paddingHorizontal: 12, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallActionText: { fontSize: 12, fontWeight: '600' },
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
