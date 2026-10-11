// Talen (punt 94). Zelfde opzet als Sudoku Kids: dezelfde lijst talen, een keuzelijst in het menu,
// standaard de taal van het toestel en anders Engels. Elke taal heeft een eigen bestand in deze map;
// elke taal moet elke sleutel van `nl` hebben (tests/i18n.spec.js controleert dat).
// In de teksten staan geen emoji: plaatjes komen uit de icoonsprite.
import nl from './nl.js';
import en from './en.js';
import de from './de.js';
import fr from './fr.js';
import es from './es.js';
import pt from './pt.js';
import it from './it.js';
import pl from './pl.js';
import tr from './tr.js';
import id from './id.js';

// Volgorde en de naam van elke taal in die taal zelf.
export const LANGUAGES = [
  ['nl', 'Nederlands'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'],
  ['pt', 'Português'], ['it', 'Italiano'], ['pl', 'Polski'], ['tr', 'Türkçe'], ['id', 'Bahasa Indonesia'],
];
export const STRINGS = { nl, en, de, fr, es, pt, it, pl, tr, id };
export const FALLBACK = 'nl';

let current = FALLBACK;
const missing = new Set();
const listeners = [];

// Eerste start: de taal van het toestel, anders Engels.
export function deviceLanguage() {
  const device = String(navigator.language || FALLBACK).slice(0, 2).toLowerCase();
  return STRINGS[device] ? device : 'en';
}

export const getLanguage = () => current;
export function setLanguage(code) {
  current = STRINGS[code] ? code : FALLBACK;
  document.documentElement.lang = current;
  applyTranslations();
  listeners.forEach(fn => fn(current));
  return current;
}
export const onLanguageChange = fn => { listeners.push(fn); };

function lookup(key) {
  const lang = STRINGS[current];
  if (key in lang) return lang[key];
  missing.add(`${current}: ${key}`);
  return key in STRINGS[FALLBACK] ? STRINGS[FALLBACK][key] : key;
}

// t('shop.bought', { name: 'Spons' }) — {naam} in de tekst wordt vervangen.
export function t(key, params) {
  const value = lookup(key);
  const text = Array.isArray(value) ? value[0] : String(value);
  return params ? text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m)) : text;
}
// Een willekeurige tekst uit een lijst (meldingen).
export function pick(key) {
  const value = lookup(key);
  return Array.isArray(value) ? value[Math.floor(Math.random() * value.length)] : String(value);
}
export const has = key => key in STRINGS[current] || key in STRINGS[FALLBACK];

// Namen en omschrijvingen van spullen staan onder item.<id>.*
export const itemName = item => t(`item.${item.id}.name`);
export const itemDesc = item => t(`item.${item.id}.desc`);
export const itemShort = item => (has(`item.${item.id}.short`) ? t(`item.${item.id}.short`) : itemName(item));

// Getallen en bedragen in de notatie van de gekozen taal.
export const num = (n, options) => Number(n).toLocaleString(current, options);
export const money = (amount, currency = 'EUR') => Number(amount).toLocaleString(current, { style: 'currency', currency });

// Vaste teksten in index.html: data-i18n (tekst), data-i18n-aria (aria-label), data-i18n-title, data-i18n-placeholder.
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)); });
}

// Voor de tests: sleutels die in de gekozen taal ontbraken.
export const missingKeys = () => [...missing];
