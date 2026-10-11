// Water in de pot: schijf die zich aan de kom aanpast (maten gemeten met stralen op het model), met golfjes,
// troebel worden en stijgen bij een verstopping. Bij spoelen: watergordijn langs de binnenwand, draaikolk,
// het peil zakt weg in de afvoer en de pot loopt weer vol.
//
// Water blijft ín de kom (punt 90), op twee manieren:
//  1. Het oppervlak volgt op elke hoogte de gemeten binnenmaat van de kom (fit.profile) en de trechter van
//     de kolk reikt nooit dieper dan de bodem. Zo ligt het water achter het porselein.
//  2. Een masker op de opening van de kom (stencil): water, watergordijn en kalkrand worden alleen getekend
//     waar je door die opening naar binnen kijkt. Het model is onder de kom niet overal dicht (bij de
//     afvoer zit een kier); dit masker houdt het water ook daar onzichtbaar, vanuit elke hoek.
import * as THREE from 'three';
import { WATER_PHASES } from '../data/config.js';

// Duur van een spoelbeurt en de fases daarin (als deel van de duur). Punt 68.
const FLUSH_SECONDS = 1.8;
const FUNNEL_DEPTH = 0.06;     // meters: hoe diep de kolk in het midden hooguit wegzakt
const FLOOR_MARGIN = 0.008;    // meters: zo ver blijft het water boven de bodem van de kom
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PHASES = {
  curtainFront: p => Math.min(1, p / 0.14),                 // water loopt van de rand naar beneden
  curtainTail:  p => smooth(0.66, 0.86, p),                 // en droogt van boven af op
  swirl:        p => smooth(0.04, 0.22, p) * (1 - smooth(0.58, 0.8, p)),   // kolk
  drop:         p => smooth(0.16, 0.52, p) * (1 - smooth(0.62, 0.98, p)),  // peil zakt weg, pot loopt weer vol
};

const VERT = `
  uniform float uTime; uniform float uAmp; uniform float uFunnel;
  varying vec2 vPos;
  void main() {
    vPos = position.xz;
    vec3 p = position;
    float r = length(p.xz);
    p.y += (sin(p.x * 9.0 + uTime * 3.1) + cos(p.z * 7.0 + uTime * 2.3)) * uAmp * (1.0 - r * 0.6);
    p.y -= uFunnel * (1.0 - r) * (1.0 - r);                           // trechter in het midden (uFunnel in meters)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG = `
  uniform float uTime; uniform float uSwirl; uniform float uDrop; uniform float uMurk; uniform vec3 uColor;
  varying vec2 vPos;
  void main() {
    float r = length(vPos);
    float a = atan(vPos.y, vPos.x);
    vec3 col = uColor * (0.72 + 0.28 * (1.0 - r));
    // kolk: spiraalarmen die naar binnen draaien, sneller dicht bij het midden
    float arms = sin(a * 3.0 + (1.0 / (r + 0.18)) * 2.6 - uTime * 16.0);
    col += vec3(0.42) * smoothstep(0.35, 1.0, arms) * uSwirl * (0.35 + 0.65 * (1.0 - r));
    col *= 1.0 - uSwirl * 0.45 * smoothstep(0.35, 0.0, r);              // donker gat van de afvoer
    float glint = smoothstep(0.92, 1.0, sin(vPos.x * 5.0 + uTime * 0.9) * cos(vPos.y * 4.0 - uTime * 0.7));
    col += vec3(0.25) * glint * (1.0 - uMurk) * (1.0 - uSwirl);
    float edge = smoothstep(1.0, 0.94, r);
    float hole = smoothstep(0.0, 0.22, r - uDrop * 0.18);              // afvoer wordt zichtbaar als het peil zakt
    gl_FragColor = vec4(col, mix(0.72, 0.93, uMurk) * edge * mix(1.0, hole, uDrop));
    #include <colorspace_fragment>
  }`;

// Watergordijn langs de binnenwand van de pot: stromende strepen van de rand naar het water.
const CURTAIN_VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const CURTAIN_FRAG = `
  uniform float uTime; uniform float uFront; uniform float uTail; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float u = vUv.x, v = vUv.y;                                        // v: 0 = rand, 1 = wateroppervlak
    float streaks = 0.5 + 0.5 * sin(u * 6.2832 * 13.0 + sin(v * 7.0 - uTime * 5.0) * 1.3);
    float fine = 0.5 + 0.5 * sin(u * 6.2832 * 37.0 + v * 4.0);
    float run = fract(v * 1.6 - uTime * 2.6 + sin(u * 6.2832 * 5.0) * 0.25);   // banden die omlaag lopen
    float bands = smoothstep(0.0, 0.25, run) * smoothstep(1.0, 0.45, run);
    float body = 0.38 + 0.4 * streaks * (0.6 + 0.4 * fine) + 0.3 * bands;
    float shown = smoothstep(uFront + 0.02, uFront - 0.1, v) * smoothstep(uTail - 0.12, uTail + 0.02, v);
    float alpha = clamp(body, 0.0, 1.0) * shown * 0.85;
    vec3 col = mix(uColor, vec3(1.0), 0.35 + 0.45 * bands * streaks);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

