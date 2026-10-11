// Punten 39, 52, 56: emmer vullen, bekijken en legen; hengsel; emmerweergave.
const { test, expect } = require('@playwright/test');
const { openGame, until, setView, clogAndFix, expectNoProblems } = require('./helpers');

const count = page => page.evaluate(() => window.__game.three.bucketItemCount());
const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('vullen via het spel, legen, en alles klopt ook na herladen', async ({ page }) => {
  const problems = await openGame(page);
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 20 L');
  await expect(page.locator('#btn-bucket-empty')).toBeHidden();

  await clogAndFix(page, 'duck');      // 1,0 L
  await clogAndFix(page, 'teddy');     // 2,0 L
  await clogAndFix(page, 'sock');      // 0,3 L
  await expect(page.locator('#bucket-liters')).toHaveText('3,3 / 20 L');
  expect(await count(page)).toBe(3);
  await expect(page.locator('#btn-bucket-empty')).toBeVisible();

  // herladen: teller én 3D-inhoud komen terug
  await page.reload();
  await until(page, () => window.__game?.ready);
  await expect(page.locator('#bucket-liters')).toHaveText('3,3 / 20 L');
  expect(await count(page)).toBe(3);

  // legen
  await page.locator('#btn-bucket-empty').click();
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 20 L');
  await expect(page.locator('#btn-bucket-empty')).toBeHidden();
  await until(page, () => window.__game.three.bucketItemCount() === 0);
  expect((await page.evaluate(() => window.__game.snapshot())).bucketItems).toEqual([]);

  await page.reload();
  await until(page, () => window.__game?.ready);
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 20 L');
  expect(await count(page)).toBe(0);
  expectNoProblems(problems);
});

test('volle emmer: voorwerp past niet, kost punten, teller blijft staan', async ({ page }) => {
  await openGame(page, { save: { score: 500, level: 1, bucketItems: Array.from({ length: 10 }, () => ({ id: 'teddy', liters: 2 })) } });
  await expect(page.locator('#bucket-liters')).toHaveText('20,0 / 20 L');
  await clogAndFix(page, 'duck');
  await expect(page.locator('#bucket-liters')).toHaveText('20,0 / 20 L');
  expect(await count(page)).toBe(10);
  expect((await page.evaluate(() => window.__game.snapshot())).score).toBe(500 + 20 - 30);
});

test('emmerweergave: hengsel weg, gereedschap en spoelknop weg, Terug zonder overlap', async ({ page }) => {
  await openGame(page, { save: { bucketItems: [{ id: 'duck', liters: 1 }, { id: 'brick', liters: 1.5 }] } });
  const dbg = () => page.evaluate(() => ({ has: window.__game.three.bucketHasHandle(), vis: window.__game.three.bucketHandleVisible() }));
  expect(await dbg()).toEqual({ has: true, vis: true });

  await page.locator('#btn-bucket').click();
  await until(page, () => window.__game.three.view() === 'bucket' && window.__game.three.cameraIdle());
  expect(await dbg()).toEqual({ has: true, vis: false });
  for (const sel of ['#hud-left', '#flush-btn', '#btn-camera', '#btn-bucket']) await expect(page.locator(sel)).toBeHidden();
  for (const sel of ['#btn-back', '#btn-bucket-empty', '#bucket-liters', '#btn-menu', '#score-bubble']) await expect(page.locator(sel)).toBeVisible();

  const boxes = {};
  for (const sel of ['#btn-back', '#btn-menu', '#score-bubble', '#btn-shop', '#btn-bucket-empty', '#bucket-liters']) boxes[sel] = await page.locator(sel).boundingBox();
  const keys = Object.keys(boxes);
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) expect(overlap(boxes[keys[i]], boxes[keys[j]]), `${keys[i]} overlapt ${keys[j]}`).toBe(false);

  // legen kan ook hier
  await page.locator('#btn-bucket-empty').click();
  await until(page, () => window.__game.three.bucketItemCount() === 0);

  await page.locator('#btn-back').click();
  await until(page, () => window.__game.three.view() === 'toilet');
  expect((await dbg()).vis).toBe(true);
  await expect(page.locator('#flush-btn')).toBeVisible();
  await expect(page.locator('#hud-left')).toBeVisible();

  // Esc werkt ook
  await setView(page, 'bucket');
  await page.keyboard.press('Escape');
  await until(page, () => window.__game.three.view() === 'toilet');
});

