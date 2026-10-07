// ============================================================
// THE FLUSH FACTOR — renderer3d.js
// Three.js 3D scène: toilet, water, badkamer, animaties.
// Luistert naar DOM-events van game.js; raakt spellogica niet aan.
// ============================================================

import * as THREE from 'three';
import { RGBELoader } from './vendor/RGBELoader.js';

// ──────── MODULE-STATE ────────
let renderer, scene, camera, clock;
let toiletGroup, waterMesh, propSprite, trashBinMesh;
let floorMesh, backWallMesh, leftWallMesh, rightWallMesh;
let qualityTier = 'medium';

// Uniform-objecten voor de water-shader
const waterU = {
  uTime:        { value: 0 },
  uClogged:     { value: 0 },    // 0 = helder, 1 = troebel
  uWaterLevel:  { value: 0.5 },  // 0-1
  uFlushSwirl:  { value: 0 },    // 0-1: draaikolk bij spoelen
  uFlushDrain:  { value: 0 },    // 0-1: waterpeil zakt weg
};

// Animatie-tijdlijnen
let flushAnim  = null;   // { start, dur }
let clogAnim   = null;   // { start, dur, to }
let unclogAnim = null;   // { start, dur }

// Toestand
let isActive = false;
let currentPropEmoji = null;
let porcelainMat, seatMat, waterMat;
let particles = [];      // actieve deeltjessystemen

// ──────── ENTRY POINT ────────
export function init3D() {
  qualityTier = _detectQuality();
  if (!qualityTier) return;   // geen WebGL → 2D-modus

  _buildRenderer();
  _buildScene();
  _buildLights();
  _buildRoom();
  _buildToilet();
  _buildWater();
  _buildTrashBin();
  _loadHDRI();
  _hide2D();
  _bindEvents();
  _setupResize();

  window.__3D_ACTIVE = true;
  isActive = true;

  clock = new THREE.Clock();
  _loop();
}

// ──────── KWALITEITSDETECTIE ────────
function _detectQuality() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return null;

    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuRenderer = dbg
      ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL).toLowerCase()
      : '';

    if (gpuRenderer.includes('apple') ||
        gpuRenderer.includes('adreno 6') ||
        gpuRenderer.includes('adreno 7')) return 'high';

    if (gpuRenderer.includes('powervr') ||
        (gpuRenderer.includes('mali') && !gpuRenderer.includes('mali-g7')))
      return 'low';

    return 'medium';
  } catch (_) {
    return null;
  }
}

// ──────── RENDERER ────────
function _buildRenderer() {
  const canvas = document.createElement('canvas');
  canvas.id = 'scene-canvas-3d';
  const scene3d = document.getElementById('bathroom-scene');
  if (!scene3d) return;
  scene3d.appendChild(canvas);
  scene3d.classList.add('has-3d');

  const dpr = qualityTier === 'low'    ? 1.0
            : qualityTier === 'high'   ? Math.min(window.devicePixelRatio, 2.5)
            : Math.min(window.devicePixelRatio, 1.5);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: qualityTier === 'high',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  if (qualityTier !== 'low') {
    renderer.shadowMap.enabled = qualityTier === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const w = scene3d.clientWidth  || 390;
  const h = scene3d.clientHeight || 560;
  renderer.setSize(w, h);

  camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 100);
  camera.position.set(0, 2.5, 5.2);
  camera.lookAt(0, 1.0, 0);
}

// ──────── SCÈNE ────────
function _buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4e8f2);
  scene.fog = new THREE.Fog(0xd4e8f2, 12, 22);
}

