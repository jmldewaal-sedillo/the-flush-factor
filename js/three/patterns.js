// Getekende tegel- en vloerpatronen (canvas → texture). Eén functie per patroon uit data/cosmetics.js.
const SIZE = 512;

const painters = {
  checker(g, [a, b]) {
    g.fillStyle = a; g.fillRect(0, 0, SIZE, SIZE);
    g.fillStyle = b;
    const n = 4, s = SIZE / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) g.fillRect(x * s, y * s, s, s);
    grout(g, n, 'rgba(255,255,255,0.35)');
  },
  stars(g, [bg, star]) {
    g.fillStyle = bg; g.fillRect(0, 0, SIZE, SIZE);
    const rnd = seeded(7);
    g.fillStyle = star;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * SIZE, y = rnd() * SIZE, r = 1 + rnd() * 3.5;
      g.globalAlpha = 0.5 + rnd() * 0.5;
      i % 6 ? (g.beginPath(), g.arc(x, y, r, 0, 7), g.fill()) : fourPoint(g, x, y, r * 4);
    }
    g.globalAlpha = 1;
    grout(g, 4, 'rgba(255,255,255,0.10)');
  },
  zigzag(g, [a, b]) {
    g.fillStyle = b; g.fillRect(0, 0, SIZE, SIZE);
    g.strokeStyle = a; g.lineWidth = 34; g.lineJoin = 'miter';
    const step = SIZE / 4;
    for (let y = -step; y <= SIZE + step; y += step) {
      g.beginPath();
      for (let x = 0, i = 0; x <= SIZE; x += step / 2, i++) g.lineTo(x, y + (i % 2 ? step / 2 : 0));
      g.stroke();
    }
  },
  marble(g, [base, vein]) {
    g.fillStyle = base; g.fillRect(0, 0, SIZE, SIZE);
    const rnd = seeded(3);
    g.strokeStyle = vein;
    for (let i = 0; i < 16; i++) {
      g.globalAlpha = 0.12 + rnd() * 0.3; g.lineWidth = 0.6 + rnd() * 2.4;
      let x = rnd() * SIZE, y = -20;
      g.beginPath(); g.moveTo(x, y);
      while (y < SIZE + 20) { x += (rnd() - 0.5) * 90; y += 20 + rnd() * 50; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
    grout(g, 2, 'rgba(120,110,100,0.5)');
  },
  rainbow(g) {
    const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'];
    const s = SIZE / colors.length;
    colors.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * s, 0, s + 1, SIZE); });
    g.fillStyle = 'rgba(255,255,255,0.14)';
    for (let y = 0; y < SIZE; y += SIZE / 8) g.fillRect(0, y, SIZE, 3);
  },
  lava(g, [rock, glow]) {
    g.fillStyle = glow; g.fillRect(0, 0, SIZE, SIZE);
    const rnd = seeded(11);
    g.fillStyle = rock;
    for (let i = 0; i < 46; i++) {
      const x = rnd() * SIZE, y = rnd() * SIZE, r = 26 + rnd() * 44;
      for (const [ox, oy] of [[0, 0], [SIZE, 0], [-SIZE, 0], [0, SIZE], [0, -SIZE]]) {
        g.beginPath();
        for (let a = 0; a < 7; a++) { const t = a / 7 * Math.PI * 2, rr = r * (0.7 + rnd() * 0.5); g.lineTo(x + ox + Math.cos(t) * rr, y + oy + Math.sin(t) * rr); }
        g.closePath(); g.fill();
      }
    }
  },
};

function grout(g, n, color) {
  g.strokeStyle = color; g.lineWidth = 4;
  for (let i = 0; i <= n; i++) {
    const p = i * SIZE / n;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, SIZE); g.moveTo(0, p); g.lineTo(SIZE, p); g.stroke();
  }
}
function fourPoint(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

export function paintPattern(name, colors) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  (painters[name] || painters.checker)(canvas.getContext('2d'), colors);
  return canvas;
}

// Losse tekenhulpen voor decoratie (schilderij, poster, ankerpunt-markering).
export function drawCanvas(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  return canvas;
}
