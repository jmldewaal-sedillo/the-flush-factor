// De enige plek waar dit spel iets bewaart. Verder mag niets in de app localStorage, caches of
// indexedDB rechtstreeks aanroepen (tests/storage.spec.js controleert dat). Zelfde opzet als de
// app-template van Studio Sedillo.
//
// Elke sleutel begint met PREFIX. Sleutels in gebruik (houd docs/privacy-audit.md gelijk):
//     flushfactor.settings             instellingen van dit toestel (taal, welke menu's openstaan)
//     flushfactor.profiles             lijst van profielen en welk profiel actief is (nu altijd één: p1)
//     flushfactor.profile.<id>.game    de spelstand van een profiel (punten, level, aankopen, geluid, naam, avatar…)
//
// Sleutels veranderen nooit meer zodra ze live staan. Moet het toch: een migratie die de oude sleutel
// leest en overzet, en een test die dat bewijst. Zo'n migratie staat onderaan (migrateLegacy): tot en met
// Sprint 9 heetten de sleutels flushfactor_v1, flushfactor_shop_open en flushfactor_tools_open.

export const SLUG = 'flushfactor';
export const PREFIX = `${SLUG}.`;
const CODE_PREFIX = `${SLUG}1.`;        // begin van een overzetcode; de 1 is de versie van het formaat
const MAX_NAME = 16;
const MAX_CODE = 2000000;               // tekens; een code kan overal vandaan komen
const PART = /^[a-z0-9][a-z0-9-]{0,39}$/;
const SHORT_KEY = /^[a-z0-9][a-z0-9._-]{0,99}$/;
const PROFILE_ID = 'p1';                // dit spel heeft één profiel per toestel

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

// ── kale toegang: altijd met de prefix ──
function fullKey(name) {
  if (typeof name !== 'string' || !SHORT_KEY.test(name)) throw new Error(`storage: ongeldige sleutel "${name}"`);
  return PREFIX + name;
}
function get(name) {
  const key = fullKey(name);
  try { const raw = localStorage.getItem(key); return raw === null ? null : JSON.parse(raw); } catch { return null; }   // privémodus, geblokkeerd of kapot
}
function set(name, value) {
  const key = fullKey(name);
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }                        // opslag vol of geblokkeerd
}
function del(name) {
  const key = fullKey(name);
  try { localStorage.removeItem(key); } catch { /* geen opslag */ }
}
// Elke sleutel die dit spel op dit toestel heeft geschreven.
export function keys() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) out.push(k); } } catch { /* geen opslag */ }
  return out.sort();
}

const partKey = (part, id = PROFILE_ID) => {
  if (!PART.test(part)) throw new Error(`storage: ongeldig onderdeel "${part}"`);
  return `profile.${id}.${part}`;
};

