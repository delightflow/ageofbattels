/* Age of Battels — editor, battle control, input and UI. */
(function () {
'use strict';
const AB = window.AB, S = AB.Scenario, U = AB.UNITS, T = AB.T, DT = AB.DT;
Object.assign(AB.L.ko, { cl_cav: '기병', cl_camel: '낙타병', cl_ele: '코끼리', cl_archer: '궁병', cl_siege: '공성 무기', cl_bld: '건물', at_m: '근접', at_p: '관통', at_s: '공성',
  selHint: '지도에서 끌어서 유닛을 선택하세요. 선택한 유닛은 태세를 바꾸거나 삭제할 수 있습니다.', handHint: '끌어서 화면을 이동합니다. 두 손가락으로 확대·축소.', eraseHint: '유닛, 건물, 나무와 바위를 지웁니다.',
  teamOf: '팀', winTeam: '팀 승리', nobody: '아무도 남지 않았습니다', bars: '체력 표시', confirmNew: '지금 지도를 버리고 새로 만듭니다.', empty: '아직 배치된 군대가 없습니다', fit: '전체 보기', objHint: '길과 물 위에는 놓을 수 없습니다.' });
Object.assign(AB.L.en, { cl_cav: 'cavalry', cl_camel: 'camels', cl_ele: 'elephants', cl_archer: 'archers', cl_siege: 'siege', cl_bld: 'buildings', at_m: 'melee', at_p: 'pierce', at_s: 'siege',
  selHint: 'Drag on the map to select units. You can change their stance or delete them.', handHint: 'Drag to pan. Pinch to zoom.', eraseHint: 'Removes units, buildings, trees and rocks.',
  teamOf: 'Team', winTeam: 'wins', nobody: 'Nobody is left standing', bars: 'Health bars', confirmNew: 'This replaces the current map.', empty: 'No armies placed yet', fit: 'Fit view', objHint: 'Cannot be placed on roads or water.' });

const $ = id => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } } };

const st = { mode: 'edit', tool: 'unit', terr: 0, brush: 3, obj: 1, dens: 0.5, ut: 'swordsman', bt: 'wall', cat: 'all', player: 0, count: 25, stance: 0, speed: 1, paused: false };
const TOOLS = ['terrain', 'object', 'unit', 'bld', 'erase', 'select', 'hand'], TOOL_T = { terrain: 'tTerrain', object: 'tObject', unit: 'tUnit', bld: 'tBld', erase: 'tErase', select: 'tSelect', hand: 'tHand' };
const cv = $('view'), R = new AB.Render(cv, $('mini'));
let sc = null, sim = null, sel = new Set(), undo = [], redo = [], ghost = null, box = null, marker = null, acc = 0, seed = (Date.now() & 0xfffff) | 1, endShown = false, endAt = 0, hover = null, hudT = 0, saveT = 0;
const keys = {};
const H = {};                 // hooks filled in by extra.js (codex, lab, challenges, spectating)

// ---------------------------------------------------------------- scenario plumbing
function setScenario(s, keepCam) {
  sc = s; S.dirty(sc); R.setScenario(sc); sel.clear(); if (!keepCam) R.fit(); $('mapName').value = sc.name || ''; refreshArmies(); updateSel();
}
function snap() { return { terrain: sc.terrain.slice(), objects: sc.objects.slice(), units: sc.units.map(u => Object.assign({}, u)), teams: sc.players.map(p => p.team) }; }
function restore(s) {
  sc.terrain.set(s.terrain); sc.objects.set(s.objects); sc.units = s.units.map(u => Object.assign({}, u)); s.teams.forEach((t, i) => sc.players[i].team = t);
  S.dirty(sc); R.invalidate(0, 0, sc.w, sc.h); sel.clear(); refreshArmies(); updateSel(); if (st.tool === 'unit' || st.tool === 'bld') buildTool(); autosave();
}
function pushUndo() { undo.push(snap()); if (undo.length > 40) undo.shift(); redo.length = 0; syncUndo(); }
function doUndo() { if (!undo.length || st.mode !== 'edit') return; redo.push(snap()); restore(undo.pop()); syncUndo(); }
function doRedo() { if (!redo.length || st.mode !== 'edit') return; undo.push(snap()); restore(redo.pop()); syncUndo(); }
function syncUndo() { $('bUndo').disabled = !undo.length; $('bRedo').disabled = !redo.length; }
function autosave() { clearTimeout(saveT); saveT = setTimeout(() => store.set('aob2.autosave', JSON.stringify(S.pack(sc))), 500); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); }

