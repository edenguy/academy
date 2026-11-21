// The Paper layer engine. Spec: BACKGROUND_LLD.md.
// CANONICAL FILE: docs/hub/paper-engine.js. Every apps/<subject>/src/paper/engine.js is a
// byte-identical copy. Edit the canonical file, copy it over each app's file, rebuild each
// app, and run `node scripts/check-paper-sync.mjs`. Never edit a copy.
//
// Napkins of graph paper, each curved its own way, drift in 3D on small transparent canvases (a
// "stage" band, or a "gutter" in a page margin) and each carries one drawing (a "payload") that
// draws itself through a pen in the napkin's own coordinates. `kind: 'bubbles'` draws rising
// bubbles instead. One shared requestAnimationFrame loop for every canvas. A classic script and an
// ES module at once (no import, no export): it defines the global `AcademyPaper`.

(function () {
  'use strict';
  if (typeof document === 'undefined' || globalThis.AcademyPaper) return;

  const KEY = 'academy:paper-motion', SLOW = 'academy:paper-slow';
  const DRAW_S = 6, HOLD_S = 5, FADE_S = 1.6, CYCLE_S = DRAW_S + HOLD_S + FADE_S;
  const LIFE_S = 40, MAX_DRIFT = 20;   // seconds a napkin lives; a napkin never drifts faster than MAX_DRIFT px/s (see lifeOf)
  const Z_FAR = 2, SEG = 7, STILL_AT = 9, UP = 0.02, MAX_PX = 900000, IDLE_MS = 300000, TAU = 6.2832;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /** A repeatable random source (mulberry32), so a still frame is the same on every load. */
  function random(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readTokens(el) {
    const css = getComputedStyle(el), get = (n, f) => css.getPropertyValue(n).trim() || f;
    return {
      napkin: get('--napkin', '#ffffff'), edge: get('--napkin-edge', 'rgba(60,40,140,.22)'), shadow: get('--napkin-shadow', 'rgba(0,0,0,.13)'),
      grid: get('--paper-grid', 'rgba(60,40,140,.09)'), grid5: get('--paper-grid5', 'rgba(60,40,140,.2)'),
      inks: [get('--paper-ink-1', '#5b3df5'), get('--paper-ink-2', '#0b857c'), get('--paper-ink-3', '#c93a80')],
      text: get('--paper-text', '#463c6a'), ink: Number(get('--paper-ink-alpha', '0.8')) || 0.8, cells: Number(get('--napkin-cells', '12')) || 12,
      bubble: get('--bubble', 'rgba(11,133,124,.55)'), bubbleFill: get('--bubble-fill', 'rgba(11,133,124,.06)'),
    };
  }

  // ---- the napkin's surface ----------------------------------------------------------------------
  let X = 0, Y = 0, D = 0;   // the last projected point (px) and how far behind the napkin's middle it is (half-widths)
  const S = { n: null, v: null, ctx: null, ca: 1, sa: 0, cX: 1, sX: 0, cY: 1, sY: 0, focal: 1, cx: 0, cy: 0, drop: 0, k: 1, pk: 1, A: 1, alpha: 1 };

  function height(n, u, w) {
    let h = 0;
    for (const b of n.bumps) h += b.a * Math.exp(-((u - b.cu) * (u - b.cu) + (w - b.cw) * (w - b.cw)) * b.tight);
    return h;
  }

  /** Puts a napkin's bumps where they are now and sets the scale that keeps its relief (peak to trough, in half-widths). */
  function settle(n, now) {
    for (const b of n.bumps) { b.cu = b.u + 0.16 * Math.sin(now * 0.11 + b.ph); b.cw = b.w + 0.16 * Math.cos(now * 0.09 + b.ph * 1.7); }
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < 81; i++) { const h = height(n, (i % 9) / 4 - 1, Math.floor(i / 9) / 4 - 1); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    n.gain = n.relief / (hi - lo); n.mid = (hi + lo) / 2;
  }

  /** A point of the current napkin (u, w in -1..1, raised by `up`) on the screen: on its surface, turned about three axes, in perspective. */
  function P(u, w, up) {
    const n = S.n, x = n.hw * u, y = n.hh * w, z = n.hw * ((height(n, u, w) - n.mid) * n.gain - (up || 0));
    const x1 = x * S.ca - y * S.sa, y1 = x * S.sa + y * S.ca, y2 = y1 * S.cX - z * S.sX, z2 = y1 * S.sX + z * S.cX, x3 = x1 * S.cY + z2 * S.sY, z3 = z2 * S.cY - x1 * S.sY;
    const s = 1 / (1 + n.z + z3 / S.focal);
    X = S.cx + x3 * s; Y = S.cy + y2 * s + S.drop; D = z3 / n.hw;
  }

  // ---- text sprites on the tangent plane ---------------------------------------------------------
  const SPR = new Map(), FONT_OK = new Set(), FONT_ASKED = new Set();
  const SIZE = 44, SPR_H = Math.ceil(1.7 * SIZE), BASE = Math.round(SPR_H * 0.68);

  /** Markup -> runs. kind 0 plain, 1 sup, 2 sub, 3 stacked sub + sup, 4 vector. */
  function parse(m) {
    const runs = []; let i = 0, buf = '';
    const flush = () => { if (buf) { runs.push({ t: buf, k: 0 }); buf = ''; } };
    while (i < m.length) {
      const c = m[i];
      if ((c === '^' || c === '_' || c === '~') && m[i + 1] === '{') {
        let j = m.indexOf('}', i + 2); if (j < 0) j = m.length;
        const body = m.slice(i + 2, j); flush(); i = j + 1;
        if (c === '_' && m[i] === '^' && m[i + 1] === '{') { let j2 = m.indexOf('}', i + 2); if (j2 < 0) j2 = m.length; runs.push({ t: body, k: 3, t2: m.slice(i + 2, j2) }); i = j2 + 1; }
        else runs.push({ t: body, k: c === '^' ? 1 : c === '_' ? 2 : 4 });
      } else { buf += c; i++; }
    }
    flush(); return runs;
  }

  function sprite(v, markup, colour) {
    const key = markup + '|' + colour + '|' + v.font, hit = SPR.get(key);
    if (hit) return hit;
    const face = '600 ' + SIZE + 'px ' + v.font, plain = markup.replace(/[\^_~]\{|\}/g, '');
    if (document.fonts && !FONT_OK.has(plain) && !document.fonts.check(face, plain)) {   // never build a sprite from a font that has not arrived
      if (!FONT_ASKED.has(plain)) {
        FONT_ASKED.add(plain);
        const done = () => { FONT_OK.add(plain); SPR.clear(); kick(); };
        document.fonts.load(face, plain).then(done, done);
      }
      return null;
    }
    const runs = parse(markup), c = document.createElement('canvas'), x = c.getContext('2d');
    const small = Math.round(SIZE * 0.62), fnt = (px) => '600 ' + px + 'px ' + v.font;
    const setup = (g) => { g.direction = 'ltr'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; };
    setup(x);
    const wid = (r) => { x.font = fnt(r.k ? small : SIZE); const a = x.measureText(r.t).width; if (r.k !== 3) return a; return Math.max(a, x.measureText(r.t2).width); };
    let total = 8; for (const r of runs) total += wid(r);
    c.width = Math.ceil(total); c.height = SPR_H; setup(x);
    x.fillStyle = colour; x.strokeStyle = colour; x.lineWidth = 1; x.lineCap = 'round';
    let cur = 4;
    for (const r of runs) {
      const w = wid(r);
      x.font = fnt(r.k ? small : SIZE);
      if (r.k === 0 || r.k === 4) x.font = fnt(SIZE);
      if (r.k === 0) x.fillText(r.t, cur, BASE);
      else if (r.k === 1) x.fillText(r.t, cur, BASE - 0.45 * SIZE);
      else if (r.k === 2) x.fillText(r.t, cur, BASE + 0.22 * SIZE);
      else if (r.k === 3) { x.fillText(r.t, cur, BASE + 0.22 * SIZE); x.fillText(r.t2, cur, BASE - 0.45 * SIZE); }
      else {   // a vector: the letter with a small arrow over it
        x.fillText(r.t, cur, BASE);
        const y = BASE - 0.73 * SIZE - 0.12 * SIZE, a = cur + w * 0.1, b = cur + w * 0.9;
        x.lineWidth = 2; x.beginPath(); x.moveTo(a, y); x.lineTo(b, y); x.moveTo(b - 5, y - 4); x.lineTo(b, y); x.lineTo(b - 5, y + 4); x.stroke();
      }
      cur += w;
    }
    if (SPR.size >= 40) SPR.delete(SPR.keys().next().value);
    const s = { canvas: c, w: c.width, h: c.height }; SPR.set(key, s); return s;
  }

  /** Draws a text sprite on the tangent plane at (u, w), clamped so it always reads. Returns false when nothing was drawn. */
  function text(markup, colour, u, w, em, ax, ay, alpha) {
    const ctx = S.ctx, dpr = S.v.dpr, sp = sprite(S.v, markup, colour);
    if (!sp || alpha * S.A < 0.02) return false;
    const e = 0.04, hw = S.n.hw, hh = S.n.hh;
    P(u, w, UP); const ox = X, oy = Y;
    P(u + e, w, UP); let exx = (X - ox) / e, exy = (Y - oy) / e;
    P(u, w + (e * hw) / hh, UP); let eyx = (X - ox) / e, eyy = (Y - oy) / e;
    let lx = Math.hypot(exx, exy), ly = Math.hypot(eyx, eyy); const lo = 0.62 * Math.max(lx, ly);
    if (lx < lo) { exx *= lo / lx; exy *= lo / lx; lx = lo; }
    if (ly < lo) { eyx *= lo / ly; eyy *= lo / ly; ly = lo; }
    if ((exx * eyy - exy * eyx) / (lx * ly) < 0.9) {
      const px = -exy / lx, py = exx / lx; eyx = (eyx / ly) * 0.4 + px * 0.6; eyy = (eyy / ly) * 0.4 + py * 0.6;
      const m = Math.hypot(eyx, eyy); eyx *= ly / m; eyy *= ly / m;
    }
    let sc = (em * 1.7) / sp.h;
    sc = Math.min(sc, 1.7 / sp.w);
    if (sp.h * sc * ly < 12) return false;
    const a = exx * sc, b = exy * sc, c = eyx * sc, d = eyy * sc;
    ctx.globalAlpha = S.A * alpha;
    ctx.setTransform(dpr * a, dpr * b, dpr * c, dpr * d, dpr * (ox - (a * sp.w * ax + c * sp.h * ay)), dpr * (oy - (b * sp.w * ax + d * sp.h * ay)));
    ctx.drawImage(sp.canvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  // ---- the pen ------------------------------------------------------------------------------------
  let lastX = 0, lastY = 0;   // the last two points of a seg, for an arrow's head
  const PEN = {
    t: 1, now: STILL_AT, still: true, text: '#000',
    ink: (i) => S.v.tokens.inks[(i + S.n.colour) % 3],
    style(colour, width, alpha) {
      const c = S.ctx; c.strokeStyle = colour; c.fillStyle = colour; c.lineWidth = Math.max(1.2, width * S.pk);
      S.alpha = alpha === undefined ? 1 : alpha; c.globalAlpha = S.A * S.alpha; c.setLineDash([]);
    },
    curve(fn, u0, u1, part, steps, dashed) {
      part = part === undefined ? 1 : clamp(part, 0, 1); if (part <= 0) return;
      const c = S.ctx, m = Math.max(2, Math.ceil(Math.min(steps || 56, 56) * part));
      c.beginPath();
      for (let j = 0; j <= m; j++) { const u = u0 + ((u1 - u0) * part * j) / m; P(u, fn(u), UP); if (j) c.lineTo(X, Y); else c.moveTo(X, Y); }
      if (dashed) c.setLineDash([4 * S.pk, 4 * S.pk]);
      c.stroke(); c.setLineDash([]);
    },
    seg(u0, w0, u1, w1) {
      const c = S.ctx; c.beginPath();
      for (let j = 0; j <= 5; j++) { P(u0 + ((u1 - u0) * j) / 5, w0 + ((w1 - w0) * j) / 5, UP); if (j) c.lineTo(X, Y); else c.moveTo(X, Y); if (j === 4) { lastX = X; lastY = Y; } }
      c.stroke();
    },
    dash(u0, w0, u1, w1) { const c = S.ctx; c.setLineDash([4 * S.pk, 4 * S.pk]); PEN.seg(u0, w0, u1, w1); c.setLineDash([]); },
    arrow(u0, w0, u1, w1) {
      PEN.seg(u0, w0, u1, w1);
      const c = S.ctx, a = Math.atan2(Y - lastY, X - lastX), L = Math.max(4, 9 * S.pk), tx = X, ty = Y;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx - L * Math.cos(a - 0.45), ty - L * Math.sin(a - 0.45)); c.lineTo(tx - L * Math.cos(a + 0.45), ty - L * Math.sin(a + 0.45)); c.closePath(); c.fill();
    },
    quad(u0, w0, u1, w1, fill) {
      const c = S.ctx, um = (u0 + u1) / 2, wm = (w0 + w1) / 2, pts = [u0, w0, um, w0, u1, w0, u1, wm, u1, w1, um, w1, u0, w1, u0, wm];
      c.beginPath();
      for (let j = 0; j < 16; j += 2) { P(pts[j], pts[j + 1], UP); if (j) c.lineTo(X, Y); else c.moveTo(X, Y); }
      c.closePath(); c.globalAlpha = S.A * S.alpha * fill; c.fill(); c.globalAlpha = S.A * S.alpha; c.stroke();
    },
    area(fn, u0, u1, wBase, fill) {
      const c = S.ctx; c.beginPath();
      for (let j = 0; j <= 28; j++) { const u = u0 + ((u1 - u0) * j) / 28; P(u, fn(u), UP); if (j) c.lineTo(X, Y); else c.moveTo(X, Y); }
      for (let j = 0; j <= 4; j++) { P(u1 + ((u0 - u1) * j) / 4, wBase, UP); c.lineTo(X, Y); }
      c.closePath(); c.globalAlpha = S.A * S.alpha * fill; c.fill(); c.globalAlpha = S.A * S.alpha;
    },
    dot(u, w, rPx, filled) {
      const c = S.ctx; P(u, w, UP); c.beginPath(); c.arc(X, Y, Math.max(1.4, rPx * S.pk), 0, TAU);
      if (filled === false) { const f = c.fillStyle; c.globalAlpha = S.A; c.fillStyle = S.v.tokens.napkin; c.fill(); c.fillStyle = f; c.globalAlpha = S.A * S.alpha; c.stroke(); } else c.fill();
    },
    disc(u, w, rPx, colour, letter) {
      const c = S.ctx, r = Math.max(3, rPx * S.pk); P(u, w, UP); const ox = X, oy = Y;
      c.beginPath(); c.arc(ox, oy, r, 0, TAU); c.globalAlpha = S.A; c.fillStyle = S.v.tokens.napkin; c.fill();
      c.strokeStyle = colour; c.lineWidth = Math.max(1.2, 1.6 * S.pk); c.globalAlpha = S.A * S.alpha; c.stroke();
      if (letter) { P(u + 0.04, w, UP); const pxu = Math.hypot(X - ox, Y - oy) / 0.04; text(letter, S.v.tokens.text, u, w, (1.05 * r) / pxu, 0.5, 0.5, S.alpha); }
    },
    arc(u, w, r, a0, a1) {
      const c = S.ctx, k = S.n.hw / S.n.hh; c.beginPath();
      for (let j = 0; j <= 12; j++) { const a = a0 + ((a1 - a0) * j) / 12; P(u + r * Math.cos(a), w - r * k * Math.sin(a), UP); if (j) c.lineTo(X, Y); else c.moveTo(X, Y); }
      c.stroke();
    },
    label(markup, u, w, em, opts) {
      const o = opts || {};
      text(markup, o.colour || S.v.tokens.text, u, w, em, o.ax === undefined ? 0.5 : o.ax, o.ay === undefined ? 0.5 : o.ay, o.alpha === undefined ? 1 : o.alpha);
    },
  };

  // ---- one napkin --------------------------------------------------------------------------------
  /** The napkin that slot i carries in its g-th life: size, path, how it turns, all from one seed. */
  function napkin(i, g, count, v) {
    const rnd = random(i * 7919 + g * 104729 + v.seed * 15485863 + 13), w = v.w, h = v.h;
    const crossing = rnd() < 0.4, zNear = 0.12 + rnd() * 0.25, zEnd = crossing ? 0.6 + rnd() * 0.4 : Z_FAR;
    const along = (((i * (count % 2 ? 2 : 1) + g * 3) % count) + 0.5 + (rnd() - 0.5) * 0.5) / count;
    let hw, hh, mx, my, dx, dy;
    if (v.flow === 'x') {
      const b = Math.min(w * (w < 700 ? 0.6 : 0.3), h * 1.55), go = rnd() < 0.5 ? -1 : 1;
      hw = b / 2; hh = hw * (0.6 + rnd() * 0.1);
      mx = w * along; my = h * (0.5 + (rnd() - 0.5) * 0.16);
      if (crossing) { mx = w / 2; dx = go * (w + b * 1.2); dy = (rnd() - 0.5) * h * 0.2; } else { dx = go * b * (0.5 + rnd() * 0.5); dy = (rnd() - 0.5) * h * 0.2; }
    } else {
      const b = Math.max(150, Math.min(340, w * 0.92));
      hw = b / 2; hh = hw * (0.62 + rnd() * 0.16);
      mx = w / 2; my = h * (0.12 + 0.76 * along);
      dx = (rnd() - 0.5) * w * 0.12; dy = (rnd() < 0.5 ? -1 : 1) * h * (crossing ? 1.3 : 0.3);
    }
    // Its surface: two to four large bumps, the sides taking turns, so there is always a rise and a hollow.
    const turn = (Math.floor(rnd() * 4) + 0.2 + rnd() * 0.6) * 1.5708, ou = (rnd() - 0.5) * 0.4, ow = (rnd() - 0.5) * 0.4, flip = rnd() < 0.5 ? 1 : -1, many = 2 + Math.floor(rnd() * 3);
    const bumps = Array.from({ length: many }, (_, j) => {
      const r = 0.3 + rnd() * 0.14, at = turn + ((j + (rnd() - 0.5) * 0.5) * TAU) / many, far = 0.3 + rnd() * 0.45;
      return { u: ou + Math.cos(at) * far, w: ow + Math.sin(at) * far, a: (j % 2 ? flip : -flip) * (0.6 + rnd() * 0.4), tight: 1 / (2 * r * r), ph: rnd() * TAU, cu: 0, cw: 0 };
    });
    return {
      key: i + '/' + g + '/' + w + '/' + h, hw, hh, rows: 0, zNear, zEnd, mx, my, dx, dy, rot: (rnd() - 0.5) * 0.5, spin: (rnd() - 0.5) * 0.3,
      phase: rnd() * TAU, bumps, relief: 0.28 + rnd() * 0.12, mid: 0, gain: 1, colour: (i + g) % 3, p: 0, z: 0, cycle: -1, pi: -1,
    };
  }

  /** Seconds a napkin lives on this canvas: 40, longer where a crossing napkin would otherwise drift faster than MAX_DRIFT px/s. */
  function lifeOf(v) {
    const travel = v.flow === 'x' ? v.w + Math.min(v.w * (v.w < 700 ? 0.6 : 0.3), v.h * 1.55) * 1.2 : v.h * 1.3;
    return Math.max(LIFE_S, Math.ceil(travel / MAX_DRIFT));
  }

  function sheet(v, n, now, still) {
    const ctx = v.ctx, t = v.tokens, s0 = 1 / (1 + n.z), near = 1 - n.z / Z_FAR, k = (s0 * n.hw) / 164;
    const ends = Math.min(1, Math.min(n.p, 1 - n.p) / 0.07), fade = ends * ends * (3 - 2 * ends), fog = fade * (0.45 + 0.55 * near);
    const rot = n.rot + n.spin * n.p, tiltX = 0.55 * Math.sin(now * 0.13 + n.phase), tiltY = 0.6 * Math.sin(now * 0.1 + n.phase * 2);
    S.n = n; S.ctx = ctx; S.v = v; S.k = k; S.pk = (s0 * n.hw) / 110;
    S.ca = Math.cos(rot); S.sa = Math.sin(rot); S.cX = Math.cos(tiltX); S.sX = Math.sin(tiltX); S.cY = Math.cos(tiltY); S.sY = Math.sin(tiltY);
    S.focal = n.hw * 4.4; S.drop = 0;
    settle(n, now);
    S.cx = n.mx + n.dx * (n.p - 0.5) + Math.sin(now * 0.07) * 14 * s0; S.cy = n.my + n.dy * (n.p - 0.5);
    const run = (u0, w0, u1, w1, joined) => {
      for (let j = 0; j <= SEG; j++) { P(u0 + ((u1 - u0) * j) / SEG, w0 + ((w1 - w0) * j) / SEG); if (j || joined) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    };
    const outline = () => { ctx.beginPath(); run(-1, -1, 1, -1, false); run(1, -1, 1, 1, true); run(1, 1, -1, 1, true); run(-1, 1, -1, -1, true); ctx.closePath(); };
    /** The halves of a grid line that stand at this depth: 0 forward of the napkin's middle, 1 about level, 2 behind. */
    const line = (u0, w0, u1, w1, level) => {
      for (let half = 0; half < 2; half++) {
        const ua = u0 + ((u1 - u0) * half) / 2, wa = w0 + ((w1 - w0) * half) / 2, ub = ua + (u1 - u0) / 2, wb = wa + (w1 - w0) / 2;
        P((ua + ub) / 2, (wa + wb) / 2);
        if ((D < -0.13 ? 0 : D > 0.13 ? 2 : 1) === level) run(ua, wa, ub, wb, false);
      }
    };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // The shadow is the napkin's outline a little lower as two wide lines: only its rim shows.
    S.drop = 7 * k; outline();
    ctx.strokeStyle = t.shadow; ctx.globalAlpha = fog * 0.5; ctx.lineWidth = 17 * k; ctx.stroke();
    ctx.globalAlpha = fog * 0.7; ctx.lineWidth = 8 * k; ctx.stroke();
    S.drop = 0; outline();
    ctx.fillStyle = t.napkin; ctx.globalAlpha = fog; ctx.fill();
    ctx.strokeStyle = t.edge; ctx.lineWidth = 5 * k; ctx.globalAlpha = fog * 0.3; ctx.stroke();
    ctx.lineWidth = Math.max(0.75, 1.2 * k); ctx.globalAlpha = fog; ctx.stroke();
    // The grid: halves of SEG straight pieces, three inks for each weight of line, six strokes a napkin.
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    for (let pass = 0; pass < 6; pass++) {
      const strong = pass > 2, level = pass % 3;
      ctx.beginPath();
      for (let i = 1; i < Math.max(t.cells, n.rows); i++) {
        if ((i % 5 === 0) !== strong) continue;
        if (i < t.cells) line((2 * i) / t.cells - 1, -1, (2 * i) / t.cells - 1, 1, level);
        if (i < n.rows) line(-1, (2 * i) / n.rows - 1, 1, (2 * i) / n.rows - 1, level);
      }
      ctx.strokeStyle = strong ? t.grid5 : t.grid; ctx.lineWidth = Math.max(0.6, k);
      ctx.globalAlpha = fog * (strong ? 1 : Math.min(1, s0 * 1.5)) * (1.6 - 0.55 * level); ctx.stroke();
    }
    // The payload: drawn through the pen, at full ink at any depth.
    const payload = v.payloads[n.pi], age = still ? DRAW_S : n.p * v.life - n.cycle * CYCLE_S;
    S.A = t.ink * fade * (age > DRAW_S + HOLD_S ? Math.max(0, 1 - (age - DRAW_S - HOLD_S) / FADE_S) : 1); S.alpha = 1;
    if (payload && S.A > 0.01) {
      PEN.t = still ? 1 : Math.min(1, age / DRAW_S); PEN.now = now; PEN.still = still; PEN.text = t.text;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([]);
      payload.draw(PEN);
      ctx.setLineDash([]); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    }
    ctx.globalAlpha = 1;
  }

  function napkins(v, now, still) {
    const count = v.count, slots = v.slots, life = v.life;
    slots.length = Math.min(slots.length, count);
    for (let i = 0; i < count; i++) {
      const l = now / life + i / count + 1, g = Math.floor(l);
      let n = slots[i];
      if (!n || n.key !== i + '/' + g + '/' + v.w + '/' + v.h) n = slots[i] = napkin(i, g, count, v);
      n.p = l - g; n.z = n.zNear + (n.zEnd - n.zNear) * Math.pow(1 - Math.sin(Math.PI * n.p), 1.3);
      n.rows = Math.max(2, Math.round((v.tokens.cells * n.hh) / n.hw));
      const cycle = Math.floor((n.p * life) / CYCLE_S);
      if (cycle !== n.cycle || n.pi < 0) {
        n.cycle = cycle;
        const len = v.payloads.length;
        if (len) {
          let idx = v.only >= 0 ? v.only % len : (g * 5 + i * 3 + cycle * 7 + v.seed) % len;
          if (v.only < 0 && len > 1) for (let tries = 0; tries < len && slots.some((o, j) => j !== i && o && o.pi === idx); tries++) idx = (idx + 1) % len;
          n.pi = idx;
        }
      }
    }
    const order = v.order; order.length = 0; for (let i = 0; i < count; i++) order.push(slots[i]);
    order.sort((a, b) => b.z - a.z);   // far ones first
    for (let i = 0; i < order.length; i++) sheet(v, order[i], now, still);
  }

  // ---- bubbles (kind: 'bubbles') ----------------------------------------------------------------
  function bubbleSet(v) {
    const n = clamp(Math.round((v.w * v.h) / 5200), 10, 34), rnd = random(v.seed * 31 + 977), out = [];
    for (let i = 0; i < n; i++) {
      const z = rnd() * 2, q = rnd(), r0 = 5 + q * q * 24, s = 1 / (1 + z);
      out.push({ z, s, r0, stream: Math.floor(rnd() * 5), off: rnd() * 0.12 - 0.06, ph: rnd() * TAU, sp: 0.5 + rnd() * 0.5, start: rnd(), speed: (18 + r0 * 1.6) * s });
    }
    return out;
  }
  function bubbles(v, now) {
    const ctx = v.ctx, t = v.tokens;
    ctx.lineWidth = 1; ctx.fillStyle = t.bubbleFill; ctx.strokeStyle = t.bubble;
    for (const b of v.bubbles) {
      const r1 = b.r0 * b.s, travel = v.h + 2 * b.r0 * b.s, T = travel / b.speed, p = (now / T + b.start) % 1;
      const r = r1 * (0.75 + 0.25 * p), y = v.h + r1 - p * travel, q = 1 + 0.06 * Math.sin(2.2 * now + b.ph);
      const x = v.w * ((b.stream + 0.5) / 5 + b.off) + Math.sin(now * b.sp + b.ph) * (5 + 0.5 * b.r0) * b.s;
      const f = Math.min(1, p / 0.06, (1 - p) / 0.1);
      ctx.globalAlpha = (0.3 + 0.7 * (1 - b.z / 2)) * f * f * (3 - 2 * Math.min(1, Math.max(0, f)));
      ctx.lineWidth = Math.max(0.8, 1.4 * b.s);
      ctx.beginPath(); ctx.ellipse(x, y, r * q, r / q, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (r > 5) { ctx.beginPath(); ctx.arc(x, y, r * 0.62, 3.5, 4.6); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }

  // ---- canvases ----------------------------------------------------------------------------------
  function ramp(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); return g;
  }
  /** Edge fog: erase toward the canvas edges so nothing is cut by a straight line. [gradient, x, y, w, h] for each. */
  function fogs(v) {
    const w = v.w, h = v.h, c = v.ctx, f = [];
    if (v.flow === 'x') {
      const top = h * 0.14, bot = v.kind === 'bubbles' ? h * 0.22 : h * 0.14, side = Math.min(24, w / 4);
      f.push([ramp(c, 0, 0, 0, top), 0, 0, w, top], [ramp(c, 0, h, 0, h - bot), 0, h - bot, w, bot], [ramp(c, 0, 0, side, 0), 0, 0, side, h], [ramp(c, w, 0, w - side, 0), w - side, 0, side, h]);
    } else {
      const inner = Math.min(40, w / 2), leftSide = v.host.dataset.side !== 'right';
      f.push([ramp(c, 0, 0, 0, 24), 0, 0, w, 24]);
      if (leftSide) f.push([ramp(c, w, 0, w - inner, 0), w - inner, 0, inner, h]); else f.push([ramp(c, 0, 0, inner, 0), 0, 0, inner, h]);
    }
    return f;
  }

  function resize(v) {
    const cw = v.host.clientWidth, ch = v.host.clientHeight;
    if (!cw || !ch) return false;
    const ratio = Math.max(1, Math.min(devicePixelRatio || 1, 2, Math.sqrt(MAX_PX / (cw * ch))));
    if (cw !== v.w || ch !== v.h || ratio !== v.dpr) {
      v.w = cw; v.h = ch; v.dpr = ratio; v.canvas.width = Math.round(cw * ratio); v.canvas.height = Math.round(ch * ratio);
      v.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      v.fogs = fogs(v); v.life = lifeOf(v); v.slots.length = 0;
      if (v.kind === 'bubbles') v.bubbles = bubbleSet(v);
    }
    return true;
  }

  function draw(v, ms, still) {
    if (!resize(v)) return;
    const ctx = v.ctx, now = still ? STILL_AT : ms / 1000;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); ctx.clearRect(0, 0, v.w, v.h);
    ctx.imageSmoothingQuality = 'high';
    if (v.kind === 'bubbles') bubbles(v, now); else napkins(v, now, still);
    ctx.globalCompositeOperation = 'destination-out';
    for (const f of v.fogs) { ctx.fillStyle = f[0]; ctx.fillRect(f[1], f[2], f[3], f[4]); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    draws++;
  }

  // ---- the scheduler: one loop for every canvas -----------------------------------------------------
  const views = new Set(), listeners = new Set(), calm = matchMedia('(prefers-reduced-motion: reduce)');
  let userMotion = 'on', slow = false, lowBattery = false, idle = false, armed = false, raf = 0, frames = 0, draws = 0, snap = '', started = false;
  let lastActive = performance.now(), gaps = 0, gapSum = 0, warm = 0, lastDraw = 0, half = false, skip = 1, phase = 0;
  try { userMotion = localStorage.getItem(KEY) === 'off' ? 'off' : 'on'; } catch (e) { /* storage blocked */ }
  try { slow = sessionStorage.getItem(SLOW) === '1'; } catch (e) { /* storage blocked */ }

  function canMove() {
    if (calm.matches || slow || lowBattery) return false;
    const nav = navigator, c = nav.connection;
    if (c && c.saveData === true) return false;
    return !(nav.hardwareConcurrency <= 2 || nav.deviceMemory <= 2);
  }
  const wantMove = () => userMotion === 'on' && canMove() && armed && !idle && !document.hidden;
  const anyVisible = () => { for (const v of views) if (v.visible) return true; return false; };
  const moving = () => wantMove() && anyVisible();

  function notify() {
    const s = userMotion + canMove() + moving();
    if (s === snap) return; snap = s;
    for (const cb of Array.from(listeners)) cb();
  }

  /** Brings the loop in line with the conditions: runs it while there is something to move, else draws one still frame. */
  function kick() {
    const go = moving();
    if (go && !raf) { warm = 0; gaps = 0; gapSum = 0; lastDraw = 0; raf = requestAnimationFrame(tick); }
    if (!go) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!document.hidden) for (const v of views) if (v.visible) draw(v, 0, true);
    }
    notify();
  }

  function tick(ms) {
    raf = 0; frames++;
    if (!moving()) { kick(); return; }
    if (performance.now() - lastActive > IDLE_MS) { idle = true; kick(); return; }
    raf = requestAnimationFrame(tick);
    if (skip > 1 && ++phase % skip) return;
    // The governor: judge the last 90 gaps between draws (not the first 30 after a start, nor a tab switch).
    if (lastDraw) {
      const gap = ms - lastDraw;
      if (gap < 250 && ++warm > 30) {
        gapSum += gap;
        if (++gaps === 90) {
          const mean = gapSum / gaps; gaps = 0; gapSum = 0;
          if (!half && mean > 24) { half = true; skip = mean < 28 ? 2 : 1; }   // a device already held to 30 Hz needs no skipped frames
          else if (half && mean > 50) { slow = true; try { sessionStorage.setItem(SLOW, '1'); } catch (e) { /* storage blocked */ } kick(); return; }
        }
      }
    }
    lastDraw = ms;
    const t0 = PROFILE ? performance.now() : 0;
    for (const v of views) if (v.visible) draw(v, ms, false);
    if (PROFILE) { TIMES[tIx++ % TIMES.length] = performance.now() - t0; }
  }
  let PROFILE = false, tIx = 0; const TIMES = new Float32Array(512);

  function setup() {   // once, at the first mount
    if (started) return; started = true;
    const wake = () => { lastActive = performance.now(); if (idle) { idle = false; kick(); } };
    for (const e of ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']) addEventListener(e, wake, { passive: true, capture: true });
    document.addEventListener('visibilitychange', kick);
    addEventListener('storage', (e) => { if (e.key === KEY) { userMotion = e.newValue === 'off' ? 'off' : 'on'; kick(); } });
    calm.addEventListener('change', kick);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshAll);
    const mo = new MutationObserver(refreshAll);
    for (const el of [document.documentElement, document.body]) if (el) mo.observe(el, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    if (navigator.getBattery) navigator.getBattery().then((b) => { const u = () => { lowBattery = !b.charging && b.level <= 0.2; kick(); }; u(); b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); }, () => {});
    // Motion starts 600 ms after load, and not before the browser is idle, so it never competes with the app's start-up.
    const arm = () => setTimeout(() => { const go = () => { armed = true; kick(); }; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2000 }); else go(); }, 600);
    if (document.readyState === 'complete') arm(); else addEventListener('load', arm, { once: true });
  }

  /** The theme changed: read the tokens again, forget the sprites, redraw. */
  function refreshAll() { for (const v of views) v.tokens = readTokens(v.canvas); SPR.clear(); kick(); }

  function mount(host, o) {
    const canvas = document.createElement('canvas');
    canvas.className = 'academy-paper'; canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { canvas, refresh() {}, destroy() {} };
    host.prepend(canvas); setup();
    const v = {
      host, canvas, ctx, tokens: readTokens(canvas), w: 0, h: 0, dpr: 1, flow: o.flow === 'y' ? 'y' : 'x', kind: o.kind === 'bubbles' ? 'bubbles' : 'napkins',
      payloads: o.payloads || [], count: Math.max(1, o.count | 0), font: o.font || 'ui-monospace, monospace', seed: o.seed || 0, only: o.only === undefined ? -1 : o.only,
      slots: [], order: [], fogs: [], bubbles: [], life: LIFE_S, visible: true,
    };
    views.add(v);
    const first = (v.font.split(',')[0] || '').trim();
    if (document.fonts && first) { const done = () => { SPR.clear(); kick(); }; document.fonts.load('600 ' + SIZE + 'px ' + first).then(done, done); document.fonts.addEventListener('loadingdone', () => { SPR.clear(); }); }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (!raf) kick(); }) : null; if (ro) ro.observe(host);
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => { v.visible = es[es.length - 1].isIntersecting; kick(); }, { rootMargin: '32px' }) : null; if (io) io.observe(host);
    kick();
    return {
      canvas,
      refresh() { v.tokens = readTokens(canvas); SPR.clear(); kick(); },
      destroy() { views.delete(v); if (ro) ro.disconnect(); if (io) io.disconnect(); canvas.remove(); kick(); },
    };
  }

  globalThis.AcademyPaper = {
    mount,
    motion: () => userMotion,
    setMotion(s) {
      userMotion = s === 'off' ? 'off' : 'on';
      try { localStorage.setItem(KEY, userMotion); } catch (e) { /* storage blocked */ }
      kick();
    },
    moving, canMove, onChange(cb) { listeners.add(cb); return () => { listeners.delete(cb); }; },
    get _frames() { return frames; }, get _draws() { return draws; },
    _profile(on) { PROFILE = !!on; tIx = 0; TIMES.fill(0); },   // debug: time spent inside draw(), per drawn frame
    _times() { return Array.from(TIMES.subarray(0, Math.min(tIx, TIMES.length))); },
  };
})();
