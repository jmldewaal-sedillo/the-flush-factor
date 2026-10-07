// ============================================================
// THE FLUSH FACTOR — renderer3d.js
// Three.js 3D scène: toilet, water, badkamer, animaties.
// Luistert naar DOM-events van game.js; raakt spellogica niet aan.
// ============================================================

import * as THREE from 'three';
import { RGBELoader }    from './vendor/RGBELoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader }    from './vendor/GLTFLoader.js';
import { DRACOLoader }   from './vendor/DRACOLoader.js';

// ──────── KAMER-AFMETINGEN (WC-hokje) ────────
const ROOM_W   = 1.2;    // halve breedte = 0.6m aan iedere kant
const ROOM_H   = 2.4;    // hoogte
const ROOM_BACK_Z = -0.65; // achterwand Z
const ROOM_FRONT_Z = 1.15; // voorkant / "deuropening"

// ──────── MODULE-STATE ────────
let renderer, scene, camera, clock, controls;
let toiletGroup, toiletGLB, waterMesh, propSprite, basketGroup;
let floorMesh, backWallMesh, leftWallMesh, rightWallMesh;
let qualityTier = 'medium';
let basketItems3D = [];   // actieve items boven mand
let basketZoomed  = false; // is camera ingezoomd op mand?

// GLB node references (zijn null als model geen aparte nodes heeft)
let toiletLidNode = null;

// Uniform-objecten voor de water-shader
const waterU = {
  uTime:        { value: 0 },
  uClogged:     { value: 0 },    // 0 = helder, 1 = troebel
  uWaterLevel:  { value: 0.5 },  // 0-1
  uFlushSwirl:  { value: 0 },    // 0-1: draaikolk bij spoelen
  uFlushDrain:  { value: 0 },    // 0-1: waterpeil zakt weg
};

// Animatie-tijdlijnen
let flushAnim   = null;   // { start, dur }
let clogAnim    = null;   // { start, dur, to }
let unclogAnim  = null;   // { start, dur }
let cameraAnim  = null;   // { start, dur, fromPos, toPos, fromTarget, toTarget }

// ── Cameraposities (aangepast aan WC-hokje) ──
const CAM_DEFAULT        = new THREE.Vector3(0, 1.4, 3.5);
const CAM_TARGET_DEFAULT = new THREE.Vector3(0, 0.85, 0);
const CAM_CLOG           = new THREE.Vector3(0, 0.95, 1.9);
const CAM_TARGET_CLOG    = new THREE.Vector3(0, 0.55, 0.3);
// Mandzoom: vogelperspectief op mand (positie wordt berekend na laden mand)
let CAM_BASKET        = new THREE.Vector3(0.45, 1.3, 1.3);
let CAM_BASKET_TARGET = new THREE.Vector3(0.45, 0.25, 0.85);

// Toestand
let isActive = false;
let currentPropEmoji = null;
let porcelainMat, seatMat, waterMat;
let glbToiletMat = null;  // materiaal van het GLB-model (voor cosmetica)
let particles = [];       // actieve deeltjessystemen

// ──────── ENTRY POINT ────────
export function init3D() {
  qualityTier = _detectQuality();
  if (!qualityTier) {
    // WebGL echt niet beschikbaar
    console.warn('[3D] WebGL niet beschikbaar — 2D-modus actief.');
    return;
  }

  try {
    _buildRenderer();
    _buildScene();
    _buildLights();
    _buildRoom();
    _buildToilet();         // procedureel (fallback)
    _buildWater();
    _buildBasket();
    _buildDecoration();
    _loadHDRI();
    _buildControls();
    _hide2D();
    _bindEvents();
    _setupResize();

    // Probeer GLB te laden (verbergt procedureel toilet bij succes)
    _loadToiletModel();

    window.__3D_ACTIVE = true;
    isActive = true;

    clock = new THREE.Clock();
    _loop();
  } catch (err) {
    console.error('[3D] Initialisatie mislukt:', err);
    _showInitError(err);
  }
}

