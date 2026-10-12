// Geluid (punt 96). Web Audio; de bestanden en volumes staan in js/data/sounds.js.
// Browsers spelen pas geluid af na een tik: tot de eerste aanraking wordt er niets geladen en niets
// afgespeeld. Staat het geluid uit, dan wordt er ook niets opgehaald (pas als je het aanzet).
// Geen DOM behalve het wachten op die eerste tik; game.js zegt wanneer er iets moet klinken.
import { SOUNDS, SOUND_DIR, SOUND_DEFAULTS, LOOP_CROSSFADE, LOOP_FADE } from './data/sounds.js';

const clamp01 = v => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

let ctx = null, master = null;
let state = 'idle';              // idle (nog geen tik) → unlocked (tik gehad, niets geladen) → loading → ready | error
let on = SOUND_DEFAULTS.on, volume = SOUND_DEFAULTS.volume;
const buffers = {};              // naam → [AudioBuffer per variant]
const errors = [];
const played = {};               // naam → hoe vaak gestart (voor de tests)
const lastVariant = {};
const live = {};                 // naam → { source, gain } van wat nu klinkt (restart en loop)

// Een doorlopend geluid zonder hoorbare naad: het einde vloeit over in het begin. Zo maakt het niet uit
// hoeveel stilte een mp3-decoder voor of achter het geluid laat staan.
function makeLoop(buffer) {
  const rate = buffer.sampleRate, edge = Math.floor(0.03 * rate);
  const total = buffer.length - 2 * edge, fade = Math.min(Math.floor(LOOP_CROSSFADE * rate), Math.floor(total / 3));
  if (total <= 0 || fade <= 0) return buffer;
  const out = ctx.createBuffer(buffer.numberOfChannels, total - fade, rate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch).subarray(edge, edge + total), dst = out.getChannelData(ch);
    dst.set(src.subarray(0, total - fade));
    for (let i = 0; i < fade; i++) {
      const a = i / fade;
      dst[i] = src[i] * Math.sqrt(a) + src[total - fade + i] * Math.sqrt(1 - a);
    }
  }
  return out;
}

async function loadFile(file) {
  const res = await fetch(SOUND_DIR + file);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  return ctx.decodeAudioData(await res.arrayBuffer());
}

async function load() {
  if (state === 'loading' || state === 'ready') return;
  state = 'loading';
  errors.length = 0;
  await Promise.all(Object.entries(SOUNDS).map(async ([name, def]) => {
    try {
      const list = await Promise.all(def.files.map(loadFile));
      buffers[name] = def.loop ? list.map(makeLoop) : list;
    } catch (err) {
      errors.push(`${name}: ${err?.message || err}`);
    }
  }));
  state = errors.length ? 'error' : 'ready';
  if (errors.length) console.warn('[geluid] niet alles geladen:', errors.join('; '));
}

// De eerste tik: nu mag er geluid klinken. Laden gebeurt alleen als het geluid aan staat.
function unlock() {
  if (state !== 'idle') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { state = 'error'; errors.push('geen Web Audio'); return; }
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = on ? volume : 0;
  master.connect(ctx.destination);
  state = 'unlocked';
  // Op de achtergrond is het stil; terug in beeld gaat het verder.
  document.addEventListener('visibilitychange', () => { (document.hidden ? ctx.suspend() : ctx.resume()).catch(() => {}); });
  if (on) load();
}

function stop(name, fade = 0.03) {
  const cur = live[name];
  if (!cur) return;
  delete live[name];
  const now = ctx.currentTime;
  cur.gain.gain.cancelScheduledValues(now);
  cur.gain.gain.setValueAtTime(cur.gain.gain.value, now);
  cur.gain.gain.linearRampToValueAtTime(0, now + fade);
  cur.source.stop(now + fade + 0.02);
}

function start(name, { loop = false } = {}) {
  const def = SOUNDS[name], list = buffers[name];
  if (!def || !list?.length) return null;
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {});
  // nooit twee keer achter elkaar dezelfde variant
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastVariant[name]) i = (i + 1) % list.length;
  lastVariant[name] = i;
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = list[i];
  source.loop = loop;
  gain.gain.setValueAtTime(loop ? 0 : def.gain, ctx.currentTime);
  if (loop) gain.gain.linearRampToValueAtTime(def.gain, ctx.currentTime + LOOP_FADE);
  source.connect(gain).connect(master);
  source.start();
  played[name] = (played[name] || 0) + 1;
  return { source, gain };
}

export const sound = {
  // Instellingen van het profiel toepassen (bij het starten en na elke wijziging in het menu).
  configure(settings = {}) {
    this.setVolume(settings.volume ?? SOUND_DEFAULTS.volume);
    this.setOn(settings.on ?? SOUND_DEFAULTS.on);
  },
  // Wacht op de eerste tik of toets; daarvóór doet deze module niets.
  arm() {
    const first = () => { for (const type of ['pointerdown', 'keydown', 'touchend']) window.removeEventListener(type, first, true); unlock(); };
    for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, first, true);
  },
  setOn(value) {
    on = !!value;
    if (!ctx) return on;
    master.gain.setTargetAtTime(on ? volume : 0, ctx.currentTime, 0.02);
    if (!on) Object.keys(live).forEach(name => stop(name));
    else if (state === 'unlocked') load();
    return on;
  },
  setVolume(value) {
    volume = clamp01(value);
    if (ctx && on) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
    return volume;
  },
  // Eén keer afspelen. Geeft terug of er echt iets gestart is.
  play(name) {
    if (!on || state !== 'ready' || !SOUNDS[name]) return false;
    if (SOUNDS[name].restart) stop(name);
    const voice = start(name);
    if (voice && SOUNDS[name].restart) {
      live[name] = voice;
      voice.source.onended = () => { if (live[name] === voice) delete live[name]; };
    }
    return !!voice;
  },
  // Doorlopend geluid: elke frame aanroepen met of het moet klinken; start en stopt met een zachte overgang.
  loop(name, active) {
    const wanted = !!active && on && state === 'ready';
    if (wanted && !live[name]) { const voice = start(name, { loop: true }); if (voice) live[name] = voice; }
    else if (!wanted && live[name]) stop(name, LOOP_FADE);
  },
  // Voor de tests en voor foutzoeken in de console (window.__game.sound()).
  debug: () => ({
    state, on, volume, errors: [...errors],
    loaded: Object.fromEntries(Object.entries(buffers).map(([name, list]) => [name, list.length])),
    durations: Object.fromEntries(Object.entries(buffers).map(([name, list]) => [name, list.map(b => Math.round(b.duration * 100) / 100)])),
    played: { ...played }, playing: Object.keys(live).sort(), last: { ...lastVariant },
    context: ctx ? ctx.state : null, gain: master ? master.gain.value : null,
  }),
};
