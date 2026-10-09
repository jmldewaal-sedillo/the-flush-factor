// Punten 55 en 57: layout op alle formaten, met notch- en punch-hole-profiel.
const { test, expect } = require('@playwright/test');
const { openGame, setView, until } = require('./helpers');

// safe-area [boven, rechts, onder, links] zoals een telefoon die doorgeeft
const PROFILES = {
  'geen uitsparing': { portrait: [0, 0, 0, 0], landscape: [0, 0, 0, 0] },
  notch:             { portrait: [47, 0, 34, 0], landscape: [0, 0, 21, 47] },
  'punch-hole':      { portrait: [36, 0, 20, 0], landscape: [0, 0, 20, 36] },
};
const CONTROLS = ['#btn-camera', '#btn-menu', '#score-bubble', '#btn-shop', '#flush-btn', '#btn-bucket', '#bucket-liters', '.water-bar'];
const MARGIN = 6;
const overlap = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;

async function boxes(page, selectors) {
  const out = {};
  for (const sel of selectors) {
    const all = await page.locator(sel).all();
    for (let i = 0; i < all.length; i++) {
      if (!(await all[i].isVisible())) continue;
      out[all.length > 1 ? `${sel}[${i}]` : sel] = await all[i].boundingBox();
    }
  }
  return out;
}

function expectInside(b, vp, safe, label) {
  const [t, r, bt, l] = safe;
  for (const [name, box] of Object.entries(b)) {
    expect(box.y, `${label}: ${name} boven (onder de uitsparing + marge)`).toBeGreaterThanOrEqual(t + MARGIN);
    expect(box.x, `${label}: ${name} links`).toBeGreaterThanOrEqual(l + MARGIN);
    expect(box.x + box.width, `${label}: ${name} rechts`).toBeLessThanOrEqual(vp.width - r - MARGIN);
    expect(box.y + box.height, `${label}: ${name} onder`).toBeLessThanOrEqual(vp.height - bt - MARGIN);
  }
}
function expectNoOverlap(b, label) {
  const keys = Object.keys(b);
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    expect(overlap(b[keys[i]], b[keys[j]]), `${label}: ${keys[i]} overlapt ${keys[j]}`).toBe(false);
  }
}

for (const [profile, safes] of Object.entries(PROFILES)) {
  test(`${profile}: alle knoppen binnen beeld, onder de uitsparing, zonder overlap`, async ({ page }) => {
    const vp = page.viewportSize();
    const safe = vp.width > vp.height ? safes.landscape : safes.portrait;
    // 16 gereedschappen: het zwaarste geval voor de linkerkolom
    await openGame(page, { query: `safe=${safe.join(',')}`, save: { level: 5, ownedTools: ['plunger', 'toilet-snake', 'drain-cleaner', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball', 'magic-wand', 'tiny-elephant', 'ninja-unclogger', 'super-plunger', 'megaphone', 'electric-plunger', 'hydro-jet', 'robot-arm'], bucketItems: [{ id: 'duck', liters: 1 }] } });

    const b = await boxes(page, [...CONTROLS, '.tool-btn', '#btn-bucket-empty']);
    expect(Object.keys(b).filter(k => k.startsWith('.tool-btn'))).toHaveLength(16);
    expectInside(b, vp, safe, profile);
    expectNoOverlap(b, profile);

    // menu's blijven binnen beeld
    for (const [btn, menu] of [['#btn-menu', '#main-menu'], ['#btn-camera', '#camera-menu']]) {
      await page.locator(btn).click();
      expectInside(await boxes(page, [menu]), vp, safe, `${profile} ${menu}`);
      await page.locator(btn).click();
    }

    // emmerweergave
    await setView(page, 'bucket');
    const bb = await boxes(page, ['#btn-back', '#btn-menu', '#score-bubble', '#btn-shop', '#bucket-liters', '#btn-bucket-empty']);
    expectInside(bb, vp, safe, `${profile} emmerweergave`);
    expectNoOverlap(bb, `${profile} emmerweergave`);
    await page.locator('#btn-back').click();

    // winkelkop en credits onder de uitsparing
    await page.locator('#btn-shop').click();
    expectInside(await boxes(page, ['#btn-shop-close', '#shop-score']), vp, safe, `${profile} winkel`);
    await page.locator('#btn-shop-close').click();
    await page.locator('#btn-menu').click();
    await page.locator('#main-menu [data-action="credits"]').click();
    expectInside(await boxes(page, ['#credits-content']), vp, safe, `${profile} credits`);
  });
}

test('3D-scène vult het hele scherm tot achter de notch, zonder losse strook bovenin', async ({ page }) => {
  const vp = page.viewportSize();
  const safe = vp.width > vp.height ? PROFILES.notch.landscape : PROFILES.notch.portrait;
  await openGame(page, { query: `safe=${safe.join(',')}`, quality: 'medium', pixelRatio: 0.5 });
  const rect = await page.locator('#scene-canvas-3d').boundingBox();
  expect(rect).toEqual({ x: 0, y: 0, width: vp.width, height: vp.height });

  for (const id of ['toilet', 'wallBack', 'wallLeft', 'wallRight']) {
    await setView(page, id);
    expect(await page.evaluate(() => window.__game.three.topCovered()), `${id}: bovenrand van het beeld ligt op de wand`).toBe(true);
    // Controle op het beeld zelf: de bovenste strook is tegelwand, niet de donkere achtergrond.
    const shot = await page.screenshot({ clip: { x: 0, y: 0, width: vp.width, height: Math.max(safe[0], 24) } });
    const dark = await page.evaluate(async b64 => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 31) < 12 && Math.abs(d[i + 1] - 42) < 12 && Math.abs(d[i + 2] - 51) < 12) n++;
      return n / (d.length / 4);
    }, shot.toString('base64'));
    expect(dark, `${id}: aandeel achtergrondkleur in de bovenste strook`).toBeLessThan(0.02);
  }
});

test('draaien en formaat wisselen: scène en knoppen passen zich aan', async ({ page }) => {
  await openGame(page);
  for (const size of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 360, height: 740 }]) {
    await page.setViewportSize(size);
    await until(page, s => { const c = document.getElementById('scene-canvas-3d').getBoundingClientRect(); return c.width === s.width && c.height === s.height; }, size);
    const b = await boxes(page, [...CONTROLS, '.tool-btn']);
    expectInside(b, size, [0, 0, 0, 0], `${size.width}x${size.height}`);
    expectNoOverlap(b, `${size.width}x${size.height}`);
    expect(await page.evaluate(() => window.__game.three.topCovered())).toBe(true);
  }
});
