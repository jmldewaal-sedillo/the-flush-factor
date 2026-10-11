// Punt 94: talen zoals in Sudoku Kids. Zelfde lijst, zelfde keuzelijst in het menu, standaard de taal van het
// toestel en anders Engels. Elke taal is compleet en niets valt buiten zijn knop of vak.
const { test, expect } = require('@playwright/test');
const { openGame, until, setView, expectNoProblems, emojiIn, SAVE_KEY, SETTINGS_KEY } = require('./helpers');

// Dezelfde lijst en volgorde als in Sudoku Kids (i18n.js daar).
const LANGUAGES = [
  ['nl', 'Nederlands'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'],
  ['pt', 'Português'], ['it', 'Italiano'], ['pl', 'Polski'], ['tr', 'Türkçe'], ['id', 'Bahasa Indonesia'],
];
const CODES = LANGUAGES.map(l => l[0]);
const snap = page => page.evaluate(() => window.__game.snapshot());
const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
// Rijk gevulde spelstand: alles wat tekst toont is er (vuil, voorraad, gereedschap, decoratie).
const RICH = {
  version: 4, score: 1450, highScore: 20500, level: 3, streak: 4, bestStreak: 31,
  toilet: { defects: { seat: true }, dirt: 1 }, purchased: ['sponge', 'toilet-brush', 'mop', 'spray', 'bucket-wood', 'deco-mirror'],
  supplies: { sponge: 4, 'toilet-brush': 6, mop: 2, spray: 10 }, decor: { wallBack: 'deco-mirror' },
  ownedTools: ['plunger', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'toilet-snake', 'magic-wand', 'disco-ball'],
  toolDiscovery: { plunger: 'working', 'rubber-duck': 'chaos' }, bucketItems: [{ id: 'duck', liters: 1 }],
  stains: [{ id: 'w1', surface: 'wall-back', look: 'splat', u: 0.2, v: 1.7, size: 0.36, turn: 1, dirt: 1 }],
  stats: { totalFlushes: 12345, totalUnclogs: 321, totalLiters: 456.5 },
};

// Tekst die buiten zijn vak valt: elke regel tekst moet binnen het scherm staan en binnen het dichtstbijzijnde
// "vak" (knop, kaart, label, menu, paneel). → lijst met overtredingen.
function overflowing() {
  const BOX = 'button, select, .tag, .featured-tag, .badge, .price-tag, .popover, .shop-card, .shop-category-header, .shop-featured, .shop-progress, #score-bubble, #status-msg, #shop-message, #clog-warning, #unclog-banner, #levelup-banner, #dirt-pill, #bucket-liters, .count-badge, .uses, #tool-tip, #clean-tray, #profile-content, #credits-content, .menu-item, .auth-btn, .soon, #fatal, .dialog-panel, .data-btn, textarea, .field-label';
  const visible = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (e.hidden || s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
  const out = [], vw = innerWidth, TOL = 1.5;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest('script, style, #pv-root, option') || !visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const box = el.closest(BOX);
    const b = box ? box.getBoundingClientRect() : null;
    const scrolls = box ? /(auto|scroll)/.test(getComputedStyle(box).overflowY) : false;
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      let why = null;
      if (r.left < -TOL || r.right > vw + TOL) why = 'buiten het scherm';
      else if (b && (r.left < b.left - TOL || r.right > b.right + TOL)) why = 'breder dan zijn vak';
      else if (b && !scrolls && (r.top < b.top - TOL || r.bottom > b.bottom + TOL)) why = 'hoger dan zijn vak';
      if (why) { out.push(`${why}: "${text.slice(0, 40)}" in ${box ? (box.id ? '#' + box.id : '.' + [...box.classList].join('.')) : el.tagName}`); break; }
    }
  }
  return [...new Set(out)];
}

