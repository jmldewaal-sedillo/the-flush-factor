// Decoratie op de ankerpunten (data/room.js) + de "+"-markering van vrije plekken.
// Alles hier is zelf gemaakt uit eenvoudige vormen (planken, kastje, lijsten, pot).
import * as THREE from 'three';
import { ANCHORS } from '../data/room.js';
import { DECORATIONS } from '../data/cosmetics.js';
import { drawCanvas } from './patterns.js';

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts });
const box = (w, h, d, material, pos = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(...pos); return m; };
const canvasPlane = (w, h, canvas) => {
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
};
const framed = (w, h, frameMat, content) => {
  const g = new THREE.Group(), t = 0.035;
  g.add(box(w, t, 0.03, frameMat, [0, h / 2 - t / 2, 0.015]), box(w, t, 0.03, frameMat, [0, -h / 2 + t / 2, 0.015]),
        box(t, h, 0.03, frameMat, [-w / 2 + t / 2, 0, 0.015]), box(t, h, 0.03, frameMat, [w / 2 - t / 2, 0, 0.015]));
  content.position.z = 0.012;
  g.add(content);
  return g;
};

// Elke bouwfunctie levert een groep met de oorsprong op het ankerpunt; +z wijst de kamer in.
const builders = {
  mirror() {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.58), std(0xdfeaf2, { metalness: 1, roughness: 0.04 }));
    return framed(0.5, 0.64, std(0x7a5a3a, { roughness: 0.5 }), glass);
  },
  painting() {
    const canvas = drawCanvas(256, 320, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#6f8a6a'); sky.addColorStop(1, '#3d4a3a');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f1e8';                                   // stortbak, pot en voet: een toilet "en portrait"
      g.beginPath(); g.roundRect(78, 70, 100, 80, 10); g.fill();
      g.beginPath(); g.ellipse(128, 190, 62, 34, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(92, 205); g.lineTo(164, 205); g.lineTo(150, 280); g.lineTo(106, 280); g.closePath(); g.fill();
      g.fillStyle = '#8fd8f2'; g.beginPath(); g.ellipse(128, 188, 40, 18, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.ellipse(128, 190, 62, 34, 0, 0, 7); g.stroke();
    });
    return framed(0.42, 0.52, std(0xb8892f, { metalness: 0.8, roughness: 0.35 }), canvasPlane(0.36, 0.46, canvas));
  },
  poster() {
    const canvas = drawCanvas(256, 360, (g, w, h) => {
      g.fillStyle = '#12355b'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4a261'; g.beginPath(); g.arc(w / 2, 120, 62, 0, 7); g.fill();
      g.fillStyle = '#12355b'; g.beginPath(); g.arc(w / 2, 120, 40, 0, 7); g.fill();
      g.fillStyle = '#f4a261'; g.beginPath(); g.arc(w / 2, 120, 18, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = '900 34px system-ui, sans-serif';
      ['BELIEVE', 'IN YOUR', 'FLUSH'].forEach((t, i) => g.fillText(t, w / 2, 236 + i * 40));
    });
    const p = canvasPlane(0.36, 0.5, canvas);
    p.position.z = 0.004;
    return new THREE.Group().add(p);
  },
  shelf() {
    const wood = std(0x9b7448, { roughness: 0.7 }), metal = std(0x30343a, { metalness: 0.8, roughness: 0.4 });
    const paper = std(0xfbfaf6, { roughness: 0.95 });
    const g = new THREE.Group();
    g.add(box(0.72, 0.028, 0.17, wood, [0, 0, 0.085]));
    for (const x of [-0.27, 0.27]) g.add(box(0.02, 0.11, 0.02, metal, [x, -0.07, 0.012]), box(0.02, 0.02, 0.13, metal, [x, -0.024, 0.075]));
    for (const [x, y] of [[-0.2, 0.064], [-0.09, 0.064], [-0.145, 0.164]]) {
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.1, 24), paper);
      roll.position.set(x, y, 0.085);
      g.add(roll);
    }
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.022, 0.07, 16), std(0xd9a520, { metalness: 1, roughness: 0.3 }));
    cup.position.set(0.2, 0.05, 0.085);
    g.add(cup);
    return g;
  },
  cabinet() {
    const white = std(0xf4f2ec, { roughness: 0.45 }), g = new THREE.Group();
    g.add(box(0.42, 0.52, 0.15, white, [0, 0, 0.075]));
    g.add(box(0.2, 0.49, 0.012, std(0xe6e2d8, { roughness: 0.4 }), [-0.103, 0, 0.156]), box(0.2, 0.49, 0.012, std(0xe6e2d8, { roughness: 0.4 }), [0.103, 0, 0.156]));
    const knob = std(0x8a8f96, { metalness: 1, roughness: 0.3 });
    for (const x of [-0.02, 0.02]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), knob); k.position.set(x, -0.04, 0.17); g.add(k); }
    return g;
  },
  plant() {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.17, 20), std(0xc9683f, { roughness: 0.85 }));
    pot.position.y = 0.085;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.025, 20), pot.material);
    rim.position.y = 0.165;
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.01, 20), std(0x3a2a1c, { roughness: 1 }));
    soil.position.y = 0.172;
    g.add(pot, rim, soil);
    const leafGeo = new THREE.SphereGeometry(1, 10, 8);
    const greens = [std(0x2f7d3a, { roughness: 0.55 }), std(0x3e9a4a, { roughness: 0.55 }), std(0x236b30, { roughness: 0.55 })];
    for (let i = 0; i < 11; i++) {
      const a = i * 2.39996, lean = 0.12 + (i % 4) * 0.13, len = 0.2 + (i % 3) * 0.06;
      const stem = new THREE.Group();
      stem.position.y = 0.17; stem.rotation.set(0, a, 0);
      const leaf = new THREE.Mesh(leafGeo, greens[i % 3]);
      leaf.scale.set(0.034, len, 0.008);
      leaf.position.y = len;
      const bend = new THREE.Group(); bend.rotation.z = lean; bend.add(leaf);
      stem.add(bend);
      g.add(stem);
    }
    return g;
  },
};

