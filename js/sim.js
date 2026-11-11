/* Age of Battels — battle simulation. Fixed 20 Hz tick, deterministic, DOM-free. */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};
const DT = 0.05, CELL = 1, SQ2 = Math.SQRT2;
const DIRS = [1, 0, -1, 0, 0, 1, 0, -1, 1, 1, 1, -1, -1, 1, -1, -1];

class Sim {
  constructor(sc, opt) {
    opt = opt || {};
    const TR = AB.TERRAIN, w = this.w = sc.w, h = this.h = sc.h, n = w * h;
    this.rnd = AB.rng32(opt.seed || 1);
    this.teamOf = sc.players.map(p => p.team);
    this.block = new Uint8Array(n); this.tspd = new Float32Array(n);
    for (let i = 0; i < n; i++) { const tr = TR[sc.terrain[i]]; this.block[i] = (!tr.pass || sc.objects[i]) ? 1 : 0; this.tspd[i] = tr.spd || 1; }
    this.bmap = new Array(n).fill(null);
    this.gw = Math.ceil(w / CELL); this.gh = Math.ceil(h / CELL);
    this.grid = Array.from({ length: this.gw * this.gh }, () => []);
    this.ents = []; this.projs = []; this.corpses = []; this.events = [];
    this.time = 0; this.nid = 0; this.over = false; this.winner = -1; this.stalemate = false; this.endT = -1; this.lastAct = 0; this.bestD = Infinity;
    this.stats = sc.players.map(() => ({ deployed: 0, lost: 0, kills: 0, dmg: 0, razed: 0, bLost: 0, value0: 0, best: null }));
    this.history = []; this.sampleT = 0; this.checkT = 0;
    this.g = new Float32Array(n); this.f = new Float32Array(n); this.from = new Int32Array(n);
    this.stamp = new Uint32Array(n); this.closed = new Uint32Array(n); this.gen = 0; this.heap = []; this.budget = 0; this.load = 1; this.far = new Map();
    for (const u of sc.units) this.spawn(u.t, u.p, u.x, u.y, u.s || 0);
    this._sample();
  }

  spawn(t, p, x, y, stance) {
    const d = AB.UNITS[t], R = this.rnd;
    const e = { id: ++this.nid, t, d, p, team: this.teamOf[p], x, y, px: x, py: y, vx: 0, vy: 0, hp: d.hp, r: d.r, bld: !!d.bld,
      fx: 1, fy: 0, tgt: null, cd: R() * d.rof * 0.6, sw: 0, rec: 0, atkT: -9, think: R() * 0.5, path: null, pi: 0, pgx: 0, pgy: 0, pT: 0,
      partial: false, arrived: false, breach: false, order: null, stance, hx: x, hy: y, kills: 0, runT: 0, buff: 0, anim: R(),
      moving: false, dead: false, avoid: null, avoidT: 0, gT: 0, nAtk: 0, flash: 0, pend: 0, tk: 0, follow: null, sx: x, sy: y, tl: null };
    if (d.bld) {
      e.x0 = x; e.y0 = y; e.x1 = x + d.size; e.y1 = y + d.size; e.x = e.px = x + d.size / 2; e.y = e.py = y + d.size / 2;
      for (let j = 0; j < d.size; j++) for (let i = 0; i < d.size; i++) this.bmap[x + i + (y + j) * this.w] = e;
    } else {
      const cx = this.w / 2 - x, cy = this.h / 2 - y, l = Math.hypot(cx, cy) || 1; e.fx = cx / l; e.fy = cy / l;
      this.stats[p].deployed++;
    }
    this.stats[p].value0 += d.cost;
    this.ents.push(e); return e;
  }
  ev(k, x, y, a, b) { if (this.events.length < 700) this.events.push({ k, x, y, a, b }); }

