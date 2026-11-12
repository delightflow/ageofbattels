/* Age of Battels — the ways to play around the editor: unit codex, matchup lab, budget challenges,
   and spectating (kill feed, unit inspector, follow camera, pre-battle prediction with simulated odds). */
(function () {
'use strict';
const AB = window.AB, A = AB.App, H = A.H, S = AB.Scenario, U = AB.UNITS, T = AB.T, el = A.el, $ = A.$;
Object.assign(AB.L.ko, {
  codex: '병종 도감', lab: '실험실', chal: '도전', follow: '관전 카메라', howPlay: '어떻게 즐길까요?', orPreset: '또는 예제 전투로 바로 구경하기',
  m_watch: '전투 구경', m_watchD: '예제 전투를 고르거나 직접 지도를 만들고, 누가 이길지 맞혀 보세요.', m_lab: '실험실', m_labD: '같은 비용이면 누가 이길까? 수십 번 싸워 승률을 냅니다.',
  m_codex: '병종 도감', m_codexD: '34종 병종의 능력치, 특수 능력, 역사를 둘러봅니다.', m_chal: '도전', m_chalD: '정해진 적군을 제한된 예산으로 꺾는 퍼즐 8개.',
  tryLab: '실험실에서 시험', place: '이 병종 배치하기', seeCodex: '도감 ▸', stats: '능력치', vsWeak: '약한 상대', vsStrong: '강한 상대',
  sideA: '파랑', sideB: '빨강', eqCost: '같은 비용', eqCount: '같은 수', runs: '횟수', runN: '{n}판 돌리기', running: '계산 중…', watchIt: '전장에서 직접 보기', chartBtn: '모든 병종과 붙여 보기',
  chartT: '{a} 대 모든 병종 · 같은 비용 {n}', winsPct: '승률', avgLeft: '평균 생존', avgTime: '평균 시간', draws: '무승부', units: '명', sec: '초',
  vWin: '{a} 우세', vEven: '막상막하', count: '병력',
  chalT: '도전 과제', chalSub: '적군은 고정되어 있습니다. 파란 구역 안에 예산만큼 배치하고 전투를 시작하세요. 예산을 아낄수록 별이 늘어납니다.',
  star3: '★ 승리 · ★★ 예산 80% 이하 · ★★★ 예산 60% 이하', budget: '예산', spent: '사용', left: '남음', exitChal: '도전 나가기', enemy: '적군', outZone: '파란 구역 안에만, 예산 안에서 배치할 수 있습니다',
  nextChal: '다음 도전', retry: '다시 배치', chalWin: '도전 성공', chalLose: '도전 실패',
  ch_cav: '기사 돌격을 막아라', ch_cavD: '중기병 열두 명이 달려옵니다. 무엇으로 말을 멈출까요?', ch_arch: '목책 뒤의 궁수들', ch_archD: '목책 뒤에서 화살 비가 쏟아집니다. 화살을 견디거나 피하세요.',
  ch_ele: '사막의 코끼리', ch_eleD: '전투 코끼리 다섯 마리와 궁병. 큰 짐승을 어떻게 쓰러뜨릴까요?', ch_horde: '삼백 명의 농민군', ch_hordeD: '수가 곧 힘일까요? 쇠스랑을 든 군중을 막아 내세요.',
  ch_raid: '초원의 습격자', ch_raidD: '치고 빠지는 케식 궁기병 서른 기. 쫓아가서는 잡을 수 없습니다.', ch_bridge: '다리를 건너라', ch_bridgeD: '강에는 다리 하나뿐. 건너편을 방진과 궁병이 지킵니다.',
  ch_fort: '성채 공략', ch_fortD: '성벽과 탑, 성채. 공성 무기 없이는 들어갈 수 없습니다.', ch_elite: '정예 대결', ch_eliteD: '사무라이, 재규어 전사, 란츠크네히트, 개마무사. 정예에는 무엇으로?',
  predT: '누가 이길까요?', predP: '예측하고 전투를 시작하세요. 끝나면 모의전 결과와 비교해 드립니다.', skip: '건너뛰기', yourPick: '내 예측', hit: '적중!', miss2: '빗나감', streak: '연속 적중',
  odds: '모의전 {n}회', oddsWait: '모의전 계산 중…', upset: '이변! 모의전에서 {p}% 확률이던 쪽이 이겼습니다', teamX: '{t}팀',
  firstBlood: '첫 피', razedF: '파괴', vet: '베테랑', killsN: '{n}처치', fell: '전사', hpL: '체력', killsL: '처치', rankL: '계급',
});
Object.assign(AB.L.en, {
  codex: 'Codex', lab: 'Lab', chal: 'Challenges', follow: 'Follow cam', howPlay: 'How do you want to play?', orPreset: 'Or jump straight into a ready-made battle',
  m_watch: 'Watch a battle', m_watchD: 'Pick a battle or build a map, then guess who wins.', m_lab: 'Lab', m_labD: 'Who wins at equal cost? Fight dozens of times and get the odds.',
  m_codex: 'Codex', m_codexD: 'Stats, abilities and history for all 34 troop types.', m_chal: 'Challenges', m_chalD: 'Eight puzzles: beat a fixed army on a budget.',
  tryLab: 'Test in the lab', place: 'Place this unit', seeCodex: 'Codex ▸', stats: 'Stats', vsWeak: 'Weak against', vsStrong: 'Strong against',
  sideA: 'Blue', sideB: 'Red', eqCost: 'Equal cost', eqCount: 'Equal count', runs: 'Runs', runN: 'Run {n} battles', running: 'Running…', watchIt: 'Watch it on the field', chartBtn: 'Against every unit',
  chartT: '{a} vs every unit · equal cost {n}', winsPct: 'Win rate', avgLeft: 'Avg. survivors', avgTime: 'Avg. time', draws: 'Draws', units: '', sec: 's',
  vWin: '{a} wins', vEven: 'Too close to call', count: 'Troops',
  chalT: 'Challenges', chalSub: 'The enemy is fixed. Deploy inside the blue zone within your budget, then start. Spend less for more stars.',
  star3: '★ win · ★★ spend ≤ 80% · ★★★ spend ≤ 60%', budget: 'Budget', spent: 'Spent', left: 'Left', exitChal: 'Leave challenge', enemy: 'Enemy', outZone: 'Deploy only inside the blue zone and within budget',
  nextChal: 'Next challenge', retry: 'Redeploy', chalWin: 'Challenge complete', chalLose: 'Challenge failed',
  ch_cav: 'Stop the charge', ch_cavD: 'Twelve heavy horsemen are coming. What stops a horse?', ch_arch: 'Archers behind the stakes', ch_archD: 'A rain of arrows from behind a palisade. Outlast it or dodge it.',
  ch_ele: 'Desert elephants', ch_eleD: 'Five war elephants and their archers. How do you fell a giant?', ch_horde: 'Three hundred peasants', ch_hordeD: 'Is quantity a quality? Hold back the pitchfork mob.',
  ch_raid: 'Steppe raiders', ch_raidD: 'Thirty hit-and-run keshig. You will not catch them by chasing.', ch_bridge: 'Cross the bridge', ch_bridgeD: 'One bridge over the river, held by a phalanx and archers.',
  ch_fort: 'Storm the keep', ch_fortD: 'Walls, towers and a keep. You need siege engines to get in.', ch_elite: 'Clash of elites', ch_eliteD: 'Samurai, jaguar warriors, landsknechts and gaemamusa. What beats elites?',
  predT: 'Who will win?', predP: 'Make your call, then watch. Afterwards you get the simulated odds too.', skip: 'Skip', yourPick: 'Your call', hit: 'Called it!', miss2: 'Missed', streak: 'streak',
  odds: '{n} simulated battles', oddsWait: 'Simulating…', upset: 'Upset! The winner had only {p}% in simulation', teamX: 'Team {t}',
  firstBlood: 'First blood', razedF: 'razed', vet: 'veteran', killsN: '{n} kills', fell: 'fell', hpL: 'HP', killsL: 'Kills', rankL: 'Rank',
});
const F = (k, o) => T(k).replace(/\{(\w+)\}/g, (m, n) => o[n] != null ? o[n] : m);
const UNIT_LIST = AB.UNIT_ORDER.slice();
const name = t => T('u_' + t), pname = p => T('p_' + AB.PLAYERS[p].id);
const playerColor = p => AB.PLAYERS[p].m;
const store = A.store;
const teamName = (sim, tm) => sim.stats.map((s, p) => p).filter(p => sim.teamOf[p] === tm && sim.stats[p].value0 > 0).map(pname).join(' · ') || F('teamX', { t: AB.TEAM_NAMES[tm] });

// ---------------------------------------------------------------- lab runner (worker, or page fallback)
let worker = null, wid = 0; const pending = new Map();
function getWorker() {
  if (worker === false) return null; if (worker) return worker;
  try { worker = new Worker('js/worker.js'); worker.onmessage = ev => { const m = ev.data, p = pending.get(m.id); if (!p) return; if (m.progress != null) p.prog(m.progress); if (m.done) { pending.delete(m.id); p.ok(m.res); } if (m.error) { pending.delete(m.id); p.fail(m.error); } };
    worker.onerror = () => { worker.terminate(); worker = false; for (const [id, p] of pending) { pending.delete(id); runLocal(p.msg, p.prog).then(p.ok, p.fail); } }; } catch (e) { worker = false; }
  return worker || null;
}
function runLocal(msg, prog) {
  // the same job in small slices so the page stays responsive
  const parts = msg.type === 'chart' ? msg.list.map(b => Object.assign({}, msg, { list: [b] })) : Array.from({ length: msg.runs }, (_, i) => Object.assign({}, msg, { runs: 1, from: i }));
  return new Promise(res => { const out = []; let i = 0; const next = () => { if (i >= parts.length) return res(out); out.push(...AB.LabCore.job(parts[i], () => {})); i++; prog(i / parts.length); setTimeout(next, 0); }; setTimeout(next, 0); });
}
function runJob(msg, prog) {
  msg.id = ++wid; const w = getWorker();
  if (!w) return runLocal(msg, prog || (() => {}));
  return new Promise((ok, fail) => { pending.set(msg.id, { ok, fail, prog: prog || (() => {}), msg }); w.postMessage(msg); });
}
function cancelJobs() { if (worker) { worker.terminate(); worker = null; } pending.clear(); }

// ---------------------------------------------------------------- shared bits
function icon(t, p, size) { return AB.Sprites.icon(t, p, size); }
function statBars(t) {
  const d = U[t], all = UNIT_LIST.map(k => U[k]), mx = f => Math.max(...all.map(f)), w = el('div', 'bars');
  const rows = [[T('hp'), d.hp, mx(x => x.hp)], [T('atk'), d.atk * (d.volley || 1) * (d.salvo || 1) / (d.salvo ? 4 : 1), mx(x => x.atk), d.atk + (d.volley > 1 ? '×' + d.volley : d.salvo ? '×' + d.salvo : '')],
    [T('armor').split('(')[0] + ' ⚔', d.am, 9], [T('armor').split('(')[0] + ' ➶', d.ap, 14], [T('range'), d.rng, 16, d.rng > 1 ? d.rng : T('melee')], [T('move'), d.spd, 3.4], [T('cost'), d.cost, 450]];
  if (d.bld) rows.splice(5, 1);
  for (const [k, v, m, label] of rows) { const b = el('div', 'bar'), u = el('u'); u.style.width = Math.min(100, 100 * v / (m || 1)) + '%'; b.appendChild(u); w.append(el('span', '', k), b, el('b', '', label != null ? String(label) : String(Math.round(v * 10) / 10))); }
  return w;
}
function counters(t) {
  const d = U[t], strong = [], weak = [];
  if (d.bonus) for (const t2 of UNIT_LIST) { const c = U[t2].cls; if (t2 !== t && c.some(k => d.bonus[k] >= 1.5)) strong.push(t2); }
  for (const t2 of UNIT_LIST) { const b = U[t2].bonus; if (t2 !== t && b && d.cls.some(k => b[k] >= 1.5)) weak.push(t2); }
  return { strong, weak };
}
function vsRow(list, cls) { const w = el('div', 'vs ' + cls); for (const t of list.slice(0, 12)) { const s = el('span'); s.append(icon(t, cls === 'good' ? 1 : 0, 18), document.createTextNode(name(t))); w.appendChild(s); } return w; }

// ---------------------------------------------------------------- codex
let codexSel = 'legionary', codexCat = 'uniq', anim = 0;
function codexDlg(t) {
  if (t) codexSel = t; const d = el('div'); d.dataset.wide = 1;
  d.appendChild(el('h2', '', T('codex')));
  const box = el('div', 'codex'), list = el('div', 'list'), detail = el('div');
  const drawList = () => {
    list.textContent = ''; const ch = el('div', 'chips'); ch.style.marginBottom = '8px';
    for (const c of AB.CATS.concat(['bld'])) { const b = el('button', 'chip' + (c === codexCat ? ' on' : ''), c === 'bld' ? T('tBld') : T('c_' + c)); b.onclick = () => { codexCat = c; drawList(); }; ch.appendChild(b); }
    list.appendChild(ch); const g = el('div', 'grid g4');
    const items = codexCat === 'bld' ? AB.BLD_ORDER : UNIT_LIST.filter(k => codexCat === 'all' || (codexCat === 'uniq' ? U[k].uniq : U[k].cat === codexCat));
    for (const k of items) { const b = el('button', 'tile' + (k === codexSel ? ' on' : '')); b.append(icon(k, U[k].uniq ? 0 : 1, 36), el('span', '', name(k))); b.onclick = () => { codexSel = k; drawList(); drawDetail(); }; g.appendChild(b); }
    list.appendChild(g);
  };
  const drawDetail = () => {
    const t2 = codexSel, ud = U[t2]; detail.textContent = '';
    const head = el('div', 'cx-head'), stage = el('canvas', 'cx-stage'); stage.width = 460; stage.height = 360; head.appendChild(stage);
    const info = el('div'); info.append(el('h2', '', name(t2)), el('div', 'cx-origin', T('o_' + t2)), el('p', 'cx-desc', T('d_' + t2)), statBars(t2)); head.appendChild(info); detail.appendChild(head);
    const ab = AB.abilities(ud); if (ab.length) { const ul = el('ul', 'abil'); ab.forEach(k => ul.appendChild(el('li', '', T('ab_' + k)))); detail.appendChild(ul); }
    const { strong, weak } = counters(t2);
    if (strong.length) { detail.appendChild(el('h5', '', T('vsStrong'))); detail.appendChild(vsRow(strong, 'good')); }
    if (weak.length) { detail.appendChild(el('h5', '', T('vsWeak'))); detail.appendChild(vsRow(weak, 'bad')); }
    detail.appendChild(el('div', 'hist', T('h_' + t2)));
    const f = el('div', 'foot');
    if (!ud.bld && ud.atk) { const b1 = el('button', '', T('tryLab')); b1.onclick = () => labDlg(t2); f.appendChild(b1); }
    const b2 = el('button', 'primary', T('place')); b2.onclick = () => { if (A.st.mode !== 'edit') A.stopBattle(); A.closeModal(); if (ud.bld) { A.st.bt = t2; A.setTool('bld'); } else { A.st.ut = t2; A.st.cat = 'all'; A.setTool('unit'); } }; f.appendChild(b2);
    const c = el('button', '', T('close')); c.onclick = A.closeModal; f.appendChild(c); detail.appendChild(f);
    animate(stage, t2);
  };
  box.append(list, detail); d.appendChild(box); A.openModal(d); drawList(); drawDetail();
}
// a looping showcase: stand, march, strike, stand
function animate(cv, t) {
  const id = ++anim, c = cv.getContext('2d'), d = U[t], start = performance.now(), p = d.uniq ? 0 : 1;
  const loop = (now) => {
    if (id !== anim || !cv.isConnected) return;
    const q = ((now - start) / 1000) % 4.2; let fr = 'idle';
    if (!d.bld) { if (q > 0.8 && q < 2.4) fr = 'w' + ((((q - 0.8) * 1.7) % 1) * 8 | 0); else if (q >= 2.6 && q < 2.6 + d.wind + 0.4) fr = 'a' + Math.min(5, ((q - 2.6) / (d.wind + 0.4) * 6) | 0); }
    const s = AB.Sprites.get(t, p, false, fr), k = d.bld ? (d.size > 1 ? 1.55 : 2.6) : (({ trebuchet: 1.5, elephant: 2.4, rider: 2.9, human: 3.6, wolf: 3.6 })[d.look.b] || 3) * 1.75;
    c.clearRect(0, 0, cv.width, cv.height); c.imageSmoothingQuality = 'high';
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(cv.width / 2, cv.height * 0.78, 120, 34, 0, 0, 6.3); c.fill();
    c.drawImage(s.cv, cv.width / 2 - s.ax * k, cv.height * (d.bld ? 0.86 : 0.78) - s.ay * k, s.w * k, s.h * k);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- lab
const lab = { a: 'legionary', b: 'archer', mode: 'cost', n: 2500, runs: 20 };
function unitSelect(cur, on) {
  const s = el('select');
  for (const c of AB.CATS.slice(1)) { const g = el('optgroup'); g.label = T('c_' + c); for (const t of UNIT_LIST) if ((c === 'uniq' ? U[t].uniq : U[t].cat === c && !U[t].uniq) && U[t].atk > 0) { const o = el('option', '', name(t)); o.value = t; g.appendChild(o); } s.appendChild(g); }
  s.value = cur; s.onchange = () => on(s.value); return s;
}
function labDlg(a) {
  if (a) lab.a = a; cancelJobs(); const d = el('div'); d.dataset.wide = 1;
  d.appendChild(el('h2', '', T('lab'))); d.appendChild(el('p', 'sub', T('m_labD')));
  const sides = el('div', 'lab'), res = el('div');
  const side = (key, p) => {
    const w = el('div', 'side'); w.style.setProperty('--c', playerColor(p));
    const draw = () => { w.textContent = ''; w.appendChild(el('h5', '', T(key === 'a' ? 'sideA' : 'sideB')));
      w.appendChild(unitSelect(lab[key], v => { lab[key] = v; draw(); res.textContent = ''; }));
      const who = el('div', 'who'), d2 = U[lab[key]]; who.appendChild(icon(lab[key], p, 54));
      const n = lab.mode === 'cost' ? Math.max(1, Math.round(lab.n / d2.cost)) : lab.n;
      const m = el('div', 'mini'); m.innerHTML = '<b style="color:var(--ink)">' + name(lab[key]) + '</b> × ' + n + '<br>' + T('hp') + ' ' + d2.hp + ' · ' + T('atk') + ' ' + d2.atk + ' · ' + T('armor').split('(')[0] + ' ' + d2.am + '/' + d2.ap + '<br>' + T('cost') + ' ' + d2.cost;
      who.appendChild(m); w.appendChild(who); };
    draw(); w._draw = draw; return w;
  };
  const sa = side('a', 0), sb = side('b', 1); sides.append(sa, sb); d.appendChild(sides);
  const opts = el('div', 'labopts'), redraw = () => { sa._draw(); sb._draw(); res.textContent = ''; drawOpts(); };
  const drawOpts = () => { opts.textContent = '';
    const g1 = el('div'); g1.appendChild(el('h5', '', T('count'))); const c1 = el('div', 'chips');
    [['cost', 1000], ['cost', 2500], ['cost', 5000], ['count', 10], ['count', 30], ['count', 60]].forEach(([m, n]) => { const b = el('button', 'chip' + (lab.mode === m && lab.n === n ? ' on' : ''), (m === 'cost' ? T('eqCost') + ' ' : T('eqCount') + ' ') + n.toLocaleString()); b.onclick = () => { lab.mode = m; lab.n = n; redraw(); }; c1.appendChild(b); });
    g1.appendChild(c1); const g2 = el('div'); g2.appendChild(el('h5', '', T('runs'))); const c2 = el('div', 'chips');
    [10, 20, 50].forEach(n => { const b = el('button', 'chip' + (lab.runs === n ? ' on' : ''), String(n)); b.onclick = () => { lab.runs = n; drawOpts(); if (opts._run) opts._run.textContent = F('runN', { n }); }; c2.appendChild(b); }); g2.appendChild(c2); opts.append(g1, g2); };
  drawOpts(); d.appendChild(opts);
  const prog = el('div', 'progress'), pu = el('u'); prog.appendChild(pu); prog.hidden = true;
  const f = el('div', 'foot'); f.style.justifyContent = 'flex-start';
  const bRun = el('button', 'primary', F('runN', { n: '' }).trim()), bWatch = el('button', '', T('watchIt')), bChart = el('button', '', T('chartBtn')), bClose = el('button', '', T('close'));
  const busy = v => { bRun.disabled = bChart.disabled = v; prog.hidden = !v; if (v) pu.style.width = '0%'; };
  bRun.textContent = F('runN', { n: lab.runs }); opts._run = bRun;
  bRun.onclick = () => { bRun.textContent = F('runN', { n: lab.runs }); busy(true); res.textContent = '';
    runJob({ type: 'duel', a: lab.a, b: lab.b, mode: lab.mode, n: lab.n, runs: lab.runs }, p => pu.style.width = p * 100 + '%').then(r => { busy(false); showDuel(res, r); }); };
  bChart.onclick = () => { busy(true); res.textContent = ''; const list = UNIT_LIST.filter(t => U[t].atk > 0 && t !== lab.a);
    runJob({ type: 'chart', a: lab.a, list, n: 2500, runs: 4 }, p => pu.style.width = p * 100 + '%').then(r => { busy(false); showChart(res, r); }); };
  bWatch.onclick = () => watchDuel();
  bClose.onclick = () => { cancelJobs(); A.closeModal(); };
  f.style.marginTop = '6px'; f.append(bRun, bChart, bWatch, el('span', 'spacer'), bClose); d.append(f, prog, res);
  A.openModal(d);
}
function showDuel(box, r) {
  const n = r.length, wa = r.filter(x => x.w === 0).length, wb = r.filter(x => x.w === 1).length, dr = n - wa - wb, avg = f => r.reduce((s, x) => s + f(x), 0) / n;
  const bar = el('div', 'winbar'), seg = (v, col, label) => { const s = el('div', '', v ? label : ''); s.style.flexGrow = v; s.style.background = col; return s; };
  bar.append(seg(wa, playerColor(0), name(lab.a) + ' ' + Math.round(wa / n * 100) + '%'), seg(dr, '#55606c', T('draws') + ' ' + dr), seg(wb, playerColor(1), name(lab.b) + ' ' + Math.round(wb / n * 100) + '%'));
  const v = wa / n > 0.6 ? F('vWin', { a: name(lab.a) }) : wb / n > 0.6 ? F('vWin', { a: name(lab.b) }) : T('vEven');
  box.append(el('div', 'verdict', v), bar);
  const s = el('div', 'labstats'); s.textContent = T('count') + ' ' + r[0].na + ' : ' + r[0].nb + ' · ' + T('avgLeft') + ' ' + avg(x => x.a).toFixed(1) + ' : ' + avg(x => x.b).toFixed(1) + ' · ' + T('avgTime') + ' ' + avg(x => x.t).toFixed(0) + T('sec');
  box.appendChild(s);
}
function showChart(box, r) {
  r.sort((x, y) => y.w / y.runs - x.w / x.runs);
  box.appendChild(el('div', 'verdict', F('chartT', { a: name(lab.a), n: '2,500' })));
  const g = el('div', 'chart');
  for (const x of r) { const pct = Math.round(x.w / x.runs * 100), b = el('div', 'cb'), u = el('u'); u.style.width = pct + '%'; b.appendChild(u); g.append(icon(x.b, 1, 20), el('span', '', name(x.b)), b, el('b', '', pct + '%')); }
  box.appendChild(g);
}
function watchDuel() {
  cancelJobs(); const sc = S.create(44, 44, 0); sc.players[1].team = 1; sc.name = name(lab.a) + ' vs ' + name(lab.b);
  for (let y = 0; y < 44; y++) for (let x = 0; x < 44; x++) if (AB.hash2(x >> 2, y >> 2, 3) > 0.75) sc.terrain[x + y * 44] = 1;
  const na = lab.mode === 'cost' ? Math.max(1, Math.round(lab.n / U[lab.a].cost)) : lab.n, nb = lab.mode === 'cost' ? Math.max(1, Math.round(lab.n / U[lab.b].cost)) : lab.n;
  S.formation(sc, lab.a, 0, 14, 30, na, 1, -1, 0); S.formation(sc, lab.b, 1, 30, 14, nb, -1, 1, 0);
  leaveChallenge(true); A.pushUndo0(); A.setScenario(sc); A.autosave(); A.closeModal(); skipPredict = true; A.startBattle();
}

// ---------------------------------------------------------------- challenges
const chal = { cur: null, zone: null, spent: 0 };
function chalStars() { try { return JSON.parse(store.get('aob2.chal') || '{}') || {}; } catch (e) { return {}; } }
function starStr(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
function enemySummary(c) { const sc = c.build(), cnt = {}; for (const u of sc.units) if (!U[u.t].bld || U[u.t].atk) cnt[u.t] = (cnt[u.t] || 0) + 1; return Object.keys(cnt).map(t => name(t) + ' ' + cnt[t]).join(' · '); }
function chalDlg() {
  const d = el('div'); d.dataset.wide = 1; d.append(el('h2', '', T('chalT')), el('p', 'sub', T('chalSub') + ' ' + T('star3')));
  const g = el('div', 'chal'), got = chalStars();
  for (const c of AB.Challenges) { const b = el('button', 'pcard'), h = el('b', '', c.n + '. ' + T('ch_' + c.id)), e = el('em', '', starStr(got[c.id] || 0));
    b.append(e, h, el('span', '', T('ch_' + c.id + 'D')), el('small', '', T('enemy') + ': ' + enemySummary(c) + ' · ' + T('budget') + ' ' + c.budget.toLocaleString()));
    b.onclick = () => enterChallenge(c); g.appendChild(b); }
  d.appendChild(g); const f = el('div', 'foot'), x = el('button', '', T('close')); x.onclick = A.closeModal; f.appendChild(x); d.appendChild(f); A.openModal(d);
}
function spentNow() { let s = 0; for (const u of A.sc.units) if (u.p === 0) s += U[u.t].cost; return s; }
function enterChallenge(c) {
  if (A.st.mode !== 'edit') A.stopBattle();
  const sc = AB.challengeBuild(c); sc.name = c.n + '. ' + T('ch_' + c.id); chal.cur = c;
  const zone = AB.challengeZone(sc), tiles = []; for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) if (zone(x + 0.5, y + 0.5)) tiles.push(x, y);
  chal.zone = zone; H.zone = { tiles }; H.lock = true; A.st.player = 0; A.st.cat = 'all';
  A.pushUndo0(); A.setScenario(sc); A.closeModal(); A.setTool('unit'); skipPredict = true;
}
function leaveChallenge(quiet) {
  if (!chal.cur) return; chal.cur = null; chal.zone = null; H.zone = null; H.lock = false; A.buildTabs(); A.buildTool();
  if (!quiet) A.presetsDlg(1);
}
H.place = (x, y, t) => !chal.cur || (chal.zone(x, y) && spentNow() + U[t].cost <= chal.cur.budget);
H.blockedMsg = () => T('outZone');
H.panelTop = (n) => {
  if (!chal.cur) return; const c = chal.cur, b = el('div', 'budget'), bar = el('div', 'bar'), u = el('u'), r2 = el('div', 'row2'), sp = el('b'), lf = el('b');
  b.append(el('b', '', c.n + '. ' + T('ch_' + c.id)), el('p', '', T('ch_' + c.id + 'D'))); bar.appendChild(u); b.appendChild(bar);
  r2.append(sp, lf); b.appendChild(r2); const x = el('button', '', T('exitChal')); x.style.marginTop = '8px'; x.onclick = () => leaveChallenge(false); b.appendChild(x);
  b._sync = () => { const s = spentNow(); u.style.width = Math.min(100, 100 * s / c.budget) + '%'; sp.textContent = T('spent') + ' ' + s.toLocaleString() + ' / ' + c.budget.toLocaleString(); lf.textContent = T('left') + ' ' + (c.budget - s).toLocaleString() + ' · ' + starStr(AB.challengeStars(c, true, s)); };
  b._sync(); chal.bar = b; n.appendChild(b);
};

// ---------------------------------------------------------------- spectating: feed, inspector, follow cam, prediction
let skipPredict = false, pick = null, odds = null, oddsJob = 0, follow = false, heat = null, firstBlood = false, feedT = 0;
const feedBox = el('div'); feedBox.id = 'feed'; document.body.appendChild(feedBox);
const insp = el('div'); insp.id = 'inspect'; insp.hidden = true; document.body.appendChild(insp);
function tag(p, t) { const s = el('span', 'k', pname(p) + ' ' + name(t)); s.style.color = AB.PLAYERS[p].l; return s; }
function feed(...parts) {
  const d = el('div'); for (const x of parts) d.append(typeof x === 'string' ? el('span', 'x', x) : x); feedBox.prepend(d);
  while (feedBox.children.length > 6) feedBox.lastChild.remove();
  setTimeout(() => d.classList.add('old'), 6500); setTimeout(() => d.remove(), 7200);
}
H.onEvents = (evs, sim) => {
  const now = performance.now();
  for (const e of evs) {
    if (e.k === 'hit' || e.k === 'die' || e.k === 'boom') { const w = e.k === 'die' ? 3 : 1; if (!heat) heat = { x: e.x, y: e.y, w: 0 }; const k = w / (heat.w + w); heat.x += (e.x - heat.x) * k * 0.3; heat.y += (e.y - heat.y) * k * 0.3; heat.w = Math.min(60, heat.w + w); }
    if (e.k === 'die') {
      if (!firstBlood) { firstBlood = true; feed(el('b', '', T('firstBlood')), tag(e.d, e.c), '⚔', tag(e.v, e.b)); feedT = now; continue; }
      const vd = U[e.b]; if ((vd.uniq || vd.cost >= 200) && now - feedT > 450) { feedT = now; feed(tag(e.d, e.c), '⚔', tag(e.v, e.b)); }
    } else if (e.k === 'collapse' && U[e.b] && !U[e.b].wall) feed(tag(e.d, e.c), '🔥', tag(e.v, e.b), T('razedF'));
    else if (e.k === 'rank' && e.a >= 2) feed(el('span', 'k', '★'.repeat(e.a) + ' '), tag(e.d, e.b), F('killsN', { n: e.c }));
  }
};
H.onSel = (sel, sim) => { inspTarget = sel.size === 1 ? sel.values().next().value : null; inspDraw(true); };
let inspTarget = null, inspT = 0, inspKey = '';
function inspDraw(force) {
  const e = inspTarget; if (!e || (e.dead)) { insp.hidden = true; return; }
  const t = e.t, d = U[t], key = t + e.p + (e.rank || 0);
  if (force || key !== inspKey) {
    inspKey = key; insp.textContent = ''; insp.hidden = false;
    const top = el('div', 'top'), info = el('div'); top.appendChild(icon(t, e.p, 44)); info.append(el('h4', '', name(t)), el('div', 'o', pname(e.p) + ' · ' + T('o_' + t))); top.appendChild(info); insp.appendChild(top);
    const hp = el('div', 'hp'), u = el('u'); hp.appendChild(u); insp.appendChild(hp); insp._hp = u;
    const ln = el('div', 'ln'), hpT = el('b'), kT = el('b'); ln.append(el('span', '', T('hpL') + ' '), hpT, el('span', '', ' · ' + T('killsL') + ' '), kT, el('span', '', e.rank ? ' · ' + '★'.repeat(e.rank) : '')); insp.appendChild(ln); insp._hpT = hpT; insp._k = kT;
    const ab = AB.abilities(d); if (ab.length) insp.appendChild(el('div', 'ab', ab.map(k => T('ab_' + k).split(' · ')[0]).join(' · ')));
    insp.appendChild(el('p', '', T('h_' + t).split(/(?<=[.다])\s/)[0]));
    const go = el('button', '', T('seeCodex')); go.style.cssText = 'margin-top:6px;padding:3px 9px;font-size:12px'; go.onclick = () => codexDlg(t); insp.appendChild(go);
  }
  const hpv = e.hp != null ? e.hp : d.hp; insp._hp.style.width = (100 * hpv / d.hp) + '%'; insp._hpT.textContent = Math.ceil(hpv) + '/' + d.hp; insp._k.textContent = e.kills || 0;
}
H.onFrame = (dt) => {
  if ((inspT -= dt) <= 0) { inspT = 0.2; if (inspTarget) inspDraw(false); if (chal.bar && chal.bar.isConnected) chal.bar._sync(); }
  if (follow && A.sim && heat && heat.w > 1) { const R = A.R, tx = (heat.x - heat.y) * 32, ty = (heat.x + heat.y) * 16, k = Math.min(1, dt * 1.6); R.cam.x += (tx - R.cam.x) * k; R.cam.y += (ty - R.cam.y) * k; }
  if (heat) heat.w *= Math.pow(0.5, dt);
};
H.onStart = (sim, sc) => {
  firstBlood = false; heat = null; feedBox.textContent = ''; pick = null; odds = null; const job = ++oddsJob;
  const teams = []; S.summary(sc).forEach((s, p) => { if (s.armed && teams.indexOf(sc.players[p].team) < 0) teams.push(sc.players[p].team); }); teams.sort();
  if (sc.units.length <= 1600) runJob({ type: 'odds', sc: S.pack(sc), runs: 10 }).then(r => { if (job === oddsJob) { odds = r; if (H._oddsBox) H._oddsBox(); } });
  if (skipPredict || chal.cur) { skipPredict = false; return; }
  A.st.paused = true; A.syncBattleBar();
  const box = el('div'); box.id = 'predict'; box.append(el('h3', '', T('predT')), el('p', '', T('predP'))); const o = el('div', 'opts');
  for (const tm of teams) { const ps = sc.players.map((x, p) => p).filter(p => sc.players[p].team === tm && S.summary(sc)[p].n); const b = el('button');
    ps.forEach(p => { const i = el('i'); i.style.cssText = 'display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;background:' + AB.PLAYERS[p].m; b.appendChild(i); });
    b.appendChild(document.createTextNode(ps.map(pname).join(' · '))); b.onclick = () => { pick = tm; done(); }; o.appendChild(b); }
  const sk = el('button', '', T('skip')); sk.onclick = () => done(); o.appendChild(sk); box.appendChild(o); document.body.appendChild(box);
  const done = () => { box.remove(); A.st.paused = false; A.syncBattleBar(); };
  H._predictBox = box;
};
H.onStop = () => { if (H._predictBox) H._predictBox.remove(); feedBox.textContent = ''; inspTarget = null; insp.hidden = true; oddsJob++; };
H.onResults = (d, sim, ban) => {
  const w = sim.winner;
  if (chal.cur) {
    const c = chal.cur, spent = sim.stats[0].value0, won = w === sim.teamOf[0], stars = AB.challengeStars(c, won, spent), got = chalStars();
    if (stars > (got[c.id] || 0)) { got[c.id] = stars; store.set('aob2.chal', JSON.stringify(got)); }
    ban.firstChild.textContent = won ? T('chalWin') : T('chalLose');
    const st = el('div', 'stars'); for (let i = 0; i < 3; i++) st.appendChild(el('span', i < stars ? '' : 'off', '★')); ban.appendChild(st);
    ban.appendChild(el('p', 'sub', T('spent') + ' ' + spent.toLocaleString() + ' / ' + c.budget.toLocaleString() + ' (' + Math.round(spent / c.budget * 100) + '%) · ' + T('star3')));
    const foot = d.querySelector('.foot') || null; setTimeout(() => {
      const f = d.querySelector('.foot'); if (!f) return;
      const nx = AB.Challenges[c.n]; if (won && nx) { const b = el('button', 'primary', T('nextChal')); b.onclick = () => enterChallenge(nx); f.appendChild(b); } }, 0);
    return;
  }
  const box = el('div', 'box2'); d.insertBefore(box, ban.nextSibling);
  if (pick != null) { const ok = pick === w; let s = +(store.get('aob2.streak') || 0); s = ok ? s + 1 : 0; store.set('aob2.streak', s);
    box.appendChild(el('div', '', T('yourPick') + ': ' + teamName(sim, pick) + ' — ' + (ok ? T('hit') : T('miss2')) + (s > 1 ? ' · ' + s + ' ' + T('streak') : ''))); }
  const ob = el('div'); box.appendChild(ob);
  H._oddsBox = () => { ob.textContent = ''; if (!odds) { ob.appendChild(el('span', '', T('oddsWait'))); return; }
    const cnt = {}; for (const r of odds) cnt[r.w] = (cnt[r.w] || 0) + 1;
    ob.appendChild(el('span', '', F('odds', { n: odds.length }) + ': ' + Object.keys(cnt).sort().map(k => (k < 0 ? T('draws') : teamName(sim, +k)) + ' ' + cnt[k]).join(' · ')));
    const share = w >= 0 ? (cnt[w] || 0) / odds.length : 1; if (w >= 0 && share < 0.3) ob.appendChild(el('div', 'upset', F('upset', { p: Math.round(share * 100) }))); };
  H._oddsBox();
};

// ---------------------------------------------------------------- entry points
H.welcome = (d, g, welcome) => {
  const m = el('div', 'modes'), add = (ic, k, fn) => { const b = el('button', 'mode'); b.append(el('i', '', ic), el('b', '', T('m_' + k)), el('span', '', T('m_' + k + 'D'))); b.onclick = fn; m.appendChild(b); };
  add('⚔', 'watch', () => { g.scrollIntoView({ behavior: 'smooth' }); g.style.outline = '2px solid var(--gold)'; setTimeout(() => g.style.outline = '', 900); });
  add('🏆', 'chal', chalDlg); add('⚗', 'lab', () => labDlg()); add('📜', 'codex', () => codexDlg());
  d.insertBefore(el('h5', '', T('howPlay')), g); d.insertBefore(m, g); d.insertBefore(el('h5', '', T('orPreset')), g);
};
H.cardExtra = (row, t) => { const b = el('button', '', T('seeCodex')); b.style.cssText = 'margin-top:6px;width:100%'; b.onclick = () => codexDlg(t); row.appendChild(b); };
function topButtons() {
  const g = document.querySelector('#top .grp.only-edit'), gb = document.querySelector('#top .grp.only-battle');
  let b = $('bChal'); if (!b) { b = el('button'); b.id = 'bChal'; g.prepend(b); b.onclick = chalDlg; } b.textContent = T('chal');
  b = $('bLab'); if (!b) { b = el('button'); b.id = 'bLab'; g.prepend(b); b.onclick = () => labDlg(); } b.textContent = T('lab');
  b = $('bCodex'); if (!b) { b = el('button'); b.id = 'bCodex'; g.prepend(b); b.onclick = () => codexDlg(); } b.textContent = T('codex');
  b = $('bFollow'); if (!b) { b = el('button'); b.id = 'bFollow'; gb.appendChild(b); b.onclick = toggleFollow; } b.textContent = '🎥 ' + T('follow'); b.classList.toggle('on2', follow);
}
function toggleFollow() { follow = !follow; topButtons(); }
window.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.ctrlKey || e.metaKey) return; if (e.key === 'v' || e.key === 'V') { if (A.sim) toggleFollow(); } });
H.onLang = () => { topButtons(); };
window.addEventListener('DOMContentLoaded', topButtons);
AB.Extra = { codexDlg, labDlg, chalDlg, enterChallenge, runJob };
})();
