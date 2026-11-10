import React, { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  GestureResponderEvent,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useApp } from '@/src/state/AppProvider';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import * as Haptics from 'expo-haptics';

export function AppText({
  children,
  style,
  muted = false,
  mono = false,
  ...props
}: React.ComponentProps<typeof Text> & {
  muted?: boolean;
  mono?: boolean;
}) {
  const { colors, isRTL } = useApp();
  return (
    <Text
      {...props}
      style={[
        styles.text,
        { color: muted ? colors.mutedForeground : colors.foreground },
        isRTL && !mono ? styles.rtlText : null,
        mono ? styles.mono : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Page({
  title,
  subtitle,
  children,
  back = true,
  style,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const webInset = Platform.OS === 'web';
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.page, { backgroundColor: colors.background }, style]}
    >
      <View style={[styles.pageHeader, isRTL && styles.rowReverse]}>
        {back ? <BackButton /> : <View style={styles.headerSpacer} />}
        <View style={styles.headerTitle}>
          <AppText numberOfLines={1} style={styles.headerHeading}>{title}</AppText>
          {subtitle ? <AppText muted numberOfLines={1} style={styles.headerSubtitle}>{subtitle}</AppText> : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAwareScrollViewCompat
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
        contentContainerStyle={[
          styles.pageContent,
          {
            paddingBottom: 24 + insets.bottom,
            paddingTop: webInset ? 67 : 10,
          },
          webInset ? { paddingBottom: 34 } : null,
        ]}
      >
        {children}
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

export function BackButton() {
  const { colors, t, isRTL } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('previous')}
      testID="back-button"
      onPress={() => router.back()}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, opacity: pressed ? 0.68 : 1 }]}
    >
      <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useApp();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { isRTL } = useApp();
  return (
    <View style={[styles.sectionTitleRow, isRTL && styles.rowReverse]}>
      <AppText style={styles.sectionTitle}>{children}</AppText>
      {right}
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  icon,
  kind = 'primary',
  disabled = false,
  testID,
  style,
}: {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  kind?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isRTL } = useApp();
  const backgrounds = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: 'transparent',
    danger: colors.destructive,
  };
  const foregrounds = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    outline: colors.primary,
    danger: colors.destructiveForeground,
  };
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: backgrounds[kind], borderColor: colors.border, opacity: disabled ? 0.45 : pressed ? 0.76 : 1 },
        kind === 'outline' ? styles.outline : null,
        isRTL ? styles.rowReverse : null,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={foregrounds[kind]} /> : null}
      <Text style={[styles.actionText, { color: foregrounds[kind] }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  testID,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }, style]}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  technical = false,
  ...props
}: TextInputProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
  technical?: boolean;
}) {
  const { colors, isRTL } = useApp();
  return (
    <View style={styles.inputWrap}>
      <AppText muted style={styles.inputLabel}>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.primary}
        autoCorrect={false}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: colors.input,
            textAlign: !technical && isRTL && !props.multiline ? 'right' : 'left',
            writingDirection: technical ? 'ltr' : isRTL ? 'rtl' : 'ltr',
          },
        ]}
        {...props}
      />
    </View>
  );
}

export function ChoiceRow<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T, event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
}) {
  const { colors, isRTL } = useApp();
  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.choiceRow, isRTL && styles.rowReverse]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={(event) => onChange(option.value, event)}
            style={[
              styles.choice,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.choiceText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ResultCard({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const { colors, t, preferences } = useApp();
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await Clipboard.setStringAsync(value);
    if (preferences.haptics) void Haptics.selectionAsync();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultContent}>
        <AppText muted style={styles.resultLabel}>{label}</AppText>
        <AppText
          accessibilityLabel={`${label}: ${value}`}
          selectable
          mono={mono}
          style={styles.resultValue}
        >
          {value}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('copy')} ${label}`}
        onPress={onCopy}
        style={styles.copyButton}
      >
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={17} color={copied ? colors.success : colors.primary} />
        <AppText style={[styles.copyText, { color: copied ? colors.success : colors.primary }]}>
          {copied ? t('copied') : t('copy')}
        </AppText>
      </Pressable>
    </Card>
  );
}

export function Message({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const { colors } = useApp();
  const color = tone === 'error' ? colors.destructive : tone === 'success' ? colors.success : colors.primary;
  return (
    <View accessibilityRole={tone === 'error' ? 'alert' : 'text'} style={[styles.message, { backgroundColor: tone === 'error' ? colors.accent : colors.secondary }]}>
      <Ionicons name={tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={18} color={color} />
      <AppText style={[styles.messageText, { color }]}>{children}</AppText>
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  const { colors } = useApp();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <AppText muted>{label}</AppText>
    </View>
  );
}

export function Divider() {
  const { colors } = useApp();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export function Row({
  children,
  style,
  align = 'center',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  align?: 'center' | 'top';
}) {
  const { isRTL } = useApp();
  return (
    <View style={[styles.row, isRTL && styles.rowReverse, align === 'top' ? styles.alignTop : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageHeader: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageContent: { paddingHorizontal: 20, paddingTop: 10, gap: 16, flexGrow: 1 },
  headerTitle: { flex: 1, alignItems: 'center' },
  headerHeading: { fontSize: 17, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  headerSubtitle: { fontSize: 11, marginTop: 1, textAlign: 'center' },
  headerSpacer: { width: 42 },
  text: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), writingDirection: 'ltr', textAlign: 'left' },
  iconButton: { minWidth: 42, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1 },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 12 },
  sectionTitleRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  actionButton: { minHeight: 50, paddingHorizontal: 16, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1 },
  actionText: { fontSize: 14, fontWeight: '700' },
  outline: { borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowReverse: { flexDirection: 'row-reverse' },
  alignTop: { alignItems: 'flex-start' },
  inputWrap: { gap: 7 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16, fontFamily: 'Inter_500Medium' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 42, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: 13, fontWeight: '600' },
  resultCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 85 },
  resultContent: { flex: 1, gap: 6 },
  resultLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  resultValue: { fontSize: 17, lineHeight: 24, fontWeight: '600', flexShrink: 1 },
  copyButton: { minHeight: 42, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  copyText: { fontSize: 12, fontWeight: '600' },
  message: { minHeight: 46, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  messageText: { flex: 1, fontSize: 13, lineHeight: 19 },
  loading: { alignItems: 'center', gap: 10, padding: 24 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
});
