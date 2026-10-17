# Puntenbalans (punt 61, met punt 88; uitgebreid in Sprint 14)

Alle getallen staan in `js/data/` (prijzen per lijst, `levels.js`, `SCORING` in `config.js`); de regels
(combo, punten per spoelbeurt, bonus, straffen, level) in `js/scoring.js`. Na elke wijziging:

```bash
npm run balans        # simulatie: minuten tot elk level, tot alles gekocht, en per item
```

`tests/balans.spec.js` bewaakt de streefwaarden hieronder; schuift een getal de balans eruit, dan faalt hij.

## Wat er mis was (stand 2026-10-17, vóór deze aanpassing)

Gemeten met de simulatie, met de regels en getallen van toen:

| Speler | Level 2 | Level 3 | Level 4 | Level 5 | Alles gekocht |
|---|---|---|---|---|---|
| rustig (tikt elke 2,5 s) | 0,9 min | 2,5 | 5,4 | 12 | 48 min |
| gemiddeld (elke 1,2 s) | 0,1 min | 0,3 | 0,5 | 1,1 | **6 min** |
| fanatiek (zo snel als het kan) | 0,1 min | 0,2 | 0,3 | 0,7 | 3,4 min |

1. **De combo liep op tot ×8** voor wie binnen 1,8 s opnieuw tikt. Doortikken gaf ±80 punten per tik; de
   prijzen waren berekend op ±10. Een gemiddelde speler had na zes minuten de hele winkel.
2. **Het level volgde uit je saldo.** Wie iets kocht ging terug in de voortgang naar het volgende level
   ("nog 300 punten tot level 3" werd na een aankoop meer). Sparen werd beloond, kopen bestraft.
3. **Rustig spelen leverde een tiende op van snel spelen**: wie langzamer tikt dan 1,8 s kreeg nooit combo.

## Wat er nu geldt (Sprint 14: 15 levels)

Sprint 13 trok de balans recht, maar met vijf levels was het spel voor een gemiddelde speler na ±1 u 40 "uit".
Sprint 14 (punten 112–116) maakt er een spel van vele uren van, met meer spanning onderweg:

| Wat | Waar | Nu |
|---|---|---|
| Levels | `levels.js` | **15**, met namen in alle talen. Elk level: sneller stijgend water, vaker verstoppingen, en een eigen mix van soorten verstoppingen |
| Soorten verstoppingen (punt 113) | `CLOG_KINDS` in `config.js` | normaal; **snel** (water stijgt ×1,5, bonus ×1,5) vanaf level 3; **hardnekkig** (gereedschap werkt half, bonus ×2) vanaf 4; **dubbel** (meteen een tweede erachteraan) vanaf 6; **mega** (×1,3 sneller én hardnekkig, bonus ×3) vanaf 9 |
| Spitsuur (punt 114) | `RUSH` in `config.js` | vanaf level 3, eerst na 1,5 min en daarna elke 4–6 min speeltijd: 30 s lang punten ×2, verstoppingen ×3 zo vaak. Zonder overlopen doorstaan: bonus 150 × level |
| Gereedschap verbeteren (punt 115) | `UPGRADE` in `config.js`, prijzen per gereedschap in `tools.js` | werkend gereedschap uit de winkel krijgt tot 3 sterren: +20% kracht en −15% afkoeltijd per ster. Ster 1/2/3 op level 5/9/13 (of later: nooit eerder dan het gereedschap zelf + 1) |
| Punten per spoelbeurt | `SCORING` | 10 × combo (tot ×2), +5% per level (level 15: ×1,7) |
| Ontstopbonus | `SCORING` | 30, met hetzelfde levelvoordeel, × de bonus van de soort |
| Overlopen | `SCORING` | 10% van je saldo, hooguit 250 × level |
| Prijzen | `js/data/` | de duurdere spullen zijn over de levels 4–15 verspreid, zodat elk level iets vrijspeelt; de gouden troon (250.000) is de beloning van level 15 |
| Level volgt uit | | alles wat je ooit verdiend hebt (`earned`): kopen kost geen voortgang |

