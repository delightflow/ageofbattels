/* Age of Battels — procedural sprites. Everything is drawn with canvas paths and cached per (type, player, view, frame). */
(function (G) {
'use strict';
const AB = G.AB = G.AB || {};
const SS = 2, TAU = Math.PI * 2, OL = '#2b2018';
const STEEL = '#bcc3cc', STEEL_D = '#868e99', WOOD = '#8a6238', WOOD_D = '#5e4126', SKIN = '#e2b48c';

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
}
function limb(c, x1, y1, x2, y2, w, col) {
  c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = OL; c.lineWidth = w + 0.95; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function ink(c, col, lw) { c.fillStyle = col; c.fill(); c.strokeStyle = OL; c.lineWidth = (lw || 0.9) * 0.75; c.lineJoin = 'round'; c.stroke(); }
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); }
function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shadow(c, rx, ry, x) { c.fillStyle = 'rgba(0,0,0,0.26)'; ell(c, x || 0, 0, rx, ry); c.fill(); }
const lerp = (a, b, t) => a + (b - a) * t, clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t, seg = (t, a, b) => clamp01((t - a) / (b - a));

const ARMOR = {
  cloth:   { body: 'pc', arm: 'pcd', leg: '#6b5a45' },
  leather: { body: '#8b5e34', arm: 'pc', leg: '#5b4a3a', tab: 1 },
  mail:    { body: '#8f96a0', arm: '#8f96a0', leg: '#5d6570', tab: 1 },
  plate:   { body: '#c3c9d1', arm: '#c3c9d1', leg: '#9aa1ab', tab: 1 },
  robe:    { body: 'pc', arm: 'pc', leg: 'pc', robe: 1 },
  bare:    { body: SKIN, arm: SKIN, leg: '#5b4a3a', strap: 1 },
};

