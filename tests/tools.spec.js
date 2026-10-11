// Punt 82: gereedschapsmenu links — één kolom, scrollt met vervaging, klapt in, naam bij lang indrukken.
const { test, expect } = require('@playwright/test');
const { openGame, until, NEW_PLAYER } = require('./helpers');

const ALL = ['plunger', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'toilet-snake', 'magic-wand', 'disco-ball', 'megaphone', 'drain-cleaner', 'tiny-elephant', 'ninja-unclogger', 'super-plunger', 'electric-plunger', 'hydro-jet', 'robot-arm'];
const bar = page => page.locator('#inventory-bar');
const metrics = page => bar(page).evaluate(el => ({ scrollTop: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, top: el.dataset.fadeTop, bottom: el.dataset.fadeBottom, mask: getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage }));

test('begin (4 stuks): één kolom, alles in beeld, niets te scrollen', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER } });
  const boxes = await page.locator('.tool-btn').evaluateAll(els => els.map(e => e.getBoundingClientRect().toJSON()));
  expect(boxes).toHaveLength(4);
  expect(new Set(boxes.map(b => Math.round(b.x))).size, 'één kolom').toBe(1);
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height);
  const vp = page.viewportSize();
  const m = await metrics(page);
  if (vp.height > 520) {            // staand en tablet: alle vier passen
    expect(m.scrollHeight).toBeLessThanOrEqual(m.clientHeight + 1);
    expect(m).toMatchObject({ top: 'false', bottom: 'false' });
  }
});

test('veel gereedschap (16): nog steeds één kolom, scrollt, met vervaging waar meer is', async ({ page }) => {
  await openGame(page, { save: { level: 5, ownedTools: ALL } });
  const xs = await page.locator('.tool-btn').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().x)));
  expect(xs).toHaveLength(16);
  expect(new Set(xs).size, 'één kolom, niet door elkaar over twee').toBe(1);

  let m = await metrics(page);
  expect(m.scrollHeight, 'er valt te scrollen').toBeGreaterThan(m.clientHeight + 40);
  expect(m).toMatchObject({ top: 'false', bottom: 'true' });
  expect(m.mask).toContain('linear-gradient');
  // de kolom blijft binnen het scherm en boven de schoonmaak-/onderrand
  const box = await bar(page).boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);

  await bar(page).evaluate(el => el.scrollTo(0, 120));
  await until(page, () => document.getElementById('inventory-bar').dataset.fadeTop === 'true');
  await bar(page).evaluate(el => el.scrollTo(0, el.scrollHeight));
  await until(page, () => document.getElementById('inventory-bar').dataset.fadeBottom === 'false');
  // het onderste gereedschap is na scrollen te gebruiken
  await page.evaluate(() => window.__game.forceClog('duck'));
  await page.locator('.tool-btn[data-id="robot-arm"]').click();
  await until(page, () => !window.__game.snapshot().clogged);
});

test('in- en uitklappen maakt de scène vrij en wordt onthouden', async ({ page }) => {
  await openGame(page, { save: { level: 5, ownedTools: ALL } });
  const toggle = page.locator('#btn-tools-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(bar(page)).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAttribute('aria-label', 'Gereedschap tonen');
  await expect(bar(page)).toBeHidden();
  await expect(page.locator('.tool-btn').first()).toBeHidden();
  await expect(page.locator('.water-bar')).toBeVisible();          // de waterstand blijft in beeld
  await page.reload();
  await until(page, () => window.__game?.ready);
  await expect(bar(page)).toBeHidden();
  await page.locator('#btn-tools-toggle').click();
  await expect(bar(page)).toBeVisible();
  await expect(page.locator('.tool-btn')).toHaveCount(16);
});

test('onderscheid onbekend / werkt / chaos, en afkoelen met seconden', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER } });
  const plunger = page.locator('.tool-btn[data-id="plunger"]'), duck = page.locator('.tool-btn[data-id="rubber-duck"]');
  await expect(plunger).toHaveAttribute('data-kind', 'unknown');
  await expect(plunger.locator('.tool-badge')).toHaveText('?');
  await page.evaluate(() => window.__game.forceClog('fish'));
  await duck.click();
  await expect(duck).toHaveAttribute('data-kind', 'chaos');
  await plunger.click();
  await expect(plunger).toHaveAttribute('data-kind', 'working');
  const colors = await page.evaluate(() => ['plunger', 'rubber-duck', 'hot-water'].map(id => getComputedStyle(document.querySelector(`.tool-btn[data-id="${id}"]`)).backgroundColor));
  expect(new Set(colors).size, 'drie soorten, drie kleuren').toBe(3);
  await expect(plunger).toHaveClass(/on-cooldown/);
  await expect(plunger.locator('.cd-secs')).toHaveText(/^\d+s$/);
  const secs = await plunger.locator('.cd-secs').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(secs, 'seconden goed leesbaar').toBeGreaterThanOrEqual(11);
});

test('lang indrukken toont de korte naam en gebruikt het gereedschap niet', async ({ page }) => {
  await openGame(page, { save: { ...NEW_PLAYER } });
  await page.evaluate(() => window.__game.forceClog('fish'));
  await until(page, () => window.__game.snapshot().clogged);
  const btn = page.locator('.tool-btn[data-id="hot-water"]');
  const b = await btn.boundingBox();
  await expect(page.locator('#tool-tip')).toBeHidden();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await expect(page.locator('#tool-tip')).toBeVisible();
  await expect(page.locator('#tool-tip')).toHaveText('Heet water');
  await page.mouse.up();
  await expect(btn).not.toHaveClass(/on-cooldown/);
  expect((await page.evaluate(() => window.__game.snapshot())).clogged).toBe(true);
  // een gewone tik gebruikt het wel
  await btn.click();
  await expect(btn).toHaveClass(/on-cooldown/);
});
