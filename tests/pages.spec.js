// Privacyverklaring en verwijderpagina (CLAUDE.md §5): bereikbaar als /privacy, /delete en /verwijderen,
// in elke taal van het spel, met de vaste gegevens van Studio Sedillo.
const { test, expect } = require('@playwright/test');
const { openGame, emojiIn } = require('./helpers');

const CODES = ['nl', 'en', 'de', 'fr', 'es', 'pt', 'it', 'pl', 'tr', 'id'];
const MAIL = 'studio.sedillo@gmail.com';
const pageReady = page => page.waitForFunction(() => document.documentElement.dataset.ready === 'true');

test('privacyverklaring: in elke taal, met verantwoordelijke, contactadres, datum en de verplichte onderdelen', async ({ page }) => {
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
  await page.goto('./privacy.html');
  await pageReady(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await expect(page.locator('h1')).toHaveText('Privacyverklaring');
  await expect(page.locator('.langs button')).toHaveCount(10);
  const legal = await page.evaluate(async () => (await import('./js/i18n/legal/index.js')).LEGAL);
  expect(Object.keys(legal).sort()).toEqual([...CODES].sort());
  const shape = html => (html.match(/<\/?\w+/g) || []).join('');
  for (const code of CODES) {
    await page.locator(`.langs button[data-lang="${code}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    const T = legal[code].privacy;
    await expect(page.locator('h1')).toHaveText(T.title);
    await expect(page.locator('#page-text h2')).toHaveCount(11);
    const text = await page.locator('#page-text').innerText();
    // vaste gegevens en verplichte onderdelen (CLAUDE.md §5)
    expect(text, `${code}: verantwoordelijke`).toContain('Studio Sedillo');
    expect(text, `${code}: contactadres`).toContain(MAIL);
    expect(text, `${code}: naam van het spel`).toContain('The Flush Factor');
    expect(text, `${code}: datum (2026)`).toContain('2026');
    for (const must of ['GitHub', 'Gmail', 'Google', 'EU-U.S. Data Privacy Framework', 'Autoriteit Persoonsgegevens', 'HTTPS', '6']) expect(text, `${code}: ${must}`).toContain(must);
    expect(text, `${code}: geen invulplek blijven staan`).not.toMatch(/\{\w+\}/);
    expect(emojiIn(text)).toEqual([]);
    // zelfde opbouw en dezelfde links als de Nederlandse brontekst
    T.sections.forEach((s, i) => expect(shape(s[1]), `${code}: sectie ${i + 1} heeft dezelfde opbouw als nl`).toBe(shape(legal.nl.privacy.sections[i][1])));
    const links = await page.locator('#page-text a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(links).toEqual(expect.arrayContaining([`mailto:${MAIL}`, 'https://policies.google.com/privacy', 'delete.html']));
    // niets valt buiten de pagina
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${code}: geen horizontaal scrollen`).toBe(true);
  }
  // de taalkeuze is dezelfde als in het spel
  await page.locator('.langs button[data-lang="fr"]').click();
  await page.locator('.back').first().click();
  await page.waitForFunction(() => window.__game?.ready === true, null, { timeout: 60_000 });
  expect(await page.evaluate(() => window.__game.snapshot().language)).toBe('fr');
  expect(problems).toEqual([]);
});

test('verwijderpagina: /delete in elke taal, en /verwijderen stuurt door', async ({ page }) => {
  await page.goto('./verwijderen.html?lang=de');
  await page.waitForURL(/delete\.html\?lang=de$/);
  await pageReady(page);
  await expect(page.locator('h1')).toHaveText('Daten löschen');
  const legal = await page.evaluate(async () => (await import('./js/i18n/legal/index.js')).LEGAL);
  const strings = await page.evaluate(async () => (await import('./js/i18n/index.js')).STRINGS);
  for (const code of CODES) {
    await page.locator(`.langs button[data-lang="${code}"]`).click();
    await expect(page.locator('h1')).toHaveText(legal[code].delete.title);
    await expect(page.locator('#page-text h2')).toHaveCount(5);
    const text = await page.locator('#page-text').innerText();
    expect(text).toContain(MAIL);
    expect(text).toContain('FlushFactor');                          // de naam onder het icoon, in het Android-pad
    expect(text).not.toMatch(/\{\w+\}/);
    // de pagina noemt de knoppen precies zoals ze in het spel heten
    expect(text, `${code}: "Profiel verwijderen" zoals in het spel`).toContain(strings[code]['data.deleteProfile']);
    expect(text, `${code}: "Alle gegevens verwijderen" zoals in het spel`).toContain(strings[code]['data.wipe']);
    await expect(page.locator('.back').first()).toHaveText(strings[code]['page.backToApp']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test('adressen zonder .html werken (zoals op GitHub Pages): /privacy en /delete', async ({ page }) => {
  for (const [url, title] of [['./privacy', 'Privacyverklaring'], ['./delete', 'Gegevens verwijderen']]) {
    await page.goto(url);
    await pageReady(page);
    await expect(page.locator('h1')).toHaveText(title);
  }
});

test('vanuit het spel: links naar privacy en verwijderen, en "Gemaakt door Studio Sedillo" met contactadres in de credits', async ({ page }) => {
  await openGame(page);
  await page.locator('#score-bubble').click();
  await expect(page.locator('.data-links a[href="privacy.html"]')).toHaveText('Privacyverklaring');
  await expect(page.locator('.data-links a[href="delete.html"]')).toBeVisible();
  await page.locator('#btn-profile-close').click();
  await page.locator('#btn-menu').click();
  await page.locator('#main-menu [data-action="credits"]').click();
  await expect(page.locator('.credits-made')).toHaveText('Gemaakt door Studio Sedillo');
  await expect(page.locator(`.credits-contact a[href="mailto:${MAIL}"]`)).toBeVisible();
  await page.evaluate(() => window.__game.setLanguage('en'));
  await expect(page.locator('.credits-made')).toHaveText('Made by Studio Sedillo');
  // op het welkomstscherm staan de knoppen voor gegevens nog niet (er is nog niets om te wissen)
});