// ---------------------------------------------------------------- panel
function buildTabs() {
  const n = $('tabs'); n.textContent = '';
  TOOLS.forEach((k, i) => { if (H.lock && !/^(unit|erase|select|hand)$/.test(k)) return; const b = el('button', st.tool === k ? 'on' : '', T(TOOL_T[k])); b.title = T(TOOL_T[k]) + ' (' + (i + 1) + ')'; b.onclick = () => setTool(k); n.appendChild(b); });
}
function setTool(k) { st.tool = k; if (k !== 'select') { sel.clear(); updateSel(); } buildTabs(); buildTool(); ghost = null; }
function range(label, min, max, step, val, fn, fmt) {
  const r = el('div', 'row'); r.appendChild(el('h4', '', label)); const w = el('div', 'rangeRow'), i = el('input'), o = el('output', '', fmt ? fmt(val) : val);
  i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.oninput = () => { fn(+i.value); o.textContent = fmt ? fmt(+i.value) : i.value; }; w.append(i, o); r.appendChild(w); return r;
}
function chips(label, opts, cur, fn) {
  const r = el('div', 'row'); if (label) r.appendChild(el('h4', '', label)); const w = el('div', 'chips');
  for (const [v, text, tip] of opts) { const b = el('button', 'chip' + (v === cur ? ' on' : ''), text); if (tip) b.title = tip; b.onclick = () => { fn(v); buildTool(); }; w.appendChild(b); }
  r.appendChild(w); return r;
}
function playerRow() {
  const r = el('div', 'row'); r.appendChild(el('h4', '', T('player'))); const w = el('div', 'pl');
  AB.PLAYERS.forEach((p, i) => { const b = el('button', i === st.player ? 'on' : ''); b.style.background = p.m; b.title = T('p_' + p.id); b.onclick = () => { st.player = i; buildTool(); }; w.appendChild(b); });
  r.appendChild(w);
  const line = el('div', 'inline'); line.appendChild(el('span', '', T('p_' + AB.PLAYERS[st.player].id) + ' · ' + T('team')));
  const s = el('select'); for (let i = 0; i < 8; i++) { const o = el('option', '', AB.TEAM_NAMES[i]); o.value = i; s.appendChild(o); } s.value = sc.players[st.player].team;
  s.onchange = () => { pushUndo(); sc.players[st.player].team = +s.value; refreshArmies(); autosave(); }; line.appendChild(s); r.appendChild(line); return r;
}
function card(t) {
  const d = U[t], c = el('div', 'card'), pic = el('div', 'pic'); pic.appendChild(AB.Sprites.icon(t, st.player, 50)); c.appendChild(pic);
  c.appendChild(el('h3', '', T('u_' + t))); c.appendChild(el('p', '', T('d_' + t)));
  const s = el('div', 'stats'), add = (k, v, full) => { const r = el('div', full ? 'full' : ''); r.appendChild(el('span', '', k)); r.appendChild(el('b', '', v)); s.appendChild(r); };
  add(T('hp'), d.hp); add(T('cost'), d.cost);
  if (d.heal) add(T('heal'), d.heal + ' / ' + d.rof + 's'); else if (d.atk) add(T('atk'), d.atk + (d.volley > 1 ? '×' + d.volley : '') + ' ' + T('at_' + d.at)); else add(T('atk'), '—');
  add(T('armor'), d.am + ' / ' + d.ap);
  if (d.atk || d.heal) { add(T('range'), d.rng > 1 ? (d.minR ? d.minR + '–' : '') + d.rng : T('melee')); add(T('rate'), d.rof + 's'); }
  if (d.spd) add(T('move'), d.spd);
  if (d.bonus) add(T('strong'), Object.keys(d.bonus).map(k => T('cl_' + k)).join(', '), true);
  c.appendChild(s); return c;
}
function unitGrid(list, cur, pick) {
  const g = el('div', 'grid g4');
  for (const t of list) { const b = el('button', 'tile' + (t === cur ? ' on' : '')); b.appendChild(AB.Sprites.icon(t, st.player, 38)); b.appendChild(el('span', '', T('u_' + t))); b.title = T('u_' + t) + ' — ' + T('d_' + t); b.onclick = () => { pick(t); buildTool(); }; g.appendChild(b); }
  return g;
}
function buildTool() {
  const n = $('tool'); n.textContent = ''; const k = st.tool;
  if (k === 'terrain') {
    const r = el('div', 'row'); r.appendChild(el('h4', '', T('tTerrain'))); const g = el('div', 'grid g4');
    AB.TERRAIN.forEach((t, i) => { const b = el('button', 'tile' + (i === st.terr ? ' on' : '')), sw = el('div', 'sw'); sw.style.background = `linear-gradient(135deg, rgb(${t.c.map(v => Math.min(255, v + 14))}), rgb(${t.c.map(v => v - 16)}))`; b.append(sw, el('span', '', T('t_' + t.id))); b.style.minHeight = '0'; b.onclick = () => { st.terr = i; buildTool(); }; g.appendChild(b); });
    r.appendChild(g); n.appendChild(r); n.appendChild(range(T('brush'), 1, 11, 1, st.brush, v => st.brush = v));
  } else if (k === 'object') {
    n.appendChild(chips(T('tObject'), [[1, T('tree')], [2, T('rock')], [0, T('objErase')]], st.obj, v => st.obj = v));
    n.appendChild(range(T('brush'), 1, 11, 1, st.brush, v => st.brush = v)); n.appendChild(range(T('density'), 0.1, 1, 0.1, st.dens, v => st.dens = v, v => Math.round(v * 100) + '%'));
    n.appendChild(el('p', 'hint', T('objHint')));
  } else if (k === 'unit') {
    if (H.panelTop) H.panelTop(n);
    if (!H.lock) n.appendChild(playerRow());
    n.appendChild(chips(null, AB.CATS.map(c => [c, T('c_' + c)]), st.cat, v => st.cat = v));
    const list = AB.UNIT_ORDER.filter(t => (st.cat === 'all' || (st.cat === 'uniq' ? U[t].uniq : U[t].cat === st.cat)) && (!H.allowed || H.allowed(t))); const r = el('div', 'row'); r.appendChild(unitGrid(list, st.ut, t => st.ut = t)); n.appendChild(r);
    n.appendChild(chips(T('count'), [1, 5, 10, 25, 50, 100].map(v => [v, String(v)]), st.count, v => st.count = v));
    n.appendChild(chips(T('stance'), [0, 1, 2].map(v => [v, T('st' + v), T('st' + v + 'd')]), st.stance, v => st.stance = v));
    const r2 = el('div', 'row'); r2.appendChild(card(st.ut)); if (H.cardExtra) H.cardExtra(r2, st.ut); n.appendChild(r2);
  } else if (k === 'bld') {
    n.appendChild(playerRow()); const r = el('div', 'row'); r.appendChild(el('h4', '', T('tBld'))); const g = unitGrid(AB.BLD_ORDER, st.bt, t => st.bt = t); g.className = 'grid g3'; r.appendChild(g); n.appendChild(r);
    const r2 = el('div', 'row'); r2.appendChild(card(st.bt)); n.appendChild(r2);
  } else if (k === 'erase') { if (H.panelTop) H.panelTop(n); n.appendChild(range(T('brush'), 1, 11, 1, st.brush, v => st.brush = v)); n.appendChild(el('p', 'hint', T('eraseHint'))); }
  else n.appendChild(el('p', 'hint', T(k === 'select' ? 'selHint' : 'handHint')));
}
function refreshArmies() {
  const n = $('armies'); n.textContent = ''; n.appendChild(el('h4', '', T('army'))); const sum = S.summary(sc); let any = false;
  sum.forEach((s, p) => { if (!s.n && !s.v) return; any = true; const r = el('div', 'arm'), i = el('i'); i.style.background = AB.PLAYERS[p].m;
    r.append(i, el('span', '', T('p_' + AB.PLAYERS[p].id) + ' · ' + T('teamOf') + ' ' + AB.TEAM_NAMES[sc.players[p].team]), el('span', 'n', s.n + ' ' + T('units')), el('span', 'v', s.v.toLocaleString())); n.appendChild(r); });
  if (!any) { n.appendChild(el('p', 'hint', T('empty'))); return; }
  const br = el('div', 'btnrow'), a = el('button', '', T('clearMine')), b = el('button', 'danger', T('clearArmies'));
  a.onclick = () => { pushUndo(); S.removeIf(sc, u => u.p === st.player); afterEdit(); }; b.onclick = () => { pushUndo(); S.removeIf(sc, () => true); afterEdit(); };
  br.append(a, b); n.appendChild(br);
}
function afterEdit() { sel.forEach(u => { if (sc.units.indexOf(u) < 0) sel.delete(u); }); refreshArmies(); updateSel(); autosave(); R.miniDirty = true; }

