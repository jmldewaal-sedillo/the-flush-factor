// Punten 96 en 102–106: geluiden en muziek. Alles wordt na de eerste tik vooraf geladen en gedecodeerd, start
// op het moment van het spel-event (binnen 50 ms), elk gereedschap heeft een eigen geluid, de muziek loopt
// naadloos door en gaat zachter bij belangrijke geluiden, en elke groep heeft een eigen regelaar.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, until, clogAndFix, expectNoProblems, SAVE_KEY, NEW_PLAYER } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'assets/sounds');
const MUSIC_FILE = 'music-deep-house.mp3';
const GROUPS = ['music', 'water', 'tools', 'bucket', 'ui'];
const DEFAULTS = { muted: false, groups: { music: { on: true, volume: 0.5 }, water: { on: true, volume: 0.8 }, tools: { on: true, volume: 0.8 }, bucket: { on: true, volume: 0.8 }, ui: { on: true, volume: 0.6 } } };
const ALL_TOOLS = ['plunger', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'toilet-snake', 'magic-wand', 'disco-ball', 'megaphone', 'drain-cleaner', 'tiny-elephant', 'ninja-unclogger', 'super-plunger', 'electric-plunger', 'hydro-jet', 'robot-arm'];

const snap = page => page.evaluate(() => window.__game.snapshot());
const audio = page => page.evaluate(() => window.__game.sound());
const soundReady = page => until(page, () => window.__game.sound().state === 'ready');
const musicPlaying = page => until(page, () => window.__game.sound().music.playing);
const idle = page => until(page, () => !window.__game.snapshot().clogged && !window.__game.three.effectsBusy() && !window.__game.three.propInBowl());
// Bestanden uit assets/sounds/ die de pagina heeft opgevraagd.
function trackSounds(page) {
  const list = [];
  page.on('request', r => { const m = r.url().match(/\/assets\/sounds\/([^?]+)/); if (m) list.push(m[1]); });
  return list;
}
const openSettings = async page => { await page.locator('#btn-menu').click(); await page.locator('#btn-sound').click(); await expect(page.locator('#sound-dialog')).toBeVisible(); };
const row = (page, group) => page.locator(`.sound-row[data-group="${group}"]`);
const setVolume = (page, group, pct) => row(page, group).locator('input').evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, pct);
const gainsAre = (page, want) => until(page, w => Object.entries(w).every(([id, v]) => Math.abs(window.__game.sound().gains[id] - v) < 0.01), want);

test('geluiden laden pas na de eerste tik, daarna allemaal vooraf gedecodeerd en zonder fouten', async ({ page }) => {
  const requested = trackSounds(page);
  const problems = await openGame(page);
  expect((await audio(page)).state, 'vóór de eerste tik is er niets gedaan').toBe('idle');
  expect(requested).toEqual([]);

  await page.locator('#btn-menu').click();
  await soundReady(page);
  await musicPlaying(page);
  const a = await audio(page);
  expect(a.errors).toEqual([]);
  // alles is er al vóórdat het nodig is: één buffer per bestand
  const effects = fs.readdirSync(DIR).filter(f => f !== MUSIC_FILE);
  expect(Object.values(a.loaded).reduce((sum, n) => sum + n, 0)).toBe(effects.length);
  expect(a.loaded).toMatchObject({ flush: 1, clog: 1, overflow: 1, unclog: 1, 'bucket-soft': 3, 'bucket-hard': 3, 'bucket-heavy': 3, 'bucket-empty': 1, scrub: 1, 'ui-click': 1, 'ui-buy': 1 });
  for (const id of ALL_TOOLS) expect(a.loaded[`tool-${id}`], `tool-${id}`).toBe(1);
  expect([...requested].sort()).toEqual(fs.readdirSync(DIR).sort());
  // de spoelbeurt duurt 1,8 s (punt 68): het geluid dekt die en loopt daarna kort uit
  const flushAnim = await page.evaluate(() => window.__game.three.flush().seconds);
  expect(a.durations.flush[0]).toBeGreaterThanOrEqual(flushAnim);
  expect(a.durations.flush[0]).toBeLessThanOrEqual(flushAnim + 1);
  // spelen haalt daarna niets meer op
  requested.length = 0;
  await page.locator('#btn-menu').click();
  await page.locator('#flush-btn').click();
  await clogAndFix(page, 'brick');
  expect(requested).toEqual([]);
  expectNoProblems(problems);
});

