// Service worker: installeert in een submap (zoals GitHub Pages), cachet alles, werkt offline, herlaadt niet.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');
const { ready } = require('./helpers');

test.use({ serviceWorkers: 'allow' });

test('bestandslijst in sw.js is actueel', async ({}, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'één keer is genoeg');
  execFileSync('node', [path.join(__dirname, '..', 'tools', 'build-sw.mjs'), '--check'], { stdio: 'pipe' });
});

test('installeert, cachet alle bestanden, herlaadt de pagina niet en werkt offline', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'één keer is genoeg');
  let loads = 0;
  page.on('load', () => loads++);
  const failed = [];
  page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

  await page.goto('./?sw=on&clogs=off&quality=low');
  await ready(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });

  const cached = await page.evaluate(async () => {
    const names = (await caches.keys()).filter(k => k.startsWith('flushfactor-'));
    const keys = await (await caches.open(names[0])).keys();
    return { names, urls: keys.map(r => new URL(r.url).pathname) };
  });
  expect(cached.names).toHaveLength(1);
  expect(cached.urls.every(u => u.startsWith('/the-flush-factor/'))).toBe(true);
  for (const f of ['index.html', 'js/game.js', 'js/three/effects.js', 'js/vendor/three.module.min.js', 'assets/icons/sprite.svg', 'assets/models/toilet.glb', 'assets/models/buckets/wooden_bucket.glb', 'assets/textures/Tiles101_color.webp', 'assets/hdri/bathroom_512.hdr']) {
    expect(cached.urls, f).toContain(`/the-flush-factor/${f}`);
  }
  expect(failed).toEqual([]);
  expect(loads, 'de service worker mag de pagina niet herladen').toBe(1);

  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page.locator('#flush-btn').click();
  await expect(page.locator('#score-value')).toHaveText('10');
  await expect(page.locator('#flush-btn svg use')).toHaveAttribute('href', /sprite\.svg#flush/);
  await context.setOffline(false);
});

test('manifest verwijst naar bestaande iconen en een relatieve start-URL', async ({ request }, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'één keer is genoeg');
  const manifest = await (await request.get('./manifest.json')).json();
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  for (const icon of manifest.icons) {
    expect(icon.src.startsWith('data:')).toBe(false);
    expect((await request.get(`./${icon.src}`)).status(), icon.src).toBe(200);
  }
});
