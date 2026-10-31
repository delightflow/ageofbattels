const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;
const TEAM_COLORS = {
  red: { main: '#d64545', dark: '#8e2b2b', light: '#ffb1a8' },
  blue: { main: '#2aa3b5', dark: '#146676', light: '#b7f0f4' }
};
const RANDOM_PLACE_SETTINGS = {
  minPerTeam: 46,
  maxPerTeam: 54,
  infantryRatio: 0.36,
  rangedRatio: 0.28,
  cavalryRatio: 0.2,
  specialRatio: 0.16
};
const QUICK_RED = ['shieldman','shieldman','swordsman','swordsman','pikeman','pikeman','spearman','longbow','longbow','crossbow','scorpion','knight','knight','horsearcher','signifer','monk'];
const QUICK_BLUE = ['manatarms','manatarms','huscarl','samurai','spearman','janissary','slinger','camelrider','cataphract','horsearcher','warelephant','catapult','cavalry','skirmisher'];

const STRINGS = {
  en: {
    subtitle: 'Classical battle sandbox',
    placementTeam: 'Deployment host',
    versus: 'versus',
    none: 'None selected',
    selectHint: 'Choose a unit to read its history, weapons, and counters.',
    speed: 'Speed',
    settings: 'Settings',
    music: 'Music',
    language: 'Language',
    recent: 'Recent changes',
    random: 'Random hosts',
    matchup: 'Show matchups',
    battle: 'Start battle',
    reset: 'Clear the field',
    help: 'How to play',
    sound: 'Sound',
    center: 'Center',
    instructions: 'Pick a host and a unit, then click the field. Drag to pan. Scroll to zoom. You may place anywhere.',
    eyebrow: 'A single-player battle sandbox',
    lede: 'Place historical soldiers on two hosts, then watch the dice decide a classical battle. No install. One sitting.',
    watch: 'Watch a quick battle',
    grand: 'Watch a grand host',
    sandbox: 'Place units yourself',
    howTitle: 'How to play',
    how1: 'Choose Red or Blue, choose a unit, and click the map. You may deploy anywhere.',
    how2: 'Read the blurb. Spears and pikes brace against horses, big shields blunt arrows, and cavalry punish archers who let them close.',
    how3: 'Start the battle. Melee rolls a d8 and shots roll a d20. Critical blows, charges, glances, and fumbles tumble on the die. Ordinary hits stay quiet.',
    how4: 'A side wins when the other is gone. A quick host finishes in about a minute at normal speed. A larger host lasts a few minutes. After six minutes of battle time, exhaustion forces a finish, so a sitting stays well under half an hour.',
    diceBody: 'Drag to look around. The view stays where you leave it. Center, or the C key, returns to the fighting. M toggles mute. Space starts the fight once both hosts are on the field.',
    creditLine: 'All sound is synthesized in the browser. Unit names are historical troop types, not characters from another game.',
    close: 'Close',
    matchupTitle: 'Matchups',
    matchupHint: 'Each cell is the damage multiplier when the row attacks the column. Gold is a strong counter. Pale red is a poor one.',
    deployAgain: 'Deploy again',
    backTitle: 'Title',
    redHost: 'RED HOST',
    blueHost: 'BLUE HOST',
    all: 'All',
    foot: 'Foot',
    missile: 'Missile',
    mounted: 'Mounted',
    engine: 'Engines',
    support: 'Support',
    team: 'Host',
    era: 'Era',
    civ: 'People',
    weapon: 'Weapon',
    armor: 'Armor',
    strong: 'Strong against',
    weak: 'Weak against',
    inProgress: 'Battle in progress',
    draw: 'Drawn battle',
    drawSub: 'Both hosts are spent.',
    wins: 'wins',
    survivors: 'still standing',
    kills: 'kills',
    leaderboard: 'Roll of honor',
    alive: 'standing',
    lightning: 'Lightning strike',
    warcry: 'war cry — attack ×1.5',
    reinforce: 'reinforcements arrive',
    quake: 'Earthquake — the field slows',
    lastStand: 'last stand',
    exhaust: 'Exhaustion — blows land harder',
    press: 'The lines shove forward',
    standardDown: 'The standard falls',
    crit: 'CRIT',
    glance: 'GLANCE',
    miss: 'MISS',
    fumble: 'FUMBLE',
    hit: 'HIT',
    charge: 'CHARGE',
    fury: 'FURY',
    falls: 'falls'
  },
  ko: {
    subtitle: '고전 전투 모래상자',
    placementTeam: '배치할 진영',
    versus: '대',
    none: '선택 없음',
    selectHint: '유닛을 고르면 역사, 무장, 상성이 나옵니다.',
    speed: '속도',
    settings: '설정',
    music: '음악',
    language: '언어',
    recent: '최근 변경',
    random: '무작위 진영',
    matchup: '상성표',
    battle: '전투 시작',
    reset: '전장 비우기',
    help: '플레이 방법',
    sound: '소리',
    center: '중앙',
    instructions: '진영과 유닛을 고른 뒤 전장을 클릭하세요. 드래그로 이동, 휠로 확대. 어디든 배치할 수 있습니다.',
    eyebrow: '싱글 플레이 전투 모래상자',
    lede: '역사 속 병사를 두 진영에 두고, 주사위가 고전 전투를 정하게 두세요. 설치 없이, 한 번에.',
    watch: '짧은 전투 보기',
    grand: '대군 전투 보기',
    sandbox: '직접 배치하기',
    howTitle: '플레이 방법',
    how1: '빨강 또는 파랑을 고르고 유닛을 고른 다음 지도를 클릭합니다. 어디든 배치할 수 있습니다.',
    how2: '설명을 읽으세요. 창과 장창은 말을 막고, 큰 방패는 화살을 흘리며, 기병은 거리를 내준 궁수를 짓밟습니다.',
    how3: '전투를 시작합니다. 근접은 d8, 사격은 d20입니다. 치명타, 돌격, 스침, 실수만 주사위가 굴러 보여 줍니다. 평범한 적중은 조용합니다.',
    how4: '한쪽이 사라지면 승부입니다. 빠른 전투는 보통 속도에서 1분 안팎이고, 큰 진영은 몇 분입니다. 전투 시간 6분이 지나면 피로로 승부가 붙어서, 한 판은 30분을 넘기지 않습니다.',
    diceBody: '드래그로 둘러봅니다. 둔 자리에 시야가 머뭅니다. 중앙 버튼이나 C 키로 전투로 돌아옵니다. M으로 음소거. 양쪽이 서 있으면 Space로 시작합니다.',
    creditLine: '소리는 브라우저에서 합성합니다. 유닛 이름은 역사 속 병종이며, 다른 게임의 캐릭터가 아닙니다.',
    close: '닫기',
    matchupTitle: '상성',
    matchupHint: '칸의 숫자는 가로 유닛이 세로 유닛을 칠 때의 피해 배율입니다. 금색은 강한 상성, 옅은 빨강은 약한 상성입니다.',
    deployAgain: '다시 배치',
    backTitle: '표지',
    redHost: '홍군',
    blueHost: '청군',
    all: '전체',
    foot: '보병',
    missile: '사격',
    mounted: '기마',
    engine: '공성',
    support: '지원',
    team: '진영',
    era: '시대',
    civ: '출신',
    weapon: '무기',
    armor: '방어구',
    strong: '강함',
    weak: '약함',
    inProgress: '전투 중',
    draw: '무승부',
    drawSub: '양쪽 진영이 모두 쓰러졌습니다.',
    wins: '승',
    survivors: '생존',
    kills: '처치',
    leaderboard: '전공',
    alive: '생존',
    lightning: '낙뢰',
    warcry: '함성 — 공격 ×1.5',
    reinforce: '증원 도착',
    quake: '지진 — 전장 둔화',
    lastStand: '최후의 저항',
    exhaust: '피로 — 타격이 무거워진다',
    press: '전열이 밀고 올라간다',
    standardDown: '군기가 쓰러졌다',
    crit: '치명',
    glance: '스침',
    miss: '빗나감',
    fumble: '실수',
    hit: '적중',
    charge: '돌격',
    fury: '분노',
    falls: '쓰러짐'
  }
};