test('punt 102: elk geluid start op het moment van zijn spel-event (binnen 50 ms), zonder stilte vooraan', async ({ page }) => {
  const problems = await openGame(page, { save: { ...NEW_PLAYER, version: 4, score: 900, level: 1, supplies: { 'toilet-brush': 6 } } });
  await page.locator('#btn-menu').click();
  await soundReady(page);
  await page.keyboard.press('Escape');

  // verstopt raken: het geluid is gestart in dezelfde stap als de verstopping zelf (het voorwerp dat valt)
  const atClog = await page.evaluate(() => { window.__game.forceClog('duck'); const a = window.__game.sound(); return { played: a.played.clog || 0, propInBowl: window.__game.three.propInBowl(), clogged: window.__game.snapshot().clogged }; });
  expect(atClog).toEqual({ played: 1, propInBowl: true, clogged: true });

  // de rest van de events: gereedschap, ontstopt, emmer, emmer legen, spoelen, schoonmaken, knop, aankoop
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.setWater(1); });
  await page.evaluate(() => document.querySelector('.tool-btn[data-id="plunger"]').click());
  await idle(page);
  await page.locator('#flush-btn').click();
  await page.locator('#btn-bucket').click();
  await until(page, () => window.__game.three.view() === 'bucket');
  await page.locator('#btn-bucket-empty').click();
  await page.locator('#btn-back').click();
  await page.evaluate(() => { window.__game.setCleaner('toilet-brush'); window.__game.scrub({ kind: 'toilet' }); window.__game.setCleaner(null); });
  await page.locator('#btn-shop').click();
  await page.locator('.shop-category[data-cat="care"] .shop-category-header').click();
  await page.locator('.shop-card[data-id="mop"]').click();
  await page.locator('#btn-shop-close').click();

  const a = await audio(page);
  const names = [...new Set(a.delays.map(d => d.name))].sort();
  expect(names).toEqual(['bucket-empty', 'bucket-soft', 'clog', 'flush', 'scrub', 'tool-plunger', 'ui-buy', 'ui-click', 'unclog']);
  const worst = Math.max(...a.delays.map(d => d.ms));
  for (const d of a.delays) expect(d.ms, `${d.name}: tijd tussen het event en het starten van het geluid`).toBeLessThan(50);
  test.info().annotations.push({ type: 'vertraging', description: `grootste vertraging event → geluid: ${worst.toFixed(1)} ms over ${a.delays.length} geluiden` });
  // stilte vooraan een bestand wordt overgeslagen; in onze eigen bestanden zit er nauwelijks nog iets
  for (const [name, list] of Object.entries(a.leads)) for (const ms of list) expect(ms, `${name}: stilte vooraan (ms)`).toBeLessThan(60);
  expectNoProblems(problems);
});

