// Punten 78, 85, 86: eigen stijl ("Sticker") uit één designbestand, de winkel en het welkomstscherm.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, until, expectNoProblems, NEW_PLAYER, watch, seen } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const css = sel => page => page.locator(sel).first().evaluate(el => { const s = getComputedStyle(el); return { font: s.fontFamily, border: `${s.borderTopWidth} ${s.borderTopStyle}`, shadow: s.boxShadow, radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.borderTopColor }; });
const INK = 'rgb(29, 27, 58)';

test('lettertypen zijn lokaal, geladen en in gebruik; overal dezelfde omlijning en harde schaduw', async ({ page }) => {
  const problems = await openGame(page);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => ['400 20px "Lilita One"', '600 16px "Nunito"', '800 16px "Nunito"'].map(f => document.fonts.check(f)))).toEqual([true, true, true]);
  expect((await css('body')(page)).font).toContain('Nunito');
  expect((await css('#score-value')(page)).font).toContain('Lilita One');

  await page.locator('#btn-menu').click();
  for (const sel of ['#btn-camera', '#btn-menu', '#score-bubble', '#btn-shop', '#flush-btn', '#btn-bucket', '.tool-btn', '#main-menu']) {
    const s = await css(sel)(page);
    expect(s.color, `${sel}: omlijning in inkt`).toBe(INK);
    expect(parseFloat(s.border), `${sel}: dikke omlijning`).toBeGreaterThanOrEqual(3);
    expect(s.shadow, `${sel}: harde schaduw zonder vervaging`).toMatch(/rgb\(29, 27, 58\) \d+px \d+px 0px 0px/);
  }
  expectNoProblems(problems);
});

test('één designbestand: kleuren staan alleen in tokens.css', async ({}, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'bronscan hoeft maar één keer');
  const tokens = fs.readFileSync(path.join(ROOT, 'css/tokens.css'), 'utf8');
  for (const name of ['--ink', '--paper', '--duck', '--plunger', '--mint', '--blue', '--font-display', '--font-body', '--border', '--shadow', '--radius', '--tilt']) expect(tokens, name).toContain(`${name}:`);
  // style.css gebruikt de tokens: geen losse lettertypen en nauwelijks losse kleuren
  const style = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  expect(style).not.toMatch(/font-family:(?!\s*var\()/);
  const hex = style.match(/#[0-9a-f]{3,8}\b/gi) || [];
  const allowed = new Set(['#fff', '#000', '#1f2a33', '#ece6d6', '#eafaf1', '#1b6fc4']);     // wit/zwart, laadkleur achter 3D, twee tinten en de linkkleur
  expect(hex.filter(h => !allowed.has(h.toLowerCase()))).toEqual([]);
  expect(style.match(/var\(--(ink|paper|duck|plunger|blue|ok|border|shadow)/g).length).toBeGreaterThan(80);
  // de oude "glazen" stijl is weg
  expect(style).not.toMatch(/backdrop-filter|blur\(/);
});

test('welkomstscherm in de nieuwe stijl; inlogknoppen tonen "Binnenkort"', async ({ page }) => {
  await openGame(page, { firstStart: true });
  const panel = await css('#profile-content')(page);
  expect(panel.color).toBe(INK);
  expect(panel.shadow).toMatch(/0px 0px/);
  expect((await css('#profile-title')(page)).font).toContain('Lilita One');
  expect((await css('#profile-submit')(page)).bg).toBe('rgb(255, 210, 63)');     // badeend-geel
  for (const btn of await page.locator('#profile-auth .auth-btn').all()) {
    await expect(btn.locator('.soon')).toHaveText('Binnenkort');
    expect(await btn.evaluate(el => getComputedStyle(el).borderTopStyle), 'gestippeld = nog niet beschikbaar').toBe('dashed');
  }
});

test('winkel: uitgelicht item, voortgang naar het volgende level, collectie per categorie', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER, score: 130, level: 1 } });
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-level')).toContainText('Nog 70 punten tot level 2');
  const levelBar = await page.locator('#shop-level .bar-fill').evaluate(el => el.style.width);
  expect(levelBar).toBe('65%');
  // uitgelicht = het goedkoopste dat je nu kunt kopen (lijm, 60 punten); je kunt het al betalen
  const featured = page.locator('#shop-featured');
  await expect(featured).toHaveAttribute('data-id', 'repair-kit');
  await expect(featured).toContainText('Uitgelicht');
  await expect(featured).toContainText('Je kunt Lijm & reparatieset kopen!');
  // elke categorie heeft een eigen kleur en laat zien hoeveel je hebt
  const colors = await page.locator('.shop-category-icon').evaluateAll(els => els.map(e => getComputedStyle(e).backgroundColor));
  expect(new Set(colors).size).toBe(8);
  await expect(page.locator('.shop-category[data-cat="tools"] .shop-category-count')).toHaveText('0 van 12');
  await expect(page.locator('.shop-category[data-cat="buckets"] .shop-category-count')).toHaveText('1 van 5');
  // tik op uitgelicht: categorie klapt open en de kaart staat in beeld
  await featured.click();
  await expect(page.locator('.shop-card[data-id="repair-kit"]')).toBeVisible();
  await expect(page.locator('.shop-category[data-cat="care"] .shop-category-header')).toHaveAttribute('aria-expanded', 'true');
});

