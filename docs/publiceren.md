# Publiceren op Google Play — checklist voor The Flush Factor

*Begin van de checklist (11 oktober 2026). De volledige lijst met eisen en bronnen staat in de
app-template (`Apps/studio-sedillo-app-template/docs/publiceren.md`); neem die over en lees de bronnen
opnieuw na vlak voor het indienen. Dit is geen juridisch advies.*

Vaste gegevens:

- Uitgever: **Studio Sedillo**, contact **studio.sedillo@gmail.com**.
- Android-app met Capacitor (`Apps/CLAUDE.md`, sectie 11); package name **com.studiosedillo.flushfactor**
- Privacybeleid: `https://studiosedillo.com/the-flush-factor/privacy`
- Gegevens verwijderen: `https://studiosedillo.com/the-flush-factor/delete`
- Geen app-website op een subdomein tot Jenn "lanceren web" zegt.

Nog te besluiten door Jenn:

- **Doelgroep en leeftijd.** Aanname nu: algemeen publiek, geen kinder-app (toilethumor, en er zijn
  knoppen voor inloggen en echt geld voorbereid). Bij "ook voor kinderen onder 13": geen inloggen via
  Google/Facebook, een ouderslot voor gegevens verwijderen, en het Families-beleid.
- **Inloggen en punten kopen**: de knoppen staan er, zonder werking. Vóór publicatie: óf weghalen, óf
  echt maken. Echt maken betekent eerst de privacyverklaring en Data Safety bijwerken.
- **Advertenties en aankopen**: uit. Pas mogelijk nadat het zakelijke postadres bij de KvK is vastgelegd en
  het bezoekadres is afgeschermd, en dan alleen na akkoord van Jenn (sectie 11, punt 5).

## Ontwikkelaarsaccount zakelijk maken (wens van Jenn, 2026-10-18)

Het Play Console-account is nu persoonlijk; Jenn wil het op de KvK (eenmanszaak Studio Sedillo). Nagekeken op
2026-10-18 in de Play Console Help (bronnen onderaan); vlak voor het omzetten opnieuw lezen.

1. **Eerst het adres.** Een organisatieaccount toont op Google Play altijd de wettelijke naam, het **adres**, het
   e-mailadres en het **telefoonnummer**, ook zonder advertenties of aankopen. Het adres komt uit het betaalprofiel
   (KvK-gegevens). Dus vóór het omzetten: zakelijk postadres bij de KvK vastgelegd en het bezoekadres afgeschermd
   (`Apps/CLAUDE.md`, sectie 11, punt 5).
2. **D-U-N-S-nummer**: verplicht. Opzoeken of gratis aanvragen bij Dun & Bradstreet (kan tot 30 dagen duren). Geen
   betaalde tussenpartij gebruiken.
3. **Telefoonnummer** dat publiek mag (zakelijk nummer).
4. **Website verifiëren** in de Console (studiosedillo.com); pas daarna verschijnt "Account type wijzigen".
   *Stand 2026-10-18: studiosedillo.com is geverifieerd in Google Search Console (domein-property, TXT-record
   `google-site-verification` in Cloudflare; dat record laten staan). Nog te doen: de website in de Play Console invullen.*
5. Het persoonlijke account moet volledig geverifieerd zijn (geen waarschuwingen op de startpagina).
6. Ontwikkelaarsaccount > Over jou > **Account type wijzigen**: nieuw zakelijk betaalprofiel met het D-U-N-S-nummer,
   type "bedrijf", grootte, telefoon; contactgegevens voor Google en voor de winkelvermelding (met code
   bevestigen); eventueel documenten uploaden (KvK-uittreksel). Daarna het betaalprofiel koppelen en bevestigen.
7. **Kan niet terug.** Na het omzetten minstens 72 uur wachten voordat je een app indient.
8. Gevolg: de gesloten test met 12 testers / 14 dagen geldt volgens meerdere (niet-Google) bronnen niet voor
   organisatieaccounts. In de Console nakijken na het omzetten.

Bronnen: https://support.google.com/googleplay/android-developer/answer/16260648 (omzetten),
https://support.google.com/googleplay/android-developer/answer/13634885 (accounttypen, D-U-N-S),
https://support.google.com/googleplay/android-developer/answer/13628312 (wat publiek getoond wordt),
https://support.google.com/googleplay/android-developer/answer/14151465 (testeis).


- [x] Privacyverklaring en verwijderpagina bestaan, in alle tien talen (`privacy.html`, `delete.html`).
- [ ] Die pagina's op de hoofdsite (minimaal EN en NL), via `tools/hoofdsite-toevoegen.sh` na akkoord.
- [x] In de app: profiel verwijderen, alle gegevens verwijderen, voortgang overzetten.
- [x] `docs/privacy-audit.md` klopt met wat het spel bewaart (een test bewaakt dat).
- [ ] Vertalingen nagekeken door moedertaalsprekers.
- [ ] Privacytekst nagekeken door iemand met verstand van de AVG.
- [ ] EU-U.S. Data Privacy Framework geldt nog voor GitHub en Google (de privacytekst noemt het). Stand op
      2026-10-12: van kracht; hoger beroep C-703/25 P loopt nog. Vlak voor publicatie opnieuw nakijken.
- [ ] Data Safety: "geen gegevens verzameld of gedeeld", zolang inloggen en aankopen niet actief zijn.
- [ ] Contentclassificatie (IARC): let op de toilethumor.
- [ ] Store-materiaal in `store/` compleet.
- [ ] Omgezet naar de drie bouwdoelen; Android-app gebouwd met Capacitor en getest in de interne test.
- [ ] Gesloten test: 12 testers, 14 dagen.
- [ ] Op een echte telefoon getest via het testadres.
- [ ] 72. Play Store-beleid en 73. regels nagelopen (ROADMAP).
