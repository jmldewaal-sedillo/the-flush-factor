// Geluid en muziek (punten 96 en 102–106). Web Audio; bestanden, groepen en volumes staan in js/data/sounds.js.
// - Browsers spelen pas geluid af na een tik: tot de eerste aanraking wordt er niets geladen of afgespeeld.
// - Daarna worden ALLE geluiden meteen opgehaald en gedecodeerd (AudioBuffers), zodat afspelen niets meer
//   hoeft te laden: een geluid start op het moment dat het spel erom vraagt (punt 102). Stilte vooraan een
//   bestand wordt overgeslagen.
// - De muziek wordt apart geladen, pas als het spel dat toestaat (na het startscherm).
// - Elke groep (muziek, water, gereedschap, emmer, interface) heeft een eigen volume; daarboven één
//   hoofdschakelaar. Is alles gedempt, dan wordt er ook niets opgehaald.
// Geen DOM behalve het wachten op die eerste tik; game.js zegt wanneer er iets moet klinken.
import { SOUNDS, SOUND_DIR, SOUND_GROUPS, MUSIC, DUCK, soundDefaults, LOOP_CROSSFADE, LOOP_FADE, LEAD_THRESHOLD } from './data/sounds.js';

const clamp01 = v => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

let ctx = null, master = null, musicDuck = null;
const groupGain = {};            // groep → GainNode
let state = 'idle';              // idle (nog geen tik) → unlocked (tik gehad, niets geladen) → loading → ready | error
let musicState = 'idle';         // idle → loading → ready | error
let musicAllowed = false;        // het spel staat muziek toe (na het startscherm)
let settings = soundDefaults();
const buffers = {};              // naam → [{ buffer, lead }] per variant; lead = stilte vooraan in seconden
let musicBuffer = null, musicVoice = null;
const errors = [];
const played = {};               // naam → hoe vaak gestart (voor de tests)
const delays = [];               // { name, ms }: tijd tussen het spel-event en het starten van het geluid
const lastVariant = {};
const live = {};                 // naam → { source, gain } van wat nu klinkt (restart en loop)
let ducks = 0, duckTimer = 0;

const groupOn = id => !settings.muted && !!settings.groups[id]?.on;
const groupLevel = id => (groupOn(id) ? clamp01(settings.groups[id].volume) : 0);

// Waar het geluid in een bestand echt begint (seconden). Decoders en opnames laten vooraan vaak een paar
// honderdsten stilte staan; die slaan we over, anders komt het geluid te laat.
function leadIn(buffer) {
  const data = buffer.getChannelData(0), max = Math.min(data.length, buffer.sampleRate);
  for (let i = 0; i < max; i++) if (Math.abs(data[i]) > LEAD_THRESHOLD) return Math.max(0, i / buffer.sampleRate - 0.002);
  return 0;
}

// Een doorlopend geluid zonder hoorbare naad: het einde vloeit over in het begin. Zo maakt het niet uit
// hoeveel stilte een mp3-decoder voor of achter het geluid laat staan. (Niet voor muziek: die moet in de maat blijven.)
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

// Alle effecten in één keer ophalen en decoderen.
async function load() {
  if (state === 'loading' || state === 'ready') return;
  state = 'loading';
  errors.length = 0;
  await Promise.all(Object.entries(SOUNDS).map(async ([name, def]) => {
    try {
      const list = await Promise.all(def.files.map(loadFile));
      buffers[name] = list.map(b => (def.loop ? { buffer: makeLoop(b), lead: 0 } : { buffer: b, lead: leadIn(b) }));
    } catch (err) {
      errors.push(`${name}: ${err?.message || err}`);
    }
  }));
  state = errors.length ? 'error' : 'ready';
  if (errors.length) console.warn('[geluid] niet alles geladen:', errors.join('; '));
  loadMusic();
}

