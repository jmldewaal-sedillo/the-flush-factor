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
  const liters = { 'bucket-wood': 20, 'bucket-rusty': 30, 'bucket-plastic': 50, 'bucket-metal': 75, 'bucket-mop': 100 };
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
