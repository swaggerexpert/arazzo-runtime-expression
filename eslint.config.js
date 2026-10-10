import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: ['es/', 'cjs/', 'types/', 'src/grammar.js'],
  },

  // Base recommended config
  eslint.configs.recommended,

  // Source, test and script files configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },

  // CommonJS files configuration
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },

  // Test files configuration
  {
    files: ['test/**/*.js', 'test/**/*.mjs'],
    languageOptions: {
      globals: globals.mocha,
    },
  },

  // Prettier must be last to override other configs
  eslintPluginPrettierRecommended,
];
