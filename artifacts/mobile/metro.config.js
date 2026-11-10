const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use Expo's on-demand filesystem for pnpm workspaces.
// Do not crawl the entire monorepo from the Android device.
config.watchFolders = [];

module.exports = config;
