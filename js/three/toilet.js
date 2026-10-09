// Het toilet: gedownload model "Toilet" van HippoStance (CC BY 4.0), met de eigen textures.
// Het deksel staat in het model al open. Wij voegen alleen glans (clearcoat) en skins toe.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { PLACES } from '../data/room.js';

const MODEL = 'assets/models/toilet.glb';

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

  let skinId = null;
  let handleKick = 0;
  ctx.onFrame(dt => {
    if (handleKick <= 0 || !handle) return;
    handleKick = Math.max(0, handleKick - dt * 3);
    handle.position.y = -0.012 * Math.sin(handleKick * Math.PI);
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
  };
}
