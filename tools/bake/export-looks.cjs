/* node tools/bake/export-looks.cjs > tools/bake/looks.json — unit and building looks for the Blender baker */
require('../../js/data.js');
const AB = globalThis.AB, out = {};
for (const [id, d] of Object.entries(AB.UNITS)) out[id] = { look: d.look, cat: d.cat, bld: !!d.bld, size: d.size || 1, r: d.r, proj: d.proj || null, wind: d.wind };
process.stdout.write(JSON.stringify(out, null, 1));
