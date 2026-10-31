// Battle modes: budget draft, historical scenarios, wagers, and a short campaign.
const BUDGET = 360;
const UNIT_COST = {
  swordsman: 28, spearman: 16, shieldman: 26, pikeman: 24,
  manatarms: 30, huscarl: 32, samurai: 34,
  archer: 18, longbow: 26, crossbow: 28, skirmisher: 12, slinger: 10,
  repeater: 22, handcannoneer: 36, janissary: 38,
  cavalry: 36, knight: 56, cataphract: 60, horsearcher: 40, camelrider: 38, chariot: 44,
  warelephant: 84, towelephant: 78,
  mangonel: 52, catapult: 70, scorpion: 40, ram: 34,
  monk: 20, signifer: 22
};
UNIT_TYPES.forEach((unit) => { unit.cost = UNIT_COST[unit.id] || 20; });

const SCENARIOS = [
  {
    id: 'cannae', year: '216 BCE', star3: 'horse',
    name: { en: 'Cannae', ko: '칸나이' },
    side: { en: 'Carthage', ko: '카르타고' },
    foe: { en: 'Rome', ko: '로마' },
    briefing: {
      en: 'On 2 August 216 BCE Hannibal let the Roman center push his Iberian and Gallic foot back, then closed the wings. Cavalry and the African infantry enveloped a larger legionary army. Carthage won the field and still lost the war.',
      ko: '기원전 216년 8월 2일, 한니발은 로마 중앙이 이베리아·갈리아 보병을 밀어 넣게 둔 뒤 양 날개를 닫았다. 기병과 아프리카 보병이 더 큰 군단을 포위했다. 카르타고는 들판에서 이겼고, 전쟁에서는 졌다.'
    },
    history: {
      en: 'History: Hannibal destroyed the Roman army that day.',
      ko: '역사: 한니발은 그날 로마군을 무너뜨렸다.'
    },
    red: ['cavalry','cavalry','cavalry','horsearcher','horsearcher','spearman','spearman','spearman','swordsman','swordsman','swordsman','signifer'],
    blue: ['swordsman','swordsman','swordsman','swordsman','swordsman','swordsman','spearman','spearman','cavalry','cavalry']
  },
  {
    id: 'gaugamela', year: '331 BCE', star3: 'companions',
    name: { en: 'Gaugamela', ko: '가우가멜라' },
    side: { en: 'Macedon', ko: '마케도니아' },
    foe: { en: 'Persia', ko: '페르시아' },
    briefing: {
      en: 'On 1 October 331 BCE Darius III leveled the ground at Gaugamela for scythed chariots. Alexander led the Companion cavalry into a gap near the king. Darius fled, and the Achaemenid line came apart.',
      ko: '기원전 331년 10월 1일, 다리우스 3세는 가우가멜라의 땅을 낫전차에 맞게 고르게 했다. 알렉산드로스는 왕 옆의 틈으로 컴파니온 기병을 넣었다. 다리우스는 달아났고 아케메네스 전열은 무너졌다.'
    },
    history: {
      en: 'History: Alexander broke Darius’s army and took the field.',
      ko: '역사: 알렉산드로스는 다리우스의 군대를 깨고 들판을 차지했다.'
    },
    red: ['pikeman','pikeman','pikeman','shieldman','shieldman','knight','knight','knight','cavalry','archer','signifer'],
    blue: ['spearman','spearman','spearman','archer','archer','archer','cavalry','cavalry','chariot','chariot','camelrider','shieldman']
  },
  {
    id: 'hastings', year: '1066', star3: 'knight',
    name: { en: 'Hastings', ko: '헤이스팅스' },
    side: { en: 'Normandy', ko: '노르망디' },
    foe: { en: 'England', ko: '잉글랜드' },
    briefing: {
      en: 'On 14 October 1066 William’s knights and archers could not break Harold’s shield wall on Senlac Hill. A retreat, real or feigned, drew the English down. The wall split, and Harold was killed. Normandy took the crown.',
      ko: '1066년 10월 14일, 윌리엄의 기사와 궁수는 센락 언덕의 해럴드 방패벽을 바로 깨지 못했다. 진짜든 거짓이든 후퇴가 잉글랜드군을 언덕 아래로 끌어냈다. 벽이 갈라지고 해럴드는 죽었다. 노르망디가 왕관을 가져갔다.'
    },
    history: {
      en: 'History: William won after the English line left the hill.',
      ko: '역사: 잉글랜드 전열이 언덕을 버린 뒤 윌리엄이 이겼다.'
    },
    red: ['knight','knight','knight','knight','archer','archer','archer','manatarms','manatarms','signifer'],
    blue: ['huscarl','huscarl','huscarl','huscarl','spearman','spearman','spearman','spearman','manatarms','manatarms']
  },
  {
    id: 'agincourt', year: '1415', star3: 'longbow', slowMounted: 'blue',
    name: { en: 'Agincourt', ko: '아쟁쿠르' },
    side: { en: 'England', ko: '잉글랜드' },
    foe: { en: 'France', ko: '프랑스' },
    briefing: {
      en: 'On 25 October 1415 Henry V’s smaller English host, thick with longbowmen, faced French men-at-arms in heavy mud. Arrows broke the advance, and the press of French numbers finished their own charge. England won.',
      ko: '1415년 10월 25일, 장궁병이 많은 헨리 5세의 작은 잉글랜드군이 진흙 속의 프랑스 중장을 맞았다. 화살이 전진을 흐트러뜨렸고, 프랑스의 머릿수가 자기 돌격을 짓눌렀다. 잉글랜드가 이겼다.'
    },
    history: {
      en: 'History: the longbow and the mud beat the larger French host.',
      ko: '역사: 장궁과 진흙이 더 큰 프랑스군을 이겼다.'
    },
    red: ['longbow','longbow','longbow','longbow','longbow','longbow','manatarms','manatarms','knight'],
    blue: ['knight','knight','knight','knight','knight','manatarms','manatarms','manatarms','crossbow','crossbow']
  },
  {
    id: 'nagashino', year: '1575', star3: 'guns',
    name: { en: 'Nagashino', ko: '나가시노' },
    side: { en: 'Oda and Tokugawa', ko: '오다·도쿠가와' },
    foe: { en: 'Takeda', ko: '다케다' },
    briefing: {
      en: 'In June 1575 Oda Nobunaga and Tokugawa Ieyasu met Takeda Katsuyori’s cavalry at Nagashino. Palisades and rotating arquebus volleys broke the charge. The Oda–Tokugawa army won.',
      ko: '1575년 6월, 오다 노부나가와 도쿠가와 이에야스는 나가시노에서 다케다 가쓰요리의 기병을 맞았다. 목책과 교대 사격이 돌격을 끊었다. 오다·도쿠가와가 이겼다.'
    },
    history: {
      en: 'History: gunfire behind stakes stopped the Takeda horse.',
      ko: '역사: 목책 뒤의 총화가 다케다 기병을 멈췄다.'
    },
    red: ['handcannoneer','handcannoneer','handcannoneer','handcannoneer','spearman','spearman','spearman','samurai','samurai','signifer'],
    blue: ['cavalry','cavalry','cavalry','cavalry','knight','knight','samurai','samurai','archer','horsearcher']
  },
  {
    id: 'fei', year: '383', star3: 'hold',
    name: { en: 'Fei River', ko: '비수' },
    side: { en: 'Eastern Jin', ko: '동진' },
    foe: { en: 'Former Qin', ko: '전진' },
    briefing: {
      en: 'In 383 CE Fu Jian’s Former Qin host far outnumbered the Eastern Jin. Jin asked to fight once Qin drew back from the river. The withdrawal turned into panic. The smaller Jin army won.',
      ko: '383년, 부견의 전진은 동진보다 훨씬 많았다. 동진은 전진이 강에서 물러선 뒤에 싸우자고 했다. 후퇴는 공황이 되었다. 적은 동진이 이겼다.'
    },
    history: {
      en: 'History: the outnumbered Jin army won when Qin’s retreat broke.',
      ko: '역사: 수적 열세의 동진이, 전진의 후퇴가 무너지며 이겼다.'
    },
    red: ['spearman','spearman','spearman','archer','archer','crossbow','crossbow','cavalry','cavalry','signifer'],
    blue: ['spearman','spearman','spearman','spearman','archer','archer','archer','cavalry','cavalry','shieldman','shieldman','swordsman']
  }
];

