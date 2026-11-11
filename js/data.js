/* Age of Battels — game data: terrain, units, players, strings. DOM-free. */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};

AB.TW = 64; AB.TH = 32;            // tile diamond size in world px
AB.MAX_UNITS = 4000;

// pass: walkable, spd: speed multiplier, c: base colour
AB.TERRAIN = [
  { id: 'grass',   pass: 1, spd: 1,    c: [104, 142, 62] },
  { id: 'meadow',  pass: 1, spd: 1,    c: [78, 124, 54] },
  { id: 'dirt',    pass: 1, spd: 1,    c: [143, 112, 74] },
  { id: 'sand',    pass: 1, spd: 0.92, c: [214, 190, 132] },
  { id: 'snow',    pass: 1, spd: 0.85, c: [232, 238, 244] },
  { id: 'road',    pass: 1, spd: 1.25, c: [171, 150, 118] },
  { id: 'shallow', pass: 1, spd: 0.6,  c: [92, 164, 176] },
  { id: 'water',   pass: 0, spd: 0,    c: [44, 98, 150] },
];
AB.OBJECTS = [null, { id: 'tree' }, { id: 'rock' }];

AB.PLAYERS = [
  { id: 'blue',   m: '#2f6fd6', d: '#1b448c', l: '#7fb0ff' },
  { id: 'red',    m: '#d33a2c', d: '#8a1f16', l: '#ff8d7e' },
  { id: 'green',  m: '#3b9a3a', d: '#1f5e22', l: '#8fdc86' },
  { id: 'yellow', m: '#e3bb22', d: '#96780c', l: '#ffe98a' },
  { id: 'teal',   m: '#22b5b0', d: '#10716f', l: '#8af0ea' },
  { id: 'purple', m: '#9a4fd0', d: '#5e2a88', l: '#d3a4f5' },
  { id: 'white',  m: '#d9dde2', d: '#8a9099', l: '#ffffff' },
  { id: 'orange', m: '#e9822a', d: '#9a4d10', l: '#ffc08a' },
];

AB.PROJ = {
  arrow:   { spd: 11,  arc: 0.16 },
  bolt:    { spd: 14,  arc: 0.08 },
  javelin: { spd: 9,   arc: 0.14 },
  bullet:  { spd: 34,  arc: 0 },
  stone:   { spd: 6.5, arc: 0.36 },
  ball:    { spd: 17,  arc: 0.07 },
  bigbolt: { spd: 15,  arc: 0.04 },
};

/* Unit fields:
   hp, atk, at (m melee / p pierce / s siege), am/ap armour, rng (edge-to-edge reach), rof, wind (windup s),
   spd (tiles/s), r (radius, tiles), cost, cls (classes for bonuses), bonus {cls: multiplier}, look (sprite spec) */
const base = { cat: 'inf', hp: 50, atk: 5, at: 'm', am: 0, ap: 0, rng: 0.35, rof: 1.5, wind: 0.35, spd: 1.9, r: 0.24, cost: 50, cls: ['inf'], acq: 9 };
function U(o) { return Object.assign({}, base, o); }
const bbase = { cat: 'bld', bld: 1, size: 1, hp: 500, atk: 0, at: 'p', am: 5, ap: 10, rng: 0, rof: 2, wind: 0, spd: 0, r: 0.5, cost: 20, cls: ['bld'] };
function B(o) { const d = Object.assign({}, bbase, o); d.r = d.size / 2; return d; }

