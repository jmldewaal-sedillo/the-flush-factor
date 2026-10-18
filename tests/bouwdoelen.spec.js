// Eén codebase, meerdere bouwdoelen (Apps/CLAUDE.md, sectie 11; punt 117): de webversie (ook de testversie) en de
// app voor Android én iOS (Capacitor, dist/app/). De tests bouwen de app zelf met tools/bouw.mjs en openen hem.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { openGame, until, setView, expectNoProblems } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
// Elke testworker bouwt in een eigen map, zodat ze elkaars bestanden niet weggooien.
let APP, APP_URL;
function allFiles(dir, base = dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) allFiles(full, base, out); else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}
// De onderdelen van een laag, als lijst van "naam: soort", om ze te kunnen vergelijken.
function layer(file) {
  const window = {};
  new Function('window', read(path.join('platform', file)))(window);
  const shape = [];
  (function walk(value, at) {
    for (const key of Object.keys(value).sort()) {
      const v = value[key];
      if (v && typeof v === 'object') walk(v, `${at}${key}.`); else shape.push(`${at}${key}: ${typeof v}`);
    }
  })(window.Platform, '');
  return { platform: window.Platform, shape };
}

test.describe('regels', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));

  test('elke laag in platform/ heeft precies dezelfde onderdelen, en advertenties staan overal uit', () => {
    const files = fs.readdirSync(path.join(ROOT, 'platform')).filter(f => f.endsWith('.js')).sort();
    expect(files).toEqual(['app.js', 'web.js']);
    const web = layer('web.js');
    for (const file of files) expect(layer(file).shape, file).toEqual(web.shape);
    expect(web.platform).toMatchObject({ DOEL: 'web', SERVICE_WORKER: true, EXTERNE_LINKS: true, VOLLEDIG_SCHERM: true });
    expect(layer('app.js').platform).toMatchObject({ DOEL: 'app', SERVICE_WORKER: false, EXTERNE_LINKS: true, VOLLEDIG_SCHERM: false });
    for (const file of files) expect(layer(file).platform.advertenties.beschikbaar, `${file}: advertenties staan uit`).toBe(false);
  });

  test('de spelcode kijkt nooit zelf op welk bouwdoel ze draait', () => {
    const offenders = allFiles(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && !f.startsWith('vendor/'))
      .filter(f => /Platform\.DOEL|window\.Capacitor|\bCapacitor\./.test(read(path.join('js', f)).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
    expect(offenders).toEqual([]);
  });

  test('Capacitor: één package-naam voor Android en iOS, de map van het bouwdoel, geen advertentie-plug-in', () => {
    const cap = JSON.parse(read('capacitor.config.json'));
    expect(cap).toMatchObject({ appId: 'com.studiosedillo.flushfactor', appName: 'The Flush Factor', webDir: 'dist/app' });
    expect(cap.android.webContentsDebuggingEnabled).toBe(false);
    expect(cap.ios.webContentsDebuggingEnabled).toBe(false);
    const pkg = JSON.parse(read('package.json'));
    for (const dep of ['@capacitor/core', '@capacitor/android', '@capacitor/ios', '@capacitor/app']) expect(pkg.dependencies[dep], dep).toMatch(/^\d/);
    expect(pkg.devDependencies['@capacitor/cli']).toMatch(/^\d/);
    expect(pkg.scripts['app:sync']).toContain('tools/bouw.mjs app');
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(d => /admob|ads/i.test(d))).toEqual([]);
    // de native projecten horen bij dezelfde app
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('applicationId "com.studiosedillo.flushfactor"');
    expect(gradle, 'de test-APK heeft een eigen package-naam').toMatch(/debug \{[^}]*applicationIdSuffix "\.test"/);
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).not.toMatch(/AD_ID|LOCATION|POST_NOTIFICATIONS|CAMERA|RECORD_AUDIO/);
    const ids = [...read('ios/App/App.xcodeproj/project.pbxproj').matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([\w.]+);/g)].map(m => m[1]);
    expect(new Set(ids)).toEqual(new Set(['com.studiosedillo.flushfactor']));
    // sleutels en gebouwde bestanden komen nooit in Git
    const ignore = read('.gitignore');
    for (const rule of ['*.keystore', '*.jks', 'dist/']) expect(ignore).toContain(rule);
  });

  test('workflow app.yml: test-APK voor Android en een simulatorbuild voor iOS, alleen in de hoofdrepo', () => {
    const yml = read('.github/workflows/app.yml');
    expect(yml).toContain('./gradlew assembleDebug');
    expect(yml).toContain('actions/upload-artifact');
    expect(yml).toMatch(/runs-on: macos-latest[\s\S]*CODE_SIGNING_ALLOWED=NO/);
    expect(yml.match(/if: github\.event\.repository\.name == 'the-flush-factor'/g)).toHaveLength(2);
    expect(yml, 'nergens een sleutel of wachtwoord').not.toMatch(/secrets\.|keystore|password/i);
  });
});

