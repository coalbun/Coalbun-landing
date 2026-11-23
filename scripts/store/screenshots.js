// Gör App Store-bilderna av den riktiga appen.
//   node scripts/store/screenshots.js
// 1. Spelar appen i iPhone 6,9-tumsstorlek (440 x 956 punkter, 3x = 1320 x 2868) med säkra ytor som på telefonen.
// 2. Sätter rubrik och telefonram runt varje skärm (compose.html).
// 3. Sparar i appstore/screenshots/: 01-05 för produktsidan och iap-review.jpg för granskningen av köpet.
// Kräver Playwright med Chromium.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'app');
const DEST = path.join(ROOT, 'appstore/screenshots');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'synk-shots-'));
const APP = path.join(TMP, 'app');
const RAW = path.join(TMP, 'raw');
fs.mkdirSync(RAW);

// Kopia av appen med säkra ytor som på iPhone 16 Pro Max (62 uppe, 34 nere) och priset som App Store skriver det
fs.cpSync(SRC, APP, { recursive: true });
let html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
function swap(from, to) {
  if (!html.includes(from)) throw new Error('hittar inte i index.html: ' + from);
  html = html.split(from).join(to);
}
swap('env(safe-area-inset-top, 0px)', '62px');
swap('env(safe-area-inset-bottom, 0px)', '34px');
swap('var PRICE = "59 kr";', 'var PRICE = "59,00 kr";');
swap('(IS_NATIVE ? "" : " Testversion: knappen låser upp direkt, inget köp görs.")', '""'); // syns bara i webbversionen
fs.writeFileSync(path.join(APP, 'index.html'), html);

// Samma fråga som på bilderna till 1.0
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(SRC, 'questions.js'), 'utf8'), ctx);
const QJ = ctx.window.QUESTIONS.juicy;
const qi = QJ.indexOf('Vem skulle ringa sitt ex på högtalare inför alla nu?');
if (qi < 0) throw new Error('hittar inte frågan till första bilden');
const ORDER = [qi].concat(QJ.map((_, i) => i).filter((i) => i !== qi));

// Bara figurer utan alkohol. Apple kräver att skärmbilderna passar 4+ (riktlinje 2.3.8).
const PLAYERS = [
  { id: 'p1', name: 'Ella', fig: 'partyhatt' },
  { id: 'p2', name: 'Oscar', fig: 'dj' },
  { id: 'p3', name: 'Linn', fig: 'selfie' },
  { id: 'p4', name: 'Amir', fig: 'dansaren' },
  { id: 'p5', name: 'Jonna', fig: 'karaoke' },
  { id: 'p6', name: 'Viktor', fig: 'somnat' },
];
const BY_NAME = {}; PLAYERS.forEach((x) => (BY_NAME[x.name] = x.id));

const G = '#f0b638', R = '#d0283a', W = '#fff';
const CORNERS = [[30, 32], [412, 30], [420, 180], [20, 186]];
const SHOTS = [
  { file: '01-fragan', l1: 'Säg samma namn.', l2: 'Samtidigt.', conf: [[20, G], [-24, R], [34, W], [-16, R]] },
  { file: '02-match', l1: 'Samma namn?', l2: 'Poäng till båda.', conf: [[-20, R], [26, G], [-30, W], [18, G]] },
  { file: '03-rosta', l1: 'Olika namn?', l2: 'Gänget avgör.', conf: [[24, G], [-18, W], [30, R], [-22, W]] },
  { file: '04-nivaer', l1: 'Tre nivåer.', l2: 'Från oskyldigt till galet.', conf: [[-20, G], [22, R], [-28, W], [16, R]] },
  { file: '05-vinnare', l1: 'Vem känner', l2: 'gänget bäst?', conf: [[18, R], [-24, G], [30, G], [-18, W]] },
];