const ELITE_IDS = new Set(['knight', 'cataphract', 'warelephant', 'towelephant', 'catapult', 'mangonel', 'signifer', 'scorpion']);
const NOTABLE_ROLLS = new Set(['CRIT', 'GLANCE', 'CHARGE', 'FUMBLE']);

const CHANGELOG = [
  'v16: The view stays where you leave it. Center returns to the fight. Notable dice tumble; ordinary hits stay quiet.',
  'v15: Historical roster, English-first brief, visible dice, procedural sound, and a clearer field.',
  'v14: One shared unit list after the host is chosen. Placement is allowed anywhere.',
  'v13: Random hosts and a wider roster. Details moved under the selection.'
];

let locale = 'en';
let canvas, ctx, minimapCanvas, minimapCtx;
let units = [];
let deadUnits = [];
let projectiles = [];
let particles = [];
let missMarkers = [];
let strikes = [];
let terrainFeatures = [];
let eventBanners = [];
let activeBuffs = [];
let teamMomentum = { red: 0, blue: 0 };
let camera = { x: 0, y: 0, zoom: 1.15 };
let cameraMode = 'free';
let cameraHold = false;
let glide = false;
let gameState = 'placing';
let titleOpen = true;
let gameSpeed = 1;
let battleTime = 0;
let animTime = 0;
let shake = 0;
let selectedUnit = null;
let selectedTeam = 'red';
let unitFilter = 'all';
let sidebarOpen = true;
let nextEventTime = 0;
let nextComebackCheck = 0;
let momentumDecayTimer = 0;
let lastKillAt = 0;
let pressAttack = false;
let pressAnnounced = false;
let exhaustAnnounced = false;
let lastAmbience = 0;
let dieQueue = [];
let dieAnim = null;
let lastResult = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function t(key) {
  return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || key;
}
function field(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || '';
}
function unitName(unit) { return unit ? field(unit.name) : ''; }

function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  minimapCanvas = document.getElementById('minimap');
  minimapCtx = minimapCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  rebuildTerrain();
  centerCamera();
  buildFilters();
  applyLocale('en');
  setupInput();
  updateCounts();
  requestAnimationFrame(gameLoop);
  if (new URLSearchParams(location.search).get('watch') === '1') setTimeout(watchQuick, 250);
}

function resizeCanvas() {
  const stage = document.getElementById('stage');
  canvas.width = stage.clientWidth;
  canvas.height = stage.clientHeight;
  clampCamera();
}
function centerCamera() {
  cameraMode = 'free';
  glide = false;
  camera.zoom = 1.15;
  camera.x = WORLD_WIDTH / 2 - canvas.width / (2 * camera.zoom);
  camera.y = WORLD_HEIGHT / 2 - canvas.height / (2 * camera.zoom);
  clampCamera();
}
function userMovedCamera() {
  cameraMode = 'free';
  glide = false;
}
function centerView() {
  glide = true;
  if (gameState === 'battle') cameraMode = 'follow';
}
function clampCamera() {
  const maxX = Math.max(0, WORLD_WIDTH - canvas.width / camera.zoom);
  const maxY = Math.max(0, WORLD_HEIGHT - canvas.height / camera.zoom);
  camera.x = Math.max(0, Math.min(maxX, camera.x));
  camera.y = Math.max(0, Math.min(maxY, camera.y));
}
function screenToWorld(sx, sy) {
  return { x: sx / camera.zoom + camera.x, y: sy / camera.zoom + camera.y };
}

function applyLocale(next) {
  locale = next === 'ko' ? 'ko' : 'en';
  document.documentElement.lang = locale;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  ['lang-select', 'lang-select-settings', 'title-lang'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = locale;
  });
  const list = document.getElementById('settings-changelog-list');
  list.innerHTML = CHANGELOG.map((line) => `<li>${line}</li>`).join('');
  buildFilters();
  buildUnitButtons();
  buildMatchupTable();
  renderUnitDetail();
  refreshDieCaption();
  refreshBattleButton();
  if (lastResult && gameState === 'ended') showResult(lastResult.winner, lastResult.redLeft, lastResult.blueLeft);
}

