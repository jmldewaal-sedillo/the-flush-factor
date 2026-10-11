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
  // Kale, groezelige stucmuur (start-staat, punt 79): geen tegels, wel vlekken en een enkele scheur.
  plaster(g, [base, shade]) {
    g.fillStyle = base; g.fillRect(0, 0, SIZE, SIZE);
    const rnd = seeded(23);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * SIZE, y = rnd() * SIZE, r = 14 + rnd() * 60;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, shade); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.05 + rnd() * 0.09; g.fillStyle = grad;
      for (const [ox, oy] of [[0, 0], [SIZE, 0], [-SIZE, 0], [0, SIZE], [0, -SIZE]]) { g.setTransform(1, 0, 0, 1, ox, oy); g.fillRect(x - r, y - r, r * 2, r * 2); }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    g.globalAlpha = 0.35; g.strokeStyle = shade; g.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      let x = 60 + rnd() * (SIZE - 120), y = 40 + rnd() * 120;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (rnd() - 0.5) * 34; y += 12 + rnd() * 26; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  },
  // Bruine, vieze vloer (start-staat): versleten zeil met vlekken en kringen.
  dirt(g, [base, dark]) {
    g.fillStyle = base; g.fillRect(0, 0, SIZE, SIZE);
    const rnd = seeded(41);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * SIZE, y = rnd() * SIZE, r = 10 + rnd() * 46;
      g.globalAlpha = 0.10 + rnd() * 0.2; g.fillStyle = i % 4 ? dark : '#8a6a48';
      for (const [ox, oy] of [[0, 0], [SIZE, 0], [-SIZE, 0], [0, SIZE], [0, -SIZE]]) {
        g.beginPath(); g.ellipse(x + ox, y + oy, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, 7); g.fill();
      }
    }
    g.globalAlpha = 0.25; g.strokeStyle = dark; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(rnd() * SIZE, rnd() * SIZE, 16 + rnd() * 26, 0, 7); g.stroke(); }
    g.globalAlpha = 0.18; g.lineWidth = 2;
    for (let p = 0; p <= SIZE; p += SIZE / 2) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, SIZE); g.moveTo(0, p); g.lineTo(SIZE, p); g.stroke(); }
    g.globalAlpha = 1;
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

// ── Vlekken en beschadigingen (punten 80 en 83): getekend, cartoonesk, met doorzichtige achtergrond ──
const blob = (g, cx, cy, r, rnd, points = 11, wobble = 0.45) => {
  g.beginPath();
  for (let i = 0; i <= points; i++) {
    const a = i / points * Math.PI * 2, rr = r * (1 - wobble / 2 + rnd() * wobble);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? g.quadraticCurveTo(cx + Math.cos(a - Math.PI / points) * rr * 1.18, cy + Math.sin(a - Math.PI / points) * rr * 1.18, x, y) : g.moveTo(x, y);
  }
  g.closePath();
};

// Spetter tegen de muur of op de vloer: grillige klodder met losse druppels.
export function paintSplat(variant = 0) {
  const palettes = [['#6a4a22', '#8a6a34', '#3d2a12'], ['#5c6a2a', '#7d8a3a', '#34401a'], ['#7a5a1c', '#a08030', '#4a3410']];
  const [main, light, dark] = palettes[variant % palettes.length];
  return drawCanvas(256, 256, g => {
    const rnd = seeded(101 + variant * 17);
    g.fillStyle = dark; blob(g, 128, 124, 84, rnd); g.fill();
    g.fillStyle = main; blob(g, 126, 120, 74, rnd); g.fill();
    for (let i = 0; i < 12; i++) {
      const a = rnd() * 6.28, d = 84 + rnd() * 34, r = 5 + rnd() * 12;
      g.fillStyle = i % 3 ? main : dark;
      g.beginPath(); g.ellipse(128 + Math.cos(a) * d, 124 + Math.sin(a) * d, r, r * 0.8, a, 0, 7); g.fill();
    }
    g.fillStyle = light; g.globalAlpha = 0.7;
    blob(g, 108, 100, 22, rnd, 7, 0.5); g.fill();
    g.beginPath(); g.ellipse(150, 144, 9, 6, 0.6, 0, 7); g.fill();
    g.globalAlpha = 1;
  });
}

// Plas op de vloer: platte, glimmende vlek.
export function paintPuddle() {
  return drawCanvas(256, 256, g => {
    const rnd = seeded(77);
    g.fillStyle = 'rgba(70, 52, 24, 0.9)'; blob(g, 128, 128, 108, rnd, 9, 0.3); g.fill();
    g.fillStyle = 'rgba(126, 104, 52, 0.85)'; blob(g, 128, 126, 96, rnd, 9, 0.28); g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.arc(112, 112, 62, 3.5, 4.5); g.stroke();
    g.beginPath(); g.arc(150, 150, 30, 0.4, 1.2); g.stroke();
  });
}

// Barst (deksel): vertakte zwarte lijn met een lichte rand.
export function paintCrack() {
  return drawCanvas(256, 256, g => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [color, extra] of [['rgba(255,255,255,0.75)', 3], ['#2a2a2a', 0]]) {
      const rnd = seeded(5);
      g.strokeStyle = color;
      let x = 150, y = 14, a = 1.75;
      for (let i = 0; i < 9; i++) {
        const nx = x + Math.cos(a) * 26, ny = y + Math.sin(a) * 26;
        g.lineWidth = 6 - i * 0.4 + extra; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
        if (i % 3 === 1) { g.lineWidth = 3 + extra; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + Math.cos(a + 1.1) * 40, ny + Math.sin(a + 1.1) * 40); g.lineTo(nx + Math.cos(a + 1.5) * 62, ny + Math.sin(a + 0.9) * 62); g.stroke(); }
        if (i % 3 === 2) { g.lineWidth = 3 + extra; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + Math.cos(a - 1.2) * 34, ny + Math.sin(a - 1.2) * 34); g.stroke(); }
        x = nx; y = ny; a += (rnd() - 0.5) * 0.9;
      }
    }
  });
}

// Ontbrekend stukje uit de rand van de bril: donkere hap met een lichte breukrand.
export function paintChip() {
  return drawCanvas(128, 128, g => {
    g.fillStyle = '#cfcabb'; g.beginPath(); g.moveTo(10, 128); g.lineTo(22, 60); g.lineTo(44, 74); g.lineTo(60, 30); g.lineTo(84, 66); g.lineTo(104, 44); g.lineTo(120, 128); g.closePath(); g.fill();
    g.fillStyle = '#4a463e'; g.beginPath(); g.moveTo(20, 128); g.lineTo(30, 76); g.lineTo(46, 88); g.lineTo(60, 48); g.lineTo(82, 82); g.lineTo(100, 62); g.lineTo(110, 128); g.closePath(); g.fill();
  });
}
