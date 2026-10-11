// Punten 64, 65, 66, 68: geen los hendeltje, in de pot kijken door te tikken, tik in / tik uit, waterstroom.
const { test, expect } = require('@playwright/test');
const { openGame, until, cameraIdle, setView, tapScene, expectNoProblems } = require('./helpers');

const three = (page, fn) => page.evaluate(name => window.__game.three[name](), fn);
const tapToilet = async page => tapScene(page, await three(page, 'toiletScreen'));
const tapBucket = async page => tapScene(page, await three(page, 'bucketScreen'));

test('één spoelhendel op de stortbak; stopkraan en slang (het "losse hendeltje") zijn weg', async ({ page }) => {
  const problems = await openGame(page);
  const parts = await three(page, 'toiletParts');
  expect(parts.flushHandles).toBe(1);
  expect(parts.plumbingPartsHidden).toBe(6);                       // kraan, wandplaat, slang en koppelingen
  expect(parts.boltsHidden).toBe(4);                               // de zwarte bouten bij de voet en onder de stortbak (punt 90)
  expect(parts.bodyWidth).toBeLessThan(parts.widthWithPlumbing - 0.03);   // er steekt niets meer links uit
  expect(parts.handleAngle).toBe(0);

  // de hendel beweegt bij het spoelen en komt weer terug
  await page.locator('#flush-btn').click();
  await until(page, () => window.__game.three.toiletParts().handleAngle > 0.2);
  await until(page, () => window.__game.three.toiletParts().handleAngle === 0);
  expectNoProblems(problems);
});

test('tik op het toilet zoomt in op de pot; spoelknop en gereedschap blijven bruikbaar', async ({ page }) => {
  await openGame(page);
  await tapToilet(page);
  await until(page, () => window.__game.three.view() === 'bowl');
  await cameraIdle(page);
  await expect(page.locator('body')).toHaveAttribute('data-view', 'bowl');
  for (const sel of ['#flush-btn', '#hud-left', '.tool-btn[data-id="plunger"]', '#btn-back', '#btn-bucket']) await expect(page.locator(sel).first()).toBeVisible();
  await expect(page.locator('#btn-camera')).toBeHidden();

  // ingezoomd spoelen
  await page.locator('#flush-btn').click();
  await expect(page.locator('#score-value')).toHaveText('10');
  // ingezoomd ontstoppen
  await page.evaluate(() => window.__game.forceClog('fish'));
  await until(page, () => window.__game.three.propInBowl());
  await page.locator('.tool-btn[data-id="plunger"]').click();
  await until(page, () => !window.__game.snapshot().clogged && window.__game.three.bucketItemCount() === 1);
  // de speler koos zelf voor deze weergave: na het ontstoppen blijft hij staan
  await page.waitForTimeout(900);
  expect(await three(page, 'view')).toBe('bowl');
});

test('tik in, tik uit: toilet en emmer gaan terug naar het vorige standpunt', async ({ page }) => {
  await openGame(page);
  // vanuit het toiletbeeld
  await tapToilet(page);
  await until(page, () => window.__game.three.view() === 'bowl'); await cameraIdle(page);
  await tapToilet(page);
  await until(page, () => window.__game.three.view() === 'toilet'); await cameraIdle(page);

  // emmer: in via tik, uit via tik ergens anders in de scène
  await tapBucket(page);
  await until(page, () => window.__game.three.view() === 'bucket'); await cameraIdle(page);
  await tapScene(page, { x: 20, y: page.viewportSize().height / 2 });
  await until(page, () => window.__game.three.view() === 'toilet'); await cameraIdle(page);

  // vanuit een ander standpunt: terug naar dát standpunt, ook met de Terug-knop en met Esc
  await setView(page, 'overview');
  await tapBucket(page);
  await until(page, () => window.__game.three.view() === 'bucket'); await cameraIdle(page);
  await tapBucket(page);
  await until(page, () => window.__game.three.view() === 'overview'); await cameraIdle(page);

  await tapToilet(page);
  await until(page, () => window.__game.three.view() === 'bowl'); await cameraIdle(page);
  await page.locator('#btn-back').click();
  await until(page, () => window.__game.three.view() === 'overview'); await cameraIdle(page);

  await tapToilet(page);
  await until(page, () => window.__game.three.view() === 'bowl');
  await page.keyboard.press('Escape');
  await until(page, () => window.__game.three.view() === 'overview');
});

test('verstopping zoomt vanzelf in op de pot en daarna weer uit', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__game.forceClog('duck'));
  await until(page, () => window.__game.three.view() === 'bowl' && window.__game.three.propInBowl());
  await page.evaluate(() => window.__game.useTool('plunger'));
  await until(page, () => window.__game.three.view() === 'toilet');
});

for (const quality of ['low', 'medium']) {
  test(`spoelen laat water stromen (kwaliteit ${quality}): gordijn, kolk, leeglopen, weer vol`, async ({ page }) => {
    await openGame(page, { quality, pixelRatio: 0.5 });
    await tapToilet(page);
    await until(page, () => window.__game.three.view() === 'bowl');
    await cameraIdle(page);
    const idle = await three(page, 'flush');
    expect(idle).toMatchObject({ active: false, curtainVisible: false, swirl: 0, drop: 0 });
    expect(idle.curtainTriangles).toBeGreaterThan(100);
    expect(idle.seconds).toBeGreaterThanOrEqual(1.5);
    expect(idle.seconds).toBeLessThanOrEqual(2);

    // beeld in rust tegenover beeld midden in de spoelbeurt: het gebied rond de pot moet echt veranderen
    const clip = await page.evaluate(() => { const t = window.__game.three, c = t.project(0.03, 0.36, 0.44); const r = Math.min(innerWidth, innerHeight) * 0.16; return { x: c.x - r, y: c.y - r, width: r * 2, height: r * 2 }; });
    const before = await page.screenshot({ clip });
    await page.evaluate(() => window.__game.three.freezeFlush(0.3));
    await until(page, () => window.__game.three.flush().curtainVisible && window.__game.three.flush().swirl > 0.5);
    const during = await page.screenshot({ clip });
    const changed = await page.evaluate(async ([a, b]) => {
      const px = async b64 => { const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
      const [p, q] = [await px(a), await px(b)];
      let n = 0;
      for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 36) n++;
      return n / (p.length / 4);
    }, [before.toString('base64'), during.toString('base64')]);
    expect(changed, 'aandeel beeldpunten rond de pot dat verandert tijdens het spoelen').toBeGreaterThan(0.12);
    await page.evaluate(() => window.__game.three.freezeFlush(null));

    // echte spoelbeurt: alle fases komen langs en het water staat daarna weer op rustpeil
    await page.locator('#flush-btn').click();
    await until(page, () => window.__game.three.flush().active && window.__game.three.flush().curtainVisible);
    await until(page, () => { const f = window.__game.three.flush(); return f.drop > 0.5 && f.waterY < f.restY - 0.01; });
    await until(page, () => !window.__game.three.flush().active);
    await until(page, () => { const f = window.__game.three.flush(); return !f.curtainVisible && Math.abs(f.waterY - f.restY) < 0.003; });
  });
}
