// eslint.config.js
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports'
import eslintPluginTs from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'storybook-static/',
      'vite.config.ts',
      'src/setupTests.ts',
      'src/*/*/stories.tsx'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      'unused-imports': eslintPluginUnusedImports,
      prettier: eslintPluginPrettier
    },
    rules: {
      'prettier/prettier': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  {
    files: ['postcss.config.js', 'tailwind.config.js', 'remove-module.js', 'create-module.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { require: true, module: true, __dirname: true }
    },
    linterOptions: {
      noInlineConfig: false
    }
  }
]