const CAMPAIGN_FIELDS = [
  {
    name: { en: 'The road ward', ko: '길목' },
    blurb: { en: 'Slingers and light horse test the company on the march.', ko: '투석병과 경기병이 행군을 떠본다.' },
    blue: ['slinger','slinger','skirmisher','skirmisher','cavalry','cavalry','archer','spearman','spearman']
  },
  {
    name: { en: 'The ford', ko: '여울' },
    blurb: { en: 'Spears and bows hold the far bank.', ko: '창과 활이 건너편 둑을 지킨다.' },
    blue: ['spearman','spearman','spearman','shieldman','archer','archer','longbow','cavalry']
  },
  {
    name: { en: 'Open country', ko: '열린 들' },
    blurb: { en: 'Horsemen own this ground. Pikes earn their keep.', ko: '기병이 이 들판을 쥔다. 장창이 값을 한다.' },
    blue: ['cavalry','cavalry','knight','knight','horsearcher','camelrider','spearman','archer']
  },
  {
    name: { en: 'The palisade', ko: '목책' },
    blurb: { en: 'Arquebuses wait behind stakes.', ko: '화승총이 말뚝 뒤에 기다린다.' },
    blue: ['handcannoneer','handcannoneer','handcannoneer','spearman','spearman','samurai','samurai','archer']
  },
  {
    name: { en: 'Stone and timber', ko: '돌과 목재' },
    blurb: { en: 'Engines have the range. Close quickly.', ko: '공성 병기가 사거리를 쥔다. 빨리 붙어야 한다.' },
    blue: ['mangonel','scorpion','scorpion','pikeman','pikeman','archer','shieldman','swordsman']
  },
  {
    name: { en: 'The last field', ko: '마지막 들판' },
    blurb: { en: 'A mixed host. What remains is the dice.', ko: '섞인 진영이다. 남은 것은 주사위다.' },
    blue: ['swordsman','swordsman','pikeman','longbow','longbow','knight','knight','horsearcher','signifer','manatarms']
  }
];
const COMPANY_SEED = ['signifer','swordsman','swordsman','swordsman','spearman','spearman','spearman','archer','archer','cavalry','cavalry','pikeman'];
const SHOP = ['spearman','archer','pikeman','longbow','cavalry','knight','handcannoneer','huscarl'];
const SHORT_PATH = [0, 1, 5];

