// Gedeelde hulpfuncties voor de Playwright-tests.
const { expect } = require('@playwright/test');

const SAVE_KEY = 'flushfactor_v1';
const EMOJI = /\p{Extended_Pictographic}/gu;

/**
 * Opent het spel en wacht tot het echt klaar is (3D geladen), zonder vaste wachttijden.
 * Verzamelt intussen alles wat niet mag: console-fouten, JS-fouten, 4xx/5xx en externe verzoeken.
 * opties: query (extra URL-parameters), save (opgeslagen spelstand vooraf), clogs (willekeurige verstoppingen aan),
 *         quality en pixelRatio (renderinstellingen)
 */
async function openGame(page, { query = '', save = null, clogs = false, quality = 'low', pixelRatio = 0.3 } = {}) {
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith('http://localhost:5000/the-flush-factor/') && !/^(data|blob):/.test(u)) problems.push(`extern of buiten submap: ${u}`);
  });
  if (save) {
    // Alleen bij de eerste keer laden zetten, zodat herladen de echte opslag test.
    await page.addInitScript(([key, data]) => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      localStorage.setItem(key, JSON.stringify(data));
    }, [SAVE_KEY, { version: 2, ...save }]);
  }
  // Lage renderresolutie: de testbrowser heeft geen GPU. Layout en spelregels zijn daar niet van afhankelijk.
  const q = [`quality=${quality}`, `pixelratio=${pixelRatio}`, clogs ? '' : 'clogs=off', query].filter(Boolean).join('&');
  await page.goto(`./?${q}`);
  await ready(page);
  return problems;
}

async function ready(page) {
  await page.waitForFunction(() => window.__game?.ready === true, null, { timeout: 60_000 });
}

/** Wacht tot een uitdrukking in de pagina waar is. */
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 30_000 });
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

module.exports = { watch, seen, SAVE_KEY, openGame, ready, until, cameraIdle, setView, clogAndFix, emojiIn, expectNoProblems, domText };
