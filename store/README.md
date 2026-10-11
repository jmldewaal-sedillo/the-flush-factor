# Materiaal voor Google Play — The Flush Factor

Alles wat in Play Console bij de store-vermelding ingevuld of geüpload wordt. Nog een begin:
alleen de teksten in het Nederlands en Engels staan er (concept, door Jenn na te lezen).

```
store/
  nl-NL/  en-US/           teksten per taal (map = taalcode van Play Console)
    titel.txt              hoogstens 30 tekens
    korte-beschrijving.txt hoogstens 80 tekens
    volledige-beschrijving.txt  hoogstens 4000 tekens
  screenshots/             nog maken: telefoon en tablet, per taal
```

Nog te maken: feature graphic (1024 × 500), app-icoon 512 × 512 (staat nu in
`assets/icons/app/icon-512.png`), screenshots, en de teksten in de andere acht talen.
De vereiste formaten en de vaste gegevens voor het formulier staan in de app-template:
`Apps/studio-sedillo-app-template/store/README.md`.

| Veld | Waarde |
|---|---|
| Ontwikkelaar | Studio Sedillo |
| E-mail | studio.sedillo@gmail.com |
| Website | https://studiosedillo.com |
| Privacybeleid | https://studiosedillo.com/the-flush-factor/privacy |
| Gegevens verwijderen | https://studiosedillo.com/the-flush-factor/delete |
| Package-naam | `com.studiosedillo.flushfactor` |
