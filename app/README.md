# Vem av oss (arbetsnamn)

Festspel för 2–10 spelare. Två spelare per runda får en fråga, appen räknar ner 3-2-1 och på noll säger båda ett namn.
Samma namn ger 1 poäng var. Olika namn: de förklarar sig och gruppen röstar om vem som hade rätt.

- `index.html`: hela appen (HTML, CSS och JS i en fil, inga beroenden)
- `questions.js`: 100 frågor per nivå (Warm up, Juicy, Crazy)

## Regler i koden
- Warm up är gratis. Juicy och Crazy låses upp med ett engångsköp på 59 kr (köpet är en demo tills appen paketeras med riktiga köp via App Store och Google Play).
- Frågorna går igenom alla 100 innan något upprepas. Nästa varv blandas om och samma fråga kommer aldrig tillbaka inom 50 frågor. Positionen sparas mellan spelkvällar.
- Paren roteras så att alla spelar lika ofta och ingen spelar två rundor i rad (vid 4+ spelare).
- Alla spelar exakt lika många gånger, även vid udda antal. Ett spel är 7–10 rundor: 2 spelare 10, 3 spelare 9, 4 spelare 8, 5 spelare 10, 6 spelare 9, 7–10 spelare lika många rundor som spelare (alla spelar två gånger). Sen visas resultatet automatiskt.
- Två spelare: ni spelar som ett lag. Olika svar ger ingen omröstning, och resultatet är hur många matcher ni klarade.
- Spelare utan egen bild får en av tio animerade figurer.
- Inget scrollande på någon skärmstorlek. Testat på 320×568 till 430×932.

## Köra lokalt
Öppna `index.html` i en webbläsare. För App Store och Google Play kan mappen paketeras med till exempel Capacitor.
