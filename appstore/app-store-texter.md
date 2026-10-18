# Synk: texter till App Store Connect

Kopiera in texterna nedan i App Store Connect. Siffran inom parentes är antal tecken och Apples gräns.

## Appinformation
- **Namn** (4/30): Synk
  - Om namnet är upptaget: **Synk: Festspel** eller **Synk – Säg samma namn**
- **Undertitel** (24/30): Säg samma namn samtidigt
- **Primär kategori:** Spel. Underkategorier: Trivia och Casual
- **Sekundär kategori:** Underhållning
- **Paket-ID (Bundle ID):** com.coalbun.synk
- **Primärt språk:** Svenska

## Version 1.0
**Reklamtext** (141/170):

Två spelare, en fråga, tre sekunder. Säger ni samma namn får ni poäng. Det perfekta förfestspelet för gänget, från mysigt till riktigt galet.

**Beskrivning** (1294/4000):

```
Två spelare. En fråga. Tre sekunder.

"Vem av er skulle överleva längst utan mobil?" Appen räknar ner 3, 2, 1, och på noll säger ni båda ett namn högt: ditt eget eller den andras. Säger ni samma namn får ni en poäng var. Säger ni olika får ni förklara er. Sen röstar resten av gänget om vem som svarade rätt, och den får poängen.

Synk är festspelet som får hela rummet att skrika, skratta och säga "NEJ, det är ju du!".

SÅ FUNKAR DET
• 2 till 10 spelare. Skriv in namnen och kör på under en minut.
• Ta en profilbild på varje spelare om ni vill.
• Alla spelar lika många gånger, och ett spel tar runt tio minuter.
• Kvällens vinnare koras till Tankeläsaren.
• Är ni bara två spelar ni som ett lag och ser hur väl ni känner varandra.

TRE NIVÅER, 400 FRÅGOR
• Warm up: 100 lättsamma frågor om vardagen. Alltid gratis.
• Juicy: 200 frågor om dejter, ex, fyllor och hemligheter.
• Crazy: 100 frågor för när kvällen spårar ur på riktigt.

Samma fråga kommer aldrig tillbaka förrän ni har spelat alla på nivån.

ENGÅNGSKÖP, INGEN PRENUMERATION
Juicy och Crazy låser du upp med ett enda köp. Inga abonnemang, ingen reklam och ingen inloggning.

Allt sparas bara på din telefon. Synk samlar inte in några uppgifter om dig.

Juicy och Crazy innehåller frågor om sex, dejting och fest och är för dig som är 18 år eller äldre.
```

**Sökord** (95/100):

```
festspel,förfest,partyspel,frågespel,vänner,sällskapsspel,möhippa,tjejkväll,vem av oss,par,dejt
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
2. Two players are shown. Tap "Räkna ner". On zero both players say a name out loud. Tap "Samma" (same) or "Olika" (different).
3. The game ends automatically after 7-10 rounds and shows the winner. "Avsluta" ends it early.

In-app purchase: the level "Warm up" is free. Tapping "Juicy" or "Crazy" opens the purchase sheet for the non-consumable product com.coalbun.synk.unlock, which unlocks both levels permanently. "Återställ köp" (Restore Purchases) is in the same sheet.

The Juicy and Crazy questions are text only and refer to dating, sex and alcohol in a humorous way, which is why the app is rated for adults. There is no user-generated content shared between users and no network features. Player names and photos stay on the device.
```

## Skärmbilder
Ligger i `appstore/screenshots/`, i storleken 1320 × 2868 för 6,9-tumsskärm. Ladda upp dem i den ordningen de är numrerade:

| Fil | Rubrik | Visar |
|---|---|---|
| `01-fragan.jpg` | Säg samma namn. Samtidigt. | En runda med frågan |
| `02-match.jpg` | Samma namn? Poäng till båda. | Match |
| `03-rosta.jpg` | Olika namn? Gänget avgör. | Röstningen |
| `04-nivaer.jpg` | Tre nivåer. Från oskyldigt till galet. | Startskärmen med nivåvalet |
| `05-vinnare.jpg` | Vem känner gänget bäst? | Resultatet |

`iap-review.jpg` är bara för granskningen av köpet, inte för produktsidan.

Tänk på inför nya skärmbilder: Apple kräver att skärmbilder passar alla åldrar (4+), även om appen har högre åldersgräns. Visa inga frågor om sex, alkohol eller nakenhet på bilderna.
