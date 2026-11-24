// Synk: festfigurerna. Tio figurer ritade som SVG i kod, var och en med en egen liten loop.
// Svartvita kroppar med prickraster i skuggorna. Färg finns bara på rekvisitan.
// Figurerna har inga namn i appen. Internt heter de efter sin rekvisita.
(function () {
  "use strict";
const K = '#140c0d';      // kontur
const SW = 18;            // konturbredd (hälften syns utanför)
let uid = 0;

const P = (pts) => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z';

function blob(cx, cy, a, b, n = 2.7, bottomSquish = 0.92) {
  const pts = [];
  for (let i = 0; i < 120; i++) {
    const t = (2 * Math.PI * i) / 120, c = Math.cos(t), s = Math.sin(t);
    let x = a * Math.sign(c) * Math.abs(c) ** (2 / n);
    let y = b * Math.sign(s) * Math.abs(s) ** (2 / n);
    if (y > 0) x *= 1 - (1 - bottomSquish) * (y / b); // lite smalare nertill
    pts.push([cx + x, cy + y]);
  }
  return P(pts);
}

// Fylld form med kontur, cel-skugga nere till höger och ett litet glansstreck.
function shaded(d, base, shade, { dx = -13, dy = -11, hl = null } = {}) {
  const id = 'c' + uid++;
  let s = `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
  s += `<path d="${d}" fill="${shade}" stroke="${K}" stroke-width="${SW}" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${id})"><path d="${d}" fill="${base}" transform="translate(${dx},${dy})"/>`;
  if (hl) s += `<path d="${hl}" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="9" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}

function limb(d, col, w) {
  return `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + SW}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const dot = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="${K}" stroke-width="${SW}" paint-order="stroke"/>`;
const line = (d, w = 9, col = K) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Öga = svart oval, avskuren uppifrån av ett lock (lutning = slope). Locklinjen sticker ut lite.
function eye(cx, cy, rx, ry, cut, slope, { glint = true, lidW = 8 } = {}) {
  const ell = [];
  for (let i = 0; i < 80; i++) {
    const t = (2 * Math.PI * i) / 80;
    ell.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  const lim = (x) => cy + cut + slope * (x - cx);
  // Sutherland–Hodgman mot halvplanet y >= lim(x)
  const inside = (p) => p[1] >= lim(p[0]);
  const out = [];
  for (let i = 0; i < ell.length; i++) {
    const A = ell[i], B = ell[(i + 1) % ell.length];
    const ia = inside(A), ib = inside(B);
    if (ia) out.push(A);
    if (ia !== ib) {
      const fa = A[1] - lim(A[0]), fb = B[1] - lim(B[0]);
      const t = fa / (fa - fb);
      out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
    }
  }
  let s = `<path d="${P(out)}" fill="${K}"/>`;
  const x0 = cx - rx * 1.3, x1 = cx + rx * 1.3;
  s += line(`M${x0},${lim(x0)} L${x1},${lim(x1)}`, lidW);
  if (glint) s += `<circle cx="${cx - rx * 0.35}" cy="${cy + ry * 0.45}" r="${rx * 0.22}" fill="#ffffff"/>`;
  return s;
}

const RED = '#d0283a', GOLDP = '#f0b638';

// ---------- gemensamma delar för nya figurer ----------
const EMER2 = '#2e9b66', ORANGE = '#ee7b2f';
const TORSO = 'M-58,-212 Q0,-226 58,-212 Q80,-150 76,-96 Q72,-70 40,-70 L-40,-70 Q-72,-70 -76,-96 Q-80,-150 -58,-212 Z';
const shadowE = `<ellipse cx="0" cy="-4" rx="120" ry="16" fill="#000" opacity=".35"/>`;
const foot = (x, C, y = 0, rot = 0) => `<g transform="translate(${x},${y}) rotate(${rot})">` +
  shaded('M-32,-22 Q-32,-44 0,-42 Q34,-42 34,-22 Q34,-4 2,-4 Q-32,-4 -32,-22 Z', C.base, C.shade, { dx: -6, dy: -6 }) + `</g>`;
const torso = (C) => shaded(TORSO, C.base, C.shade, { hl: 'M-48,-190 Q-56,-150 -54,-118' });
const head = (C) => shaded(blob(0, -345, 150, 135), C.base, C.shade, { dx: -16, dy: -13, hl: 'M-118,-410 Q-104,-452 -60,-468' });
const cid = () => 'k' + uid++;
const closedEye = (x, y, w = 22, down = true) => line(`M${x - w},${y} Q${x},${y + (down ? 15 : -26)} ${x + w},${y}`, 11);
const motion = (pts) => pts.map(d => line(d, 6)).join('');


// Varje ritning får egna id:n på sina urklipp, så att två likadana figurer kan stå på samma skärm.
let RID = 0;
const I = (n) => n + '_' + RID;

const lerp = (a, b, k) => a + (b - a) * k;
const lerpPath = (A, B, k) => A.map((v, i) => typeof v === 'number' ? (v + (B[i] - v) * k).toFixed(1) : v).join(' ');
const F2 = (x) => Number(x).toFixed(2);

const TAU = Math.PI * 2;
// mjuk topp kring c (cirkulärt avstånd så loopen blir sömlös)
const bump = (t, c, w) => { let d = Math.abs(t - c); d = Math.min(d, 1 - d); return Math.exp(-((d / w) ** 2)); };
const smooth = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// ---------- DRINKEN: skålar, det skvätter, höjer brynet, blinkar ----------
function drinkenA(t) {
  const C = { base: '#f6f6f4', shade: 'url(#htW)' };
  const toast = bump(t, 0.26, 0.1);
  const br = Math.sin(TAU * t);
  const arm = -18 * toast + 1.5 * br;
  const brow = bump(t, 0.34, 0.09);
  const wink = bump(t, 0.68, 0.035) > 0.5;
  let s = shadowE;
  s += `<g transform="scale(${1 + 0.012 * toast},${1 + 0.01 * br - 0.022 * toast})">`;
  s += limb('M-30,-95 Q-34,-50 -40,-22', C.base, 36) + limb('M30,-95 Q36,-50 44,-22', C.base, 36);
  s += foot(-46, C) + foot(47, C);
  s += limb('M-56,-186 Q-128,-162 -80,-112', C.base, 30) + dot(-80, -110, 19, C.base);
  s += torso(C);
  s += `<g transform="translate(0,${-2 * br}) rotate(${-5 - 4 * toast + br} 0 -230)">`;
  s += shaded(blob(0, -345, 152, 136), C.base, C.shade, { dx: -16, dy: -13, hl: 'M-118,-410 Q-104,-452 -60,-468' });
  s += line('M-148,-430 Q-100,-466 -70,-462', 8) + line('M148,-430 Q100,-466 70,-462', 8);
  s += `<g transform="rotate(-3 0 -462)">`;
  s += `<rect x="-86" y="-486" width="76" height="46" rx="18" fill="${RED}" stroke="${K}" stroke-width="16" paint-order="stroke"/>`;
  s += `<rect x="10" y="-486" width="76" height="46" rx="18" fill="${RED}" stroke="${K}" stroke-width="16" paint-order="stroke"/>`;
  s += line('M-10,-470 Q0,-478 10,-470', 8);
  s += line('M-70,-476 L-52,-476', 6, '#ffd0d4') + line('M26,-476 L40,-476', 6, '#ffd0d4');
  s += `</g>`;
  s += eye(-52, -352, 19, 28, -6, 0.05);
  s += wink ? line('M28,-350 Q48,-338 68,-350', 10) : eye(48, -352, 19, 28, -6, -0.05);
  s += `<g transform="translate(0,${-14 * brow})">` + line('M-84,-408 Q-56,-432 -24,-414', 10) + `</g>`;
  s += line('M20,-394 Q48,-400 78,-392', 10);
  s += line('M-34,-282 Q2,-262 44,-292', 9) + line('M44,-292 Q52,-298 54,-306', 7);
  s += `</g>`;
  // armen med glaset roterar runt axeln
  s += `<g transform="rotate(${arm} 58 -190)">`;
  s += limb('M58,-190 Q150,-178 192,-240', C.base, 30);
  s += `<g transform="translate(30,-30) rotate(${-10 - 6 * toast} 164 -214)">`;
  // stänk: kastas upp i skålen och faller
  const dt = ((t - 0.2) + 1) % 1;
  if (dt < 0.5) {
    const op = 1 - (dt / 0.5) ** 3;
    [[176, -318, 70, -420, 9], [200, -318, 150, -330, 7], [150, -318, -30, -380, 7], [188, -318, 20, -480, 5]].forEach(([x0, y0, vx, vy, r]) => {
      const x = x0 + vx * dt, y = y0 + vy * dt + 0.5 * 1500 * dt * dt;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#f0c25a" stroke="${K}" stroke-width="7" paint-order="stroke" opacity="${op.toFixed(2)}"/>`;
    });
  }
  s += `<g opacity="${toast.toFixed(2)}">` + line('M246,-322 Q268,-336 272,-360', 5) + line('M92,-330 Q78,-352 84,-374', 5) + `</g>`;
  s += `<path d="M104,-318 L228,-318 L166,-250 Z" fill="#ffffff" fill-opacity=".22" stroke="${K}" stroke-width="16" paint-order="stroke" stroke-linejoin="round"/>`;
  const slosh = 6 * toast * Math.sin(TAU * 3 * t);
  s += `<path d="M118,${-304 + slosh} L214,${-304 - slosh} L166,-256 Z" fill="#e8c46e" fill-opacity=".9"/>`;
  s += line('M128,-311 L204,-311', 4, '#ffffff');
  s += line('M166,-252 L166,-184', 9) + line('M166,-252 L166,-184', 3, '#ffffff');
  s += `<ellipse cx="166" cy="-182" rx="30" ry="8" fill="#ffffff" fill-opacity=".6" stroke="${K}" stroke-width="12" paint-order="stroke"/>`;
  s += line('M150,-338 L186,-268', 5);
  s += `<circle cx="176" cy="-288" r="12" fill="#6f7d2c" stroke="${K}" stroke-width="10" paint-order="stroke"/><circle cx="179" cy="-291" r="4.5" fill="#b8242f"/>`;
  s += dot(164, -214, 20, C.base);
  s += `</g></g>`;
  s += `</g>`;
  return s;
}

