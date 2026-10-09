// 3D-weergave. Bouwt de scène uit de modules in js/three/ en luistert naar de eventbus.
// Raakt de spellogica niet aan: game.js stuurt events, deze module tekent.
import * as THREE from 'three';
import { bus } from './events.js';
import { BUCKETS } from './data/buckets.js';
import { COSMETIC_LISTS } from './data/cosmetics.js';
import { CAMERA_VIEWS } from './data/room.js';
import { detectQuality, createContext, loadEnvironment } from './three/context.js';
import { createRoom } from './three/room.js';
import { createToilet } from './three/toilet.js';
import { createWater } from './three/water.js';
import { createBucket } from './three/bucket.js';
import { createDecor } from './three/decor.js';
import { createCameraRig } from './three/camera.js';
import { createEffects } from './three/effects.js';

const find = (list, id) => list.find(x => x.id === id) || list[0];

// snapshot: { bucketId, bucketItems: [propId], cosmetics: {toilet,tiles,floor}, decor: {anchor: id} }
// Geeft null terug als WebGL niet beschikbaar is.
export async function init3D(container, snapshot) {
  const quality = detectQuality();
  if (!quality) return null;

  const ctx = createContext(container, quality);
  const room = createRoom(ctx);
  const bucket = createBucket(ctx);
  const decor = createDecor(ctx);

  const rig = createCameraRig(ctx, {
    bucketTarget: () => bucket.group.position.clone().add(new THREE.Vector3(0, bucket.height() * 0.75, 0)),
    onViewChange: id => applyView(id),
    onTap: (x, y) => handleTap(x, y),
  });

  function applyView(id) {
    decor.setMarkersVisible(!!CAMERA_VIEWS[id].anchors);
    bucket.setHandleVisible(id !== 'bucket');
    // Bij een zijmuur kijkt de camera door de muur ertegenover heen.
    const seeThrough = { wallLeft: 'right', wallRight: 'left' }[id] || null;
    decor.hideWall(seeThrough);
    room.paperHolder.visible = seeThrough !== 'right';
    bus.emit('view:changed', { id });
  }

  // Tik op de emmer → emmerweergave; tik op een vrije plek → melding.
  const raycaster = new THREE.Raycaster();
  function handleTap(x, y) {
    const r = ctx.canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), ctx.camera);
    if (decor.markersVisible()) {
      const hit = raycaster.intersectObjects(decor.markers.children.filter(m => m.visible), false)[0];
      if (hit) return bus.emit('anchor:tap', { id: hit.object.userData.anchorId });
    }
    if (rig.view() !== 'bucket' && raycaster.intersectObject(bucket.group, true).length) rig.setView('bucket');
  }

  // Eerste beeld: kamer, toilet en de actieve emmer. De rest (HDRI, andere emmers) komt later.
  const [toilet] = await Promise.all([
    createToilet(ctx),
    room.setTiles(find(COSMETIC_LISTS.tiles, snapshot.cosmetics.tiles)),
    room.setFloor(find(COSMETIC_LISTS.floor, snapshot.cosmetics.floor)),
    bucket.setBucket(find(BUCKETS, snapshot.bucketId)),
  ]);
  toilet.setSkin(find(COSMETIC_LISTS.toilet, snapshot.cosmetics.toilet));
  bucket.setItems(snapshot.bucketItems);
  decor.set(snapshot.decor);

  const water = createWater(ctx, toilet);
  const effects = createEffects(ctx, { toilet, water, bucket, rig });

  bus.on('flush', () => effects.flush());
  bus.on('clog', ({ propId }) => effects.clog(propId));
  bus.on('unclog', ({ intoBucket }) => effects.unclog({ intoBucket }));
  bus.on('chaos', () => effects.chaos());
  bus.on('overflow', () => effects.overflow());
  bus.on('water', ({ level, clogged, phase }) => { water.set(level, clogged, phase); effects.setWater(level, clogged); });
  bus.on('cosmetic', ({ slot, id }) => {
    const def = find(COSMETIC_LISTS[slot], id);
    if (slot === 'toilet') toilet.setSkin(def);
    else if (slot === 'tiles') room.setTiles(def);
    else if (slot === 'floor') room.setFloor(def);
  });
  bus.on('decor', ({ map }) => decor.set(map));
  bus.on('bucket:set', ({ id }) => bucket.setBucket(find(BUCKETS, id)).then(() => rig.view() === 'bucket' && rig.refresh()));
  bus.on('bucket:empty', () => bucket.empty());
  bus.on('view:set', ({ id }) => rig.setView(id));

  rig.refresh();
  applyView(rig.view());
  ctx.start();

  // Omgevingslicht is niet nodig voor het eerste beeld: kort daarna laden.
  setTimeout(() => loadEnvironment(ctx).catch(err => console.warn('[3D] omgevingslicht niet geladen:', err.message)), 250);

  return {
    quality,
    setView: id => rig.setView(id),
    view: () => rig.view(),
    // Uitleesfuncties voor de tests (en voor foutzoeken in de console via window.__game.three).
    debug: {
      quality, frames: () => ctx.frames,
      view: () => rig.view(), cameraIdle: () => rig.idle(), topCovered: () => rig.topCovered(),
      swipe: step => rig.swipe(step),
      bucketId: () => bucket.id(), bucketItemCount: () => bucket.itemCount(),
      bucketHasHandle: () => bucket.hasHandle(), bucketHandleVisible: () => bucket.handleVisible(),
      propInBowl: () => effects.propInBowl(), propId: () => effects.propId(), effectsBusy: () => effects.busy(),
      bubbles: () => effects.activeBubbles(), puddle: () => effects.puddleVisible(),
      waterLevel: () => water.level(), waterFit: () => water.fit,
      markersVisible: () => decor.markersVisible(), markerCount: () => decor.visibleMarkerCount(), decor: () => decor.placed(),
      surfaces: () => room.surfaceIds(), toiletSkin: () => toilet.skinId(), toiletOwnTextures: () => toilet.usesOwnTextures(),
      hasEnvironment: () => !!ctx.scene.environment,
      project(x, y, z) {
        const v = new THREE.Vector3(x, y, z).project(ctx.camera);
        const r = ctx.canvas.getBoundingClientRect();
        return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
      },
      bucketScreen() { const p = bucket.group.position; return this.project(p.x, p.y + bucket.height() / 2, p.z); },
    },
  };
}