// Kalkrand en aanslag in de pot van een vies toilet (punt 80): band rond de waterlijn met druipsporen.
const SCALE_FRAG = `
  uniform float uAmount;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main() {
    float u = vUv.x, v = vUv.y;
    float wob = sin(u * 6.2832 * 7.0) * 0.03 + sin(u * 6.2832 * 19.0) * 0.015;
    float ring = smoothstep(0.62 + wob, 0.78 + wob, v);                                   // band boven het water
    float drips = smoothstep(0.55, 1.0, sin(u * 6.2832 * 23.0 + hash(vec2(floor(u * 23.0), 1.0)) * 6.0)) * smoothstep(0.15, 0.7, v) * 0.6;
    float speck = step(0.86, hash(floor(vUv * vec2(90.0, 30.0)))) * 0.5;
    float a = clamp(ring * 0.8 + drips + speck * smoothstep(0.2, 0.6, v), 0.0, 0.9) * uAmount;
    gl_FragColor = vec4(mix(vec3(0.62, 0.50, 0.22), vec3(0.42, 0.33, 0.14), ring), a);
    #include <colorspace_fragment>
  }`;

export function createWater(ctx, toilet) {
  const fit = measureBowl(toilet, ctx.quality === 'low' ? { around: 18, down: 4 } : { around: 36, down: 8 });
  const uniforms = {
    uTime: { value: 0 }, uAmp: { value: 0.01 }, uSwirl: { value: 0 }, uDrop: { value: 0 }, uMurk: { value: 0 }, uFunnel: { value: 0 },
    uColor: { value: new THREE.Color(WATER_PHASES[0].water) },
  };
  const geo = new THREE.CircleGeometry(1, 40, 0, Math.PI * 2);
  geo.rotateX(-Math.PI / 2);

  // Masker: een onzichtbare schijf op de opening van de kom, alleen van bovenaf te zien en alleen waar het
  // porselein en de bril er niet vóór zitten. Hij tekent geen kleur, maar zet de stencilwaarde op 1.
  const mask = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    colorWrite: false, depthWrite: false, transparent: true,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  }));
  mask.name = 'bowlOpening';
  mask.renderOrder = -1;                                    // vóór het water, na al het ondoorzichtige
  mask.position.set(fit.center.x, fit.rimY + 0.002, fit.center.z + fit.shiftZ);
  mask.scale.set(fit.rimRx * 1.03, 1, fit.rimRz * 1.03);
  mask.raycast = () => {};
  toilet.shaker.add(mask);
  // Alles wat water is tekent alleen binnen dat masker.
  const IN_BOWL = { stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc };

  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false, ...IN_BOWL }));
  mesh.name = 'water';
  mesh.renderOrder = 2;
  toilet.shaker.add(mesh);

  const curtainU = { uTime: uniforms.uTime, uFront: { value: 0 }, uTail: { value: 0 }, uColor: uniforms.uColor };
  const curtain = new THREE.Mesh(fit.curtainGeometry, new THREE.ShaderMaterial({
    vertexShader: CURTAIN_VERT, fragmentShader: CURTAIN_FRAG, uniforms: curtainU, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...IN_BOWL,
  }));
  curtain.name = 'flushCurtain';
  curtain.renderOrder = 1;
  curtain.visible = false;
  toilet.shaker.add(curtain);

  const scaleU = { uAmount: { value: 0 } };
  const scaleRing = new THREE.Mesh(fit.curtainGeometry, new THREE.ShaderMaterial({
    vertexShader: CURTAIN_VERT, fragmentShader: SCALE_FRAG, uniforms: scaleU, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...IN_BOWL,
  }));
  scaleRing.name = 'limescale';
  scaleRing.renderOrder = 0;
  scaleRing.visible = false;
  scaleRing.raycast = () => {};
  toilet.shaker.add(scaleRing);
  let scaleWant = 0;

  const target = { level: 0, clogged: false, color: new THREE.Color(WATER_PHASES[0].water) };
  let level = 0;          // 0–1, vloeiend
  let flushP = -1;        // voortgang van de spoelbeurt 0–1; -1 = er wordt niet gespoeld
  let frozen = null;      // tests/screenshots: zet de spoelbeurt vast op een moment
  let slosh = 0;          // klotsen (0–1)
  let unsafeFunnel = null; // alleen voor de test van punt 90: bootst de oude fout na (trechter door de bodem)
  const local = new THREE.Vector3();

  ctx.onFrame((dt, time) => {
    uniforms.uTime.value = time;
    if (scaleU.uAmount.value !== scaleWant) {
      const d = scaleWant - scaleU.uAmount.value, step = dt / 0.9;
      scaleU.uAmount.value = Math.abs(d) <= step ? scaleWant : scaleU.uAmount.value + Math.sign(d) * step;
      scaleRing.visible = scaleU.uAmount.value > 0.01;
    }
    level += (target.level - level) * Math.min(1, dt * 4);
    if (frozen !== null) flushP = frozen;
    else if (flushP >= 0) { flushP += dt / FLUSH_SECONDS; if (flushP >= 1) flushP = -1; }
    const p = flushP;
    const swirl = p >= 0 ? PHASES.swirl(p) : 0;
    const drop = p >= 0 ? PHASES.drop(p) : 0;
    uniforms.uSwirl.value = swirl;
    uniforms.uDrop.value = drop;
    curtain.visible = p >= 0 && p < 0.9;
    curtainU.uFront.value = p >= 0 ? PHASES.curtainFront(p) * 1.1 : 0;
    curtainU.uTail.value = p >= 0 ? PHASES.curtainTail(p) * 1.15 - 0.05 : 0;

    uniforms.uMurk.value += ((target.clogged ? 1 : 0) - uniforms.uMurk.value) * Math.min(1, dt * 3);
    uniforms.uColor.value.lerp(target.color, Math.min(1, dt * 3));
    slosh += ((target.clogged ? 0.35 + level * 0.65 : 0) - slosh) * Math.min(1, dt * 2);
    uniforms.uAmp.value = 0.012 + slosh * 0.05 + swirl * 0.02;

    const y = THREE.MathUtils.lerp(fit.restY, fit.rimY, level) - drop * fit.drainDrop;
    const k = THREE.MathUtils.clamp((y - fit.restY) / (fit.rimY - fit.restY), -0.4, 1);
    const shrink = 1 - drop * 0.4;
    // Onder het rustpeil wordt de kom smaller: het oppervlak volgt de gemeten binnenmaat op die hoogte.
    const inner = unsafeFunnel === null ? fit.innerAt(y) : { rx: Infinity, rz: Infinity, dz: 0 };
    mesh.position.set(fit.center.x, y, fit.center.z + (k > 0 ? fit.shiftZ * k : inner.dz));
    mesh.scale.set(
      Math.min(THREE.MathUtils.lerp(fit.restRx, fit.rimRx, Math.max(0, k)) * shrink, inner.rx),
      1,
      Math.min(THREE.MathUtils.lerp(fit.restRz, fit.rimRz, Math.max(0, k)) * shrink, inner.rz),
    );
    // De trechter van de kolk: hooguit FUNNEL_DEPTH diep, en nooit door de bodem van de kom.
    uniforms.uFunnel.value = Math.max(0, Math.min((swirl * 0.42 + drop * 0.58) * FUNNEL_DEPTH, y - fit.bottomY - FLOOR_MARGIN));
    if (unsafeFunnel !== null) uniforms.uFunnel.value = unsafeFunnel;
    mesh.rotation.x = Math.sin(time * 5.3) * 0.05 * slosh;
    mesh.rotation.z = Math.cos(time * 4.1) * 0.05 * slosh;
  });

  return {
    mesh, curtain, fit,
    flush() { flushP = 0; },
    // Kalkrand: 0 = schoon, 1 = vies. animate: laat hem wegpoetsen.
    setScale(amount, animate = false) { scaleWant = amount; if (!animate) { scaleU.uAmount.value = amount; scaleRing.visible = amount > 0.01; } },
    scale: () => +scaleU.uAmount.value.toFixed(2),
    // level 0–100, phase = regel uit WATER_PHASES
    set(pct, clogged, phase) {
      target.level = clogged ? pct / 100 : 0;
      target.clogged = clogged;
      target.color.setHex((phase || WATER_PHASES[0]).water);
    },
    // Wereldpositie van het wateroppervlak (voor voorwerpen, belletjes en spetters).
    surface(out = new THREE.Vector3()) { return mesh.getWorldPosition(out); },
    radius: () => Math.min(mesh.scale.x, mesh.scale.z),
    level: () => level,
    localToWorld: v => toilet.shaker.localToWorld(local.copy(v)),
    // voor tests en screenshots (punt 68)
    freeze(p) { frozen = p; if (p === null) flushP = -1; },
    flushState: () => ({
      active: flushP >= 0, progress: +Math.max(0, flushP).toFixed(3), seconds: FLUSH_SECONDS,
      curtainVisible: curtain.visible, curtainTriangles: fit.curtainGeometry.index.count / 3,
      swirl: +uniforms.uSwirl.value.toFixed(3), drop: +uniforms.uDrop.value.toFixed(3), waterY: +mesh.position.y.toFixed(4), restY: +fit.restY.toFixed(4),
      // laagste punt van het water en de bodem van de kom (punt 90: water blijft in de kom)
      lowestY: +(mesh.position.y - uniforms.uFunnel.value).toFixed(4), bottomY: +fit.bottomY.toFixed(4),
      radius: [+mesh.scale.x.toFixed(4), +mesh.scale.z.toFixed(4)], innerRadius: (i => [+i.rx.toFixed(4), +i.rz.toFixed(4)])(fit.innerAt(mesh.position.y)),
    }),
    // Tests: water aan/uit, om te vergelijken wat er van buitenaf van te zien is.
    setVisible(on) { mesh.visible = on; curtain.material.visible = on; },
    // Zet beide beveiligingen uit en laat de trechter `depth` meter zakken (null = weer normaal).
    setUnsafeFunnel(depth) {
      unsafeFunnel = depth;
      for (const m of [mesh.material, curtain.material]) { m.stencilWrite = depth === null; m.needsUpdate = true; }
    },
  };
}

