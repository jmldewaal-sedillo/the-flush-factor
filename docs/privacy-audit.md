# Privacy-audit — The Flush Factor

Wat dit spel op het toestel bewaart, waarom en hoe lang. Bijwerken bij elke nieuwe sleutel;
`tests/storage.spec.js` faalt als het spel een sleutel schrijft die hier niet staat.

*Laatst nagelopen: 2026-10-11.*

## Uitgangspunt

Alles blijft op het toestel. Er is geen server, geen account, geen tracking, geen advertentie.
De enige code die de opslag aanraakt is `js/storage.js` (en `js/phone-preview.js` voor zijn eigen
voorkeur, zie onder).

## Sleutels in localStorage (prefix `flushfactor.`)

| Sleutel | Wat erin staat | Waarom | Hoe lang |
|---|---|---|---|
| `flushfactor.settings` | `language` (gekozen taal), `toolsOpen` (gereedschap in- of uitgeklapt), `shopOpen` (welke winkelcategorieën openstaan), `preview` (voorkeur van de ontwikkel-preview op brede schermen) | Zodat de app de volgende keer hetzelfde opent | Tot de speler alles verwijdert |
| `flushfactor.profiles` | Lijst met het ene profiel: id `p1` en de naam die de speler eventueel intypte | Zelfde vorm als de andere apps; nodig voor "Profiel verwijderen" | Tot het profiel of alles wordt verwijderd |
| `flushfactor.profile.p1.game` | De spelstand: punten, hoogste score, level, reeksen, emmer en inhoud, gekochte spullen, gereedschap, decoratie, staat van het toilet, vlekken, voorraad schoonmaakspullen, geluid aan/uit en volume, statistieken (aantal keer gespoeld en ontstopt, liters), en het profiel (naam of bijnaam, avatar, aanmaakdatum) | Verder spelen waar je was | Tot het profiel of alles wordt verwijderd |

De enige persoonsgegevens zijn dus een **zelfgekozen naam of bijnaam** (niet verplicht; leeg = "Gast").

## Oude sleutels (tot en met Sprint 9), worden bij de eerste start overgezet en dan gewist

| Oude sleutel | Gaat naar |
|---|---|
| `flushfactor_v1` | `flushfactor.profile.p1.game` (de taal naar `flushfactor.settings`) |
| `flushfactor_shop_open` | `flushfactor.settings` → `shopOpen` |
| `flushfactor_tools_open` | `flushfactor.settings` → `toolsOpen` |
| `flushfactor_preview_*` | `flushfactor.settings` → `preview` |

De migratie staat in `js/storage.js` (`migrateLegacy`), de test in `tests/storage.spec.js`.

## Cache (bestanden voor gebruik zonder internet)

| Cache | Wat | Hoe lang |
|---|---|---|
| `flushfactor-<versie>` | De bestanden van het spel zelf (html, css, js, modellen, textures, lettertypen) | Tot een nieuwe versie hem vervangt, of tot "Alle gegevens verwijderen" |

## Niet gebruikt

sessionStorage, IndexedDB, cookies: niets. Geen verzoeken naar andere servers dan het adres van het
spel zelf (een test bewaakt dat).

## Verwijderen en meenemen

- **Profiel verwijderen** (scorebubbel → Gegevens): wist `flushfactor.profile.p1.*` en `flushfactor.profiles`.
- **Alle gegevens van deze app verwijderen**: wist elke `flushfactor.`-sleutel, de oude sleutels, alle caches en de service worker.
- **Voortgang overzetten**: maakt een code (of bestand) met de inhoud van de sleutels hierboven. Er wordt niets verstuurd.

## Nog niet actief, wel voorbereid

- Inloggen met Google/Facebook (`js/auth.js`) en punten kopen (`js/purchases.js`): knoppen zonder
  werking; ze versturen niets. **Vóór** die live gaan: privacyverklaring en Data Safety bijwerken
  (CLAUDE.md §5).
