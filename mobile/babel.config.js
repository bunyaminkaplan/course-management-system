module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@hooks": "./src/hooks",
            "@store": "./src/store",
            "@theme": "./src/theme",
            "@utils": "./src/utils",
            "@types": "./src/types",
            "@constants": "./src/constants",
            "@assets": "./src/assets",
            "@config": "./src/config",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
