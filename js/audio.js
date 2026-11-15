/* Age of Battels — synthesized battle sound (Web Audio, no samples).
   A small reverb room, metal and wood impacts, bows and whooshes, formant voices for cries and
   shouts, horses, elephants, siege engines, and a crowd/hoofbeat bed that follows the fighting. */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};
let ac = null, master = null, dry = null, verb = null, noise = null, on = true, bed = null;
const last = {}, GAP = { clang: 0.035, block: 0.05, chop: 0.05, release: 0.03, whoosh: 0.06, flesh: 0.04, tick: 0.05, wood: 0.07, die: 0.08, horse: 0.6, ele: 0.9,
  creak: 0.25, impact: 0.12, cannon: 0.15, gun: 0.06, crash: 0.3, heal: 0.25, xbow: 0.05, charge: 1.2, wolf: 0.4, rocket: 0.4 };

function init() {
  if (ac) return true;
  const C = G.AudioContext || G.webkitAudioContext; if (!C) return false;
  ac = new C();
  master = ac.createGain(); master.gain.value = on ? 0.55 : 0;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; master.connect(comp); comp.connect(ac.destination);
  dry = ac.createGain(); dry.connect(master);
  // a stone-and-field room: 1.8 s exponentially decaying stereo noise
  verb = ac.createConvolver(); const len = ac.sampleRate * 1.8 | 0, ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (t < 0.01 ? t * 100 : 1); } }
  verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
  const nl = ac.sampleRate * 2, nb = ac.createBuffer(1, nl, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1; noise = nb;
  return true;
}
// --------------------------------------------------------------- building blocks
function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
// a per-sound output with pan and distance: farther away = quieter and wetter
function out(vol, pan, wet) {
  const g = ac.createGain(); g.gain.value = vol; let n = g;
  if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0)); g.connect(p); n = p; }
  n.connect(dry); const s = ac.createGain(); s.gain.value = wet == null ? 0.25 : wet; n.connect(s); s.connect(verb);
  return g;
}
function nz(t, dur, type, f0, f1, q, peak, dest, att) {
  const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, att || 0.003, dur, peak); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.1);
}
function tone(t, dur, type, f0, f1, peak, dest, att) {
  const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, att || 0.003, dur, peak); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.1);
}
// struck metal: inharmonic partials that ring and fade at different rates
function metal(t, f, dur, peak, dest) {
  [[1, 1], [2.76, 0.6], [5.4, 0.4], [8.93, 0.25], [13.3, 0.12]].forEach(([m, a], i) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * m * (1 + (Math.random() - 0.5) * 0.01);
    const g = ac.createGain(); env(g, t, 0.001, dur / (1 + i * 0.6), peak * a); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.1);
  });
}
const VOW = { a: [760, 1150, 2400], o: [500, 860, 2400], u: [340, 760, 2300], e: [520, 1750, 2500], ah: [680, 1050, 2500] };
// a vocal cry: glottal sawtooth through three formant filters
function voice(t, f0, f1, dur, vow, peak, dest, rough) {
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.06, t + dur * 0.2); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5 + Math.random() * 3; vg.gain.value = f0 * (rough ? 0.06 : 0.02); vib.connect(vg); vg.connect(o.frequency);
  const g = ac.createGain(); env(g, t, 0.025, dur, peak); const F = VOW[vow];
  F.forEach((fr, i) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr * (0.92 + Math.random() * 0.16); b.Q.value = 7 + i * 3; const bg = ac.createGain(); bg.gain.value = [1, 0.55, 0.22][i]; o.connect(b); b.connect(bg); bg.connect(g); });
  g.connect(dest); o.start(t); vib.start(t); o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1);
  if (rough) nz(t, dur * 0.8, 'bandpass', 1400, 900, 1.5, peak * 0.25, dest, 0.02);
}

