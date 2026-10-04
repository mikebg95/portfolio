import { defineConfig } from '@playwright/test';

// Projects, web server and helpers arrive with PR-2.
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: '.e2e/test-results',
});
