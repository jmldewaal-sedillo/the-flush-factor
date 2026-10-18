// Sprint 14: meer diepte. 15 levels (punt 112), soorten verstoppingen (punt 113), spitsuur (punt 114) en
// gereedschap verbeteren (punt 115). De regels zelf worden zonder browser getest (zelfde modules als het
// spel en de balanssimulatie); daarna in het spel: wat de speler ziet en wat er bewaard wordt.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { openGame, until, NEW_PLAYER } = require('./helpers');

const load = file => import(pathToFileURL(path.join(__dirname, '..', file)).href);
const snap = page => page.evaluate(() => window.__game.snapshot());
// Speler zonder gebreken of vuil, zodat alleen telt wat de test doet.
const PLAYER = { ...NEW_PLAYER, version: 5, toilet: { defects: {}, dirt: 0 } };
const at = (level, extra = {}) => ({ ...PLAYER, level, earned: 0, ...extra });

test.describe('regels', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));

  test('15 levels: steeds hoger en moeilijker, en elk level speelt iets nieuws vrij', async () => {
    const { LEVELS } = await load('js/data/levels.js');
    const { CLOG_KINDS } = await load('js/data/config.js');
    const { unlockedAt } = await load('js/data/catalog.js');
    const { TOOLS } = await load('js/data/tools.js');
    const { upgradeTier, canUpgrade } = await load('js/upgrades.js');
    // minstens 15; later uitbreiden mag (alleen achteraan toevoegen, nooit weghalen: spelstanden onthouden het level)
    expect(LEVELS.length).toBeGreaterThanOrEqual(15);
    LEVELS.forEach((l, i) => expect(l.level).toBe(i + 1));
    for (let i = 1; i < LEVELS.length; i++) {
      const a = LEVELS[i - 1], b = LEVELS[i];
      expect(b.minScore, `level ${b.level}`).toBeGreaterThan(a.minScore);
      expect(b.waterRiseRate).toBeGreaterThanOrEqual(a.waterRiseRate);
      expect(b.minTimeBetweenClogs).toBeLessThanOrEqual(a.minTimeBetweenClogs);
      for (const kind of Object.keys(b.kinds)) expect(CLOG_KINDS[kind], kind).toBeTruthy();
      // iets nieuws: een item, een ster voor gereedschap of een nieuwe soort verstopping
      const items = unlockedAt(b.level).length;
      const stars = TOOLS.filter(canUpgrade).flatMap(t => [1, 2, 3].map(n => upgradeTier(t, n))).filter(x => x.level === b.level).length;
      const kinds = Object.keys(b.kinds).filter(k => !a.kinds[k]).length;
      expect(items + stars + kinds, `level ${b.level} speelt niets vrij`).toBeGreaterThan(0);
    }
  });

  test('soorten verstoppingen: hardnekkig halveert het gereedschap, snel stijgt sneller, dubbel komt twee keer', async () => {
    const { ClogSystem, pickKind } = await load('js/clog.js');
    const { CLOG_KINDS, DOUBLE_FOLLOW_UP_MS } = await load('js/data/config.js');
    // kiezen volgens de gewichten
    expect(pickKind({ normal: 1, fast: 1 }, 0.2)).toBe('normal');
    expect(pickKind({ normal: 1, fast: 1 }, 0.7)).toBe('fast');
    expect(pickKind({ mega: 0, stubborn: 3 }, 0.99)).toBe('stubborn');

    const c = new ClogSystem();
    c.paused = true;
    c.forceClog('stubborn');
    c.waterLevel = 50;
    expect(c.resolve(40)).toBe(false);
    expect(c.waterLevel).toBe(50 - 40 * CLOG_KINDS.stubborn.power);

    const rise = kind => { const x = new ClogSystem(); x.paused = true; x.forceClog(kind); const w = x.waterLevel; x.update(1000); return x.waterLevel - w; };
    expect(rise('fast')).toBeCloseTo(rise('normal') * CLOG_KINDS.fast.rise, 5);

    const d = new ClogSystem();
    d.paused = true;
    const clogs = [];
    d.on('clog', e => clogs.push(e));
    d.forceClog('double');
    expect(d.resolve(100)).toBe(true);
    d.update(DOUBLE_FOLLOW_UP_MS + 50);
    expect(d.isClogged).toBe(true);
    expect(clogs[1].second).toBe(true);
    d.resolve(100);
    d.update(DOUBLE_FOLLOW_UP_MS * 3);
    expect(d.isClogged, 'na de tweede komt er geen derde').toBe(false);
  });

  test('spitsuur: pas vanaf level 3, duurt een halve minuut, bonus alleen zonder overlopen', async () => {
    const { RushSystem } = await load('js/rush.js');
    const { RUSH } = await load('js/data/config.js');
    const r = new RushSystem(RUSH, () => 0.5);
    const ends = [];
    r.on('end', e => ends.push(e));
    r.update(RUSH.firstMs + 1, RUSH.fromLevel - 1);
    expect(r.active).toBe(false);
    r.update(RUSH.firstMs + 1, RUSH.fromLevel);
    expect(r.active).toBe(true);
    expect(r.pointsFactor).toBe(RUSH.pointsFactor);
    r.update(RUSH.durationMs, RUSH.fromLevel);
    expect(r.active).toBe(false);
    expect(ends[0].survived).toBe(true);
    r.start(); r.onOverflow(); r.end();
    expect(ends[1].survived).toBe(false);
    expect(r.pointsFactor).toBe(1);
  });

  test('verbeteren: drie sterren, elk sterker en sneller, en nooit eerder dan het gereedschap zelf', async () => {
    const { TOOLS } = await load('js/data/tools.js');
    const { canUpgrade, upgradeTier, toolStats } = await load('js/upgrades.js');
    const { LEVELS } = await load('js/data/levels.js');
    const working = TOOLS.filter(t => t.effect === 'working' && !t.starting);
    for (const def of working) {
      expect(canUpgrade(def), def.id).toBe(true);
      let prev = toolStats(def, 0), prevTier = { level: def.minLevel, price: 0 };
      for (const n of [1, 2, 3]) {
        const tier = upgradeTier(def, n), st = toolStats(def, n);
        expect(tier.level, `${def.id} ★${n}`).toBeGreaterThan(prevTier.level);
        expect(tier.level).toBeLessThanOrEqual(LEVELS.length);
        expect(tier.price).toBeGreaterThan(prevTier.price);
        expect(st.power).toBeGreaterThan(prev.power);
        expect(st.cooldown).toBeLessThan(prev.cooldown);
        prev = st; prevTier = tier;
      }
      expect(upgradeTier(def, 4)).toBeNull();
    }
    for (const def of TOOLS.filter(t => t.effect === 'chaos')) expect(canUpgrade(def), def.id).toBe(false);
  });
});

