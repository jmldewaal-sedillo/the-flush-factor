// Het hokje: vloer, drie wanden (voorkant open), plint, wc-rolhouder. Zelf gemaakt uit vlakken.
import * as THREE from 'three';
import { ROOM, PLACES } from '../data/room.js';
import { paintPattern } from './patterns.js';

export function createRoom(ctx) {
  const { width: W, depth: D, height: H } = ROOM;
  const group = new THREE.Group();
  group.name = 'room';
  ctx.scene.add(group);

  // Neutrale grond buiten het hokje, zodat je nooit in het niets kijkt.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x1f2a33, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.004;
  group.add(ground);

  const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.6 });

  // [breedte, hoogte, positie, rotatieY] — vlakken kijken naar binnen; van buiten kijk je erdoorheen.
  const wallSpecs = [
    [W, H, [0, H / 2, 0], 0],
    [D, H, [-W / 2, H / 2, D / 2], Math.PI / 2],
    [D, H, [W / 2, H / 2, D / 2], -Math.PI / 2],
  ];
  const walls = wallSpecs.map(([w, h, pos, ry]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    mesh.position.set(...pos);
    mesh.rotation.y = ry;
    mesh.receiveShadow = ctx.fx.shadows;
    mesh.userData.dims = [w, h];
    group.add(mesh);
    return mesh;
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, D / 2);
  floor.receiveShadow = ctx.fx.shadows;
  floor.userData.dims = [W, D];
  group.add(floor);

  // Plinten
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0xf3f0e8, roughness: 0.4 });
  const plinths = [
    [W, [0, 0.04, 0.008], 0],
    [D, [-W / 2 + 0.008, 0.04, D / 2], Math.PI / 2],
    [D, [W / 2 - 0.008, 0.04, D / 2], Math.PI / 2],
  ];
  for (const [len, pos, ry] of plinths) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.016), plinthMat);
    p.position.set(...pos);
    p.rotation.y = ry;
    group.add(p);
  }

  const paperHolder = buildPaperHolder(ctx);
  group.add(paperHolder);

  // UV's schalen naar echte maten: `size` meter per herhaling van de texture.
  function setUv(mesh, size) {
    const [w, h] = mesh.userData.dims;
    const uv = mesh.geometry.attributes.uv;
    const base = mesh.userData.baseUv || (mesh.userData.baseUv = uv.array.slice());
    for (let i = 0; i < uv.count; i++) uv.setXY(i, base[i * 2] * w / size, base[i * 2 + 1] * h / size);
    uv.needsUpdate = true;
  }

  const loader = new THREE.TextureLoader();
  const prep = (tex, srgb) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy());
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  async function applySurface(material, meshes, def) {
    const t = def.texture;
    const old = [material.map, material.normalMap, material.roughnessMap, material.emissiveMap];
    let next;
    if (t.type === 'pbr') {
      const [map, normalMap, roughnessMap] = await Promise.all([
        loader.loadAsync(`${t.base}_color.webp`), loader.loadAsync(`${t.base}_normal.webp`), loader.loadAsync(`${t.base}_roughness.webp`),
      ]);
      next = { map: prep(map, true), normalMap: prep(normalMap), roughnessMap: prep(roughnessMap), roughness: 1, emissiveMap: null, emissiveIntensity: 0 };
    } else {
      const map = prep(new THREE.CanvasTexture(paintPattern(t.pattern, t.colors)), true);
      next = { map, normalMap: null, roughnessMap: null, roughness: t.roughness ?? 0.35, emissiveMap: t.emissive ? map : null, emissiveIntensity: t.emissive || 0 };
    }
    Object.assign(material, next);
    material.emissive.set(t.emissive ? 0xffffff : 0x000000);
    material.needsUpdate = true;
    meshes.forEach(m => setUv(m, t.size));
    old.forEach(tex => tex && !Object.values(next).includes(tex) && tex.dispose());
    material.userData.surfaceId = def.id;
  }

  return {
    group, walls, floor, paperHolder,
    setTiles: def => applySurface(wallMat, walls, def),
    setFloor: def => applySurface(floorMat, [floor], def),
    surfaceIds: () => ({ tiles: wallMat.userData.surfaceId, floor: floorMat.userData.surfaceId }),
  };
}

// Wc-rolhouder aan de rechterwand: beugel + rol met kartonnen koker. Zelf gemaakt (cilinders).
function buildPaperHolder(ctx) {
  const g = new THREE.Group();
  g.name = 'paperHolder';
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dade, metalness: 1, roughness: 0.2 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.95 });
  const card = new THREE.MeshStandardMaterial({ color: 0xb59a78, roughness: 0.9 });

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.008, 20), chrome);
  plate.rotation.z = Math.PI / 2; plate.position.set(-0.004, 0, 0.08);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.075, 10), chrome);
  arm.rotation.z = Math.PI / 2; arm.position.set(-0.04, 0, 0.08);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 10), chrome);
  bar.rotation.x = Math.PI / 2; bar.position.set(-0.075, 0, 0.01);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 28), paper);
  roll.rotation.x = Math.PI / 2; roll.position.set(-0.075, 0, 0);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.102, 16), card);
  core.rotation.x = Math.PI / 2; core.position.copy(roll.position);
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.09, 0.098), paper);
  sheet.position.set(-0.021, -0.045, 0);

  g.add(plate, arm, bar, roll, core, sheet);
  g.position.set(...PLACES.paperHolder.position);
  ctx.setShadow(g, true, false);
  return g;
}