// ──────── VERLICHTING ────────
function _buildLights() {
  const ambient = new THREE.AmbientLight(0xffffff, qualityTier === 'low' ? 1.0 : 0.55);
  scene.add(ambient);

  // Hoofdlicht (plafondlamp, iets schuin)
  const key = new THREE.DirectionalLight(0xfdfcf5, 1.6);
  key.position.set(-1.5, 5, 3);
  if (qualityTier === 'high') {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far  = 15;
    key.shadow.camera.left   = -3;
    key.shadow.camera.right  =  3;
    key.shadow.camera.top    =  4;
    key.shadow.camera.bottom = -1;
    key.shadow.radius = 2;
  }
  scene.add(key);

  // Opvullicht rechts-warm
  const fill = new THREE.PointLight(0xfff0e0, qualityTier === 'low' ? 0 : 0.5, 10);
  fill.position.set(2.5, 2.5, 2);
  scene.add(fill);

  // Bovenlicht voor reflecties op porselein
  if (qualityTier !== 'low') {
    const top = new THREE.PointLight(0xe8f4ff, 0.4, 8);
    top.position.set(0, 4.5, 0);
    scene.add(top);
  }
}

// ──────── BADKAMER (wanden + vloer) ────────
function _buildRoom() {
  const loader = new THREE.TextureLoader();

  // ── Wandtegels ──
  const tileAlbedo  = loader.load('assets/textures/Tiles101_1K-JPG_Color.jpg',    t => { t.colorSpace = THREE.SRGBColorSpace; });
  const tileNormal  = loader.load('assets/textures/Tiles101_1K-JPG_NormalGL.jpg');
  const tileRoughness = loader.load('assets/textures/Tiles101_1K-JPG_Roughness.jpg');
  [tileAlbedo, tileNormal, tileRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 3);
  });

  const tileMat = new THREE.MeshStandardMaterial({
    map:         tileAlbedo,
    normalMap:   tileNormal,
    roughnessMap:tileRoughness,
    roughness:   0.6,
    metalness:   0.0,
  });

  // Achterwand
  backWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), tileMat);
  backWallMesh.position.set(0, 2.5, -1.8);
  scene.add(backWallMesh);

  // Linkerwand
  leftWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 6), tileMat.clone());
  leftWallMesh.rotation.y = Math.PI / 2;
  leftWallMesh.position.set(-3.5, 2.5, 1);
  scene.add(leftWallMesh);

  // Rechterwand
  rightWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 6), tileMat.clone());
  rightWallMesh.rotation.y = -Math.PI / 2;
  rightWallMesh.position.set(3.5, 2.5, 1);
  scene.add(rightWallMesh);

  // ── Vloer ──
  const floorAlbedo   = loader.load('assets/textures/WoodFloor041_1K-JPG_Color.jpg',   t => { t.colorSpace = THREE.SRGBColorSpace; });
  const floorNormal   = loader.load('assets/textures/WoodFloor041_1K-JPG_NormalGL.jpg');
  const floorRoughness= loader.load('assets/textures/WoodFloor041_1K-JPG_Roughness.jpg');
  [floorAlbedo, floorNormal, floorRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 4);
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map:         floorAlbedo,
    normalMap:   floorNormal,
    roughnessMap:floorRoughness,
    roughness:   0.5,
    metalness:   0.0,
  });

  floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, 1);
  floorMesh.receiveShadow = qualityTier === 'high';
  scene.add(floorMesh);

  // Plint
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0xfdfcf5, roughness: 0.3 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, 0.08), plinthMat);
  plinth.position.set(0, 0.06, -1.76);
  scene.add(plinth);

  // WC-rolhouder (rechts van toilet)
  _buildPaperHolder();
}

// ──────── WC-ROLHOUDER ────────
function _buildPaperHolder() {
  const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0xddddcc, metalness: 0.85, roughness: 0.15 });
  const paperMat  = new THREE.MeshStandardMaterial({ color: 0xfafaf5, roughness: 0.85 });

  // Houder arm
  const armGeo  = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12);
  const arm = new THREE.Mesh(armGeo, chromeMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(1.1, 0.95, 0.0);
  scene.add(arm);

  // WC-rol
  const rollGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.16, 24);
  const roll = new THREE.Mesh(rollGeo, paperMat);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(1.1, 0.95, 0.0);
  scene.add(roll);
}