  // ------------------------------------------------------------ geometry
  canStand(x, y, team) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    const i = (x | 0) + (y | 0) * this.w; if (this.block[i]) return false;
    const b = this.bmap[i]; return !b || (b.d.gate && b.team === team);
  }
  cdist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  gap(e, t) {
    if (t.bld) { const dx = Math.max(t.x0 - e.x, 0, e.x - t.x1), dy = Math.max(t.y0 - e.y, 0, e.y - t.y1); return Math.hypot(dx, dy) - e.r * 0.6; }
    return Math.hypot(e.x - t.x, e.y - t.y) - e.r - t.r;
  }
  walkLine(x0, y0, x1, y1, team, reach) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), n = Math.ceil(d / 0.4);
    for (let k = 1; k <= n; k++) {
      const x = x0 + dx * k / n, y = y0 + dy * k / n;
      if (reach && Math.hypot(x1 - x, y1 - y) <= reach) return true;
      if (!this.canStand(x, y, team)) return false;
    }
    return true;
  }
  near(x, y, rad, fn) {
    const g = this.grid, gw = this.gw, x0 = Math.max(0, ((x - rad) / CELL) | 0), x1 = Math.min(gw - 1, ((x + rad) / CELL) | 0),
      y0 = Math.max(0, ((y - rad) / CELL) | 0), y1 = Math.min(this.gh - 1, ((y + rad) / CELL) | 0);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const c = g[i + j * gw]; for (let k = 0; k < c.length; k++) fn(c[k]); }
  }

  // ------------------------------------------------------------ pathfinding
  _cost(i, team) {
    if (this.block[i]) return Infinity;
    const b = this.bmap[i];
    if (b) return b.team === team ? (b.d.gate ? 1 : Infinity) : 30;
    return 1 / this.tspd[i];
  }
  _push(i) { const h = this.heap, f = this.f; let k = h.length; h.push(i); while (k > 0) { const p = (k - 1) >> 1; if (f[h[p]] <= f[i]) break; h[k] = h[p]; k = p; } h[k] = i; }
  _pop() {
    const h = this.heap, f = this.f, top = h[0], last = h.pop(), n = h.length;
    if (n) { let k = 0; for (;;) { let c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && f[h[c + 1]] < f[h[c]]) c++; if (f[h[c]] >= f[last]) break; h[k] = h[c]; k = c; } h[k] = last; }
    return top;
  }
  findPath(e, gx, gy, reach) {
    const w = this.w, h = this.h, team = e.team, g = this.g, f = this.f, from = this.from, stamp = this.stamp, closed = this.closed;
    const sx = Math.max(0, Math.min(w - 1, e.x | 0)), sy = Math.max(0, Math.min(h - 1, e.y | 0)), s = sx + sy * w, gen = ++this.gen;
    this.heap.length = 0; g[s] = 0; f[s] = Math.hypot(sx + 0.5 - gx, sy + 0.5 - gy); stamp[s] = gen; from[s] = -1; this._push(s);
    let best = s, bestH = f[s], found = -1, exp = 0;
    while (this.heap.length) {
      const c = this._pop(); if (closed[c] === gen) continue; closed[c] = gen;
      const cx = c % w, cy = (c / w) | 0, hd = Math.hypot(cx + 0.5 - gx, cy + 0.5 - gy);
      if (hd <= reach) { found = c; break; }
      if (hd < bestH) { bestH = hd; best = c; }
      if (++exp > 9000) break;
      for (let k = 0; k < 16; k += 2) {
        const dx = DIRS[k], dy = DIRS[k + 1], nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = nx + ny * w; if (closed[ni] === gen) continue;
        const cost = this._cost(ni, team); if (cost === Infinity) continue;
        if (dx && dy && (this._cost(cx + dx + cy * w, team) > 5 || this._cost(cx + ny * w, team) > 5)) continue;
        const ng = g[c] + cost * (dx && dy ? SQ2 : 1);
        if (stamp[ni] !== gen || ng < g[ni]) { stamp[ni] = gen; g[ni] = ng; from[ni] = c; f[ni] = ng + Math.hypot(nx + 0.5 - gx, ny + 0.5 - gy); this._push(ni); }
      }
    }
    const pts = []; let c = found >= 0 ? found : best;
    while (c !== s && c >= 0) { pts.push((c / w | 0) + 0.5, c % w + 0.5); c = from[c]; }
    pts.reverse();                                     // now x,y pairs from start to goal
    return { pts, partial: found < 0 };
  }
  _plan(e, gx, gy, reach) {
    if (this.walkLine(e.x, e.y, gx, gy, e.team, reach)) { e.path = null; e.partial = false; return; }
    if (e.path && Math.hypot(gx - e.pgx, gy - e.pgy) < 1.5 && this.time - e.pT < 3) {
      const p = e.path; while (e.pi + 3 < p.length && this.walkLine(e.x, e.y, p[e.pi + 2], p[e.pi + 3], e.team)) e.pi += 2;
      return;
    }
    if (this.budget <= 0) return; this.budget--;
    const r = this.findPath(e, gx, gy, reach || 0.8);
    e.path = r.pts.length ? r.pts : null; e.pi = 0; e.partial = r.partial; e.pgx = gx; e.pgy = gy; e.pT = this.time;
    if (!e.path && r.partial) e.arrived = true;
  }
  _move(e, gx, gy) {
    let tx = gx, ty = gy;
    if (e.path) {
      const p = e.path; tx = p[e.pi]; ty = p[e.pi + 1];
      const b = this.bmap[(tx | 0) + (ty | 0) * this.w];
      if (b && b.team !== e.team) { e.tgt = b; e.breach = true; e.path = null; return; }
      if (Math.hypot(tx - e.x, ty - e.y) < 0.3) { e.pi += 2; if (e.pi >= p.length) { e.path = null; if (e.partial) e.arrived = true; } return; }
    }
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d < 1e-4) return;
    const step = Math.min(d, e.d.spd * this.tspd[(e.x | 0) + (e.y | 0) * this.w] * DT), nx = e.x + dx / d * step, ny = e.y + dy / d * step, tm = e.team;
    e.fx = dx / d; e.fy = dy / d;
    if (this.canStand(nx, ny, tm) || !this.canStand(e.x, e.y, tm)) { e.x = nx; e.y = ny; }
    else if (this.canStand(nx, e.y, tm)) e.x = nx; else if (this.canStand(e.x, ny, tm)) e.y = ny;
    e.moving = true; e.runT += DT; e.anim += step * 0.9;
  }

  // ------------------------------------------------------------ AI
  _score(e, c, cur, R) {
    const d = e.d, dist = this.gap(e, c); let s;
    if (dist > R) return Infinity;
    if (c === e.avoid && this.time < e.avoidT) return Infinity;
    if (d.minR && this.cdist(e, c) < d.minR) return Infinity;
    if (c.bld) {
      if (c.d.wall) { if (d.pref !== 'bld') return Infinity; s = dist * 0.6 - 3; }
      else s = d.pref === 'bld' ? dist * 0.4 - 6 : c.d.atk ? dist + 1.5 : dist + 7;
    } else {
      s = dist + (d.pref === 'bld' ? 4 : 0);
      if (!c.d.atk) s += 3;
    }
    if (d.bonus) { const cl = c.d.cls; for (let i = 0; i < cl.length; i++) if (d.bonus[cl[i]] > 1.2) { s -= 1.5; break; } }
    if (!d.proj) s += c.nAtk * 0.3; else if (c.pend >= c.hp) s += 5;
    if (c === cur) s -= 1.2;
    if (e.stance === 1 && Math.hypot(c.x - e.hx, c.y - e.hy) > 11) return Infinity;
    return s;
  }
  // expanding ring search over the spatial grid; far = keep going across the whole map
  _acquire(e, cur, R, far) {
    const g = this.grid, gw = this.gw, gh = this.gh, cx = (e.x / CELL) | 0, cy = (e.y / CELL) | 0, team = e.team, lim = far ? 1e9 : R;
    const maxK = far ? Math.max(gw, gh) : Math.ceil((R + 2) / CELL), slack = e.d.pref ? 14 : 3;
    let best = null, bs = Infinity, bd = Infinity;
    for (let k = 0; k <= maxK; k++) {
      if (best && (k - 1) * CELL > bd + slack) break;
      const x0 = cx - k, x1 = cx + k, y0 = cy - k, y1 = cy + k;
      for (let j = y0; j <= y1; j++) {
        if (j < 0 || j >= gh) continue; const st = (j === y0 || j === y1) ? 1 : (x1 - x0) || 1;
        for (let i = x0; i <= x1; i += st) {
          if (i < 0 || i >= gw) continue; const c = g[i + j * gw];
          for (let q = 0; q < c.length; q++) { const o = c[q]; if (o.team === team || o.dead) continue; const sc = this._score(e, o, cur, lim); if (sc < bs) { bs = sc; best = o; bd = this.gap(e, o); } }
        }
      }
    }
    return best;
  }
  _think(e) {
    const d = e.d;
    if (d.aura) { const self = this; this.near(e.x, e.y, d.aura, c => { if (c.team === e.team && !c.bld && self.cdist(e, c) <= d.aura) c.buff = self.time + 1.2; }); }
    if (d.heal) return this._thinkHeal(e);
    const o = e.order;
    if (o) {
      if (o.k === 'move') { this._plan(e, o.x, o.y, 0.3); return; }
      if (o.t.dead) e.order = null; else { e.tgt = o.t; if (this.gap(e, o.t) > d.rng) this._plan(e, o.t.x, o.t.y, o.t.bld ? o.t.r * 1.42 + 0.7 : Math.max(0.8, d.rng * 0.8)); return; }
    }
    let cur = e.tgt; if (cur && cur.dead) { cur = null; e.breach = false; }
    if (e.arrived) { e.arrived = false; if (cur && this.gap(e, cur) > d.rng) { e.avoid = cur; e.avoidT = this.time + 5; cur = null; e.breach = false; } }
    const hold = e.stance === 2, R = hold ? d.rng + 0.3 : Math.max(d.acq, d.rng + 2.5);
    // engaged with a live target in reach: only reconsider every third think
    if (cur && !cur.bld && !e.breach && (e.tk = (e.tk + 1) % 3) && this.gap(e, cur) <= d.rng && !(d.proj && cur.pend >= cur.hp)) { e.path = null; return; }
    let best;
    if (e.breach && cur) { best = this._acquire(e, null, 2.5, false); if (best && !best.bld) e.breach = false; else best = cur; }
    else {
      // a far target that is still well out of reach means nobody is near: skip the local scan
      const farAway = cur && e.stance === 0 && this.time < e.gT && this.gap(e, cur) > R + 6 && !(cur === e.avoid && this.time < e.avoidT);
      best = farAway ? cur : this._acquire(e, cur, R, false);
      if (!best && e.stance === 0) {
        if (this.time >= e.gT) {
          // far targets are shared by neighbours of the same team for a moment: one map-wide search serves a whole block
          e.gT = this.time + 1 + this.rnd();
          const key = e.team + 8 * (((e.x / 6) | 0) + ((e.y / 6) | 0) * 64) + (d.pref ? 1e6 : 0) + (d.minR ? 2e6 : 0), hit = this.far.get(key);
          if (hit && hit.exp > this.time && !hit.t.dead && !(hit.t === e.avoid && this.time < e.avoidT)) best = hit.t;
          else { best = this._acquire(e, cur, R, true); if (best) this.far.set(key, { t: best, exp: this.time + 1.2 }); }
        }
        else if (cur && !(cur === e.avoid && this.time < e.avoidT)) best = cur;
      }
    }
    e.tgt = best;
    if (best && !hold) { if (this.gap(e, best) > d.rng) this._plan(e, best.x, best.y, best.bld ? best.r * 1.42 + 0.7 : Math.max(0.8, d.rng * 0.8)); else e.path = null; }
    else if (!best && e.stance === 1 && Math.hypot(e.hx - e.x, e.hy - e.y) > 0.6) this._plan(e, e.hx, e.hy, 0.3);
  }
  _thinkHeal(e) {
    const self = this; let best = null, bd = Infinity, ally = null, ad = Infinity;
    if (e.order && e.order.k === 'move') { this._plan(e, e.order.x, e.order.y, 0.3); return; }
    this.near(e.x, e.y, 12, c => {
      if (c.team !== e.team || c.bld || c === e || c.dead) return; const dd = self.cdist(e, c);
      if (c.hp < c.d.hp - 1 && dd < bd) { bd = dd; best = c; }
      if (c.d.atk && dd < ad) { ad = dd; ally = c; }
    });
    e.tgt = best;
    if (!best && !ally && e.stance === 0 && this.time >= e.gT) {
      e.gT = this.time + 2; const E = this.ents;
      for (let i = 0; i < E.length; i++) { const c = E[i]; if (c.team !== e.team || c.bld || !c.d.atk) continue; const dd = this.cdist(e, c); if (dd < ad) { ad = dd; ally = c; } }
    }
    e.follow = e.stance === 2 ? null : ally || e.follow;
    const g = best || e.follow;
    if (g && !g.dead && e.stance !== 2) this._plan(e, g.x, g.y, 2);
  }
  _unit(e) {
    const d = e.d; e.cd -= DT; e.moving = false;
    if (e.sw > 0) { e.sw -= DT; if (e.sw <= 0) this._strike(e); return; }
    if (e.rec > 0) { e.rec -= DT; return; }
    if (e.tgt && e.tgt.dead && e.think > 0.12) e.think = this.rnd() * 0.12;      // lost the target: look again right away
    if ((e.think -= DT) <= 0) { e.think = (0.35 + this.rnd() * 0.3) * this.load; this._think(e); }
    const o = e.order;
    if (o && o.k === 'move') {
      if (Math.hypot(o.x - e.x, o.y - e.y) < 0.35 || e.arrived) { e.order = null; e.arrived = false; e.path = null; e.hx = e.x; e.hy = e.y; }
      else this._move(e, o.x, o.y);
      return;
    }
    const t = e.tgt;
    if (t && !t.dead) {
      if (this.gap(e, t) <= d.rng && !(d.minR && this.cdist(e, t) < d.minR)) {
        const dx = t.x - e.x, dy = t.y - e.y, l = Math.hypot(dx, dy) || 1; e.fx = dx / l; e.fy = dy / l;
        if (e.cd <= 0) { e.sw = d.wind; e.atkT = this.time; }
      } else if (e.stance !== 2) this._move(e, t.x, t.y);
      return;
    }
    if (d.heal) { const f = e.follow; if (f && !f.dead && this.cdist(e, f) > 2.4) this._move(e, f.x, f.y); return; }
    if (e.stance === 1 && Math.hypot(e.hx - e.x, e.hy - e.y) > 0.5) this._move(e, e.hx, e.hy);
  }
  _bld(e) {
    const d = e.d; if (!d.atk) return; e.cd -= DT;
    if ((e.think -= DT) <= 0) {
      e.think = 0.4 + this.rnd() * 0.2; const self = this, list = [];
      this.near(e.x, e.y, d.rng + e.r + 1, c => { if (c.team === e.team || c.dead || c.bld) return; const g = self.gap(c, e); if (g <= d.rng) list.push(c, g); });
      if (!list.length) this.near(e.x, e.y, d.rng + e.r + 1, c => { if (c.team !== e.team && !c.dead && c.bld && !c.d.wall && self.cdist(c, e) - c.r - e.r <= d.rng) list.push(c, 99); });
      e.tl = list.length ? list : null;
    }
    if (e.tl && e.cd <= 0) {
      const L = e.tl, n = L.length / 2; let fired = 0;
      for (let k = 0; k < d.volley; k++) { const c = L[((this.rnd() * n) | 0) * 2]; if (c && !c.dead) { this._fire(e, c); fired++; } }
      if (fired) { e.cd = d.rof * (0.9 + this.rnd() * 0.2); e.atkT = this.time; } else e.tl = null;
    }
  }

  // ------------------------------------------------------------ combat
  _strike(e) {
    const d = e.d, t = e.tgt; e.cd = d.rof * (0.9 + this.rnd() * 0.2); e.rec = 0.22;
    if (!t || t.dead) return;
    if (d.heal) { if (t.hp < t.d.hp) { t.hp = Math.min(t.d.hp, t.hp + d.heal); this.ev('heal', t.x, t.y); } return; }
    if (d.proj) { this._fire(e, t); return; }
    if (this.gap(e, t) > d.rng + 0.5) return;
    let dmg = d.atk; const charged = d.charge && e.runT > 1.1; if (charged) dmg *= d.charge;
    e.runT = 0;
    this.ev('hit', t.x, t.y, t.bld ? 'bld' : charged ? 'charge' : e.t === 'ram' ? 'bld' : 'melee', e.fx);
    this._damage(e, t, dmg);
    if (d.splash) { const self = this; this.near(t.x, t.y, d.splash + 1, c => { if (c !== t && c.team !== e.team && !c.dead && !c.bld && self.cdist(c, t) <= d.splash) self._damage(e, c, dmg * 0.5); }); }
  }
  _fire(e, t) {
    const d = e.d, P = AB.PROJ[d.proj], R = this.rnd, dist = this.cdist(e, t); let dur = Math.max(0.12, dist / P.spd);
    let tx = t.x + t.vx * dur * 0.85, ty = t.y + t.vy * dur * 0.85;
    const sc = (1 - (d.acc || 0.8)) * (0.25 + dist * 0.11) + (t.bld ? 0 : 0.05);
    tx += (R() + R() - 1) * sc * 1.6; ty += (R() + R() - 1) * sc * 1.6;
    if (d.pierce) { const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy) || 1; tx = e.x + dx / l * (l + 2.5); ty = e.y + dy / l * (l + 2.5); dur *= (l + 2.5) / l; }
    t.pend += d.atk; this.projs.push({ k: d.proj, sx: e.x, sy: e.y, tx, ty, x: e.x, y: e.y, z: 0, t: 0, dur, src: e, team: e.team, tgt: t, dmg: d.atk,
      z0: e.bld ? (d.size > 1 ? 2.6 : 2) : 0.55, h: dist * P.arc });
    this.ev('shoot', e.x, e.y, d.proj, e.bld ? 2 : 0);
  }
  _land(p) {
    const src = p.src, self = this, sd = src.d; p.tgt.pend -= p.dmg;
    if (sd.splash) {
      this.near(p.tx, p.ty, sd.splash + 2, c => {
        if (c.team === p.team || c.dead) return;
        const dd = c.bld ? Math.hypot(Math.max(c.x0 - p.tx, 0, p.tx - c.x1), Math.max(c.y0 - p.ty, 0, p.ty - c.y1)) : Math.max(0, Math.hypot(c.x - p.tx, c.y - p.ty) - c.r * 0.5);
        if (dd <= sd.splash) self._damage(src, c, p.dmg * (1 - 0.55 * dd / sd.splash));
      });
      this.ev('boom', p.tx, p.ty, p.k); return;
    }
    if (sd.pierce) {
      const ax = p.sx, ay = p.sy, bx = p.tx - ax, by = p.ty - ay, l2 = bx * bx + by * by || 1; let n = 0;
      this.near((ax + p.tx) / 2, (ay + p.ty) / 2, Math.sqrt(l2) / 2 + 1, c => {
        if (c.team === p.team || c.dead || n >= 4) return;
        const u = Math.max(0, Math.min(1, ((c.x - ax) * bx + (c.y - ay) * by) / l2)), dd = Math.hypot(c.x - ax - bx * u, c.y - ay - by * u);
        if (dd <= c.r + 0.25) { n++; self._damage(src, c, p.dmg); }
      });
      this.ev(n ? 'thud' : 'miss', p.tx, p.ty, p.k); return;
    }
    let t = p.tgt, hit = null;
    if (t && !t.dead) {
      if (t.bld) { if (Math.hypot(Math.max(t.x0 - p.tx, 0, p.tx - t.x1), Math.max(t.y0 - p.ty, 0, p.ty - t.y1)) < 0.5) hit = t; }
      else if (Math.hypot(t.x - p.tx, t.y - p.ty) < t.r + 0.32) hit = t;
    }
    if (!hit) { let bd = 0.42; this.near(p.tx, p.ty, 1, c => { if (c.team === p.team || c.dead || c.bld) return; const dd = Math.hypot(c.x - p.tx, c.y - p.ty) - c.r * 0.5; if (dd < bd) { bd = dd; hit = c; } }); }
    if (hit) { this._damage(src, hit, p.dmg); this.ev('thud', hit.x, hit.y, p.k, hit.bld ? 1 : 0); } else this.ev('miss', p.tx, p.ty, p.k);
  }
  _damage(src, t, base) {
    const sd = src.d, td = t.d, arm = sd.at === 'm' ? td.am : sd.at === 'p' ? td.ap : 0;
    let m = 1; if (sd.bonus) { const cl = td.cls; for (let i = 0; i < cl.length; i++) { const b = sd.bonus[cl[i]]; if (b > m) m = b; } }
    let dmg = Math.max(1, base * m - arm); if (src.buff > this.time) dmg *= 1.2;
    if (dmg > t.hp) dmg = t.hp;
    t.hp -= dmg; t.flash = this.time; this.stats[src.p].dmg += dmg; this.lastAct = this.time; this.bestD = Infinity;
    if (t.hp <= 0.001) { this._kill(t, src); return; }
    if (!t.bld && !t.order && t.stance !== 2 && !td.heal && !src.dead && (!t.tgt || t.tgt.dead || t.tgt.bld) && !(td.minR && this.cdist(src, t) < td.minR)) { t.tgt = src; t.breach = false; }
  }
  _kill(t, src) {
    t.dead = true; t.hp = 0; this.anyDead = true;
    const ss = this.stats[src.p], ts = this.stats[t.p];
    if (t.bld) { ts.bLost++; ss.razed++; for (let j = t.y0; j < t.y1; j++) for (let i = t.x0; i < t.x1; i++) this.bmap[i + j * this.w] = null; this.ev('collapse', t.x, t.y, t.d.size); }
    else { ts.lost++; ss.kills++; src.kills++; if (!ss.best || src.kills > ss.best.kills) ss.best = src; this.ev('die', t.x, t.y, t.d.cat, t.t); }
    this.corpses.push({ x: t.x, y: t.y, t: t.t, p: t.p, fx: t.fx, fy: t.fy, time: this.time, bld: t.bld, size: t.d.size || 1 });
    if (this.corpses.length > 900) this.corpses.splice(0, 100);
  }

  // ------------------------------------------------------------ orders
  order(list, o) {
    for (const e of list) {
      if (e.dead || e.bld) continue;
      e.path = null; e.think = 0; e.breach = false; e.arrived = false;
      if (o.k === 'stop') { e.order = null; e.tgt = null; }
      else if (o.k === 'move') { e.order = { k: 'move', x: o.x + (e.ox || 0), y: o.y + (e.oy || 0) }; e.tgt = null; }
      else e.order = { k: 'atk', t: o.t };
    }
  }
  setStance(list, s) { for (const e of list) { e.stance = s; e.hx = e.x; e.hy = e.y; e.think = 0; } }

  // ------------------------------------------------------------ tick
  step() {
    if (this.over) return;
    const E = this.ents, g = this.grid, gw = this.gw; this.time += DT; this.budget = 24; this.anyDead = false; this.load = 1 + E.length / 1200;
    for (let i = 0; i < g.length; i++) g[i].length = 0;
    for (let i = 0; i < E.length; i++) {
      const e = E[i]; e.px = e.x; e.py = e.y; e.nAtk = 0;
      if (e.bld && e.d.size > 1) { for (let y = e.y0; y < e.y1; y += CELL) for (let x = e.x0; x < e.x1; x += CELL) { const c = g[((x / CELL) | 0) + ((y / CELL) | 0) * gw]; if (c.indexOf(e) < 0) c.push(e); } }
      else g[((e.x / CELL) | 0) + ((e.y / CELL) | 0) * gw].push(e);
    }
    for (let i = 0; i < E.length; i++) { const e = E[i], t = e.tgt; if (t && !e.d.proj && !e.bld && t.team !== e.team) t.nAtk++; }
    for (let i = 0; i < E.length; i++) { const e = E[i]; if (e.dead) continue; if (e.bld) this._bld(e); else this._unit(e); }
    this._separate();
    const P = this.projs;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += DT; const u = Math.min(1, p.t / p.dur);
      p.x = p.sx + (p.tx - p.sx) * u; p.y = p.sy + (p.ty - p.sy) * u; p.z = p.z0 * (1 - u) + p.h * 4 * u * (1 - u);
      if (u >= 1) { P[i] = P[P.length - 1]; P.pop(); this._land(p); }
    }
    for (let i = 0; i < E.length; i++) { const e = E[i]; e.vx = (e.x - e.px) / DT; e.vy = (e.y - e.py) / DT; }
    if (this.anyDead) this.ents = E.filter(e => !e.dead);
    if (this.time >= this.sampleT) { this.sampleT += 1; this._sample(); }
    if (this.time >= this.checkT) { this.checkT += 0.5; this._check(); }
  }
  _pair(e, o) {
    let dx = o.x - e.x, dy = o.y - e.y; const min = (e.r + o.r) * 0.92, d2 = dx * dx + dy * dy;
    if (d2 >= min * min) return;
    let d = Math.sqrt(d2); if (d < 1e-4) { dx = this.rnd() - 0.5; dy = this.rnd() - 0.5; d = Math.hypot(dx, dy) || 1; }
    const push = (min - d) * 0.6, me = e.r * e.r * (e.moving ? 1 : 2.5), mo = o.r * o.r * (o.moving ? 1 : 2.5), we = mo / (me + mo), wo = 1 - we;
    const ex = e.x - dx / d * push * we, ey = e.y - dy / d * push * we, ox = o.x + dx / d * push * wo, oy = o.y + dy / d * push * wo;
    if (this.canStand(ex, ey, e.team)) { e.x = ex; e.y = ey; }
    if (this.canStand(ox, oy, o.team)) { o.x = ox; o.y = oy; }
  }
  // each pair is visited once: within a cell, and against the four "forward" neighbour cells
  _separate() {
    const g = this.grid, gw = this.gw, gh = this.gh;
    for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
      const c = g[cx + cy * gw], n = c.length; if (!n) continue;
      const E = cx + 1 < gw ? g[cx + 1 + cy * gw] : null, Sx = cy + 1 < gh ? g[cx + (cy + 1) * gw] : null,
        SW = cy + 1 < gh && cx > 0 ? g[cx - 1 + (cy + 1) * gw] : null, SE = cy + 1 < gh && cx + 1 < gw ? g[cx + 1 + (cy + 1) * gw] : null;
      for (let a = 0; a < n; a++) {
        const e = c[a]; if (e.bld || e.dead) continue;
        for (let b = a + 1; b < n; b++) { const o = c[b]; if (!o.bld && !o.dead) this._pair(e, o); }
        if (E) for (let b = 0; b < E.length; b++) { const o = E[b]; if (!o.bld && !o.dead) this._pair(e, o); }
        if (Sx) for (let b = 0; b < Sx.length; b++) { const o = Sx[b]; if (!o.bld && !o.dead) this._pair(e, o); }
        if (SW) for (let b = 0; b < SW.length; b++) { const o = SW[b]; if (!o.bld && !o.dead) this._pair(e, o); }
        if (SE) for (let b = 0; b < SE.length; b++) { const o = SE[b]; if (!o.bld && !o.dead) this._pair(e, o); }
      }
    }
  }
  _sample() {
    const v = new Float32Array(8), n = new Uint16Array(8); 
    for (const e of this.ents) { v[e.p] += e.d.cost; if (!e.bld) n[e.p]++; }
    // progress = somebody is getting closer to the enemy than anyone has been since the last blow
    let md = Infinity; for (const e of this.ents) { const t = e.tgt; if (t && !t.dead && t.team !== e.team) { const dd = this.gap(e, t) - e.d.rng; if (dd < md) md = dd; } }
    if (md < this.bestD - 0.5) { this.bestD = md; this.lastAct = this.time; }
    this.history.push({ t: this.time, v, n });
  }
  alive() { const a = new Uint16Array(8); for (const e of this.ents) if (e.d.atk > 0 && !e.dead) a[e.team]++; return a; }
  _check() {
    const a = this.alive(); let teams = 0, last = -1;
    for (let i = 0; i < 8; i++) if (a[i]) { teams++; last = i; }
    if (teams <= 1) { if (this.endT < 0) this.endT = this.time + 1.5; else if (this.time >= this.endT) { this.over = true; this.winner = teams ? last : -1; this._sample(); } }
    else if (this.time - this.lastAct > 40) { this.over = true; this.winner = -1; this.stalemate = true; this._sample(); }
  }
}
AB.Sim = Sim; AB.DT = DT;
})(typeof globalThis !== 'undefined' ? globalThis : this);
