// Bouwt het spel voor één bouwdoel. Eén codebase, per bouwdoel alleen een dunne laag (platform/<doel>.js).
// Zie Apps/CLAUDE.md, sectie 11, "App-structuur Studio Sedillo".
//
//   node tools/bouw.mjs app                  -> dist/app/   voor Capacitor: Android én iOS (docs/app.md)
//   node tools/bouw.mjs android | ios        -> hetzelfde (dist/app/); beide apps krijgen dezelfde bestanden
//   node tools/bouw.mjs test <repo> [commit] -> dist/test/  testversie voor github.io, altijd noindex
//   node tools/bouw.mjs pages <repo> [commit]   wat de workflow publiceert: de testversie, alleen voor <naam>-test
//   --uit <map>                              andere uitvoermap
//
// Per bouwdoel:
//   app    alle bestanden in de app; geen service worker, geen manifest, geen keuzepagina's
//   test   service worker en manifest, noindex, "TEST" op het startscherm, met de keuzepagina's voor Jenn
// Het live adres (branch main van the-flush-factor) staat nog rechtstreeks op GitHub Pages: de bestanden in de
// root zijn zelf de webversie (platform/web.js), zonder bouwstap.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const argv = process.argv.slice(2);
let outArg = null;
const uit = argv.indexOf('--uit');
if (uit >= 0) { outArg = argv[uit + 1]; argv.splice(uit, 2); }
const [doel, ...rest] = argv;

function fail(message) { console.error('bouw: ' + message); process.exit(1); }

// Wat niet bij het spel hoort en dus in geen enkel bouwdoel komt.
const NOT_IN_GAME = new Set([
  '.git', '.github', '.gitignore', '_site', 'dist', 'android', 'ios', 'node_modules', 'platform',
  'docs', 'store', 'tests', 'tools', 'test-results', 'playwright-report',
  'package.json', 'package-lock.json', 'playwright.config.js', 'capacitor.config.json', 'credits.txt', 'CNAME',
]);
const NOT_IN_ASSETS = new Set(['reference']);                                // referentiemateriaal van de maker
// De keuzepagina's (stijl, punt 78; spoelicoon, punt 75) zijn voor Jenn op de testversie; niet in de app.
const PREVIEWS = ['style-preview.html', 'spoelicoon-preview.html'];
const ONLY_WITH_SERVICE_WORKER = ['sw.js', 'manifest.webmanifest'];
const WEB_LAYER = '<script src="platform/web.js"></script>';

function outDir(standard) {
  const out = resolve(outArg || join(ROOT, 'dist', standard));
  if (out === ROOT || ROOT.startsWith(out + sep)) fail('de uitvoermap mag niet de app-map zelf zijn');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  return out;
}
function copyGame(out, skip = new Set()) {
  (function copy(from, to) {
    for (const name of readdirSync(from)) {
      const src = join(from, name), dst = join(to, name);
      const top = from === ROOT;
      if (resolve(src) === out || (top && (NOT_IN_GAME.has(name) || skip.has(name) || name.endsWith('.md')))) continue;
      if (from === join(ROOT, 'assets') && NOT_IN_ASSETS.has(name)) continue;
      if (statSync(src).isDirectory()) { mkdirSync(dst, { recursive: true }); copy(src, dst); } else copyFileSync(src, dst);
    }
  })(ROOT, out);
}
function allFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) allFiles(full, base, out); else out.push(relative(base, full).split(sep).join('/'));
  }
  return out.sort();
}
function htmlPages(out) { return readdirSync(out).filter(n => n.endsWith('.html')); }

