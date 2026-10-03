import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Preserved research output is not project source: legacy CommonJS tooling
      // plus large generated JSON. Never linted, never modified.
      'research/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Test doubles are intentionally synchronous stand-ins for async engines.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Tooling config is not part of the typechecked project (it pulls in
    // bundler typings); lint it without type information.
    files: ['**/*.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
);
