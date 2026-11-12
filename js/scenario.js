/* Age of Battels — scenario model: map + placed units, editing ops, presets. DOM-free. */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};

function rng32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
AB.rng32 = rng32;
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
AB.hash2 = hash2;
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y); let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15; }

const S = AB.Scenario = {
  create(w, h, baseT) {
    return { v: 2, name: '', w, h, terrain: new Uint8Array(w * h).fill(baseT || 0), objects: new Uint8Array(w * h),
      players: AB.PLAYERS.map((_, i) => ({ team: i })), units: [], _bm: null, _ix: null };
  },
  clone(sc) {
    return { v: 2, name: sc.name, w: sc.w, h: sc.h, terrain: sc.terrain.slice(), objects: sc.objects.slice(),
      players: sc.players.map(p => ({ team: p.team })), units: sc.units.map(u => Object.assign({}, u)), _bm: null, _ix: null };
  },
  pack(sc) {
    const rle = []; let prev = -1, run = 0;
    for (let i = 0; i < sc.terrain.length; i++) {
      const v = sc.terrain[i] | (sc.objects[i] << 4);
      if (v === prev) run++; else { if (run) rle.push(prev, run); prev = v; run = 1; }
    }
    if (run) rle.push(prev, run);
    return { v: 2, name: sc.name, w: sc.w, h: sc.h, map: rle, teams: sc.players.map(p => p.team),
      units: sc.units.map(u => [u.t, u.p, Math.round(u.x * 100) / 100, Math.round(u.y * 100) / 100, u.s || 0]) };
  },
  unpack(o) {
    if (!o || o.v !== 2 || !(o.w > 7 && o.w <= 160) || !(o.h > 7 && o.h <= 160) || !Array.isArray(o.map)) throw new Error('bad scenario');
    const sc = S.create(o.w, o.h, 0); sc.name = String(o.name || '').slice(0, 60);
    let i = 0;
    for (let k = 0; k + 1 < o.map.length; k += 2) {
      const v = o.map[k] | 0, n = o.map[k + 1] | 0, t = Math.min(AB.TERRAIN.length - 1, v & 15), ob = Math.min(AB.OBJECTS.length - 1, v >> 4);
      for (let j = 0; j < n && i < sc.terrain.length; j++, i++) { sc.terrain[i] = t; sc.objects[i] = ob; }
    }
    (o.teams || []).forEach((t, p) => { if (sc.players[p]) sc.players[p].team = Math.max(0, Math.min(7, t | 0)); });
    for (const u of (o.units || [])) {
      const d = AB.UNITS[u[0]]; const p = u[1] | 0;
      if (!d || p < 0 || p > 7 || !(u[2] >= 0 && u[2] < sc.w && u[3] >= 0 && u[3] < sc.h)) continue;
      if (sc.units.length >= AB.MAX_UNITS) break;
      sc.units.push({ t: u[0], p, x: +u[2], y: +u[3], s: Math.max(0, Math.min(2, u[4] | 0)) });
    }
    return sc;
  },

  // ---------------------------------------------------------- queries
  inb(sc, x, y) { return x >= 0 && y >= 0 && x < sc.w && y < sc.h; },
  tileFree(sc, tx, ty) {
    if (!S.inb(sc, tx, ty)) return false; const i = tx + ty * sc.w;
    return AB.TERRAIN[sc.terrain[i]].pass === 1 && sc.objects[i] === 0;
  },
  bmap(sc) {
    if (sc._bm) return sc._bm;
    const m = sc._bm = new Array(sc.w * sc.h).fill(null);
    for (const u of sc.units) { const d = AB.UNITS[u.t]; if (!d.bld) continue; for (let j = 0; j < d.size; j++) for (let i = 0; i < d.size; i++) if (S.inb(sc, u.x + i, u.y + j)) m[u.x + i + (u.y + j) * sc.w] = u; }
    return m;
  },
  index(sc) {
    if (sc._ix) return sc._ix;
    const m = sc._ix = new Map();
    for (const u of sc.units) { if (AB.UNITS[u.t].bld) continue; const k = (u.x | 0) + (u.y | 0) * sc.w; const a = m.get(k); if (a) a.push(u); else m.set(k, [u]); }
    return m;
  },
  dirty(sc) { sc._bm = null; sc._ix = null; },
  unitNear(sc, x, y, rad) {
    const ix = S.index(sc), tx = x | 0, ty = y | 0;
    for (let j = ty - 1; j <= ty + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) {
      const a = ix.get(i + j * sc.w); if (!a) continue;
      for (const u of a) { const rr = rad + AB.UNITS[u.t].r; const dx = u.x - x, dy = u.y - y; if (dx * dx + dy * dy < rr * rr * 0.72) return u; }
    }
    return null;
  },
  canPlace(sc, t, x, y) {
    const d = AB.UNITS[t];
    if (d.bld) {
      const bm = S.bmap(sc), ix = S.index(sc);
      for (let j = 0; j < d.size; j++) for (let i = 0; i < d.size; i++) {
        if (!S.tileFree(sc, x + i, y + j) || bm[x + i + (y + j) * sc.w]) return false;
        if (!d.gate && ix.get(x + i + (y + j) * sc.w)) return false;
      }
      return true;
    }
    const tx = x | 0, ty = y | 0;
    if (!S.tileFree(sc, tx, ty)) return false;
    const b = S.bmap(sc)[tx + ty * sc.w]; if (b && !AB.UNITS[b.t].gate) return false;
    return !S.unitNear(sc, x, y, d.r);
  },
  add(sc, t, p, x, y, s) {
    const d = AB.UNITS[t];
    if (d.bld) { x = Math.floor(x); y = Math.floor(y); }
    if (sc.units.length >= AB.MAX_UNITS || !S.canPlace(sc, t, x, y)) return null;
    const u = { t, p, x, y, s: s || 0 }; sc.units.push(u);
    if (d.bld) { if (sc._bm) for (let j = 0; j < d.size; j++) for (let i = 0; i < d.size; i++) sc._bm[x + i + (y + j) * sc.w] = u; }
    else if (sc._ix) { const k = (x | 0) + (y | 0) * sc.w; const a = sc._ix.get(k); if (a) a.push(u); else sc._ix.set(k, [u]); }
    return u;
  },
  formationPts(t, cx, cy, n, fx, fy) {
    const d = AB.UNITS[t], sp = Math.max(0.52, d.r * 2.35), cols = Math.min(n, Math.ceil(Math.sqrt(n * 2.2))), rows = Math.ceil(n / cols);
    const l = Math.hypot(fx, fy) || 1; fx /= l; fy /= l; const rx = -fy, ry = fx, out = [];
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = (i / cols) | 0, inRow = r === rows - 1 ? n - r * cols : cols;
      const lat = (c - (inRow - 1) / 2) * sp, dep = -(r - (rows - 1) / 2) * sp;
      out.push(cx + rx * lat + fx * dep, cy + ry * lat + fy * dep);
    }
    return out;
  },
  formation(sc, t, p, cx, cy, n, fx, fy, s) {
    const pts = S.formationPts(t, cx, cy, n, fx, fy); let k = 0;
    for (let i = 0; i < pts.length; i += 2) if (S.add(sc, t, p, pts[i], pts[i + 1], s)) k++;
    return k;
  },
  removeIf(sc, fn) { const n = sc.units.length; sc.units = sc.units.filter(u => !fn(u)); if (sc.units.length !== n) S.dirty(sc); return n - sc.units.length; },
  removeIn(sc, cx, cy, rad) {
    return S.removeIf(sc, u => { const d = AB.UNITS[u.t]; const ux = d.bld ? u.x + d.size / 2 : u.x, uy = d.bld ? u.y + d.size / 2 : u.y; return Math.hypot(ux - cx, uy - cy) <= rad + (d.bld ? d.size * 0.35 : 0); });
  },
  // drop anything standing on tiles that became impassable
  cleanup(sc) {
    return S.removeIf(sc, u => { const d = AB.UNITS[u.t];
      if (!d.bld) return !S.tileFree(sc, u.x | 0, u.y | 0);
      for (let j = 0; j < d.size; j++) for (let i = 0; i < d.size; i++) if (!S.tileFree(sc, u.x + i, u.y + j)) return true;
      return false; });
  },
  brushTiles(sc, cx, cy, size, fn) {
    const r = (size - 1) / 2, x0 = Math.floor(cx - r), y0 = Math.floor(cy - r);
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const x = x0 + i, y = y0 + j; if (!S.inb(sc, x, y)) continue;
      if (size > 2 && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > size / 2 + 0.1) continue;
      fn(x, y, x + y * sc.w);
    }
  },
  paint(sc, cx, cy, size, t) { S.brushTiles(sc, cx, cy, size, (x, y, i) => { sc.terrain[i] = t; if (!AB.TERRAIN[t].pass || t === 6 || t === 5) sc.objects[i] = 0; }); },
  summary(sc) {
    const out = AB.PLAYERS.map(() => ({ n: 0, v: 0, armed: 0 }));
    for (const u of sc.units) { const d = AB.UNITS[u.t], o = out[u.p]; if (!d.bld) o.n++; o.v += d.cost; if (d.atk > 0) o.armed++; }
    return out;
  },

  // ---------------------------------------------------------- generation
  randomMap(w, h, seed, biome) {
    const sc = S.create(w, h, biome === 'desert' ? 3 : biome === 'snow' ? 4 : 0), R = rng32(seed);
    const T = sc.terrain, O = sc.objects, s = seed % 1000;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = x + y * w, e = fbm(x / 15, y / 15, s), f = fbm(x / 8 + 40, y / 8 + 40, s + 3), p = fbm(x / 6 + 90, y / 6, s + 5);
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (biome === 'desert') {
        if (e < 0.24) T[i] = 7; else if (e < 0.275) T[i] = 6; else if (e < 0.34) T[i] = 0; else if (p > 0.62) T[i] = 2;
        if (T[i] === 0 && R() < 0.3 || T[i] === 3 && e < 0.4 && R() < 0.12) O[i] = 1; else if (T[i] !== 7 && T[i] !== 6 && R() < 0.012) O[i] = 2;
      } else {
        const snow = biome === 'snow';
        if (e < 0.29) T[i] = 7; else if (e < 0.325) T[i] = 6; else if (e < 0.355) T[i] = snow ? 2 : 3;
        else if (p > 0.66) T[i] = 2; else if (!snow && f > 0.5) T[i] = 1;
        if (T[i] !== 7 && T[i] !== 6 && T[i] !== 3) { if (f > 0.6 + (edge < 4 ? -0.1 : 0) && R() < 0.72) O[i] = 1; else if (R() < 0.006) O[i] = 2; }
      }
    }
    return sc;
  },
  // screen-oriented coordinates: u = left(-1)…right(+1), v = top(-1)…bottom(+1); inside when |u|+|v| < 1
  uv(sc, u, v) { const k = sc.w / 2; return [sc.w / 2 + (u + v) * k, sc.h / 2 + (v - u) * k]; },
  group(sc, p, t, n, u, v, dir, s) { const [x, y] = S.uv(sc, u, v); const f = dir > 0 ? [1, -1] : dir < 0 ? [-1, 1] : [0, 0]; return S.formation(sc, t, p, x, y, n, f[0] || 1, f[1], s); },
  randomArmy(sc, p, u, v, dir, budget, R) {
    const pool = AB.UNIT_ORDER.filter(t => t !== 'wolf' && t !== 'commander' && t !== 'ram');
    const picks = []; const n = 4 + (R() * 3 | 0);
    while (picks.length < n) { const t = pool[R() * pool.length | 0]; if (!picks.includes(t)) picks.push(t); }
    const rank = t => { const d = AB.UNITS[t]; return d.cat === 'siege' || d.heal ? 3 : d.proj ? 2 : d.cat === 'cav' ? 0 : 1; };
    picks.sort((a, b) => rank(a) - rank(b));
    const lanes = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const t of picks) {
      const d = AB.UNITS[t], share = budget / n * (0.7 + R() * 0.6), cnt = Math.max(1, Math.min(90, Math.round(share / d.cost)));
      const rk = rank(t), depth = rk === 0 ? 0 : rk === 1 ? 0 : rk === 2 ? 0.1 : 0.18;
      const lat = rk === 0 ? (lanes[0]++ % 2 ? 0.34 : -0.34) : ((lanes[rk]++ % 3) - 1) * 0.2;
      S.group(sc, p, t, cnt, u - dir * depth, v + lat, dir, 0);
    }
    S.group(sc, p, 'commander', 1, u - dir * 0.14, v, dir, 0);
  },
};