// ---------------------------------------------------------------- selection bar
function updateSel() {
  if (H.onSel) H.onSel(sel, sim);
  const b = $('selbar'); if (!sel.size) { b.hidden = true; return; } b.hidden = false; b.textContent = '';
  const cnt = {}; let p = 0, stn = -1; sel.forEach(u => { cnt[u.t] = (cnt[u.t] || 0) + 1; p = u.p; const s = sim ? u.stance : (u.s || 0); stn = stn === -1 ? s : stn === s ? s : -2; });
  const who = el('span', 'who', sel.size + ' ' + T('selN')); who.style.color = AB.PLAYERS[p].l; b.appendChild(who);
  b.appendChild(el('span', 'types', Object.keys(cnt).map(t => T('u_' + t) + ' ' + cnt[t]).join(' · ')));
  const seg = el('div', 'seg'); [0, 1, 2].forEach(v => { const x = el('button', v === stn ? 'on' : '', T('st' + v)); x.title = T('st' + v + 'd') + ' (' + 'GDH'[v] + ')'; x.onclick = () => setStance(v); seg.appendChild(x); }); b.appendChild(seg);
  if (sim) { const x = el('button', '', T('stop')); x.title = 'X'; x.onclick = () => { sim.order(sel, { k: 'stop' }); }; b.appendChild(x); }
  else { const x = el('button', 'danger', T('delSel')); x.onclick = delSel; b.appendChild(x); }
}
function setStance(v) { if (!sel.size) return; if (sim) sim.setStance(sel, v); else { pushUndo(); sel.forEach(u => u.s = v); autosave(); } updateSel(); }
function delSel() { if (!sel.size || sim) return; pushUndo(); S.removeIf(sc, u => sel.has(u)); sel.clear(); afterEdit(); }
function prune() { if (!sim || !sel.size) return; let ch = false; sel.forEach(e => { if (e.dead) { sel.delete(e); ch = true; } }); if (ch) updateSel(); }

