// Voorwerpen die het toilet verstoppen. `liters` = ruimte die het in de emmer inneemt.
// `model` verwijst naar een bouwfunctie in js/three/props.js (kleine procedurele 3D-objecten).
// `sound`: hoe het klinkt als het in de emmer valt (punt 96): 'soft' (papier, sok), 'hard' (klein en hard)
// of 'heavy' (baksteen). De bestanden staan in js/data/sounds.js onder bucket-<soort>.
export const CLOG_PROPS = [
  { id: 'toilet-paper', liters: 0.5, model: 'paperWad', sound: 'soft' },
  { id: 'duck', liters: 1.0, model: 'duck', sound: 'soft' },
  { id: 'sock', liters: 0.3, model: 'sock', sound: 'soft' },
  { id: 'toy-car', liters: 1.5, model: 'toyCar', sound: 'hard' },
  { id: 'phone', liters: 0.8, model: 'phone', sound: 'hard' },
  { id: 'teddy', liters: 2.0, model: 'teddy', sound: 'soft' },
  { id: 'fish', liters: 0.6, model: 'fish', sound: 'soft' },
  { id: 'banana', liters: 0.4, model: 'banana', sound: 'soft' },
  { id: 'brick', liters: 1.5, model: 'brick', sound: 'heavy' },
  { id: 'key', liters: 0.2, model: 'key', sound: 'hard' },
];
