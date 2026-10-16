window.App = window.App || {};
(function (A) {
  A.UPG = [
    { id: 'multi', n: 'Split Shot', d: '+1 projectile per volley', ic: '⋔', c: '#3ff6ff' },
    { id: 'rate', n: 'Overclock', d: '+20% fire rate', ic: '⚡', c: '#7dfcff' },
    { id: 'pierce', n: 'Piercing Rounds', d: 'Shots pass through +1 enemy', ic: '➶', c: '#9d8bff' },
    { id: 'blades', n: 'Orbit Blades', d: '+1 blade circling your ship', ic: '✦', c: '#ff3dc8' },
    { id: 'chain', n: 'Chain Lightning', d: 'Arcs between more foes, faster', ic: 'ϟ', c: '#ffe14d' },
    { id: 'missile', n: 'Homing Missiles', d: '+1 seeking missile', ic: '➹', c: '#ff8a3d' },
    { id: 'nova', n: 'Shock Nova', d: 'Bigger, more frequent pulse', ic: '◎', c: '#5cff9d' },
    { id: 'speed', n: 'Thrusters', d: '+8% move speed', ic: '»', c: '#7dfcff' },
    { id: 'hp', n: 'Hull Plating', d: '+20 max HP and heal', ic: '✚', c: '#ff5c8a' },
    { id: 'magnet', n: 'Magnet Field', d: '+30% pickup range', ic: '◉', c: '#b4ff5c' },
    { id: 'crit', n: 'Targeting AI', d: '+7% critical chance', ic: '✕', c: '#ffd23f' }
  ];
  A.EVOS = [
    { id: 'saw', a: 'blades', b: 'nova', n: 'Saw Storm', d: '8 pulsing saws shred everything' },
    { id: 'hyper', a: 'multi', b: 'rate', n: 'Hyperstream', d: 'Double fire rate, +2 shots' },
    { id: 'tempest', a: 'chain', b: 'crit', n: 'Tempest', d: 'Constant storm of lightning' },
    { id: 'hive', a: 'missile', b: 'pierce', n: 'Hive Swarm', d: 'Missile swarms, huge blasts' }
  ];
  A.SHIPS = [
    { id: 'spark', n: 'Spark', d: 'Balanced blaster', c: '#3ff6ff', cost: 0, start: {} },
    { id: 'warden', n: 'Warden', d: 'Blades · +20 HP', c: '#ff3dc8', cost: 60, start: { blades: 1 }, hp: 20, spd: -0.06 },
    { id: 'volt', n: 'Volt', d: 'Lightning · fast', c: '#ffe14d', cost: 120, start: { chain: 1 }, hp: -15, spd: 0.1 }
  ];
  A.SHOP = [
    { id: 'hp', n: 'Hull', d: '+10 starting HP', max: 5 },
    { id: 'dmg', n: 'Firepower', d: '+8% damage', max: 5 },
    { id: 'spd', n: 'Thrusters', d: '+5% move speed', max: 5 },
    { id: 'reroll', n: 'Reroll', d: '+1 card reroll per run', max: 3 },
    { id: 'revive', n: 'Second Wind', d: 'Revive once per run at 50% HP', max: 1 }
  ];
  A.shopCost = (id, l) => (id === 'reroll' ? 30 : id === 'revive' ? 80 : 15) * (l + 1);

  const C = window.cabinet || {};
  const def = { cores: 0, shop: {}, ships: ['spark'], ship: 'spark', best: 0, runs: [], muted: false };
  let m = null;
  try { m = C.recall ? C.recall('meta', null) : JSON.parse(localStorage.getItem('ns-meta') || 'null'); } catch (e) {}
  A.meta = Object.assign({}, def, m || {});
  A.meta.shop = A.meta.shop || {};
  A.meta.life = Object.assign({ runs: 0, kills: 0, time: 0, bosses: 0, cores: 0 }, A.meta.life || {});
  A.save = function () {
    try { if (C.remember) C.remember('meta', A.meta); else localStorage.setItem('ns-meta', JSON.stringify(A.meta)); } catch (e) {}
  };
  if (C.onMemory) C.onMemory(mem => { if (mem && mem.meta && A.G.state !== 'play') { A.meta = Object.assign({}, def, mem.meta); A.meta.life = Object.assign({ runs: 0, kills: 0, time: 0, bosses: 0, cores: 0 }, A.meta.life || {}); if (A.sfx) A.sfx.setMuted(!!A.meta.muted); if (A.ui) A.ui.refresh(); } });
  A.fmt = s => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
})(window.App);
