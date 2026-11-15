/* node tests/melee-feel.cjs — how "rubby" melee looks: drift of fighting units that are not walking */
require('../js/data.js'); require('../js/scenario.js'); require('../js/sim.js');
const AB = globalThis.AB, S = AB.Scenario;
const sc = S.create(40, 40, 0); sc.players[1].team = 1;
S.formation(sc, 'swordsman', 0, 15, 25, 40, 1, -1, 0); S.formation(sc, 'swordsman', 1, 25, 15, 40, -1, 1, 0);
const sim = new AB.Sim(sc, { seed: 3 }); let drift = 0, rub = 0, n = 0, rn = 0, flips = 0, hits = 0, kb = 0;
const last = new Map();
for (let i = 0; i < 20 * 40 && !sim.over; i++) {
  sim.step();
  for (const ev of sim.events) if (ev.k === 'hit') hits++;
  sim.events.length = 0;
  for (const e of sim.ents) {
    const t = e.tgt; if (!t || t.dead || sim.gap(e, t) > e.d.rng + 0.05) continue;     // engaged in melee
    const d = Math.hypot(e.x - e.px, e.y - e.py); drift += d; n++;
    if (!e.kx && !e.ky && e.sw <= 0 && Math.abs(sim.time - e.atkT - e.d.wind) > 0.06) { rub += d; rn++; }   // motion that is neither a blow nor a knockback
    const f = Math.sign(e.fx - e.fy), l = last.get(e); if (l !== undefined && l !== f) flips++; last.set(e, f);
  }
}
console.log('engaged unit-ticks', n, '| all motion', (drift / n * 1000).toFixed(1), 'mtile/tick | idle sliding', (rub / rn * 1000).toFixed(1), 'mtile/tick | facing flips per 100 ticks', (flips / n * 100).toFixed(2), '| hits', hits, '| time', sim.time.toFixed(0) + 's');
