import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.runtime/**',
      'dist/**',
      'dist-map/**',
      'data/geography/source-cache/**',
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
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
    files: [
      'scripts/import-central-italy.mjs',
      'scripts/verify-map.mjs',
      'scripts/build-settlement-atlas.mjs',
      'scripts/import-italy-terrain.mjs',
      'scripts/import-world-geography.mjs',
      'scripts/import-regional-ecology.mjs',
      'scripts/verify-regional-terrain.mjs',
      'scripts/validate-regional-ecology.mjs',
      'scripts/verify-world-map.mjs',
      'scripts/validate-world-geography.mjs',
      'scripts/verify-italy-map.mjs',
      'scripts/validate-italy-geography.mjs',
      'scripts/audit-campaign-geography.mjs',
    ],
    languageOptions: {
      globals: { fetch: 'readonly', window: 'readonly', document: 'readonly' },
    },
  },
  {
    files: ['map/**/*.js'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        atob: 'readonly',
        innerWidth: 'readonly',
        innerHeight: 'readonly',
        devicePixelRatio: 'readonly',
        addEventListener: 'readonly',
        requestAnimationFrame: 'readonly',
        performance: 'readonly',
      },
    },
  },
  {
    // Tooling config is not part of the typechecked project (it pulls in
    // bundler typings); lint it without type information.
    files: ['**/*.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
);
