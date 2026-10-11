// Punten 91–93: de knop voor schoonmaakspullen staat altijd in beeld, spullen raken op, en een open menu
// gaat dicht bij een tik ernaast zonder dat die tik iets anders doet.
const { test, expect } = require('@playwright/test');
const { openGame, until, tapScene, setView, expectNoProblems, NEW_PLAYER } = require('./helpers');

const snap = page => page.evaluate(() => window.__game.snapshot());
const card = (page, id) => page.locator(`.shop-card[data-id="${id}"]`);
const toiletPoint = page => page.evaluate(() => window.__game.three.toiletScreen());
// Een echte tik (aanwijzer omlaag, omhoog en de klik die daarop volgt) op een punt in beeld.
async function tapAt(page, point) { await page.mouse.click(point.x, point.y); }
async function centerOf(page, selector) {
  const b = await page.locator(selector).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
// Wacht een paar beelden: genoeg om te merken dat er per ongeluk tóch iets gebeurde.
async function settle(page) {
  const f = await page.evaluate(() => window.__game.three.frames());
  await until(page, f0 => window.__game.three.frames() > f0 + 4, f);
}
const STOCKED = { version: 3, score: 600, level: 2, toilet: { defects: {}, dirt: 1 }, purchased: ['sponge', 'toilet-brush', 'mop'] };

// ── 91: altijd zichtbaar ──
test('knop schoonmaakspullen: altijd in beeld, met de voorraad erop', async ({ page }) => {
  // helemaal schoon en niets in huis
  await openGame(page, { save: { version: 3, score: 50, level: 1, toilet: { defects: {}, dirt: 0 } } });
  await expect(page.locator('#btn-clean')).toBeVisible();
  await expect(page.locator('#clean-count')).toBeVisible();
  await expect(page.locator('#clean-count')).toHaveText('0');
  await expect(page.locator('#hud-clean')).toHaveAttribute('data-stock', '0');
  await expect(page.locator('#btn-clean')).toHaveAttribute('aria-label', /op/);
  // ook in elke camerastand (behalve de close-up van de emmer, waar alleen "Terug" en "Legen" staan)
  for (const view of ['overview', 'wallBack', 'wallLeft', 'wallRight', 'toilet']) {
    await setView(page, view);
    await expect(page.locator('#btn-clean'), view).toBeVisible();
  }
});

test('lege voorraad: de knop brengt je naar Schoonmaak & Reparatie in de winkel', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER, score: 200, level: 1 } });
  await page.locator('#btn-clean').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await expect(page.locator('.shop-category[data-cat="care"] .shop-category-header')).toHaveAttribute('aria-expanded', 'true');
  await expect(card(page, 'sponge')).toBeInViewport();
  await expect(page.locator('#clean-tray')).toBeHidden();
  // kopen: de teller op de knop laat de nieuwe voorraad zien, en de knop opent voortaan de la
  await card(page, 'sponge').click();
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('#clean-count')).toHaveText('6');
  await expect(page.locator('#btn-clean')).toHaveAttribute('aria-label', /6/);
  await page.locator('#btn-clean').click();
  await expect(page.locator('#shop-screen')).toBeHidden();
  await expect(page.locator('#clean-tray .clean-option')).toHaveCount(1);
});

