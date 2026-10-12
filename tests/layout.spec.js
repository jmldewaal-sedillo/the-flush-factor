// Punten 55 en 57: layout op alle formaten, met notch- en punch-hole-profiel.
const { test, expect } = require('@playwright/test');
const { openGame, setView, until } = require('./helpers');

// safe-area [boven, rechts, onder, links] zoals een telefoon die doorgeeft
const PROFILES = {
  'geen uitsparing': { portrait: [0, 0, 0, 0], landscape: [0, 0, 0, 0] },
  notch:             { portrait: [47, 0, 34, 0], landscape: [0, 0, 21, 47] },
  'punch-hole':      { portrait: [36, 0, 20, 0], landscape: [0, 0, 20, 36] },
};
const CONTROLS = ['#btn-camera', '#btn-menu', '#score-bubble', '#btn-shop', '#flush-btn', '#btn-bucket', '#bucket-liters', '.water-bar', '#btn-tools-toggle', '#inventory-bar', '#btn-clean'];
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
    await openGame(page, { query: `safe=${safe.join(',')}`, save: { level: 5, ownedTools: ['plunger', 'toilet-snake', 'drain-cleaner', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball', 'magic-wand', 'tiny-elephant', 'ninja-unclogger', 'super-plunger', 'megaphone', 'electric-plunger', 'hydro-jet', 'robot-arm'], bucketItems: [{ id: 'duck', liters: 1 }],
      purchased: ['sponge', 'toilet-brush', 'mop', 'spray', 'toilet-cleaner', 'scrubber', 'pressure-washer'] } });      // alle zeven schoonmaakmiddelen: de volste la

    // Het gereedschap staat in één kolom die scrollt (punt 82): de kolom zelf moet binnen beeld blijven
    // en nergens overheen vallen; de knoppen erin mogen elkaar niet raken.
    const b = await boxes(page, [...CONTROLS, '#btn-bucket-empty']);
    await expect(page.locator('.tool-btn')).toHaveCount(16);
    expectInside(b, vp, safe, profile);
    expectNoOverlap(b, profile);
    expectNoOverlap(await boxes(page, ['.tool-btn']), `${profile} gereedschap onderling`);

    // menu's blijven binnen beeld
    for (const [btn, menu] of [['#btn-menu', '#main-menu'], ['#btn-camera', '#camera-menu'], ['#btn-clean', '#clean-tray']]) {
      await page.locator(btn).click();
      const open = await boxes(page, [menu]);
      expectInside(open, vp, safe, `${profile} ${menu}`);
      // de schoonmaakla (punt 91) ligt niet over de spoelknop of de emmerknop
      if (menu === '#clean-tray') expectNoOverlap({ ...open, ...(await boxes(page, ['#flush-btn', '#btn-bucket'])) }, `${profile} schoonmaakla`);
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
  for (const size of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 360, height: 740 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(size);
    await until(page, s => { const c = document.getElementById('scene-canvas-3d').getBoundingClientRect(); return c.width === s.width && c.height === s.height; }, size);
    const b = await boxes(page, CONTROLS);
    // Ook met een breder systeemlettertype en een groot getal mag niets overlappen.
    await page.evaluate(() => { document.body.style.fontFamily = 'Verdana, DejaVu Sans, sans-serif'; document.body.style.letterSpacing = '0.08em'; document.getElementById('score-value').textContent = '99,9k'; document.getElementById('bucket-liters').textContent = '100,0 / 100 L'; });
    expectNoOverlap(await boxes(page, CONTROLS), `${size.width}x${size.height} breed lettertype`);
    await page.evaluate(() => { document.body.style.fontFamily = ''; document.body.style.letterSpacing = ''; });
    expectInside(b, size, [0, 0, 0, 0], `${size.width}x${size.height}`);
    expectNoOverlap(b, `${size.width}x${size.height}`);
    expect(await page.evaluate(() => window.__game.three.topCovered())).toBe(true);
  }
});

// ── Punt 70: knoppen zonder tekst, mét toegankelijke naam ──
test('winkelknop en "Legen" zijn alleen een icoon, rond, met aria-label', async ({ page }) => {
  await openGame(page, { save: { bucketItems: [{ id: 'duck', liters: 1 }] } });
  for (const [sel, label, iconId] of [['#btn-shop', 'Winkel', 'shopping-cart'], ['#btn-bucket-empty', 'Emmer legen', 'trash-2']]) {
    const btn = page.locator(sel);
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-label', label);
    expect((await btn.innerText()).trim(), `${sel} heeft geen zichtbare tekst`).toBe('');
    await expect(btn.locator('svg use')).toHaveAttribute('href', new RegExp(`#${iconId}$`));
    const box = await btn.boundingBox();
    expect(Math.abs(box.width - box.height), `${sel} is rond`).toBeLessThan(1);
    expect(box.width, `${sel} is groot genoeg om te tikken`).toBeGreaterThanOrEqual(44);
    expect(await btn.evaluate(el => getComputedStyle(el).borderRadius)).toBe('50%');
  }
  // ze doen nog wat ze moeten doen
  await page.locator('#btn-bucket-empty').click();
  await expect(page.locator('#bucket-liters')).toHaveText('0,0 / 20 L');
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
});
