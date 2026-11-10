import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ActionButton, AppText, Card, Input, Message, Page } from '@/components/ui';
import { extractIPCandidates } from '@/src/core/calculations';
import { useApp } from '@/src/state/AppProvider';
import type { TranslationKey } from '@/src/i18n/strings';

type Candidate = ReturnType<typeof extractIPCandidates>[number];

export default function ScannerScreen() {
  const router = useRouter();
  const { t, colors } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const recognize = async (uri: string) => {
    if (Platform.OS === 'web') { setError('ocrUnavailable'); return; }
    setProcessing(true);
    setError('');
    setCandidates([]);
    setAddress('');
    try {
      const textRecognition = await import('@react-native-ml-kit/text-recognition');
      const result = await textRecognition.default.recognize(uri);
      const found = extractIPCandidates(result.text ?? '');
      setCandidates(found);
      if (found.length === 1) setAddress(found[0].address);
      if (found.length === 0) setError('ocrNoAddress');
    } catch {
      setError('ocrFailed');
    } finally {
      setProcessing(false);
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setCameraOpen(false);
        await recognize(photo.uri);
      }
    } catch {
      setError('cameraUnavailable');
      setCameraOpen(false);
    }
  };

  const openCamera = async () => {
    if (Platform.OS === 'web') { setError('cameraUnavailable'); return; }
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) { setError('cameraDenied'); return; }
      }
      setError('');
      setCameraOpen(true);
    } catch {
      setError('cameraUnavailable');
    }
  };

  const chooseImage = async () => {
    try {
      // Android's system photo picker and iOS' limited picker are used; no broad storage permission is requested.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setCameraOpen(false);
        await recognize(uri);
      }
    } catch {
      setError('galleryUnavailable');
    }
  };

  const analyze = () => {
    const selected = address.trim();
    if (!selected) { setError('validationEmpty'); return; }
    const candidate = candidates.find((item) => item.address === selected);
    const version = candidate?.version ?? (selected.includes(':') ? 'ipv6' : 'ipv4');
    setError('');
    router.push({ pathname: '/ipv4', params: { address: selected, version } });
  };

  const reset = () => {
    setImageUri(null); setAddress(''); setCandidates([]); setError(''); setProcessing(false); setCameraOpen(false);
  };

  return (
    <Page title={t('scannerTitle')} subtitle={t('scannerInstruction')}>
      {cameraOpen && permission?.granted && Platform.OS !== 'web' ? (
        <View style={styles.cameraFrame}>
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
          <View pointerEvents="none" style={styles.frameGuide} />
          <View style={styles.cameraControls}>
            <ActionButton title={t('captureAndScan')} icon="camera-outline" onPress={takePhoto} />
            <ActionButton title={t('cancel')} kind="secondary" onPress={() => setCameraOpen(false)} />
          </View>
        </View>
      ) : (
        <Card style={styles.scanCard}>
          {imageUri ? <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.previewImage} /> : (
            <View style={[styles.scanIllustration, { backgroundColor: colors.secondary }]}>
              <Ionicons name="scan-outline" size={42} color={colors.primary} />
              <AppText mono style={styles.sampleText}>192.168.1.10</AppText>
              <AppText muted style={styles.sampleTextSmall}>2001:db8::1</AppText>
            </View>
          )}
          <AppText style={styles.scanPrompt}>{imageUri ? t('imageSelected') : t('scannerInstruction')}</AppText>
          <AppText muted style={styles.scanNote}>{t('ocrPrivacy')}</AppText>
          {processing ? <View style={styles.processing}><ActivityIndicator color={colors.primary} /><AppText muted>{t('ocrProcessing')}</AppText></View> : null}
          {Platform.OS === 'web' ? <Message tone="info">{t('ocrUnavailable')}</Message> : null}
          {permission?.status === 'denied' && !permission.canAskAgain ? <><Message>{t('cameraDenied')}</Message><ActionButton title={t('settings')} icon="settings-outline" kind="outline" onPress={() => Linking.openSettings()} /></> : null}
          <View style={styles.actions}>
            <ActionButton title={t('camera')} icon="camera-outline" onPress={openCamera} style={styles.grow} />
            <ActionButton title={t('gallery')} icon="image-outline" kind="secondary" onPress={chooseImage} style={styles.grow} />
          </View>
        </Card>
      )}

      {!cameraOpen ? (
        <>
          {candidates.length > 0 ? (
            <Card style={styles.candidateCard}>
              <AppText style={styles.sectionTitle}>{t('ocrCandidates')}</AppText>
              <AppText muted style={styles.scanNote}>{t('ocrSelectCandidate')}</AppText>
              {candidates.map((candidate) => {
                const selected = address === candidate.address;
                return <Pressable key={`${candidate.version}-${candidate.address}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { setAddress(candidate.address); setError(''); }} style={[styles.candidate, { backgroundColor: selected ? colors.accent : colors.secondary, borderColor: selected ? colors.primary : colors.border }]}>
                  <AppText mono style={styles.candidateAddress}>{candidate.address}</AppText>
                  <AppText muted style={styles.candidateVersion}>{candidate.version.toUpperCase()}</AppText>
                </Pressable>;
              })}
            </Card>
          ) : null}
          <Card>
            <Input label={t('reviewAddress')} value={address} onChangeText={(value) => { setAddress(value); setError(''); }} placeholder="192.168.1.10 or 2001:db8::1" keyboardType="default" testID="scanner-address-input" technical />
            {error ? <Message>{t(error as TranslationKey)}</Message> : null}
            <ActionButton title={t('analyzeAddress')} icon="analytics-outline" onPress={analyze} disabled={processing || !address.trim()} />
            {imageUri ? <ActionButton title={t('scanAnother')} icon="refresh-outline" kind="outline" onPress={reset} /> : null}
          </Card>
          <AppText muted style={styles.privacyNote}>{t('savedLocally')}</AppText>
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  scanCard: { gap: 12 },
  scanIllustration: { minHeight: 155, borderRadius: 16, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', gap: 5 },
  sampleText: { fontSize: 22, fontWeight: '700' },
  sampleTextSmall: { fontSize: 13 },
  previewImage: { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#111014' },
  scanPrompt: { fontWeight: '700' },
  scanNote: { fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
  privacyNote: { fontSize: 12, textAlign: 'center' },
  cameraFrame: { height: 430, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111014' },
  frameGuide: { position: 'absolute', left: '9%', right: '9%', top: '35%', height: '28%', borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 12, opacity: 0.85 },
  cameraControls: { position: 'absolute', left: 12, right: 12, bottom: 16, flexDirection: 'row', gap: 8 },
  processing: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 },
  candidateCard: { gap: 10 },
  sectionTitle: { fontWeight: '700', fontSize: 15 },
  candidate: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  candidateAddress: { fontSize: 15, fontWeight: '700', flex: 1 },
  candidateVersion: { fontSize: 11, fontWeight: '700' },
});