// De muziek: pas als het spel het toestaat, de effecten er zijn en de muziek aan staat.
async function loadMusic() {
  if (!ctx || !musicAllowed || musicState !== 'idle' || !groupOn(MUSIC.group) || (state !== 'ready' && state !== 'error')) return;
  musicState = 'loading';
  try {
    musicBuffer = await loadFile(MUSIC.file);
    musicState = 'ready';
    syncMusic();
  } catch (err) {
    musicState = 'error';
    errors.push(`muziek: ${err?.message || err}`);
    console.warn('[geluid] muziek niet geladen:', err?.message || err);
  }
}

// Start of stopt de muziek naar de stand van de instellingen.
function syncMusic() {
  if (!ctx || musicState !== 'ready') return loadMusic();
  const wanted = musicAllowed && groupOn(MUSIC.group);
  if (wanted && !musicVoice) {
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = musicBuffer;
    source.loop = true;
    // precies de lengte van de lus, in de maat: wat de decoder er eventueel achter laat staan telt niet mee.
    // Hier wordt vooraan niets overgeslagen: de eerste tel hoort bij de maat.
    source.loopStart = 0;
    source.loopEnd = Math.min(musicBuffer.duration, MUSIC.seconds);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(MUSIC.gain, ctx.currentTime + 1.2);
    source.connect(gain).connect(musicDuck);
    source.start();
    musicVoice = { source, gain };
    played.music = (played.music || 0) + 1;
  } else if (!wanted && musicVoice) {
    const { source, gain } = musicVoice;
    musicVoice = null;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    source.stop(ctx.currentTime + 0.35);
  }
}

// Muziek zachter zolang een belangrijk geluid klinkt (punt 105).
function duck(seconds) {
  if (!musicDuck) return;
  const now = ctx.currentTime;
  ducks++;
  musicDuck.gain.cancelScheduledValues(now);
  musicDuck.gain.setTargetAtTime(DUCK.level, now, DUCK.down / 3);
  clearTimeout(duckTimer);
  duckTimer = setTimeout(() => musicDuck.gain.setTargetAtTime(1, ctx.currentTime, DUCK.up / 3), Math.max(0.2, seconds) * 1000);
}

function applyLevels() {
  if (!ctx) return;
  // rechtstreeks gezet, zonder overgang: een groep waar op dat moment niets in klinkt wordt door de browser
  // niet doorgerekend, en een geplande overgang zou daar blijven hangen
  for (const g of SOUND_GROUPS) groupGain[g.id].gain.value = groupLevel(g.id);
  // wat doorloopt in een groep die uit gaat, stopt
  for (const name of Object.keys(live)) if (!groupOn(SOUNDS[name].group)) stop(name);
}

// De eerste tik: nu mag er geluid klinken. Laden gebeurt alleen als niet alles gedempt is.
function unlock() {
  if (state !== 'idle') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { state = 'error'; errors.push('geen Web Audio'); return; }
  ctx = new AudioCtx({ latencyHint: 'interactive' });
  master = ctx.createGain();
  master.connect(ctx.destination);
  for (const g of SOUND_GROUPS) {
    groupGain[g.id] = ctx.createGain();
    groupGain[g.id].gain.value = groupLevel(g.id);
    groupGain[g.id].connect(master);
  }
  musicDuck = ctx.createGain();
  musicDuck.connect(groupGain[MUSIC.group]);
  state = 'unlocked';
  // Op de achtergrond is het stil (ook de muziek pauzeert); terug in beeld gaat het verder waar het was.
  document.addEventListener('visibilitychange', () => { (document.hidden ? ctx.suspend() : ctx.resume()).catch(() => {}); });
  if (!settings.muted) load();
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

// after: zoveel seconden later beginnen (op de klok van de audio, dus exact).
function start(name, { loop = false, after = 0 } = {}) {
  const def = SOUNDS[name], list = buffers[name];
  if (!def || !list?.length) return null;
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {});
  // nooit twee keer achter elkaar dezelfde variant
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastVariant[name]) i = (i + 1) % list.length;
  lastVariant[name] = i;
  const { buffer, lead } = list[i], when = ctx.currentTime + after;
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = loop;
  gain.gain.setValueAtTime(loop ? 0 : def.gain, ctx.currentTime);
  if (loop) gain.gain.linearRampToValueAtTime(def.gain, ctx.currentTime + LOOP_FADE);
  source.connect(gain).connect(groupGain[def.group]);
  source.start(when, lead);
  if (def.duck) duck(after + buffer.duration - lead);
  played[name] = (played[name] || 0) + 1;
  return { source, gain };
}