// ---------------------------------------------------------------- editing
function facing(x, y) {
  const tm = sc.players[st.player].team; let ex = 0, ey = 0, n = 0;
  for (const u of sc.units) if (sc.players[u.p].team !== tm) { ex += u.x; ey += u.y; n++; }
  let fx = n ? ex / n - x : sc.w / 2 - x, fy = n ? ey / n - y : sc.h / 2 - y; if (Math.hypot(fx, fy) < 1.5) { fx = 1; fy = -1; } return [fx, fy];
}
function bldTile(wx, wy) { const s = U[st.bt].size, o = s > 1 ? (s - 1) / 2 : 0; return [Math.floor(wx - o), Math.floor(wy - o)]; }
function applyTool(sx, sy, first) {
  const d = drag, [wx, wy] = R.s2w(sx, sy), lx = d.last ? d.last[0] : wx, ly = d.last ? d.last[1] : wy, dist = Math.hypot(wx - lx, wy - ly);
  const steps = Math.max(1, Math.ceil(dist / 0.5));
  switch (st.tool) {
    case 'terrain': {
      for (let i = first ? steps : 1; i <= steps; i++) S.paint(sc, lx + (wx - lx) * i / steps, ly + (wy - ly) * i / steps, st.brush, st.terr);
      const r = st.brush / 2 + 2; R.invalidate(Math.min(lx, wx) - r, Math.min(ly, wy) - r, Math.max(lx, wx) + r, Math.max(ly, wy) + r);
      if (!AB.TERRAIN[st.terr].pass) S.cleanup(sc); d.changed = true; d.last = [wx, wy]; break; }
    case 'object': {
      if (!first && dist < 0.8) return; const bm = S.bmap(sc), ix = S.index(sc);
      S.brushTiles(sc, wx, wy, st.brush, (x, y, i) => {
        if (st.obj === 0) { if (sc.objects[i]) { sc.objects[i] = 0; d.changed = true; } return; }
        const t = sc.terrain[i]; if (sc.objects[i] || !AB.TERRAIN[t].pass || t === 5 || t === 6 || bm[i] || ix.get(i) || (st.brush > 1 && Math.random() > st.dens)) return;
        sc.objects[i] = st.obj; d.changed = true; });
      R.miniDirty = true; d.last = [wx, wy]; break; }
    case 'unit': {
      const sp = Math.max(0.52, U[st.ut].r * 2.35), gap = st.count === 1 ? sp : Math.sqrt(st.count * 2.2) * sp * 0.75;
      if (!first && dist < gap) return;
      if (sc.units.length >= AB.MAX_UNITS) { toast(T('capHit')); return; }
      if (!d.face) d.face = facing(wx, wy);
      const pts = S.formationPts(st.ut, wx, wy, st.count, d.face[0], d.face[1]); let any = false, blocked = false;
      for (let i = 0; i < pts.length; i += 2) { if (H.place && !H.place(pts[i], pts[i + 1], st.ut)) { blocked = true; continue; } if (S.add(sc, st.ut, st.player, pts[i], pts[i + 1], st.stance)) any = true; }
      if (any) d.changed = true; else if (blocked && first && H.blockedMsg) toast(H.blockedMsg());
      d.last = [wx, wy]; if (any && H.afterPlace) H.afterPlace(); break; }
    case 'bld': {
      for (let i = first ? steps : 1; i <= steps; i++) { const [tx, ty] = bldTile(lx + (wx - lx) * i / steps, ly + (wy - ly) * i / steps); if (S.add(sc, st.bt, st.player, tx, ty, 0)) d.changed = true; }
      d.last = [wx, wy]; break; }
    case 'erase': {
      for (let i = first ? steps : 1; i <= steps; i++) { const x = lx + (wx - lx) * i / steps, y = ly + (wy - ly) * i / steps;
        if (H.lock) { if (S.removeIf(sc, u => u.p === st.player && Math.hypot(u.x - x, u.y - y) <= st.brush / 2)) d.changed = true; continue; }
        if (S.removeIn(sc, x, y, st.brush / 2)) d.changed = true;
        S.brushTiles(sc, x, y, Math.max(1, st.brush), (a, b, k) => { if (sc.objects[k] && Math.hypot(a + 0.5 - x, b + 0.5 - y) <= st.brush / 2 + 0.2) { sc.objects[k] = 0; d.changed = true; } }); }
      R.miniDirty = true; d.last = [wx, wy]; break; }
  }
}
function updateGhost() {
  ghost = null; if (st.mode !== 'edit' || !hover || drag && drag.type !== 'stroke') return;
  const [wx, wy] = R.s2w(hover[0], hover[1]);
  if (st.tool === 'terrain' || st.tool === 'object') { const t = []; S.brushTiles(sc, wx, wy, st.brush, (x, y) => t.push(x, y)); ghost = { tiles: t }; }
  else if (st.tool === 'erase') ghost = { circle: [wx, wy, st.brush / 2] };
  else if (st.tool === 'unit') { if (!S.inb(sc, wx, wy)) return; const f = drag && drag.face || facing(wx, wy); ghost = { pts: S.formationPts(st.ut, wx, wy, st.count, f[0], f[1]), p: st.player, t: st.ut }; }
  else if (st.tool === 'bld') { const [tx, ty] = bldTile(wx, wy), s = U[st.bt].size, t = []; for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) t.push(tx + i, ty + j); ghost = { tiles: t, ok: S.canPlace(sc, st.bt, tx, ty) }; }
}

