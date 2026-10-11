# Testversie — The Flush Factor

`Apps/CLAUDE.md`, sectie 11, punt 4: de testversie staat op github.io, is noindex en er wordt nergens
naar gelinkt. Geen eigen domein, geen DNS-records.

| | Adres | Repo | Hoe het gevuld wordt |
|---|---|---|---|
| Live | https://jmldewaal-sedillo.github.io/the-flush-factor/ | `the-flush-factor`, branch `main` | GitHub Pages rechtstreeks vanaf de branch (alleen na "zet live") |
| Test | https://jmldewaal-sedillo.github.io/the-flush-factor-test/ | `the-flush-factor-test`, branch `main` | Workflow: eerst de tests, dan publiceren |

## Een versie op het testadres zetten

```bash
cd /home/maggiesedd/Documents/Projecten/Apps/the-flush-factor
git push test sprint-9:main          # of een andere branch
gh run watch -R jmldewaal-sedillo/the-flush-factor-test
```

De workflow (`.github/workflows/ci.yml`) draait eerst alle tests (op de runner van GitHub ongeveer een
uur) en publiceert alleen als ze groen zijn. `tools/bouw-site.mjs` zet de site klaar: noindex in elke
pagina, een `robots.txt` die alles weigert, en "TEST" in de naam op het startscherm.

Het testadres heeft een eigen opslag: voortgang van het live adres staat er niet. Met "Voortgang
overzetten" (scorebubbel → Gegevens) kun je een spelstand meenemen.

## Niet doen

- Geen `CNAME`-bestand in de root en geen DNS-records (sectie 11, punt 6).
- De live-repo publiceert niet via deze workflow; `main` verandert alleen na akkoord van Jenn.
