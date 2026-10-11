// Punten 80 en 83: kapot en vies toilet, repareren, schoonmaken, troep na herhaald overlopen.
const { test, expect } = require('@playwright/test');
const { openGame, until, tapScene, setView, expectNoProblems, NEW_PLAYER, watch, seen } = require('./helpers');

const snap = page => page.evaluate(() => window.__game.snapshot());
const cond = page => page.evaluate(() => window.__game.three.toiletCondition());
const card = (page, id) => page.locator(`.shop-card[data-id="${id}"]`);
const openCat = async (page, id) => {
  const head = page.locator(`.shop-category[data-cat="${id}"] .shop-category-header`);
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
};
// Een verstopping die overloopt en daarna wordt opgelost.
async function overflowingClog(page, times = 1) {
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.forceClog('sock'); });
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => window.__game.setWater(99.9));
    await until(page, () => window.__game.snapshot().overflowing);
    if (i < times - 1) await until(page, () => !window.__game.snapshot().overflowing);
  }
  await until(page, () => !window.__game.snapshot().overflowing);
  await page.evaluate(() => { window.__game.setWater(5); window.__game.useTool('plunger'); });
  await until(page, () => !window.__game.snapshot().clogged);
}
// Tik een paar keer op een plek in de schoonmaakstand, tot een voorwaarde waar is.
async function scrubUntil(page, pointFn, doneFn, max = 8) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate(doneFn)) return;
    await tapScene(page, await page.evaluate(pointFn));
    // één veeg telt één keer per ± 0,3 s speltijd; wacht op de spelklok, niet op de wandklok
    const t = await page.evaluate(() => window.__game.three.clock());
    await until(page, t0 => window.__game.three.clock() > t0 + 0.35, t);
  }
  expect(await page.evaluate(doneFn), 'schoon na een paar vegen').toBe(true);
}

test('repareren: elk gebrek heeft zijn eigen reparatie, met overgang in beeld, en het blijft bewaard', async ({ page }) => {
  const problems = await openGame(page, { save: { ...NEW_PLAYER, score: 1000, level: 1 } });
  expect(await cond(page)).toMatchObject({ seatSkew: 1, lidSkew: 1, crackVisible: true, chipVisible: true });

  await page.locator('#btn-shop').click();
  await openCat(page, 'care');
  await card(page, 'new-seat').click();                                         // 120
  await expect(card(page, 'new-seat').locator('.badge-owned')).toContainText('Gerepareerd');
  expect((await snap(page)).toilet.defects).toEqual({ seat: false, lid: true, chip: true });
  // de overgang loopt: de bril draait terug (niet in één klap)
  await until(page, () => { const c = window.__game.three.toiletCondition(); return c.seatSkew === 0 && c.settled; });
  expect(await cond(page)).toMatchObject({ seatSkew: 0, lidSkew: 1, crackVisible: true, chipVisible: true });

  await card(page, 'new-lid').click();                                          // 150
  await card(page, 'repair-kit').click();                                       // 60
  await until(page, () => { const c = window.__game.three.toiletCondition(); return c.settled && !c.crackVisible && !c.chipVisible; });
  const s = await snap(page);
  expect(s.score).toBe(1000 - 120 - 150 - 60);
  expect(s.broken).toBe(false);
  // nog een keer tikken kost niets
  await card(page, 'new-lid').click();
  expect((await snap(page)).score).toBe(s.score);

  await page.locator('#btn-shop-close').click();
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).toilet.defects).toEqual({ seat: false, lid: false, chip: false });
  expect(await cond(page)).toMatchObject({ seatSkew: 0, lidSkew: 0, crackVisible: false, chipVisible: false, grime: 1 });   // nog wel vies
  expectNoProblems(problems);
});

test('een ander toiletmodel kan pas als het toilet heel en schoon is', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER, score: 5000, level: 5 } });
  await page.locator('#btn-shop').click();
  await openCat(page, 'toilets');
  await expect(card(page, 'toilet-golden').locator('.badge-locked')).toContainText('Eerst heel en schoon');
  await card(page, 'toilet-golden').click();
  expect((await snap(page)).score).toBe(5000);
  expect((await snap(page)).cosmetics.toilet).toBe('toilet-standard');
});

