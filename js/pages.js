// Toont de privacyverklaring of de verwijderpagina (<body data-page="privacy"> of "delete") in de taal
// van het spel. De teksten staan in js/i18n/legal/, de knoppen in js/i18n/.
import { LANGUAGES, STRINGS, deviceLanguage, setLanguage, getLanguage, t } from './i18n/index.js';
import { LEGAL } from './i18n/legal/index.js';
import { storage } from './storage.js';
import { PRIVACY_DATE, APP_NAME, APP_SHORT_NAME } from './data/config.js';
import { STUDIO } from './data/credits.js';

const page = document.body.dataset.page;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function show() {
  const lang = getLanguage();
  const T = LEGAL[lang][page];
  const mail = `<a href="mailto:${STUDIO.email}">${STUDIO.email}</a>`;
  const date = new Date(`${PRIVACY_DATE}T12:00:00`).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  const fill = text => text.split('{app}').join(esc(APP_NAME)).split('{short}').join(esc(APP_SHORT_NAME)).split('{mail}').join(mail).split('{date}').join(esc(date));
  document.title = `${T.title} – ${APP_NAME}`;
  document.getElementById('page-text').innerHTML =
    `<h1>${T.title}</h1><p class="updated">${fill(T.sub)}</p>` + T.sections.map(s => `<h2>${s[0]}</h2>${fill(s[1])}`).join('');
  document.getElementById('company').innerHTML = `&copy; ${STUDIO.year} ${STUDIO.name} · KvK ${STUDIO.kvk} · ${esc(t('page.country'))} · ${mail}`;
  document.querySelectorAll('.langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

// ?lang=xx in het adres wint (handig voor een directe link); anders de taal van het spel, anders die van het toestel.
const asked = new URLSearchParams(location.search).get('lang');
const saved = storage.readSetting('language');
setLanguage(STRINGS[asked] ? asked : STRINGS[saved] ? saved : deviceLanguage());

const langs = document.querySelector('.langs');
langs.setAttribute('aria-label', LANGUAGES.map(l => l[1]).slice(0, 2).join(' / '));
langs.innerHTML = LANGUAGES.map(([code, name]) => `<button type="button" data-lang="${code}" lang="${code}">${name}</button>`).join('');
langs.addEventListener('click', e => {
  const btn = e.target.closest('[data-lang]');
  if (!btn) return;
  setLanguage(btn.dataset.lang);
  storage.writeSetting('language', getLanguage());      // dezelfde keuze als in het spel
  show();
});
show();
document.documentElement.dataset.ready = 'true';
