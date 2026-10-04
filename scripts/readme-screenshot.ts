/**
 * Takes the README screenshot of Sheet 01 (`npm run screenshot`): serves the built `dist/` with
 * `astro preview` on its own port, opens `/` in Playwright's Chromium at 1440 × 900 on paper with
 * reduced motion (so every plotting animation is at its final state), and writes
 * docs/sheet-01.png. Run `npm run build` first.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = fileURLToPath(new URL('../docs/sheet-01.png', import.meta.url));
// Not 4321: the dev server or another project may hold it, and its page would be captured instead.
const PORT = 4329;
const BASE = `http://localhost:${PORT}`;

if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
  throw new Error('No dist/ — run `npm run build` first.');
}

// --ignore-lock keeps `astro preview` in the foreground under an AI agent (docs/REPO-MAP.md).
// The binary itself, not `npx`: killing npx can leave the server it started running.
const ASTRO = fileURLToPath(new URL('../node_modules/.bin/astro', import.meta.url));
const server = spawn(ASTRO, ['preview', '--port', String(PORT), '--ignore-lock'], {
  cwd: ROOT,
  stdio: 'ignore',
});
let exited = false;
server.on('exit', () => (exited = true));

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (exited) throw new Error(`astro preview exited — is port ${PORT} in use?`);
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`astro preview did not answer on ${BASE}`);
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUT });
    console.log(`wrote ${OUT}`);
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
