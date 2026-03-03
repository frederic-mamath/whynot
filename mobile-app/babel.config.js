module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "react-native-unistyles/plugin",
        {
          // `app/` contains Expo Router screens with StyleSheet.create — must be root
          root: "app",
          // Also process `src/` component files that import react-native-unistyles
          autoProcessImports: ["react-native-unistyles"],
        },
      ],
    ],
  };
};
