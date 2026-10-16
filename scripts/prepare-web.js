// Kopierar typsnitt och Capacitors körmiljö in i app/ så att appen fungerar helt utan internet.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const copies = [
  ["node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2", "app/fonts/outfit-latin.woff2"],
  ["node_modules/@fontsource-variable/outfit/files/outfit-latin-ext-wght-normal.woff2", "app/fonts/outfit-latin-ext.woff2"],
  ["node_modules/@fontsource-variable/outfit/LICENSE", "app/fonts/LICENSE-Outfit.txt"],
  ["node_modules/@capacitor/core/dist/capacitor.js", "app/vendor/capacitor.js"]
];
for (const [from, to] of copies) {
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(root, from), dest);
  console.log("kopierade", to);
}
