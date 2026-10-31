// Original procedural audio. No samples. Web Audio API only.
let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let noiseBuffer = null;
let soundEnabled = true;
let musicEnabled = true;
let masterVolume = 0.8;
let musicVolume = 0.34;
let rememberedMaster = 0.8;
let musicTimer = null;
let musicStep = 0;
let musicMode = 'idle';
let ambienceSource = null;
let lastVolleyAt = 0;
let recentArrows = [];
const activeVoices = [];

function initAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
  masterGain = audioCtx.createGain();
  sfxGain = audioCtx.createGain();
  musicGain = audioCtx.createGain();
  masterGain.gain.value = masterVolume;
  sfxGain.gain.value = 0.9;
  musicGain.gain.value = musicVolume;
  sfxGain.connect(masterGain);
  musicGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);
  const seconds = 1;
  const length = Math.floor(audioCtx.sampleRate * seconds);
  noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  applyAudioGains();
}

function resumeAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function applyAudioGains() {
  if (!masterGain) return;
  masterGain.gain.value = soundEnabled ? masterVolume : 0;
  if (musicGain) musicGain.gain.value = musicEnabled ? musicVolume : 0;
}

function setMasterVolume(value) {
  masterVolume = Math.max(0, Math.min(1, value));
  soundEnabled = masterVolume > 0.001;
  if (soundEnabled) rememberedMaster = masterVolume;
  applyAudioGains();
}

function setMusicVolume(value) {
  musicVolume = Math.max(0, Math.min(1, value));
  musicEnabled = musicVolume > 0.001;
  applyAudioGains();
  if (!musicEnabled) stopMusic();
}

function toggleMute() {
  resumeAudio();
  if (soundEnabled && masterVolume > 0) {
    rememberedMaster = masterVolume;
    setMasterVolume(0);
  } else {
    setMasterVolume(rememberedMaster || 0.8);
  }
  return soundEnabled;
}

function toggleMusic() {
  resumeAudio();
  musicEnabled = !musicEnabled;
  if (!musicEnabled) {
    musicVolume = 0;
    stopMusic();
  } else if (musicVolume <= 0) {
    musicVolume = 0.34;
  }
  applyAudioGains();
  return musicEnabled;
}

function pruneVoices(now) {
  for (let i = activeVoices.length - 1; i >= 0; i--) {
    if (activeVoices[i] <= now) activeVoices.splice(i, 1);
  }
}

function canVoice(duration) {
  if (!audioCtx) return false;
  const now = audioCtx.currentTime;
  pruneVoices(now);
  if (activeVoices.length > 48) return false;
  activeVoices.push(now + duration);
  return true;
}

function envGain(target, vol, delay, attack, duration) {
  const gain = audioCtx.createGain();
  const t = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  gain.connect(target);
  return { gain, t };
}

function tone(freq, duration, type, vol, delay = 0, dest = null) {
  if (!audioCtx || !soundEnabled || vol <= 0) return;
  if (!canVoice(duration + delay)) return;
  const oscillator = audioCtx.createOscillator();
  const { gain, t } = envGain(dest || sfxGain, vol, delay, 0.012, duration);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, t);
  oscillator.connect(gain);
  oscillator.start(t);
  oscillator.stop(t + duration + 0.02);
}

function sweep(from, to, duration, type, vol, delay = 0) {
  if (!audioCtx || !soundEnabled || vol <= 0) return;
  if (!canVoice(duration + delay)) return;
  const oscillator = audioCtx.createOscillator();
  const { gain, t } = envGain(sfxGain, vol, delay, 0.008, duration);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, t);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + duration);
  oscillator.connect(gain);
  oscillator.start(t);
  oscillator.stop(t + duration + 0.02);
}

function noiseBurst(duration, vol, freq, q, filterType, delay = 0, dest = null) {
  if (!audioCtx || !noiseBuffer || !soundEnabled || vol <= 0) return;
  if (!canVoice(duration + delay)) return;
  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  filter.Q.value = q;
  const { gain, t } = envGain(dest || sfxGain, vol, delay, 0.005, duration);
  source.connect(filter);
  filter.connect(gain);
  source.start(t);
  source.stop(t + duration);
}

