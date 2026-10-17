# Puntenbalans (punt 61, met punt 88)

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

## Wat er nu geldt

| Wat | Was | Nu | Waarom |
|---|---|---|---|
| Combo: maximum | ×8 | **×2** | Snel tikken loont, maar niet buiten proportie |
| Combo: stap per tik | 0,5 | **0,25** | Vier tikken tot de hoogste combo |
| Combo: venster | 1,8 s | **3 s** | Beloont doorspelen, niet zo snel mogelijk tikken; ook rustig spelen haalt combo |
| Punten per spoelbeurt | 10 | 10 | Ongewijzigd; zo blijft "vies kost 10%" zichtbaar, ook bij de laagste combo |
| Alle prijzen in de winkel | | **×5** | Passend bij wat je per minuut verdient |
| Punten in de pakketten (echt geld) | 500 / 1.500 / 5.000 / 15.000 | **2.500 / 7.500 / 25.000 / 75.000** | Mee ×5, zodat een pakket evenveel waard blijft; de europrijzen zijn gelijk. Product-id's mee hernoemd (nog niet in de Play Console) |
| Level-drempels | 200 / 600 / 1.500 / 4.000 | **2.500 / 9.000 / 24.000 / 50.000** | Afgesteld met de simulatie |
| Level volgt uit | saldo | **alles wat je ooit verdiend hebt** (`earned`) | Kopen kost geen voortgang meer |
| Overlopen: maximale straf | 100 | **500** | 10% van het saldo blijft; het plafond schaalt mee met de prijzen |

**Bestaande spelers** (opslag versie 4 of ouder): saldo en hoogste score ×5, zodat ze er evenveel voor kunnen
kopen; hun level blijft (zakt nooit), en "verdiend" begint bij het hoogste saldo ooit, minstens de drempel van
hun level. Getest in `tests/balans.spec.js`.

## Streefwaarden en uitkomst

De simulatie (`tools/balans.mjs`) tikt in een vast tempo, pakt bij een verstopping het beste werkende
gereedschap, leegt de emmer en koopt eerst reparaties en een wc-borstel, dan werkend gereedschap en dan de
rest. Het is een schatting om getallen te vergelijken, geen voorspelling.

| Speler | Level 2 | Level 3 | Level 4 | Level 5 | Alles gekocht |
|---|---|---|---|---|---|
| rustig (tikt elke 2,5 s) | 5,9 min | 19 | 47 | 90 | 182 min |
| gemiddeld (elke 1,2 s) | 2,8 min | 9,2 | 23 | 46 | **98 min** |
| fanatiek (zo snel als het kan) | 1,6 min | 5,4 | 14 | 28 | 61 min |

Streefwaarden (de test): gemiddeld level 2 tussen 1,5 en 6 min, level 5 tussen 30 en 90 min, alles tussen 1 en
4 uur; een rustige speler kan binnen 10 uur alles kopen en doet er hooguit vier keer zo lang over als een
fanatieke; elk werkend gereedschap kost hooguit een kwartier spelen op het level waarop het vrijkomt.

Punten per minuut (gemiddelde speler): level 1 ±900, level 5 ±1.250.

## Loont schoonmaken?

Ja. Elke vieze plek kost 10% van de punten per spoelbeurt. Op level 1 is dat ±90 punten per minuut per plek.
Een spons (300) haalt twee vlekken weg en verdient zich dus binnen twee minuten terug; een wc-borstel (400)
maakt het toilet twee keer schoon. De duurdere middelen (hogedrukreiniger 6.000 voor 20 vlekken) zijn per
vlek goedkoper, maar pas op level 4 te koop. Repareren (samen 1.650) haalt de extra kans op verstoppingen
(×1,5) weg en is voor een gemiddelde speler na ±2 minuten betaald.

## Minuten spelen per item (gemiddelde speler)

Prijs gedeeld door wat je verdient op het level waarop het te koop komt. Volledige lijst, ook voor rustige en
fanatieke spelers: `npm run balans`.

| Item | Prijs | Level | Minuten |
|---|---|---|---|
| Lijm & reparatieset, spons | 300 | 1 | 0,3 |
| Wc-borstel | 400 | 1 | 0,4 |
| Nieuwe bril | 600 | 1 | 0,7 |
| Toiletveer, houten emmer, houten vloer | 750 | 1 | 0,8 |
| Ontstoppingsmiddel | 1.500 | 2 | 1,5 |
| Plastic emmer | 2.500 | 2 | 2,5 |
| Ninja-ontstopper | 2.500 | 3 | 2,4 |
| Elektrische ontstopper | 3.750 | 3 | 3,5 |
| Hogedrukspuit | 7.500 | 4 | 6,6 |
| Gouden troon | 10.000 | 5 | 8,0 |
| Robotarm | 15.000 | 5 | 12 |

## Nog niet meegenomen

- Chaos-gereedschap gebruikt de simulatie niet; het lost niets op en kost alleen tijd.
- Troep op de muren na drie keer overlopen: een goede speler laat het zelden zo ver komen.
- De puntenpakketten (echt geld) zijn alleen meegeschaald, niet opnieuw geprijsd; dat is een keuze voor
  vlak voor punt 60.
