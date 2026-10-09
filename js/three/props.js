// Kleine procedurele 3D-voorwerpen die het toilet verstoppen en in de emmer belanden.
// Zelf gemaakt uit eenvoudige vormen; elk voorwerp is ongeveer 10 cm groot (schaal 1).
import * as THREE from 'three';
import { CLOG_PROPS } from '../data/clog-props.js';

const mats = {};
const mat = (color, opts = {}) => (mats[color + JSON.stringify(opts)] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts }));
const mesh = (geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) => {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scale);
  return m;
};
const sphere = (r, seg = 14) => new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4));

const builders = {
  paperWad() {
    const geo = new THREE.IcosahedronGeometry(0.05, 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 0.82 + 0.3 * Math.abs(Math.sin(p.getX(i) * 71 + p.getY(i) * 113 + p.getZ(i) * 157));
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.85, p.getZ(i) * k);
    }
    geo.computeVertexNormals();
    return [mesh(geo, mat(0xfaf8f2, { roughness: 0.95, flatShading: true }))];
  },
  duck() {
    const y = mat(0xffd21f, { roughness: 0.35 }), o = mat(0xff7a1a), k = mat(0x111111);
    return [
      mesh(sphere(0.045), y, [0, 0, 0], [0, 0, 0], [1.25, 0.85, 0.95]),
      mesh(sphere(0.03), y, [0.035, 0.045, 0]),
      mesh(new THREE.ConeGeometry(0.014, 0.03, 10), o, [0.068, 0.04, 0], [0, 0, -Math.PI / 2], [1, 1, 1.6]),
      mesh(new THREE.ConeGeometry(0.02, 0.035, 8), y, [-0.058, 0.02, 0], [0, 0, 0.9]),
      mesh(sphere(0.005, 8), k, [0.05, 0.055, 0.018]), mesh(sphere(0.005, 8), k, [0.05, 0.055, -0.018]),
    ];
  },
  sock() {
    const w = mat(0xf2f2f2, { roughness: 0.9 }), r = mat(0xd9363e, { roughness: 0.9 });
    return [
      mesh(new THREE.CapsuleGeometry(0.022, 0.06, 6, 12), w, [0, 0.03, 0]),
      mesh(new THREE.CapsuleGeometry(0.022, 0.045, 6, 12), w, [0.03, -0.012, 0], [0, 0, Math.PI / 2]),
      mesh(new THREE.CylinderGeometry(0.0235, 0.0235, 0.02, 14), r, [0, 0.07, 0]),
      mesh(sphere(0.0225, 12), r, [0.056, -0.012, 0]),
    ];
  },
  toyCar() {
    const body = mat(0x2f7fd8, { roughness: 0.3 }), glass = mat(0xbfe3ff, { roughness: 0.1 }), tyre = mat(0x1b1b1b, { roughness: 0.9 });
    const wheel = new THREE.CylinderGeometry(0.016, 0.016, 0.014, 14);
    const parts = [
      mesh(new THREE.BoxGeometry(0.11, 0.028, 0.052), body, [0, 0.008, 0]),
      mesh(new THREE.BoxGeometry(0.055, 0.026, 0.046), glass, [-0.005, 0.034, 0]),
      mesh(new THREE.BoxGeometry(0.058, 0.004, 0.048), body, [-0.005, 0.049, 0]),
    ];
    for (const x of [-0.034, 0.034]) for (const z of [-0.028, 0.028]) parts.push(mesh(wheel, tyre, [x, -0.008, z], [Math.PI / 2, 0, 0]));
    return parts;
  },
  phone() {
    return [
      mesh(new THREE.BoxGeometry(0.058, 0.11, 0.008), mat(0x1c1f26, { roughness: 0.25, metalness: 0.4 })),
      mesh(new THREE.BoxGeometry(0.05, 0.098, 0.0015), mat(0x3d8bd9, { roughness: 0.1, emissive: 0x123a66 }), [0, 0, 0.0046]),
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.002, 12), mat(0x0a0a0a), [-0.016, 0.04, -0.005], [Math.PI / 2, 0, 0]),
    ];
  },
  teddy() {
    const fur = mat(0xa9713f, { roughness: 1 }), light = mat(0xe0bf93, { roughness: 1 }), k = mat(0x151515);
    return [
      mesh(sphere(0.04), fur, [0, -0.012, 0], [0, 0, 0], [1, 1.1, 0.9]),
      mesh(sphere(0.032), fur, [0, 0.048, 0]),
      mesh(sphere(0.013, 10), fur, [-0.027, 0.074, 0]), mesh(sphere(0.013, 10), fur, [0.027, 0.074, 0]),
      mesh(sphere(0.014, 10), light, [0, 0.04, 0.026]),
      mesh(sphere(0.004, 8), k, [0, 0.045, 0.039]), mesh(sphere(0.004, 8), k, [-0.012, 0.057, 0.027]), mesh(sphere(0.004, 8), k, [0.012, 0.057, 0.027]),
      mesh(sphere(0.016, 10), fur, [-0.042, 0.004, 0.008]), mesh(sphere(0.016, 10), fur, [0.042, 0.004, 0.008]),
      mesh(sphere(0.018, 10), fur, [-0.024, -0.05, 0.012]), mesh(sphere(0.018, 10), fur, [0.024, -0.05, 0.012]),
    ];
  },
  fish() {
    const o = mat(0xff8a2a, { roughness: 0.35 }), k = mat(0x111111), w = mat(0xffffff);
    return [
      mesh(sphere(0.035), o, [0, 0, 0], [0, 0, 0], [1.5, 0.9, 0.55]),
      mesh(new THREE.ConeGeometry(0.03, 0.04, 4), o, [-0.066, 0, 0], [0, 0, -Math.PI / 2], [1, 1, 0.25]),
      mesh(new THREE.ConeGeometry(0.014, 0.024, 4), o, [0, 0.036, 0], [0, 0, 0.3], [1, 1, 0.25]),
      mesh(sphere(0.007, 8), w, [0.032, 0.008, 0.016]), mesh(sphere(0.004, 8), k, [0.035, 0.008, 0.021]),
      mesh(sphere(0.007, 8), w, [0.032, 0.008, -0.016]), mesh(sphere(0.004, 8), k, [0.035, 0.008, -0.021]),
    ];
  },
  banana() {
    const y = mat(0xf7d038, { roughness: 0.7 }), inner = mat(0xfff3c4, { roughness: 0.9 }), stem = mat(0x6b4a1f);
    const strip = new THREE.TorusGeometry(0.045, 0.011, 6, 12, Math.PI * 0.62);
    const parts = [mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.02, 8), stem, [0, 0.008, 0])];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.3;
      const s = mesh(strip, i % 2 ? y : inner, [Math.cos(a) * 0.045, 0, Math.sin(a) * 0.045], [0, -a, 0], [1, 1, 2.2]);
      s.rotateZ(Math.PI * 0.5);
      parts.push(s);
    }
    return parts;
  },
  brick() {
    const r = mat(0xd62828, { roughness: 0.3 });
    const stud = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12);
    const parts = [mesh(new THREE.BoxGeometry(0.1, 0.04, 0.05), r)];
    for (const x of [-0.0375, -0.0125, 0.0125, 0.0375]) for (const z of [-0.0125, 0.0125]) parts.push(mesh(stud, r, [x, 0.025, z]));
    return parts;
  },
  key() {
    const g = mat(0xd9a520, { roughness: 0.3, metalness: 1 });
    return [
      mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 18), g, [-0.035, 0, 0]),
      mesh(new THREE.BoxGeometry(0.065, 0.008, 0.006), g, [0.014, 0, 0]),
      mesh(new THREE.BoxGeometry(0.008, 0.016, 0.006), g, [0.038, -0.01, 0]),
      mesh(new THREE.BoxGeometry(0.008, 0.012, 0.006), g, [0.024, -0.008, 0]),
    ];
  },
};

export function buildProp(propId, ctx) {
  const def = CLOG_PROPS.find(p => p.id === propId) || CLOG_PROPS[0];
  const g = new THREE.Group();
  g.name = `prop:${def.id}`;
  g.userData.propId = def.id;
  g.add(...(builders[def.model] || builders.paperWad)());
  ctx?.setShadow(g, true, false);
  return g;
}
