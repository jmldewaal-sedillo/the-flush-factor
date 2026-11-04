// Geld en accounts (Sprint 16; vaste controle uit Apps/CLAUDE.md, sectie 11.7a): advertenties, aankopen en inloggen
// staan uit tot Jenn ze goedkeurt, nooit in een kinder-app, en als ze aan gaan klopt de rest mee
// (privacyverklaring, voorwaardenpagina). Wat uit staat is ook niet te zien: geen knoppen zonder werking.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');
const { openGame, expectNoProblems } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const once = info => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer');
const configOf = async dir => (await import(pathToFileURL(path.join(ROOT, 'tools', 'store-controle.mjs')).href)).appConfig(dir);
const legalText = dir => fs.readdirSync(path.join(dir, 'js', 'i18n', 'legal')).map(f => fs.readFileSync(path.join(dir, 'js', 'i18n', 'legal', f), 'utf8')).join('\n');

/** Wat niet klopt aan de instellingen voor geld en accounts in deze map. */
async function problemen(dir) {
  const c = await configOf(dir);
  const text = legalText(dir);
  const out = [];
  for (const k of ['KINDER_APP', 'ADVERTENTIES', 'AANKOPEN', 'INLOGGEN']) if (typeof c[k] !== 'boolean') out.push(`${k} staat in js/data/config.js als true of false`);
  if (c.KINDER_APP && c.ADVERTENTIES) out.push('geen advertenties in een kinder-app');
  if (c.KINDER_APP && c.AANKOPEN) out.push('geen aankopen in een kinder-app');
  if (c.KINDER_APP && c.INLOGGEN) out.push('geen inloggen met Google/Facebook in een kinder-app');
  if (c.ADVERTENTIES) {
    if (/Geen advertenties|No advertising|No ads/.test(text)) out.push('privacyverklaring zegt nog "geen advertenties"');
    if (!/AdMob/.test(text)) out.push('privacyverklaring noemt AdMob niet');
  }
  if (c.AANKOPEN) {
    if (/Geen aankopen|No purchases/.test(text)) out.push('privacyverklaring zegt nog "geen aankopen"');
    if (!fs.existsSync(path.join(dir, 'voorwaarden.html'))) out.push('voorwaarden.html ontbreekt (terugbetalen, herroepingsrecht, punten zonder geldwaarde)');
  }
  if (c.INLOGGEN && /Geen accounts en geen inloggen|No accounts and no sign-in/.test(text)) out.push('privacyverklaring zegt nog "geen inloggen"');
  return out;
}

test('advertenties, aankopen en inloggen: de instellingen van dit spel kloppen, en staan uit', async ({}, info) => {
  once(info);
  expect(await problemen(ROOT)).toEqual([]);
  expect(await configOf(ROOT)).toMatchObject({ ADVERTENTIES: false, AANKOPEN: false, INLOGGEN: false });
});

test('de controle werkt echt: kinder-app met geld of inloggen, en aankopen zonder voorwaarden', async ({}, info) => {
  once(info);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flush-geld-'));
  try {
    fs.mkdirSync(path.join(dir, 'js', 'data'), { recursive: true });
    fs.cpSync(path.join(ROOT, 'js', 'i18n', 'legal'), path.join(dir, 'js', 'i18n', 'legal'), { recursive: true });
    const cfg = fs.readFileSync(path.join(ROOT, 'js', 'data', 'config.js'), 'utf8').replace(/^export const (KINDER_APP|ADVERTENTIES|AANKOPEN|INLOGGEN) = false;/gm, 'export const $1 = true;');
    fs.writeFileSync(path.join(dir, 'js', 'data', 'config.js'), cfg);
    const p = await problemen(dir);
    for (const want of ['geen advertenties in een kinder-app', 'geen aankopen in een kinder-app', 'geen inloggen met Google/Facebook in een kinder-app',
      'privacyverklaring zegt nog "geen advertenties"', 'privacyverklaring noemt AdMob niet', 'privacyverklaring zegt nog "geen aankopen"', 'privacyverklaring zegt nog "geen inloggen"'])
      expect(p).toContain(want);
    expect(p.some(x => x.startsWith('voorwaarden.html ontbreekt'))).toBe(true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('uit is ook niet te zien: geen geldpakketten, geen inlogknoppen, geen europrijzen', async ({ page }) => {
  const problems = await openGame(page, { firstStart: true });
  await expect(page.locator('.profile-auth-block, .auth-btn')).toHaveCount(0);
  await page.locator('#profile-submit').click();
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  await expect(page.locator('.shop-category[data-cat="buy"], .buy-card')).toHaveCount(0);
  expect(await page.locator('#shop-screen').innerText()).not.toContain('€');
  expectNoProblems(problems);
});
