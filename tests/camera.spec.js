// Punt 53: zes camerastanden, swipen tussen de muren, "+"-plekken in de muurstanden.
const { test, expect } = require('@playwright/test');
const { openGame, until, setView, cameraIdle, tapScene } = require('./helpers');

const VIEWS = { overview: 'Overzicht', toilet: 'Toilet', wallBack: 'Muur boven toilet', wallLeft: 'Linkermuur', wallRight: 'Rechtermuur', bucket: 'Emmer' };
const view = page => page.evaluate(() => window.__game.three.view());

test('cameraknop toont zes standen en elke stand is bereikbaar', async ({ page }) => {
  await openGame(page);
  await page.locator('#btn-camera').click();
  await expect(page.locator('#camera-menu .menu-item span')).toHaveText(Object.values(VIEWS));
  await page.locator('#btn-camera').click();
  await expect(page.locator('#camera-menu')).toBeHidden();

  for (const id of ['overview', 'wallBack', 'wallLeft', 'wallRight', 'toilet']) {
    await page.locator('#btn-camera').click();
    await page.locator(`#camera-menu [data-view="${id}"]`).click();
    await expect(page.locator('#camera-menu')).toBeHidden();
    await until(page, v => window.__game.three.view() === v, id);
    await cameraIdle(page);
    await expect(page.locator('body')).toHaveAttribute('data-view', id);
    await expect(page.locator(`#camera-menu [data-view="${id}"]`)).toHaveAttribute('aria-checked', 'true');
  }
});

test('vrije plekken ("+") alleen in overzicht en muurstanden; bezette plek heeft geen "+"', async ({ page }) => {
  await openGame(page, { save: { purchased: ['deco-mirror'], decor: { wallBack: 'deco-mirror' } } });
  const markers = () => page.evaluate(() => window.__game.three.markerCount());
  expect(await markers()).toBe(0);
  for (const id of ['wallBack', 'wallLeft', 'wallRight', 'overview']) {
    await setView(page, id);
    expect(await markers(), id).toBe(5);       // 6 ankerpunten, 1 bezet
  }
  await setView(page, 'toilet');
  expect(await markers()).toBe(0);
  await setView(page, 'bucket');
  expect(await markers()).toBe(0);
});

test('rustig slepen is rondkijken, geen wissel van stand', async ({ page }) => {
  await openGame(page);
  const vp = page.viewportSize();
  const y = Math.round(vp.height * 0.45);
  await page.mouse.move(vp.width * 0.6, y); await page.mouse.down();
  await page.mouse.move(vp.width * 0.6 - 30, y + 20, { steps: 2 });
  await page.mouse.up();
  expect(await view(page)).toBe('toilet');
});

test('swipen wisselt tussen linkermuur, midden en rechtermuur', async ({ page }) => {
  await openGame(page);
  // Bootst een veeg na met echte pointer-events op het canvas (links/rechts over een vrij stuk beeld).
  const swipe = async dir => {
    await page.evaluate(d => {
      const c = document.getElementById('scene-canvas-3d');
      const y = innerHeight * 0.45, from = innerWidth * (d < 0 ? 0.7 : 0.3), to = innerWidth * (d < 0 ? 0.3 : 0.7);
      const fire = (type, x) => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true }));
      fire('pointerdown', from);
      for (let i = 1; i <= 4; i++) fire('pointermove', from + (to - from) * i / 4);
      fire('pointerup', to);
    }, dir);
    await cameraIdle(page);
  };
  await swipe(-1); expect(await view(page)).toBe('wallRight');   // vinger naar links = naar rechts kijken
  await swipe(-1); expect(await view(page)).toBe('wallRight');   // einde van de ring
  await swipe(+1); expect(await view(page)).toBe('toilet');
  await swipe(+1); expect(await view(page)).toBe('wallLeft');
  await swipe(-1); expect(await view(page)).toBe('toilet');

  // vanuit "Muur boven toilet" keert swipen terug naar die stand
  await setView(page, 'wallBack');
  await swipe(+1); expect(await view(page)).toBe('wallLeft');
  await swipe(-1); expect(await view(page)).toBe('wallBack');
});