// ---------------------------------------------------------------- presets
function patches(sc, seed, t, thr, scale) { for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) if (fbm(x / scale, y / scale, seed) > thr && sc.terrain[x + y * sc.w] === 0) sc.terrain[x + y * sc.w] = t; }
function woods(sc, seed, thr, keep) {
  const R = rng32(seed);
  for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) {
    const i = x + y * sc.w; if (!AB.TERRAIN[sc.terrain[i]].pass || sc.terrain[i] === 6 || sc.terrain[i] === 5) continue;
    if (keep && keep(x, y)) continue;
    if (fbm(x / 7, y / 7, seed) > thr && R() < 0.7) sc.objects[i] = 1; else if (R() < 0.004) sc.objects[i] = 2;
  }
}
// per-preset army multipliers so the shipped battles are close calls (tuned with tests/presets-odds.cjs)
const BAL = S.balance = { field: [1, 0.925], river: [0.6, 1], ele: [1, 0.97] };
const B = (id, p, n) => Math.max(1, Math.round(n * ((BAL[id] && BAL[id][p]) || 1)));
const P = S.presets = [
  { id: 'field', build() {
    const sc = S.create(60, 60, 0); patches(sc, 11, 1, 0.56, 9); patches(sc, 23, 2, 0.7, 6);
    woods(sc, 5, 0.66, (x, y) => Math.abs(x + y - 60) < 17);
    sc.players[0].team = 0; sc.players[1].team = 1;
    const g = (p, t, n, u, v) => S.group(sc, p, t, B('field', p, n), u, v, p ? -1 : 1);
    g(0, 'swordsman', 44, -0.2, 0); g(0, 'spearman', 30, -0.21, -0.22); g(0, 'spearman', 30, -0.21, 0.22);
    g(0, 'archer', 40, -0.31, 0); g(0, 'knight', 8, -0.24, -0.4); g(0, 'knight', 8, -0.24, 0.4);
    g(0, 'catapult', 3, -0.4, 0.1); g(0, 'monk', 3, -0.36, -0.1); g(0, 'commander', 1, -0.36, 0);
    g(1, 'manatarms', 22, 0.2, 0); g(1, 'pikeman', 22, 0.21, -0.2); g(1, 'pikeman', 22, 0.21, 0.2);
    g(1, 'crossbow', 28, 0.31, 0); g(1, 'lightcav', 12, 0.24, -0.4); g(1, 'horsearcher', 12, 0.26, 0.4);
    g(1, 'ballista', 4, 0.4, -0.08); g(1, 'berserker', 14, 0.27, 0.12); g(1, 'monk', 3, 0.36, 0.1); g(1, 'commander', 1, 0.36, 0);
    return sc; } },
  { id: 'river', build() {
    const w = 64, sc = S.create(w, w, 0); patches(sc, 31, 1, 0.55, 8);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const along = (x + y) / 2, off = x - y + Math.sin(along / 5) * 3.2, a = Math.abs(off), i = x + y * w;
      const ford = Math.abs(along - 17) < 2.6 || Math.abs(along - 47) < 2.6, bridge = Math.abs(along - 32) < 1.3;
      if (a < 5) sc.terrain[i] = bridge ? 5 : (ford || a >= 3.4) ? 6 : 7; else if (a < 6.2) sc.terrain[i] = 3;
      else if (bridge && a < 16) sc.terrain[i] = 5;
    }
    woods(sc, 8, 0.67, (x, y) => Math.abs(x - y) < 9 || Math.abs(x + y - 64) < 10);
    const g = (p, t, n, u, v, s) => S.group(sc, p, t, B('river', p, n), u, v, p ? -1 : 1, s);
    g(0, 'swordsman', 50, -0.3, 0); g(0, 'manatarms', 20, -0.3, -0.3); g(0, 'spearman', 30, -0.3, 0.3); g(0, 'archer', 36, -0.42, 0);
    g(0, 'knight', 12, -0.4, 0.3); g(0, 'catapult', 3, -0.5, -0.05); g(0, 'commander', 1, -0.47, 0.05);
    g(1, 'pikeman', 18, 0.17, 0, 1); g(1, 'spearman', 16, 0.18, -0.47, 1); g(1, 'spearman', 16, 0.18, 0.47, 1);
    g(1, 'archer', 30, 0.26, -0.12, 1); g(1, 'crossbow', 24, 0.26, 0.14, 1); g(1, 'skirmisher', 14, 0.24, -0.4, 1); g(1, 'skirmisher', 14, 0.24, 0.4, 1);
    g(1, 'ballista', 3, 0.33, 0, 1); g(1, 'lightcav', 10, 0.4, 0.1, 0); g(1, 'commander', 1, 0.36, 0, 1);
    for (const v of [-0.5, 0, 0.5]) { const [x, y] = S.uv(sc, 0.17, v + 0.07); S.add(sc, 'tower', 1, x, y); }
    return sc; } },
  { id: 'siege', build() {
    const w = 64, sc = S.create(w, w, 0); patches(sc, 51, 1, 0.56, 8); patches(sc, 52, 2, 0.66, 7);
    const x0 = 36, y0 = 10, n = 17, x1 = x0 + n - 1, y1 = y0 + n - 1;
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) sc.terrain[x + y * w] = 2;
    for (let k = 3; k < 40; k++) { const x = x0 - k, y = y0 + 8 + (k > 8 ? Math.min(k - 8, 16) : 0); if (S.inb(sc, x, y)) { sc.terrain[x + y * w] = 5; sc.terrain[x + (y + 1) * w] = 5; } }
    woods(sc, 9, 0.64, (x, y) => (x > 26 && y < 36) || Math.abs(x + y - 62) < 12);
    const put = (t, x, y) => S.add(sc, t, 1, x, y);
    for (let k = 0; k < n; k++) {
      const corner = k === 0 || k === n - 1, mid = k === 8, flank = k === 6 || k === 10;
      const kind = corner || flank ? 'tower' : mid ? 'gate' : 'wall';
      put(kind, x0, y0 + k); put(mid ? 'wall' : kind === 'gate' ? 'wall' : kind, x0 + k, y1);
      put(corner ? 'tower' : 'wall', x1, y0 + k); put(corner ? 'tower' : 'wall', x0 + k, y0);
    }
    put('keep', x0 + 9, y0 + 5); put('tent', x0 + 5, y0 + 3); put('tent', x0 + 12, y0 + 12); put('tent', x0 + 4, y0 + 12);
    const d = (t, n2, x, y, s) => S.formation(sc, t, 1, x, y, B('siege', 1, n2), -1, 1, s);
    d('archer', 24, x0 + 3.5, y0 + 6, 1); d('archer', 24, x0 + 8, y1 - 2.5, 1); d('crossbow', 14, x0 + 3.5, y0 + 11.5, 1);
    d('swordsman', 24, x0 + 6.5, y0 + 9, 1); d('pikeman', 14, x0 + 4, y0 + 8.5, 1); d('manatarms', 10, x0 + 8, y0 + 12, 1); d('commander', 1, x0 + 8, y0 + 8.5, 1);
    const a = (t, n2, u, v) => S.group(sc, 0, t, B('siege', 0, n2), u, v, 1);
    a('swordsman', 60, -0.32, 0.1); a('manatarms', 24, -0.34, -0.14); a('spearman', 30, -0.34, 0.34); a('archer', 44, -0.44, 0.1);
    a('ram', 5, -0.24, 0.04); a('catapult', 5, -0.52, -0.02); a('cannon', 3, -0.56, 0.16); a('knight', 14, -0.42, 0.36); a('commander', 1, -0.48, 0.12); a('monk', 4, -0.46, 0);
    return sc; } },
  { id: 'ffa', build() {
    const sc = S.create(72, 72, 0); patches(sc, 71, 1, 0.55, 9); patches(sc, 72, 2, 0.68, 7); patches(sc, 73, 3, 0.74, 6);
    woods(sc, 12, 0.7, (x, y) => { const u = (x - y) / 72, v = (x + y - 72) / 72; return Math.abs(u) < 0.2 || Math.abs(v) < 0.2 || (Math.abs(Math.abs(u) - 0.45) < 0.14 && Math.abs(v) < 0.2) || (Math.abs(Math.abs(v) - 0.45) < 0.14 && Math.abs(u) < 0.2); });
    for (let i = 0; i < 4; i++) sc.players[i].team = i;
    const at = [[-0.48, 0], [0.48, 0], [0, -0.48], [0, 0.48]];
    const armies = [
      [['swordsman', 36], ['archer', 30], ['knight', 10], ['catapult', 2]],
      [['manatarms', 18], ['crossbow', 24], ['lightcav', 14], ['ballista', 3]],
      [['berserker', 26], ['skirmisher', 26], ['horsearcher', 16], ['monk', 3]],
      [['pikeman', 26], ['musketeer', 20], ['camel', 14], ['cannon', 2]]];
    armies.forEach((arm, p) => { const [u, v] = at[p]; const [cx, cy] = S.uv(sc, u, v); const fx = sc.w / 2 - cx, fy = sc.h / 2 - cy, l = Math.hypot(fx, fy);
      arm.forEach(([t, n], k) => { const dep = [0, 4.5, 0, 8][k], lat = k === 2 ? 9 : 0; S.formation(sc, t, p, cx - fx / l * dep - fy / l * lat, cy - fy / l * dep + fx / l * lat, B('ffa', p, n), fx, fy, 0); });
      S.formation(sc, 'commander', p, cx - fx / l * 6.5 + fy / l * 5, cy - fy / l * 6.5 - fx / l * 5, 1, fx, fy, 0); });
    return sc; } },
  { id: 'knights', build() {
    const sc = S.create(56, 56, 0); patches(sc, 91, 1, 0.5, 10); woods(sc, 14, 0.7, (x, y) => Math.abs(x + y - 56) < 20);
    S.group(sc, 0, 'knight', B('knights', 0, 40), -0.3, 0, 1); S.group(sc, 1, 'levy', B('knights', 1, 400), 0.26, 0, -1);
    return sc; } },
  { id: 'ele', build() {
    const sc = S.create(60, 60, 3); const R = rng32(77);
    for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) { const i = x + y * 60; if (fbm(x / 8, y / 8, 4) > 0.62) sc.terrain[i] = 2;
      if (Math.abs(x + y - 60) > 30 && R() < 0.05) sc.objects[i] = R() < 0.6 ? 1 : 2; }
    const g = (p, t, n, u, v) => S.group(sc, p, t, B('ele', p, n), u, v, p ? -1 : 1);
    g(0, 'elephant', 12, -0.26, 0); g(0, 'camel', 16, -0.3, -0.36); g(0, 'horsearcher', 16, -0.3, 0.36); g(0, 'archer', 30, -0.4, 0); g(0, 'commander', 1, -0.46, 0);
    g(1, 'pikeman', 44, 0.2, 0); g(1, 'spearman', 30, 0.22, -0.3); g(1, 'spearman', 30, 0.22, 0.3); g(1, 'skirmisher', 30, 0.31, 0); g(1, 'crossbow', 20, 0.38, 0.12); g(1, 'ballista', 4, 0.42, -0.1); g(1, 'commander', 1, 0.44, 0.04);
    return sc; } },
  { id: 'random', build(seed) {
    seed = seed || (Date.now() & 0xffff) + 1; const R = rng32(seed);
    const biome = ['temperate', 'temperate', 'desert', 'snow'][R() * 4 | 0];
    const sc = S.randomMap(64, 64, seed, biome);
    // clear a fighting lane through the middle so the armies can meet
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = x + y * 64, v = Math.abs(x + y - 64) / 64, u = Math.abs(x - y) / 64;
      if (v < 0.3 && u < 0.62) { if (sc.terrain[i] === 7) sc.terrain[i] = 6; if (v < 0.22 && R() < 0.8) sc.objects[i] = 0; } }
    const b = 6000 + (R() * 4 | 0) * 1000;
    S.randomArmy(sc, 0, -0.3, 0, 1, b, R); S.randomArmy(sc, 1, 0.3, 0, -1, b, R);
    return sc; } },
];
S.preset = function (id, seed) { const p = P.find(q => q.id === id); const sc = p.build(seed); sc.name = AB.T('pr_' + id); S.dirty(sc); return sc; };
})(typeof globalThis !== 'undefined' ? globalThis : this);
