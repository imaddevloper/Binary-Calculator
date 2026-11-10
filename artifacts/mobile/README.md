# Binary Calculator

An Android-first, offline-capable learning calculator for binary, decimal, hexadecimal, exact binary arithmetic, and IPv4/IPv6 address analysis. The supplied app icon is used without changing its artwork.

## Current implementation

- Base 2, 10, and 16 integer conversion using `BigInt`; signs are supported and `0b` / `0x` prefixes are accepted for binary and hexadecimal inputs. Inputs are capped at 256 characters. Fractions and grouping separators are not supported.
- Binary addition, subtraction, multiplication, and integer division with quotient and remainder. Arithmetic operands are unsigned; subtraction displays a signed mathematical result rather than silently wrapping.
- A unified IP analyzer with manual IPv4, IPv6, and Auto Detect selection. IPv4 results include all four octets in decimal, binary, and hexadecimal, plus 32-bit forms and address classification. IPv6 results include eight expanded groups, each in decimal, binary, and hexadecimal, plus 128-bit forms, address scope, and conversion steps.
- Thirteen short English and Arabic lessons, deterministic practice questions, locally saved challenge scores, preferences, and up to 100 recent calculations.
- Theme and language preferences persist on the device. Arabic screens use right-aligned text and reversed directional controls while keeping technical strings left-to-right.
- An in-app six-second branded intro is shown on native launch. The native splash uses the supplied image.
- The scanner supports camera capture and system photo picking, then runs on-device Google ML Kit OCR for IPv4 and IPv6 candidates. The user must review/edit a detected address before analysis. Camera permission is requested only when the camera is opened; gallery selection uses the system photo picker without broad storage access. Images and recognized text remain on-device.

## Native OCR requirement

The OCR engine is a native module and is not included in Expo Go. Install dependencies and rebuild the Android/iOS development or release app after these changes. See [`OCR_SETUP.md`](./OCR_SETUP.md) for the required commands. The web preview intentionally reports OCR as unavailable.

## Tech and local development

- Expo SDK: `~58.0.16` (the generated mobile scaffold baseline)
- React Native: `0.88.1`
- TypeScript: strict project configuration
- Local state: AsyncStorage, versioned under `binary-calculator-state-v1`
- No login, server, or network request is needed for calculations, lessons, or history.

Install workspace dependencies from the repository root with `pnpm install`. Start the Expo development server from this package with `pnpm dev`, or run `pnpm android` when an Android SDK and a connected device/emulator are configured.

## Checks

Run the pure calculation tests:

```sh
pnpm --filter @workspace/mobile test:unit
```

Check the Expo dependency versions:

```sh
cd artifacts/mobile
pnpm exec expo install --check
pnpm dlx expo-doctor@latest
```

## Android development and release builds

This project is configured for Android, but no APK or AAB is included or claimed as built.

For a local Android development build, use a machine with the Android SDK, Java, and an emulator or device configured:

```sh
cd artifacts/mobile
pnpm exec expo run:android
```

For a locally generated release APK or Play Store bundle, generate the native Android project and use the Android Gradle wrapper with a configured Android SDK:

```sh
cd artifacts/mobile
pnpm exec expo prebuild --platform android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

The output is written under `android/app/build/outputs/`. A release build must be signed with the app owner's Android signing configuration before distribution. These commands have not been run in this workspace.