test('punt 104: elk gereedschap heeft een eigen geluid; werkend → daarna het ontstopt-geluid, chaos → niet', async ({ page }) => {
  const problems = await openGame(page, { save: { version: 4, score: 0, level: 5, ownedTools: ALL_TOOLS, toilet: { defects: {}, dirt: 0 } } });
  const data = await page.evaluate(async () => {
    const tools = (await import('./js/data/tools.js')).TOOLS, s = await import('./js/data/sounds.js');
    return { tools: tools.map(t => ({ id: t.id, effect: t.effect, sound: t.sound, file: s.SOUNDS[t.sound]?.files.join(), group: s.SOUNDS[t.sound]?.group })), after: s.UNCLOG_AFTER_TOOL };
  });
  expect(data.tools.map(t => t.id).sort()).toEqual([...ALL_TOOLS].sort());
  for (const tool of data.tools) {
    expect(tool.file, `${tool.id} heeft een geluid in js/data/sounds.js`).toBeTruthy();
    expect(tool.group, `${tool.id} valt onder de regelaar Gereedschap`).toBe('tools');
    expect(fs.existsSync(path.join(DIR, tool.file)), `${tool.file} bestaat`).toBe(true);
  }
  expect(new Set(data.tools.map(t => t.sound)).size, 'geen twee gereedschappen delen een geluid').toBe(data.tools.length);
  expect(new Set(data.tools.map(t => t.file)).size, 'geen twee gereedschappen delen een geluidsbestand').toBe(data.tools.length);
  // ook de inhoud verschilt: geen kopie van hetzelfde bestand onder een andere naam
  expect(new Set(data.tools.map(t => fs.readFileSync(path.join(DIR, t.file)).toString('base64'))).size).toBe(data.tools.length);
  expect(data.after).toBeGreaterThan(0);

  await page.locator('#btn-menu').click();
  await soundReady(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tool-btn')).toHaveCount(16);
  for (const tool of data.tools) {
    await idle(page);
    const before = await audio(page);
    await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.forceClog('key'); window.__game.setWater(1); });
    const result = await page.evaluate(id => window.__game.useTool(id), tool.id);
    const after = await audio(page);
    const count = (a, name) => a.played[name] || 0;
    expect(count(after, tool.sound) - count(before, tool.sound), `${tool.id}: eigen geluid`).toBe(1);
    for (const other of data.tools.filter(t => t.id !== tool.id)) expect(count(after, other.sound), `${tool.id} laat niet het geluid van ${other.id} horen`).toBe(count(before, other.sound));
    if (tool.effect === 'working') {
      expect(result).toBe('resolved');
      expect(count(after, 'unclog') - count(before, 'unclog'), `${tool.id}: daarna het ontstopt-geluid`).toBe(1);
    } else {
      expect(result).toBe('chaos');
      expect(count(after, 'unclog'), `${tool.id}: chaos, geen ontstopt-geluid`).toBe(count(before, 'unclog'));
      await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.setWater(1); window.__game.useTool('plunger'); });
    }
  }
  expectNoProblems(problems);
});

test('overlopen borrelt zolang het overloopt; de emmer klinkt per soort voorwerp en bij het legen', async ({ page }) => {
  const problems = await openGame(page);
  await page.locator('#btn-menu').click();
  await soundReady(page);
  await page.keyboard.press('Escape');

  await page.evaluate(() => { window.__game.forceClog('sock'); window.__game.setWater(99.9); });
  await until(page, () => window.__game.snapshot().overflowing && window.__game.sound().playing.includes('overflow'));
  await until(page, () => !window.__game.snapshot().overflowing && !window.__game.sound().playing.includes('overflow'));
  await page.evaluate(() => { window.__game.resetCooldowns(); window.__game.setWater(1); window.__game.useTool('plunger'); });
  await idle(page);
  expect((await audio(page)).played['bucket-soft']).toBe(1);

  // hard en zwaar klinken anders; drie varianten, nooit twee keer dezelfde achter elkaar
  await clogAndFix(page, 'key');
  const first = (await audio(page)).last['bucket-hard'];
  await clogAndFix(page, 'phone');
  let a = await audio(page);
  expect(a.played['bucket-hard']).toBe(2);
  expect(a.last['bucket-hard']).not.toBe(first);
  await clogAndFix(page, 'brick');
  expect((await audio(page)).played['bucket-heavy']).toBe(1);

  // punt 103: legen heeft een eigen geluid; een lege emmer legen maakt geen geluid
  await page.locator('#btn-bucket').click();
  await until(page, () => window.__game.three.view() === 'bucket');
  await page.locator('#btn-bucket-empty').click();
  a = await audio(page);
  expect(a.played['bucket-empty']).toBe(1);
  expect((await snap(page)).bucketItems).toEqual([]);
  expectNoProblems(problems);
});