// ---------------------------------------------------------------- battle
function startBattle() {
  const sum = S.summary(sc), teams = new Set(); sum.forEach((s, p) => { if (s.armed) teams.add(sc.players[p].team); });
  if (teams.size < 2) { toast(T('needTwo')); return; }
  AB.Audio.unlock(); sim = new AB.Sim(sc, { seed: seed += 7919 }); acc = 0; endShown = false; st.mode = 'battle'; st.paused = false; sel.clear(); ghost = null; R.resetFx();
  document.body.classList.replace('edit', 'battle'); R.resize(); updateSel(); buildHud(); syncBattleBar(); closeModal(); AB.Audio.start();
  if (H.onStart) H.onStart(sim, sc);
}
function stopBattle() { if (H.onStop) H.onStop(); AB.Audio.stop(); sim = null; st.mode = 'edit'; sel.clear(); R.resetFx(); document.body.classList.replace('battle', 'edit'); R.resize(); updateSel(); closeModal(); R.miniDirty = true; }
function syncBattleBar() {
  $('bPause').textContent = st.paused ? '▶ ' + T('resume') : '❚❚ ' + T('pause');
  const s = $('speeds'); s.textContent = ''; [0.5, 1, 2, 4].forEach(v => { const b = el('button', v === st.speed ? 'on' : '', v === 0.5 ? '½×' : v + '×'); b.onclick = () => { st.speed = v; syncBattleBar(); }; s.appendChild(b); });
}
function buildHud() {
  const h = $('hud'); h.textContent = ''; h._rows = [];
  sim.stats.forEach((s, p) => { if (!s.value0) return; const row = el('div', 'hrow'), i = el('i'), cnt = el('span'), bar = el('div', 'hbar'), u = el('u'); i.style.background = u.style.background = AB.PLAYERS[p].m;
    row.append(i, el('b', '', T('p_' + AB.PLAYERS[p].id) + ' · ' + AB.TEAM_NAMES[sim.teamOf[p]]), cnt); bar.appendChild(u); h.append(row, bar); h._rows.push({ p, row, cnt, u }); });
}
function updateHud() {
  const h = $('hud'), last = sim.history[sim.history.length - 1]; if (!h._rows || !last) return;
  const v = new Float32Array(8), n = new Uint16Array(8); for (const e of sim.ents) { v[e.p] += e.d.cost; if (!e.bld) n[e.p]++; }
  for (const r of h._rows) { const s = sim.stats[r.p]; r.cnt.textContent = n[r.p] + ' / ' + s.deployed; r.u.style.width = (100 * v[r.p] / s.value0) + '%'; r.row.classList.toggle('dead', v[r.p] === 0); }
  const t = sim.time | 0; $('clock').textContent = (t / 60 | 0) + ':' + String(t % 60).padStart(2, '0');
}
function showResults() {
  const d = el('div'), ban = el('div', 'banner'), w = sim.winner, players = sim.stats.map((s, p) => p).filter(p => sim.stats[p].value0 > 0);
  ban.appendChild(el('h2', '', w >= 0 ? T('victory') : T('draw')));
  const who = el('div', 'who');
  if (w >= 0) players.filter(p => sim.teamOf[p] === w).forEach(p => { const t = el('span', 'tag'), i = el('i'); i.style.background = AB.PLAYERS[p].m; t.append(i, document.createTextNode(T('p_' + AB.PLAYERS[p].id))); who.appendChild(t); });
  else who.appendChild(el('span', 'sub', sim.stalemate ? T('stalemate') : T('nobody')));
  ban.appendChild(who); const tt = sim.time | 0; ban.appendChild(el('p', 'sub', T('battleTime') + ' ' + (tt / 60 | 0) + ':' + String(tt % 60).padStart(2, '0'))); d.appendChild(ban);
  const tb = el('table', 'res'), hr = el('tr'); ['player', 'deployed', 'survived', 'lost', 'kills', 'dmg', 'razed', 'mvp'].forEach(k => hr.appendChild(el('th', '', T(k)))); tb.appendChild(hr);
  const alive = new Uint16Array(8); for (const e of sim.ents) if (!e.bld) alive[e.p]++;
  players.forEach(p => { const s = sim.stats[p], tr = el('tr', sim.teamOf[p] === w ? 'win' : ''), c0 = el('td'), tag = el('span', 'tag'), i = el('i'); i.style.background = AB.PLAYERS[p].m; tag.append(i, document.createTextNode(T('p_' + AB.PLAYERS[p].id) + ' · ' + AB.TEAM_NAMES[sim.teamOf[p]])); c0.appendChild(tag); tr.appendChild(c0);
    [s.deployed, alive[p], s.lost, s.kills, Math.round(s.dmg).toLocaleString(), s.razed].forEach(v => tr.appendChild(el('td', '', String(v))));
    const m = el('td'); if (s.best) { m.textContent = T('u_' + s.best.t) + ' '; m.appendChild(el('small', '', '×' + s.best.kills)); } else m.textContent = '—'; tr.appendChild(m); tb.appendChild(tr); });
  d.appendChild(tb); d.appendChild(el('h3', '', T('strength'))); const g = el('canvas'); g.id = 'graph'; d.appendChild(g);
  const f = el('div', 'foot'), b1 = el('button', '', T('watch')), b2 = el('button', '', T('toEdit')), b3 = el('button', 'primary', T('again'));
  b1.onclick = closeModal; b2.onclick = stopBattle; b3.onclick = startBattle; f.append(b1, b2, b3);
  if (H.onResults) H.onResults(d, sim, ban); d.appendChild(f);
  openModal(d);
  // strength graph
  const r = g.getBoundingClientRect(), W = r.width, GH = r.height; g.width = W * 2; g.height = GH * 2; const c = g.getContext('2d'); c.scale(2, 2);
  const hs = sim.history, tmax = Math.max(1, hs[hs.length - 1].t); let vmax = 1; for (const h of hs) for (const p of players) vmax = Math.max(vmax, h.v[p]);
  c.strokeStyle = '#ffffff14'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, GH * i / 4); c.lineTo(W, GH * i / 4); c.stroke(); }
  for (const p of players) { c.strokeStyle = AB.PLAYERS[p].m; c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath(); hs.forEach((h, i) => { const x = 6 + (W - 12) * h.t / tmax, y = GH - 6 - (GH - 14) * h.v[p] / vmax; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); }
  if (H.onResultsShown) H.onResultsShown(d, sim);
  if (w >= 0) AB.Audio.win(); else AB.Audio.lose();
}

