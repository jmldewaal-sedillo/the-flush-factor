// Het toilet: gedownload model "Toilet" van HippoStance (CC BY 4.0), met de eigen textures.
// Het deksel staat in het model al open. Wij voegen alleen glans (clearcoat) en skins toe.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { PLACES } from '../data/room.js';
import { splitByTriCounts, expandByMesh } from './geometry.js';

const MODEL = 'assets/models/toilet.glb';
// Het model heeft een stopkraan met toevoerslang die links laag tegen de wand hangt. In het spel leest dat
// als een los hendeltje naast de pot, dus die onderdelen (herkend aan hun aantal driehoeken) tonen we niet.
const PLUMBING_TRIS = [784, 384, 320, 196, 58, 46];
const HANDLE_PRESS = 0.6;        // radialen: hoe ver de spoelhendel omlaag gaat

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
  const plumbing = splitByTriCounts(bowlMesh, PLUMBING_TRIS);
  if (plumbing) plumbing.material.visible = false;

  // De spoelhendel op de stortbak draait om zijn eigen bevestigingspunt, om de as die naar voren wijst.
  const handleBase = handle.quaternion.clone();
  const handleAxis = new THREE.Vector3(0, 0, 1).transformDirection(handle.parent.matrixWorld.clone().invert());
  const handleTurn = new THREE.Quaternion();
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
      material.color.setHex(s.color);
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
    // voor tests (punt 64)
    parts() {
      let handles = 0;
      model.traverse(o => { if (o.isMesh && /handle/i.test(o.parent.name) && o.visible) handles++; });
      // zichtbare romp: steekt er nog iets links onder de stortbak uit?
      const body = new THREE.Box3();
      model.updateWorldMatrix(true, true);
      expandByMesh(body, bowlMesh, plumbing ? plumbing.bodyIndexCount : Infinity);
      const all = new THREE.Box3().setFromObject(bowlMesh);
      return {
        flushHandles: handles, plumbingPartsHidden: plumbing ? plumbing.found : 0,
        bodyWidth: +(body.max.x - body.min.x).toFixed(3), widthWithPlumbing: +(all.max.x - all.min.x).toFixed(3),
        handleAngle: +handleAngle.toFixed(3),
      };
    },
  };
}
