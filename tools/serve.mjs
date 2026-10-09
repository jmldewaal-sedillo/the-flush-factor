// Statische testserver. Serveert de repo onder een submap (standaard /the-flush-factor/),
// net als GitHub Pages, zodat absolute paden in de code meteen als 404 opvallen.
// Gebruik: node tools/serve.mjs [poort] [basispad]
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 5000);
const BASE = (process.argv[3] || process.env.BASE || '/the-flush-factor/').replace(/\/?$/, '/');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.md': 'text/markdown; charset=utf-8',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  if (path === BASE.slice(0, -1)) { res.writeHead(301, { Location: BASE }); return res.end(); }
  if (!path.startsWith(BASE)) { res.writeHead(404); return res.end('404 (buiten basispad)'); }
  path = normalize(path.slice(BASE.length) || 'index.html');
  if (path.endsWith('/')) path += 'index.html';
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || /(^|\/)(node_modules|\.git)(\/|$)/.test(path)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(file);
    const body = await readFile(s.isDirectory() ? join(file, 'index.html') : file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404); res.end('404'); }
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`));