test.describe('bouwdoel app', () => {
  test.beforeAll(({}, info) => {
    APP = path.join(ROOT, 'dist', `proef-app-${info.workerIndex}`);
    APP_URL = `./dist/proef-app-${info.workerIndex}/`;
    execFileSync('node', [path.join(ROOT, 'tools', 'bouw.mjs'), 'app', '--uit', APP], { stdio: 'pipe' });
  });
  test.afterAll(() => fs.rmSync(APP, { recursive: true, force: true }));
  test.use({ serviceWorkers: 'allow' });

  test('alle bestanden in de app, zonder service worker, manifest of keuzepagina\'s', ({}, info) => {
    test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer');
    const files = allFiles(APP);
    for (const gone of ['sw.js', 'manifest.webmanifest', 'robots.txt', 'CNAME', 'platform/web.js', 'style-preview.html', 'spoelicoon-preview.html', 'credits.txt'])
      expect(files, gone).not.toContain(gone);
    for (const must of ['index.html', 'privacy.html', 'delete.html', 'platform/app.js', 'js/game.js', 'js/vendor/three.module.min.js', 'assets/models/toilet.glb', 'assets/sounds/rush.mp3'])
      expect(files, must).toContain(must);
    expect(files.filter(f => /^(tests|tools|docs|store|node_modules|android|ios|assets\/reference)\//.test(f) || /\.md$|^package|^capacitor/.test(f))).toEqual([]);
    const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
    expect(html).toContain('<script src="platform/app.js"></script>');
    expect(html).not.toContain('platform/web.js');
    expect(html).not.toContain('rel="manifest"');
  });

  test('het spel start uit de gebouwde app en registreert geen service worker', async ({ page }) => {
    const problems = await openGame(page, { path: APP_URL });
    expect(await page.evaluate(() => window.Platform.DOEL)).toBe('app');
    await page.locator('#flush-btn').click();
    await until(page, () => window.__game.snapshot().score > 0);
    // de app is al schermvullend: geen menu-item "Volledig scherm"
    await expect(page.locator('#main-menu [data-action="fullscreen"]')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(await page.evaluate(async () => ({ workers: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).length })))
      .toEqual({ workers: 0, caches: 0 });
    expectNoProblems(problems);
  });

  test('de terugknop van Android: venster dicht, menu dicht, uitzoomen, en pas dan de app sluiten', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer');
    // De echte app heeft de plug-in @capacitor/app; hier een namaak die bijhoudt wat er gebeurt.
    await page.addInitScript(() => {
      window.__exits = 0;
      window.Capacitor = { Plugins: { App: {
        addListener(name, fn) { if (name === 'backButton') window.__back = fn; },
        exitApp() { window.__exits++; },
      } } };
    });
    const problems = await openGame(page, { path: APP_URL });
    const back = () => page.evaluate(() => window.__back());
    const exits = () => page.evaluate(() => window.__exits);

    await page.locator('#btn-shop').click();
    await expect(page.locator('#shop-screen')).toBeVisible();
    await back();
    await expect(page.locator('#shop-screen')).toBeHidden();

    await page.locator('#btn-menu').click();
    await expect(page.locator('#main-menu')).toBeVisible();
    await back();
    await expect(page.locator('#main-menu')).toBeHidden();

    await setView(page, 'bucket');
    await expect(page.locator('body')).toHaveAttribute('data-zoom', '');
    await back();
    await until(page, () => !document.body.hasAttribute('data-zoom'));
    expect(await exits(), 'tot nu toe alleen stappen terug').toBe(0);

    await back();
    expect(await exits(), 'niets meer terug te doen: de app sluit').toBe(1);
    expectNoProblems(problems);
  });
});

test('webversie: de bronbestanden laden de weblaag, met service worker en "Volledig scherm"', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer');
  const problems = await openGame(page);
  expect(await page.evaluate(() => window.Platform.DOEL)).toBe('web');
  await expect(page.locator('#main-menu [data-action="fullscreen"]')).toHaveCount(1);
  expect(read('sw.js')).toContain("'platform/web.js'");
  expectNoProblems(problems);
});