test('elke emmer laadt, heeft een hengsel dat verborgen kan worden en toont zijn inhoud', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'modellen zijn op elk formaat gelijk');
  const problems = await openGame(page, { save: { score: 0, purchased: ['bucket-rusty', 'bucket-plastic', 'bucket-metal', 'bucket-mop'], bucketItems: [{ id: 'fish', liters: 0.6 }, { id: 'key', liters: 0.2 }] } });
  const liters = { 'bucket-wood': 20, 'bucket-rusty': 12, 'bucket-plastic': 50, 'bucket-metal': 75, 'bucket-mop': 100 };
  await page.locator('#btn-shop').click();
  await page.locator('.shop-category[data-cat="buckets"] .shop-category-header').click();
  for (const [id, cap] of Object.entries(liters)) {
    if (id !== 'bucket-wood') await page.locator(`.shop-card[data-id="${id}"]`).click();
    await until(page, b => window.__game.three.bucketId() === b, id);
    expect(await page.evaluate(() => window.__game.three.bucketHasHandle()), `${id} heeft een hengsel`).toBe(true);
    expect(await count(page), `${id} toont de inhoud`).toBe(2);
    await expect(page.locator('#bucket-liters')).toHaveText(`0,8 / ${cap} L`);
  }
  expectNoProblems(problems);
});

// ── Punt 84: troep netjes in de emmer ──
const LITERS = { duck: 1, teddy: 2, sock: 0.3, 'toy-car': 1.5, phone: 0.8, fish: 0.6, banana: 0.4, brick: 1.5, key: 0.2, 'toilet-paper': 0.5 };
function fillTo(liters) {
  const ids = Object.keys(LITERS), items = [];
  let sum = 0;
  for (let i = 0; i < 600; i++) { const id = ids[i % ids.length]; if (sum + LITERS[id] <= liters) { items.push({ id, liters: LITERS[id] }); sum += LITERS[id]; } }
  return items;
}
const BUCKET_LITERS = { 'bucket-rusty': 12, 'bucket-wood': 20, 'bucket-plastic': 50, 'bucket-metal': 75, 'bucket-mop': 100 };

for (const [bucketId, cap] of Object.entries(BUCKET_LITERS)) {
  test(`${bucketId}: inhoud blijft binnen de emmer, halfvol en vol`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-portrait', 'het stapelen hangt niet van het schermformaat af');
    for (const part of [0.5, 1]) {
      const p = await page.context().newPage();
      await openGame(p, { save: { version: 3, bucketId, purchased: [bucketId], bucketItems: fillTo(cap * part), toilet: { defects: {}, dirt: 0 } } });
      const pack = await p.evaluate(() => window.__game.three.bucketPacking());
      const label = `${bucketId} ${part === 1 ? 'vol' : 'halfvol'}`;
      expect(pack.count, label).toBeGreaterThan(4);
      expect(pack.outside, `${label}: niets door de wand of onder de bodem`).toBe(0);
      expect(pack.overlap, `${label}: niets door elkaar`).toBe(0);
      expect(pack.floating, `${label}: niets zweeft`).toBe(0);
      if (part === 0.5) expect(pack.highest, `${label}: blijft onder de rand`).toBeLessThanOrEqual(pack.rim);
      else { expect(pack.fill, `${label}: zichtbaar vol`).toBeGreaterThan(0.75); expect(pack.fill, `${label}: ligt netjes bovenop, geen toren`).toBeLessThan(1.3); }

      // de binnenmaat uit de data past binnen het echte model (gemeten met stralen)
      if (part === 1) {
        const m = await p.evaluate(() => window.__game.three.bucketMeasure());
        const inner = await p.evaluate(async id => (await import('./js/data/buckets.js')).BUCKETS.find(b => b.id === id).model.inner, bucketId);
        expect(inner.floor, 'bodem uit de data ligt op of boven de echte bodem').toBeGreaterThanOrEqual(m.floor - 0.001);
        expect(m.rAtData.bottom, 'vrije straal onderin').toBeGreaterThanOrEqual(inner.rBottom - 0.001);
        expect(m.rAtData.top, 'vrije straal bij de rand').toBeGreaterThanOrEqual(inner.rTop - 0.001);
      }
      await p.close();
    }
  });
}

test('een nieuw voorwerp valt op zijn plek en ligt na herladen precies hetzelfde', async ({ page }) => {
  await openGame(page);
  for (const id of ['teddy', 'duck', 'brick', 'sock']) await clogAndFix(page, id);
  await until(page, () => window.__game.three.bucketPacking().count === 4);
  const before = await page.evaluate(() => window.__game.three.bucketPacking());
  expect(before).toMatchObject({ outside: 0, overlap: 0, floating: 0 });
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect(await page.evaluate(() => window.__game.three.bucketPacking())).toEqual(before);
});