function buildFilters() {
  const host = document.getElementById('filters');
  const keys = ['all', 'foot', 'missile', 'mounted', 'engine', 'support'];
  host.innerHTML = '';
  keys.forEach((key) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-chip${unitFilter === key ? ' active' : ''}`;
    button.textContent = t(key);
    button.addEventListener('click', () => {
      unitFilter = key;
      playSound('ui', 0.6);
      buildFilters();
      buildUnitButtons();
    });
    host.appendChild(button);
  });
}

function iconFor(unit, color) {
  const icon = document.createElement('canvas');
  icon.width = 48;
  icon.height = 48;
  const g = icon.getContext('2d');
  drawUnitSprite(g, { ...unit, facing: 1, moving: false, attackAnim: 0, threw: false }, 24, 30, 15, color, false);
  return icon;
}

function buildUnitButtons() {
  const list = document.getElementById('unit-list');
  list.innerHTML = '';
  UNIT_TYPES.filter((unit) => unitFilter === 'all' || unit.group === unitFilter).forEach((unit) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `unit-btn${selectedUnit && selectedUnit.id === unit.id ? ' selected' : ''}`;
    button.appendChild(iconFor(unit, TEAM_COLORS[selectedTeam].main));
    const info = document.createElement('div');
    info.innerHTML = `<div class="name">${field(unit.name)}</div><div class="meta">${field(unit.era)} · HP ${unit.hp} · ATK ${unit.atk}</div>`;
    button.appendChild(info);
    button.addEventListener('click', () => {
      selectedUnit = unit;
      playSound('ui', 0.5);
      buildUnitButtons();
      renderUnitDetail();
    });
    list.appendChild(button);
  });
}

function counterLines(unit, high) {
  return UNIT_TYPES
    .filter((other) => other.id !== unit.id && other.type !== 'support')
    .map((other) => ({ name: field(other.short), value: getMatchupMultiplier(unit.id, other.id) }))
    .filter((row) => (high ? row.value >= 1.6 : row.value <= 0.7))
    .sort((a, b) => high ? b.value - a.value : a.value - b.value)
    .slice(0, 3);
}

function renderUnitDetail() {
  const nameEl = document.getElementById('unit-detail-name');
  const teamEl = document.getElementById('unit-detail-team');
  const statsEl = document.getElementById('unit-detail-stats');
  const descEl = document.getElementById('unit-detail-desc');
  const factsEl = document.getElementById('unit-detail-facts');
  const counterEl = document.getElementById('unit-detail-counters');
  const preview = document.getElementById('detail-preview');
  const g = preview.getContext('2d');
  g.clearRect(0, 0, preview.width, preview.height);
  if (!selectedUnit) {
    nameEl.textContent = t('none');
    teamEl.textContent = '';
    statsEl.textContent = '';
    descEl.textContent = t('selectHint');
    factsEl.innerHTML = '';
    counterEl.innerHTML = '';
    return;
  }
  drawUnitSprite(g, { ...selectedUnit, facing: 1, moving: false, attackAnim: 0, threw: false }, 36, 46, 22, TEAM_COLORS[selectedTeam].main, false);
  nameEl.textContent = field(selectedUnit.name);
  teamEl.textContent = `${t('team')}: ${selectedTeam === 'red' ? 'RED' : 'BLUE'}`;
  const acc = selectedUnit.attackMode === 'ranged' ? ` · ACC ${Math.round(selectedUnit.accuracy * 100)}%` : '';
  statsEl.innerHTML = `HP ${selectedUnit.hp} · ATK ${selectedUnit.atk} · DEF ${selectedUnit.def}<br>SPD ${selectedUnit.speed} · RNG ${selectedUnit.range}${acc}`;
  descEl.textContent = field(selectedUnit.blurb);
  factsEl.innerHTML = [
    [t('era'), field(selectedUnit.era)],
    [t('civ'), field(selectedUnit.civ)],
    [t('weapon'), field(selectedUnit.weapon)],
    [t('armor'), field(selectedUnit.armorName)]
  ].map(([label, value]) => `<div class="fact"><b>${label}.</b> ${value}</div>`).join('');
  const strong = counterLines(selectedUnit, true).map((row) => `${row.name} ×${row.value.toFixed(1)}`).join(', ');
  const weak = counterLines(selectedUnit, false).map((row) => `${row.name} ×${row.value.toFixed(1)}`).join(', ');
  counterEl.innerHTML = `${strong ? `<div><b>${t('strong')}.</b> ${strong}</div>` : ''}${weak ? `<div><b>${t('weak')}.</b> ${weak}</div>` : ''}`;
}

function buildMatchupTable() {
  const table = document.getElementById('matchup-table');
  let html = '<tr><th></th>';
  UNIT_TYPES.forEach((unit) => { html += `<th class="rot">${field(unit.short)}</th>`; });
  html += '</tr>';
  UNIT_TYPES.forEach((attacker) => {
    html += `<tr><th>${field(attacker.short)}</th>`;
    UNIT_TYPES.forEach((defender) => {
      const value = getMatchupMultiplier(attacker.id, defender.id);
      let cls = '';
      if (value >= 1.6) cls = 'bonus-strong';
      else if (value <= 0.7 && value > 0) cls = 'bonus-weak';
      html += `<td class="${cls}">${value === 0 ? '–' : value.toFixed(1)}</td>`;
    });
    html += '</tr>';
  });
  table.innerHTML = html;
}

function setTeam(team) {
  selectedTeam = team === 'blue' ? 'blue' : 'red';
  document.getElementById('pick-red').classList.toggle('active', selectedTeam === 'red');
  document.getElementById('pick-blue').classList.toggle('active', selectedTeam === 'blue');
  buildUnitButtons();
  renderUnitDetail();
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('hidden', !sidebarOpen);
  document.getElementById('sidebar-toggle').classList.toggle('open', sidebarOpen);
  document.getElementById('sidebar-overlay').classList.toggle('active', sidebarOpen && window.innerWidth <= 860);
  setTimeout(resizeCanvas, 280);
}

function setupInput() {
  const stageCanvas = canvas;
  let mouseDown = null;
  let mouseMoved = false;
  stageCanvas.addEventListener('contextmenu', (event) => event.preventDefault());
  stageCanvas.addEventListener('mousedown', (event) => {
    mouseDown = { x: event.clientX, y: event.clientY, t: performance.now() };
    mouseMoved = false;
    cameraHold = true;
    dragStart = { x: event.clientX, y: event.clientY };
    camStart = { x: camera.x, y: camera.y };
  });
  window.addEventListener('mousemove', (event) => {
    if (!mouseDown) return;
    const dist = Math.hypot(event.clientX - mouseDown.x, event.clientY - mouseDown.y);
    if (dist > 10) mouseMoved = true;
    if (mouseMoved) {
      userMovedCamera();
      camera.x = camStart.x - (event.clientX - dragStart.x) / camera.zoom;
      camera.y = camStart.y - (event.clientY - dragStart.y) / camera.zoom;
      clampCamera();
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (!mouseDown) return;
    const dist = Math.hypot(event.clientX - mouseDown.x, event.clientY - mouseDown.y);
    const quick = performance.now() - mouseDown.t < 250 && dist < 15;
    if ((!mouseMoved || quick) && event.button === 0) {
      const rect = canvas.getBoundingClientRect();
      const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
      placeUnit(world.x, world.y);
    }
    mouseDown = null;
    cameraHold = false;
  });

  stageCanvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    userMovedCamera();
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const before = screenToWorld(mx, my);
    camera.zoom = Math.max(0.35, Math.min(2.1, camera.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
    camera.x = before.x - mx / camera.zoom;
    camera.y = before.y - my / camera.zoom;
    clampCamera();
  }, { passive: false });

  let touchStart = null;
  let touchMoved = false;
  let pinch = 0;
  stageCanvas.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY, t: performance.now() };
      touchMoved = false;
      cameraHold = true;
      dragStart = { x: touch.clientX, y: touch.clientY };
      camStart = { x: camera.x, y: camera.y };
    } else if (event.touches.length === 2) {
      touchMoved = true;
      userMovedCamera();
      pinch = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
      pinchZoom = camera.zoom;
    }
    event.preventDefault();
  }, { passive: false });
  stageCanvas.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1 && touchStart) {
      const touch = event.touches[0];
      if (Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y) > 14) touchMoved = true;
      if (touchMoved) {
        userMovedCamera();
        camera.x = camStart.x - (touch.clientX - dragStart.x) / camera.zoom;
        camera.y = camStart.y - (touch.clientY - dragStart.y) / camera.zoom;
        clampCamera();
      }
    } else if (event.touches.length === 2 && pinch > 0) {
      const dist = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
      camera.zoom = Math.max(0.35, Math.min(2.1, pinchZoom * (dist / pinch)));
      clampCamera();
    }
    event.preventDefault();
  }, { passive: false });
  stageCanvas.addEventListener('touchend', (event) => {
    if (touchStart && event.touches.length === 0) {
      const elapsed = performance.now() - touchStart.t;
      if (!touchMoved || elapsed < 300) {
        const rect = canvas.getBoundingClientRect();
        const world = screenToWorld(touchStart.x - rect.left, touchStart.y - rect.top);
        placeUnit(world.x, world.y);
      }
    }
    if (event.touches.length === 0) {
      touchStart = null;
      cameraHold = false;
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') { syncMute(toggleMute()); return; }
    if (event.key === 'Escape') { closeOverlays(); return; }
    if (event.key === ' ' && gameState === 'placing' && !titleOpen) {
      event.preventDefault();
      startBattle();
      return;
    }
    const speeds = { '1': 1, '2': 1.5, '3': 2, '4': 4 };
    if (speeds[event.key]) { setSpeed(speeds[event.key]); return; }
    if (event.key === 'c' || event.key === 'C' || event.key === 'Home') {
      if (event.target && event.target.closest && event.target.closest('input, select, textarea')) return;
      centerView();
      return;
    }
    const pan = 28 / camera.zoom;
    if (event.key === 'ArrowLeft') camera.x -= pan;
    else if (event.key === 'ArrowRight') camera.x += pan;
    else if (event.key === 'ArrowUp') camera.y -= pan;
    else if (event.key === 'ArrowDown') camera.y += pan;
    else return;
    userMovedCamera();
    clampCamera();
    event.preventDefault();
  });

  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-close').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', toggleSidebar);
  document.getElementById('pick-red').addEventListener('click', () => setTeam('red'));
  document.getElementById('pick-blue').addEventListener('click', () => setTeam('blue'));
  document.getElementById('btn-battle').addEventListener('click', onBattleClick);
  document.getElementById('btn-reset-placement').addEventListener('click', () => clearAll());
  document.getElementById('btn-random').addEventListener('click', () => randomPlace());
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('open');
  });
  document.getElementById('matchup-btn').addEventListener('click', () => {
    document.getElementById('matchup-panel').classList.add('open');
  });
  document.getElementById('matchup-close').addEventListener('click', closeOverlays);
  document.getElementById('btn-help').addEventListener('click', () => document.getElementById('help-modal').classList.add('open'));
  document.getElementById('help-close').addEventListener('click', closeOverlays);
  document.getElementById('btn-watch').addEventListener('click', watchQuick);
  document.getElementById('btn-grand').addEventListener('click', watchGrand);
  document.getElementById('btn-sandbox').addEventListener('click', enterSandbox);
  document.getElementById('btn-again').addEventListener('click', () => clearAll());
  document.getElementById('btn-title').addEventListener('click', () => {
    clearAll();
    titleOpen = true;
    document.getElementById('title-screen').classList.remove('hidden');
  });
  document.getElementById('speed').addEventListener('input', (event) => setSpeed(parseFloat(event.target.value)));
  document.getElementById('volume').addEventListener('input', (event) => syncMute(setMasterVolume(parseFloat(event.target.value)) || masterVolume > 0));
  document.getElementById('btn-sound').addEventListener('click', () => syncMute(toggleMute()));
  document.getElementById('btn-center').addEventListener('click', centerView);
  minimapCanvas.addEventListener('click', (event) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const wx = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const wy = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    userMovedCamera();
    camera.x = wx - canvas.width / (2 * camera.zoom);
    camera.y = wy - canvas.height / (2 * camera.zoom);
    clampCamera();
  });
  document.getElementById('bgm-volume').addEventListener('input', (event) => {
    setMusicVolume(parseFloat(event.target.value));
    if (musicEnabled && musicMode === 'idle') startMusic(gameState === 'battle' ? 'battle' : 'placing');
  });
  document.getElementById('btn-bgm').addEventListener('click', () => {
    const on = toggleMusic();
    document.getElementById('btn-bgm').textContent = on ? '♪' : '⊘';
    document.getElementById('bgm-volume').value = musicVolume;
    if (on) startMusic(gameState === 'battle' ? 'battle' : 'placing');
  });
  ['lang-select', 'lang-select-settings', 'title-lang'].forEach((id) => {
    document.getElementById(id).addEventListener('change', (event) => applyLocale(event.target.value));
  });
}

let dragStart = { x: 0, y: 0 };
let camStart = { x: 0, y: 0 };
let pinchZoom = 1;

function closeOverlays() {
  document.getElementById('matchup-panel').classList.remove('open');
  document.getElementById('help-modal').classList.remove('open');
}
function setSpeed(value) {
  gameSpeed = value;
  const slider = document.getElementById('speed');
  slider.value = String(value);
  document.getElementById('speed-label').textContent = `${value}×`;
}
function syncMute(enabled) {
  soundEnabled = enabled;
  document.getElementById('btn-sound').textContent = soundEnabled ? '🔊' : '🔇';
  document.getElementById('volume').value = masterVolume;
}
function hideTitle() {
  titleOpen = false;
  document.getElementById('title-screen').classList.add('hidden');
  resumeAudio();
}
function enterSandbox() {
  hideTitle();
  playSound('ui', 0.7);
  startMusic('placing');
}
function watchQuick() {
  hideTitle();
  clearAll();
  deployList(QUICK_RED, 'red');
  deployList(QUICK_BLUE, 'blue');
  updateCounts();
  setSpeed(1.25);
  startBattle();
}
function watchGrand() {
  hideTitle();
  randomPlace(30, 36);
  setSpeed(1.25);
  startBattle();
}

function placeUnit(x, y) {
  if (titleOpen || gameState !== 'placing' || !selectedUnit) return;
  if (x < 20 || y < 20 || x > WORLD_WIDTH - 20 || y > WORLD_HEIGHT - 20) return;
  spawnUnit(selectedUnit, selectedTeam, x, y);
  playSound('place', 0.8);
  updateCounts();
  if (musicMode === 'idle') startMusic('placing');
}

function spawnUnit(def, team, x, y) {
  units.push({
    ...def,
    team,
    x, y,
    maxHp: def.hp,
    currentHp: def.hp,
    target: null,
    atkCooldown: Math.random() * 0.3,
    alive: true,
    flashTimer: 0,
    killCount: 0,
    moving: false,
    attackAnim: 0,
    attackAnimDir: { x: 1, y: 0 },
    furyStacks: 0,
    furyTime: 0,
    facing: team === 'red' ? 1 : -1,
    threw: false,
    chargeDist: 0,
    kiteTime: 0,
    kiteLock: 0
  });
}

function updateCounts() {
  const reds = units.filter((unit) => unit.team === 'red').length;
  const blues = units.filter((unit) => unit.team === 'blue').length;
  document.getElementById('red-count').textContent = reds;
  document.getElementById('blue-count').textContent = blues;
  refreshBattleButton();
}
function refreshBattleButton() {
  const button = document.getElementById('btn-battle');
  const reds = units.filter((unit) => unit.team === 'red').length;
  const blues = units.filter((unit) => unit.team === 'blue').length;
  if (gameState === 'battle') {
    button.disabled = true;
    button.textContent = t('inProgress');
  } else if (gameState === 'ended') {
    button.disabled = false;
    button.textContent = t('deployAgain');
  } else {
    button.disabled = !(reds > 0 && blues > 0);
    button.textContent = t('battle');
  }
}
function onBattleClick() {
  if (gameState === 'ended') clearAll();
  else startBattle();
}

function clearAll() {
  units = [];
  deadUnits = [];
  projectiles = [];
  particles = [];
  missMarkers = [];
  strikes = [];
  eventBanners = [];
  activeBuffs = [];
  teamMomentum = { red: 0, blue: 0 };
  resetDice();
  gameState = 'placing';
  battleTime = 0;
  pressAttack = false;
  pressAnnounced = false;
  exhaustAnnounced = false;
  lastResult = null;
  rebuildTerrain();
  centerCamera();
  document.getElementById('hud').style.display = 'none';
  document.getElementById('result').classList.remove('open');
  document.getElementById('instructions').style.display = 'block';
  refreshBattleButton();
  updateCounts();
  if (!titleOpen) startMusic('placing');
}

function randomPlace(min = RANDOM_PLACE_SETTINGS.minPerTeam, max = RANDOM_PLACE_SETTINGS.maxPerTeam) {
  clearAll();
  const pools = {
    foot: UNIT_TYPES.filter((unit) => unit.deploy === 'foot'),
    missile: UNIT_TYPES.filter((unit) => unit.deploy === 'missile'),
    mounted: UNIT_TYPES.filter((unit) => unit.deploy === 'mounted'),
    special: UNIT_TYPES.filter((unit) => unit.deploy === 'special')
  };
  ['red', 'blue'].forEach((team) => {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const picks = [];
    for (let i = 0; i < count; i++) {
      const r = i / count;
      let key = 'special';
      if (r < RANDOM_PLACE_SETTINGS.infantryRatio) key = 'foot';
      else if (r < RANDOM_PLACE_SETTINGS.infantryRatio + RANDOM_PLACE_SETTINGS.rangedRatio) key = 'missile';
      else if (r < RANDOM_PLACE_SETTINGS.infantryRatio + RANDOM_PLACE_SETTINGS.rangedRatio + RANDOM_PLACE_SETTINGS.cavalryRatio) key = 'mounted';
      const pool = pools[key];
      picks.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    const rows = 6;
    const cols = Math.ceil(count / rows);
    const blockW = cols * 72;
    picks.forEach((def, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const jitterX = (Math.random() - 0.5) * 18;
      const jitterY = (Math.random() - 0.5) * 16;
      const y = WORLD_HEIGHT / 2 - rows * 48 + row * 96 + jitterY;
      const x = (team === 'red' ? WORLD_WIDTH / 2 - 180 - blockW : WORLD_WIDTH / 2 + 180) + col * 72 + jitterX;
      spawnUnit(def, team, x, y);
    });
  });
  updateCounts();
}

function deployList(ids, team) {
  const cols = 4;
  ids.forEach((id, index) => {
    const def = UNIT_BY_ID[id];
    if (!def) return;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const y = WORLD_HEIGHT / 2 - 200 + row * 110;
    const x = (team === 'red' ? WORLD_WIDTH / 2 - 560 : WORLD_WIDTH / 2 + 180) + col * 100;
    spawnUnit(def, team, x, y);
  });
}

function battleFocus() {
  const group = units.filter((unit) => unit.alive);
  if (!group.length || !canvas || !canvas.width) {
    return { cx: WORLD_WIDTH / 2, cy: WORLD_HEIGHT / 2, zoom: 1.15 };
  }
  const meanOf = (list) => {
    let x = 0;
    let y = 0;
    list.forEach((unit) => { x += unit.x; y += unit.y; });
    return { x: x / list.length, y: y / list.length };
  };
  let center = meanOf(group);
  const ranked = group
    .map((unit) => ({ unit, d: Math.hypot(unit.x - center.x, unit.y - center.y) }))
    .sort((a, b) => a.d - b.d);
  const median = ranked[Math.floor(ranked.length / 2)].d;
  const limit = Math.max(280, median * 1.8);
  const core = ranked.filter((row) => row.d <= limit).map((row) => row.unit);
  const use = core.length >= Math.min(4, group.length) ? core : group;
  center = meanOf(use);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  use.forEach((unit) => {
    minX = Math.min(minX, unit.x);
    maxX = Math.max(maxX, unit.x);
    minY = Math.min(minY, unit.y);
    maxY = Math.max(maxY, unit.y);
  });
  const zoom = Math.max(0.9, Math.min(1.45, Math.min(
    canvas.width / (Math.max(180, maxX - minX) + 240),
    canvas.height / (Math.max(140, maxY - minY) + 220)
  )));
  return { cx: center.x, cy: center.y, zoom };
}

function startBattle() {
  const reds = units.some((unit) => unit.team === 'red');
  const blues = units.some((unit) => unit.team === 'blue');
  if (!reds || !blues || gameState === 'battle') return;
  hideTitle();
  gameState = 'battle';
  battleTime = 0;
  lastKillAt = 0;
  pressAttack = false;
  pressAnnounced = false;
  exhaustAnnounced = false;
  nextEventTime = 12 + Math.random() * 6;
  nextComebackCheck = 8;
  eventBanners = [];
  activeBuffs = [];
  teamMomentum = { red: 0, blue: 0 };
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('result').classList.remove('open');
  refreshBattleButton();
  resetDice();
  cameraMode = 'follow';
  glide = false;
  playSound('battle_start', 0.8);
  startMusic('battle');
}

function showEventBanner(text, color) {
  eventBanners.push({ text, color, life: 3.2, maxLife: 3.2 });
}

function getBuffMultiplier(unit, type) {
  return activeBuffs.reduce((mul, buff) => {
    if (buff.type === type && (buff.team === unit.team || buff.team === 'all')) return mul * buff.multiplier;
    return mul;
  }, 1);
}
function getMovementMultiplier(unit) {
  return activeBuffs.reduce((mul, buff) => {
    if ((buff.team === unit.team || buff.team === 'all') && (buff.type === 'slow' || buff.type === 'speedBoost')) return mul * buff.multiplier;
    return mul;
  }, 1);
}
function auraMultiplier(unit) {
  let mul = 1;
  units.forEach((other) => {
    if (!other.alive || other.team !== unit.team || other.behavior !== 'aura') return;
    if (Math.hypot(other.x - unit.x, other.y - unit.y) <= (other.auraRadius || 140)) mul *= other.auraMul || 1.12;
  });
  return Math.min(1.2, mul);
}
function fearMultiplier(unit) {
  if (!unit.tags.includes('horse')) return 1;
  const scared = units.some((other) => other.alive && other.team !== unit.team && other.tags.includes('elephant') && Math.hypot(other.x - unit.x, other.y - unit.y) < 130);
  return scared ? 0.8 : 1;
}
function exhaustionMul() {
  if (battleTime < 360) return 1;
  return 1 + (battleTime - 360) / 22;
}

function triggerRandomEvent() {
  const alive = units.filter((unit) => unit.alive);
  if (alive.length < 4) return;
  const roll = ['lightning', 'warcry', 'reinforcement', 'earthquake'][Math.floor(Math.random() * 4)];
  if (roll === 'lightning') {
    const tx = 240 + Math.random() * (WORLD_WIDTH - 480);
    const ty = 240 + Math.random() * (WORLD_HEIGHT - 480);
    const radius = 130;
    const points = [{ x: tx, y: ty - 220 }];
    let x = tx;
    let y = ty - 220;
    for (let i = 0; i < 6; i++) {
      x += (Math.random() - 0.5) * 40;
      y += 40;
      points.push({ x, y });
    }
    strikes.push({ points, life: 0.35, maxLife: 0.35 });
    shake = 10;
    alive.forEach((unit) => {
      if (Math.hypot(unit.x - tx, unit.y - ty) < radius) {
        unit.currentHp -= 28 + Math.random() * 24;
        unit.flashTimer = 0.3;
        if (unit.currentHp <= 0) killUnit(unit, null);
      }
    });
    burst(tx, ty, '#f4f0c8', 18);
    playSound('lightning', 0.7);
    showEventBanner(t('lightning'), '#f4e7a1');
  } else if (roll === 'warcry') {
    const team = Math.random() < 0.5 ? 'red' : 'blue';
    activeBuffs.push({ team, type: 'atkBoost', multiplier: 1.5, remaining: 5 });
    playSound('warcry', 0.6);
    showEventBanner(`${team.toUpperCase()} ${t('warcry')}`, TEAM_COLORS[team].main);
  } else if (roll === 'reinforcement') {
    const team = Math.random() < 0.5 ? 'red' : 'blue';
    const count = 2 + Math.floor(Math.random() * 2);
    const def = UNIT_BY_ID.swordsman;
    for (let i = 0; i < count; i++) {
      const x = team === 'red' ? 80 + Math.random() * 220 : WORLD_WIDTH - 80 - Math.random() * 220;
      const y = 240 + Math.random() * (WORLD_HEIGHT - 480);
      spawnUnit(def, team, x, y);
    }
    playSound('place', 0.6);
    showEventBanner(`${team.toUpperCase()} ${t('reinforce')}`, TEAM_COLORS[team].main);
    updateCounts();
  } else {
    activeBuffs.push({ team: 'all', type: 'slow', multiplier: 0.55, remaining: 4 });
    shake = 8;
    playSound('quake', 0.6);
    showEventBanner(t('quake'), '#c4a574');
  }
}

function updateBattle(dt) {
  if (gameState !== 'battle') return;
  battleTime += dt;
  momentumDecayTimer += dt;
  if (momentumDecayTimer >= 1) {
    momentumDecayTimer = 0;
    teamMomentum.red = Math.max(0, teamMomentum.red - 0.25);
    teamMomentum.blue = Math.max(0, teamMomentum.blue - 0.25);
  }
  activeBuffs = activeBuffs.filter((buff) => (buff.remaining -= dt) > 0);
  eventBanners = eventBanners.filter((banner) => (banner.life -= dt) > 0);
  deadUnits = deadUnits.filter((dead) => (dead.deathTimer -= dt) > 0);

  const alive = units.filter((unit) => unit.alive);
  const reds = alive.filter((unit) => unit.team === 'red');
  const blues = alive.filter((unit) => unit.team === 'blue');
  if (reds.length === 0 || blues.length === 0) {
    gameState = 'ended';
    const winner = reds.length > 0 ? 'RED' : blues.length > 0 ? 'BLUE' : 'DRAW';
    showResult(winner, reds.length, blues.length);
    return;
  }

  if (battleTime >= nextEventTime && alive.length > 6) {
    triggerRandomEvent();
    nextEventTime = battleTime + 18 + Math.random() * 10;
  }
  if (battleTime >= nextComebackCheck) {
    const trailing = reds.length <= blues.length * 0.62 ? 'red' : blues.length <= reds.length * 0.62 ? 'blue' : null;
    if (trailing && !activeBuffs.some((buff) => buff.team === trailing && buff.type === 'comeback')) {
      activeBuffs.push({ team: trailing, type: 'comeback', multiplier: 1.18, remaining: 7 });
      activeBuffs.push({ team: trailing, type: 'speedBoost', multiplier: 1.12, remaining: 7 });
      showEventBanner(`${trailing.toUpperCase()} ${t('lastStand')}`, TEAM_COLORS[trailing].main);
      playSound('warcry', 0.5);
    }
    nextComebackCheck = battleTime + 12;
  }
  if (!pressAttack && battleTime - lastKillAt > 24 && battleTime > 18) {
    pressAttack = true;
    if (!pressAnnounced) {
      pressAnnounced = true;
      showEventBanner(t('press'), '#f3e6cf');
    }
  }
  if (battleTime > 360 && !exhaustAnnounced) {
    exhaustAnnounced = true;
    showEventBanner(t('exhaust'), '#e0b15a');
  }

  const redHp = reds.reduce((sum, unit) => sum + unit.currentHp, 0);
  const redMax = reds.reduce((sum, unit) => sum + unit.maxHp, 0);
  const blueHp = blues.reduce((sum, unit) => sum + unit.currentHp, 0);
  const blueMax = blues.reduce((sum, unit) => sum + unit.maxHp, 0);
  document.getElementById('red-hp').style.width = `${(redHp / redMax) * 100}%`;
  document.getElementById('blue-hp').style.width = `${(blueHp / blueMax) * 100}%`;
  document.getElementById('red-alive').textContent = reds.length;
  document.getElementById('blue-alive').textContent = blues.length;
  const redKills = units.filter((unit) => unit.team === 'red').reduce((sum, unit) => sum + unit.killCount, 0);
  const blueKills = units.filter((unit) => unit.team === 'blue').reduce((sum, unit) => sum + unit.killCount, 0);
  document.getElementById('red-kills').textContent = `${redKills}K`;
  document.getElementById('blue-kills').textContent = `${blueKills}K`;
  document.getElementById('battle-timer').textContent = `${battleTime.toFixed(0)}s`;

  alive.forEach((unit) => {
    unit.atkCooldown = Math.max(0, unit.atkCooldown - dt);
    if (unit.flashTimer > 0) unit.flashTimer -= dt;
    if (unit.attackAnim > 0) unit.attackAnim -= dt;
    if (unit.furyTime > 0) {
      unit.furyTime -= dt;
      if (unit.furyTime <= 0) unit.furyStacks = 0;
    }
    if (unit.behavior === 'heal') updateHealer(unit, alive, dt);
    else if (unit.behavior === 'aura') updateBanner(unit, alive, dt);
    else updateCombatUnit(unit, alive, dt);
  });
  updateProjectiles(dt);
}

function updateCombatUnit(unit, allAlive, dt) {
  const enemies = allAlive.filter((other) => other.team !== unit.team);
  if (!enemies.length) return;
  if (!unit.target || !unit.target.alive || Math.random() < 0.03) {
    const nearest = closest(unit, enemies);
    const favored = closest(unit, enemies.filter((enemy) => getMatchupMultiplier(unit.id, enemy.id) >= 1.8));
    let next = nearest;
    if (favored && nearest) {
      const favoredDist = Math.hypot(favored.x - unit.x, favored.y - unit.y);
      const nearDist = Math.hypot(nearest.x - unit.x, nearest.y - unit.y);
      if (favoredDist < nearDist * 1.7) next = favored;
    }
    if (!unit.target || !unit.target.alive) unit.target = next;
    else if (next && Math.hypot(next.x - unit.x, next.y - unit.y) < Math.hypot(unit.target.x - unit.x, unit.target.y - unit.y) * 0.65) unit.target = next;
  }
  if (!unit.target) return;
  const dx = unit.target.x - unit.x;
  const dy = unit.target.y - unit.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (Math.abs(dx) > 6) unit.facing = dx > 0 ? 1 : -1;

  if (unit.tags.includes('kite') && unit.kiteLock <= 0) {
    const threats = enemies.filter((enemy) => enemy.attackMode === 'melee');
    const threat = threats.length ? closest(unit, threats) : null;
    if (threat) {
      const td = Math.hypot(threat.x - unit.x, threat.y - unit.y);
      if (td < unit.range * 0.72) {
        unit.kiteTime += dt;
        if (unit.kiteTime > 3.4) unit.kiteLock = 2.2;
        const adx = unit.x - threat.x;
        const ady = unit.y - threat.y;
        const ad = Math.hypot(adx, ady) || 1;
        step(unit, adx / ad, ady / ad, dt);
        if (unit.atkCooldown <= 0 && td <= unit.range) {
          fireRanged(unit, unit.target, allAlive);
          unit.atkCooldown = unit.atkSpeed;
        }
        separate(unit, allAlive, dt);
        clampUnit(unit);
        return;
      }
    }
  } else if (unit.kiteLock > 0) {
    unit.kiteLock -= dt;
    unit.kiteTime = 0;
  }

  const reach = unit.range + (unit.size + unit.target.size) * 0.15;
  if (dist <= reach) {
    unit.moving = false;
    unit.chargeDist = unit.tags.includes('charge') ? unit.chargeDist : 0;
    if (unit.atkCooldown <= 0) {
      if (unit.tags.includes('pilum') && !unit.threw) fireRanged(unit, unit.target, allAlive, { kind: 'pilum', accuracy: 0.74, damageMul: 0.85, speed: 460, arc: 28 });
      else if (unit.attackMode === 'ranged') fireRanged(unit, unit.target, allAlive);
      else strikeMelee(unit, unit.target, allAlive);
      unit.atkCooldown = unit.atkSpeed;
      if (unit.tags.includes('pilum') && !unit.threw) {
        unit.threw = true;
        unit.atkCooldown = 0.65;
      }
    }
  } else {
    unit.moving = true;
    step(unit, dx / dist, dy / dist, dt);
    if (unit.tags.includes('charge')) unit.chargeDist += unit.speed * 60 * dt;
  }
  separate(unit, allAlive, dt);
  clampUnit(unit);
}

function updateHealer(unit, allAlive, dt) {
  const allies = allAlive.filter((other) => other.team === unit.team && other !== unit && other.currentHp < other.maxHp);
  if (!allies.length) {
    unit.moving = false;
    separate(unit, allAlive, dt);
    return;
  }
  allies.sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp);
  const target = allies[0];
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (Math.abs(dx) > 4) unit.facing = dx > 0 ? 1 : -1;
  if (dist <= unit.range) {
    unit.moving = false;
    if (unit.atkCooldown <= 0) {
      const heal = unit.healAmount || 8;
      target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
      unit.atkCooldown = unit.atkSpeed;
      playSound('heal', 0.4);
      projectiles.push({ kind: 'beam', x: unit.x, y: unit.y, tx: target.x, ty: target.y, life: 0.25, maxLife: 0.25 });
    }
  } else {
    unit.moving = true;
    step(unit, dx / dist, dy / dist, dt);
  }
  separate(unit, allAlive, dt);
  clampUnit(unit);
}

function updateBanner(unit, allAlive, dt) {
  const allies = allAlive.filter((other) => other.team === unit.team && other !== unit);
  if (!allies.length) return;
  const cx = allies.reduce((sum, other) => sum + other.x, 0) / allies.length;
  const cy = allies.reduce((sum, other) => sum + other.y, 0) / allies.length;
  const dx = cx - unit.x;
  const dy = cy - unit.y;
  const dist = Math.hypot(dx, dy) || 1;
  unit.moving = dist > 48;
  if (unit.moving) step(unit, dx / dist, dy / dist, dt);
  if (Math.abs(dx) > 4) unit.facing = dx > 0 ? 1 : -1;
  separate(unit, allAlive, dt);
  clampUnit(unit);
}

function step(unit, nx, ny, dt) {
  const speed = unit.speed * getMovementMultiplier(unit) * fearMultiplier(unit) * (pressAttack ? 1.18 : 1) * (1 + Math.min(3, unit.furyStacks || 0) * 0.06) * 60 * dt;
  unit.x += nx * speed;
  unit.y += ny * speed;
}
function clampUnit(unit) {
  unit.x = Math.max(unit.size, Math.min(WORLD_WIDTH - unit.size, unit.x));
  unit.y = Math.max(unit.size, Math.min(WORLD_HEIGHT - unit.size, unit.y));
}
function closest(unit, list) {
  let best = null;
  let bestDist = Infinity;
  list.forEach((other) => {
    const dist = Math.hypot(other.x - unit.x, other.y - unit.y);
    if (dist < bestDist) { bestDist = dist; best = other; }
  });
  return best;
}
function separate(unit, allAlive, dt) {
  allAlive.forEach((other) => {
    if (other === unit || other.team !== unit.team) return;
    const dx = unit.x - other.x;
    const dy = unit.y - other.y;
    const dist = Math.hypot(dx, dy);
    const min = (unit.size + other.size) * 0.72;
    if (dist > 0 && dist < min) {
      const push = (min - dist) * 0.35 * dt * 60;
      unit.x += (dx / dist) * push;
      unit.y += (dy / dist) * push;
    }
  });
}

function rollDie(sides) {
  return 1 + Math.floor(Math.random() * sides);
}

function chronicle(line) {
  const host = document.getElementById('chronicle');
  if (!host || !line) return;
  const row = document.createElement('div');
  row.textContent = line;
  host.appendChild(row);
  while (host.children.length > 3) host.removeChild(host.firstChild);
}

function resetDice() {
  dieQueue = [];
  dieAnim = null;
  const stage = document.getElementById('dice-stage');
  if (stage) stage.className = '';
  const book = document.getElementById('chronicle');
  if (book) book.innerHTML = '';
}

function dieCaption(entry) {
  const who = field((UNIT_BY_ID[entry.id] || {}).short) || '';
  return `${t(entry.tag.toLowerCase())} · ${who}`;
}

function refreshDieCaption() {
  if (!dieAnim || dieAnim.phase !== 'hold') return;
  const meta = document.getElementById('die-meta');
  if (meta) meta.textContent = dieCaption(dieAnim.entry);
}

function noteRoll(info) {
  if (!NOTABLE_ROLLS.has(info.tag)) return;
  dieQueue.push(info);
  while (dieQueue.length > 3) {
    const drop = dieQueue.findIndex((item) => item.tag !== 'CRIT');
    dieQueue.splice(drop === -1 ? 0 : drop, 1);
  }
}

function updateDice(realDt) {
  const stage = document.getElementById('dice-stage');
  const face = document.getElementById('die-face');
  const sides = document.getElementById('die-sides');
  const meta = document.getElementById('die-meta');
  if (!stage || !face) return;
  if (!dieAnim) {
    const next = dieQueue.shift();
    if (!next) {
      stage.className = '';
      return;
    }
    dieAnim = {
      entry: next,
      phase: 'roll',
      left: reducedMotion ? 0.04 : 0.7,
      tick: 0,
      hold: dieQueue.length ? 0.9 : 1.45
    };
    stage.className = 'show rolling';
    if (sides) sides.textContent = `d${next.sides}`;
    if (meta) meta.textContent = '';
    playSound('dice', 0.4);
  }
  dieAnim.left -= realDt;
  if (dieAnim.phase === 'roll') {
    dieAnim.tick -= realDt;
    if (dieAnim.tick <= 0) {
      dieAnim.tick = 0.07;
      face.textContent = String(rollDie(dieAnim.entry.sides));
    }
    if (dieAnim.left <= 0) {
      dieAnim.phase = 'hold';
      dieAnim.left = dieAnim.hold;
      face.textContent = String(dieAnim.entry.roll);
      stage.className = `show ${dieAnim.entry.tag.toLowerCase()}`;
      if (meta) meta.textContent = dieCaption(dieAnim.entry);
    }
    return;
  }
  if (dieAnim.left <= 0) dieAnim = null;
}

function meleeRoll(attacker) {
  const roll = rollDie(8);
  let mul = 0.86 + ((roll - 1) / 7) * 0.36;
  let tag = 'HIT';
  if (roll === 8) { mul = 1.62; tag = 'CRIT'; }
  if (roll === 1) { mul = 0.42; tag = 'GLANCE'; }
  if (attacker.tags.includes('charge') && attacker.chargeDist > 120) {
    mul *= attacker.chargeMul || 1.4;
    if (tag === 'HIT') tag = 'CHARGE';
    attacker.chargeDist = 0;
    playSound('charge', 0.55);
    burst(attacker.x, attacker.y, '#e6c36a', 6);
  }
  noteRoll({ sides: 8, roll, tag, id: attacker.id });
  return { mul, tag };
}

function shotRoll(accuracy) {
  const roll = rollDie(20);
  const need = Math.max(2, Math.min(19, 21 - Math.round(accuracy * 20)));
  const crit = roll === 20;
  const hit = crit || (roll !== 1 && roll >= need);
  const tag = crit ? 'CRIT' : hit ? 'HIT' : roll === 1 ? 'FUMBLE' : 'MISS';
  return { roll, hit, tag, mul: crit ? 1.6 : 1 };
}

function damageOf(attacker, target, diceMul, asRanged) {
  const matchup = getMatchupMultiplier(attacker.id, target.id);
  let damage = attacker.atk * matchup * diceMul;
  damage *= getBuffMultiplier(attacker, 'atkBoost');
  damage *= getBuffMultiplier(attacker, 'comeback');
  damage *= 1 + Math.min(3, attacker.furyStacks || 0) * 0.12;
  damage *= 1 + Math.min(0.2, (teamMomentum[attacker.team] || 0) * 0.015);
  damage *= auraMultiplier(attacker);
  if (pressAttack) damage *= 1.12;
  damage -= target.def * 0.35;
  if (target.rangedResist && (asRanged || attacker.attackMode === 'ranged')) {
    let resist = target.rangedResist;
    if (attacker.tags.includes('pierce') || attacker.tags.includes('gun')) resist *= 0.45;
    if (attacker.tags.includes('skirmish') || attacker.tags.includes('pilum')) resist *= 0.7;
    damage *= 1 - resist;
  }
  damage *= exhaustionMul();
  return { damage: Math.max(1, Math.round(damage)), matchup };
}

function strikeMelee(attacker, target, allAlive) {
  const rolled = meleeRoll(attacker);
  const { damage } = damageOf(attacker, target, rolled.mul);
  attacker.attackAnim = 0.3;
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const dist = Math.hypot(dx, dy) || 1;
  attacker.attackAnimDir = { x: dx / dist, y: dy / dist };
  playAttackSound(attacker);
  if (attacker.splash) {
    allAlive.forEach((other) => {
      if (other === target || other.team === attacker.team) return;
      const d = Math.hypot(other.x - target.x, other.y - target.y);
      if (d <= attacker.splash) dealDamage(other, Math.max(1, Math.round(damage * 0.45 * (1 - d / attacker.splash))), attacker);
    });
  }
  dealDamage(target, damage, attacker);
}

function fireRanged(attacker, target, allAlive, override) {
  const accuracy = override ? override.accuracy : attacker.accuracy || 0.7;
  const spec = shotRoll(accuracy * (target.moving ? 0.86 : 1) * (1 - Math.min(1, Math.hypot(target.x - attacker.x, target.y - attacker.y) / (attacker.range || 1)) * 0.12));
  noteRoll({ sides: 20, roll: spec.roll, tag: spec.tag, id: attacker.id });
  const { damage } = damageOf(attacker, target, (override ? override.damageMul : 1) * spec.mul, true);
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const dist = Math.hypot(dx, dy) || 1;
  attacker.attackAnim = 0.18;
  attacker.attackAnimDir = { x: -dx / dist, y: -dy / dist };
  let tx = target.x;
  let ty = target.y;
  if (!spec.hit) {
    const angle = Math.random() * Math.PI * 2;
    const miss = 36 + Math.random() * 48;
    tx += Math.cos(angle) * miss;
    ty += Math.sin(angle) * miss;
  }
  const kind = override ? override.kind : (attacker.shot || 'arrow');
  const speed = override ? override.speed : kind === 'bullet' ? 760 : kind === 'rock' ? 190 : kind === 'scorpion' ? 520 : 390;
  const arc = override ? override.arc : kind === 'rock' ? 110 : kind === 'bullet' ? 10 : kind === 'bolt' || kind === 'scorpion' ? 16 : 46;
  projectiles.push({
    kind, team: attacker.team,
    x: attacker.x, y: attacker.y - 6,
    prevX: attacker.x - dx / dist * 8, prevY: attacker.y - dy / dist * 8,
    sx: attacker.x, sy: attacker.y,
    tx, ty, t: 0,
    duration: Math.max(0.18, dist / speed),
    arc, damage, tag: spec.tag,
    willHit: spec.hit,
    target: spec.hit ? target : null,
    attacker, splash: attacker.splash || 0
  });
  playAttackSound(attacker);
  if (attacker.tags.includes('pilum')) attacker.threw = true;
}

function dealDamage(target, damage, attacker) {
  if (!target || !target.alive) return;
  target.currentHp -= damage;
  target.flashTimer = 0.12;
  burst(target.x, target.y, '#f3e6cf', 4);
  if (target.currentHp <= 0) killUnit(target, attacker);
}

function killUnit(target, attacker) {
  if (!target.alive) return;
  target.alive = false;
  target.currentHp = 0;
  lastKillAt = battleTime;
  if (attacker && attacker.alive) {
    attacker.killCount += 1;
    attacker.furyStacks = Math.min(3, (attacker.furyStacks || 0) + 1);
    attacker.furyTime = 8;
    teamMomentum[attacker.team] = Math.min(12, (teamMomentum[attacker.team] || 0) + 1);
  }
  if (ELITE_IDS.has(target.id)) chronicle(`${field(target.short) || field(target.name)} ${t('falls')}`);
  if (target.behavior === 'aura') showEventBanner(`${target.team.toUpperCase()} ${t('standardDown')}`, TEAM_COLORS[target.team].main);
  playSound('death', 0.45);
  deadUnits.push({
    sprite: target.sprite, tags: target.tags, facing: target.facing, threw: target.threw,
    id: target.id, size: target.size, team: target.team, x: target.x, y: target.y,
    attackMode: target.attackMode, attackAnim: 0, moving: false,
    deathTimer: 1.15, deathAngle: 0.4 + Math.random() * 0.4, deathDir: Math.random() < 0.5 ? -1 : 1
  });
  burst(target.x, target.y, TEAM_COLORS[target.team].main, 10);
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      type: 'dust', x, y,
      vx: Math.cos(angle) * (20 + Math.random() * 50),
      vy: Math.sin(angle) * (20 + Math.random() * 50),
      color, size: 2 + Math.random() * 2, life: 0.45, maxLife: 0.45
    });
  }
}
function updateProjectiles(dt) {
  projectiles = projectiles.filter((shot) => {
    if (shot.kind === 'beam') {
      shot.life -= dt;
      return shot.life > 0;
    }
    shot.t += dt / shot.duration;
    const progress = Math.min(1, shot.t);
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    shot.x = shot.sx + (shot.tx - shot.sx) * progress;
    shot.y = shot.sy + (shot.ty - shot.sy) * progress - Math.sin(Math.PI * progress) * shot.arc;
    if (progress < 1) return true;
    if (shot.kind === 'scorpion') {
      const clipped = units.filter((unit) => unit.alive && unit.team !== shot.team && distToSegment(unit.x, unit.y, shot.sx, shot.sy, shot.tx, shot.ty) < 20).slice(0, 3);
      if (!clipped.length) {
        missMarkers.push({ x: shot.tx, y: shot.ty, life: 0.6 });
      }
      clipped.forEach((unit, index) => {
        const amount = Math.max(1, Math.round(shot.damage * (index === 0 ? 1 : 0.68)));
        dealDamage(unit, amount, shot.attacker);
      });
      playImpactSound(shot);
      return false;
    }
    if (shot.willHit) {
      playImpactSound(shot);
      if (shot.splash > 0) {
        shake = Math.max(shake, shot.kind === 'rock' ? 7 : 0);
        units.forEach((unit) => {
          if (!unit.alive || unit.team === shot.team) return;
          const dist = Math.hypot(unit.x - shot.tx, unit.y - shot.ty);
          if (dist <= shot.splash) {
            const amount = Math.max(1, Math.round(shot.damage * (1 - dist / shot.splash * 0.45)));
            dealDamage(unit, amount, shot.attacker);
          }
        });
        burst(shot.tx, shot.ty, '#d9c7a2', 14);
      } else if (shot.target) {
        dealDamage(shot.target, shot.damage, shot.attacker);
      }
    } else {
      missMarkers.push({ x: shot.tx, y: shot.ty, life: 0.6 });
      burst(shot.tx, shot.ty, '#8a8175', 4);
    }
    return false;
  });
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy || 1;
  let ratio = ((px - x1) * dx + (py - y1) * dy) / len;
  ratio = Math.max(0, Math.min(1, ratio));
  return Math.hypot(px - (x1 + dx * ratio), py - (y1 + dy * ratio));
}

function showResult(winner, redLeft, blueLeft) {
  lastResult = { winner, redLeft, blueLeft };
  stopMusic();
  playSound('victory', 0.8);
  const text = document.getElementById('result-text');
  const sub = document.getElementById('result-sub');
  if (winner === 'DRAW') {
    text.textContent = t('draw');
    text.style.color = '#8a6233';
    sub.textContent = t('drawSub');
  } else {
    text.textContent = `${winner} ${t('wins')}`;
    text.style.color = winner === 'RED' ? '#9d2e2a' : '#146676';
    const top = units.filter((unit) => unit.killCount > 0).sort((a, b) => b.killCount - a.killCount).slice(0, 5);
    const redKills = units.filter((unit) => unit.team === 'red').reduce((sum, unit) => sum + unit.killCount, 0);
    const blueKills = units.filter((unit) => unit.team === 'blue').reduce((sum, unit) => sum + unit.killCount, 0);
    const lines = top.map((unit, index) => {
      const medal = ['I', 'II', 'III', '·', '·'][index];
      return `<div>${medal}. ${field(unit.name)} · ${unit.killCount} ${t('kills')}${unit.alive ? ` · ${t('alive')}` : ''}</div>`;
    }).join('');
    sub.innerHTML = `<div>${t('survivors')}: ${winner === 'RED' ? redLeft : blueLeft} · ${battleTime.toFixed(0)}s</div><div>RED ${redKills} / BLUE ${blueKills}</div><div style="margin-top:8px"><b>${t('leaderboard')}</b>${lines}</div>`;
  }
  document.getElementById('result').classList.add('open');
  gameState = 'ended';
  cameraMode = 'free';
  glide = false;
  refreshBattleButton();
}

function updateCamera(dt) {
  if (cameraHold) return;
  const following = gameState === 'battle' && cameraMode === 'follow';
  if (!following && !glide) return;
  const focus = battleFocus();
  const k = 1 - Math.exp(-Math.max(0, dt) * 2.6);
  camera.zoom += (focus.zoom - camera.zoom) * k;
  const tx = focus.cx - canvas.width / (2 * camera.zoom);
  const ty = focus.cy - canvas.height / (2 * camera.zoom);
  camera.x += (tx - camera.x) * k;
  camera.y += (ty - camera.y) * k;
  clampCamera();
  if (glide && !following) {
    const viewX = camera.x + canvas.width / (2 * camera.zoom);
    const viewY = camera.y + canvas.height / (2 * camera.zoom);
    if (Math.hypot(viewX - focus.cx, viewY - focus.cy) < 8 && Math.abs(camera.zoom - focus.zoom) < 0.04) glide = false;
  }
}

let lastTime = 0;
let loopError = '';
function gameLoop(timestamp) {
  const real = Math.min(0.05, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;
  animTime += real;
  const dt = real * gameSpeed;
  try {
    updateCamera(real);
    updateDice(real);
    updateBattle(dt);
    render();
  } catch (err) {
    if (!loopError) console.error(err);
    loopError = String(err && err.stack || err);
  }
  if (gameState === 'battle' && timestamp - lastAmbience > 2800) {
    lastAmbience = timestamp;
    const alive = units.filter((unit) => unit.alive);
    if (alive.length > 8) {
      playAmbienceTick(
        alive.some((unit) => unit.tags.includes('horse')),
        alive.some((unit) => unit.tags.includes('elephant'))
      );
    }
  }
  requestAnimationFrame(gameLoop);
}

window.__age = () => {
  const focus = battleFocus();
  const viewX = camera.x + (canvas ? canvas.width : 0) / (2 * camera.zoom);
  const viewY = camera.y + (canvas ? canvas.height : 0) / (2 * camera.zoom);
  const stage = document.getElementById('dice-stage');
  return {
    gameState,
    battleTime,
    alive: units.filter((unit) => unit.alive).length,
    total: units.length,
    projectiles: projectiles.length,
    loopError,
    cameraMode,
    camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
    view: { x: viewX, y: viewY },
    focus,
    off: focus ? Math.hypot(viewX - focus.cx, viewY - focus.cy) : null,
    dieShown: !!(stage && stage.classList.contains('show')),
    dieText: stage ? stage.innerText : '',
    chronicle: document.getElementById('chronicle') ? document.getElementById('chronicle').innerText : '',
    floaters: particles.filter((particle) => particle.text).length
  };
};
window.addEventListener('load', init);