test('toilet schoonmaken: wc-borstel kopen, boenen in drie vegen, straf weg, bewaard', async ({ page }) => {
  const problems = await openGame(page, { save: { ...NEW_PLAYER, score: 500, level: 1 } });
  await expect(page.locator('#dirt-pill')).toContainText('10% vies');
  expect((await snap(page)).pointsFactor).toBe(0.9);
  // zonder schoonmaakspullen: de knop staat er wel (voorraad 0) en brengt je naar de juiste categorie in de winkel
  await expect(page.locator('#btn-clean')).toBeVisible();
  await expect(page.locator('#clean-count')).toHaveText('0');
  await page.locator('#btn-clean').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await expect(page.locator('.shop-category[data-cat="care"] .shop-category-header')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#shop-message')).toContainText('Hier koop je nieuwe');
  await expect(card(page, 'toilet-brush')).toBeInViewport();
  await expect(page.locator('#clean-tray')).toBeHidden();

  await card(page, 'toilet-brush').click();
  await card(page, 'sponge').click();
  await expect(card(page, 'toilet-brush').locator('.badge-owned')).toContainText('Nog 6 van 6');
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('#clean-count')).toHaveText('12');                    // 6 + 6 keer vegen in voorraad

  // verkeerde middel: de spons is voor de muur
  await page.locator('#btn-clean').click();
  await expect(page.locator('#clean-tray .clean-option')).toHaveCount(2);
  // de la ligt nergens over de spoelknop
  const [tray, flush] = await Promise.all(['#clean-tray', '#flush-btn'].map(sel => page.locator(sel).boundingBox()));
  expect(tray.x + tray.width <= flush.x || tray.y + tray.height <= flush.y, 'schoonmaakla overlapt de spoelknop niet').toBe(true);
  await expect(page.locator('.clean-option[data-cleaner="sponge"] .uses')).toHaveText('6/6');
  await page.locator('.clean-option[data-cleaner="sponge"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-cleaning', 'sponge');
  await expect(page.locator('#clean-tray')).toBeHidden();                         // kiezen sluit de la
  const toilet = () => window.__game.three.toiletScreen();
  await tapScene(page, await page.evaluate(toilet));
  await expect(page.locator('#status-msg')).toContainText('iets anders nodig');
  expect((await snap(page)).toilet.dirt).toBe(1);
  expect((await snap(page)).supplies.sponge, 'een veeg met het verkeerde middel kost niets').toBe(6);
  expect(await page.evaluate(() => window.__game.three.view()), 'in de schoonmaakstand wisselt een tik niet van camerastand').toBe('toilet');

  // goede middel: drie vegen met de borstel
  await page.locator('#btn-clean').click();
  await page.locator('.clean-option[data-cleaner="toilet-brush"]').click();
  const t1 = await page.evaluate(() => window.__game.three.clock());
  await until(page, t0 => window.__game.three.clock() > t0 + 0.35, t1);
  await tapScene(page, await page.evaluate(toilet));
  await until(page, () => window.__game.snapshot().toilet.dirt < 1);
  expect((await snap(page)).toilet.dirt).toBeCloseTo(0.66, 2);
  await scrubUntil(page, toilet, () => window.__game.snapshot().toilet.dirt === 0);
  await until(page, () => { const c = window.__game.three.toiletCondition(); return c.grime === 0 && c.limescale === 0; });
  const s = await snap(page);
  expect(s).toMatchObject({ pointsFactor: 1, dirtCount: 0, cleaner: null });       // klaar: schoonmaakstand gaat vanzelf uit
  expect(s.supplies).toEqual({ sponge: 6, 'toilet-brush': 3 });                    // drie vegen gebruikt
  await expect(page.locator('#dirt-pill')).toBeHidden();
  await expect(page.locator('#btn-clean')).toBeVisible();                          // de knop blijft staan, ook als alles schoon is
  await expect(page.locator('#clean-count')).toHaveText('9');
  await expect(page.locator('body')).not.toHaveAttribute('data-cleaning', /.+/);

  // volle punten per spoelbeurt
  await page.locator('#flush-btn').click();
  expect((await snap(page)).score).toBe(s.score + 10);
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).toilet.dirt).toBe(0);
  expect((await snap(page)).supplies).toEqual({ sponge: 6, 'toilet-brush': 3 });
  expect((await cond(page)).grime).toBe(0);
  expectNoProblems(problems);
});

test('drie verstoppingen achter elkaar die overlopen: troep tegen muren en vloer, minder punten', async ({ page }) => {
  await openGame(page, { save: { score: 1000, level: 2 } });
  await overflowingClog(page);
  await overflowingClog(page);
  expect((await snap(page))).toMatchObject({ overflowStreak: 2, stains: [] });
  await watch(page, '#status-msg.visible');
  await overflowingClog(page);
  const s = await snap(page);
  expect(s.overflowStreak).toBe(0);
  expect(s.stains).toHaveLength(6);
  expect(s.stains.filter(x => x.surface === 'floor')).toHaveLength(2);
  expect(s.stains.filter(x => x.surface.startsWith('wall'))).toHaveLength(4);
  expect(s.pointsFactor).toBeCloseTo(0.5, 5);                                   // 6 vlekken, straf is begrensd op 50%
  expect(await page.evaluate(() => window.__game.three.stains().length)).toBe(6);
  await expect(page.locator('#dirt-pill')).toContainText('50% vies');
  await expect(page.locator('#btn-clean')).toBeVisible();

  // spoelen levert nu de helft op
  await page.locator('#flush-btn').click();
  expect((await snap(page)).score).toBe(s.score + 5);

  // bewaard
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).stains.map(x => x.id).sort()).toEqual(s.stains.map(x => x.id).sort());
  expect(await page.evaluate(() => window.__game.three.stains().length)).toBe(6);
});