let purse = 120;
let budgetLeft = BUDGET;
let spareGold = 0;
let difficulty = 'steady';
let currentScenario = null;
let scenarioCap = 0;
let campaign = null;
let sheetMode = '';
let pendingWager = null;
let wagerReport = null;
let rewardsDone = false;
let diceMoments = [];
let graphSamples = [];
let graphTick = 0;
let graphBase = null;
let drama = 0;
let duel = null;
let duelUsed = false;
let finalMoment = false;
let campaignCommitted = false;

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}
function loadPurse() {
  const raw = localStorage.getItem('aob-purse');
  const n = Number(raw);
  purse = raw != null && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 120;
  const el = document.getElementById('purse-readout');
  if (el) el.textContent = String(purse);
}
function savePurse() {
  localStorage.setItem('aob-purse', String(purse));
  const el = document.getElementById('purse-readout');
  if (el) el.textContent = String(purse);
}
function loadStars() { return loadJson('aob-stars', {}); }
function saveStar(id, n) {
  const all = loadStars();
  all[id] = Math.max(all[id] || 0, n);
  localStorage.setItem('aob-stars', JSON.stringify(all));
}
function loadCampaign() { return loadJson('aob-campaign', null); }
function saveCampaign() {
  if (campaign) localStorage.setItem('aob-campaign', JSON.stringify(campaign));
}

function starGlyph(n) {
  const k = Math.max(0, Math.min(3, n || 0));
  return '★★★'.slice(0, k) + '☆☆☆'.slice(0, 3 - k);
}
function sideStrength(team) {
  return units.filter((unit) => unit.team === team).reduce((sum, unit) => {
    return sum + (unit.cost || 20) * (1 + 0.1 * (unit.rank || 0));
  }, 0);
}
function oddsFor(team) {
  const mine = Math.max(1, sideStrength(team));
  const theirs = Math.max(1, sideStrength(team === 'red' ? 'blue' : 'red'));
  return Math.round(Math.max(1.15, Math.min(5, (theirs / mine) * 1.2)) * 100) / 100;
}
function battleHeading() {
  if (playMode === 'scenario' && currentScenario) return field(currentScenario.name);
  if (playMode === 'campaign' && campaign) return field(currentField().name);
  if (playMode === 'budget') return t('budget');
  if (playMode === 'quick') return t('quick');
  if (playMode === 'grand') return t('grand');
  return t('battle');
}
function dramaticMoment(seconds) {
  drama = Math.max(drama, seconds);
}
function currentField() {
  const map = campaign.length === 3 ? SHORT_PATH : CAMPAIGN_FIELDS.map((_, i) => i);
  return CAMPAIGN_FIELDS[map[Math.min(campaign.index, map.length - 1)]];
}
function rememberRoll(info) {
  if (!info || info.tag === 'HIT' || info.tag === 'GLANCE' || info.tag === 'MISS') return;
  const who = field((UNIT_BY_ID[info.id] || {}).short) || info.id;
  diceMoments.unshift(`${who} d${info.sides} ${info.roll} ${t(info.tag.toLowerCase())}`);
  if (diceMoments.length > 4) diceMoments.pop();
}
function pushGraphSample() {
  if (!graphBase) return;
  const hp = (team) => units.filter((unit) => unit.team === team && unit.alive).reduce((sum, unit) => sum + Math.max(0, unit.currentHp), 0);
  graphSamples.push({
    r: hp('red') / graphBase.red,
    b: hp('blue') / graphBase.blue
  });
  if (graphSamples.length > 180) graphSamples.shift();
}
function beginGraph() {
  const hp = (team) => units.filter((unit) => unit.team === team).reduce((sum, unit) => sum + unit.maxHp, 0);
  graphBase = { red: Math.max(1, hp('red')), blue: Math.max(1, hp('blue')) };
  graphSamples = [{ r: 1, b: 1 }];
  graphTick = 0;
}
function resetModeBattle() {
  wagerReport = null;
  rewardsDone = false;
  diceMoments = [];
  duel = null;
  duelUsed = false;
  finalMoment = false;
  drama = 0;
  campaignCommitted = false;
  units.forEach((unit) => { unit.dueling = false; unit.duelImmune = false; });
}

function placeHost(entries, team) {
  const cols = 4;
  entries.forEach((entry, index) => {
    const id = typeof entry === 'string' ? entry : entry.id;
    const rank = typeof entry === 'string' ? 0 : (entry.rank || 0);
    const def = UNIT_BY_ID[id];
    if (!def) return;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const y = WORLD_HEIGHT / 2 - 160 + row * 92;
    const x = (team === 'red' ? WORLD_WIDTH / 2 - 500 : WORLD_WIDTH / 2 + 150) + col * 88;
    spawnUnit(def, team, x, y);
    const unit = units[units.length - 1];
    unit.rank = rank;
    if (rank > 0) {
      unit.maxHp = Math.round(unit.maxHp * (1 + 0.08 * rank));
      unit.currentHp = unit.maxHp;
      unit.atk = Math.round((unit.atk || 0) * (1 + 0.06 * rank));
    }
    if (currentScenario && currentScenario.slowMounted === team && (unit.tags || []).includes('mounted')) {
      unit.speed = Math.round(unit.speed * 0.75 * 100) / 100;
    }
  });
}

