// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 35_000,        // meer ruimte bij parallelle server-load
  expect: { timeout: 10_000 },
  workers: 4,             // max 4 parallel om server niet te overbelasten
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5000',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'phone-portrait',
      use: { ...devices['Pixel 5'] },          // 393×851
    },
    {
      name: 'phone-landscape',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 851, height: 393 },
      },
    },
    {
      name: 'tablet-portrait',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'tablet-landscape',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 1024, height: 768 },
      },
    },
  ],
  webServer: {
    command: 'npx serve . -p 5000 --no-clipboard',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
