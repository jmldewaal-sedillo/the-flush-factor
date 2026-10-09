// Bouwt assets/icons/sprite.svg uit de losse, ongewijzigde bron-SVG's in assets/icons/.
//   node tools/build-icons.mjs            → sprite + credits-lijst opnieuw bouwen (geen netwerk)
//   node tools/build-icons.mjs --download → ontbrekende bron-SVG's eerst downloaden
// Bronnen: Lucide (ISC) via lucide-static; game-icons.net (CC BY 3.0), één bestand per icoon.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(await readFile(join(ROOT, 'tools/icons.config.json'), 'utf8'));
const download = process.argv.includes('--download');
const exists = p => access(p).then(() => true, () => false);

async function source(file, url) {
  const path = join(ROOT, 'assets/icons', file);
  if (!(await exists(path))) {
    if (!download) throw new Error(`Ontbreekt: assets/icons/${file} (draai met --download, bron: ${url})`);
    const res = await fetch(url);
    if (!res.ok || !(res.headers.get('content-type') || '').includes('svg')) throw new Error(`Download mislukt (${res.status}): ${url}`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, await res.text());
    console.log('gedownload', file);
  }
  return readFile(path, 'utf8');
}
const inner = svg => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();

const symbols = [];
for (const name of cfg.lucide) {
  const svg = await source(`lucide/${name}.svg`, `https://unpkg.com/lucide-static@${cfg.lucideVersion}/icons/${name}.svg`);
  symbols.push(`<symbol id="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner(svg)}</symbol>`);
}
const byAuthor = {};
for (const [name, src] of Object.entries(cfg.gameIcons)) {
  const svg = await source(`game-icons/${src}.svg`, `https://game-icons.net/icons/000000/transparent/1x1/${src}.svg`);
  symbols.push(`<symbol id="${name}" viewBox="0 0 512 512" fill="currentColor">${inner(svg).replace(/ fill="#000"/g, '')}</symbol>`);
  const [author, file] = src.split('/');
  (byAuthor[author] ||= []).push(file);
}
if (new Set(symbols.map(s => s.match(/id="([^"]+)"/)[1])).size !== symbols.length) throw new Error('Dubbele icoonnaam in icons.config.json');

await writeFile(join(ROOT, 'assets/icons/sprite.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Gegenereerd door tools/build-icons.mjs. Lucide (ISC) + game-icons.net (CC BY 3.0); zie CREDITS.md -->\n${symbols.join('\n')}\n</svg>\n`);

const AUTHOR_NAMES = { delapouite: 'Delapouite', lorc: 'Lorc', sbed: 'sbed' };
const credits = Object.entries(byAuthor).sort().map(([a, files]) => ({ author: AUTHOR_NAMES[a] || a, url: `https://game-icons.net/1x1/${a}/`, icons: files.sort() }));
await writeFile(join(ROOT, 'js/data/icon-credits.js'),
  `// GEGENEREERD door tools/build-icons.mjs — niet met de hand wijzigen.\nexport const ICON_NAMES = ${JSON.stringify([...cfg.lucide, ...Object.keys(cfg.gameIcons)])};\nexport const GAME_ICON_CREDITS = ${JSON.stringify(credits, null, 2)};\n`);
console.log(`sprite.svg: ${symbols.length} iconen (${cfg.lucide.length} Lucide, ${Object.keys(cfg.gameIcons).length} game-icons.net)`);