function _showInitError(err) {
  const scene3d = document.getElementById('bathroom-scene');
  if (!scene3d) return;
  const banner = document.createElement('div');
  banner.style.cssText = [
    'position:absolute', 'inset:0', 'z-index:99',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center',
    'background:rgba(20,0,0,0.82)',
    'color:#ff8080', 'font-size:0.85rem',
    'font-family:monospace', 'padding:20px',
    'text-align:center', 'pointer-events:none',
  ].join(';');
  banner.innerHTML = `<strong>⚠️ 3D kon niet starten</strong><br><br><code style="font-size:0.7rem;opacity:0.8">${err?.message ?? err}</code><br><br><span style="opacity:0.6;font-size:0.75rem">Open DevTools (F12) voor meer details.</span>`;
  scene3d.appendChild(banner);
}

// ──────── PUBLIEKE API ────────
export function resetCamera() {
  if (!camera) return;
  basketZoomed = false;
  _setBasketBackVisible(false);
  _flyCamera(CAM_DEFAULT, CAM_TARGET_DEFAULT);
}

export function zoomToBasket() {
  if (!camera) return;
  basketZoomed = true;
  _setBasketBackVisible(true);
  _flyCamera(CAM_BASKET, CAM_BASKET_TARGET);
}

export function basketBack() {
  if (!camera) return;
  basketZoomed = false;
  _setBasketBackVisible(false);
  _flyCamera(CAM_DEFAULT, CAM_TARGET_DEFAULT);
}

function _setBasketBackVisible(visible) {
  const btn = document.getElementById('btn-basket-back');
  if (btn) btn.hidden = !visible;
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

  camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 30);
  camera.position.copy(CAM_DEFAULT);
  camera.lookAt(CAM_TARGET_DEFAULT);
}

// ──────── ORBIT CONTROLS ────────
function _buildControls() {
  if (!camera || !renderer) return;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  // Aangepast aan WC-hokje: beperkt roteren zodat je niet door de muren kijkt
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minAzimuthAngle = -Math.PI / 2.4;
  controls.maxAzimuthAngle =  Math.PI / 2.4;
  controls.minDistance = 1.2;
  controls.maxDistance = 4.5;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.copy(CAM_TARGET_DEFAULT);
  controls.update();

  // Esc = terugvliegen vanuit mandzoom
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && basketZoomed) basketBack();
  });
}

// ──────── SCÈNE ────────
function _buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4e8f2);
  scene.fog = new THREE.Fog(0xd4e8f2, 5, 12);
}

// ──────── VERLICHTING ────────
function _buildLights() {
  const ambient = new THREE.AmbientLight(0xffffff, qualityTier === 'low' ? 1.0 : 0.55);
  scene.add(ambient);

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

  const fill = new THREE.PointLight(0xfff0e0, qualityTier === 'low' ? 0 : 0.5, 10);
  fill.position.set(2.5, 2.5, 2);
  scene.add(fill);

  if (qualityTier !== 'low') {
    const top = new THREE.PointLight(0xe8f4ff, 0.4, 8);
    top.position.set(0, 4.5, 0);
    scene.add(top);
  }
}

