// Punten 98 en 101: de controle op privégegevens (blocklist, Apps/CLAUDE.md sectie 11 punt 6) draait in CI.
// Deze test leest de workflows en draait het script zelf. Of de stap op GitHub ook echt gedraaid heeft zie je
// aan de run: "Controle op privégegevens" met "N patronen uit het geheim PRIVATE_BLOCKLIST".
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
// Het stuk van een workflow dat bij één job hoort (tot de volgende job op hetzelfde niveau).
const job = (yml, name) => { const m = yml.match(new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  \\w[\\w-]*:\\n|$)`)); return m ? m[1] : ''; };

test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));

test('ci.yml: de blocklist-controle draait vóór de rooktest, en de testversie wordt gecontroleerd vóór het publiceren', () => {
  const yml = read('.github/workflows/ci.yml');
  const rook = job(yml, 'rook'), deploy = job(yml, 'deploy');
  expect(rook).toContain('PRIVATE_BLOCKLIST: ${{ secrets.PRIVATE_BLOCKLIST }}');
  expect(rook).toContain('python3 tests/no-private-data.py --ci');
  expect(rook.indexOf('no-private-data.py'), 'eerst de controle, dan pas de tests').toBeLessThan(rook.indexOf('npm run test:rook'));
  // zonder geheim controleert de stap niets: dat moet de run laten falen
  expect(rook).toMatch(/-z "\$PRIVATE_BLOCKLIST"[\s\S]*exit 1/);
  // publiceren hangt aan de job met de controle, en de gebouwde site gaat zelf ook langs de lijst
  expect(deploy).toMatch(/needs: rook/);
  expect(deploy).toContain('python3 tools/no-private-data.py --dir _site');
  expect(deploy.indexOf('--dir _site'), 'controleren vóór publiceren').toBeLessThan(deploy.indexOf('actions/deploy-pages'));
  expect(deploy.indexOf('bouw-site.mjs')).toBeLessThan(deploy.indexOf('--dir _site'));
});

test('privacy.yml: draait bij elke push (ook alleen documentatie) en bekijkt de hele geschiedenis', () => {
  const yml = read('.github/workflows/privacy.yml');
  expect(yml).toMatch(/\non:\n  push:\n  pull_request:/);
  expect(yml, 'geen uitzonderingen op paden of branches').not.toMatch(/paths|branches/);
  expect(yml).toContain('PRIVATE_BLOCKLIST: ${{ secrets.PRIVATE_BLOCKLIST }}');
  expect(yml).toContain('fetch-depth: 0');
  expect(yml).toContain('python3 tests/no-private-data.py --ci');
  expect(yml).toContain('python3 tools/no-private-data.py --history');
  // het geheim wordt nergens afgedrukt
  for (const file of ['.github/workflows/ci.yml', '.github/workflows/privacy.yml']) expect(read(file)).not.toMatch(/echo[^\n]*\$\{?PRIVATE_BLOCKLIST|cat[^\n]*blocklist/);
});

test('het script vindt een treffer, toont het patroon niet, en slaat zonder lijst niets stilzwijgend over', () => {
  const tool = path.join(ROOT, 'tools/no-private-data.py');
  expect(execFileSync('python3', [tool, '--selftest'], { encoding: 'utf8' })).toContain('zelftest: een treffer wordt gevonden');

  // een eigen lijst, zoals het geheim in CI: een map met en zonder treffer
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blocklist-'));
  const env = { ...process.env, PRIVATE_BLOCKLIST: 'Kanariestraat 12\n9999 ZZ\n' };
  fs.writeFileSync(path.join(dir, 'schoon.html'), '<p>Studio Sedillo, Nederland</p>');
  let run = spawnSync('python3', [tool, '--dir', dir], { env, encoding: 'utf8' });
  expect(run.status).toBe(0);
  expect(run.stdout).toContain('2 patronen uit het geheim PRIVATE_BLOCKLIST');
  fs.writeFileSync(path.join(dir, 'lek.html'), '<p>kanarieSTRAAT   12</p>');
  run = spawnSync('python3', [tool, '--dir', dir], { env, encoding: 'utf8' });
  expect(run.status, 'een treffer laat de run falen').toBe(1);
  expect(run.stdout).toContain('lek.html');
  expect((run.stdout + run.stderr).toLowerCase(), 'het patroon zelf komt niet in het log').not.toContain('kanariestraat');

  // zonder lijst: een zichtbare waarschuwing voor GitHub Actions, geen stille "in orde"
  run = spawnSync('python3', [tool, '--dir', dir, '--ci'], { env: { ...process.env, PRIVATE_BLOCKLIST: '', STUDIO_SEDILLO_BLOCKLIST: path.join(dir, 'bestaat-niet.txt') }, encoding: 'utf8' });
  expect(run.stdout).toContain('::warning::Controle op privégegevens overgeslagen');
  fs.rmSync(dir, { recursive: true, force: true });
});

// Punt 100: de stijlvoorbeeldpagina (punt 78) staat op het testadres, noindex, en hoort niet bij het spel.
test('testversie: style-preview.html gaat mee (noindex), zit niet in de service worker, en er komt geen CNAME', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'site-'));
  execFileSync('node', [path.join(ROOT, 'tools/bouw-site.mjs'), out, 'the-flush-factor-test', 'test'], { encoding: 'utf8' });
  const html = fs.readFileSync(path.join(out, 'style-preview.html'), 'utf8');
  expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  for (const f of ['index.html', 'privacy.html', 'delete.html']) expect(fs.readFileSync(path.join(out, f), 'utf8'), f).toContain('noindex');
  // alles waar de pagina naar verwijst staat ook echt in de testversie
  for (const ref of new Set(html.match(/assets\/[\w./-]+\.(?:woff2|svg)/g))) expect(fs.existsSync(path.join(out, ref)), ref).toBe(true);
  expect(fs.readFileSync(path.join(out, 'sw.js'), 'utf8')).not.toContain('style-preview');
  // punt 75: de keuzepagina voor het spoelicoon ook
  const icons = fs.readFileSync(path.join(out, 'spoelicoon-preview.html'), 'utf8');
  expect(icons).toContain('<meta name="robots" content="noindex, nofollow">');
  expect(fs.readFileSync(path.join(out, 'sw.js'), 'utf8')).not.toContain('spoelicoon-preview');
  expect(fs.existsSync(path.join(out, 'CNAME'))).toBe(false);
  // geluiden gaan mee; documentatie en tests niet
  expect(fs.readdirSync(path.join(out, 'assets/sounds')).sort()).toEqual(fs.readdirSync(path.join(ROOT, 'assets/sounds')).sort());
  for (const no of ['docs', 'tests', 'tools', 'ROADMAP.md', 'AUDIT.md']) expect(fs.existsSync(path.join(out, no)), no).toBe(false);
  fs.rmSync(out, { recursive: true, force: true });
});

test('style-preview.html: drie richtingen naast elkaar, zonder fouten of ontbrekende bestanden', async ({ page }) => {
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  await page.goto('./style-preview.html');
  await expect(page.locator('h2')).toHaveText([/A · /, /B · /, /C · /]);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'tests/screenshots/s11-03-style-preview.png', fullPage: true });
  expect(problems).toEqual([]);
});

// Punt 75: keuzepagina voor het spoelicoon, op de echte knop in alle standen.
test('spoelicoon-preview.html: vijf varianten in vier standen, zonder fouten of ontbrekende bestanden', async ({ page }) => {
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  await page.goto('./spoelicoon-preview.html');
  await expect(page.locator('.variant h2')).toHaveText([/A · /, /B · /, /C · /, /D · /, /E · /]);
  await expect(page.locator('.variant .btn')).toHaveCount(20);
  // elk icoon tekent echt iets (niet leeg)
  for (const box of await page.locator('.variant .btn .ic').evaluateAll(els => els.map(e => { const b = e.getBBox(); return { width: b.width, height: b.height }; }))) expect(box.width * box.height).toBeGreaterThan(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'tests/screenshots/s13-01-spoelicoon-preview.png', fullPage: true });
  expect(problems).toEqual([]);
});