// hand position + weapon angle (0 = pointing up, + = rotating forward) for a weapon at attack phase t (-1 = none)
function wpose(w, t, s) {
  const P = { hx: 5.3 - s * 1.3, hy: -11.5, ang: 0.3, ox: null, oy: null, hide: false };
  const a = t >= 0;
  switch (w) {
    case 'spear': case 'fork': case 'pike': case 'lance': case 'javelin': {
      P.ang = w === 'pike' ? 0.42 : w === 'lance' ? 0.3 : 0.14;
      if (a) {
        const back = seg(t, 0, 0.4), go = seg(t, 0.4, 0.62), ret = seg(t, 0.75, 1);
        if (w === 'javelin') { P.ang = lerp(0.14, 1.25, back); P.hx = lerp(5.3, 1, back) + go * 8 - ret * 4; P.hy = lerp(-11.5, -20, back) + ret * 8.5; P.hide = t > 0.58; }
        else { P.ang = lerp(P.ang, 1.48, back) - ret * 0.9; P.hx = lerp(5.3, 2, back) + go * 6.5 - ret * 3; P.hy = lerp(-11.5, -14.5, back) + ret * 2; }
      }
      break; }
    case 'bow': {
      P.ang = 0;
      if (a) { const up = seg(t, 0, 0.2), pull = seg(t, 0.15, 0.55), rel = t > 0.6 ? 1 : 0; P.hx = lerp(5.3, 8, up); P.hy = lerp(-11.5, -16, up); P.ox = rel ? 3 : lerp(7, 1.5, pull); P.oy = -16; P.pull = rel ? 0 : pull; P.nock = !rel && t > 0.08; }
      break; }
    case 'crossbow': P.hx = 6.5; P.hy = -14.5; P.ang = 1.57; P.ox = 3.5; P.oy = -13.5; if (a) { const k = seg(t, 0.55, 0.7) - seg(t, 0.7, 1); P.hx -= k * 1.5; P.loaded = t < 0.6; } else P.loaded = true; break;
    case 'musket': P.hx = 3.5; P.hy = -15; P.ang = a ? 1.57 : 0.9; P.ox = a ? 8 : 6; P.oy = a ? -15.2 : -13; if (a) { const k = seg(t, 0.55, 0.68) - seg(t, 0.68, 1); P.hx -= k * 1.6; P.ang -= k * 0.15; P.fire = t > 0.56 && t < 0.78; } break;
    case 'staff': P.ang = 0.1; if (a) { const k = Math.sin(clamp01(t) * Math.PI); P.hy -= k * 5; P.hx += k; P.glow = k; } break;
    default: {          // slashing weapons
      if (a) { const up = seg(t, 0, 0.42), dn = seg(t, 0.42, 0.68), ret = seg(t, 0.78, 1);
        P.ang = lerp(0.3, -1.5, up) + dn * 3.4 - ret * 1.6; P.hx = lerp(5.3, 4, up) + dn * 4 - ret * 2.7; P.hy = lerp(-11.5, -19.5, up) + dn * 7 + ret * 1; }
    }
  }
  return P;
}
function weapon(c, w, P, y0, pc) {
  if (P.hide) return;
  c.save(); c.translate(P.hx, P.hy + y0);
  if (w === 'bow') {
    const pull = P.pull || 0, sx = (P.ox != null ? P.ox - P.hx : -1.2);
    c.strokeStyle = '#d8d0c0'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-1.2, -7.5); c.lineTo(pull ? sx : -1.2, 0); c.lineTo(-1.2, 7.5); c.stroke();
    c.beginPath(); c.moveTo(-1.2, -7.5); c.quadraticCurveTo(4.2, 0, -1.2, 7.5); c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = '#9a6a3a'; c.lineWidth = 1.3; c.stroke();
    if (P.nock) { c.strokeStyle = '#e8dcc0'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + 9.5, 0); c.stroke(); c.fillStyle = STEEL; poly(c, [sx + 9.5, -1, sx + 12, 0, sx + 9.5, 1]); c.fill(); }
    c.restore(); return;
  }
  c.rotate(P.ang);
  const shaft = (a, b, lw, col) => { c.lineCap = 'butt'; c.beginPath(); c.moveTo(0, a); c.lineTo(0, b); c.strokeStyle = OL; c.lineWidth = lw + 1; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); };
  switch (w) {
    case 'sword': shaft(1.5, -1, 1.2, WOOD_D); poly(c, [-1, -1.5, 1, -1.5, 0.9, -10.5, 0, -12.5, -0.9, -10.5]); ink(c, '#dfe5ec', 0.7); c.fillStyle = '#c9a23c'; c.fillRect(-2.3, -2, 4.6, 1.3); break;
    case 'greatsword': shaft(2.5, -1, 1.3, WOOD_D); poly(c, [-1.3, -1.8, 1.3, -1.8, 1.1, -15, 0, -17.5, -1.1, -15]); ink(c, '#dfe5ec', 0.7); c.fillStyle = '#c9a23c'; c.fillRect(-3, -2.4, 6, 1.4); break;
    case 'axes': case 'axe': shaft(2, -9, 1.2, WOOD); poly(c, [0.3, -9.6, 4.6, -11, 5.2, -6.4, 0.3, -6.2]); ink(c, STEEL, 0.7); break;
    case 'club': poly(c, [-0.8, 2, 0.8, 2, 1.9, -9.5, -1.9, -9.5]); ink(c, WOOD, 0.8); break;
    case 'spear': shaft(8, -15, 1.1, WOOD); poly(c, [-1.4, -15, 0, -19.5, 1.4, -15]); ink(c, STEEL, 0.6); break;
    case 'javelin': shaft(6, -11, 0.9, WOOD); poly(c, [-1.1, -11, 0, -14.5, 1.1, -11]); ink(c, STEEL, 0.6); break;
    case 'pike': shaft(9, -25, 1.1, WOOD); poly(c, [-1.3, -25, 0, -29.5, 1.3, -25]); ink(c, STEEL, 0.6); break;
    case 'lance': shaft(7, -20, 1.5, '#d9d2c2'); poly(c, [-1.3, -20, 0, -24.5, 1.3, -20]); ink(c, STEEL, 0.6); poly(c, [0.6, -19, 6.5, -17.3, 0.6, -15.4]); ink(c, pc.m, 0.6); break;
    case 'fork': shaft(8, -13, 1.1, WOOD); c.strokeStyle = OL; c.lineWidth = 1.7; c.beginPath(); c.moveTo(-2.2, -17.5); c.lineTo(-2.2, -13.5); c.lineTo(2.2, -13.5); c.lineTo(2.2, -17.5); c.moveTo(0, -13.5); c.lineTo(0, -17.8); c.stroke(); c.strokeStyle = STEEL_D; c.lineWidth = 0.8; c.stroke(); break;
    case 'crossbow': shaft(3, -8, 1.8, WOOD); c.beginPath(); c.moveTo(-5.5, -4.6); c.quadraticCurveTo(0, -9.5, 5.5, -4.6); c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(); c.strokeStyle = STEEL_D; c.lineWidth = 1.1; c.stroke();
      c.strokeStyle = '#d8d0c0'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-5.5, -4.6); c.lineTo(0, P.loaded ? -1.5 : -5); c.lineTo(5.5, -4.6); c.stroke(); break;
    case 'musket': shaft(4, -3, 2, WOOD); shaft(-3, -13, 1.2, '#4c4f55');
      if (P.fire) { c.fillStyle = '#ffd84a'; ell(c, 0, -15.5, 1.8, 3.2); c.fill(); c.fillStyle = '#fff6c8'; ell(c, 0, -14.6, 0.9, 1.6); c.fill(); } break;
    case 'staff': shaft(9, -13, 1.1, WOOD); if (P.glow) { c.fillStyle = 'rgba(255,240,160,' + (0.5 * P.glow) + ')'; ell(c, 0, -15, 5, 5); c.fill(); }
      c.fillStyle = '#e8c14a'; c.strokeStyle = OL; c.lineWidth = 0.6; ell(c, 0, -15, 1.9, 1.9); c.fill(); c.stroke(); break;
  }
  c.restore();
}
function shield(c, x, y, kind, pc) {
  if (kind === 'kite') { c.beginPath(); c.moveTo(x - 3.6, y - 5); c.quadraticCurveTo(x, y - 6.2, x + 3.6, y - 5); c.quadraticCurveTo(x + 3.8, y + 2, x, y + 6.5); c.quadraticCurveTo(x - 3.8, y + 2, x - 3.6, y - 5); c.closePath(); ink(c, pc.m);
    c.strokeStyle = pc.l; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 4.6); c.lineTo(x, y + 4.4); c.moveTo(x - 2.6, y - 1.6); c.lineTo(x + 2.6, y - 1.6); c.stroke(); }
  else { ell(c, x, y, 4.3, 4.6); ink(c, pc.m); c.strokeStyle = pc.d; c.lineWidth = 0.9; ell(c, x, y, 3, 3.2); c.stroke(); c.fillStyle = STEEL; ell(c, x, y, 1.2, 1.2); c.fill(); }
}
function head(c, L, pc, y0, back) {
  const x = 0.5, y = -22.9 + y0, r = 3.3, h = L.helm;
  c.save(); c.translate(x, y); c.scale(0.8, 0.8); c.translate(-x, -y);
  if (h === 'hood') { ell(c, x - 0.3, y - 0.2, r + 1.3, r + 1.4); ink(c, pc.d); }
  if (!(h === 'great')) { ell(c, x, y, r, r); ink(c, back && h !== 'hood' ? '#5a3d28' : SKIN, 0.8); }
  if (!back && h !== 'great') { c.fillStyle = OL; c.fillRect(x + 1.4, y - 0.7, 0.9, 1.1); if (h === 'none' || h === 'horn' || h === 'fur') { c.fillStyle = '#6b4a30'; c.beginPath(); c.arc(x + 0.6, y + 1.3, 2.5, 0.1, 1.9); c.fill(); } }
  const dome = (col, low) => { c.beginPath(); c.arc(x, y - 0.2, r + 0.5, Math.PI - low, TAU + low); c.closePath(); ink(c, col, 0.8); };
  switch (h) {
    case 'none': dome('#5a3d28', back ? 0.9 : 0.05); break;
    case 'cap': dome(pc.d, back ? 0.7 : 0.1); break;
    case 'kettle': dome(STEEL, 0); ell(c, x, y - 0.6, r + 2.2, 1.3); ink(c, STEEL_D, 0.7); break;
    case 'nasal': dome(STEEL, back ? 0.5 : 0.1); if (!back) { c.strokeStyle = STEEL_D; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x + 2.4, y - 0.6); c.lineTo(x + 2.6, y + 2); c.stroke(); } break;
    case 'horn': dome(STEEL_D, 0.1); c.strokeStyle = OL; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 2.8, y - 2.4); c.quadraticCurveTo(x - 5.6, y - 3.6, x - 4.8, y - 6.6); c.moveTo(x + 2.8, y - 2.4); c.quadraticCurveTo(x + 5.6, y - 3.6, x + 4.8, y - 6.6); c.stroke(); c.strokeStyle = '#efe6cf'; c.lineWidth = 1; c.stroke(); break;
    case 'great': rrect(c, x - 3.5, y - 3.9, 7, 7.6, 2); ink(c, STEEL); if (!back) { c.fillStyle = OL; c.fillRect(x - 0.6, y - 1, 3.8, 0.9); c.fillRect(x + 1, y - 1, 0.8, 3.4); }
      c.beginPath(); c.moveTo(x - 0.5, y - 3.8); c.quadraticCurveTo(x - 4.5, y - 8.5, x - 5.5, y - 3.4); c.quadraticCurveTo(x - 2.6, y - 5.4, x - 0.5, y - 3.8); ink(c, pc.m, 0.7); break;
    case 'hood': if (back) { ell(c, x, y, r + 0.9, r + 1); ink(c, pc.d); } break;
    case 'turban': ell(c, x, y - 1.9, r + 1.1, 2.7); ink(c, '#f0e8d6', 0.8); c.fillStyle = pc.m; ell(c, x + (back ? 0 : 1.6), y - 2.2, 1, 1); c.fill(); break;
    case 'fur': rrect(c, x - 3.9, y - 4.6, 7.8, 4.2, 1.8); ink(c, '#6e4a2b', 0.8); c.fillStyle = pc.m; ell(c, x, y - 4.6, 1.3, 1); c.fill(); break;
    case 'hat': ell(c, x, y - 1.5, r + 3, 1.4); ink(c, '#2f2a2a', 0.7); rrect(c, x - 2.7, y - 5.2, 5.4, 3.8, 1.2); ink(c, '#2f2a2a', 0.7); c.strokeStyle = pc.m; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 2.4, y - 2.3); c.lineTo(x + 2.4, y - 2.3); c.stroke();
      c.beginPath(); c.moveTo(x - 2, y - 4.6); c.quadraticCurveTo(x - 6, y - 8, x - 6.5, y - 4); c.strokeStyle = pc.l; c.lineWidth = 1.3; c.stroke(); break;
  }
  c.restore();
}
/* A figure facing right. ps: {walk 0..1|-1, atk 0..1|-1, back}. mounted: legs become a single stirrup leg. */
function human(c, L, pc, ps, mounted) {
  const wk = ps.walk, back = ps.back, s = wk >= 0 ? Math.sin(wk * TAU) : 0, y0 = wk >= 0 && !mounted ? -Math.abs(Math.cos(wk * TAU)) * 0.9 + 0.45 : 0;
  const A = ARMOR[L.armor], col = v => v === 'pc' ? pc.c : v === 'pcd' ? pc.d : v;
  const body = col(A.body), arm = col(A.arm), leg = col(A.leg), W = wpose(L.wpn, ps.atk, mounted ? 0 : s);
  const dual = L.wpn === 'axes', two = L.wpn === 'greatsword' || L.wpn === 'pike' || L.wpn === 'musket' || L.wpn === 'crossbow';
  const wArm = () => { weapon(c, L.wpn === 'axes' ? 'axe' : L.wpn, W, y0, pc); limb(c, 3.5, -17 + y0, W.hx, W.hy + y0, 2.3, arm); c.fillStyle = SKIN; ell(c, W.hx, W.hy + y0, 1.25, 1.25); c.fill(); };
  const oArm = () => {
    let ox = -4.6 + s * 1.4, oy = -11.6;
    if (W.ox != null) { ox = W.ox; oy = W.oy; } else if (two) { ox = W.hx - 1.6; oy = W.hy + 2.2; } else if (L.shield) { ox = back ? 3 : -3.4; oy = -13; }
    if (dual) { const t2 = ps.atk >= 0 ? (ps.atk + 0.5) % 1 : -1, W2 = wpose('axe', t2, -s); W2.hx = -W2.hx * 0.75 - 1; ox = W2.hx; oy = W2.hy; c.save(); c.translate(ox, oy + y0); c.rotate(-W2.ang * 0.8 - 0.3); c.translate(-ox, -oy - y0); W2.ang = 0; weapon(c, 'axe', W2, y0, pc); c.restore(); }
    limb(c, -3.3, -17 + y0, ox, oy + y0, 2.3, arm); c.fillStyle = SKIN; ell(c, ox, oy + y0, 1.2, 1.2); c.fill();
  };
  const cape = () => { c.beginPath(); c.moveTo(-3.6, -19 + y0); c.quadraticCurveTo(-9 - s, -12 + y0, -6.5 - s * 1.5, -3.5 + y0); c.lineTo(back ? 5 : -1, -4 + y0); c.lineTo(back ? 3.6 : -1, -19 + y0); c.closePath(); ink(c, pc.d); };
  if (!mounted) shadow(c, 6.2, 2.6);
  if (L.cape && !back) cape();
  if (back) { wArm(); if (L.shield) shield(c, 3.2, -13.3 + y0, L.shield, pc); } else oArm();
  if (mounted) limb(c, 0.6, -9.5, 2.8, -3.6, 2.8, leg);
  else if (!A.robe) {
    const l = (sg) => { const fx = sg * s * 3.2, lift = Math.max(0, sg * Math.cos(wk * TAU)) * (wk >= 0 ? 1.6 : 0); limb(c, sg * 1.5, -9.5 + y0, sg * 1.7 + fx, -1.2 - lift, 2.9, leg); c.fillStyle = '#3a2c22'; ell(c, sg * 1.7 + fx + 0.7, -0.8 - lift, 2, 1.2); c.fill(); };
    l(-1); l(1);
  }
  // torso
  if (A.robe) { poly(c, [-4.2, -19.4 + y0, 4.2, -19.4 + y0, 5.2 + s, -1, -5.2 + s, -1]); ink(c, body); c.strokeStyle = '#e8d9a8'; c.lineWidth = 1; c.beginPath(); c.moveTo(-4.4, -9.5 + y0); c.lineTo(4.4, -9.5 + y0); c.stroke(); }
  else { rrect(c, -4.3, -19.6 + y0, 8.6, 11.2, 2.6); ink(c, body);
    if (A.tab) { c.fillStyle = pc.m; c.fillRect(-2.1, -19 + y0, 4.2, 10); c.fillStyle = pc.d; c.fillRect(-2.1, -12.2 + y0, 4.2, 1.1); }
    else if (A.strap) { c.strokeStyle = pc.m; c.lineWidth = 2; c.beginPath(); c.moveTo(-3.6, -18.6 + y0); c.lineTo(3.6, -10 + y0); c.stroke(); c.fillStyle = '#6e4a2b'; c.fillRect(-4.3, -11 + y0, 8.6, 2.4); }
    else { c.fillStyle = pc.d; c.fillRect(-4.3, -11.6 + y0, 8.6, 1.5); c.fillStyle = pc.l; c.fillRect(-0.5, -19 + y0, 1, 7); } }
  if (back) { oArm(); if (L.cape) cape(); }
  head(c, L, pc, y0, back);
  if (L.banner) { c.strokeStyle = OL; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-4.5, -9 + y0); c.lineTo(-4.5, -38 + y0); c.stroke(); c.strokeStyle = WOOD; c.lineWidth = 0.9; c.stroke(); poly(c, [-4.5, -38 + y0, -14.5, -36 + y0 + s, -11.5, -33.5 + y0, -14.5, -30.5 + y0 - s, -4.5, -29.5 + y0]); ink(c, pc.m); c.fillStyle = pc.l; ell(c, -8.6, -33.6 + y0, 1.5, 1.5); c.fill(); }
  if (!back) { wArm(); if (L.shield) shield(c, -2.9, -13 + y0, L.shield, pc); }
}

