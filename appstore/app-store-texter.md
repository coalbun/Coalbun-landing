# Synk: texter till App Store Connect

Kopiera in texterna nedan i App Store Connect. Siffran inom parentes är antal tecken och Apples gräns.

## Appinformation
- **Namn** (27/30): Synk: Vem av oss? Partyspel
  - På hemskärmen heter appen fortfarande bara **Synk**.
  - "Vem av oss" och "partyspel" står i namnet och behöver därför inte finnas bland sökorden.
- **Undertitel** (30/30): 2-10 spelare - alla möter alla
- **Primär kategori:** Spel. Underkategorier: Trivia och Casual
- **Sekundär kategori:** Underhållning
- **Paket-ID (Bundle ID):** com.coalbun.synk
- **Primärt språk:** Svenska

## Version 1.1
**Nyheter i den här versionen** (476/4000):

```
Synk har fått en helt ny look!

• Festfigurer: varje spelare får en egen figur. Välj själv eller få en slumpad.
• Ny stil i svartvitt, med serietidningssmällar och färg när något händer.
• Tryck på en spelare för att byta namn, byta figur eller ta bort.
• VS-intro före varje runda.
• Säger ni olika namn får ni tio sekunder på er att förklara er innan gänget röstar.
• Frågan syns större.
• Profilbilderna är borttagna, så appen behöver inte längre kameran eller dina bilder.
```

Reklamtext, beskrivning och sökord är desamma som i 1.0.

**Reklamtext** (146/170):

2–10 spelare, alla mot alla. Två möts per runda, får en fråga och säger ett namn på tre sekunder. Samma namn ger poäng. Från oskyldigt till galet.

**Beskrivning** (1320/4000):

```
2–10 spelare, alla mot alla. Två i taget. En fråga. Tre sekunder.

"Vem av er skulle överleva längst utan mobil?" Appen räknar ner 3, 2, 1, och på noll säger ni båda ett namn högt: ditt eget eller den andras. Säger ni samma namn får ni en poäng var. Säger ni olika får ni förklara er. Sen röstar resten av gänget om vem som svarade rätt, och den får poängen.

Synk är festspelet som får hela rummet att skrika, skratta och säga "NEJ, det är ju du!".

SÅ FUNKAR DET
• 2 till 10 spelare. Skriv in namnen och kör på under en minut.
• Varje spelare får en egen festfigur: välj själv eller få en slumpad.
• Alla spelar lika många gånger, och ett spel tar runt tio minuter.
• Kvällens vinnare koras till Tankeläsaren.
• Är ni bara två spelar ni som ett lag och ser hur väl ni känner varandra.

TRE NIVÅER, 400 FRÅGOR
• Warm up: 100 lättsamma frågor om vardagen. Alltid gratis.
• Juicy: 200 frågor om dejter, ex och hemligheter.
• Crazy: 100 frågor för när kvällen spårar ur på riktigt.

Samma fråga kommer aldrig tillbaka förrän ni har spelat alla på nivån.

ENGÅNGSKÖP, INGEN PRENUMERATION
Juicy och Crazy låser du upp med ett enda köp. Inga abonnemang, ingen reklam och ingen inloggning.

Allt sparas bara på din telefon. Synk samlar inte in några uppgifter om dig.

Juicy och Crazy innehåller vuxna frågor och är för dig som är 18 år eller äldre.
```

**Sökord** (94/100):

```
festspel,förfest,frågespel,vänner,kompisar,sällskapsspel,möhippa,tjejkväll,par,dejt,gissa,quiz
```

- **Support-URL:** `https://coalbun.com/synk/support.html` (live)
- **Marknadsförings-URL:** https://coalbun.com
- **Integritetspolicy-URL:** `https://coalbun.com/synk/integritetspolicy.html` (live)
- **Copyright:** 2026 Coalbun Studios

## Köp i appen (In-App Purchase)
Skapa under **Monetization → In-App Purchases**.

