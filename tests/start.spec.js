// Punten 79 en 81: armoedige start voor nieuwe spelers, vrijspelen per level, bestaande spelers houden alles.
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems, NEW_PLAYER } = require('./helpers');

const snap = page => page.evaluate(() => window.__game.snapshot());
const three = (page, fn) => page.evaluate(name => window.__game.three[name](), fn);
const card = (page, id) => page.locator(`.shop-card[data-id="${id}"]`);
const openCat = async (page, id) => {
  const head = page.locator(`.shop-category[data-cat="${id}"] .shop-category-header`);
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
};

test('nieuwe speler: 4 gereedschappen, kapot en vies toilet, kale muur, vieze vloer, roestige emmer', async ({ page }) => {
  const problems = await openGame(page, { firstStart: true });
  await page.locator('#profile-submit').click();
  const s = await snap(page);
  expect(s.ownedTools).toEqual(['plunger', 'hot-water', 'rubber-duck', 'confetti-cannon']);
  expect(s.bucketId).toBe('bucket-rusty');
  expect(s.cosmetics).toEqual({ toilet: 'toilet-standard', tiles: 'tiles-bare', floor: 'floor-dirty' });
  expect(s.toilet).toEqual({ defects: { seat: true, lid: true, chip: true }, dirt: 1 });
  expect(s.broken).toBe(true);

  // en zo ziet het er ook uit
  await expect(page.locator('.tool-btn')).toHaveCount(4);
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 12 L');
  expect(await three(page, 'bucketId')).toBe('bucket-rusty');
  expect(await three(page, 'surfaces')).toEqual({ tiles: 'tiles-bare', floor: 'floor-dirty' });
  expect(await three(page, 'toiletCondition')).toMatchObject({ seatSkew: 1, lidSkew: 1, crackVisible: true, chipVisible: true, grime: 1, limescale: 1 });
  expect(await three(page, 'toiletOwnTextures')).toBe(true);      // vuil ligt eroverheen; het model is niet vervangen
  // twee werkende en twee chaos (dat ontdek je zelf: alle vier nog "onbekend")
  await expect(page.locator('.tool-btn[data-kind="unknown"]')).toHaveCount(4);
  expectNoProblems(problems);
});

test('level 1: alleen spullen van level 1 te koop; de rest staat op slot met het level erbij', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER, score: 180, level: 1 } });
  await page.locator('#btn-shop').click();
  for (const c of ['tools', 'buckets', 'tiles', 'floors']) await openCat(page, c);
  await expect(card(page, 'toilet-snake')).toBeEnabled();                       // level 1
  await expect(card(page, 'drain-cleaner')).toBeDisabled();                     // level 2
  await expect(card(page, 'drain-cleaner').locator('.badge-locked')).toContainText('Vanaf level 2');
  await expect(card(page, 'robot-arm').locator('.badge-locked')).toContainText('Vanaf level 5');
  await expect(card(page, 'bucket-wood').locator('.price-tag')).toHaveText('150');   // de houten emmer is nu een upgrade
  await expect(card(page, 'bucket-rusty').locator('.badge-active')).toBeVisible();
  await expect(card(page, 'tiles-default')).toBeDisabled();
  await expect(card(page, 'floor-basic')).toBeEnabled();

  await card(page, 'bucket-wood').click();
  await until(page, () => window.__game.three.bucketId() === 'bucket-wood');
  expect((await snap(page)).score).toBe(30);
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 20 L');
});

test('level-up speelt spullen vrij: melding, teller op de winkelknop, "Nieuw!" in de winkel, daarna gezien', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER, score: 195, level: 1 } });
  await expect(page.locator('#shop-badge')).toBeHidden();
  await page.locator('#flush-btn').click();                                     // 195 + 9 = level 2 (vanaf 200)
  await until(page, () => window.__game.snapshot().level === 2);
  const fresh = (await snap(page)).newItems;
  expect(fresh).toEqual(expect.arrayContaining(['drain-cleaner', 'disco-ball', 'megaphone', 'tiny-elephant', 'tiles-default', 'bucket-plastic', 'spray', 'toilet-cleaner']));
  expect(fresh).not.toContain('robot-arm');
  await expect(page.locator('#levelup-banner')).toContainText(`${fresh.length} nieuw in de winkel`);
  await expect(page.locator('#shop-badge')).toHaveText(String(fresh.length));

  await page.locator('#btn-shop').click();
  await expect(page.locator('.shop-category[data-cat="tools"] .shop-category-header .tag-new')).toBeVisible();
  await openCat(page, 'tools');
  await expect(card(page, 'drain-cleaner')).toBeEnabled();
  await expect(card(page, 'drain-cleaner').locator('.tag-new')).toHaveText('Nieuw!');
  await expect(card(page, 'toilet-snake').locator('.tag-new')).toHaveCount(0);  // was er al op level 1

  // bekeken = niet meer nieuw (alleen de geopende categorie)
  await page.locator('#btn-shop-close').click();
  const left = (await snap(page)).newItems;
  expect(left).not.toContain('drain-cleaner');
  expect(left).toContain('bucket-plastic');
  await expect(page.locator('#shop-badge')).toHaveText(String(left.length));
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).newItems).toEqual(left);
});

