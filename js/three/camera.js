// Camerastanden met soepele overgang (punt 53), rondkijken door te slepen, zoomen door te knijpen,
// en swipen tussen linkermuur <-> midden <-> rechtermuur. Vervangt de vrije OrbitControls.
import * as THREE from 'three';
import { ROOM, CAMERA_VIEWS, CLOG_VIEW, DEFAULT_VIEW, SWIPE_RING } from '../data/room.js';

const LOOK = { yaw: 0.45, pitch: 0.18, zoomMin: 0.7, zoomMax: 1.3 };
const FLY_SECONDS = 0.75;
const TOP_MARGIN = 0.12;

export function createCameraRig(ctx, { bucketTarget, onViewChange, onTap }) {
  const { camera, canvas } = ctx;
  let viewId = DEFAULT_VIEW;
  let centerView = DEFAULT_VIEW;       // waar "midden" in de swipe-ring naartoe gaat
  let override = null;                 // tijdelijke close-up (verstopping)
  const look = { yaw: 0, pitch: 0, zoom: 1 };
  const cur = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  let fly = null;                      // { from, to, t }
  let shake = 0;

  function pose(def) {
    const target = def.target === 'bucket' ? bucketTarget() : new THREE.Vector3(...def.target);
    const dir = new THREE.Vector3(...def.dir).normalize();
    // rondkijken: draai om de verticale as en kantel
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), look.yaw);
    const flat = Math.hypot(dir.x, dir.z) || 1e-6;
    const pitch = THREE.MathUtils.clamp(Math.atan2(dir.y, flat) + look.pitch, -0.2, 1.45);
    dir.set(dir.x / flat * Math.cos(pitch), Math.sin(pitch), dir.z / flat * Math.cos(pitch));

    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tanH = tanV * camera.aspect;
    const byH = def.frame.h / 2 / tanV, byW = def.frame.w / 2 / tanH;
    const dist = (def.fit === 'height' ? byH : def.fill ? Math.min(byH, byW) : Math.max(byH, byW)) * look.zoom;
    const pos = target.clone().addScaledVector(dir, dist);

    if (def.clampTop) {
      // Bovenrand van het beeld moet op de wand blijven: geen losse strook erboven (punt 55).
      const top = topHitY(pos, target, tanV, tanH);
      const over = top - (ROOM.height - TOP_MARGIN);
      if (over > 0) { pos.y -= over; target.y -= over; }
      if (pos.y < 0.25) pos.y = 0.25;
    }
    return { pos, target };
  }

  // Hoogste punt waar de bovenrand van het beeld een wand raakt.
  const probe = new THREE.PerspectiveCamera();
  const ray = new THREE.Ray();
  function topHitY(pos, target, tanV, tanH) {
    probe.position.copy(pos); probe.lookAt(target); probe.updateMatrixWorld();
    const W = ROOM.width / 2, D = ROOM.depth;
    let maxY = -Infinity;
    for (const sx of [-1, 0, 1]) {
      ray.origin.copy(pos);
      ray.direction.set(sx * tanH, tanV, -1).normalize().transformDirection(probe.matrixWorld);
      const d = ray.direction;
      let best = Infinity;
      const tryPlane = (t, ok) => { if (t > 0.01 && t < best && ok(ray.origin.clone().addScaledVector(d, t))) best = t; };
      if (d.z < 0) tryPlane(-pos.z / d.z, p => Math.abs(p.x) <= W + 1e-3);
      if (d.x < 0) tryPlane((-W - pos.x) / d.x, p => p.z >= -1e-3 && p.z <= D + 1e-3);
      if (d.x > 0) tryPlane((W - pos.x) / d.x, p => p.z >= -1e-3 && p.z <= D + 1e-3);
      // Geen wand geraakt (bv. naast de wand in liggend beeld): telt niet mee.
      if (best < Infinity) maxY = Math.max(maxY, pos.y + d.y * best);
    }
    return maxY;
  }

  const activeDef = () => override || CAMERA_VIEWS[viewId];

  function go(instant = false) {
    const to = pose(activeDef());
    if (instant || ctx.frames === 0) { cur.pos.copy(to.pos); cur.target.copy(to.target); fly = null; return; }
    fly = { from: { pos: cur.pos.clone(), target: cur.target.clone() }, to, t: 0 };
  }

  function setView(id, { instant = false } = {}) {
    if (!CAMERA_VIEWS[id]) return;
    const changed = id !== viewId;
    viewId = id;
    if (id === 'toilet' || id === 'wallBack') centerView = id;
    override = null;
    look.yaw = look.pitch = 0; look.zoom = 1;
    go(instant);
    if (changed) onViewChange(id);
  }

  ctx.onFrame((dt, time) => {
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / FLY_SECONDS);
      const k = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2;
      cur.pos.lerpVectors(fly.from.pos, fly.to.pos, k);
      cur.target.lerpVectors(fly.from.target, fly.to.target, k);
      if (fly.t === 1) fly = null;
    }
    camera.position.copy(cur.pos);
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 1.8);
      const a = shake * shake * 0.02 * ctx.fx.shake;
      camera.position.x += Math.sin(time * 71) * a;
      camera.position.y += Math.cos(time * 83) * a;
    }
    camera.lookAt(cur.target);
  });
  ctx.onResize(() => go(true));

  // ── Bediening ──
  const pointers = new Map();
  let gesture = null;   // { x0, y0, t0, moved, pinch0, zoom0, yaw0, pitch0 }
  canvas.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* geen echte aanwijzer (bv. nagebootst gebaar) */ }
    if (pointers.size === 1) gesture = { x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0, yaw0: look.yaw, pitch0: look.pitch };
    if (pointers.size === 2) { gesture.pinch0 = pinchDistance(); gesture.zoom0 = look.zoom; gesture.moved = 99; }
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.trail = [...(gesture.trail || []).slice(-6), { x: e.clientX, t: performance.now() }];
    if (pointers.size === 2 && gesture.pinch0) {
      look.zoom = THREE.MathUtils.clamp(gesture.zoom0 * gesture.pinch0 / pinchDistance(), LOOK.zoomMin, LOOK.zoomMax);
    } else if (pointers.size === 1) {
      const dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
      gesture.moved = Math.max(gesture.moved, Math.hypot(dx, dy));
      if (gesture.moved < 8 || override) return;
      look.yaw = THREE.MathUtils.clamp(gesture.yaw0 - dx * 0.004, -LOOK.yaw, LOOK.yaw);
      look.pitch = THREE.MathUtils.clamp(gesture.pitch0 + dy * 0.003, -LOOK.pitch, LOOK.pitch);
    }
    go(true);
  });
  const end = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size || !gesture) return;
    const g = gesture; gesture = null;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0, ms = performance.now() - g.t0;
    if (e.type === 'pointercancel') return;
    if (g.moved < 8) return onTap(e.clientX, e.clientY);
    // Veeg = kort gebaar, of een langer gebaar dat snel eindigt. Rustig slepen is rondkijken.
    const now = performance.now();
    const past = (g.trail || []).find(p => now - p.t <= 160) || { x: g.x0, t: g.t0 };
    const speed = Math.abs(e.clientX - past.x) / Math.max(1, now - past.t);
    if ((ms < 700 || speed > 0.5) && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) swipe(dx < 0 ? 1 : -1);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    look.zoom = THREE.MathUtils.clamp(look.zoom * (e.deltaY > 0 ? 1.08 : 0.93), LOOK.zoomMin, LOOK.zoomMax);
    go(true);
  }, { passive: false });
  function pinchDistance() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  // step +1 = naar rechts kijken, -1 = naar links
  function swipe(step) {
    const ringId = SWIPE_RING.includes(viewId) ? viewId : SWIPE_RING[1];
    const i = THREE.MathUtils.clamp(SWIPE_RING.indexOf(ringId) + step, 0, SWIPE_RING.length - 1);
    const next = SWIPE_RING[i] === SWIPE_RING[1] ? centerView : SWIPE_RING[i];
    if (next !== viewId) setView(next);
    else { look.yaw = look.pitch = 0; go(); }
  }

  go(true);
  return {
    setView, swipe,
    view: () => viewId,
    idle: () => !fly,
    refresh: () => go(true),
    shake(amount = 1) { shake = Math.max(shake, amount); },
    // Close-up op de pot bij een verstopping; alleen vanuit de toiletstand, anders blijft de speler waar hij is.
    focusClog(on) {
      if (on && viewId !== 'toilet') return;
      if (!on && !override) return;
      override = on ? CLOG_VIEW : null;
      look.yaw = look.pitch = 0; look.zoom = 1;
      go();
    },
    // Blijft de bovenrand van het beeld binnen de wand? (test voor punt 55)
    topCovered() {
      const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return topHitY(cur.pos, cur.target, tanV, tanV * camera.aspect) <= ROOM.height + 1e-3;
    },
  };
}