test('punt 105: muziek pas na het startscherm, naadloze lus, zachter bij spoelen en stil op de achtergrond', async ({ page }) => {
  const requested = trackSounds(page);
  const problems = await openGame(page, { firstStart: true });
  await expect(page.locator('#profile-screen')).toBeVisible();
  // een tik op het startscherm laadt de effecten, maar de muziek nog niet
  await page.locator('#profile-name').click();
  await soundReady(page);
  let a = await audio(page);
  expect(a.music).toMatchObject({ state: 'idle', allowed: false, playing: false });
  expect(requested).not.toContain(MUSIC_FILE);

  await page.locator('#profile-submit').click();
  await musicPlaying(page);
  a = await audio(page);
  expect(requested.filter(f => f === MUSIC_FILE)).toHaveLength(1);
  expect((await snap(page)).sound.groups.music, 'standaard aan').toEqual({ on: true, volume: 0.5 });
  expect(a.errors).toEqual([]);
  // de lus is precies 64 tellen (16 maten) lang, rond de 118 tellen per minuut; het bestand loopt iets langer
  // door, zodat de lus nooit eerder ophoudt dan de maat
  const loop = await page.evaluate(async () => (await import('./js/data/sounds.js')).MUSIC.seconds);
  expect(64 * 60 / loop, 'rustig tempo').toBeGreaterThan(110);
  expect(64 * 60 / loop).toBeLessThan(122);
  expect(a.music.loop[1] - a.music.loop[0]).toBeCloseTo(loop, 2);
  expect(a.music.seconds, 'het bestand is minstens zo lang als de lus').toBeGreaterThan(loop + 0.05);
  expect(a.music.seconds).toBeLessThan(loop + 0.4);
  expect(a.music.loop[0], 'de lus begint op de eerste tel').toBe(0);
  expect(fs.statSync(path.join(DIR, MUSIC_FILE)).size, 'klein bestand').toBeLessThan(1_000_000);

  // zachter tijdens het spoelen, daarna weer terug
  expect(a.music.duck).toBe(1);
  await page.locator('#flush-btn').click();
  await until(page, () => window.__game.sound().music.duck < 0.5);
  expect((await audio(page)).music.ducks).toBe(a.music.ducks + 1);
  await until(page, () => window.__game.sound().music.duck > 0.95);
  // een knop of iets in de emmer dempt de muziek niet
  const ducks = (await audio(page)).music.ducks;
  await page.locator('#btn-menu').click();
  await page.keyboard.press('Escape');
  expect((await audio(page)).music.ducks).toBe(ducks);

  // naar de achtergrond: alles pauzeert; terug: het gaat verder
  await until(page, () => window.__game.sound().context === 'running');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await until(page, () => window.__game.sound().context === 'suspended');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await until(page, () => window.__game.sound().context === 'running');
  expect((await audio(page)).music.playing).toBe(true);
  expectNoProblems(problems);
});

