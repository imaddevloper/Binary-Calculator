import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Base,
  binaryToDecimalSteps,
  binaryToHexSteps,
  convertBetweenBases,
  decimalToBinarySteps,
  decimalToHexSteps,
  getBitBreakdown,
  hexToDecimalSteps,
} from '@/src/core/calculations';
import { ActionButton, AppText, Card, ChoiceRow, Input, Message, Page, ResultCard, SectionTitle } from '@/components/ui';
import { useApp } from '@/src/state/AppProvider';
import type { TranslationKey } from '@/src/i18n/strings';

export default function ConverterScreen() {
  const { t, colors, language, addHistory, preferences } = useApp();
  const [source, setSource] = useState<Base>(preferences.defaultBase);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ReturnType<typeof convertBetweenBases> | null>(null);
  const [error, setError] = useState('');
  const [stepsOpen, setStepsOpen] = useState(false);

  useEffect(() => setSource(preferences.defaultBase), [preferences.defaultBase]);

  const steps = useMemo(() => {
    if (!result || !input) return [];
    if (source === 10) {
      return [
        ...decimalToBinarySteps(result.value),
        ...decimalToHexSteps(result.value),
      ];
    }
    if (source === 2) return [...binaryToDecimalSteps(input), ...binaryToHexSteps(input)];
    return hexToDecimalSteps(input);
  }, [input, result, source]);

  const convert = () => {
    try {
      const converted = convertBetweenBases(input, source);
      setResult(converted);
      setError('');
      setStepsOpen(true);
      addHistory({ kind: 'conversion', input: `${input} · Base ${source}`, result: converted.decimal });
      if (preferences.haptics) void Haptics.selectionAsync();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'invalid';
      setError(message === 'empty' ? 'validationEmpty' : message === 'tooLong' ? 'validationTooLong' : 'validationNumber');
      setResult(null);
      setStepsOpen(false);
    }
  };

  const clear = () => {
    setInput('');
    setResult(null);
    setError('');
    setStepsOpen(false);
  };

  return (
    <Page title={t('numberConverter')} subtitle={t('conversionSubtitle')} back={false}>
      <Card>
        <Input
          label={t('enterValue')}
          value={input}
          onChangeText={(value) => {
            setInput(value);
            setError('');
          }}
          placeholder={source === 2 ? '11000000' : source === 16 ? 'C0' : '192'}
          testID="converter-input"
          technical
          keyboardType={source === 16 ? 'default' : 'numeric'}
          autoCapitalize={source === 16 ? 'characters' : 'none'}
          returnKeyType="done"
          onSubmitEditing={convert}
        />
        <AppText muted style={styles.helper}>{t('sourceBase')}</AppText>
        <ChoiceRow
          options={[
            { value: 2 as const, label: t('base2') },
            { value: 10 as const, label: t('base10') },
            { value: 16 as const, label: t('base16') },
          ]}
          value={source}
          onChange={(base) => { setSource(base); setResult(null); setError(''); }}
        />
        <View style={styles.actions}>
          <ActionButton title={t('convertNow')} icon="swap-horizontal-outline" onPress={convert} testID="convert-button" style={styles.grow} />
          <ActionButton title={t('clear')} kind="outline" onPress={clear} />
        </View>
        {error ? <Message>{t(error as TranslationKey)}</Message> : null}
      </Card>

      {result ? (
        <>
          <SectionTitle>{t('result')}</SectionTitle>
          <ResultCard label={t('binary')} value={result.binary} />
          <ResultCard label={t('decimal')} value={result.decimal} />
          <ResultCard label={t('hexadecimal')} value={result.hexadecimal} />
          <ActionButton
            title={stepsOpen ? t('hideSteps') : t('showSteps')}
            icon={stepsOpen ? 'chevron-up-outline' : 'list-outline'}
            kind="secondary"
            onPress={() => setStepsOpen((open) => !open)}
          />
          {stepsOpen ? (
            <Card>
              <AppText style={styles.cardTitle}>{t('showSteps')}</AppText>
              {steps.map((step, index) => <AppText key={`${index}-${step}`} muted style={styles.step}>{step}</AppText>)}
              {source === 10 && result.value >= 0n ? (
                <>
                  <SectionTitle>{t('bits')}</SectionTitle>
                  <View style={styles.bitRow}>
                    {getBitBreakdown(result.value).map(({ bit, position }) => (
                      <View key={position} style={[styles.bit, { backgroundColor: bit === '1' ? colors.accent : colors.secondary }]}>
                        <AppText style={[styles.bitNumber, { color: bit === '1' ? colors.accentForeground : colors.mutedForeground }]}>{bit}</AppText>
                        <AppText muted style={styles.bitPosition}>{position}</AppText>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : (
        <Card style={styles.infoCard}>
          <AppText muted>{t('noFractions')}</AppText>
          <AppText muted>{language === 'ar' ? 'تُقبل القيم السالبة والإشارات الاختيارية 0b و0x.' : 'Negative integers are supported. Optional 0b and 0x prefixes are accepted.'}</AppText>
        </Card>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  helper: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 3 },
  grow: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  step: { fontSize: 13, lineHeight: 20 },
  bitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  bit: { width: 37, height: 48, borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 0 },
  bitNumber: { fontSize: 15, fontWeight: '700', fontFamily: 'monospace' },
  bitPosition: { fontSize: 9, lineHeight: 12 },
  infoCard: { gap: 8 },
});
