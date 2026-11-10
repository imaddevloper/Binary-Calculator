import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActionButton, AppText, Card, Input, Page, SectionTitle } from '@/components/ui';
import { useApp } from '@/src/state/AppProvider';

type Lesson = {
  id: string;
  en: { title: string; body: string; example: string; exercise: string; answer: string; mistake: string };
  ar: { title: string; body: string; example: string; exercise: string; answer: string; mistake: string };
};

const LESSONS: Lesson[] = [
  {
    id: 'systems',
    en: { title: 'What is a number system?', body: 'A base tells you how many digit symbols a place can use. Each position is a power of that base.', example: 'Base 10 uses 0–9. Base 2 uses 0 and 1.', exercise: 'How many symbols does Base 16 use?', answer: '16', mistake: 'A base is not the number of digits in the value.' },
    ar: { title: 'ما نظام الأعداد؟', body: 'يحدد الأساس عدد الرموز التي يمكن استخدامها في كل موضع. وكل موضع يمثل قوة من هذا الأساس.', example: 'يستخدم الأساس 10 الأرقام 0–9، والأساس 2 الرقمين 0 و1.', exercise: 'كم رمزًا يستخدم الأساس 16؟', answer: '16', mistake: 'الأساس ليس عدد الخانات في القيمة.' },
  },
  {
    id: 'binary',
    en: { title: 'Base 2 · Binary', body: 'Binary represents values using only 0 and 1. A bit is one binary digit.', example: '1011₂ = 8 + 2 + 1 = 11₁₀', exercise: 'What is 10₂ in decimal?', answer: '2', mistake: 'Read each bit by its position, not as a decimal digit.' },
    ar: { title: 'الأساس 2 · ثنائي', body: 'يمثل النظام الثنائي القيم باستخدام 0 و1 فقط. والبت رقم ثنائي واحد.', example: '1011₂ = 8 + 2 + 1 = 11₁₀', exercise: 'ما قيمة 10₂ بالنظام العشري؟', answer: '2', mistake: 'اقرأ البت حسب موضعه، لا كرقم عشري.' },
  },
  {
    id: 'decimal',
    en: { title: 'Base 10 · Decimal', body: 'Decimal is the familiar place-value system. Each place is ten times the place to its right.', example: '352 = 3×100 + 5×10 + 2×1', exercise: 'In 47, what is the value of the 4?', answer: '40', mistake: 'The value of a digit depends on its place.' },
    ar: { title: 'الأساس 10 · عشري', body: 'النظام العشري هو نظام القيمة المكانية المألوف. كل موضع يساوي عشرة أضعاف الموضع إلى يمينه.', example: '352 = 3×100 + 5×10 + 2×1', exercise: 'في العدد 47، ما قيمة الرقم 4؟', answer: '40', mistake: 'تعتمد قيمة الرقم على موضعه.' },
  },
  {
    id: 'hex',
    en: { title: 'Base 16 · Hexadecimal', body: 'Hexadecimal uses sixteen symbols: 0–9 and A–F. Letters represent values ten through fifteen.', example: 'A₁₆ = 10₁₀ · F₁₆ = 15₁₀', exercise: 'What decimal value does C represent?', answer: '12', mistake: 'A–F are digits in this base, not labels.' },
    ar: { title: 'الأساس 16 · سداسي عشري', body: 'يستخدم النظام السداسي عشري ستة عشر رمزًا: 0–9 وA–F. وتمثل الحروف القيم من 10 إلى 15.', example: 'A₁₆ = 10₁₀ · F₁₆ = 15₁₀', exercise: 'ما القيمة العشرية التي يمثلها C؟', answer: '12', mistake: 'الحروف A–F أرقام في هذا النظام.' },
  },
  {
    id: 'bits-bytes',
    en: { title: 'Bits and bytes', body: 'A bit stores one binary digit. A byte contains eight bits and can represent 256 different patterns.', example: '00000000₂ through 11111111₂', exercise: 'How many bits are in one byte?', answer: '8', mistake: 'A byte is eight bits, not eight bytes.' },
    ar: { title: 'البتات والبايتات', body: 'يخزن البت رقمًا ثنائيًا واحدًا. ويتكون البايت من ثمانية بتات ويمكنه تمثيل 256 نمطًا مختلفًا.', example: 'من 00000000₂ إلى 11111111₂', exercise: 'كم بتًا في البايت الواحد؟', answer: '8', mistake: 'البايت يتكون من ثمانية بتات.' },
  },
  {
    id: 'place-values',
    en: { title: 'Place values and powers', body: 'In base 2, positions from right to left are powers of two starting at 2⁰.', example: '… 16, 8, 4, 2, 1', exercise: 'What is the place value of the fourth bit from the right?', answer: '8', mistake: 'The rightmost bit is position zero.' },
    ar: { title: 'القيمة المكانية والقوى', body: 'في الأساس 2، تكون المواضع من اليمين قوى العدد 2 بدءًا من 2⁰.', example: '… 16، 8، 4، 2، 1', exercise: 'ما قيمة البت الرابع من اليمين؟', answer: '8', mistake: 'موضع البت الأيمن هو صفر.' },
  },
  {
    id: 'decimal-binary',
    en: { title: 'Decimal to Binary', body: 'Repeatedly divide by two and keep each remainder. Read the remainders from bottom to top.', example: '13 ÷ 2 → remainders 1, 0, 1, 1 → 1101₂', exercise: 'Convert 5 to binary.', answer: '101', mistake: 'Read the remainders upward, not in the order they were produced.' },
    ar: { title: 'من عشري إلى ثنائي', body: 'اقسم العدد على 2 مرارًا وسجّل الباقي. اقرأ البواقي من الأسفل إلى الأعلى.', example: '13 ÷ 2 → البواقي 1، 0، 1، 1 → 1101₂', exercise: 'حوّل 5 إلى ثنائي.', answer: '101', mistake: 'اقرأ البواقي صعودًا.' },
  },
  {
    id: 'binary-decimal',
    en: { title: 'Binary to Decimal', body: 'Multiply each bit by its place value and add the terms whose bit is 1.', example: '1100₂ = 1×8 + 1×4 = 12₁₀', exercise: 'Convert 101₂ to decimal.', answer: '5', mistake: 'A zero bit contributes zero; it still holds its place.' },
    ar: { title: 'من ثنائي إلى عشري', body: 'اضرب كل بت في قيمة موضعه واجمع الحدود التي يكون بتها 1.', example: '1100₂ = 1×8 + 1×4 = 12₁₀', exercise: 'حوّل 101₂ إلى عشري.', answer: '5', mistake: 'يساهم البت صفر بقيمة صفر، لكنه يحتفظ بموضعه.' },
  },
  {
    id: 'decimal-hex',
    en: { title: 'Decimal to Hexadecimal', body: 'Repeatedly divide by 16. Convert remainders 10–15 to A–F and read upward.', example: '192 ÷ 16 → remainders 0, 12 → C0₁₆', exercise: 'Convert 15 to hexadecimal.', answer: 'F', mistake: 'A remainder of twelve is C, not the two-character text “12”.' },
    ar: { title: 'من عشري إلى سداسي عشري', body: 'اقسم على 16 مرارًا. حوّل البواقي من 10 إلى 15 إلى A–F ثم اقرأها للأعلى.', example: '192 ÷ 16 → البواقي 0، 12 → C0₁₆', exercise: 'حوّل 15 إلى سداسي عشري.', answer: 'F', mistake: 'الباقي 12 هو الرمز C.' },
  },
  {
    id: 'hex-decimal',
    en: { title: 'Hexadecimal to Decimal', body: 'Multiply each digit by its power of 16, starting with 16⁰ at the right.', example: '2F₁₆ = 2×16 + 15 = 47₁₀', exercise: 'Convert 10₁₆ to decimal.', answer: '16', mistake: 'The rightmost hexadecimal digit has place value one.' },
    ar: { title: 'من سداسي عشري إلى عشري', body: 'اضرب كل رقم في قوة 16، بدءًا من 16⁰ في اليمين.', example: '2F₁₆ = 2×16 + 15 = 47₁₀', exercise: 'حوّل 10₁₆ إلى عشري.', answer: '16', mistake: 'قيمة موضع الرقم الأيمن هي واحد.' },
  },
  {
    id: 'binary-hex',
    en: { title: 'Binary to Hexadecimal', body: 'Group binary digits into nibbles of four from the right. Pad only the leftmost group with zeros.', example: '11000000₂ → 1100 0000 → C0₁₆', exercise: 'Convert 1111₂ to hexadecimal.', answer: 'F', mistake: 'Padding is for grouping only; it does not alter the value.' },
    ar: { title: 'من ثنائي إلى سداسي عشري', body: 'قسّم البتات إلى مجموعات من أربعة بدءًا من اليمين. أضف أصفارًا يسار المجموعة الأولى فقط عند الحاجة.', example: '11000000₂ → 1100 0000 → C0₁₆', exercise: 'حوّل 1111₂ إلى سداسي عشري.', answer: 'F', mistake: 'تُستخدم الأصفار للتجميع فقط ولا تغيّر القيمة.' },
  },
  {
    id: 'ipv4',
    en: { title: 'IPv4 and octets', body: 'An IPv4 address has four decimal octets. Each is a value from 0 through 255.', example: '192.168.1.10 has four octets.', exercise: 'How many octets are in an IPv4 address?', answer: '4', mistake: 'IPv4 has four parts, not three.' },
    ar: { title: 'IPv4 والمقاطع', body: 'يتكون عنوان IPv4 من أربعة مقاطع عشرية، قيمة كل منها من 0 إلى 255.', example: 'يتكون 192.168.1.10 من أربعة مقاطع.', exercise: 'كم مقطعًا في عنوان IPv4؟', answer: '4', mistake: 'يتكون IPv4 من أربعة أجزاء.' },
  },
  {
    id: 'octet-bits',
    en: { title: 'Why an octet uses 8 bits', body: 'Eight bits have 2⁸ = 256 patterns, representing the decimal range 0–255.', example: '10₁₀ → 00001010₂', exercise: 'What is the largest value in one octet?', answer: '255', mistake: 'The binary form of an octet must show all eight bits.' },
    ar: { title: 'لماذا يستخدم المقطع 8 بتات؟', body: 'تنتج عن ثمانية بتات 2⁸ = 256 نمطًا، وتمثل القيم العشرية من 0 إلى 255.', example: '10₁₀ → 00001010₂', exercise: 'ما أكبر قيمة في مقطع واحد؟', answer: '255', mistake: 'يجب عرض كل البتات الثمانية.' },
  },
];

