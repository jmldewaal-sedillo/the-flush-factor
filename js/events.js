// Kleine eventbus tussen spellogica (game.js) en weergave (renderer3d.js, ui/).
// De logica weet niets van de weergave; de weergave luistert alleen.
const target = new EventTarget();

export const bus = {
  on(type, fn) { target.addEventListener(type, e => fn(e.detail)); },
  emit(type, detail = {}) { target.dispatchEvent(new CustomEvent(type, { detail })); },
};
