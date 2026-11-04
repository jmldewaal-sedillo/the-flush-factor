# Play Console invullen — The Flush Factor (punt 72)

*Voorbereid door Claude op 4 november 2026 (Sprint 16), voor de eerste upload naar de interne test. Dit zijn
voorstellen op basis van wat het spel nu doet (`docs/privacy-audit.md`, `js/data/config.js`). Jenn vult de
formulieren zelf in en beslist; kijk de vragen vlak voor het invullen na, want Google past ze soms aan. Dit is
geen juridisch advies.*

Uitgangspunt: zoals het spel nu is. **Geen accounts, geen aankopen, geen advertenties, geen tracking, niets
verstuurd** (`ADVERTENTIES`, `AANKOPEN` en `INLOGGEN` staan op `false`). Gaat een van die schakelaars aan, dan
moeten de antwoorden hieronder opnieuw, vóór die versie uitkomt.

## 1. App maken

| Veld | Antwoord |
|---|---|
| App-naam | The Flush Factor |
| Standaardtaal | Engels (Verenigde Staten) – en-US. Nederlands erbij als vertaling (zie 8) |
| App of game | Game |
| Gratis of betaald | Gratis (de prijs; in de store-tekst staat het woord niet) |
| Verklaringen | Programmabeleid en exportwetten: pas aanvinken als `docs/publiceren.md`, "Verklaringen bij App maken", helemaal klaar is |

## 2. App-content (Beleid → App-content)

### Privacybeleid
`https://studiosedillo.com/the-flush-factor/privacy` — **eerst op de hoofdsite zetten** (ROADMAP, "Volgende").

### App-toegang
"Alle functionaliteit is beschikbaar zonder speciale toegang." (Geen inloggen, geen code.)

### Advertenties
"Nee, mijn app bevat geen advertenties."

### Contentclassificatie (IARC-vragenlijst)
Categorie: **Game** (of "Alle andere apptypen" als Google dat vraagt voor een casual spel: nee, kies Game).
Voorstel voor de antwoorden (eerlijk naar wat er in het spel zit):

| Vraag (verkort) | Antwoord | Waarom |
|---|---|---|
| Geweld | Nee | Gereedschap ontstopt een toilet; niemand of niets wordt verwond |
| Angst, horror | Nee | |
| Seksualiteit, naaktheid | Nee | |
| Grof taalgebruik | Nee | Brutaal en droog, maar geen scheldwoorden (nagekeken in `js/i18n/`) |
| Grove humor / toilethumor | **Ja** (als de vragenlijst ernaar vraagt) | Het hele spel draait om een wc: vlekken, klodders en troep, cartoonesk |
| Drugs, alcohol, tabak | Nee | |
| Gokken, gesimuleerd gokken | Nee | Geen inzet, geen loot boxes; verstoppingen komen willekeurig, maar je wint of verliest er niets mee |
| Interactie tussen gebruikers, chat | Nee | |
| Deelt locatie | Nee | |
| Digitale aankopen | Nee | `AANKOPEN` staat uit |
| Ongecensureerd internet | Nee | |

Verwachte uitkomst: PEGI 3 of 7, ESRB Everyone (eventueel met "Crude Humor"). Vaststellen doet de vragenlijst.

### Doelgroep en content
- Leeftijdsgroepen: **13–15, 16–17 en 18+** (niet de groepen onder 13). Reden: toilethumor, en een kinder-app
  valt onder het Families-beleid (strenger, en inloggen/aankopen zouden daar nooit mogen). Zie `CLAUDE.md`,
  "Doelgroep": definitief besluit van Jenn.
- "Kan de app per ongeluk kinderen aanspreken?" Eerlijk antwoorden: cartoonstijl en een rubberen eendje kunnen
  kinderen aanspreken. Google kan dan om een toelichting vragen; antwoord dat er geen gegevens verzameld worden,
  niets gekocht kan worden en er geen advertenties zijn.
- Store-vermelding niet op kinderen richten (doet de tekst in `store/` ook niet).

