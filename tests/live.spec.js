// Punt 51: controle op de LIVE site in een schoon browserprofiel (elke test start zonder cache/opslag).
// Draait alleen als LIVE_URL is gezet:
//   LIVE_URL=https://jmldewaal-sedillo.github.io/the-flush-factor/ npx playwright test live --project=phone-portrait
const { test, expect } = require('@playwright/test');

const LIVE = process.env.LIVE_URL;

test('LIVE: winkel toont alle categorieën en ze klappen uit', async ({ page }, info) => {
  test.skip(!LIVE, 'LIVE_URL niet gezet');
  test.skip(info.project.name !== 'phone-portrait', 'één formaat is genoeg');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(LIVE)) errors.push(`${r.status()} ${r.url()}`); });

  await page.goto(`${LIVE}?preview=off`);
  await page.locator('#btn-shop').click();
  const labels = page.locator('.shop-category-label');
  await expect(labels).toHaveCount(7);
  const names = await labels.allTextContents();
  for (const expected of ['Punten kopen', 'Gereedschap', 'Toiletmodellen', 'Tegelpatronen', 'Vloeren', 'Decoratie']) expect(names).toContain(expected);
  expect(names[6]).toMatch(/Emmers|Manden/);

  const headers = await page.locator('.shop-category-header').all();
  for (const h of headers) await h.click();
  for (const section of await page.locator('.shop-category').all()) await expect(section.locator('.shop-card').first()).toBeVisible();
  info.annotations.push({ type: 'categorieën', description: names.join(', ') });
  expect(errors).toEqual([]);
});
