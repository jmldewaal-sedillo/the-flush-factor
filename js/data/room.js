// Het wc-hokje: maten (meters), vaste plekken, decoratie-ankerpunten en camerastanden.
// Assen: x = links/rechts, y = hoogte, z = van achterwand (0) naar de deur.

export const ROOM = { width: 1.3, depth: 2.2, height: 2.5 };

const W = ROOM.width / 2;

export const PLACES = {
  toilet: { position: [0.03, 0, 0.02] },         // achterkant stortbak tegen de wand
  bucket: { position: [0.42, 0, 0.78] },
  paperHolder: { position: [W, 0.72, 0.62] },
};

// Decoratie-ankerpunten. rotationY draait het object zodat het de kamer in kijkt.
export const ANCHORS = {
  wallBack:     { label: 'Boven het toilet', position: [0, 1.50, 0],       rotationY: 0,            wall: 'back' },
  wallBackHigh: { label: 'Hoog op de wand',  position: [0, 2.12, 0],       rotationY: 0,            wall: 'back' },
  wallLeft:     { label: 'Linkermuur',       position: [-W, 1.55, 1.05],   rotationY: Math.PI / 2,  wall: 'left' },
  wallLeftLow:  { label: 'Linkermuur laag',  position: [-W, 1.10, 0.40],   rotationY: Math.PI / 2,  wall: 'left' },
  wallRight:    { label: 'Rechtermuur',      position: [W, 1.60, 1.05],    rotationY: -Math.PI / 2, wall: 'right' },
  floorLeft:    { label: 'Vloer links',      position: [-0.44, 0, 0.30],   rotationY: 0,            wall: 'floor' },
};

// Camerastanden (punt 53). De camera kijkt naar `target` vanuit richting `dir`
// en gaat zo ver achteruit dat een vlak van frame.w × frame.h meter in beeld past.
// fill: true = het vlak vult het beeld juist helemaal (je ziet een deel; slepen om rond te kijken).
// fit: 'height' = altijd op hoogte passend maken.
// clampTop: schuif omlaag zodat de bovenrand van het beeld op de wand blijft (punt 55).
export const CAMERA_FOV = 50;
export const CAMERA_VIEWS = {
  overview:  { label: 'Overzicht',         icon: 'scan-eye',      target: [0, 1.05, 0.9],  dir: [0, 0.85, 1],     frame: { w: 1.9,  h: 2.5 }, anchors: true },
  toilet:    { label: 'Toilet',            icon: 'toilet',        target: [0.06, 0.62, 0.35], dir: [0, 0.36, 1],  frame: { w: 1.22, h: 1.75 }, clampTop: true },
  wallBack:  { label: 'Muur boven toilet', icon: 'layout-grid',   target: [0, 1.58, 0],    dir: [0, 0.06, 1],     frame: { w: 1.25, h: 1.5 }, fit: 'height', clampTop: true, anchors: true },
  wallLeft:  { label: 'Linkermuur',        icon: 'arrow-left',    target: [-W, 1.3, 1.0],  dir: [1, 0.05, 0.18],  frame: { w: 2.0,  h: 1.9 }, fill: true, clampTop: true, anchors: true },
  wallRight: { label: 'Rechtermuur',       icon: 'arrow-left',    target: [W, 1.3, 1.0],   dir: [-1, 0.05, 0.18], frame: { w: 2.0,  h: 1.9 }, fill: true, clampTop: true, anchors: true, flipIcon: true },
  bucket:    { label: 'Emmer',             icon: 'bucket-wood',   target: 'bucket',        dir: [0, 1, 0.42],     frame: { w: 0.62, h: 0.62 } },
};
// Automatische close-up bij een verstopping (geen knop).
export const CLOG_VIEW = { target: [0.03, 0.42, 0.42], dir: [0, 0.8, 0.75], frame: { w: 0.85, h: 0.75 } };

export const DEFAULT_VIEW = 'toilet';
// Swipen wisselt tussen deze standen (links <-> midden <-> rechts).
export const SWIPE_RING = ['wallLeft', 'toilet', 'wallRight'];