// ---------- DJ:N: nickar i takt (4 slag per loop), vinylen snurrar ----------
function djA(t) {
  const C = { base: '#7f7f7c', shade: 'url(#htD)' };
  const ph = (t * 4) % 1, beat = Math.floor(t * 4);
  const nod = Math.exp(-ph * 5) * (1 - Math.exp(-ph * 60));   // snabb ner, mjukt upp
  const side = beat % 2 ? 1 : -1;
  let s = shadowE;
  s += `<g transform="translate(0,0) scale(1,${1 - 0.03 * nod})">`;
  s += limb('M-30,-95 Q-34,-50 -40,-22', C.base, 36) + limb('M30,-95 Q36,-50 44,-22', C.base, 36);
  s += foot(-44, C) + foot(46, C);
  s += torso(C);
  // höger arm + vinyl
  s += limb('M56,-196 Q150,-204 178,-330', C.base, 30);
  s += limb('M182,-346 L204,-446', C.base, 13);
  s += `<g transform="translate(212,-500)">`;
  s += `<g transform="rotate(${(720 * t).toFixed(2)})">`;
  s += `<circle r="62" fill="#161616" stroke="${K}" stroke-width="12" paint-order="stroke"/>`;
  s += [52, 44, 36, 28].map(r => `<circle r="${r}" fill="none" stroke="#3c3c3c" stroke-width="2"/>`).join('');
  s += `<circle r="20" fill="${GOLDP}" stroke="${K}" stroke-width="4"/>`;
  s += `<rect x="-3" y="-19" width="6" height="12" rx="2" fill="#fff"/><circle r="4" fill="${K}"/>`;
  s += `</g>`;
  s += `<path d="M-40,-30 A50,50 0 0 1 10,-50" fill="none" stroke="#9a9a9a" stroke-width="4" stroke-linecap="round"/>`;
  s += `</g>`;
  s += `<g opacity="${(0.4 + 0.6 * nod).toFixed(2)}">` + motion(['M128,-540 Q136,-578 172,-588', 'M290,-480 Q298,-444 276,-416']) + `</g>`;
  s += dot(178, -334, 20, C.base);
  // huvud + vänster arm nickar tillsammans
  s += `<g transform="translate(0,${(15 * nod).toFixed(2)}) rotate(${(6 + 7 * side * nod).toFixed(2)} 0 -230)">`;
  s += head(C);
  s += closedEye(-52, -344) + closedEye(52, -344);
  s += line('M-80,-394 Q-54,-406 -28,-398', 9) + line('M28,-398 Q54,-406 80,-394', 9);
  s += line('M-30,-282 Q6,-266 42,-290', 9) + line('M42,-290 Q50,-296 52,-304', 7);
  s += `<path d="M-150,-372 Q-150,-520 0,-520 Q150,-520 150,-372" fill="none" stroke="${K}" stroke-width="34" stroke-linecap="round"/>`;
  s += `<path d="M-150,-372 Q-150,-520 0,-520 Q150,-520 150,-372" fill="none" stroke="${EMER2}" stroke-width="18" stroke-linecap="round"/>`;
  for (const sx of [-1, 1]) {
    s += `<rect x="${sx * 164 - 26}" y="-402" width="52" height="96" rx="22" fill="${EMER2}" stroke="${K}" stroke-width="14" paint-order="stroke"/>`;
    s += `<rect x="${sx * 164 - 12}" y="-388" width="10" height="66" rx="5" fill="#fff" opacity=".35"/>`;
  }
  s += limb('M-56,-194 Q-150,-200 -176,-300', C.base, 30) + dot(-178, -306, 20, C.base);
  s += `</g>`;
  s += `</g>`;
  return s;
}

