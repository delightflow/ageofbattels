/* Age of Battels — isometric renderer: per-pixel terrain chunks, depth-sorted sprites, effects, minimap. */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};
const HW = 32, HH = 16, CH = 8, SKIRT = 18, PAD = 2, ZPX = 26;

// ---------------------------------------------------------------- tileable noise tables
function makeNoise(size, cells, seed) {
  const R = AB.rng32(seed), lat = new Float32Array(cells * cells); for (let i = 0; i < lat.length; i++) lat[i] = R();
  const out = new Float32Array(size * size), k = cells / size;
  for (let y = 0; y < size; y++) { const fy0 = y * k, y0 = fy0 | 0, y1 = (y0 + 1) % cells; let ty = fy0 - y0; ty = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < size; x++) { const fx0 = x * k, x0 = fx0 | 0, x1 = (x0 + 1) % cells; let tx = fx0 - x0; tx = tx * tx * (3 - 2 * tx);
      const a = lat[x0 + y0 * cells], b = lat[x1 + y0 * cells], c = lat[x0 + y1 * cells], d = lat[x1 + y1 * cells];
      out[x + y * size] = a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty; } }
  return out;
}
const NS = 512, NM = NS - 1;
let MOT, WX, WY, GR;
function initNoise() {
  if (MOT) return;
  const a = makeNoise(NS, 4, 11), b = makeNoise(NS, 16, 12), c = makeNoise(NS, 64, 13);
  MOT = new Float32Array(NS * NS); for (let i = 0; i < MOT.length; i++) MOT[i] = a[i] * 0.5 + b[i] * 0.32 + c[i] * 0.18;
  WX = makeNoise(NS, 16, 21); WY = makeNoise(NS, 16, 22);
  const R = AB.rng32(31); GR = new Float32Array(NS * NS); for (let i = 0; i < GR.length; i++) GR[i] = R();
}
const sharp = f => f < 0.3 ? 0 : f > 0.7 ? 1 : ((f = (f - 0.3) / 0.4), f * f * (3 - 2 * f));
let cr = 0, cg = 0, cb = 0;
function tcol(t, m, g) {
  switch (t) {
    case 0: cr = 90 + m * 34; cg = 130 + m * 30; cb = 50 + m * 20; if (g > 0.94) { cr -= 14; cg -= 12; cb -= 8; } else if (g < 0.05) { cr += 10; cg += 12; } break;
    case 1: cr = 62 + m * 30; cg = 108 + m * 30; cb = 42 + m * 18; if (g > 0.993) { cr = 238; cg = 222; cb = 120; } else if (g < 0.005) { cr = 232; cg = 232; cb = 244; } else if (g > 0.93) { cr -= 12; cg -= 12; } break;
    case 2: cr = 124 + m * 40; cg = 96 + m * 32; cb = 62 + m * 24; cr += (g - 0.5) * 16; cg += (g - 0.5) * 13; cb += (g - 0.5) * 9; break;
    case 3: cr = 204 + m * 26; cg = 180 + m * 24; cb = 122 + m * 24; cr += (g - 0.5) * 10; cg += (g - 0.5) * 9; cb += (g - 0.5) * 8; break;
    case 4: cr = 222 + m * 24; cg = 230 + m * 20; cb = 240 + m * 14; if (g > 0.97) { cr = cg = cb = 255; } break;
    case 5: cr = 158 + m * 26; cg = 138 + m * 22; cb = 106 + m * 18; if (g > 0.8) { cr -= 16; cg -= 15; cb -= 13; } else if (g < 0.12) { cr += 10; cg += 9; cb += 8; } break;
    case 6: cr = 82 + m * 24; cg = 156 + m * 24; cb = 166 + m * 18; if (g > 0.975) { cr += 40; cg += 36; cb += 30; } break;
    default: cr = 36 + m * 20; cg = 88 + m * 26; cb = 140 + m * 26; if (g > 0.985) { cr += 50; cg += 50; cb += 44; }
  }
}

class Render {
  constructor(canvas, mini) {
    initNoise();
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.mini = mini; this.mctx = mini.getContext('2d');
    this.cam = { x: 0, y: 0, z: 1 }; this.W = 1; this.H = 1; this.dpr = 1;
    this.chunks = new Map(); this.queue = []; this.list = []; this.parts = []; this.decals = []; this.miniBase = null; this.miniDirty = true; this.frame = 0;
    this.showBars = true;
  }
  resize() {
    const r = this.cv.getBoundingClientRect(); this.dpr = Math.min(2, G.devicePixelRatio || 1);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    const m = this.mini.getBoundingClientRect(); this.mW = m.width || 220; this.mH = m.height || 110; this.mini.width = this.mW * 2; this.mini.height = this.mH * 2; this.miniDirty = true;
  }
  setScenario(sc) { this.sc = sc; this.chunks.clear(); this.queue.length = 0; this.miniDirty = true; this.resetFx(); }
  resetFx() { this.parts.length = 0; this.decals.length = 0; }
  invalidate(x0, y0, x1, y1) {
    for (let cy = Math.floor((y0 - 1) / CH); cy <= Math.floor((y1 + 1) / CH); cy++) for (let cx = Math.floor((x0 - 1) / CH); cx <= Math.floor((x1 + 1) / CH); cx++) { const c = this.chunks.get(cx + cy * 64); if (c) c.dirty = true; }
    this.miniDirty = true;
  }
  // ------------------------------------------------------------ camera
  s2w(sx, sy) { const z = this.cam.z, px = (sx - this.W / 2) / z + this.cam.x, py = (sy - this.H / 2) / z + this.cam.y; return [(px / HW + py / HH) / 2, (py / HH - px / HW) / 2]; }
  w2s(x, y) { const z = this.cam.z; return [((x - y) * HW - this.cam.x) * z + this.W / 2, ((x + y) * HH - this.cam.y) * z + this.H / 2]; }
  center(x, y) { this.cam.x = (x - y) * HW; this.cam.y = (x + y) * HH; }
  clampCam() {
    const sc = this.sc, c = this.cam; if (!sc) return; c.z = Math.max(0.18, Math.min(2.6, c.z));
    let [x, y] = [(c.x / HW + c.y / HH) / 2, (c.y / HH - c.x / HW) / 2];
    x = Math.max(0, Math.min(sc.w, x)); y = Math.max(0, Math.min(sc.h, y)); this.center(x, y);
  }
  zoomAt(sx, sy, f) { const [x, y] = this.s2w(sx, sy); this.cam.z = Math.max(0.18, Math.min(2.6, this.cam.z * f)); const [nx, ny] = this.w2s(x, y); this.cam.x += (nx - sx) / this.cam.z; this.cam.y += (ny - sy) / this.cam.z; this.clampCam(); }
  fit() { const sc = this.sc; this.center(sc.w / 2, sc.h / 2); this.cam.z = Math.max(0.18, Math.min(1.25, Math.min(this.W / ((sc.w + sc.h) * HW), this.H / ((sc.w + sc.h) * HH)) * 1.5)); }