test('een verstopping die zonder overlopen wordt opgelost breekt de reeks; twee keer overlopen geeft een plas', async ({ page }) => {
  await openGame(page, { save: { score: 500, level: 1 } });
  await overflowingClog(page);
  expect((await snap(page)).overflowStreak).toBe(1);
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.forceClog('key'); window.__game.useTool('plunger'); });
  expect((await snap(page)).overflowStreak).toBe(0);

  // dezelfde verstopping loopt twee keer over: de vloer blijft nat
  await overflowingClog(page, 2);
  const s = await snap(page);
  expect(s.stains).toHaveLength(1);
  expect(s.stains[0]).toMatchObject({ surface: 'floor', look: 'puddle', dirt: 1 });
});

test('vlekken schoonmaken: juiste middel per plek, vegen tot het weg is, bewaard', async ({ page }) => {
  const stains = [
    { id: 'w1', surface: 'wall-back', look: 'splat', u: 0.2, v: 1.7, size: 0.36, turn: 1, dirt: 1 },
    { id: 'f1', surface: 'floor', look: 'puddle', u: -0.3, v: 1.3, size: 0.55, turn: 0, dirt: 1 },
  ];
  const problems = await openGame(page, { save: { version: 3, score: 100, level: 2, purchased: ['sponge', 'mop', 'bucket-wood', 'tiles-default', 'floor-basic'], bucketId: 'bucket-wood', cosmetics: { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' }, toilet: { defects: {}, dirt: 0 }, stains } });
  expect(await page.evaluate(() => window.__game.three.stains().sort())).toEqual(['f1', 'w1']);
  expect((await snap(page)).pointsFactor).toBeCloseTo(0.8, 5);
  await setView(page, 'overview');

  await page.locator('#btn-clean').click();
  await page.locator('.clean-option[data-cleaner="mop"]').click();
  // dweil op de muur: werkt niet
  await tapScene(page, await page.evaluate(() => window.__game.three.stainScreen('w1')));
  await expect(page.locator('#status-msg')).toContainText('Voor de muur heb je iets anders nodig');
  // dweil op de plas: drie vegen
  await watch(page, '#fx-layer .sparkle');
  await scrubUntil(page, () => window.__game.three.stainScreen('f1') || { x: -9, y: -9 }, () => !window.__game.snapshot().stains.some(s => s.id === 'f1'));
  await seen(page, '#fx-layer .sparkle');                                       // "schoon"-animatie
  await until(page, () => !window.__game.three.stains().includes('f1'));
  expect((await snap(page)).stains.map(s => s.id)).toEqual(['w1']);

  // spons op de muurvlek: la open, ander middel kiezen
  await page.locator('#btn-clean').click();
  await expect(page.locator('.clean-option[data-cleaner="mop"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.clean-option[data-cleaner="mop"] .uses')).toHaveText('3/6');     // drie vegen op de plas
  await page.locator('.clean-option[data-cleaner="sponge"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-cleaning', 'sponge');
  const t2 = await page.evaluate(() => window.__game.three.clock());
  await until(page, t0 => window.__game.three.clock() > t0 + 0.35, t2);
  await tapScene(page, await page.evaluate(() => window.__game.three.stainScreen('w1')));
  await until(page, () => (window.__game.snapshot().stains[0]?.dirt ?? 0) < 1);
  await page.reload();                                                          // half schoon blijft half schoon
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).stains[0].dirt).toBeCloseTo(0.66, 2);
  expectNoProblems(problems);
});

test('vegen (slepen) over een vlek poetst ook', async ({ page }) => {
  await openGame(page, { save: { version: 3, level: 4, purchased: ['pressure-washer'], toilet: { defects: {}, dirt: 0 }, stains: [{ id: 'w9', surface: 'wall-back', look: 'splat', u: 0, v: 1.8, size: 0.4, turn: 0, dirt: 1 }] } });
  await setView(page, 'wallBack');
  await page.evaluate(() => window.__game.setCleaner('pressure-washer'));
  const p = await page.evaluate(() => window.__game.three.stainScreen('w9'));
  await page.evaluate(({ x, y }) => {
    const c = document.getElementById('scene-canvas-3d');
    const fire = (t, px) => c.dispatchEvent(new PointerEvent(t, { pointerId: 4, pointerType: 'touch', clientX: px, clientY: y, bubbles: true }));
    fire('pointerdown', x - 160); for (let i = 1; i <= 8; i++) fire('pointermove', x - 160 + i * 20); fire('pointerup', x);
  }, p);
  await until(page, () => window.__game.snapshot().stains.length === 0);           // hogedrukreiniger: één veeg
  expect(await page.evaluate(() => window.__game.three.view()), 'vegen in de schoonmaakstand wisselt niet van muur').toBe('wallBack');
});
