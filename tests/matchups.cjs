const assert = require('assert');
const { UNIT_TYPES, getMatchupMultiplier } = require('../js/units.js');

const ids = new Set();
for (const unit of UNIT_TYPES) {
  assert.ok(!ids.has(unit.id), `duplicate id ${unit.id}`);
  ids.add(unit.id);
  for (const key of ['name', 'short', 'era', 'civ', 'weapon', 'armorName', 'blurb']) {
    assert.equal(typeof unit[key].en, 'string', `${unit.id} ${key} en`);
    assert.equal(typeof unit[key].ko, 'string', `${unit.id} ${key} ko`);
    assert.ok(unit[key].en.length > 2, `${unit.id} ${key} en short`);
  }
}

function around(attacker, defender, low, high) {
  const value = getMatchupMultiplier(attacker, defender);
  assert.ok(value >= low && value <= high, `${attacker} vs ${defender} = ${value}, expected ${low}..${high}`);
}

around('pikeman', 'knight', 2.2, 3);
around('knight', 'pikeman', 0.3, 0.7);
around('knight', 'archer', 1.8, 2.6);
around('longbow', 'knight', 1.6, 2.2);
around('shieldman', 'cavalry', 1.3, 1.8);
around('crossbow', 'manatarms', 1.4, 2);
around('camelrider', 'knight', 1.5, 2.2);
around('warelephant', 'pikeman', 0.3, 0.7);
around('pikeman', 'warelephant', 2.2, 3);
around('skirmisher', 'archer', 1.4, 2);
around('ram', 'knight', 0.3, 0.5);
around('monk', 'swordsman', 0, 0);
around('janissary', 'cataphract', 1.4, 2.4);
around('slinger', 'archer', 1.3, 1.8);
around('huscarl', 'longbow', 1.2, 1.6);

assert.equal(UNIT_TYPES.length >= 28, true);
console.log(`matchups ok (${UNIT_TYPES.length} units)`);