// ---------------------------------------------------------------- modals
function openModal(node) { const m = $('modal'), d = m.firstElementChild; d.className = 'dlg' + (node.dataset && node.dataset.wide ? ' wide' : ''); d.textContent = ''; d.appendChild(node); m.hidden = false; d.scrollTop = 0; }
function closeModal() { $('modal').hidden = true; }
function presetsDlg(welcome) {
  const d = el('div'); d.appendChild(el('h2', '', welcome ? T('title') : T('presets'))); d.appendChild(el('p', 'sub', welcome ? T('welcomeSub') : T('welcome')));
  const g = el('div', 'cards');
  S.presets.forEach(p => { const b = el('button', 'pcard'); b.append(el('b', '', T('pr_' + p.id)), el('span', '', T('pr_' + p.id + '_d'))); b.onclick = () => { if (undo.length || !welcome) pushUndo0(); setScenario(S.preset(p.id)); autosave(); closeModal(); }; g.appendChild(b); });
  d.appendChild(g); if (H.welcome) H.welcome(d, g, welcome); const f = el('div', 'foot');
  if (welcome) { const a = el('button', '', T('startBlank')); a.onclick = () => { newMapDlg(); }; f.appendChild(a); if (welcome === 2) { const c = el('button', 'primary', T('continueEdit')); c.onclick = closeModal; f.appendChild(c); } }
  else { const c = el('button', '', T('close')); c.onclick = closeModal; f.appendChild(c); }
  d.appendChild(f); openModal(d);
}
function pushUndo0() { undo.length = 0; redo.length = 0; syncUndo(); }
function newMapDlg() {
  const d = el('div'); d.appendChild(el('h2', '', T('newMap'))); d.appendChild(el('p', 'sub', T('confirmNew')));
  const o = { size: 64, kind: 'blank', base: 0, biome: 'temperate' };
  const field = (label, opts, key) => { const f = el('div', 'field'); f.appendChild(el('label', '', label)); const w = el('div', 'chips'); const draw = () => { w.textContent = ''; opts.forEach(([v, t]) => { const b = el('button', 'chip' + (o[key] === v ? ' on' : ''), t); b.onclick = () => { o[key] = v; draw(); sync(); }; w.appendChild(b); }); }; draw(); f.appendChild(w); return f; };
  const fBase = field(T('baseT'), [0, 1, 2, 3, 4].map(i => [i, T('t_' + AB.TERRAIN[i].id)]), 'base'), fBio = field(T('baseT'), [['temperate', T('bTemperate')], ['desert', T('bDesert')], ['snow', T('bSnow')]], 'biome');
  const sync = () => { fBase.hidden = o.kind !== 'blank'; fBio.hidden = o.kind === 'blank'; };
  d.append(field(T('size'), [[48, T('sSmall')], [64, T('sMed')], [96, T('sLarge')], [128, T('sHuge')]], 'size'), field(T('tTerrain'), [['blank', T('blank')], ['random', T('random')]], 'kind'), fBase, fBio); sync();
  const f = el('div', 'foot'), a = el('button', '', T('cancel')), b = el('button', 'primary', T('create')); a.onclick = closeModal;
  b.onclick = () => { const s = o.kind === 'blank' ? S.create(o.size, o.size, o.base) : S.randomMap(o.size, o.size, (Math.random() * 1e6) | 1, o.biome); s.name = ''; pushUndo0(); setScenario(s); autosave(); closeModal(); };
  f.append(a, b); d.appendChild(f); openModal(d);
}
function saves() { try { return JSON.parse(store.get('aob2.saves') || '{}') || {}; } catch (e) { return {}; } }
function saveDlg() {
  const d = el('div'); d.appendChild(el('h2', '', T('saveLoad')));
  const f1 = el('div', 'field'); f1.appendChild(el('label', '', T('saveAs'))); const line = el('div', 'inline'), inp = el('input'); inp.type = 'text'; inp.maxLength = 60; inp.value = sc.name || T('untitled'); inp.style.flex = '1';
  const sb = el('button', 'primary', T('save')); sb.onclick = () => { const name = inp.value.trim() || T('untitled'); sc.name = name; $('mapName').value = name; const all = saves(); all[name] = { t: Date.now(), d: S.pack(sc) }; if (store.set('aob2.saves', JSON.stringify(all))) { toast(T('saved')); list(); } };
  line.append(inp, sb); f1.appendChild(line); d.appendChild(f1);
  const f2 = el('div', 'field'); f2.appendChild(el('label', '', T('load'))); const box2 = el('div', 'saves'); f2.appendChild(box2); d.appendChild(f2);
  const list = () => { box2.textContent = ''; const all = saves(), names = Object.keys(all).sort((a, b) => all[b].t - all[a].t); if (!names.length) { const e = el('div'); e.appendChild(el('em', '', T('noSaves'))); box2.appendChild(e); }
    names.forEach(nm => { const r = el('div'), a = el('button', '', T('load')), x = el('button', 'danger', T('del')); r.append(el('span', '', nm), el('em', '', all[nm].d.units.length + ' · ' + all[nm].d.w + '×' + all[nm].d.h), a, x);
      a.onclick = () => { try { const s = S.unpack(all[nm].d); pushUndo0(); setScenario(s); autosave(); closeModal(); toast(T('loaded')); } catch (e) { toast(T('badFile')); } };
      x.onclick = () => { delete all[nm]; store.set('aob2.saves', JSON.stringify(all)); list(); }; box2.appendChild(r); }); };
  list();
  const f = el('div', 'foot'), ex = el('button', '', T('exportF')), im = el('button', '', T('importF')), c = el('button', '', T('close')), file = el('input'); file.type = 'file'; file.accept = '.json,application/json'; file.hidden = true;
  ex.onclick = () => { const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S.pack(sc))], { type: 'application/json' })); a.download = (sc.name || 'battle').replace(/[^\w가-힣 -]+/g, '_') + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  im.onclick = () => file.click(); file.onchange = () => { const fl = file.files[0]; if (!fl) return; fl.text().then(t => { const s = S.unpack(JSON.parse(t)); pushUndo0(); setScenario(s); autosave(); closeModal(); toast(T('loaded')); }).catch(() => toast(T('badFile'))); };
  c.onclick = closeModal; f.append(file, ex, im, c); d.appendChild(f); openModal(d);
}
function helpDlg() { const d = el('div'); d.appendChild(el('h2', '', T('help'))); const b = el('div'); b.innerHTML = T('helpBody'); d.appendChild(b); const f = el('div', 'foot'), c = el('button', 'primary', T('close')); c.onclick = closeModal; f.appendChild(c); d.appendChild(f); openModal(d); }