export const sound = {
  // Instellingen van het profiel toepassen (bij het starten en na elke wijziging in de instellingen).
  // { muted, groups: { <groep>: { on, volume } } }
  configure(next = {}) {
    const base = soundDefaults();
    settings = {
      muted: !!next.muted,
      groups: Object.fromEntries(SOUND_GROUPS.map(g => {
        const own = next.groups?.[g.id] || {};
        return [g.id, { on: typeof own.on === 'boolean' ? own.on : base.groups[g.id].on, volume: clamp01(own.volume ?? base.groups[g.id].volume) }];
      })),
    };
    if (!ctx) return;
    applyLevels();
    if (!settings.muted && state === 'unlocked') load();
    syncMusic();
  },
  // Wacht op de eerste tik of toets; daarvóór doet deze module niets.
  arm() {
    const first = () => { for (const type of ['pointerdown', 'keydown', 'touchend']) window.removeEventListener(type, first, true); unlock(); };
    for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, first, true);
  },
  // Het spel is voorbij het startscherm: de muziek mag geladen worden en beginnen.
  allowMusic(on = true) { musicAllowed = !!on; syncMusic(); },
  // Eén keer afspelen. since: het tijdstip (performance.now()) van het spel-event dat hierom vraagt; daarmee
  // wordt bijgehouden hoe snel het geluid start. after: seconden later beginnen. → is er echt iets gestart?
  play(name, { since = null, after = 0 } = {}) {
    const def = SOUNDS[name];
    if (!def || state !== 'ready' || !groupOn(def.group)) return false;
    if (def.restart) stop(name);
    const voice = start(name, { after });
    if (!voice) return false;
    if (since !== null) { delays.push({ name, ms: performance.now() - since }); if (delays.length > 200) delays.shift(); }
    if (def.restart) {
      live[name] = voice;
      voice.source.onended = () => { if (live[name] === voice) delete live[name]; };
    }
    return true;
  },
  // Doorlopend geluid: elke frame aanroepen met of het moet klinken; start en stopt met een zachte overgang.
  loop(name, active) {
    const wanted = !!active && state === 'ready' && groupOn(SOUNDS[name].group);
    if (wanted && !live[name]) { const voice = start(name, { loop: true }); if (voice) live[name] = voice; }
    else if (!wanted && live[name]) stop(name, LOOP_FADE);
  },
  // Voor de tests en voor foutzoeken in de console (window.__game.sound()).
  debug: () => ({
    state, settings: JSON.parse(JSON.stringify(settings)), errors: [...errors],
    loaded: Object.fromEntries(Object.entries(buffers).map(([name, list]) => [name, list.length])),
    durations: Object.fromEntries(Object.entries(buffers).map(([name, list]) => [name, list.map(b => Math.round((b.buffer.duration - b.lead) * 100) / 100)])),
    leads: Object.fromEntries(Object.entries(buffers).map(([name, list]) => [name, list.map(b => Math.round(b.lead * 1000))])),
    played: { ...played }, playing: Object.keys(live).sort(), last: { ...lastVariant }, delays: delays.map(d => ({ ...d })),
    context: ctx ? ctx.state : null, outputLatencyMs: ctx ? Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000) : null,
    gains: Object.fromEntries(Object.entries(groupGain).map(([id, node]) => [id, Math.round(node.gain.value * 1000) / 1000])),
    music: {
      state: musicState, allowed: musicAllowed, playing: !!musicVoice, ducks, duck: musicDuck ? Math.round(musicDuck.gain.value * 100) / 100 : null,
      seconds: musicBuffer ? Math.round(musicBuffer.duration * 1000) / 1000 : null,
      loop: musicVoice ? [Math.round(musicVoice.source.loopStart * 1000) / 1000, Math.round(musicVoice.source.loopEnd * 1000) / 1000] : null,
    },
  }),
};
