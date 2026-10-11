// Het toilet: gedownload model "Toilet" van HippoStance (CC BY 4.0), met de eigen textures.
// Het deksel staat in het model al open. Wij voegen alleen glans (clearcoat) en skins toe.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { PLACES } from '../data/room.js';
import { splitByTriCounts, expandByMesh, listComponents } from './geometry.js';
import { paintCrack, paintChip } from './patterns.js';

const MODEL = 'assets/models/toilet.glb';
// Het model heeft een stopkraan met toevoerslang die links laag tegen de wand hangt. In het spel leest dat
// als een los hendeltje naast de pot, dus die onderdelen (herkend aan hun aantal driehoeken) tonen we niet.
const PLUMBING_TRIS = [784, 384, 320, 196, 58, 46];
// Vier zwarte bouten (elk 174 driehoeken): twee in de voet bij de vloer en twee onder de stortbak. Van een
// afstand lezen ze als losse zwarte streepjes naast de pot (punt 90), dus die tonen we ook niet.
const BOLT_TRIS = [174, 174, 174, 174];
const HANDLE_PRESS = 0.6;        // radialen: hoe ver de spoelhendel omlaag gaat
// Kapot (punt 80): hoe scheef bril en deksel hangen (radialen), en de kleur van een vies toilet.
const SEAT_SKEW = { yaw: 0.17, roll: 0.07 };
const LID_SKEW = { roll: 0.11 };
const DINGY = new THREE.Color(0xcfc59c);

