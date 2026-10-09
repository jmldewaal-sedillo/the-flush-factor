// Laden: geen fouten, geen 404's, niets van buiten, en een lichte eerste laadbeurt.
const { test, expect } = require('@playwright/test');
const { openGame, expectNoProblems, until } = require('./helpers');

test('laadt zonder console-fouten, 404\'s of externe verzoeken', async ({ page }) => {
  const problems = await openGame(page);
  await page.locator('#flush-btn').click();
  await until(page, () => window.__game.three.hasEnvironment());
  expectNoProblems(problems);
  expect(await page.evaluate(() => window.__game.three.frames())).toBeGreaterThan(2);
});

test('toilet gebruikt de eigen textures van het model', async ({ page }) => {
  await openGame(page);
  expect(await page.evaluate(() => window.__game.three.toiletOwnTextures())).toBe(true);
});

test('eerste laadbeurt blijft onder 4 MB', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'één keer meten is genoeg');
  let bytes = 0;
  page.on('response', async r => { try { bytes += (await r.body()).length; } catch { /* omleiding of afgebroken */ } });
  await openGame(page);
  await until(page, () => window.__game.three.hasEnvironment());
  info.annotations.push({ type: 'eerste laadbeurt', description: `${(bytes / 1e6).toFixed(2)} MB` });
  expect(bytes).toBeLessThan(4_000_000);
});

test('zonder WebGL verschijnt een nette melding', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/.test(type) ? null : orig.call(this, type, ...rest); };
  });
  await page.goto('./?clogs=off');
  await expect(page.locator('#fatal')).toBeVisible();
  await expect(page.locator('#fatal-title')).toHaveText('WebGL niet beschikbaar');
  await expect(page.locator('#loading')).toBeHidden();
});

test('spoelen geeft punten en bewaart de stand', async ({ page }) => {
  await openGame(page);
  await page.locator('#flush-btn').click();
  await expect(page.locator('#score-value')).toHaveText('10');
  await page.reload();
  await until(page, () => window.__game?.ready);
  await expect(page.locator('#score-value')).toHaveText('10');
});
