// Punt 54: verstopping met voorwerp in de pot, belletjes, waterfases, chaos, overlopen met plas.
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems, watch, seen } = require('./helpers');

const snap = page => page.evaluate(() => window.__game.snapshot());

test('verstopping: waarschuwing, 3D-voorwerp in de pot, belletjes, fases geel-oranje-rood', async ({ page }) => {
  const problems = await openGame(page);
  await expect(page.locator('#clog-warning')).toBeHidden();
  await page.evaluate(() => window.__game.forceClog('toy-car'));

  await expect(page.locator('#clog-warning')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/is-clogged/);
  await until(page, () => window.__game.three.propInBowl());
  expect(await page.evaluate(() => window.__game.three.propId())).toBe('toy-car');
  await until(page, () => window.__game.three.bubbles() > 0);

  const fill = page.locator('#water-bar-fill');
  await expect(fill).toHaveAttribute('data-phase', 'yellow');
  await page.evaluate(() => window.__game.setWater(50));
  await expect(fill).toHaveAttribute('data-phase', 'orange');
  await page.evaluate(() => window.__game.setWater(80));
  await expect(fill).toHaveAttribute('data-phase', 'red');
  await until(page, () => window.__game.three.waterLevel() > 0.6);     // water in de pot stijgt mee

  // spoelen helpt niet
  const before = (await snap(page)).score;
  await page.locator('#flush-btn').click();
  expect((await snap(page)).score).toBe(before);
  expectNoProblems(problems);
});

test('chaos-gereedschap lost niets op: voorwerp blijft zitten, badge verschijnt', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__game.forceClog('fish'));
  await until(page, () => window.__game.three.propInBowl());
  await watch(page, '#fx-layer .chaos-icon');
  await page.evaluate(() => document.querySelector('.tool-btn[data-id="rubber-duck"]').click());
  await seen(page, '#fx-layer .chaos-icon');
  await expect(page.locator('.tool-btn[data-id="rubber-duck"] .tool-badge')).toHaveAttribute('data-kind', 'chaos');
  expect((await snap(page)).clogged).toBe(true);
  expect(await page.evaluate(() => window.__game.three.propInBowl())).toBe(true);
  await expect(page.locator('.tool-btn[data-id="rubber-duck"]')).toHaveClass(/on-cooldown/);
});

test('ontstoppen: banner, bonus, voorwerp belandt als 3D-object in de emmer', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__game.forceClog('brick'));
  await until(page, () => window.__game.three.propInBowl());
  await watch(page, '#unclog-banner.visible');
  await page.evaluate(() => document.querySelector('.tool-btn[data-id="plunger"]').click());
  await seen(page, '#unclog-banner.visible');
  await expect(page.locator('.tool-btn[data-id="plunger"] .tool-badge')).toHaveAttribute('data-kind', 'working');
  await until(page, () => window.__game.three.bucketItemCount() === 1 && !window.__game.three.propInBowl());
  const s = await snap(page);
  expect(s).toMatchObject({ clogged: false, score: 20, bucketItems: ['brick'] });
  await expect(page.locator('#bucket-liters')).toHaveText('1,5 / 20 L');
  await expect(page.locator('#clog-warning')).toBeHidden();
});

test('overlopen: plas op de vloer, puntenaftrek, verstopping blijft', async ({ page }) => {
  await openGame(page, { save: { score: 300, level: 1 } });
  await page.evaluate(() => { window.__game.forceClog('sock'); window.__game.setWater(99.5); });
  await until(page, () => window.__game.snapshot().overflowing);
  await until(page, () => window.__game.three.puddle());
  const s = await snap(page);
  expect(s.score).toBe(270);
  expect(s.clogged).toBe(true);
  // daarna alsnog op te lossen
  await until(page, () => !window.__game.snapshot().overflowing);
  await page.evaluate(() => { window.__game.setWater(10); window.__game.useTool('plunger'); });
  expect((await snap(page)).clogged).toBe(false);
});

test('willekeurige verstoppingen staan aan in het echte spel', async ({ page }) => {
  await openGame(page, { clogs: true });
  expect(await page.evaluate(() => window.__game.snapshot().clogged)).toBe(false);
  // versnel de wachttijd; de verstopping zelf komt uit de gewone spelregels (niet geforceerd)
  await page.evaluate(() => { window.__game.skipTime(20000); Math.random = () => 0; });
  await until(page, () => window.__game.snapshot().clogged);
  await until(page, () => window.__game.three.propInBowl());
});
