// Rooktest: kort en breed. Draait op de test-repo vóór publicatie (één telefoon- en één tabletformaat,
// doel: onder de 10 minuten) en vangt wat een testversie onbruikbaar maakt: laadt het spel, zonder fouten,
// en doen de kernfuncties het. De volledige suite (npm test) blijft de eis voor main.
//   npm run test:rook
const { test, expect } = require('@playwright/test');
const { openGame, until, clogAndFix, expectNoProblems, NEW_PLAYER } = require('./helpers');

const snap = page => page.evaluate(() => window.__game.snapshot());

test('rook: eerste start, spoelen, verstopping oplossen, emmer', async ({ page }) => {
  // helemaal nieuw: welkomstscherm, als gast beginnen
  const problems = await openGame(page, { firstStart: true });
  await expect(page.locator('#profile-screen')).toBeVisible();
  await page.locator('#profile-submit').click();
  await expect(page.locator('#profile-screen')).toBeHidden();
  await expect(page.locator('.tool-btn')).toHaveCount(4);
  for (const sel of ['#flush-btn', '#btn-shop', '#btn-menu', '#btn-camera', '#btn-clean', '#btn-bucket', '#score-bubble']) await expect(page.locator(sel), sel).toBeVisible();

  // spoelen geeft punten en laat water stromen
  await page.locator('#flush-btn').click();
  expect((await snap(page)).score).toBeGreaterThan(0);
  await until(page, () => window.__game.three.flush().active);

  // verstopping: gereedschap lost hem op, het voorwerp belandt in de emmer
  await clogAndFix(page, 'duck');
  const s = await snap(page);
  expect(s.clogged).toBe(false);
  expect(s.bucketItems).toEqual(['duck']);
  await page.locator('#btn-bucket').click();
  await until(page, () => window.__game.three.view() === 'bucket');
  await page.locator('#btn-bucket-empty').click();
  expect((await snap(page)).bucketItems).toEqual([]);
  await page.locator('#btn-back').click();

  // bewaard na herladen
  const score = (await snap(page)).score;
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).score).toBe(score);
  await expect(page.locator('#profile-screen')).toBeHidden();
  expectNoProblems(problems);
});

test('rook: winkel, repareren, schoonmaken, menu en taal', async ({ page }) => {
  const problems = await openGame(page, { save: { ...NEW_PLAYER, score: 500, level: 1 } });

  // winkel: alle categorieën, iets kopen, reparatie
  await page.locator('#btn-shop').click();
  await expect(page.locator('.shop-category')).toHaveCount(8);
  await page.locator('.shop-category[data-cat="care"] .shop-category-header').click();
  await page.locator('.shop-card[data-id="toilet-brush"]').click();
  await page.locator('.shop-card[data-id="new-seat"]').click();
  let s = await snap(page);
  expect(s.score).toBe(500 - 80 - 120);
  expect(s.supplies).toEqual({ 'toilet-brush': 6 });
  expect(s.toilet.defects.seat).toBe(false);
  await page.locator('#btn-shop-close').click();

  // schoonmaken: middel kiezen in de la, drie vegen, toilet schoon, voorraad telt af
  await expect(page.locator('#clean-count')).toHaveText('6');
  await page.locator('#btn-clean').click();
  await page.locator('.clean-option[data-cleaner="toilet-brush"]').click();
  await expect(page.locator('#clean-tray')).toBeHidden();
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__game.scrub({ kind: 'toilet' }); });
  s = await snap(page);
  expect(s.toilet.dirt).toBe(0);
  expect(s.supplies['toilet-brush']).toBe(3);

  // menu: tik ernaast sluit het zonder te spoelen; taal wisselen werkt en blijft bewaard
  const flushes = s.stats.totalFlushes;
  await page.locator('#btn-menu').click();
  await expect(page.locator('#main-menu')).toBeVisible();
  const b = await page.locator('#flush-btn').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('#main-menu')).toBeHidden();
  expect((await snap(page)).stats.totalFlushes).toBe(flushes);
  await page.locator('#btn-menu').click();
  await page.locator('#setting-language').selectOption('en');
  await expect(page.locator('#main-menu [data-action="fullscreen"]')).toHaveText('Full screen');
  await page.keyboard.press('Escape');
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect(await snap(page)).toMatchObject({ language: 'en', supplies: { 'toilet-brush': 3 } });
  expect(await page.evaluate(() => window.__game.missingTexts())).toEqual([]);
  expectNoProblems(problems);
});

test('rook: profiel met gegevensknoppen, privacyverklaring en verwijderpagina', async ({ page }) => {
  const problems = await openGame(page);
  await page.locator('#score-bubble').click();
  for (const sel of ['#btn-transfer', '#btn-delete-profile', '#btn-wipe']) await expect(page.locator(sel)).toBeVisible();
  await page.locator('#btn-transfer').click();
  await page.locator('#btn-export').click();
  await expect(page.locator('#export-code')).toHaveValue(/^flushfactor1\./);
  await page.locator('#btn-transfer-close').click();
  expectNoProblems(problems);

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const [url, title] of [['./privacy.html', 'Privacyverklaring'], ['./delete.html', 'Gegevens verwijderen']]) {
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('#page-text h2').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