test('zelfde talen als Sudoku Kids, elke taal heeft elke sleutel, dezelfde invulplekken en geen emoji', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'bronscan hoeft maar één keer');
  await openGame(page);
  const { languages, strings } = await page.evaluate(async () => { const m = await import('./js/i18n/index.js'); return { languages: m.LANGUAGES, strings: m.STRINGS }; });
  expect(languages).toEqual(LANGUAGES);
  expect(Object.keys(strings).sort()).toEqual([...CODES].sort());
  const keys = Object.keys(strings.nl);
  expect(keys.length).toBeGreaterThan(250);
  for (const code of CODES) {
    const s = strings[code];
    expect(Object.keys(s).filter(k => !(k in strings.nl)), `${code}: sleutels die niet in nl staan`).toEqual([]);
    expect(keys.filter(k => !(k in s)), `${code}: ontbrekende sleutels`).toEqual([]);
    for (const k of keys) {
      const a = strings.nl[k], b = s[k];
      if (Array.isArray(a)) {
        expect(Array.isArray(b) && b.length === a.length, `${code} ${k}: evenveel meldingen als nl`).toBe(true);
        for (const line of b) expect(typeof line === 'string' && line.trim().length > 0, `${code} ${k}: lege melding`).toBe(true);
      } else {
        expect(typeof b === 'string' && b.trim().length > 0, `${code} ${k}: lege tekst`).toBe(true);
        expect(placeholders(b), `${code} ${k}: invulplekken`).toBe(placeholders(a));
      }
    }
    expect(emojiIn(JSON.stringify(s)), `${code}: emoji in de teksten`).toEqual([]);
    // niet stiekem Nederlands gebleven: de meeste teksten verschillen van nl
    if (code !== 'nl') expect(keys.filter(k => JSON.stringify(s[k]) === JSON.stringify(strings.nl[k])).length, `${code}: teksten gelijk aan nl`).toBeLessThan(keys.length * 0.2);
  }
  // en de data bevat zelf geen teksten meer
  const data = await page.evaluate(async () => {
    const [t, c, b, k, s] = await Promise.all(['tools', 'cosmetics', 'buckets', 'care', 'shop'].map(f => import(`./js/data/${f}.js`)));
    return [...t.TOOLS, ...c.TOILETS, ...c.TILES, ...c.FLOORS, ...c.DECORATIONS, ...b.BUCKETS, ...k.REPAIRS, ...k.CLEANERS, ...s.SHOP_CATEGORIES];
  });
  for (const item of data) {
    for (const field of ['name', 'description', 'short', 'label', 'blurb']) expect(item[field], `${item.id}.${field} hoort in de taalbestanden`).toBeUndefined();
    if (!('source' in item)) for (const k of ['name', 'desc']) expect(strings.nl[`item.${item.id}.${k}`], `item.${item.id}.${k}`).toBeTruthy();
  }
});

test.describe('standaardtaal', () => {
  for (const [locale, expected] of [['de-DE', 'de'], ['pt-BR', 'pt'], ['id-ID', 'id'], ['ja-JP', 'en'], ['sv-SE', 'en']]) {
    test.describe(locale, () => {
      test.use({ locale });
      test(`toestel in ${locale}: het spel start in ${expected}`, async ({ page }, info) => {
        test.skip(info.project.name !== 'phone-portrait', 'één formaat is genoeg');
        await openGame(page, { firstStart: true });
        expect((await snap(page)).language).toBe(expected);
        await expect(page.locator('html')).toHaveAttribute('lang', expected);
        const title = await page.evaluate(async code => (await import('./js/i18n/index.js')).STRINGS[code]['profile.welcomeTitle'], expected);
        await expect(page.locator('#profile-title')).toHaveText(title);
      });
    });
  }
});

