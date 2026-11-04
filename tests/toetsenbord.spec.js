// Het spel werkt met alleen het toetsenbord (Sprint 16; vaste controle uit Apps/CLAUDE.md, sectie 11.7a):
// Tab, Enter, spatie en Escape. In een open venster blijft de focus in dat venster; na sluiten staat hij weer
// op de knop die het opende (js/ui/focus.js).
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems } = require('./helpers');

test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));

const focusedId = page => page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName));

/** Druk Tab tot het element met dit id de focus heeft (hoogstens 60 keer). */
async function tabTo(page, id) {
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(x => document.activeElement?.id === x, id)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`#${id} is niet met Tab te bereiken (focus staat op ${await focusedId(page)})`);
}

/** Tab 25 keer rond (ook terug met Shift+Tab): de focus mag het venster nooit verlaten. */
async function expectFocusStaysIn(page, id) {
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press(key);
      const inside = await page.evaluate(x => document.getElementById(x).contains(document.activeElement), id);
      expect(inside, `na ${i + 1}× ${key} staat de focus nog in #${id}`).toBe(true);
    }
  }
}
const focusIsIn = (page, id) => until(page, x => document.getElementById(x).contains(document.activeElement), id);
const focusIsOn = (page, id) => until(page, x => document.activeElement?.id === x, id);

test('spoelen, winkel en menu: alles met Tab, Enter, spatie en Escape', async ({ page }) => {
  const problems = await openGame(page, { save: { score: 5000, level: 5 } });

  // Spoelen met Enter en met spatie.
  await tabTo(page, 'flush-btn');
  await page.keyboard.press('Enter');
  await until(page, () => window.__game.snapshot().stats.totalFlushes === 1);
  // Na een spoelbeurt wacht de knop even (0,7 s); blijf spatie drukken tot hij weer spoelt.
  await expect.poll(async () => { await page.keyboard.press('Space'); return page.evaluate(() => window.__game.snapshot().stats.totalFlushes); }).toBeGreaterThanOrEqual(2);

  // Winkel: de focus gaat erin, blijft erin, Escape sluit en zet hem terug op de winkelknop.
  await tabTo(page, 'btn-shop');
  await page.keyboard.press('Enter');
  await expect(page.locator('#shop-screen')).toBeVisible();
  await focusIsIn(page, 'shop-screen');
  await expectFocusStaysIn(page, 'shop-screen');
  // Een categorie open met Enter.
  await page.locator('.shop-category[data-cat="tools"] .shop-category-header').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.shop-category[data-cat="tools"] .shop-category-header')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#shop-screen')).toBeHidden();
  await focusIsOn(page, 'btn-shop');

  // Menu → Geluid: venster, en na sluiten terug op de menuknop (het menu zelf is dan dicht).
  await tabTo(page, 'btn-menu');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-menu')).toBeVisible();
  await tabTo(page, 'btn-sound');
  await page.keyboard.press('Enter');
  await expect(page.locator('#sound-dialog')).toBeVisible();
  await focusIsIn(page, 'sound-dialog');
  await expectFocusStaysIn(page, 'sound-dialog');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sound-dialog')).toBeHidden();
  await focusIsOn(page, 'btn-menu');
  expectNoProblems(problems);
});

test('profiel, overzetten en bevestigen: focus erin, blijft erin, en terug na sluiten', async ({ page }) => {
  const problems = await openGame(page);
  await tabTo(page, 'score-bubble');
  await page.keyboard.press('Enter');
  await expect(page.locator('#profile-screen')).toBeVisible();
  await focusIsIn(page, 'profile-screen');
  await expectFocusStaysIn(page, 'profile-screen');

  // Overzetten: een venster boven het profiel.
  await tabTo(page, 'btn-transfer');
  await page.keyboard.press('Enter');
  await expect(page.locator('#transfer-dialog')).toBeVisible();
  await focusIsIn(page, 'transfer-dialog');
  await expectFocusStaysIn(page, 'transfer-dialog');
  await page.keyboard.press('Escape');
  await expect(page.locator('#transfer-dialog')).toBeHidden();
  await expect(page.locator('#profile-screen')).toBeVisible();
  await focusIsOn(page, 'btn-transfer');

  // Bevestigen: de veilige keuze heeft de focus; Escape annuleert en er is niets gewist.
  await tabTo(page, 'btn-wipe');
  await page.keyboard.press('Enter');
  await expect(page.locator('#confirm-dialog')).toBeVisible();
  await focusIsOn(page, 'confirm-no');
  await expectFocusStaysIn(page, 'confirm-dialog');
  await page.keyboard.press('Escape');
  await expect(page.locator('#confirm-dialog')).toBeHidden();
  await focusIsOn(page, 'btn-wipe');
  expect(await page.evaluate(() => window.__game.snapshot().profile)).not.toBeNull();

  // Escape sluit het profiel, de focus staat weer op de scorebubbel.
  await page.keyboard.press('Escape');
  await expect(page.locator('#profile-screen')).toBeHidden();
  await focusIsOn(page, 'score-bubble');
  expectNoProblems(problems);
});

test('eerste start: het welkomstscherm heeft de focus en werkt met naam typen en Enter', async ({ page }) => {
  const problems = await openGame(page, { firstStart: true });
  await focusIsIn(page, 'profile-screen');
  await expectFocusStaysIn(page, 'profile-screen');
  await tabTo(page, 'profile-name');
  await page.keyboard.type('Bo');
  await page.keyboard.press('Enter');
  await expect(page.locator('#profile-screen')).toBeHidden();
  expect((await page.evaluate(() => window.__game.snapshot().profile)).name).toBe('Bo');
  expectNoProblems(problems);
});
