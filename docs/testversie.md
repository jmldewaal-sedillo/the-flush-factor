# Testversie — The Flush Factor

`Apps/CLAUDE.md`, sectie 11, punt 4: de testversie staat op github.io, is noindex en er wordt nergens
naar gelinkt. Geen eigen domein, geen DNS-records.

| | Adres | Repo | Hoe het gevuld wordt |
|---|---|---|---|
| Live | https://jmldewaal-sedillo.github.io/the-flush-factor/ | `the-flush-factor`, branch `main` | GitHub Pages rechtstreeks vanaf de branch (alleen na "zet live") |
| Test | https://jmldewaal-sedillo.github.io/the-flush-factor-test/ | `the-flush-factor-test`, branch `main` | Workflow: eerst de rooktest, dan publiceren |

## Een versie op het testadres zetten

```bash
cd /home/maggiesedd/Documents/Projecten/Apps/the-flush-factor
git push test sprint-9:main          # of een andere branch
gh run watch -R jmldewaal-sedillo/the-flush-factor-test
```

De workflow (`.github/workflows/ci.yml`) draait twee dingen naast elkaar:

- **Rooktest** (`npm run test:rook`, `tests/rook.spec.js`): laden zonder fouten, spoelen, verstopping
  oplossen, winkel, schoonmaken, menu, taal, gegevensknoppen en de privacypagina's, op één telefoon- en
  één tabletformaat. Is die groen, dan wordt de testversie **meteen gepubliceerd** (doel: binnen 10 minuten
  na de push).
- **Volledige suite** (`npm test`): alle tests op vier formaten, ongeveer een uur. Blokkeert de
  testversie niet. Faalt hij, dan staat er een rood kruis bij de run; de testversie staat er dan al wel.
  Kijk dus na een uur nog even: `gh run list -R jmldewaal-sedillo/the-flush-factor-test --limit 1`.

`tools/bouw-site.mjs` zet de site klaar: noindex in elke pagina, een `robots.txt` die alles weigert, en
"TEST" in de naam op het startscherm.

**`main` blijft achter de volledige suite.** Het live adres wordt rechtstreeks vanaf `main` gevuld, zonder
workflow ertussen. Mergen naar `main` gebeurt daarom alleen na akkoord van Jenn én als de job "Volledige
suite" groen is op de commit die gemerged wordt (op `origin` of op de test-repo).

Het testadres heeft een eigen opslag: voortgang van het live adres staat er niet. Met "Voortgang
overzetten" (scorebubbel → Gegevens) kun je een spelstand meenemen.

## Niet doen

- Geen `CNAME`-bestand in de root en geen DNS-records (sectie 11, punt 6).
- De live-repo publiceert niet via deze workflow; `main` verandert alleen na akkoord van Jenn.
