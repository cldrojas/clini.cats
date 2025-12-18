import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import next from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'scripts/**/*.{ts,tsx}',
      '*.{ts,tsx,js}'
    ],
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/public/**'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        document: 'readonly',
        window: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        HTMLInputElement: 'readonly',
        NodeJS: 'readonly',
        Response: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        btoa: 'readonly',
        self: 'readonly',
        importScripts: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        WebAssembly: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      '@next/next': next
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // TypeScript covers this
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General JavaScript/TypeScript rules
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-console': ["error", {
        "allow": [
          "warn",
          "error"
        ]
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'off', // TypeScript handles this

      // Next.js specific rules
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
