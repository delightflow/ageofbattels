/* Age of Battels — headless battle runs shared by the lab worker and the page (fallback). DOM-free. */
(function (G) {
'use strict';
const AB = G.AB;
const C = AB.LabCore = {
  // one duel on an open field; returns { w: 0 | 1 | -1, a, b, na, nb, t }
  duel(a, b, mode, n, seed) {
    const S = AB.Scenario, sc = S.create(44, 44, 0); sc.players[1].team = 1;
    const na = mode === 'cost' ? Math.max(1, Math.round(n / AB.UNITS[a].cost)) : n, nb = mode === 'cost' ? Math.max(1, Math.round(n / AB.UNITS[b].cost)) : n;
    S.formation(sc, a, 0, 14, 30, na, 1, -1, 0); S.formation(sc, b, 1, 30, 14, nb, -1, 1, 0);
    return C.run(sc, seed, 300, (sim) => { const left = [0, 0]; for (const e of sim.ents) if (!e.bld) left[e.p]++; return { a: left[0], b: left[1], na: sc.units.filter(u => u.p === 0).length, nb: sc.units.filter(u => u.p === 1).length }; });
  },
  // run a scenario to the end (or the time limit); extra(sim) adds fields to the result
  run(sc, seed, limit, extra) {
    const sim = new AB.Sim(sc, { seed }), max = (limit || 600) / AB.DT; let n = 0;
    while (!sim.over && n++ < max) { sim.step(); sim.events.length = 0; }
    return Object.assign({ w: sim.over ? sim.winner : -1, t: sim.time }, extra ? extra(sim) : {});
  },
  // a whole job, reporting progress after each run
  job(msg, progress) {
    const out = [], f0 = msg.from || 0;
    if (msg.type === 'duel') {
      for (let i = 0; i < msg.runs; i++) { out.push(C.duel(msg.a, msg.b, msg.mode, msg.n, 1000 + (f0 + i) * 7919)); progress(i + 1, msg.runs); }
    } else if (msg.type === 'chart') {
      const list = msg.list, tot = list.length * msg.runs; let k = 0;
      for (const b of list) { let w = 0, l = 0; for (let i = 0; i < msg.runs; i++) { const r = C.duel(msg.a, b, 'cost', msg.n, 500 + (f0 + i) * 7919); if (r.w === 0) w++; else if (r.w === 1) l++; progress(++k, tot); } out.push({ b, w, l, runs: msg.runs }); }
    } else if (msg.type === 'odds') {
      const sc = AB.Scenario.unpack(msg.sc);
      for (let i = 0; i < msg.runs; i++) { out.push(C.run(sc, 9000 + (f0 + i) * 7919, 420)); progress(i + 1, msg.runs); }
    }
    return out;
  },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