// ---------------------------------------------------------------- mounts & beasts
function qleg(c, x, y, len, a, w, col, hoof) {
  const kx = x + Math.sin(a) * len * 0.52, ky = y + Math.cos(a) * len * 0.52, bend = a > 0 ? a * 0.5 : a * 1.1;
  const fx = kx + Math.sin(bend) * len * 0.5, fy = ky + Math.cos(bend) * len * 0.5;
  c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(kx, ky); c.lineTo(fx, fy);
  c.strokeStyle = OL; c.lineWidth = w + 1.3; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
  if (hoof) { c.fillStyle = hoof; ell(c, fx, fy, w * 0.6, w * 0.5); c.fill(); }
}
function horse(c, L, pc, ps, kind) {
  const camel = kind === 'camel', col = L.mc || '#8a5a3a', dk = shade(col, -0.3), wk = ps.walk, ph = wk >= 0 ? wk * TAU : 0, amp = wk >= 0 ? 0.75 : 0;
  const by = camel ? -17 : -14.5, LL = camel ? 13 : 11, bob = wk >= 0 ? Math.sin(ph * 2) * 0.7 : 0, rear = ps.atk >= 0 ? Math.sin(clamp01(ps.atk) * Math.PI) * 0.14 : 0;
  shadow(c, 13, 4);
  c.save(); c.translate(0, bob); c.rotate((ps.back ? -0.1 : 0.07) - rear);
  qleg(c, -7, by + 2, LL, Math.sin(ph + Math.PI + 1.1) * amp, 2.2, dk); qleg(c, 6.5, by + 2, LL, Math.sin(ph + 1.1) * amp, 2.2, dk);
  c.beginPath(); c.moveTo(-9.5, by - 2); c.quadraticCurveTo(-15 - amp * 2, by + 1, -13.5, by + 9); c.strokeStyle = OL; c.lineWidth = 3.2; c.lineCap = 'round'; c.stroke(); c.strokeStyle = camel ? dk : '#2e221a'; c.lineWidth = 1.9; c.stroke();
  ell(c, 0, by, 10, 5); ink(c, col);
  if (camel) { ell(c, -1, by - 4.6, 5, 4); ink(c, col); c.fillStyle = col; c.fillRect(-5.5, by - 4, 9, 4); }
  // neck + head
  const nx = camel ? 12.5 : 11, ny = camel ? by - 14 : by - 9.5;
  poly(c, [6, by - 3.5, 9.5, by + 2.5, nx + 2, ny + 2.5, nx - 2.5, ny - 0.5]); ink(c, col);
  c.save(); c.translate(nx, ny); c.rotate(0.55); rrect(c, -2.6, -2.6, 8.6, 4.8, 2.1); ink(c, col); c.fillStyle = OL; c.fillRect(1, -1.4, 1, 1); c.restore();
  poly(c, [nx - 2, ny - 2, nx - 1.2, ny - 5.2, nx + 0.6, ny - 2.2]); ink(c, col, 0.7);
  if (!camel) { c.beginPath(); c.moveTo(nx - 2.4, ny - 1.5); c.quadraticCurveTo(6, by - 8, 5, by - 3.6); c.strokeStyle = '#2e221a'; c.lineWidth = 2.2; c.stroke(); }
  if (L.bard) { c.beginPath(); c.moveTo(-10, by - 3.6); c.lineTo(8.5, by - 3.8); c.lineTo(10, by + 5.5); c.lineTo(3, by + 4); c.lineTo(-3, by + 6); c.lineTo(-10.5, by + 4.6); c.closePath(); ink(c, pc.m);
    c.strokeStyle = pc.l; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, by + 3.4); c.lineTo(-3, by + 4.8); c.lineTo(3, by + 2.8); c.lineTo(9.6, by + 4.2); c.stroke(); }
  else { rrect(c, -5, by - 5.4, 8.5, 5.5, 1.5); ink(c, pc.m, 0.8); }
  c.save(); c.translate(-0.8, by - 4.6 + 9.5 - (camel ? 4.5 : 0)); human(c, L, pc, { walk: -1, atk: ps.atk, back: ps.back }, true); c.restore();
  qleg(c, -6, by + 2.5, LL, Math.sin(ph + Math.PI) * amp, 2.5, col, '#2e221a'); qleg(c, 7.5, by + 2.5, LL, Math.sin(ph) * amp, 2.5, col, '#2e221a');
  c.restore();
}
function elephant(c, L, pc, ps) {
  const col = '#8d8a8c', dk = '#6d6a6e', wk = ps.walk, ph = wk >= 0 ? wk * TAU : 0, amp = wk >= 0 ? 0.4 : 0, by = -19, t = ps.atk >= 0 ? Math.sin(clamp01(ps.atk) * Math.PI) : 0;
  shadow(c, 21, 6.5, 2);
  c.save(); c.translate(0, wk >= 0 ? Math.sin(ph * 2) * 0.6 : 0); c.rotate(ps.back ? -0.06 : 0.04);
  qleg(c, -9, by + 6, 12, Math.sin(ph + Math.PI + 1) * amp, 5.4, dk); qleg(c, 7, by + 6, 12, Math.sin(ph + 1) * amp, 5.4, dk);
  c.beginPath(); c.moveTo(-14, by - 3); c.quadraticCurveTo(-18, by + 2, -16.5, by + 8); c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = dk; c.lineWidth = 1.2; c.stroke();
  ell(c, 0, by, 15, 10); ink(c, col, 1);
  // blanket + howdah
  poly(c, [-10, by - 9.5, 7, by - 10, 9, by + 3, 4.5, by + 5.5, -1, by + 3.5, -6.5, by + 5.5, -11.5, by + 2.6]); ink(c, pc.m);
  c.strokeStyle = pc.l; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-11, by + 0.8); c.lineTo(-6.5, by + 3.6); c.lineTo(-1, by + 1.6); c.lineTo(4.5, by + 3.6); c.lineTo(8.6, by + 1); c.stroke();
  for (const hx of [-5.5, 1.5]) { ell(c, hx, by - 18.6, 2.6, 2.6); ink(c, SKIN, 0.7); c.beginPath(); c.arc(hx, by - 18.9, 3, Math.PI, TAU); c.closePath(); ink(c, STEEL, 0.7); }
  c.strokeStyle = OL; c.lineWidth = 1.5; c.beginPath(); c.moveTo(3.5, by - 15); c.lineTo(8, by - 26 - t * 2); c.stroke(); c.strokeStyle = WOOD; c.lineWidth = 0.8; c.stroke();
  rrect(c, -10, by - 17, 15.5, 7.6, 1.2); ink(c, WOOD); c.fillStyle = pc.d; c.fillRect(-9.2, by - 14.4, 14, 1.6);
  // head
  c.save(); c.translate(13.5, by - 2.5 - t * 3); c.rotate(-t * 0.25);
  ell(c, -3.6, -1, 5.6, 7.4, -0.2); ink(c, dk, 1);
  ell(c, 1.5, 0, 7.4, 7.6); ink(c, col, 1);
  c.fillStyle = OL; ell(c, 4.4, -1.8, 0.8, 0.9); c.fill();
  c.beginPath(); c.moveTo(6.5, 3); c.quadraticCurveTo(10 + t * 5, 8 - t * 6, 8 + t * 9, 15.5 - t * 20); c.strokeStyle = OL; c.lineWidth = 5; c.lineCap = 'round'; c.stroke(); c.strokeStyle = col; c.lineWidth = 3.6; c.stroke();
  c.beginPath(); c.moveTo(3.5, 5); c.quadraticCurveTo(8, 9.5, 12.5, 6.2); c.strokeStyle = OL; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = '#f3ecd8'; c.lineWidth = 1.5; c.stroke();
  c.restore();
  qleg(c, -7.5, by + 7, 12, Math.sin(ph + Math.PI) * amp, 6, col, dk); qleg(c, 8.5, by + 7, 12, Math.sin(ph) * amp, 6, col, dk);
  c.restore();
}
function wolf(c, L, pc, ps) {
  const col = '#7c7f86', dk = '#5a5d64', wk = ps.walk, ph = wk >= 0 ? wk * TAU : 0, amp = wk >= 0 ? 0.8 : 0, by = -7.5, t = ps.atk >= 0 ? Math.sin(clamp01(ps.atk) * Math.PI) : 0;
  shadow(c, 8, 2.4);
  c.save(); c.translate(t * 2.5, (wk >= 0 ? Math.sin(ph * 2) * 0.5 : 0) - t * 1.5); c.rotate(ps.back ? -0.12 : 0.06);
  qleg(c, -4.5, by + 1, 6.5, Math.sin(ph + Math.PI + 1) * amp, 1.5, dk); qleg(c, 4.5, by + 1, 6.5, Math.sin(ph + 1) * amp, 1.5, dk);
  c.beginPath(); c.moveTo(-6, by - 1); c.quadraticCurveTo(-10.5, by - 2.5 - amp, -11, by + 2); c.strokeStyle = OL; c.lineWidth = 3.4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = col; c.lineWidth = 2.2; c.stroke();
  ell(c, 0, by, 6.8, 3); ink(c, col);
  c.fillStyle = pc.m; c.fillRect(2.6, by - 3.2, 1.8, 6); // collar marks the owner
  poly(c, [4.5, by - 2.6, 9.5, by - 5.5, 12.6, by - 2.4, 9.4, by - 0.6, 6, by + 1.4]); ink(c, col);
  poly(c, [6.8, by - 4, 7.2, by - 7.4, 9, by - 5]); ink(c, dk, 0.7);
  c.fillStyle = OL; c.fillRect(9.3, by - 4, 0.9, 0.9); ell(c, 12.4, by - 2.4, 0.8, 0.7); c.fill();
  qleg(c, -3.6, by + 1.4, 6.5, Math.sin(ph + Math.PI) * amp, 1.8, col); qleg(c, 5.2, by + 1.4, 6.5, Math.sin(ph) * amp, 1.8, col);
  c.restore();
}