// Viezigheid als laag bovenop het model: grillige vlekken in wereldcoördinaten, meer onderaan en in hoeken.
// De eigen textures van het model blijven eronder gewoon zichtbaar.
const GRIME_VERT = `
  varying vec3 vWorld;
  void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GRIME_FRAG = `
  uniform float uAmount;
  varying vec3 vWorld;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  void main() {
    float n = noise(vWorld * 17.0) * 0.6 + noise(vWorld * 41.0) * 0.4;
    float streak = noise(vec3(vWorld.x * 60.0, vWorld.y * 5.0, vWorld.z * 60.0));       // druipers naar beneden
    float low = smoothstep(0.75, 0.0, vWorld.y);                                         // onderaan viezer
    float spots = smoothstep(0.58 - 0.2 * low, 0.72 - 0.2 * low, n) + smoothstep(0.72, 0.9, streak) * 0.5;
    float a = clamp(spots, 0.0, 1.0) * 0.78 * smoothstep(0.0, 0.25, uAmount);
    a *= step(1.0 - uAmount * 1.05, n * 0.5 + streak * 0.5 + 0.02 + uAmount * 0.5);     // poetsen: vlekken lossen op
    vec3 col = mix(vec3(0.36, 0.28, 0.12), vec3(0.30, 0.34, 0.14), noise(vWorld * 9.0));
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;

export async function createToilet(ctx) {
  const gltf = await new GLTFLoader().loadAsync(MODEL);
  const model = gltf.scene;
  const group = new THREE.Group();        // vaste plek in de kamer
  const shaker = new THREE.Group();       // trilt bij een verstopping
  group.name = 'toilet';
  group.add(shaker);
  shaker.add(model);
  group.position.set(...PLACES.toilet.position);
  ctx.scene.add(group);

  // Eén materiaal voor alle onderdelen; maak er porselein met glanslaag van.
  let original = null;
  model.traverse(o => { if (o.isMesh && !original) original = o.material; });
  const material = new THREE.MeshPhysicalMaterial({
    map: original.map, normalMap: original.normalMap,
    roughnessMap: original.roughnessMap, metalnessMap: original.metalnessMap, aoMap: original.aoMap,
    roughness: original.roughness, metalness: original.metalness,
    clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.2,
  });
  const maps = { map: material.map, roughnessMap: material.roughnessMap, metalnessMap: material.metalnessMap };
  const base = { roughness: material.roughness, metalness: material.metalness };
  model.traverse(o => { if (o.isMesh) o.material = material; });
  ctx.setShadow(model, true, true);

  // Achterkant van de stortbak tegen de wand, voeten op de vloer.
  model.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y - group.position.y;
  model.position.z -= box.min.z - group.position.z;
  model.updateWorldMatrix(true, true);

  const bowlMesh = model.getObjectByName('Toilet').getObjectByProperty('isMesh', true);
  const seat = model.getObjectByName('ToiletSeat');
  const handle = model.getObjectByName('ToiletFlushHandle');

  // Stopkraan en slang verbergen (zie PLUMBING_TRIS).
  const plumbing = splitByTriCounts(bowlMesh, [...PLUMBING_TRIS, ...BOLT_TRIS]);
  if (plumbing) plumbing.material.visible = false;

  // De spoelhendel op de stortbak draait om zijn eigen bevestigingspunt, om de as die naar voren wijst.
  const handleBase = handle.quaternion.clone();
  const handleAxis = new THREE.Vector3(0, 0, 1).transformDirection(handle.parent.matrixWorld.clone().invert());
  const handleTurn = new THREE.Quaternion();
  // ── Staat van het toilet (punt 80): kapot en/of vies, als lagen bovenop het model ──
  const lid = model.getObjectByName('ToiletSeatCover');
  const toParent = (node, x, y, z) => new THREE.Vector3(x, y, z).transformDirection(node.parent.matrixWorld.clone().invert());
  const seatBase = seat.quaternion.clone(), lidBase = lid.quaternion.clone();
  const seatUp = toParent(seat, 0, 1, 0), seatFwd = toParent(seat, 0, 0, 1), lidFwd = toParent(lid, 0, 0, 1);

  const decalMat = canvas => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); };
  // barst: op de voorkant van het (open) deksel
  const lidBox = new THREE.Box3().setFromObject(lid);
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), decalMat(paintCrack()));
  crack.position.set((lidBox.min.x + lidBox.max.x) / 2 + 0.02, (lidBox.min.y + lidBox.max.y) / 2 + 0.03, lidBox.max.z + 0.002);
  crack.renderOrder = 2;
  ctx.scene.add(crack); lid.attach(crack);
  // ontbrekend stukje: bovenop de voorrand van de bril
  const seatBox = new THREE.Box3().setFromObject(seat);
  const chip = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.06), decalMat(paintChip()));
  chip.rotation.x = -Math.PI / 2;
  chip.position.set(seatBox.min.x + (seatBox.max.x - seatBox.min.x) * 0.66, seatBox.max.y + 0.0015, seatBox.max.z - 0.028);
  chip.renderOrder = 2;
  ctx.scene.add(chip); seat.attach(chip);

  // vuillaag: een tweede, doorzichtige huid over elk onderdeel
  const grimeU = { uAmount: { value: 0 } };
  const grimeMat = new THREE.ShaderMaterial({ vertexShader: GRIME_VERT, fragmentShader: GRIME_FRAG, uniforms: grimeU, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  const skins = [], grimeLayers = [];
  model.traverse(o => { if (o.isMesh && o !== crack && o !== chip) skins.push(o); });
  for (const o of skins) {
    let geo = o.geometry;
    if (o === bowlMesh && plumbing) {          // zonder de verborgen stopkraan
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', o.geometry.attributes.position);
      geo.setIndex(o.geometry.index);
      geo.setDrawRange(0, plumbing.bodyIndexCount);
    }
    const layer = new THREE.Mesh(geo, grimeMat);
    layer.position.copy(o.position); layer.quaternion.copy(o.quaternion); layer.scale.copy(o.scale);
    layer.renderOrder = 1;
    layer.raycast = () => {};
    layer.userData.layer = true;
    layer.visible = false;
    grimeLayers.push(layer);
    o.parent.add(layer);
  }

  // doelwaarden (uit de spelstand) en wat er nu getoond wordt (loopt er vloeiend naartoe)
  const want = { seat: 0, lid: 0, chip: 0, dirt: 0 };
  const show = { seat: 0, lid: 0, chip: 0, dirt: 0 };
  const skinColor = new THREE.Color(0xffffff);
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  function applyCondition() {
    seat.quaternion.copy(q.setFromAxisAngle(seatUp, SEAT_SKEW.yaw * show.seat)).multiply(q2.setFromAxisAngle(seatFwd, SEAT_SKEW.roll * show.seat)).multiply(seatBase);
    lid.quaternion.copy(q.setFromAxisAngle(lidFwd, LID_SKEW.roll * show.lid)).multiply(lidBase);
    crack.material.opacity = show.lid; crack.visible = show.lid > 0.01;
    chip.material.opacity = show.chip; chip.visible = show.chip > 0.01;
    grimeU.uAmount.value = show.dirt;
    // Schoon toilet: de vuillaag helemaal niet tekenen (scheelt de helft van het tekenwerk).
    for (const layer of grimeLayers) layer.visible = show.dirt > 0.005;
    material.color.copy(skinColor).lerp(DINGY, show.dirt * 0.75);
    material.clearcoat = 0.6 * (1 - show.dirt * 0.85);
  }
  ctx.onFrame(dt => {
    let moving = false;
    for (const k of Object.keys(want)) {
      if (show[k] === want[k]) continue;
      const step = dt / (k === 'dirt' ? 0.9 : 0.6);
      show[k] = Math.abs(want[k] - show[k]) <= step ? want[k] : show[k] + Math.sign(want[k] - show[k]) * step;
      moving = true;
    }
    if (moving) applyCondition();
  });

  let skinId = null;
  let handleKick = 0;
  let handleAngle = 0;
  ctx.onFrame(dt => {
    if (handleKick <= 0 && handleAngle === 0) return;
    handleKick = Math.max(0, handleKick - dt / 0.6);
    handleAngle = HANDLE_PRESS * Math.sin(Math.min(1, (1 - handleKick) * 1.6) * Math.PI);
    if (handleKick === 0) handleAngle = 0;
    handle.quaternion.copy(handleTurn.setFromAxisAngle(handleAxis, handleAngle)).multiply(handleBase);
  });

  return {
    group, shaker, model, bowlMesh, seat, material,
    setSkin(def) {
      const s = def.skin;
      skinColor.setHex(s.color);
      material.color.copy(skinColor).lerp(DINGY, show.dirt * 0.75);
      material.map = s.maps ? maps.map : null;
      material.roughnessMap = s.maps ? maps.roughnessMap : null;
      material.metalnessMap = s.maps ? maps.metalnessMap : null;
      material.roughness = s.roughness ?? base.roughness;
      material.metalness = s.metalness ?? base.metalness;
      material.needsUpdate = true;
      skinId = def.id;
    },
    skinId: () => skinId,
    usesOwnTextures: () => !!material.map,
    pressHandle() { handleKick = 1; },
    // cond: { defects: { seat, lid, chip }, dirt: 0–1 }. animate: laat de overgang zien (repareren, poetsen).
    setCondition(cond, { animate = false } = {}) {
      want.seat = cond.defects.seat ? 1 : 0;
      want.lid = cond.defects.lid ? 1 : 0;
      want.chip = cond.defects.chip ? 1 : 0;
      want.dirt = cond.dirt;
      if (!animate) { Object.assign(show, want); applyCondition(); }
    },
    condition: () => ({
      seatSkew: +show.seat.toFixed(2), lidSkew: +show.lid.toFixed(2), crackVisible: crack.visible, chipVisible: chip.visible,
      grime: +show.dirt.toFixed(2), settled: Object.keys(want).every(k => show[k] === want[k]),
    }),
    // Alle losse onderdelen van het model, per mesh (om vreemde dingetjes op te sporen; punt 90).
    components() {
      const out = [];
      model.traverse(o => { if (o.isMesh && !o.userData.layer && o !== crack && o !== chip) out.push({ node: o.parent.name || o.name, parts: listComponents(o) }); });
      return out;
    },
    // voor tests (punt 64)
    parts() {
      let handles = 0;
      model.traverse(o => { if (o.isMesh && !o.userData.layer && /handle/i.test(o.parent.name) && o.visible) handles++; });
      // zichtbare romp: steekt er nog iets links onder de stortbak uit?
      const body = new THREE.Box3();
      model.updateWorldMatrix(true, true);
      expandByMesh(body, bowlMesh, plumbing ? plumbing.bodyIndexCount : Infinity);
      const all = new THREE.Box3().setFromObject(bowlMesh);
      return {
        flushHandles: handles, plumbingPartsHidden: plumbing ? Math.min(plumbing.found, PLUMBING_TRIS.length) : 0, boltsHidden: plumbing ? Math.max(0, plumbing.found - PLUMBING_TRIS.length) : 0,
        bodyWidth: +(body.max.x - body.min.x).toFixed(3), widthWithPlumbing: +(all.max.x - all.min.x).toFixed(3),
        handleAngle: +handleAngle.toFixed(3),
      };
    },
  };
}