// ──────── TOILET (procedureel) ────────
function _buildToilet() {
  toiletGroup = new THREE.Group();

  porcelainMat = new THREE.MeshPhysicalMaterial({
    color:      0xfdfcf5,
    roughness:  0.12,
    metalness:  0.0,
    clearcoat:  0.6,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.0,
  });

  seatMat = new THREE.MeshPhysicalMaterial({
    color:      0xeceadb,
    roughness:  0.25,
    metalness:  0.0,
    clearcoat:  0.2,
  });

  const seg = qualityTier === 'low' ? 16 : qualityTier === 'high' ? 48 : 32;

  // ── Kom buitenkant (lathe) ──
  const bowlPts = [
    new THREE.Vector2(0.02, 0.00),
    new THREE.Vector2(0.18, 0.02),
    new THREE.Vector2(0.38, 0.10),
    new THREE.Vector2(0.52, 0.28),
    new THREE.Vector2(0.58, 0.52),
    new THREE.Vector2(0.60, 0.82),
    new THREE.Vector2(0.62, 0.96),
    new THREE.Vector2(0.64, 1.00),
  ];
  const bowlOuter = new THREE.Mesh(
    new THREE.LatheGeometry(bowlPts, seg),
    porcelainMat
  );
  bowlOuter.castShadow  = qualityTier === 'high';
  bowlOuter.receiveShadow = qualityTier === 'high';
  toiletGroup.add(bowlOuter);

  // ── Kom binnenkant (donker, holte simuleren) ──
  const innerPts = [
    new THREE.Vector2(0.02, 0.10),
    new THREE.Vector2(0.12, 0.12),
    new THREE.Vector2(0.28, 0.28),
    new THREE.Vector2(0.40, 0.55),
    new THREE.Vector2(0.46, 0.82),
    new THREE.Vector2(0.50, 0.97),
  ];
  const bowlInner = new THREE.Mesh(
    new THREE.LatheGeometry(innerPts, seg),
    new THREE.MeshStandardMaterial({ color: 0x888878, roughness: 0.8, side: THREE.BackSide })
  );
  toiletGroup.add(bowlInner);

  // ── Zitring (torus-achtig, iets boven de rand) ──
  const seatCurve = [
    new THREE.Vector2(0.60, 1.00),
    new THREE.Vector2(0.68, 1.01),
    new THREE.Vector2(0.72, 1.04),
    new THREE.Vector2(0.73, 1.08),
    new THREE.Vector2(0.72, 1.12),
    new THREE.Vector2(0.68, 1.15),
    new THREE.Vector2(0.60, 1.16),
  ];
  const seat = new THREE.Mesh(
    new THREE.LatheGeometry(seatCurve, seg),
    seatMat
  );
  seat.castShadow = qualityTier === 'high';
  toiletGroup.add(seat);

  // ── Verbindingsstuk (nek) ──
  const neckGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.45, seg);
  const neck = new THREE.Mesh(neckGeo, porcelainMat);
  neck.position.y = 1.35;
  neck.castShadow = qualityTier === 'high';
  toiletGroup.add(neck);

  // ── Stortbak (tank) ──
  const tankW = 0.76, tankD = 0.28, tankH = 0.85;
  const tankGeo = new THREE.BoxGeometry(tankW, tankH, tankD);
  // Afgeronde hoeken simuleren met schaal
  const tank = new THREE.Mesh(tankGeo, porcelainMat);
  tank.position.set(0, 1.57 + tankH / 2, -0.30);
  tank.castShadow = qualityTier === 'high';
  toiletGroup.add(tank);

  // ── Tankdeksel ──
  const lidGeo = new THREE.BoxGeometry(tankW + 0.04, 0.055, tankD + 0.04);
  const lid    = new THREE.Mesh(lidGeo, seatMat);
  lid.position.set(0, 1.57 + tankH + 0.027, -0.30);
  toiletGroup.add(lid);

  // ── Spoelknop op tank ──
  const btnGeo = new THREE.BoxGeometry(0.20, 0.055, 0.07);
  const btnMat = new THREE.MeshPhysicalMaterial({ color: 0xc8c6b0, roughness: 0.4, metalness: 0.1 });
  const btn    = new THREE.Mesh(btnGeo, btnMat);
  btn.name = 'flushButton';
  btn.position.set(0.18, 1.57 + tankH + 0.055, -0.19);
  toiletGroup.add(btn);

  // ── Voetstuk ──
  const pedPts = [
    new THREE.Vector2(0.02, 0.00),
    new THREE.Vector2(0.30, 0.00),
    new THREE.Vector2(0.32, 0.04),
    new THREE.Vector2(0.26, 0.18),
    new THREE.Vector2(0.22, 0.28),
  ];
  const pedestal = new THREE.Mesh(
    new THREE.LatheGeometry(pedPts, seg),
    porcelainMat
  );
  toiletGroup.add(pedestal);

  // Schaduw onder toilet
  const shadowGeo = new THREE.CircleGeometry(0.65, 32);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  toiletGroup.add(shadow);

  toiletGroup.position.set(0, 0, 0.3);
  scene.add(toiletGroup);
}