export default function LearningScreen() {
  const { t, language, colors, completedLessons, markLessonComplete } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const selected = LESSONS.find((lesson) => lesson.id === selectedId);
  const currentIndex = selected ? LESSONS.indexOf(selected) : -1;
  const lessonText = selected ? selected[language] : null;

  const openLesson = (id: string) => {
    setSelectedId(id);
    setAnswer('');
    setShowAnswer(false);
  };

  if (selected && lessonText) {
    return (
      <Page title={t('learn')} subtitle={`${currentIndex + 1} / ${LESSONS.length}`} back={false}>
        <Card>
          <View style={styles.lessonTitleRow}>
            <AppText style={styles.lessonTitle}>{lessonText.title}</AppText>
            {completedLessons.includes(selected.id) ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
          </View>
          <AppText>{lessonText.body}</AppText>
          <View style={[styles.exampleBox, { backgroundColor: colors.secondary }]}>
            <AppText muted style={styles.label}>{t('example')}</AppText>
            <AppText mono style={styles.example}>{lessonText.example}</AppText>
          </View>
          <View style={[styles.exampleBox, { backgroundColor: colors.accent }]}>
            <AppText style={[styles.label, { color: colors.accentForeground }]}>{t('commonMistake')}</AppText>
            <AppText style={{ color: colors.accentForeground }}>{lessonText.mistake}</AppText>
          </View>
          <AppText style={styles.exerciseTitle}>{t('tryChallenge')}</AppText>
          <AppText muted>{lessonText.exercise}</AppText>
          <Input label={t('yourAnswer')} value={answer} onChangeText={setAnswer} testID="lesson-answer" />
          {showAnswer ? (
            <AppText style={[styles.answer, { color: answer.trim().toUpperCase() === lessonText.answer.toUpperCase() ? colors.success : colors.destructive }]}>
              {answer.trim().toUpperCase() === lessonText.answer.toUpperCase() ? t('correct') : `${t('notQuite')} · ${lessonText.answer}`}
            </AppText>
          ) : null}
          <ActionButton title={t('checkAnswer')} icon="checkmark-outline" onPress={() => setShowAnswer(true)} />
        </Card>
        <ActionButton
          title={completedLessons.includes(selected.id) ? t('saved') : t('lessonProgress')}
          icon="checkmark-circle-outline"
          kind="secondary"
          onPress={() => markLessonComplete(selected.id)}
        />
        <View style={styles.navigation}>
          <ActionButton
            title={t('previous')}
            icon="arrow-back-outline"
            kind="outline"
            disabled={currentIndex === 0}
            onPress={() => openLesson(LESSONS[Math.max(0, currentIndex - 1)].id)}
            style={styles.navButton}
          />
          <ActionButton
            title={t('next')}
            icon="arrow-forward-outline"
            kind="outline"
            disabled={currentIndex === LESSONS.length - 1}
            onPress={() => openLesson(LESSONS[Math.min(LESSONS.length - 1, currentIndex + 1)].id)}
            style={styles.navButton}
          />
        </View>
      </Page>
    );
  }

  return (
    <Page title={t('learn')} subtitle={t('learnSubtitle')} back={false}>
      <Card style={styles.progressCard}>
        <View style={[styles.progressRow, { flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}>
          <View style={[styles.progressIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="book-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.progressText}>
            <AppText style={styles.progressValue}>{completedLessons.length} / {LESSONS.length}</AppText>
            <AppText muted>{t('lessonProgress')}</AppText>
          </View>
        </View>
      </Card>
      <SectionTitle>{t('lessons')}</SectionTitle>
      {LESSONS.map((lesson, index) => (
        <Pressable
          accessibilityRole="button"
          key={lesson.id}
          onPress={() => openLesson(lesson.id)}
          style={({ pressed }) => [styles.lessonRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
        >
          <View style={[styles.lessonNumber, { backgroundColor: colors.secondary }]}>
            <AppText style={styles.numberText}>{index + 1}</AppText>
          </View>
          <AppText style={styles.lessonRowTitle}>{lesson[language].title}</AppText>
          {completedLessons.includes(lesson.id) ? (
            <Ionicons name="checkmark-circle" size={19} color={colors.success} />
          ) : (
            <Ionicons name={language === 'ar' ? 'chevron-back' : 'chevron-forward'} size={17} color={colors.mutedForeground} />
          )}
        </Pressable>
      ))}
      <ActionButton title={t('startChallenge')} icon="flash-outline" onPress={() => router.push('/challenges')} />
    </Page>
  );
}

const styles = StyleSheet.create({
  progressCard: { paddingVertical: 13 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progressText: { gap: 1 },
  progressValue: { fontSize: 18, fontWeight: '700' },
  lessonRow: { minHeight: 62, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  lessonNumber: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '700' },
  lessonRowTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  lessonTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lessonTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  exampleBox: { padding: 12, borderRadius: 13, gap: 5 },
  label: { fontSize: 11, fontWeight: '700' },
  example: { fontSize: 14, fontWeight: '600' },
  exerciseTitle: { fontSize: 15, fontWeight: '700' },
  answer: { fontSize: 14, fontWeight: '700' },
  navigation: { flexDirection: 'row', gap: 8 },
  navButton: { flex: 1 },
});
