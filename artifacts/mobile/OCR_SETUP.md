# Native OCR setup

The IP scanner uses on-device Google ML Kit text recognition through `@react-native-ml-kit/text-recognition`.

- OCR runs locally on the device. The scanner does not upload images or recognized text.
- The camera permission is requested only when the user taps **Use camera**.
- Image selection uses the platform photo picker; the app does not request broad storage access.
- A native development/release build is required. Expo Go does not contain this native module.

After pulling these changes, refresh the workspace lockfile and install dependencies:

```sh
pnpm install --no-frozen-lockfile
```

Then create/rebuild the native app (do not rely on a previously installed APK):

```sh
pnpm --filter @workspace/mobile exec expo prebuild --platform android
pnpm --filter @workspace/mobile exec expo run:android
```

For EAS, create a new development or production build after installing dependencies. A Metro reload alone cannot add a native module to an already-built app.