test('winkel: "Bijna betaalbaar!", feestje bij kopen, en na de aankoop een nieuw doel', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER, score: 130, level: 1 } });
  await page.locator('#btn-shop').click();
  await page.locator('.shop-category[data-cat="buckets"] .shop-category-header').click();
  await page.locator('.shop-category[data-cat="care"] .shop-category-header').click();
  // houten emmer kost 150; met 130 punten (87%) is hij bijna betaalbaar
  await expect(page.locator('.shop-card[data-id="bucket-wood"] .tag-almost')).toHaveText('Bijna betaalbaar!');
  await expect(page.locator('.shop-card[data-id="mop"] .tag-almost')).toHaveCount(0);           // 100: al betaalbaar
  await expect(page.locator('.shop-card[data-id="new-lid"] .tag-almost')).toHaveText('Bijna betaalbaar!');

  await watch(page, '#shop-fx .shop-confetti');
  await page.locator('.shop-card[data-id="repair-kit"]').click();
  await seen(page, '#shop-fx .shop-confetti');
  expect(await page.evaluate(() => window.__seen['#shop-fx .shop-confetti'])).toBe(true);
  await expect(page.locator('#shop-score')).toContainText('70');
  await expect(page.locator('#shop-featured')).toHaveAttribute('data-id', 'sponge');           // volgende goedkoopste (60)
  await expect(page.locator('#shop-featured')).toContainText('Je kunt Spons kopen!');
  await until(page, () => document.getElementById('shop-fx').childElementCount === 0);         // feestje ruimt zichzelf op
});

test('winkel is eerlijk: echt geld apart met prijs in euro, geen timers of "laatste kans"', async ({ page }) => {
  await openGame(page, { save: { score: 5000, level: 5 } });
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  const packs = page.locator('.shop-card.buy-card');
  await expect(packs).toHaveCount(4);
  for (const pack of await packs.all()) {
    await expect(pack.locator('.tag-money')).toHaveText('Echt geld');
    await expect(pack.locator('.buy-price')).toHaveText(/^€\s\d+,\d{2}$/);
    await expect(pack.locator('.price-tag:not(.buy-price)')).toHaveCount(0);          // geen puntenprijs erdoorheen
  }
  // gewone kaarten tonen nooit een europrijs
  expect(await page.locator('.shop-card:not(.buy-card)').evaluateAll(els => els.filter(e => e.textContent.includes('€')).length)).toBe(0);
  const text = (await page.locator('#shop-screen').innerText()).toLowerCase();
  for (const bad of ['laatste kans', 'nog maar', 'alleen vandaag', 'op=op', 'verloopt', 'aanbieding eindigt']) expect(text, bad).not.toContain(bad);
  expect(text).not.toMatch(/\b\d{1,2}:\d{2}(:\d{2})?\b/);                              // geen aftelklok
});
