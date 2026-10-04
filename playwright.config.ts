import { defineConfig, devices } from '@playwright/test';

import { PRIMITIVES_ENV } from './src/config';

const PORT = 4321;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: '.e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: '.e2e/report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // The production build registers the offline service worker (PR-63), which would download the
    // whole precache in every test's fresh context and answer requests `page.route` cannot see.
    // tests/e2e/offline.spec.ts allows it.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'chromium-phone', use: { ...devices['Pixel 7'] } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    // --ignore-lock keeps `astro preview` in the foreground: under an AI agent (AI_AGENT,
    // CLAUDECODE…) Astro 7 otherwise detaches it, and Playwright sees the process exit early.
    command: 'npm run build && npm run preview -- --ignore-lock',
    url: `http://localhost:${PORT}`,
    // Never reuse: another project's server on this port would be tested instead.
    reuseExistingServer: false,
    timeout: 120_000,
    // The build tested includes the dev-only primitives page (src/dev/primitives.astro).
    env: { [PRIMITIVES_ENV]: '1' },
  },
});