export const storage = {
  SLUG, PREFIX, keys,

  // ── instellingen van dit toestel (horen niet bij een profiel) ──
  readSetting(name) { const s = get('settings'); return isPlainObject(s) && name in s ? s[name] : null; },
  writeSetting(name, value) {
    const s = get('settings');
    const next = isPlainObject(s) ? s : {};
    next[name] = value;
    set('settings', next);
  },

  // ── het profiel en wat het bewaart ──
  activeId: () => PROFILE_ID,
  read(part) { return get(partKey(part)); },
  write(part, value, name = '') {
    set(partKey(part), value);
    // de profielenlijst hoort erbij (zelfde vorm als in de andere apps van Studio Sedillo)
    set('profiles', { v: 1, active: PROFILE_ID, next: 2, list: [{ id: PROFILE_ID, name: String(name || '').slice(0, MAX_NAME) }] });
  },
  // Verwijdert het profiel met alles wat het bewaard heeft (naam, avatar, voortgang, statistieken).
  // De instellingen van het toestel (taal) blijven staan.
  deleteProfile() {
    const start = `${PREFIX}profile.${PROFILE_ID}.`;
    for (const k of keys()) if (k.startsWith(start)) { try { localStorage.removeItem(k); } catch { /* geen opslag */ } }
    del('profiles');
  },

  // ── alles verwijderen ──
  // Alle gegevens van dit spel in localStorage (ook oude sleutels van vóór de prefix).
  wipeAll() {
    for (const k of [...keys(), ...legacyKeys()]) { try { localStorage.removeItem(k); } catch { /* geen opslag */ } }
  },
  // "Alle gegevens van deze app verwijderen": localStorage, de bestanden voor gebruik zonder internet
  // (elke cache van dit adres) en de service worker.
  async wipeEverything() {
    this.wipeAll();
    try { const names = await caches.keys(); await Promise.all(names.map(n => caches.delete(n))); } catch { /* geen caches */ }
    try { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); } catch { /* geen service worker */ }
  },

  // ── voortgang overzetten naar een ander toestel ──
  // Alles wat dit spel bewaard heeft, als één tekst ("code"). Er wordt niets verstuurd: de speler
  // kopieert de code of bewaart hem als bestand.
  exportCode() {
    const data = {};
    for (const k of keys()) { try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* kapotte waarde: overslaan */ } }
    return CODE_PREFIX + toBase64(JSON.stringify({ app: SLUG, v: 1, when: Date.now(), data }));
  },
  exportFileName: () => `${SLUG}-voortgang.txt`,
  // Biedt een code aan als bestand om te bewaren (standaard: een nieuwe). Geeft de code terug.
  exportFile(code = this.exportCode()) {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = this.exportFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return code;
  },
  // Leest een code. Geeft de gecontroleerde gegevens { korteSleutel: waarde } terug, of null als het geen
  // geldige code van dit spel is. Alleen de sleutels die dit spel kent komen erdoor.
  readCode(code) {
    try {
      const text = String(code || '').replace(/\s+/g, '');
      if (!text.startsWith(CODE_PREFIX) || text.length > MAX_CODE) return null;
      const parsed = JSON.parse(fromBase64(text.slice(CODE_PREFIX.length)));
      if (!isPlainObject(parsed) || parsed.app !== SLUG || parsed.v !== 1 || !isPlainObject(parsed.data)) return null;
      const out = {};
      for (const k of ['settings', 'profiles', partKey('game')]) if (isPlainObject(parsed.data[k])) out[k] = parsed.data[k];
      return isPlainObject(out[partKey('game')]) ? out : null;
    } catch { return null; }
  },
  // Vervangt alles op dit toestel door de inhoud van de code. Geeft false terug (en verandert niets) als
  // de code niet geldig is. De spelstand zelf wordt bij het laden nog nagekeken (state.js).
  importCode(code) {
    const data = this.readCode(code);
    if (!data) return false;
    this.wipeAll();
    for (const [k, v] of Object.entries(data)) set(k, v);
    return true;
  },
};

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64(text) {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── migratie van de sleutels van vóór de prefix (tot en met Sprint 9) ──
// flushfactor_v1          → flushfactor.profile.p1.game  (de taal eruit naar flushfactor.settings)
// flushfactor_shop_open   → flushfactor.settings.shopOpen
// flushfactor_tools_open  → flushfactor.settings.toolsOpen
// flushfactor_preview_*   → flushfactor.settings.preview  (ontwikkel-preview op brede schermen)
// De oude sleutel gaat pas weg als de nieuwe er staat. Een bestaande nieuwe spelstand wordt nooit overschreven.
const LEGACY = { save: 'flushfactor_v1', shop: 'flushfactor_shop_open', tools: 'flushfactor_tools_open', preview: 'flushfactor_preview_' };
function legacyKeys() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === LEGACY.save || k === LEGACY.shop || k === LEGACY.tools || (k && k.startsWith(LEGACY.preview))) out.push(k);
    }
  } catch { /* geen opslag */ }
  return out;
}
export function migrateLegacy() {
  const old = legacyKeys();
  if (!old.length) return false;
  const raw = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const parse = k => { try { return JSON.parse(raw(k)); } catch { return null; } };
  const done = [];

  if (old.includes(LEGACY.save)) {
    const data = parse(LEGACY.save);
    if (storage.read('game') !== null) done.push(LEGACY.save);            // er is al een nieuwe spelstand: die blijft
    else if (isPlainObject(data)) {
      const { language, ...game } = data;
      storage.write('game', game, game.profile?.name);
      if (typeof language === 'string' && storage.readSetting('language') === null) storage.writeSetting('language', language);
      if (storage.read('game') !== null) done.push(LEGACY.save);          // alleen weg als de nieuwe er echt staat
    } else done.push(LEGACY.save);                                        // onleesbaar: niets om over te zetten
  }
  if (old.includes(LEGACY.shop)) {
    const open = parse(LEGACY.shop);
    if (Array.isArray(open) && storage.readSetting('shopOpen') === null) storage.writeSetting('shopOpen', open.filter(x => typeof x === 'string'));
    done.push(LEGACY.shop);
  }
  if (old.includes(LEGACY.tools)) {
    if (storage.readSetting('toolsOpen') === null) storage.writeSetting('toolsOpen', raw(LEGACY.tools) !== '0');
    done.push(LEGACY.tools);
  }
  const preview = old.filter(k => k.startsWith(LEGACY.preview));
  if (preview.length) {
    const current = storage.readSetting('preview');
    const next = isPlainObject(current) ? current : {};
    for (const k of preview) { const name = k.slice(LEGACY.preview.length); if (!(name in next)) next[name] = raw(k); }
    storage.writeSetting('preview', next);
    done.push(...preview);
  }
  for (const k of done) { try { localStorage.removeItem(k); } catch { /* geen opslag */ } }
  return true;
}