// --------------------------------------------------------------- sound set
const R = Math.random;
const SND = {
  clang(t, d) { metal(t, 1050 + R() * 900, 0.35 + R() * 0.25, 0.12, d); nz(t, 0.05, 'highpass', 2500, 5200, 0.8, 0.3, d); if (R() < 0.4) metal(t + 0.06 + R() * 0.05, 1300 + R() * 900, 0.2, 0.06, d); },
  block(t, d) { tone(t, 0.08, 'triangle', 240 + R() * 60, 120, 0.35, d); nz(t, 0.07, 'bandpass', 900, 500, 1.4, 0.35, d); metal(t, 700 + R() * 300, 0.15, 0.04, d); },
  chop(t, d) { nz(t, 0.09, 'bandpass', 1200, 400, 1.1, 0.45, d); tone(t, 0.07, 'sine', 160, 70, 0.35, d); },
  release(t, d) { tone(t, 0.06, 'triangle', 190 + R() * 60, 90, 0.32, d); nz(t, 0.04, 'bandpass', 2600, 1200, 2, 0.22, d); },
  xbow(t, d) { tone(t, 0.05, 'square', 320, 120, 0.2, d); nz(t, 0.05, 'highpass', 1800, 3000, 1, 0.35, d); },
  whoosh(t, d) { nz(t + 0.03, 0.28, 'bandpass', 1900, 650, 3.5, 0.11, d, 0.08); },
  flesh(t, d) { nz(t, 0.06, 'lowpass', 700, 220, 0.8, 0.5, d); tone(t, 0.06, 'sine', 140, 60, 0.3, d); },
  tick(t, d) { nz(t, 0.025, 'bandpass', 3200, 2400, 2, 0.25, d); },
  wood(t, d) { tone(t, 0.11, 'triangle', 170 + R() * 40, 75, 0.45, d); nz(t, 0.09, 'bandpass', 650, 280, 1.2, 0.35, d); },
  die(t, d, kind) {
    if (kind === 'horse') return SND.horse(t, d); if (kind === 'ele') return SND.ele(t, d); if (kind === 'wolf') return SND.wolf(t, d);
    const hi = R() < 0.35, f = (hi ? 200 : 110) + R() * 70, v = ['ah', 'a', 'o', 'u', 'e'][R() * 5 | 0];
    voice(t, f, f * (0.55 + R() * 0.15), 0.28 + R() * 0.3, v, 0.22, d, true);
    nz(t + 0.18 + R() * 0.1, 0.12, 'lowpass', 500, 150, 0.7, 0.25, d);           // body hits the ground
  },
  horse(t, d) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(820, t); o.frequency.linearRampToValueAtTime(980, t + 0.15); o.frequency.exponentialRampToValueAtTime(360, t + 0.9);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 13; vg.gain.value = 70; vib.connect(vg); vg.connect(o.frequency);
    const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1500; b.Q.value = 2.5; const g = ac.createGain(); env(g, t, 0.04, 0.9, 0.16);
    o.connect(b); b.connect(g); g.connect(d); o.start(t); vib.start(t); o.stop(t + 1.1); vib.stop(t + 1.1); nz(t + 0.5, 0.25, 'lowpass', 400, 120, 0.7, 0.35, d);
  },
  ele(t, d) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(280, t); o.frequency.linearRampToValueAtTime(470, t + 0.25); o.frequency.exponentialRampToValueAtTime(240, t + 0.95);
    const am = ac.createOscillator(), ag = ac.createGain(); am.frequency.value = 38; ag.gain.value = 0.5; am.connect(ag);
    const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 950; b.Q.value = 3; const g = ac.createGain(); env(g, t, 0.06, 0.95, 0.22); ag.connect(g.gain);
    o.connect(b); b.connect(g); g.connect(d); o.start(t); am.start(t); o.stop(t + 1.1); am.stop(t + 1.1);
  },
  wolf(t, d) { tone(t, 0.3, 'triangle', 700, 420, 0.12, d, 0.02); nz(t, 0.18, 'bandpass', 1600, 800, 3, 0.1, d); },
  creak(t, d) {                                    // siege arm swinging: a groaning rope and a heavy thump
    const o = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 85; m.frequency.value = 23; mg.gain.value = 40; m.connect(mg); mg.connect(o.frequency);
    const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 600; b.Q.value = 4; const g = ac.createGain(); env(g, t, 0.05, 0.3, 0.12);
    o.connect(b); b.connect(g); g.connect(d); o.start(t); m.start(t); o.stop(t + 0.5); m.stop(t + 0.5);
    tone(t + 0.28, 0.18, 'sine', 90, 40, 0.6, d); nz(t + 0.28, 0.15, 'lowpass', 700, 200, 0.7, 0.4, d);
  },
  impact(t, d) { tone(t, 0.45, 'sine', 95, 30, 0.9, d); nz(t, 0.5, 'lowpass', 1200, 140, 0.6, 0.7, d); for (let i = 0; i < 5; i++) nz(t + 0.05 + R() * 0.35, 0.04, 'bandpass', 1800 + R() * 1500, 1200, 3, 0.12, d); },
  cannon(t, d) { tone(t, 0.7, 'sine', 70, 24, 1, d); nz(t, 0.08, 'highpass', 1200, 400, 0.5, 0.9, d); nz(t, 0.9, 'lowpass', 900, 90, 0.5, 0.75, d); },
  gun(t, d) { nz(t, 0.05, 'highpass', 1600, 700, 0.5, 0.8, d); nz(t, 0.25, 'lowpass', 1500, 200, 0.5, 0.45, d); tone(t, 0.06, 'square', 180, 60, 0.2, d); },
  crash(t, d) { tone(t, 1.4, 'sine', 60, 22, 0.9, d); nz(t, 1.6, 'lowpass', 1400, 100, 0.4, 0.9, d); for (let i = 0; i < 14; i++) nz(t + R() * 1.3, 0.06 + R() * 0.08, 'bandpass', 600 + R() * 2400, 400, 2, 0.18, d); },
  rocket(t, d) { for (let i = 0; i < 12; i++) { const at = t + i * 0.035 + R() * 0.02; nz(at, 0.35, 'bandpass', 900 + R() * 400, 2600, 2.5, 0.12, d, 0.02); nz(at, 0.05, 'highpass', 2000, 3000, 1, 0.12, d); } tone(t, 0.25, 'sine', 120, 50, 0.4, d); },
  heal(t, d) { [523, 659, 784].forEach((f, i) => tone(t + i * 0.07, 0.5, 'sine', f, f, 0.06, d, 0.02)); },
  charge(t, d) { for (let i = 0; i < 9; i++) { const f = 120 + R() * 110; voice(t + R() * 0.25, f, f * 0.92, 0.7 + R() * 0.4, R() < 0.5 ? 'a' : 'ah', 0.05, d, true); } },
};
function play(name, vol, pan, wet, arg) {
  if (!on || !ac || ac.state !== 'running') return; const t = ac.currentTime; if (t - (last[name] || 0) < GAP[name]) return; last[name] = t;
  SND[name](t + R() * 0.012, out(Math.min(1, vol), pan, wet), arg);
}