// ──────── BADKAMER (WC-hokje: smal + diep) ────────
function _buildRoom() {
  const loader = new THREE.TextureLoader();
  const roomDepth = ROOM_FRONT_Z - ROOM_BACK_Z; // 1.8m

  const tileAlbedo    = loader.load('assets/textures/Tiles101_1K-JPG_Color.jpg',    t => { t.colorSpace = THREE.SRGBColorSpace; });
  const tileNormal    = loader.load('assets/textures/Tiles101_1K-JPG_NormalGL.jpg');
  const tileRoughness = loader.load('assets/textures/Tiles101_1K-JPG_Roughness.jpg');
  [tileAlbedo, tileNormal, tileRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 3);
  });

  const tileMat = new THREE.MeshStandardMaterial({
    map:          tileAlbedo,
    normalMap:    tileNormal,
    roughnessMap: tileRoughness,
    roughness:    0.55,
    metalness:    0.0,
  });

  const midZ = (ROOM_BACK_Z + ROOM_FRONT_Z) / 2;
  const midY = ROOM_H / 2;

  // Achterwand
  backWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, ROOM_H), tileMat);
  backWallMesh.position.set(0, midY, ROOM_BACK_Z);
  scene.add(backWallMesh);

  // Linkerwand
  leftWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, ROOM_H), tileMat.clone());
  leftWallMesh.rotation.y = Math.PI / 2;
  leftWallMesh.position.set(-ROOM_W, midY, midZ);
  scene.add(leftWallMesh);

  // Rechterwand
  rightWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, ROOM_H), tileMat.clone());
  rightWallMesh.rotation.y = -Math.PI / 2;
  rightWallMesh.position.set(ROOM_W, midY, midZ);
  scene.add(rightWallMesh);

  // Plafond
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xfafaf5, roughness: 0.85 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, roomDepth), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, ROOM_H, midZ);
  scene.add(ceil);

  // Vloer
  const floorAlbedo    = loader.load('assets/textures/WoodFloor041_1K-JPG_Color.jpg',    t => { t.colorSpace = THREE.SRGBColorSpace; });
  const floorNormal    = loader.load('assets/textures/WoodFloor041_1K-JPG_NormalGL.jpg');
  const floorRoughness = loader.load('assets/textures/WoodFloor041_1K-JPG_Roughness.jpg');
  [floorAlbedo, floorNormal, floorRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 3);
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map:          floorAlbedo,
    normalMap:    floorNormal,
    roughnessMap: floorRoughness,
    roughness:    0.5,
    metalness:    0.0,
  });

  floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, roomDepth), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, midZ);
  floorMesh.receiveShadow = qualityTier === 'high';
  scene.add(floorMesh);

  // Plinten langs achterwand
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0xfdfcf5, roughness: 0.3 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W * 2, 0.1, 0.06), plinthMat);
  plinth.position.set(0, 0.05, ROOM_BACK_Z + 0.03);
  scene.add(plinth);

  _buildPaperHolder();
}

// ──────── WC-ROLHOUDER ────────
function _buildPaperHolder() {
  const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0xddddcc, metalness: 0.85, roughness: 0.15 });
  const paperMat  = new THREE.MeshStandardMaterial({ color: 0xfafaf5, roughness: 0.85 });

  // Aan de rechterwand, naast het toilet
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12), chromeMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(ROOM_W - 0.08, 0.88, 0.15);
  scene.add(arm);

  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 24), paperMat);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(ROOM_W - 0.08, 0.88, 0.15);
  scene.add(roll);
}

// ──────── DECORATIE ANKER ────────
function _buildDecoration() {
  const anchor = new THREE.Group();
  anchor.name = 'decorationAnchor';
  anchor.position.set(0, 3.2, -0.5);
  scene.add(anchor);
}

// ──────── TOILET PROCEDUREEL (fallback) ────────
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
  const bowlOuter = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, seg), porcelainMat);
  bowlOuter.castShadow = qualityTier === 'high';
  toiletGroup.add(bowlOuter);

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

  const seatCurve = [
    new THREE.Vector2(0.60, 1.00),
    new THREE.Vector2(0.68, 1.01),
    new THREE.Vector2(0.72, 1.04),
    new THREE.Vector2(0.73, 1.08),
    new THREE.Vector2(0.72, 1.12),
    new THREE.Vector2(0.68, 1.15),
    new THREE.Vector2(0.60, 1.16),
  ];
  const seat = new THREE.Mesh(new THREE.LatheGeometry(seatCurve, seg), seatMat);
  toiletGroup.add(seat);

  const neckGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.45, seg);
  const neck = new THREE.Mesh(neckGeo, porcelainMat);
  neck.position.y = 1.35;
  toiletGroup.add(neck);

  const tankW = 0.76, tankD = 0.28, tankH = 0.85;
  const tank = new THREE.Mesh(new THREE.BoxGeometry(tankW, tankH, tankD), porcelainMat);
  tank.position.set(0, 1.57 + tankH / 2, -0.30);
  toiletGroup.add(tank);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(tankW + 0.04, 0.055, tankD + 0.04), seatMat);
  lid.position.set(0, 1.57 + tankH + 0.027, -0.30);
  toiletGroup.add(lid);

  const btnMat = new THREE.MeshPhysicalMaterial({ color: 0xc8c6b0, roughness: 0.4, metalness: 0.1 });
  const btn = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.055, 0.07), btnMat);
  btn.name = 'flushButton';
  btn.position.set(0.18, 1.57 + tankH + 0.055, -0.19);
  toiletGroup.add(btn);

  const pedPts = [
    new THREE.Vector2(0.02, 0.00),
    new THREE.Vector2(0.30, 0.00),
    new THREE.Vector2(0.32, 0.04),
    new THREE.Vector2(0.26, 0.18),
    new THREE.Vector2(0.22, 0.28),
  ];
  const pedestal = new THREE.Mesh(new THREE.LatheGeometry(pedPts, seg), porcelainMat);
  toiletGroup.add(pedestal);

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.65, 32), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  toiletGroup.add(shadow);

  toiletGroup.position.set(0, 0, 0.3);
  scene.add(toiletGroup);
}