// ---------------------------------------------------------------- input
let drag = null; const ptrs = new Map();
function pt(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function entAt(wx, wy) {
  let best = null, bd = 0.75;
  for (const e of sim.ents) { if (e.dead) continue; if (e.bld) { if (wx >= e.x0 && wx < e.x1 && wy >= e.y0 && wy < e.y1) return e; continue; } const d = Math.hypot(e.x - wx, e.y - wy + 0.35) - e.r; if (d < bd) { bd = d; best = e; } }
  return best;
}
function command(sx, sy) {
  if (!sim || !sel.size) return; const [wx, wy] = R.s2w(sx, sy), any = sel.values().next().value, t = entAt(wx, wy);
  if (t && t.team !== any.team) { sim.order(sel, { k: 'atk', t }); marker = { x: t.x, y: t.y, t: 0, atk: 1 }; return; }
  const list = [...sel], n = list.length, cols = Math.ceil(Math.sqrt(n)), sp = 0.75; list.forEach((e, i) => { e.ox = ((i % cols) - (cols - 1) / 2) * sp; e.oy = (((i / cols) | 0) - (Math.ceil(n / cols) - 1) / 2) * sp; });
  sim.order(sel, { k: 'move', x: wx, y: wy }); marker = { x: wx, y: wy, t: 0 };
}
function selectBox(x0, y0, x1, y1) {
  const click = Math.abs(x1 - x0) < 5 && Math.abs(y1 - y0) < 5; sel.clear();
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
  if (sim) {
    if (click) { const [wx, wy] = R.s2w(x0, y0), e = entAt(wx, wy); if (e && !e.bld) sel.add(e); }
    else { const by = {}; for (const e of sim.ents) { if (e.bld || e.dead) continue; const [sx, sy] = R.w2s(e.x, e.y); if (sx >= xa && sx <= xb && sy - 8 >= ya - 14 && sy - 8 <= yb) (by[e.p] = by[e.p] || []).push(e); }
      let best = null; for (const p in by) if (!best || by[p].length > best.length) best = by[p]; if (best) best.forEach(e => sel.add(e)); }
  } else {
    let near = null, nd = 22;
    for (const u of sc.units) { const d = U[u.t], [sx, sy] = R.w2s(d.bld ? u.x + d.size / 2 : u.x, d.bld ? u.y + d.size / 2 : u.y);
      if (click) { const dd = Math.hypot(sx - x0, sy - 10 * R.cam.z - y0); if (dd < nd) { nd = dd; near = u; } } else if (sx >= xa && sx <= xb && sy >= ya && sy <= yb) sel.add(u); }
    if (near) sel.add(near);
  }
  updateSel();
}
cv.addEventListener('pointerdown', e => {
  AB.Audio.unlock(); const [x, y] = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  ptrs.set(e.pointerId, [x, y]);
  if (ptrs.size === 2) { if (drag && drag.type === 'stroke') endStroke(); const p = [...ptrs.values()]; drag = { type: 'pinch', d: Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), mx: (p[0][0] + p[1][0]) / 2, my: (p[0][1] + p[1][1]) / 2 }; box = null; return; }
  const touch = e.pointerType === 'touch';
  if (e.button === 1 || e.button === 2 || keys[' '] || (st.mode === 'edit' && st.tool === 'hand') || (touch && st.mode === 'battle')) { drag = { type: 'pan', x, y, moved: 0, btn: e.button }; cv.classList.add('pan'); e.preventDefault(); return; }
  if (e.button !== 0) return;
  if (st.mode === 'edit' && st.tool !== 'select') { pushUndo(); drag = { type: 'stroke', last: null, changed: false }; applyTool(x, y, true); updateGhost(); }
  else drag = { type: 'box', x0: x, y0: y };
});
cv.addEventListener('pointermove', e => {
  const [x, y] = pt(e); if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [x, y]); hover = e.pointerType === 'touch' && !drag ? null : [x, y];
  if (!drag) { updateGhost(); return; }
  if (drag.type === 'pinch') { const p = [...ptrs.values()]; if (p.length < 2) return; const d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2;
    R.cam.x -= (mx - drag.mx) / R.cam.z; R.cam.y -= (my - drag.my) / R.cam.z; R.zoomAt(mx, my, d / (drag.d || d)); drag.d = d; drag.mx = mx; drag.my = my; return; }
  if (drag.type === 'pan') { const dx = x - drag.x, dy = y - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); R.cam.x -= dx / R.cam.z; R.cam.y -= dy / R.cam.z; R.clampCam(); drag.x = x; drag.y = y; }
  else if (drag.type === 'stroke') { applyTool(x, y, false); updateGhost(); }
  else if (drag.type === 'box') box = [Math.min(drag.x0, x), Math.min(drag.y0, y), Math.max(drag.x0, x), Math.max(drag.y0, y)];
});
function endStroke() { if (drag.changed) { afterEdit(); } else { undo.pop(); syncUndo(); } }
function pointerEnd(e) {
  const [x, y] = pt(e); ptrs.delete(e.pointerId); if (!drag) return;
  if (drag.type === 'pinch') { if (ptrs.size < 2) drag = null; return; }
  if (drag.type === 'pan') { cv.classList.remove('pan'); if (drag.btn === 2 && drag.moved < 6 && e.type === 'pointerup') { if (sim) command(x, y); else if (sel.size) { sel.clear(); updateSel(); } } }
  else if (drag.type === 'stroke') endStroke();
  else if (drag.type === 'box') { selectBox(drag.x0, drag.y0, x, y); box = null; }
  drag = null; updateGhost();
}
cv.addEventListener('pointerup', pointerEnd); cv.addEventListener('pointercancel', pointerEnd);
cv.addEventListener('pointerleave', () => { if (!drag) { hover = null; ghost = null; } });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); const [x, y] = pt(e); R.zoomAt(x, y, Math.exp(-(e.deltaMode ? e.deltaY * 30 : e.deltaY) * 0.0016)); updateGhost(); }, { passive: false });
const mini = $('mini'); let miniDown = false;
function miniGo(e) { const r = mini.getBoundingClientRect(), [wx, wy] = R.miniToWorld(e.clientX - r.left, e.clientY - r.top); R.center(wx, wy); R.clampCam(); }
mini.addEventListener('pointerdown', e => { miniDown = true; try { mini.setPointerCapture(e.pointerId); } catch (err) {} miniGo(e); });
mini.addEventListener('pointermove', e => { if (miniDown) miniGo(e); }); mini.addEventListener('pointerup', () => miniDown = false); mini.addEventListener('pointercancel', () => miniDown = false);

