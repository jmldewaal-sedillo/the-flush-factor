// ============================================================
// THE FLUSH FACTOR — icons.js
// Central SVG icon library. Two types:
//   'stroke' — Lucide (MIT), 24×24 viewBox, stroke-based
//   'fill'   — game-icons.net (CC BY 3.0) or custom, 512×512, fill-based
// ============================================================

const ICONS = {
  // ── Lucide MIT — stroke icons 24×24 ──
  'menu':          { type:'stroke', vb:'0 0 24 24', src:`<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>` },
  'arrow-left':    { type:'stroke', vb:'0 0 24 24', src:`<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>` },
  'shopping-cart': { type:'stroke', vb:'0 0 24 24', src:`<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>` },
  'trash-2':       { type:'stroke', vb:'0 0 24 24', src:`<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>` },
  'volume-2':      { type:'stroke', vb:'0 0 24 24', src:`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>` },
  'volume-x':      { type:'stroke', vb:'0 0 24 24', src:`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="22" y2="15"/>` },
  'maximize':      { type:'stroke', vb:'0 0 24 24', src:`<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>` },
  'crosshair':     { type:'stroke', vb:'0 0 24 24', src:`<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>` },
  'x':             { type:'stroke', vb:'0 0 24 24', src:`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>` },
  'chevron-down':  { type:'stroke', vb:'0 0 24 24', src:`<path d="m6 9 6 6 6-6"/>` },
  'lock':          { type:'stroke', vb:'0 0 24 24', src:`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` },
  'coins':         { type:'stroke', vb:'0 0 24 24', src:`<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>` },
  'trophy':        { type:'stroke', vb:'0 0 24 24', src:`<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>` },
  'star':          { type:'stroke', vb:'0 0 24 24', src:`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>` },
  'zap':           { type:'stroke', vb:'0 0 24 24', src:`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>` },
  'sprout':        { type:'stroke', vb:'0 0 24 24', src:`<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.1 2.1 3.6"/><path d="M17 10.5c0 3.5-3.5 8.5-3.5 8.5"/><path d="M17 10.5c-2 0-7.5 1.5-8 4 1 2 3 1.5 4.5 1"/>` },
  'image':         { type:'stroke', vb:'0 0 24 24', src:`<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>` },
  'key':           { type:'stroke', vb:'0 0 24 24', src:`<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>` },
  'smartphone':    { type:'stroke', vb:'0 0 24 24', src:`<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>` },
  'megaphone':     { type:'stroke', vb:'0 0 24 24', src:`<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>` },
  'ban':           { type:'stroke', vb:'0 0 24 24', src:`<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>` },
  'droplets':      { type:'stroke', vb:'0 0 24 24', src:`<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>` },
  'sparkles':      { type:'stroke', vb:'0 0 24 24', src:`<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>` },
  'flame':         { type:'stroke', vb:'0 0 24 24', src:`<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>` },
  'fish':          { type:'stroke', vb:'0 0 24 24', src:`<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c1.98 4 1.98 6 0 9 2.85-.47 4.27-2.24 4.27-3.83z"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/>` },
  'banana':        { type:'stroke', vb:'0 0 24 24', src:`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>` },
  'crown':         { type:'stroke', vb:'0 0 24 24', src:`<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>` },
  'rocket':        { type:'stroke', vb:'0 0 24 24', src:`<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>` },
  'landmark':      { type:'stroke', vb:'0 0 24 24', src:`<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>` },
  'gem':           { type:'stroke', vb:'0 0 24 24', src:`<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>` },
  'rainbow':       { type:'stroke', vb:'0 0 24 24', src:`<path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/>` },
  'dumbbell':      { type:'stroke', vb:'0 0 24 24', src:`<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l-1.768 1.768a2 2 0 1 1 2.829 2.829z"/>` },
  'bot':           { type:'stroke', vb:'0 0 24 24', src:`<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>` },
  'grid-2x2':      { type:'stroke', vb:'0 0 24 24', src:`<rect width="10" height="10" x="3" y="3" rx="1"/><rect width="10" height="10" x="3" y="13" rx="1"/><rect width="10" height="10" x="13" y="3" rx="1"/><rect width="10" height="10" x="13" y="13" rx="1"/>` },
  'layers':        { type:'stroke', vb:'0 0 24 24', src:`<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>` },
  'info':          { type:'stroke', vb:'0 0 24 24', src:`<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>` },
  'circle-check':  { type:'stroke', vb:'0 0 24 24', src:`<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>` },
  'package':       { type:'stroke', vb:'0 0 24 24', src:`<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>` },
  'help-circle':   { type:'stroke', vb:'0 0 24 24', src:`<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>` },
  'wrench':        { type:'stroke', vb:'0 0 24 24', src:`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>` },
  // 'snake' voor toilet-veer gereedschap
  'snake':         { type:'stroke', vb:'0 0 24 24', src:`<path d="M3 6c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3c-1.7 0-3 1.3-3 3s1.3 3 3 3h12c1.7 0 3 1.3 3 3s-1.3 3-3 3"/>` },

  // ── game-icons.net CC BY 3.0 Delapouite / Lorc — fill icons 512×512 ──
  // Simplified geometric versions
  'plunger': { type:'fill', vb:'0 0 512 512', src:`<ellipse cx="256" cy="336" rx="192" ry="80"/><rect x="232" y="144" width="48" height="208"/><circle cx="256" cy="128" r="56"/>` },
  'rubber-duck': { type:'fill', vb:'0 0 512 512', src:`<ellipse cx="256" cy="296" rx="160" ry="144"/><circle cx="256" cy="144" r="96"/><ellipse cx="320" cy="112" rx="48" ry="28"/><circle cx="224" cy="256" r="24"/>` },
  'flamingo': { type:'fill', vb:'0 0 512 512', src:`<ellipse cx="256" cy="256" rx="64" ry="80"/><path d="M256 176c0-80-48-128-80-128s-32 32-16 64c16 32 64 48 96 48z"/><path d="M256 336l-80 112h-48l96-128z"/><path d="M256 336l80 112h48l-96-128z"/><circle cx="240" cy="80" r="32"/>` },
  'elephant': { type:'fill', vb:'0 0 512 512', src:`<ellipse cx="272" cy="256" rx="176" ry="144"/><path d="M160 272c0 0-64 80-64 160h48l32-96 48 80h48l-32-96 16-48z"/><path d="M160 256c0 0-32-32-64-48v64l64 32z"/><circle cx="208" cy="200" r="24"/><circle cx="216" cy="192" r="10" fill="white"/>` },
  'magic-wand': { type:'fill', vb:'0 0 512 512', src:`<rect x="56" y="360" width="320" height="48" rx="8" transform="rotate(-45 216 384)"/><path d="M388 124l20-60 20 60 60 20-60 20-20 60-20-60-60-20z"/><path d="M184 64l10-32 10 32 32 10-32 10-10 32-10-32-32-10z"/>` },
  'disco-ball': { type:'fill', vb:'0 0 512 512', src:`<circle cx="256" cy="296" r="168"/><rect x="232" y="80" width="48" height="72"/><circle cx="256" cy="80" r="32"/><rect x="200" y="232" width="56" height="16"/><rect x="264" y="248" width="56" height="16"/><rect x="192" y="264" width="56" height="16"/><rect x="256" y="280" width="56" height="16"/>` },
  'ninja': { type:'fill', vb:'0 0 512 512', src:`<path d="M144 256c0-61.9 50.1-112 112-112s112 50.1 112 112v80c0 26.5-21.5 48-48 48H192c-26.5 0-48-21.5-48-48V256z"/><path d="M144 272h224v16H144z"/><circle cx="208" cy="248" r="20"/><circle cx="304" cy="248" r="20"/><path d="M160 128c0-52.9 42.9-96 96-96s96 43.1 96 96v24H160z"/>` },
  'toilet': { type:'fill', vb:'0 0 512 512', src:`<rect x="168" y="48" width="176" height="96" rx="16"/><rect x="152" y="128" width="208" height="16"/><path d="M128 144h256l-48 112-32 48H208l-32-48-48-112z"/><ellipse cx="256" cy="400" rx="80" ry="64"/><rect x="168" y="448" width="176" height="32" rx="8"/>` },
  'wicker-basket': { type:'fill', vb:'0 0 512 512', src:`<path d="M192 272L256 192 320 272z"/><path d="M112 288h288v144c0 26.5-21.5 48-48 48H160c-26.5 0-48-21.5-48-48V288z"/><rect x="112" y="272" width="288" height="32"/><line x1="256" y1="288" x2="256" y2="480" stroke="rgba(0,0,0,0.15)" stroke-width="16"/><line x1="192" y1="288" x2="176" y2="480" stroke="rgba(0,0,0,0.15)" stroke-width="16"/><line x1="320" y1="288" x2="336" y2="480" stroke="rgba(0,0,0,0.15)" stroke-width="16"/>` },
  'drain-cleaner': { type:'fill', vb:'0 0 512 512', src:`<path d="M192 64h128l40 128H152z"/><path d="M152 192h208v240c0 26.5-21.5 48-48 48h-112c-26.5 0-48-21.5-48-48V192z"/><rect x="216" y="32" width="80" height="40" rx="8"/><ellipse cx="256" cy="192" rx="104" ry="24"/>` },
  'bucket': { type:'fill', vb:'0 0 512 512', src:`<path d="M144 176h224l-32 264c-4 24-24 40-48 40H224c-24 0-44-16-48-40L144 176z"/><rect x="128" y="144" width="256" height="40" rx="8"/><path d="M192 144c0-35.3 28.7-64 64-64s64 28.7 64 64" fill="none" stroke="currentColor" stroke-width="28" stroke-linecap="round"/>` },
  'water-gun': { type:'fill', vb:'0 0 512 512', src:`<rect x="48" y="208" width="288" height="96" rx="8"/><rect x="336" y="208" width="80" height="96" rx="8"/><rect x="48" y="272" width="48" height="112" rx="8"/><rect x="80" y="176" width="192" height="40" rx="8"/><circle cx="416" cy="256" r="56" fill="none" stroke="currentColor" stroke-width="28"/>` },
  'robot-hand': { type:'fill', vb:'0 0 512 512', src:`<rect x="176" y="272" width="160" height="176" rx="24"/><rect x="144" y="192" width="48" height="104" rx="16"/><rect x="208" y="176" width="48" height="120" rx="16"/><rect x="272" y="192" width="48" height="104" rx="16"/><rect x="320" y="208" width="48" height="88" rx="16"/><rect x="144" y="336" width="224" height="12" rx="4" opacity="0.4"/>` },
  'muscle': { type:'fill', vb:'0 0 512 512', src:`<path d="M160 200c0-66.3 53.7-120 120-120 24 0 46.4 7.2 65 19.5l-35 62.5c-9-5.7-19.6-9-31-9-32 0-57 25-57 57 0 15.6 6.2 29.7 16.3 40L160 310c-18-28.3-28.3-62-28.3-96z"/><path d="M352 312c0 66.3-53.7 120-120 120-24 0-46.4-7.2-65-19.5l35-62.5c9 5.7 19.6 9 31 9 32 0 57-25 57-57 0-15.6-6.2-29.7-16.3-40L352 202c18 28.3 28.3 62 28.3 96z"/>` },
  'checkerboard': { type:'fill', vb:'0 0 512 512', src:`<rect x="64" y="64" width="96" height="96"/><rect x="256" y="64" width="96" height="96"/><rect x="160" y="160" width="96" height="96"/><rect x="352" y="160" width="96" height="96"/><rect x="64" y="256" width="96" height="96"/><rect x="256" y="256" width="96" height="96"/><rect x="160" y="352" width="96" height="96"/><rect x="352" y="352" width="96" height="96"/>` },
  'mirror': { type:'fill', vb:'0 0 512 512', src:`<rect x="144" y="48" width="224" height="288" rx="112"/><rect x="232" y="336" width="48" height="80"/><rect x="184" y="416" width="144" height="32" rx="8"/><path d="M168 192c0-48.6 39.4-88 88-88" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="20" stroke-linecap="round"/>` },
  'toilet-paper': { type:'fill', vb:'0 0 512 512', src:`<ellipse cx="256" cy="264" rx="184" ry="192"/><ellipse cx="256" cy="264" rx="64" ry="72" fill="rgba(255,255,255,0.35)"/><rect x="424" y="64" width="32" height="200" rx="12"/>` },
  'sock': { type:'fill', vb:'0 0 512 512', src:`<path d="M160 64h96v192l88 128c16 32 8 80-24 104-32 24-80 16-104-16L112 336c-32-48-16-112 32-144V64z"/><rect x="160" y="64" width="96" height="40" rx="8"/>` },
  'toy-car': { type:'fill', vb:'0 0 512 512', src:`<path d="M80 240h352v128H80z" rx="8"/><path d="M128 240l48-96h160l48 96H128z"/><circle cx="160" cy="368" r="56"/><circle cx="352" cy="368" r="56"/><circle cx="160" cy="368" r="24" fill="rgba(180,180,180,0.9)"/><circle cx="352" cy="368" r="24" fill="rgba(180,180,180,0.9)"/><rect x="192" y="168" width="96" height="72" rx="10" fill="rgba(255,255,255,0.35)"/>` },
  'teddy-bear': { type:'fill', vb:'0 0 512 512', src:`<circle cx="256" cy="288" r="152"/><circle cx="136" cy="160" r="72"/><circle cx="376" cy="160" r="72"/><ellipse cx="256" cy="296" rx="72" ry="64" opacity="0.3"/><circle cx="220" cy="256" r="22"/><circle cx="292" cy="256" r="22"/><path d="M220 320a48 48 0 0 0 72 0" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="12"/><circle cx="228" cy="248" r="8" fill="white"/><circle cx="300" cy="248" r="8" fill="white"/>` },
  'lego': { type:'fill', vb:'0 0 512 512', src:`<rect x="64" y="160" width="384" height="288" rx="16"/><rect x="128" y="96" width="96" height="80" rx="16"/><rect x="288" y="96" width="96" height="80" rx="16"/><circle cx="192" cy="256" r="40" fill="rgba(255,255,255,0.25)"/><circle cx="320" cy="256" r="40" fill="rgba(255,255,255,0.25)"/>` },
  'party-popper': { type:'fill', vb:'0 0 512 512', src:`<path d="M64 448l128-224 96 96L64 448z"/><path d="M256 224l48-128 96 96-144 32z"/><path d="M368 80l20-60 20 60 60 20-60 20-20 60-20-60-60-20z"/><path d="M432 256l10-30 10 30 30 10-30 10-10 30-10-30-30-10z"/>` },
  'lightning': { type:'fill', vb:'0 0 512 512', src:`<path d="M296 48L160 280h144l-48 184 192-248H304z"/>` },
  'rainbow-game': { type:'fill', vb:'0 0 512 512', src:`<path d="M80 368c0-97.2 78.8-176 176-176s176 78.8 176 176h-48c0-70.7-57.3-128-128-128s-128 57.3-128 128H80z"/><path d="M144 368c0-61.9 50.1-112 112-112s112 50.1 112 112h-48c0-35.3-28.7-64-64-64s-64 28.7-64 64h-48z"/><path d="M208 368c0-26.5 21.5-48 48-48s48 21.5 48 48h-96z"/>` },
};

// ── Public API ──

export function iconSVG(name, size = 24, color = 'currentColor') {
  const ic = ICONS[name] ?? ICONS['help-circle'];
  const attrs = ic.type === 'stroke'
    ? `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${color}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ic.vb}" width="${size}" height="${size}" aria-hidden="true" ${attrs}>${ic.src}</svg>`;
}

/** Returns an HTML string containing the SVG icon. */
export function icon(name, size = 24) {
  return iconSVG(name, size);
}

/** Returns a DOM <span class="icon-wrap"> element containing the icon. */
export function iconEl(name, size = 24) {
  const d = document.createElement('span');
  d.className = 'icon-wrap';
  d.innerHTML = iconSVG(name, size);
  return d;
}

/** Returns a data: URL for use in canvas/Three.js (explicit white color by default). */
export function iconDataUrl(name, size = 64, color = 'white') {
  return 'data:image/svg+xml,' + encodeURIComponent(iconSVG(name, size, color));
}
