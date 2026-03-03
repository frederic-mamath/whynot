module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "react-native-unistyles/plugin",
        {
          // `src/` contains components with StyleSheet.create — processed wholesale
          root: "src",
          // `app/` screens import 'react-native-unistyles' directly — processed via autoProcessImports
          autoProcessImports: ["react-native-unistyles"],
          // Log which files are detected by the plugin (remove once working)
          debug: true,
        },
      ],
    ],
  };
};
