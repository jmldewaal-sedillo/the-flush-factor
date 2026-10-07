// ============================================================
// THE FLUSH FACTOR — smoke.spec.js
// Playwright smoke-tests: basiscontroles voor de PWA.
// ============================================================

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

test.beforeEach(async ({ page }) => {
  // Navigeer met ?preview=off zodat de telefoon-preview-wrapper niet laadt
  await page.goto('/?preview=off');
});

test('pagina laadt zonder JS-fouten', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.waitForLoadState('domcontentloaded');
  // Geef modules tijd om te laden
  await page.waitForTimeout(1500);

  // Filter bekende non-fatale fouten (bijv. service worker in test-context)
  const fatal = errors.filter(e =>
    !e.includes('service worker') &&
    !e.includes('ServiceWorker') &&
    !e.includes('Failed to register') &&
    !e.includes('GLTFLoader') &&         // GLB laadt mogelijk niet in headless
    !e.includes('fetch')
  );
  expect(fatal, `Onverwachte console-fouten: ${fatal.join('\n')}`).toHaveLength(0);
});

test('spoelknop is zichtbaar en klikbaar', async ({ page }) => {
  await page.waitForSelector('#flush-btn', { state: 'visible' });
  const btn = page.locator('#flush-btn');
  await expect(btn).toBeVisible();

  // Klik op spoelknop → score zou moeten veranderen of knop moet reageren
  await btn.click();
  // Knop is zichtbaar gebleven
  await expect(btn).toBeVisible();
});

test('score-weergave is aanwezig', async ({ page }) => {
  await page.waitForSelector('#score-bubble', { state: 'visible' });
  await expect(page.locator('#score-value')).toBeVisible();
  await expect(page.locator('#high-score')).toBeVisible();
});

test('inventarisbalk (gereedschappen) is gevuld', async ({ page }) => {
  await page.waitForSelector('#inventory-bar', { state: 'visible' });
  // Wacht tot tools geladen zijn
  await page.waitForTimeout(1000);
  const tools = page.locator('#inventory-bar .tool-btn');
  const count = await tools.count();
  expect(count, 'Inventarisbalk heeft geen tools').toBeGreaterThan(0);
});

test('menu-knop opent het menu', async ({ page }) => {
  await page.waitForSelector('#btn-menu', { state: 'visible' });
  await page.locator('#btn-menu').click();
  await expect(page.locator('#main-menu')).not.toHaveAttribute('hidden');
  // Sluiten met tweede klik
  await page.locator('#btn-menu').click();
  await expect(page.locator('#main-menu')).toHaveAttribute('hidden', '');
});

test('winkel opent en sluit', async ({ page }) => {
  await page.waitForSelector('#btn-shop', { state: 'visible' });
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('#shop-screen')).toBeHidden();
});

test('screenshot van startscherm', async ({ page }) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // wacht op 3D init of 2D fallback

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshotPath = path.join(SCREENSHOT_DIR, 'startscherm.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });

  // Controleer dat screenshot gemaakt is
  expect(fs.existsSync(screenshotPath)).toBe(true);
});