Combo, venster (3 s) en de straf voor vuil zijn gelijk gebleven aan Sprint 13. Bestaande spelers houden hun level;
een gekocht item blijft van hen, ook als het nu pas op een hoger level te koop is.

## Streefwaarden en uitkomst

De simulatie (`tools/balans.mjs`) tikt in een vast tempo, pakt bij een verstopping het sterkste werkende
gereedschap dat klaar is, leegt de emmer en spaart in een vaste volgorde: eerst repareren en een wc-borstel, dan
werkend gereedschap en sterren (op volgorde van level), dan de rest van goedkoop naar duur. Ze speelt met de soorten
verstoppingen en het spitsuur. Het is een schatting om getallen te vergelijken, geen voorspelling.

| Level | rustig (tikt elke 2,5 s) | gemiddeld (elke 1,2 s) | fanatiek |
|---|---|---|---|
| 2 | 7 min | 3 min | 2 min |
| 3 | 19 min | 9 min | 5 min |
| 5 | 1 u 20 | 40 min | 24 min |
| 8 | 5 u | 2 u 45 | 1 u 40 |
| 10 | 9 u | 5 u | 3 u |
| 12 | 15 u | 8 u | 5 u |
| 15 | 26 u | **15 u** | 9 u 30 |
| alles gekocht én level 15 | 28 u | 16 u | 10 u |

Streefwaarden (de test): gemiddeld level 2 tussen 1,5 en 6 min, level 5 tussen 25 en 70 min, level 10 tussen 3 en
8 uur, level 15 tussen 10 en 25 uur, alles binnen 30 uur; een rustige speler is binnen 50 uur klaar en doet er
hooguit vier keer zo lang over als een fanatieke; werkend gereedschap kost hooguit een uur spelen op het level
waarop het vrijkomt, elke ster hooguit anderhalf uur.

Punten per minuut (gemiddelde speler): level 1 ±900, level 5 ±1.450, level 10 ±1.900, level 15 ±2.450.
De nagespeelde speler loopt bijna nooit over: hij reageert altijd even snel. Echte spelers zijn trager en
missen er een; daar zit de spanning.

## Loont schoonmaken?

Ja. Elke vieze plek kost 10% van de punten per spoelbeurt. Op level 1 is dat ±90 punten per minuut per plek.
Een spons (300) haalt twee vlekken weg en verdient zich dus binnen twee minuten terug; een wc-borstel (400)
maakt het toilet twee keer schoon. Repareren (samen 1.650) haalt de extra kans op verstoppingen (×1,5) weg en is
voor een gemiddelde speler na ±2 minuten betaald.

## Minuten spelen per item (gemiddelde speler)

Prijs gedeeld door wat je verdient op het level waarop het te koop komt. Volledige lijst, ook voor rustige en
fanatieke spelers en met alle sterren: `npm run balans`.

| Item | Prijs | Level | Minuten |
|---|---|---|---|
| Lijm & reparatieset, spons | 300 | 1 | 0,3 |
| Toiletveer, houten emmer, houten vloer | 750 | 1 | 0,8 |
| Ontstoppingsmiddel | 1.500 | 2 | 1,4 |
| Ninja-ontstopper | 2.500 | 3 | 2 |
| Superplopper | 6.000 | 4 | 4 |
| Eerste ster (toiletveer … superplopper) | 5.000–10.000 | 5 | 3–7 |
| Elektrische ontstopper | 15.000 | 6 | 10 |
| Ruimtetoilet | 25.000 | 7 | 16 |
| Hogedrukspuit | 40.000 | 8 | 24 |
| Robotarm | 100.000 | 11 | 50 |
| Lavavloer | 60.000 | 12 | 29 |
| Derde ster robotarm | 200.000 | 14 | 86 |
| Gouden troon | 250.000 | 15 | 102 |

## Nog niet meegenomen

- Chaos-gereedschap gebruikt de simulatie niet; het lost niets op en kost alleen tijd.
- Troep op de muren na drie keer overlopen: de nagespeelde speler loopt bijna nooit over.
- De puntenpakketten (echt geld) zijn niet opnieuw geprijsd na Sprint 14; met 15 levels is een pakket relatief
  minder waard. Dat is een keuze voor vlak voor punt 60.
