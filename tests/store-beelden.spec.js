// Screenshots voor Google Play (en later de App Store) van het echte spel, per taal en formaat, in
// store/screenshots/<formaat>/<taal>/. Draait alleen op verzoek, want het duurt lang en overschrijft de beelden:
//   STORE_BEELDEN=1 npx playwright test tests/store-beelden.spec.js --project=phone-portrait
// Alleen talen of formaten: STORE_TALEN=nl,en  STORE_FORMATEN=telefoon
// Formaten (store/README.md): telefoon 1080 × 1920, tablet 7 inch 1080 × 1920, tablet 10 inch 1800 × 3200 (alle 9:16).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openGame, setView, until, cameraIdle, PROFILE, LANGUAGES } = require('./helpers');

const FORMATS = {
  telefoon: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'tablet-7': { viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true },
  'tablet-10': { viewport: { width: 900, height: 1600 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
// Telefoon in elke taal; tablets in de talen die het meest gebruikt worden (de rest valt in Play terug op Engels).
const TABLET_LANGS = ['en', 'nl'];
const only = (env, all) => (process.env[env] ? process.env[env].split(',').filter(x => all.includes(x)) : all);

// Een opgeknapt hokje met spullen: laat zien waar het spel naartoe gaat (eerlijk: dit kun je echt bereiken).
const DRESSED = {
  version: 5, profile: PROFILE, score: 24000, earned: 60000, level: 8,
  purchased: ['toilet-golden', 'tiles-stars', 'floor-marble', 'deco-mirror', 'deco-plant', 'deco-shelf', 'deco-painting', 'deco-cabinet', 'deco-poster', 'bucket-metal', 'sponge', 'mop', 'pressure-washer', 'super-plunger'],
  cosmetics: { toilet: 'toilet-golden', tiles: 'tiles-stars', floor: 'floor-marble' },
  decor: { wallBack: 'deco-mirror', wallBackHigh: 'deco-shelf', wallLeft: 'deco-painting', wallLeftLow: 'deco-cabinet', wallRight: 'deco-poster', floorLeft: 'deco-plant' },
  bucketId: 'bucket-metal', ownedTools: ['plunger', 'hot-water', 'rubber-duck', 'super-plunger', 'pressure-washer', 'confetti-cannon'],
  toilet: { defects: {}, dirt: 0 }, bestStreak: 23, streak: 12,
  bucketItems: ['duck', 'teddy', 'sock', 'toy-car', 'phone', 'fish', 'banana', 'brick'].map(id => ({ id, liters: 0.8 })),
};

for (const [format, device] of Object.entries(only('STORE_FORMATEN', Object.keys(FORMATS)))
  .map(([, f]) => [f, FORMATS[f]])) {
  const langs = only('STORE_TALEN', format === 'telefoon' ? LANGUAGES.map(l => l[0]) : TABLET_LANGS);
  for (const lang of langs) {
    test(`store-beelden ${format} (${lang})`, async ({ browser }, info) => {
      test.skip(!process.env.STORE_BEELDEN, 'alleen op verzoek: STORE_BEELDEN=1');
      test.skip(info.project.name !== 'phone-portrait', 'één keer');
      test.setTimeout(900_000);
      const context = await browser.newContext({ ...device, locale: lang, serviceWorkers: 'block' });
      const page = await context.newPage();
      const dir = path.join(__dirname, '..', 'store', 'screenshots', format, lang);
      fs.mkdirSync(dir, { recursive: true });
      const shot = async name => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(dir, `${name}.png`) }); };

      await openGame(page, { quality: 'high', pixelRatio: 1, save: { ...DRESSED, language: lang } });
      await until(page, () => window.__game.three.hasEnvironment());
      await cameraIdle(page);
      await shot('1-badkamer');

      // Een verstopping: water stijgt, de waarschuwing staat in beeld.
      await page.evaluate(() => window.__game.forceClog('duck'));
      await until(page, () => window.__game.three.propInBowl() && window.__game.three.cameraIdle() && window.__game.three.bubbles() > 0);
      await page.evaluate(() => window.__game.setWater(65));
      await until(page, () => window.__game.three.waterLevel() > 0.55);
      await shot('2-verstopt');
      await page.evaluate(() => { window.__game.setWater(5); window.__game.useTool('plunger'); });
      await until(page, () => !window.__game.snapshot().clogged);

      // Het begin: een armoedig hokje (zo start elke speler).
      // (eerst de winkel, dan de emmer; daarna het begin in een schone pagina)
      await page.locator('#btn-shop').click();
      await page.locator('.shop-category[data-cat="decoration"] .shop-category-header').click();
      await shot('3-winkel');
      await page.locator('#btn-shop-close').click();

      await setView(page, 'bucket');
      await shot('4-emmer');
      await page.locator('#btn-back').click();
      await cameraIdle(page);

      await page.evaluate(() => window.__game.startRush());
      await until(page, () => window.__game.snapshot().rush.active);
      await shot('5-spitsuur');
      await context.close();

      const start = await browser.newContext({ ...device, locale: lang, serviceWorkers: 'block' });
      const p2 = await start.newPage();
      await openGame(p2, { quality: 'high', pixelRatio: 1, save: { version: 5, profile: PROFILE, toilet: { defects: { seat: true, lid: true, chip: true }, dirt: 1 }, language: lang } });
      await until(p2, () => window.__game.three.hasEnvironment());
      await p2.waitForTimeout(600);
      await p2.screenshot({ path: path.join(dir, '6-begin.png') });
      await start.close();
      expect(fs.readdirSync(dir).filter(f => f.endsWith('.png')).length).toBe(6);
    });
  }
}

// Feature graphic (1024 × 500, zonder alfa) uit store/feature-graphic.html; gebruikt de Engelse telefoonbeelden.
test('store-beelden feature graphic', async ({ browser }, info) => {
  test.skip(!process.env.STORE_BEELDEN, 'alleen op verzoek: STORE_BEELDEN=1');
  test.skip(info.project.name !== 'phone-portrait', 'één keer');
  const context = await browser.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('./store/feature-graphic.html');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.shot')).toHaveCount(2);
  expect(await page.locator('img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0)), 'alle beelden geladen').toBe(true);
  await page.screenshot({ path: path.join(__dirname, '..', 'store', 'feature-graphic.png'), clip: { x: 0, y: 0, width: 1024, height: 500 } });
  expect(errors).toEqual([]);
  await context.close();
});