// ---------------------------------------------------------------- siege engines
function wheel(c, x, y, r) { ell(c, x, y, r, r); ink(c, WOOD_D, 1); c.strokeStyle = WOOD; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); c.fillStyle = STEEL_D; ell(c, x, y, r * 0.28, r * 0.28); c.fill(); }
function flag(c, x, y, pc) { c.strokeStyle = OL; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 12); c.stroke(); poly(c, [x, y - 12, x - 7, y - 10, x, y - 7.5]); ink(c, pc.m, 0.7); }
function catapult(c, L, pc, ps) {
  const t = ps.atk, k = t >= 0 ? seg(t, 0.5, 0.68) - seg(t, 0.8, 1) : 0, ang = lerp(-1.25, 0.55, k);
  shadow(c, 15, 4.5);
  poly(c, [-13, -6, 13, -6, 14, -2.6, -14, -2.6]); ink(c, WOOD);
  limb(c, -6, -5, 1, -19, 2, WOOD_D); limb(c, 8, -5, 1, -19, 2, WOOD_D);
  c.save(); c.translate(1, -17); c.rotate(ang); limb(c, 0, 3, 0, -15, 1.8, WOOD); ell(c, 0, -16, 3.2, 2.2); ink(c, WOOD_D, 0.8);
  if (k < 0.6) { c.fillStyle = '#8f8d88'; ell(c, 0, -17.4, 2.2, 2.2); c.fill(); c.strokeStyle = OL; c.lineWidth = 0.6; c.stroke(); }
  c.fillStyle = STEEL_D; c.fillRect(-2, 2, 4, 3); c.restore();
  flag(c, -12, -6, pc); wheel(c, -9, -3.4, 4); wheel(c, 9, -3.4, 4);
}
function ballista(c, L, pc, ps) {
  const t = ps.atk, loaded = !(t > 0.55); shadow(c, 13, 4);
  limb(c, -9, -4, 0, -13, 1.8, WOOD_D); limb(c, 8, -4, 0, -13, 1.8, WOOD_D);
  c.save(); c.translate(0, -14); c.rotate(-0.1); poly(c, [-11, -1.5, 12, -1.5, 12, 1.5, -11, 1.5]); ink(c, WOOD);
  c.beginPath(); c.moveTo(7, -9); c.quadraticCurveTo(12.5, 0, 7, 9); c.strokeStyle = OL; c.lineWidth = 3; c.stroke(); c.strokeStyle = WOOD_D; c.lineWidth = 1.7; c.stroke();
  c.strokeStyle = '#d8d0c0'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(7, -9); c.lineTo(loaded ? -8 : 7, 0); c.lineTo(7, 9); c.stroke();
  if (loaded) { c.strokeStyle = OL; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-8, 0); c.lineTo(15, 0); c.stroke(); c.strokeStyle = '#d9d2c2'; c.lineWidth = 0.9; c.stroke(); c.fillStyle = STEEL; poly(c, [15, -1.6, 19, 0, 15, 1.6]); c.fill(); }
  c.restore(); flag(c, -10, -6, pc); wheel(c, -8, -3.2, 3.6); wheel(c, 8, -3.2, 3.6);
}
function cannon(c, L, pc, ps) {
  const t = ps.atk, k = t >= 0 ? seg(t, 0.55, 0.65) - seg(t, 0.65, 1) : 0; shadow(c, 14, 4.2);
  c.save(); c.translate(-k * 3, 0);
  poly(c, [-13, -3, -4, -9, 6, -9, 3, -4.5]); ink(c, WOOD); c.fillStyle = pc.m; c.fillRect(-4, -9.2, 9, 1.8);
  c.save(); c.translate(0, -10.5); c.rotate(-0.16); rrect(c, -8, -2.8, 21, 5.6, 2.4); ink(c, '#4d4a47'); c.fillStyle = '#7a6a3c'; c.fillRect(-4, -2.8, 1.6, 5.6); c.fillRect(9, -2.8, 1.6, 5.6);
  if (t > 0.55 && t < 0.75) { c.fillStyle = '#ffd84a'; ell(c, 17, 0, 5, 3.4); c.fill(); c.fillStyle = '#fff6c8'; ell(c, 15.5, 0, 2.6, 1.8); c.fill(); }
  c.restore(); wheel(c, 0, -5, 5.2); c.restore();
}
function ram(c, L, pc, ps) {
  const t = ps.atk, k = t >= 0 ? -seg(t, 0, 0.5) * 4 + seg(t, 0.5, 0.64) * 10 - seg(t, 0.7, 1) * 6 : 0; shadow(c, 16, 5);
  c.save(); c.translate(k, 0); rrect(c, -8, -11.5, 26, 4.6, 2); ink(c, WOOD); rrect(c, 15, -12.4, 5.5, 6.4, 1.6); ink(c, STEEL_D); c.restore();
  wheel(c, -9, -3.4, 3.6); wheel(c, 9, -3.4, 3.6);
  poly(c, [-14, -6, 14, -6, 13, -3.6, -13, -3.6]); ink(c, WOOD_D);
  poly(c, [-15, -12, 0, -24, 15, -12, 13, -9.6, 0, -19.6, -13, -9.6]); ink(c, WOOD);
  poly(c, [-13.4, -11, 0, -21.4, 13.4, -11, 12.4, -9.8, 0, -19.6, -12.4, -9.8]); c.fillStyle = pc.m; c.fill();
  limb(c, -12, -10, -12, -4.5, 1.6, WOOD_D); limb(c, 12, -10, 12, -4.5, 1.6, WOOD_D);
}