AB.UNITS = {
  // ---- infantry
  levy:      U({ hp: 36, atk: 4, cost: 25, look: { b: 'human', helm: 'none', armor: 'cloth', wpn: 'fork' } }),
  swordsman: U({ hp: 70, atk: 9, am: 2, ap: 1, rof: 1.4, spd: 1.8, cost: 55, look: { b: 'human', helm: 'nasal', armor: 'mail', wpn: 'sword', shield: 'round' } }),
  spearman:  U({ hp: 55, atk: 5, am: 1, ap: 1, rng: 0.6, rof: 1.6, cost: 40, bonus: { cav: 3, camel: 2, ele: 3 }, look: { b: 'human', helm: 'kettle', armor: 'leather', wpn: 'spear', shield: 'round' } }),
  pikeman:   U({ hp: 75, atk: 6, am: 2, ap: 2, rng: 0.9, rof: 1.7, spd: 1.65, cost: 65, bonus: { cav: 3.6, camel: 2.4, ele: 3.6 }, look: { b: 'human', helm: 'kettle', armor: 'mail', wpn: 'pike' } }),
  manatarms: U({ hp: 120, atk: 13, am: 5, ap: 3, rof: 1.6, spd: 1.55, cost: 110, look: { b: 'human', helm: 'great', armor: 'plate', wpn: 'greatsword' } }),
  berserker: U({ hp: 80, atk: 13, am: 1, ap: 0, rof: 1.15, wind: 0.28, spd: 2.3, cost: 100, bonus: { bld: 1.5 }, look: { b: 'human', helm: 'horn', armor: 'bare', wpn: 'axes' } }),
  // ---- ranged
  archer:     U({ cat: 'rng', hp: 35, atk: 7, at: 'p', rng: 6.5, rof: 1.5, wind: 0.5, proj: 'arrow', acc: 0.82, cost: 45, cls: ['inf', 'archer'], look: { b: 'human', helm: 'cap', armor: 'cloth', wpn: 'bow' } }),
  crossbow:   U({ cat: 'rng', hp: 42, atk: 12, at: 'p', am: 1, ap: 1, rng: 7, rof: 2.3, wind: 0.55, proj: 'bolt', acc: 0.9, cost: 60, cls: ['inf', 'archer'], look: { b: 'human', helm: 'kettle', armor: 'leather', wpn: 'crossbow' } }),
  skirmisher: U({ cat: 'rng', hp: 48, atk: 5, at: 'p', ap: 5, rng: 4.5, rof: 1.8, wind: 0.45, proj: 'javelin', acc: 0.86, spd: 2, cost: 40, cls: ['inf'], bonus: { archer: 3.2 }, look: { b: 'human', helm: 'none', armor: 'cloth', wpn: 'javelin', shield: 'round' } }),
  musketeer:  U({ cat: 'rng', hp: 45, atk: 30, at: 'p', rng: 6.5, rof: 3.2, wind: 0.6, proj: 'bullet', acc: 0.72, cost: 80, cls: ['inf', 'archer'], look: { b: 'human', helm: 'hat', armor: 'cloth', wpn: 'musket' } }),
  // ---- cavalry
  lightcav:    U({ cat: 'cav', hp: 88, atk: 9, am: 1, ap: 2, spd: 3.4, r: 0.36, cost: 75, cls: ['cav'], bonus: { siege: 2, archer: 1.3 }, charge: 1.6, look: { b: 'rider', mount: 'horse', mc: '#8a5a3a', helm: 'cap', armor: 'leather', wpn: 'sword' } }),
  knight:      U({ cat: 'cav', hp: 190, atk: 15, am: 4, ap: 3, rof: 1.6, spd: 2.9, r: 0.38, cost: 160, cls: ['cav'], charge: 2.2, look: { b: 'rider', mount: 'horse', mc: '#5a4334', bard: 1, helm: 'great', armor: 'plate', wpn: 'lance', shield: 'kite' } }),
  horsearcher: U({ cat: 'cav', hp: 66, atk: 7, at: 'p', rng: 5.5, rof: 1.6, wind: 0.5, proj: 'arrow', acc: 0.75, spd: 3.1, r: 0.36, cost: 70, cls: ['cav', 'archer'], look: { b: 'rider', mount: 'horse', mc: '#a9834f', helm: 'fur', armor: 'leather', wpn: 'bow' } }),
  camel:       U({ cat: 'cav', hp: 105, atk: 8, am: 1, ap: 1, rng: 0.5, spd: 2.9, r: 0.38, cost: 85, cls: ['camel'], bonus: { cav: 2.6 }, look: { b: 'rider', mount: 'camel', mc: '#c9a36a', helm: 'turban', armor: 'cloth', wpn: 'spear' } }),
  elephant:    U({ cat: 'cav', hp: 600, atk: 26, am: 3, ap: 4, rng: 0.5, rof: 1.8, wind: 0.5, spd: 1.5, r: 0.62, splash: 0.9, cost: 450, cls: ['ele'], bonus: { bld: 1.6 }, look: { b: 'elephant' } }),
  commander:   U({ cat: 'sup', hp: 280, atk: 16, am: 4, ap: 4, spd: 2.8, r: 0.38, cost: 320, cls: ['cav'], aura: 5, charge: 1.5, look: { b: 'rider', mount: 'horse', mc: '#e6e0d2', bard: 1, helm: 'great', armor: 'plate', wpn: 'sword', cape: 1, banner: 1 } }),
  // ---- siege
  catapult: U({ cat: 'siege', hp: 70, atk: 36, at: 's', ap: 3, rng: 9.5, minR: 3, rof: 6.5, wind: 0.8, proj: 'stone', acc: 0.7, splash: 1.2, spd: 1.05, r: 0.5, cost: 230, cls: ['siege'], bonus: { bld: 2.5 }, look: { b: 'catapult' } }),
  ballista: U({ cat: 'siege', hp: 60, atk: 30, at: 'p', ap: 3, rng: 8.5, rof: 4.4, wind: 0.5, proj: 'bigbolt', pierce: 1, acc: 0.92, spd: 1.2, r: 0.46, cost: 180, cls: ['siege'], look: { b: 'ballista' } }),
  cannon:   U({ cat: 'siege', hp: 75, atk: 60, at: 's', ap: 4, rng: 10.5, minR: 3, rof: 6.5, wind: 0.6, proj: 'ball', splash: 0.9, spd: 1, r: 0.5, cost: 260, cls: ['siege'], bonus: { bld: 3 }, look: { b: 'cannon' } }),
  ram:      U({ cat: 'siege', hp: 240, atk: 4, ap: 14, rng: 0.5, rof: 2.4, wind: 0.6, spd: 1.35, r: 0.5, cost: 110, cls: ['siege'], bonus: { bld: 28 }, pref: 'bld', look: { b: 'ram' } }),
  // ---- support / other
  monk: U({ cat: 'sup', hp: 38, atk: 0, heal: 7, rng: 3.2, rof: 1, wind: 0.4, spd: 1.7, cost: 80, look: { b: 'human', helm: 'hood', armor: 'robe', wpn: 'staff' } }),
  wolf: U({ cat: 'sup', hp: 26, atk: 5, rof: 1.2, wind: 0.25, spd: 3.3, r: 0.25, cost: 30, cls: ['beast'], look: { b: 'wolf' } }),
  // ---- buildings
  palisade: B({ hp: 350, am: 3, ap: 9, wall: 1, cost: 8, look: { b: 'palisade' } }),
  wall:     B({ hp: 1400, am: 8, ap: 14, wall: 1, cost: 25, look: { b: 'wall' } }),
  gate:     B({ hp: 1000, am: 7, ap: 14, wall: 1, gate: 1, cost: 60, look: { b: 'gate' } }),
  tower:    B({ hp: 900, am: 6, ap: 11, atk: 8, rng: 8, rof: 1.5, proj: 'arrow', acc: 0.86, volley: 1, cost: 160, look: { b: 'tower' } }),
  keep:     B({ size: 3, hp: 4200, am: 9, ap: 13, atk: 9, rng: 9, rof: 1.6, proj: 'arrow', acc: 0.86, volley: 5, cost: 800, look: { b: 'keep' } }),
  tent:     B({ hp: 180, am: 0, ap: 3, cost: 15, look: { b: 'tent' } }),
};
for (const k in AB.UNITS) { const d = AB.UNITS[k]; d.id = k; if (!d.bld) d.hp = Math.round(d.hp * 1.25 / 5) * 5; }
AB.UNIT_ORDER = ['levy', 'swordsman', 'spearman', 'pikeman', 'manatarms', 'berserker', 'archer', 'crossbow', 'skirmisher', 'musketeer',
  'lightcav', 'knight', 'horsearcher', 'camel', 'elephant', 'catapult', 'ballista', 'cannon', 'ram', 'commander', 'monk', 'wolf'];