// ──────── WATER ────────
function _buildWater() {
  const waterVert = `
    uniform float uTime;
    uniform float uFlushSwirl;
    uniform float uFlushDrain;
    varying vec2  vUv;
    varying float vWave;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Golfjes (stiller bij spoelen—drain vermindert ze)
      float t = uTime;
      float waveAmp = mix(0.018, 0.004, uFlushDrain);
      float wave = sin(pos.x * 5.0 + t * 2.8) * waveAmp
                 + cos(pos.z * 4.0 + t * 2.1) * waveAmp * 0.7;

      // Draaikolk bij spoelen: radiale deflectie
      float angle = atan(pos.z, pos.x) + uFlushSwirl * 6.28 * 2.0;
      float r     = length(vec2(pos.x, pos.z));
      float swirl = sin(angle * 3.0 - r * 8.0) * uFlushSwirl * 0.06 * (1.0 - r * 0.5);

      pos.y += wave + swirl;
      vWave  = wave + swirl;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const waterFrag = `
    uniform float uTime;
    uniform float uClogged;
    uniform float uWaterLevel;
    uniform float uFlushDrain;
    varying vec2  vUv;
    varying float vWave;

    void main() {
      // Kleurinterpolatie helder ↔ troebel
      vec3 clearColor = vec3(0.553, 0.890, 0.988);
      vec3 mudColor   = vec3(0.545, 0.416, 0.078);
      vec3 col = mix(clearColor, mudColor, uClogged);

      // Speculaire glans
      vec2 uvC = vUv - 0.5;
      float spec = pow(max(0.0, 0.8 - length(uvC * vec2(1.6, 1.2))), 4.0) * 0.5;
      col += vec3(spec);

      // Schuim op golfkammen
      float foam = step(0.012, vWave) * (1.0 - uClogged) * 0.3;
      col += vec3(foam);

      // Randverduistering (diepte)
      float rim = smoothstep(0.5, 0.3, length(uvC));
      col *= (0.75 + rim * 0.25);

      // Alpha: minder transparant bij verstopping, wegvloeiend bij spoelen
      float alpha = mix(0.82, 0.72, uClogged) * (1.0 - uFlushDrain * 0.9);

      gl_FragColor = vec4(col, alpha);
    }
  `;

  waterMat = new THREE.ShaderMaterial({
    vertexShader:   waterVert,
    fragmentShader: waterFrag,
    uniforms:       waterU,
    transparent:    true,
    depthWrite:     false,
    side:           THREE.FrontSide,
  });

  // Plat ellipsoid passend in de toiletkom
  const geo = new THREE.SphereGeometry(0.44, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  waterMesh = new THREE.Mesh(geo, waterMat);
  // Schaal het tot een ellips (breed en plat)
  waterMesh.scale.set(1.0, 0.22, 0.82);
  // Positie: bovenzijde van de kom, net boven het donkere interieur
  waterMesh.position.set(0, 1.02, 0.30);
  scene.add(waterMesh);
}

// ──────── PRULLENBAK (3D decoratief) ────────
function _buildTrashBin() {
  const binMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.1 });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.1 });

  // Baklichaam (cylinder)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.14, 0.42, 20),
    binMat
  );

  // Deksel
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.04, 20),
    lidMat
  );
  lid.position.y = 0.23;

  trashBinMesh = new THREE.Group();
  trashBinMesh.add(body, lid);
  trashBinMesh.position.set(1.4, 0.21, 0.95);
  scene.add(trashBinMesh);
}

// ──────── HDRI LADEN ────────
function _loadHDRI() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  new RGBELoader()
    .load('assets/hdri/bathroom.hdr', (hdr) => {
      const envMap = pmrem.fromEquirectangular(hdr).texture;
      scene.environment = envMap;
      hdr.dispose();
      pmrem.dispose();
      // Verhoog env map intensiteit op het porselein
      if (porcelainMat) porcelainMat.envMapIntensity = 1.2;
    },
    undefined,
    () => {
      // HDRI faalt → programmatische fallback (3-punt belichting al aanwezig)
      pmrem.dispose();
    });
}

// ──────── 2D ELEMENTEN VERBERGEN ────────
function _hide2D() {
  const wrapper = document.getElementById('toilet-wrapper');
  if (wrapper) wrapper.style.visibility = 'hidden';
  const prop = document.getElementById('clog-prop');
  if (prop) prop.style.display = 'none';
}

// ──────── RESIZE ────────
function _setupResize() {
  const scene3d = document.getElementById('bathroom-scene');
  if (!scene3d || !renderer) return;
  const obs = new ResizeObserver(() => {
    const w = scene3d.clientWidth;
    const h = scene3d.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  obs.observe(scene3d);
}

// ──────── GAME-EVENTS ────────
function _bindEvents() {
  document.addEventListener('game:flush',    _onFlush);
  document.addEventListener('game:clog',     _onClog);
  document.addEventListener('game:unclog',   _onUnclog);
  document.addEventListener('game:chaos',    _onChaos);
  document.addEventListener('cosmetic:changed', _onCosmetic);
  // Waterstand vanuit game loop update
  document.addEventListener('game:waterLevel', e => {
    waterU.uWaterLevel.value = (e.detail?.waterLevel ?? 0) / 100;
  });
}

function _onFlush() {
  flushAnim = { start: clock.getElapsedTime(), dur: 0.75 };
  // Spoelknop indrukken
  const btn = toiletGroup?.getObjectByName('flushButton');
  if (btn) {
    btn.position.y -= 0.03;
    setTimeout(() => { if (btn) btn.position.y += 0.03; }, 200);
  }
}

function _onClog(e) {
  currentPropEmoji = e.detail?.prop?.emoji ?? '🧻';
  _showProp(currentPropEmoji);
  clogAnim = { start: clock.getElapsedTime(), dur: 0.8, to: 1.0 };
}

function _onUnclog() {
  clogAnim = { start: clock.getElapsedTime(), dur: 0.6, to: 0.0 };
  unclogAnim = { start: clock.getElapsedTime(), dur: 0.55 };
  _spawnParticleBurst(trashBinMesh.position);
}

function _onChaos(e) {
  const effect = e.detail?.effect ?? 'ducks';
  _spawnChaosParticles(effect);
  // Prop blijft zitten (geen unclog)
  if (propSprite) {
    // Schudbeweging
    const orig = propSprite.position.clone();
    let t = 0;
    const shake = () => {
      t += 0.05;
      if (!propSprite || t > 0.5) { if (propSprite) propSprite.position.copy(orig); return; }
      propSprite.position.x = orig.x + Math.sin(t * 80) * 0.04;
      requestAnimationFrame(shake);
    };
    shake();
  }
}

function _onCosmetic(e) {
  const { category, id } = e.detail;
  switch (category) {
    case 'toilet': _applyToiletSkin(id); break;
    case 'tiles':  _applyTileCosmetic(id); break;
    case 'floor':  _applyFloorCosmetic(id); break;
  }
}

// ──────── TOILET COSMETICA ────────
function _applyToiletSkin(id) {
  if (!porcelainMat || !seatMat) return;
  const skins = {
    'toilet-standard': { color: 0xfdfcf5, metalness: 0.0, roughness: 0.12 },
    'toilet-golden':   { color: 0xFFD700, metalness: 0.8, roughness: 0.08 },
    'toilet-space':    { color: 0x2d3a4a, metalness: 0.3, roughness: 0.55 },
    'toilet-medieval': { color: 0x5c3d1e, metalness: 0.0, roughness: 0.7  },
  };
  const s = skins[id] || skins['toilet-standard'];
  porcelainMat.color.setHex(s.color);
  porcelainMat.metalness = s.metalness;
  porcelainMat.roughness = s.roughness;
  seatMat.color.setHex(s.color);
}

// ──────── TEGEL COSMETICA ────────
function _applyTileCosmetic(id) {
  const colors = {
    'tiles-default':      0xd9eaf7,
    'tiles-checkerboard': 0xc8d8e8,
    'tiles-stars':        0x1a1a3e,
    'tiles-zigzag':       0xf4a261,
  };
  const c = colors[id] || colors['tiles-default'];
  [backWallMesh, leftWallMesh, rightWallMesh].forEach(m => {
    if (m?.material) m.material.color.setHex(c);
  });
}

// ──────── VLOER COSMETICA ────────
function _applyFloorCosmetic(id) {
  const colors = {
    'floor-basic':   0xc4a882,
    'floor-marble':  0xe8e0d0,
    'floor-rainbow': 0xd0a0ff,
    'floor-lava':    0xff4500,
  };
  const c = colors[id] || colors['floor-basic'];
  if (floorMesh?.material) floorMesh.material.color.setHex(c);
}

// ──────── PROP (verstopping) ────────
function _makeEmojiSprite(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '88px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 72);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.55, 0.55, 1);
  return sprite;
}

function _showProp(emoji) {
  if (propSprite) { scene.remove(propSprite); propSprite = null; }
  propSprite = _makeEmojiSprite(emoji);
  propSprite.position.set(0, 1.18, 0.30);
  scene.add(propSprite);
}

// ──────── CHAOS DEELTJES ────────
function _spawnChaosParticles(effect) {
  const emojiMap = {
    ducks:     '🦆',
    confetti:  '🎉',
    flamingo:  '🦩',
    disco:     '✨',
    magic:     '⭐',
    elephant:  '🐘',
    megaphone: '📢',
  };
  const emoji = emojiMap[effect] || '✨';
  const count = effect === 'elephant' ? 1 : 6;

  for (let i = 0; i < count; i++) {
    const sprite = _makeEmojiSprite(emoji);
    sprite.position.set(
      (Math.random() - 0.5) * 2.5,
      0.8 + Math.random() * 2.0,
      (Math.random() - 0.5) * 1.5 + 0.3
    );
    const scale = effect === 'elephant' ? 1.8 : (0.4 + Math.random() * 0.5);
    sprite.scale.setScalar(scale);
    scene.add(sprite);

    const dur  = 2.0 + Math.random() * 1.0;
    const velY = 0.3 + Math.random() * 0.5;
    const velX = (Math.random() - 0.5) * 0.6;
    const startT = clock.getElapsedTime();

    particles.push({
      mesh: sprite,
      done: false,
      update(ts) {
        const elapsed = ts * 0.001 - startT;
        if (elapsed > dur) { this.done = true; return; }
        const p = elapsed / dur;
        this.mesh.position.y += velY * 0.016;
        this.mesh.position.x += velX * 0.016;
        this.mesh.material.opacity = 1 - p;
      },
    });
  }
}

// ──────── DEELTJESBURST (bij ontstopping) ────────
function _spawnParticleBurst(pos) {
  const BURST = 10;
  for (let i = 0; i < BURST; i++) {
    const geo = new THREE.SphereGeometry(0.04, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.65),
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 2.5,
      Math.random() * 3.0 + 0.5,
      (Math.random() - 0.5) * 2.5
    );
    const dur    = 0.8 + Math.random() * 0.4;
    const startT = clock.getElapsedTime();

    particles.push({
      mesh,
      done: false,
      update(ts) {
        const elapsed = ts * 0.001 - startT;
        if (elapsed > dur) { this.done = true; return; }
        const dt = 0.016;
        vel.y -= 4.0 * dt;
        this.mesh.position.addScaledVector(vel, dt);
        this.mesh.material.opacity = 1 - elapsed / dur;
      },
    });
  }
}

// ──────── ANIMATIE-UPDATES ────────
function _advanceFlush(now) {
  if (!flushAnim) return;
  const p = Math.min((now - flushAnim.start) / flushAnim.dur, 1);

  // Watervlak draait en zakt weg
  waterU.uFlushSwirl.value = p < 0.82
    ? p / 0.82
    : 1.0 - (p - 0.82) / 0.18;

  // Peilzakking: zakt diep weg en vult daarna
  const drainCurve = p < 0.80
    ? _easeInOut(p / 0.80)
    : 1.0 - _easeInOut((p - 0.80) / 0.20);
  waterU.uFlushDrain.value = drainCurve;

  if (p >= 1) flushAnim = null;
}

function _advanceClog(now) {
  if (!clogAnim) return;
  const p = Math.min((now - clogAnim.start) / clogAnim.dur, 1);
  waterU.uClogged.value = waterU.uClogged.value + (clogAnim.to - waterU.uClogged.value) * p;
  if (p >= 1) { waterU.uClogged.value = clogAnim.to; clogAnim = null; }
}

function _advanceUnclog(now) {
  if (!unclogAnim || !propSprite) return;
  const p = Math.min((now - unclogAnim.start) / unclogAnim.dur, 1);

  // Prop vliegt in boog richting prullenbak
  const sx = 0, sy = 1.18, sz = 0.30;
  const ex = trashBinMesh.position.x;
  const ey = trashBinMesh.position.y + 0.5;
  const ez = trashBinMesh.position.z;

  propSprite.position.set(
    sx + (ex - sx) * p,
    sy + (ey - sy) * p + Math.sin(p * Math.PI) * 0.6,
    sz + (ez - sz) * p
  );
  propSprite.material.opacity = 1 - p;

  if (p >= 1) {
    scene.remove(propSprite);
    propSprite = null;
    unclogAnim = null;
  }
}

function _easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ──────── RENDER LOOP ────────
function _loop() {
  if (!isActive) return;
  requestAnimationFrame(_loop);

  const now = clock.getElapsedTime();
  waterU.uTime.value = now;

  // Subtiele zweefbeweging camera
  camera.position.x = Math.sin(now * 0.06) * 0.04;
  camera.lookAt(Math.sin(now * 0.06) * 0.02, 1.0, 0);

  // Prop dobbert wanneer aanwezig en niet aan het vliegen
  if (propSprite && !unclogAnim) {
    propSprite.position.y = 1.18 + Math.sin(now * 5.8) * 0.025;
  }

  // Prullenbak subtiel schommelt wanneer vol
  if (trashBinMesh) {
    trashBinMesh.rotation.z = Math.sin(now * 3.0) * 0.012;
  }

  _advanceFlush(now);
  _advanceClog(now);
  _advanceUnclog(now);

  // Deeltjes updaten
  const ts = now * 1000;
  particles = particles.filter(p => {
    p.update(ts);
    if (p.done) {
      scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
      return false;
    }
    return true;
  });

  renderer.render(scene, camera);
}
