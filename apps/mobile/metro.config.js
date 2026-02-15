const { getDefaultConfig } = require('expo/metro-config');

// SDK 52 auto-detects monorepo root, watchFolders, nodeModulesPaths,
// and platform-specific condition names (react-native for iOS/Android, browser for web)
const config = getDefaultConfig(__dirname);

module.exports = config;
