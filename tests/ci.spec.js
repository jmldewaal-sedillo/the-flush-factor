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
