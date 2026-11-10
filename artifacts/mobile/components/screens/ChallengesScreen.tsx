import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionButton, AppText, Card, ChoiceRow, Input, Message, Page, SectionTitle } from '@/components/ui';
import { useApp } from '@/src/state/AppProvider';
import { analyzeIPv4 } from '@/src/core/calculations';
import type { TranslationKey } from '@/src/i18n/strings';

type Difficulty = 'easy' | 'medium' | 'hard';
type Challenge = { prompt: string; answer: string; explanation: string; yesNo?: boolean };
const DIFFICULTIES: Array<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: 'easy' },
  { value: 'medium', label: 'medium' },
  { value: 'hard', label: 'hard' },
];

const VALUES: Record<Difficulty, number[]> = {
  easy: [5, 10, 15, 32, 64, 127],
  medium: [168, 192, 255, 313, 1024, 2047],
  hard: [4095, 65535, 99999, 16777215, 65536, 123456789],
};

function makeChallenge(index: number, difficulty: Difficulty, language: 'en' | 'ar'): Challenge {
  const value = VALUES[difficulty][index % VALUES[difficulty].length];
  const kind = index % 7;
  const isArabic = language === 'ar';
  if (kind === 0) {
    return { prompt: isArabic ? `حوّل ${value} من عشري إلى ثنائي.` : `Convert ${value} from decimal to binary.`, answer: value.toString(2), explanation: `${value}₁₀ = ${value.toString(2)}₂` };
  }
  if (kind === 1) {
    const binary = value.toString(2);
    return { prompt: isArabic ? `حوّل ${binary}₂ إلى عشري.` : `Convert ${binary}₂ to decimal.`, answer: String(value), explanation: `${binary}₂ = ${value}₁₀` };
  }
  if (kind === 2) {
    return { prompt: isArabic ? `حوّل ${value} إلى سداسي عشري.` : `Convert ${value} from decimal to hexadecimal.`, answer: value.toString(16).toUpperCase(), explanation: `${value}₁₀ = ${value.toString(16).toUpperCase()}₁₆` };
  }
  if (kind === 3) {
    const hexadecimal = value.toString(16).toUpperCase();
    return { prompt: isArabic ? `حوّل ${hexadecimal}₁₆ إلى عشري.` : `Convert ${hexadecimal}₁₆ to decimal.`, answer: String(value), explanation: `${hexadecimal}₁₆ = ${value}₁₀` };
  }
  if (kind === 4) {
    const binary = value.toString(2);
    return { prompt: isArabic ? `حوّل ${binary}₂ إلى سداسي عشري.` : `Convert ${binary}₂ to hexadecimal.`, answer: value.toString(16).toUpperCase(), explanation: `${binary}₂ = ${value.toString(16).toUpperCase()}₁₆` };
  }
  if (kind === 5) {
    const octet = value % 256;
    return { prompt: isArabic ? `اكتب ${octet} كقيمة ثنائية من 8 بتات.` : `Write ${octet} as an 8-bit binary octet.`, answer: octet.toString(2).padStart(8, '0'), explanation: `${octet}₁₀ = ${octet.toString(2).padStart(8, '0')}₂` };
  }
  const candidates = ['192.168.1.10', '256.1.1.1', '8.8.8.8', '192.168.1.10.5', '001.2.3.4', '10.0.0.255'];
  const address = candidates[index % candidates.length];
  let validAddress = true;
  try { analyzeIPv4(address); } catch { validAddress = false; }
  return {
    prompt: `${isArabic ? 'هل هذا العنوان صالح؟' : 'Is this IPv4 address valid?'} ${address}`,
    answer: validAddress ? 'valid' : 'invalid',
    explanation: validAddress
      ? (isArabic ? 'العنوان أربعة مقاطع من 0 إلى 255.' : 'It has four decimal octets, each from 0 to 255.')
      : (isArabic ? 'يجب أن يحتوي العنوان على أربعة مقاطع غير ملتبسة من 0 إلى 255.' : 'An IPv4 address needs four unambiguous octets from 0 to 255.'),
    yesNo: true,
  };
}

