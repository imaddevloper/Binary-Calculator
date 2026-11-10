import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ActionButton, AppText, Card, IconButton, Page } from '@/components/ui';
import { useApp } from '@/src/state/AppProvider';

export default function HistoryScreen() {
  const { t, language, colors, history, clearHistory, removeHistory } = useApp();

  const confirmClear = () => {
    Alert.alert(t('clearHistory'), t('clearHistoryConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: clearHistory },
    ]);
  };

  const showDetails = (input: string, result: string) => {
    Alert.alert(input, result, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('copy'), onPress: () => Clipboard.setStringAsync(result) },
    ]);
  };

  return (
    <Page
      title={t('history')}
      subtitle={t('savedLocally')}
      back={false}
    >
      {history.length === 0 ? (
        <Card style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Ionicons name="time-outline" size={25} color={colors.mutedForeground} />
          </View>
          <AppText style={styles.emptyTitle}>{t('history')}</AppText>
          <AppText muted style={styles.emptyText}>{t('noHistory')}</AppText>
        </Card>
      ) : (
        <>
          <View style={styles.clearWrap}>
            <ActionButton title={t('clearHistory')} icon="trash-outline" kind="outline" onPress={confirmClear} />
          </View>
          {history.map((item) => (
            <Card key={item.id} style={styles.entry}>
              <Pressable accessibilityRole="button" onPress={() => showDetails(item.input, item.result)} style={styles.entryContent}>
                <AppText muted style={styles.entryKind}>
                  {item.kind === 'ipv4'
                    ? t('ipv4')
                    : item.kind === 'ipv6'
                      ? t('ipv6')
                      : item.kind === 'arithmetic'
                        ? t('calculator')
                        : t('converter')}
                </AppText>
                <AppText mono style={styles.input}>{item.input}</AppText>
                <AppText mono style={[styles.output, { color: colors.primary }]}>{item.result}</AppText>
                <AppText muted style={styles.date}>{new Date(item.createdAt).toLocaleString(language === 'ar' ? 'ar' : 'en')}</AppText>
              </Pressable>
              <IconButton
                icon="trash-outline"
                label={t('delete')}
                onPress={() => {
                  Alert.alert(t('delete'), item.input, [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('delete'), style: 'destructive', onPress: () => removeHistory(item.id) },
                  ]);
                }}
              />
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  clearWrap: { alignItems: 'flex-end' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryContent: { flex: 1, gap: 3 },
  entryKind: { fontSize: 11, fontWeight: '700' },
  input: { fontSize: 14, fontWeight: '600' },
  output: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 10, marginTop: 2 },
  empty: { minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: 7 },
  emptyIcon: { height: 52, width: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center' },
});
