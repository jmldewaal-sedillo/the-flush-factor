// De emmer: gedownloade modellen (zie data/buckets.js), inhoud als echte 3D-voorwerpen,
// hengsel apart te verbergen (emmerweergave), kantelen bij legen.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { PLACES } from '../data/room.js';
import { buildProp } from './props.js';

const MAX_VISIBLE_ITEMS = 28;

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
  const cache = new Map();             // bucketId → Promise<{ root, handles, cavity }>
  let current = null;                  // { def, root, handles, cavity }
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
      const split = m.handleTris ? splitHandle(o, m.handleTris) : null;
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

    const radius = Math.min(size.x, size.z) * s / 2;
    return { def, root, handles, cavity: { radius: radius * 0.62, floorY: m.height * 0.14, topY: m.height * 0.92 } };
  }

  function load(def) {
    if (!cache.has(def.id)) cache.set(def.id, loader.loadAsync(def.model.file).then(gltf => prepare(def, gltf)));
    return cache.get(def.id);
  }

  function slot(i) {
    const c = current.cavity;
    const size = THREE.MathUtils.clamp(c.radius * 0.95 / 0.1, 0.5, 1.15);
    const perLayer = 4, layer = Math.floor(i / perLayer);
    const a = i * 2.39996 + layer * 0.7;
    const r = c.radius * (i % perLayer === 0 ? 0.12 : 0.5);
    const y = Math.min(c.floorY + 0.03 * size + layer * 0.05 * size, c.topY);
    return { position: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), rotation: new THREE.Euler(a * 1.3, a * 2.1, a * 0.7), scale: size };
  }

  function place(obj, i) {
    const s = slot(i);
    obj.position.copy(s.position);
    obj.rotation.copy(s.rotation);
    obj.scale.setScalar(s.scale);
    items.add(obj);
  }

  function setItems(propIds) {
    items.clear();
    if (!current) { api.pendingItems = propIds.slice(); return; }
    propIds.slice(-MAX_VISIBLE_ITEMS).forEach((id, i) => place(buildProp(id, ctx), i));
  }

  ctx.onFrame(dt => {
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
    if (emptyAnim === 0) { items.clear(); tilt.rotation.z = 0; tilt.position.y = 0; }
  });

  const api = {
    group, pendingItems: null,
    async setBucket(def) {
      const token = ++loadToken;
      const next = await load(def);
      if (token !== loadToken) return;
      const keepIds = current ? items.children.map(o => o.userData.propId) : (api.pendingItems || []);
      if (current) tilt.remove(current.root);
      current = next;
      tilt.add(current.root);
      api.setHandleVisible(handleVisible);
      api.pendingItems = null;
      setItems(keepIds);
    },
    setItems,
    // Neem een voorwerp over dat net is komen aanvliegen (wereldpositie doet er niet meer toe).
    adopt(obj) {
      if (!current) return;
      if (items.children.length >= MAX_VISIBLE_ITEMS) items.remove(items.children[0]);
      place(obj, items.children.length);
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
    handleVisible: () => handleVisible,
  };
  return api;
}

// Splits losse onderdelen (touw, knopen, beugel) af binnen één mesh, herkend aan hun aantal driehoeken.
// Het hengsel krijgt een eigen materiaalgroep, zodat het apart onzichtbaar gemaakt kan worden.
function splitHandle(mesh, handleTris) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position, index = geo.index;
  if (!index) return null;
  const ids = new Map(), rep = new Uint32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!ids.has(key)) ids.set(key, ids.size);
    rep[i] = ids.get(key);
  }
  const parent = Uint32Array.from({ length: ids.size }, (_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const tris = index.count / 3;
  for (let t = 0; t < tris; t++) {
    const a = find(rep[index.getX(t * 3)]), b = find(rep[index.getX(t * 3 + 1)]), c = find(rep[index.getX(t * 3 + 2)]);
    parent[a] = b; parent[find(b)] = find(c);
  }
  const counts = new Map();
  for (let t = 0; t < tris; t++) { const r = find(rep[index.getX(t * 3)]); counts.set(r, (counts.get(r) || 0) + 1); }
  const wanted = handleTris.slice();
  const handleRoots = new Set();
  for (const [root, n] of counts) { const i = wanted.indexOf(n); if (i >= 0) { wanted.splice(i, 1); handleRoots.add(root); } }
  if (!handleRoots.size) return null;

  const body = [], handle = [];
  for (let t = 0; t < tris; t++) {
    const tri = [index.getX(t * 3), index.getX(t * 3 + 1), index.getX(t * 3 + 2)];
    (handleRoots.has(find(rep[tri[0]])) ? handle : body).push(...tri);
  }
  geo.setIndex([...body, ...handle]);
  geo.clearGroups();
  geo.addGroup(0, body.length, 0);
  geo.addGroup(body.length, handle.length, 1);
  const material = mesh.material.clone();
  mesh.material = [mesh.material, material];
  return { material, bodyIndexCount: body.length };
}

function expandByMesh(box, mesh, indexCount) {
  const pos = mesh.geometry.attributes.position, index = mesh.geometry.index;
  const v = new THREE.Vector3();
  const n = Math.min(indexCount, index ? index.count : pos.count);
  for (let i = 0; i < n; i++) box.expandByPoint(v.fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld));
}
