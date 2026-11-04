// spoelicoon-preview.html: de vijf varianten (los bestand vanwege de Content-Security-Policy, Sprint 16).
const VARIANTS = [
  { id: 'A', name: 'Draaikolk (huidig)', note: 'De kolk van nu (game-icons.net, Lorc).', use: 'assets/icons/sprite.svg#flush' },
  { id: 'B', name: 'Spoelhendel', note: 'Ouderwetse hendel aan de stortbak; past bij het kapotte begin.', use: '#v-lever' },
  { id: 'C', name: 'Druppel met kolk', note: 'Water dat wegdraait; ook klein goed leesbaar.', use: '#v-drop' },
  { id: 'D', name: 'Stortbak met pijl', note: 'Stortbak, pijl naar beneden, pot: het meest letterlijk.', use: '#v-tank' },
  { id: 'E', name: 'Drukknop met twee standen', note: 'De moderne spoelknop met grote en kleine spoeling.', use: '#v-dual' },
];
const STATES = [['', 'normaal'], ['clogged', 'verstopt'], ['pressed', 'ingedrukt'], ['small', 'klein']];
const icon = use => `<svg class="ic" aria-hidden="true"><use href="${use}"/></svg>`;
document.getElementById('variants').innerHTML = VARIANTS.map(v => `
  <section class="variant" data-variant="${v.id}">
    <h2>${v.id} · ${v.name}</h2>
    <p>${v.note}</p>
    <div class="row">${STATES.map(([cls, label]) => `
      <div class="cell"><div class="btn ${cls}" role="img" aria-label="${v.name}, ${label}">${icon(v.use)}</div>${label}</div>`).join('')}
    </div>
  </section>`).join('');