// ---------------------------------------------------------------- buildings (isometric)
function ibox(c, cx, cy, hw, hh, H, top, lf, rt, lw) {
  poly(c, [cx - hw, cy, cx, cy + hh, cx, cy + hh - H, cx - hw, cy - H]); ink(c, lf, lw || 1);
  poly(c, [cx, cy + hh, cx + hw, cy, cx + hw, cy - H, cx, cy + hh - H]); ink(c, rt, lw || 1);
  poly(c, [cx - hw, cy - H, cx, cy - hh - H, cx + hw, cy - H, cx, cy + hh - H]); ink(c, top, lw || 1);
}
const ST_T = '#b9b4a8', ST_L = '#9a958a', ST_R = '#7d786f';
function courses(c, hw, hh, H, n, col) {
  c.strokeStyle = col; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < n; i++) { const y = -H * i / n; c.moveTo(-hw, y); c.lineTo(0, hh + y); c.lineTo(hw, y); }
  for (let i = 0; i < n; i++) { const y = -H * i / n, o = i % 2 ? 0.3 : 0.6; for (const f of [o, o - 0.42]) { if (f <= 0.05) continue; c.moveTo(-hw * f, hh * (1 - f) + y); c.lineTo(-hw * f, hh * (1 - f) + y - H / n); c.moveTo(hw * f, hh * (1 - f) + y); c.lineTo(hw * f, hh * (1 - f) + y - H / n); } }
  c.stroke();
}
function merlons(c, hw, hh, H, top, lf, rt) { for (const [x, y] of [[0, -hh * 0.72], [-hw * 0.72, 0], [hw * 0.72, 0], [0, hh * 0.72]]) ibox(c, x, y - H, hw * 0.24, hh * 0.24, 5, top, lf, rt, 0.7); }
const BLD = {
  wall(c, pc) { ibox(c, 0, 0, 31, 15.5, 24, ST_T, ST_L, ST_R); courses(c, 31, 15.5, 24, 4, 'rgba(40,34,28,0.45)'); merlons(c, 31, 15.5, 24, ST_T, ST_L, ST_R);
    c.fillStyle = pc.m; poly(c, [-3, 13.5 - 20, 3, 13.5 - 20 - 0, 3, 13.5 - 12, 0, 13.5 - 9.5, -3, 13.5 - 12]); c.fill(); c.strokeStyle = OL; c.lineWidth = 0.6; c.stroke(); },
  palisade(c, pc) {
    const stake = (x, y, h) => { c.beginPath(); c.moveTo(x - 3.1, y); c.lineTo(x - 3.1, y - h); c.lineTo(x, y - h - 4.5); c.lineTo(x + 3.1, y - h); c.lineTo(x + 3.1, y); c.closePath(); ink(c, WOOD, 0.8); c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(x, y - h, 3.1, h); };
    const pts = []; for (let i = 0; i <= 4; i++) { pts.push([-26 + i * 6.5, -13 + i * 3.25 + 13, 0], [26 - i * 6.5, -13 + i * 3.25 + 13, 0]); }
    for (let i = 0; i <= 4; i++) { stake(-26 + i * 6.5, -i * 3.25, 19 + (i % 2) * 2); stake(26 - i * 6.5, -i * 3.25, 20 - (i % 2) * 2); }
    c.fillStyle = 'rgba(60,45,30,0.55)'; poly(c, [-28, 0, 0, -14, 28, 0, 0, 14]); c.fill();
    for (let i = 4; i >= 0; i--) { stake(-26 + i * 6.5, i * 3.25, 20 - (i % 2) * 2); if (i < 4) stake(26 - i * 6.5, i * 3.25, 19 + (i % 2) * 2); }
    c.fillStyle = pc.m; c.fillRect(-2.2, 13 - 15, 4.4, 4); },
  gate(c, pc) { ibox(c, 0, 0, 31, 15.5, 34, ST_T, ST_L, ST_R); courses(c, 31, 15.5, 34, 5, 'rgba(40,34,28,0.4)'); merlons(c, 31, 15.5, 34, ST_T, ST_L, ST_R);
    for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * 24, 3.5); c.lineTo(sg * 24, -11); c.quadraticCurveTo(sg * 15.5, -19, sg * 7, -2.6); c.lineTo(sg * 7, 12); c.closePath(); ink(c, shade(pc.d, sg < 0 ? 0 : -0.25), 0.9);
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 0.7; c.beginPath(); for (const f of [12, 16, 20]) { c.moveTo(sg * f, 9.5 - (f - 7) * 0.5); c.lineTo(sg * f, -12 + Math.abs(f - 15.5) * 0.9); } c.stroke(); } },
  tower(c, pc) { ibox(c, 0, 0, 23, 11.5, 54, ST_T, ST_L, ST_R); courses(c, 23, 11.5, 54, 8, 'rgba(40,34,28,0.4)');
    c.fillStyle = OL; c.fillRect(-12.5, -30, 2, 8); c.fillRect(10.5, -30, 2, 8);
    ibox(c, 0, -54, 28, 14, 9, ST_T, ST_L, ST_R); merlons(c, 28, 14, 63, ST_T, ST_L, ST_R);
    poly(c, [-3, -42, 3, -42, 3, -32, 0, -29, -3, -32]); ink(c, pc.m, 0.7);
    c.strokeStyle = OL; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -63); c.lineTo(0, -84); c.stroke(); poly(c, [0, -84, 12, -81, 0, -77]); ink(c, pc.m, 0.8); },
  keep(c, pc) {
    const turret = (x, y) => { ibox(c, x, y, 21, 10.5, 74, ST_T, ST_L, ST_R); courses(c, 0, 0, 0, 0, '#000'); ibox(c, x, y - 74, 25, 12.5, 8, ST_T, ST_L, ST_R);
      c.save(); c.translate(x, y); merlons(c, 25, 12.5, 82, ST_T, ST_L, ST_R); c.fillStyle = OL; c.fillRect(-11, -50, 2, 8); c.fillRect(9, -50, 2, 8); c.restore(); };
    turret(0, -37);
    ibox(c, 0, 0, 84, 42, 50, '#aaa598', ST_L, ST_R, 1.2);
    c.save(); courses(c, 84, 42, 50, 6, 'rgba(40,34,28,0.35)'); c.restore();
    for (const sg of [-1, 1]) for (const f of [0.3, 0.62]) { poly(c, [sg * 84 * f - 4, 42 * (1 - f) - 40, sg * 84 * f + 4, 42 * (1 - f) - 40, sg * 84 * f + 4, 42 * (1 - f) - 22, sg * 84 * f, 42 * (1 - f) - 17, sg * 84 * f - 4, 42 * (1 - f) - 22]); ink(c, pc.m, 0.8); }
    c.beginPath(); c.moveTo(-8, 38); c.lineTo(-8, 22); c.quadraticCurveTo(0, 13, 8, 22); c.lineTo(8, 38); c.lineTo(0, 42); c.closePath(); ink(c, '#3a2a1c');
    turret(-63, 0); turret(63, 0);
    ibox(c, 0, -50, 40, 20, 40, ST_T, ST_L, ST_R); c.save(); c.translate(0, -50); courses(c, 40, 20, 40, 5, 'rgba(40,34,28,0.35)'); c.fillStyle = OL; c.fillRect(-21, -24, 2.4, 9); c.fillRect(18.6, -24, 2.4, 9);
    poly(c, [-40, -40, 0, -20, 40, -40, 0, -78]); ink(c, shade(pc.d, -0.1)); poly(c, [-40, -40, 0, -20, 0, -78]); c.fillStyle = pc.m; c.fill(); c.strokeStyle = OL; c.lineWidth = 1; c.stroke();
    c.strokeStyle = OL; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -78); c.lineTo(0, -104); c.stroke(); poly(c, [0, -104, 17, -100, 0, -94]); ink(c, pc.m); c.restore();
    turret(0, 32); },
  tent(c, pc) { c.fillStyle = 'rgba(0,0,0,0.25)'; ell(c, 2, 2, 26, 12); c.fill();
    c.beginPath(); c.moveTo(0, -36); c.lineTo(-23, 0); c.quadraticCurveTo(0, 15, 23, 0); c.closePath(); ink(c, '#e9dfc6');
    c.fillStyle = pc.m; for (const [a, b] of [[-23, -12], [-3, 6], [14, 23]]) { c.beginPath(); c.moveTo(0, -36); c.lineTo(a, a === -23 ? 0 : 7.4 - Math.abs(a) * 0.3); c.lineTo(b, 7.4 - Math.abs(b) * 0.3 + (b === 23 ? -0.5 : 0)); c.closePath(); c.fill(); }
    c.beginPath(); c.moveTo(0, -36); c.lineTo(-23, 0); c.quadraticCurveTo(0, 15, 23, 0); c.closePath(); c.strokeStyle = OL; c.lineWidth = 1; c.stroke();
    poly(c, [0, -14, -4.5, 7, 4.5, 7]); c.fillStyle = '#2b2018'; c.fill(); flag(c, 0, -35, pc); },
};

