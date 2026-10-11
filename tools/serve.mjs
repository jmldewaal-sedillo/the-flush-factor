// Statische testserver. Serveert de repo onder een submap (standaard /the-flush-factor/),
// net als GitHub Pages, zodat absolute paden in de code meteen als 404 opvallen.
// Gebruik: node tools/serve.mjs [poort] [basispad] [--strict]
// Is de poort bezet, dan neemt hij de eerstvolgende vrije. Met --strict (de tests) stopt hij dan met een fout,
// omdat de tests een vast adres verwachten.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const STRICT = process.argv.includes('--strict');
const PORT = Number(ARGS[0] || process.env.PORT || 5000);
const BASE = (ARGS[1] || process.env.BASE || '/the-flush-factor/').replace(/\/?$/, '/');
const MAX_TRIES = 20;   // zoveel poorten na de gevraagde proberen

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  if (path === BASE.slice(0, -1)) { res.writeHead(301, { Location: BASE }); return res.end(); }
  if (!path.startsWith(BASE)) { res.writeHead(404); return res.end('404 (buiten basispad)'); }
  path = normalize(path.slice(BASE.length) || 'index.html');
  if (path.endsWith('/')) path += 'index.html';
  let file = join(ROOT, path);
  // GitHub Pages serveert /privacy als privacy.html: hier ook, zodat die adressen lokaal te testen zijn
  if (!extname(path) && await stat(file + '.html').then(() => true, () => false)) file += '.html';
  if (!file.startsWith(ROOT) || /(^|\/)(node_modules|\.git)(\/|$)/.test(path)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(file);
    const body = await readFile(s.isDirectory() ? join(file, 'index.html') : file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404); res.end('404'); }
});

let port = PORT;
server.on('error', err => {
  if (err.code !== 'EADDRINUSE') throw err;
  if (STRICT || port >= PORT + MAX_TRIES) {
    console.error(STRICT ? `Poort ${port} is bezet (--strict: geen andere poort gekozen).`
                         : `Geen vrije poort gevonden tussen ${PORT} en ${port}.`);
    process.exit(1);
  }
  server.listen(++port);
});
server.on('listening', () => {
  const url = `http://localhost:${port}${BASE}`;
  if (port !== PORT) console.log(`\nPoort ${PORT} is bezet; de server draait op poort ${port}.`);
  console.log(`\n  The Flush Factor draait op:\n\n    ${url}\n    ${url}style-preview.html  (stijlvoorbeelden)\n\n  Stoppen: Ctrl+C\n`);
});
server.listen(port);
