// Maakt per formaat screenshots in tests/screenshots/<formaat>/ om met het oog na te kijken.
// Faalt alleen als een toestand niet bereikt wordt; het oordeel over het beeld is mensenwerk.
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, setView, until, tapScene, cameraIdle, PROFILE } = require('./helpers');

const DRESSED = {
  profile: PROFILE, score: 4200, level: 5, purchased: ['deco-mirror', 'deco-plant', 'deco-shelf', 'deco-painting', 'deco-cabinet', 'deco-poster'],
  decor: { wallBack: 'deco-mirror', wallBackHigh: 'deco-shelf', wallLeft: 'deco-painting', wallLeftLow: 'deco-cabinet', wallRight: 'deco-poster', floorLeft: 'deco-plant' },
  bucketItems: ['duck', 'teddy', 'sock', 'toy-car', 'phone', 'fish', 'banana', 'brick', 'key', 'toilet-paper'].map(id => ({ id, liters: 0.8 })),
};

test('screenshots van alle belangrijke toestanden', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 1_200_000 : 480_000);
  const dir = path.join(__dirname, 'screenshots', info.project.name);
  fs.mkdirSync(dir, { recursive: true });
  const shot = name => page.screenshot({ path: path.join(dir, `${name}.png`) });
  const vp = page.viewportSize();
  const safe = vp.width > vp.height ? '0,0,21,47' : '47,0,34,0';

  // eerste start: welkomstscherm, daarna het profiel
  await openGame(page, { quality: 'medium', pixelRatio: process.env.CI ? 0.4 : 0.75, query: `safe=${safe}`, firstStart: true });
  await until(page, () => window.__game.three.hasEnvironment());
  await shot('00-welkom');
  await page.locator('#profile-submit').click();
  await shot('01-start-notch');

  // van dichtbij: voet van het toilet en de stortbak (punt 64: geen los hendeltje, één spoelhendel)
  const box = await page.evaluate(() => { const t = window.__game.three; const a = t.project(-0.42, 0.82, 0.05), b = t.project(0.42, -0.02, 0.7); return { x: Math.max(0, a.x), y: Math.max(0, a.y), width: Math.min(innerWidth, b.x) - Math.max(0, a.x), height: Math.min(innerHeight, b.y) - Math.max(0, a.y) }; });
  await page.screenshot({ path: path.join(dir, '01b-toilet-dichtbij.png'), clip: box });

  // tik op het toilet: in de pot kijken; spoelen in vier momenten (punt 65, 68)
  await tapScene(page, await page.evaluate(() => window.__game.three.toiletScreen()));
  await until(page, () => window.__game.three.view() === 'bowl');
  await cameraIdle(page);
  await shot('01c-pot-rust');
  let n = 0;
  for (const p of [0.1, 0.3, 0.5, 0.8]) {
    await page.evaluate(v => window.__game.three.freezeFlush(v), p);
    await until(page, v => Math.abs(window.__game.three.flush().progress - v) < 0.01, p);
    await page.waitForTimeout(150);
    await shot(`01d-spoelen-${++n}`);
  }
  await page.evaluate(() => window.__game.three.freezeFlush(null));
  await page.locator('#btn-back').click();
  await until(page, () => window.__game.three.view() === 'toilet');
  await cameraIdle(page);
  await page.locator('#score-bubble').click();
  await shot('01e-profiel');
  await page.locator('#btn-profile-close').click();

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

