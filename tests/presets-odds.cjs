/* node tests/presets-odds.cjs — how often each side wins every preset (close battles are more fun to watch) */
require('../js/data.js'); require('../js/scenario.js'); require('../js/sim.js'); require('../js/labcore.js');
const AB = globalThis.AB, ids = process.argv[2] ? process.argv[2].split(',') : ['field', 'river', 'siege', 'ffa', 'knights', 'ele'];
for (const id of ids) { const sc = AB.Scenario.preset(id), cnt = {}; for (let i = 0; i < 10; i++) { const r = AB.LabCore.run(sc, 9000 + i * 7919, 420); cnt[r.w] = (cnt[r.w] || 0) + 1; } console.log(id.padEnd(8), JSON.stringify(cnt)); }
