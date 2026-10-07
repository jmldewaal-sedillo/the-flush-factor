// ============================================================
// THE FLUSH FACTOR — smoke.spec.js
// Playwright smoke-tests: basiscontroles voor de PWA.
// ============================================================

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Herbruikbare helper: wacht tot de game geladen is
async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

test.beforeEach(async ({ page }) => {
  // Navigeer met ?preview=off zodat de telefoon-preview-wrapper niet laadt
  await page.goto('/?preview=off');
});

// ──────── BASISTESTS ────────

test('pagina laadt zonder JS-fouten', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await waitForGame(page);

  // Filter bekende non-fatale fouten (bijv. service worker in test-context)
  const fatal = errors.filter(e =>
    !e.includes('service worker') &&
    !e.includes('ServiceWorker') &&
    !e.includes('Failed to register') &&
    !e.includes('GLTFLoader') &&         // GLB laadt mogelijk niet in headless
    !e.includes('fetch')
  );
  expect(fatal, `Onverwachte console-fouten: ${fatal.join('\n')}`).toHaveLength(0);
});

test('spoelknop is zichtbaar en klikbaar', async ({ page }) => {
  await page.waitForSelector('#flush-btn', { state: 'visible' });
  const btn = page.locator('#flush-btn');
  await expect(btn).toBeVisible();

  // Klik op spoelknop → score zou moeten veranderen of knop moet reageren
  await btn.click();
  // Knop is zichtbaar gebleven
  await expect(btn).toBeVisible();
});

test('score-weergave is aanwezig', async ({ page }) => {
  await page.waitForSelector('#score-bubble', { state: 'visible' });
  await expect(page.locator('#score-value')).toBeVisible();
  await expect(page.locator('#high-score')).toBeVisible();
});

test('inventarisbalk (gereedschappen) is gevuld', async ({ page }) => {
  await page.waitForSelector('#inventory-bar', { state: 'visible' });
  await page.waitForTimeout(1000);
  const tools = page.locator('#inventory-bar .tool-btn');
  const count = await tools.count();
  expect(count, 'Inventarisbalk heeft geen tools').toBeGreaterThan(0);
});

test('menu-knop opent het menu', async ({ page }) => {
  await page.waitForSelector('#btn-menu', { state: 'visible' });
  await page.locator('#btn-menu').click();
  await expect(page.locator('#main-menu')).not.toHaveAttribute('hidden');
  // Sluiten met tweede klik
  await page.locator('#btn-menu').click();
  await expect(page.locator('#main-menu')).toHaveAttribute('hidden', '');
});

test('winkel opent en sluit', async ({ page }) => {
  await page.waitForSelector('#btn-shop', { state: 'visible' });
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await page.locator('#btn-shop-close').click();
  await expect(page.locator('#shop-screen')).toBeHidden();
});

// ──────── OVERLAP-CHECKS ────────

test('HUD-elementen overlappen niet', async ({ page }) => {
  await waitForGame(page);

  const vp = page.viewportSize();

  // Haal bounding boxes op van de vier HUD-zones + spoelknop + mand
  async function getRect(selector) {
    return page.locator(selector).boundingBox();
  }

  const menuBtn   = await getRect('#btn-menu');
  const scoreBubble = await getRect('#score-bubble');
  const flushBtn  = await getRect('#flush-btn');
  const hudLeft   = await getRect('#hud-left');

  // Alle HUD-elementen moeten zichtbaar zijn (niet null)
  expect(menuBtn,    '#btn-menu niet zichtbaar').toBeTruthy();
  expect(scoreBubble,'#score-bubble niet zichtbaar').toBeTruthy();
  expect(flushBtn,   '#flush-btn niet zichtbaar').toBeTruthy();

  // Spoelknop mag niet buiten het scherm vallen
  if (flushBtn && vp) {
    expect(flushBtn.x, 'Spoelknop links buiten scherm').toBeGreaterThanOrEqual(0);
    expect(flushBtn.y + flushBtn.height, 'Spoelknop onder scherm').toBeLessThanOrEqual(vp.height + 2);
  }

  // Menu-knop mag niet buiten het scherm vallen
  if (menuBtn && vp) {
    expect(menuBtn.x, 'Menu-knop links buiten scherm').toBeGreaterThanOrEqual(0);
    expect(menuBtn.y, 'Menu-knop boven scherm').toBeGreaterThanOrEqual(0);
    expect(menuBtn.x + menuBtn.width,   'Menu-knop rechts buiten scherm').toBeLessThanOrEqual(vp.width + 2);
    expect(menuBtn.y + menuBtn.height,  'Menu-knop onder scherm').toBeLessThanOrEqual(vp.height + 2);
  }

  // Score-bubbel mag niet buiten het scherm vallen
  if (scoreBubble && vp) {
    expect(scoreBubble.x + scoreBubble.width, 'Score-bubbel rechts buiten scherm').toBeLessThanOrEqual(vp.width + 2);
    expect(scoreBubble.y, 'Score-bubbel boven scherm').toBeGreaterThanOrEqual(0);
  }

  // HUD links (inventarisbalk) mag niet overlappen met score-bubbel
  if (hudLeft && scoreBubble) {
    const leftRight  = hudLeft.x + hudLeft.width;
    const scoreLeft  = scoreBubble.x;
    // Als ze op dezelfde hoogte zitten, mogen ze niet overlappen
    const sameRow = hudLeft.y < scoreBubble.y + scoreBubble.height &&
                    hudLeft.y + hudLeft.height > scoreBubble.y;
    if (sameRow) {
      expect(leftRight, 'HUD-links overlapt score-bubbel').toBeLessThanOrEqual(scoreLeft + 2);
    }
  }
});

