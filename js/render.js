(function (A) {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d'), G = A.G, TAU = Math.PI * 2;
  let W = 0, H = 0, dpr = 1, vign = null, grain = null;
  const glowC = {};
  try { const _acs = CanvasGradient.prototype.addColorStop; if (!_acs._safe) { const f = function (o, c) { try { _acs.call(this, o, c); } catch (e) { try { _acs.call(this, o, 'rgba(255,255,255,0)'); } catch (_) {} } }; f._safe = 1; CanvasGradient.prototype.addColorStop = f; } } catch (e) {}
  function glow(col) {
    if (glowC[col]) return glowC[col];
    const key = col; col = normCol(col);
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); stop(gr, 0, col, 0.7); stop(gr, 0.18, col, 0.28); stop(gr, 0.5, col, 0.06); stop(gr, 1, col, 0);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (glowC[key] = c);
  }
  const nc = document.createElement('canvas').getContext('2d');
  function normCol(c) { nc.fillStyle = '#ffffff'; try { nc.fillStyle = String(c); } catch (e) {} let v = nc.fillStyle; if (!/^#[0-9a-f]{6}$/i.test(v)) v = '#ffffff'; return v; }
  A.normCol = normCol;
  function stop(g, o, c, a) { let h = normCol(c); if (!/^#[0-9a-f]{6}$/i.test(h)) h = '#ffffff'; a = +a; if (!(a >= 0)) a = 1; a = Math.min(1, a); const r = parseInt(h.slice(1, 3), 16), gg = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); try { g.addColorStop(o, 'rgba(' + r + ',' + gg + ',' + b + ',' + (a == null ? 1 : a) + ')'); } catch (e) {} }
  A.glowK = () => (A.meta.glow === 'high' ? 0.5 : A.meta.glow === 'off' ? 0 : 0.2);
  let glowN = 0;
  // seeded stars
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = [0.08, 0.2, 0.4].map((f, L) => ({ f, s: Array.from({ length: 70 }, () => ({ x: rnd() * 1200, y: rnd() * 1200, r: 0.4 + rnd() * (0.6 + L * 0.5), c: ['#9fb4ff', '#ffd7f4', '#c8fbff'][Math.floor(rnd() * 3)] })) }));
  const neb = [{ x: 0.2, y: 0.3, c: '#5a1d8a', r: 0.7 }, { x: 0.8, y: 0.75, c: '#0f4f7a', r: 0.6 }, { x: 0.6, y: 0.1, c: '#7a1d4f', r: 0.45 }];

  A.resize = function () {
    W = innerWidth; H = innerHeight; if (!W || !H) return;
    dpr = Math.min(devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr;
    const z = Math.max(0.55, Math.min(1.3, Math.min(W, H) / 540)); A.baseZ = z;
    vign = document.createElement('canvas'); vign.width = W; vign.height = H; const v = vign.getContext('2d');
    const g = v.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    stop(g, 0, '#05040d', 0); stop(g, 1, '#05040d', 0.8); v.fillStyle = g; v.fillRect(0, 0, W, H);
    grain = document.createElement('canvas'); grain.width = grain.height = 128; const gg = grain.getContext('2d'), id = gg.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) { const n = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 14; }
    gg.putImageData(id, 0, 0);
  };
  A.dims = () => ({ W, H });

  function poly(x, y, r, n, rot) { ctx.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  function neon(col, w, fillA) {
    ctx.strokeStyle = col; ctx.globalAlpha = 0.12 * A.glowK(); ctx.lineWidth = w * 2.4; ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = w; ctx.stroke();
    if (fillA) { ctx.globalAlpha = fillA; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; }
  }
  function gl(x, y, s, col, a, bg) { const k = bg ? 0.6 : A.glowK(); if (!k || (!bg && ++glowN > 140)) return; const ga = Math.min(0.18, a * 0.2) * k; if (!(ga > 0.004)) return; const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ga; ctx.drawImage(glow(col), x - s / 2, y - s / 2, s, s); ctx.globalAlpha = 1; ctx.globalCompositeOperation = op; }

  function drawGrid(cx, cy, vw, vh, t) {
    const sp = 60, x0 = Math.floor((cx - vw / 2) / sp) * sp, x1 = cx + vw / 2 + sp, y0 = Math.floor((cy - vh / 2) / sp) * sp, y1 = cy + vh / 2 + sp;
    const ws = G.warps, beat = A.sfx.beat ? A.sfx.beat() : 0;
    const disp = (x, y) => { let ox = 0, oy = 0; for (const w of ws) { const dx = x - w.x, dy = y - w.y, d = Math.hypot(dx, dy) + 1, ring = w.t * 500, k = Math.exp(-((d - ring) ** 2) / 3000) * w.s * (1 - w.t / 1.2); ox += dx / d * k; oy += dy / d * k; } return [x + ox, y + oy]; };
    ctx.strokeStyle = '#3b2c8f'; ctx.lineWidth = 1; ctx.globalAlpha = 0.28 + 0.12 * Math.pow(1 - beat, 3);
    ctx.beginPath();
    const st = ws.length ? 20 : sp;
    for (let x = x0; x < x1; x += sp) { for (let y = y0; y <= y1; y += st) { const p = disp(x, y); y === y0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); } }
    for (let y = y0; y < y1; y += sp) { for (let x = x0; x <= x1; x += st) { const p = disp(x, y); x === x0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); } }
    ctx.stroke(); ctx.globalAlpha = 1;
    const B = A.ARENA; ctx.strokeStyle = '#ff3dc8'; ctx.lineWidth = 3; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3); ctx.strokeRect(-B - 10, -B - 10, 2 * B + 20, 2 * B + 20); ctx.globalAlpha = 1;
  }

  function drawEnemy(e, t) {
    const col = e.flash > 0 ? '#ffffff' : e.col;
    gl(e.x, e.y, e.r * 3.2, e.col, 0.3);
    switch (e.type) {
      case 'chaser': case 'swarmer': { const a = G.p ? Math.atan2(G.p.y - e.y, G.p.x - e.x) : e.rot; poly(e.x, e.y, e.r, 3, a); neon(col, e.type === 'swarmer' ? 1.5 : 2, 0.18); break; }
      case 'tank': poly(e.x, e.y, e.r, 6, e.rot); neon(col, 2.5, 0.15); poly(e.x, e.y, e.r * 0.5, 6, -e.rot); neon(col, 1.5); break;
      case 'dasher': {
        const tel = e.st === 1, a = e.dir ?? 0;
        if (tel) { ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 30)); ctx.strokeStyle = '#ff5cf0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 180, e.y + Math.sin(a) * 180); ctx.stroke(); ctx.globalAlpha = 1; gl(e.x, e.y, 60, '#ffffff', 0.5 * Math.abs(Math.sin(t * 30))); }
        poly(e.x, e.y, e.r, 4, (e.st ? a : e.rot)); neon(tel ? '#ffffff' : col, 2, 0.2); break;
      }
      case 'shooter': poly(e.x, e.y, e.r, 4, Math.PI / 4 + e.rot * 0.3); neon(col, 2, 0.15); ctx.beginPath(); ctx.arc(e.x, e.y, 3 + (e.fire < 0.4 ? 3 : 0), 0, TAU); ctx.fillStyle = col; ctx.fill(); break;
      case 'boss': {
        gl(e.x, e.y, e.r * 4, e.col, 0.3);
        if (e.tele) { ctx.globalAlpha = 0.5 * Math.abs(Math.sin(t * 25)); ctx.strokeStyle = '#fff'; ctx.lineWidth = e.r; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir) * 300, e.y + Math.sin(e.dir) * 300); ctx.stroke(); ctx.globalAlpha = 1; }
        poly(e.x, e.y, e.r, 8, e.ang * 0.7); neon(col, 3, 0.12);
        poly(e.x, e.y, e.r * 0.68, 4, -e.ang * 1.4); neon(col, 2.5);
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.25 + Math.sin(t * 6) * 2, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
        for (let i = 0; i < 6; i++) { const a = e.ang * 2 + i * TAU / 6; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * e.r * 1.25, e.y + Math.sin(a) * e.r * 1.25, 3, 0, TAU); ctx.fillStyle = e.col; ctx.fill(); }
      }
    }
  }
  function drawShip(p, col, t) {
    ctx.lineCap = 'round';
    for (let i = 1; i < p.trail.length; i++) { const a = p.trail[i - 1], b = p.trail[i]; ctx.globalAlpha = (1 - i / p.trail.length) * 0.7; ctx.strokeStyle = col; ctx.lineWidth = 7 * (1 - i / p.trail.length); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (p.inv > 0 && Math.sin(t * 40) > 0) return;
    gl(p.x, p.y, 40, col, 0.4);
    if (G.dashCd > 0) { ctx.globalAlpha = 0.5; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 17, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - G.dashCd / 2.2)); ctx.stroke(); ctx.globalAlpha = 1; }
    const a = p.ang, r = 11;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(a) * r * 1.3, p.y + Math.sin(a) * r * 1.3);
    ctx.lineTo(p.x + Math.cos(a + 2.5) * r, p.y + Math.sin(a + 2.5) * r);
    ctx.lineTo(p.x + Math.cos(a + Math.PI) * r * 0.4, p.y + Math.sin(a + Math.PI) * r * 0.4);
    ctx.lineTo(p.x + Math.cos(a - 2.5) * r, p.y + Math.sin(a - 2.5) * r); ctx.closePath();
    ctx.lineJoin = 'round'; neon(col, 2, 0.3);
    gl(p.x - Math.cos(a) * 9, p.y - Math.sin(a) * 9, 12 + Math.sin(t * 40) * 2, '#ffffff', 0.6);
  }

  A.render = function (t) {
    if (!W || !H) return;
    try { draw(t); } catch (e) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; if (!A._rerr) { A._rerr = 1; console.warn(e); } }
  };
  function draw(t) {
    glowN = 0;
    const z = A.baseZ * (1 - 0.16 * Math.sin(Math.min(1, (G.zoomT || 0) / 2.5) * Math.PI / 2)), cam = A.cam;
    const vw = W / z, vh = H / z; A.view.w = vw; A.view.h = vh;
    if (G.p && G.state !== 'menu') { const tx = G.boss && G.zoomT > 0 ? (G.p.x * 0.7 + G.boss.x * 0.3) : G.p.x, ty = G.boss && G.zoomT > 0 ? (G.p.y * 0.7 + G.boss.y * 0.3) : G.p.y; cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.12; }
    else { cam.x = Math.sin(t * 0.07) * 400; cam.y = t * 30; }
    const sh = G.shake || 0, sx = (Math.random() - 0.5) * sh, sy = (Math.random() - 0.5) * sh;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
    const bg = ctx.createLinearGradient(0, 0, 0, H); stop(bg, 0, '#0a0620'); stop(bg, 0.55, '#06051a'); stop(bg, 1, '#0c0418');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    if (G.state === 'menu') { const hz = H * 0.78; const hg = ctx.createLinearGradient(0, hz - 60, 0, H); stop(hg, 0, '#ff3dc8', 0); stop(hg, 0.35, '#ff3dc8', 0.14); stop(hg, 1, '#3b1a6a', 0.1); ctx.fillStyle = hg; ctx.fillRect(0, hz - 60, W, H); ctx.strokeStyle = '#ff3dc8'; ctx.lineWidth = 1; for (let i = -10; i <= 10; i++) { ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.moveTo(W / 2 + i * 8, hz); ctx.lineTo(W / 2 + i * W * 0.18, H); ctx.stroke(); } for (let j = 0; j < 7; j++) { const f = ((j + (t * 0.6) % 1) / 7), y = hz + (H - hz) * f * f; ctx.globalAlpha = 0.25 * f; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff8ae0'; ctx.fillRect(0, hz - 0.5, W, 1); ctx.globalAlpha = 1; }
    for (const n of neb) { const x = ((n.x * W - cam.x * 0.03) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2; gl(x, n.y * H - (cam.y * 0.03) % 40, Math.max(W, H) * n.r * 2 * (1 + 0.06 * Math.sin(t * 0.4 + n.x * 9)), n.c, 0.12, 1); gl(x + W * 0.1, n.y * H + H * 0.05, Math.max(W, H) * n.r, n.c, 0.07, 1); }
    for (const L of stars) for (const s of L.s) {
      const x = ((s.x - cam.x * L.f) % 1200 + 1200) % 1200, y = ((s.y - cam.y * L.f) % 1200 + 1200) % 1200;
      for (let ox = 0; ox < W; ox += 1200) for (let oy = 0; oy < H; oy += 1200) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.x); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(x + ox, y + oy, s.r, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - cam.x * z + sx), dpr * (H / 2 - cam.y * z + sy));
    drawGrid(cam.x, cam.y, vw, vh, t);
    if (G.state === 'menu') demo(t);
    else world(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
    if (G.dmgFlash > 0) {
      ctx.globalAlpha = G.dmgFlash * 0.35;
      const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); stop(rg, 0, '#ff1f5a', 0); stop(rg, 1, '#ff1f5a', 1); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
    if (vign) ctx.drawImage(vign, 0, 0);
    if (grain) { ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.save(); ctx.translate(Math.random() * 128, Math.random() * 128); ctx.fillRect(-128, -128, W + 256, H + 256); ctx.restore(); }
    if (G.state !== 'menu') hud(t);
    if (A.joy && A.joy.on) { ctx.globalAlpha = 0.3; ctx.strokeStyle = '#9ff3ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.joy.ox, A.joy.oy, 46, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#9ff3ff'; ctx.beginPath(); ctx.arc(A.joy.ox + A.input.x * 46, A.joy.oy + A.input.y * 46, 16, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  }
  const demoE = Array.from({ length: 26 }, (_, i) => ({ i, type: ['chaser', 'tank', 'dasher', 'shooter', 'swarmer'][i % 5] }));
  function demo(t) {
    const cx = A.cam.x, cy = A.cam.y;
    for (const d of demoE) {
      const a = d.i * 2.39 + t * 0.15 * (d.i % 2 ? 1 : -1), rr = 140 + (d.i * 37) % 260;
      const e = { type: d.type, x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 1.2, r: { chaser: 10, tank: 20, dasher: 11, shooter: 12, swarmer: 6 }[d.type], col: { chaser: '#ff3d7f', tank: '#ffb02e', dasher: '#b04bff', shooter: '#2effa0', swarmer: '#ff6a3d' }[d.type], rot: t + d.i, flash: 0, st: 0, fire: 1 };
      ctx.globalAlpha = 0.5; drawEnemy(e, t);
    }
    ctx.globalAlpha = 1;
  }
  function world(t) {
    for (const s of G.sh) { const c = s.v > 1 ? '#5cff9d' : '#3ff6ff'; gl(s.x, s.y, s.v > 1 ? 16 : 10, c, 0.5); poly(s.x, s.y, s.v > 1 ? 4.5 : 3, 4, t * 3); ctx.fillStyle = '#eaffff'; ctx.fill(); }
    for (const c of G.chests) { const b = Math.sin(c.t * 4) * 3; gl(c.x, c.y, 60, '#ffd23f', 0.4 + 0.15 * Math.sin(c.t * 6)); ctx.beginPath(); ctx.roundRect(c.x - 13, c.y - 10 + b, 26, 20, 4); neon('#ffd23f', 2.5, 0.3); }
    for (const n of G.novas) { const k = 1 - n.r / n.max; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU); ctx.globalAlpha = k; neon(G.evos.saw ? '#ff3dc8' : '#5cff9d', 3); ctx.globalAlpha = 1; }
    for (const e of G.en) drawEnemy(e, t);
    ctx.lineCap = 'round';
    for (const b of G.bu) { ctx.strokeStyle = G.evos.hyper ? '#ff9cf2' : '#7dfcff'; ctx.lineWidth = b.r * 1.4; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1; gl(b.x, b.y, 12, '#7dfcff', 0.5); }
    for (const m of G.mi) { for (let i = 1; i < m.trail.length; i++) { ctx.globalAlpha = 1 - i / m.trail.length; ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 4 * (1 - i / m.trail.length); ctx.beginPath(); ctx.moveTo(m.trail[i - 1].x, m.trail[i - 1].y); ctx.lineTo(m.trail[i].x, m.trail[i].y); ctx.stroke(); } ctx.globalAlpha = 1; gl(m.x, m.y, 14, '#ffb02e', 0.6); }
    for (const b of G.eb) { gl(b.x, b.y, b.r * 5, '#ff4d6d', 0.7); ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.6, 0, TAU); ctx.fillStyle = '#ffe0e8'; ctx.fill(); }
    if (G.blades) for (const b of G.blades) { const c = G.evos.saw ? '#ff3dc8' : '#ff7ae0'; gl(b.x, b.y, 22, c, 0.45); poly(b.x, b.y, G.evos.saw ? 11 : 8, G.evos.saw ? 6 : 4, b.a * 3 + t * 8); neon(c, 2, 0.4); }
    for (const z of G.zaps) { ctx.beginPath(); const P = z.pts; ctx.moveTo(P[0].x, P[0].y); for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; for (let k = 1; k <= 4; k++) { const f = k / 4; ctx.lineTo(a.x + (b.x - a.x) * f + (k < 4 ? (Math.random() - 0.5) * 18 : 0), a.y + (b.y - a.y) * f + (k < 4 ? (Math.random() - 0.5) * 18 : 0)); } } ctx.globalAlpha = z.life / 0.18; neon('#ffe14d', 2); ctx.globalAlpha = 1; }
    if (G.state !== 'dead' && (G.state !== 'dying' || G.deathT < 0.1)) drawShip(G.p, G.ship.c, t);
    ctx.lineCap = 'round';
    for (const q of G.pa) { const k = q.life / q.max; ctx.globalAlpha = Math.min(1, k * 1.5); ctx.strokeStyle = q.col; ctx.lineWidth = q.sz * (0.3 + k * 0.7); ctx.beginPath(); ctx.moveTo(q.x - q.vx * 0.04, q.y - q.vy * 0.04); ctx.lineTo(q.x, q.y); ctx.stroke(); if (q.sz > 3.4) gl(q.x, q.y, q.sz * 4, q.col, k * 0.3); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center';
    for (const x of G.tx) { ctx.globalAlpha = Math.min(1, x.life * 2.5); ctx.font = (x.crit ? '800 15px ' : '700 11px ') + 'system-ui'; ctx.fillStyle = x.crit ? '#ffd23f' : '#ffffff'; ctx.fillText(x.s + (x.crit ? '!' : ''), x.x, x.y); }
    ctx.globalAlpha = 1;
  }
  function bar(x, y, w, h, f, c1, c2) { ctx.fillStyle = '#ffffff14'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); if (f > 0) { const g = ctx.createLinearGradient(x, 0, x + w, 0); stop(g, 0, c1); stop(g, 1, c2); ctx.fillStyle = g;  ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * f), h, h / 2); ctx.fill(); ctx.shadowBlur = 0; } }
  function hud(t) {
    const p = G.p, m = 12, top = 44; ctx.textBaseline = 'middle';
    bar(m, top, W - m * 2, 3, G.xp / G.xpNext, '#3ff6ff', '#5cff9d');
    bar(m, top + 9, Math.min(140, W * 0.36), 6, p.hp / p.max, '#ff3d7f', p.hp < p.max * 0.3 && Math.sin(t * 12) > 0 ? '#ffffff' : '#ff8ab0');
    ctx.font = '600 9px system-ui'; ctx.fillStyle = '#ffb3c9'; ctx.textAlign = 'left'; ctx.fillText(Math.ceil(p.hp) + '/' + p.max + '  LV ' + G.level, m, top + 23);
    ctx.font = '800 15px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#eef1ff'; ctx.fillText(A.fmt(G.t), W / 2, top + 14);
    { const pb = A.meta.best || 0; if (pb) { ctx.font = '600 8px system-ui'; const beat = G.t > pb; ctx.fillStyle = beat ? '#ffd23f' : '#8a90c0'; ctx.fillText(beat ? '★ NEW BEST' : 'best ' + A.fmt(pb), W / 2, top + 26); } }
    ctx.font = '700 11px system-ui'; ctx.textAlign = 'right'; ctx.fillStyle = '#c7cdf5'; ctx.fillText('☠ ' + G.kills, W - m, top + 13);
    if (G.combo >= 3) { const s = 1 + Math.min(0.6, G.combo / 100) + (G.comboT > 2 ? (G.comboT - 2) * 2 : 0); ctx.save(); ctx.translate(W / 2, top + 42); ctx.scale(s, s); ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = G.combo > 50 ? '#ff3dc8' : G.combo > 20 ? '#ffd23f' : '#9ff3ff'; ctx.fillText(G.combo + 'x COMBO', 0, 0); ctx.restore(); ctx.shadowBlur = 0; }
    { let ix = m; ctx.textAlign = 'center'; for (const u of A.UPG) { const l = G.ups[u.id]; if (!l) continue; ctx.globalAlpha = 0.85; ctx.fillStyle = '#0d0b22'; ctx.beginPath(); ctx.roundRect(ix, H - 30, 20, 20, 6); ctx.fill(); ctx.font = '12px system-ui'; ctx.fillStyle = u.c; ctx.fillText(u.ic, ix + 10, H - 21); ctx.font = '700 7px system-ui'; ctx.fillStyle = l >= 5 ? '#ffd23f' : '#ffffffaa'; ctx.fillText(l >= 5 ? 'MAX' : l, ix + 10, H - 13); ix += 23; if (ix > W - 100) break; } if (G.revives) { ctx.font = '700 9px system-ui'; ctx.fillStyle = '#5cff9d'; ctx.textAlign = 'left'; ctx.fillText('♥ second wind', m, H - 38); } ctx.globalAlpha = 1; }
    if (G.boss) { const b = G.boss, bw = Math.min(280, W - 40); ctx.font = '800 9px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = b.col; ctx.fillText(b.name, W / 2, H - 58); bar((W - bw) / 2, H - 50, bw, 6, b.hp / b.max, b.col, '#ffffff'); }
    if (G.banner) {
      const k = Math.min(1, (3 - G.banner.t) * 3) * Math.min(1, G.banner.t * 3), y = H * 0.42;
      ctx.globalAlpha = k * 0.85; ctx.fillStyle = '#2a0614'; ctx.fillRect(0, y - 26, W, 52);
      ctx.fillStyle = '#ff2e55'; ctx.fillRect(0, y - 26, W, 2); ctx.fillRect(0, y + 24, W, 2);
      ctx.globalAlpha = k * (0.7 + 0.3 * Math.sin(t * 14)); ctx.font = '900 22px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff3d6a'; 
      ctx.fillText('⚠ WARNING ⚠', W / 2, y - 4); ctx.shadowBlur = 0; ctx.font = '700 9px system-ui'; ctx.fillStyle = '#ffc2d0'; ctx.fillText('BOSS APPROACHING', W / 2, y + 14); ctx.globalAlpha = 1;
    }
    if (G.state === 'play' && G.t < 4.5) { ctx.globalAlpha = Math.min(1, (4.5 - G.t) / 1.2); ctx.textAlign = 'center'; ctx.font = '900 20px system-ui'; ctx.fillStyle = '#9ff3ff'; ctx.fillText(G.t < 1.6 ? 'GET READY' : 'GO!', W / 2, H * 0.32); ctx.font = '600 10px system-ui'; ctx.fillStyle = '#c7cdf5'; ctx.fillText('Move to dodge · Space / double-tap to dash', W / 2, H * 0.32 + 20); ctx.globalAlpha = 1; }
    if (G.evoFlash > 0) { ctx.globalAlpha = Math.min(1, G.evoFlash); ctx.font = '900 18px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23f'; ctx.fillText('EVOLVED: ' + G.evoName.toUpperCase(), W / 2, H * 0.3); ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
  }
})(window.App);
