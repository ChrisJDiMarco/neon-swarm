(function (A) {
  let ctx, master, sfxG, musG, noiseBuf, muted = !!A.meta.muted, inten = 0.15, step = 0, nextT = 0;
  const last = {};
  const S = A.sfx = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  S.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.7;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = 0.5; sfxG.connect(master);
    musG = ctx.createGain(); musG.gain.value = 0.32; musG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextT = ctx.currentTime + 0.1;
    setInterval(sched, 40);
  };
  S.setMuted = function (m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.7, ctx.currentTime, 0.05); };
  S.setIntensity = v => { inten = Math.max(0, Math.min(1, v)); };
  S.beat = () => (ctx ? ((ctx.currentTime - nextT) / (60 / 112) + 100) % 1 : 0);

  function tone(type, f0, f1, dur, vol, dest, when) {
    const t = when || ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, ftype, dest, when) {
    const t = when || ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = ftype || 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function gap(k, s) { const n = ctx.currentTime; if (last[k] && n - last[k] < s) return false; last[k] = n; return true; }

  S.play = function (k, size) {
    if (!ctx || muted) return;
    switch (k) {
      case 'shot': if (gap(k, 0.06)) tone('square', 1200, 500, 0.05, 0.035); break;
      case 'hit': if (gap(k, 0.035)) tone('triangle', 320 + Math.random() * 80, 110, 0.06, 0.07); break;
      case 'pickup': if (gap(k, 0.03)) tone('sine', 900 + Math.random() * 300, 1900, 0.07, 0.05); break;
      case 'explode': if (gap(k, 0.04)) { const z = size || 0.3; noise(0.2 + z * 0.4, 0.18 + z * 0.2, 900 + z * 800); tone('sine', 140, 38, 0.25 + z * 0.3, 0.25 * (0.5 + z)); } break;
      case 'hurt': tone('sawtooth', 220, 55, 0.3, 0.18); noise(0.2, 0.2, 2000); break;
      case 'zap': if (gap(k, 0.08)) { noise(0.09, 0.12, 3000, 'highpass'); tone('square', 1800, 300, 0.08, 0.03); } break;
      case 'nova': tone('sine', 160, 900, 0.35, 0.15); noise(0.3, 0.1, 1500, 'bandpass'); break;
      case 'missile': if (gap(k, 0.1)) noise(0.15, 0.06, 1200, 'bandpass'); break;
      case 'level': [0, 4, 7, 12, 16].forEach((n, i) => tone('square', mtof(72 + n), 0, 0.18, 0.05, sfxG, ctx.currentTime + i * 0.06)); break;
      case 'pick': tone('triangle', 660, 1320, 0.15, 0.1); break;
      case 'evolve': [0, 3, 7, 10, 12, 15, 19, 24].forEach((n, i) => tone('sawtooth', mtof(60 + n), 0, 0.3, 0.05, sfxG, ctx.currentTime + i * 0.05)); break;
      case 'boss': for (let i = 0; i < 3; i++) tone('sawtooth', 110, 220, 0.4, 0.12, sfxG, ctx.currentTime + i * 0.5); break;
      case 'die': noise(1.4, 0.35, 600); tone('sawtooth', 300, 30, 1.4, 0.2); break;
      case 'ui': tone('sine', 700, 1000, 0.06, 0.06); break;
    }
  };

  const ROOTS = [45, 41, 48, 43], CH = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
  function sched() {
    if (!ctx) return;
    const sx = 60 / 112 / 4;
    if (nextT < ctx.currentTime - 0.5) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.15) { playStep(step, nextT); nextT += sx; step++; }
  }
  function playStep(s, t) {
    if (muted) return;
    const bar = Math.floor(s / 16) % 4, i = s % 16, root = ROOTS[bar], ch = CH[bar], I = inten;
    if (i % 4 === 0) tone('sine', 150, 40, 0.22, 0.45 * (0.5 + I * 0.5), musG, t);
    if (i % 2 === 0) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(root + (i % 4 === 2 ? 12 : 0));
      f.type = 'lowpass'; f.frequency.value = 300 + I * 1800; f.Q.value = 6;
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      o.connect(f); f.connect(g); g.connect(musG); o.start(t); o.stop(t + 0.15);
    }
    if (I > 0.2 && (i === 4 || i === 12)) noise(0.14, 0.16, 1800, 'bandpass', musG, t);
    if (I > 0.4 || i % 4 === 2) noise(0.03, i % 4 === 2 ? 0.06 : 0.03, 8000, 'highpass', musG, t);
    if (I > 0.55) tone('square', mtof(root + 24 + ch[i % 3] + (i % 6 > 2 ? 12 : 0)), 0, 0.09, 0.025, musG, t);
    if (I > 0.8 && i === 0) ch.forEach(n => tone('sawtooth', mtof(root + 12 + n), 0, 1.9, 0.02, musG, t));
  }
})(window.App);