function roleOf(unit) {
  if (unit.group === 'engine' || unit.group === 'support') return 'special';
  return unit.group || 'foot';
}
function draftOpponent(budget, level) {
  const counts = { foot: 0, missile: 0, mounted: 0, special: 0 };
  units.filter((unit) => unit.team === 'red').forEach((unit) => { counts[roleOf(unit)] += 1; });
  const weights = { foot: 3, missile: 2, mounted: 2, special: 1 };
  const catalogs = {
    foot: ['spearman', 'pikeman', 'shieldman', 'swordsman', 'manatarms', 'huscarl'],
    missile: ['archer', 'skirmisher', 'slinger', 'longbow', 'crossbow'],
    mounted: ['cavalry', 'horsearcher', 'camelrider', 'knight'],
    special: ['signifer', 'scorpion', 'mangonel', 'monk']
  };
  if (level === 'bold') {
    weights.mounted = 4;
    weights.special = 2;
    catalogs.mounted = ['knight', 'cataphract', 'cavalry', 'horsearcher', 'warelephant'];
    catalogs.special = ['mangonel', 'catapult', 'signifer'];
  }
  if (level === 'cunning') {
    if (counts.mounted > counts.foot) {
      weights.foot += 5;
      catalogs.foot = ['pikeman', 'spearman', 'pikeman', 'shieldman', 'spearman'];
    }
    if (counts.missile > 2) {
      weights.mounted += 4;
      catalogs.mounted = ['knight', 'cavalry', 'cataphract', 'horsearcher', 'camelrider'];
    }
    if (counts.foot > counts.missile + 1) {
      weights.missile += 3;
      catalogs.missile = ['longbow', 'crossbow', 'archer', 'handcannoneer', 'slinger'];
    }
  }
  const picked = [];
  let left = budget;
  for (let guard = 0; guard < 48 && picked.length < 16 && left >= 10; guard++) {
    const bag = [];
    Object.keys(weights).forEach((role) => {
      for (let i = 0; i < weights[role]; i++) bag.push(role);
    });
    if (!bag.length) break;
    const role = bag[Math.floor(Math.random() * bag.length)];
    const pool = catalogs[role].filter((id) => {
      const cost = UNIT_BY_ID[id].cost;
      const cap = (id === 'spearman' || id === 'archer') ? 4 : 3;
      return cost <= left && picked.filter((item) => item === id).length < cap;
    });
    if (!pool.length) { weights[role] = 0; continue; }
    const id = pool[Math.floor(Math.random() * pool.length)];
    picked.push(id);
    left -= UNIT_BY_ID[id].cost;
  }
  if (picked.length < 6) ['spearman', 'spearman', 'archer', 'cavalry', 'swordsman', 'pikeman'].forEach((id) => {
    if (picked.length < 8 && UNIT_BY_ID[id].cost <= left) { picked.push(id); left -= UNIT_BY_ID[id].cost; }
  });
  return picked;
}

function formationSlot(team, index) {
  const cols = 4;
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: (team === 'red' ? WORLD_WIDTH / 2 - 500 : WORLD_WIDTH / 2 + 150) + col * 88,
    y: WORLD_HEIGHT / 2 - 160 + row * 92
  };
}
function addBudgetUnit(def) {
  if (playMode !== 'budget' || gameState !== 'placing') return;
  if (budgetLeft < def.cost) return;
  const count = units.filter((unit) => unit.team === 'red').length;
  if (count >= 16) return;
  budgetLeft -= def.cost;
  const spot = formationSlot('red', count);
  spawnUnit(def, 'red', spot.x, spot.y);
  playSound('place', 0.7);
  updateCounts();
  syncModeChrome();
}
function refundLast() {
  const mine = units.filter((unit) => unit.team === 'red');
  const last = mine[mine.length - 1];
  if (!last || gameState !== 'placing') return;
  if (playMode === 'budget') budgetLeft += last.cost || 0;
  if (playMode === 'scenario') {
    if (mine.length <= 8) return;
    spareGold += last.cost || 0;
  }
  units.splice(units.indexOf(last), 1);
  playSound('ui', 0.4);
  updateCounts();
  syncModeChrome();
}
function answerFoe() {
  if (playMode !== 'budget' || gameState === 'battle') return;
  units = units.filter((unit) => unit.team !== 'blue');
  placeHost(draftOpponent(BUDGET, difficulty), 'blue');
  updateCounts();
  playSound('ui', 0.6);
}
function afterFieldCleared() {
  pendingWager = null;
  if (playMode === 'budget') {
    budgetLeft = BUDGET;
    placeHost(draftOpponent(BUDGET, difficulty), 'blue');
    updateCounts();
  }
  syncModeChrome();
}

function syncModeChrome() {
  const bar = document.getElementById('budget-bar');
  if (!bar) return;
  const drafting = playMode === 'budget' || playMode === 'scenario';
  bar.hidden = !drafting;
  const diffs = document.getElementById('diff-row');
  const answer = document.getElementById('btn-answer');
  if (diffs) diffs.hidden = playMode !== 'budget';
  if (answer) answer.hidden = playMode !== 'budget';
  document.getElementById('btn-random').hidden = playMode === 'budget' || playMode === 'scenario' || playMode === 'campaign';
  const caption = document.getElementById('gold-caption');
  const left = document.getElementById('gold-left');
  if (caption) caption.textContent = playMode === 'scenario' ? t('spare') : t('gold');
  if (left) left.textContent = String(playMode === 'scenario' ? spareGold : budgetLeft);
  document.querySelectorAll('#diff-row button').forEach((button) => {
    button.classList.toggle('active', button.dataset.diff === difficulty);
  });
  const locked = playMode === 'budget' || playMode === 'scenario' || playMode === 'campaign';
  const teamRow = document.querySelector('.team-row');
  const teamLabel = document.getElementById('label-placement-team');
  if (teamRow) teamRow.hidden = locked;
  if (teamLabel) teamLabel.hidden = locked;
  const graph = document.getElementById('strength-graph');
  if (graph && gameState === 'placing' && !graphSamples.length) graph.hidden = true;
}

