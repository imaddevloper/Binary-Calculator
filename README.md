# Binary Calculator

<p align="center">
  <strong>A practical number-system, binary arithmetic, and IP address toolkit for Android.</strong>
  <br />
  Convert values, work through binary operations, inspect IPv4/IPv6 addresses, and scan IP addresses from images — all in one app.
</p>

<p align="center">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-58-000020?logo=expo&logoColor=white" />
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.88-20232A?logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white" />
</p>

## Overview

**Binary Calculator** is an Android-first application built with Expo, React Native, and TypeScript. It brings together base conversion, binary calculations, IP address analysis, learning tools, and an image-based IP scanner in a focused interface.

The app is designed for students, networking learners, and anyone who regularly works with binary, decimal, hexadecimal, IPv4, or IPv6 values. Its interface supports **English and Arabic**, including right-to-left layout, as well as **light and dark themes**.

## Features

### Number systems and conversion
- Convert integer values between **Binary (base 2)**, **Decimal (base 10)**, and **Hexadecimal (base 16)**.
- View the equivalent value in all three bases.
- Handle signed integer input and common `0b` / `0x` prefixes.
- See place-value explanations and step-by-step conversion breakdowns.

### Binary calculator
- Perform binary **addition, subtraction, multiplication, and division**.
- Display the result in binary and its decimal equivalent.
- Show calculation steps, including carries, partial products, quotient, and remainder.
- Handle negative subtraction results and division-by-zero validation.

### IPv4 and IPv6 analysis
- Validate IPv4 and IPv6 address input.
- Inspect address details and classifications.
- View binary and hexadecimal representations where supported.
- Use the analyzer to understand address structure and common network-address categories.

### IP scanner (OCR)
- Capture an image with the device camera or choose one from the photo library.
- Recognize text on-device using **Google ML Kit Text Recognition**.
- Detect IPv4 and IPv6 address candidates in recognized text.
- Review detected candidates before using them in the app.

> **Native build required:** the ML Kit scanner uses a native React Native module. It will not work in Expo Go. Build and install a development or standalone Android app that includes the native module.

### Learning and practice
- Browse learning material for number systems and IP concepts.
- Practice with interactive challenges.
- Track challenge progress.

### Personalization and productivity
- English and Arabic interface with RTL support.
- Light and dark appearance themes, with an animated theme transition.
- Recent activity history saved on the device.
- Adjustable calculator preferences, including the default input base.
- Offline-friendly core calculator and analysis tools.

## Privacy

OCR recognition is performed on the device through Google ML Kit. The scanner does not need to upload the selected image to a remote OCR service. Camera and photo-library access are requested when the related feature is used.

The app stores preferences, learning progress, and calculation history locally on the device.

## Technology

| Area | Technology |
|---|---|
| Mobile framework | Expo SDK 58 |
| UI | React Native 0.88 |
| Language | TypeScript |
| Navigation | Expo Router |
| OCR | `@react-native-ml-kit/text-recognition` |
| Camera | `expo-camera` |
| Image selection | `expo-image-picker` |
| Local persistence | AsyncStorage |
| Package manager | pnpm workspaces |

## Project structure

```text
Binary-Calculator/
├── artifacts/
│   ├── mobile/             # Expo mobile application
│   │   ├── app/             # Routes and navigation
│   │   ├── components/      # Reusable UI and screens
│   │   ├── src/
│   │   │   ├── core/        # Conversion, arithmetic and IP logic
│   │   │   ├── i18n/        # English and Arabic translations
│   │   │   └── state/       # App state and preferences
│   │   └── tests/           # Unit tests
│   └── api-server/          # Workspace API service
├── lib/                     # Shared workspace packages
├── scripts/                 # Project scripts
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## Getting started

### Requirements

- Node.js version compatible with the project's Expo SDK.
- pnpm (use the version specified by the repository's package-manager configuration, if present).
- Android Studio and Android SDK for local Android builds.
- A compatible JDK for the Android Gradle project.

### Install dependencies

Run these commands from the repository root:

```bash
pnpm install
```

### Start the Expo development server

```bash
cd artifacts/mobile
pnpm dev
```

Open the project on a supported development build or emulator. **Expo Go is not sufficient for testing the native ML Kit scanner.**

## Build for Android

Generate the native Android project:

```bash
cd artifacts/mobile
pnpm prebuild:android
```

Run on a connected Android device or emulator:

```bash
pnpm android
```

To assemble a release APK locally:

```bash
cd android
./gradlew assembleRelease
```

The APK is normally generated at:

```text
artifacts/mobile/android/app/build/outputs/apk/release/app-release.apk
```

A properly configured signing key is required before distributing a production release. Keep signing keys and passwords out of the repository.

## Tests and type checking

From the mobile app directory:

```bash
cd artifacts/mobile
pnpm test:unit
pnpm typecheck
```

The unit-test command runs the project's calculation, IP validation, and related core-logic tests. A successful unit-test or TypeScript run does not replace testing the native camera and OCR features on a physical Android device.

## Language and appearance

- **Languages:** English and Arabic.
- **Layout:** left-to-right and right-to-left support.
- **Themes:** light, dark, and system-aware appearance options.

## Project status

The repository contains the Expo application source and native OCR integration. Build availability and feature behavior should be confirmed from the latest CI run and on-device testing; this README does not imply that an APK has already passed those checks.

## Contributing

Contributions and bug reports are welcome. When reporting an issue, include:

1. Device model and Android version.
2. Steps to reproduce the issue.
3. Expected and actual behavior.
4. Relevant error output or screenshots (remove private information).

Please keep changes focused and avoid committing generated build output, local environment files, signing credentials, or dependency folders.

## License

No license is currently specified in this repository. Until a license is added, the source code should not be assumed to be available for redistribution or reuse.