// ──────── GLB MODEL LADEN ────────
function _loadToiletModel() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load(
    'assets/models/toilet.glb',
    (gltf) => {
      // Het GLB bevat meerdere modellen — gebruik alleen Toilet_Round_A
      const toiletNode = gltf.scene.getObjectByName('Toilet_Round_A');
      if (!toiletNode) {
        // Naam niet gevonden → gebruik gehele scene als fallback
        toiletGLB = gltf.scene;
      } else {
        toiletGLB = new THREE.Group();
        toiletGLB.add(toiletNode);
        // Reset positie (elk node heeft eigen world-space positie in de atlas-scene)
        toiletNode.position.set(0, 0, 0);
      }

      // PBR-materialen aanmaken
      glbToiletMat = new THREE.MeshPhysicalMaterial({
        color:              0xfdfcf5,
        roughness:          0.12,
        metalness:          0.0,
        clearcoat:          0.65,
        clearcoatRoughness: 0.08,
        envMapIntensity:    1.0,
      });
      const seatGlbMat = new THREE.MeshPhysicalMaterial({
        color:     0xf5f3ee,
        roughness: 0.25,
        metalness: 0.0,
      });
      const flusherMat = new THREE.MeshStandardMaterial({
        color:    0xcccccc,
        roughness: 0.3,
        metalness: 0.7,
      });

      // Traverseer en ken materialen toe, zoek animeerbare nodes
      toiletGLB.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow    = qualityTier === 'high';
        child.receiveShadow = qualityTier === 'high';

        const nm = child.name.toLowerCase();
        if (nm.includes('flusher')) {
          child.material = flusherMat;
        } else if (nm.includes('seat_cover') || nm.includes('seat')) {
          child.material = seatGlbMat;
          if (nm.includes('seat_cover')) toiletLidNode = child;
        } else {
          child.material = glbToiletMat;
        }
      });

      // Schaal naar ~1.8m hoogte
      const box = new THREE.Box3().setFromObject(toiletGLB);
      const size = box.getSize(new THREE.Vector3());
      const scale = 1.8 / Math.max(size.x, size.y, size.z);
      toiletGLB.scale.setScalar(scale);

      // Baseer op Y=0
      const box2 = new THREE.Box3().setFromObject(toiletGLB);
      toiletGLB.position.set(0, -box2.min.y, 0.3);

      // Verberg procedureel model
      toiletGroup.visible = false;

      scene.add(toiletGLB);

      // Water NADAT model in scene staat: pas positie aan op echte kom-geometrie
      _positionWaterInBowl();

      dracoLoader.dispose();
    },
    undefined,
    () => {
      // Laden mislukt → procedureel toilet blijft zichtbaar
      dracoLoader.dispose();
    }
  );
}