AB.BLD_ORDER = ['palisade', 'wall', 'gate', 'tower', 'keep', 'tent'];
AB.CATS = ['all', 'inf', 'rng', 'cav', 'siege', 'sup'];

// ---------------------------------------------------------------- strings
const ko = {
  title: '에이지 오브 배틀스', sub: '전투 시뮬레이션 샌드박스',
  newMap: '새 지도', presets: '예제 전투', saveLoad: '저장 · 불러오기', help: '도움말', start: '전투 시작',
  pause: '일시정지', resume: '계속', restart: '재시작', toEdit: '편집으로', speed: '속도', sound: '소리',
  tTerrain: '지형', tObject: '사물', tUnit: '유닛', tBld: '건물', tErase: '지우개', tSelect: '선택', tHand: '이동',
  brush: '붓 크기', density: '밀도', count: '배치 수', stance: '태세', st0: '공격', st1: '방어', st2: '고수',
  st0d: '적을 찾아 끝까지 추격합니다', st1d: '가까이 온 적만 상대하고 제자리로 돌아옵니다', st2d: '자리를 지키며 닿는 적만 공격합니다',
  player: '플레이어', team: '팀', army: '군대 현황', units: '유닛', value: '전력', clearArmies: '군대 모두 지우기', clearMine: '이 플레이어 지우기',
  tree: '나무', rock: '바위', objErase: '사물 지우기',
  c_all: '전체', c_inf: '보병', c_rng: '원거리', c_cav: '기병', c_siege: '공성', c_sup: '기타',
  hp: '체력', atk: '공격', armor: '방어(근접/관통)', range: '사거리', rate: '공격 주기', move: '이동', cost: '전력값',
  strong: '강함', melee: '근접', heal: '치유', none: '없음',
  size: '크기', sSmall: '작게 48', sMed: '보통 64', sLarge: '크게 96', sHuge: '초대형 128', baseT: '바탕',
  blank: '빈 지도', random: '무작위 지형', bTemperate: '초원', bDesert: '사막', bSnow: '설원', create: '만들기', cancel: '취소', close: '닫기',
  saveAs: '이름을 정해 저장', save: '저장', load: '불러오기', del: '삭제', exportF: '파일로 내보내기', importF: '파일 불러오기',
  saved: '저장했습니다', loaded: '불러왔습니다', noSaves: '저장된 지도가 없습니다', badFile: '읽을 수 없는 파일입니다',
  needTwo: '서로 다른 팀의 군대가 둘 이상 있어야 전투를 시작할 수 있습니다', capHit: '유닛 수 한도에 도달했습니다',
  victory: '승리', draw: '무승부', stalemate: '교착 상태 — 더 싸울 수 없습니다', battleTime: '전투 시간',
  deployed: '투입', lost: '손실', survived: '생존', kills: '처치', dmg: '피해량', razed: '파괴', mvp: '최다 처치',
  again: '다시 싸우기', watch: '전장 둘러보기', strength: '전력 추이',
  selN: '선택됨', stop: '정지', delSel: '삭제',
  welcome: '전투를 고르거나 직접 만들어 보세요', welcomeSub: '지형을 칠하고, 군대를 배치하고, 전투 시작을 누르면 병사들이 알아서 싸웁니다.',
  startBlank: '빈 지도에서 직접 만들기', continueEdit: '하던 편집 계속하기',
  undo: '되돌리기', redo: '다시 실행', mapName: '지도 이름', untitled: '이름 없는 전투',
  helpBody: `<h3>편집</h3>
<ul><li><b>지형·사물·유닛·건물</b> 탭에서 고른 뒤 지도를 클릭하거나 끌어서 배치합니다.</li>
<li>유닛은 <b>배치 수</b>만큼 대형으로 놓입니다. 플레이어 색과 팀을 정하면 같은 팀끼리는 싸우지 않습니다.</li>
<li><b>오른쪽 끌기</b> 또는 <b>WASD/방향키</b>로 화면 이동, <b>휠</b>로 확대·축소.</li>
<li><b>Ctrl+Z / Ctrl+Y</b> 되돌리기·다시 실행, <b>1–6</b> 도구 전환, <b>Delete</b> 선택 삭제.</li></ul>
<h3>전투</h3>
<ul><li><b>Space</b> 일시정지, <b>+ / −</b> 속도 조절.</li>
<li>왼쪽 끌기로 부대를 선택하고 <b>오른쪽 클릭</b>으로 이동·공격 명령을 내릴 수 있습니다. 그냥 구경만 해도 됩니다.</li>
<li>선택 후 <b>G</b> 공격 · <b>D</b> 방어 · <b>H</b> 고수 · <b>X</b> 정지.</li></ul>
<h3>상성</h3>
<ul><li>창병·장창병·낙타병은 기병과 코끼리에 강합니다.</li><li>투창병은 궁병을 잡습니다. 기병은 궁병과 공성 무기를 덮칩니다.</li>
<li>공성추·투석기·대포는 성벽과 건물을 부숩니다. 성벽에 막히면 병사들이 스스로 길을 뚫습니다.</li>
<li>수도승은 아군을 치료하고, 장군은 주변 아군의 공격력을 올립니다.</li></ul>`,
  // terrain
  t_grass: '풀밭', t_meadow: '짙은 초지', t_dirt: '흙', t_sand: '모래', t_snow: '눈', t_road: '길', t_shallow: '얕은 물', t_water: '깊은 물',
  // players
  p_blue: '파랑', p_red: '빨강', p_green: '초록', p_yellow: '노랑', p_teal: '청록', p_purple: '보라', p_white: '하양', p_orange: '주황',
  // units
  u_levy: '징집병', u_swordsman: '검병', u_spearman: '창병', u_pikeman: '장창병', u_manatarms: '중장보병', u_berserker: '광전사',
  u_archer: '궁병', u_crossbow: '석궁병', u_skirmisher: '투창병', u_musketeer: '화승총병',
  u_lightcav: '경기병', u_knight: '기사', u_horsearcher: '궁기병', u_camel: '낙타병', u_elephant: '전투 코끼리', u_commander: '장군',
  u_catapult: '투석기', u_ballista: '노포', u_cannon: '대포', u_ram: '공성추', u_monk: '수도승', u_wolf: '늑대',
  u_palisade: '목책', u_wall: '석벽', u_gate: '성문', u_tower: '감시탑', u_keep: '성채', u_tent: '천막',
  d_levy: '쇠스랑을 든 농민. 싸고 많다.', d_swordsman: '방패와 검을 든 믿음직한 주력 보병.', d_spearman: '기병과 코끼리를 막는 값싼 창.',
  d_pikeman: '긴 창으로 돌격을 꿰뚫는 중보병.', d_manatarms: '판금 갑옷과 대검. 느리지만 단단하다.', d_berserker: '쌍도끼로 빠르게 몰아치지만 갑옷이 없다.',
  d_archer: '멀리서 화살을 퍼붓는다. 붙으면 약하다.', d_crossbow: '느리지만 강한 한 발.', d_skirmisher: '화살에 강한 방패와 투창. 궁병의 천적.',
  d_musketeer: '빗나가기 쉽지만 맞으면 치명적.', d_lightcav: '빠르게 파고들어 궁병과 공성 무기를 덮친다.', d_knight: '돌격 첫 타격이 강력한 중기병.',
  d_horsearcher: '말 위에서 활을 쏘는 기동 사수.', d_camel: '말이 낙타를 두려워한다. 기병 사냥꾼.', d_elephant: '짓밟아 주변까지 피해를 준다. 창을 조심.',
  d_commander: '주변 아군의 공격력을 20% 올린다.', d_catapult: '돌을 던져 넓은 범위를 뭉갠다. 가까운 적은 못 쏜다.',
  d_ballista: '일직선의 적을 꿰뚫는 큰 화살.', d_cannon: '가장 긴 사거리, 성벽 파괴의 왕.', d_ram: '화살이 통하지 않는다. 건물만 노린다.',
  d_monk: '가까운 아군의 상처를 치료한다.', d_wolf: '빠르고 약한 야수. 떼로 풀어 보자.',
  d_palisade: '값싼 나무 울타리.', d_wall: '공성 무기 없이는 뚫기 힘든 돌벽.', d_gate: '같은 팀만 지나가는 문.',
  d_tower: '사거리 안의 적에게 화살을 쏜다.', d_keep: '한 번에 화살 다섯 발. 3×3 칸.', d_tent: '무장 없는 야영지.',
  // presets
  pr_field: '평원 회전', pr_field_d: '양쪽이 고르게 섞인 정석 회전. 약 320명.',
  pr_river: '강 건너기', pr_river_d: '여울 두 곳과 다리 하나. 수비군이 강을 지킨다.',
  pr_siege: '공성전', pr_siege_d: '성벽과 감시탑, 성채를 공성 무기로 무너뜨린다.',
  pr_ffa: '사파전', pr_ffa_d: '네 세력이 한가운데서 뒤엉킨다.',
  pr_knights: '기사 40 대 징집병 400', pr_knights_d: '질이냐 양이냐. 지도 편집기의 고전 실험.',
  pr_ele: '코끼리 돌격', pr_ele_d: '사막의 코끼리 부대가 창벽을 들이받는다.',
  pr_random: '무작위 전투', pr_random_d: '지형과 군대를 매번 새로 뽑는다.',
};
const en = {
  title: 'Age of Battels', sub: 'Battle simulation sandbox',
  newMap: 'New map', presets: 'Battles', saveLoad: 'Save · Load', help: 'Help', start: 'Start battle',
  pause: 'Pause', resume: 'Resume', restart: 'Restart', toEdit: 'Back to editor', speed: 'Speed', sound: 'Sound',
  tTerrain: 'Terrain', tObject: 'Objects', tUnit: 'Units', tBld: 'Buildings', tErase: 'Eraser', tSelect: 'Select', tHand: 'Pan',
  brush: 'Brush size', density: 'Density', count: 'Group size', stance: 'Stance', st0: 'Aggressive', st1: 'Defensive', st2: 'Hold',
  st0d: 'Seeks out enemies anywhere on the map', st1d: 'Fights enemies that come close, then returns', st2d: 'Stays put and attacks only what it can reach',
  player: 'Player', team: 'Team', army: 'Armies', units: 'Units', value: 'Value', clearArmies: 'Remove all armies', clearMine: 'Remove this player',
  tree: 'Trees', rock: 'Rocks', objErase: 'Remove objects',
  c_all: 'All', c_inf: 'Infantry', c_rng: 'Ranged', c_cav: 'Cavalry', c_siege: 'Siege', c_sup: 'Other',
  hp: 'HP', atk: 'Attack', armor: 'Armour (melee/pierce)', range: 'Range', rate: 'Attack period', move: 'Speed', cost: 'Value',
  strong: 'Strong vs', melee: 'melee', heal: 'Heal', none: 'none',
  size: 'Size', sSmall: 'Small 48', sMed: 'Medium 64', sLarge: 'Large 96', sHuge: 'Huge 128', baseT: 'Base',
  blank: 'Blank map', random: 'Random terrain', bTemperate: 'Grassland', bDesert: 'Desert', bSnow: 'Snow', create: 'Create', cancel: 'Cancel', close: 'Close',
  saveAs: 'Save under a name', save: 'Save', load: 'Load', del: 'Delete', exportF: 'Export to file', importF: 'Import file',
  saved: 'Saved', loaded: 'Loaded', noSaves: 'No saved maps yet', badFile: 'That file could not be read',
  needTwo: 'Place armies for at least two different teams before starting', capHit: 'Unit limit reached',
  victory: 'Victory', draw: 'Draw', stalemate: 'Stalemate — nobody can reach the enemy', battleTime: 'Battle time',
  deployed: 'Deployed', lost: 'Lost', survived: 'Survived', kills: 'Kills', dmg: 'Damage', razed: 'Razed', mvp: 'Most kills',
  again: 'Fight again', watch: 'Look around', strength: 'Army strength over time',
  selN: 'selected', stop: 'Stop', delSel: 'Delete',
  welcome: 'Pick a battle or build your own', welcomeSub: 'Paint terrain, place armies, press Start — the soldiers do the rest.',
  startBlank: 'Start from a blank map', continueEdit: 'Continue editing',
  undo: 'Undo', redo: 'Redo', mapName: 'Map name', untitled: 'Untitled battle',
  helpBody: `<h3>Editing</h3>
<ul><li>Pick from the <b>Terrain, Objects, Units, Buildings</b> tabs, then click or drag on the map.</li>
<li>Units are placed in formation, <b>group size</b> at a time. Players on the same team never fight each other.</li>
<li><b>Right-drag</b> or <b>WASD / arrows</b> to pan, <b>wheel</b> to zoom.</li>
<li><b>Ctrl+Z / Ctrl+Y</b> undo and redo, <b>1–6</b> switch tools, <b>Delete</b> removes the selection.</li></ul>
<h3>Battle</h3>
<ul><li><b>Space</b> pauses, <b>+ / −</b> change speed.</li>
<li>Left-drag to select troops and <b>right-click</b> to move or attack. Or just watch.</li>
<li>With a selection: <b>G</b> aggressive · <b>D</b> defensive · <b>H</b> hold · <b>X</b> stop.</li></ul>
<h3>Counters</h3>
<ul><li>Spearmen, pikemen and camels beat cavalry and elephants.</li><li>Skirmishers beat archers. Cavalry runs down archers and siege engines.</li>
<li>Rams, catapults and cannons break walls. Troops blocked by a wall will breach it themselves.</li>
<li>Monks heal nearby allies; a commander raises nearby allies' damage.</li></ul>`,
  t_grass: 'Grass', t_meadow: 'Lush grass', t_dirt: 'Dirt', t_sand: 'Sand', t_snow: 'Snow', t_road: 'Road', t_shallow: 'Shallows', t_water: 'Deep water',
  p_blue: 'Blue', p_red: 'Red', p_green: 'Green', p_yellow: 'Yellow', p_teal: 'Teal', p_purple: 'Purple', p_white: 'White', p_orange: 'Orange',
  u_levy: 'Levy', u_swordsman: 'Swordsman', u_spearman: 'Spearman', u_pikeman: 'Pikeman', u_manatarms: 'Man-at-arms', u_berserker: 'Berserker',
  u_archer: 'Archer', u_crossbow: 'Crossbowman', u_skirmisher: 'Skirmisher', u_musketeer: 'Musketeer',
  u_lightcav: 'Light cavalry', u_knight: 'Knight', u_horsearcher: 'Horse archer', u_camel: 'Camel rider', u_elephant: 'War elephant', u_commander: 'Commander',
  u_catapult: 'Catapult', u_ballista: 'Ballista', u_cannon: 'Cannon', u_ram: 'Battering ram', u_monk: 'Monk', u_wolf: 'Wolf',
  u_palisade: 'Palisade', u_wall: 'Stone wall', u_gate: 'Gate', u_tower: 'Watch tower', u_keep: 'Keep', u_tent: 'Tent',
  d_levy: 'Peasants with pitchforks. Cheap and plentiful.', d_swordsman: 'Sword and shield; the dependable line.', d_spearman: 'Cheap spears that stop cavalry and elephants.',
  d_pikeman: 'Heavy infantry whose long pikes skewer a charge.', d_manatarms: 'Plate and greatsword. Slow, very tough.', d_berserker: 'Twin axes, fast swings, no armour.',
  d_archer: 'Showers arrows from afar; weak up close.', d_crossbow: 'Slow to load, hits hard.', d_skirmisher: 'Arrow-proof shield and javelins. Hunts archers.',
  d_musketeer: 'Often misses; deadly when it lands.', d_lightcav: 'Fast raiders that run down archers and siege.', d_knight: 'Heavy cavalry with a crushing first charge.',
  d_horsearcher: 'Mobile bowman on horseback.', d_camel: 'Horses fear camels. A cavalry hunter.', d_elephant: 'Tramples everything nearby. Beware spears.',
  d_commander: 'Nearby allies deal 20% more damage.', d_catapult: 'Lobs stones over a wide area. Cannot hit close targets.',
  d_ballista: 'A heavy bolt that pierces a whole file.', d_cannon: 'Longest range; the wall breaker.', d_ram: 'Shrugs off arrows. Only wants buildings.',
  d_monk: 'Heals wounded allies nearby.', d_wolf: 'Fast, fragile beast. Try a pack.',
  d_palisade: 'Cheap wooden fence.', d_wall: 'Hard to breach without siege engines.', d_gate: 'Only its own team may pass.',
  d_tower: 'Shoots arrows at enemies in range.', d_keep: 'Five arrows per volley. Covers 3×3 tiles.', d_tent: 'An unarmed camp.',
  pr_field: 'Pitched battle', pr_field_d: 'Two balanced, mixed armies on open ground. About 320 troops.',
  pr_river: 'River crossing', pr_river_d: 'Two fords and a bridge. The defenders hold the far bank.',
  pr_siege: 'The siege', pr_siege_d: 'Walls, towers and a keep against rams and catapults.',
  pr_ffa: 'Four-way brawl', pr_ffa_d: 'Four factions collide in the middle.',
  pr_knights: '40 knights vs 400 levies', pr_knights_d: 'Quality or quantity? The classic map-editor experiment.',
  pr_ele: 'Elephant charge', pr_ele_d: 'Desert elephants crash into a wall of pikes.',
  pr_random: 'Random battle', pr_random_d: 'New terrain and new armies every time.',
};
AB.L = { ko, en };
AB.lang = 'ko';
AB.T = function (k) { const v = AB.L[AB.lang][k]; return v !== undefined ? v : (AB.L.en[k] !== undefined ? AB.L.en[k] : k); };
AB.TEAM_NAMES = 'ABCDEFGH';
})(typeof globalThis !== 'undefined' ? globalThis : this);
