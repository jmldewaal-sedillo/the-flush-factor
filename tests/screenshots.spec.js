// Maakt per formaat screenshots in tests/screenshots/<formaat>/ om met het oog na te kijken.
// Faalt alleen als een toestand niet bereikt wordt; het oordeel over het beeld is mensenwerk.
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, setView, until } = require('./helpers');

const DRESSED = {
  score: 4200, level: 5, purchased: ['deco-mirror', 'deco-plant', 'deco-shelf', 'deco-painting', 'deco-cabinet', 'deco-poster'],
  decor: { wallBack: 'deco-mirror', wallBackHigh: 'deco-shelf', wallLeft: 'deco-painting', wallLeftLow: 'deco-cabinet', wallRight: 'deco-poster', floorLeft: 'deco-plant' },
  bucketItems: ['duck', 'teddy', 'sock', 'toy-car', 'phone', 'fish', 'banana', 'brick', 'key', 'toilet-paper'].map(id => ({ id, liters: 0.8 })),
};

test('screenshots van alle belangrijke toestanden', async ({ page }, info) => {
  test.setTimeout(480_000);
  const dir = path.join(__dirname, 'screenshots', info.project.name);
  fs.mkdirSync(dir, { recursive: true });
  const shot = name => page.screenshot({ path: path.join(dir, `${name}.png`) });
  const vp = page.viewportSize();
  const safe = vp.width > vp.height ? '0,0,21,47' : '47,0,34,0';

  await openGame(page, { quality: 'medium', pixelRatio: 0.75, query: `safe=${safe}` });
  await until(page, () => window.__game.three.hasEnvironment());
  await shot('01-start-notch');

  await page.evaluate(() => window.__game.forceClog('duck'));
  await until(page, () => window.__game.three.propInBowl() && window.__game.three.cameraIdle() && window.__game.three.bubbles() > 0);
  await page.evaluate(() => window.__game.setWater(70));
  await until(page, () => window.__game.three.waterLevel() > 0.6);
  await shot('02-verstopt');
  await page.evaluate(() => window.__game.setWater(99.8));
  await until(page, () => window.__game.three.puddle());
  await page.evaluate(() => { window.__game.setWater(5); window.__game.useTool('plunger'); });
  await until(page, () => window.__game.three.bucketItemCount() === 1 && window.__game.three.cameraIdle());
  await shot('03-na-overlopen-plas');

  await page.locator('#btn-shop').click();
  await shot('04-winkel-dicht');
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  await page.locator('.shop-category[data-cat="buckets"]').scrollIntoViewIfNeeded();
  await shot('05-winkel-open');

  // aangeklede ruimte in alle camerastanden
  await page.evaluate(([key, data]) => localStorage.setItem(key, JSON.stringify({ version: 2, ...data })), ['flushfactor_v1', DRESSED]);
  await page.reload();
  await until(page, () => window.__game?.ready && window.__game.three.hasEnvironment());
  let i = 6;
  for (const id of ['toilet', 'overview', 'wallBack', 'wallLeft', 'wallRight', 'bucket']) {
    await setView(page, id);
    await shot(`${String(i++).padStart(2, '0')}-stand-${id}`);
  }
});