function playSound(name, volume = 1) {
  resumeAudio();
  if (!audioCtx || !soundEnabled) return;
  const vol = volume;
  switch (name) {
    case 'ui':
      tone(740, 0.05, 'sine', 0.08 * vol);
      break;
    case 'place':
      tone(520, 0.07, 'triangle', 0.1 * vol);
      tone(780, 0.06, 'sine', 0.05 * vol, 0.04);
      break;
    case 'arrow':
      noiseBurst(0.09, 0.18 * vol, 2400, 0.7, 'bandpass');
      sweep(980, 420, 0.12, 'sine', 0.07 * vol);
      break;
    case 'volley':
      noiseBurst(0.22, 0.28 * vol, 1800, 0.6, 'bandpass');
      for (let i = 0; i < 4; i++) sweep(1100 - i * 40, 380, 0.14, 'sine', 0.05 * vol, i * 0.035);
      break;
    case 'arrow_hit':
      noiseBurst(0.07, 0.22 * vol, 420, 0.8, 'lowpass');
      tone(180, 0.05, 'triangle', 0.06 * vol);
      break;
    case 'bolt':
      noiseBurst(0.05, 0.2 * vol, 3200, 4, 'highpass');
      sweep(1400, 500, 0.08, 'square', 0.04 * vol);
      break;
    case 'bolt_hit':
      noiseBurst(0.06, 0.24 * vol, 900, 1, 'bandpass');
      tone(240, 0.04, 'triangle', 0.05 * vol);
      break;
    case 'bullet':
      noiseBurst(0.09, 0.34 * vol, 1800, 0.4, 'highpass');
      noiseBurst(0.12, 0.2 * vol, 140, 0.7, 'lowpass');
      break;
    case 'rock':
      noiseBurst(0.18, 0.3 * vol, 240, 0.6, 'lowpass');
      sweep(160, 70, 0.2, 'sine', 0.08 * vol);
      break;
    case 'explosion':
      noiseBurst(0.35, 0.4 * vol, 180, 0.5, 'lowpass');
      noiseBurst(0.12, 0.2 * vol, 900, 0.4, 'bandpass');
      break;
    case 'sword':
      noiseBurst(0.09, 0.22 * vol, 1800, 1.4, 'bandpass');
      tone(210, 0.06, 'square', 0.04 * vol);
      break;
    case 'axe':
      noiseBurst(0.1, 0.26 * vol, 700, 0.8, 'lowpass');
      tone(120, 0.08, 'triangle', 0.06 * vol);
      break;
    case 'spear':
      noiseBurst(0.06, 0.16 * vol, 1400, 2, 'highpass');
      tone(320, 0.04, 'triangle', 0.04 * vol);
      break;
    case 'charge':
      sweep(90, 50, 0.28, 'sine', 0.1 * vol);
      for (let i = 0; i < 4; i++) noiseBurst(0.05, 0.12 * vol, 200, 0.6, 'lowpass', i * 0.07);
      break;
    case 'horse':
      for (let i = 0; i < 3; i++) noiseBurst(0.04, 0.1 * vol, 180, 0.5, 'lowpass', i * 0.09);
      break;
    case 'elephant':
      sweep(90, 50, 0.45, 'sawtooth', 0.05 * vol);
      noiseBurst(0.3, 0.12 * vol, 120, 0.6, 'lowpass');
      break;
    case 'death':
      sweep(420, 110, 0.28, 'triangle', 0.1 * vol);
      noiseBurst(0.16, 0.12 * vol, 600, 0.7, 'bandpass');
      break;
    case 'heal':
      tone(620, 0.1, 'sine', 0.06 * vol);
      tone(880, 0.12, 'sine', 0.04 * vol, 0.06);
      break;
    case 'warcry':
      sweep(240, 420, 0.25, 'sawtooth', 0.05 * vol);
      noiseBurst(0.2, 0.1 * vol, 800, 0.5, 'bandpass');
      break;
    case 'lightning':
      noiseBurst(0.25, 0.35 * vol, 2000, 0.3, 'highpass');
      noiseBurst(0.3, 0.25 * vol, 90, 0.4, 'lowpass');
      break;
    case 'quake':
      noiseBurst(0.4, 0.3 * vol, 70, 0.5, 'lowpass');
      break;
    case 'dice':
      tone(990, 0.04, 'square', 0.04 * vol);
      tone(1320, 0.05, 'square', 0.03 * vol, 0.05);
      break;
    case 'victory':
      [523, 659, 784, 1046].forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.08 * vol, i * 0.12));
      break;
    case 'battle_start':
      tone(196, 0.2, 'triangle', 0.1 * vol);
      tone(392, 0.25, 'triangle', 0.07 * vol, 0.12);
      break;
    default:
      tone(440, 0.05, 'sine', 0.05 * vol);
  }
}

