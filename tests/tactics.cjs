/* node tests/tactics.cjs — does ranged micro work? results for fights where kiting and screening should matter */
require('../js/data.js'); require('../js/scenario.js'); require('../js/sim.js');
const AB = globalThis.AB, S = AB.Scenario;
function trial(build, seeds) {
  let w = 0, left = 0, flees = 0, eleft = 0, edmg = 0;
  for (let s = 1; s <= seeds; s++) {
    const sc = S.create(44, 44, 0); sc.players[1].team = 1; build(sc);
    const sim = new AB.Sim(sc, { seed: s }); let n = 0;
    while (!sim.over && n++ < 20 * 300) { sim.step(); for (const e of sim.ents) if (e.flee && e.p === 0 && Math.abs(e.flee.t - sim.time - 0) > 0 && e._fc !== e.flee) { e._fc = e.flee; flees++; } sim.events.length = 0; }
    if (sim.winner === 0) w++; for (const e of sim.ents) { if (e.p === 0 && !e.bld) left++; if (e.p === 1 && !e.bld) eleft++; } edmg += sim.stats[0].dmg;
  }
  return `${w}/${seeds} wins, survivors ${(left / seeds).toFixed(1)} vs enemy ${(eleft / seeds).toFixed(1)}, dmg dealt ${(edmg / seeds).toFixed(0)}, retreats ${(flees / seeds).toFixed(0)}`;
}
const F = (sc, t, p, x, y, n) => S.formation(sc, t, p, x, y, n, p ? -1 : 1, p ? 1 : -1, 0);
const T = {
  'archers 40 vs swordsmen 32':       sc => { F(sc, 'archer', 0, 14, 30, 40); F(sc, 'swordsman', 1, 30, 14, 32); },
  'crossbows 30 vs levies 70':        sc => { F(sc, 'crossbow', 0, 14, 30, 30); F(sc, 'levy', 1, 30, 14, 70); },
  'horse archers 30 vs knights 13':   sc => { F(sc, 'horsearcher', 0, 14, 30, 30); F(sc, 'knight', 1, 30, 14, 13); },
  'horse archers 30 vs swordsmen 38': sc => { F(sc, 'horsearcher', 0, 14, 30, 30); F(sc, 'swordsman', 1, 30, 14, 38); },
  'archers+swords vs knights':        sc => { F(sc, 'archer', 0, 12, 32, 30); F(sc, 'swordsman', 0, 15, 29, 20); F(sc, 'knight', 1, 30, 14, 16); },
  'skirmishers 40 vs men-at-arms 14': sc => { F(sc, 'skirmisher', 0, 14, 30, 40); F(sc, 'manatarms', 1, 30, 14, 14); },
};
for (const [k, f] of Object.entries(T)) console.log(k.padEnd(34), trial(f, 6));
