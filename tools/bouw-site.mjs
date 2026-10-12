// Zet klaar wat naar GitHub Pages gaat voor de TESTVERSIE (Apps/CLAUDE.md, sectie 11, punt 4):
//   repo the-flush-factor-test  ->  https://jmldewaal-sedillo.github.io/the-flush-factor-test/
// Geen eigen domein en geen CNAME. De testversie is altijd noindex (meta-tag in elke pagina en een
// robots.txt die alles weigert) en heet "TEST" op het startscherm.
// De live-repo publiceert hier niet mee: die staat nog rechtstreeks op GitHub Pages vanaf branch main.
//
// Gebruik: node tools/bouw-site.mjs <uitvoermap> <repo-naam> [commit-id]
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const [outArg, repo, commit = ''] = process.argv.slice(2);
if (!outArg || !repo) { console.error('Gebruik: node tools/bouw-site.mjs <uitvoermap> <repo-naam> [commit-id]'); process.exit(1); }
if (!/-test$/.test(repo)) { console.error(`Alleen voor de test-repo (naam eindigt op -test), niet voor "${repo}".`); process.exit(1); }
const out = resolve(outArg);
if (out === ROOT || ROOT.startsWith(out + sep)) { console.error('De uitvoermap mag niet de app-map zelf zijn.'); process.exit(1); }

// Wat niet bij het spel hoort en dus niet op de site komt.
const NOT_ON_SITE = new Set([
  '.git', '.github', '.gitignore', '_site', 'node_modules',
  'docs', 'store', 'tests', 'tools', 'test-results', 'playwright-report',
  'package.json', 'package-lock.json', 'playwright.config.js', 'credits.txt', 'CNAME',
]);
// style-preview.html (de drie stijlrichtingen, punt 78) gaat wél mee naar de testversie, zodat Jenn hem op
// haar telefoon kan bekijken; hij hoort niet bij het spel en zit niet in de service worker.
const NOT_IN_ASSETS = new Set(['reference']);      // referentiemateriaal van de maker

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
(function copy(from, to) {
  for (const name of readdirSync(from)) {
    const src = join(from, name), dst = join(to, name);
    const top = from === ROOT;
    if (resolve(src) === out || (top && (NOT_ON_SITE.has(name) || name.endsWith('.md')))) continue;
    if (from === join(ROOT, 'assets') && NOT_IN_ASSETS.has(name)) continue;
    if (statSync(src).isDirectory()) { mkdirSync(dst, { recursive: true }); copy(src, dst); } else copyFileSync(src, dst);
  }
})(ROOT, out);

writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(out, 'version.json'), JSON.stringify({ repo, commit, built: new Date().toISOString() }) + '\n');

// noindex in elke pagina
for (const name of readdirSync(out).filter(n => n.endsWith('.html'))) {
  const file = join(out, name);
  const html = readFileSync(file, 'utf8');
  if (/name="robots"/.test(html)) continue;
  const next = html.replace(/<head>/, '<head>\n  <meta name="robots" content="noindex, nofollow">');
  if (next === html) { console.error(`${name}: geen <head> gevonden voor noindex.`); process.exit(1); }
  writeFileSync(file, next);
}

// Eigen naam, zodat een geïnstalleerde testversie herkenbaar is op het startscherm.
const manifestFile = join(out, 'manifest.webmanifest');
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
manifest.name = 'TEST – ' + manifest.name;
manifest.short_name = ('TEST ' + manifest.short_name).slice(0, 12);
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');

for (const must of ['index.html', 'sw.js', 'manifest.webmanifest', 'privacy.html', 'delete.html', 'verwijderen.html', 'style-preview.html', 'robots.txt']) {
  if (!existsSync(join(out, must))) { console.error(`Ontbreekt in de site: ${must}`); process.exit(1); }
}
if (existsSync(join(out, 'CNAME'))) { console.error('Er staat een CNAME in de site; de testversie hoort op github.io.'); process.exit(1); }
console.log(`Testversie klaargezet in ${relative(process.cwd(), out) || out} (noindex, zonder eigen domein)`);