// --------------------------------------------------------------- ambience bed: crowd roar + hoofbeats + distant clashes
function makeBed() {
  const g = ac.createGain(); g.gain.value = 0; g.connect(dry); const s = ac.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(verb);
  const crowd = ac.createGain(); crowd.connect(g);
  [[420, 0.9], [900, 1.2], [1700, 1.6]].forEach(([f, q], i) => {
    const src = ac.createBufferSource(); src.buffer = noise; src.loop = true; const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q;
    const lg = ac.createGain(); lg.gain.value = [0.5, 0.35, 0.15][i]; const lfo = ac.createOscillator(), lfg = ac.createGain(); lfo.frequency.value = 0.15 + R() * 0.3; lfg.gain.value = lg.gain.value * 0.5; lfo.connect(lfg); lfg.connect(lg.gain);
    src.connect(b); b.connect(lg); lg.connect(crowd); src.start(0, R()); lfo.start();
  });
  return { g, level: 0, cav: 0, hoofT: 0, clashT: 0 };
}
function hoof(t, vol, pan) { const d = out(vol, pan, 0.15); tone(t, 0.07, 'sine', 95 + R() * 25, 45, 0.6, d); nz(t, 0.05, 'lowpass', 420, 160, 0.8, 0.35, d); }

function synthStart() {
    if (!on || !init()) return; const t0 = ac.currentTime + 0.05, d = out(0.6, 0, 0.5);
    const horn = (f, at, dur) => { for (const det of [1, 1.004, 2.002]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * det * 0.94, t0 + at); o.frequency.exponentialRampToValueAtTime(f * det, t0 + at + 0.12);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(300, t0 + at); lp.frequency.linearRampToValueAtTime(1100, t0 + at + 0.2); lp.frequency.linearRampToValueAtTime(700, t0 + at + dur);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(det > 2 ? 0.05 : 0.14, t0 + at + 0.12); g.gain.setValueAtTime(det > 2 ? 0.05 : 0.14, t0 + at + dur - 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(lp); lp.connect(g); g.connect(d); o.start(t0 + at); o.stop(t0 + at + dur + 0.05); } };
    horn(98, 0, 0.9); horn(98, 1, 0.5); horn(147, 1.55, 1.6);
    const sh = out(0.8, 0, 0.6); for (let i = 0; i < 16; i++) { const f = 110 + R() * 120; voice(t0 + 2.4 + R() * 0.35, f, f * 0.9, 0.9 + R() * 0.5, R() < 0.6 ? 'a' : 'o', 0.045, sh, true); }
  }
