// Gedeelde hulpfuncties voor de Playwright-tests.
const { expect } = require('@playwright/test');
const { BASE } = require('./server');

// Opslag (js/storage.js): de spelstand van het profiel, en de instellingen van het toestel.
const SAVE_KEY = 'flushfactor.profile.p1.game';
const SETTINGS_KEY = 'flushfactor.settings';
const LEGACY_SAVE_KEY = 'flushfactor_v1';       // tot en met Sprint 9; alleen nog voor de migratietest
const PROFILE = { name: 'Tester', avatar: 'duck', mode: 'guest', createdAt: '2026-01-01T00:00:00.000Z' };
const EMOJI = /\p{Extended_Pictographic}/gu;

/**
 * Opent het spel en wacht tot het echt klaar is (3D geladen), zonder vaste wachttijden.
 * Verzamelt intussen alles wat niet mag: console-fouten, JS-fouten, 4xx/5xx en externe verzoeken.
 * opties: query (extra URL-parameters), save (opgeslagen spelstand vooraf), clogs (willekeurige verstoppingen aan),
 *         quality en pixelRatio (renderinstellingen), firstStart (helemaal lege opslag: het welkomstscherm verschijnt),
 *         path (een gebouwde versie, zoals './dist/app/'; standaard de bronbestanden)
 */
async function openGame(page, { query = '', save = null, clogs = false, quality = 'low', pixelRatio = 0.3, firstStart = false, path = './' } = {}) {
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith(BASE) && !/^(data|blob):/.test(u)) problems.push(`extern of buiten submap: ${u}`);
  });
  if (!firstStart) {
    // Bestaande speler met een gastprofiel (anders staat het welkomstscherm ervoor).
    // Alleen bij de eerste keer laden zetten, zodat herladen de echte opslag test.
    const { language, ...game } = { version: 2, profile: PROFILE, ...(save || {}) };
    await page.addInitScript(([key, data, settingsKey, lang]) => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      localStorage.setItem(key, JSON.stringify(data));
      if (lang) localStorage.setItem(settingsKey, JSON.stringify({ language: lang }));
    }, [SAVE_KEY, game, SETTINGS_KEY, language || null]);
  }
  // Lage renderresolutie: de testbrowser heeft geen GPU. Layout en spelregels zijn daar niet van afhankelijk.
  const q = [`quality=${quality}`, `pixelratio=${pixelRatio}`, clogs ? '' : 'clogs=off', query].filter(Boolean).join('&');
  await page.goto(`${path}?${q}`);
  await ready(page);
  return problems;
}

async function ready(page) {
  await page.waitForFunction(() => window.__game?.ready === true, null, { timeout: 60_000 });
}

/** Wacht tot een uitdrukking in de pagina waar is. */
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: process.env.CI ? 90_000 : 30_000 });
const cameraIdle = page => until(page, () => window.__game.three.cameraIdle());

async function setView(page, id) {
  await page.evaluate(v => document.querySelector(`#camera-menu [data-view="${v}"]`).click(), id);
  await until(page, v => window.__game.three.view() === v, id);
  await cameraIdle(page);
}

/** Verstopping forceren en met de ontstopper oplossen (echte knop, echte spelregels). */
async function clogAndFix(page, propId = 'duck') {
  await page.evaluate(id => { window.__game.resetCooldowns(); window.__game.forceClog(id); }, propId);
  await until(page, () => window.__game.three.propInBowl());
  await page.evaluate(() => document.querySelector('.tool-btn[data-id="plunger"]').click());
  await until(page, () => !window.__game.snapshot().clogged && !window.__game.three.effectsBusy() && !window.__game.three.propInBowl());
}

/**
 * Kortstondige dingen (banner, melding, effect) kun je missen als de machine het druk heeft.
 * watch() onthoudt dat iets verschenen is; seen() wacht daarop. Zet watch() vóór de actie.
 */
async function watch(page, selector) {
  await page.evaluate(sel => {
    window.__seen ||= {};
    delete window.__seen[sel];
    const check = () => { if (document.querySelector(sel)) window.__seen[sel] = true; };
    new MutationObserver(check).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    check();
  }, selector);
}
const seen = (page, selector) => until(page, sel => window.__seen?.[sel] === true, selector);

/** Korte tik op een punt in de 3D-scène (echte pointer-events op het canvas, zonder beweging). */
async function tapScene(page, point) {
  await page.evaluate(({ x, y }) => {
    const c = document.getElementById('scene-canvas-3d');
    const fire = type => c.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true }));
    fire('pointerdown'); fire('pointerup');
  }, point);
}

const emojiIn = text => [...new Set([...text.matchAll(EMOJI)].map(m => m[0]))];

function expectNoProblems(problems) {
  expect(problems, `Problemen tijdens laden/spelen:\n${problems.join('\n')}`).toEqual([]);
}

/** Zichtbare tekst + attributen van de hele pagina (zonder scripts en stijl). */
const domText = page => page.evaluate(() => {
  const clone = document.documentElement.cloneNode(true);
  clone.querySelectorAll('script, style').forEach(el => el.remove());
  return clone.outerHTML;
});

// Een nieuwe speler (Sprint 9: armoedige start) die het welkomstscherm al gehad heeft. Vul aan met score, level, …
const NEW_PLAYER = { version: 3, toilet: { defects: { seat: true, lid: true, chip: true }, dirt: 1 } };

// Opslag van vóór versie 5 (punt 61): het saldo gaat bij het laden ×5, mee met de prijzen in de winkel.
// De standen hierboven en in openGame() zijn oudere versies; reken een opgeslagen score dus ×OLD.
const OLD = 5;

/** Zet een spelstand klaar in de opslag (voor een herlaad midden in een test). */
const seedSave = (page, data) => page.evaluate(([key, d]) => localStorage.setItem(key, JSON.stringify(d)), [SAVE_KEY, { version: 2, profile: PROFILE, ...data }]);

module.exports = { NEW_PLAYER, OLD, PROFILE, tapScene, watch, seen, SAVE_KEY, SETTINGS_KEY, LEGACY_SAVE_KEY, seedSave, openGame, ready, until, cameraIdle, setView, clogAndFix, emojiIn, expectNoProblems, domText };
