// Kleine eventbus tussen spellogica (game.js) en weergave (renderer3d.js, ui/) en geluid (sound.js).
// De logica weet niets van de weergave; de weergave luistert alleen. Animaties en geluiden hangen aan
// dezelfde events, zodat ze op hetzelfde moment beginnen (punt 102).
const target = new EventTarget();
const stamps = {};      // type → performance.now() van de laatste keer dat het event verstuurd is

export const bus = {
  on(type, fn) { target.addEventListener(type, e => fn(e.detail)); },
  emit(type, detail = {}) { stamps[type] = performance.now(); target.dispatchEvent(new CustomEvent(type, { detail })); },
  stamp: type => stamps[type] ?? null,
};