export function createDecor(ctx) {
  const group = new THREE.Group();
  group.name = 'decor';
  ctx.scene.add(group);

  // Markering van vrije plekken: subtiele ring met een plus.
  const markerTex = new THREE.CanvasTexture(drawCanvas(128, 128, g => {
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 7; g.lineCap = 'round';
    g.setLineDash([14, 12]); g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(64, 40); g.lineTo(64, 88); g.moveTo(40, 64); g.lineTo(88, 64); g.stroke();
  }));
  markerTex.colorSpace = THREE.SRGBColorSpace;
  const markers = new THREE.Group();
  markers.visible = false;
  group.add(markers);

  const slots = {};
  for (const [id, a] of Object.entries(ANCHORS)) {
    const holder = new THREE.Group();
    holder.position.set(...a.position);
    holder.rotation.y = a.rotationY;
    group.add(holder);

    const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: markerTex, transparent: true, opacity: 0.6, depthWrite: false }));
    marker.position.set(...a.position);
    marker.rotation.y = a.rotationY;
    if (a.wall === 'floor') { marker.rotation.x = -Math.PI / 2; marker.position.y = 0.006; }
    else marker.translateZ(0.006);
    marker.userData.anchorId = id;
    marker.renderOrder = 3;
    markers.add(marker);
    slots[id] = { holder, marker, itemId: null };
  }

  ctx.onFrame((dt, time) => {
    if (!markers.visible) return;
    markers.children.forEach((m, i) => { m.material.opacity = 0.6 + 0.2 * Math.sin(time * 2 + i); });
  });

  return {
    group, markers,
    // map: { anchorId: decorationId }
    set(map) {
      for (const [id, slot] of Object.entries(slots)) {
        const want = map[id] || null;
        if (slot.itemId === want) continue;
        slot.holder.clear();
        slot.itemId = want;
        const def = DECORATIONS.find(d => d.id === want);
        if (def && builders[def.build]) {
          const obj = builders[def.build]();
          ctx.setShadow(obj, true, true);
          slot.holder.add(obj);
        }
        slot.marker.visible = !slot.itemId;
      }
    },
    setMarkersVisible(v) { markers.visible = v; },
    // Verberg wat aan de wand hangt waar de camera doorheen kijkt (anders zie je de achterkant).
    hideWall(wall) {
      for (const [id, slot] of Object.entries(slots)) slot.holder.visible = ANCHORS[id].wall !== wall;
    },
    markersVisible: () => markers.visible,
    visibleMarkerCount: () => (markers.visible ? markers.children.filter(m => m.visible).length : 0),
    placed: () => Object.fromEntries(Object.entries(slots).filter(([, s]) => s.itemId).map(([id, s]) => [id, s.itemId])),
  };
}