test('tik op de emmer in de scène opent de emmerweergave', async ({ page }) => {
  await openGame(page);
  await setView(page, 'overview');
  const p = await page.evaluate(() => window.__game.three.bucketScreen());
  const onCanvas = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id === 'scene-canvas-3d', p);
  test.skip(!onCanvas, 'emmer zit op dit formaat achter een knop; de emmerknop doet hetzelfde');
  await page.mouse.click(p.x, p.y);
  await until(page, () => window.__game.three.view() === 'bucket');
});

test('"Camera terugzetten" in het menu gaat terug naar het toilet', async ({ page }) => {
  await openGame(page);
  await setView(page, 'wallLeft');
  await page.locator('#btn-menu').click();
  await page.locator('#main-menu [data-action="camera-reset"]').click();
  await until(page, () => window.__game.three.view() === 'toilet');
});

// ── Punt 67: muren aantikken ──
test('tik op een muur gaat naar die muur; nog een tik op dezelfde muur gaat terug naar het toilet', async ({ page }) => {
  await openGame(page);
  const wall = i => page.evaluate(n => window.__game.three.wallScreen(n), i);
  const go = async (i, expected) => { await tapScene(page, await wall(i)); await until(page, v => window.__game.three.view() === v, expected); await cameraIdle(page); };
  await go(0, 'wallBack');
  await go(0, 'toilet');
  await go(1, 'wallLeft');
  await go(1, 'toilet');
  await go(2, 'wallRight');
  await go(2, 'toilet');
  // vanuit de ene muur direct naar de andere
  await go(0, 'wallBack');
  await go(1, 'wallLeft');
  // de cameraknop blijft werken
  await setView(page, 'toilet');
});

test('slepen, knijpen en lang vasthouden tellen niet als tik', async ({ page }) => {
  await openGame(page);
  const p = await page.evaluate(() => window.__game.three.wallScreen(0));
  const fire = (type, x, y, id = 5) => page.evaluate(([t, px, py, pid]) => document.getElementById('scene-canvas-3d').dispatchEvent(new PointerEvent(t, { pointerId: pid, pointerType: 'touch', clientX: px, clientY: py, bubbles: true })), [type, x, y, id]);

  // slepen (rustig, dus ook geen veeg)
  await fire('pointerdown', p.x, p.y);
  await fire('pointermove', p.x + 14, p.y + 12);
  await page.waitForTimeout(750);
  await fire('pointerup', p.x + 14, p.y + 12);
  // lang vasthouden
  await fire('pointerdown', p.x, p.y);
  await page.waitForTimeout(650);
  await fire('pointerup', p.x, p.y);
  // knijpen met twee vingers
  await fire('pointerdown', p.x - 30, p.y, 5); await fire('pointerdown', p.x + 30, p.y, 6);
  await fire('pointermove', p.x - 60, p.y, 5);
  await fire('pointerup', p.x - 60, p.y, 5); await fire('pointerup', p.x + 30, p.y, 6);

  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__game.three.view())).toBe('toilet');
  // een echte korte tik op dezelfde plek doet het wel
  await tapScene(page, p);
  await until(page, () => window.__game.three.view() === 'wallBack');
});

test('tik op een vrije "+"-plek geeft een melding en wisselt niet van stand', async ({ page }) => {
  await openGame(page);
  await setView(page, 'wallBack');
  const p = await page.evaluate(() => window.__game.three.project(0, 1.5, 0.006));
  await tapScene(page, p);
  await expect(page.locator('#status-msg')).toContainText('Vrije plek');
  expect(await page.evaluate(() => window.__game.three.view())).toBe('wallBack');
});
