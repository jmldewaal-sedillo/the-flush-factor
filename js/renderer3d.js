// 3D-weergave. Bouwt de scène uit de modules in js/three/ en luistert naar de eventbus.
// Raakt de spellogica niet aan: game.js stuurt events, deze module tekent.
import * as THREE from 'three';
import { bus } from './events.js';
import { BUCKETS } from './data/buckets.js';
import { COSMETIC_LISTS } from './data/cosmetics.js';
import { CAMERA_VIEWS, WALL_VIEWS } from './data/room.js';
import { detectQuality, createContext, loadEnvironment } from './three/context.js';
import { createRoom } from './three/room.js';
import { createToilet } from './three/toilet.js';
import { createWater } from './three/water.js';
import { createBucket } from './three/bucket.js';
import { createDecor } from './three/decor.js';
import { createCameraRig } from './three/camera.js';
import { createEffects } from './three/effects.js';
import { createStains } from './three/stains.js';

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
  const stains = createStains(ctx);

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
    stains.hideWall(seeThrough);
    room.paperHolder.visible = seeThrough !== 'right';
    bus.emit('view:changed', { id });
  }

  // Tikken in de scène (punten 65–67):
  //  - in een close-up (emmer, pot): één tik waar dan ook gaat terug naar het vorige standpunt;
  //  - op een vrije "+"-plek: melding;
  //  - op de emmer of het toilet: close-up; op een muur: die muurstand (nog een tik: terug naar het toilet).
  const raycaster = new THREE.Raycaster();
  let toiletGroup = null;
  function handleTap(x, y) {
    const view = rig.view();
    if (CAMERA_VIEWS[view].zoom) return rig.back();

    const r = ctx.canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), ctx.camera);
    if (decor.markersVisible()) {
      const marker = raycaster.intersectObjects(decor.markers.children.filter(m => m.visible), false)[0];
      if (marker) return bus.emit('anchor:tap', { id: marker.object.userData.anchorId });
    }
    const targets = [bucket.group, ...room.walls, ...(toiletGroup ? [toiletGroup] : [])];
    const hit = raycaster.intersectObjects(targets, true)[0];
    if (!hit) return;
    const within = root => { for (let o = hit.object; o; o = o.parent) if (o === root) return true; return false; };
    if (within(bucket.group)) return rig.setView('bucket');
    if (toiletGroup && within(toiletGroup)) return rig.setView('bowl');
    const wallView = WALL_VIEWS[room.walls.indexOf(hit.object)];
    if (wallView) rig.setView(view === wallView ? 'toilet' : wallView);
  }

  // Eerste beeld: kamer, toilet en de actieve emmer. De rest (HDRI, andere emmers) komt later.
  const [toilet] = await Promise.all([
    createToilet(ctx),
    room.setTiles(find(COSMETIC_LISTS.tiles, snapshot.cosmetics.tiles)),
    room.setFloor(find(COSMETIC_LISTS.floor, snapshot.cosmetics.floor)),
    bucket.setBucket(find(BUCKETS, snapshot.bucketId)),
  ]);
  toiletGroup = toilet.group;
  toilet.setSkin(find(COSMETIC_LISTS.toilet, snapshot.cosmetics.toilet));
  bucket.setItems(snapshot.bucketItems);
  decor.set(snapshot.decor);
  toilet.setCondition(snapshot.toilet);
  stains.set(snapshot.stains, { animate: false });

  const water = createWater(ctx, toilet);
  const effects = createEffects(ctx, { toilet, water, bucket, rig });
  water.setScale(snapshot.toilet.dirt);

  // Schoonmaakstand (punt 83): elke aanraking of veeg zoekt wat eronder zit en meldt dat aan het spel.
  const lastScrub = new Map();
  function scrubAt(x, y) {
    const r = ctx.canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), ctx.camera);
    const hit = raycaster.intersectObjects([...stains.targets(), toilet.group], true)[0];
    if (!hit) return;
    const stainId = hit.object.userData.stainId;
    const key = stainId || 'toilet';
    if (ctx.time - (lastScrub.get(key) ?? -9) < 0.28) return;       // één veeg telt één keer
    lastScrub.set(key, ctx.time);
    effects.puff(hit.point, 5, 0.45);
    bus.emit('scrub', stainId ? { kind: 'stain', id: stainId } : { kind: 'toilet' });
  }
  bus.on('scrubmode', ({ on }) => rig.setScrub(on ? scrubAt : null));
  bus.on('stains', ({ list }) => stains.set(list));
  bus.on('stain:scrub', ({ id, dirt }) => stains.scrub(id, dirt));
  bus.on('mess', () => effects.mess());
  bus.on('toilet:condition', cond => {
    toilet.setCondition(cond, { animate: !!cond.animate });
    water.setScale(cond.dirt, !!cond.animate);
    if (cond.animate === 'repair') effects.puff(toilet.group.position.clone().add(new THREE.Vector3(0, 0.5, 0.35)), 12, 0.8);
  });

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
  bus.on('view:back', () => rig.back());

  rig.refresh();
  applyView(rig.view());
  ctx.start();
  // Pas klaar melden als het eerste beeld er echt staat (de camera staat dan op zijn plek;
  // tikken in de scène rekent met de stand van het laatst getekende beeld).
  await new Promise(resolve => { const wait = () => (ctx.frames > 0 ? resolve() : requestAnimationFrame(wait)); wait(); });

  // Omgevingslicht is niet nodig voor het eerste beeld: kort daarna laden.
  setTimeout(() => loadEnvironment(ctx).catch(err => console.warn('[3D] omgevingslicht niet geladen:', err.message)), 250);

  return {
    quality,
    setView: id => rig.setView(id),
    view: () => rig.view(),
    // Uitleesfuncties voor de tests (en voor foutzoeken in de console via window.__game.three).
    debug: {
      quality, frames: () => ctx.frames, clock: () => ctx.time,
      view: () => rig.view(), cameraIdle: () => rig.idle(), topCovered: () => rig.topCovered(),
      swipe: step => rig.swipe(step),
      inspect: (pos, target) => rig.inspect(pos, target),
      bucketId: () => bucket.id(), bucketItemCount: () => bucket.itemCount(),
      bucketHasHandle: () => bucket.hasHandle(), bucketHandleVisible: () => bucket.handleVisible(),
      propInBowl: () => effects.propInBowl(), propId: () => effects.propId(), effectsBusy: () => effects.busy(),
      bubbles: () => effects.activeBubbles(), puddle: () => effects.puddleVisible(),
      waterLevel: () => water.level(), waterFit: () => water.fit,
      markersVisible: () => decor.markersVisible(), markerCount: () => decor.visibleMarkerCount(), decor: () => decor.placed(),
      surfaces: () => room.surfaceIds(), toiletSkin: () => toilet.skinId(), toiletOwnTextures: () => toilet.usesOwnTextures(),
      toiletComponents: () => toilet.components(),
      toiletParts: () => toilet.parts(), toiletCondition: () => ({ ...toilet.condition(), limescale: water.scale() }),
      stains: () => stains.ids(), stainScreen(id) { const p = stains.position(id); return p ? this.project(p.x, p.y, p.z) : null; },
      bucketPacking: () => bucket.packing(), bucketMeasure: () => bucket.measureInner(), flush: () => water.flushState(), freezeFlush: p => water.freeze(p), waterVisible: on => water.setVisible(on),
      drops: () => effects.containedDrops(), unsafeFunnel: depth => water.setUnsafeFunnel(depth),
      // Punt 90: is er water te zien buiten de kom? Tekent hetzelfde beeld met en zonder water en telt de
      // pixels die verschillen; een verschil mag alleen binnen de opening van de kom liggen (wat je van
      // bovenaf door de bril ziet). → { changed, outside }: aantal pixels dat verschilt, en hoeveel daarvan
      // buiten de opening.
      waterLeak(pos, target, flushAt) {
        rig.inspect(pos, target);
        water.freeze(flushAt);
        for (let i = 0; i < 2; i++) ctx.tick();                    // camera en water op hun plek, zelfde tijdstip
        // zonder – met – zonder: een pixel telt alleen als hij mét water anders is dan in beide opnamen zonder
        // (zo telt toevallige beeldruis tussen twee opnamen niet mee)
        water.setVisible(false);
        const without = ctx.pixels();
        water.setVisible(true);
        const withWater = ctx.pixels();
        water.setVisible(false);
        const again = ctx.pixels();
        water.setVisible(true);
        // de opening van de kom, geprojecteerd op het beeld (iets ruimer genomen)
        const { width, height } = withWater, fit = water.fit, poly = [];
        for (let i = 0; i < 48; i++) {
          const a = i / 48 * Math.PI * 2;
          const v = water.localToWorld(new THREE.Vector3(fit.center.x + Math.cos(a) * fit.rimRx * 1.08, fit.rimY + 0.012, fit.center.z + fit.shiftZ + Math.sin(a) * fit.rimRz * 1.08)).clone().project(ctx.camera);
          poly.push([(v.x + 1) / 2 * width, (v.y + 1) / 2 * height]);
        }
        const inside = (x, y) => {
          let hit = false;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [xi, yi] = poly[i], [xj, yj] = poly[j];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
          }
          return hit;
        };
        const near = (x, y) => [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => inside(x + dx, y + dy));
        let changed = 0, outside = 0; const where = [];
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const diff = other => Math.abs(withWater.buffer[i] - other.buffer[i]) + Math.abs(withWater.buffer[i + 1] - other.buffer[i + 1]) + Math.abs(withWater.buffer[i + 2] - other.buffer[i + 2]);
          if (Math.min(diff(without), diff(again)) <= 12) continue;
          changed++;
          if (!near(x + 0.5, y + 0.5)) { outside++; if (where.length < 8) where.push([x, y]); }
        }
        rig.inspect(null);
        water.freeze(null);
        return { changed, outside, where, size: [width, height], opening: poly.filter((_, i) => i % 12 === 0).map(q => q.map(Math.round)) };
      },
      hasEnvironment: () => !!ctx.scene.environment,
      project(x, y, z) {
        const v = new THREE.Vector3(x, y, z).project(ctx.camera);
        const r = ctx.canvas.getBoundingClientRect();
        return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
      },
      bucketScreen() { const p = bucket.group.position; return this.project(p.x, p.y + bucket.height() / 2, p.z); },
      // Schermpunten om op te tikken: het toilet (stortbak) en het midden van elke muur op ooghoogte.
      toiletScreen() { const p = toilet.group.position; return this.project(p.x, 0.55, p.z + 0.08); },
      wallScreen(i) { const w = room.walls[i].position; return this.project(w.x, 1.75, i === 0 ? w.z : 1.5); },
    },
  };
}