function playAttackSound(unit) {
  if (!unit) return;
  const now = audioCtx ? audioCtx.currentTime : 0;
  if (unit.shot === 'arrow' || unit.tags.includes('arrow')) {
    recentArrows.push(now);
    recentArrows = recentArrows.filter((t) => now - t < 0.2);
    if (recentArrows.length >= 4 && now - lastVolleyAt > 0.4) {
      lastVolleyAt = now;
      playSound('volley', 0.7);
      return;
    }
    playSound('arrow', 0.45);
    return;
  }
  if (unit.shot === 'bolt' || unit.shot === 'scorpion') {
    playSound('bolt', 0.5);
    return;
  }
  if (unit.shot === 'bullet' || unit.tags.includes('gun')) {
    playSound('bullet', 0.55);
    return;
  }
  if (unit.shot === 'rock' || unit.shot === 'stone') {
    playSound(unit.shot === 'rock' ? 'rock' : 'arrow', unit.shot === 'rock' ? 0.6 : 0.35);
    return;
  }
  if (unit.shot === 'javelin' || unit.tags.includes('pilum')) {
    playSound('spear', 0.4);
    return;
  }
  if (unit.tags.includes('elephant')) {
    playSound('elephant', 0.45);
    return;
  }
  if (unit.tags.includes('axe')) {
    playSound('axe', 0.45);
    return;
  }
  if (unit.tags.includes('polearm') || unit.tags.includes('spear')) {
    playSound('spear', 0.4);
    return;
  }
  playSound('sword', 0.4);
}

function playImpactSound(projectile) {
  if (!projectile) return;
  if (projectile.kind === 'arrow' || projectile.kind === 'javelin' || projectile.kind === 'pilum') playSound('arrow_hit', 0.4);
  else if (projectile.kind === 'bolt' || projectile.kind === 'scorpion') playSound('bolt_hit', 0.45);
  else if (projectile.kind === 'bullet') playSound('bullet', 0.25);
  else if (projectile.kind === 'rock') playSound('explosion', 0.55);
  else playSound('arrow_hit', 0.3);
}

function startAmbience() {
  if (!audioCtx || ambienceSource || !musicEnabled) return;
  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 280;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.045;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);
  source.start();
  ambienceSource = source;
}

function stopAmbience() {
  if (!ambienceSource) return;
  try { ambienceSource.stop(); } catch (err) { /* already stopped */ }
  ambienceSource = null;
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  musicStep = 0;
  musicMode = 'idle';
  stopAmbience();
}

function musicTone(freq, duration, type, vol, delay = 0) {
  if (!audioCtx || !musicEnabled || !soundEnabled) return;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const t = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, t);
  oscillator.connect(gain);
  gain.connect(musicGain);
  oscillator.start(t);
  oscillator.stop(t + duration + 0.02);
}

function startMusic(mode) {
  resumeAudio();
  if (!audioCtx) return;
  if (musicMode === mode && musicTimer) return;
  stopMusic();
  musicMode = mode;
  if (!musicEnabled) return;
  if (mode === 'battle') startAmbience();
  const placingScale = [293.66, 349.23, 392, 440, 523.25];
  const battleDrone = [110, 164.81];
  musicTimer = setInterval(() => {
    if (!musicEnabled || !soundEnabled) return;
    if (musicMode === 'placing') {
      const freq = placingScale[musicStep % placingScale.length];
      musicTone(freq, 0.55, 'triangle', 0.08);
      if (musicStep % 4 === 0) musicTone(146.83, 1.4, 'sine', 0.05);
      musicStep++;
    } else if (musicMode === 'battle') {
      const beat = musicStep % 8;
      if (beat === 0 || beat === 4 || beat === 6) {
        noiseBurst(0.08, 0.18, 140, 0.5, 'lowpass', 0, musicGain);
      }
      if (beat === 2 || beat === 6) noiseBurst(0.05, 0.1, 1800, 0.6, 'highpass', 0, musicGain);
      if (beat % 2 === 0) musicTone(battleDrone[0], 0.28, 'sine', 0.07);
      if (beat === 0) musicTone(battleDrone[1], 0.4, 'triangle', 0.04);
      if (beat === 0 && musicStep % 16 === 0) musicTone(220, 0.35, 'sawtooth', 0.03);
      musicStep++;
    }
  }, musicMode === 'battle' ? 280 : 620);
}

function playAmbienceTick(hasHorse, hasElephant) {
  if (Math.random() < 0.55) playSound('warcry', 0.12);
  if (hasHorse && Math.random() < 0.45) playSound('horse', 0.18);
  if (hasElephant && Math.random() < 0.4) playSound('elephant', 0.16);
}
