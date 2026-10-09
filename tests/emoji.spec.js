// Punt 50: nergens een emoji. Scant de broncode én de interface in alle toestanden.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openGame, emojiIn, domText, until, setView } = require('./helpers');

const ROOT = path.join(__dirname, '..');

function sourceFiles() {
  const out = ['index.html', 'manifest.json', 'sw.js'];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!/^js\/(vendor|utils)$/.test(rel)) walk(rel); }
      else if (/\.(js|css|html|json|svg)$/.test(e.name)) out.push(rel);
    }
  };
  ['js', 'css', 'assets/icons'].forEach(walk);
  return out;
}

test('geen emoji in de broncode (html, css, js, manifest, iconen)', async ({}, info) => {
  test.skip(info.project.name !== 'phone-portrait', 'bronscan hoeft maar één keer');
  const hits = [];
  for (const file of sourceFiles()) {
    const found = emojiIn(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    if (found.length) hits.push(`${file}: ${found.join(' ')}`);
  }
  expect(hits, `Emoji gevonden:\n${hits.join('\n')}`).toEqual([]);
  expect(sourceFiles().length).toBeGreaterThan(40);
});

test('geen emoji in de interface, in geen enkele toestand', async ({ page }) => {
  await openGame(page, { save: { score: 190, level: 1 } });
  const seen = [];
  const scan = async label => { const f = emojiIn(await domText(page)); if (f.length) seen.push(`${label}: ${f.join(' ')}`); };

  await scan('start');
  await page.locator('#btn-menu').click(); await scan('menu');
  await page.locator('#main-menu [data-action="credits"]').click(); await scan('credits');
  await page.locator('#btn-credits-close').click();
  await page.locator('#btn-camera').click(); await scan('cameramenu');
  await page.locator('#btn-camera').click();

  // spoelen (melding + level-up-banner bij 200 punten), verstopping, alle chaos-effecten, ontstoppen
  await page.locator('#flush-btn').click(); await scan('spoelen + level-up');
  await page.evaluate(() => window.__game.forceClog('teddy'));
  await until(page, () => window.__game.three.propInBowl());
  await scan('verstopt');
  for (const id of ['rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball']) {
    await page.evaluate(t => window.__game.useTool(t), id);
    await scan(`chaos ${id}`);
  }
  await page.evaluate(() => window.__game.useTool('plunger'));
  await scan('ontstopt');

  await setView(page, 'bucket'); await scan('emmerweergave');
  await page.locator('#btn-back').click();

  await page.evaluate(() => window.__game.setScore(99999));
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  await scan('winkel open');
  await page.locator('.buy-card').first().click(); await scan('winkelmelding');

  expect(seen, `Emoji in de interface:\n${seen.join('\n')}`).toEqual([]);
});

test('geen emoji in de desktop-preview', async ({ page }, info) => {
  test.skip(info.project.name !== 'tablet-landscape', 'preview is voor brede schermen');
  await page.goto('./?preview=phone&clogs=off');
  await expect(page.locator('#pv-toolbar')).toBeVisible();
  expect(emojiIn(await domText(page))).toEqual([]);
});

test('elk icoon in de interface bestaat in de sprite', async ({ page }) => {
  await openGame(page, { save: { score: 99999, level: 5 } });
  await page.locator('#btn-shop').click();
  for (const h of await page.locator('.shop-category-header').all()) await h.click();
  const sprite = fs.readFileSync(path.join(ROOT, 'assets/icons/sprite.svg'), 'utf8');
  const ids = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
  const used = await page.evaluate(() => [...document.querySelectorAll('svg use')].map(u => u.getAttribute('href')));
  expect(used.length).toBeGreaterThan(60);
  const missing = used.filter(h => !h.startsWith('assets/icons/sprite.svg#') || !ids.has(h.split('#')[1]));
  expect(missing).toEqual([]);
});
