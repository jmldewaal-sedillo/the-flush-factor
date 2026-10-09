// Werkt de bestandslijst in sw.js bij (tussen de PRECACHE-markeringen) en hoogt de versie op.
//   node tools/build-sw.mjs          → sw.js bijwerken
//   node tools/build-sw.mjs --check  → alleen controleren (gebruikt door de tests)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir, filter) {
  const out = [];
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...await walk(rel, filter));
    else if (filter(rel)) out.push(rel);
  }
  return out;
}

// Alles wat nodig is om het spel offline te starten. Extra emmers worden pas bij gebruik gecachet.
const files = [
  'index.html', 'manifest.json',
  ...await walk('css', f => f.endsWith('.css')),
  ...await walk('js', f => f.endsWith('.js')),
  'assets/icons/sprite.svg',
  ...await walk('assets/icons/app', f => f.endsWith('.png')),
  ...await walk('assets/textures', f => f.endsWith('.webp')),
  'assets/models/toilet.glb',
  'assets/models/buckets/wooden_bucket.glb',
  'assets/hdri/bathroom_512.hdr',
].sort();

const hash = createHash('sha1');
for (const f of files) hash.update(f).update(await readFile(join(ROOT, f)));
const version = hash.digest('hex').slice(0, 10);

const swPath = join(ROOT, 'sw.js');
const current = await readFile(swPath, 'utf8');
const block = `// PRECACHE:START (gegenereerd door tools/build-sw.mjs)\nconst VERSION = '${version}';\nconst PRECACHE = [\n  './',\n${files.map(f => `  '${f}',`).join('\n')}\n];\n// PRECACHE:END`;
const next = current.replace(/\/\/ PRECACHE:START[\s\S]*?\/\/ PRECACHE:END/, block);

if (process.argv.includes('--check')) {
  if (next !== current) { console.error('sw.js is niet actueel. Draai: npm run build'); process.exit(1); }
  console.log(`sw.js actueel (${files.length} bestanden, versie ${version})`);
} else {
  await writeFile(swPath, next);
  console.log(`sw.js bijgewerkt: ${files.length} bestanden, versie ${version}`);
}
