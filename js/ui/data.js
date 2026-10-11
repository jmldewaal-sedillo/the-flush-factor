// Gegevens van de speler (CLAUDE.md §5): voortgang overzetten als code of bestand, het profiel
// verwijderen, en alle gegevens van de app verwijderen (met de bestanden voor gebruik zonder internet).
// Alleen DOM; het echte werk doet js/storage.js. Er wordt nergens iets naartoe gestuurd.
import { storage } from '../storage.js';
import { t } from '../i18n/index.js';

const $ = id => document.getElementById(id);

// Vraagt om bevestiging. → true als de speler "ja" kiest. Zonder `yes` is het alleen een melding met één knop.
function confirmDialog({ title, text, yes, ok }) {
  return new Promise(resolve => {
    const dialog = $('confirm-dialog'), yesBtn = $('confirm-yes'), noBtn = $('confirm-no');
    $('confirm-title').textContent = title;
    $('confirm-text').textContent = text;
    yesBtn.textContent = yes || ok;
    yesBtn.classList.toggle('danger', !!yes);
    noBtn.hidden = !yes;
    dialog.hidden = false;
    const done = answer => {
      dialog.hidden = true;
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      resolve(answer);
    };
    const onYes = () => done(true), onNo = () => done(false);
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
    (yes ? noBtn : yesBtn).focus();
  });
}

// beforeChange(): het spel stopt met opslaan, zodat een latere "save" het gewiste niet terugschrijft.
export function bindDataControls({ beforeChange }) {
  const restart = () => { location.href = location.pathname; };
  const say = text => { $('transfer-status').textContent = text; };

  $('btn-delete-profile').addEventListener('click', async () => {
    if (!await confirmDialog({ title: t('data.deleteProfileTitle'), text: t('data.deleteProfileText'), yes: t('data.deleteProfileYes') })) return;
    beforeChange();
    storage.deleteProfile();
    restart();
  });

  $('btn-wipe').addEventListener('click', async () => {
    if (!await confirmDialog({ title: t('data.wipeTitle'), text: t('data.wipeText'), yes: t('data.wipeYes') })) return;
    beforeChange();
    await storage.wipeEverything();
    document.body.dataset.wiped = 'true';
    await confirmDialog({ title: t('data.wipedTitle'), text: t('data.wipedText'), ok: t('data.restart') });
    restart();
  });

  // ── overzetten ──
  const transfer = $('transfer-dialog');
  $('btn-transfer').addEventListener('click', () => {
    $('export-result').hidden = true;
    $('export-code').value = '';
    $('import-code').value = '';
    say('');
    transfer.hidden = false;
  });
  $('btn-transfer-close').addEventListener('click', () => { transfer.hidden = true; });
  transfer.addEventListener('click', e => { if (e.target === transfer) transfer.hidden = true; });

  $('btn-export').addEventListener('click', () => {
    $('export-code').value = storage.exportCode();
    $('export-result').hidden = false;
    $('export-code').select();
  });
  $('btn-export-copy').addEventListener('click', async () => {
    const code = $('export-code').value;
    try { await navigator.clipboard.writeText(code); } catch { $('export-code').select(); document.execCommand?.('copy'); }
    say(t('data.copied'));
  });
  $('btn-export-file').addEventListener('click', () => { storage.exportFile($('export-code').value); });      // dezelfde code als in het vak

  $('import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (file) $('import-code').value = (await file.text()).trim();
    e.target.value = '';
  });
  $('btn-import').addEventListener('click', async () => {
    const code = $('import-code').value;
    if (!storage.readCode(code)) return say(t('data.importBad'));
    if (!await confirmDialog({ title: t('data.importTitle'), text: t('data.importText'), yes: t('data.importYes') })) return;
    beforeChange();
    storage.importCode(code);
    await confirmDialog({ title: t('data.importDone'), text: '', ok: t('data.restart') });
    restart();
  });
}

export const dataDialogOpen = () => !$('transfer-dialog').hidden || !$('confirm-dialog').hidden;
export function closeDataDialogs() { $('transfer-dialog').hidden = true; }
