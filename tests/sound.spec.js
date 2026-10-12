// Punt 96: geluiden. Ze worden pas na de eerste tik geladen, zonder fouten, horen elk bij een moment in het
// spel, en volgen de instellingen uit het menu (aan/uit en volume, bewaard bij het profiel).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, until, clogAndFix, expectNoProblems, SAVE_KEY } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const snap = page => page.evaluate(() => window.__game.snapshot());
const audio = page => page.evaluate(() => window.__game.sound());
const soundReady = page => until(page, () => window.__game.sound().state === 'ready');
// Bestanden uit assets/sounds/ die de pagina heeft opgevraagd.
function trackSounds(page) {
  const list = [];
  page.on('request', r => { const m = r.url().match(/\/assets\/sounds\/([^?]+)/); if (m) list.push(m[1]); });
  return list;
}
const setVolume = (page, pct) => page.locator('#setting-volume').evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, pct);

test('geluiden laden pas na de eerste tik, allemaal en zonder fouten', async ({ page }) => {
  const requested = trackSounds(page);
  const problems = await openGame(page);
  expect((await audio(page)).state, 'vóór de eerste tik is er niets gedaan').toBe('idle');
  expect(requested).toEqual([]);

  await page.locator('#btn-menu').click();
  await soundReady(page);
  const a = await audio(page);
  expect(a.errors).toEqual([]);
  expect(a.loaded).toEqual({ flush: 1, overflow: 1, unclog: 1, chaos: 1, 'bucket-soft': 3, 'bucket-hard': 3, 'bucket-heavy': 3 });
  expect(requested.sort()).toEqual(fs.readdirSync(path.join(ROOT, 'assets/sounds')).sort());
  // de spoelbeurt duurt 1,8 s (punt 68): het geluid dekt die en loopt daarna kort uit
  const flushAnim = await page.evaluate(() => window.__game.three.flush().seconds);
  expect(a.durations.flush[0]).toBeGreaterThanOrEqual(flushAnim);
  expect(a.durations.flush[0]).toBeLessThanOrEqual(flushAnim + 1);
  expectNoProblems(problems);
});

test('elk moment heeft zijn geluid: spoelen, overlopen, ontstoppen, chaos en de emmer per soort voorwerp', async ({ page }) => {
  const problems = await openGame(page);
  await page.locator('#flush-btn').click();
  await soundReady(page);
  // de allereerste tik laadt de geluiden pas; vanaf nu klinkt elke spoelbeurt
  await until(page, () => !window.__game.three.flush().active);
  const before = (await audio(page)).played.flush || 0;
  await page.locator('#flush-btn').click();
  expect((await audio(page)).played.flush).toBe(before + 1);

  // overlopen: het borrelen loopt mee zolang het overloopt en stopt daarna
  await page.evaluate(() => { window.__game.forceClog('sock'); window.__game.setWater(99.9); });
  await until(page, () => window.__game.snapshot().overflowing && window.__game.sound().playing.includes('overflow'));
  await until(page, () => !window.__game.snapshot().overflowing && !window.__game.sound().playing.includes('overflow'));

  // ontstoppen: plop + wegspoelen, en de sok valt zacht in de emmer
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.setWater(1); });
  await page.evaluate(() => document.querySelector('.tool-btn[data-id="plunger"]').click());
  await until(page, () => !window.__game.snapshot().clogged && !window.__game.three.effectsBusy() && !window.__game.three.propInBowl());
  let a = await audio(page);
  expect(a.played.unclog).toBe(1);
  expect(a.played['bucket-soft']).toBe(1);

  // hard en zwaar klinken anders; drie varianten, nooit twee keer dezelfde achter elkaar
  await clogAndFix(page, 'key');
  const first = (await audio(page)).last['bucket-hard'];
  await clogAndFix(page, 'phone');
  a = await audio(page);
  expect(a.played['bucket-hard']).toBe(2);
  expect(a.last['bucket-hard']).not.toBe(first);
  await clogAndFix(page, 'brick');
  expect((await audio(page)).played['bucket-heavy']).toBe(1);

  // chaos-gereedschap: een eigen geluid, geen plop
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.forceClog('duck'); });
  await until(page, () => window.__game.three.propInBowl());
  await page.evaluate(() => document.querySelector('.tool-btn[data-id="rubber-duck"]').click());
  a = await audio(page);
  expect(a.played.chaos).toBe(1);
  expect(a.played.unclog).toBe(4);
  expectNoProblems(problems);
});

