// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// De tests draaien onder een submap, net als op GitHub Pages; absolute paden vallen dan meteen op.
// Ze hebben een eigen poort (tests/server.js), los van `npm run serve`.
const { PORT, PATH, BASE } = require('./tests/server');
const mobile = { ...devices['Pixel 5'], serviceWorkers: 'block' };

module.exports = defineConfig({
  testDir: './tests',
  // De CI-runner heeft twee kernen en geen GPU: minder tegelijk en ruimere limieten.
  timeout: process.env.CI ? 240_000 : 90_000,
  expect: { timeout: process.env.CI ? 30_000 : 15_000 },
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: BASE, screenshot: 'only-on-failure', video: 'off' },
  projects: [
    { name: 'phone-portrait',   use: { ...mobile, viewport: { width: 393, height: 851 } } },
    { name: 'phone-landscape',  use: { ...mobile, viewport: { width: 851, height: 393 } } },
    { name: 'tablet-portrait',  use: { ...mobile, viewport: { width: 768, height: 1024 } } },
    { name: 'tablet-landscape', use: { ...mobile, viewport: { width: 1024, height: 768 } } },
  ],
  webServer: {
    command: `node tools/serve.mjs ${PORT} ${PATH} --strict`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
