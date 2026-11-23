// Ritar appikonen och lägger den på alla ställen där den används.
//   node scripts/store/icon.js          -> förslaget "duo" (det som används nu)
//   node scripts/store/icon.js duo2     -> ett av de andra förslagen: duo2, vs, party eller bang
// Kräver Playwright med Chromium och python3 med Pillow.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const PICK = process.argv[2] || 'duo';
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'synk-icon-'));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'icon.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const el = await p.$('#icon-' + PICK);
  if (!el) throw new Error('okänt förslag: ' + PICK + ' (välj duo, duo2, vs, party eller bang)');
  const png = path.join(TMP, 'icon.png');
  await el.screenshot({ path: png });

  // Fristående SVG, med bara de mönster som används
  const svg = await p.evaluate((k) => {
    const s = document.querySelector('#icon-' + k + ' svg').cloneNode(true);
    s.removeAttribute('class');
    s.setAttribute('width', '1024'); s.setAttribute('height', '1024');
    const used = new Set([...s.outerHTML.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]));
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    for (let added = true; added;) {
      added = false;
      document.querySelectorAll('body > svg defs > *').forEach((d) => {
        if (used.has(d.id) && !defs.querySelector('#' + d.id)) {
          defs.appendChild(d.cloneNode(true)); added = true;
          for (const m of d.outerHTML.matchAll(/url\(#([^)]+)\)/g)) used.add(m[1]);
        }
      });
    }
    s.insertBefore(defs, s.firstChild);
    s.querySelectorAll('[class]').forEach((e) => e.removeAttribute('class'));
    s.querySelectorAll('[aria-hidden]').forEach((e) => e.removeAttribute('aria-hidden'));
    return s.outerHTML;
  }, PICK);
  await b.close();
  if (errs.length) throw new Error(errs.join('\n'));

  fs.writeFileSync(path.join(ROOT, 'app/icon.svg'), svg + '\n');
  // Apple vill ha PNG utan genomskinlighet. 180 är hemskärmsikonen i webbversionen.
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
assert im.size == (1024, 1024)
for out in sys.argv[2:4]:
    im.save(out, optimize=True)
im.resize((180, 180), Image.LANCZOS).save(sys.argv[4], optimize=True)
`, png,
    path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'),
    path.join(ROOT, 'app/icon-1024.png'),
    path.join(ROOT, 'app/icon-180.png')]);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('Ikonen "' + PICK + '" ligger nu i iOS-projektet och i app/.');
})();
