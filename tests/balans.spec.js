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

// De simulatie één keer draaien voor alle tests hieronder (±10 s).
let results = null;
const balance = async () => results ||= (await load('tools/balans.mjs')).runBalance(6);
const HOUR = 60 * MIN;

test.describe('simulatie', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));
  test.describe.configure({ timeout: 120_000 });

  test('streefwaarden: levels en "alles gekocht" binnen de afgesproken tijden', async () => {
    const [rustig, gemiddeld, fanatiek] = await balance();
    // gemiddelde speler (tikt elke 1,2 s): level 2 binnen een paar minuten, level 5 rond drie kwartier,
    // level 10 na een paar uur, level 15 pas na een flink aantal uren (punt 112)
    expect(gemiddeld.levels[2] / MIN).toBeGreaterThan(1.5);
    expect(gemiddeld.levels[2] / MIN).toBeLessThan(6);
    expect(gemiddeld.levels[5] / MIN).toBeGreaterThan(25);
    expect(gemiddeld.levels[5] / MIN).toBeLessThan(70);
    expect(gemiddeld.levels[10] / HOUR).toBeGreaterThan(3);
    expect(gemiddeld.levels[10] / HOUR).toBeLessThan(8);
    expect(gemiddeld.levels[15] / HOUR).toBeGreaterThan(10);
    expect(gemiddeld.levels[15] / HOUR).toBeLessThan(25);
    expect(gemiddeld.done / HOUR, 'alles gekocht en level 15').toBeLessThan(30);
    // ook een rustige speler komt overal, en snel tikken loont, maar niet buiten proportie
    expect(rustig.done, 'rustige speler is binnen 50 uur klaar').not.toBeNull();
    expect(rustig.done / fanatiek.done).toBeLessThan(4);
  });

  test('werkend gereedschap is binnen een uur te betalen zodra het vrijkomt, elke ster binnen anderhalf uur', async () => {
    const { TOOLS } = await load('js/data/tools.js');
    const { upgradeTier, canUpgrade } = await load('js/upgrades.js');
    const [, gemiddeld] = await balance();
    for (const tool of TOOLS.filter(t => t.effect === 'working' && !t.starting)) {
      expect(tool.price / gemiddeld.rate[tool.minLevel], tool.id).toBeLessThan(60);
      if (!canUpgrade(tool)) continue;
      for (const n of [1, 2, 3]) {
        const tier = upgradeTier(tool, n);
        expect(tier.price / gemiddeld.rate[tier.level], `${tool.id} ★${n}`).toBeLessThan(90);
      }
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
    // een hoger level geeft meer per spoelbeurt
    expect(flushPoints(1, 1, 15)).toBeGreaterThan(flushPoints(1, 1, 1));
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