// ---------- DEN SOM SOMNAT: tunga andetag, snorbubbla, Zzz som stiger ----------
function somnatA(t) {
  const C = { base: '#c4c4c1', shade: 'url(#htM)' };
  const br = Math.sin(TAU * t);          // ett andetag per loop
  const inh = (br + 1) / 2;
  let s = shadowE;
  s += limb('M-30,-95 Q-24,-52 -34,-22', C.base, 36) + limb('M30,-95 Q24,-52 36,-22', C.base, 36);
  s += foot(-38, C) + foot(40, C);
  s += `<g transform="translate(0,-70) scale(${1 + 0.015 * br},${1 + 0.035 * br}) translate(0,70)">`;
  s += torso(C);
  s += `<g transform="translate(0,${(-4 * br).toFixed(2)}) rotate(${(16 - 3 * br).toFixed(2)} 0 -280)">`;
  s += head(C);
  s += closedEye(-52, -336) + closedEye(52, -336);
  s += line('M-78,-378 Q-52,-372 -28,-378', 8) + line('M28,-378 Q52,-372 78,-378', 8);
  s += `<ellipse cx="2" cy="-270" rx="${14 + 3 * inh}" ry="${10 + 4 * inh}" fill="${K}"/>`;
  // snorbubbla som blåses upp och sjunker ihop
  const r = 5 + 20 * smooth(1 - inh);
  s += `<circle cx="${(22 + r * 0.8).toFixed(1)}" cy="${(-274 - r * 0.2).toFixed(1)}" r="${r.toFixed(1)}" fill="#fff" fill-opacity=".75" stroke="${K}" stroke-width="5"/>`;
  s += `<path d="M${(22 + r * 0.4).toFixed(1)},${(-274 - r * 0.7).toFixed(1)} q${(r * 0.3).toFixed(1)},${(-r * 0.2).toFixed(1)} ${(r * 0.55).toFixed(1)},${(r * 0.05).toFixed(1)}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `</g>`;
  s += `<g transform="rotate(-6 0 -140)">`;
  s += `<path d="M-70,-188 Q0,-206 70,-188 L4,-52 Z" fill="#f2c54e" stroke="${K}" stroke-width="14" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<path d="M-76,-196 Q0,-218 76,-196 Q80,-178 70,-174 Q0,-192 -70,-174 Q-80,-178 -76,-196 Z" fill="#d38a2c" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/>`;
  s += [[-26, -150, 13], [20, -156, 12], [0, -112, 11], [-6, -78, 7]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${RED}" stroke="${K}" stroke-width="5" paint-order="stroke"/>`).join('');
  s += `<path d="M32,-140 Q40,-120 34,-104" fill="none" stroke="#f2c54e" stroke-width="10" stroke-linecap="round"/>`;
  s += `</g>`;
  s += limb('M-58,-196 Q-104,-170 -72,-178', C.base, 28) + dot(-72, -180, 19, C.base);
  s += limb('M58,-196 Q104,-170 72,-178', C.base, 28) + dot(72, -180, 19, C.base);
  s += `</g>`;
  // tre Z som stiger och tonar ut, förskjutna i tiden
  for (let i = 0; i < 3; i++) {
    const p = (t + i / 3) % 1;
    const x = 96 + 150 * p + 14 * Math.sin(TAU * p * 1.5), y = -430 - 230 * p, fs = 34 + 46 * p;
    const op = Math.min(1, p / 0.15) * Math.min(1, (1 - p) / 0.25);
    s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}" font-weight="800" fill="#fff" stroke="${K}" stroke-width="${(fs / 5).toFixed(1)}" paint-order="stroke" opacity="${op.toFixed(2)}" transform="rotate(-12 ${x.toFixed(1)} ${y.toFixed(1)})">Z</text>`;
  }
  return s;
}


const TORSO2 = 'M-58,-212 Q0,-226 58,-212 Q80,-150 76,-96 Q72,-70 40,-70 L-40,-70 Q-72,-70 -76,-96 Q-80,-150 -58,-212 Z';
const footP = (x, y, C, rot = 0) => `<g transform="translate(${F2(x)},${F2(y)}) rotate(${F2(rot)})">` +
  shaded('M-32,-22 Q-32,-44 0,-42 Q34,-42 34,-22 Q34,-4 2,-4 Q-32,-4 -32,-22 Z', C.base, C.shade, { dx: -6, dy: -6 }) + `</g>`;

// ---------- DEN SLITNA: somnar sakta, rycker till, försöker blåsa i tutan ----------
function slitnaA(t) {
  const C = { base: '#a9a9a6', shade: 'url(#htG)' };
  const sag = t < 0.75 ? smooth(t / 0.75) : 1 - smooth((t - 0.75) / 0.12);
  const jolt = bump(t, 0.79, 0.03);
  const sway = Math.sin(TAU * t) * 2.5;
  const blow = bump(t, 0.4, 0.07);
  let s = `<ellipse cx="0" cy="-4" rx="120" ry="16" fill="#000" opacity=".35"/>`;
  s += `<g transform="rotate(${F2(sway)} 0 0) translate(0,${F2(-8 * jolt)})">`;
  s += limb('M-30,-95 Q-22,-50 -30,-22', C.base, 36) + limb('M30,-95 Q24,-50 34,-22', C.base, 36);
  s += shaded('M-70,-22 Q-70,-44 -40,-42 Q-8,-40 -8,-20 Q-8,-4 -40,-4 Q-70,-4 -70,-22 Z', C.base, C.shade, { dx: -6, dy: -6 });
  s += shaded('M8,-20 Q8,-42 40,-42 Q72,-42 72,-22 Q72,-4 42,-4 Q8,-4 8,-20 Z', C.base, C.shade, { dx: -6, dy: -6 });
  s += limb('M-58,-184 Q-96,-140 -92,-96', C.base, 30) + dot(-92, -92, 19, C.base);
  s += shaded('M-60,-206 Q0,-216 60,-206 Q82,-150 78,-96 Q74,-70 40,-70 L-40,-70 Q-74,-70 -78,-96 Q-82,-150 -60,-206 Z', C.base, C.shade, { hl: 'M-50,-186 Q-58,-150 -56,-118' });
  const hr = 9 + 9 * sag - 6 * jolt;
  s += `<g transform="rotate(${F2(hr)} 0 -300)">`;
  s += shaded(blob(0, -340, 150, 134), C.base, C.shade, { dx: -16, dy: -13, hl: 'M-116,-404 Q-102,-446 -58,-462' });
  s += `<rect x="-92" y="-424" width="26" height="12" rx="2" fill="#ffffff" stroke="${K}" stroke-width="6" paint-order="stroke" transform="rotate(-24 -79 -418)"/>`;
  s += `<g transform="translate(-100,-292) rotate(-18)" opacity=".85"><path d="M-17,0 Q-12,-12 -3,-7 Q0,-11 3,-7 Q12,-12 17,0 Q8,4 0,2 Q-8,4 -17,0 Z" fill="${RED}"/><path d="M-15,1 Q0,12 15,1 Q8,9 0,9 Q-8,9 -15,1 Z" fill="${RED}"/></g>`;
  const shut = Math.min(1, sag * 1.1) - jolt;
  if (shut > 0.92) s += line('M-72,-336 Q-50,-326 -28,-336', 10) + line('M26,-334 Q48,-324 70,-334', 10);
  else s += eye(-50, -344, 19, 27, 4 + 20 * shut, -0.3, { lidW: 10 }) + eye(48, -344, 19, 27, 10 + 16 * shut, 0.26, { lidW: 10 });
  s += line('M-72,-308 Q-50,-298 -28,-308', 5, '#3a3a3a') + line('M-66,-298 Q-50,-292 -34,-298', 4, '#3a3a3a');
  s += line('M26,-308 Q48,-298 70,-308', 5, '#3a3a3a') + line('M32,-298 Q48,-292 64,-298', 4, '#3a3a3a');
  s += line('M-30,-262 C-20,-272 -10,-252 0,-262 C10,-272 20,-252 30,-262', 8);
  // kinderna blåses upp när hon försöker blåsa
  if (blow > 0.05) s += `<g opacity="${F2(blow)}">` + line('M-108,-300 Q-120,-276 -106,-256', 6) + line('M104,-298 Q118,-274 104,-254', 6) + `</g>`;
  const HAT = 'M-22,-452 L34,-600 L90,-452 Q34,-436 -22,-452 Z';
  s += `<g transform="rotate(${F2(24 + 8 * sag)} 34 -452)">`;
  s += `<clipPath id="${I('hat')}"><path d="${HAT}"/></clipPath>`;
  s += `<path d="${HAT}" fill="${RED}" stroke="${K}" stroke-width="16" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${I('hat')})">` + [0, 1, 2, 3].map(i => `<path d="M-40,${-470 - i * 42} L110,${-520 - i * 42}" stroke="${GOLDP}" stroke-width="15"/>`).join('') + `</g>`;
  s += `<path d="${HAT}" fill="none" stroke="${K}" stroke-width="8" stroke-linejoin="round"/>`;
  s += dot(34, -606, 16, '#ffffff');
  s += `</g>`;
  // tutan rullas ut lite och faller ihop igen
  const A = ['M', 34, -262, 'Q', 44, -236, 40, -208, 'Q', 36, -180, 52, -150];
  const B = ['M', 34, -262, 'Q', 76, -266, 104, -260, 'Q', 134, -254, 156, -238];
  const hp = lerpPath(A, B, blow).replace(/ ([MQ]) /g, ' $1').replace('M ', 'M');
  s += `<path d="${hp}" fill="none" stroke="${K}" stroke-width="32" stroke-linecap="round"/>`;
  s += `<path d="${hp}" fill="none" stroke="${RED}" stroke-width="18" stroke-linecap="round"/>`;
  s += `<path d="${hp}" fill="none" stroke="${GOLDP}" stroke-width="18" stroke-dasharray="10 12"/>`;
  const cx = lerp(62, 166, blow), cy = lerp(-140, -232, blow);
  s += `<circle cx="${F2(cx)}" cy="${F2(cy)}" r="${F2(15 - 5 * blow)}" fill="${RED}" stroke="${K}" stroke-width="9" paint-order="stroke"/>`;
  s += `<rect x="22" y="-274" width="22" height="20" rx="5" fill="#e8c46e" stroke="${K}" stroke-width="10" paint-order="stroke"/>`;
  s += `</g>`;
  s += limb('M58,-184 Q100,-150 98,-100', C.base, 30) + dot(98, -96, 19, C.base);
  s += `</g>`;
  return s;
}

