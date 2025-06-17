const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable support for additional file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

// Optional: Add support for absolute imports
config.resolver.alias = {
  '@components': './src/components',
  '@screens': './src/screens',
  '@utils': './src/utils',
  '@store': './src/store',
  '@hooks': './src/hooks',
  '@assets': './src/assets',
  '@navigation': './src/navigation',
  '@types': './src/types',
  '@services': './src/services',
  '@constants': './src/constants',
  '@features': './src/features',
};

module.exports = config;