// Meet de kom met stralen op het model: bodem, rustpeil, straal op rustpeil en bij de rand, en de vorm van
// de binnenwand (voor het watergordijn). Alles in coördinaten van toilet.shaker.
function measureBowl(toilet, detail) {
  const { bowlMesh, seat, shaker } = toilet;
  shaker.updateWorldMatrix(true, true);
  const seatBox = new THREE.Box3().setFromObject(seat);
  const center = seatBox.getCenter(new THREE.Vector3());
  const ray = new THREE.Raycaster();
  // (de romp heeft twee materiaalgroepen sinds de stopkraan is afgesplitst; de eerste is het porselein)
  const porcelain = Array.isArray(bowlMesh.material) ? bowlMesh.material[0] : bowlMesh.material;
  const side = porcelain.side;
  porcelain.side = THREE.DoubleSide;
  const hit = (origin, dir) => {
    ray.set(origin, dir.clone().normalize());
    const h = ray.intersectObject(bowlMesh, false)[0];
    return h ? h.distance : null;
  };
  const down = new THREE.Vector3(0, -1, 0);
  const top = seatBox.max.y + 0.2;
  // De opening zit iets vóór het midden van de bril; zoek het diepste punt langs de lengteas.
  let best = { depth: 0, z: center.z };
  for (let i = 0; i <= 12; i++) {
    const z = THREE.MathUtils.lerp(seatBox.min.z + 0.05, seatBox.max.z - 0.05, i / 12);
    const d = hit(new THREE.Vector3(center.x, top, z), down);
    if (d && d > best.depth) best = { depth: d, z };
  }
  const bottomY = top - best.depth;
  const rimY = seatBox.min.y - 0.012;
  const restY = bottomY + (rimY - bottomY) * 0.6;

  const radii = (y, cz) => {
    const o = new THREE.Vector3(center.x, y, cz);
    const d = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].map(v => hit(o, new THREE.Vector3(...v)) ?? 0.08);
    return { rx: (d[0] + d[1]) / 2, rz: (d[2] + d[3]) / 2, cz: cz + (d[2] - d[3]) / 2 };
  };
  const rest = radii(restY, best.z);
  const rim = radii(rimY - 0.01, rest.cz);

  // Binnenmaat onder het rustpeil, van boven naar beneden: de kom wordt daar smaller (naar de afvoer toe).
  // Een straal die niets raakt (afvoergat) telt als de maat van de laag erboven; smaller worden mag, wijder niet.
  const PROFILE_STEPS = 8;
  const profile = [];
  let above = { rx: rest.rx, rz: rest.rz, cz: rest.cz };
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const y = THREE.MathUtils.lerp(restY, bottomY + 0.004, i / PROFILE_STEPS);
    const o = new THREE.Vector3(center.x, y, above.cz);
    const d = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].map(v => hit(o, new THREE.Vector3(...v)));
    const rx = d[0] != null && d[1] != null ? Math.min(above.rx, Math.min(d[0], d[1])) : above.rx;
    const rz = d[2] != null && d[3] != null ? Math.min(above.rz, (d[2] + d[3]) / 2) : above.rz;
    const cz = d[2] != null && d[3] != null ? above.cz + (d[2] - d[3]) / 2 : above.cz;
    above = { rx, rz, cz };
    profile.push({ y, rx, rz, cz });
  }

  // Binnenwand aftasten: per hoogte een ring van punten, net binnen het porselein.
  const toLocalPoint = v => shaker.worldToLocal(v);
  const positions = [], uvs = [], indices = [];
  const { around, down: rings } = detail;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const y = THREE.MathUtils.lerp(rimY - 0.006, restY - 0.012, t);
    const cz = THREE.MathUtils.lerp(rim.cz, rest.cz, t);
    const fallback = THREE.MathUtils.lerp((rim.rx + rim.rz) / 2, (rest.rx + rest.rz) / 2, t);
    for (let i = 0; i <= around; i++) {
      const a = (i % around) / around * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const origin = new THREE.Vector3(center.x, y, cz);
      const d = Math.max(0.01, (hit(origin, dir) ?? fallback) - 0.004);
      const p = toLocalPoint(origin.addScaledVector(dir, d));
      positions.push(p.x, p.y, p.z);
      uvs.push(i / around, t);
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < around; i++) {
    const a = j * (around + 1) + i, b = a + 1, c = a + around + 1, e = c + 1;
    indices.push(a, c, b, b, c, e);
  }
  const curtainGeometry = new THREE.BufferGeometry();
  curtainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  curtainGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  curtainGeometry.setIndex(indices);
  porcelain.side = side;

  const toLocal = v => shaker.worldToLocal(v);
  const c = toLocal(new THREE.Vector3(center.x, 0, rest.cz));
  const yOff = shaker.getWorldPosition(new THREE.Vector3()).y;
  const INSET = 0.94;      // het wateroppervlak blijft iets binnen de wand
  const steps = profile.map(p => ({ y: p.y - yOff, rx: p.rx * INSET, rz: p.rz * INSET, dz: p.cz - rest.cz }));
  // Binnenmaat van de kom op hoogte y (onder het rustpeil); erboven geldt de maat van het rustpeil.
  const innerAt = y => {
    if (y >= steps[0].y) return { rx: Infinity, rz: Infinity, dz: 0 };
    for (let i = 1; i < steps.length; i++) {
      if (y < steps[i].y) continue;
      const a = steps[i - 1], b = steps[i], t = (a.y - y) / (a.y - b.y);
      return { rx: THREE.MathUtils.lerp(a.rx, b.rx, t), rz: THREE.MathUtils.lerp(a.rz, b.rz, t), dz: THREE.MathUtils.lerp(a.dz, b.dz, t) };
    }
    const last = steps[steps.length - 1];
    return { rx: last.rx, rz: last.rz, dz: last.dz };
  };
  return {
    center: c, shiftZ: rim.cz - rest.cz, profile: steps, innerAt,
    restY: restY - yOff, rimY: rimY - yOff, bottomY: bottomY - yOff,
    restRx: rest.rx * 0.98, restRz: rest.rz * 0.98,
    rimRx: rim.rx * 0.99, rimRz: rim.rz * 0.99,
    drainDrop: (restY - bottomY) * 0.75,
    curtainGeometry,
  };
}
