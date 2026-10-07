// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['server/**/*.cjs', 'scripts/**/*.cjs'],
    languageOptions: { globals: { __dirname: 'readonly', Buffer: 'readonly' } },
  },
  {
    ignores: ['dist/*'],
  },
]);
