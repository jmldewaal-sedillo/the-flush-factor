// Punt 61: puntenbalans. De simulatie (tools/balans.mjs) speelt het spel na met de echte regels en getallen;
// deze test bewaakt de streefwaarden uit docs/puntenbalans.md, zodat een losse prijs of drempel de balans niet
// ongemerkt omgooit. Daarnaast: het level volgt uit wat je verdiend hebt (kopen kost geen voortgang), en
// oudere opslag gaat netjes mee naar de nieuwe prijzen.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { openGame, until, NEW_PLAYER } = require('./helpers');

const load = file => import(pathToFileURL(path.join(__dirname, '..', file)).href);
const MIN = 60000;
const snap = page => page.evaluate(() => window.__game.snapshot());

test.describe('simulatie', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));

  test('streefwaarden: levels en "alles gekocht" binnen de afgesproken tijden', async () => {
    const { runBalance } = await load('tools/balans.mjs');
    const [rustig, gemiddeld, fanatiek] = await runBalance(10);
    // gemiddelde speler (tikt elke 1,2 s): level 2 binnen een paar minuten, level 5 rond driekwart uur
    expect(gemiddeld.levels[2] / MIN).toBeGreaterThan(1.5);
    expect(gemiddeld.levels[2] / MIN).toBeLessThan(6);
    expect(gemiddeld.levels[5] / MIN).toBeGreaterThan(30);
    expect(gemiddeld.levels[5] / MIN).toBeLessThan(90);
    expect(gemiddeld.done / MIN).toBeGreaterThan(60);
    expect(gemiddeld.done / MIN).toBeLessThan(240);
    // ook een rustige speler komt overal, en snel tikken loont, maar niet buiten proportie
    expect(rustig.done, 'rustige speler koopt binnen 10 uur alles').not.toBeNull();
    expect(rustig.done / fanatiek.done).toBeLessThan(4);
  });

  test('werkend gereedschap is binnen een kwartier spelen te betalen zodra het vrijkomt', async () => {
    const { runBalance } = await load('tools/balans.mjs');
    const { TOOLS } = await load('js/data/tools.js');
    const [, gemiddeld] = await runBalance(10);
    for (const tool of TOOLS.filter(t => t.effect === 'working' && !t.starting)) {
      expect(tool.price / gemiddeld.rate[tool.minLevel], tool.id).toBeLessThan(15);
    }
  });

  test('de combo beloont doorspelen, niet zo snel mogelijk tikken', async () => {
    const { SCORING } = await load('js/data/config.js');
    const { flushPoints, nextCombo } = await load('js/scoring.js');
    expect(SCORING.comboMax).toBeLessThanOrEqual(3);
    // wie elke 2,5 s tikt haalt ook de hoogste combo
    let combo = 1;
    for (let i = 0; i < 20; i++) combo = nextCombo(combo, 2500);
    expect(combo).toBe(SCORING.comboMax);
    // vies kost ook bij de laagste combo zichtbaar punten
    expect(flushPoints(1, 0.9)).toBeLessThan(flushPoints(1, 1));
  });
});

test('kopen kost geen level-voortgang: het level volgt uit wat je verdiend hebt', async ({ page }) => {
  const { LEVELS } = await load('js/data/levels.js');
  const l2 = LEVELS[1].minScore, l3 = LEVELS[2].minScore;
  await openGame(page, { save: { ...NEW_PLAYER, version: 5, score: l2, earned: l2, level: 2 } });
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-level')).toContainText(new Intl.NumberFormat('nl-NL').format(l3 - l2));
  const header = page.locator('.shop-category[data-cat="care"] .shop-category-header');
  if (await header.getAttribute('aria-expanded') === 'false') await header.click();
  await page.locator('.shop-card[data-id="repair-kit"]').click();
  const s = await snap(page);
  expect(s.score).toBeLessThan(l2);
  expect(s.earned).toBe(l2);
  expect(s.level).toBe(2);
  // de afstand tot het volgende level is niet groter geworden
  await expect(page.locator('#shop-level')).toContainText(new Intl.NumberFormat('nl-NL').format(l3 - l2));
});

test('oudere opslag (versie 4): saldo ×5, level blijft, verdiend minstens de drempel van dat level', async ({ page }) => {
  const { LEVELS } = await load('js/data/levels.js');
  await openGame(page, { save: { ...NEW_PLAYER, version: 4, score: 1000, highScore: 1200, level: 3 } });
  const s = await snap(page);
  expect(s.score).toBe(5000);
  expect(s.level).toBe(3);
  expect(s.earned).toBe(Math.max(6000, LEVELS[2].minScore));
  // en na opslaan en herladen verandert er niets meer (geen tweede keer ×5)
  await page.locator('#flush-btn').click();
  await until(page, () => window.__game.snapshot().score > 5000);
  const before = await snap(page);
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).score).toBe(before.score);
});
