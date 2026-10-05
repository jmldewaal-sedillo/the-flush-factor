# The Flush Factor 🚽

Het meest absurde spoelspel ooit gemaakt.

## Lokaal starten

```bash
# Optie 1 – Python (altijd beschikbaar)
cd /home/maggiesedd/Documents/Projecten/Apps/the-flush-factor
python3 -m http.server 8080
# Open: http://localhost:8080

# Optie 2 – Node / npx (geen installatie nodig)
npx serve .
```

> **Let op:** het spel gebruikt ES modules (`type="module"`), dus het **werkt niet** via `file://`. Gebruik altijd een lokale server.

## Testen op telefoon

1. Start de server op je computer (zie boven).
2. Zorg dat je telefoon op hetzelfde Wi-Fi-netwerk zit.
3. Zoek het lokale IP-adres van je computer:
   - Linux/Mac: `ip addr` of `hostname -I`
   - Windows: `ipconfig`
4. Open op je telefoon: `http://<jouw-ip>:8080`
5. In Chrome: tik op "Toevoegen aan beginscherm" voor de PWA-ervaring.

## Projectstructuur

```
the-flush-factor/
├── index.html          – Hoofd-HTML (spel + winkel)
├── manifest.json       – PWA-manifest
├── sw.js               – Service Worker (offline)
├── css/
│   ├── style.css       – Opmaak & layout
│   └── animations.css  – Alle animaties
├── js/
│   ├── items.js        – Alle speldata (gereedschappen, cosmetica)
│   ├── clog.js         – Verstoppingssysteem
│   ├── inventory.js    – Gereedschapsbeheer
│   ├── shop.js         – Winkelsysteem
│   └── game.js         – Hoofdspellogica & coördinatie
├── README.md
└── ROADMAP.md
```

## TWA (Google Play Store)

De app is voorbereid voor TWA (Trusted Web Activity):
- `manifest.json` bevat `display: standalone` en `orientation: portrait`
- `theme_color` en `background_color` zijn ingesteld
- Offline werking via service worker
- Volgende stap: Digital Asset Links instellen (zie ROADMAP.md)
