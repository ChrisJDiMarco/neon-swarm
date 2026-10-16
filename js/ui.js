(function (A) {
  const G = A.G, scr = document.getElementById('scr'), cv = document.getElementById('c'), S = A.sfx;
  const bMute = document.getElementById('bMute'), bPause = document.getElementById('bPause');
  const ui = A.ui = {};
  const show = h => { scr.innerHTML = h; scr.classList.add('on'); };
  const hide = () => { scr.classList.remove('on'); scr.innerHTML = ''; };
  const tap = () => { S.init(); };
  function syncBtns() { bMute.classList.toggle('off', !!A.meta.muted); bPause.style.display = G.state === 'play' ? '' : 'none'; }
  bMute.onclick = e => { e.stopPropagation(); tap(); A.meta.muted = !A.meta.muted; S.setMuted(A.meta.muted); A.save(); syncBtns(); };
  bPause.onclick = e => { e.stopPropagation(); tap(); pause(); };

  ui.menu = function () {
    G.state = 'menu'; syncBtns(); S.setIntensity(0.15);
    const m = A.meta;
    const ships = A.SHIPS.map(s => {
      const own = m.ships.includes(s.id);
      return `<div class="ship ${m.ship === s.id ? 'sel' : ''} ${own ? '' : 'lock'}" style="--c:${s.c}" data-s="${s.id}"><svg width="26" height="22" viewBox="-13 -11 26 22" style="display:block;margin:0 auto 2px;filter:drop-shadow(0 0 4px ${s.c})"><path d="M0 -10 L8 8 L0 3 L-8 8Z" fill="${s.c}33" stroke="${s.c}" stroke-width="1.6" stroke-linejoin="round"/></svg><b style="color:${s.c}">${s.n}</b>${own ? s.d : '🔒 ' + s.cost + ' ◆'}${own && (m.shipBest || {})[s.id] ? `<div class="sb">best ${A.fmt(m.shipBest[s.id])}</div>` : ''}</div>`;
    }).join('');
    show(`<div class="title">NEON<br>SWARM</div><div class="sub">survive the swarm</div>
      <div class="cores">◆ ${m.cores} cores${m.best ? ' · best ' + A.fmt(m.best) : ''}${m.daily && m.daily.d === new Date().toISOString().slice(0, 10) ? ' · today ' + A.fmt(m.daily.t) : ''}</div>
      ${m.life && m.life.runs ? `<div class="life">${m.life.runs} run${m.life.runs === 1 ? '' : 's'} · ${m.life.kills} kills · ${m.life.bosses} bosses · ${A.fmt(m.life.time)} flown</div>` : ''}
      <div class="ships">${ships}</div>
      <button class="btn big" data-a="play">▶ PLAY</button>
      <button class="btn" data-a="shop">UPGRADES${(() => { const n = A.SHOP.filter(u => (m.shop[u.id] || 0) < u.max && m.cores >= A.shopCost(u.id, m.shop[u.id] || 0)).length; return n ? ` <span class="badge">${n} ready</span>` : ''; })()}</button>
      <button class="btn" data-a="best">BEST RUNS</button>
      <button class="gl" data-a="glow">Glow: ${(m.glow || 'soft').toUpperCase()}</button>
      <div class="hint">WASD or drag to move · Space / double-tap dash · P pause</div>`);
  };
  ui.refresh = () => { if (G.state === 'menu') ui.menu(); };
  function shop() {
    const m = A.meta;
    show(`<div class="panel"><h2>UPGRADES</h2><div class="cores" style="text-align:center">◆ ${m.cores} cores</div>
      ${A.SHOP.map(u => { const l = m.shop[u.id] || 0, c = A.shopCost(u.id, l), mx = l >= u.max; return `<div class="row"><div class="g"><b>${u.n}</b><small>${u.d}</small><span class="pips">${'●'.repeat(l)}${'○'.repeat(u.max - l)}</span></div><button class="buy" data-buy="${u.id}" ${mx || m.cores < c ? 'disabled' : ''}>${mx ? 'MAX' : c + ' ◆'}</button></div>`; }).join('')}
      <button class="btn" data-a="menu">BACK</button></div>`);
  }
  function best() {
    const m = A.meta, r = m.runs || [];
    show(`<div class="panel"><h2>BEST RUNS</h2>
      ${r.length ? r.map((x, i) => `<div class="row"><b style="color:#ffd23f;width:16px">${i + 1}</b><div class="g"><b>${A.fmt(x.t)}</b><small>${x.s} · LV ${x.l} · ${x.k} kills · ${x.c}x combo${x.by ? ' · ' + (x.by === 'quit' ? 'ended early' : 'by ' + x.by) : ''}</small>${x.b ? `<span class="bic">${x.b.map(id => { const u = A.UPG.find(q => q.id === id); return u ? `<i style="color:${u.c}">${u.ic}</i>` : ''; }).join('')}${(x.e || []).length ? ' <i style="color:#ffd23f">★' + x.e.length + '</i>' : ''}</span>` : ''}</div><small>${x.d.slice(5)}</small></div>`).join('') : '<div class="row"><div class="g"><small>No runs yet. Your first one is waiting.</small></div></div>'}
      <button class="btn" data-a="menu">BACK</button></div>`);
  }
  function start() { tap(); A.newRun(); hide(); syncBtns(); cv.focus(); }
  let cur = [], cardT = 0;
  ui.levelUp = function (chest) {
    G.state = 'level'; syncBtns(); S.play('level'); A.input.x = A.input.y = 0; if (A.joy) A.joy.on = false;
    cur = A.choices(chest); renderCards(chest); cardT = performance.now();
  };
  function renderCards(chest) {
    const RC = { common: '#7fb8ff', rare: '#b06bff', epic: '#ffc93d' };
    show(`<div class="lvh">${chest ? 'BOSS CHEST' : 'LEVEL ' + G.level}</div><div class="cards">${cur.map((c, i) => {
      const l = A.lv(c.id), gain = c.rar === 'epic' ? 2 : 1;
      return `<div class="card ${c.rar}" style="--r:${RC[c.rar]};--c:${c.c};animation-delay:${i * 0.09}s${c.rar === 'epic' ? `,${i * 0.09 + 0.45}s` : ''}" data-c="${i}"><span class="rr">${c.rar.toUpperCase()}</span><div class="ic">${c.ic}</div><div class="g"><b>${c.n}</b>${c.d}${c.rar === 'rare' ? ' · heal 15%' : ''}${A.UPG.some(u => u.id === c.id) ? `<br><span class="pips">${'●'.repeat(l)}<span style="color:#fff">${'●'.repeat(Math.min(gain, 5 - l))}</span>${'○'.repeat(Math.max(0, 5 - l - gain))}</span>` : ''}${evoHint(c.id)}</div><span class="key">${i + 1}</span></div>`;
    }).join('')}</div>${G.rerolls > 0 ? `<button class="btn" data-a="reroll" style="margin-top:10px">↻ REROLL (${G.rerolls})</button>` : ''}`);
    scr.dataset.chest = chest ? 1 : '';
  }
  function evoHint(id) {
    const ev = A.EVOS.find(e => (e.a === id || e.b === id) && !G.evos[e.id]); if (!ev) return '';
    const other = A.UPG.find(u => u.id === (ev.a === id ? ev.b : ev.a));
    return `<span class="evo">✦ + ${other.n} ${A.lv(other.id)}/5 → ${ev.n}</span>`;
  }
  function pause() { if (G.state !== 'play') return; G.state = 'paused'; syncBtns(); const bl = A.UPG.filter(u => G.ups[u.id]).map(u => `<span style="color:${u.c}">${u.ic} ${u.n} ${G.ups[u.id]}/5</span>`).join(' · ');
    show(`<h2>PAUSED</h2><div class="sub">${A.fmt(G.t)} · ${G.kills} kills · LV ${G.level}</div><div class="build">${bl || 'No upgrades yet'}</div><button class="btn big" data-a="resume">RESUME</button><button class="btn" data-a="quit">END RUN</button>`); }
  function resume() { G.state = 'play'; hide(); syncBtns(); cv.focus(); }
  ui.death = function () {
    A.finishRun(); syncBtns();
    const build = Object.entries(G.ups).filter(([, v]) => v).map(([k, v]) => { const u = A.UPG.find(x => x.id === k); return `<span style="color:${u.c}">${u.ic} ${u.n} ${v}</span>`; }).join(' · ');
    const evo = Object.keys(G.evos).map(k => A.EVOS.find(e => e.id === k).n).join(', ');
    show(`<div class="dead">DESTROYED</div>${G.lastHit && G.p.hp <= 0 ? `<div class="life">taken down by ${G.lastHit}</div>` : ''}${G.newBest ? '<div class="cores">★ NEW BEST TIME ★</div>' : G.newDaily ? '<div class="cores">★ Best run today ★</div>' : ''}
      <div class="stats"><div class="stat"><b>${A.fmt(G.t)}</b>survived</div><div class="stat"><b>${G.kills}</b>kills</div><div class="stat"><b>${G.level}</b>level</div><div class="stat"><b>${G.bestCombo}x</b>best combo</div></div>
      <div class="build">${build || 'No upgrades'}${evo ? `<br><b style="color:#ffd23f">Evolved: ${evo}</b>` : ''}</div>
      <div class="cores">+${G.earned} ◆ cores (total ${A.meta.cores})</div>${(() => { const nx = A.SHIPS.find(s => !A.meta.ships.includes(s.id)); if (!nx) return ''; const f = Math.min(1, A.meta.cores / nx.cost); return `<div class="unl">${f >= 1 ? `${nx.n} can be unlocked now` : `${nx.cost - A.meta.cores} ◆ more to unlock ${nx.n}`}<i><s style="width:${f * 100}%;background:${nx.c}"></s></i></div>`; })()}<div class="life" style="margin-top:4px">Records · combo ${A.meta.life.combo || 0}x · level ${A.meta.life.lvl || 0}</div>
      <button class="btn big" data-a="play">↻ PLAY AGAIN <small style="opacity:.5;font-size:10px">Enter</small></button><button class="btn" data-a="menu">MENU</button>`);
  };

  scr.addEventListener('click', e => {
    tap();
    const a = e.target.closest('[data-a]'), s = e.target.closest('[data-s]'), b = e.target.closest('[data-buy]'), c = e.target.closest('[data-c]');
    const m = A.meta;
    if (c && performance.now() - cardT < 400) return;
    if (c) { S.play('pick'); A.pick(cur[+c.dataset.c]); hide(); syncBtns(); cv.focus(); return; }
    if (s) {
      const sh = A.SHIPS.find(x => x.id === s.dataset.s);
      if (m.ships.includes(sh.id)) m.ship = sh.id;
      else if (m.cores >= sh.cost) { m.cores -= sh.cost; m.ships.push(sh.id); m.ship = sh.id; S.play('evolve'); }
      else { S.play('hit'); return; }
      A.save(); S.play('ui'); ui.menu(); return;
    }
    if (b) { const id = b.dataset.buy, l = m.shop[id] || 0, cost = A.shopCost(id, l); if (m.cores >= cost) { m.cores -= cost; m.shop[id] = l + 1; A.save(); S.play('level'); shop(); } return; }
    if (!a) return;
    S.play('ui');
    switch (a.dataset.a) {
      case 'play': start(); break;
      case 'shop': shop(); break;
      case 'glow': { const o = ['soft', 'high', 'off'], i = o.indexOf(m.glow || 'soft'); m.glow = o[(i + 1) % 3]; A.save(); ui.menu(); A.ui.toast && 0; break; }
      case 'best': best(); break;
      case 'menu': ui.menu(); break;
      case 'resume': resume(); break;
      case 'quit': G.state = 'dead'; ui.death(); break;
      case 'reroll': G.rerolls--; cur = A.choices(!!scr.dataset.chest); renderCards(!!scr.dataset.chest); break;
    }
  });

  // input
  const keys = {};
  addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
    if (G.state === 'play' && (e.key === ' ' || e.key === 'Shift')) { A.input.dash = true; return; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (G.state === 'play') pause(); else if (G.state === 'paused') resume(); }
    if ((e.key === 'Enter' || e.key === ' ') && (G.state === 'menu' || G.state === 'dead') && !scr.querySelector('.panel')) start();
    if (G.state === 'level' && ['1', '2', '3'].includes(e.key) && cur[+e.key - 1]) { S.play('pick'); A.pick(cur[+e.key - 1]); hide(); syncBtns(); }
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  A.joy = { on: false, ox: 0, oy: 0 };
  cv.addEventListener('pointerdown', e => { tap(); cv.focus(); if (G.state !== 'play') return; const nw = performance.now(); if (nw - (A.joy.lt || 0) < 300) A.input.dash = true; A.joy.lt = nw; A.joy.on = true; A.joy.ox = e.clientX; A.joy.oy = e.clientY; A.joy.id = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', e => { if (!A.joy.on || e.pointerId !== A.joy.id) return; let dx = e.clientX - A.joy.ox, dy = e.clientY - A.joy.oy; const d = Math.hypot(dx, dy); if (d > 46) { A.joy.ox += dx * (1 - 46 / d); A.joy.oy += dy * (1 - 46 / d); dx *= 46 / d; dy *= 46 / d; } A.joy.dx = dx / 46; A.joy.dy = dy / 46; });
  const up = () => { A.joy.on = false; A.joy.dx = A.joy.dy = 0; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  function readInput() {
    let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    if (A.joy.on) { x = A.joy.dx || 0; y = A.joy.dy || 0; const d = Math.hypot(x, y); if (d < 0.15) x = y = 0; }
    else { const d = Math.hypot(x, y); if (d) { x /= d; y /= d; } }
    A.input.x = x; A.input.y = y;
  }
  if (window.cabinet && cabinet.onVisibility) cabinet.onVisibility(v => { if (!v && G.state === 'play') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') pause(); });

  addEventListener('resize', A.resize); A.resize();
  let lastT = performance.now(), T = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const rdt = Math.min(0.1, (now - lastT) / 1000); lastT = now; T += rdt;
    if (!innerWidth || !innerHeight) return;
    if (innerWidth !== A.dims().W || innerHeight !== A.dims().H) A.resize();
    readInput();
    try { A.update(rdt); } catch (e) { console.error(e); }
    A.render(T);
  }
  ui.menu(); requestAnimationFrame(loop);
})(window.App);