window.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') { if (e.key === 'Escape' || e.key === 'Enter') e.target.blur(); return; }
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (!$('modal').hidden) { if (k === 'Escape') closeModal(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); doRedo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (sel.size && (k === 'g' || k === 'h' || (k === 'd' && sim))) { setStance(k === 'g' ? 0 : k === 'd' ? 1 : 2); return; }
  if (sel.size && k === 'x' && sim) { sim.order(sel, { k: 'stop' }); return; }
  keys[k] = true;
  if (k === ' ') { e.preventDefault(); if (sim && !e.repeat) { st.paused = !st.paused; syncBattleBar(); } }
  else if (k === 'Escape') { sel.clear(); updateSel(); }
  else if (k === 'Home' || k === 'f') R.fit();
  else if (st.mode === 'edit') { if (k >= '1' && k <= '7') setTool(TOOLS[+k - 1]); else if (k === 'Delete' || k === 'Backspace') delSel(); else if (k === 'Enter') startBattle(); }
  else { const sp = [0.5, 1, 2, 4], i = sp.indexOf(st.speed); if (k === '+' || k === '=') { st.speed = sp[Math.min(3, i + 1)]; syncBattleBar(); } else if (k === '-' || k === '_') { st.speed = sp[Math.max(0, i - 1)]; syncBattleBar(); } else if (k === 'r') startBattle(); }
});
window.addEventListener('keyup', e => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
window.addEventListener('resize', () => R.resize());

// ---------------------------------------------------------------- top bar
$('bStart').onclick = startBattle; $('bEdit').onclick = stopBattle; $('bRestart').onclick = startBattle;
$('bPause').onclick = () => { st.paused = !st.paused; syncBattleBar(); };
$('bPresets').onclick = () => presetsDlg(0); $('bNew').onclick = newMapDlg; $('bSave').onclick = saveDlg; $('bHelp').onclick = helpDlg; $('bUndo').onclick = doUndo; $('bRedo').onclick = doRedo;
$('bSound').onclick = () => { AB.Audio.unlock(); const on = !AB.Audio.isOn(); AB.Audio.setOn(on); store.set('aob2.sound', on ? '1' : '0'); $('bSound').classList.toggle('off', !on); };
$('bLang').onclick = () => { AB.lang = AB.lang === 'ko' ? 'en' : 'ko'; store.set('aob2.lang', AB.lang); applyLang(); };
$('mapName').oninput = () => { sc.name = $('mapName').value; autosave(); };
$('modal').addEventListener('pointerdown', e => { if (e.target === $('modal')) closeModal(); });
$('panelToggle').onclick = () => { document.body.classList.toggle('collapsed'); R.resize(); };
function applyLang() {
  document.documentElement.lang = AB.lang; document.querySelectorAll('[data-t]').forEach(n => n.textContent = T(n.dataset.t));
  $('bLang').textContent = AB.lang === 'ko' ? 'EN' : '한'; $('mapName').placeholder = T('mapName'); $('bUndo').title = T('undo') + ' (Ctrl+Z)'; $('bRedo').title = T('redo') + ' (Ctrl+Y)'; $('bSound').title = T('sound'); $('bHelp').title = T('help');
  document.title = T('title') + ' — ' + T('sub'); buildTabs(); buildTool(); refreshArmies(); updateSel(); syncBattleBar(); if (sim) buildHud(); if (H.onLang) H.onLang();
}

// ---------------------------------------------------------------- main loop
let lastTs = 0;
function frame(ts) {
  const dt = Math.min(0.1, (ts - lastTs) / 1000 || 0.016); lastTs = ts;
  const pan = 620 * dt / R.cam.z; let moved = false;
  if (keys.w || keys.ArrowUp) { R.cam.y -= pan; moved = true; } if (keys.s || keys.ArrowDown) { R.cam.y += pan; moved = true; }
  if (keys.a || keys.ArrowLeft) { R.cam.x -= pan; moved = true; } if ((keys.d && !(sim && sel.size)) || keys.ArrowRight) { R.cam.x += pan; moved = true; }
  if (moved) { R.clampCam(); updateGhost(); }
  let sdt = dt;
  if (sim) {
    if (!st.paused) {
      acc += dt * st.speed; let n = 0; while (acc >= DT && n < 14) { sim.step(); acc -= DT; n++; } if (n >= 14) acc = 0;
      R.fx(sim.events); AB.Audio.feed(sim.events, R); if (H.onEvents) H.onEvents(sim.events, sim); sim.events.length = 0; sdt = dt * st.speed; prune();
      if (sim.over && !endShown) { if (!endAt) endAt = ts + 900; else if (ts >= endAt) { endShown = true; endAt = 0; updateHud(); showResults(); } }
    } else sdt = 0;
    AB.Audio.tick(sim, dt, st.paused || sim.over);
    if ((hudT -= dt) <= 0) { hudT = 0.25; updateHud(); }
  }
  if (marker) { marker.t += dt * 2; if (marker.t >= 1) marker = null; }
  if (H.onFrame) H.onFrame(dt, sdt);
  R.draw({ sim, alpha: sim && !sim.over ? Math.min(1, acc / DT) : 1, sel, ghost, box, marker, dt: sdt, zone: st.mode === 'edit' ? H.zone : null });
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- API for extra.js
AB.App = { H, el, $, store, toast, openModal, closeModal, setScenario, startBattle, stopBattle, setTool, buildTool, buildTabs, refreshArmies, pushUndo0, autosave, syncBattleBar, updateSel, presetsDlg,
  get sc() { return sc; }, get sim() { return sim; }, get sel() { return sel; }, st, R, U };

// ---------------------------------------------------------------- boot
function boot() {
  const lg = store.get('aob2.lang'); AB.lang = lg === 'ko' || lg === 'en' ? lg : ((navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en');
  if (store.get('aob2.sound') === '0') { AB.Audio.setOn(false); $('bSound').classList.add('off'); }
  if (window.matchMedia('(pointer: coarse)').matches) st.tool = 'hand';
  R.resize(); let s = null, had = false;
  try { const a = store.get('aob2.autosave'); if (a) { s = S.unpack(JSON.parse(a)); had = true; } } catch (e) { s = null; }
  sc = s || S.preset('field'); applyLang(); setScenario(sc); syncUndo();
  presetsDlg(had ? 2 : 1);
  requestAnimationFrame(frame);
  window.AB_DEBUG = { get sim() { return sim; }, get sc() { return sc; }, R, st, startBattle, stopBattle, setScenario };
}
window.addEventListener('DOMContentLoaded', boot);
})();
