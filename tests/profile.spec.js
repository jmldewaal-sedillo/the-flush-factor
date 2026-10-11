// Punt 69: welkomstscherm bij de eerste start, gastprofiel, profiel via de scorebubbel, inlog-koppelpunt.
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems, watch, seen } = require('./helpers');

const snap = page => page.evaluate(() => window.__game.snapshot());

test('eerste start: welkomstscherm; als gast spelen; daarna verschijnt het niet meer', async ({ page }) => {
  const problems = await openGame(page, { firstStart: true });
  const screen = page.locator('#profile-screen');
  await expect(screen).toBeVisible();
  await expect(screen).toHaveAttribute('data-mode', 'welcome');
  await expect(page.locator('#profile-title')).toHaveText('Welkom bij The Flush Factor');
  await expect(page.locator('#profile-submit')).toHaveText('Spelen als gast');
  await expect(page.locator('#btn-profile-close')).toBeHidden();          // eerst kiezen
  await expect(page.locator('#profile-stats-block')).toBeHidden();
  await expect(page.locator('#profile-auth .auth-btn')).toHaveText(['Inloggen met Google', 'Inloggen met Facebook']);
  await page.keyboard.press('Escape');
  await expect(screen).toBeVisible();
  expect((await snap(page)).profile).toBeNull();

  await page.locator('.avatar-option[data-avatar="ninja"]').click();
  await expect(page.locator('.avatar-option[data-avatar="ninja"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#profile-name')).toHaveAttribute('maxlength', '16');
  await page.locator('#profile-name').fill('  Maggie   S.  ');
  await page.locator('#profile-submit').click();
  await expect(screen).toBeHidden();
  const p = (await snap(page)).profile;
  expect(p).toMatchObject({ name: 'Maggie S.', avatar: 'ninja', mode: 'guest' });   // spaties opgeschoond
  await expect(page.locator('#profile-avatar svg use')).toHaveAttribute('href', /#ninja$/);

  // het spel werkt, en na herladen komt het welkomstscherm niet terug
  await page.locator('#flush-btn').click();
  await expect(page.locator('#score-value')).toHaveText('10');
  await page.reload();
  await until(page, () => window.__game?.ready);
  await expect(screen).toBeHidden();
  expect((await snap(page)).profile).toMatchObject({ name: 'Maggie S.', avatar: 'ninja' });
  await expect(page.locator('#score-value')).toHaveText('10');
  expectNoProblems(problems);
});

test('eerste start zonder naam: je heet "Gast"', async ({ page }) => {
  await openGame(page, { firstStart: true });
  await page.locator('#profile-submit').click();
  expect((await snap(page)).profile).toMatchObject({ name: 'Gast', avatar: 'duck', mode: 'guest' });
});

test('tijdens het welkomstscherm komen er geen verstoppingen', async ({ page }) => {
  await openGame(page, { firstStart: true, clogs: true });
  await page.evaluate(() => { window.__game.skipTime(60000); Math.random = () => 0; });
  await page.waitForTimeout(1200);
  expect((await snap(page)).clogged).toBe(false);
  await page.locator('#profile-submit').click();
  await until(page, () => window.__game.snapshot().clogged);     // daarna gelden de gewone spelregels weer
});

test('Google en Facebook: knoppen via het koppelpunt, melding "Binnenkort beschikbaar", geen namaak-inlogscherm', async ({ page, context }) => {
  const problems = await openGame(page, { firstStart: true });
  const pages = context.pages().length;
  for (const provider of ['google', 'facebook']) {
    await page.evaluate(() => { const s = document.getElementById('profile-status'); s.classList.remove('visible'); s.textContent = ''; });
    await watch(page, '#profile-status.visible');
    await page.locator(`#profile-auth [data-provider="${provider}"]`).click();
    await seen(page, '#profile-status.visible');
    await expect(page.locator('#profile-status')).toHaveText('Binnenkort beschikbaar');
  }
  // er is niets nagemaakt: geen wachtwoordveld, geen nieuw venster, geen verzoek naar buiten, nog steeds geen profiel
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
  expect(context.pages().length).toBe(pages);
  expect((await snap(page)).profile).toBeNull();
  await expect(page.locator('#profile-screen')).toBeVisible();
  expectNoProblems(problems);
});

test('profiel via de scorebubbel: naam en avatar wijzigen, statistieken, account koppelen', async ({ page }) => {
  await openGame(page, { save: { bestStreak: 12, stats: { totalFlushes: 345, totalClogs: 9, totalUnclogs: 7, totalLiters: 12.5 } } });
  await expect(page.locator('#profile-screen')).toBeHidden();
  await page.locator('#score-bubble').click();
  await expect(page.locator('#profile-screen')).toHaveAttribute('data-mode', 'profile');
  await expect(page.locator('#profile-title')).toHaveText('Jouw profiel');
  await expect(page.locator('#profile-name')).toHaveValue('Tester');
  await expect(page.locator('#profile-stats dd')).toHaveText(['345', '12', '7', '12,5 L']);
  await expect(page.locator('#profile-stats dt')).toHaveText(['Totaal gespoeld', 'Langste reeks', 'Ontstoppingen', 'Verzamelde troep']);
  await expect(page.locator('#profile-auth-title')).toHaveText('Account koppelen');
  await expect(page.locator('#profile-auth-note')).toContainText('gastvoortgang blijft');

  await page.locator('#profile-name').fill('Sjaak');
  await page.locator('.avatar-option[data-avatar="rocket"]').click();
  await page.locator('#profile-submit').click();
  await expect(page.locator('#profile-screen')).toBeHidden();
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).profile).toMatchObject({ name: 'Sjaak', avatar: 'rocket' });
  await expect(page.locator('#score-bubble')).toHaveAttribute('aria-label', 'Profiel van Sjaak');

  // sluiten zonder opslaan verandert niets
  await page.locator('#score-bubble').click();
  await page.locator('#profile-name').fill('Iemand anders');
  await page.locator('#btn-profile-close').click();
  expect((await snap(page)).profile.name).toBe('Sjaak');
});

test('statistieken tellen mee tijdens het spelen', async ({ page }) => {
  await openGame(page);
  await page.locator('#flush-btn').click();
  await page.evaluate(() => { window.__game.forceClog('teddy'); window.__game.useTool('plunger'); });
  const s = (await snap(page)).stats;
  expect(s).toMatchObject({ totalFlushes: 1, totalUnclogs: 1, totalLiters: 2, bestStreak: 1 });
});