| Fält | Värde |
|---|---|
| Typ | Non-Consumable (engångsköp som inte tar slut) |
| Referensnamn | Lås upp Juicy och Crazy |
| Produkt-ID | `com.coalbun.synk.unlock` (måste vara exakt så, appen letar efter det) |
| Pris | 59 kr, eller närmaste prisnivå som Apple erbjuder |
| Visningsnamn (15/30) | Juicy och Crazy |
| Beskrivning (35/45) | 300 kryddigare frågor, köps en gång |
| Skärmbild för granskning | `appstore/screenshots/iap-review.jpg` |

**Viktigt:** det första köpet i en app måste skickas in **tillsammans med** en ny version av appen. Lägg till köpet under "In-App Purchases and Subscriptions" på versionssidan innan du skickar in.

## Åldersgräns
Svara ärligt på Apples frågor. Ungefär så här:
- **Mogna eller suggestiva teman:** Ofta eller intensivt
- **Sexuellt innehåll eller nakenhet:** Sällan eller milt (bara text, inga bilder)
- **Alkohol, tobak eller droger:** Sällan eller milt (fylla nämns, droger nämns inte)
- **Grovt språk eller grov humor:** Sällan eller milt
- **Allt annat:** Nej eller Inget

Hamnar appen under 18+ rekommenderar jag att du ändrar till **18+** manuellt. Då stämmer gränsen med det som står i appen.

## Appens integritet (App Privacy)
Välj **"Data Not Collected"** (inga uppgifter samlas in). Appen har ingen analys, ingen reklam, ingen inloggning och skickar inget från telefonen.

## Anteckningar till Apples granskare (App Review Notes)
Skriv på engelska, så går granskningen smidigare:

```
Synk is a Swedish party game for 2-10 players played on one phone. No login or account is needed.

How to test:
1. Enter at least two player names on the start screen and tap "Kör!".
2. A short VS animation introduces the two players (tap to skip). Tap "Räkna ner". On zero both players say a name out loud. Tap "Samma" (same) or "Olika" (different). After "Olika" a 10-second timer runs while the players explain, then the group votes for who answered right.
3. The game ends automatically after 7-10 rounds and shows the winner. "Avsluta" ends it early.

In-app purchase: the level "Warm up" is free. Tapping "Juicy" or "Crazy" opens the purchase sheet for the non-consumable product com.coalbun.synk.unlock, which unlocks both levels permanently. "Återställ köp" (Restore Purchases) is in the same sheet.

The Juicy and Crazy questions are text only and refer to dating, sex and alcohol in a humorous way, which is why the app is rated for adults. Two of the ten cartoon party characters hold a drink (a cocktail and a beer). The game has no drinking rules and never asks anyone to drink. There is no user-generated content shared between users and no network features. Player names stay on the device. Version 1.1 removes the profile photos, so the app no longer uses the camera or the photo library.
```

## Skärmbilder
Ligger i `appstore/screenshots/`, i storleken 1320 × 2868 för 6,9-tumsskärm. Ladda upp dem i den ordningen de är numrerade:

| Fil | Rubrik | Visar |
|---|---|---|
| `01-fragan.jpg` | Säg samma namn. Samtidigt. | En runda med frågan, Ella mot Oscar |
| `02-match.jpg` | Samma namn? Poäng till båda. | MATCH! |
| `03-rosta.jpg` | Olika namn? Gänget avgör. | MISMATCH! med timern och röstningen |
| `04-nivaer.jpg` | Tre nivåer. Från oskyldigt till galet. | Startskärmen med spelarna och nivåvalet |
| `05-vinnare.jpg` | Vem känner gänget bäst? | Resultatet med vinnaren och topplistan |

`iap-review.jpg` är bara för granskningen av köpet, inte för produktsidan.

Bilderna görs av den riktiga appen med `node scripts/store/screenshots.js` (kräver Playwright). Kör det igen när appen ändras, så blir bilderna aktuella.

När 1.1 skapas i App Store Connect följer bilderna från 1.0 med. Skriptet `asc-release.py` (läget "fyll") ser att de inte är de nya, tar bort dem från versionen som förbereds och laddar upp bilderna härifrån. Den version som redan ligger ute påverkas inte.

Tänk på inför nya skärmbilder: Apple kräver att skärmbilder passar alla åldrar (4+), även om appen har högre åldersgräns. Visa inga frågor om sex, alkohol eller nakenhet på bilderna, och bara figurer utan drinkar (inte `drinken`, `fulla` eller `slitna`).