export default function ChallengesScreen() {
  const { t, language, challenge, recordChallenge, colors } = useApp();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [questionOffset, setQuestionOffset] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const question = useMemo(
    () => makeChallenge(questionOffset, difficulty, language),
    [difficulty, language, questionOffset],
  );

  const check = (candidate = answer) => {
    if (!candidate.trim()) return;
    const correct = candidate.trim().toUpperCase() === question.answer.toUpperCase();
    setFeedback(correct ? 'correct' : 'incorrect');
    recordChallenge(correct);
  };
  const next = () => {
    setQuestionOffset((value) => value + 1);
    setAnswer('');
    setFeedback(null);
  };

  return (
    <Page title={t('challenges')} subtitle={t('tryChallenge')}>
      <Card style={styles.statsCard}>
        <View style={styles.stat}>
          <AppText style={styles.statNumber}>{challenge.correct}</AppText>
          <AppText muted style={styles.statLabel}>{t('score')}</AppText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <AppText style={styles.statNumber}>{challenge.attempted ? Math.round((challenge.correct / challenge.attempted) * 100) : 0}%</AppText>
          <AppText muted style={styles.statLabel}>{t('accuracy')}</AppText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <AppText style={styles.statNumber}>{challenge.attempted}</AppText>
          <AppText muted style={styles.statLabel}>{t('attemptCount')}</AppText>
        </View>
      </Card>
      <SectionTitle>{t('difficulty')}</SectionTitle>
      <ChoiceRow
        options={DIFFICULTIES.map((item) => ({ value: item.value, label: t(item.label as TranslationKey) }))}
        value={difficulty}
        onChange={(value) => { setDifficulty(value); setFeedback(null); setAnswer(''); }}
      />
      <Card>
        <AppText muted style={styles.questionCount}>{t('attemptCount')} · {questionOffset + 1}</AppText>
        <AppText style={styles.prompt}>{question.prompt}</AppText>
        {question.yesNo ? (
          <ChoiceRow
            options={[
              { value: 'valid', label: t('valid') },
              { value: 'invalid', label: t('invalid') },
            ]}
            value={answer === 'valid' || answer === 'invalid' ? answer : 'valid'}
            onChange={(value) => {
              setAnswer(value);
              setFeedback(null);
            }}
          />
        ) : (
          <Input
            label={t('yourAnswer')}
            value={answer}
            onChangeText={(value) => { setAnswer(value); setFeedback(null); }}
            testID="challenge-answer"
            autoCapitalize="characters"
            keyboardType="default"
            technical
          />
        )}
        {feedback ? (
          <>
            <Message tone={feedback === 'correct' ? 'success' : 'error'}>
              {feedback === 'correct' ? t('correct') : `${t('notQuite')} · ${question.answer}`}
            </Message>
            <AppText muted>{question.explanation}</AppText>
            <ActionButton title={t('nextQuestion')} icon="arrow-forward-outline" onPress={next} />
          </>
        ) : (
          <ActionButton
            title={t('checkAnswer')}
            icon="checkmark-outline"
            onPress={() => check(question.yesNo ? answer || 'valid' : answer)}
            disabled={!question.yesNo && !answer.trim()}
          />
        )}
      </Card>
      <AppText muted style={styles.note}>{language === 'ar' ? 'تُنشأ الأسئلة من قيم محددة وتُحسب الإجابات محليًا.' : 'Questions use deterministic value sets; answers are calculated locally.'}</AppText>
    </Page>
  );
}

const styles = StyleSheet.create({
  statsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 13 },
  stat: { alignItems: 'center', gap: 1, flex: 1 },
  statNumber: { fontSize: 19, fontWeight: '700' },
  statLabel: { fontSize: 10 },
  statDivider: { width: 1, height: 34 },
  questionCount: { fontSize: 11, fontWeight: '600' },
  prompt: { fontSize: 19, lineHeight: 27, fontWeight: '700' },
  note: { fontSize: 12, textAlign: 'center' },
});
