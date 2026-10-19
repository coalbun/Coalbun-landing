# Synk

Festspel för iPhone. Två spelare per runda får en fråga, appen räknar ner 3-2-1 och på noll säger båda ett namn. Samma namn ger poäng till båda.

## Vad som finns var
| Mapp | Innehåll |
|---|---|
| `app/` | Själva spelet (HTML, CSS, JS), frågorna (`questions.js`: Warm up 100, Juicy 200, Crazy 100), typsnitt och ikoner |
| `ios/` | Xcode-projektet för iPhone (Capacitor) |
| `appstore/` | Texter till App Store Connect och färdiga skärmbilder |
| `site/synk/` | Integritetspolicy och supportsida, som Apple kräver |
| `scripts/` | Hjälpskript som kopierar typsnitt och Capacitor in i `app/` |

## Bygga och skicka in iPhone-appen
Det här kräver en Mac med **Xcode 26 eller senare** (Apples krav sedan april 2026).

1. Installera Node.js om det saknas, och kör sedan i den här mappen:
   ```
   npm install
   npm run sync
   npm run open
   ```
   `sync` kopierar spelet från `app/` in i iOS-projektet. Kör det varje gång något i `app/` har ändrats.
2. I Xcode: klicka på **App** i vänsterspalten, sedan på fliken **Signing & Capabilities**.
   - Välj ditt utvecklarkonto under **Team**.
   - Kontrollera att **Bundle Identifier** är `com.coalbun.synk`.
   - Klicka på **+ Capability** och lägg till **In-App Purchase**.
3. Testa på din egen telefon: koppla in iPhonen, välj den högst upp i Xcode och tryck på play-knappen.
4. Skapa appen i **App Store Connect** (Appar → +): namn Synk, primärt språk svenska, bundle-ID `com.coalbun.synk`, SKU till exempel `synk-ios`.
5. Skapa köpet och fyll i allt enligt `appstore/app-store-texter.md`.
6. Testa köpet: lägg upp en testare under **Användare och åtkomst → Sandbox**, eller testa via TestFlight.
7. I Xcode: **Product → Archive**, sedan **Distribute App → App Store Connect → Upload**.
8. Välj bygget på versionssidan i App Store Connect, lägg till köpet, ladda upp skärmbilderna och skicka in.

## Bygga utan Mac: GitHub Actions
Arbetsflödet `.github/workflows/ios-app-store.yml` bygger appen på en Mac hos GitHub (macOS 26, Xcode 26.6) och laddar upp den till App Store Connect. Där syns den under TestFlight och kan väljas på versionssidan.

**Förbered en gång:**
1. **Skapa appen i App Store Connect** (Appar → + → Ny app). Namn: Synk, språk: svenska, bundle-ID: `com.coalbun.synk`, SKU: `synk-ios`. Finns bundle-ID:t inte i listan, skapa det under developer.apple.com → Certificates, IDs & Profiles → Identifiers.
2. **Skapa en API-nyckel:** App Store Connect → Användare och åtkomst → Integrationer → App Store Connect API → Team-nycklar → +. Välj rollen **Admin**, som krävs för att GitHub ska få skapa signeringscertifikat. Ladda ner `.p8`-filen. Den går bara att ladda ner en gång.
3. **Lägg in fyra hemligheter på GitHub:** repot → Settings → Secrets and variables → Actions → New repository secret.

   | Namn | Värde |
   |---|---|
   | `APP_STORE_CONNECT_KEY_ID` | Nyckel-ID (står bredvid nyckeln, t.ex. `2X9R4HXF34`) |
   | `APP_STORE_CONNECT_ISSUER_ID` | Utfärdar-ID (står överst på sidan med nycklar) |
   | `APP_STORE_CONNECT_KEY` | Hela innehållet i `.p8`-filen, inklusive raderna `BEGIN` och `END` |
   | `APPLE_TEAM_ID` | Team-ID från developer.apple.com → Membership details (10 tecken) |

**Bygga:** GitHub → fliken **Actions** → **iOS: bygg och ladda upp** → **Run workflow**. Det tar cirka 10–15 minuter, och sedan 10–30 minuter innan bygget syns i App Store Connect. Build-numret blir körningens nummer, men du kan skriva ett eget när du startar.

Knappen syns först när arbetsflödet ligger på grenen `main`. Misslyckas ett bygge finns hela Xcode-loggen under körningen som `xcode-loggar`.

## Innan du skickar in
- **Avtal för betalappar:** i App Store Connect, under **Företag → Avtal, skatt och bank**, måste avtalet *Paid Applications* vara signerat och ha bank- och skatteuppgifter. Annars går köpet inte att skapa eller köpa.
- **Testa på din egen iPhone** innan du arkiverar:
  - Nedräkningen 3, 2, 1, NU! ska vara hel, utan avhuggna kanter.
  - Ljud och vibration ska fungera (ljudet slås av och på i menyn).
  - Testköp och **Återställ köp** ska fungera med ett sandbox-konto.
  - Länkarna under **Meny → Fler spel från oss** ska öppna ACT RUSH och Tune Trivia i App Store.
  - En hel omgång med 3+ spelare (röstningen) och en med 2 spelare (lagläget).
- **Köpet** `com.coalbun.synk.unlock` skickas in tillsammans med första versionen. Det läggs till på versionssidan.
- **Build-nummer:** varje ny uppladdning kräver ett högre build-nummer (Xcode → App → General → Build). Version 1.0 och build 1 är förifyllda.
- Support- och integritetssidan ligger live på `https://coalbun.com/synk/support.html` och `https://coalbun.com/synk/integritetspolicy.html`. De publiceras från repot `coalbun-studios-hero-f335bb32` (mappen `public/synk/`), som Netlify bygger. Ändrar du i `site/synk/` här måste filerna kopieras dit också.

## Ändra bundle-ID eller produkt-ID
- Bundle-ID: `capacitor.config.json` (`appId`) och i Xcode under Signing & Capabilities.
- Produkt-ID för köpet: `PRODUCT_ID` i `app/index.html`. Det måste vara exakt samma som i App Store Connect.

## Spelregler i koden
Se `app/README.md`.