test('taal kiezen in het menu: keuzelijst met alle talen, alles wisselt meteen, en de keuze blijft bewaard', async ({ page }) => {
  const problems = await openGame(page, { save: RICH });
  expect((await snap(page)).language).toBe('nl');                                  // de tests draaien op een Nederlands toestel
  await page.locator('#btn-menu').click();
  const select = page.locator('#setting-language');
  await expect(select).toBeVisible();
  expect(await select.locator('option').evaluateAll(os => os.map(o => [o.value, o.textContent]))).toEqual(LANGUAGES);
  await expect(select).toHaveValue('nl');
  await expect(page.locator('#main-menu [data-action="fullscreen"]')).toHaveText('Volledig scherm');

  await select.selectOption('de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#main-menu')).toBeVisible();                           // kiezen sluit het menu niet
  await expect(page.locator('#main-menu [data-action="fullscreen"]')).toHaveText('Vollbild');
  await expect(page.locator('#high-score')).toContainText('Bestwert');
  await expect(page.locator('#dirt-pill')).toContainText('dreckig');
  await expect(page.locator('#btn-shop')).toHaveAttribute('aria-label', 'Laden');
  await expect(page.locator('.tool-btn[data-id="plunger"]')).toHaveAttribute('aria-label', 'Pömpel');
  await expect(page.locator('#camera-menu [data-view="bucket"]')).toHaveText('Eimer');
  await page.keyboard.press('Escape');
  await page.locator('#btn-shop').click();
  await expect(page.locator('.shop-header h2')).toHaveText('Laden');
  await page.locator('.shop-category[data-cat="care"] .shop-category-header').click();
  await expect(page.locator('.shop-card[data-id="sponge"] .shop-card-name')).toHaveText('Schwamm');
  // wisselen terwijl de winkel openstaat tekent hem opnieuw
  await page.evaluate(() => window.__game.setLanguage('fr'));
  await expect(page.locator('.shop-card[data-id="sponge"] .shop-card-name')).toHaveText('Éponge');
  await expect(page.locator('.shop-header h2')).toHaveText('Boutique');
  await page.locator('#btn-shop-close').click();

  // bewaard na herladen, ook al staat het toestel op Nederlands
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).language).toBe('fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('#high-score')).toContainText('Record');
  expect(JSON.parse(await page.evaluate(k => localStorage.getItem(k), SETTINGS_KEY)).language).toBe('fr');     // de taal hoort bij het toestel
  expect(await page.evaluate(() => window.__game.missingTexts())).toEqual([]);
  expectNoProblems(problems);
});