// ── 92: spullen raken op ──
test('schoonmaakspullen raken op: elke veeg telt af, na de laatste verdwijnt het middel, ook na herladen', async ({ page }) => {
  // spons met nog twee keer over, en vier vlekken op de muur
  const stains = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, surface: 'wall-back', look: 'splat', u: -0.3 + i * 0.2, v: 1.6, size: 0.3, turn: 0, dirt: 1 }));
  const problems = await openGame(page, { save: { version: 4, score: 300, level: 2, toilet: { defects: {}, dirt: 0 }, purchased: ['sponge', 'mop'], supplies: { sponge: 2, mop: 6 }, stains } });
  expect((await snap(page)).supplies).toEqual({ sponge: 2, mop: 6 });
  await expect(page.locator('#clean-count')).toHaveText('8');
  await page.locator('#btn-clean').click();
  await expect(page.locator('.clean-option[data-cleaner="sponge"] .uses')).toHaveText('2/6');
  await page.locator('.clean-option[data-cleaner="sponge"]').click();
  await expect(page.locator('#clean-count')).toHaveText('2');                     // tijdens het schoonmaken: wat er van dít middel over is

  // eerste veeg: 2 → 1
  await page.evaluate(() => window.__game.scrub({ kind: 'stain', id: 'a' }));
  expect((await snap(page)).supplies.sponge).toBe(1);
  await expect(page.locator('#clean-count')).toHaveText('1');
  // herladen halverwege: de stand blijft bewaard
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).supplies).toEqual({ sponge: 1, mop: 6 });
  await page.locator('#btn-clean').click();
  await expect(page.locator('.clean-option[data-cleaner="sponge"] .uses')).toHaveText('1/6');
  await page.locator('.clean-option[data-cleaner="sponge"]').click();

  // een veeg met het verkeerde middel of naast een vlek kost niets
  await page.evaluate(() => window.__game.scrub({ kind: 'toilet' }));
  expect((await snap(page)).supplies.sponge).toBe(1);

  // laatste veeg: op. Het middel verdwijnt uit de voorraad, de schoonmaakstand stopt, melding erbij.
  await page.evaluate(() => window.__game.scrub({ kind: 'stain', id: 'a' }));
  const s = await snap(page);
  expect(s.supplies).toEqual({ mop: 6 });
  expect(s.cleaner).toBeNull();
  expect(s.purchased).not.toContain('sponge');
  expect(s.stains.find(x => x.id === 'a').dirt).toBeCloseTo(0.32, 2);             // de vlek is nog niet weg: nieuwe spons nodig
  await expect(page.locator('#status-msg')).toContainText('Spons is op');
  await expect(page.locator('#clean-count')).toHaveText('6');
  await page.locator('#btn-clean').click();
  await expect(page.locator('#clean-tray .clean-option')).toHaveCount(1);
  await expect(page.locator('.clean-option[data-cleaner="sponge"]')).toHaveCount(0);
  await page.locator('.clean-option[data-cleaner="mop"]').click();                // sluit de la
  await page.evaluate(() => window.__game.setCleaner(null));

  // ook na herladen is hij weg
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).supplies).toEqual({ mop: 6 });

  // in de winkel staat hij weer te koop; een nieuwe is weer vol
  await page.locator('#btn-shop').click();
  const head = page.locator('.shop-category[data-cat="care"] .shop-category-header');
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await expect(card(page, 'sponge').locator('.price-tag')).toContainText('60');
  await expect(card(page, 'sponge').locator('.shop-card-detail')).toHaveText('6× te gebruiken');
  await expect(card(page, 'mop').locator('.badge-owned')).toContainText('Nog 6 van 6');
  await expect(card(page, 'mop').locator('.uses-bar')).toBeVisible();
  // wat je nog hebt koop je niet dubbel
  await card(page, 'mop').click();
  expect((await snap(page)).score).toBe(300);
  await card(page, 'sponge').click();
  expect(await snap(page)).toMatchObject({ score: 240, supplies: { sponge: 6, mop: 6 } });
  expectNoProblems(problems);
});

test('aantallen komen uit de databestanden: duurder gaat langer mee, een reparatie is één keer', async ({ page }) => {
  await openGame(page, { save: { version: 3, score: 9000, level: 5, toilet: { defects: { seat: true }, dirt: 0 } } });
  const data = await page.evaluate(async () => {
    const m = await import('./js/data/care.js');
    return { cleaners: m.CLEANERS.map(c => ({ id: c.id, price: c.price, uses: c.uses, power: c.power, targets: c.targets })), repairs: m.REPAIRS.map(r => ({ id: r.id, uses: r.uses })) };
  });
  for (const c of data.cleaners) expect(Number.isInteger(c.uses) && c.uses > 0, `${c.id}.uses`).toBe(true);
  for (const r of data.repairs) expect(r.uses, `${r.id}.uses`).toBe(1);
  // per soort (muur, toilet, vloer): het duurdere middel maakt meer plekken schoon per aankoop
  const spots = c => c.uses / Math.ceil(1 / c.power - 1e-9);
  for (const target of ['wall', 'toilet', 'floor']) {
    const list = data.cleaners.filter(c => c.targets.includes(target)).sort((a, b) => a.price - b.price);
    for (let i = 1; i < list.length; i++) expect(spots(list[i]), `${list[i].id} gaat langer mee dan ${list[i - 1].id}`).toBeGreaterThan(spots(list[i - 1]));
  }
  // de winkel toont wat er in de data staat
  await page.locator('#btn-shop').click();
  await page.locator('.shop-category[data-cat="care"] .shop-category-header').click();
  for (const c of data.cleaners) await expect(card(page, c.id).locator('.shop-card-detail')).toHaveText(`${c.uses}× te gebruiken`);
  await expect(card(page, 'new-seat').locator('.shop-card-detail')).toHaveText('1× te gebruiken');
  // een reparatie is na gebruik op: nog een keer tikken koopt niets
  await card(page, 'new-seat').click();
  const after = (await snap(page)).score;
  await card(page, 'new-seat').click();
  expect((await snap(page)).score).toBe(after);
});

