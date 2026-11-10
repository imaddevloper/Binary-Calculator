# Binary Calculator

An Android-first Expo / React Native application for number-system conversion, binary arithmetic, IPv4/IPv6 analysis, learning challenges, history, and on-device IP OCR scanning.

## Requirements

- Node.js compatible with the Expo SDK used by this project
- pnpm
- Android Studio / Android SDK for local Android builds
- Java version supported by the generated Expo Android project

## Install

Run from the repository root:

```bash
pnpm install
```

## Start the app

```bash
cd artifacts/mobile
pnpm dev
```

## Run on Android

Connect an Android device with USB debugging enabled or start an emulator, then run:

```bash
cd artifacts/mobile
pnpm prebuild:android
pnpm android
```

For a release APK, generate the Android project and run the Gradle release task from `artifacts/mobile/android`:

```bash
cd artifacts/mobile
pnpm prebuild:android
cd android
./gradlew assembleRelease
```

The release APK is generated under `android/app/build/outputs/apk/release/`. Configure signing before distributing a release build.

## OCR scanner

The scanner uses on-device Google ML Kit through `@react-native-ml-kit/text-recognition`. It requires a native development or release build; Expo Go is not sufficient. Camera permission is requested only when the user opens the camera. Gallery selection uses the system photo picker without broad storage permission. Images and recognized text are processed locally.

See `artifacts/mobile/OCR_SETUP.md` for details.

## Tests

Run the calculation and IP/OCR candidate tests:

```bash
cd artifacts/mobile
pnpm test:unit
```

Run the TypeScript check after installing dependencies:

```bash
pnpm typecheck
```

## Project structure

- `artifacts/mobile/` — the Expo Android/iOS application source
- `artifacts/api-server/` — optional API service source
- `lib/` — shared API and database packages retained in the workspace
- `scripts/` — repository maintenance scripts

The application does not require a hosted runtime or deployment service.
