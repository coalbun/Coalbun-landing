// Spelar igenom appen och letar layoutfel på varje skärm. Körs i WebKit av run.py.
(function () {
  if (window.top !== window || location.protocol !== 'http:') return;
  const T = window.__T;
  const MH = window.webkit.messageHandlers;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const log = (s) => MH.log.postMessage(String(s));
  const issues = [];
  const info = [];
  let shotN = 0;
  async function shot(name) { MH.shot.postMessage(String(++shotN).padStart(2, '0') + '-' + name); await wait(250); }

  // Namn får vara högst 10 tecken. De bredaste som går: W och M.
  const CFGS = {
    duo: ['Gyllenhjär', 'Wilhelmina'],
    six: ['Jag', 'Pippi', 'Yggy', 'Fjolla', 'Jeppe', 'Ljungqvist'],
    ten: ['Gyllenhjär', 'Jag', 'Pippi', 'Yggy', 'Fjolla', 'Jeppe', 'Åsa', 'Q', 'Ljungqvist', 'Wilhelmina'],
    wide: ['MMMMMMMMMM', 'WWWWWWWWWW', 'Wilhelmina', 'Mohammed-M', 'Gyllenhjär', 'Maximilian', 'Annemaria', 'Bartholome', 'Wolfgangus', 'Wiktoriaaa'],
  };
  const NAMES = CFGS[T.cfg];

  function visible(el) {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      if (e.hidden) return false;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    }
    return true;
  }
  function ownText(el) { return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); }
  function textRect(el) {
    const r = document.createRange(); r.selectNodeContents(el);
    const rs = [...r.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
    if (!rs.length) return null;
    return { l: Math.min(...rs.map((x) => x.left)), t: Math.min(...rs.map((x) => x.top)), r: Math.max(...rs.map((x) => x.right)), b: Math.max(...rs.map((x) => x.bottom)) };
  }
  function clipOf(el) {
    let c = { l: 0, t: 0, r: innerWidth, b: innerHeight, by: 'skärmen' };
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const clipX = cs.overflowX !== 'visible', clipY = cs.overflowY !== 'visible';
      if (!clipX && !clipY) continue;
      const b = e.getBoundingClientRect();
      const nm = desc(e);
      if (clipX && b.left > c.l) { c.l = b.left; c.byL = nm; }
      if (clipX && b.right < c.r) { c.r = b.right; c.byR = nm; }
      if (clipY && b.top > c.t) { c.t = b.top; c.byT = nm; }
      if (clipY && b.bottom < c.b) { c.b = b.bottom; c.byB = nm; }
    }
    return c;
  }
  function desc(e) {
    if (!e || !e.tagName) return '?';
    const cls = typeof e.className === 'string' ? e.className : (e.className && e.className.baseVal) || '';
    return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (cls ? '.' + cls.trim().split(/\s+/).join('.') : '');
  }
  function add(tag, msg) { const s = tag + ': ' + msg; if (!issues.includes(s)) issues.push(s); }
  function note(tag, msg) { const s = tag + ': ' + msg; if (!info.includes(s)) info.push(s); }

  function audit(tag) {
    const se = document.scrollingElement;
    if (se.scrollHeight > innerHeight + 1 || se.scrollWidth > innerWidth + 1) add(tag, `sidan går att scrolla (${se.scrollWidth}x${se.scrollHeight})`);
    const texts = [];
    if (se.scrollWidth > innerWidth + 1) document.querySelectorAll('body *').forEach((el) => {
      if (!visible(el) || el.closest('svg')) return;
      const r = el.getBoundingClientRect(), c = clipOf(el.parentElement || el);
      if (r.right > innerWidth + 1 && c.r > innerWidth + 1) add(tag, `${desc(el)} sticker ut till höger (${r.left.toFixed(0)}-${r.right.toFixed(0)})`);
    });
    const root = document.querySelector('#layer .sheet') ? document.getElementById('layer') : document.body;
    root.querySelectorAll('*').forEach((el) => {
      if (el.closest('#intro, .toast, canvas, .skip')) return;
      if (!visible(el)) return;
      const rc = el.getBoundingClientRect();
      // Figurer: rimlig storlek
      if (el.matches('.avatar, .fbadge, .slot')) {
        if (rc.width < 12 || rc.height < 12) add(tag, `${desc(el)} är nästan osynlig (${rc.width.toFixed(0)}x${rc.height.toFixed(0)})`);
        if (rc.width > rc.height * 1.4) add(tag, `${desc(el)} har fel form (${rc.width.toFixed(0)}x${rc.height.toFixed(0)})`);
        const svg = el.querySelector('svg'); if (svg) { const s = svg.getBoundingClientRect(); if (s.width > rc.width + 2 || s.height > rc.height + 2) add(tag, `figuren i ${desc(el)} är större än sin ruta (${s.width.toFixed(0)}x${s.height.toFixed(0)} i ${rc.width.toFixed(0)}x${rc.height.toFixed(0)})`); }
      }
      if (!ownText(el) || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
      if (el.closest('svg')) return; // ord i SVG (MATCH!, VS, namn) kollas på bilderna
      const txt = el.textContent.trim().slice(0, 24);
      if (rc.width < 3 || rc.height < 3) { add(tag, `texten "${txt}" syns inte (${desc(el)} ${rc.width.toFixed(0)}x${rc.height.toFixed(0)})`); return; }
      const tr = el.tagName.toLowerCase() === 'text' ? { l: rc.left, t: rc.top, r: rc.right, b: rc.bottom } : textRect(el);
      if (!tr) return;
      const c = clipOf(el);
      const cs = getComputedStyle(el);
      const ell = cs.textOverflow === 'ellipsis';
      if (ell && cs.overflowX !== 'visible') {
        const room = el.offsetWidth ? el.getBoundingClientRect().width * el.clientWidth / el.offsetWidth * 0 + (el.offsetWidth - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)) * (el.getBoundingClientRect().width / el.offsetWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) : 0;
        const tw = tr.r - tr.l;
        if (tw > room + 0.01) add(tag, `"${txt}" förkortas med … (${desc(el)}, ${(tw - room).toFixed(2)}px för bred)`);
      } else if (tr.r > c.r + 1.5 || tr.l < c.l - 1.5) {
        if (ell && el.scrollWidth > el.clientWidth) add(tag, `"${txt}" förkortas med … (${desc(el)})`);
        else add(tag, `texten "${txt}" kapas på sidan (${desc(el)}, ${(Math.max(tr.r - c.r, c.l - tr.l)).toFixed(1)}px av ${c.byR || c.byL || 'skärmen'})`);
      }
      if (tr.b > c.b + 1.5) add(tag, `texten "${txt}" kapas nertill (${desc(el)}, ${(tr.b - c.b).toFixed(1)}px av ${c.byB || 'skärmen'})`);
      if (tr.t < c.t - 1.5) add(tag, `texten "${txt}" kapas upptill (${desc(el)}, ${(c.t - tr.t).toFixed(1)}px av ${c.byT || 'skärmen'})`);
      texts.push({ el, tr, txt });
    });
    // Text som ligger på annan text
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.el.closest('svg') && a.el.closest('svg') === b.el.closest('svg')) continue; // skugga + text i samma ord
      const w = Math.min(a.tr.r, b.tr.r) - Math.max(a.tr.l, b.tr.l), h = Math.min(a.tr.b, b.tr.b) - Math.max(a.tr.t, b.tr.t);
      if (w > 2 && h > 2) {
        const small = Math.min((a.tr.r - a.tr.l) * (a.tr.b - a.tr.t), (b.tr.r - b.tr.l) * (b.tr.b - b.tr.t));
        if (w * h > small * 0.2) add(tag, `"${a.txt}" och "${b.txt}" ligger på varandra`);
      }
    }
  }

  async function addPlayers(list) {
    for (const n of list) {
      $('#name-input').value = n;
      $('#add-form').requestSubmit();
      await wait(120);
    }
  }
  function kb(open) {
    if (open) { const e = new Event('keyboardWillShow'); e.keyboardHeight = Math.round(T.H * (T.H < 700 ? 0.39 : 0.4)); window.dispatchEvent(e); }
    else window.dispatchEvent(new Event('keyboardWillHide'));
  }
  const click = (s) => { const el = typeof s === 'string' ? $(s) : s; if (!el) throw new Error('hittar inte ' + s); el.click(); };

  function vsCheck(tag) {
    const fx = $('#vsfx'); if (!fx) { add(tag, 'VS-introt syns inte'); return; }
    const W = fx.clientWidth, H = fx.clientHeight, tilt = Math.tan(7.5 * Math.PI / 180);
    fx.querySelectorAll('.who').forEach((el) => {
      const tr = textRect(el), y = (tr.t + tr.b) / 2, x = W / 2 + tilt * (H / 2 - y);
      if (el.classList.contains('a') && tr.r > x - 4) add(tag, `vänstra namnet "${el.textContent}" går över strecket (${(tr.r - x).toFixed(0)}px)`);
      if (el.classList.contains('b') && tr.l < x + 4) add(tag, `högra namnet "${el.textContent}" går över strecket (${(x - tr.l).toFixed(0)}px)`);
      if (el.scrollWidth > el.clientWidth + 1) add(tag, `namnet "${el.textContent}" får inte plats`);
      note(tag, `"${el.textContent}" ${getComputedStyle(el).fontSize}`);
    });
  }

  // Alla frågor ska få plats i kortet, och i läsbar storlek
  function questionCheck(tag) {
    const card = $('#card'), q = card.querySelector('.question');
    if (!q) return;
    const orig = q.textContent;
    let min = 99, minQ = '';
    const all = [];
    Object.keys(window.QUESTIONS).forEach((k) => window.QUESTIONS[k].forEach((t) => all.push(t)));
    for (const t of all) {
      q.textContent = t;
      window.dispatchEvent(new Event('resize'));
      const cs = getComputedStyle(card);
      const availH = card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const fs = parseFloat(q.style.fontSize);
      if (fs < min) { min = fs; minQ = t; }
      const tr = textRect(q), c = clipOf(q), cr = card.getBoundingClientRect();
      if (q.scrollHeight > availH + 1 || tr.b > cr.bottom - parseFloat(cs.paddingBottom) + 2 || tr.r > c.r + 1) add(tag, `frågan går utanför kortet: "${t.slice(0, 50)}" sh=${q.scrollHeight} avail=${availH.toFixed(1)} tb=${tr.b.toFixed(1)} cardb=${(cr.bottom - parseFloat(cs.paddingBottom)).toFixed(1)} tr=${tr.r.toFixed(1)} cr=${c.r.toFixed(1)} fs=${q.style.fontSize} ow=${q.style.overflowWrap}`);
      if (q.style.overflowWrap === 'anywhere') add(tag, `ett ord bryts mitt i: "${t.slice(0, 50)}"`);
    }
    note(tag, `${all.length} frågor, minsta textstorlek ${min}px ("${minQ.slice(0, 60)}")`);
    if (min < 17) add(tag, `frågan blir liten (${min}px): "${minQ.slice(0, 60)}"`);
    q.textContent = orig; window.dispatchEvent(new Event('resize'));
  }

  async function playRound(answer, vote) {
    click('#go'); await wait(3700);
    if (answer === 'same') { click('#same'); await wait(700); }
    else { click('#diff'); await wait(600); if ($('[data-vote]')) click(`[data-vote="${vote}"]`); await wait(700); }
  }
  const idOf = (name) => { const ps = JSON.parse(localStorage.getItem('vao_players')); const p = ps.find((x) => x.name === name); return p ? p.id : 'none'; };

  async function run() {
    window.addEventListener('error', (e) => add('js', e.message));
    log('run ' + location.href); await document.fonts.ready; log('fonts');
    await wait(4200); // introt
    audit('start-tom'); await shot('start-tom');
    // Tangentbord med tom lista
    kb(true); await wait(300); audit('tangentbord-tom'); await shot('tangentbord-tom'); kb(false); await wait(300);
    await addPlayers(NAMES); await wait(500);
    audit('start'); await shot('start');
    kb(true); await wait(350);
    const ir = $('#name-input').getBoundingClientRect(), kbTop = innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kb'));
    if (ir.bottom > kbTop + 1) add('tangentbord', `namnfältet hamnar bakom tangentbordet (${ir.bottom.toFixed(0)} > ${kbTop})`);
    audit('tangentbord'); await shot('tangentbord'); kb(false); await wait(400);
    audit('start-efter-tangentbord');
    // Figurväljaren (vid 10 spelare finns inget fält, då används ändra-arket)
    if (!$('#slot') || !visible($('#slot'))) note('figurval', 'rutan bredvid namnfältet visas inte (fullt)');
    else { click('#slot'); await wait(900); audit('figurval'); await shot('figurval'); click('#pick-done'); await wait(400); }
    // Ändra spelare
    click(document.querySelectorAll('.chip-main')[0]); await wait(900);
    audit('andra'); await shot('andra');
    kb(true); await wait(350);
    const dr = $('#pick-done').getBoundingClientRect(), er = $('#edit-name').getBoundingClientRect(), kt = innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kb'));
    if (dr.bottom > kt + 1 || er.top < 0) add('andra-tangentbord', `fältet eller Klar syns inte ovanför tangentbordet`);
    audit('andra-tangentbord'); await shot('andra-tangentbord'); kb(false); await wait(300);
    click('#pick-done'); await wait(400);
    // Låst nivå -> köpet
    click('.cat[data-cat="juicy"]'); await wait(700); audit('las-upp'); await shot('las-upp');
    click('.scrim'); await wait(300);
    // Menyn och regler
    click('#menu-btn'); await wait(500); audit('meny'); await shot('meny');
    click('[data-go="rules"]'); await wait(500); audit('regler'); await shot('regler'); click('.scrim'); await wait(300);
    click('#menu-btn'); await wait(400); click('[data-go="faq"]'); await wait(500); audit('fragor'); await shot('fragor'); click('.scrim'); await wait(300);
    // Lås upp (webbversionen låser upp direkt) så att alla nivåer kan väljas
    click('.cat[data-cat="crazy"]'); await wait(600); click('#buy'); await wait(2500); audit('upplast'); await shot('upplast');
    if ($('.scrim')) { click('.scrim'); await wait(300); }
    // Spelet
    click('#start-btn'); await wait(950);
    vsCheck('vs'); audit('vs'); await shot('vs');
    await wait(1800);
    audit('fraga'); await shot('fraga');
    questionCheck('fragor-alla');
    const fighters = () => [...document.querySelectorAll('#fA .fighter-name, #fB .fighter-name')].map((e) => e.textContent);
    click('#go'); await wait(1500); audit('nedrakning'); await shot('nedrakning'); await wait(2200);
    audit('svar'); await shot('svar');
    click('#same'); await wait(800); audit('match'); await shot('match');
    click('#next'); await wait(2400);
    click('#go'); await wait(3700); click('#diff'); await wait(700); audit('rosta'); await shot('rosta');
    const f = fighters();
    if ($('[data-vote]')) { click(`[data-vote="${idOf(f[0])}"]`); await wait(800); audit('rostat'); await shot('rostat'); }
    // Arken under spelet
    click('#score-btn'); await wait(500); audit('stallning'); await shot('stallning'); click('.scrim'); await wait(300);
    click('#cat-pill'); await wait(500); audit('niva'); await shot('niva'); click('.scrim'); await wait(300);
    // Ett par rundor till, sedan resultat
    const extra = T.cfg === 'duo' ? 99 : 2;
    for (let r = 0; r < extra; r++) {
      const nx = $('#next'); if (!nx) break;
      const last = /resultat/.test(nx.textContent);
      click(nx); await wait(last ? 600 : 2400);
      if (last) break;
      const ff = fighters();
      if (r % 2) await playRound('same'); else await playRound('diff', idOf(ff[1]));
    }
    if ($('#round') && !$('#round').hidden) {
      click('#end-btn'); await wait(500); audit('avsluta'); await shot('avsluta'); click('#confirm-end');
    }
    await wait(1200); audit('resultat-tidigt');
    await wait(4500); audit('resultat'); await shot('resultat');
    MH.done.postMessage(JSON.stringify({ issues, info }));
  }
  window.addEventListener('load', () => setTimeout(() => run().catch((e) => { add('driver', e.message + ' ' + (e.stack || '').split('\n')[0]); MH.done.postMessage(JSON.stringify({ issues, info })); }), 300));
})();
