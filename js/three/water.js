// Water in de pot: schijf die zich aan de kom aanpast (maten gemeten met stralen op het model),
// met golfjes, draaikolk bij spoelen, troebel worden en stijgen bij een verstopping.
import * as THREE from 'three';
import { WATER_PHASES } from '../data/config.js';

const VERT = `
  uniform float uTime; uniform float uAmp; uniform float uSwirl;
  varying vec2 vPos;
  void main() {
    vPos = position.xz;
    vec3 p = position;
    float r = length(p.xz);
    p.y += (sin(p.x * 9.0 + uTime * 3.1) + cos(p.z * 7.0 + uTime * 2.3)) * uAmp * (1.0 - r * 0.6);
    p.y -= uSwirl * 0.35 * (1.0 - r);                 // kuiltje in het midden bij spoelen
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG = `
  uniform float uTime; uniform float uSwirl; uniform float uMurk; uniform vec3 uColor;
  varying vec2 vPos;
  void main() {
    float r = length(vPos);
    float a = atan(vPos.y, vPos.x);
    vec3 col = uColor * (0.72 + 0.28 * (1.0 - r));
    float spiral = sin(a * 3.0 + r * 11.0 - uTime * 14.0);
    col += vec3(0.35) * smoothstep(0.55, 1.0, spiral) * uSwirl;
    float glint = smoothstep(0.92, 1.0, sin(vPos.x * 5.0 + uTime * 0.9) * cos(vPos.y * 4.0 - uTime * 0.7));
    col += vec3(0.25) * glint * (1.0 - uMurk);
    float edge = smoothstep(1.0, 0.94, r);
    gl_FragColor = vec4(col, mix(0.72, 0.93, uMurk) * edge);
    #include <colorspace_fragment>
  }`;

export function createWater(ctx, toilet) {
  const fit = measureBowl(toilet);
  const uniforms = {
    uTime: { value: 0 }, uAmp: { value: 0.01 }, uSwirl: { value: 0 }, uMurk: { value: 0 },
    uColor: { value: new THREE.Color(WATER_PHASES[0].water) },
  };
  const geo = new THREE.CircleGeometry(1, 40, 0, Math.PI * 2);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false }));
  mesh.name = 'water';
  mesh.renderOrder = 2;
  toilet.shaker.add(mesh);

  const target = { level: 0, clogged: false, color: new THREE.Color(WATER_PHASES[0].water) };
  let level = 0;          // 0–1, vloeiend
  let flush = 0;          // 1 → 0 tijdens spoelen
  let slosh = 0;          // klotsen (0–1)
  const local = new THREE.Vector3();

  ctx.onFrame((dt, time) => {
    uniforms.uTime.value = time;
    level += (target.level - level) * Math.min(1, dt * 4);
    if (flush > 0) flush = Math.max(0, flush - dt / 0.9);
    const swirl = Math.sin(Math.min(1, flush * 1.15) * Math.PI);
    uniforms.uSwirl.value = swirl;
    uniforms.uMurk.value += ((target.clogged ? 1 : 0) - uniforms.uMurk.value) * Math.min(1, dt * 3);
    uniforms.uColor.value.lerp(target.color, Math.min(1, dt * 3));
    slosh += ((target.clogged ? 0.35 + level * 0.65 : 0) - slosh) * Math.min(1, dt * 2);
    uniforms.uAmp.value = 0.012 + slosh * 0.05;

    const y = THREE.MathUtils.lerp(fit.restY, fit.rimY, level) - swirl * fit.drainDrop;
    const k = THREE.MathUtils.clamp((y - fit.restY) / (fit.rimY - fit.restY), -0.4, 1);
    const shrink = 1 - swirl * 0.35;
    mesh.position.set(fit.center.x, y, fit.center.z + fit.shiftZ * Math.max(0, k));
    mesh.scale.set(THREE.MathUtils.lerp(fit.restRx, fit.rimRx, Math.max(0, k)) * shrink, 1, THREE.MathUtils.lerp(fit.restRz, fit.rimRz, Math.max(0, k)) * shrink);
    mesh.rotation.x = Math.sin(time * 5.3) * 0.05 * slosh;
    mesh.rotation.z = Math.cos(time * 4.1) * 0.05 * slosh;
  });

  return {
    mesh, fit,
    flush() { flush = 1; },
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
  };
}

// Meet de kom: bodem, rustpeil en straal op rustpeil en bij de rand. Alles in coördinaten van toilet.shaker.
function measureBowl(toilet) {
  const { bowlMesh, seat, shaker } = toilet;
  shaker.updateWorldMatrix(true, true);
  const seatBox = new THREE.Box3().setFromObject(seat);
  const center = seatBox.getCenter(new THREE.Vector3());
  const ray = new THREE.Raycaster();
  const side = bowlMesh.material.side;
  bowlMesh.material.side = THREE.DoubleSide;
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
  const restY = bottomY + (rimY - bottomY) * 0.38;

  const radii = (y, cz) => {
    const o = new THREE.Vector3(center.x, y, cz);
    const d = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].map(v => hit(o, new THREE.Vector3(...v)) ?? 0.08);
    return { rx: (d[0] + d[1]) / 2, rz: (d[2] + d[3]) / 2, cz: cz + (d[2] - d[3]) / 2 };
  };
  const rest = radii(restY, best.z);
  const rim = radii(rimY - 0.01, rest.cz);
  bowlMesh.material.side = side;

  const toLocal = v => shaker.worldToLocal(v);
  const c = toLocal(new THREE.Vector3(center.x, 0, rest.cz));
  const yOff = shaker.getWorldPosition(new THREE.Vector3()).y;
  return {
    center: c, shiftZ: rim.cz - rest.cz,
    restY: restY - yOff, rimY: rimY - yOff, bottomY: bottomY - yOff,
    restRx: rest.rx * 0.98, restRz: rest.rz * 0.98,
    rimRx: rim.rx * 0.99, rimRz: rim.rz * 0.99,
    drainDrop: (restY - bottomY) * 0.7,
  };
}
