// Renderer, scène, licht en de render-loop. Andere modules haken aan via ctx.onFrame().
import * as THREE from 'three';
import { EFFECTS } from '../data/config.js';
import { CAMERA_FOV } from '../data/room.js';

const BACKGROUND = 0x1f2a33;

// 'low' | 'medium' | 'high', of null als WebGL niet beschikbaar is. ?quality=… dwingt een niveau af.
export function detectQuality() {
  const forced = new URLSearchParams(location.search).get('quality');
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return null;
    if (EFFECTS[forced]) return forced;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).toLowerCase() : '';
    if (/apple|adreno \(tm\) [67]|adreno [67]|mali-g7|mali-g6[1-9]|nvidia|radeon|intel\(r\) (iris|arc)/.test(gpu)) return 'high';
    if (/powervr|mali-[t4]|mali-g[35]\d|adreno \(tm\) [345]|adreno [345]|swiftshader|llvmpipe/.test(gpu)) return 'low';
    return 'medium';
  } catch {
    return null;
  }
}

export function createContext(container, quality) {
  const fx = { ...EFFECTS[quality] };
  const canvas = document.createElement('canvas');
  canvas.id = 'scene-canvas-3d';
  container.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: fx.antialias, powerPreference: 'high-performance' });
  // ?pixelratio=0.3 rendert op lagere resolutie (tests draaien zonder GPU; de layout blijft gelijk).
  const forcedRatio = parseFloat(new URLSearchParams(location.search).get('pixelratio'));
  renderer.setPixelRatio(forcedRatio > 0 ? forcedRatio : Math.min(window.devicePixelRatio || 1, fx.maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = fx.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.Fog(BACKGROUND, 7, 16);

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.05, 40);

  // Licht: zacht hemellicht + één lamp met schaduw. De HDRI komt er later bij voor reflecties.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a58c, 1.5));
  const lamp = new THREE.DirectionalLight(0xfff4e2, 2.0);
  lamp.position.set(0.5, 3.4, 2.2);
  lamp.target.position.set(0, 0.3, 0.4);
  if (fx.shadows) {
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    Object.assign(lamp.shadow.camera, { near: 0.5, far: 6, left: -1.2, right: 1.2, top: 1.6, bottom: -1.2 });
    lamp.shadow.bias = -0.0015;
    lamp.shadow.radius = 3;
  }
  scene.add(lamp, lamp.target);

  const frameFns = [];
  const resizeFns = [];
  const clock = new THREE.Clock();
  const ctx = {
    canvas, renderer, scene, camera, quality, fx,
    time: 0, running: false, frames: 0,
    onFrame(fn) { frameFns.push(fn); },
    onResize(fn) { resizeFns.push(fn); },
    setShadow(obj, cast = true, receive = false) {
      if (!fx.shadows) return;
      obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
    },
    resize() {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      resizeFns.forEach(fn => fn(w, h));
    },
    start() {
      if (ctx.running) return;
      ctx.running = true;
      clock.start();
      renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.1);
        ctx.time += dt;
        ctx.frames++;
        for (const fn of frameFns) fn(dt, ctx.time);
        renderer.render(scene, camera);
        watchPerformance(dt);
      });
    },
  };

  // Te traag op dit toestel? Dan resolutie omlaag en schaduwen uit (eenmalig, na de laadfase).
  let perfTime = 0, perfFrames = 0, perfDone = false;
  function watchPerformance(dt) {
    if (perfDone || ctx.time < 3) return;
    perfTime += dt; perfFrames++;
    if (perfTime < 2) return;
    perfDone = true;
    if (perfTime / perfFrames > 1 / 28 && quality !== 'low' && !navigator.webdriver) {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      ctx.downgraded = true;
      ctx.resize();
    }
  }

  new ResizeObserver(() => ctx.resize()).observe(container);
  ctx.resize();
  return ctx;
}

// HDRI voor reflecties (zonder zijn metalen delen zwart): niet nodig voor het eerste beeld,
// dus pas laden als de rest staat.
export async function loadEnvironment(ctx) {
  const { RGBELoader } = await import('../vendor/RGBELoader.js');
  const hdr = await new RGBELoader().loadAsync('assets/hdri/bathroom_512.hdr');
  const pmrem = new THREE.PMREMGenerator(ctx.renderer);
  ctx.scene.environment = pmrem.fromEquirectangular(hdr).texture;
  ctx.scene.environmentIntensity = 0.55;
  hdr.dispose();
  pmrem.dispose();
}
