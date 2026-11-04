// Toetsenbord in vensters (Sprint 16, WCAG 2.1 AA; tests/toetsenbord.spec.js). Voor elk venster geldt:
//   - bij openen gaat de focus erin (tenzij hij er al staat, zoals bij een bevestiging op de veilige keuze);
//   - Tab en Shift+Tab blijven in het bovenste open venster;
//   - na sluiten staat de focus weer op de knop waarmee het venster openging.
// Openen en sluiten blijft gewoon het hidden-attribuut; dit bestand kijkt alleen mee. Escape regelt game.js (goBack).
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
const focusables = root => [...root.querySelectorAll(FOCUSABLE)].filter(visible);
// De knop om naar terug te gaan. Zat hij in een menu dat inmiddels dicht is (zoals "Geluid" in het hoofdmenu),
// dan de knop die dat menu opent.
function returnTarget(back) {
  if (!back || !back.isConnected) return null;
  if (visible(back)) return back;
  const menu = back.closest('[hidden]');
  const opener = menu && menu.id ? document.querySelector(`[aria-controls="${menu.id}"]`) : null;
  return opener && visible(opener) ? opener : null;
}

export function manageDialogFocus(ids) {
  const stack = [];                      // open vensters, het laatst geopende bovenaan: { el, back }
  const top = () => stack[stack.length - 1];

  // Wie de focus had vóór het venster opende. Een venster kan zelf al meteen iets focussen (de bevestiging zet
  // hem op "Annuleren") vóórdat dit bestand het merkt; daarom de vorige én de huidige onthouden.
  let previous = null, current = document.activeElement;
  document.addEventListener('focusin', e => { if (e.target !== current) { previous = current; current = e.target; } });

  const opened = el => {
    if (stack.some(d => d.el === el)) return;
    const now = document.activeElement && document.activeElement !== document.body ? document.activeElement : current;
    const back = now && el.contains(now) ? previous : now;
    stack.push({ el, back });
    // Pas na het tekenen: het venster vult zichzelf vaak in hetzelfde moment.
    requestAnimationFrame(() => {
      if (el.hidden || el.contains(document.activeElement)) return;
      const first = focusables(el)[0];
      if (first) first.focus({ preventScroll: true });
      else { el.tabIndex = -1; el.focus({ preventScroll: true }); }
    });
  };
  const closed = el => {
    const i = stack.findIndex(d => d.el === el);
    if (i < 0) return;
    const [{ back }] = stack.splice(i, 1);
    // Alleen terug als de focus nog in het gesloten venster stond (of nergens), en de knop er nog is.
    const lost = !document.activeElement || document.activeElement === document.body || el.contains(document.activeElement);
    const target = lost ? returnTarget(back) : null;
    if (target) target.focus({ preventScroll: true });
    else if (lost && top()) focusables(top().el)[0]?.focus({ preventScroll: true });
  };

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    new MutationObserver(() => (el.hidden ? closed(el) : opened(el))).observe(el, { attributes: true, attributeFilter: ['hidden'] });
    if (!el.hidden) opened(el);
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !top()) return;
    const items = focusables(top().el);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    const inside = top().el.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
  });
}
