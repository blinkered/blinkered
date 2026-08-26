import tseslint from 'typescript-eslint'

export default [
  { ignores: ['**/dist/**', '**/dist-tsc/**', '**/coverage/**', '**/node_modules/**'] },
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
