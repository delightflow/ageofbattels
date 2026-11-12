/* Age of Battels — runs lab jobs off the main thread. */
importScripts('data.js', 'scenario.js', 'sim.js', 'labcore.js');
let cancelled = -1;
onmessage = function (ev) {
  const msg = ev.data;
  if (msg.cancel != null) { cancelled = msg.cancel; return; }
  let last = 0;
  try {
    const res = AB.LabCore.job(msg, (i, n) => { const now = Date.now(); if (now - last > 120 || i === n) { last = now; postMessage({ id: msg.id, progress: i / n }); } });
    postMessage({ id: msg.id, done: true, res });
  } catch (e) { postMessage({ id: msg.id, error: String(e && e.message || e) }); }
};