// ---------- DEN FULLA: vinglar, skålar, hickar ----------
function fullaA(t) {
  const C = { base: '#7f7f7c', shade: 'url(#htD)' };
  const sway = 7 * Math.sin(TAU * t);
  const hic = bump(t, 0.56, 0.035);
  const cheers = bump(t, 0.18, 0.09);
  let s = `<ellipse cx="0" cy="-4" rx="${F2(120 + 6 * Math.abs(Math.sin(TAU * t)))}" ry="16" fill="#000" opacity=".35"/>`;
  s += `<g transform="translate(0,${F2(-12 * hic)}) rotate(${F2(-7 + sway)} 0 0)">`;
  s += limb('M-30,-95 Q-6,-54 18,-24', C.base, 36) + limb('M30,-95 Q8,-54 -22,-24', C.base, 36);
  s += shaded('M-56,-22 Q-56,-44 -26,-42 Q4,-40 4,-20 Q4,-4 -26,-4 Q-56,-4 -56,-22 Z', C.base, C.shade, { dx: -6, dy: -6 });
  s += shaded('M-4,-20 Q-4,-42 26,-42 Q58,-42 58,-22 Q58,-4 28,-4 Q-4,-4 -4,-20 Z', C.base, C.shade, { dx: -6, dy: -6 });
  s += `<g transform="rotate(${F2(-14 * Math.sin(TAU * t + 0.6))} -56 -190)">` + limb('M-56,-190 Q-136,-206 -176,-150', C.base, 30) + dot(-178, -146, 20, C.base) + `</g>`;
  s += shaded(TORSO2, C.base, C.shade, { hl: 'M-48,-190 Q-56,-150 -54,-118' });
  s += `<g transform="rotate(${F2(10 - 0.6 * sway + 8 * hic)} 0 -300)">`;
  s += shaded(blob(0, -345, 150, 135), C.base, C.shade, { dx: -16, dy: -13, hl: 'M-118,-410 Q-104,-452 -60,-468' });
  s += line('M-76,-342 Q-52,-326 -28,-342', 11);
  s += hic > 0.3 ? `<circle cx="50" cy="-346" r="20" fill="${K}"/><circle cx="44" cy="-354" r="5" fill="#fff"/>` : eye(50, -346, 19, 27, 3, 0.12, { lidW: 10 });
  s += line('M-82,-392 Q-54,-404 -26,-394', 9) + line(`M24,${-408 - 10 * hic} Q52,${-424 - 10 * hic} 80,${-404 - 10 * hic}`, 9);
  s += `<clipPath id="${I('munF')}"><path d="M-44,-290 Q6,-282 50,-298 Q44,-236 6,-232 Q-34,-236 -44,-290 Z"/></clipPath>`;
  s += `<path d="M-44,-290 Q6,-282 50,-298 Q44,-236 6,-232 Q-34,-236 -44,-290 Z" fill="${K}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${I('munF')})"><path d="M-50,-300 L60,-310 L60,-276 L-50,-272 Z" fill="#fff"/><ellipse cx="10" cy="-236" rx="24" ry="14" fill="#4a4a48"/></g>`;
  // hick-bubblor stiger efter hicket
  const hp = ((t - 0.56) + 1) % 1;
  if (hp < 0.45) {
    const op = 1 - (hp / 0.45) ** 2;
    [[-70, -256, 10, 0], [-92, -270, 8, 0.05], [-106, -284, 6, 0.1]].forEach(([x, y, r, d]) => {
      const q = Math.max(0, hp - d);
      s += `<circle cx="${F2(x - 40 * q)}" cy="${F2(y - 300 * q)}" r="${F2(r * (0.6 + q * 1.5))}" fill="#fff" stroke="${K}" stroke-width="5" paint-order="stroke" opacity="${F2(op)}"/>`;
    });
  }
  s += `<clipPath id="${I('tie')}"><path d="M-150,-404 Q0,-446 150,-404 L150,-378 Q0,-420 -150,-378 Z"/><path d="M-118,-410 L-206,-446 L-214,-418 L-136,-384 Z"/><path d="M-122,-396 L-196,-352 L-180,-328 L-114,-376 Z"/></clipPath>`;
  const fl = 7 * Math.sin(TAU * 2 * t);
  s += `<g transform="rotate(${F2(fl)} -127 -397)"><path d="M-118,-410 L-206,-446 L-214,-418 L-136,-384 Z" fill="${RED}" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/></g>`;
  s += `<g transform="rotate(${F2(-fl)} -127 -397)"><path d="M-122,-396 L-196,-352 L-180,-328 L-114,-376 Z" fill="${RED}" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/></g>`;
  s += `<path d="M-150,-404 Q0,-446 150,-404 L150,-378 Q0,-420 -150,-378 Z" fill="${RED}" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<clipPath id="${I('band')}"><path d="M-150,-404 Q0,-446 150,-404 L150,-378 Q0,-420 -150,-378 Z"/></clipPath>`;
  s += `<g clip-path="url(#${I('band')})">` + Array.from({ length: 16 }, (_, i) => `<path d="M${-170 + i * 26},-360 L${-130 + i * 26},-460" stroke="${GOLDP}" stroke-width="7"/>`).join('') + `</g>`;
  s += `<path d="M-150,-404 Q0,-446 150,-404 L150,-378 Q0,-420 -150,-378 Z" fill="none" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<rect x="-142" y="-412" width="30" height="30" rx="6" fill="${RED}" stroke="${K}" stroke-width="10" paint-order="stroke" transform="rotate(20 -127 -397)"/>`;
  s += `</g>`;
  // ölen
  s += `<g transform="rotate(${F2(-20 * cheers)} 56 -190)">`;
  s += limb('M56,-190 Q160,-176 198,-226', C.base, 30);
  s += `<g transform="translate(28,22)"><g transform="rotate(${F2(-14 - 10 * cheers)} 172 -250)">`;
  const dt = ((t - 0.12) + 1) % 1;
  if (dt < 0.45) {
    const op = 1 - (dt / 0.45) ** 3;
    [[180, -372, 90, -420, 9], [200, -372, 170, -320, 7], [160, -372, -20, -460, 6]].forEach(([x0, y0, vx, vy, r]) => {
      s += `<circle cx="${F2(x0 + vx * dt)}" cy="${F2(y0 + vy * dt + 750 * dt * dt)}" r="${r}" fill="${GOLDP}" stroke="${K}" stroke-width="7" paint-order="stroke" opacity="${F2(op)}"/>`;
    });
  }
  s += `<path d="M132,-352 L212,-352 L204,-218 L140,-218 Z" fill="#fff" fill-opacity=".25" stroke="${K}" stroke-width="16" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<path d="M138,-330 L206,-330 L200,-226 L144,-226 Z" fill="${GOLDP}"/>`;
  [[160, -300, 4, 0], [184, -280, 3, .3], [170, -256, 3.5, .6], [190, -312, 3, .8]].forEach(([x, y, r, ph]) => {
    const q = (t * 2 + ph) % 1;
    s += `<circle cx="${x}" cy="${F2(y + 40 - 90 * q)}" r="${r}" fill="#fff" opacity="${F2(0.8 * (1 - q))}"/>`;
  });
  const fo = 1 + 0.12 * cheers;
  s += `<g transform="translate(172,-340) scale(${F2(fo)}) translate(-172,340)"><path d="M126,-340 Q122,-370 148,-372 Q160,-392 184,-382 Q206,-394 218,-370 Q232,-352 214,-340 Q214,-318 204,-322 Q198,-336 186,-338 L136,-338 Z" fill="#fff" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/></g>`;
  s += line('M148,-320 L148,-236', 5, '#fff');
  s += `</g></g>`;
  s += dot(200, -228, 21, C.base);
  s += `</g>`;
  s += `</g>`;
  return s;
}