test('bestaande speler op level 4 houdt alles en krijgt de start-staat niet opgedrongen', async ({ page }) => {
  // opslag zoals het spel die vóór Sprint 9 schreef (versie 2)
  const old = {
    version: 2, score: 2600, highScore: 5200, level: 4, streak: 2, bestStreak: 40,
    bucketId: 'bucket-plastic', bucketItems: [{ id: 'duck', liters: 1 }, { id: 'teddy', liters: 2 }],
    cosmetics: { toilet: 'toilet-golden', tiles: 'tiles-default', floor: 'floor-marble' },
    decor: { wallBack: 'deco-mirror', floorLeft: 'deco-plant' },
    purchased: ['bucket-plastic', 'toilet-golden', 'floor-marble', 'deco-mirror', 'deco-plant', 'magic-wand', 'super-plunger'],
    ownedTools: ['plunger', 'toilet-snake', 'drain-cleaner', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball', 'magic-wand', 'super-plunger'],
    toolDiscovery: { plunger: 'working', 'rubber-duck': 'chaos' },
    stats: { totalFlushes: 900, totalClogs: 60, totalOverflows: 4, toolsUsed: 80 },
  };
  const problems = await openGame(page, { save: old });
  const s = await snap(page);
  expect(s).toMatchObject({
    score: 2600, level: 4, bucketId: 'bucket-plastic', bucketItems: ['duck', 'teddy'],
    cosmetics: { toilet: 'toilet-golden', tiles: 'tiles-default', floor: 'floor-marble' },
    decor: { wallBack: 'deco-mirror', floorLeft: 'deco-plant' },
    toilet: { defects: { seat: false, lid: false, chip: false }, dirt: 0 }, broken: false, pointsFactor: 1, stains: [],
  });
  expect(s.ownedTools).toEqual(old.ownedTools);
  await expect(page.locator('.tool-btn')).toHaveCount(10);
  await expect(page.locator('#bucket-liters')).toHaveText('3,0 / 50 L');
  expect(await three(page, 'toiletCondition')).toMatchObject({ seatSkew: 0, crackVisible: false, chipVisible: false, grime: 0, limescale: 0 });
  expect(await three(page, 'surfaces')).toEqual({ tiles: 'tiles-default', floor: 'floor-marble' });
  expect(await three(page, 'toiletSkin')).toBe('toilet-golden');
  await expect(page.locator('#dirt-pill')).toBeHidden();
  await expect(page.locator('#btn-clean')).toBeVisible();          // altijd in beeld (punt 91); deze speler heeft niets in voorraad
  await expect(page.locator('#clean-count')).toHaveText('0');

  // wat vroeger gratis was (houten emmer, Delfts blauw, houten vloer) is van hen gebleven, ook al kost het nu punten
  await page.locator('#btn-shop').click();
  for (const c of ['buckets', 'tiles', 'floors', 'tools', 'toilets', 'care']) await openCat(page, c);
  for (const id of ['bucket-wood', 'floor-basic', 'super-plunger', 'new-seat']) await expect(card(page, id).locator('.badge-owned')).toBeVisible();
  await expect(card(page, 'tiles-default').locator('.badge-active')).toBeVisible();
  await expect(card(page, 'toilet-golden').locator('.badge-active')).toBeVisible();   // level 5-item, maar al van hen
  await expect(card(page, 'new-seat').locator('.badge-owned')).toContainText('Is nog heel');
  // terugwisselen naar iets wat ze al hadden kost niets
  await card(page, 'bucket-wood').click();
  expect((await snap(page)).score).toBe(2600);

  // en het blijft zo na opslaan en herladen (nu als versie 3)
  await page.locator('#btn-shop-close').click();
  await page.reload();
  await until(page, () => window.__game?.ready);
  const again = await snap(page);
  expect(again).toMatchObject({ score: 2600, level: 4, bucketId: 'bucket-wood', cosmetics: s.cosmetics, toilet: s.toilet });
  expect(again.ownedTools).toEqual(old.ownedTools);
  expect(again.purchased).toEqual(expect.arrayContaining([...old.purchased, 'bucket-wood', 'tiles-default', 'floor-basic']));
  expectNoProblems(problems);
});