test('punt 106: elke regelaar raakt alleen zijn eigen groep; "Alle geluid uit" dempt alles; onthouden na herladen', async ({ page }) => {
  const requested = trackSounds(page);
  const problems = await openGame(page);
  expect((await snap(page)).sound).toEqual(DEFAULTS);
  await openSettings(page);
  await soundReady(page);
  await expect(page.locator('#sound-groups .sound-row')).toHaveCount(5);
  await expect(page.locator('#sound-groups .sound-name')).toHaveText(['Muziek', 'Toilet & water', 'Gereedschap', 'Emmer & schoonmaak', 'Interface (knoppen, winkel)']);
  await expect(page.locator('#btn-mute-all')).toHaveText('Alle geluid uit');
  await expect(page.locator('#btn-mute-all')).toHaveAttribute('aria-pressed', 'false');
  // het venster past op het scherm zonder te scrollen, ook liggend
  expect(await page.locator('#sound-dialog .dialog-panel').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  const start = { music: 0.5, water: 0.8, tools: 0.8, bucket: 0.8, ui: 0.6 };
  await gainsAre(page, start);

  // elke schuif: alleen zijn eigen groep verandert
  const want = { ...start };
  for (const [i, group] of GROUPS.entries()) {
    want[group] = (i + 1) * 0.1;
    await setVolume(page, group, (i + 1) * 10);
    await gainsAre(page, want);      // ook de andere vier: die staan nog precies waar ze stonden
  }
  // elke aan/uit-knop: alleen zijn eigen groep valt stil, en de schuif gaat uit
  for (const group of GROUPS) {
    await row(page, group).locator('.sound-toggle').click();
    await expect(row(page, group).locator('.sound-toggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(row(page, group).locator('input')).toBeDisabled();
    await gainsAre(page, { ...want, [group]: 0 });
    for (const other of GROUPS.filter(g => g !== group)) await expect(row(page, other).locator('input')).toBeEnabled();
    await row(page, group).locator('.sound-toggle').click();
    await gainsAre(page, want);
  }

  // een groep uit: zijn geluiden klinken niet, die van de andere groepen wel
  await row(page, 'tools').locator('.sound-toggle').click();
  await row(page, 'music').locator('.sound-toggle').click();
  await until(page, () => !window.__game.sound().music.playing);
  await page.locator('#btn-sound-close').click();
  await expect(page.locator('#sound-dialog')).toBeHidden();
  await clogAndFix(page, 'duck');
  let a = await audio(page);
  expect(a.played['tool-plunger'] || 0, 'gereedschap staat uit').toBe(0);
  expect(a.played.unclog, 'toilet & water staat aan').toBe(1);
  expect(a.played['bucket-soft'], 'emmer staat aan').toBe(1);

  // hoofdschakelaar: alles stil, de regelaars zijn uit maar houden hun stand
  await openSettings(page);
  await page.locator('#btn-mute-all').click();
  await expect(page.locator('#btn-mute-all')).toHaveAttribute('aria-pressed', 'true');
  await gainsAre(page, { music: 0, water: 0, tools: 0, bucket: 0, ui: 0 });
  for (const group of GROUPS) { await expect(row(page, group).locator('input')).toBeDisabled(); await expect(row(page, group).locator('.sound-toggle')).toBeDisabled(); }
  await expect(row(page, 'water').locator('input')).toHaveValue('20');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sound-dialog')).toBeHidden();
  const flushes = (await audio(page)).played.flush || 0;
  await page.locator('#flush-btn').click();
  expect((await audio(page)).played.flush || 0).toBe(flushes);
  await page.locator('#btn-menu').click();
  await expect(page.locator('#sound-state')).toHaveText('Uit');
  await page.keyboard.press('Escape');

  // bewaard bij het profiel, en na herladen terug; zolang alles uit staat wordt er niets opgehaald
  const saved = { muted: true, groups: { music: { on: false, volume: 0.1 }, water: { on: true, volume: 0.2 }, tools: { on: false, volume: 0.3 }, bucket: { on: true, volume: 0.4 }, ui: { on: true, volume: 0.5 } } };
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).sound, SAVE_KEY)).toEqual(saved);
  requested.length = 0;
  await page.reload();
  await until(page, () => window.__game?.ready);
  expect((await snap(page)).sound).toEqual(saved);
  await openSettings(page);
  expect((await audio(page)).state).toBe('unlocked');
  expect(requested).toEqual([]);
  await expect(page.locator('#btn-mute-all')).toHaveAttribute('aria-pressed', 'true');
  for (const [i, group] of GROUPS.entries()) await expect(row(page, group).locator('input')).toHaveValue(String((i + 1) * 10));

  // weer aan: nu wordt er geladen, met de onthouden standen; de muziek blijft uit en wordt niet opgehaald
  await page.locator('#btn-mute-all').click();
  await soundReady(page);
  await gainsAre(page, { music: 0, water: 0.2, tools: 0, bucket: 0.4, ui: 0.5 });
  a = await audio(page);
  expect(a.errors).toEqual([]);
  expect(a.music.state).toBe('idle');
  expect(requested).not.toContain(MUSIC_FILE);
  await row(page, 'music').locator('.sound-toggle').click();
  await musicPlaying(page);
  expectNoProblems(problems);
});