test('menu: geluid aan/uit en volume werken meteen en zijn na herladen onthouden (bij het profiel)', async ({ page }) => {
  const requested = trackSounds(page);
  const problems = await openGame(page);
  expect((await snap(page)).sound).toEqual({ on: true, volume: 0.8 });

  await page.locator('#btn-menu').click();
  await soundReady(page);
  await expect(page.locator('#btn-sound')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sound-state')).toHaveText('Aan');
  await expect(page.locator('#setting-volume')).toHaveValue('80');
  await setVolume(page, 40);
  await until(page, () => Math.abs(window.__game.sound().gain - 0.4) < 0.01);

  // uit: het menu blijft open, de schuif is uit, er klinkt niets meer
  await page.locator('#btn-sound').click();
  await expect(page.locator('#main-menu')).toBeVisible();
  await expect(page.locator('#btn-sound')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#sound-state')).toHaveText('Uit');
  await expect(page.locator('#setting-volume')).toBeDisabled();
  await until(page, () => window.__game.sound().gain < 0.01);
  await page.keyboard.press('Escape');
  const played = (await audio(page)).played.flush || 0;
  await page.locator('#flush-btn').click();
  expect((await audio(page)).played.flush || 0).toBe(played);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).sound, SAVE_KEY)).toEqual({ on: false, volume: 0.4 });

  // herladen: onthouden, en zolang het uit staat wordt er niets opgehaald
  requested.length = 0;
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).sound).toEqual({ on: false, volume: 0.4 });
  await page.locator('#btn-menu').click();
  await expect(page.locator('#btn-sound')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#setting-volume')).toHaveValue('40');
  expect((await audio(page)).state).toBe('unlocked');
  expect(requested).toEqual([]);

  // weer aan: nu wordt er geladen, met het onthouden volume
  await page.locator('#btn-sound').click();
  await soundReady(page);
  const a = await audio(page);
  expect(a.errors).toEqual([]);
  await until(page, () => Math.abs(window.__game.sound().gain - 0.4) < 0.01);
  await page.keyboard.press('Escape');
  await page.locator('#flush-btn').click();
  expect((await audio(page)).played.flush).toBe(1);
  expectNoProblems(problems);
});

test('geluiden zijn klein, staan allemaal in de data en hebben elk een bron en licentie', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'bronscan hoeft maar één keer');
  const dir = path.join(ROOT, 'assets/sounds');
  const files = fs.readdirSync(dir);
  const data = fs.readFileSync(path.join(ROOT, 'js/data/sounds.js'), 'utf8');
  const credits = fs.readFileSync(path.join(ROOT, 'docs/credits.md'), 'utf8');
  let total = 0;
  for (const f of files) {
    const size = fs.statSync(path.join(dir, f)).size;
    total += size;
    expect(f, 'alleen mp3').toMatch(/^[a-z0-9-]+\.mp3$/);
    expect(size, `${f} is klein genoeg voor mobiel`).toBeLessThan(60_000);
    expect(data, `${f} staat in js/data/sounds.js`).toContain(`'${f}'`);
    // docs/credits.md noemt elk bestand, eventueel als reeks ("bucket-soft-1…3.mp3")
    expect(credits, `${f} staat in docs/credits.md`).toContain(f.replace(/-[123]\.mp3$/, '-1…3.mp3'));
  }
  expect(total, 'alle geluiden samen').toBeLessThan(200_000);

  // het credits-scherm: een groep Geluiden, elk geluid CC0 met een link naar de bron
  await openGame(page);
  await page.locator('#btn-menu').click();
  await page.locator('#main-menu [data-action="credits"]').click();
  const group = page.locator('#credits-list h3', { hasText: 'Geluiden' });
  await expect(group).toBeVisible();
  const items = await group.locator('xpath=following-sibling::ul[1]/li').allTextContents();
  expect(items).toHaveLength(6);
  for (const text of items) expect(text).toMatch(/CC0/);
  for (const url of ['freesound.org/people/lorenzgillner/sounds/274448/', 'freesound.org/people/pillwave/sounds/423959/', 'freesound.org/people/Breviceps/sounds/447910/', 'freesound.org/people/brittmosel/sounds/529300/', 'freesound.org/people/Breviceps/sounds/468441/', 'kenney.nl/assets/impact-sounds']) {
    expect(credits).toContain(url);
    await expect(page.locator(`#credits-list a[href="https://${url}"]`)).toHaveCount(1);
  }
});
