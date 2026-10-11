// Vlekken op muren en vloer (punt 83): spetters na herhaald overlopen en plassen op de vloer.
// Zelf gemaakt: platte vlakken met een getekende klodder. De spelstand (welke vlek waar) komt van game.js.
import * as THREE from 'three';
import { ROOM } from '../data/room.js';
import { paintSplat, paintPuddle } from './patterns.js';

const W = ROOM.width / 2;
const OFFSET = 0.004;      // net vóór de wand, zodat het niet flikkert

export function createStains(ctx) {
  const group = new THREE.Group();
  group.name = 'stains';
  ctx.scene.add(group);

  const tex = canvas => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const textures = { splat: [0, 1, 2].map(i => tex(paintSplat(i))), puddle: tex(paintPuddle()) };
  const geo = new THREE.PlaneGeometry(1, 1);
  const meshes = new Map();        // id → { mesh, surface, pop, leaving }
  let hiddenWall = null;

  function place(mesh, s) {
    mesh.rotation.set(0, 0, 0);
    if (s.surface === 'wall-back') { mesh.position.set(s.u, s.v, OFFSET); }
    else if (s.surface === 'wall-left') { mesh.position.set(-W + OFFSET, s.v, s.u); mesh.rotation.y = Math.PI / 2; }
    else if (s.surface === 'wall-right') { mesh.position.set(W - OFFSET, s.v, s.u); mesh.rotation.y = -Math.PI / 2; }
    else { mesh.position.set(s.u, OFFSET + 0.002, s.v); mesh.rotation.x = -Math.PI / 2; }
    mesh.rotateZ(s.turn || 0);
  }
  const opacity = dirt => 0.3 + 0.65 * dirt;

  function add(s, pop) {
    const variant = [...s.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3;
    const mat = new THREE.MeshBasicMaterial({ map: s.look === 'puddle' ? textures.puddle : textures.splat[variant], transparent: true, depthWrite: false, opacity: opacity(s.dirt) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { stainId: s.id, size: s.size };
    mesh.renderOrder = 1;
    place(mesh, s);
    mesh.scale.setScalar(pop ? 0.01 : s.size);
    group.add(mesh);
    meshes.set(s.id, { mesh, surface: s.surface, pop: pop ? 0 : 1, leaving: 0, pulse: 0 });
    applyHidden();
  }

  function applyHidden() {
    for (const m of meshes.values()) m.mesh.visible = m.surface !== hiddenWall;
  }

  ctx.onFrame(dt => {
    for (const [id, m] of meshes) {
      const size = m.mesh.userData.size;
      if (m.leaving > 0) {
        m.leaving = Math.max(0, m.leaving - dt / 0.35);
        m.mesh.scale.setScalar(size * (0.3 + 0.7 * m.leaving));
        m.mesh.material.opacity *= 0.82;
        if (m.leaving === 0) { group.remove(m.mesh); m.mesh.material.dispose(); meshes.delete(id); }
        continue;
      }
      if (m.pop < 1) {             // nieuwe spetter: klapt tegen de muur
        m.pop = Math.min(1, m.pop + dt / 0.28);
        const k = m.pop < 0.7 ? m.pop / 0.7 * 1.2 : 1.2 - (m.pop - 0.7) / 0.3 * 0.2;
        m.mesh.scale.setScalar(size * k);
      } else if (m.pulse > 0) {    // er wordt geboend
        m.pulse = Math.max(0, m.pulse - dt / 0.25);
        m.mesh.scale.setScalar(size * (1 - 0.12 * Math.sin(m.pulse * Math.PI)));
      }
    }
  });

  return {
    group,
    // list: de volledige lijst uit de spelstand. Nieuwe vlekken klappen erbij, verdwenen vlekken poetsen weg.
    set(list, { animate = true } = {}) {
      const ids = new Set(list.map(s => s.id));
      for (const [id, m] of meshes) if (!ids.has(id) && m.leaving === 0) m.leaving = animate ? 1 : 0.01;
      for (const s of list) {
        const m = meshes.get(s.id);
        if (!m) add(s, animate);
        else m.mesh.material.opacity = opacity(s.dirt);
      }
    },
    scrub(id, dirt) {
      const m = meshes.get(id);
      if (!m) return;
      m.pulse = 1;
      m.mesh.material.opacity = opacity(dirt);
    },
    // Verberg de vlekken op de wand waar de camera doorheen kijkt.
    hideWall(wall) { hiddenWall = wall ? `wall-${wall}` : null; applyHidden(); },
    targets: () => [...meshes.values()].filter(m => m.leaving === 0 && m.mesh.visible).map(m => m.mesh),
    position(id) { const m = meshes.get(id); return m ? m.mesh.getWorldPosition(new THREE.Vector3()) : null; },
    count: () => [...meshes.values()].filter(m => m.leaving === 0).length,
    ids: () => [...meshes.entries()].filter(([, m]) => m.leaving === 0).map(([id]) => id),
  };
}