test('hardnekkige verstopping: de waarschuwing zegt het, en het gereedschap haalt maar half zoveel weg', async ({ page }) => {
  await openGame(page, { save: at(4) });
  await page.evaluate(() => { window.__game.forceClog('duck', 'stubborn'); window.__game.setWater(60); });
  await expect(page.locator('#clog-warning')).toHaveAttribute('data-kind', 'stubborn');
  await expect(page.locator('#clog-warning')).toBeVisible();
  const before = (await snap(page)).waterLevel;
  expect(await page.evaluate(() => window.__game.useTool('plunger'))).toBe('partial');
  const s = await snap(page);
  expect(s.clogKind).toBe('stubborn');
  // de plopper haalt 45 weg, hardnekkig de helft (het water stijgt intussen een fractie)
  expect(before - s.waterLevel).toBeGreaterThan(20);
  expect(before - s.waterLevel).toBeLessThan(23);
});

test('dubbele verstopping: na het ontstoppen komt er meteen een tweede, daarna is het klaar', async ({ page }) => {
  await openGame(page, { save: at(6) });
  await page.evaluate(() => window.__game.forceClog('duck', 'double'));
  await expect(page.locator('#clog-warning')).toHaveAttribute('data-kind', 'double');
  await page.evaluate(() => { window.__game.setWater(1); window.__game.useTool('hot-water'); });
  await until(page, () => window.__game.snapshot().clogged === false);
  await until(page, () => window.__game.snapshot().clogged === true);
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.setWater(1); window.__game.useTool('hot-water'); });
  await until(page, () => window.__game.snapshot().clogged === false);
  await page.waitForTimeout(2500);
  expect((await snap(page)).clogged, 'geen derde verstopping').toBe(false);
});

test('spitsuur: balkje met aftellen, dubbele punten, en een bonus als niets overliep', async ({ page }) => {
  await openGame(page, { save: at(3, { score: 1000 }) });
  await page.evaluate(() => window.__game.startRush());
  await expect(page.locator('#rush-pill')).toBeVisible();
  await expect(page.locator('#rush-banner')).toBeVisible();
  const before = (await snap(page)).score;
  await page.locator('#flush-btn').click();
  await until(page, s => window.__game.snapshot().score > s, before);
  const { flushPoints } = await load('js/scoring.js');
  expect((await snap(page)).score - before).toBe(flushPoints(1, 2, 3));
  const mid = (await snap(page)).score;
  await page.evaluate(() => window.__game.endRush());
  await expect(page.locator('#rush-pill')).toBeHidden();
  const { RUSH } = await load('js/data/config.js');
  expect((await snap(page)).score - mid).toBe(RUSH.bonusPerLevel * 3);
});

test('gereedschap verbeteren in de winkel: ster kopen, sterker in het spel, bewaard na herladen', async ({ page }) => {
  await openGame(page, { save: at(5, { score: 20000, ownedTools: ['plunger', 'hot-water', 'rubber-duck', 'confetti-cannon', 'toilet-snake'] }) });
  await page.locator('#btn-shop').click();
  const header = page.locator('.shop-category[data-cat="tools"] .shop-category-header');
  if (await header.getAttribute('aria-expanded') === 'false') await header.click();
  const card = page.locator('.shop-card[data-id="toilet-snake"]');
  await expect(card).toHaveClass(/can-upgrade/);
  await expect(card.locator('.upgrade-tag')).toContainText('5.000');
  await expect(card.locator('.shop-card-stars')).toHaveText('☆☆☆');
  await card.click();
  let s = await snap(page);
  expect(s.score).toBe(15000);
  expect(s.toolUpgrades).toEqual({ 'toilet-snake': 1 });
  expect(s.tools.find(t => t.id === 'toilet-snake')).toMatchObject({ power: 90, cooldown: 23800, stars: 1 });
  // ster 2 komt pas op level 9
  await expect(card.locator('.shop-card-stars')).toHaveText('★☆☆');
  await expect(card.locator('.badge-locked')).toContainText('9');
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('.tool-btn[data-id="toilet-snake"] .tool-stars')).toHaveText('★');
  await page.reload();
  await until(page, () => window.__game?.ready);
  s = await snap(page);
  expect(s.toolUpgrades).toEqual({ 'toilet-snake': 1 });
  expect(s.tools.find(t => t.id === 'toilet-snake').power).toBe(90);
});