// Elke taal: alle schermen langs, geen ontbrekende teksten, niets buiten zijn knop of vak.
for (const [code, name] of LANGUAGES) {
  test(`${name} (${code}): alle schermen compleet en alles past`, async ({ page }, info) => {
    // Het smalste formaat krijgt elke taal; op de andere formaten de talen met de langste woorden.
    test.skip(info.project.name !== 'phone-portrait' && !['de', 'pl', 'fr'].includes(code), 'elke taal op het smalste formaat; lange talen ook op de rest');
    const problems = await openGame(page, { save: { ...RICH, language: code } });
    expect((await snap(page)).language).toBe(code);
    const strings = await page.evaluate(async c => (await import('./js/i18n/index.js')).STRINGS[c], code);
    const bad = [];
    const check = async label => { for (const line of await page.evaluate(overflowing)) bad.push(`${label} — ${line}`); };

    // spelscherm, met de langste melding in beeld
    await expect(page.locator('#high-score')).toHaveText(strings.best.replace('{n}', await page.locator('#high-score').evaluate(e => e.textContent.replace(/^\D*/, ''))));
    await page.evaluate(() => window.__game.setCleaner('mop'));
    await expect(page.locator('#status-msg')).toHaveText(strings['care.pick'].replace('{name}', strings['item.mop.name']));
    await check('spelscherm');
    await page.evaluate(() => window.__game.setCleaner(null));

    // menu's
    await page.locator('#btn-menu').click();
    await expect(page.locator('#main-menu [data-action="camera-reset"]')).toHaveText(strings['menu.cameraReset']);
    await check('hoofdmenu');
    await page.locator('#btn-camera').click();
    await expect(page.locator('#camera-menu [data-view="wallBack"]')).toHaveText(strings['view.wallBack']);
    await check('cameramenu');
    await page.locator('#btn-clean').click();
    await expect(page.locator('#clean-tray .clean-option')).toHaveCount(4);
    await check('schoonmaakmenu');
    await page.keyboard.press('Escape');

    // banners: level-up (met "nieuw in de winkel") en ontstopt
    await page.evaluate(() => window.__game.setScore(1600));
    await expect(page.locator('#levelup-banner')).toContainText(strings['level.4'].toLocaleUpperCase(code));
    await check('level-up');
    await setView(page, 'bucket');
    await check('emmerweergave');
    await page.locator('#btn-back').click();

    // winkel: alle categorieën open, en de langste melding
    await page.locator('#btn-shop').click();
    await expect(page.locator('.shop-header h2')).toHaveText(strings['shop.title']);
    await page.evaluate(() => document.querySelectorAll('.shop-category-header[aria-expanded="false"]').forEach(h => h.click()));
    await expect(page.locator('.shop-category-header[aria-expanded="false"]')).toHaveCount(0);
    await expect(page.locator('.shop-card[data-id="pressure-washer"] .shop-card-name')).toHaveText(strings['item.pressure-washer.name']);
    await page.locator('.shop-card[data-id="toilet-cleaner"]').click();                 // 300 punten: kopen
    await expect(page.locator('#shop-message')).toHaveText(strings['shop.cleanerBought'].replace('{name}', strings['item.toilet-cleaner.name']));
    await check('winkel');
    await page.locator('#btn-shop-close').click();

    // profiel en credits
    await page.locator('#score-bubble').click();
    await expect(page.locator('#profile-title')).toHaveText(strings['profile.title']);
    await page.locator('.auth-btn').first().click();
    await expect(page.locator('#profile-status')).toHaveText(strings['profile.authSoon']);
    await check('profiel');
    // gegevens: overzetten en verwijderen (dialogen)
    await expect(page.locator('#btn-wipe')).toHaveText(strings['data.wipe']);
    await page.locator('#btn-transfer').click();
    await page.locator('#btn-export').click();
    await expect(page.locator('#btn-import')).toHaveText(strings['data.importBtn']);
    await page.locator('#import-code').fill('x');
    await page.locator('#btn-import').click();
    await expect(page.locator('#transfer-status')).toHaveText(strings['data.importBad']);
    await check('voortgang overzetten');
    await page.locator('#btn-transfer-close').click();
    await page.locator('#btn-wipe').click();
    await expect(page.locator('#confirm-text')).toHaveText(strings['data.wipeText']);
    await check('alles verwijderen?');
    await page.locator('#confirm-no').click();
    await page.locator('#btn-delete-profile').click();
    await expect(page.locator('#confirm-yes')).toHaveText(strings['data.deleteProfileYes']);
    await check('profiel verwijderen?');
    await page.locator('#confirm-no').click();
    await page.locator('#btn-profile-close').click();
    await page.locator('#btn-menu').click();
    await page.locator('#main-menu [data-action="credits"]').click();
    await expect(page.locator('.credits-made')).toHaveText(strings['credits.madeBy']);
    await check('credits');
    await page.locator('#btn-credits-close').click();

    // welkomstscherm (eerste start)
    await page.evaluate(k => { const d = JSON.parse(localStorage.getItem(k)); delete d.profile; localStorage.setItem(k, JSON.stringify(d)); }, SAVE_KEY);
    await page.reload();
    await until(page, () => window.__game?.ready);
    await expect(page.locator('#profile-title')).toHaveText(strings['profile.welcomeTitle']);
    await expect(page.locator('#profile-submit')).toHaveText(strings['profile.playAsGuest']);
    await check('welkomstscherm');

    expect(bad, `tekst die niet past (${name})`).toEqual([]);
    // geen ontbrekende teksten, en nergens een kale sleutel in beeld
    expect(await page.evaluate(() => window.__game.missingTexts()), 'ontbrekende teksten').toEqual([]);
    const shown = await page.evaluate(() => document.body.innerText);
    expect(shown).not.toMatch(/\b(item|shop|care|menu|profile|cat|view|anchor|credits|stat|level|data|page)\.[a-z][\w.-]+\b(?!\.com)/);
    expectNoProblems(problems);
  });
}

test('noodmelding als het spel niet kan starten komt ook uit de taalbestanden', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'één formaat is genoeg');
  await page.route('**/js/game.js', route => route.abort());
  await page.goto('./?quality=low&clogs=off');
  await expect(page.locator('#fatal')).toBeVisible();
  await expect(page.locator('#fatal-title')).toHaveText('Het spel kon niet starten');
});
