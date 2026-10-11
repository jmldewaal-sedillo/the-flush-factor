// De emmer: gedownloade modellen (zie data/buckets.js), inhoud als echte 3D-voorwerpen,
// hengsel apart te verbergen (emmerweergave), kantelen bij legen.
// De inhoud wordt gestapeld binnen de binnenmaat van de emmer (punt 84): elk voorwerp telt als een bol,
// zakt naar de laagste vrije plek en rust op de bodem, de wand of andere voorwerpen.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { PLACES } from '../data/room.js';
import { buildProp } from './props.js';
import { splitByTriCounts, expandByMesh } from './geometry.js';

const MAX_VISIBLE_ITEMS = 60;
const PACKING = 0.33;         // deel van de emmer dat de bollen echt vullen als hij "vol" is (er blijft altijd lucht tussen)
const CANDIDATES = 18;        // plekken die per voorwerp geprobeerd worden; de laagste wint

// Vaste "toevals"-reeks per voorwerp, zodat de stapel na herladen precies hetzelfde ligt.
function seeded(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function createBucket(ctx) {
  const group = new THREE.Group();     // vaste plek
  const tilt = new THREE.Group();      // kantelt bij legen
  const items = new THREE.Group();
  group.name = 'bucket';
  group.position.set(...PLACES.bucket.position);
  group.add(tilt);
  tilt.add(items);
  ctx.scene.add(group);

  const loader = new GLTFLoader();
  const cache = new Map();             // bucketId → Promise<{ def, root, handles, inner }>
  let current = null;                  // { def, root, handles, inner }
  let handleVisible = true;
  let emptyAnim = 0;
  let loadToken = 0;

  function prepare(def, gltf) {
    const m = def.model;
    const root = new THREE.Group();
    const model = gltf.scene;
    root.add(model);

    if (m.keepNodes) {
      const keep = new Set();
      m.keepNodes.forEach(n => model.getObjectByName(n)?.traverse(o => keep.add(o)));
      const drop = [];
      model.traverse(o => { if (o.isMesh && !keep.has(o)) drop.push(o); });
      drop.forEach(o => o.removeFromParent());
    }

    // Hengsel: losse nodes, of losse onderdelen binnen één mesh.
    const handles = [];                // functies (zichtbaar) => void
    const handleNodes = new Set();
    (m.handleNodes || []).forEach(n => model.getObjectByName(n)?.traverse(o => { if (o.isMesh) handleNodes.add(o); }));
    handleNodes.forEach(o => handles.push(v => { o.visible = v; }));

    model.updateWorldMatrix(true, true);
    const bodyBox = new THREE.Box3();
    model.traverse(o => {
      if (!o.isMesh || handleNodes.has(o)) return;
      const split = m.handleTris ? splitByTriCounts(o, m.handleTris) : null;
      if (split) handles.push(v => { split.material.visible = v; });
      expandByMesh(bodyBox, o, split ? split.bodyIndexCount : Infinity);
    });

    // Schaal naar de opgegeven hoogte, zet de romp op de vloer en in het midden.
    const size = bodyBox.getSize(new THREE.Vector3());
    const s = m.height / size.y;
    model.scale.multiplyScalar(s);
    model.position.sub(new THREE.Vector3((bodyBox.min.x + bodyBox.max.x) / 2, bodyBox.min.y, (bodyBox.min.z + bodyBox.max.z) / 2).multiplyScalar(s));
    root.rotation.y = m.rotationY || 0;
    ctx.setShadow(root, true, true);

    return { def, root, handles, inner: m.inner, bodySize: size.multiplyScalar(s) };
  }

  function load(def) {
    if (!cache.has(def.id)) cache.set(def.id, loader.loadAsync(def.model.file).then(gltf => prepare(def, gltf)));
    return cache.get(def.id);
  }

  // ── Stapelen (punt 84) ──
  // Vrije straal op hoogte y: de emmer is van binnen een (afgeknotte) kegel.
  const radiusAt = (inner, y) => THREE.MathUtils.lerp(inner.rBottom, inner.rTop, THREE.MathUtils.clamp((y - inner.floor) / (inner.top - inner.floor), 0, 1));

  // Hoe groot een voorwerp van zoveel liter in deze emmer is: een volle emmer (in liters) is ook zichtbaar vol.
  let sizeBoost = 1;     // > 1 als er meer in zit dan er getoond wordt: de getoonde stapel vult dan evenveel
  function itemRadius(liters) {
    const { inner, def } = current;
    const h = inner.top - inner.floor;
    const volume = Math.PI / 3 * h * (inner.rBottom ** 2 + inner.rBottom * inner.rTop + inner.rTop ** 2);
    const perLiter = Math.cbrt(PACKING * volume / (4 / 3 * Math.PI * def.liters));
    return THREE.MathUtils.clamp(perLiter * Math.cbrt(liters) * sizeBoost, 0.012, inner.rBottom * 0.7);
  }

  let placed = [];       // { x, y, z, r } van alles wat er ligt, in emmer-coördinaten

  function findSpot(r, index) {
    const { inner } = current;
    const rnd = seeded(index + 1);
    let best = null;
    for (let c = 0; c < CANDIDATES; c++) {
      const a = rnd() * Math.PI * 2, k = Math.sqrt(rnd());
      const d = k * Math.max(0, inner.rTop - r), x = Math.cos(a) * d, z = Math.sin(a) * d;
      let y = inner.floor + r;
      for (const p of placed) {
        const dx = x - p.x, dz = z - p.z, gap = r + p.r, flat = dx * dx + dz * dz;
        if (flat < gap * gap) y = Math.max(y, p.y + Math.sqrt(gap * gap - flat));
      }
      // past het hier binnen de wand? (onderin is de emmer smaller; boven de rand telt de rand)
      const limit = radiusAt(inner, Math.min(y, inner.top)) - r;
      if (d > limit) continue;
      if (!best || y < best.y) best = { x, y, z, r };
    }
    // nergens plek binnen de wand: midden bovenop
    if (!best) {
      let y = inner.floor + r;
      for (const p of placed) { const gap = r + p.r, flat = p.x * p.x + p.z * p.z; if (flat < gap * gap) y = Math.max(y, p.y + Math.sqrt(gap * gap - flat)); }
      best = { x: 0, y, z: 0, r };
    }
    return best;
  }

  // Zet een voorwerp op zijn plek: geschaald zodat het binnen zijn bol past, om het midden van de bol gedraaid.
  function place(obj, fromY = null) {
    const index = items.children.length;
    const r = itemRadius(obj.userData.liters ?? 0.5);
    const spot = findSpot(r, index);
    placed.push(spot);

    obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0); obj.scale.setScalar(1);
    obj.updateMatrixWorld(true);
    const sphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
    const scale = r / sphere.radius;
    const rnd = seeded(index + 101);
    const holder = new THREE.Group();          // de bol: positie = middelpunt
    holder.userData = { propId: obj.userData.propId, liters: obj.userData.liters, radius: r, restY: spot.y, dropFrom: fromY };
    obj.scale.setScalar(scale);
    obj.position.copy(sphere.center).multiplyScalar(-scale);
    const spin = new THREE.Group();
    spin.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
    spin.add(obj);
    holder.add(spin);
    holder.position.set(spot.x, fromY ?? spot.y, spot.z);
    items.add(holder);
  }

  // list: [{ id, liters }]
  function setItems(list) {
    items.clear();
    placed = [];
    if (!current) { api.pendingItems = list.slice(); return; }
    const shown = list.slice(-MAX_VISIBLE_ITEMS);
    const liters = l => l.reduce((n, it) => n + (it.liters ?? 0.5), 0);
    sizeBoost = shown.length < list.length ? Math.cbrt(liters(list) / liters(shown)) : 1;
    shown.forEach(it => place(buildProp(it.id, ctx)));
  }

  ctx.onFrame(dt => {
    // nieuw voorwerp valt naar zijn plek
    for (const h of items.children) {
      if (h.userData.dropFrom == null) continue;
      h.position.y = Math.max(h.userData.restY, h.position.y - dt * 1.6);
      if (h.position.y === h.userData.restY) h.userData.dropFrom = null;
    }
    if (emptyAnim <= 0) return;
    emptyAnim = Math.max(0, emptyAnim - dt / 0.8);
    const p = 1 - emptyAnim;
    tilt.rotation.z = -Math.sin(p * Math.PI) * 1.9;
    tilt.position.y = Math.sin(p * Math.PI) * 0.12;
    items.children.forEach((o, i) => {
      const k = Math.max(0, 1 - p * 2.2);
      o.scale.setScalar(o.userData.s0 * k);
      o.position.x += dt * (1.2 + (i % 3) * 0.4);
      o.position.y += dt * 0.3;
    });
    if (emptyAnim === 0) { items.clear(); placed = []; tilt.rotation.z = 0; tilt.position.y = 0; }
  });

  const api = {
    group, pendingItems: null,
    async setBucket(def) {
      const token = ++loadToken;
      const next = await load(def);
      if (token !== loadToken) return;
      const keep = current ? items.children.map(o => ({ id: o.userData.propId, liters: o.userData.liters })) : (api.pendingItems || []);
      if (current) tilt.remove(current.root);
      current = next;
      tilt.add(current.root);
      api.setHandleVisible(handleVisible);
      api.pendingItems = null;
      setItems(keep);
    },
    setItems,
    // Neem een voorwerp over dat net is komen aanvliegen (wereldpositie doet er niet meer toe).
    adopt(obj) {
      if (!current) return;
      if (items.children.length >= MAX_VISIBLE_ITEMS) return;
      place(obj, current.inner.top + 0.12);
    },
    empty() {
      if (!items.children.length) return;
      items.children.forEach(o => { o.userData.s0 = o.scale.x; });
      emptyAnim = 1;
    },
    setHandleVisible(v) {
      handleVisible = v;
      current?.handles.forEach(fn => fn(v));
    },
    // Punt boven de opening, in wereldcoördinaten (doel voor vliegende voorwerpen).
    mouth(out = new THREE.Vector3()) {
      return out.copy(group.position).add(new THREE.Vector3(0, (current?.def.model.height ?? 0.3) + 0.05, 0));
    },
    height: () => current?.def.model.height ?? 0.3,
    id: () => current?.def.id ?? null,
    itemCount: () => (emptyAnim > 0 ? 0 : items.children.length),
    hasHandle: () => !!current?.handles.length,
    // Controle voor punt 84: ligt alles binnen de binnenwand, op of boven de bodem, en niet zwevend boven de rand?
    packing() {
      if (!current) return null;
      const { inner } = current;
      let outside = 0, floating = 0, overlap = 0, highest = 0;
      placed.forEach((p, i) => {
        if (Math.hypot(p.x, p.z) + p.r > radiusAt(inner, Math.min(p.y, inner.top)) + 1e-4 || p.y - p.r < inner.floor - 1e-4) outside++;
        // rust het ergens op? (bodem of een ander voorwerp eronder)
        const onFloor = p.y - p.r <= inner.floor + 1e-3;
        const onOther = placed.some((o, j) => j !== i && o.y < p.y && Math.abs(Math.hypot(p.x - o.x, p.y - o.y, p.z - o.z) - (p.r + o.r)) < 2e-3);
        if (!onFloor && !onOther) floating++;
        placed.forEach((o, j) => { if (j > i && Math.hypot(p.x - o.x, p.y - o.y, p.z - o.z) < p.r + o.r - 1e-3) overlap++; });
        highest = Math.max(highest, p.y + p.r);
      });
      return { count: placed.length, outside, floating, overlap, highest: +highest.toFixed(3), rim: inner.top, fill: +((highest - inner.floor) / (inner.top - inner.floor)).toFixed(2) };
    },
    // Meet de binnenkant van het model met stralen (om data/buckets.js te ijken en te controleren).
    measureInner() {
      if (!current) return null;
      const meshes = [], sides = new Map();
      current.root.traverse(o => { if (o.isMesh && o.visible) { meshes.push(o); for (const m of [].concat(o.material)) { if (!sides.has(m)) sides.set(m, m.side); m.side = THREE.DoubleSide; } } });
      current.handles.forEach(fn => fn(false));
      group.updateMatrixWorld(true);
      const ray = new THREE.Raycaster();
      const base = group.getWorldPosition(new THREE.Vector3());
      const hit = (o, d) => { ray.set(o, d); const h = ray.intersectObjects(meshes, false)[0]; return h ? h.distance : null; };
      const h = current.def.model.height;
      const down = hit(base.clone().add(new THREE.Vector3(0, h + 0.3, 0)), new THREE.Vector3(0, -1, 0));
      const floor = down == null ? null : h + 0.3 - down;
      const ring = y => { let min = Infinity; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const d = hit(base.clone().add(new THREE.Vector3(0, y, 0)), new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); if (d != null) min = Math.min(min, d); } return min === Infinity ? null : +min.toFixed(3); };
      const out = { floor: floor == null ? null : +floor.toFixed(3), height: h, rAtFloor: floor == null ? null : ring(floor + 0.02), rAtData: { bottom: ring(current.inner.floor + 0.015), top: ring(current.inner.top - 0.01) }, profile: [0.25, 0.5, 0.75, 0.9, 0.97].map(k => [+(h * k).toFixed(3), ring(h * k)]) };
      for (const [m, side] of sides) m.side = side;
      current.handles.forEach(fn => fn(handleVisible));
      return out;
    },
    handleVisible: () => handleVisible,
  };
  return api;
}
