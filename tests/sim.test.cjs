/* Headless checks: node tests/sim.test.cjs */
require('../js/data.js'); require('../js/scenario.js'); require('../js/sim.js');
const AB = globalThis.AB, S = AB.Scenario; AB.lang = 'en';
let fail = 0;
function ok(c, msg) { console.log((c ? '  ok   ' : '  FAIL ') + msg); if (!c) fail++; }
function run(sc, seed, max) { const sim = new AB.Sim(sc, { seed: seed || 1 }); const lim = (max || 900) * 20; let n = 0; while (!sim.over && n++ < lim) { sim.step(); sim.events.length = 0; } return sim; }
function duel(a, na, b, nb, seed) {
  const sc = S.create(40, 40, 0); sc.players[0].team = 0; sc.players[1].team = 1;
  S.formation(sc, a, 0, 13, 27, na, 1, -1, 0); S.formation(sc, b, 1, 27, 13, nb, -1, 1, 0);
  const sim = run(sc, seed, 600); return sim;
}
// equal-value duel: returns share of trials won by a
function wins(a, b, budget) {
  const na = Math.max(1, Math.round(budget / AB.UNITS[a].cost)), nb = Math.max(1, Math.round(budget / AB.UNITS[b].cost)); let w = 0;
  for (let s = 1; s <= 3; s++) { const sim = duel(a, na, b, nb, s); if (sim.winner === 0) w++; }
  return w / 3;
}
console.log('presets');
for (const p of S.presets) {
  const sc = S.preset(p.id, 7), t0 = Date.now(), sim = run(sc, 3, 1500), sum = S.summary(sc);
  ok(sim.over, `${p.id}: ends (t=${sim.time.toFixed(0)}s, winner=${sim.winner}${sim.stalemate ? ' stalemate' : ''}, units=${sc.units.length}, values=${sum[0].v}/${sum[1].v}, ${Date.now() - t0}ms)`);
  if (p.id !== 'random') ok(!sim.stalemate, `${p.id}: no stalemate`);
}
console.log('determinism');
{ const a = run(S.preset('field'), 5), b = run(S.preset('field'), 5); ok(a.time === b.time && a.winner === b.winner && a.ents.length === b.ents.length, 'same seed, same battle'); }
console.log('pack/unpack');
{ const sc = S.preset('siege'), o = JSON.parse(JSON.stringify(S.pack(sc))), b = S.unpack(o);
  ok(b.units.length === sc.units.length && b.terrain.every((v, i) => v === sc.terrain[i]) && b.objects.every((v, i) => v === sc.objects[i]), 'round trip'); }
console.log('counters (equal value)');
const C = [['spearman', 'knight'], ['pikeman', 'knight'], ['knight', 'archer'], ['skirmisher', 'archer'], ['camel', 'knight'], ['pikeman', 'elephant'],
  ['lightcav', 'catapult'], ['swordsman', 'spearman'], ['archer', 'pikeman'], ['manatarms', 'swordsman'], ['knight', 'swordsman'], ['catapult', 'archer'], ['elephant', 'swordsman']];
for (const [a, b] of C) { const w = wins(a, b, 3200); ok(w >= 0.66, `${a} beats ${b} (${(w * 100).toFixed(0)}%)`); }
if (process.argv.includes('--matrix')) {
  const L = AB.UNIT_ORDER.filter(t => AB.UNITS[t].atk > 0);
  console.log(''.padEnd(12) + L.map(t => t.slice(0, 5).padEnd(6)).join(''));
  for (const a of L) console.log(a.padEnd(12) + L.map(b => a === b ? '  -   ' : String(Math.round(wins(a, b, 2400) * 100)).padEnd(6)).join(''));
}
console.log('walls');
{ const sc = S.create(32, 32, 0); sc.players[1].team = 1;
  for (let k = 10; k <= 20; k++) { for (const [x, y] of [[k, 10], [k, 20], [10, k], [20, k]]) S.add(sc, 'palisade', 1, x, y); }
  S.formation(sc, 'archer', 1, 15.5, 15.5, 12, 1, 0, 2); S.formation(sc, 'swordsman', 0, 4, 15, 60, 1, 0, 0);
  const sim = run(sc, 2, 900); ok(sim.over && sim.winner === 0 && sim.stats[0].razed > 0, `melee breach a sealed fort (t=${sim.time.toFixed(0)}s, razed=${sim.stats[0].razed})`); }
{ const sc = S.create(32, 32, 0); sc.players[1].team = 1;
  for (let y = 0; y < 32; y++) for (let x = 14; x < 18; x++) sc.terrain[x + y * 32] = 7;
  S.formation(sc, 'swordsman', 0, 6, 16, 20, 1, 0, 0); S.formation(sc, 'swordsman', 1, 26, 16, 20, -1, 0, 0);
  const sim = run(sc, 2, 300); ok(sim.over && sim.stalemate, `unreachable armies end in stalemate (t=${sim.time.toFixed(0)}s)`); }
console.log(fail ? `\n${fail} FAILED` : '\nall passed'); process.exit(fail ? 1 : 0);