function openSheet() {
  document.getElementById('mode-panel').classList.add('open');
}
function closeSheet() {
  document.getElementById('mode-panel').classList.remove('open');
  sheetMode = '';
}
function setSheet(html, mode) {
  sheetMode = mode;
  document.getElementById('mode-sheet').innerHTML = html;
  openSheet();
}
function sheetActions(extra) {
  return `<div class="sheet-actions">${extra}<button type="button" class="iron" id="sheet-close">${t('close')}</button></div>`;
}
function bindSheetClose() {
  const button = document.getElementById('sheet-close');
  if (button) button.addEventListener('click', () => { closeSheet(); playSound('ui', 0.4); });
}

function renderScenarioList() {
  const stars = loadStars();
  const cards = SCENARIOS.map((scenario) => {
    const best = stars[scenario.id] || 0;
    return `<button type="button" class="scenario-card" data-scenario="${scenario.id}">
      <span class="year">${scenario.year}</span>
      <strong>${field(scenario.name)}</strong>
      <em>${field(scenario.side)} · ${starGlyph(best)}</em>
    </button>`;
  }).join('');
  setSheet(`<h2>${t('scenarios')}</h2><p>${t('scenarioLead')}</p><div class="scenario-list">${cards}</div>${sheetActions('')}`, 'scenarios');
  document.querySelectorAll('.scenario-card').forEach((card) => {
    card.addEventListener('click', () => loadScenario(card.dataset.scenario));
  });
  bindSheetClose();
}
function loadScenario(id) {
  currentScenario = SCENARIOS.find((scenario) => scenario.id === id);
  if (!currentScenario) return;
  playMode = 'scenario';
  selectedTeam = 'red';
  spareGold = 48;
  hideTitle();
  closeSheet();
  clearAll();
  placeHost(currentScenario.red, 'red');
  placeHost(currentScenario.blue, 'blue');
  scenarioCap = currentScenario.red.length + 2;
  updateCounts();
  frameToField();
  openBriefing();
}
function openBriefing() {
  if (!currentScenario) return;
  const scenario = currentScenario;
  setSheet(`<p class="year">${scenario.year}</p><h2>${field(scenario.name)}</h2>
    <p><b>${t('yourSide')}.</b> ${field(scenario.side)} · <b>${t('foe')}.</b> ${field(scenario.foe)}</p>
    <p>${field(scenario.briefing)}</p>
    <p class="history-line">${field(scenario.history)}</p>
    <p>${t('scenarioAdjust')} <b id="spare-read">${spareGold}</b></p>
    ${sheetActions(`<button type="button" class="wax" id="sheet-begin">${t('toWager')}</button>`)}`, 'brief');
  document.getElementById('sheet-begin').addEventListener('click', () => openWager());
  bindSheetClose();
  syncModeChrome();
}
function tryScenarioBuy(def) {
  if (playMode !== 'scenario' || gameState !== 'placing') return false;
  const count = units.filter((unit) => unit.team === 'red').length;
  if (count >= scenarioCap || spareGold < def.cost) return false;
  spareGold -= def.cost;
  const spot = formationSlot('red', count);
  spawnUnit(def, 'red', spot.x, spot.y);
  playSound('place', 0.7);
  updateCounts();
  syncModeChrome();
  const read = document.getElementById('spare-read');
  if (read) read.textContent = String(spareGold);
  return true;
}