// ──────── WATER POSITIONEREN IN KOM ────────
function _positionWaterInBowl() {
  if (!waterMesh || !toiletGLB) return;

  // Gebruik de bril-node om de opening van de kom te vinden
  let seatNode = null;
  toiletGLB.traverse(child => {
    if (child.name === 'Toilet_Round_A_Seat') seatNode = child;
  });

  if (seatNode) {
    // Update world matrices zodat Box3 correcte wereldcoördinaten geeft
    toiletGLB.updateWorldMatrix(true, true);
    const seatBox = new THREE.Box3().setFromObject(seatNode);

    // Water zit net onder de onderkant van de bril
    const waterY = seatBox.min.y - 0.03;

    // Binnenradius = ca. 40% van de bril-breedte (seat is de buitenring)
    const halfW = (seatBox.max.x - seatBox.min.x) * 0.40;
    const halfD = (seatBox.max.z - seatBox.min.z) * 0.40;
    const cx    = (seatBox.min.x + seatBox.max.x) / 2;
    const cz    = (seatBox.min.z + seatBox.max.z) / 2;

    waterMesh.position.set(cx, waterY, cz);
    // waterMesh gebruikt SphereGeometry(0.44) → schaal naar gewenste grootte
    waterMesh.scale.set(halfW / 0.44, 0.20, halfD / 0.44);
  } else {
    // Fallback: schat op basis van GLB bounding box
    const box = new THREE.Box3().setFromObject(toiletGLB);
    const cx  = (box.min.x + box.max.x) / 2;
    const cz  = (box.min.z + box.max.z) / 2;
    waterMesh.position.set(cx, box.max.y * 0.32, cz);
  }
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

      float t = uTime;
      float waveAmp = mix(0.018, 0.004, uFlushDrain);
      float wave = sin(pos.x * 5.0 + t * 2.8) * waveAmp
                 + cos(pos.z * 4.0 + t * 2.1) * waveAmp * 0.7;

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
      vec3 clearColor = vec3(0.553, 0.890, 0.988);
      vec3 mudColor   = vec3(0.545, 0.416, 0.078);
      vec3 col = mix(clearColor, mudColor, uClogged);

      vec2 uvC = vUv - 0.5;
      float spec = pow(max(0.0, 0.8 - length(uvC * vec2(1.6, 1.2))), 4.0) * 0.5;
      col += vec3(spec);

      float foam = step(0.012, vWave) * (1.0 - uClogged) * 0.3;
      col += vec3(foam);

      float rim = smoothstep(0.5, 0.3, length(uvC));
      col *= (0.75 + rim * 0.25);

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

  const geo = new THREE.SphereGeometry(0.44, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  waterMesh = new THREE.Mesh(geo, waterMat);
  waterMesh.scale.set(1.0, 0.22, 0.82);
  waterMesh.position.set(0, 1.02, 0.30);
  scene.add(waterMesh);
}

// ──────── MAND (3D decoratief, binnen het WC-hokje) ────────
function _buildBasket() {
  const wickerMat = new THREE.MeshStandardMaterial({ color: 0xC8892A, roughness: 0.85, metalness: 0.0 });
  const rimMat    = new THREE.MeshStandardMaterial({ color: 0xA06820, roughness: 0.7,  metalness: 0.0 });

  // Bodem
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 20),
    wickerMat
  );
  bottom.position.y = 0.02;

  // Wand (open cylinder)
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.38, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xC8892A, roughness: 0.85, side: THREE.DoubleSide })
  );
  wall.position.y = 0.23;

  // Rand bovenin
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.022, 8, 20),
    rimMat
  );
  rim.position.y = 0.42;

  basketGroup = new THREE.Group();
  basketGroup.add(bottom, wall, rim);
  // Naast toilet rechts, binnen het hokje
  basketGroup.position.set(0.45, 0, 0.85);
  scene.add(basketGroup);

  // Sla cameraposities op voor mandzoom
  CAM_BASKET        = new THREE.Vector3(basketGroup.position.x, 1.35, basketGroup.position.z + 0.45);
  CAM_BASKET_TARGET = new THREE.Vector3(basketGroup.position.x, 0.22, basketGroup.position.z);

  // Raycaster: klik op mand → inzoomen
  _buildBasketRaycaster();
}

// ──────── RAYCASTER: KLIK OP MAND ────────
function _buildBasketRaycaster() {
  if (!renderer || !basketGroup) return;
  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();
  let   pointerDown = null; // { x, y } bij mousedown/touchstart

  const canvas = renderer.domElement;

  const onDown = e => {
    const rect  = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pointerDown = { x: clientX, y: clientY };
  };

  const onUp = e => {
    if (!pointerDown) return;
    const rect  = canvas.getBoundingClientRect();
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // Alleen als tap, geen drag (< 8px beweging)
    const dx = Math.abs(clientX - pointerDown.x);
    const dy = Math.abs(clientY - pointerDown.y);
    pointerDown = null;
    if (dx > 8 || dy > 8) return;

    pointer.x = ((clientX - rect.left) / rect.width)  * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObject(basketGroup, true);
    if (hits.length > 0) {
      if (basketZoomed) basketBack(); else zoomToBasket();
    }
  };

  canvas.addEventListener('mousedown',  onDown);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('mouseup',    onUp);
  canvas.addEventListener('touchend',   onUp,   { passive: true });
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
      if (porcelainMat) porcelainMat.envMapIntensity = 1.2;
      if (glbToiletMat) glbToiletMat.envMapIntensity = 1.2;
    },
    undefined,
    () => { pmrem.dispose(); });
}