test('opslag van vóór punt 106 (één schakelaar, één volume) wordt overgenomen', async ({ page }) => {
  await openGame(page, { save: { version: 4, sound: { on: false, volume: 0.4 } } });
  expect((await snap(page)).sound).toEqual({ muted: true, groups: { music: { on: true, volume: 0.5 }, water: { on: true, volume: 0.4 }, tools: { on: true, volume: 0.4 }, bucket: { on: true, volume: 0.4 }, ui: { on: true, volume: 0.4 } } });
});

test('geluiden zijn klein, staan allemaal in de data en hebben elk een bron en licentie', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'bronscan hoeft maar één keer');
  const files = fs.readdirSync(DIR);
  const data = fs.readFileSync(path.join(ROOT, 'js/data/sounds.js'), 'utf8');
  const credits = fs.readFileSync(path.join(ROOT, 'docs/credits.md'), 'utf8');
  let total = 0;
  for (const f of files) {
    const size = fs.statSync(path.join(DIR, f)).size;
    expect(f, 'alleen mp3').toMatch(/^[a-z0-9-]+\.mp3$/);
    expect(data, `${f} staat in js/data/sounds.js`).toContain(`'${f}'`);
    // docs/credits.md noemt elk bestand, eventueel als reeks ("bucket-soft-1…3.mp3")
    expect(credits, `${f} staat in docs/credits.md`).toContain(f.replace(/-[123]\.mp3$/, '-1…3.mp3'));
    if (f === MUSIC_FILE) continue;
    total += size;
    expect(size, `${f} is klein genoeg voor mobiel`).toBeLessThan(60_000);
  }
  expect(total, 'alle effecten samen').toBeLessThan(400_000);

  // het credits-scherm: Geluiden en Muziek, elk CC0 met een link naar de bron die ook in docs/credits.md staat
  await openGame(page);
  await page.locator('#btn-menu').click();
  await page.locator('#main-menu [data-action="credits"]').click();
  for (const [title, min] of [['Geluiden', 24], ['Muziek', 1]]) {
    const group = page.locator('#credits-list h3', { hasText: new RegExp(`^${title}$`) });
    await expect(group).toBeVisible();
    const list = group.locator('xpath=following-sibling::ul[1]/li');
    expect(await list.count()).toBeGreaterThanOrEqual(min);
    for (const text of await list.allTextContents()) expect(text).toMatch(/CC0/);
    for (const href of await list.locator('a').evaluateAll(as => as.map(a => a.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\/(freesound\.org\/people\/[^/]+\/sounds\/\d+\/|kenney\.nl\/assets\/[a-z-]+)$/);
      expect(credits, `${href} staat in docs/credits.md`).toContain(href);
    }
  }
  // en andersom: elke bron uit docs/credits.md staat op het credits-scherm
  const section = credits.slice(credits.indexOf('## Geluiden en muziek'), credits.indexOf('## Lettertypen'));
  for (const url of new Set(section.match(/https:\/\/(?:freesound\.org\/people\/[^/]+\/sounds\/\d+\/|kenney\.nl\/assets\/[a-z-]+)/g))) await expect(page.locator(`#credits-list a[href="${url}"]`), url).toHaveCount(1);
});