// ---------------------------------------------------------------- scenery
function tree(c, kind, v) {
  c.fillStyle = 'rgba(0,0,0,0.25)'; ell(c, 3, 1, 15, 6); c.fill();
  if (kind === 'palm') {
    c.beginPath(); c.moveTo(-1.5, 0); c.quadraticCurveTo(3, -18, 0, -34); c.strokeStyle = OL; c.lineWidth = 4.6; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#9a7a4a'; c.lineWidth = 3.2; c.stroke();
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.62 + v * 0.2, ex = Math.cos(a) * 17, ey = -34 + Math.sin(a) * 9 + 9;
      c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(ex * 0.6, -42 + Math.abs(i - 3) * 1.5, ex, ey); c.quadraticCurveTo(ex * 0.5, -35 + Math.abs(i - 3), 0, -34); ink(c, i % 2 ? '#4f8a3a' : '#3f7631', 0.8); }
    return;
  }
  const snow = kind === 'snowpine';
  if (kind === 'pine' || snow) {
    c.fillStyle = '#5a4028'; c.fillRect(-1.8, -8, 3.6, 9); c.strokeStyle = OL; c.lineWidth = 0.8; c.strokeRect(-1.8, -8, 3.6, 9);
    for (let i = 0; i < 3; i++) { const w = 14 - i * 3.4, y = -6 - i * 11; poly(c, [-w, y, 0, y - 17, w, y]); ink(c, i === 1 ? '#2f6a3c' : '#2a5c34', 0.9); poly(c, [0, y, 0, y - 17, w, y]); c.fillStyle = 'rgba(0,0,0,0.14)'; c.fill();
      if (snow) { poly(c, [-w * 0.55, y - 7.6, 0, y - 17, w * 0.55, y - 7.6, w * 0.2, y - 9.5, 0, y - 7, -w * 0.25, y - 9.5]); c.fillStyle = '#f4f8fb'; c.fill(); } }
    return;
  }
  c.fillStyle = '#6a4a2c'; poly(c, [-2.6, 1, -1.8, -16, 1.8, -16, 2.6, 1]); c.fill(); c.strokeStyle = OL; c.lineWidth = 0.9; c.stroke();
  const g = ['#3c7a35', '#4a8c3d', '#59a046'], blobs = [[-8, -20, 9], [8, -21, 9.5], [0, -30, 10.5], [-3, -22, 9], [5, -27, 8]];
  for (const [x, y, r] of blobs) { ell(c, x + v * 2, y, r, r * 0.92); c.fillStyle = OL; c.fill(); }
  blobs.forEach(([x, y, r], i) => { ell(c, x + v * 2, y, r - 0.9, r * 0.92 - 0.9); c.fillStyle = g[i % 2]; c.fill(); });
  for (const [x, y, r] of [[-5, -25, 4.5], [3, -34, 5], [8, -25, 3.5]]) { ell(c, x + v * 2, y, r, r * 0.8); c.fillStyle = g[2]; c.fill(); }
}
function rock(c, v) {
  c.fillStyle = 'rgba(0,0,0,0.25)'; ell(c, 2, 1, 14, 5.5); c.fill();
  poly(c, [-12, 0, -9, -9 - v * 3, -2, -14, 6, -11 - v * 2, 12, -3, 9, 3, -6, 4]); ink(c, '#8d8a84', 1);
  poly(c, [-2, -14, 6, -11 - v * 2, 12, -3, 9, 3, 2, -4]); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fill();
  poly(c, [-9, -9 - v * 3, -2, -14, 0, -8, -6, -4]); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill();
}
function rubble(c, size) {
  const R = AB.rng32(size * 7 + 3), n = size * size * 7, hw = 28 * size, hh = 14 * size;
  c.fillStyle = 'rgba(40,32,26,0.4)'; poly(c, [-hw, 0, 0, -hh, hw, 0, 0, hh]); c.fill();
  for (let i = 0; i < n; i++) { const u = R() + R() - 1, v = R() + R() - 1, x = (u - v) * hw * 0.5, y = (u + v) * hh * 0.5, s = 2.5 + R() * 4;
    poly(c, [x - s, y, x - s * 0.3, y - s * 0.9, x + s * 0.8, y - s * 0.6, x + s, y + s * 0.3, x - s * 0.2, y + s * 0.6]); ink(c, ['#8d8a84', '#77736b', '#a39f95', '#6e5a40'][i % 4], 0.7); }
}

