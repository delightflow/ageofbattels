/* Age of Battels — budget challenges: beat a fixed enemy army with a limited budget. DOM-free. */
(function (G) {
'use strict';
const AB = G.AB, S = AB.Scenario;
// uv: u = left(-1)…right(+1), v = top(-1)…bottom(+1) in screen terms
const uvOf = (sc, x, y) => [(x - y) / sc.w, (x + y - sc.w) / sc.w];
function base(w, seed, biome) {
  const sc = S.create(w, w, biome === 'desert' ? 3 : biome === 'snow' ? 4 : 0), R = AB.rng32(seed);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const i = x + y * w, [u, v] = uvOf(sc, x, y);
    if (Math.abs(u) + Math.abs(v) > 0.8 && R() < 0.35) sc.objects[i] = R() < 0.85 ? 1 : 2; else if (R() < 0.004) sc.objects[i] = 2;
    if (biome !== 'desert' && biome !== 'snow' && AB.hash2(x >> 2, y >> 2, seed) > 0.8) sc.terrain[i] = 1; }
  sc.players[1].team = 1; return sc;
}
const E = (sc, t, n, u, v, s) => S.group(sc, 1, t, n, u, v, -1, s || 0);
const L = AB.Challenges = [
  { id: 'cav', budget: 1600, build() { const sc = base(48, 3); E(sc, 'knight', 12, 0.3, 0); return sc; } },
  { id: 'arch', budget: 2000, build() {
    const sc = base(48, 5); for (let v = -0.42; v <= 0.42; v += 0.035) { const [x, y] = S.uv(sc, 0.14, v); S.add(sc, 'palisade', 1, x, y); }
    E(sc, 'archer', 50, 0.3, 0, 1); E(sc, 'crossbow', 14, 0.38, 0, 1); return sc; } },
  { id: 'ele', budget: 2600, build() { const sc = base(48, 7, 'desert'); E(sc, 'elephant', 5, 0.24, 0); E(sc, 'archer', 26, 0.36, 0, 1); return sc; } },
  { id: 'horde', budget: 3000, build() { const sc = base(56, 9); E(sc, 'levy', 300, 0.3, 0); return sc; } },
  { id: 'raid', budget: 2600, build() { const sc = base(56, 11, 'snow'); E(sc, 'keshig', 30, 0.32, 0); return sc; } },
  { id: 'bridge', budget: 3000, build() {
    const w = 52, sc = base(w, 13);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const [u, v] = uvOf(sc, x, y), i = x + y * w, a = Math.abs(u - 0.02);
      if (a < 0.09) { sc.terrain[i] = Math.abs(v) < 0.05 ? 5 : a < 0.06 ? 7 : 6; sc.objects[i] = 0; if (Math.abs(v) >= 0.05 && a < 0.06) sc.terrain[i] = 7; } }
    E(sc, 'hoplite', 24, 0.17, 0, 2); E(sc, 'archer', 26, 0.27, 0, 1); E(sc, 'crossbow', 12, 0.27, 0.2, 1); return sc; } },
  { id: 'fort', budget: 4200, build() {
    const sc = base(56, 17); const x0 = 32, y0 = 12, n = 13, x1 = x0 + n - 1, y1 = y0 + n - 1;
    for (let k = 0; k < n; k++) { const corner = k === 0 || k === n - 1, mid = k === 6;
      S.add(sc, corner ? 'tower' : mid ? 'gate' : 'wall', 1, x0, y0 + k); S.add(sc, corner ? 'tower' : 'wall', 1, x0 + k, y1); S.add(sc, corner ? 'tower' : 'wall', 1, x1, y0 + k); S.add(sc, corner ? 'tower' : 'wall', 1, x0 + k, y0); }
    for (let j = y0 + 1; j < y1; j++) for (let i = x0 + 1; i < x1; i++) { sc.objects[i + j * sc.w] = 0; sc.terrain[i + j * sc.w] = 2; }
    S.add(sc, 'keep', 1, x0 + 7, y0 + 4);
    S.formation(sc, 'archer', 1, x0 + 3, y0 + 6.5, 22, -1, 1, 2); S.formation(sc, 'swordsman', 1, x0 + 5, y0 + 9.5, 18, -1, 1, 1); S.formation(sc, 'crossbow', 1, x0 + 7, y1 - 2, 10, -1, 1, 2);
    return sc; } },
  { id: 'elite', budget: 4800, build() { const sc = base(56, 19); E(sc, 'samurai', 14, 0.24, -0.2); E(sc, 'jaguar', 14, 0.24, 0.2); E(sc, 'landsknecht', 10, 0.3, 0); E(sc, 'gaemamusa', 6, 0.34, -0.4); E(sc, 'repeater', 16, 0.36, 0.1); return sc; } },
];
L.forEach((c, i) => { c.n = i + 1; });
// the player may deploy on the left third of the map
AB.challengeZone = function (sc) { return (x, y) => { if (x < 0 || y < 0 || x >= sc.w || y >= sc.h) return false; const [u, v] = uvOf(sc, x, y); return u < -0.18 && Math.abs(u) + Math.abs(v) < 0.92; }; };
AB.challengeBuild = function (c) { const sc = c.build(); sc.name = ''; S.dirty(sc); return sc; };
AB.challengeStars = function (c, won, spent) { if (!won) return 0; return spent <= c.budget * 0.6 ? 3 : spent <= c.budget * 0.8 ? 2 : 1; };
AB.uvOf = uvOf;
})(typeof globalThis !== 'undefined' ? globalThis : this);
