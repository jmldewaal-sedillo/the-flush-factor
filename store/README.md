# Materiaal voor Google Play — The Flush Factor

Alles wat in Play Console bij de store-vermelding ingevuld of geüpload wordt. Wat je in de formulieren
invult (IARC, Data safety, doelgroep): `docs/play-store.md`.

```
store/
  en-US/ nl-NL/ de-DE/ fr-FR/ es-ES/ pt-BR/ it-IT/ pl-PL/ tr-TR/ id/
    titel.txt                   hoogstens 30 tekens
    korte-beschrijving.txt      hoogstens 80 tekens
    volledige-beschrijving.txt  hoogstens 4000 tekens
  feature-graphic.html/.css     bron van de feature graphic
  feature-graphic.png           1024 × 500, zonder alfa (in Git)
  screenshots/                  NIET in Git (±56 MB), lokaal opnieuw te maken:
    telefoon/<taal>/            1080 × 1920, zes per taal, alle tien talen
    tablet-7/en/ nl/            1080 × 1920
    tablet-10/en/ nl/           1800 × 3200
```

Teksten: door Claude geschreven (nl en en concept van Jenn), de acht andere talen nog door niemand
nagelezen. `node tools/store-klaar.mjs` moet groen zijn vóór het uploaden.

Beelden maken (± 20 minuten, overschrijft screenshots/ en feature-graphic.png):
`STORE_BEELDEN=1 npx playwright test tests/store-beelden.spec.js --project=phone-portrait --workers=2`.
Het app-icoon 512 × 512 staat in `assets/icons/app/icon-512.png` (nog tijdelijk). Formaten en
regels: `Apps/studio-sedillo-app-template/store/README.md`.

| Veld | Waarde |
|---|---|
| Ontwikkelaar | Studio Sedillo |
| E-mail | studio.sedillo@gmail.com |
| Website | https://studiosedillo.com |
| Privacybeleid | https://studiosedillo.com/the-flush-factor/privacy |
| Gegevens verwijderen | https://studiosedillo.com/the-flush-factor/delete |
| Package-naam | `com.studiosedillo.flushfactor` |
