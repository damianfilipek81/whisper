module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-worklets-core/plugin'],
      ['react-native-unistyles/plugin', {
        root: __dirname,
      }],
      // Reanimated plugin should be listed last
      ['react-native-reanimated/plugin'],
    ],
  };
};
