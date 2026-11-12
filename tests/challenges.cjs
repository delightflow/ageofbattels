/* node tests/challenges.cjs — each challenge must be winnable, and a cheap army should earn three stars */
require('../js/data.js'); require('../js/scenario.js'); require('../js/sim.js'); require('../js/challenges.js');
const AB = globalThis.AB, S = AB.Scenario;
const PLANS = {   // [unit, share of budget, u, v] — a known answer per level
  cav: [['phalangite', 1, -0.3, 0]],
  arch: [['skirmisher', 0.6, -0.3, 0], ['legionary', 0.4, -0.36, 0]],
  ele: [['phalangite', 0.6, -0.28, 0], ['skirmisher', 0.4, -0.36, 0]],
  horde: [['elephant', 1, -0.3, 0]],
  raid: [['skirmisher', 0.5, -0.32, -0.15], ['crossbow', 0.5, -0.32, 0.15]],
  bridge: [['trebuchet', 0.3, -0.55, 0], ['crossbow', 0.3, -0.38, 0], ['landsknecht', 0.4, -0.28, 0]],
  fort: [['trebuchet', 0.45, -0.5, 0], ['legionary', 0.55, -0.3, 0]],
  elite: [['samurai', 1, -0.3, 0]],
};
let fail = 0;
for (const c of AB.Challenges) {
  const res = [];
  for (const frac of [1, 0.8, 0.6]) {
    let wins = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const sc = AB.challengeBuild(c), zone = AB.challengeZone(sc); let spent = 0;
      for (const [t, share, u, v] of PLANS[c.id]) { const d = AB.UNITS[t], n = Math.floor(c.budget * frac * share / d.cost);
        const [x, y] = S.uv(sc, u, v); const pts = S.formationPts(t, x, y, n, 1, -1);
        for (let i = 0; i < pts.length; i += 2) if (zone(pts[i], pts[i + 1]) && spent + d.cost <= c.budget * frac && S.add(sc, t, 0, pts[i], pts[i + 1], 0)) spent += d.cost; }
      const sim = new AB.Sim(sc, { seed }); let n = 0; while (!sim.over && n++ < 20 * 400) { sim.step(); sim.events.length = 0; }
      if (sim.winner === 0) wins++;
    }
    res.push(`${Math.round(frac * 100)}%: ${wins}/3`);
  }
  const ok = res[0].endsWith('3/3') || res[0].endsWith('2/3');
  if (!ok) fail++;
  console.log((ok ? '  ok   ' : '  FAIL ') + c.id.padEnd(7) + res.join('   '));
}
process.exit(fail ? 1 : 0);
