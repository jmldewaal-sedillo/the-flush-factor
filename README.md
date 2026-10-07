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
├── index.html          – Hoofd-HTML (spel + winkel, fullscreen HUD)
├── manifest.json       – PWA-manifest
├── sw.js               – Service Worker (offline, v10)
├── css/
│   ├── style.css       – Opmaak & layout (floating HUD, safe-area)
│   └── animations.css  – Alle animaties
├── js/
│   ├── items.js        – Alle speldata (gereedschappen, cosmetica, mandconfiguratie)
│   ├── clog.js         – Verstoppingssysteem
│   ├── inventory.js    – Gereedschapsbeheer
│   ├── shop.js         – Winkelsysteem (incl. mandupgrades)
│   ├── game.js         – Hoofdspellogica & coördinatie
│   ├── phone-preview.js – Telefoon/tablet-preview op desktop
│   ├── renderer3d.js   – Three.js 3D-scène (toilet GLB, water, kamer, mand)
│   └── vendor/
│       ├── three.module.min.js  – Three.js 0.170.0 (MIT, lokaal voor PWA)
│       ├── RGBELoader.js        – HDRI-loader (MIT)
│       ├── OrbitControls.js     – Kamera-bediening (MIT)
│       ├── GLTFLoader.js        – GLB/GLTF-loader (MIT)
│       └── DRACOLoader.js       – Draco-decompressie (MIT)
├── assets/
│   ├── models/
│   │   ├── toilet-2k.glb        – Toilet 3D-model (CC BY 4.0, HippoStance/Sketchfab) — primair
│   │   └── toilet.glb           – Toilet 3D-model (CC0, loafbrr_1/OpenGameArt) — fallback
│   ├── hdri/
│   │   └── bathroom.hdr         – Omgevingskaart (CC0, Poly Haven)
│   ├── textures/
│   │   ├── Tiles101_1K-JPG_*    – Wandtegels PBR (CC0, ambientCG)
│   │   └── WoodFloor041_1K-JPG_* – Houten vloer PBR (CC0, ambientCG)
│   └── CREDITS.md               – Bronvermelding alle assets
├── tests/
│   ├── smoke.spec.js            – Playwright smoke-tests (56 tests, 4 formaten)
│   └── screenshots/             – Automatische schermafbeeldingen
├── playwright.config.js
├── README.md
└── ROADMAP.md
```

## 3D Renderer

Het spel gebruikt **Three.js 0.170.0** voor een realistische 3D-badkamerschène:

- **GLB toilet-model** — "Toilet" door HippoStance (CC BY 4.0, Sketchfab), deksel standaard open; valt automatisch terug op CC0 OpenGameArt-model bij laadfouten; SVG als laatste fallback
- **OrbitControls** — speler kan de camera roteren/zoomen (beperkt tot WC-hokje-hoek); auto-zoom bij verstopping/ontstopping
- **Aangepaste water-shader** — golfjes, draaikolk bij spoelen, kleurovergang helder→troebel bij verstopping
- **PBR-texturen** — CC0-tegels en houten vloer van ambientCG (albedo, normal, roughness)
- **HDRI-omgeving** — CC0 badkamerfoto van Poly Haven voor realistische reflecties
- **Mand (3D)** — wicker basket naast toilet; items vallen er in bij verstoppingoplossing; kantelanimatie bij legen
- **ACESFilmic tone mapping** + sRGB-output voor fotografische belichting
- **Kwaliteitsniveaus** — laag/midden/hoog automatisch gedetecteerd; schaduwen en pixelRatio afgestemd
- **WebGL-fallback** — als WebGL niet beschikbaar is, blijft de SVG-weergave actief

De 3D-renderer (`renderer3d.js`) luistert uitsluitend via DOM-events (`game:flush`, `game:clog`, `game:unclog`, `game:chaos`, `cosmetic:changed`, `basket:add`, `basket:empty`) en raakt de spellogica niet aan. Alle Three.js-bestanden zijn lokaal opgeslagen zodat de PWA offline werkt.

## Playwright-tests

```bash
npx playwright test              # alle 56 tests (4 formaten)
npx playwright test --reporter=list
npx playwright show-report
```

Tests draaien op 4 viewports: `phone-portrait` (393×851), `phone-landscape` (851×393), `tablet-portrait` (768×1024) en `tablet-landscape` (1024×768).

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
De service worker-versie is automatisch gebumpt naar `flushfactor-v10` en ruimt de
oude cache op zodra de SW actief wordt.

## TWA (Google Play Store)

De app is voorbereid voor TWA (Trusted Web Activity):
- `manifest.json` bevat `display: standalone` en `orientation: portrait`
- `theme_color` en `background_color` zijn ingesteld
- Offline werking via service worker
- Volgende stap: Digital Asset Links instellen (zie ROADMAP.md)
