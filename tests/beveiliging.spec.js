// Beveiliging (Sprint 16; vaste controles uit Apps/CLAUDE.md, sectie 11.7a, zoals in de app-template):
// een strenge Content-Security-Policy in elke pagina en elk bouwdoel, vijandige codes bij "Voortgang overzetten",
// kapotte opslag, ?lang= met rare waarden, en de vaste Android-instellingen (geen back-up, geen advertentie-ID).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems, SAVE_KEY, SETTINGS_KEY } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const once = info => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer');

function cspOf(html) {
  const m = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(html);
  return m ? m[1] : null;
}
const htmlFiles = dir => fs.readdirSync(dir).filter(f => f.endsWith('.html'));

test('elke pagina heeft een strenge Content-Security-Policy, in de bron en in elk bouwdoel', async ({}, info) => {
  once(info);
  const check = (dir, label, min = 4) => {
    const pages = htmlFiles(dir);
    expect(pages.length, label).toBeGreaterThanOrEqual(min);
    for (const file of pages) {
      const html = fs.readFileSync(path.join(dir, file), 'utf8');
      const csp = cspOf(html);
      expect(csp, `${label}/${file}: CSP ontbreekt`).not.toBeNull();
      for (const part of ["default-src 'self'", "script-src 'self'", "style-src 'self';", "object-src 'none'", "base-uri 'self'", "form-action 'none'"])
        expect(csp, `${label}/${file}`).toContain(part);
      expect(csp, `${label}/${file}: geen unsafe-inline of unsafe-eval`).not.toMatch(/unsafe-(inline|eval)|\*|https?:/);
      expect(html, `${label}/${file}: referrer`).toContain('<meta name="referrer" content="strict-origin-when-cross-origin">');
      expect(html, `${label}/${file}: geen inline style-attribuut of <style> (de CSP verbiedt het)`).not.toMatch(/\sstyle="|<style/);
      // Het enige inline script is de importmap van three.js, en die staat met zijn hash in de CSP.
      const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)];
      for (const [, attrs, code] of inline) {
        expect(attrs, `${label}/${file}: alleen de importmap mag inline`).toContain('type="importmap"');
        const hash = require('crypto').createHash('sha256').update(code).digest('base64');
        expect(csp, `${label}/${file}: hash van de importmap`).toContain(`'sha256-${hash}'`);
      }
    }
  };
  check(ROOT, 'bron');
  const out = path.join(ROOT, 'dist', `proef-csp-${info.workerIndex}`);
  try {
    for (const doel of ['app', 'test']) {
      const args = doel === 'test' ? ['test', 'the-flush-factor-test', 'abc1234'] : ['app'];
      execFileSync('node', [path.join(ROOT, 'tools', 'bouw.mjs'), ...args, '--uit', out], { stdio: 'pipe' });
      check(out, doel);
    }
    execFileSync('node', [path.join(ROOT, 'tools', 'bouw.mjs'), 'hoofdsite', '--uit', out], { stdio: 'pipe' });
    check(path.join(out, 'the-flush-factor'), 'hoofdsite', 3);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('de CSP houdt niets tegen bij gewoon spelen: winkel, profiel, credits, gegevens en de pagina\'s', async ({ page }) => {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective}: ${e.blockedURI || e.sample}`));
  });
  const problems = await openGame(page, { save: { score: 5000, level: 5 } });
  await page.locator('#flush-btn').click();
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  await page.locator('#btn-shop-close').click();
  await page.locator('#score-bubble').click();
  await page.locator('#btn-transfer').click();
  await page.locator('#btn-export').click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.locator('#btn-menu').click();
  await page.locator('#main-menu [data-action="credits"]').click();
  // De voortgangsbalken krijgen hun breedte (de CSP verbiedt style-attributen; zie bar() in js/ui/icons.js).
  expect(await page.evaluate(() => [...document.querySelectorAll('.bar-fill[data-fill]')].filter(el => el.dataset.fill !== '0' && !el.style.width).length)).toBe(0);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  for (const p of ['privacy.html', 'delete.html']) {
    await page.goto(`./${p}`);
    await expect(page.locator('#page-text h1')).toBeVisible();
    expect(await page.evaluate(() => window.__csp), p).toEqual([]);
  }
  expectNoProblems(problems);
});

// Een overzetcode zoals js/storage.js hem maakt, maar met een zelfgekozen inhoud.
const codeOf = data => 'flushfactor1.' + Buffer.from(JSON.stringify({ app: 'flushfactor', v: 1, when: 1, data })).toString('base64url');

test('vijandige code: niets wordt uitgevoerd, vreemde waarden vallen weg, en het spel start daarna gewoon', async ({ page }) => {
  const problems = await openGame(page);
  const xss = n => `<img src=x onerror="window.__xss=${n}">`;
  const hostile = codeOf({
    settings: { language: 'constructor', shopOpen: 'tools', toolsOpen: 'ja', preview: { x: 1 }, onbekend: 1 },
    profiles: { v: 1, active: 'p1', next: 2, list: [{ id: 'p1', name: xss(1) }] },
    'profile.p1.game': {
      version: '__proto__', score: '1e99', highScore: Infinity, earned: -5, level: 1e9, combo: 1e9,
      purchased: 5, ownedTools: 'plunger', bucketItems: { length: 3 }, stains: [null, 7, { id: 'a', surface: 'floor', dirt: 'veel' }],
      stats: { totalFlushes: xss(2), totalLiters: 12, extra: xss(3) },
      toolDiscovery: { plunger: xss(4), onbekend: 'working' }, toolUpgrades: { plunger: 99 },
      cosmetics: 'goud', decor: [1, 2], toilet: { defects: 'alle', dirt: 'vol' }, supplies: { sponge: 1e9 },
      newItems: [xss(5), 3], sound: { groups: { music: { volume: 'hard' } } },
      profile: { name: xss(6), avatar: 'constructor', createdAt: { kwaad: true } },
    },
    'profile.p1.onbekend': { iets: 1 },
    'iets.anders': 1,
  });
  const read = await page.evaluate(async c => (await import('./js/storage.js')).storage.readCode(c), hostile);
  expect(Object.keys(read).sort()).toEqual(['profile.p1.game', 'profiles']);         // geen bruikbare instellingen, geen onbekende sleutels
  expect(await page.evaluate(async c => (await import('./js/storage.js')).storage.importCode(c), hostile)).toBe(true);

  const again = await (async () => { await page.reload(); await until(page, () => window.__game?.ready); return page.evaluate(() => window.__game.snapshot()); })();
  expect(again.score).toBe(0);
  const levels = await page.evaluate(async () => (await import('./js/data/levels.js')).LEVELS.length);
  expect(again.level, 'een level van 1e9 wordt het hoogste level, niet meer').toBe(levels);
  expect(again.profile).toMatchObject({ name: xss(6).slice(0, 16), avatar: 'duck', createdAt: null });
  // De naam staat als tekst op het scherm; er is geen <img> gemaakt en er is niets uitgevoerd.
  await page.locator('#score-bubble').click();
  await expect(page.locator('#profile-name')).toHaveValue(xss(6).slice(0, 16));
  await expect(page.locator('#profile-stats dd').first()).toHaveText('0');
  expect(await page.locator('#profile-screen img, #shop-screen img').count()).toBe(0);
  await page.keyboard.press('Escape');
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  await page.locator('#btn-shop-close').click();
  await page.locator('#flush-btn').click();
  await until(page, () => window.__game.snapshot().score > 0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  // Wat er na het laden is opgeslagen is weer een gewone spelstand.
  const saved = JSON.parse(await page.evaluate(k => localStorage.getItem(k), SAVE_KEY));
  expect(Array.isArray(saved.purchased) && Array.isArray(saved.ownedTools) && saved.ownedTools.length > 0).toBe(true);
  expect(Object.values(saved.stats).every(Number.isFinite)).toBe(true);
  expect(saved.toolUpgrades).toEqual({});
  expectNoProblems(problems);
});

test('kapotte of vreemde gegevens in de opslag: het spel start gewoon, zonder fouten', async ({ page }) => {
  for (const game of ['{kapot', '"tekst"', '[1,2]', JSON.stringify({ version: 2, basketItems: [null], activeCosmetics: 5 }), JSON.stringify({ version: 4, purchased: { a: 1 }, ownedTools: [1, null] })]) {
    await page.addInitScript(([k, g, s]) => {
      if (sessionStorage.getItem('__done')) return;
      sessionStorage.setItem('__done', '1');
      localStorage.setItem(k, g);
      localStorage.setItem(s, JSON.stringify({ language: 'constructor', shopOpen: 'x' }));
    }, [SAVE_KEY, game, SETTINGS_KEY]);
    const problems = await openGame(page, { firstStart: true });
    expect(await page.evaluate(() => window.__game.snapshot().score), game).toBe(0);
    await expect(page.locator('#fatal')).toBeHidden();
    expectNoProblems(problems.filter(p => !p.includes('Spelstand onleesbaar')));
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  }
});

test('?lang= met een rare waarde: de pagina\'s vallen terug op een gewone taal', async ({ page }, info) => {
  once(info);
  for (const lang of ['constructor', '__proto__', 'toString', 'xx']) {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`./privacy.html?lang=${lang}`);
    await expect(page.locator('#page-text h1')).toBeVisible();
    expect(await page.locator('html').getAttribute('lang'), lang).toMatch(/^[a-z]{2}$/);
    expect(errors, lang).toEqual([]);
    page.removeAllListeners('pageerror');
  }
});

test('Android: geen back-up en geen advertentie-ID, en --check vangt een terugval', async ({}, info) => {
  once(info);
  const tool = (dir, ...args) => execFileSync('node', [path.join(ROOT, 'tools', 'android-instellingen.mjs'), '--root', dir, ...args], { stdio: 'pipe' }).toString();
  // De echte app staat goed.
  expect(tool(ROOT, '--check')).toContain('in orde');
  // Een nieuwe kopie zoals Capacitor hem aanmaakt.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flush-android-'));
  try {
    const main = path.join(dir, 'android', 'app', 'src', 'main');
    fs.mkdirSync(main, { recursive: true });
    fs.mkdirSync(path.join(dir, 'js', 'data'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'js', 'data', 'config.js'), path.join(dir, 'js', 'data', 'config.js'));
    fs.writeFileSync(path.join(main, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
    </application>

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`);
    expect(() => tool(dir, '--check'), 'zonder aanpassing faalt de controle').toThrow();
    tool(dir);
    const xml = fs.readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8');
    for (const part of ['xmlns:tools="http://schemas.android.com/tools"', 'android:allowBackup="false"', 'android:fullBackupContent="false"',
      'android:dataExtractionRules="@xml/data_extraction_rules"', '<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove" />'])
      expect(xml).toContain(part);
    expect(xml).not.toContain('android:allowBackup="true"');
    const rules = fs.readFileSync(path.join(main, 'res', 'xml', 'data_extraction_rules.xml'), 'utf8');
    for (const part of ['cloud-backup', 'device-transfer', 'domain="sharedpref"', 'domain="root"']) expect(rules).toContain(part);
    expect(tool(dir, '--check')).toContain('in orde');
    expect(tool(dir)).toContain('was al in orde');
    expect(fs.readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8'), 'twee keer draaien verandert niets').toBe(xml);

    // Met advertenties (alleen na akkoord van Jenn) mag de advertentie-ID wel; de back-up blijft uit.
    const cfg = path.join(dir, 'js', 'data', 'config.js');
    fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace('export const ADVERTENTIES = false;', 'export const ADVERTENTIES = true;'));
    tool(dir);
    const withAds = fs.readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8');
    expect(withAds).not.toContain('AD_ID');
    expect(withAds).toContain('android:allowBackup="false"');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
