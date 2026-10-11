// Opslag (CLAUDE.md §5): alles onder de prefix flushfactor., oude sleutels worden overgezet, en de speler
// kan zijn voortgang meenemen, zijn profiel verwijderen en alle gegevens van de app verwijderen.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, until, ready, expectNoProblems, PROFILE, SAVE_KEY, SETTINGS_KEY, LEGACY_SAVE_KEY } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const snap = page => page.evaluate(() => window.__game.snapshot());
const allKeys = page => page.evaluate(() => Object.keys(localStorage).sort());
const PROGRESS = { version: 4, score: 1234, highScore: 2000, level: 3, purchased: ['bucket-wood', 'sponge'], supplies: { sponge: 4 }, bucketId: 'bucket-wood', toilet: { defects: {}, dirt: 0 }, stats: { totalFlushes: 77 } };
async function openData(page) {
  await page.locator('#score-bubble').click();
  await expect(page.locator('#profile-data-block')).toBeVisible();
}

test('sleutels: alles begint met flushfactor. en staat in docs/privacy-audit.md', async ({ page }) => {
  const problems = await openGame(page, { save: PROGRESS });
  // iets doen dat elke soort opslag raakt: spoelen, winkel open, gereedschap inklappen, taal kiezen
  await page.locator('#flush-btn').click();
  await page.locator('#btn-tools-toggle').click();
  await page.locator('#btn-shop').click();
  await page.locator('.shop-category[data-cat="tools"] .shop-category-header').click();
  await page.locator('#btn-shop-close').click();
  await page.evaluate(() => window.__game.setLanguage('en'));
  const keys = await allKeys(page);
  expect(keys).toEqual(['flushfactor.profile.p1.game', 'flushfactor.profiles', 'flushfactor.settings']);
  const audit = fs.readFileSync(path.join(ROOT, 'docs/privacy-audit.md'), 'utf8');
  for (const k of keys) expect(audit, `${k} staat in docs/privacy-audit.md`).toContain(`\`${k}\``);
  const settings = JSON.parse(await page.evaluate(k => localStorage.getItem(k), SETTINGS_KEY));
  expect(settings).toMatchObject({ language: 'en', toolsOpen: false, shopOpen: ['tools'] });
  for (const k of Object.keys(settings)) expect(audit, `instelling ${k} staat in docs/privacy-audit.md`).toContain(`\`${k}\``);
  // niets in sessionStorage (behalve de markering van de test zelf), geen cookies, geen IndexedDB
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(k => k !== '__seeded'))).toEqual([]);
  expect(await page.evaluate(() => document.cookie)).toBe('');
  expect(await page.evaluate(async () => (await indexedDB.databases?.() || []).length)).toBe(0);
  expectNoProblems(problems);
});

test('alleen js/storage.js raakt de opslag aan', async ({}, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'bronscan hoeft maar één keer');
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!/vendor|utils/.test(rel)) walk(rel); } else if (rel.endsWith('.js')) files.push(rel);
    }
  })('js');
  // phone-preview.js en boot.js zijn geen modules en draaien vóór het spel: zij lezen alleen flushfactor.settings.
  const allowed = { 'js/storage.js': /./, 'js/phone-preview.js': /flushfactor\.settings|flushfactor_preview_|SETTINGS/, 'js/boot.js': /flushfactor\.settings/ };
  for (const f of files) {
    const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').filter(l => /\b(localStorage|sessionStorage|indexedDB)\b|\bcaches\./.test(l) && !/^\s*\/\//.test(l));
    if (!allowed[f]) expect(lines, `${f} gebruikt de opslag rechtstreeks`).toEqual([]);
    else for (const l of lines) expect(l, `${f}: ${l.trim()}`).toMatch(allowed[f]);
  }
});