### Gegevensveiligheid (Data safety)
| Vraag | Antwoord |
|---|---|
| Verzamelt of deelt je app een van de vereiste gebruikersgegevens? | **Nee** |
| (Als Google toch doorvraagt) Versleuteld onderweg? | Niet van toepassing: er wordt niets verstuurd |
| Kunnen gebruikers verzoeken hun gegevens te verwijderen? | Ja, in de app (profiel verwijderen, alle gegevens verwijderen) en uitleg op `https://studiosedillo.com/the-flush-factor/delete` |

Waarom "nee": alles staat alleen op het toestel (localStorage van de WebView, `docs/privacy-audit.md`). De
Android-app haalt niets op (alle bestanden zitten erin) en heeft geen back-up naar Google
(`tools/android-instellingen.mjs`). Gegevens die alleen op het toestel blijven tellen volgens Google niet als
"verzameld". Let op: e-mail aan studio.sedillo@gmail.com is contact buiten de app, geen gegevens die de app verzamelt.

### Overige verklaringen
| Onderwerp | Antwoord |
|---|---|
| Overheidsapp | Nee |
| Financiële functies | Nee |
| Gezondheid | Nee |
| Nieuws | Nee |
| Advertentie-ID | "Nee, mijn app gebruikt geen advertentie-ID" (staat er ook expliciet uit: `AD_ID` met `tools:node="remove"`) |
| Account verwijderen | Niet van toepassing: geen accounts. Toch de verwijder-URL opgeven als erom gevraagd wordt |

## 3. Store-vermelding (Groeien → Store-aanwezigheid → Hoofdvermelding)

| Veld | Waar |
|---|---|
| Titel, korte en volledige beschrijving | `store/<taal>/` (tien talen; `node tools/store-klaar.mjs` moet groen zijn) |
| App-icoon 512 × 512 | `assets/icons/app/icon-512.png` (tijdelijk icoon; het echte komt nog) |
| Feature graphic 1024 × 500 | `store/feature-graphic.png` (gemaakt uit `store/feature-graphic.html`) |
| Telefoonscreenshots | `store/screenshots/telefoon/<taal>/` (1080 × 1920) |
| Tablet 7 inch / 10 inch | `store/screenshots/tablet-7/` en `tablet-10/` (en, nl) |
| Categorie | Games → **Casual** |
| Tags | o.a. "Casual", "Simulatie" (kies uit de lijst van Google) |
| E-mail | studio.sedillo@gmail.com |
| Website | https://studiosedillo.com |
| Telefoon | Leeg laten als dat mag; een organisatieaccount toont gegevens publiek |

Beelden opnieuw maken (alleen op verzoek, duurt lang):
`STORE_BEELDEN=1 npx playwright test tests/store-beelden.spec.js --project=phone-portrait`

## 4. Talen van de store-vermelding

Standaard en-US, met vertalingen: nl-NL, de-DE, fr-FR, es-ES, pt-BR, it-IT, pl-PL, tr-TR en id (Indonesisch).
Door Claude geschreven, **nog door niemand nagelezen** (ROADMAP, "Vertalingen laten nakijken").

## 5. Eerste upload: interne test

1. Upload key maken (Jenn, `docs/app.md`, "De upload key").
2. Versie ophogen in `android/app/build.gradle` (`versionCode` 1 is prima voor de eerste upload).
3. `npm run app:sync`, dan in Android Studio **Build → Generate Signed App Bundle** (release) met de upload key.
4. Play Console → Testen → **Interne test** → nieuwe release → `.aab` uploaden; Play App Signing accepteren.
5. Testers: jezelf (e-maillijst), link openen op de telefoon, installeren.
6. Daarna pas de gesloten test (12 testers, 14 dagen) als Google die voor dit organisatieaccount vraagt.

## 6. Nog open vóór productie

Zie `docs/publiceren.md` en ROADMAP, "Voor publicatie in Google Play": pagina's op de hoofdsite, doelgroep
definitief, vertalingen en privacytekst laten nalezen, echt icoon, test op een echte telefoon.