// ── Sprint 9: nieuwe stijl, armoedige start, repareren en schoonmaken, emmer vullen ──
test('screenshots sprint 9', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 1_200_000 : 480_000);
  const dir = path.join(__dirname, 'screenshots', info.project.name);
  fs.mkdirSync(dir, { recursive: true });
  const shot = name => page.screenshot({ path: path.join(dir, `${name}.png`) });
  const render = { quality: 'medium', pixelRatio: process.env.CI ? 0.4 : 0.75 };
  const seed = data => page.evaluate(([key, d]) => localStorage.setItem(key, JSON.stringify(d)), ['flushfactor_v1', { profile: PROFILE, ...data }]);
  const reload = async () => { await page.reload(); await until(page, () => window.__game?.ready && window.__game.three.hasEnvironment()); };
  const settled = () => until(page, () => window.__game.three.toiletCondition().settled && window.__game.three.cameraIdle());

  // nieuwe speler: kapot en vies toilet, kale muur, vieze vloer, roestige emmer, vier gereedschappen
  await openGame(page, { ...render, save: { version: 3, toilet: { defects: { seat: true, lid: true, chip: true }, dirt: 1 }, score: 260, level: 2, newItems: ['drain-cleaner', 'disco-ball', 'bucket-plastic', 'spray'] } });
  await until(page, () => window.__game.three.hasEnvironment());
  await shot('s9-01-nieuwe-speler');
  await page.locator('#btn-tools-toggle').click();
  await shot('s9-02-gereedschap-ingeklapt');
  await page.locator('#btn-tools-toggle').click();

  // winkel in de nieuwe stijl
  await page.locator('#btn-shop').click();
  await shot('s9-03-winkel');
  await page.locator('.shop-category[data-cat="care"] .shop-category-header').click();
  await page.locator('.shop-category[data-cat="care"]').scrollIntoViewIfNeeded();
  await shot('s9-04-winkel-schoonmaak-reparatie');
  await page.locator('.shop-card[data-id="new-seat"]').click();
  await shot('s9-05-winkel-gekocht');
  await page.locator('#btn-shop-close').click();

  // toilet: kapot en vies → gerepareerd → schoon
  await seed({ version: 3, score: 0, level: 3, toilet: { defects: { seat: false, lid: false, chip: false }, dirt: 1 }, purchased: ['toilet-brush', 'sponge', 'mop', 'new-seat', 'new-lid', 'repair-kit'] });
  await reload(); await settled();
  await shot('s9-06-toilet-gerepareerd-nog-vies');
  await page.evaluate(() => { window.__game.setCleaner('toilet-brush'); window.__game.scrub({ kind: 'toilet' }); window.__game.scrub({ kind: 'toilet' }); window.__game.scrub({ kind: 'toilet' }); });
  await settled();
  await shot('s9-07-toilet-schoon');

  // smeerboel na drie keer overlopen, met de schoonmaakla open
  await seed({ version: 3, score: 800, level: 3, toilet: { defects: {}, dirt: 0 }, purchased: ['toilet-brush', 'sponge', 'mop', 'spray', 'bucket-wood', 'tiles-default', 'floor-basic'], bucketId: 'bucket-wood', cosmetics: { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' }, overflowStreak: 2 });
  await reload();
  await page.evaluate(() => { window.__game.forceClog('duck'); window.__game.setWater(99.9); });
  await until(page, () => window.__game.snapshot().stains.length === 6);
  await until(page, () => !window.__game.snapshot().overflowing);
  await page.evaluate(() => { window.__game.setWater(5); window.__game.useTool('plunger'); });
  await until(page, () => window.__game.three.view() === 'toilet' && window.__game.three.cameraIdle() && !window.__game.three.effectsBusy());
  await setView(page, 'overview');
  await page.locator('#btn-clean').click();
  await shot('s9-08-smeerboel-schoonmaakla');

  // emmer halfvol en vol, van opzij en van boven (punt 84)
  const LITERS = { duck: 1, teddy: 2, sock: 0.3, 'toy-car': 1.5, phone: 0.8, fish: 0.6, banana: 0.4, brick: 1.5, key: 0.2, 'toilet-paper': 0.5 };
  const fill = liters => { const ids = Object.keys(LITERS), items = []; let sum = 0; for (let i = 0; i < 400; i++) { const id = ids[i % ids.length]; if (sum + LITERS[id] <= liters) { items.push({ id, liters: LITERS[id] }); sum += LITERS[id]; } } return items; };
  for (const [label, liters] of [['halfvol', 10], ['vol', 20]]) {
    await seed({ version: 3, toilet: { defects: {}, dirt: 0 }, purchased: ['bucket-wood', 'tiles-default', 'floor-basic'], bucketId: 'bucket-wood', cosmetics: { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' }, bucketItems: fill(liters) });
    await reload(); await cameraIdle(page);
    const box = await page.evaluate(() => { const t = window.__game.three, c = t.bucketScreen(); const r = Math.min(innerWidth, innerHeight) * 0.3; return { x: Math.max(0, c.x - r), y: Math.max(0, c.y - r), width: Math.min(innerWidth - Math.max(0, c.x - r), r * 2), height: Math.min(innerHeight - Math.max(0, c.y - r), r * 2) }; });
    await page.screenshot({ path: path.join(dir, `s9-09-emmer-${label}-opzij.png`), clip: box });
    await setView(page, 'bucket');
    await shot(`s9-10-emmer-${label}-boven`);
  }
});
