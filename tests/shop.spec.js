// Punt 51: alle zeven winkelcategorieën zichtbaar en uitklapbaar, met werkende aankopen.
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems, watch, seen } = require('./helpers');

const CATEGORIES = ['Punten kopen', 'Gereedschap', 'Toiletmodellen', 'Tegelpatronen', 'Vloeren', 'Decoratie', 'Emmers'];
const MIN_ITEMS = { buy: 4, tools: 8, toilets: 4, tiles: 4, floors: 4, decoration: 6, buckets: 5 };

async function openShop(page, save = { score: 50000, level: 5 }) {
  const problems = await openGame(page, { save });
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  return problems;
}
const cat = (page, id) => page.locator(`.shop-category[data-cat="${id}"]`);
const openCat = async (page, id) => {
  const head = cat(page, id).locator('.shop-category-header');
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await expect(cat(page, id).locator('.shop-card').first()).toBeVisible();
};

test('alle 7 categorieën staan er, in volgorde, en zijn ingeklapt echt dicht', async ({ page }) => {
  const problems = await openShop(page);
  await expect(page.locator('.shop-category-label')).toHaveText(CATEGORIES);
  for (const head of await page.locator('.shop-category-header').all()) {
    await expect(head).toBeVisible();
    await expect(head).toHaveAttribute('aria-expanded', 'false');
  }
  // ingeklapt: geen kaart zichtbaar en geen randje (hoogte 0)
  await expect(page.locator('.shop-card:visible')).toHaveCount(0);
  for (const h of await page.locator('.shop-category-body').evaluateAll(els => els.map(e => e.getBoundingClientRect().height))) expect(h).toBeLessThan(1);
  expectNoProblems(problems);
});

test('elke categorie klapt uit en toont al haar items met icoon, en klapt weer in', async ({ page }) => {
  await openShop(page);
  for (const [id, min] of Object.entries(MIN_ITEMS)) {
    await openCat(page, id);
    const cards = cat(page, id).locator('.shop-card');
    expect(await cards.count(), `categorie ${id}`).toBeGreaterThanOrEqual(min);
    for (const card of await cards.all()) {
      await expect(card.locator('.shop-card-icon svg use')).toHaveCount(1);
      await expect(card.locator('.shop-card-name')).not.toBeEmpty();
    }
    await cat(page, id).locator('.shop-category-header').click();
    await expect(cards.first()).toBeHidden();
  }
});

test('meerdere categorieën tegelijk open, en de stand blijft bewaard na herladen', async ({ page }) => {
  await openShop(page);
  await openCat(page, 'tools');
  await openCat(page, 'buckets');
  await expect(cat(page, 'tools').locator('.shop-card').first()).toBeVisible();
  await page.reload();
  await until(page, () => window.__game?.ready);
  await page.locator('#btn-shop').click();
  await expect(cat(page, 'tools').locator('.shop-category-header')).toHaveAttribute('aria-expanded', 'true');
  await expect(cat(page, 'buckets').locator('.shop-category-header')).toHaveAttribute('aria-expanded', 'true');
  await expect(cat(page, 'tiles').locator('.shop-category-header')).toHaveAttribute('aria-expanded', 'false');
  await expect(cat(page, 'buckets').locator('.shop-card').first()).toBeVisible();
});

test('punten kopen: melding bij élke tik, saldo verandert niet', async ({ page }) => {
  await openShop(page, { score: 123, level: 1 });
  await openCat(page, 'buy');
  for (const i of [0, 1, 0]) {
    await page.evaluate(() => { const m = document.getElementById('shop-message'); m.classList.remove('visible'); m.textContent = ''; });
    await watch(page, '#shop-message.visible');
    await cat(page, 'buy').locator('.shop-card').nth(i).click();
    await seen(page, '#shop-message.visible');
    await expect(page.locator('#shop-message')).toHaveText('Binnenkort beschikbaar');
  }
  expect((await page.evaluate(() => window.__game.snapshot())).score).toBe(123);
});

test('gereedschap kopen: punten eraf, knop erbij; te duur of te laag level kan niet', async ({ page }) => {
  await openShop(page, { score: 400, level: 1 });
  await openCat(page, 'tools');
  const tools = cat(page, 'tools');
  await expect(tools.locator('[data-id="robot-arm"]')).toBeDisabled();           // level 5 nodig
  await tools.locator('[data-id="super-plunger"]').click();                       // 500 > 400
  await expect(page.locator('#shop-message')).toContainText('Niet genoeg punten');
  await tools.locator('[data-id="magic-wand"]').click();                          // 200
  await expect(tools.locator('[data-id="magic-wand"] .badge-owned')).toBeVisible();
  const snap = await page.evaluate(() => window.__game.snapshot());
  expect(snap.score).toBe(200);
  expect(snap.ownedTools).toContain('magic-wand');
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('.tool-btn[data-id="magic-wand"]')).toBeVisible();
  await expect(page.locator('.tool-btn')).toHaveCount(9);
});

test('cosmetica, decoratie en emmers veranderen de 3D-scène en blijven bewaard', async ({ page }) => {
  await openShop(page);
  const three = () => page.evaluate(() => ({ s: window.__game.three.surfaces(), skin: window.__game.three.toiletSkin(), decor: window.__game.three.decor(), bucket: window.__game.three.bucketId() }));

  await openCat(page, 'tiles');   await cat(page, 'tiles').locator('[data-id="tiles-checkerboard"]').click();
  await openCat(page, 'floors');  await cat(page, 'floors').locator('[data-id="floor-marble"]').click();
  await openCat(page, 'toilets'); await cat(page, 'toilets').locator('[data-id="toilet-golden"]').click();
  await openCat(page, 'buckets'); await cat(page, 'buckets').locator('[data-id="bucket-metal"]').click();
  await openCat(page, 'decoration');
  for (const id of ['deco-mirror', 'deco-plant', 'deco-shelf', 'deco-painting', 'deco-cabinet', 'deco-poster']) await cat(page, 'decoration').locator(`[data-id="${id}"]`).click();

  await until(page, () => window.__game.three.bucketId() === 'bucket-metal' && window.__game.three.surfaces().tiles === 'tiles-checkerboard' && window.__game.three.surfaces().floor === 'floor-marble');
  let t = await three();
  expect(t.skin).toBe('toilet-golden');
  expect(Object.keys(t.decor).sort()).toEqual(['floorLeft', 'wallBack', 'wallBackHigh', 'wallLeft', 'wallLeftLow', 'wallRight']);
  await expect(cat(page, 'buckets').locator('[data-id="bucket-metal"] .badge-active')).toBeVisible();
  await expect(cat(page, 'buckets').locator('.shop-category-count')).toHaveText('2/5');

  // decoratie weer weghalen door nog eens te tikken
  await cat(page, 'decoration').locator('[data-id="deco-mirror"]').click();
  expect((await three()).decor.wallBack).toBeUndefined();

  await page.reload();
  await until(page, () => window.__game?.ready);
  t = await three();
  expect(t).toMatchObject({ skin: 'toilet-golden', bucket: 'bucket-metal', s: { tiles: 'tiles-checkerboard', floor: 'floor-marble' } });
  expect(Object.keys(t.decor)).toHaveLength(5);
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 75 L');
});