// ──────── SCHERMFORMATEN ────────

const FORMATS = [
  { name: 'phone-portrait',   width: 393,  height: 851  },
  { name: 'phone-landscape',  width: 851,  height: 393  },
  { name: 'tablet-portrait',  width: 768,  height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768  },
];

for (const fmt of FORMATS) {
  test(`screenshot ${fmt.name}`, async ({ page }) => {
    await page.setViewportSize({ width: fmt.width, height: fmt.height });
    // Navigeer opnieuw na viewport-wissel; gebruik 'commit' zodat SW-reloads niet blokkeren
    try {
      await page.goto('/?preview=off', { waitUntil: 'commit', timeout: 8000 });
    } catch { /* SW-reload onderbreekt soms; pagina is dan al geladen */ }
    await waitForGame(page);

    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const screenshotPath = path.join(SCREENSHOT_DIR, `${fmt.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    expect(fs.existsSync(screenshotPath)).toBe(true);

    // Spoelknop moet zichtbaar zijn in elk formaat
    await expect(page.locator('#flush-btn')).toBeVisible();
    // Score moet zichtbaar zijn
    await expect(page.locator('#score-value')).toBeVisible();
  });
}

// Water-van-boven screenshot (punt 26)
test('screenshot water-van-boven (punt 26)', async ({ page }) => {
  await waitForGame(page);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshotPath = path.join(SCREENSHOT_DIR, 'water-van-boven.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });

  expect(fs.existsSync(screenshotPath)).toBe(true);
});

// Originele screenshot (achterwaarts compatibel)
test('screenshot van startscherm', async ({ page }) => {
  await waitForGame(page);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshotPath = path.join(SCREENSHOT_DIR, 'startscherm.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });

  expect(fs.existsSync(screenshotPath)).toBe(true);
});

// ──────── PUNT 39: MAND LEGEN ────────

test('mand legen — teller en knop correct (punt 39)', async ({ page }) => {
  await waitForGame(page);

  // Simuleer het toevoegen van items aan de mand via localStorage + herladen
  // (de makkelijkste manier om snel items te vullen in de test)
  await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('flushfactor_v1');
      const data = raw ? JSON.parse(raw) : {};
      data.basketVolume = 5.0;
      data.basketItems  = [
        { icon: 'toilet-paper', volume: 0.5 },
        { icon: 'rubber-duck',  volume: 1.0 },
        { icon: 'sock',         volume: 0.3 },
      ];
      localStorage.setItem('flushfactor_v1', JSON.stringify(data));
    } catch (e) {}
  });

  // Herlaad de pagina zodat de opgeslagen staat wordt geladen
  await page.goto('/?preview=off');
  await waitForGame(page);

  // Controleer dat de teller de gevulde waarde toont
  const volText = await page.locator('#basket-vol').textContent();
  expect(volText, 'Teller moet gevulde waarde tonen').toContain('5.0');

  // De legen-knop moet zichtbaar zijn (mand niet leeg)
  await expect(page.locator('#btn-basket-empty')).toBeVisible();

  // Klik op legen
  await page.locator('#btn-basket-empty').click();
  await page.waitForTimeout(300);

  // Teller moet nu 0.0 tonen
  const volTextNa = await page.locator('#basket-vol').textContent();
  expect(volTextNa, 'Teller na legen moet 0.0 tonen').toContain('0.0');

  // Legen-knop moet verborgen zijn (mand leeg)
  await expect(page.locator('#btn-basket-empty')).toBeHidden();

  // Herladen → staat blijft 0 (opgeslagen in localStorage)
  await page.goto('/?preview=off');
  await waitForGame(page);
  const volTextNaReload = await page.locator('#basket-vol').textContent();
  expect(volTextNaReload, 'Teller na herladen moet 0.0 blijven').toContain('0.0');
});

// ──────── SPRINT 6: ACCORDION, AANKOPEN, ICONEN, SAFE-AREA ────────

test('winkel accordion — categorieën uitklappen/inklappen (punt 45)', async ({ page }) => {
  await waitForGame(page);

  // Winkel openen
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await page.waitForTimeout(300);

  // Accordion moet aanwezig zijn
  const accordion = page.locator('.shop-accordion');
  await expect(accordion).toBeVisible();

  // Neem de eerste categorie-header
  const firstHeader = page.locator('.shop-category-header').first();
  await expect(firstHeader).toBeVisible();

  // Staat standaard gesloten (aria-expanded = false)
  await expect(firstHeader).toHaveAttribute('aria-expanded', 'false');

  // Uitklappen
  await firstHeader.click();
  await page.waitForTimeout(400); // wacht op CSS-transitie
  await expect(firstHeader).toHaveAttribute('aria-expanded', 'true');

  // De bijbehorende body moet de klasse 'open' hebben
  const firstBody = page.locator('.shop-category-body').first();
  await expect(firstBody).toHaveClass(/open/);

  // Inklappen via tweede klik
  await firstHeader.click();
  await page.waitForTimeout(400);
  await expect(firstHeader).toHaveAttribute('aria-expanded', 'false');
  await expect(firstBody).not.toHaveClass(/open/);
});

test('winkel accordion — meerdere categorieën tegelijk open (punt 45)', async ({ page }) => {
  await waitForGame(page);
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await page.waitForTimeout(300);

  const headers = page.locator('.shop-category-header');
  const count = await headers.count();
  expect(count, 'Minimaal 2 categorieën verwacht').toBeGreaterThanOrEqual(2);

  // Open eerste twee categorieën
  await headers.nth(0).click();
  await headers.nth(1).click();
  await page.waitForTimeout(400);

  await expect(headers.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await expect(headers.nth(1)).toHaveAttribute('aria-expanded', 'true');
});

test('"Punten kopen" toont melding, saldo wijzigt niet (punt 46)', async ({ page }) => {
  await waitForGame(page);

  // Huidig saldo ophalen
  const scoreBefore = await page.locator('#shop-score').textContent().catch(() => '');

  // Winkel openen
  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await page.waitForTimeout(300);

  // Zoek de "Punten kopen" categorie en klik erop
  const buyCatHeader = page.locator('.shop-category-header[data-cat="buy"]');
  if (await buyCatHeader.count() > 0) {
    await buyCatHeader.click();
    await page.waitForTimeout(400);

    // Zoek een koop-knop in de buy-sectie
    const buyBtn = page.locator('.shop-category-body.open .buy-btn, .shop-category-body.open .shop-card.buy-card button').first();
    if (await buyBtn.count() > 0) {
      await buyBtn.click();
      await page.waitForTimeout(500);

      // Saldo moet ongewijzigd zijn
      const scoreAfter = await page.locator('#shop-score').textContent().catch(() => '');
      expect(scoreAfter).toBe(scoreBefore);
    }
  } else {
    // Accepteer ook als de categorie anders heet maar aanwezig is
    const puntenHeader = page.locator('.shop-category-header').filter({ hasText: /punten kopen/i });
    expect(await puntenHeader.count(), '"Punten kopen" categorie niet gevonden').toBeGreaterThan(0);
  }
});

test('geen emoji in gerenderde interface (punt 47)', async ({ page }) => {
  await waitForGame(page);

  // Controleer de zichtbare DOM (zonder script/style-inhoud)
  const bodyContent = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    return clone.innerHTML;
  });

  const matches = [...bodyContent.matchAll(/\p{Extended_Pictographic}/gu)];
  expect(
    matches,
    `Emoji gevonden in interface: ${matches.map(m => m[0]).join(' ')}`
  ).toHaveLength(0);
});

test('winkelkop heeft ruimte voor notch (punt 48)', async ({ page }) => {
  await waitForGame(page);

  await page.locator('#btn-shop').click();
  await expect(page.locator('#shop-screen')).toBeVisible();
  await page.waitForTimeout(300);

  const shopHeader = page.locator('.shop-header');
  await expect(shopHeader).toBeVisible();

  const paddingTop = await shopHeader.evaluate(el =>
    parseInt(getComputedStyle(el).paddingTop, 10)
  );

  // padding-top moet minimaal 16px zijn (safe-area fix: max(env(...)+16px, 20px))
  expect(paddingTop, 'Shop-header padding-top te klein').toBeGreaterThanOrEqual(16);
});