function enterBudget() {
  playMode = 'budget';
  difficulty = 'steady';
  selectedTeam = 'red';
  currentScenario = null;
  hideTitle();
  closeSheet();
  clearAll();
  frameToField();
}
function openCampaignMenu() {
  const saved = loadCampaign();
  const resume = saved ? `<button type="button" class="wax" id="camp-resume">${t('continueCamp')}</button>` : '';
  setSheet(`<h2>${t('campaign')}</h2><p>${t('campaignLead')}</p>
    <div class="sheet-actions">
      ${resume}
      <button type="button" class="iron" id="camp-short">${t('campaignShort')}</button>
      <button type="button" class="iron" id="camp-long">${t('campaignLong')}</button>
    </div>
    <p class="history-line">${t('campaignTime')}</p>
    ${sheetActions('')}`, 'campaign-menu');
  const resumeBtn = document.getElementById('camp-resume');
  if (resumeBtn) resumeBtn.addEventListener('click', () => resumeCampaign(saved));
  document.getElementById('camp-short').addEventListener('click', () => startCampaign(3));
  document.getElementById('camp-long').addEventListener('click', () => startCampaign(6));
  bindSheetClose();
}
function startCampaign(length) {
  campaign = {
    length,
    index: 0,
    gold: 40,
    wins: 0,
    roster: COMPANY_SEED.map((id) => ({ id, rank: 0 }))
  };
  saveCampaign();
  playMode = 'campaign';
  hideTitle();
  openCamp();
}
function resumeCampaign(saved) {
  campaign = saved;
  playMode = 'campaign';
  hideTitle();
  if (campaign.index >= campaign.length) openCampaignEnd();
  else openCamp();
}
function openCamp() {
  if (!campaign) return;
  const battleField = currentField();
  const roster = campaign.roster.map((soldier, index) => {
    const def = UNIT_BY_ID[soldier.id];
    const rank = soldier.rank ? ` · ${t('veteran')} ${soldier.rank}` : '';
    return `<li>${field(def.short)}${rank} <button type="button" data-drop="${index}" class="texty">${t('release')}</button></li>`;
  }).join('');
  const shop = SHOP.map((id) => {
    const def = UNIT_BY_ID[id];
    return `<button type="button" class="shop-btn" data-buy="${id}">${field(def.short)} · ${def.cost}</button>`;
  }).join('');
  setSheet(`<p class="year">${t('field')} ${campaign.index + 1} / ${campaign.length}</p>
    <h2>${field(battleField.name)}</h2>
    <p>${field(battleField.blurb)}</p>
    <p><b>${t('gold')}.</b> ${campaign.gold} · <b>${t('company')}.</b> ${campaign.roster.length}</p>
    <ul class="roster">${roster}</ul>
    <div class="shop">${shop}</div>
    ${sheetActions(`<button type="button" class="wax" id="sheet-march">${t('march')}</button>`)}`, 'camp');
  document.querySelectorAll('[data-buy]').forEach((button) => {
    button.addEventListener('click', () => buyRecruit(button.dataset.buy));
  });
  document.querySelectorAll('[data-drop]').forEach((button) => {
    button.addEventListener('click', () => releaseRecruit(Number(button.dataset.drop)));
  });
  document.getElementById('sheet-march').addEventListener('click', march);
  bindSheetClose();
  syncModeChrome();
}
function buyRecruit(id) {
  const def = UNIT_BY_ID[id];
  if (!campaign || campaign.roster.length >= 16 || campaign.gold < def.cost) return;
  campaign.gold -= def.cost;
  campaign.roster.push({ id, rank: 0 });
  saveCampaign();
  playSound('place', 0.5);
  openCamp();
}
function releaseRecruit(index) {
  if (!campaign || campaign.roster.length <= 6) return;
  const soldier = campaign.roster[index];
  if (!soldier) return;
  campaign.gold += Math.round((UNIT_BY_ID[soldier.id].cost || 0) * 0.5);
  campaign.roster.splice(index, 1);
  saveCampaign();
  openCamp();
}
function march() {
  if (!campaign) return;
  closeSheet();
  playMode = 'campaign';
  currentScenario = null;
  clearAll();
  placeHost(campaign.roster, 'red');
  placeHost(currentField().blue, 'blue');
  updateCounts();
  frameToField();
  openWager();
}
function openCampaignEnd() {
  setSheet(`<h2>${t('companyRests')}</h2><p>${t('campaignEnd')} ${campaign.wins} / ${campaign.length}.</p>${sheetActions(`<button type="button" class="wax" id="sheet-title">${t('backTitle')}</button>`)}`, 'end');
  document.getElementById('sheet-title').addEventListener('click', () => {
    closeSheet();
    document.getElementById('btn-title').click();
  });
  bindSheetClose();
}
function commitCampaign(winner) {
  if (playMode !== 'campaign' || !campaign || campaignCommitted) return;
  campaignCommitted = true;
  const lived = units.filter((unit) => unit.team === 'red' && unit.alive).map((unit) => ({
    id: unit.id,
    rank: Math.min(3, (unit.rank || 0) + (winner === 'RED' ? 1 : 0))
  }));
  const roster = lived.length ? lived : [];
  while (roster.length < 6) roster.push({ id: 'spearman', rank: 0 });
  campaign.roster = roster.slice(0, 16);
  campaign.gold += (winner === 'RED' ? 80 : 36) + campaign.roster.length * 4;
  if (winner === 'RED') campaign.wins += 1;
  campaign.index += 1;
  saveCampaign();
}
function campaignAdvance(winner) {
  if (!campaign) return;
  commitCampaign(winner);
  document.getElementById('result').classList.remove('open');
  if (campaign.index >= campaign.length) openCampaignEnd();
  else openCamp();
}

