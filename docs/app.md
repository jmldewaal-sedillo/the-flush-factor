# De app bouwen: Android en iOS (Capacitor)

De app is het bouwdoel **app** (`Apps/CLAUDE.md`, sectie 11): één set bestanden (`dist/app/`) in twee
Capacitor-apps, één voor Android en één voor iOS. Alle bestanden zitten in de app. Hij werkt zonder internet en
heeft geen service worker. Een update van het spel is dus een nieuwe versie in de Play Store of App Store.

| | |
|---|---|
| Package / bundle-ID | `com.studiosedillo.flushfactor` (Android en iOS hetzelfde; kan na de eerste upload nooit meer veranderen) |
| Instellingen | `capacitor.config.json` |
| Bestanden van de app | `dist/app/`, gemaakt door `node tools/bouw.mjs app` (niet in Git) |
| Laag voor dit bouwdoel | `platform/app.js`: geen service worker, geen "Volledig scherm", terugknop van Android |
| Android-project | `android/` (in Git) |
| iOS-project | `ios/` (in Git; Swift Package Manager, geen CocoaPods) |
| Icoon en opstartscherm | gemaakt met `@capacitor/assets` uit `assets/icons/app/` (zie "Icoon vervangen") |
| Workflow | `.github/workflows/app.yml`: test-APK voor Android en een simulatorbuild voor iOS bij elke push |

## Na elke wijziging aan het spel

```bash
npm test
npm run app:sync          # bouwt dist/app opnieuw en zet het in android/ en ios/
```

Push naar GitHub; de workflow **App bouwen (Android en iOS)** doet de rest (zie hieronder). Wie Android Studio of
Xcode heeft: `npm run android:open` of `npm run ios:open`.

Verhoog voor elke upload naar een store de versie:
- Android: `versionCode` (altijd +1) en `versionName` in `android/app/build.gradle`.
- iOS: `MARKETING_VERSION` en `CURRENT_PROJECT_VERSION` in Xcode (of in `ios/App/App.xcodeproj/project.pbxproj`).

## Android testen zonder Play Store (test-APK)

Elke push naar de hoofdrepo bouwt op GitHub een test-APK. Zo zet je hem op je telefoon:

1. Ga naar https://github.com/jmldewaal-sedillo/the-flush-factor/actions en open de laatste groene run van
   **App bouwen (Android en iOS)**.
2. Download onder **Artifacts** het bestand `flush-factor-test-apk` (een zip met de APK) en pak het uit.
3. Zet de APK op de telefoon (mail, Google Drive of USB) en tik erop. Android vraagt één keer of je apps uit deze
   bron wilt toestaan: dat mag voor deze test.
4. Op het startscherm staat dan **TEST Flush**.

De test-APK heeft een eigen package-naam (`com.studiosedillo.flushfactor.test`). Hij kan dus naast de echte app
uit de Play Store staan, en heeft zijn eigen spelstand (los van de browser en van de echte app).

## Android in de Play Store

### De upload key (Jenn)

| | Upload key | App signing key |
|---|---|---|
| Wie heeft hem | **Jenn** (bestand `android.keystore` + wachtwoord) | **Google** (Play App Signing) |
| Waarvoor | Bewijst aan Google dat een upload van jou komt | Ondertekent de app die spelers installeren |
| Kwijt? | Oplosbaar: in de Play Console een nieuwe aanvragen | Kan niet kwijtraken; Google bewaart hem |

1. Maak de sleutel één keer (Java staat op deze computer):
   `keytool -genkeypair -v -keystore android.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Bewaar het bestand en het wachtwoord op twee plekken, **buiten deze repo**. Nooit in Git, e-mail of een chat;
   `.gitignore` sluit `*.keystore` en `*.jks` uit.
3. Geef de sleutel of het wachtwoord niet aan Claude Code. Ondertekenen doe je zelf.

### Uitbrengen

1. Ondertekende `.aab` maken in Android Studio (**Build → Generate Signed App Bundle**). Kan later ook in de
   workflow, met de sleutel als geheim in GitHub (alleen als Jenn dat wil).
2. Uploaden naar **Interne test** in de Play Console; daarna productie (zie `docs/publiceren.md`).

**Controleer vóór het uploaden:**
- [ ] `targetSdkVersion` (in `android/variables.gradle`, nu 36) voldoet aan de eis van dat moment (Google verhoogt
      hem elk jaar in augustus; dan Capacitor bijwerken).
- [ ] De app start in vliegtuigmodus.
- [ ] De terugknop sluit eerst vensters en menu's, zoomt uit, en sluit pas daarna de app.
- [ ] Geen overbodige permissies in `android/app/src/main/AndroidManifest.xml` (alleen `INTERNET`, die Capacitor
      standaard zet; een test bewaakt dat er geen advertentie-ID, locatie, camera of meldingen bij komen).

## iOS (App Store)

Het Apple Developer-account loopt via `Apps/docs/apple-developer.md` (als individu, € 99 per jaar).

**Nu al:** de workflow bouwt bij elke push de app voor de iOS-simulator, zonder ondertekenen. Dat bewijst dat het
Xcode-project klopt; het is nog geen app voor een echte iPhone.

**Zodra het Developer-account er is** (Claude Code, op verzoek):
1. In App Store Connect een app aanmaken met bundle-ID `com.studiosedillo.flushfactor`.
2. Een **App Store Connect API-sleutel** maken (Jenn) en als geheimen in GitHub zetten; nooit in de repo.
3. De workflow uitbreiden: ondertekenen en uploaden naar **TestFlight** (op een macOS-runner van GitHub; gratis
   voor deze publieke repo).
4. Testen via TestFlight op een iPhone of iPad.

**Let op bij iOS:**
- Punten kopen met echt geld moet in de App Store via Apple (in-app purchase), niet via Google Play Billing.
  Zolang de aankopen uit staan, speelt dat niet.
- Inloggen met Google of Facebook betekent in de App Store ook "Sign in with Apple" aanbieden.
- Privacy: in App Store Connect de "privacylabels" invullen (zelfde antwoorden als Data Safety).

## Icoon vervangen

Het icoon is nu het tijdelijke wc-icoon uit `assets/icons/app/`. Komt er een echt icoon (punt "Store-materiaal"):

```bash
mkdir .cap-assets
cp <icoon 1024x1024, zonder transparantie>.png .cap-assets/icon-only.png
cp <logo voor het opstartscherm>.png .cap-assets/logo.png
cp .cap-assets/logo.png .cap-assets/logo-dark.png
npx @capacitor/assets@3.0.5 generate --assetPath .cap-assets --ios --android \
  --iconBackgroundColor '#2c7da0' --iconBackgroundColorDark '#2c7da0' \
  --splashBackgroundColor '#1f2a33' --splashBackgroundColorDark '#1f2a33' --logoSplashScale 0.3
rm -rf .cap-assets
```

Vervang dan ook `assets/icons/app/` (de webversie) door hetzelfde icoon.

## Opslag

De app bewaart in de localStorage van de WebView, met de prefix `flushfactor.`, via `js/storage.js`. Dat blijft
staan tot de speler de app verwijdert of de opslag wist. De spelstand van de browser gaat niet vanzelf mee naar
de app: daarvoor is "Voortgang overzetten" (code) in het profiel.

## Advertenties

Staan uit (`Platform.advertenties.beschikbaar` is `false`). AdMob komt er alleen in via de Capacitor-plug-in en
na akkoord van Jenn (`Apps/CLAUDE.md`, sectie 11, punt 5). Dan eerst de privacyverklaring,
`docs/privacy-audit.md`, Data Safety en de privacylabels van Apple bijwerken.