  // ------------------------------------------------------------ terrain chunks
  _renderChunk(ch) {
    const sc = this.sc, T = sc.terrain, mw = sc.w, mh = sc.h, x0 = ch.cx * CH, y0 = ch.cy * CH;
    const bx = (x0 - (y0 + CH)) * HW - PAD, by = (x0 + y0) * HH - PAD, W = CH * HW * 2 + PAD * 2, H = CH * HH * 2 + PAD * 2 + SKIRT;
    if (!ch.cv) { ch.cv = document.createElement('canvas'); ch.cv.width = W; ch.cv.height = H; ch.ctx = ch.cv.getContext('2d'); ch.bx = bx; ch.by = by; }
    const img = ch.ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer), m = 0.08, xa = x0 - m, xb = x0 + CH + m, ya = y0 - m, yb = y0 + CH + m;
    const sk = SKIRT / (2 * HH);
    for (let py = 0; py < H; py++) {
      const gy = by + py, fy = (gy + 0.5) / HH;
      for (let px = 0; px < W; px++) {
        const gx = bx + px, fx = (gx + 0.5) / HW, wx = (fx + fy) / 2, wy = (fy - fx) / 2;
        if (wx < xa || wy < ya) continue;
        const cx = wx < mw ? wx : mw - 0.001, cy = wy < mh ? wy : mh - 0.001;
        if (cx >= xb || cy >= yb) continue;
        if (wx >= mw || wy >= mh) {                   // slab edge under the map
          const ux = wx - sk, uy = wy - sk; if (ux >= mw || uy >= mh || ux < 0 || uy < 0) continue;
          const dep = Math.max(wx - mw, wy - mh) / sk, g = GR[(gx & NM) + ((gy & NM) << 9)], v = (wy >= mh ? 78 : 58) * (1 - dep * 0.45) + g * 10;
          buf[px + py * W] = 0xff000000 | ((v * 0.55) << 16) | ((v * 0.75) << 8) | v; continue;
        }
        if (wx < 0 || wy < 0) continue;
        const ni = (gx & NM) + ((gy & NM) << 9), mo = MOT[ni], g = GR[ni];
        const u = wx + (WX[ni] - 0.5) * 0.55 - 0.5, v = wy + (WY[ni] - 0.5) * 0.55 - 0.5;
        let i0 = Math.floor(u), j0 = Math.floor(v); const tx = sharp(u - i0), ty = sharp(v - j0);
        let i1 = i0 + 1, j1 = j0 + 1; if (i0 < 0) i0 = 0; if (j0 < 0) j0 = 0; if (i1 >= mw) i1 = mw - 1; if (j1 >= mh) j1 = mh - 1; if (i0 >= mw) i0 = mw - 1; if (j0 >= mh) j0 = mh - 1;
        const a = T[i0 + j0 * mw], b = T[i1 + j0 * mw], c = T[i0 + j1 * mw], d = T[i1 + j1 * mw];
        let r, gg, bb;
        if (a === b && a === c && a === d) { tcol(a, mo, g); r = cr; gg = cg; bb = cb; }
        else {
          const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty; let wet = 0;
          tcol(a, mo, g); r = cr * w00; gg = cg * w00; bb = cb * w00; if (a > 5) wet += w00;
          tcol(b, mo, g); r += cr * w10; gg += cg * w10; bb += cb * w10; if (b > 5) wet += w10;
          tcol(c, mo, g); r += cr * w01; gg += cg * w01; bb += cb * w01; if (c > 5) wet += w01;
          tcol(d, mo, g); r += cr * w11; gg += cg * w11; bb += cb * w11; if (d > 5) wet += w11;
          if (wet > 0.02 && wet < 0.98) {              // shoreline: wet band on land, foam at the edge
            const band = 1 - Math.abs(wet - 0.5) * 2;
            if (wet < 0.5) { const k = 1 - 0.22 * wet * 2; r *= k; gg *= k; bb *= k; }
            if (band > 0.72) { const k = (band - 0.72) / 0.28 * 0.55 * (0.6 + g * 0.4); r += (238 - r) * k; gg += (244 - gg) * k; bb += (240 - bb) * k; }
          }
        }
        // soft vignette toward the slab edge
        const e = Math.min(wx, wy, mw - wx, mh - wy); if (e < 0.5) { const k = 0.82 + e * 0.36; r *= k; gg *= k; bb *= k; }
        buf[px + py * W] = 0xff000000 | (bb << 16) | (gg << 8) | (r | 0);
      }
    }
    ch.ctx.putImageData(img, 0, 0); ch.ready = true; ch.dirty = false;
  }

  // ------------------------------------------------------------ effects
  part(x, y, z, o) { if (this.parts.length > 1400) return; this.parts.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.5, age: 0, r: 2, grow: 0, col: '200,180,140', a: 0.7 }, o)); }
  fx(events, visibleOnly) {
    const R = Math.random;
    for (const e of events) {
      const [sx, sy] = this.w2s(e.x, e.y); if (visibleOnly !== false && (sx < -80 || sy < -80 || sx > this.W + 80 || sy > this.H + 80)) continue;
      switch (e.k) {
        case 'hit':
          if (e.a === 'bld') { for (let i = 0; i < 3; i++) this.part(e.x, e.y, 0.5, { vx: (R() - 0.5) * 2, vy: (R() - 0.5) * 2, vz: 1.5 + R() * 2, g: 9, life: 0.5, r: 1.6, col: '150,140,125', a: 1 }); }
          else { if (R() < 0.5) this.part(e.x, e.y, 0.7, { life: 0.1, r: e.a === 'charge' ? 4 : 1.6, grow: 10, col: '255,246,210', a: 0.8 });
            for (let i = 0; i < 2; i++) this.part(e.x, e.y, 0.6, { vx: (R() - 0.5) * 1.6, vy: (R() - 0.5) * 1.6, vz: 0.8 + R() * 1.4, g: 9, life: 0.4, r: 0.9, col: '140,20,16', a: 0.9 });
            if (e.a === 'charge') for (let i = 0; i < 5; i++) this.part(e.x, e.y, 0.1, { vx: (R() - 0.5) * 3, vy: (R() - 0.5) * 3, vz: 0.6, life: 0.6, r: 3, grow: 8, col: '190,170,130', a: 0.45 }); }
          break;
        case 'die': for (let i = 0; i < 4; i++) this.part(e.x, e.y, 0.5, { vx: (R() - 0.5) * 2.4, vy: (R() - 0.5) * 2.4, vz: 1 + R() * 2.4, g: 10, life: 0.55, r: 1.3, col: e.a === 'siege' ? '110,80,50' : '150,24,20', a: 0.95 });
          this.part(e.x, e.y, 0.05, { life: 0.7, r: 4, grow: 10, col: '180,165,130', a: 0.4 }); break;
        case 'shoot':
          if (e.a === 'bullet' || e.a === 'ball') { const n = e.a === 'ball' ? 9 : 4; this.part(e.x, e.y, 0.7, { life: 0.08, r: e.a === 'ball' ? 7 : 3, grow: 30, col: '255,214,120', a: 1 }); for (let i = 0; i < n; i++) this.part(e.x, e.y, 0.6, { vx: (R() - 0.5) * 1.2, vy: (R() - 0.5) * 1.2, vz: 0.5 + R() * 0.8, life: 0.9 + R() * 0.6, r: e.a === 'ball' ? 5 : 3, grow: 9, col: '225,225,225', a: 0.5 }); }
          break;
        case 'boom': { const big = e.a === 'ball' ? 1.2 : 1;
          for (let i = 0; i < 10; i++) this.part(e.x, e.y, 0.1, { vx: (R() - 0.5) * 5 * big, vy: (R() - 0.5) * 5 * big, vz: 0.6 + R() * 1.4, life: 0.7 + R() * 0.5, r: 4, grow: 16, col: '176,150,112', a: 0.55 });
          for (let i = 0; i < 6; i++) this.part(e.x, e.y, 0.2, { vx: (R() - 0.5) * 5, vy: (R() - 0.5) * 5, vz: 2 + R() * 4, g: 12, life: 0.7, r: 1.8, col: '90,70,50', a: 1 });
          if (e.a === 'ball') this.part(e.x, e.y, 0.4, { life: 0.16, r: 8, grow: 60, col: '255,200,90', a: 0.9 });
          if (e.a === 'boulder') for (let i = 0; i < 10; i++) this.part(e.x, e.y, 0.2, { vx: (R() - 0.5) * 6, vy: (R() - 0.5) * 6, vz: 1 + R() * 2, life: 1.2, r: 5, grow: 18, col: '170,150,115', a: 0.5 });
          this.decals.push({ k: 'crater', x: e.x, y: e.y, t: 0, life: 40 }); break; }
        case 'miss': if (e.a === 'fire') { for (let i = 0; i < 3; i++) this.part(e.x, e.y, 0.1, { vz: 0.6 + R(), life: 0.6 + R() * 0.4, r: 1.6, grow: 6, col: R() < 0.5 ? '255,140,50' : '120,110,100', a: 0.6 }); break; }
          if (e.a === 'arrow' || e.a === 'bolt' || e.a === 'javelin' || e.a === 'bigbolt') { this.decals.push({ k: 'arrow', x: e.x, y: e.y, t: 0, life: 28, a: R() * 0.9 - 0.45, big: e.a === 'bigbolt' || e.a === 'javelin', f: R() < 0.5 });
            this.part(e.x, e.y, 0.02, { life: 0.35, r: 1.2, grow: 7, col: '160,140,105', a: 0.45 }); }
          else this.part(e.x, e.y, 0.05, { life: 0.4, r: 2, grow: 8, col: '190,170,130', a: 0.5 }); break;
        case 'thud': if (e.b) this.part(e.x, e.y, 1, { life: 0.3, r: 1.5, grow: 8, col: '200,190,170', a: 0.6 });
          else this.part(e.x, e.y, 0.55, { vx: (R() - 0.5), vy: (R() - 0.5), vz: 0.8, g: 8, life: 0.35, r: 0.9, col: '140,20,16', a: 0.85 }); break;
        case 'heal': for (let i = 0; i < 3; i++) this.part(e.x + (R() - 0.5) * 0.5, e.y + (R() - 0.5) * 0.5, 0.4, { vz: 1.2, life: 0.8, r: 1.8, col: '140,255,150', a: 0.9, plus: 1 }); break;
        case 'collapse': { const n = 14 * e.a; for (let i = 0; i < n; i++) this.part(e.x + (R() - 0.5) * e.a, e.y + (R() - 0.5) * e.a, 0.3 + R(), { vx: (R() - 0.5) * 3, vy: (R() - 0.5) * 3, vz: 0.4 + R(), life: 1.2 + R(), r: 6, grow: 14, col: '170,160,145', a: 0.6 }); break; }
      }
    }
    if (this.decals.length > 500) this.decals.splice(0, this.decals.length - 500);
  }

  // ------------------------------------------------------------ frame
  draw(v) {
    const ctx = this.ctx, dpr = this.dpr, z = this.cam.z, W = this.W, H = this.H, sc = this.sc, S = AB.Sprites, U = AB.UNITS;
    const ox = W / 2 - this.cam.x * z, oy = H / 2 - this.cam.y * z, dt = v.dt || 0, sim = v.sim, battle = !!sim;
    this.frame++;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#14202a'); bg.addColorStop(1, '#0b1117'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const world = () => ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
    world(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = z < 0.6 ? 'medium' : 'low';

    // visible world rect (px) and chunk pass
    const vx0 = -ox / z, vy0 = -oy / z, vx1 = vx0 + W / z, vy1 = vy0 + H / z;
    const ncx = Math.ceil(sc.w / CH), ncy = Math.ceil(sc.h / CH); let budget = this.fast ? 40 : 3;
    for (let cy = 0; cy < ncy; cy++) for (let cx = 0; cx < ncx; cx++) {
      const bx = (cx * CH - (cy * CH + CH)) * HW - PAD, by = (cx * CH + cy * CH) * HH - PAD, cw = CH * HW * 2 + PAD * 2, chh = CH * HH * 2 + PAD * 2 + SKIRT;
      if (bx > vx1 || by > vy1 || bx + cw < vx0 || by + chh < vy0) continue;
      let ch = this.chunks.get(cx + cy * 64); if (!ch) { ch = { cx, cy, ready: false, dirty: true }; this.chunks.set(cx + cy * 64, ch); }
      if (ch.dirty && budget > 0) { budget--; this._renderChunk(ch); }
      if (ch.ready) ctx.drawImage(ch.cv, bx, by); else { ctx.fillStyle = '#3d5a34'; ctx.beginPath(); const X = (cx - cy) * CH * HW, Y = (cx + cy) * CH * HH; ctx.moveTo(X, Y); ctx.lineTo(X + CH * HW, Y + CH * HH); ctx.lineTo(X, Y + CH * HH * 2); ctx.lineTo(X - CH * HW, Y + CH * HH); ctx.fill(); }
    }
    this.pending = budget <= 0;

    // ---- ground layer: decals, corpses
    const D = this.decals;
    for (let i = D.length - 1; i >= 0; i--) {
      const d = D[i]; d.t += dt; if (d.t > d.life) { D.splice(i, 1); continue; }
      const X = (d.x - d.y) * HW, Y = (d.x + d.y) * HH; if (X < vx0 - 40 || X > vx1 + 40 || Y < vy0 - 40 || Y > vy1 + 40) continue;
      const al = Math.min(1, (d.life - d.t) / (d.life * 0.3));
      if (d.k === 'crater') { ctx.fillStyle = 'rgba(46,36,26,' + 0.5 * al + ')'; ctx.beginPath(); ctx.ellipse(X, Y, 20, 10, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = 'rgba(30,24,18,' + 0.5 * al + ')'; ctx.beginPath(); ctx.ellipse(X, Y + 1, 11, 5.5, 0, 0, 6.3); ctx.fill(); }
      else { const L = d.big ? 12 : 8, ex = X - Math.sin(d.a + 0.5) * L, ey = Y - Math.cos(d.a + 0.5) * L;
        ctx.strokeStyle = 'rgba(0,0,0,' + 0.18 * al + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + L * 0.7, Y + 1.5); ctx.stroke();
        ctx.strokeStyle = 'rgba(64,46,30,' + al + ')'; ctx.lineWidth = d.big ? 1.6 : 1.1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(ex, ey); ctx.stroke();
        if (!d.big) { ctx.strokeStyle = (d.f ? 'rgba(201,74,53,' : 'rgba(232,226,212,') + al + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(X - Math.sin(d.a + 0.5) * (L - 3), Y - Math.cos(d.a + 0.5) * (L - 3)); ctx.stroke(); } }
    }
    if (battle) {
      const C = sim.corpses, now = sim.time + (v.alpha || 0) * AB.DT;
      for (let i = 0; i < C.length; i++) {
        const c = C[i], X = (c.x - c.y) * HW, Y = (c.x + c.y) * HH; if (X < vx0 - 110 || X > vx1 + 110 || Y < vy0 - 60 || Y > vy1 + 200) continue;
        const age = now - c.time;
        if (c.bld) { const s = S.rubble(c.size); ctx.globalAlpha = Math.max(0.35, 1 - age / 60); ctx.drawImage(s.cv, X - s.ax, Y - s.ay, s.w, s.h); ctx.globalAlpha = 1; continue; }
        if (age > 120) continue;
        const cd = U[c.t], mech = cd.cat === 'siege', big = cd.r > 0.33, fl = c.fx - c.fy < 0;
        // what is left behind: a blood stain and bones, or splintered wood
        const rest = age < 25 ? 0 : Math.min(1, (age - 25) / 5), gone = age > 100 ? (age - 100) / 20 : 0;
        if (mech) { if (rest > 0) { const w = S.rubble(1); ctx.globalAlpha = rest * (1 - gone) * 0.8; ctx.drawImage(w.cv, X - w.ax * 0.5, Y - w.ay * 0.5, w.w * 0.5, w.h * 0.5); } }
        else {
          const pool = Math.min(1, age / 1.6), rr = (big ? 17 : 9) * (0.4 + pool * 0.6) * (1 - rest * 0.3);
          ctx.globalAlpha = (0.42 - rest * 0.22) * (1 - gone); ctx.fillStyle = '#5a0e0a'; ctx.beginPath(); ctx.ellipse(X - (fl ? -5 : 5), Y + 1, rr, rr * 0.45, 0, 0, 6.3); ctx.fill();
          if (rest > 0) { const b = S.bones(big ? 1 : 0, (c.time * 7 | 0) % 3); ctx.globalAlpha = rest * (1 - gone); ctx.drawImage(b.cv, X - b.ax, Y - b.ay, b.w, b.h); }
        }
        if (rest < 1) {
          const fr = age < 0.4 ? 'd' + Math.min(4, (age / 0.08) | 0) : 'd4', s = S.get(c.t, c.p, c.fx + c.fy < 0, fr);
          ctx.globalAlpha = 1 - rest;
          if (fl) { ctx.setTransform(-dpr * z, 0, 0, dpr * z, dpr * (ox + X * z), dpr * (oy + Y * z)); ctx.drawImage(s.cv, -s.ax, -s.ay, s.w, s.h); world(); } else ctx.drawImage(s.cv, X - s.ax, Y - s.ay, s.w, s.h);
        }
      }
      ctx.globalAlpha = 1;
    }
    // ---- ghost footprint (editor brush / building)
    const gh = v.ghost;
    if (v.zone) {                       // deployment zone (challenges)
      const zt = v.zone.tiles; if (!v.zone.path) { const P2 = new Path2D(); for (let i = 0; i < zt.length; i += 2) { const x = zt[i], y = zt[i + 1], X = (x - y) * HW, Y = (x + y) * HH; P2.moveTo(X, Y); P2.lineTo(X + HW, Y + HH); P2.lineTo(X, Y + 2 * HH); P2.lineTo(X - HW, Y + HH); P2.closePath(); } v.zone.path = P2; }
      ctx.fillStyle = 'rgba(90,160,255,' + (0.14 + 0.04 * Math.sin(this.frame * 0.05)) + ')'; ctx.fill(v.zone.path);
    }
    if (gh && gh.tiles) { ctx.fillStyle = gh.ok === false ? 'rgba(255,70,50,0.35)' : 'rgba(255,255,255,0.22)'; ctx.strokeStyle = gh.ok === false ? 'rgba(255,90,70,0.9)' : 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1 / z; ctx.beginPath();
      for (let i = 0; i < gh.tiles.length; i += 2) { const x = gh.tiles[i], y = gh.tiles[i + 1], X = (x - y) * HW, Y = (x + y) * HH; ctx.moveTo(X, Y); ctx.lineTo(X + HW, Y + HH); ctx.lineTo(X, Y + 2 * HH); ctx.lineTo(X - HW, Y + HH); ctx.closePath(); }
      ctx.fill(); if (gh.tiles.length <= 50) ctx.stroke(); }

    // ---- build depth-sorted list
    const L = this.list; let n = 0;
    const item = () => L[n] || (L[n] = {});
    const [ax, ay] = this.s2w(0, 0), [bx2, by2] = this.s2w(W, 0), [cx2, cy2] = this.s2w(0, H), [dx2, dy2] = this.s2w(W, H);
    const tx0 = Math.max(0, Math.floor(Math.min(ax, bx2, cx2, dx2)) - 1), tx1 = Math.min(sc.w - 1, Math.ceil(Math.max(ax, bx2, cx2, dx2)) + 2),
      ty0 = Math.max(0, Math.floor(Math.min(ay, by2, cy2, dy2)) - 1), ty1 = Math.min(sc.h - 1, Math.ceil(Math.max(ay, by2, cy2, dy2)) + 2);
    const O = sc.objects, T = sc.terrain;
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const o = O[x + y * sc.w]; if (!o) continue;
      const h1 = AB.hash2(x, y, 5), h2 = AB.hash2(x, y, 9), wx = x + 0.5 + (h1 - 0.5) * 0.36, wy = y + 0.5 + (h2 - 0.5) * 0.36, X = (wx - wy) * HW, Y = (wx + wy) * HH;
      if (X < vx0 - 40 || X > vx1 + 40 || Y < vy0 - 10 || Y > vy1 + 90) continue;
      const it = item(); n++; const t = T[x + y * sc.w];
      it.k = 2; it.d = wx + wy; it.X = X; it.Y = Y; it.fl = h1 > 0.5; it.sc = o === 1 ? 0.95 + h2 * 0.45 : 0.8 + h2 * 0.5;
      it.s = o === 2 ? S.scenery('rock', (h1 * 3) | 0) : S.scenery(t === 3 ? 'palm' : t === 4 ? 'snowpine' : h2 < 0.3 ? 'pine' : 'oak', (h1 * 3) | 0);
    }
    const sel = v.sel, hover = v.hover;
    if (battle) {
      const E = sim.ents, al = v.alpha || 0, now = sim.time + al * AB.DT;
      for (let i = 0; i < E.length; i++) {
        const e = E[i], x = e.px + (e.x - e.px) * al, y = e.py + (e.y - e.py) * al, X = (x - y) * HW, Y = (x + y) * HH;
        if (X < vx0 - 110 || X > vx1 + 110 || Y < vy0 - 60 || Y > vy1 + 200) continue;
        const it = item(); n++; it.k = 0; it.e = e; it.X = X; it.Y = Y; it.d = x + y + (e.bld ? 0.01 : 0); it.sc = 1;
        if (e.bld) { it.s = S.get(e.t, e.p, false, 'idle'); it.fl = false; }
        else { const q = (now - e.atkT) / (e.d.wind + 0.25), atk = q >= 0 && q < 1; const fr = atk ? 'a' + Math.min(5, (q * 6) | 0) : e.moving ? 'w' + (((e.anim % 1) * 8) | 0) : 'idle';
          it.s = S.get(e.t, e.p, e.fx + e.fy < -0.15, fr); it.fl = e.fx - e.fy < 0;
          if (atk && !e.d.proj && e.d.spd) { const k = Math.sin(Math.min(1, Math.max(0, (q - 0.25) / 0.55)) * Math.PI) * (e.r > 0.33 ? 4 : 3); it.X += (e.fx - e.fy) * 0.7 * k; it.Y += (e.fx + e.fy) * 0.35 * k; }
          else if (sim.time - e.flash < 0.12 && !e.d.proj) { it.X -= (e.fx - e.fy) * 0.6; it.Y -= (e.fx + e.fy) * 0.3; } }
      }
    } else {
      const Us = sc.units, mx = sc.w / 2, my = sc.h / 2;
      for (let i = 0; i < Us.length; i++) {
        const u = Us[i], d = U[u.t], x = d.bld ? u.x + d.size / 2 : u.x, y = d.bld ? u.y + d.size / 2 : u.y, X = (x - y) * HW, Y = (x + y) * HH;
        if (X < vx0 - 110 || X > vx1 + 110 || Y < vy0 - 60 || Y > vy1 + 200) continue;
        const it = item(); n++; it.k = 1; it.e = u; it.X = X; it.Y = Y; it.d = x + y + (d.bld ? 0.01 : 0); it.sc = 1;
        const fx = mx - x, fy = my - y; it.s = S.get(u.t, u.p, false, 'idle'); it.fl = !d.bld && fx - fy < 0;
      }
    }
    L.length = Math.max(L.length, n); const vis = L.slice(0, n).sort((a, b) => a.d - b.d);
    // selection rings under sprites
    if (sel && sel.size) { ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); for (const it of vis) if (it.k !== 2 && sel.has(it.e)) { const r = U[it.e.t].r; ctx.moveTo(it.X + r * 42, it.Y); ctx.ellipse(it.X, it.Y, r * 42, r * 21, 0, 0, 6.3); } ctx.stroke(); }
    for (let i = 0; i < n; i++) {
      const it = vis[i], s = it.s, k = it.sc;
      if (it.fl) { ctx.setTransform(-dpr * z * k, 0, 0, dpr * z * k, dpr * (ox + it.X * z), dpr * (oy + it.Y * z)); ctx.drawImage(s.cv, -s.ax, -s.ay, s.w, s.h); }
      else if (k !== 1) { ctx.setTransform(dpr * z * k, 0, 0, dpr * z * k, dpr * (ox + it.X * z), dpr * (oy + it.Y * z)); ctx.drawImage(s.cv, -s.ax, -s.ay, s.w, s.h); }
      else { if (i && (vis[i - 1].fl || vis[i - 1].sc !== 1)) world(); ctx.drawImage(s.cv, it.X - s.ax, it.Y - s.ay, s.w, s.h); }
    }
    world();
    // ---- formation ghost
    if (gh && gh.pts) { const pc = AB.PLAYERS[gh.p], r = U[gh.t].r; ctx.fillStyle = pc.m; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1 / z; ctx.globalAlpha = 0.6; ctx.beginPath();
      for (let i = 0; i < gh.pts.length; i += 2) { const X = (gh.pts[i] - gh.pts[i + 1]) * HW, Y = (gh.pts[i] + gh.pts[i + 1]) * HH; ctx.moveTo(X + r * 36, Y); ctx.ellipse(X, Y, r * 36, r * 18, 0, 0, 6.3); }
      ctx.fill(); ctx.globalAlpha = 1; ctx.stroke(); }
    if (gh && gh.circle) { ctx.strokeStyle = 'rgba(255,90,70,0.95)'; ctx.fillStyle = 'rgba(255,70,50,0.15)'; ctx.lineWidth = 1.5 / z; ctx.beginPath(); const X = (gh.circle[0] - gh.circle[1]) * HW, Y = (gh.circle[0] + gh.circle[1]) * HH, r = gh.circle[2]; ctx.ellipse(X, Y, r * HW * 1.414, r * HH * 1.414, 0, 0, 6.3); ctx.fill(); ctx.stroke(); }

    // ---- hp bars, building fire
    if (battle) {
      const showAll = this.showBars && z > 0.55;
      for (let i = 0; i < n; i++) {
        const it = vis[i]; if (it.k !== 0) continue; const e = it.e, f = e.hp / e.d.hp, isSel = sel && sel.has(e);
        if (e.bld && f < 0.55 && Math.random() < dt * (f < 0.25 ? 14 : 6)) { this.part(e.x + (Math.random() - 0.5) * e.d.size * 0.7, e.y + (Math.random() - 0.5) * e.d.size * 0.7, 0.8 + Math.random(), { vz: 1.6, life: 1.1, r: 4, grow: 10, col: Math.random() < 0.4 ? '255,150,50' : '70,66,62', a: 0.6 }); }
        if (e.rank && !e.bld && z > 0.45) {                       // veteran chevrons
          const top = it.Y - (e.r > 0.5 ? 58 : e.r > 0.3 ? 50 : 39); ctx.fillStyle = '#f2cf5b'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 0.8;
          for (let k = 0; k < e.rank; k++) { const x = it.X - (e.rank - 1) * 2.6 + k * 5.2; ctx.beginPath(); ctx.moveTo(x - 2.2, top); ctx.lineTo(x, top - 2.2); ctx.lineTo(x + 2.2, top); ctx.lineTo(x + 2.2, top + 1.6); ctx.lineTo(x, top - 0.6); ctx.lineTo(x - 2.2, top + 1.6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        }
        if (!(isSel || (showAll && f < 0.999))) continue;
        const w = e.bld ? 30 * e.d.size : Math.max(12, e.r * 48), top = it.Y - (e.bld ? (e.d.size > 1 ? 150 : it.s.ay * 0.72) : e.r > 0.5 ? 52 : e.r > 0.3 ? 44 : 33);
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(it.X - w / 2 - 0.7, top - 0.7, w + 1.4, 3.4);
        ctx.fillStyle = f > 0.6 ? '#5fd35a' : f > 0.3 ? '#e8c53a' : '#e2452f'; ctx.fillRect(it.X - w / 2, top, w * f, 2);
      }
      // ---- projectiles: fletched arrows that follow their arc, ground shadows, tumbling stones
      const P = sim.projs, al = v.alpha || 0;
      const pos = (p, q) => { const x = p.sx + (p.tx - p.sx) * q, y = p.sy + (p.ty - p.sy) * q, zz = p.z0 * (1 - q) + p.h * 4 * q * (1 - q); return [(x - y) * HW, (x + y) * HH - zz * ZPX, (x + y) * HH, x, y, zz]; };
      for (let i = 0; i < P.length; i++) {
        const p = P[i]; if (p.t < 0) continue; const u = Math.min(1, (p.t + al * AB.DT) / p.dur), [X, Y, GY, wx, wy, wz] = pos(p, u);
        if (X < vx0 - 40 || X > vx1 + 40 || Y < vy0 - 60 || Y > vy1 + 40) continue;
        const [X0, Y0, GY0] = pos(p, Math.max(0, u - 0.03)), dx = X - X0, dy = Y - Y0, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
        const gdx = X - X0, gdy = GY - GY0, gl = Math.hypot(gdx, gdy) || 1, sh = Math.max(0.12, 0.38 - wz * 0.05);
        if (p.k === 'stone' || p.k === 'ball' || p.k === 'boulder') {
          const r = p.k === 'boulder' ? 6 : p.k === 'stone' ? 3.8 : 2.7;
          ctx.fillStyle = 'rgba(0,0,0,' + sh + ')'; ctx.beginPath(); ctx.ellipse(X, GY, r * (1.1 + wz * 0.05), r * 0.5, 0, 0, 6.3); ctx.fill();
          if (dt > 0 && Math.random() < 0.7) this.part(wx, wy, wz, { life: p.k === 'ball' ? 0.9 : 0.5, r: p.k === 'ball' ? 2.2 : 1.6, grow: 6, col: p.k === 'ball' ? '205,205,205' : '170,155,130', a: p.k === 'ball' ? 0.4 : 0.3 });
          ctx.save(); ctx.translate(X, Y); ctx.rotate(p.t * 9);
          ctx.beginPath(); if (p.k !== 'ball') { ctx.moveTo(-r, -r * 0.3); ctx.lineTo(-r * 0.4, -r); ctx.lineTo(r * 0.7, -r * 0.8); ctx.lineTo(r, r * 0.2); ctx.lineTo(r * 0.3, r); ctx.lineTo(-r * 0.8, r * 0.7); ctx.closePath(); } else ctx.arc(0, 0, r, 0, 6.3);
          ctx.fillStyle = p.k !== 'ball' ? '#8c877d' : '#2d2c2e'; ctx.fill(); ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 0.8; ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.4, 0, 6.3); ctx.fill(); ctx.restore();
        } else if (p.k === 'axe') {
          ctx.fillStyle = 'rgba(0,0,0,' + sh + ')'; ctx.beginPath(); ctx.ellipse(X, GY, 3, 1.2, 0, 0, 6.3); ctx.fill();
          ctx.save(); ctx.translate(X, Y); ctx.rotate(p.t * 22); ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke(); ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = '#b9c0c9'; ctx.beginPath(); ctx.moveTo(3, -0.5); ctx.quadraticCurveTo(6.5, -3.5, 6.5, 2.5); ctx.quadraticCurveTo(5, 1, 3, 1.2); ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (p.k === 'fire') {
          if (dt > 0 && Math.random() < 0.5) this.part(wx, wy, wz, { life: 0.5, r: 1.3, grow: 5, col: '190,190,190', a: 0.35 });
          ctx.strokeStyle = 'rgba(255,150,50,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X - ux * 14, Y - uy * 14); ctx.lineTo(X, Y); ctx.stroke();
          ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X - ux * 10, Y - uy * 10); ctx.lineTo(X, Y); ctx.stroke();
          ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(X - ux * 8, Y - uy * 8, 1.8, 0, 6.3); ctx.fill(); ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(X - ux * 10.5, Y - uy * 10.5, 1.4, 0, 6.3); ctx.fill();
        } else if (p.k === 'bullet') {
          ctx.strokeStyle = 'rgba(255,236,170,0.95)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(X - ux * 14, Y - uy * 14); ctx.lineTo(X, Y); ctx.stroke();
        } else {
          const big = p.k === 'bigbolt', L = big ? 17 : p.k === 'javelin' ? 15 : p.k === 'bolt' ? 9 : 11, tx = X - ux * L, ty = Y - uy * L;
          ctx.strokeStyle = 'rgba(0,0,0,' + sh + ')'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(X - gdx / gl * L, GY - gdy / gl * L); ctx.lineTo(X, GY); ctx.stroke();
          ctx.lineCap = 'round'; ctx.strokeStyle = '#2b2018'; ctx.lineWidth = big ? 2.4 : 1.7; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(X, Y); ctx.stroke();
          ctx.strokeStyle = p.k === 'javelin' || big ? '#a07a4a' : '#d8c49c'; ctx.lineWidth = big ? 1.3 : 0.8; ctx.stroke(); ctx.lineCap = 'butt';
          const nx = -uy, ny = ux, hl = big ? 4 : 2.8, hw = big ? 2 : 1.3;            // head
          ctx.fillStyle = '#9aa1aa'; ctx.beginPath(); ctx.moveTo(X + ux * hl, Y + uy * hl); ctx.lineTo(X + nx * hw, Y + ny * hw); ctx.lineTo(X - nx * hw, Y - ny * hw); ctx.closePath(); ctx.fill();
          if (p.k === 'arrow' || p.k === 'bolt') {                                       // fletching
            const f = p.team % 2 ? '#e8e2d4' : '#c94a35'; ctx.strokeStyle = f; ctx.lineWidth = 1.1; ctx.beginPath();
            ctx.moveTo(tx + ux * 3, ty + uy * 3); ctx.lineTo(tx - ux * 0.5 + nx * 1.8, ty - uy * 0.5 + ny * 1.8); ctx.moveTo(tx + ux * 3, ty + uy * 3); ctx.lineTo(tx - ux * 0.5 - nx * 1.8, ty - uy * 0.5 - ny * 1.8); ctx.stroke(); }
        }
      }
    }
    // ---- particles
    const Pt = this.parts;
    for (let i = Pt.length - 1; i >= 0; i--) {
      const p = Pt[i]; p.age += dt; if (p.age >= p.life) { Pt[i] = Pt[Pt.length - 1]; Pt.pop(); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.g * dt; if (p.z < 0) { p.z = 0; p.vz = 0; p.vx = p.vy = 0; }
      const X = (p.x - p.y) * HW, Y = (p.x + p.y) * HH - p.z * ZPX, r = p.r + p.grow * p.age, a = p.a * (1 - p.age / p.life);
      ctx.fillStyle = 'rgba(' + p.col + ',' + a + ')';
      if (p.plus) { ctx.fillRect(X - r, Y - r / 3, r * 2, r / 1.5); ctx.fillRect(X - r / 3, Y - r, r / 1.5, r * 2); } else { ctx.beginPath(); ctx.arc(X, Y, r, 0, 6.3); ctx.fill(); }
    }
    // ---- screen-space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (v.box) { const b = v.box; ctx.fillStyle = 'rgba(120,220,120,0.12)'; ctx.strokeStyle = 'rgba(160,255,160,0.9)'; ctx.lineWidth = 1; ctx.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); ctx.strokeRect(b[0] + 0.5, b[1] + 0.5, b[2] - b[0], b[3] - b[1]); }
    if (v.marker) { const m = v.marker, [sx, sy] = this.w2s(m.x, m.y), q = m.t; ctx.strokeStyle = (m.atk ? 'rgba(255,90,70,' : 'rgba(140,255,140,') + (1 - q) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, sy, (22 - q * 14) * z, (11 - q * 7) * z, 0, 0, 6.3); ctx.stroke(); }
    if (this.frame % 4 === 0 || this.miniDirty) this._mini(v);
  }

  // ------------------------------------------------------------ minimap
  _mini(v) {
    const sc = this.sc, c = this.mctx, W = this.mW, H = this.mH, s = Math.min(W / (sc.w + sc.h), H * 2 / (sc.w + sc.h)), cx = W / 2 + (sc.h - sc.w) * s / 2, U = AB.UNITS;
    this.ms = s; this.mcx = cx; this.mcy = (H - (sc.w + sc.h) * s / 2) / 2;
    if (this.miniDirty || !this.miniBase) {
      const b = this.miniBase || (this.miniBase = document.createElement('canvas')); b.width = W * 2; b.height = H * 2; const g = b.getContext('2d'); g.scale(2, 2);
      const T = AB.TERRAIN, rw = Math.max(1, s * 2 + 0.4), rh = Math.max(0.6, s + 0.3);
      for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) { const i = x + y * sc.w, o = sc.objects[i], t = T[sc.terrain[i]].c;
        g.fillStyle = o === 1 ? (sc.terrain[i] === 4 ? '#3c6a52' : '#2c5a2a') : o === 2 ? '#77746e' : 'rgb(' + t[0] + ',' + t[1] + ',' + t[2] + ')';
        g.fillRect(cx + (x - y) * s - rw / 2, this.mcy + (x + y) * s / 2, rw, rh); }
      this.miniDirty = false;
    }
    c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, W, H); c.drawImage(this.miniBase, 0, 0, W, H);
    const dot = (x, y, p, big) => { c.fillStyle = AB.PLAYERS[p].m; const k = big ? 3 : 2; c.fillRect(cx + (x - y) * s - k / 2, this.mcy + (x + y) * s / 2 - k / 2, k, k); };
    if (v.sim) { for (const e of v.sim.ents) dot(e.x, e.y, e.p, e.bld); } else for (const u of sc.units) { const d = U[u.t]; dot(d.bld ? u.x + d.size / 2 : u.x, d.bld ? u.y + d.size / 2 : u.y, u.p, d.bld); }
    const z = this.cam.z, k = s / HW, vx = cx + (this.cam.x - this.W / 2 / z) * k, vy = this.mcy + (this.cam.y - this.H / 2 / z) * k;
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(vx + 0.5, vy + 0.5, this.W / z * k, this.H / z * k);
  }
  miniToWorld(mx, my) { const px = (mx - this.mcx) / this.ms, py = (my - this.mcy) / this.ms * 2; return [(px + py) / 2, (py - px) / 2]; }
}
AB.Render = Render;
})(typeof globalThis !== 'undefined' ? globalThis : this);