// De laag van dit bouwdoel in de pagina's die hem laden (index.html), en zo nodig zonder manifest.
function setLayer(out, platform, { serviceWorker }) {
  mkdirSync(join(out, 'platform'), { recursive: true });
  copyFileSync(join(ROOT, 'platform', `${platform}.js`), join(out, 'platform', `${platform}.js`));
  let pages = 0;
  for (const name of htmlPages(out)) {
    let html = readFileSync(join(out, name), 'utf8');
    if (html.includes(WEB_LAYER)) { html = html.replace(WEB_LAYER, `<script src="platform/${platform}.js"></script>`); pages++; }
    if (!serviceWorker) html = html.replace(/^[ \t]*<link rel="manifest"[^>]*>\r?\n/m, '');
    writeFileSync(join(out, name), html);
  }
  if (!pages) fail('geen enkele pagina laadt platform/web.js; de laag van het bouwdoel is nergens gezet');
  if (!serviceWorker) for (const name of ONLY_WITH_SERVICE_WORKER) rmSync(join(out, name), { force: true });
}
function mustExist(out, files) {
  for (const f of files) if (!existsSync(join(out, f))) fail(`ontbreekt in ${relative(ROOT, out) || out}: ${f}`);
}

// ---------- de bouwdoelen ----------
function bouwApp() {
  const out = outDir('app');
  copyGame(out, new Set(PREVIEWS));
  setLayer(out, 'app', { serviceWorker: false });
  mustExist(out, ['index.html', 'privacy.html', 'delete.html', 'platform/app.js', 'js/game.js', 'assets/models/toilet.glb']);
  for (const gone of [...ONLY_WITH_SERVICE_WORKER, ...PREVIEWS]) if (existsSync(join(out, gone))) fail(`hoort niet in de app: ${gone}`);
  console.log(`App (Android en iOS): ${relative(process.cwd(), out) || out} (${allFiles(out).length} bestanden, zonder service worker). Daarna: npx cap sync`);
}

function bouwTest(repo, commit = '') {
  if (!/-test$/.test(repo || '')) fail(`de testversie is alleen voor de test-repo (naam eindigt op -test), niet voor "${repo}"`);
  const out = outDir('test');
  copyGame(out);
  setLayer(out, 'web', { serviceWorker: true });
  writeFileSync(join(out, '.nojekyll'), '');
  writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(join(out, 'version.json'), JSON.stringify({ doel: 'test', repo, commit, built: new Date().toISOString() }) + '\n');

  // noindex in elke pagina
  for (const name of htmlPages(out)) {
    const file = join(out, name);
    const html = readFileSync(file, 'utf8');
    if (/name="robots"/.test(html)) continue;
    const next = html.replace(/<head>/, '<head>\n  <meta name="robots" content="noindex, nofollow">');
    if (next === html) fail(`${name}: geen <head> gevonden voor noindex`);
    writeFileSync(file, next);
  }

  // Eigen naam, zodat een geïnstalleerde testversie herkenbaar is op het startscherm.
  const manifestFile = join(out, 'manifest.webmanifest');
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  manifest.name = 'TEST – ' + manifest.name;
  manifest.short_name = ('TEST ' + manifest.short_name).slice(0, 12);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');

  mustExist(out, ['index.html', 'sw.js', 'manifest.webmanifest', 'privacy.html', 'delete.html', 'verwijderen.html', ...PREVIEWS, 'robots.txt', 'platform/web.js']);
  if (existsSync(join(out, 'CNAME'))) fail('er staat een CNAME in de testversie; die hoort op github.io');
  console.log(`Testversie: ${relative(process.cwd(), out) || out} (${allFiles(out).length} bestanden, noindex, zonder eigen domein)`);
}

switch (doel) {
  case 'app': case 'android': case 'ios': bouwApp(); break;
  case 'test': bouwTest(rest[0], rest[1] || ''); break;
  case 'pages':
    if (!/-test$/.test(rest[0] || '')) { console.log(`Niets te publiceren voor ${rest[0]}: alleen de test-repo publiceert via de workflow.`); break; }
    if (!outArg) outArg = join(ROOT, '_site');
    bouwTest(rest[0], rest[1] || '');
    break;
  default:
    console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(3, 9).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(2);
}
