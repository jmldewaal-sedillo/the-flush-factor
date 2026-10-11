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

Stand van zaken:

- [x] Privacyverklaring en verwijderpagina bestaan, in alle tien talen (`privacy.html`, `delete.html`).
- [ ] Die pagina's op de hoofdsite (minimaal EN en NL), via `tools/hoofdsite-toevoegen.sh` na akkoord.
- [x] In de app: profiel verwijderen, alle gegevens verwijderen, voortgang overzetten.
- [x] `docs/privacy-audit.md` klopt met wat het spel bewaart (een test bewaakt dat).
- [ ] Vertalingen nagekeken door moedertaalsprekers.
- [ ] EU-U.S. Data Privacy Framework geldt nog voor GitHub en Google (de privacytekst gaat daarvan uit).
- [ ] Data Safety: "geen gegevens verzameld of gedeeld", zolang inloggen en aankopen niet actief zijn.
- [ ] Contentclassificatie (IARC): let op de toilethumor.
- [ ] Store-materiaal in `store/` compleet.
- [ ] Omgezet naar de drie bouwdoelen; Android-app gebouwd met Capacitor en getest in de interne test.
- [ ] Gesloten test: 12 testers, 14 dagen.
- [ ] Op een echte telefoon getest via het testadres.
- [ ] 72. Play Store-beleid en 73. regels nagelopen (ROADMAP).