// ---------- PARTYHATTEN: knytnäven pumpar, smällaren smäller ----------
function partyhattA(t) {
  const C = { base: '#d8d8d5', shade: 'url(#htL)' };
  const pump = Math.abs(Math.sin(TAU * t)) ** 0.8;      // två pumpar per loop
  const fire = t >= 0.5 ? (t - 0.5) / 0.5 : -1;
  const kick = fire >= 0 ? Math.exp(-fire * 14) : 0;
  let s = `<ellipse cx="0" cy="-4" rx="${F2(125 - 10 * pump)}" ry="16" fill="#000" opacity=".35"/>`;
  s += `<g transform="translate(0,${F2(-14 * pump)})">`;
  s += limb('M-30,-95 Q-42,-50 -54,-22', C.base, 36) + limb('M30,-95 Q42,-50 54,-22', C.base, 36);
  s += shaded('M-92,-22 Q-92,-44 -60,-42 Q-28,-40 -28,-20 Q-28,-4 -60,-4 Q-92,-4 -92,-22 Z', C.base, C.shade, { dx: -6, dy: -6 });
  s += shaded('M28,-20 Q28,-42 60,-42 Q94,-42 94,-22 Q94,-4 62,-4 Q28,-4 28,-20 Z', C.base, C.shade, { dx: -6, dy: -6 });
  s += `<g transform="rotate(${F2(-26 * (1 - pump))} -56 -196)">`;
  s += limb('M-56,-196 Q-150,-214 -196,-392', C.base, 30) + dot(-198, -398, 22, C.base);
  s += `<g opacity="${F2(pump)}">` + line('M-238,-420 L-258,-432', 7) + line('M-232,-388 L-256,-388', 7) + line('M-214,-446 L-224,-466', 7) + `</g>`;
  s += `</g>`;
  s += shaded(TORSO2, C.base, C.shade, { hl: 'M-48,-190 Q-56,-150 -54,-118' });
  s += `<g transform="rotate(${F2(-4 - 4 * pump)} 0 -230)">`;
  s += shaded(blob(0, -345, 150, 135), C.base, C.shade, { dx: -16, dy: -13, hl: 'M-118,-410 Q-104,-452 -60,-468' });
  s += line('M-76,-346 Q-52,-378 -28,-346', 11) + line('M28,-346 Q52,-378 76,-346', 11);
  s += `<g transform="translate(0,${F2(-6 * pump)})">` + line('M-82,-410 Q-54,-428 -26,-414', 9) + line('M26,-414 Q54,-428 82,-410', 9) + `</g>`;
  const my = 0.75 + 0.35 * pump;
  s += `<g transform="translate(0,-296) scale(1,${F2(my)}) translate(0,296)">`;
  s += `<clipPath id="${I('munP')}"><path d="M-46,-296 Q0,-302 46,-296 Q40,-226 0,-222 Q-40,-226 -46,-296 Z"/></clipPath>`;
  s += `<path d="M-46,-296 Q0,-302 46,-296 Q40,-226 0,-222 Q-40,-226 -46,-296 Z" fill="${K}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${I('munP')})"><rect x="-50" y="-300" width="100" height="18" fill="#fff"/><ellipse cx="4" cy="-226" rx="26" ry="16" fill="#5a5a58"/></g>`;
  s += `</g>`;
  s += `<g transform="rotate(${F2(-8 + 6 * Math.sin(TAU * 2 * t + 1))} 0 -468)">`;
  const HAT = 'M-58,-466 L0,-648 L58,-466 Q0,-452 -58,-466 Z';
  s += `<clipPath id="${I('hatP')}"><path d="${HAT}"/></clipPath>`;
  s += `<path d="${HAT}" fill="${GOLDP}" stroke="${K}" stroke-width="16" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${I('hatP')})">` + [[-18, -500, 11], [22, -520, 10], [-4, -560, 9], [12, -604, 7], [-30, -478, 8], [36, -476, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${RED}"/>`).join('') + `</g>`;
  s += `<path d="${HAT}" fill="none" stroke="${K}" stroke-width="8" stroke-linejoin="round"/>`;
  s += dot(0, -654, 17, RED);
  s += `</g></g>`;
  // smällaren
  s += `<g transform="rotate(${F2(10 * kick)} 56 -192)">`;
  s += limb('M56,-192 Q150,-180 188,-206', C.base, 30);
  s += `<g transform="translate(38,20)"><g transform="rotate(-38 160 -228)">`;
  s += `<clipPath id="${I('pop')}"><path d="M144,-224 L214,-330 Q186,-352 140,-334 Z"/></clipPath>`;
  s += `<path d="M144,-224 L214,-330 Q186,-352 140,-334 Z" fill="${RED}" stroke="${K}" stroke-width="14" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${I('pop')})">` + [0, 1, 2].map(i => `<path d="M120,${-262 - i * 30} L230,${-300 - i * 30}" stroke="${GOLDP}" stroke-width="10"/>`).join('') + `</g>`;
  s += `<path d="M144,-224 L214,-330 Q186,-352 140,-334 Z" fill="none" stroke="${K}" stroke-width="7" stroke-linejoin="round"/>`;
  s += `</g></g>`;
  s += dot(190, -206, 21, C.base);
  if (fire >= 0) {
    const g = smooth(Math.min(1, fire / 0.35)), op = 1 - smooth((fire - 0.6) / 0.4);
    s += `<g transform="translate(38,20)" opacity="${F2(op)}">`;
    const sp = (d) => `<path d="${d}" pathLength="1" stroke-dasharray="${F2(g)} 1" fill="none" stroke="${K}" stroke-width="13" stroke-linecap="round"/><path d="${d}" pathLength="1" stroke-dasharray="${F2(g)} 1" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
    s += sp('M232,-300 Q248,-330 236,-356 Q226,-382 246,-410');
    s += sp('M240,-288 Q272,-300 286,-330 Q298,-356 326,-362');
    s += sp('M226,-310 Q214,-348 230,-380 Q244,-408 230,-440');
    [[272, -400, 30, 120, -360], [302, -300, -20, 260, -120], [260, -452, 60, 40, -420], [316, -400, 10, 220, -300], [250, -340, 80, 160, -260]].forEach(([x, y, r, vx, vy]) => {
      const px = 232 + vx * fire, py = -300 + vy * fire + 500 * fire * fire;
      s += `<rect x="${F2(px - 10)}" y="${F2(py - 5)}" width="20" height="10" rx="1.5" transform="rotate(${F2(r + 600 * fire)} ${F2(px)} ${F2(py)})" fill="#fff" stroke="${K}" stroke-width="4" paint-order="stroke"/>`;
    });
    s += `<g opacity="${F2(kick)}">` + line('M232,-270 L262,-258', 6) + line('M214,-324 L208,-356', 6) + line('M246,-318 L276,-336', 6) + `</g>`;
    s += `</g>`;
  }
  s += `</g>`;
  s += `</g>`;
  return s;
}

// ---------- KARAOKESTJÄRNAN: sjunger med inlevelse, boan gungar ----------
function boaPath(sway) {
  const boa = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    let x, y;
    if (t < 0.5) { const u = t / 0.5; x = -96 + 96 * u + Math.sin(u * 9) * 4; y = -112 - 104 * Math.sin(u * Math.PI / 2); }
    else { const u = (t - 0.5) / 0.5; x = 96 * u + Math.sin(u * 9) * 4; y = -216 + 120 * (1 - Math.cos(u * Math.PI / 2)); }
    const far = Math.abs(t - 0.5) * 2;   // ändarna gungar mest
    boa.push([x + sway * far * far * (t < 0.5 ? 1 : -1) * 0.6 + sway * far * far, y]);
  }
  return boa;
}
function karaokeA(t) {
  const C = { base: '#f6f6f4', shade: 'url(#htW)' };
  const syl = Math.abs(Math.sin(TAU * 2 * t));
  const sw = Math.sin(TAU * t);
  let s = shadowE;
  s += `<g transform="rotate(${F2(2 * sw)} 0 0)">`;
  s += limb('M-30,-95 Q-50,-50 -64,-22', C.base, 36) + limb('M30,-95 Q40,-50 50,-22', C.base, 36);
  s += foot(-70, C) + foot(54, C);
  s += `<g transform="rotate(${F2(-14 * sw - 6)} -56 -194)">`;
  s += limb('M-56,-194 Q-140,-236 -214,-252', C.base, 30) + dot(-218, -254, 20, C.base);
  s += `<g opacity="${F2(0.3 + 0.7 * syl)}">` + motion(['M-250,-290 L-266,-306', 'M-258,-256 L-282,-258', 'M-248,-222 L-266,-210']) + `</g>`;
  s += `</g>`;
  s += torso(C);
  const boa = boaPath(12 * Math.sin(TAU * t + 0.8));
  const bd = 'M' + boa.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  let fuzz = '';
  boa.forEach(([x, y], i) => {
    for (let k = 0; k < 9; k++) {
      const a = (i * 0.7 + k * 0.698) % TAU, r0 = 16, r1 = 31 + ((i * 7 + k * 3) % 6);
      fuzz += `M${(x + r0 * Math.cos(a)).toFixed(1)},${(y + r0 * Math.sin(a)).toFixed(1)} L${(x + r1 * Math.cos(a + .15)).toFixed(1)},${(y + r1 * Math.sin(a + .15)).toFixed(1)} `;
    }
  });
  s += `<path d="${fuzz}" stroke="${K}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="${bd}" fill="none" stroke="${K}" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${fuzz}" stroke="${ORANGE}" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<path d="${bd}" fill="none" stroke="${ORANGE}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += boa.filter((_, i) => i % 2 === 0).map(([x, y]) => `<path d="M${(x - 9).toFixed(1)},${(y - 4).toFixed(1)} q7,-9 16,-2" fill="none" stroke="#ffb27a" stroke-width="3.5" stroke-linecap="round"/>`).join('');
  s += boa.filter((_, i) => i % 2 === 1).map(([x, y]) => `<path d="M${(x - 7).toFixed(1)},${(y + 7).toFixed(1)} q7,6 14,-2" fill="none" stroke="#b9561a" stroke-width="3.5" stroke-linecap="round"/>`).join('');
  s += `<g transform="rotate(${F2(-8 + 4 * sw)} 0 -230)">`;
  s += head(C);
  s += closedEye(-52, -348) + closedEye(52, -348);
  s += `<g transform="translate(0,${F2(-6 * syl)})">` + line('M-82,-388 Q-58,-404 -30,-416', 9) + line('M30,-416 Q58,-404 82,-388', 9) + `</g>`;
  const ry = 24 + 18 * syl, rx = 28 + 7 * syl;
  s += `<clipPath id="${I('munK')}"><ellipse cx="-4" cy="${F2(-276 + ry * 0.35)}" rx="${F2(rx)}" ry="${F2(ry)}"/></clipPath>`;
  s += `<ellipse cx="-4" cy="${F2(-276 + ry * 0.35)}" rx="${F2(rx)}" ry="${F2(ry)}" fill="${K}"/>`;
  s += `<g clip-path="url(#${I('munK')})"><rect x="-40" y="${F2(-276 + ry * 0.35 - ry)}" width="72" height="13" fill="#fff"/><ellipse cx="-4" cy="${F2(-276 + ry * 1.25)}" rx="22" ry="15" fill="#5a5a58"/></g>`;
  s += `</g>`;
  s += limb('M56,-194 Q130,-160 92,-232', C.base, 30);
  s += `<g transform="rotate(${F2(-38 + 4 * sw)} 84 -250)">`;
  s += `<path d="M74,-250 L94,-250 L90,-170 L78,-170 Z" fill="${GOLDP}" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/>`;
  s += `<circle cx="84" cy="-272" r="26" fill="#d9d9d6" stroke="${K}" stroke-width="14" paint-order="stroke"/>`;
  s += [-12, -4, 4, 12].map(o => `<path d="M${84 + o},-294 L${84 + o},-250" stroke="#8a8a88" stroke-width="2.5"/>`).join('');
  s += `<rect x="70" y="-252" width="28" height="10" rx="3" fill="${GOLDP}" stroke="${K}" stroke-width="6" paint-order="stroke"/>`;
  s += line(`M84,-170 Q84,-120 ${F2(120 + 10 * sw)},-110 Q160,-100 150,-40`, 5);
  s += `</g>`;
  s += dot(94, -236, 20, C.base);
  s += `</g>`;
  return s;
}

// ---------- SELFIEDROTTNINGEN: poserar, blixten går, blinkar ----------
function selfieA(t) {
  const C = { base: '#d8d8d5', shade: 'url(#htL)' };
  const flash = bump(t, 0.5, 0.03);
  const blink = bump(t, 0.53, 0.035) > 0.45;
  const tilt = 8 - 14 * bump(t, 0.66, 0.12) + 3 * bump(t, 0.2, 0.1);
  const up = bump(t, 0.44, 0.1);
  let s = shadowE;
  s += limb('M-30,-95 Q-30,-50 -36,-22', C.base, 36);
  const kick = 12 * Math.sin(TAU * 2 * t);
  s += `<g transform="rotate(${F2(-kick * 0.5)} 30 -95)">` + limb('M30,-95 Q56,-66 76,-52', C.base, 36) + foot(84, C, -40, -30 + kick) + `</g>`;
  s += foot(-40, C);
  s += torso(C);
  s += `<g transform="rotate(${F2(-6 * up)} 56 -194)">`;
  s += limb('M56,-194 Q170,-226 196,-412', C.base, 30);
  s += `<g transform="rotate(-14 204 -470)">`;
  s += `<rect x="174" y="-534" width="62" height="112" rx="14" fill="${EMER2}" stroke="${K}" stroke-width="14" paint-order="stroke"/>`;
  s += `<rect x="184" y="-522" width="24" height="24" rx="7" fill="${K}"/><circle cx="196" cy="-510" r="6" fill="#4a4a4a"/><circle cx="218" cy="-514" r="4" fill="#fff"/>`;
  s += `<rect x="182" y="-470" width="8" height="40" rx="4" fill="#fff" opacity=".3"/>`;
  if (flash > 0.02) {
    const R0 = 20 + 90 * flash;
    s += `<g opacity="${F2(flash)}"><circle cx="218" cy="-514" r="${F2(R0 * 0.55)}" fill="#fff"/>`;
    s += Array.from({ length: 10 }, (_, i) => { const a = TAU * i / 10; return `<path d="M${F2(218 + Math.cos(a) * R0 * 0.6)},${F2(-514 + Math.sin(a) * R0 * 0.6)} L${F2(218 + Math.cos(a) * R0 * 1.3)},${F2(-514 + Math.sin(a) * R0 * 1.3)}" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`; }).join('');
    s += `</g>`;
  }
  s += `</g>`;
  s += dot(198, -418, 21, C.base);
  s += `</g>`;
  s += `<g transform="rotate(${F2(tilt)} 0 -230)">`;
  s += head(C);
  for (const sx of [-1, 1]) s += `<circle cx="${sx * 146}" cy="-286" r="20" fill="none" stroke="${K}" stroke-width="14"/><circle cx="${sx * 146}" cy="-286" r="20" fill="none" stroke="${GOLDP}" stroke-width="7"/>`;
  if (blink) s += line('M-68,-344 Q-48,-334 -28,-344', 10) + line('M30,-346 Q50,-336 70,-346', 10);
  else s += eye(-48, -348, 18, 26, -2, -0.08) + eye(50, -350, 18, 26, -2, 0.08);
  s += line('M-66,-372 L-80,-384', 6) + line('M-62,-378 L-72,-394', 6) + line('M68,-376 L82,-388', 6) + line('M64,-382 L74,-398', 6);
  s += line('M-80,-404 Q-56,-426 -26,-414', 9) + line('M26,-416 Q56,-432 84,-406', 9);
  const pout = 1 + 0.18 * Math.max(0, Math.sin(TAU * 2 * t));
  s += `<g transform="translate(0,-276) scale(${F2(pout)}) translate(0,276)">`;
  s += `<path d="M-24,-276 Q-14,-298 0,-286 Q14,-298 24,-276 Q12,-256 0,-262 Q-12,-256 -24,-276 Z" fill="${RED}" stroke="${K}" stroke-width="10" paint-order="stroke" stroke-linejoin="round"/>`;
  s += line('M-16,-276 Q0,-270 16,-276', 4);
  s += `</g></g>`;
  const wig = 8 * Math.sin(TAU * 4 * t);
  s += limb('M-56,-194 Q-150,-206 -168,-292', C.base, 30);
  s += `<g transform="rotate(${F2(wig)} -170 -298)">` + limb('M-178,-306 L-200,-362', C.base, 14) + limb('M-162,-310 L-160,-368', C.base, 14) + `</g>`;
  s += dot(-170, -298, 21, C.base);
  return s;
}

// ---------- DANSAREN: disco-pekar upp och ner, höfterna gungar, sparkar ----------
function sneakerA(x, y, rot, flip = 1) {
  return `<g transform="translate(${F2(x)},${F2(y)}) rotate(${F2(rot)}) scale(${flip},1)">
    <path d="M-36,-8 L-36,-30 Q-34,-50 -8,-50 Q10,-50 16,-36 Q40,-32 44,-14 L44,-8 Z" fill="${GOLDP}" stroke="${K}" stroke-width="14" paint-order="stroke" stroke-linejoin="round"/>
    <path d="M-40,-10 L48,-10 Q50,2 40,4 L-34,4 Q-42,2 -40,-10 Z" fill="#fff" stroke="${K}" stroke-width="10" paint-order="stroke" stroke-linejoin="round"/>
    <path d="M-2,-40 L10,-30 M6,-44 L18,-34" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path d="M-30,-40 Q-24,-46 -16,-46" stroke="#fff6c8" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
}
function dansarenA(t) {
  const C = { base: '#a9a9a6', shade: 'url(#htG)' };
  const b = (Math.sin(TAU * 2 * t - Math.PI / 2) + 1) / 2;   // 0 = pekar upp, 1 = pekar ner
  const hip = Math.sin(TAU * 2 * t);
  let s = shadowE;
  s += `<g transform="rotate(${F2(4 + 6 * hip)} 0 0) translate(0,${F2(-8 * (1 - Math.abs(hip)))})">`;
  s += limb('M-30,-95 Q-36,-54 -44,-26', C.base, 36);
  s += sneakerA(-44, -2, 0, -1);
  s += `<g transform="rotate(${F2(-22 * (1 - b))} 30 -95)">` + limb('M30,-95 Q92,-96 124,-66', C.base, 36) + sneakerA(138, -50, -40) + `</g>`;
  s += `<g opacity="${F2(1 - b)}">` + motion(['M150,-150 Q176,-144 188,-124', 'M168,-168 Q200,-160 214,-136']) + `</g>`;
  s += limb('M-56,-186 Q-128,-162 -80,-112', C.base, 30) + dot(-80, -110, 19, C.base);
  s += torso(C);
  const ch = [];
  for (let i = 0; i <= 14; i++) { const q = i / 14; ch.push([-60 + 120 * q + 8 * hip * Math.sin(Math.PI * q), -206 + 46 * Math.sin(Math.PI * q)]); }
  s += ch.map(([x, y]) => `<ellipse cx="${F2(x)}" cy="${F2(y)}" rx="8" ry="6" fill="none" stroke="${K}" stroke-width="9"/><ellipse cx="${F2(x)}" cy="${F2(y)}" rx="8" ry="6" fill="none" stroke="${GOLDP}" stroke-width="4"/>`).join('');
  s += `<circle cx="${F2(8 * hip)}" cy="-150" r="15" fill="${GOLDP}" stroke="${K}" stroke-width="8" paint-order="stroke"/>`;
  s += `<g transform="translate(0,${F2(6 * b)}) rotate(${F2(-6 - 5 * hip)} 0 -230)">`;
  s += head(C);
  s += eye(-50, -350, 19, 27, -4, 0.0) + eye(50, -350, 19, 27, -4, 0.0);
  s += line('M-82,-404 Q-54,-428 -24,-412', 10) + line('M22,-396 Q50,-402 80,-394', 10);
  s += `<clipPath id="${I('munD')}"><path d="M-40,-292 Q6,-284 48,-298 Q42,-246 4,-242 Q-32,-246 -40,-292 Z"/></clipPath>`;
  s += `<path d="M-40,-292 Q6,-284 48,-298 Q42,-246 4,-242 Q-32,-246 -40,-292 Z" fill="${K}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${I('munD')})"><path d="M-50,-300 L60,-312 L60,-280 L-50,-276 Z" fill="#fff"/></g>`;
  s += `</g>`;
  // pekarmen: upp snett åt höger, sen ner snett över kroppen
  s += `<g transform="rotate(${F2(72 * b)} 56 -196)">`;
  s += limb('M56,-196 Q150,-250 208,-392', C.base, 30);
  s += limb('M214,-410 L232,-452', C.base, 13);
  s += dot(208, -398, 20, C.base);
  s += `<g opacity="${F2(Math.max(0, 1 - 3 * Math.min(b, 1 - b)))}">` + motion(['M250,-470 L268,-490', 'M262,-438 L288,-446', 'M232,-496 L236,-520']) + `</g>`;
  s += `</g>`;
  s += `</g>`;
  return s;
}

// ---------- HEMGÅNGEN: går hem, vinkar, klackarna dinglar ----------
function stilettoA(x, y, rot) {
  return `<g transform="translate(${F2(x)},${F2(y)}) rotate(${F2(rot)})">
    <path d="M-38,-34 Q-30,-38 -24,-30 Q-10,-12 16,-10 Q40,-8 46,0 Q48,8 38,8 L-6,8 Q-24,8 -34,0 Z" fill="${RED}" stroke="${K}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"/>
    <path d="M-36,-4 L-32,34 L-26,34 L-26,2" fill="${RED}" stroke="${K}" stroke-width="10" paint-order="stroke" stroke-linejoin="round"/>
    <path d="M-28,-24 Q-14,-10 10,-6" fill="none" stroke="#ff8a8f" stroke-width="3" stroke-linecap="round"/></g>`;
}
function hemgangenA(t) {
  const C = { base: '#6c6c69', shade: 'url(#htE)' };
  const st = Math.sin(TAU * 2 * t);
  const lL = Math.max(0, st), lR = Math.max(0, -st);
  const blink = bump(t, 0.3, 0.035) > 0.45 || bump(t, 0.36, 0.03) > 0.45;
  let s = shadowE;
  s += `<g transform="translate(0,${F2(-7 * Math.abs(st))}) rotate(${F2(3 * st)} 0 0)">`;
  s += limb(`M-30,-95 Q-52,${F2(-56 - 10 * lL)} -66,${F2(-24 - 22 * lL)}`, C.base, 36) + limb(`M30,-95 Q44,${F2(-56 - 10 * lR)} 58,${F2(-26 - 22 * lR)}`, C.base, 36);
  s += footP(-68, -22 * lL, C, -6 * lL) + footP(60, -2 - 22 * lR, C, -8 + 6 * lR);
  s += `<g transform="rotate(${F2(16 * Math.sin(TAU * 4 * t))} -56 -194)">`;
  s += limb('M-56,-194 Q-140,-214 -170,-318', C.base, 30) + dot(-172, -324, 21, C.base);
  s += line('M-206,-352 Q-214,-326 -206,-300', 6) + line('M-226,-366 Q-238,-328 -226,-290', 6);
  s += `</g>`;
  s += torso(C);
  s += limb('M56,-192 Q104,-152 108,-112', C.base, 30);
  const sw = 16 * Math.sin(TAU * 2 * t + 0.9);
  s += `<g transform="rotate(${F2(sw)} 108 -108)">`;
  s += line('M108,-104 Q118,-84 120,-70', 4) + line('M104,-104 Q100,-80 96,-62', 4);
  s += stilettoA(136, -40, 72) + stilettoA(100, -30, 100);
  s += `</g>`;
  s += dot(108, -108, 20, C.base);
  s += `<g transform="rotate(${F2(5 + 3 * st)} 0 -230)">`;
  s += head(C);
  if (blink) s += line('M-70,-336 Q-50,-326 -30,-336', 10) + line('M30,-336 Q50,-326 70,-336', 10);
  else s += eye(-50, -344, 19, 27, 6, -0.12, { lidW: 10 }) + eye(50, -344, 19, 27, 6, 0.12, { lidW: 10 });
  s += `<path d="M-66,-316 Q-60,-296 -52,-312 Q-48,-292 -40,-314" fill="none" stroke="#2c2c2a" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M36,-314 Q42,-294 50,-312 Q56,-292 64,-316" fill="none" stroke="#2c2c2a" stroke-width="5" stroke-linecap="round"/>`;
  s += line('M-80,-392 Q-54,-404 -26,-396', 9) + line('M26,-396 Q54,-404 80,-392', 9);
  s += line('M-32,-270 Q4,-250 40,-272', 9);
  s += `</g>`;
  s += `</g>`;
  return s;
}



// ---------- Det som appen använder ----------
const DRAW = {
  drinken: drinkenA, slitna: slitnaA, fulla: fullaA, partyhatt: partyhattA, karaoke: karaokeA,
  dj: djA, selfie: selfieA, dansaren: dansarenA, somnat: somnatA, hemgangen: hemgangenA,
};
const IDS = Object.keys(DRAW);
// Ljusa figurer står på mörk bricka, mörka figurer på ljus bricka
const LIGHT = { drinken: 1, partyhatt: 1, karaoke: 1, selfie: 1, somnat: 1 };
// Den bild i loopen som passar bäst som stillbild på brickan
const STILL = { drinken: 0, slitna: 0.1, fulla: 0.05, partyhatt: 0.25, karaoke: 0.125, dj: 0.02, selfie: 0.1, dansaren: 0, somnat: 0.3, hemgangen: 0.05 };
const LOOP = 2.4; // sekunder per varv

function draw(id, t) { RID++; return (DRAW[id] || DRAW.drinken)(t); }

// Hela figuren, fötterna nere i mitten
function full(id, t, cls) {
  return '<svg class="' + (cls || 'fig') + '" viewBox="-290 -700 580 720" aria-hidden="true">' + draw(id, t == null ? STILL[id] : t) + '</svg>';
}

// Huvudet i en rund bricka. Hattar får sticka ut ovanför.
function badge(id, t) {
  RID++;
  const c = 'bc_' + RID, light = !!LIGHT[id];
  return '<svg class="badge" viewBox="-230 -640 460 500" aria-hidden="true">' +
    // Rekvisita (Zzz, glas, skiva, mobil, hattar) får sticka ut ovanför och bredvid huvudet
    '<clipPath id="' + c + '"><circle cx="0" cy="-350" r="200"/><rect x="-335" y="-780" width="670" height="430"/></clipPath>' +
    '<circle cx="0" cy="-350" r="200" fill="' + (light ? '#161616' : '#ecebe8') + '" stroke="#111" stroke-width="22"/>' +
    '<circle cx="0" cy="-350" r="200" fill="url(#' + (light ? 'fdotsW' : 'fdotsK') + ')"/>' +
    '<g clip-path="url(#' + c + ')">' + draw(id, t == null ? STILL[id] : t) + '</g>' +
    (light ? '<circle cx="0" cy="-350" r="200" fill="none" stroke="#fff" stroke-width="8" opacity=".9"/>' : '') +
    '</svg>';
}

// Prickrastren som figurerna använder. Läggs in en gång i dokumentet.
const DEFS = '<svg width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>' +
  '<pattern id="htW" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#f6f6f4"/><circle cx="5" cy="5" r="3.3" fill="#9c9c9a"/></pattern>' +
  '<pattern id="htL" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#d8d8d5"/><circle cx="5" cy="5" r="3.3" fill="#7e7e7c"/></pattern>' +
  '<pattern id="htM" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#c4c4c1"/><circle cx="5" cy="5" r="3.3" fill="#6c6c6a"/></pattern>' +
  '<pattern id="htG" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#a9a9a6"/><circle cx="5" cy="5" r="3.4" fill="#4e4e4c"/></pattern>' +
  '<pattern id="htD" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#7f7f7c"/><circle cx="5" cy="5" r="3.4" fill="#343432"/></pattern>' +
  '<pattern id="htE" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#6c6c69"/><circle cx="5" cy="5" r="3.4" fill="#262624"/></pattern>' +
  '<pattern id="fdotsW" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="5" fill="#fff" opacity=".1"/></pattern>' +
  '<pattern id="fdotsK" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="5" fill="#000" opacity=".12"/></pattern>' +
  '</defs></svg>';
function ensureDefs() {
  if (document.getElementById('htW')) return;
  const d = document.createElement('div');
  d.innerHTML = DEFS;
  document.body.insertBefore(d.firstChild, document.body.firstChild);
}

// ---------- Rörelse ----------
// Element med data-fig ritas om ungefär 30 gånger i sekunden medan de syns.
const live = new Set();
let raf = null, last = 0;
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function tick(now) {
  raf = null;
  if (now - last >= 33) {
    last = now;
    live.forEach((el) => {
      if (!el.isConnected) { live.delete(el); return; }
      if (!el.offsetParent && el.getClientRects().length === 0) return;
      const g = el._figG;
      if (!g) return;
      const t = (((now / 1000) / LOOP + (el._figPhase || 0)) % 1 + 1) % 1;
      g.innerHTML = draw(el._figId, t);
    });
  }
  if (live.size) raf = requestAnimationFrame(tick);
}
// Lägger en levande figur i ett element. Utan rörelse (eller med reducerad rörelse) blir den stilla.
function mount(el, id, opts) {
  opts = opts || {};
  el.innerHTML = '<svg class="fig" viewBox="-290 -700 580 720" aria-hidden="true"><g></g></svg>';
  el._figG = el.querySelector('g');
  el._figId = id;
  el._figPhase = opts.phase || 0;
  el._figG.innerHTML = draw(id, opts.t == null ? STILL[id] : opts.t);
  if (opts.still || reduced()) { live.delete(el); return el; }
  live.add(el);
  if (!raf) raf = requestAnimationFrame(tick);
  return el;
}
function unmount(el) { live.delete(el); }

window.Figures = { ids: IDS, full, badge, mount, unmount, ensureDefs, isLight: (id) => !!LIGHT[id] };
})();
