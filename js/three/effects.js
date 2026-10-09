// Effecten bij spoelen, verstoppen, ontstoppen en overlopen (punt 54).
// Intensiteit komt uit EFFECTS in data/config.js (minder bij kwaliteit "laag").
import * as THREE from 'three';
import { buildProp } from './props.js';

export function createEffects(ctx, { toilet, water, bucket, rig }) {
  const fx = ctx.fx;
  const scene = ctx.scene;
  const tmp = new THREE.Vector3();

  // ── Belletjes ──
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
  const bubbleGeo = new THREE.SphereGeometry(1, 8, 6);
  const bubbles = Array.from({ length: fx.bubbles }, () => {
    const m = new THREE.Mesh(bubbleGeo, bubbleMat);
    m.visible = false; m.renderOrder = 3;
    scene.add(m);
    return { m, life: 0, x: 0, z: 0, size: 0 };
  });

  // ── Spetters ──
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xbfe6f5, transparent: true, opacity: 0.85 });
  const dropGeo = new THREE.SphereGeometry(1, 6, 5);
  const drops = Array.from({ length: fx.splashes }, () => {
    const m = new THREE.Mesh(dropGeo, dropMat);
    m.visible = false;
    scene.add(m);
    return { m, life: 0, v: new THREE.Vector3() };
  });
  function splash(origin, count, power = 1) {
    let n = 0;
    for (const d of drops) {
      if (d.life > 0 || n >= count) continue;
      n++;
      const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.5;
      d.m.position.copy(origin);
      d.m.scale.setScalar(0.005 + Math.random() * 0.007);
      d.v.set(Math.cos(a) * r * power, (1.1 + Math.random() * 0.9) * power, Math.sin(a) * r * power);
      d.life = 1; d.m.visible = true;
    }
  }

  // ── Plas op de vloer bij overlopen ──
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 40),
    new THREE.MeshStandardMaterial({ color: 0x9a8a5a, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0, depthWrite: false }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(toilet.group.position.x, 0.004, toilet.group.position.z + 0.42);
  puddle.scale.set(0.01, 0.01, 1);
  puddle.visible = false;
  puddle.renderOrder = 1;
  scene.add(puddle);
  const puddleState = { grow: 0, fade: 0 };   // fade loopt van 1 → 0 in ±14 s

  // ── Voorwerp in de pot ──
  let prop = null;        // { obj, phase: 'drop'|'bob'|'fly', t, from, to }
  let clogged = false;
  let level = 0;
  let chaosShake = 0;
  let sloshTimer = 0;

  function removeProp() { if (prop) { scene.remove(prop.obj); prop = null; } }

  ctx.onFrame((dt, time) => {
    const surface = water.surface(tmp).clone();
    const radius = water.radius();

    // toilet trilt, harder naarmate het water stijgt
    const tremble = clogged ? (0.4 + level * 0.9) * fx.shake : 0;
    toilet.shaker.position.x = Math.sin(time * 47) * 0.0012 * tremble;
    toilet.shaker.rotation.z = Math.sin(time * 39) * 0.004 * tremble;

    // belletjes
    for (const b of bubbles) {
      if (b.life <= 0) {
        if (!clogged || Math.random() > dt * (3 + level * 10)) { b.m.visible = false; continue; }
        const a = Math.random() * Math.PI * 2, r = Math.random() * radius * 0.8;
        b.x = Math.cos(a) * r; b.z = Math.sin(a) * r; b.size = 0.004 + Math.random() * 0.008; b.life = 1;
        b.m.visible = true;
      }
      b.life -= dt * (1.1 + level);
      const grow = Math.sin(Math.min(1, (1 - b.life) * 1.2) * Math.PI * 0.5);
      b.m.position.set(surface.x + b.x, surface.y + 0.002 + grow * b.size * 0.4, surface.z + b.z);
      b.m.scale.setScalar(b.size * (0.3 + grow * 0.7));
      if (b.life <= 0) b.m.visible = false;
    }

    // klotsen: af en toe spetters over de rand
    if (clogged && level > 0.35) {
      sloshTimer -= dt;
      if (sloshTimer <= 0) { sloshTimer = 1.1 - level * 0.7; splash(surface, 2 + Math.round(level * 3), 0.55 + level * 0.5); }
    }

    // spetters
    for (const d of drops) {
      if (d.life <= 0) continue;
      d.v.y -= 6.5 * dt;
      d.m.position.addScaledVector(d.v, dt);
      d.life -= dt * 1.2;
      if (d.life <= 0 || d.m.position.y < 0.01) { d.life = 0; d.m.visible = false; }
    }

    // plas
    if (puddle.visible) {
      puddleState.grow = Math.min(1, puddleState.grow + dt / 1.4);
      if (puddleState.grow === 1) puddleState.fade = Math.max(0, puddleState.fade - dt / 14);
      const s = 0.2 + 0.8 * Math.sin(puddleState.grow * Math.PI / 2);
      puddle.scale.set(s, s * 0.8, 1);
      puddle.material.opacity = 0.7 * Math.min(1, puddleState.fade * 3);
      if (puddleState.fade === 0) puddle.visible = false;
    }

    // voorwerp
    if (!prop) return;
    prop.t += dt;
    const o = prop.obj;
    if (prop.phase === 'drop') {
      const k = Math.min(1, prop.t / 0.5);
      o.position.set(surface.x, surface.y + 0.02 + (1 - k * k) * 0.75, surface.z);
      o.rotation.set(k * 5, k * 3, 0);
      if (k === 1) { prop.phase = 'bob'; prop.t = 0; splash(surface, 10, 1); rig.shake(0.8); }
    } else if (prop.phase === 'bob') {
      chaosShake = Math.max(0, chaosShake - dt * 1.6);
      o.position.set(
        surface.x + Math.sin(time * 1.7) * radius * 0.2 + Math.sin(time * 60) * 0.012 * chaosShake,
        surface.y + 0.018 + Math.sin(time * 3.1) * 0.008,
        surface.z + Math.cos(time * 1.3) * radius * 0.15,
      );
      o.rotation.set(Math.sin(time * 1.9) * 0.35, time * 0.6, Math.cos(time * 2.3) * 0.35 + chaosShake * Math.sin(time * 50) * 0.5);
    } else if (prop.phase === 'fly') {
      const k = Math.min(1, prop.t / 0.7);
      o.position.lerpVectors(prop.from, prop.to, k);
      o.position.y += Math.sin(k * Math.PI) * 0.55;
      o.rotation.x += dt * 9; o.rotation.z += dt * 6;
      if (k === 1) land();
    }
  });

  // Einde van de vlucht: het voorwerp belandt in de emmer (of ernaast als hij vol is).
  function land() {
    scene.remove(prop.obj);
    if (prop.intoBucket) bucket.adopt(prop.obj);
    splash(prop.to, 6, 0.5);
    prop = null;
  }

  return {
    flush() {
      water.flush();
      toilet.pressHandle();
      splash(water.surface(tmp), 4, 0.5);
    },
    clog(propId) {
      if (prop?.phase === 'fly') land();      // vorige vangst is nog onderweg: meteen afronden
      removeProp();
      clogged = true;
      const obj = buildProp(propId, ctx);
      obj.scale.setScalar(Math.min(1, water.fit.restRx / 0.07));
      scene.add(obj);
      prop = { obj, phase: 'drop', t: 0 };
      rig.focusClog(true);
    },
    // intoBucket: past het voorwerp nog in de emmer? Anders stuitert het ernaast weg.
    unclog({ intoBucket = true } = {}) {
      clogged = false;
      water.flush();
      rig.shake(0.5);
      splash(water.surface(tmp), 14, 1.1);
      if (prop) {
        prop.phase = 'fly'; prop.t = 0; prop.intoBucket = intoBucket;
        prop.from = prop.obj.position.clone();
        prop.to = intoBucket ? bucket.mouth() : bucket.mouth().add(new THREE.Vector3(0.25, -bucket.height(), 0.2));
        prop.obj.scale.setScalar(1);
      }
      setTimeout(() => rig.focusClog(false), 650);
    },
    chaos() { chaosShake = 1; rig.shake(0.35); splash(water.surface(tmp), 5, 0.7); },
    overflow() {
      rig.shake(1.4);
      splash(water.surface(tmp), fx.splashes, 1.3);
      if (!fx.puddle) return;
      puddle.visible = true;
      puddleState.grow = Math.min(puddleState.grow, 0.3);
      puddleState.fade = 1;
    },
    setWater(pct, isClogged) { level = isClogged ? pct / 100 : 0; clogged = isClogged; if (!isClogged && prop?.phase === 'bob') removeProp(); },
    // voor tests
    propInBowl: () => !!prop && prop.phase !== 'fly',
    propId: () => prop?.obj.userData.propId ?? null,
    activeBubbles: () => bubbles.filter(b => b.m.visible).length,
    puddleVisible: () => puddle.visible && puddle.material.opacity > 0.05,
    busy: () => !!prop && prop.phase === 'fly',
  };
}
