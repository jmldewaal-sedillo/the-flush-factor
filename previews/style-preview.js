// style-preview.html: de drie stijlrichtingen (los bestand vanwege de Content-Security-Policy, Sprint 16).
const I = (name, size) => `<svg class="ic" width="${size}" height="${size}" aria-hidden="true"><use href="assets/icons/sprite.svg#${name}"/></svg>`;

const DIRECTIONS = [
  { cls: 't-sticker', letter: 'A', name: 'Sticker', display: 'Lilita One', body: 'Nunito',
    blurb: 'Dikke omlijning, harde schaduw, alles een tikje scheef. Voelt als een vel stickers op de wc-deur: brutaal en vrolijk.',
    colors: ['--primary', '--danger', '--scene', '--accent', '--ok', '--paper', '--ink'] },
  { cls: 't-tegel', letter: 'B', name: 'Tegelwerk', display: 'Bungee', body: 'Rubik',
    blurb: 'Delfts blauw op witte tegels, knoppen als emaille bordjes. Strak en vierkant: de humor zit in de deftigheid.',
    colors: ['--accent', '--primary', '--danger', '--ok', '--scene-line', '--paper', '--ink'] },
  { cls: 't-strip', letter: 'C', name: 'Stripboek', display: 'Bangers', body: 'Comic Neue',
    blurb: 'Zwarte inkt, rasterpunten, tekstballonnen en knal-sterren. Elke verstopping is een stripplaatje: het luidst van de drie.',
    colors: ['--primary', '--danger', '--scene', '--ok', '--paper', '--ink'] },
];

const AVATARS = ['duck', 'flamingo', 'elephant', 'ninja', 'crown', 'rocket'];

document.getElementById('directions').innerHTML = DIRECTIONS.map(d => `
<section class="direction ${d.cls}">
  <div class="direction-head">
    <h2>${d.letter} · ${d.name}</h2>
    <p>${d.blurb}</p>
  </div>

  <div class="block">
    <h3>Kleurpalet</h3>
    <div class="swatches">${d.colors.map(c => `<span class="swatch" data-color="${c}" title="${c}"></span>`).join('')}</div>
  </div>

  <div class="block">
    <h3>Lettertype</h3>
    <div class="display type-display">Verstopt! Pak de ontstopper</div>
    <div class="type-body">Spoel, ontstop en verzamel 1.250 punten voor een nieuwe emmer. Het gaat vaker mis dan je denkt.</div>
    <div class="type-name">Koppen: ${d.display} · Tekst: ${d.body} (beide SIL Open Font License)</div>
  </div>

  <div class="block">
    <h3>Knoppen en meldingen</h3>
    <div class="scene">
      <button class="btn">Spelen als gast</button>
      <button class="btn round shop" aria-label="Winkel">${I('shopping-cart', 26)}</button>
      <button class="btn round danger" aria-label="Emmer legen">${I('trash-2', 24)}</button>
      <span class="message">${I('triangle-alert', 20)}Verstopt!</span>
      <span class="message good">${I('circle-check', 20)}Ontstopt!</span>
    </div>
  </div>

  <div class="block">
    <h3>Scorebubbel en spoelknop</h3>
    <div class="scene">
      <div class="score">
        <span class="score-top">${I('duck', 26)}<b>1.250</b></span>
        <small>Beste: 3.400</small>
        <span class="pills"><span class="pill">${I('toilet', 12)}×12</span><span class="pill">${I('trophy', 12)}31</span><span class="pill">Lv.3</span></span>
      </div>
      <button class="flush" aria-label="Spoelen">${I('flush', 46)}</button>
    </div>
  </div>

  <div class="block">
    <h3>Gereedschap: onbekend · werkt (afkoelen) · chaos</h3>
    <div class="scene scene-tools">
      <div class="tool-wrap"><div class="tool unknown">${I('spring', 30)}<span class="badge">?</span></div><div class="tool-label">onbekend</div></div>
      <div class="tool-wrap"><div class="tool working cooling"><svg class="ring" viewBox="0 0 74 74"><circle class="track" cx="37" cy="37" r="32"/><circle class="fill" cx="37" cy="37" r="32"/></svg>${I('plunger', 30)}<span class="badge">${I('check', 14)}</span><span class="secs">8s</span></div><div class="tool-label">werkt</div></div>
      <div class="tool-wrap"><div class="tool chaos">${I('duck', 30)}<span class="badge">${I('zap', 13)}</span></div><div class="tool-label">chaos</div></div>
    </div>
  </div>

  <div class="block">
    <h3>Winkelkaart: te koop (nieuw) · in bezit</h3>
    <div class="scene scene-cards">
      <div class="card"><span class="tag">Nieuw!</span><span class="icon">${I('bucket-metal', 38)}</span><span class="name">Zinken emmer</span><span class="detail">75 liter</span><span class="desc">Voor de serieuze verzamelaar.</span><span class="price">${I('coins', 14)}900</span></div>
      <div class="card owned"><span class="icon">${I('flower-pot', 38)}</span><span class="name">Badkamerplant</span><span class="desc">Zelfs planten overleven hier.</span><span class="price">${I('check', 14)}In bezit</span></div>
    </div>
  </div>

  <div class="block block-last">
    <h3>Welkomstscherm</h3>
    <div class="scene column">
      <div class="welcome">
        <h4>Welkom bij The Flush Factor</h4>
        <p>Kies een naam en een avatar en begin meteen.</p>
        <div class="identity"><span class="avatar-big">${I('duck', 34)}</span><span class="field">Gast</span></div>
        <div class="avatars">${AVATARS.map((a, i) => `<span class="${i === 0 ? 'on' : ''}">${I(a, 24)}</span>`).join('')}</div>
        <button class="btn">Spelen als gast</button>
        <div class="or">Of log in</div>
        <div class="auth"><span>Inloggen met Google</span><span class="soon">Binnenkort</span></div>
        <div class="auth"><span>Inloggen met Facebook</span><span class="soon">Binnenkort</span></div>
      </div>
    </div>
  </div>
</section>`).join('');
// Kleurvakjes: de kleur via de stijl van het element (de CSP verbiedt style-attributen in HTML).
document.querySelectorAll('.swatch[data-color]').forEach(el => { el.style.background = `var(${el.dataset.color})`; });
