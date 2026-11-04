// Inhoud (Sprint 16; vaste controle uit Apps/CLAUDE.md, sectie 11.7a, zoals in de app-template): geen loze
// beloftes in de store-teksten en in het spel, geen diensten van buiten (trackers, session replay, lettertypen),
// alleen bekende adressen, en elk bestand van buiten staat in docs/credits.md.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone-portrait', 'hoeft maar één keer'));
const controle = () => import(pathToFileURL(path.join(ROOT, 'tools', 'store-controle.mjs')).href);
const walk = d => fs.readdirSync(d).flatMap(n => fs.statSync(path.join(d, n)).isDirectory() ? walk(path.join(d, n)) : [path.join(d, n)]);

test('store-teksten: geen "gratis", "beste", "#1", "meest …", sterren, reviews of emoji, en kloppend met config.js', async () => {
  const { controleerStore, storeBestanden } = await controle();
  expect(storeBestanden(ROOT).length, 'er zijn store-teksten').toBeGreaterThan(3);
  expect(controleerStore(ROOT)).toEqual([]);
});

test('de controle werkt echt: verboden woorden, een review en tegenspraak met config.js worden gevonden', async () => {
  const { controleerTekst } = await controle();
  const zonder = { ADVERTENTIES: false, AANKOPEN: false };
  expect(controleerTekst('Het leukste spel, 100% gratis!', { config: zonder }).length).toBe(2);
  expect(controleerTekst('Het meest absurde spoelspel op aarde', { config: zonder }).length).toBe(1);
  expect(controleerTekst('The most absurd game, #1 with 5 stars', { config: zonder }).length).toBe(3);
  expect(controleerTekst('"Geweldig spel!" – Lisa', { config: zonder })).toHaveLength(1);
  expect(controleerTekst('Geen advertenties', { config: { ADVERTENTIES: true } })).toHaveLength(1);
  expect(controleerTekst('No in-app purchases', { config: { AANKOPEN: true } })).toHaveLength(1);
  expect(controleerTekst('INVULLEN: tekst', { config: zonder, klaar: true })).toHaveLength(1);
  expect(controleerTekst('Een absurd spoelspel, zonder advertenties.', { config: zonder })).toEqual([]);
});

// Teksten óver de app: het manifest, de titels en beschrijvingen van de pagina's en de juridische teksten. De grappen
// in het spel zelf ("Wetenschappelijk bewezen nutteloos", ★ voor verbeteringen, je persoonlijke record "Beste")
// beloven niets over de app en vallen erbuiten.
test('teksten over de app: geen loze beloftes in het manifest, de pagina\'s en de juridische teksten', async () => {
  const { VERBODEN } = await controle();
  const files = [...walk(path.join(ROOT, 'js', 'i18n', 'legal')), path.join(ROOT, 'manifest.webmanifest'), ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).map(f => path.join(ROOT, f))];
  const found = [];
  for (const file of files) {
    // Alleen de teksten, niet de links.
    // In HTML geen ids, klassen en andere verwijzingen ("streak-best"), wel de tekst en aria-labels.
    const text = fs.readFileSync(file, 'utf8').replace(/https?:\/\/\S+/g, '')
      .replace(/\s(id|class|for|aria-(labelledby|controls|describedby)|data-[\w-]+|href|src|rel|type|name|content="[^"]*" name)="[^"]*"/g, '');
    for (const re of VERBODEN) { const m = text.match(re); if (m) found.push(`${path.relative(ROOT, file)}: "${m[0]}"`); }
  }
  expect(found).toEqual([]);
});

// Bestanden die in het spel (of op de pagina's) terechtkomen; three.js zelf (js/vendor, js/utils) niet: dat is
// ongewijzigde code van de makers, met hun adressen in de commentaren.
const SKIP = new Set(['.git', '.github', 'node_modules', 'test-results', 'playwright-report', 'dist', 'android', 'ios', 'tests', 'tools', 'docs', 'store']);
const appFiles = () => fs.readdirSync(ROOT).filter(n => !SKIP.has(n) && !n.startsWith('.'))
  .flatMap(n => fs.statSync(path.join(ROOT, n)).isDirectory() ? walk(path.join(ROOT, n)) : [path.join(ROOT, n)])
  .filter(f => /\.(html|js|css|json|webmanifest|svg|txt)$/.test(f))
  .filter(f => !/[\\/]js[\\/](vendor|utils)[\\/]|[\\/]assets[\\/]reference[\\/]/.test(f))
  .filter(f => !['package.json', 'package-lock.json', 'playwright.config.js', 'capacitor.config.json'].includes(path.basename(f)));

