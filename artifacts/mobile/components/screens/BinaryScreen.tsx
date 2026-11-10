import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BinaryOperation, calculateBinary } from '@/src/core/calculations';
import { ActionButton, AppText, Card, ChoiceRow, Input, Message, Page, ResultCard, SectionTitle } from '@/components/ui';
import { useApp } from '@/src/state/AppProvider';

const OPERATION_OPTIONS: Array<{ value: BinaryOperation; label: string }> = [
  { value: 'add', label: '+' },
  { value: 'subtract', label: '−' },
  { value: 'multiply', label: '×' },
  { value: 'divide', label: '÷' },
];
const OPERATION_KEYS: Record<BinaryOperation, 'add' | 'subtract' | 'multiply' | 'divide'> = {
  add: 'add',
  subtract: 'subtract',
  multiply: 'multiply',
  divide: 'divide',
};

export default function BinaryScreen() {
  const { t, colors, addHistory, preferences } = useApp();
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [operation, setOperation] = useState<BinaryOperation>('add');
  const [result, setResult] = useState<ReturnType<typeof calculateBinary> | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    try {
      if (!left.trim() || !right.trim()) throw new Error('emptyOperands');
      const answer = calculateBinary(left, operation, right);
      setResult(answer);
      setError('');
      if (preferences.haptics) void Haptics.selectionAsync();
      addHistory({
        kind: 'arithmetic',
        input: `${left} ${OPERATION_OPTIONS.find((item) => item.value === operation)?.label} ${right}`,
        result: answer.remainder === null ? answer.result : `${answer.result} r ${answer.remainder}`,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'invalid';
      setError(
        message === 'divisionByZero'
          ? 'validationDivisionZero'
          : message === 'unsignedOnly'
            ? 'validationUnsigned'
            : message === 'empty' || message === 'emptyOperands'
              ? 'enterBoth'
              : message === 'tooLong'
                ? 'validationTooLong'
                : 'validationNumber',
      );
      setResult(null);
    }
  };

  return (
    <Page title={t('calculator')} subtitle={t('signedResult')}>
      <Card>
        <Input label={t('firstNumber')} value={left} onChangeText={setLeft} placeholder="1010" testID="binary-left" keyboardType="default" technical />
        <View style={styles.operationBlock}>
          <AppText muted style={styles.label}>{t('operation')}</AppText>
          <ChoiceRow
            options={OPERATION_OPTIONS.map(({ value, label }) => ({ value, label: `${label}  ${t(OPERATION_KEYS[value])}` }))}
            value={operation}
            onChange={setOperation}
            accessibilityLabel={t('operation')}
          />
        </View>
        <Input label={t('secondNumber')} value={right} onChangeText={setRight} placeholder="0011" testID="binary-right" keyboardType="default" technical />
        <ActionButton title={t('calculate')} icon="calculator-outline" onPress={calculate} testID="binary-calculate" />
        {error ? <Message>{t(error as keyof typeof import('@/src/i18n/strings').en)}</Message> : null}
      </Card>
      {result ? (
        <>
          <SectionTitle>{t('result')}</SectionTitle>
          <ResultCard label={t('result')} value={result.result} />
          {result.remainder !== null ? (
            <Card style={styles.summary}>
              <View style={styles.summaryItem}>
                <AppText muted>{t('quotient')}</AppText>
                <AppText mono style={styles.summaryValue}>{result.result}</AppText>
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <AppText muted>{t('remainder')}</AppText>
                <AppText mono style={styles.summaryValue}>{result.remainder}</AppText>
              </View>
            </Card>
          ) : null}
          <Card>
            <AppText style={styles.stepsTitle}>{t('showSteps')}</AppText>
            {result.steps.map((step, index) => <AppText key={`${index}-${step}`} muted style={styles.step}>{step}</AppText>)}
          </Card>
        </>
      ) : (
        <Card style={styles.note}>
          <AppText muted>{t('signedResult')}</AppText>
          <AppText muted>{t('noFractions')}</AppText>
        </Card>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  operationBlock: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  summary: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, gap: 5 },
  summaryValue: { fontSize: 19, fontWeight: '700' },
  separator: { width: 1, height: 38 },
  stepsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  step: { fontSize: 13, lineHeight: 21 },
  note: { gap: 7 },
});