const errs = [];
async function open(b, unlocked) {
  const p = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(({ players, unlocked, order }) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('vao_players', JSON.stringify(players));
      localStorage.setItem('vao_unlocked', JSON.stringify(unlocked));
      localStorage.setItem('vao_decks', JSON.stringify({ juicy: { order, pos: 0 } }));
      sessionStorage.setItem('seeded', '1');
    }
    // Slumpen styrs bara på två ställen: vilka som möts först, och figuren i rutan bredvid namnfältet
    const real = Math.random;
    window.__pair = [];
    Math.random = function () {
      const st = new Error().stack || '';
      if (st.includes('nextPair') && window.__pair.length) return window.__pair.shift();
      if (st.includes('randomFig')) return 0.999; // sista lediga figuren: Hemgången, utan alkohol
      return real();
    };
  }, { players: PLAYERS, unlocked, order: ORDER });
  await p.goto('file://' + path.join(APP, 'index.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.mouse.click(5, 5); // hoppa över introt
  await p.waitForTimeout(900);
  return p;
}
// Figurerna stannar i sin bästa stillbild så att bilden blir skarp
async function shot(p, name) {
  await p.evaluate(() => document.querySelectorAll('*').forEach((el) => { if (el._figId) window.Figures.mount(el, el._figId, { still: true }); }));
  await p.waitForTimeout(120);
  await p.screenshot({ path: path.join(RAW, name + '.png') });
}
async function startRound(p) {
  await p.click('.cat[data-cat="juicy"]');
  await p.waitForTimeout(200);
  await p.evaluate(() => { window.__pair = [0, 0.1]; }); // Ella mot Oscar
  await p.click('#start-btn');
  await p.waitForTimeout(400);
  await p.mouse.click(220, 478); // hoppa över VS-introt
  await p.waitForTimeout(900);
}
async function countdown(p) {
  await p.click('#go');
  await p.waitForTimeout(3600);
}

async function capture(b) {
  // Frågan, sedan samma namn
  let p = await open(b, true);
  await startRound(p);
  await shot(p, '01-fragan');
  await countdown(p);
  await p.click('#same');
  await p.waitForTimeout(2300); // konfettin har hunnit falla förbi texten
  await shot(p, '02-match');
  await p.close();

  // Olika namn: timern och röstningen
  p = await open(b, true);
  await startRound(p);
  await countdown(p);
  await p.click('#diff');
  await p.waitForTimeout(2600);
  await shot(p, '03-rosta');
  await p.close();

  // Startskärmen med nivåerna, Crazy vald
  p = await open(b, true);
  await p.click('.cat[data-cat="crazy"]');
  await p.waitForTimeout(2600);
  await shot(p, '04-nivaer');
  await p.close();

  // Hela spelet: Ella vinner, en match och några missar
  p = await open(b, true);
  await p.click('.cat[data-cat="juicy"]');
  await p.click('#start-btn');
  await p.waitForTimeout(400);
  const score = {}; PLAYERS.forEach((x) => (score[x.id] = 0));
  let matched = false;
  const total = Number((await p.evaluate(() => document.querySelector('.card-meta').textContent)).split(' av ')[1]);
  for (let r = 0; r < total; r++) {
    await p.mouse.click(220, 478);
    await p.waitForTimeout(500);
    await countdown(p);
    const ids = (await p.evaluate(() => [...document.querySelectorAll('#fA .fighter-name, #fB .fighter-name')].map((e) => e.textContent))).map((n) => BY_NAME[n]);
    if (!ids.includes('p1') && !matched && score[ids[0]] === 0 && score[ids[1]] === 0) {
      await p.click('#same');
      score[ids[0]]++; score[ids[1]]++; matched = true;
    } else {
      await p.click('#diff');
      await p.waitForTimeout(300);
      let vote = 'p1';
      if (!ids.includes('p1')) { const low = score[ids[0]] <= score[ids[1]] ? ids[0] : ids[1]; vote = score[low] < 2 ? low : 'none'; }
      await p.click(`[data-vote="${vote}"]`);
      if (vote !== 'none') score[vote]++;
    }
    await p.waitForTimeout(350);
    await p.click('#next');
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(6000); // konfettin har fallit klart, så att texten syns
  await shot(p, '05-vinnare');
  await p.close();

  // Köpet i låst läge, för Apples granskning
  p = await open(b, false);
  await p.click('.cat[data-cat="juicy"]');
  await p.waitForTimeout(900);
  await shot(p, 'iap-review');
  await p.close();
}

async function compose(b) {
  const p = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
  p.on('pageerror', (e) => errs.push('compose: ' + e.message));
  for (const s of SHOTS) {
    const d = { img: 'file://' + path.join(RAW, s.file + '.png'), l1: s.l1, l2: s.l2, conf: s.conf.map(([r, c], i) => [CORNERS[i][0], CORNERS[i][1], r, c]) };
    await p.goto('file://' + path.join(__dirname, 'compose.html') + '?d=' + encodeURIComponent(JSON.stringify(d)));
    await p.waitForSelector('body[data-ready="1"]');
    await p.evaluate(() => new Promise((r) => { const i = document.getElementById('img'); i.complete ? r() : (i.onload = r); }));
    await p.screenshot({ path: path.join(DEST, s.file + '.jpg'), type: 'jpeg', quality: 92 });
  }
  // Granskningsbilden är skärmen som den är, utan ram
  const q = await b.newPage({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 1 });
  await q.goto('file://' + path.join(RAW, 'iap-review.png'));
  await q.addStyleTag({ content: 'html,body{margin:0;background:#000} img{display:block}' });
  await q.screenshot({ path: path.join(DEST, 'iap-review.jpg'), type: 'jpeg', quality: 92 });
  await q.close();
  await p.close();
}

(async () => {
  const b = await chromium.launch();
  await capture(b);
  await compose(b);
  await b.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  if (errs.length) { console.error('Fel:\n  ' + errs.join('\n  ')); process.exit(1); }
  console.log('Klart: appstore/screenshots/ (01-05 och iap-review.jpg)');
})();