test('geen trackers, analytics, session replay of lettertypen van buiten', async () => {
  const BANNED = /fonts\.googleapis|fonts\.gstatic|use\.typekit|googletagmanager|google-analytics|gtag\(|\bga\(|fbq\(|connect\.facebook|hotjar|clarity\.ms|fullstory|logrocket|smartlook|mouseflow|mixpanel|segment\.(com|io)|amplitude|posthog|sentry|bugsnag|firebase|appsflyer|adjust\.com|branch\.io/i;
  const found = [];
  for (const file of appFiles()) {
    const m = fs.readFileSync(file, 'utf8').match(BANNED);
    if (m) found.push(`${path.relative(ROOT, file)}: ${m[0]}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) if (BANNED.test(dep)) found.push(`package.json: ${dep}`);
  expect(found, 'alleen na een besluit van Jenn, en dan eerst privacyverklaring en Data safety bijwerken').toEqual([]);
});

test('adressen in het spel: alleen bekende hosts (beleidspagina\'s, bronnen in de credits en de eigen domeinen)', async () => {
  const ALLOWED = [/^policies\.google\.com$/, /^docs\.github\.com$/, /^(.+\.)?studiosedillo\.com$/, /^jmldewaal-sedillo\.github\.io$/, /^www\.w3\.org$/,
    /^autoriteitpersoonsgegevens\.nl$/, /^(www\.)?(game-icons\.net|lucide\.dev|freesound\.org|opengameart\.org|polyhaven\.com|ambientcg\.com|skfb\.ly|creativecommons\.org|kenney\.nl|fonts\.google\.com|github\.com|sketchfab\.com|scripts\.sil\.org|openfontlicense\.org|pixabay\.com|threejs\.org)$/];
  const found = [];
  for (const file of appFiles()) {
    for (const [, host] of fs.readFileSync(file, 'utf8').matchAll(/\bhttps?:\/\/([a-z0-9.-]+)/gi)) {
      if (!ALLOWED.some(re => re.test(host.toLowerCase()))) found.push(`${path.relative(ROOT, file)}: ${host}`);
    }
  }
  expect([...new Set(found)], 'nieuwe host? Eerst Jenn vragen, dan in de privacyverklaring en deze lijst (de CSP laat hem toch niet toe)').toEqual([]);
});

test('credits: elk bestand met beeld, geluid, modellen of lettertypen staat in docs/credits.md', async () => {
  const credits = fs.readFileSync(path.join(ROOT, 'docs', 'credits.md'), 'utf8');
  const missing = [];
  for (const file of walk(path.join(ROOT, 'assets'))) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel.startsWith('assets/reference/')) continue;                     // referentiemateriaal, niet in het spel
    const parts = rel.split('/');
    // Het bestand zelf (pad of naam), of een map erboven met een / erachter ("assets/icons/app/").
    const covered = credits.includes(rel) || credits.includes(path.basename(rel)) || parts.slice(0, -1).some((_, i) => credits.includes(parts.slice(0, i + 1).join('/') + '/'));
    if (!covered) missing.push(rel);
  }
  expect(missing, 'zet ze in docs/credits.md (eigen werk of met maker, licentie en link)').toEqual([]);
});

test('store-teksten: tien talen, elk met titel, korte en volledige beschrijving binnen de lengtes van Google Play', async () => {
  const dirs = fs.readdirSync(path.join(ROOT, 'store')).filter(d => fs.statSync(path.join(ROOT, 'store', d)).isDirectory() && d !== 'screenshots' && d !== 'beelden');
  expect(dirs.sort()).toEqual(['de-DE', 'en-US', 'es-ES', 'fr-FR', 'id', 'it-IT', 'nl-NL', 'pl-PL', 'pt-BR', 'tr-TR']);
  for (const d of dirs) {
    const read = f => fs.readFileSync(path.join(ROOT, 'store', d, f), 'utf8').trim();
    expect(read('titel.txt').length, `${d}: titel`).toBeLessThanOrEqual(30);
    expect(read('korte-beschrijving.txt').length, `${d}: korte beschrijving`).toBeLessThanOrEqual(80);
    expect(read('volledige-beschrijving.txt').length, `${d}: volledige beschrijving`).toBeLessThanOrEqual(4000);
    expect(read('volledige-beschrijving.txt'), `${d}: Studio Sedillo genoemd`).toContain('Studio Sedillo');
  }
});
