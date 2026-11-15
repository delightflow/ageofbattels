/* Age of Battles — headless battle runs shared by the lab worker and the page (fallback). DOM-free. */
(function (G) {
'use strict';
const AB = G.AB;
const C = AB.LabCore = {
  // one duel on an open field; returns { w: 0 | 1 | -1, a, b, na, nb, t }
  // an open field sized to the armies, so big fights have room to manoeuvre (ranged units need space to fall back)
  arena(a, b, na, nb) {
    const S = AB.Scenario, size = Math.round(Math.min(96, Math.max(44, 22 + Math.sqrt(na + nb) * 4))), sc = S.create(size, size, 0), c = size / 2;
    sc.players[1].team = 1; S.formation(sc, a, 0, c - 8, c + 8, na, 1, -1, 0); S.formation(sc, b, 1, c + 8, c - 8, nb, -1, 1, 0); return sc;
  },
  counts(a, b, mode, n) { return mode === 'cost' ? [Math.max(1, Math.round(n / AB.UNITS[a].cost)), Math.max(1, Math.round(n / AB.UNITS[b].cost))] : [n, n]; },
  duel(a, b, mode, n, seed) {
    const [na, nb] = C.counts(a, b, mode, n), sc = C.arena(a, b, na, nb);
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
