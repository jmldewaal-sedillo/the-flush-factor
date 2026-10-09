// Chaos-effecten van nutteloos gereedschap: iconen en kleur over het beeld (DOM, geen 3D).
import { icon } from './icons.js';

let cleanup = [];

function spawnIcons(layer, name, count, ms, color) {
  const els = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'chaos-icon';
    el.innerHTML = icon(name, 30 + Math.floor(Math.random() * 30));
    el.style.cssText = `left:${5 + Math.random() * 85}%;top:${10 + Math.random() * 70}%;color:${color || `hsl(${Math.floor(Math.random() * 360)},75%,60%)`};animation-duration:${0.8 + Math.random() * 1.2}s;animation-delay:${Math.random() * 0.4}s`;
    layer.appendChild(el);
    els.push(el);
  }
  const timer = setTimeout(() => els.forEach(e => e.remove()), ms);
  cleanup.push(() => { clearTimeout(timer); els.forEach(e => e.remove()); });
}

const effects = {
  ducks: layer => spawnIcons(layer, 'duck', 9, 3000, '#ffd21f'),
  confetti(layer) {
    const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#ff6b81', '#eccc68'];
    const els = [];
    for (let i = 0; i < 36; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.cssText = `left:${Math.random() * 100}%;width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;background:${colors[i % colors.length]};border-radius:${i % 2 ? '50%' : '2px'};animation-duration:${1 + Math.random() * 1.5}s;animation-delay:${Math.random() * 0.8}s`;
      layer.appendChild(el);
      els.push(el);
    }
    const timer = setTimeout(() => els.forEach(e => e.remove()), 3400);
    cleanup.push(() => { clearTimeout(timer); els.forEach(e => e.remove()); });
    spawnIcons(layer, 'party-popper', 3, 2200);
  },
  flamingo(layer) {
    const el = document.createElement('div');
    el.className = 'chaos-flamingo';
    el.innerHTML = icon('flamingo', 120);
    layer.appendChild(el);
    const timer = setTimeout(() => el.remove(), 2600);
    cleanup.push(() => { clearTimeout(timer); el.remove(); });
  },
  disco(layer) {
    const el = document.createElement('div');
    el.className = 'chaos-disco';
    layer.appendChild(el);
    const timer = setTimeout(() => el.remove(), 3000);
    cleanup.push(() => { clearTimeout(timer); el.remove(); });
    spawnIcons(layer, 'disco-ball', 1, 3000, '#ffffff');
    spawnIcons(layer, 'music', 6, 3000);
  },
  magic(layer) { spawnIcons(layer, 'stars', 8, 2500, '#ffe9a8'); spawnIcons(layer, 'magic-wand', 2, 2500, '#c9a2ff'); },
  elephant(layer) { spawnIcons(layer, 'elephant', 1, 3000, '#9aa5b1'); spawnIcons(layer, 'water-drops', 10, 3000, '#6ec6f0'); },
  megaphone(layer) { spawnIcons(layer, 'megaphone', 5, 2500, '#ffb347'); spawnIcons(layer, 'volume-2', 4, 2500, '#ffffff'); },
};

export function playChaos(effect) {
  cleanup.forEach(fn => fn());
  cleanup = [];
  const layer = document.getElementById('fx-layer');
  if (layer) (effects[effect] || effects.confetti)(layer);
}