function openWager() {
  const reds = units.some((unit) => unit.team === 'red');
  const blues = units.some((unit) => unit.team === 'blue');
  if (!reds || !blues || gameState === 'battle') return;
  const redOdds = oddsFor('red');
  const blueOdds = oddsFor('blue');
  const maxStake = Math.max(0, purse);
  setSheet(`<h2>${t('wagerTitle')}</h2>
    <p>${t('wagerLead')}</p>
    <p class="odds-row"><b>RED</b> ${sideStrength('red').toFixed(0)} · ${redOdds.toFixed(2)}×
      &nbsp; <b>BLUE</b> ${sideStrength('blue').toFixed(0)} · ${blueOdds.toFixed(2)}×</p>
    <p><b>${t('purse')}.</b> ${purse}</p>
    <div class="sheet-actions">
      <button type="button" class="iron" id="bet-red">RED</button>
      <button type="button" class="iron" id="bet-blue">BLUE</button>
    </div>
    <div class="speed-row"><label for="stake">${t('stake')}</label>
      <input id="stake" type="range" min="0" max="${maxStake}" step="${maxStake > 40 ? 10 : 1}" value="0">
      <span id="stake-read">0</span>
    </div>
    <p class="history-line" id="payout-line">${t('noStake')}</p>
    ${sheetActions(`<button type="button" class="wax" id="sheet-fight">${t('beginFight')}</button>`)}`, 'wager');
  let pick = sideStrength('red') >= sideStrength('blue') ? 'red' : 'blue';
  const paint = () => {
    document.getElementById('bet-red').classList.toggle('active', pick === 'red');
    document.getElementById('bet-blue').classList.toggle('active', pick === 'blue');
    const stake = Number(document.getElementById('stake').value);
    document.getElementById('stake-read').textContent = String(stake);
    const odds = pick === 'red' ? redOdds : blueOdds;
    const nextPurse = purse - stake + Math.round(stake * odds);
    document.getElementById('payout-line').textContent = stake > 0
      ? `${t('ifWin')} ${nextPurse}`
      : t('noStake');
  };
  document.getElementById('bet-red').addEventListener('click', () => { pick = 'red'; paint(); });
  document.getElementById('bet-blue').addEventListener('click', () => { pick = 'blue'; paint(); });
  document.getElementById('stake').addEventListener('input', paint);
  document.getElementById('sheet-fight').addEventListener('click', () => {
    const stake = Math.min(purse, Number(document.getElementById('stake').value) || 0);
    pendingWager = stake > 0 ? { team: pick, stake, odds: pick === 'red' ? redOdds : blueOdds } : null;
    closeSheet();
    startBattle();
  });
  bindSheetClose();
  paint();
}
function settleWager(winner) {
  if (wagerReport) return wagerReport;
  if (!pendingWager) {
    wagerReport = null;
    return null;
  }
  const before = purse;
  const side = pendingWager.team === 'red' ? 'RED' : 'BLUE';
  if (winner === side) purse += Math.round(pendingWager.stake * (pendingWager.odds - 1));
  else if (winner !== 'DRAW') purse -= pendingWager.stake;
  purse = Math.max(0, purse);
  savePurse();
  wagerReport = { before, after: purse, won: winner === side, stake: pendingWager.stake, team: side };
  return wagerReport;
}
function rateScenario(winner, redLeft) {
  if (!currentScenario || winner !== 'RED') return 0;
  const reds = units.filter((unit) => unit.team === 'red');
  const ratio = redLeft / Math.max(1, reds.length);
  let stars = 1;
  if (ratio >= 0.4) stars = 2;
  const killsOf = (id) => reds.filter((unit) => unit.id === id).reduce((sum, unit) => sum + unit.killCount, 0);
  const horse = reds.filter((unit) => (unit.tags || []).includes('horse')).reduce((sum, unit) => sum + unit.killCount, 0);
  const rest = reds.filter((unit) => !(unit.tags || []).includes('horse')).reduce((sum, unit) => sum + unit.killCount, 0);
  const kind = currentScenario.star3;
  if (kind === 'horse' && horse > rest && horse >= 3) stars = 3;
  if (kind === 'longbow' && killsOf('longbow') >= 4) stars = 3;
  if (kind === 'guns' && killsOf('handcannoneer') >= 2 && killsOf('handcannoneer') >= killsOf('samurai')) stars = 3;
  if (kind === 'knight' && killsOf('knight') > killsOf('archer')) stars = 3;
  if (kind === 'companions' && killsOf('knight') >= 3) stars = 3;
  if (kind === 'hold' && ratio >= 0.5) stars = 3;
  return stars;
}
function summaryHtml(winner, redLeft) {
  settleWager(winner);
  const groups = {};
  units.forEach((unit) => {
    if (!unit.killCount) return;
    const key = unit.id;
    if (!groups[key]) groups[key] = { id: key, kills: 0, team: unit.team };
    groups[key].kills += unit.killCount;
  });
  const mvp = Object.values(groups).sort((a, b) => b.kills - a.kills)[0];
  const reds = units.filter((unit) => unit.team === 'red');
  const spent = reds.reduce((sum, unit) => sum + (unit.cost || 0), 0);
  const redKills = reds.reduce((sum, unit) => sum + unit.killCount, 0);
  const per = spent ? (redKills / spent * 100).toFixed(1) : '0';
  const lines = [`<div><b>${t('mvp')}.</b> ${mvp ? `${field(UNIT_BY_ID[mvp.id].short)} · ${mvp.kills}` : '—'}</div>`];
  lines.push(`<div><b>${t('efficiency')}.</b> ${per} ${t('perGold')}</div>`);
  if (diceMoments.length) lines.push(`<div><b>${t('diceMoments')}.</b> ${diceMoments.slice(0, 3).join(' · ')}</div>`);
  if (playMode === 'scenario' && currentScenario) {
    const stars = winner === 'RED' ? rateScenario(winner, redLeft) : 0;
    if (!rewardsDone) saveStar(currentScenario.id, stars);
    lines.push(`<div><b>${t('stars')}.</b> ${starGlyph(stars)}</div>`);
    lines.push(`<div class="history-line">${field(currentScenario.history)}</div>`);
  }
  if (wagerReport) {
    lines.push(`<div><b>${t('purse')}.</b> ${wagerReport.before} → ${wagerReport.after}</div>`);
  }
  rewardsDone = true;
  return `<div class="summary">${lines.join('')}</div>`;
}

