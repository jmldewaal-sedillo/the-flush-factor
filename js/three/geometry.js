// Hulpfuncties voor geometrie van gedownloade modellen.
import * as THREE from 'three';

// Splitst losse onderdelen binnen één mesh af (touw en knopen van een emmer, kraan en slang van het toilet),
// herkend aan hun aantal driehoeken. De afgesplitste delen krijgen een eigen materiaalgroep, zodat ze
// apart onzichtbaar gemaakt kunnen worden. Geeft { material, bodyIndexCount, found } of null.
export function splitByTriCounts(mesh, handleTris) {
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
  return { material, bodyIndexCount: body.length, found: handleRoots.size };
}

// Breidt een Box3 uit met (een deel van) de driehoeken van een mesh, in wereldcoördinaten.
export function expandByMesh(box, mesh, indexCount) {
  const pos = mesh.geometry.attributes.position, index = mesh.geometry.index;
  const v = new THREE.Vector3();
  const n = Math.min(indexCount, index ? index.count : pos.count);
  for (let i = 0; i < n; i++) box.expandByPoint(v.fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld));
}