function synthWin() { if (!on || !init()) return; const t0 = ac.currentTime + 0.05, d = out(0.45, 0, 0.45);
    [[262, 0, 0.25], [330, 0.25, 0.25], [392, 0.5, 0.25], [523, 0.75, 1.3]].forEach(([f, at, dur]) => { for (const det of [1, 1.005]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * det; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.1, t0 + at + 0.05); g.gain.setValueAtTime(0.1, t0 + at + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(lp); lp.connect(g); g.connect(d); o.start(t0 + at); o.stop(t0 + at + dur + 0.05); } });
    const sh = out(0.8, 0, 0.6); for (let i = 0; i < 14; i++) { const f = 130 + R() * 120; voice(t0 + 0.8 + R() * 0.4, f, f * 1.05, 1 + R() * 0.4, 'a', 0.045, sh, true); } }
function synthLose() { if (!on || !init()) return; const t0 = ac.currentTime + 0.05, d = out(0.5, 0, 0.6);
    [[147, 0, 0.9], [131, 0.9, 0.9], [98, 1.8, 1.8]].forEach(([f, at, dur]) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.13, t0 + at + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur); o.connect(lp); lp.connect(g); g.connect(d); o.start(t0 + at); o.stop(t0 + at + dur + 0.05); }); }
// --------------------------------------------------------------- recorded clips (assets/audio, generated with ElevenLabs)
const CLIP = { buf: {}, loading: false, ok: false, base: 'assets/audio/', last: {}, voices: 0, played: {} };
const CGAP = { clash: .03, hit: .03, block: .05, chop: .05, stab: .04, blunt: .05, bow: .025, arrowhit: .04, arrowmiss: .05, xbow: .05, musket: .05, cannon: .12,
  catapult: .2, boulder: .12, rocket: .4, die: .07, grunt: .09, horse: .5, elephant: 1, wolf: .4, collapse: .4, woodbreak: .2, charge: 2.5, pray: 1.6 };
