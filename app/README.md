# Synk

Festspel för 2–10 spelare. Två spelare per runda får en fråga, appen räknar ner 3-2-1 och på noll säger båda ett namn.
Samma namn ger 1 poäng var. Olika namn: de förklarar sig och gruppen röstar om vem som svarade rätt, och den får poängen.

- `index.html`: hela appen (HTML, CSS och JS i en fil, inga beroenden)
- `questions.js`: frågorna: Warm up 100 (gratis), Juicy 200 och Crazy 100
- `icon.svg`, `icon-1024.png`, `icon-180.png`: appikonen (1024 för App Store och Google Play, 180 för hemskärmen)

## Regler i koden
- Warm up är gratis. Juicy och Crazy låses upp med ett engångsköp (produkt-ID `com.coalbun.synk.unlock`). I iPhone-appen går köpet via App Store och priset hämtas därifrån. I webbläsaren är köpet en demo som låser upp direkt.
- Köpet kan återställas med "Återställ köp" och kontrolleras mot App Store varje gång appen startar.
- Frågorna går igenom alla 100 innan något upprepas. Nästa varv blandas om och samma fråga kommer aldrig tillbaka inom 50 frågor. Positionen sparas mellan spelkvällar.
- "Vem har …"-frågor visar en extra rad: har ingen av de två gjort det, säger man den som mest troligt skulle.
- Paren roteras så att alla spelar lika ofta och ingen spelar två rundor i rad (vid 4+ spelare).
- Alla spelar exakt lika många gånger, även vid udda antal. Ett spel är 7–10 rundor: 2 spelare 10, 3 spelare 9, 4 spelare 8, 5 spelare 10, 6 spelare 9, 7–10 spelare lika många rundor som spelare (alla spelar två gånger). Sen visas resultatet automatiskt.
- Två spelare: ni spelar som ett lag. Olika svar ger ingen omröstning, och resultatet är hur många matcher ni klarade.
- Spelare utan egen bild får en av tio animerade figurer.
- Inget scrollande på någon skärmstorlek. Testat på 320×568 till 430×932.

## Köra lokalt
Öppna `index.html` i en webbläsare. Typsnittet och allt annat ligger i mappen, så det fungerar utan internet. Hur iPhone-appen byggs står i README i projektets rotmapp.
