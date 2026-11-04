// Toegankelijkheid volgens WCAG 2.1 AA, met axe-core (Sprint 16; vaste controle uit Apps/CLAUDE.md, sectie 11.7a):
// contrast, namen van knoppen en velden, taal van de pagina, koppen en ARIA. Elk scherm, elk venster en elke
// pagina, in elke taal. Het 3D-beeld zelf (canvas) telt niet mee; alles eromheen wel.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openGame, until, expectNoProblems, LANGUAGES: ALL } = require('./helpers');
const LANGUAGES = ALL.map(l => l[0]);

test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));

async function expectAccessible(page, what) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const found = result.violations.map(v =>
    `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.failureSummary ? ' – ' + n.failureSummary.split('\n')[1] : '')).join('\n    ')}`);
  expect(found, `${what}: toegankelijkheidsproblemen\n${found.join('\n')}`).toEqual([]);
}

for (const lang of LANGUAGES) {
  test(`spel (${lang}): elk scherm en elk venster`, async ({ page }) => {
    const problems = await openGame(page, { save: { score: 5000, level: 5, language: lang } });
    await expectAccessible(page, 'start');
    await page.locator('#btn-menu').click();
    await expectAccessible(page, 'menu');
    await page.locator('#btn-sound').click();
    await expectAccessible(page, 'geluid');
    await page.keyboard.press('Escape');
    await page.locator('#btn-camera').click();
    await expectAccessible(page, 'camera');
    await page.locator('#btn-camera').click();
    // verstopt, met de waarschuwing in beeld
    await page.evaluate(() => window.__game.forceClog('duck'));
    await until(page, () => window.__game.three.propInBowl());
    await expectAccessible(page, 'verstopt');
    await page.evaluate(() => window.__game.useTool('plunger'));
    await page.locator('#btn-shop').click();
    for (const h of await page.locator('.shop-category-header').all()) await h.click();
    await expectAccessible(page, 'winkel');
    await page.locator('#btn-shop-close').click();
    await page.locator('#score-bubble').click();
    await expectAccessible(page, 'profiel');
    await page.locator('#btn-transfer').click();
    await page.locator('#btn-export').click();
    await expectAccessible(page, 'voortgang overzetten');
    await page.keyboard.press('Escape');
    await page.locator('#btn-wipe').click();
    await expectAccessible(page, 'bevestigen');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.locator('#btn-menu').click();
    await page.locator('#main-menu [data-action="credits"]').click();
    await expectAccessible(page, 'credits');
    expectNoProblems(problems);
  });

  test(`welkomstscherm, privacy- en verwijderpagina (${lang})`, async ({ page }) => {
    await page.addInitScript(l => { if (!localStorage.getItem('flushfactor.settings')) localStorage.setItem('flushfactor.settings', JSON.stringify({ language: l })); }, lang);
    await openGame(page, { firstStart: true });
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expectAccessible(page, 'welkom');
    for (const p of ['privacy.html', 'delete.html']) {
      await page.goto(`./${p}?lang=${lang}`);
      await expect(page.locator('#page-text h1')).toBeVisible();
      await expectAccessible(page, p);
    }
  });
}

test('reflow (WCAG 1.4.10): op 320 px breed niets horizontaal schuiven', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openGame(page, { save: { score: 5000, level: 5 } });
  const fits = async what => {
    const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: window.innerWidth }));
    expect(size.content, `${what}: geen horizontaal schuiven op 320 px`).toBeLessThanOrEqual(size.screen);
  };
  await fits('start');
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  await fits('winkel');
  await page.locator('#btn-shop-close').click();
  await page.locator('#score-bubble').click();
  await fits('profiel');
  await page.locator('#btn-transfer').click();
  await fits('voortgang overzetten');
  for (const p of ['privacy.html', 'delete.html']) { await page.goto(`./${p}`); await fits(p); }
});

test('de controle werkt echt: een knop zonder naam en tekst met te weinig contrast worden gevonden', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    const b = document.createElement('button');                 // geen tekst, geen aria-label
    b.className = 'round-btn';
    document.getElementById('hud').appendChild(b);
    const p = document.createElement('p');
    p.textContent = 'Lichtgrijs op wit';
    p.style.color = '#cccccc';
    p.style.background = '#ffffff';
    document.getElementById('hud').appendChild(p);
  });
  const ids = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations.map(v => v.id);
  expect(ids).toContain('button-name');
  expect(ids).toContain('color-contrast');
});
