/* node tests/unique.cjs — equal-value results for each unique unit against a spread of opponents */
require('../js/data.js'); require('../js/lore.js'); require('../js/scenario.js'); require('../js/sim.js');
const AB = globalThis.AB, S = AB.Scenario;
function duel(a, b, budget, seed) {
  const sc = S.create(40, 40, 0); sc.players[1].team = 1;
  S.formation(sc, a, 0, 13, 27, Math.max(1, Math.round(budget / AB.UNITS[a].cost)), 1, -1, 0); S.formation(sc, b, 1, 27, 13, Math.max(1, Math.round(budget / AB.UNITS[b].cost)), -1, 1, 0);
  const sim = new AB.Sim(sc, { seed }); let n = 0; while (!sim.over && n++ < 12000) { sim.step(); sim.events.length = 0; } return sim.winner;
}
const opp = (process.argv[2] ? process.argv[2].split(',') : ['swordsman', 'pikeman', 'manatarms', 'archer', 'crossbow', 'knight', 'lightcav', 'horsearcher', 'elephant', 'catapult']);
const list = process.argv[3] ? process.argv[3].split(',') : AB.UNIQUE;
console.log(''.padEnd(12) + opp.map(t => t.slice(0, 6).padEnd(7)).join(''));
for (const a of list) console.log(a.padEnd(12) + opp.map(b => { let w = 0; for (let s = 1; s <= 3; s++) if (duel(a, b, 2400, s) === 0) w++; return String(Math.round(w / 3 * 100)).padEnd(7); }).join(''));
