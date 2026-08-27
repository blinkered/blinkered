import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      '**/dist/**',
      '**/dist-tsc/**',
      '**/coverage/**',
      '**/node_modules/**',
      // The native shell's Xcode project. `App/public` is a copy of apps/web's build made by
      // `cap sync`, and Pods is vendored Objective-C. Neither is source.
      'apps/mobile/ios/**',
      // Draws the app icon, and imports Playwright, which is deliberately not a dependency of
      // this repo: it runs from a throwaway install. Type-aware linting cannot resolve that.
      'apps/mobile/tools/make-icons.mjs',
    ],
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Root config files live outside the package tsconfigs.
        projectService: {
          allowDefaultProject: ['*.mjs', '*.ts'],
          defaultProject: 'tsconfig.tools.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // Every string spread in this repo is A-Z by construction: a tile holds one letter
      // and the dictionary loader rejects anything outside a-z, so splitting by code point
      // is exact. The rule's `allow` option cannot express that for string literal types.
      '@typescript-eslint/no-misused-spread': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
]