function loadClips() {
  const man = G.AB_AUDIO; if (CLIP.loading || !man || !ac) return; CLIP.loading = true;
  const jobs = [];
  for (const name in man) for (let i = 0; i < man[name]; i++) jobs.push(fetch(CLIP.base + name + i + '.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(b => new Promise((res, rej) => ac.decodeAudioData(b, res, rej))).then(buf => { (CLIP.buf[name] = CLIP.buf[name] || []).push(buf); }).catch(() => {}));
  Promise.all(jobs).then(() => { CLIP.ok = Object.keys(CLIP.buf).length > 0; if (CLIP.ok && music.want) music.set(music.want, true); });
}
function has(name) { return CLIP.buf[name] && CLIP.buf[name].length; }
// play a random take with a little pitch and level variation; false when the clip is not available
function clip(name, vol, pan, wet, rate) {
  if (!on || !ac || ac.state !== 'running' || !has(name)) return false;
  const t = ac.currentTime; if (t - (CLIP.last[name] || 0) < (CGAP[name] || .05) || CLIP.voices > 28) return true; CLIP.last[name] = t;
  const L = CLIP.buf[name], src = ac.createBufferSource(); src.buffer = L[(Math.random() * L.length) | 0];
  src.playbackRate.value = (rate || 1) * (0.92 + Math.random() * 0.16);
  const d = out(Math.min(1, vol * (0.85 + Math.random() * 0.3)), pan, wet); src.connect(d); src.start(t + Math.random() * 0.01);
  CLIP.played[name] = (CLIP.played[name] || 0) + 1; CLIP.voices++; src.onended = () => { CLIP.voices--; }; return true;
}
// background loops: camp ambience in the editor, war drums and distant battle during a fight
const music = { want: null, on: true, nodes: {} };
function loopNode(name) {
  if (music.nodes[name] || !has(name)) return music.nodes[name];
  const g = ac.createGain(); g.gain.value = 0; g.connect(master);
  const s = ac.createBufferSource(); s.buffer = CLIP.buf[name][0]; s.loop = true; s.connect(g); s.start(0, Math.random() * s.buffer.duration);
  return (music.nodes[name] = g);
}
music.set = function (mode, force) {
  music.want = mode; if (!ac || !CLIP.ok) return;
  // Gemini (Lyria) tracks when present, otherwise the generated drum loop and camp ambience
  if (mode === 'battle' && music.mode !== 'battle') { const opts = (music.siege && has('mus_siege') ? ['mus_siege'] : ['mus_battle', 'mus_skirmish']).filter(has); music.track = opts.length ? opts[(Math.random() * opts.length) | 0] : 'mus_drums'; }
  music.mode = mode;
  const menu = has('mus_menu'), lv = mode === 'edit' ? (menu ? { mus_menu: .55, amb_camp: .35 } : { amb_camp: 1 }) : mode === 'battle' ? { [music.track]: music.track === 'mus_drums' ? .32 : .42 } : {};
  for (const name of ['amb_camp', 'mus_menu', 'mus_drums', 'mus_battle', 'mus_skirmish', 'mus_siege', 'amb_battle']) { if (name === 'amb_battle') continue; const n = loopNode(name); if (n) n.gain.setTargetAtTime(music.on && on ? (lv[name] || 0) : 0, ac.currentTime, force ? .05 : .8); }
};
const SWORD = { sword: 1, greatsword: 1, zweihander: 1, katana: 1, lance: 1 };
// signature shouts on attack: [clip, chance, level]
const SIG = { samurai: ['kiai', .3, .45], berserker: ['roar', .2, .45], jaguar: ['whoop', .2, .45], landsknecht: ['grunt', .2, .35], legionary: ['bash', .15, .3], hoplite: ['bash', .2, .3] };
let lastVoice = 0;

AB.Audio = {
  unlock() { if (init()) { if (ac.state === 'suspended') ac.resume(); loadClips(); } },
  setOn(v) { on = v; if (master) master.gain.value = v ? 0.55 : 0; music.set(music.want || 'edit'); },
  isOn() { return on; },
  setMusic(v) { music.on = v; music.set(music.want || 'edit'); },
  musicOn() { return music.on; },
  mode(m) { music.set(m); },
  // events from the sim; Rn = renderer (screen position → pan and distance)
  feed(events, Rn) {
    if (!on || !ac) return; const W = Rn.W, H = Rn.H, zf = Math.min(1, 0.45 + Rn.cam.z * 0.5); let fights = 0;
    for (const e of events) {
      if (e.k === 'hit' && e.a !== 'bld') fights++;
      const [sx, sy] = Rn.w2s(e.x, e.y), dx = (sx - W / 2) / (W / 2), dy = (sy - H / 2) / (H / 2), far = Math.max(Math.abs(dx), Math.abs(dy));
      const vol = (far < 1 ? 1 - far * 0.25 : Math.max(0, 1.5 - far * 0.6)) * zf; if (vol <= 0.05) continue;
      const wet = 0.12 + Math.min(0.5, far * 0.3) + (1 - zf) * 0.25, pan = dx * 0.8;
      switch (e.k) {
        case 'hit': {
          if (e.a === 'bld') { if (!clip(e.b === 'ram' ? 'ramhit' : 'chop', (e.b === 'ram' ? .6 : .35) * vol, pan, wet, e.b === 'ram' ? 1 : .8)) play(e.b === 'ram' ? 'impact' : 'wood', .4 * vol, pan, wet); break; }
          const U = AB.UNITS[e.b], wpn = U && U.look && U.look.wpn, heavy = Math.min(1, (e.c || 0) / 2.5);
          let name = 'clash', rate = 1;
          const sig = SIG[e.b]; if (sig && Math.random() < sig[1]) clip(sig[0], (sig[2] || .4) * vol, pan, wet);
          if (e.b === 'elephant') { name = 'boulder'; rate = .6; } else if (e.b === 'wolf') { name = 'growl'; }
          else if (e.b === 'legionary' && Math.random() < .45) name = 'bash';
          else if (wpn === 'spear' || wpn === 'pike' || wpn === 'sarissa' || wpn === 'fork') name = Math.random() < .7 ? 'stab' : 'block';
          else if (wpn === 'axes' || wpn === 'axe') name = 'chop'; else if (wpn === 'macuahuitl' || wpn === 'staff' || wpn === 'club' || e.b === 'levy') name = 'blunt';
          else if (SWORD[wpn]) name = Math.random() < .5 ? 'clash' : Math.random() < .6 ? 'hit' : 'block';
          if (!clip(name, (.32 + heavy * .25) * vol, pan, wet, rate)) play('block', .3 * vol, pan, wet);
          if (Math.random() < .14) clip('grunt', .3 * vol, pan, wet);
          if (e.a === 'charge') { clip(wpn === 'lance' ? 'lance' : 'hit', .6 * vol, pan, wet, .9); clip('charge', .5 * vol, pan, wet); }
          break; }
        case 'shoot': {
          const k = e.a, m = { arrow: ['bow', .32], bolt: ['xbow', .35], bigbolt: ['ballista', .55], javelin: ['throw', .3], axe: ['throw', .3, .9], bullet: ['musket', .45], ball: ['cannon', .8], stone: ['catapult', .6], boulder: ['treb', .8], fire: ['rocket', .6] }[k];
          if (!m || !clip(m[0], m[1] * vol, pan, wet + (k === 'ball' ? .2 : 0), m[2])) { if (k === 'arrow') play('release', .3 * vol, pan, wet); else if (k === 'ball') play('cannon', .7 * vol, pan, wet); else if (k === 'bullet') play('gun', .45 * vol, pan, wet); }
          break; }
        case 'thud': if (!clip(e.b === 1 ? 'chop' : e.b === 2 ? 'woodbreak' : 'arrowhit', (e.b === 2 ? .15 : .28) * vol, pan, wet, e.b === 1 ? 1.3 : 1)) play('flesh', .3 * vol, pan, wet); break;
        case 'miss': if (e.a !== 'stone' && e.a !== 'ball' && e.a !== 'boulder') clip('arrowmiss', .2 * vol, pan, wet); break;
        case 'boom': if (!clip('boulder', (e.a === 'boulder' ? .9 : .65) * vol, pan, wet + .1, e.a === 'boulder' ? .8 : 1)) play('impact', .7 * vol, pan, wet); break;
        case 'die': {
          const t = e.b, cav = e.a === 'cav' || t === 'commander';
          if (t === 'elephant') clip('elephant', .7 * vol, pan, wet) || play('ele', .7 * vol, pan, wet);
          else if (t === 'wolf') clip('wolf', .45 * vol, pan, wet) || play('wolf', .4 * vol, pan, wet);
          else if (t === 'camel') { clip('camel', .5 * vol, pan, wet); clip('die', .3 * vol, pan, wet); }
          else if (e.a === 'siege') clip('woodbreak', .5 * vol, pan, wet) || play('wood', .5 * vol, pan, wet);
          else { if (cav) { clip(Math.random() < .5 ? 'horse' : 'horsefall', .45 * vol, pan, wet); } clip('die', .42 * vol, pan, wet) || play('die', .45 * vol, pan, wet, 'man'); }
          break; }
        case 'collapse': clip('collapse', .9 * vol, pan, wet + .2) || play('crash', .9 * vol, pan, wet + .2); break;
        case 'heal': clip('pray', .18 * vol, pan, wet); break;           // a murmur, not a chime
      }
    }
    this._fights = (this._fights || 0) + fights;
  },
  // every frame in battle: the distant-battle bed swells with the fighting; hooves under moving cavalry
  tick(sim, dt, paused) {
    if (!on || !ac || ac.state !== 'running') return;
    const rate = dt > 0 ? (this._fights || 0) / dt : 0; this._fights = 0;
    this._lvl = (this._lvl || 0) + ((paused || !sim ? 0 : Math.min(1, rate / 25)) - (this._lvl || 0)) * Math.min(1, dt * 1.5);
    const amb = music.nodes.amb_battle;
    if (amb) amb.gain.setTargetAtTime(paused || !sim || sim.over ? 0 : 0.08 + this._lvl * 0.5, ac.currentTime, 0.3);
    else { if (!bed) bed = makeBed(); bed.g.gain.setTargetAtTime(paused || !sim ? 0 : 0.03 + this._lvl * 0.2, ac.currentTime, 0.25); }
    if (!sim || paused || sim.over) return;
    const st = this._hoof || (this._hoof = { t: 0, cav: 0, n: 0 });
    if ((st.n -= dt) <= 0) { st.n = 0.5; let n = 0; for (const e of sim.ents) if (e.moving && e.d.cat === 'cav') n++; st.cav = n; }
    if (st.cav > 0 && (st.t -= dt) <= 0) { st.t = 0.09 + Math.random() * 0.12 / Math.min(4, 1 + st.cav / 10); const v = Math.min(0.3, 0.07 + st.cav * 0.008); hoof(ac.currentTime, v, (Math.random() - 0.5) * 1.2); }
  },
  stop() { if (bed && ac) bed.g.gain.setTargetAtTime(0, ac.currentTime, 0.4); if (music.nodes.amb_battle && ac) music.nodes.amb_battle.gain.setTargetAtTime(0, ac.currentTime, .4); music.set('edit'); },
  start(sim) {
    music.siege = !!(sim && sim.ents.some(e => e.bld && e.d.wall)); music.mode = null;
    if (!on || !init()) return; music.set('battle');
    if (has('horn')) { clip('horn', .7, 0, .45); setTimeout(() => clip('cry', .6, 0, .35), 1700); return; }
    synthStart();
  },
  win() { music.set('none'); if (!clip('victory', .7, 0, .3)) synthWin(); setTimeout(() => music.set(music.want === 'none' ? 'edit' : music.want), 6000); },
  lose() { music.set('none'); if (!clip('defeat', .7, 0, .35)) synthLose(); setTimeout(() => music.set(music.want === 'none' ? 'edit' : music.want), 6000); },
  click() { if (init()) play('tick', 0.2, 0, 0.1); },
  // a unit answering in its own language when selected ('s') or ordered ('c')
  voice(t, kind) {
    if (!t || !on || !init()) return; if (ac.state === 'suspended') ac.resume(); loadClips();
    const now = ac.currentTime; if (now - lastVoice < .45) return; lastVoice = now;
    const name = 'v_' + t + '_' + kind; if (!has(name)) return;
    const L = CLIP.buf[name], src = ac.createBufferSource(); src.buffer = L[(Math.random() * L.length) | 0]; src.connect(out(.75, 0, .08)); src.start(now);
  },
  debug() { return { decoded: Object.keys(CLIP.buf).length, played: CLIP.played, ctx: ac, master }; },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
