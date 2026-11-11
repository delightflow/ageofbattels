/* Age of Battels — synthesized battle sounds (Web Audio, no samples). */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};
let ac = null, master = null, noise = null, on = true;
const last = {}, GAP = { clang: 0.045, twang: 0.05, thud: 0.05, die: 0.07, boom: 0.12, gun: 0.07, wood: 0.08, heal: 0.25, crash: 0.3, hoof: 0.2 };

function init() {
  if (ac) return true;
  const C = G.AudioContext || G.webkitAudioContext; if (!C) return false;
  ac = new C(); master = ac.createGain(); master.gain.value = on ? 0.5 : 0;
  const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
  const len = ac.sampleRate, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; noise = buf;
  return true;
}
function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function out(vol, pan) { const g = ac.createGain(); g.gain.value = vol; if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master); return g; }
function nz(t, dur, type, f0, f1, q, peak, dest) {
  const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, 0.004, dur, peak); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
function tone(t, dur, type, f0, f1, peak, dest) {
  const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, 0.004, dur, peak); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
const SND = {
  clang(t, d) { const f = 1500 + Math.random() * 1800; tone(t, 0.12, 'square', f, f * 0.94, 0.12, d); tone(t, 0.16, 'sine', f * 1.51, f * 1.45, 0.1, d); nz(t, 0.05, 'highpass', 3000, 5000, 0.7, 0.25, d); },
  twang(t, d) { tone(t, 0.09, 'triangle', 420 + Math.random() * 160, 160, 0.2, d); nz(t, 0.12, 'bandpass', 2400, 900, 1.2, 0.12, d); },
  thud(t, d) { tone(t, 0.07, 'sine', 180, 70, 0.3, d); nz(t, 0.04, 'lowpass', 1400, 500, 0.6, 0.2, d); },
  die(t, d) { const f = 150 + Math.random() * 90; tone(t, 0.22, 'sawtooth', f, f * 0.55, 0.14, d); nz(t, 0.18, 'bandpass', 900, 500, 2, 0.1, d); },
  wood(t, d) { tone(t, 0.1, 'triangle', 190, 80, 0.4, d); nz(t, 0.08, 'bandpass', 700, 300, 1, 0.3, d); },
  boom(t, d) { tone(t, 0.5, 'sine', 110, 32, 0.9, d); nz(t, 0.45, 'lowpass', 900, 120, 0.5, 0.6, d); },
  gun(t, d) { nz(t, 0.16, 'highpass', 900, 300, 0.4, 0.55, d); tone(t, 0.1, 'square', 220, 60, 0.25, d); },
  crash(t, d) { nz(t, 1.1, 'lowpass', 1600, 150, 0.4, 0.8, d); tone(t, 0.6, 'sine', 80, 30, 0.7, d); },
  heal(t, d) { tone(t, 0.3, 'sine', 880, 1320, 0.1, d); tone(t + 0.08, 0.3, 'sine', 1320, 1760, 0.07, d); },
};
function play(name, vol, pan) {
  if (!on || !ac || ac.state !== 'running') return; const t = ac.currentTime; if (t - (last[name] || 0) < GAP[name]) return; last[name] = t;
  SND[name](t, out(Math.min(1, vol), Math.max(-1, Math.min(1, pan || 0))));
}
function horn(notes, vol) {
  if (!on || !init()) return; const t0 = ac.currentTime + 0.05, d = out(vol || 0.5, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(d);
  notes.forEach(([f, at, dur]) => { for (const det of [1, 1.006, 0.5]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * det; const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.16, t0 + at + 0.08); g.gain.setValueAtTime(0.16, t0 + at + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
    o.connect(g); g.connect(lp); o.start(t0 + at); o.stop(t0 + at + dur + 0.05); } });
}
AB.Audio = {
  unlock() { if (init() && ac.state === 'suspended') ac.resume(); },
  setOn(v) { on = v; if (master) master.gain.value = v ? 0.5 : 0; },
  isOn() { return on; },
  // events from the sim; R = renderer (for screen position → pan / distance)
  feed(events, R) {
    if (!on || !ac) return; const W = R.W, H = R.H, zf = Math.min(1, 0.45 + R.cam.z * 0.5);
    for (const e of events) {
      const [sx, sy] = R.w2s(e.x, e.y), dx = (sx - W / 2) / (W / 2), dy = (sy - H / 2) / (H / 2), far = Math.max(Math.abs(dx), Math.abs(dy));
      const vol = (far < 1 ? 1 : Math.max(0, 1.6 - far * 0.6)) * zf; if (vol <= 0.05) continue;
      switch (e.k) {
        case 'hit': play(e.a === 'bld' ? 'wood' : 'clang', (e.a === 'charge' ? 0.5 : 0.28) * vol, dx); break;
        case 'shoot': play(e.a === 'bullet' ? 'gun' : e.a === 'ball' ? 'boom' : e.a === 'stone' || e.a === 'bigbolt' ? 'wood' : 'twang', (e.a === 'ball' ? 0.7 : 0.3) * vol, dx); break;
        case 'thud': play('thud', 0.25 * vol, dx); break;
        case 'boom': play('boom', 0.6 * vol, dx); break;
        case 'die': play('die', 0.3 * vol, dx); break;
        case 'collapse': play('crash', 0.8 * vol, dx); break;
        case 'heal': play('heal', 0.2 * vol, dx); break;
      }
    }
  },
  start() { horn([[196, 0, 0.35], [196, 0.4, 0.3], [294, 0.75, 0.9]], 0.45); },
  win() { horn([[262, 0, 0.3], [330, 0.3, 0.3], [392, 0.6, 0.3], [523, 0.9, 1.1]], 0.5); },
  lose() { horn([[220, 0, 0.6], [196, 0.6, 0.6], [147, 1.2, 1.2]], 0.4); },
  click() { if (init()) play('thud', 0.15, 0); },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