function frameToField() {
  cameraMode = 'follow';
  glide = true;
}
function maybeDuel(alive) {
  if (duel || duelUsed || battleTime < 7) return;
  const champs = alive.filter((unit) => ELITE_IDS.has(unit.id) || (unit.rank || 0) >= 2 || (unit.tags || []).includes('charge'));
  for (let i = 0; i < champs.length; i++) {
    for (let j = i + 1; j < champs.length; j++) {
      const a = champs[i];
      const b = champs[j];
      if (a.team === b.team) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > 92) continue;
      a.dueling = b.dueling = true;
      a.duelImmune = b.duelImmune = true;
      a.target = b;
      b.target = a;
      duelUsed = true;
      duel = { a, b, round: 0, aWins: 0, bWins: 0, left: 0.35, last: '' };
      chronicle(`${field(a.short) || field(UNIT_BY_ID[a.id].short)} ${t('duel')} ${field(b.short) || field(UNIT_BY_ID[b.id].short)}`);
      return;
    }
  }
}
function updateDuel(realDt) {
  if (!duel) return;
  const stage = document.getElementById('dice-stage');
  const face = document.getElementById('die-face');
  const meta = document.getElementById('die-meta');
  const sides = document.getElementById('die-sides');
  if (stage) stage.className = 'show';
  if (sides) sides.textContent = 'd8';
  duel.left -= realDt;
  if (duel.left > 0) return;
  if (duel.round < 3) {
    const bonus = (unit) => (unit.rank || 0) >= 2 ? 1 : 0;
    const ra = Math.min(8, rollDie(8) + bonus(duel.a));
    const rb = Math.min(8, rollDie(8) + bonus(duel.b));
    if (ra === rb) duel.aWins += 1;
    else if (ra > rb) duel.aWins += 1;
    else duel.bWins += 1;
    duel.round += 1;
    duel.left = 0.85;
    if (face) face.textContent = String(Math.max(ra, rb));
    const leftName = field(UNIT_BY_ID[duel.a.id].short);
    const rightName = field(UNIT_BY_ID[duel.b.id].short);
    if (meta) meta.textContent = `${leftName} ${ra} — ${rightName} ${rb}`;
    diceMoments.unshift(`${leftName} ${ra} / ${rightName} ${rb}`);
    if (diceMoments.length > 4) diceMoments.pop();
    playSound('dice', 0.35);
    return;
  }
  const aWins = duel.aWins >= duel.bWins;
  const winner = aWins ? duel.a : duel.b;
  const loser = aWins ? duel.b : duel.a;
  duel.a.dueling = duel.b.dueling = false;
  duel.a.duelImmune = duel.b.duelImmune = false;
  duel = null;
  if (stage) stage.className = '';
  if (loser.alive) dealDamage(loser, Math.max(1, Math.round(loser.maxHp * 0.48)), winner);
  dramaticMoment(1.1);
}
function noteFinalMoment(reds, blues) {
  if (finalMoment || battleTime < 4) return;
  if (reds.length > 3 && blues.length > 3) return;
  finalMoment = true;
  dramaticMoment(1.5);
  showEventBanner(t('finalMoment'), '#f3e6cf');
}
function refreshOpenSheet() {
  if (sheetMode === 'scenarios') renderScenarioList();
  else if (sheetMode === 'brief') openBriefing();
  else if (sheetMode === 'camp') openCamp();
  else if (sheetMode === 'wager') openWager();
  else if (sheetMode === 'campaign-menu') openCampaignMenu();
}
function drawStrengthGraph() {
  const canvasGraph = document.getElementById('strength-graph');
  if (!canvasGraph) return;
  const show = graphSamples.length > 1 && (gameState === 'battle' || gameState === 'ended');
  canvasGraph.hidden = !show;
  if (!show) return;
  const g = canvasGraph.getContext('2d');
  const w = canvasGraph.width;
  const h = canvasGraph.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(18, 14, 10, 0.72)';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(212, 180, 131, 0.45)';
  g.strokeRect(0.5, 0.5, w - 1, h - 1);
  const plot = (key, color) => {
    g.beginPath();
    graphSamples.forEach((sample, index) => {
      const x = 8 + (index / Math.max(1, graphSamples.length - 1)) * (w - 16);
      const y = 8 + (1 - Math.max(0, Math.min(1, sample[key]))) * (h - 16);
      if (index === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.strokeStyle = color;
    g.lineWidth = 2;
    g.stroke();
  };
  plot('r', '#e15a4a');
  plot('b', '#3ec6d4');
}
function momentLabel() {
  const el = document.getElementById('moment');
  if (!el) return;
  const resultOpen = document.getElementById('result').classList.contains('open');
  el.classList.toggle('show', !!duel && !resultOpen);
  el.textContent = t('duel');
}

function bindModeButtons() {
  document.getElementById('btn-budget').addEventListener('click', enterBudget);
  document.getElementById('btn-scenarios').addEventListener('click', renderScenarioList);
  document.getElementById('btn-campaign').addEventListener('click', openCampaignMenu);
  document.getElementById('btn-answer').addEventListener('click', answerFoe);
  document.getElementById('btn-refund').addEventListener('click', refundLast);
  document.querySelectorAll('#diff-row button').forEach((button) => {
    button.addEventListener('click', () => {
      difficulty = button.dataset.diff;
      syncModeChrome();
      playSound('ui', 0.4);
    });
  });
}
