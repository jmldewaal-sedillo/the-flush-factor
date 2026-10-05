# The Flush Factor — ROADMAP 🗺️

## ✅ Versie 0.1 — Werkende basisversie (huidig)

### Gebouwd
- **Spelscherm**: Badkamerscène met cartoonesk toilet (SVG), waterstandbalk, statusberichten.
- **Spoelmechaniek**: Tik op de knop → punten + animatie + combo-systeem.
- **Verstoppingssysteem** (`clog.js`):
  - Willekeurige verstopping met oplopende kans naarmate je langer speelt.
  - Configureerbaar via `CLOG_CONFIG` (kansen, waterstijgsnelheid, overflow-drempel).
  - Water stijgt bij verstopping, daalt als vrij.
  - Overloop → puntenverlies + combo-reset.
- **Inventaris** met 8 gereedschappen:
  - 4 werkend: Ontstopper, Toiletveer, Ontstoppingsmiddel, Emmer Heet Water.
  - 4 chaos: Rubberen Eendje (eendjes), Confettikanon, Opblaasbare Flamingo, Discobal.
  - Ontdekkingssysteem: speler ontdekt zelf welke werken (badge na eerste gebruik).
  - Cooldown-overlay per tool.
- **Winkel** (`shop.js`):
  - Tabbladen: Gereedschap / Cosmetica.
  - Premiumgereedschappen: Super Ontstopper 3000, Ninja Ontstopper, Toverstaf, Mini Olifant.
  - Cosmetica: 4 toiletmodellen, 4 tegelpatronen, 4 vloeren, 5 decoraties.
- **Cosmeticasysteem**: wand/tegel/vloer/toilet/decoratie direct zichtbaar in spel.
- **Voortgangsopslag**: alles in `localStorage` (score, highscore, inventaris, cosmetica).
- **PWA**: `manifest.json` + `sw.js` (offline speelbaar).
- **Mobile-first**: portretstand, touch-bediening, grote knoppen.

---

## 🔜 Versie 0.2 — Verbeteringen & uitbreiding

### Prioriteit hoog
- [ ] **Geluidseffecten** via Web Audio API: plons bij spoelen, blorp bij verstopping, feest bij oplossen.
- [ ] **Dagelijkse uitdagingen**: "Spoel 50× vandaag voor bonuspunten."
- [ ] **Prestaties/badges**: bijv. "Eerste overloop overleefd", "Ninja Combo × 8".
- [ ] **Betere PWA-iconen**: echte PNG-iconen in meerdere maten (192×192, 512×512).
- [ ] **Splashscherm**: titelscherm met start-knop bij eerste bezoek.

### Prioriteit middel
- [ ] **Animaties verbeteren**: vloeiendere wateranimatie, bubbels in de kom bij verstopping.
- [ ] **Extra gereedschappen**: Vacuümpomp, Hydrojet, etc.
- [ ] **Extra cosmetica**: seizoensgebonden items (kerst-toilet, zomer-strandtoilet).
- [ ] **Tutorial**: eerste 3 verstoppingen worden begeleid.
- [ ] **Snelheidsmodus**: optie om spoelcyclus te versnellen voor gevorderde spelers.

### Prioriteit laag
- [ ] **Statistiekenscherm**: totaal spoelen, totaal verstoppingen, beste combo.
- [ ] **Dagelijks bonus**: beloningssysteem voor dagelijks terugkeren.

---

## 🚀 Versie 1.0 — Play Store release

- [ ] **TWA-integratie**: Digital Asset Links (`/.well-known/assetlinks.json`), Bubblewrap-configuratie.
- [ ] **Privacybeleid** (vereist voor Play Store).
- [ ] **Reclame-integratie** (optioneel): AdMob via TWA.
- [ ] **In-app aankopen** (optioneel): punten kopen via Google Play Billing.
- [ ] **Volledige offline test** op Android-apparaat.
- [ ] **Prestatieoptimalisatie**: Lighthouse-score ≥ 90.

---

## 💡 Toekomstige ideeën

- Multiplayer: wie haalt de meeste punten in 60 seconden?
- Seizoensgebonden events: "Kerst Chaos" met kersttegels.
- Mini-games bij verstopping: swipe-puzzel om te entstoppen.
- Toilet-upgrades die passieve punten geven.
- Ranglijst (lokaal of online).

---

*Bijgewerkt: versie 0.1 — initiële release.*
