// Punt 90: het water blijft ín de kom. Watergordijn, kolk en spetters zijn van buitenaf nergens te zien,
// en de zwarte bouten bij de voet zijn weg.
const { test, expect } = require('@playwright/test');
const { openGame, until, expectNoProblems } = require('./helpers');

const CLEAN = { version: 3, level: 4, toilet: { defects: {}, dirt: 0 }, purchased: ['tiles-default', 'floor-basic'], cosmetics: { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' } };
// Camerapunten rond het toilet (meters): [positie, kijkpunt]
const VIEWS = {
  'van voren':       [[0.03, 0.35, 1.5], [0.03, 0.3, 0.3]],
  'van voren, laag': [[0.45, 0.1, 1.0], [0.03, 0.2, 0.3]],
  'van rechts':      [[0.62, 0.35, 0.5], [0.03, 0.3, 0.35]],
  'van links':       [[-0.62, 0.3, 0.55], [0.03, 0.3, 0.35]],
  'van links, onder de kom': [[-0.62, 0.3, 0.6], [0.03, 0.15, 0.5]],     // waar de oude fout te zien was
  'van rechts, onder de kom': [[0.62, 0.25, 0.65], [0.03, 0.15, 0.5]],
  'van bovenaf':     [[0.03, 1.6, 0.6], [0.03, 0.3, 0.4]],
  'schuin van boven': [[0.5, 1.1, 1.3], [0.03, 0.35, 0.4]],
};
const MOMENTS = [0.08, 0.3, 0.45, 0.62, 0.8];        // voortgang van de spoelbeurt (0–1)

for (const quality of ['low', 'medium']) {
  test(`spoelen: nergens water buiten de kom (kwaliteit ${quality})`, async ({ page }) => {
    const problems = await openGame(page, { save: CLEAN, quality });
    await until(page, () => window.__game.three.hasEnvironment());        // het omgevingslicht komt iets later; daarna is het beeld stabiel
    let seenInside = 0;
    for (const [name, [pos, target]] of Object.entries(VIEWS)) {
      for (const at of [null, ...MOMENTS]) {
        const r = await page.evaluate(([p, t, a]) => window.__game.three.waterLeak(p, t, a), [pos, target, at]);
        expect(r.outside, `${name}, ${at === null ? 'in rust' : `spoelbeurt op ${at}`}: ${r.outside} pixels water buiten de kom`).toBe(0);
        if (name === 'van bovenaf') { expect(r.changed, 'van bovenaf zie je het water wél in de kom').toBeGreaterThan(40); seenInside++; }
      }
    }
    expect(seenInside).toBe(MOMENTS.length + 1);
    // het water blijft boven de bodem van de kom en binnen de wand, de hele spoelbeurt lang
    for (const at of MOMENTS) {
      await page.evaluate(a => window.__game.three.freezeFlush(a), at);
      await until(page, a => Math.abs(window.__game.three.flush().progress - a) < 0.001, at);
      const f = await page.evaluate(() => window.__game.three.flush());
      expect(f.lowestY, `spoelbeurt op ${at}: laagste punt van het water`).toBeGreaterThan(f.bottomY);
      expect(f.radius[0]).toBeLessThanOrEqual(f.innerRadius[0] + 1e-6);
      expect(f.radius[1]).toBeLessThanOrEqual(f.innerRadius[1] + 1e-6);
    }
    await page.evaluate(() => window.__game.three.freezeFlush(null));
    expectNoProblems(problems);
  });
}

test('de test ziet het echt: zonder de beveiligingen (de oude fout) is er wél water buiten de kom', async ({ page }) => {
  await openGame(page, { save: CLEAN });
  await until(page, () => window.__game.three.hasEnvironment());
  // de oude situatie: geen masker, geen binnenmaat, en een trechter die 0,6 m wegzakt (dwars door de voet)
  await page.evaluate(() => window.__game.three.unsafeFunnel(0.6));
  let leaked = 0;
  for (const [pos, target] of Object.values(VIEWS)) {
    leaked += (await page.evaluate(([p, t]) => window.__game.three.waterLeak(p, t, 0.45), [pos, target])).outside;
  }
  // (het beeld is hier maar 240 pixels breed; in een schone situatie is het precies 0)
  expect(leaked, 'pixels water buiten de kom, opgeteld over alle camerapunten').toBeGreaterThan(3);
  await page.evaluate(() => window.__game.three.unsafeFunnel(null));
  for (const [pos, target] of Object.values(VIEWS)) {
    expect((await page.evaluate(([p, t]) => window.__game.three.waterLeak(p, t, 0.45), [pos, target])).outside).toBe(0);
  }
});

test('spetters van het spoelen blijven in de kom', async ({ page }) => {
  await openGame(page, { save: CLEAN });
  for (let round = 0; round < 4; round++) {
    await page.locator('#flush-btn').click();
    await until(page, () => window.__game.three.flush().active);
    await until(page, () => !window.__game.three.flush().active);
  }
  // elke spetter die getekend is, was binnen de wand van de kom en onder de bril
  const d = await page.evaluate(() => window.__game.three.drops());
  expect(d.spawned, 'er waren spetters').toBeGreaterThanOrEqual(16);
  expect(d.drawn, 'en ze zijn ook getekend').toBeGreaterThan(0);
  expect(d.maxFromCenter).toBeLessThanOrEqual(d.bowlRadius);
  expect(d.maxAboveRim).toBeLessThanOrEqual(0);
});

test('geen losse zwarte streepjes: de bouten bij de voet en onder de stortbak zijn weg', async ({ page }) => {
  await openGame(page, { save: CLEAN });
  const parts = await page.evaluate(() => window.__game.three.toiletParts());
  expect(parts.boltsHidden).toBe(4);
  // wat het waren: vier gelijke losse onderdelen in de romp, twee laag bij de vloer en twee onder de stortbak
  const comps = await page.evaluate(() => window.__game.three.toiletComponents());
  const bolts = comps.find(c => c.node === 'Toilet').parts.filter(p => p.tris === 174);
  expect(bolts).toHaveLength(4);
  expect(bolts.filter(b => b.max[1] < 0.1)).toHaveLength(2);
});