// ---------------------------------------------------------------- cache
const BOX = { human: [60, 60, 30, 46], rider: [76, 72, 36, 56], elephant: [100, 84, 46, 68], wolf: [48, 40, 22, 30], siege: [72, 60, 34, 46], b1: [80, 120, 40, 100], b3: [208, 250, 104, 196], tree: [48, 66, 22, 58], rock: [40, 30, 18, 22] };
const DRAW = { human: (c, L, pc, ps) => human(c, L, pc, ps), rider: (c, L, pc, ps) => horse(c, L, pc, ps, L.mount), elephant, wolf, catapult, ballista, cannon, ram };
const cache = new Map();
function mk(box, fn, lit) {
  const [w, h, ax, ay] = BOX[box], cv = document.createElement('canvas'); cv.width = w * SS; cv.height = h * SS;
  const c = cv.getContext('2d'); c.scale(SS, SS); c.translate(ax, ay); fn(c);
  if (lit) {                         // sunlight from above: warm highlight on top, cool shade toward the ground
    c.setTransform(SS, 0, 0, SS, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-atop';
    const g = c.createLinearGradient(0, ay - lit, 0, ay + 2);
    g.addColorStop(0, 'rgba(255,240,214,0.26)'); g.addColorStop(0.45, 'rgba(255,248,236,0.04)'); g.addColorStop(0.8, 'rgba(24,18,30,0.16)'); g.addColorStop(1, 'rgba(14,10,18,0.34)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = c.createRadialGradient(ax - lit * 0.18, ay - lit * 0.7, 1, ax - lit * 0.18, ay - lit * 0.7, lit * 0.55);
    r.addColorStop(0, 'rgba(255,236,200,0.14)'); r.addColorStop(1, 'rgba(255,236,200,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
  }
  return { cv, w, h, ax, ay };
}
const ATK_T = [0.08, 0.24, 0.4, 0.54, 0.7, 0.88], LIT = { human: 30, rider: 44, elephant: 52, wolf: 16, siege: 26 };
function mixHex(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t);
  return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1); }
const PC = AB.PLAYERS.map(p => Object.assign({}, p, { c: mixHex(p.m, '#6e604e', 0.24), m: mixHex(p.m, '#5a5048', 0.08) }));
function bones(c, big, v) {
  const R = AB.rng32(v * 31 + (big ? 7 : 3)), k = big ? 1.7 : 1, bone = '#ddd5c2', dk = '#7b705c';
  c.fillStyle = 'rgba(60,40,30,0.16)'; ell(c, 0, 0, 9 * k, 3.6 * k); c.fill();
  for (let i = 0; i < (big ? 6 : 4); i++) {
    const x = (R() - 0.5) * 12 * k, y = (R() - 0.5) * 4.4 * k, a = R() * Math.PI, l = (2.4 + R() * 2.6) * k;
    c.lineCap = 'round'; c.strokeStyle = dk; c.lineWidth = 1.9; c.beginPath(); c.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l * 0.5); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5); c.stroke();
    c.strokeStyle = bone; c.lineWidth = 1.1; c.stroke();
  }
  c.strokeStyle = bone; c.lineWidth = 0.8; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(1.5 * k, -0.4, (2.2 + i * 0.9) * k * 0.6, 3.6, 5.6); c.stroke(); }
  const sx = -4 * k, sy = -1.2; ell(c, sx, sy, 2.1 * k, 1.8 * k); c.fillStyle = bone; c.fill(); c.strokeStyle = dk; c.lineWidth = 0.6; c.stroke();
  c.fillStyle = '#3a3026'; ell(c, sx - 0.7 * k, sy - 0.2, 0.5 * k, 0.55 * k); c.fill(); ell(c, sx + 0.6 * k, sy - 0.2, 0.5 * k, 0.55 * k); c.fill();
}
const Sp = AB.Sprites = {
  shade,
  /* frame: 'idle' | 'w0'..'w7' | 'a0'..'a5' | 'd0'..'d4' */
  get(t, p, back, frame) {
    const key = t + '|' + p + '|' + (back ? 1 : 0) + '|' + frame; let s = cache.get(key); if (s) return s;
    const d = AB.UNITS[t], L = d.look, pc = PC[p];
    if (d.bld) s = mk(d.size > 1 ? 'b3' : 'b1', c => BLD[L.b](c, pc));
    else {
      const kind = L.b, box = BOX[kind] ? kind : 'siege', k = frame.charCodeAt(0), i = +frame.slice(1) || 0;
      const ps = { walk: k === 119 ? i / 8 : -1, atk: k === 97 ? ATK_T[i] : -1, back };
      s = mk(box, c => {
        if (k === 100) {               // death: buckle at the knees, then topple backwards
          const q = (i + 1) / 5, e = q * q * (3 - 2 * q);
          if (box === 'siege') { c.rotate(-0.22 * e); c.scale(1, 1 - 0.38 * e); }
          else { c.translate(-e * 4.5, e * 0.8); c.rotate(-1.52 * e); c.scale(1, 1 - 0.16 * Math.sin(q * Math.PI)); }
        }
        DRAW[kind](c, L, pc, ps);
      }, LIT[box]);
    }
    cache.set(key, s); return s;
  },
  scenery(kind, v) { const key = 's|' + kind + '|' + v; let s = cache.get(key); if (!s) { s = kind === 'rock' ? mk('rock', c => rock(c, v / 2)) : mk('tree', c => tree(c, kind, v - 1)); cache.set(key, s); } return s; },
  bones(big, v) { const key = 'bone|' + big + '|' + v; let s = cache.get(key); if (!s) { s = mk('human', c => bones(c, big, v)); cache.set(key, s); } return s; },
  rubble(size) { const key = 'rub|' + size; let s = cache.get(key); if (!s) { s = mk(size > 1 ? 'b3' : 'b1', c => rubble(c, size)); cache.set(key, s); } return s; },
  icon(t, p, size) {
    const d = AB.UNITS[t], s = Sp.get(t, p, false, 'idle'), cv = document.createElement('canvas'); cv.width = cv.height = size * 2; cv.style.width = cv.style.height = size + 'px';
    const c = cv.getContext('2d'); let sx = 0, sy = 0, sw = s.w, sh = s.h;
    if (d.bld) { const hh = d.size > 1 ? 150 : 88, ww = d.size > 1 ? 200 : 72; sx = s.ax - ww / 2; sy = s.ay - hh + (d.size > 1 ? 46 : 18); sw = ww; sh = hh; }
    else { const b = { human: [26, 34, 31], rider: [44, 46, 40], elephant: [56, 56, 44], wolf: [28, 22, 18], siege: [40, 34, 28] }[BOX[d.look.b] ? d.look.b : 'siege']; sw = b[0] + 6; sh = b[1] + 4; sx = s.ax - sw / 2 + 1; sy = s.ay - b[2] - 5; if (t === 'pikeman') { sy -= 6; sh += 6; } }
    const k = Math.min(size * 2 / sw, size * 2 / sh); c.imageSmoothingQuality = 'high';
    c.drawImage(s.cv, sx * SS, sy * SS, sw * SS, sh * SS, (size * 2 - sw * k) / 2, (size * 2 - sh * k) / 2, sw * k, sh * k);
    return cv;
  },
  clear() { cache.clear(); },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
