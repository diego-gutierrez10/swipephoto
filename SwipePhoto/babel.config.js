module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
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
        },
      },
    ],
  ],
};