test('migratie: de oude sleutels (flushfactor_v1 enz.) worden overgezet en daarna gewist', async ({ page }) => {
  // opslag zoals het spel die tot en met Sprint 9 schreef
  const old = { version: 3, profile: PROFILE, score: 4321, highScore: 9000, level: 4, language: 'de', purchased: ['bucket-plastic', 'spray'], bucketId: 'bucket-plastic', ownedTools: ['plunger', 'hot-water', 'rubber-duck', 'confetti-cannon', 'magic-wand'], toilet: { defects: {}, dirt: 0 }, stats: { totalFlushes: 555, totalUnclogs: 40 } };
  await page.addInitScript(([key, data]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('flushfactor_shop_open', JSON.stringify(['care', 'buckets']));
    localStorage.setItem('flushfactor_tools_open', '0');
    localStorage.setItem('flushfactor_preview_mode', 'off');
    localStorage.setItem('andere_app', 'blijft staan');
  }, [LEGACY_SAVE_KEY, old]);
  const problems = await openGame(page, { firstStart: true });        // de eigen opslag hierboven blijft staan
  const s = await snap(page);
  expect(s).toMatchObject({ score: 4321, level: 4, bucketId: 'bucket-plastic', language: 'de', profile: { name: PROFILE.name, avatar: PROFILE.avatar } });
  expect(s.ownedTools).toEqual(old.ownedTools);
  expect(s.supplies).toEqual({ spray: 10 });
  expect(s.stats.totalFlushes).toBe(555);
  await expect(page.locator('body')).toHaveAttribute('data-tools', 'closed');     // ingeklapt gereedschap is meegekomen

  // de oude sleutels zijn weg, de nieuwe staan er, en wat niet van dit spel is blijft staan
  expect(await allKeys(page)).toEqual(['andere_app', 'flushfactor.profile.p1.game', 'flushfactor.profiles', 'flushfactor.settings']);
  const settings = JSON.parse(await page.evaluate(k => localStorage.getItem(k), SETTINGS_KEY));
  expect(settings).toMatchObject({ language: 'de', toolsOpen: false, shopOpen: ['care', 'buckets'], preview: { mode: 'off' } });
  expect(JSON.parse(await page.evaluate(k => localStorage.getItem(k), SAVE_KEY)).language, 'de taal hoort bij het toestel, niet in de spelstand').toBeUndefined();
  await page.locator('#btn-shop').click();
  await expect(page.locator('.shop-category[data-cat="care"] .shop-category-header')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#btn-shop-close').click();

  // na herladen is alles er nog, zonder de oude sleutel
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect(await snap(page)).toMatchObject({ score: 4321, level: 4, language: 'de' });
  expectNoProblems(problems);
});

test('migratie: een bestaande nieuwe spelstand wordt nooit overschreven door een achtergebleven oude sleutel', async ({ page }) => {
  await page.addInitScript(([key, data]) => {
    if (sessionStorage.getItem('__old')) return;
    sessionStorage.setItem('__old', '1');
    localStorage.setItem(key, JSON.stringify(data));
  }, [LEGACY_SAVE_KEY, { version: 3, profile: PROFILE, score: 5, level: 1 }]);
  await openGame(page, { save: { ...PROGRESS } });
  expect((await snap(page)).score).toBe(1234);
  expect(await allKeys(page)).not.toContain(LEGACY_SAVE_KEY);
});

test('voortgang overzetten: code maken, op een "ander toestel" terugzetten, en een foute code wordt geweigerd', async ({ page, context }) => {
  const problems = await openGame(page, { save: { ...PROGRESS, language: 'nl' } });
  await openData(page);
  await page.locator('#btn-transfer').click();
  await expect(page.locator('#transfer-dialog')).toBeVisible();
  await page.locator('#btn-export').click();
  const code = await page.locator('#export-code').inputValue();
  expect(code).toMatch(/^flushfactor1\.[A-Za-z0-9_-]+$/);
  // als bestand bewaren geeft dezelfde code
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-export-file').click()]);
  expect(download.suggestedFilename()).toBe('flushfactor-voortgang.txt');
  expect(fs.readFileSync(await download.path(), 'utf8')).toBe(code);

  // "ander toestel": een schone pagina met een andere, lege opslag
  const other = await context.newPage();
  await other.addInitScript(() => { if (!sessionStorage.getItem('__clean')) { sessionStorage.setItem('__clean', '1'); localStorage.clear(); } });
  await other.goto('./?quality=low&pixelratio=0.3&clogs=off');
  await ready(other);
  await other.locator('#profile-submit').click();                    // welkomstscherm: als gast beginnen
  expect((await snap(other)).score).toBe(0);
  await openData(other);
  await other.locator('#btn-transfer').click();

  // een foute code: melding, er verandert niets
  for (const bad of ['hallo', 'flushfactor1.AAAA', code.slice(0, 60), 'sudokukids1.' + code.slice(13)]) {
    await other.locator('#import-code').fill(bad);
    await other.locator('#btn-import').click();
    await expect(other.locator('#transfer-status')).toHaveText('Dit is geen geldige code van dit spel.');
    await expect(other.locator('#confirm-dialog')).toBeHidden();
  }
  expect((await snap(other)).score).toBe(0);

  // de goede code: eerst bevestigen; annuleren laat alles staan
  await other.locator('#import-code').fill(code);
  await other.locator('#btn-import').click();
  await expect(other.locator('#confirm-title')).toHaveText('Voortgang terugzetten?');
  await other.locator('#confirm-no').click();
  expect((await snap(other)).score).toBe(0);
  await other.locator('#btn-import').click();
  await other.locator('#confirm-yes').click();
  await expect(other.locator('#confirm-title')).toHaveText('De voortgang is teruggezet.');
  await other.locator('#confirm-yes').click();
  await until(other, () => window.__game?.ready === true && window.__game.snapshot().score === 1234);
  expect(await snap(other)).toMatchObject({ score: 1234, level: 3, bucketId: 'bucket-wood', supplies: { sponge: 4 }, profile: { name: PROFILE.name } });
  expect((await snap(other)).stats.totalFlushes).toBe(77);
  await other.close();
  expectNoProblems(problems);
});

test('profiel verwijderen: naam, voortgang en statistieken weg, de taal blijft', async ({ page }) => {
  await openGame(page, { save: { ...PROGRESS, language: 'en' } });
  await openData(page);
  await page.locator('#btn-delete-profile').click();
  await expect(page.locator('#confirm-title')).toHaveText('Delete profile?');
  await page.locator('#confirm-no').click();                         // annuleren: er gebeurt niets
  await expect(page.locator('#confirm-dialog')).toBeHidden();
  expect((await snap(page)).score).toBe(1234);

  await page.locator('#btn-delete-profile').click();
  await page.locator('#confirm-yes').click();
  await until(page, () => window.__game?.ready === true && window.__game.snapshot().profile === null);
  await expect(page.locator('#profile-screen')).toHaveAttribute('data-mode', 'welcome');   // begint opnieuw
  expect(await snap(page)).toMatchObject({ score: 0, level: 1, language: 'en' });
  expect(await allKeys(page)).toEqual(['flushfactor.settings']);
});

test.describe('met service worker', () => {
  test.use({ serviceWorkers: 'allow' });

test('alle gegevens verwijderen: geen enkele flushfactor-sleutel en geen cache meer over', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'één formaat is genoeg (de service worker cachet 38 MB)');
  // met de service worker aan, zodat er ook echt een cache is om te wissen
  await page.addInitScript(([key, data]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('flushfactor_tools_open', '1');            // ook een achtergebleven oude sleutel
    localStorage.setItem('andere_app', 'blijft staan');
  }, [SAVE_KEY, { version: 4, profile: PROFILE, score: 900, level: 2 }]);
  await page.goto('./?sw=on&clogs=off&quality=low&pixelratio=0.3');
  await ready(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
  await page.waitForFunction(async () => (await caches.keys()).some(k => k.startsWith('flushfactor-')));
  await page.locator('#flush-btn').click();

  await openData(page);
  await page.locator('#btn-wipe').click();
  await expect(page.locator('#confirm-title')).toHaveText('Alles verwijderen?');
  await page.locator('#confirm-yes').click();
  await expect(page.locator('#confirm-title')).toHaveText('Alles is verwijderd');
  // op dit moment, vóór het opnieuw starten: niets meer van dit spel op het toestel
  expect(await allKeys(page)).toEqual(['andere_app']);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  // en het spel schrijft niets terug terwijl de melding openstaat
  await page.evaluate(() => window.__game.setScore(50));
  expect(await allKeys(page)).toEqual(['andere_app']);

  await page.locator('#confirm-yes').click();                        // "Opnieuw beginnen"
  await until(page, () => window.__game?.ready === true);
  await expect(page.locator('#profile-screen')).toHaveAttribute('data-mode', 'welcome');
  expect((await snap(page)).score).toBe(0);
});
});
