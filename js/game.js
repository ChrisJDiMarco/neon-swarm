(function (A) {
  const R = Math.random, TAU = Math.PI * 2, ARENA = 1500;
  const G = A.G = { state: 'menu', t: 0, en: [], pa: [], warps: [] };
  A.ARENA = ARENA;
  A.cam = { x: 0, y: 0, z: 1 };
  A.view = { w: 560, h: 700 };
  A.input = { x: 0, y: 0 };
  const viewR = () => Math.hypot(A.view.w, A.view.h) / 2;
  const lv = A.lv = id => (G.ups && G.ups[id]) || 0;
  const S = A.sfx;

  A.newRun = function () {
    const m = A.meta, ship = A.SHIPS.find(s => s.id === m.ship) || A.SHIPS[0];
    Object.assign(G, {
      state: 'play', t: 0, kills: 0, level: 1, xp: 0, xpNext: 6, combo: 0, comboT: 0, bestCombo: 0,
      shake: 0, hitstop: 0, ts: 1, dmgFlash: 0, evoFlash: 0,
      p: { x: 0, y: 0, vx: 0, vy: 0, r: 9, hp: 0, max: 0, inv: 0, ang: -Math.PI / 2, trail: [] }, ship,
      en: [], bu: [], eb: [], sh: [], pa: [], tx: [], mi: [], zaps: [], novas: [], warps: [], chests: [],
      ups: Object.assign({}, ship.start), evos: {}, cd: { gun: 0.3, chain: 1, missile: 1.5, nova: 3 },
      bladeA: 0, spawnT: 0, nextBoss: 120, boss: null, bossN: 0, banner: null, zoomT: 0,
      dashCd: 0, grace: 1.6, rerolls: m.shop.reroll || 0, revives: m.shop.revive || 0, deathT: 0, bosses: 0, pendingLv: 0
    });
    G.p.max = 100 + (m.shop.hp || 0) * 10 + (ship.hp || 0); G.p.hp = G.p.max;
    A.cam.x = 0; A.cam.y = 0;
  };
  function stats() {
    const sh = A.meta.shop;
    return {
      dmg: 10 * (1 + 0.08 * (sh.dmg || 0)),
      spd: 190 * (1 + 0.05 * (sh.spd || 0) + (G.ship.spd || 0) + 0.08 * lv('speed')),
      rate: 0.45 / (1 + 0.22 * lv('rate')) * (G.evos.hyper ? 0.5 : 1),
      count: 1 + lv('multi') + (G.evos.hyper ? 2 : 0),
      pierce: lv('pierce') + (G.evos.hive ? 1 : 0),
      crit: 0.05 + 0.07 * lv('crit') + (G.evos.tempest ? 0.15 : 0),
      magnet: 75 * (1 + 0.3 * lv('magnet'))
    };
  }
  function text(x, y, s, crit) { if (G.tx.length > 50) G.tx.shift(); G.tx.push({ x, y, s, crit, life: 0.8 }); }
  function burst(x, y, col, n, spd) {
    for (let i = 0; i < n; i++) {
      if (G.pa.length > 360) G.pa.shift();
      const a = R() * TAU, v = spd * (0.25 + R());
      G.pa.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 + R() * 0.55, max: 0.9, col, sz: 1.5 + R() * 2.5 });
    }
  }
  A.burst = burst;
  function warp(x, y, s) { G.warps.push({ x, y, t: 0, s }); if (G.warps.length > 8) G.warps.shift(); }
  function nearest(x, y, maxD, skip) {
    let b = null, bd = maxD * maxD;
    for (const e of G.en) { if (e.dead || (skip && skip.includes(e))) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; b = e; } }
    return b;
  }

  const DEF = { chaser: [10, 22, 78, '#ff3d7f', 1], tank: [22, 110, 40, '#ffb02e', 4], dasher: [11, 34, 62, '#b04bff', 2], shooter: [12, 38, 52, '#2effa0', 2], swarmer: [6, 8, 145, '#ff6a3d', 1] };
  function spawn(type, x, y, extra) {
    const sc = 1 + G.t / 70 + Math.pow(G.t / 240, 2), D = DEF[type] || DEF.chaser;
    if (x === undefined) { const a = R() * TAU, d = viewR() + 40; x = G.p.x + Math.cos(a) * d; y = G.p.y + Math.sin(a) * d; }
    const e = { type, x, y, r: D[0], hp: D[1] * sc, max: D[1] * sc, spd: D[2] * (1 + G.t / 900), col: D[3], xp: D[4], flash: 0, t: R() * 2, st: 0, st_t: 0, kx: 0, ky: 0, bcd: 0, fire: 1 + R() * 2, rot: R() * TAU };
    Object.assign(e, extra); G.en.push(e); return e;
  }
  function director(dt) {
    const t = G.t;
    let rate = Math.min(1 + t / 22, 11); if (G.boss) rate *= 0.35;
    G.spawnT += dt * rate;
    while (G.spawnT > 1) {
      G.spawnT--;
      if (G.en.length > 230) continue;
      const w = [['chaser', 1], ['swarmer', t > 20 ? 0.22 : 0], ['tank', t > 35 ? 0.18 + t / 1500 : 0], ['dasher', t > 45 ? 0.25 : 0], ['shooter', t > 65 ? 0.22 : 0]];
      let tot = w.reduce((a, b) => a + b[1], 0), r = R() * tot, type = 'chaser';
      for (const [k, v] of w) { r -= v; if (r <= 0) { type = k; break; } }
      if (type === 'swarmer') { const a = R() * TAU, d = viewR() + 50, cx = G.p.x + Math.cos(a) * d, cy = G.p.y + Math.sin(a) * d; for (let i = 0; i < 5 + Math.floor(t / 60); i++) spawn('swarmer', cx + R() * 40, cy + R() * 40); }
      else spawn(type);
    }
    if (!G.boss && !G.banner && G.t >= G.nextBoss - 3) { G.banner = { t: 3 }; G.zoomT = 0; S.play('boss'); }
    if (G.banner) { G.banner.t -= dt; G.zoomT += dt; if (G.banner.t <= 0) { G.banner = null; spawnBoss(); } }
    else if (G.zoomT > 0) G.zoomT = Math.max(0, G.zoomT - dt * 1.2);
  }
  function spawnBoss() {
    G.bossN++; G.nextBoss += 120;
    const a = R() * TAU, d = viewR() * 0.75, hp = 1100 * G.bossN * (1 + G.t / 400);
    G.boss = spawn('boss', G.p.x + Math.cos(a) * d, G.p.y + Math.sin(a) * d, { r: 42, hp, max: hp, spd: 58, col: ['#ff2e88', '#7d5cff', '#00e5ff', '#ffd23f'][(G.bossN - 1) % 4], xp: 0, pat: 0, patT: 3, ang: 0, sub: 0, name: ['OVERMIND', 'PRISM LORD', 'VOID HYDRA', 'SOLAR CORE'][(G.bossN - 1) % 4] });
    warp(G.boss.x, G.boss.y, 60); G.shake += 14;
  }
  function ebullet(x, y, a, sp, r) { if (G.eb.length < 260) G.eb.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: r || 5, life: 7 }); }

  function hurt(n, src) {
    const p = G.p; if (p.inv > 0 || G.state !== 'play') return; G.lastHit = src || G.lastHit;
    p.hp -= n; p.inv = 0.7; G.dmgFlash = 0.4; G.shake += 9; S.play('hurt'); burst(p.x, p.y, '#ff5c8a', 14, 160);
    if (p.hp <= 0) {
      if (G.revives > 0) {
        G.revives--; p.hp = p.max * 0.5; p.inv = 2.2; G.hitstop = 0.25; G.shake += 20; warp(p.x, p.y, 110);
        burst(p.x, p.y, '#5cff9d', 70, 380); G.evoFlash = 1.6; G.evoName = 'Second Wind'; G.eb = []; S.play('evolve');
        G.novas.push({ x: p.x, y: p.y, r: 0, max: 260, hit: [], dmg: G.S.dmg * 6 });
      } else die();
    }
  }
  function die() {
    const p = G.p; p.hp = 0; G.state = 'dying'; G.ts = 0.2; G.deathT = 0; G.shake = 30;
    burst(p.x, p.y, G.ship.c, 120, 420); burst(p.x, p.y, '#ffffff', 50, 250); warp(p.x, p.y, 120); S.play('die');
  }
  A.hit = function (e, dmg, o) {
    if (e.dead) return;
    const crit = (o && o.crit) || R() < G.S.crit; if (crit) dmg *= 2;
    e.hp -= dmg; e.flash = 0.09; text(e.x + (R() - 0.5) * 10, e.y - e.r, Math.round(dmg), crit);
    if (o && o.kb) { const dx = e.x - (o.fx ?? G.p.x), dy = e.y - (o.fy ?? G.p.y), d = Math.hypot(dx, dy) || 1, k = e.type === 'boss' ? 0.1 : (e.type === 'tank' ? 0.4 : 1); e.kx += dx / d * o.kb * k; e.ky += dy / d * o.kb * k; }
    if (e.hp <= 0) kill(e); else S.play('hit');
  };
  function kill(e) {
    e.dead = true; G.kills++; G.combo++; G.comboT = 2.2; if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    burst(e.x, e.y, e.col, Math.min(40, 8 + e.r), 90 + e.r * 6); burst(e.x, e.y, '#ffffff', 4, 120);
    S.play('explode', Math.min(1, e.r / 40));
    let v = e.xp; while (v > 0 && G.sh.length < 320) { const big = v >= 5 ? 5 : 1; v -= big; G.sh.push({ x: e.x + (R() - 0.5) * e.r, y: e.y + (R() - 0.5) * e.r, v: big, vx: (R() - 0.5) * 80, vy: (R() - 0.5) * 80 }); }
    if (e.type === 'tank' && !e.small) for (let i = 0; i < 2; i++) spawn('tank', e.x + (i ? 12 : -12), e.y, { r: 13, hp: e.max * 0.3, max: e.max * 0.3, small: true, xp: 1, spd: 70, col: '#ffd23f' });
    if (e.type === 'boss') {
      G.boss = null; G.bosses++; G.hitstop = 0.35; G.shake += 34; warp(e.x, e.y, 140);
      burst(e.x, e.y, e.col, 140, 520); burst(e.x, e.y, '#ffffff', 60, 300);
      G.chests.push({ x: e.x, y: e.y, t: 0 });
      for (let i = 0; i < 30; i++) G.sh.push({ x: e.x, y: e.y, v: 5, vx: (R() - 0.5) * 500, vy: (R() - 0.5) * 500 });
    } else if (e.r >= 18) { G.hitstop = Math.max(G.hitstop, 0.05); G.shake += e.r * 0.25; warp(e.x, e.y, 22); }
    else G.shake += 1.2;
  }

  function weapons(dt) {
    const p = G.p, st = G.S, cd = G.cd, base = st.dmg;
    cd.gun -= dt;
    if (cd.gun <= 0) {
      const tg = nearest(p.x, p.y, viewR() * 0.95);
      if (tg) {
        cd.gun = st.rate; const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), n = st.count, spr = 0.13;
        p.aim = a0;
        for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * spr; G.bu.push({ x: p.x, y: p.y, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, dmg: base, pierce: st.pierce, hit: [], life: 1.1, r: G.evos.hyper ? 5 : 4 }); }
        S.play('shot');
      } else cd.gun = 0.1;
    }
    const bl = lv('blades');
    if (bl || G.evos.saw) {
      const n = G.evos.saw ? 8 : bl + 1, rad = G.evos.saw ? 80 + 34 * Math.sin(G.t * 2.2) : 56 + bl * 5;
      G.bladeA += dt * (G.evos.saw ? 5 : 3 + bl * 0.3); G.blades = [];
      for (let i = 0; i < n; i++) { const a = G.bladeA + i * TAU / n; G.blades.push({ x: p.x + Math.cos(a) * rad, y: p.y + Math.sin(a) * rad, a }); }
      for (const e of G.en) {
        if (e.dead || (e.bcd -= dt) > 0) continue;
        if (Math.abs(e.x - p.x) > rad + 60 || Math.abs(e.y - p.y) > rad + 60) continue;
        for (const b of G.blades) if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + 10) ** 2) { e.bcd = 0.28; A.hit(e, base * (G.evos.saw ? 1.7 : 0.9), { kb: 60, fx: p.x, fy: p.y }); break; }
      }
    } else G.blades = null;
    const ch = lv('chain');
    if (ch || G.evos.tempest) {
      cd.chain -= dt;
      if (cd.chain <= 0) {
        cd.chain = G.evos.tempest ? 0.45 : 1.7 - ch * 0.2;
        const srcs = G.evos.tempest ? 2 : 1;
        for (let s = 0; s < srcs; s++) {
          let cur = { x: p.x, y: p.y }, hit = [], pts = [{ x: p.x, y: p.y }];
          let tg = nearest(p.x, p.y, 280, G.zapSkip);
          for (let j = 0; j < (G.evos.tempest ? 7 : 2 + ch) && tg; j++) { hit.push(tg); pts.push({ x: tg.x, y: tg.y }); A.hit(tg, base * 1.4, { crit: G.evos.tempest && R() < 0.4 }); cur = tg; tg = nearest(cur.x, cur.y, 160, hit); }
          if (pts.length > 1) { G.zaps.push({ pts, life: 0.18 }); S.play('zap'); }
          G.zapSkip = hit.slice(0, 1);
        }
        G.zapSkip = null;
      }
    }
    const ml = lv('missile');
    if (ml) {
      cd.missile -= dt;
      if (cd.missile <= 0) {
        cd.missile = 2.3 - ml * 0.25; const n = G.evos.hive ? ml * 2 : ml;
        for (let i = 0; i < n; i++) { const a = R() * TAU; G.mi.push({ x: p.x, y: p.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: 3, tg: null, trail: [] }); }
        S.play('missile');
      }
    }
    const nv = lv('nova');
    if (nv || G.evos.saw) {
      cd.nova -= dt;
      if (cd.nova <= 0) { cd.nova = Math.max(1.8, 5.5 - nv * 0.6); G.novas.push({ x: p.x, y: p.y, r: 0, max: 100 + nv * 18 + (G.evos.saw ? 40 : 0), hit: [], dmg: base * (1.5 + nv * 0.4) }); warp(p.x, p.y, 30); S.play('nova'); }
    }
  }

  A.update = function (rdt) {
    if (G.state !== 'play' && G.state !== 'dying') return;
    if (G.hitstop > 0) { G.hitstop -= rdt; return; }
    if (G.state === 'dying') { G.deathT += rdt; if (G.deathT > 1.9) { G.state = 'dead'; A.ui.death(); return; } }
    const dt = rdt * G.ts, p = G.p;
    G.S = stats(); G.t += G.state === 'play' ? dt : 0;
    G.dmgFlash = Math.max(0, G.dmgFlash - rdt); G.evoFlash = Math.max(0, G.evoFlash - rdt);
    if ((G.comboT -= dt) <= 0) G.combo = 0;
    for (const w of G.warps) w.t += dt; G.warps = G.warps.filter(w => w.t < 1.2);
    if (G.state === 'play') {
      const ix = A.input.x, iy = A.input.y, sp = G.S.spd;
      G.dashCd = Math.max(0, G.dashCd - dt); p.dashT = Math.max(0, (p.dashT || 0) - dt);
      if (A.input.dash) { A.input.dash = false; if (G.dashCd <= 0) { const dx = ix || Math.cos(p.ang), dy = iy || Math.sin(p.ang), dl = Math.hypot(dx, dy) || 1; p.vx = dx / dl * sp * 3.4; p.vy = dy / dl * sp * 3.4; p.dashT = 0.16; p.inv = Math.max(p.inv, 0.3); G.dashCd = 2.2; burst(p.x, p.y, G.ship.c, 10, 140); S.play('pick'); } }
      if (!p.dashT) { p.vx += (ix * sp - p.vx) * Math.min(1, dt * 12); p.vy += (iy * sp - p.vy) * Math.min(1, dt * 12); }
      p.x = Math.max(-ARENA, Math.min(ARENA, p.x + p.vx * dt)); p.y = Math.max(-ARENA, Math.min(ARENA, p.y + p.vy * dt));
      if (Math.hypot(p.vx, p.vy) > 20) { const ta = Math.atan2(p.vy, p.vx); let d = ta - p.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); p.ang += d * Math.min(1, dt * 10); }
      p.inv -= dt;
      if (G.grace > 0) G.grace -= dt; else director(dt);
      weapons(dt);
    }
    p.trail.unshift({ x: p.x, y: p.y }); if (p.trail.length > 16) p.trail.pop();
    // bullets
    for (const b of G.bu) {
      b.px = b.x; b.py = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of G.en) {
        if (e.dead || b.hit.includes(e)) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + b.r) ** 2) {
          b.hit.push(e); A.hit(e, b.dmg, { kb: 40, fx: b.px, fy: b.py }); burst(b.x, b.y, '#bbffff', 2, 90);
          if (b.pierce-- <= 0) { b.life = 0; break; }
        }
      }
    }
    G.bu = G.bu.filter(b => b.life > 0);
    for (const m of G.mi) {
      if (!m.tg || m.tg.dead) m.tg = nearest(m.x, m.y, 500);
      if (m.tg) { const a = Math.atan2(m.tg.y - m.y, m.tg.x - m.x); m.vx += Math.cos(a) * 1400 * dt; m.vy += Math.sin(a) * 1400 * dt; }
      const v = Math.hypot(m.vx, m.vy), mx = 420; if (v > mx) { m.vx *= mx / v; m.vy *= mx / v; }
      m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; m.trail.unshift({ x: m.x, y: m.y }); if (m.trail.length > 10) m.trail.pop();
      if (m.tg && (m.tg.x - m.x) ** 2 + (m.tg.y - m.y) ** 2 < (m.tg.r + 6) ** 2) m.life = 0;
      if (m.life <= 0) {
        const rad = G.evos.hive ? 75 : 48;
        for (const e of G.en) if (!e.dead && (e.x - m.x) ** 2 + (e.y - m.y) ** 2 < (rad + e.r) ** 2) A.hit(e, G.S.dmg * 2, { kb: 120, fx: m.x, fy: m.y });
        burst(m.x, m.y, '#ff8a3d', 18, 220); warp(m.x, m.y, 12); G.shake += 2; S.play('explode', 0.25);
      }
    }
    G.mi = G.mi.filter(m => m.life > 0);
    for (const n of G.novas) {
      n.r += 420 * dt;
      for (const e of G.en) if (!e.dead && !n.hit.includes(e) && (e.x - n.x) ** 2 + (e.y - n.y) ** 2 < (n.r + e.r) ** 2) { n.hit.push(e); A.hit(e, n.dmg, { kb: 260, fx: n.x, fy: n.y }); }
      for (const b of G.eb) if ((b.x - n.x) ** 2 + (b.y - n.y) ** 2 < n.r * n.r) b.life = 0;
    }
    G.novas = G.novas.filter(n => n.r < n.max);
    for (const z of G.zaps) z.life -= dt; G.zaps = G.zaps.filter(z => z.life > 0);
    updateEnemies(dt);
    for (const b of G.eb) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (b.r + p.r - 2) ** 2) { b.life = 0; hurt(10, 'bullet'); }
    }
    G.eb = G.eb.filter(b => b.life > 0);
    // shards
    const mg = G.S.magnet;
    for (const s of G.sh) {
      const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
      if (d < mg || s.pull) { s.pull = true; const a = 900 + (mg - d) * 4; s.vx += dx / d * a * dt; s.vy += dy / d * a * dt; }
      s.vx *= Math.pow(0.04, dt); s.vy *= Math.pow(0.04, dt); s.x += s.vx * dt; s.y += s.vy * dt;
      if (d < p.r + 8 && G.state === 'play') { s.dead = true; G.xp += s.v; S.play('pickup'); }
    }
    G.sh = G.sh.filter(s => !s.dead);
    while (G.xp >= G.xpNext && G.state === 'play') { G.xp -= G.xpNext; G.level++; G.xpNext = Math.floor(6 + G.level * 4.5 + Math.pow(G.level, 1.6)); G.pendingLv++; }
    for (const c of G.chests) { c.t += dt; if ((c.x - p.x) ** 2 + (c.y - p.y) ** 2 < 900 && G.state === 'play') { c.dead = true; G.chestOpen = true; G.pendingLv++; burst(c.x, c.y, '#ffd23f', 50, 300); S.play('evolve'); } }
    G.chests = G.chests.filter(c => !c.dead);
    for (const q of G.pa) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= Math.pow(0.08, dt); q.vy *= Math.pow(0.08, dt); q.life -= dt; }
    G.pa = G.pa.filter(q => q.life > 0);
    for (const t of G.tx) { t.y -= 40 * dt; t.life -= dt; } G.tx = G.tx.filter(t => t.life > 0);
    G.shake = Math.min(40, G.shake) * Math.pow(0.004, rdt);
    S.setIntensity(0.15 + Math.min(0.6, G.t / 400) + Math.min(0.3, G.en.length / 400) + (G.boss || G.banner ? 0.35 : 0) + (p.hp < p.max * 0.3 ? 0.15 : 0));
    if (G.pendingLv > 0 && G.state === 'play' && !G.hitstop) { G.pendingLv--; A.ui.levelUp(G.chestOpen); G.chestOpen = false; }
  };

  function updateEnemies(dt) {
    const p = G.p, vr = viewR();
    for (const e of G.en) {
      if (e.dead) continue;
      e.t += dt; e.flash -= dt; e.rot += dt * (e.type === 'tank' ? 0.6 : 2);
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      let mx = ux * e.spd, my = uy * e.spd;
      if (e.type === 'swarmer') { mx += Math.cos(e.t * 6 + e.rot) * 60; my += Math.sin(e.t * 6) * 60; }
      else if (e.type === 'dasher') {
        if (e.st === 0) { if (d < 230 && e.t > 1.2) { e.st = 1; e.st_t = 0.65; } }
        else if (e.st === 1) { mx = my = 0; e.st_t -= dt; e.dir = Math.atan2(dy, dx); if (e.st_t <= 0) { e.st = 2; e.st_t = 0.42; } }
        else { mx = Math.cos(e.dir) * 430; my = Math.sin(e.dir) * 430; e.st_t -= dt; if (e.st_t <= 0) { e.st = 0; e.t = 0; } }
      } else if (e.type === 'shooter') {
        if (d < 190) { mx = -mx; my = -my; } else if (d < 260) { mx = -uy * e.spd * 0.8; my = ux * e.spd * 0.8; }
        if ((e.fire -= dt) <= 0 && d < vr) { e.fire = 2.4; ebullet(e.x, e.y, Math.atan2(dy, dx), 135, 5); }
      } else if (e.type === 'boss') boss(e, dt, dx, dy, d);
      e.x += (mx + e.kx) * dt; e.y += (my + e.ky) * dt; e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
      if (d < e.r + p.r) hurt(e.type === 'boss' ? 25 : e.type === 'tank' ? 18 : e.type === 'swarmer' ? 6 : 12, e.type === 'boss' ? e.name : e.type);
      if (d > vr * 2.2 && e.type !== 'boss') { e.x = p.x + ux * vr * 1.1; e.y = p.y + uy * vr * 1.1; }
    }
    // light separation
    const E = G.en, n = E.length;
    for (let i = 0; i < n; i++) { const a = E[i]; for (let k = 1; k <= 3; k++) { const b = E[(i + k) % n]; if (!b || b === a) continue; const dx = a.x - b.x, dy = a.y - b.y, rr = a.r + b.r, d2 = dx * dx + dy * dy; if (d2 < rr * rr && d2 > 0.01) { const d = Math.sqrt(d2), f = (rr - d) * 0.5 / d; if (a.type !== 'boss') { a.x += dx * f; a.y += dy * f; } if (b.type !== 'boss') { b.x -= dx * f; b.y -= dy * f; } } } }
    G.en = E.filter(e => !e.dead);
  }
  function boss(e, dt, dx, dy, d) {
    e.patT -= dt; e.ang += dt; e.sub -= dt;
    if (e.patT <= 0) { e.pat = (e.pat + 1) % 4; e.patT = [3.5, 3.2, 2.6, 2.4][e.pat]; e.sub = 0; e.st = 0; }
    const a = Math.atan2(dy, dx), hard = 1 + G.bossN * 0.25;
    if (e.pat === 0 && e.sub <= 0) { e.sub = 1 / hard; const n = 12 + G.bossN * 2; for (let i = 0; i < n; i++) ebullet(e.x, e.y, i * TAU / n + e.ang, 150, 6); }
    if (e.pat === 1) { e.spd = 20; if (e.sub <= 0) { e.sub = 0.07; for (let k = 0; k < 2 + G.bossN; k++) ebullet(e.x, e.y, e.ang * 3 + k * TAU / (2 + G.bossN), 165, 5); } } else e.spd = 58;
    if (e.pat === 2) {
      if (e.st === 0) { e.st = 1; e.st_t = 0.8; }
      if (e.st === 1) { e.spd = 0; e.dir = a; e.st_t -= dt; e.tele = true; if (e.st_t <= 0) { e.st = 2; e.st_t = 0.6; e.tele = false; } }
      else if (e.st === 2) { e.kx = Math.cos(e.dir) * 480; e.ky = Math.sin(e.dir) * 480; e.st_t -= dt; if (e.st_t <= 0) { e.st = 0; G.shake += 6; } }
    } else e.tele = false;
    if (e.pat === 3 && e.st === 0) { e.st = 1; for (let i = 0; i < 6 + G.bossN * 2; i++) spawn('swarmer', e.x + (R() - 0.5) * 80, e.y + (R() - 0.5) * 80); }
  }

  A.choices = function (chest) {
    const pool = A.UPG.filter(u => lv(u.id) < 5).sort(() => R() - 0.5).slice(0, 3);
    if (!pool.length) return [{ id: 'heal', n: 'Repair', d: 'Restore 40% HP', ic: '✚', c: '#ff5c8a', rar: 'rare' }, { id: 'cores', n: 'Core Cache', d: '+5 cores', ic: '◆', c: '#ffd23f', rar: 'epic' }];
    return pool.map(u => { const r = R(); return Object.assign({}, u, { rar: chest || r < 0.08 ? 'epic' : r < 0.33 ? 'rare' : 'common' }); });
  };
  A.pick = function (c) {
    const p = G.p;
    if (c.id === 'heal') p.hp = Math.min(p.max, p.hp + p.max * 0.4);
    else if (c.id === 'cores') G.bonusCores = (G.bonusCores || 0) + 5;
    else {
      const n = Math.min(c.rar === 'epic' ? 2 : 1, 5 - lv(c.id));
      G.ups[c.id] = lv(c.id) + n;
      if (c.id === 'hp') { p.max += 20 * n; p.hp += 20 * n; }
      if (c.rar === 'rare') p.hp = Math.min(p.max, p.hp + p.max * 0.15);
    }
    for (const ev of A.EVOS) if (!G.evos[ev.id] && lv(ev.a) >= 5 && lv(ev.b) >= 5) { G.evos[ev.id] = true; G.evoFlash = 1.5; G.evoName = ev.n; warp(p.x, p.y, 90); S.play('evolve'); }
    G.state = 'play';
  };
  A.finishRun = function () {
    const m = A.meta, earned = Math.floor(G.kills / 12 + G.t / 15 + G.bosses * 15 + (G.bonusCores || 0));
    G.earned = earned; m.cores += earned;
    const run = { t: Math.floor(G.t), k: G.kills, l: G.level, c: G.bestCombo, s: G.ship.n, d: new Date().toISOString().slice(0, 10), b: Object.keys(G.ups).filter(k => G.ups[k]), e: Object.keys(G.evos), by: G.state === 'dead' && G.p.hp <= 0 ? (G.lastHit || '') : 'quit' };
    const L = m.life || (m.life = { runs: 0, kills: 0, time: 0, bosses: 0, cores: 0 });
    L.runs++; L.kills += G.kills; L.time += Math.floor(G.t); L.bosses += G.bosses; L.cores += earned; L.combo = Math.max(L.combo || 0, G.bestCombo); L.lvl = Math.max(L.lvl || 0, G.level);
    const today = run.d; if (!m.daily || m.daily.d !== today || run.t > m.daily.t) { G.newDaily = true; m.daily = { d: today, t: run.t }; } else G.newDaily = false;
    G.newBest = run.t > (m.best || 0); m.best = Math.max(m.best || 0, run.t);
    m.shipBest = m.shipBest || {}; if (run.t > (m.shipBest[G.ship.id] || 0)) m.shipBest[G.ship.id] = run.t;
    m.runs = (m.runs || []).concat([run]).sort((a, b) => b.t - a.t).slice(0, 5);
    A.save();
  };
})(window.App);