// ──────── 2D ELEMENTEN VERBERGEN ────────
function _hide2D() {
  const wrapper = document.getElementById('toilet-wrapper');
  if (wrapper) wrapper.style.visibility = 'hidden';
  const prop = document.getElementById('clog-prop');
  if (prop) prop.style.display = 'none';
}

// ──────── RESIZE ────────
export function onResize() {
  if (!renderer || !camera) return;
  const scene3d = document.getElementById('bathroom-scene');
  const w = scene3d ? scene3d.clientWidth  : window.innerWidth;
  const h = scene3d ? scene3d.clientHeight : window.innerHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); // false = do not set CSS size (CSS handles it)
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (controls) controls.update();
}

function _setupResize() {
  const scene3d = document.getElementById('bathroom-scene');

  // ResizeObserver op de scene-container (meest betrouwbaar)
  if (scene3d) {
    const obs = new ResizeObserver(() => onResize());
    obs.observe(scene3d);
  }

  // Aanvullende events voor DevTools / fullscreen / oriëntatieverandering
  let rafId = 0;
  const scheduleResize = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(onResize);
  };
  window.addEventListener('resize',            scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  document.addEventListener('fullscreenchange', scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleResize);
  }
}

// ──────── GAME-EVENTS ────────
function _bindEvents() {
  document.addEventListener('game:flush',         _onFlush);
  document.addEventListener('game:clog',          _onClog);
  document.addEventListener('game:unclog',        _onUnclog);
  document.addEventListener('game:chaos',         _onChaos);
  document.addEventListener('cosmetic:changed',   _onCosmetic);
  document.addEventListener('basket:add',         _onBasketAdd);
  document.addEventListener('camera:reset',       () => resetCamera());
  document.addEventListener('camera:basket-zoom', () => zoomToBasket());
  document.addEventListener('camera:basket-back', () => basketBack());
  document.addEventListener('game:waterLevel', e => {
    waterU.uWaterLevel.value = (e.detail?.waterLevel ?? 0) / 100;
  });
}

function _onFlush() {
  flushAnim = { start: clock.getElapsedTime(), dur: 0.75 };
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
  // Camera inzoomen op kom
  _flyCamera(CAM_CLOG, CAM_TARGET_CLOG);
}

function _onUnclog(e) {
  clogAnim = { start: clock.getElapsedTime(), dur: 0.6, to: 0.0 };
  unclogAnim = { start: clock.getElapsedTime(), dur: 0.55 };
  _spawnParticleBurst(basketGroup ? basketGroup.position : new THREE.Vector3(0.45, 0.4, 0.85));
  // Terugvliegen naar standaard
  setTimeout(() => _flyCamera(CAM_DEFAULT, CAM_TARGET_DEFAULT), 700);
}

