// Water in de pot: schijf die zich aan de kom aanpast (maten gemeten met stralen op het model), met golfjes,
// troebel worden en stijgen bij een verstopping. Bij spoelen: watergordijn langs de binnenwand, draaikolk,
// het peil zakt weg in de afvoer en de pot loopt weer vol.
import * as THREE from 'three';
import { WATER_PHASES } from '../data/config.js';

// Duur van een spoelbeurt en de fases daarin (als deel van de duur). Punt 68.
const FLUSH_SECONDS = 1.8;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PHASES = {
  curtainFront: p => Math.min(1, p / 0.14),                 // water loopt van de rand naar beneden
  curtainTail:  p => smooth(0.66, 0.86, p),                 // en droogt van boven af op
  swirl:        p => smooth(0.04, 0.22, p) * (1 - smooth(0.58, 0.8, p)),   // kolk
  drop:         p => smooth(0.16, 0.52, p) * (1 - smooth(0.62, 0.98, p)),  // peil zakt weg, pot loopt weer vol
};

const VERT = `
  uniform float uTime; uniform float uAmp; uniform float uSwirl; uniform float uDrop;
  varying vec2 vPos;
  void main() {
    vPos = position.xz;
    vec3 p = position;
    float r = length(p.xz);
    p.y += (sin(p.x * 9.0 + uTime * 3.1) + cos(p.z * 7.0 + uTime * 2.3)) * uAmp * (1.0 - r * 0.6);
    p.y -= (uSwirl * 0.25 + uDrop * 0.35) * (1.0 - r) * (1.0 - r);   // trechter in het midden
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

export function createWater(ctx, toilet) {
  const fit = measureBowl(toilet, ctx.quality === 'low' ? { around: 18, down: 4 } : { around: 36, down: 8 });
  const uniforms = {
    uTime: { value: 0 }, uAmp: { value: 0.01 }, uSwirl: { value: 0 }, uDrop: { value: 0 }, uMurk: { value: 0 },
    uColor: { value: new THREE.Color(WATER_PHASES[0].water) },
  };
  const geo = new THREE.CircleGeometry(1, 40, 0, Math.PI * 2);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false }));
  mesh.name = 'water';
  mesh.renderOrder = 2;
  toilet.shaker.add(mesh);

  const curtainU = { uTime: uniforms.uTime, uFront: { value: 0 }, uTail: { value: 0 }, uColor: uniforms.uColor };
  const curtain = new THREE.Mesh(fit.curtainGeometry, new THREE.ShaderMaterial({
    vertexShader: CURTAIN_VERT, fragmentShader: CURTAIN_FRAG, uniforms: curtainU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  curtain.name = 'flushCurtain';
  curtain.renderOrder = 1;
  curtain.visible = false;
  toilet.shaker.add(curtain);

  const target = { level: 0, clogged: false, color: new THREE.Color(WATER_PHASES[0].water) };
  let level = 0;          // 0–1, vloeiend
  let flushP = -1;        // voortgang van de spoelbeurt 0–1; -1 = er wordt niet gespoeld
  let frozen = null;      // tests/screenshots: zet de spoelbeurt vast op een moment
  let slosh = 0;          // klotsen (0–1)
  const local = new THREE.Vector3();

  ctx.onFrame((dt, time) => {
    uniforms.uTime.value = time;
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
    mesh.position.set(fit.center.x, y, fit.center.z + fit.shiftZ * Math.max(0, k));
    mesh.scale.set(THREE.MathUtils.lerp(fit.restRx, fit.rimRx, Math.max(0, k)) * shrink, 1, THREE.MathUtils.lerp(fit.restRz, fit.rimRz, Math.max(0, k)) * shrink);
    mesh.rotation.x = Math.sin(time * 5.3) * 0.05 * slosh;
    mesh.rotation.z = Math.cos(time * 4.1) * 0.05 * slosh;
  });

  return {
    mesh, curtain, fit,
    flush() { flushP = 0; },
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
    }),
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
  return {
    center: c, shiftZ: rim.cz - rest.cz,
    restY: restY - yOff, rimY: rimY - yOff, bottomY: bottomY - yOff,
    restRx: rest.rx * 0.98, restRz: rest.rz * 0.98,
    rimRx: rim.rx * 0.99, rimRz: rim.rz * 0.99,
    drainDrop: (restY - bottomY) * 0.75,
    curtainGeometry,
  };
}