test('bestaande spelers: schoonmaakspullen van vóór deze wijziging krijgen een volle voorraad', async ({ page }) => {
  await openGame(page, { save: { version: 3, score: 100, level: 4, toilet: { defects: {}, dirt: 0 }, purchased: ['sponge', 'pressure-washer', 'bucket-wood'] } });
  expect((await snap(page)).supplies).toEqual({ sponge: 6, 'pressure-washer': 20 });
  await expect(page.locator('#clean-count')).toHaveText('26');
});

// ── 93: menu's sluiten bij een tik ernaast ──
const MENUS = [
  { name: 'schoonmaakmenu', button: '#btn-clean', menu: '#clean-tray' },
  { name: 'cameramenu', button: '#btn-camera', menu: '#camera-menu' },
  { name: 'hoofdmenu', button: '#btn-menu', menu: '#main-menu' },
];

for (const { name, button, menu } of MENUS) {
  test(`${name}: tik ernaast sluit het menu en doet verder niets`, async ({ page }) => {
    await openGame(page, { save: STOCKED });
    const before = await snap(page);

    // tik in de scène (op het toilet): menu dicht, geen inzoomen
    await page.locator(button).click();
    await expect(page.locator(menu)).toBeVisible();
    await tapAt(page, await toiletPoint(page));
    await expect(page.locator(menu)).toBeHidden();
    await expect(page.locator(button)).toHaveAttribute('aria-expanded', 'false');
    await settle(page);
    expect(await page.evaluate(() => window.__game.three.view()), 'geen inzoomen').toBe('toilet');

    // tik op de spoelknop: menu dicht, niet gespoeld
    await page.locator(button).click();
    await expect(page.locator(menu)).toBeVisible();
    await tapAt(page, await centerOf(page, '#flush-btn'));
    await expect(page.locator(menu)).toBeHidden();
    await settle(page);
    let now = await snap(page);
    expect(now.score, 'niet per ongeluk gespoeld').toBe(before.score);
    expect(now.stats.totalFlushes).toBe(before.stats.totalFlushes);

    // tik op de winkelknop: menu dicht, winkel blijft dicht
    await page.locator(button).click();
    await tapAt(page, await centerOf(page, '#btn-shop'));
    await expect(page.locator(menu)).toBeHidden();
    await expect(page.locator('#shop-screen')).toBeHidden();

    // ook een nagebootste aanraking direct op het canvas (zoals de andere tests tikken)
    await page.locator(button).click();
    await tapScene(page, await toiletPoint(page));
    await expect(page.locator(menu)).toBeHidden();
    await settle(page);
    expect(await page.evaluate(() => window.__game.three.view())).toBe('toilet');

    // daarna werkt alles weer gewoon: de volgende tik zoomt in, en spoelen spoelt
    await tapAt(page, await toiletPoint(page));
    await until(page, () => window.__game.three.view() === 'bowl');
    await page.locator('#flush-btn').click();
    now = await snap(page);
    expect(now.stats.totalFlushes).toBe(before.stats.totalFlushes + 1);
  });
}

test('menu\'s: tik in het menu zelf sluit niet vanzelf, Escape wel, en van het ene menu naar het andere kan in één tik', async ({ page }) => {
  await openGame(page, { save: STOCKED });
  // de taalkeuze in het hoofdmenu aanraken laat het menu open
  await page.locator('#btn-menu').click();
  await page.locator('#main-menu .menu-language > span').click();
  await expect(page.locator('#main-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#main-menu')).toBeHidden();

  // van het cameramenu direct naar het hoofdmenu
  await page.locator('#btn-camera').click();
  await expect(page.locator('#camera-menu')).toBeVisible();
  await page.locator('#btn-menu').click();
  await expect(page.locator('#camera-menu')).toBeHidden();
  await expect(page.locator('#main-menu')).toBeVisible();
  // en naar de schoonmaakla
  await page.locator('#btn-clean').click();
  await expect(page.locator('#main-menu')).toBeHidden();
  await expect(page.locator('#clean-tray')).toBeVisible();
  // een keuze in het menu werkt gewoon
  await page.locator('.clean-option[data-cleaner="toilet-brush"]').click();
  await expect(page.locator('#clean-tray')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-cleaning', 'toilet-brush');
});

test('schoonmaken: met de la dicht is een tik in de scène gewoon een veeg', async ({ page }) => {
  await openGame(page, { save: STOCKED });
  await page.locator('#btn-clean').click();
  await page.locator('.clean-option[data-cleaner="toilet-brush"]').click();
  await tapAt(page, await toiletPoint(page));
  await until(page, () => window.__game.snapshot().toilet.dirt < 1);
  expect((await snap(page)).supplies['toilet-brush']).toBe(5);
});