function _onChaos(e) {
  const effect = e.detail?.effect ?? 'ducks';
  _spawnChaosParticles(effect);
  if (propSprite) {
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

function _onBasketAdd(e) {
  const emoji = e.detail?.emoji;
  if (emoji) _stackItemInBasket(emoji);
}

// ──────── CAMERA VLIEGEN ────────
function _flyCamera(toPos, toTarget) {
  if (!camera || !controls) return;
  const fromPos    = camera.position.clone();
  const fromTarget = controls.target.clone();
  const dur = 0.9;
  cameraAnim = {
    start: clock.getElapsedTime(), dur,
    fromPos, toPos: toPos.clone(),
    fromTarget, toTarget: toTarget.clone(),
  };
}

function _advanceCamera(now) {
  if (!cameraAnim || !controls) return;
  const p = Math.min((now - cameraAnim.start) / cameraAnim.dur, 1);
  const t = _easeInOut(p);

  camera.position.lerpVectors(cameraAnim.fromPos, cameraAnim.toPos, t);
  controls.target.lerpVectors(cameraAnim.fromTarget, cameraAnim.toTarget, t);
  controls.update();

  if (p >= 1) cameraAnim = null;
}

// ──────── TOILET COSMETICA ────────
function _applyToiletSkin(id) {
  const skins = {
    'toilet-standard': { color: 0xfdfcf5, metalness: 0.0, roughness: 0.12 },
    'toilet-golden':   { color: 0xFFD700, metalness: 0.8, roughness: 0.08 },
    'toilet-space':    { color: 0x2d3a4a, metalness: 0.3, roughness: 0.55 },
    'toilet-medieval': { color: 0x5c3d1e, metalness: 0.0, roughness: 0.7  },
  };
  const s = skins[id] || skins['toilet-standard'];

  // Procedureel toilet
  if (porcelainMat) {
    porcelainMat.color.setHex(s.color);
    porcelainMat.metalness = s.metalness;
    porcelainMat.roughness = s.roughness;
  }
  if (seatMat) seatMat.color.setHex(s.color);

  // GLB toilet
  if (glbToiletMat) {
    glbToiletMat.color.setHex(s.color);
    glbToiletMat.metalness = s.metalness;
    glbToiletMat.roughness = s.roughness;
  }
}

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

// ──────── ITEM IN MAND ────────
function _stackItemInBasket(emoji) {
  if (!basketGroup) return;
  const sprite = _makeEmojiSprite(emoji);
  sprite.scale.setScalar(0.35);

  // Startpositie: boven de mand
  const bx = basketGroup.position.x + (Math.random() - 0.5) * 0.15;
  const bz = basketGroup.position.z + (Math.random() - 0.5) * 0.15;
  sprite.position.set(bx, basketGroup.position.y + 1.2, bz);
  scene.add(sprite);

  // Einddoel in de mand (gestapeld)
  const count = basketItems3D.length;
  const targetY = basketGroup.position.y + 0.38 + count * 0.08;
  const targetX = bx + (Math.random() - 0.5) * 0.08;
  const targetZ = bz + (Math.random() - 0.5) * 0.08;

  const startT = clock.getElapsedTime();
  const dur = 0.5;
  const startY = sprite.position.y;

  basketItems3D.push({
    sprite,
    done: false,
    update(now) {
      const p = Math.min((now - startT) / dur, 1);
      const ease = p < 0.7 ? _easeIn(p / 0.7) : 1.0 + Math.sin((p - 0.7) / 0.3 * Math.PI) * 0.06;
      sprite.position.x = bx + (targetX - bx) * Math.min(p * 1.4, 1);
      sprite.position.y = startY + (targetY - startY) * ease;
      sprite.position.z = bz + (targetZ - bz) * Math.min(p * 1.4, 1);
      if (p >= 1) this.done = true;
    },
  });
}

function _easeIn(t) { return t * t; }

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

    const dur   = 2.0 + Math.random() * 1.0;
    const velY  = 0.3 + Math.random() * 0.5;
    const velX  = (Math.random() - 0.5) * 0.6;
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

  waterU.uFlushSwirl.value = p < 0.82
    ? p / 0.82
    : 1.0 - (p - 0.82) / 0.18;

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

  const sx = 0, sy = 1.18, sz = 0.30;
  const ex = basketGroup ? basketGroup.position.x : 0.45;
  const ey = (basketGroup ? basketGroup.position.y : 0) + 0.5;
  const ez = basketGroup ? basketGroup.position.z : 0.85;

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

  // Camera-animatie heeft prioriteit; anders update damping
  if (cameraAnim) {
    _advanceCamera(now);
  } else if (controls) {
    // Subtiele zweef alleen wanneer geen orbit-actie
    controls.update();
  }

  if (propSprite && !unclogAnim) {
    propSprite.position.y = 1.18 + Math.sin(now * 5.8) * 0.025;
  }

  if (basketGroup) {
    basketGroup.rotation.y = Math.sin(now * 0.4) * 0.02;
  }

  _advanceFlush(now);
  _advanceClog(now);
  _advanceUnclog(now);

  // Basket-item animaties
  basketItems3D = basketItems3D.filter(item => {
    item.update(now);
    return !item.done;
  });

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
