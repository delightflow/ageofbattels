/* node tests/bench.cjs — step cost with ~2900 units */
require('../js/data.js'); require('../js/scenario.js'); require('../js/sim.js');
const AB = globalThis.AB, S = AB.Scenario;
const sc = S.create(96, 96, 0); sc.players[1].team = 1;
for (let i = 0; i < 6; i++) { S.group(sc, 0, ['swordsman', 'archer', 'knight', 'spearman', 'crossbow', 'levy'][i], 250, -0.25 - (i % 2) * 0.1, (i - 2.5) * 0.12, 1); S.group(sc, 1, ['manatarms', 'archer', 'lightcav', 'pikeman', 'skirmisher', 'levy'][i], 250, 0.25 + (i % 2) * 0.1, (i - 2.5) * 0.12, -1); }
const sim = new AB.Sim(sc, { seed: 3 }); let worst = 0;
for (let k = 0; k < 6; k++) { const t0 = process.hrtime.bigint(); const n0 = sim.ents.length; for (let i = 0; i < 100 && !sim.over; i++) { sim.step(); sim.events.length = 0; } const ms = Number(process.hrtime.bigint() - t0) / 1e8; worst = Math.max(worst, ms); console.log(`t=${sim.time.toFixed(0)}s units=${n0} step=${ms.toFixed(2)}ms`); }
