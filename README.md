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
│   ├── game.js         – Hoofdspellogica & coördinatie
│   ├── renderer3d.js   – Three.js 3D-scène (toilet, water, kamer)
│   └── vendor/
│       ├── three.module.min.js  – Three.js 0.170.0 (MIT, lokaal voor PWA)
│       └── RGBELoader.js        – HDRI-loader (MIT)
├── assets/
│   ├── hdri/
│   │   └── bathroom.hdr         – Omgevingskaart (CC0, Poly Haven)
│   ├── textures/
│   │   ├── Tiles101_1K-JPG_*    – Wandtegels PBR (CC0, ambientCG)
│   │   └── WoodFloor041_1K-JPG_* – Houten vloer PBR (CC0, ambientCG)
│   └── CREDITS.md               – Bronvermelding alle assets
├── README.md
└── ROADMAP.md
```

## 3D Renderer

Het spel gebruikt **Three.js 0.170.0** voor een realistische 3D-badkamerschène:

- **Procedureel toilet** — LatheGeometry (kom, zitring, voetstuk) + BoxGeometry (stortbak) met MeshPhysicalMaterial (clearcoat, glanzend porselein)
- **Aangepaste water-shader** — golfjes, draaikolk bij spoelen, kleurovergang helder→troebel bij verstopping
- **PBR-texturen** — CC0-tegels en houten vloer van ambientCG (albedo, normal, roughness)
- **HDRI-omgeving** — CC0 badkamerfoto van Poly Haven voor realistische reflecties
- **ACESFilmic tone mapping** + sRGB-output voor fotografische belichting
- **Kwaliteitsniveaus** — laag/midden/hoog automatisch gedetecteerd via GPU-renderer string; schaduwen en pixelRatio afgestemd
- **WebGL-fallback** — als WebGL niet beschikbaar is, blijft de SVG-weergave actief

De 3D-renderer (`renderer3d.js`) luistert uitsluitend via DOM-events (`game:flush`, `game:clog`, `game:unclog`, `game:chaos`, `cosmetic:changed`) en raakt de spellogica niet aan. Alle Three.js-bestanden zijn lokaal opgeslagen zodat de PWA offline werkt.

## Telefoonpreview op desktop

Op een brede (niet-touch) desktop of laptop wordt het spel automatisch gecentreerd
in een telefoonframe met neutrale achtergrond. Op een echte telefoon of tablet
verandert er niets: het spel draait gewoon fullscreen.

### Testknoppen (boven het frame)

| Knop | Werking |
|------|---------|
| **Klein / Standaard / Groot** | Schermformaat 360×740 · 390×844 · 430×932 |
| **↻ Draaien** | Wissel tussen portret- en liggende stand |
| **✕ Volledig scherm** | Zet de preview uit (onthouden in localStorage) |

### URL-parameters

| Parameter | Gedrag |
|-----------|--------|
| `?preview=phone` | Forceert telefoonframe, ook op tablet/laptop-touchscreen |
| `?preview=off` | Forceert fullscreen, ook op desktop |

Om de preview na het uitschakelen via de knop opnieuw in te schakelen,
open de URL met `?preview=phone`.

### Cache verversen na update

Het spel heeft een service worker. Als je een nieuwe versie wil forceren,
doe dan een **harde herlaad** in de browser (`Ctrl + Shift + R` / `Cmd + Shift + R`).
De service worker-versie is automatisch gebumpt naar `flushfactor-v2` en ruimt de
oude cache op zodra de SW actief wordt.

## TWA (Google Play Store)

De app is voorbereid voor TWA (Trusted Web Activity):
- `manifest.json` bevat `display: standalone` en `orientation: portrait`
- `theme_color` en `background_color` zijn ingesteld
- Offline werking via service worker
- Volgende stap: Digital Asset Links instellen (zie ROADMAP.md)
