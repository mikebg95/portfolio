import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      '.e2e/',
      'test-results/',
      'playwright-report/',
      '.lighthouseci/',
      'design/',
      'docs/',
      '.orchestrator/',
      '.claude/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/service-worker.js'],
    languageOptions: { globals: globals.serviceworker },
  },
);
