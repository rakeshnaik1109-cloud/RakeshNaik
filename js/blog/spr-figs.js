/* Surface plasmon resonance from first principles — interactive figures (uses vl-core.js helpers).
   Optical constants: gold and silver from Johnson & Christy (1972), chromium from Rakić et al. (1998),
   water fitted to Hale & Querry (1973), glasses from their Sellmeier formulas. Reflectances are
   exact transfer-matrix results unless a caption says otherwise. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var D2R = Math.PI / 180;

  /* ── complex arithmetic ─────────────────────────────────── */
  var cm = function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; };
  var cd = function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  var ca = function (a, b) { return [a[0] + b[0], a[1] + b[1]]; }, cs = function (a, b) { return [a[0] - b[0], a[1] - b[1]]; };
  var csqrt = function (z) { var r = Math.hypot(z[0], z[1]), re = Math.sqrt(Math.max(0, (r + z[0]) / 2)), im = Math.sqrt(Math.max(0, (r - z[0]) / 2)); return [re, z[1] < 0 ? -im : im]; };
  var cabs2 = function (z) { return z[0] * z[0] + z[1] * z[1]; };
  var carg = function (z) { return Math.atan2(z[1], z[0]); };

  /* ── optical constants ──────────────────────────────────── */
  // [wavelength (nm), n, k]
  var AU = [[354.2, 1.5, 1.866], [367.9, 1.48, 1.895], [381.5, 1.46, 1.933], [397.4, 1.47, 1.952], [413.3, 1.46, 1.958], [430.5, 1.45, 1.948], [450.9, 1.38, 1.914], [471.4, 1.31, 1.849], [495.9, 1.04, 1.833], [520.9, 0.62, 2.081], [548.6, 0.43, 2.455], [582.1, 0.29, 2.863], [616.8, 0.21, 3.272], [659.5, 0.14, 3.697], [704.5, 0.13, 4.103], [756, 0.14, 4.542], [892, 0.17, 5.663], [984, 0.22, 6.35], [1088, 0.27, 7.15], [1610, 0.56, 11.21], [1937, 0.92, 13.78]];
  var AG = [[354.2, 0.1, 1.419], [367.9, 0.07, 1.657], [381.5, 0.05, 1.864], [413.3, 0.05, 2.275], [430.5, 0.04, 2.462], [450.9, 0.04, 2.657], [471.4, 0.05, 2.869], [520.9, 0.05, 3.324], [548.6, 0.06, 3.586], [582.1, 0.05, 3.858], [616.8, 0.06, 4.152], [756, 0.03, 5.242], [821.1, 0.04, 5.727], [892, 0.04, 6.312], [984, 0.04, 6.992], [1088, 0.04, 7.795], [1216, 0.09, 8.828], [1393, 0.13, 10.1], [1610, 0.15, 11.85], [1937, 0.24, 14.08]];
  var CR = [[361.1, 1.483, 3.262], [390.1, 1.69, 3.488], [421.5, 1.926, 3.699], [458, 2.207, 3.903], [478.7, 2.367, 4], [503.1, 2.554, 4.096], [525.8, 2.725, 4.169], [549.6, 2.898, 4.23], [574.4, 3.071, 4.279], [600.4, 3.242, 4.314], [631, 3.428, 4.34], [663.2, 3.605, 4.35], [708.7, 3.822, 4.346], [757.3, 4.011, 4.326], [804.8, 4.157, 4.301], [855.2, 4.275, 4.274], [918.9, 4.379, 4.25], [992.9, 4.45, 4.242], [1079, 4.483, 4.265], [1172, 4.478, 4.329], [1252, 4.452, 4.414], [1331, 4.413, 4.521], [1414, 4.363, 4.659], [1511, 4.299, 4.844], [1624, 4.221, 5.088], [1754, 4.133, 5.404], [1917, 4.029, 5.832]];
  // tabulated permittivities, interpolated smoothly (Catmull–Rom on ε)
  var epsTab = function (tab) { return tab.map(function (r) { return [r[0], r[1] * r[1] - r[2] * r[2], 2 * r[1] * r[2]]; }); };
  var spline = function (T) {
    return function (x) {
      var n = T.length; if (x <= T[0][0]) return [T[0][1], T[0][2]]; if (x >= T[n - 1][0]) return [T[n - 1][1], T[n - 1][2]];
      var i = 0; while (T[i + 1][0] < x) i++;
      var p0 = T[Math.max(0, i - 1)], p1 = T[i], p2 = T[i + 1], p3 = T[Math.min(n - 1, i + 2)], h = p2[0] - p1[0], t = (x - p1[0]) / h;
      var out = [0, 0];
      for (var c = 1; c <= 2; c++) {
        var m1 = (p2[c] - p0[c]) / (p2[0] - p0[0]) * h, m2 = (p3[c] - p1[c]) / (p3[0] - p1[0]) * h, t2 = t * t, t3 = t2 * t;
        out[c - 1] = (2 * t3 - 3 * t2 + 1) * p1[c] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[c] + (t3 - t2) * m2;
      }
      return out;
    };
  };
  var MET = { Au: { name: 'Gold', f: spline(epsTab(AU)), col: C.au }, Ag: { name: 'Silver', f: spline(epsTab(AG)), col: '#cfd6e4' }, Cr: { name: 'Chromium', f: spline(epsTab(CR)), col: '#9fb4c8' } };
  var epsM = function (id, nm) { return MET[id].f(nm); };
  var nWater = function (nm) { return 1.33798 + 850.7 / (nm * nm) - 1.2705e-5 * nm; };
  var sell = function (B, Cc) { return function (nm) { var l2 = nm * nm / 1e6, s = 1; for (var i = 0; i < 3; i++) s += B[i] * l2 / (l2 - Cc[i]); return Math.sqrt(s); }; };
  var GLASS = {
    BK7: { name: 'N-BK7', f: sell([1.03961212, 0.231792344, 1.01046945], [0.00600069867, 0.0200179144, 103.560653]) },
    SF10: { name: 'SF10', f: sell([1.62153902, 0.256287842, 1.64447552], [0.0122241457, 0.0595736775, 147.468793]) },
    silica: { name: 'fused silica', f: sell([0.6961663, 0.4079426, 0.8974794], [0.0684043 * 0.0684043, 0.1162414 * 0.1162414, 9.896161 * 9.896161]) }
  };
  var nGlass = function (id, nm) { return GLASS[id].f(nm); };
  var re = function (n) { return [n * n, 0]; };

  /* SPP wavevector in units of k0 (the "effective index" n_sp = k_sp / k0) */
  var nsp = function (em, ed) { return csqrt(cd(cm(em, [ed, 0]), ca(em, [ed, 0]))); };
  /* decay constants (units of k0) into the dielectric and the metal */
  var kap = function (ns, e) { var q = csqrt(cs(cm(ns, ns), [e[0], e[1] || 0])); return q; };

  /* ── transfer-matrix reflection coefficient ──────────────────
     L: [{ eps: [re, im], d (nm) }], first and last semi-infinite; th in degrees */
  var rTMM = function (L, lam, th, pol) {
    var n0 = Math.sqrt(L[0].eps[0]), kx = n0 * Math.sin(th * D2R), k0 = 2 * Math.PI / lam, kx2 = [kx * kx, 0], N = L.length;
    var q = L.map(function (l) { var kz = csqrt(cs(l.eps, kx2)); if (kz[1] < 0 || (kz[1] === 0 && kz[0] < 0)) kz = [-kz[0], -kz[1]]; return { kz: kz, y: pol === 's' ? kz : cd(l.eps, kz) }; });
    var m11 = [1, 0], m12 = [0, 0], m21 = [0, 0], m22 = [1, 0];
    for (var j = 1; j < N - 1; j++) {
      var a = q[j].kz[0] * k0 * L[j].d, b = q[j].kz[1] * k0 * L[j].d;
      if (b > 40) b = 40;
      var co = [Math.cos(a) * Math.cosh(b), -Math.sin(a) * Math.sinh(b)], si = [Math.sin(a) * Math.cosh(b), Math.cos(a) * Math.sinh(b)];
      var mis = [si[1], -si[0]];   // −i·sin
      var A = co, B = cd(mis, q[j].y), Cc = cm(mis, q[j].y), D = co;
      var n11 = ca(cm(m11, A), cm(m12, Cc)), n12 = ca(cm(m11, B), cm(m12, D)), n21 = ca(cm(m21, A), cm(m22, Cc)), n22 = ca(cm(m21, B), cm(m22, D));
      m11 = n11; m12 = n12; m21 = n21; m22 = n22;
    }
    var y0 = q[0].y, yN = q[N - 1].y;
    var Bv = ca(m11, cm(m12, yN)), Cv = ca(m21, cm(m22, yN));
    return cd(cs(cm(y0, Bv), Cv), ca(cm(y0, Bv), Cv));
  };
  var R = function (L, lam, th, pol) { return cabs2(rTMM(L, lam, th, pol || 'p')); };

  /* minimum of f on [a, b]: scan, then golden-section refinement */
  var dipOf = function (f, a, b, n) {
    n = n || 400; var best = a, bv = Infinity, st = (b - a) / n;
    for (var i = 0; i <= n; i++) { var x = a + i * st, v = f(x); if (v < bv) { bv = v; best = x; } }
    var lo = Math.max(a, best - st), hi = Math.min(b, best + st), g = 0.381966;
    var x1 = lo + g * (hi - lo), x2 = hi - g * (hi - lo), f1 = f(x1), f2 = f(x2);
    for (var k = 0; k < 40; k++) { if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = lo + g * (hi - lo); f1 = f(x1); } else { lo = x1; x1 = x2; f1 = f2; x2 = hi - g * (hi - lo); f2 = f(x2); } }
    var x = (lo + hi) / 2; return { x: x, v: f(x) };
  };
  /* full width at half depth around a dip at x0 (baseline: the larger of the two shoulders, capped at the range) */
  var fwhm = function (f, x0, v0, a, b) {
    var st = (b - a) / 2000, base = Math.max(f(Math.max(a, x0 - (b - a) / 3)), f(Math.min(b, x0 + (b - a) / 3))), lvl = (base + v0) / 2;
    var walk = function (dir) { var x = x0, prev = v0; for (var i = 0; i < 4000; i++) { var nx = x + dir * st; if (nx < a || nx > b) return NaN; var v = f(nx); if (v >= lvl) return x + dir * st * (lvl - prev) / (v - prev); x = nx; prev = v; } return NaN; };
    var l = walk(-1), r = walk(1); return r - l;
  };

  /* wavelength (nm) to an RGB colour, for drawing beams */
  var wl2rgb = function (w) {
    var r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else r = 1;
    var fa = w < 420 ? 0.3 + 0.7 * (w - 380) / 40 : w > 700 ? Math.max(0.35, 0.3 + 0.7 * (780 - w) / 80) : 1;
    if (w > 780) { r = 0.75; g = 0.18; b = 0.22; fa = 1; }
    var t = function (c) { return Math.round(255 * Math.pow(Math.max(0, c * fa), 0.8)); };
    return 'rgb(' + t(r) + ',' + t(g) + ',' + t(b) + ')';
  };
  var show = function (ctl, on) { ctl.input ? (ctl.input.parentNode.style.display = on ? '' : 'none') : (ctl.el.parentNode.style.display = on ? '' : 'none'); };
  var deg = function (v, d) { return v.toFixed(d == null ? 2 : d) + '°'; };
  var row2 = function (fig) { var d = VL.part(fig, 'spr-row'); var a = document.createElement('div'), b = document.createElement('div'); a.className = 'spr-sch'; d.appendChild(a); d.appendChild(b); return [a, b]; };
  var metalOpts = [['Au', 'Gold (Au)'], ['Ag', 'Silver (Ag)']];
  var mediumOpts = [['water', 'Water'], ['air', 'Air']];
  var nMed = function (m, nm) { return m === 'air' ? 1.0003 : nWater(nm); };

  /* ═══ 0. free electrons in an oscillating field (animated Drude slab) ═══ */
  F.drude = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), W = 880, H = 400, g = VL.canvas(fig, W, H), read = VL.part(fig, 'vl-readout');
    var phi = 0, hist = [], R0 = (function () { var s = 11; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
    var sx0 = 120, sx1 = 400, sy0 = 92, sy1 = 300;   // the metal slab
    var ions = [], els = [];
    for (var r = 0; r < 6; r++) for (var c = 0; c < 10; c++) ions.push([sx0 + 14 + c * 28, sy0 + 18 + r * 34]);
    for (var k = 0; k < 80; k++) els.push({ x: sx0 + 6 + R0() * (sx1 - sx0 - 12), y: sy0 + 6 + R0() * (sy1 - sy0 - 12), vx: R0() - 0.5, vy: R0() - 0.5 });
    var P = {};
    var calc = function () {
      var w = om.get(), gm = ga.get(), eps = cs([1, 0], cd([1, 0], [w * w, gm * w]));   // ε = 1 − 1/(w² + i γ w), in units of ω_p
      var Ein = cd([1, 0], eps), X = cd(Ein, [w * w, gm * w]);   // field inside (÷ E0) and electron displacement (along x, arbitrary units)
      P = { w: w, gm: gm, eps: eps, Ein: Ein, X: X };
      var aE = Math.hypot(Ein[0], Ein[1]), ph = carg(cd([-1, 0], [w * w, gm * w])) / D2R;   // phase of x relative to the force −eE_in acting on the electrons
      var reg = w < 0.97 ? 'below ω_p: the electrons over-respond, ε′ < 0 — the field inside is reversed and weakened; light is reflected' : w > 1.03 ? 'above ω_p: the electrons cannot keep up, 0 < ε′ < 1 — light passes through (the metal is transparent)' : 'at ω_p: ε ≈ 0 — the electron sea oscillates by itself (bulk plasmon)';
      read.innerHTML = '<div><b>' + eps[0].toFixed(2) + (eps[1] >= 0 ? ' + ' : ' − ') + Math.abs(eps[1]).toFixed(2) + 'i</b><span>ε(ω) = 1 − ω_p² / (ω² + iγω)</span></div><div><b>' + (Ein[0] < 0 ? '−' : '+') + aE.toFixed(2) + ' × E₀</b><span>field inside the slab, E₀ / ε (' + (Ein[0] < 0 ? 'reversed' : 'same direction') + ')</span></div><div><b>' + Math.abs(ph).toFixed(0) + '°</b><span>lag of the electrons\' displacement behind the force −eE_in on them (no damping: exactly 180°)</span></div><div><b>' + (w < 0.97 ? 'reflects' : w > 1.03 ? 'transparent' : 'plasma resonance') + '</b><span>' + reg + '</span></div>';
    };
    var sat = function (a, k) { return a / (k + a) * (k + 1); };   // compresses large amplitudes for drawing
    var arrowH = function (x, y, L, col, w) {   // horizontal arrow centred at (x, y), signed length L
      if (Math.abs(L) < 2) return; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w || 2.4;
      var x0 = x - L / 2, x1 = x + L / 2, s = L > 0 ? 1 : -1; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1 - s * 6, y); g.stroke();
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x1 - s * 9, y - 5); g.lineTo(x1 - s * 9, y + 5); g.closePath(); g.fill();
    };
    var draw = function (dt) {
      var cp = Math.cos(phi), sp = Math.sin(phi), re = function (z) { return z[0] * cp + z[1] * sp; };   // Re(z e^{−iφ})
      var E0 = cp, Ei = re(P.Ein), xr = re(P.X), aX = Math.hypot(P.X[0], P.X[1]), shift = aX ? 24 * sat(aX, 1.2) / (aX * 2.2) * xr : 0;
      shift = VL.clamp(shift, -26, 26);
      g.clearRect(0, 0, W, H);
      g.font = '600 14px "IBM Plex Sans", sans-serif'; g.fillStyle = C.text; g.textAlign = 'left';
      g.fillText('A metal slab in an oscillating field', 20, 24);
      g.font = '12px "IBM Plex Mono", monospace'; g.fillStyle = C.text2; g.fillText('field outside (gold) · field inside (red) · free electrons (cyan) on fixed ions (+)', 20, 44);
      // applied field outside, on both sides
      for (var i = 0; i < 4; i++) { var yy = sy0 + 26 + i * 52; arrowH(62, yy, 64 * E0, C.au, 3); arrowH(sx1 + 58, yy, 64 * E0, C.au, 3); }
      // slab: ions, then the electron sea shifted by the collective displacement
      g.fillStyle = '#3d2f12'; g.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      g.save(); g.beginPath(); g.rect(sx0, sy0, sx1 - sx0, sy1 - sy0); g.clip();
      g.fillStyle = 'rgba(69,191,214,.16)'; g.fillRect(sx0 + shift, sy0, sx1 - sx0, sy1 - sy0);
      ions.forEach(function (p) { g.fillStyle = '#e8b84a'; g.font = '700 15px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillText('+', p[0], p[1] + 5); });
      els.forEach(function (e) {   // thermal jiggle + collisions (random kicks) + the collective sloshing
        var jit = 14 * (dt || 0); e.vx += (R0() - 0.5) * 0.6; e.vy += (R0() - 0.5) * 0.6; e.vx *= 0.9; e.vy *= 0.9; e.x += e.vx * jit; e.y += e.vy * jit;
        if (e.x < sx0 + 4) e.x = sx1 - 6; if (e.x > sx1 - 4) e.x = sx0 + 6; if (e.y < sy0 + 4) e.y = sy1 - 6; if (e.y > sy1 - 4) e.y = sy0 + 6;
        g.fillStyle = C.cyan; g.beginPath(); g.arc(e.x + shift, e.y, 3.2, 0, 2 * Math.PI); g.fill();
      });
      g.restore();
      // surface charges left behind at the faces
      var q = Math.min(1, Math.abs(shift) / 20), posLeft = shift > 0;
      var face = function (x, pos) { g.fillStyle = pos ? 'rgba(255,138,156,' + (0.25 + 0.6 * q) + ')' : 'rgba(127,211,255,' + (0.25 + 0.6 * q) + ')'; g.fillRect(x - 5, sy0, 10, sy1 - sy0); g.fillStyle = pos ? '#ff8a9c' : '#7fd3ff'; g.font = '700 16px "IBM Plex Mono", monospace'; g.textAlign = 'center'; for (var j = 0; j < 4; j++) g.fillText(pos ? '+' : '−', x, sy0 + 34 + j * 50); };
      if (q > 0.08) { face(sx0, posLeft); face(sx1, !posLeft); }
      g.strokeStyle = C.au; g.lineWidth = 1.2; g.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      // field inside
      var aI = Math.hypot(P.Ein[0], P.Ein[1]), shown = 70 * Math.min(1.6, aI <= 1 ? aI : 1 + 0.3 * Math.log(aI)), Lin = aI ? shown * Ei / aI : 0;
      for (var m = 0; m < 3; m++) arrowH((sx0 + sx1) / 2, sy0 + 46 + m * 62, Lin, C.red, 3.2);
      g.font = '12px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillStyle = C.text3;
      g.fillText('applied E', 62, sy1 + 24); g.fillText('applied E', sx1 + 58, sy1 + 24); g.fillText('metal: fixed ions, free electrons', (sx0 + sx1) / 2, sy1 + 24);
      g.fillText('(cloud shift exaggerated)', (sx0 + sx1) / 2, sy1 + 42);
      // time traces
      hist.push([phi, E0, Ei / (aI || 1), xr / (aX || 1)]); while (hist.length && phi - hist[0][0] > 4 * Math.PI) hist.shift();
      var tx0 = 520, tx1 = W - 24, ty = 190, th = 66;
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx0, ty); g.lineTo(tx1, ty); g.stroke();
      g.textAlign = 'left'; g.fillStyle = C.text2; g.font = '12px "IBM Plex Mono", monospace'; g.fillText('last two cycles, each curve scaled to its own size', tx0, 84);
      [[1, C.au, 'E applied'], [2, C.red, 'E inside'], [3, C.cyan, 'electron displacement x']].forEach(function (s, n) {
        g.strokeStyle = s[1]; g.lineWidth = 2; g.beginPath();
        hist.forEach(function (h, j) { var X = tx1 - (phi - h[0]) / (4 * Math.PI) * (tx1 - tx0), Y = ty - th * h[s[0]]; j ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
        g.fillStyle = s[1]; g.fillRect(tx0, 304 + n * 18, 16, 3); g.fillStyle = C.text2; g.font = '11px "IBM Plex Mono", monospace'; g.fillText(s[2], tx0 + 24, 309 + n * 18);
      });
      g.fillStyle = C.text3; g.textAlign = 'left'; g.fillText('← earlier', tx0, 280); g.textAlign = 'right'; g.fillText('now →', tx1, 280); g.textAlign = 'left';
    };
    var loop = VL.loop(fig, function (dt) { if (!P.eps) return; phi += 2 * Math.PI * 0.45 * Math.sqrt(P.w) * dt; draw(dt); });
    VL.playButton(ctl, loop);
    var om = VL.slider(ctl, { label: 'Light frequency ω / ω_p', min: 0.3, max: 2, step: 0.01, value: 0.6, fmt: function (v) { return v.toFixed(2); }, on: function () { calc(); hist = []; draw(0); } });
    var ga = VL.slider(ctl, { label: 'Damping γ / ω_p', min: 0.01, max: 0.5, step: 0.01, value: 0.05, fmt: function (v) { return v.toFixed(2); }, on: function () { calc(); hist = []; draw(0); } });
    calc(); draw(0);
  };

  /* ═══ 1. the permittivity of gold and silver ═══ */
  F.eps = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var m = met.get(), md = med.get(), L = lam.get(), ls = VL.linspace(350, 1600, 260), e = epsM(m, L), nd = nMed(md, L), ed = nd * nd;
      plot.innerHTML = VL.plot({ id: 'eps', label: 'Permittivity of the metal', w: 720, h: 340, x: { min: 350, max: 1600, label: 'Wavelength (nm)' }, y: { min: -120, max: 15, label: 'Permittivity ε = ε′ + iε″' },
        series: [{ data: ls.map(function (l) { return [l, epsM(m, l)[0]]; }), color: MET[m].col, width: 2.6, label: 'ε′ (real part)' }, { data: ls.map(function (l) { return [l, epsM(m, l)[1]]; }), color: C.red, width: 2, dash: '6 4', label: 'ε″ (imaginary part, loss)' },
          { data: ls.map(function (l) { var n = nMed(md, l); return [l, -n * n]; }), color: C.cyan, width: 1.4, dash: '2 3', label: '−ε_d (' + (md === 'air' ? 'air' : 'water') + ')' }],
        marks: [{ x: L, y: e[0], color: '#fff', label: 'ε′ = ' + e[0].toFixed(1), dx: 10, dy: 16 }], vlines: [{ x: L, color: C.text3, dash: '2 4' }], legend: true, legendX: 20, legendY: 190 });
      var ns = nsp(e, ed), ok = e[0] < -ed;
      read.innerHTML = '<div><b>' + e[0].toFixed(2) + ' + ' + e[1].toFixed(2) + 'i</b><span>ε of ' + MET[m].name.toLowerCase() + ' at ' + L + ' nm</span></div><div><b>' + ed.toFixed(3) + '</b><span>ε_d of the ' + (md === 'air' ? 'air' : 'water') + '</span></div><div><b>' + (ok ? 'yes' : 'no') + '</b><span>ε′ < −ε_d, the condition for a bound surface wave</span></div><div><b>' + (ok ? ns[0].toFixed(4) : '—') + '</b><span>n_sp = Re k_sp / k₀ (light in the medium: ' + nd.toFixed(4) + ')</span></div><div><b>' + (e[1] / Math.abs(e[0])).toFixed(3) + '</b><span>loss ratio ε″ / |ε′| (smaller = sharper resonance)</span></div>';
    };
    var met = VL.select(ctl, { label: 'Metal', value: 'Au', options: metalOpts, on: draw });
    var med = VL.select(ctl, { label: 'Dielectric', value: 'water', options: mediumOpts, on: draw });
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 400, max: 1600, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 2. TM versus TE at a metal surface (animated) ═══ */
  F.tmte = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), W = 880, H = 470, g = VL.canvas(fig, W, H), read = VL.part(fig, 'vl-readout');
    var t = 0, P = {};
    var setup = function () {
      var L = lam.get(), e = epsM('Au', L), ed = nWater(L) * nWater(L), ns = nsp(e, ed), kd = kap(ns, [ed, 0]), km = kap(ns, e);
      P = { L: L, e: e, ed: ed, n: ns[0], kd: kd[0], km: km[0], lsp: L / ns[0], dd: L / (2 * Math.PI * kd[0]), dm: L / (2 * Math.PI * km[0]) };
      read.innerHTML = '<div><b>' + P.lsp.toFixed(0) + ' nm</b><span>plasmon wavelength along the surface, λ / n_sp</span></div><div><b>' + P.dd.toFixed(0) + ' nm</b><span>field decay length into the water (1/e)</span></div><div><b>' + P.dm.toFixed(0) + ' nm</b><span>field decay length into the gold</span></div><div><b>' + (P.ed / Math.abs(P.e[0])).toFixed(3) + '</b><span>|E_z| in the metal ÷ |E_z| in the water at the surface (ε_d / |ε_m|)</span></div>';
    };
    var arrow = function (x, y, dx, dy, col, w) {
      var L = Math.hypot(dx, dy); if (L < 1.2) return; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w || 1.6;
      g.beginPath(); g.moveTo(x - dx / 2, y - dy / 2); g.lineTo(x + dx / 2, y + dy / 2); g.stroke();
      var a = Math.atan2(dy, dx), hx = x + dx / 2, hy = y + dy / 2, s = Math.min(6, 2 + L * 0.3);
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - s * Math.cos(a - 0.45), hy - s * Math.sin(a - 0.45)); g.lineTo(hx - s * Math.cos(a + 0.45), hy - s * Math.sin(a + 0.45)); g.closePath(); g.fill();
    };
    var dotSym = function (x, y, v, col) { // out of (⊙, v>0) or into (⊗, v<0) the page
      var r = 2 + 6 * Math.min(1, Math.abs(v)); if (Math.abs(v) < 0.08) return; g.strokeStyle = col; g.lineWidth = 1.3; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.stroke();
      if (v > 0) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 1.6, 0, 2 * Math.PI); g.fill(); } else { var q = r * 0.62; g.beginPath(); g.moveTo(x - q, y - q); g.lineTo(x + q, y + q); g.moveTo(x + q, y - q); g.lineTo(x - q, y + q); g.stroke(); }
    };
    var panel = function (y0, h, ys, title, sub) {
      // dielectric above ys, metal below
      g.fillStyle = '#12233a'; g.fillRect(20, y0, W - 40, ys - y0); g.fillStyle = '#3d2f12'; g.fillRect(20, ys, W - 40, y0 + h - ys);
      g.strokeStyle = C.au; g.lineWidth = 1.5; g.beginPath(); g.moveTo(20, ys); g.lineTo(W - 20, ys); g.stroke();
      g.fillStyle = C.text; g.font = '600 14px "IBM Plex Sans", sans-serif'; g.textAlign = 'left'; g.fillText(title, 30, y0 + 20);
      g.fillStyle = C.text2; g.font = '12px "IBM Plex Mono", monospace'; g.fillText(sub, 30, y0 + 37);
      g.fillStyle = C.text3; g.textAlign = 'right'; g.fillText('water (ε_d > 0)', W - 30, y0 + 20); g.fillText('gold (ε_m < 0)', W - 30, y0 + h - 8);
    };
    var draw = function () {
      if (!P.L) return; g.clearRect(0, 0, W, H); var ph = 2 * Math.PI * 0.5 * t;   // half a cycle per second of animation
      var x0 = 40, x1 = W - 40, span = 2 * P.lsp, X = function (xn) { return x0 + (x1 - x0) * xn / span; };
      // ── TM panel: the surface plasmon polariton ──
      var y0 = 8, h = 262, ys = y0 + 190, zd = 2.2 * P.dd, zm = 3 * P.dm, sd = (ys - y0 - 48) / zd, sm = (y0 + h - ys - 6) / zm;
      panel(y0, h, ys, 'TM (p): a bound surface plasmon polariton', 'E in the plane of the page (arrows), H out of the page (⊙ / ⊗), charges at the surface');
      var kx = 2 * Math.PI / P.lsp, cols = 26;
      for (var i = 0; i < cols; i++) {
        var xn = (i + 0.5) * span / cols, phi = kx * xn - ph, X0 = X(xn);
        for (var j = 0; j < 5; j++) {   // water side
          var z = (j + 0.35) * zd / 5, f = Math.exp(-2 * Math.PI / P.L * P.kd * z), Ex = -(P.kd / P.ed) * Math.sin(phi) * f, Ez = -(P.n / P.ed) * Math.cos(phi) * f, s = 30;
          arrow(X0, ys - z * sd, Ex * s, -Ez * s, C.cyan, 1.5);
          if (j === 2) dotSym(X0, ys - z * sd - 14, Math.cos(phi) * f, 'rgba(226,86,110,.75)');
        }
        for (var k = 0; k < 2; k++) {   // metal side (stretched for visibility)
          var zz = (k + 0.5) * zm / 2, fm = Math.exp(-2 * Math.PI / P.L * P.km * zz), Exm = -(P.kd / P.ed) * Math.sin(phi) * fm, Ezm = -(P.n / P.e[0]) * Math.cos(phi) * fm;
          arrow(X0, ys + zz * sm, Exm * 30, -Ezm * 30, '#ffd27a', 1.5);
        }
        // surface charge ∝ −cos φ
        var sg = -Math.cos(phi); if (Math.abs(sg) > 0.35) { g.fillStyle = sg > 0 ? '#ff8a9c' : '#7fd3ff'; g.font = '700 15px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillText(sg > 0 ? '+' : '−', X0, ys + 5 + (sg > 0 ? 0 : 0)); }
      }
      g.fillStyle = C.text3; g.font = '11px "IBM Plex Mono", monospace'; g.textAlign = 'left';
      g.fillText('→ travels along the surface, λ_sp = ' + Math.round(P.lsp) + ' nm', 30, ys + 44);
      g.fillText('shown: ' + Math.round(zd) + ' nm of water above, ' + Math.round(zm) + ' nm of gold below (stretched)', 30, ys + 60);
      // ── TE panel: light is simply reflected ──
      var y1 = 284, h1 = 178, ys1 = y1 + 140;
      panel(y1, h1, ys1, 'TE (s): E parallel to the surface — no surface charge, no plasmon', 'E out of / into the page (⊙ / ⊗): reflected, standing wave with a node at the metal');
      var kxe = 2 * Math.PI / P.lsp * 0.8, kz = 2 * Math.PI / P.L * 1.2;
      for (var i2 = 0; i2 < cols; i2++) {
        var xn2 = (i2 + 0.5) * span / cols, phi2 = kxe * xn2 - ph;
        for (var j2 = 0; j2 < 4; j2++) { var z2 = (j2 + 0.5) * 100, amp = Math.sin(kz * z2 / 1) * Math.cos(phi2); dotSym(X(xn2), ys1 - 10 - j2 * 24, amp, C.cyan); }
        g.fillStyle = C.text3; g.font = '12px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillText('·', X(xn2), ys1 + 6);
      }
      g.fillStyle = C.text2; g.textAlign = 'left'; g.font = '12px "IBM Plex Mono", monospace'; g.fillText('surface charge σ = 0 everywhere: nothing for a surface wave to hold on to', 30, y1 + h1 - 12);
    };
    var loop = VL.loop(fig, function (dt) { t += dt; draw(); });
    VL.playButton(ctl, loop);
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 550, max: 1500, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: function () { setup(); draw(); } });
    setup(); draw();
  };

  /* ═══ 3. how far the plasmon reaches and how far it travels ═══ */
  F.sppprops = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var props = function (m, md, L) {
      var e = epsM(m, L), nd = nMed(md, L), ed = nd * nd, ns = nsp(e, ed), kd = kap(ns, [ed, 0]), km = kap(ns, e), k0 = 2 * Math.PI / L;
      return { e: e, nd: nd, n: ns, Lsp: 1 / (2 * k0 * ns[1]), dd: 1 / (k0 * kd[0]), dm: 1 / (k0 * km[0]) };
    };
    var draw = function () {
      var m = met.get(), md = med.get(), L = lam.get(), ls = VL.linspace(500, 1600, 220).filter(function (l) { var e = epsM(m, l), n = nMed(md, l); return e[0] < -n * n && e[1] < 0.5 * Math.abs(e[0]); });
      var S = function (key, sc) { return ls.map(function (l) { return [l, props(m, md, l)[key] * (sc || 1)]; }); }, p = props(m, md, L);
      plot.innerHTML = VL.plot({ id: 'sppp', label: 'Penetration depths and propagation length', w: 720, h: 340, x: { min: 500, max: 1600, label: 'Wavelength (nm)' }, y: { min: 5, max: 3e6, log: true, label: 'Length (nm)' },
        series: [{ data: S('Lsp'), color: C.green, width: 2.6, label: 'propagation length L_sp (1/e intensity)' }, { data: S('dd'), color: C.cyan, width: 2.4, label: 'reach into the dielectric δ_d' }, { data: S('dm'), color: MET[m].col, width: 2.4, label: 'reach into the metal δ_m' }],
        hlines: [{ y: 1000, color: C.text3, dash: '2 4', label: '1 µm' }], marks: [{ x: L, y: p.Lsp, color: C.green }, { x: L, y: p.dd, color: C.cyan }, { x: L, y: p.dm, color: MET[m].col }], vlines: [{ x: L, color: C.text3, dash: '2 4' }], legend: true, legendX: 330, legendY: 196 });
      read.innerHTML = '<div><b>' + (p.Lsp / 1000).toPrecision(3) + ' µm</b><span>L_sp = 1 / (2 Im k_sp): distance over which its intensity falls to 1/e</span></div><div><b>' + p.dd.toFixed(0) + ' nm</b><span>δ_d: field falls to 1/e into the ' + (md === 'air' ? 'air' : 'water') + '</span></div><div><b>' + p.dm.toFixed(1) + ' nm</b><span>δ_m: field falls to 1/e into the metal</span></div><div><b>' + p.n[0].toFixed(4) + '</b><span>n_sp, compared with ' + p.nd.toFixed(4) + ' for light in the dielectric</span></div><div><b>' + (100 * (p.n[0] / p.nd - 1)).toFixed(2) + ' %</b><span>extra momentum the plasmon carries over light</span></div>';
    };
    var met = VL.select(ctl, { label: 'Metal', value: 'Au', options: metalOpts, on: draw });
    var med = VL.select(ctl, { label: 'Dielectric', value: 'water', options: mediumOpts, on: draw });
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 550, max: 1600, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 4. dispersion: why light cannot couple directly ═══ */
  F.disp = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var hc = 1239.84;
    var draw = function () {
      var m = met.get(), md = med.get(), pr = prism.get(), th = ang.get(), ls = VL.logspace(380, 1900, 220);
      var spp = [], light = [], plin = [], cross = null, prev = null;
      ls.forEach(function (l) {
        var e = epsM(m, l), nd = nMed(md, l), E = hc / l, k0 = 2 * Math.PI / l * 1000;   // µm⁻¹
        var good = e[0] < -nd * nd && e[1] < 0.5 * Math.abs(e[0]);
        if (good) spp.push([nsp(e, nd * nd)[0] * k0, E]);
        light.push([nd * k0, E]); var kp = nGlass(pr, l) * Math.sin(th * D2R) * k0; plin.push([kp, E]);
        if (good) { var d = nGlass(pr, l) * Math.sin(th * D2R) - nsp(e, nd * nd)[0]; if (prev && prev.d * d <= 0 && !cross) cross = { l: l, E: E, k: kp }; prev = { d: d }; }
      });
      plot.innerHTML = VL.plot({ id: 'disp', label: 'Dispersion of the surface plasmon and of light', w: 720, h: 360, x: { min: 0, max: 40, label: 'In-plane wavevector k_x (µm⁻¹)' }, y: { min: 0.6, max: 3.3, label: 'Photon energy ħω (eV)' },
        series: [{ data: spp, color: MET[m].col, width: 2.8, label: 'surface plasmon k_sp' }, { data: light, color: C.text2, width: 1.6, dash: '5 4', label: 'light in the ' + (md === 'air' ? 'air' : 'water') + ' (grazing, k = n_d k₀)' }, { data: plin, color: C.cyan, width: 2.2, label: 'light in the prism at ' + th + '°: n_p k₀ sin θ' }],
        bands: [], marks: cross ? [{ x: cross.k, y: cross.E, color: '#fff', label: 'resonance at ' + Math.round(cross.l) + ' nm', dx: 10, dy: 14 }] : [], legend: true, legendX: 300, legendY: 210 });
      read.innerHTML = '<div><b>never</b><span>the plasmon curve and the light line in the ' + (md === 'air' ? 'air' : 'water') + ' do not cross</span></div><div><b>' + (cross ? Math.round(cross.l) + ' nm' : 'no crossing') + '</b><span>where the prism line meets the plasmon (' + GLASS[pr].name + ', ' + th + '°)</span></div><div><b>' + (cross ? (hc / cross.l).toFixed(3) + ' eV' : '—') + '</b><span>photon energy of that resonance</span></div>';
    };
    var met = VL.select(ctl, { label: 'Metal', value: 'Au', options: metalOpts, on: draw });
    var med = VL.select(ctl, { label: 'Dielectric', value: 'water', options: mediumOpts, on: draw });
    var prism = VL.select(ctl, { label: 'Prism', value: 'BK7', options: [['BK7', 'N-BK7 glass'], ['SF10', 'SF10 glass']], on: draw });
    var ang = VL.slider(ctl, { label: 'Angle in the prism', min: 40, max: 89, step: 0.2, value: 70, fmt: function (v) { return v.toFixed(1) + '°'; }, on: draw });
    draw();
  };

  /* ═══ 5. the momentum ledger: four ways to give light the missing k_x ═══ */
  F.kmatch = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), box = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var mth = how.get(), L = lam.get(), e = epsM('Au', L), nd = nWater(L) + dn.get(), ns = nsp(e, nd * nd), th = ang.get(), lo = 0.9, hi = 1.9;
      show(ang, true); show(per, mth === 'grating'); show(ord, mth === 'grating'); show(nco, mth === 'fibre');
      var parts = [], label = '';
      if (mth === 'direct') { parts = [[nd * Math.sin(th * D2R), C.text2, 'n_d sin θ']]; label = 'light arriving from the water'; }
      var ceil = null;
      if (mth === 'prism') { var np = nGlass('BK7', L); ceil = [np, 'n_p: the most a prism can give']; parts = [[np * Math.sin(th * D2R), C.cyan, 'n_p sin θ']]; label = 'light totally reflected in a BK7 prism (n_p = ' + np.toFixed(4) + ')'; }
      if (mth === 'grating') { var m = +ord.get(), G = m * L / per.get(); parts = [[nd * Math.sin(th * D2R), C.text2, 'n_d sin θ'], [G, C.violet, (m > 0 ? '+' : '') + m + ' λ/Λ']]; label = 'light diffracted by a grating of period ' + per.get() + ' nm'; }
      if (mth === 'fibre') { var nc = nco.get(); parts = [[nc * Math.sin(th * D2R), C.green, 'n_core sin θ']]; label = 'a ray in a fibre core (or waveguide) striking the gold at θ'; }
      var tot = parts.reduce(function (a, p) { return a + p[0]; }, 0), Wd = 860, Hd = 230, L0 = 40, R0 = 20, pw = Wd - L0 - R0, X = function (v) { return L0 + (v - lo) / (hi - lo) * pw; };
      var s = '<svg viewBox="0 0 ' + Wd + ' ' + Hd + '" class="plot" role="img" aria-label="Momentum matching on a k-axis">';
      s += '<rect x="' + L0 + '" y="40" width="' + (X(nd) - L0) + '" height="120" fill="' + C.text3 + '" opacity=".10"/><text x="' + (L0 + 6) + '" y="56" class="pl-note" fill="' + C.text2 + '">reachable by light in the water (k_x ≤ n_d k₀)</text>';
      for (var v = 1.0; v <= 1.9001; v += 0.1) s += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="160" y2="166" stroke="' + C.axis + '"/><text x="' + X(v) + '" y="182" class="pl-tick" text-anchor="middle">' + v.toFixed(1) + '</text>';
      s += '<line x1="' + L0 + '" x2="' + (Wd - R0) + '" y1="160" y2="160" stroke="' + C.axis + '"/><text x="' + (L0 + pw / 2) + '" y="210" class="pl-label" text-anchor="middle">In-plane wavevector k_x in units of k₀ = 2π/λ (an "effective index")</text>';
      if (ceil) s += '<line x1="' + X(ceil[0]) + '" x2="' + X(ceil[0]) + '" y1="64" y2="160" stroke="' + C.cyan + '" stroke-dasharray="6 4" opacity=".7"/><text x="' + (X(ceil[0]) + 5) + '" y="150" class="pl-note" fill="' + C.cyan + '">' + ceil[1] + '</text>';
      var xs = X(ns[0]), wdt = Math.max(2, (X(ns[0] + ns[1]) - X(ns[0] - ns[1])));
      s += '<rect x="' + (xs - wdt / 2) + '" y="40" width="' + wdt + '" height="120" fill="' + C.au + '" opacity=".25"/><line x1="' + xs + '" x2="' + xs + '" y1="34" y2="160" stroke="' + C.au + '" stroke-width="2.4"/><text x="' + (xs + 6) + '" y="34" class="pl-note" fill="' + C.au + '">surface plasmon n_sp = ' + ns[0].toFixed(4) + ' (band: its width, Im n_sp)</text>';
      var y = 92, x = 0; parts.forEach(function (p, i) { var xa = X(Math.max(lo, x)), xb = X(x + p[0]); s += '<line x1="' + xa + '" x2="' + xb + '" y1="' + (y + i * 26) + '" y2="' + (y + i * 26) + '" stroke="' + p[1] + '" stroke-width="5" stroke-linecap="round"/><path d="M' + xb + ' ' + (y + i * 26) + ' l-10 -6 v12 z" fill="' + p[1] + '"/><text x="' + ((xa + xb) / 2) + '" y="' + (y + i * 26 - 9) + '" class="pl-note" text-anchor="middle" fill="' + p[1] + '">' + p[2] + ' = ' + p[0].toFixed(4) + '</text>'; x += p[0]; });
      var mis = tot - ns[0], eff = 1 / (1 + Math.pow(mis / ns[1], 2)), ok = Math.abs(mis) < 2 * ns[1];
      s += '<line x1="' + X(tot) + '" x2="' + X(tot) + '" y1="64" y2="160" stroke="' + (ok ? C.green : C.red) + '" stroke-dasharray="3 3" stroke-width="1.6"/>';
      box.innerHTML = s + '</svg>';
      read.innerHTML = '<div><b>' + tot.toFixed(4) + '</b><span>k_x / k₀ supplied by ' + label + '</span></div><div><b>' + (mis > 0 ? '+' : '') + mis.toFixed(4) + '</b><span>mismatch k_x − Re k_sp (units of k₀)</span></div><div><b>' + (100 * eff).toFixed(eff > 0.1 ? 0 : 1) + ' %</b><span>overlap with the plasmon line (1 / (1 + (Δk/Im k_sp)²))</span></div><div><b>' + (ok ? 'coupled' : mth === 'direct' ? 'impossible' : 'not matched') + '</b><span>' + (mth === 'direct' ? 'sin θ ≤ 1 caps light below n_d — always short' : 'adjust the angle to land on the gold line') + '</span></div>';
    };
    var how = VL.select(ctl, { label: 'Light comes', value: 'prism', options: [['direct', 'straight from the water'], ['prism', 'through a prism (Kretschmann)'], ['grating', 'via a grating'], ['fibre', 'inside a fibre or waveguide']], on: function (v) { ang.set({ direct: 60, prism: 72, grating: 5.4, fibre: 82.2 }[v]); } });
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 550, max: 1000, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    var ang = VL.slider(ctl, { label: 'Angle θ', min: 0, max: 89.5, step: 0.1, value: 72, fmt: function (v) { return v.toFixed(1) + '°'; }, on: draw });
    var dn = VL.slider(ctl, { label: 'Analyte Δn', min: 0, max: 0.05, step: 0.001, value: 0, fmt: function (v) { return '+' + v.toFixed(3); }, on: draw });
    var per = VL.slider(ctl, { label: 'Grating period Λ', min: 300, max: 1200, step: 1, value: 480, fmt: function (v) { return v + ' nm'; }, on: draw });
    var ord = VL.select(ctl, { label: 'Diffraction order m', value: '1', options: [['1', '+1'], ['-1', '−1'], ['2', '+2']], on: draw });
    var nco = VL.slider(ctl, { label: 'Core index', min: 1.44, max: 1.9, step: 0.001, value: 1.457, fmt: function (v) { return v.toFixed(3); }, on: draw });
    draw();
  };

  /* ═══ 6. Kretschmann: the full calculation, with a schematic ═══ */
  var kStack = function (o, L, dnA) {
    var np = nGlass(o.prism, L), na = nWater(L) + (dnA || 0), s = [{ eps: re(np) }];
    if (o.cr > 0) s.push({ eps: epsM('Cr', L), d: o.cr });
    if (o.metal === 'AgAu') { s.push({ eps: epsM('Ag', L), d: Math.max(0, o.d - 10) }); s.push({ eps: epsM('Au', L), d: Math.min(10, o.d) }); }
    else s.push({ eps: epsM(o.metal, L), d: o.d });
    s.push({ eps: re(na) }); return s;
  };
  var prismSVG = function (th, Rv, L, opt) {
    opt = opt || {};
    var W = 380, H = 300, cx = 190, ty = 150, col = wl2rgb(L), pl = 1 - Rv;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="Kretschmann configuration schematic">';
    s += '<rect x="20" y="40" width="340" height="' + (ty - 46) + '" fill="#12233a"/><text x="30" y="58" class="pl-note" fill="' + C.cyan + '">' + (opt.top || 'analyte (water + sample)') + '</text>';
    // evanescent / plasmon glow
    s += '<defs><linearGradient id="ev" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + C.au + '" stop-opacity="' + (0.75 * pl).toFixed(3) + '"/><stop offset="1" stop-color="' + C.au + '" stop-opacity="0"/></linearGradient></defs>';
    s += '<rect x="70" y="' + (ty - 60) + '" width="240" height="56" fill="url(#ev)"/>';
    var wp = ''; for (var x = 70; x <= 310; x += 3) wp += (x === 70 ? 'M' : 'L') + x + ' ' + (ty - 9 - 6 * pl * Math.sin((x - 70) / 9)).toFixed(1) + ' ';
    s += '<path d="' + wp + '" fill="none" stroke="#ffe39a" stroke-width="1.6" opacity="' + (0.15 + 0.85 * pl).toFixed(2) + '"/>';
    s += '<rect x="20" y="' + (ty - 5) + '" width="340" height="5" fill="' + (opt.metalCol || C.au) + '"/>';
    // prism (apex down) and the beam: inside the glass up to the side faces, then a short stub outside
    var ay = ty + 100;
    s += '<path d="M40 ' + ty + ' L340 ' + ty + ' L190 ' + ay + ' Z" fill="#2a3a52" stroke="#7d8fb0" stroke-width="1.2" opacity=".95"/><text x="190" y="' + (ay - 14) + '" class="pl-note" fill="' + C.text2 + '" text-anchor="middle">prism</text>';
    var dx = Math.sin(th * D2R), dy = Math.cos(th * D2R), hit = function (sx) { // distance from (cx, ty) along (sx·dx, dy) to the side face
      var tq = 100 / (dy + 100 / 150 * dx); return tq; };
    var Lin = hit(-1), out = 46, p1 = [cx - dx * Lin, ty + dy * Lin], p0 = [p1[0] - dx * out, p1[1] + dy * out], q1 = [cx + dx * Lin, ty + dy * Lin], q0 = [q1[0] + dx * out, q1[1] + dy * out];
    var ln = function (a, b, op) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="3" stroke-linecap="round" opacity="' + op + '"/>'; };
    s += ln(p0, [cx, ty], 1) + ln([cx, ty], q0, Math.max(0.06, Rv).toFixed(3));
    s += '<line x1="' + cx + '" y1="' + (ty + 2) + '" x2="' + cx + '" y2="' + (ty + 52) + '" stroke="' + C.text3 + '" stroke-dasharray="3 3"/>';
    s += '<path d="M' + cx + ' ' + (ty + 34) + ' A34 34 0 0 1 ' + (cx - 34 * dx).toFixed(1) + ' ' + (ty + 34 * dy).toFixed(1) + '" fill="none" stroke="' + C.text + '"/><text x="' + (cx - 40 * Math.sin(th * D2R / 2) - 4).toFixed(1) + '" y="' + (ty + 40 * Math.cos(th * D2R / 2) + 12).toFixed(1) + '" class="pl-note" fill="' + C.text + '" text-anchor="end">θ = ' + th.toFixed(1) + '°</text>';
    s += '<text x="370" y="290" class="pl-note" fill="' + C.text2 + '" text-anchor="end">reflected: R = ' + (100 * Rv).toFixed(1) + ' %</text>';
    s += '<text x="20" y="22" class="pl-note" fill="' + C.au + '">into the plasmon (absorbed): ' + (100 * pl).toFixed(1) + ' %</text>';
    return s + '</svg>';
  };
  F.kret = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), cells = row2(fig), read = VL.part(fig, 'vl-readout'), cache = null, sweep = 0, sweepDir = 1;
    var opts = function () { return { metal: met.get(), d: dm.get(), cr: cr.get(), prism: pr.get() }; };
    var compute = function () {
      var o = opts(), L = lam.get(), dA = dn.get(), np = nGlass(o.prism, L), na = nWater(L) + dA, thc = Math.asin(Math.min(1, na / np)) / D2R;
      var a = Math.max(35, thc - 4), b = 88.5, S0 = kStack(o, L, dA), S1 = kStack(o, L, dA + 0.002);
      var fp = function (t) { return R(S0, L, t, 'p'); }, d0 = dipOf(fp, thc + 0.05, b, 500), d1 = dipOf(function (t) { return R(S1, L, t, 'p'); }, thc + 0.05, b, 500);
      cache = { o: o, L: L, a: a, b: b, S0: S0, thc: thc, dip: d0, w: fwhm(fp, d0.x, d0.v, thc + 0.05, b), sens: (d1.x - d0.x) / 0.002 };
    };
    var draw = function () {
      if (!cache) compute(); var c = cache, th = ang.get(), Rv = R(c.S0, c.L, th, 'p'), ths = VL.linspace(c.a, c.b, 420), pol = pv.get();
      var ser = [{ data: ths.map(function (t) { return [t, R(c.S0, c.L, t, 'p')]; }), color: C.au, width: 2.6, label: 'p (TM) polarised' }];
      if (pol === 'both') ser.push({ data: ths.map(function (t) { return [t, R(c.S0, c.L, t, 's')]; }), color: C.cyan, width: 2, dash: '6 4', label: 's (TE) polarised' });
      cells[1].innerHTML = VL.plot({ id: 'kr', label: 'Reflectance of the Kretschmann prism', w: 560, h: 320, x: { min: c.a, max: c.b, label: 'Angle of incidence in the prism θ (°)' }, y: { min: 0, max: 1.02, label: 'Reflectance R' },
        series: ser, vlines: [{ x: c.thc, color: C.text3, label: 'θ_c', ly: 300 }], marks: [{ x: th, y: Rv, color: '#fff' }], legend: true, legendX: 20, legendY: 200 });
      cells[0].innerHTML = prismSVG(th, Rv, c.L, { metalCol: c.o.metal === 'Ag' ? '#cfd6e4' : C.au });
      read.innerHTML = '<div><b>' + deg(c.thc) + '</b><span>critical angle θ_c for prism → analyte</span></div><div><b>' + deg(c.dip.x, 3) + '</b><span>resonance angle (minimum of R_p)</span></div><div><b>' + (100 * c.dip.v).toFixed(2) + ' %</b><span>reflectance at the minimum</span></div><div><b>' + (isFinite(c.w) ? deg(c.w) : '—') + '</b><span>full width at half depth</span></div><div><b>' + c.sens.toFixed(0) + ' °/RIU</b><span>angular sensitivity dθ/dn (bulk)</span></div><div><b>' + (isFinite(c.w) ? (c.sens / c.w).toFixed(0) + ' RIU⁻¹' : '—') + '</b><span>figure of merit: sensitivity ÷ width</span></div>';
    };
    var upd = function () { cache = null; draw(); };
    var met = VL.select(ctl, { label: 'Metal', value: 'Au', options: [['Au', 'Gold'], ['Ag', 'Silver'], ['AgAu', 'Silver + 10 nm gold cap']], on: upd });
    var dm = VL.slider(ctl, { label: 'Metal thickness', min: 10, max: 90, step: 1, value: 50, fmt: function (v) { return v + ' nm'; }, on: upd });
    var cr = VL.slider(ctl, { label: 'Chromium adhesion layer', min: 0, max: 5, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1) + ' nm'; }, on: upd });
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 550, max: 1000, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: upd });
    var pr = VL.select(ctl, { label: 'Prism', value: 'BK7', options: [['BK7', 'N-BK7'], ['SF10', 'SF10 (high index)']], on: upd });
    var dn = VL.slider(ctl, { label: 'Analyte Δn (over water)', min: 0, max: 0.05, step: 0.0005, value: 0, fmt: function (v) { return '+' + v.toFixed(4); }, on: upd });
    var pv = VL.select(ctl, { label: 'Show', value: 'both', options: [['p', 'p only'], ['both', 'p and s']], on: draw });
    var ang = VL.slider(ctl, { label: 'Beam angle', min: 40, max: 88, step: 0.05, value: 70, fmt: function (v) { return v.toFixed(2) + '°'; }, on: draw });
    var loop = VL.loop(fig, function (dt) { if (!cache || !dt) return; var v = ang.get() + sweepDir * dt * 3; if (v > cache.b) { v = cache.b; sweepDir = -1; } if (v < cache.a) { v = cache.a; sweepDir = 1; } ang.input.value = v; ang.input.parentNode.querySelector('output').textContent = v.toFixed(2) + '°'; draw(); });
    loop.pause(); var pb = VL.button(ctl, 'Sweep the angle', function () { pb.textContent = loop.toggle() ? 'Stop sweep' : 'Sweep the angle'; });
    draw();
  };

  /* ═══ 7. metal thickness: critical coupling ═══ */
  F.thick = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), plot2 = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var m = met.get(), L = lam.get(), np = nGlass('BK7', L), na = nWater(L), thc = Math.asin(na / np) / D2R, a = thc - 2, b = 88.5;
      var ds = [30, 40, 50, 60, 70], cols = ['#6b5a2a', '#9c7d2c', C.au, '#ffd27a', '#fff3c4'], ths = VL.linspace(a, b, 360);
      var st = function (d) { return [{ eps: re(np) }, { eps: epsM(m, L), d: d }, { eps: re(na) }]; };
      plot.innerHTML = VL.plot({ id: 'thk', label: 'Reflectance for different metal thicknesses', w: 720, h: 300, x: { min: a, max: b, label: 'Angle in the prism (°)' }, y: { min: 0, max: 1.02, label: 'Reflectance R_p' },
        series: ds.map(function (d, i) { var S = st(d); return { data: ths.map(function (t) { return [t, R(S, L, t)]; }), color: cols[i], width: d === 50 ? 2.8 : 1.8, label: d + ' nm' }; }), legend: true, legendX: 20, legendY: 150 });
      var dd = VL.linspace(10, 90, 41), rmin = [], wid = [], best = { d: 0, v: 9 };
      dd.forEach(function (d) { var S = st(d), f = function (t) { return R(S, L, t); }, q = dipOf(f, thc + 0.05, b, 300); rmin.push([d, q.v]); var w = fwhm(f, q.x, q.v, thc + 0.05, b); wid.push([d, isFinite(w) ? w / 10 : NaN]); if (q.v < best.v) best = { d: d, v: q.v }; });
      plot2.innerHTML = VL.plot({ id: 'thk2', label: 'Dip depth and width versus thickness', w: 720, h: 260, x: { min: 10, max: 90, label: 'Metal thickness (nm)' }, y: { min: 0, max: 1, label: 'R_min  ·  width / 10°' },
        series: [{ data: rmin, color: C.au, width: 2.6, label: 'minimum reflectance R_min' }, { data: wid, color: C.cyan, width: 2.2, dash: '6 4', label: 'full width at half depth (degrees ÷ 10)' }], vlines: [{ x: best.d, color: C.green, label: 'critical coupling ≈ ' + best.d + ' nm' }], legend: true, legendX: 14, legendY: 150 });
      read.innerHTML = '<div><b>' + best.d + ' nm</b><span>' + MET[m].name.toLowerCase() + ' thickness that makes the dip reach (nearly) zero at ' + L + ' nm</span></div><div><b>thinner</b><span>radiation back into the prism dominates: broad, shallow dip</span></div><div><b>thicker</b><span>light barely tunnels through: narrow but shallow dip</span></div>';
    };
    var met = VL.select(ctl, { label: 'Metal', value: 'Au', options: metalOpts, on: draw });
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 550, max: 1000, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 8. Otto: a gap instead of a thin film ═══ */
  F.otto = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var m = met.get(), L = lam.get(), np = nGlass(pr.get(), L), gm = gap.get(), ng = gm === 'air' ? 1.0003 : nWater(L), thc = Math.asin(Math.min(1, ng / np)) / D2R, a = thc - 1, b = Math.min(89.5, thc + 9);
      var st = function (g) { return [{ eps: re(np) }, { eps: re(ng), d: g }, { eps: epsM(m, L) }]; }, gv = gw.get(), ths = VL.linspace(a, b, 400);
      var fam = [Math.round(gv * 0.5), Math.round(gv * 1.6)].map(function (g, i) { var S = st(g); return { data: ths.map(function (t) { return [t, R(S, L, t)]; }), color: i ? '#8fe0ef' : '#2f6f7d', width: 1.5, dash: '5 4', label: 'gap ' + g + ' nm' }; });
      var S0 = st(gv), f = function (t) { return R(S0, L, t); }, q = dipOf(f, thc + 0.02, b, 400), w = fwhm(f, q.x, q.v, thc + 0.02, b);
      plot.innerHTML = VL.plot({ id: 'otto', label: 'Otto configuration reflectance', w: 720, h: 320, x: { min: a, max: b, label: 'Angle in the prism (°)' }, y: { min: 0, max: 1.02, label: 'Reflectance R_p' },
        series: [{ data: ths.map(function (t) { return [t, f(t)]; }), color: C.cyan, width: 2.8, label: 'gap ' + gv + ' nm' }].concat(fam), vlines: [{ x: thc, color: C.text3, label: 'θ_c' }], legend: true, legendX: 380, legendY: 170 });
      var best = { g: 0, v: 9 }; for (var g = 100; g <= 3000; g += 25) { var Sg = st(g), qq = dipOf(function (t) { return R(Sg, L, t); }, thc + 0.02, b, 160); if (qq.v < best.v) best = { g: g, v: qq.v }; }
      read.innerHTML = '<div><b>' + deg(q.x, 2) + '</b><span>resonance angle</span></div><div><b>' + (100 * q.v).toFixed(1) + ' %</b><span>minimum reflectance</span></div><div><b>' + (isFinite(w) ? deg(w) : '—') + '</b><span>full width at half depth</span></div><div><b>≈ ' + best.g + ' nm</b><span>gap for critical coupling (deepest dip)</span></div>';
    };
    var met = VL.select(ctl, { label: 'Metal (thick)', value: 'Ag', options: metalOpts, on: draw });
    var gap = VL.select(ctl, { label: 'Gap filled with', value: 'air', options: [['air', 'air'], ['water', 'water']], on: draw });
    var pr = VL.select(ctl, { label: 'Prism', value: 'SF10', options: [['BK7', 'N-BK7'], ['SF10', 'SF10']], on: draw });
    var gw = VL.slider(ctl, { label: 'Gap thickness', min: 100, max: 2500, step: 10, value: 800, fmt: function (v) { return v + ' nm'; }, on: draw });
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 550, max: 1000, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 9. four ways to read the resonance ═══ */
  F.interrog = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var o = { metal: 'Au', d: 50, cr: 0, prism: 'BK7' };
    var draw = function () {
      var md = mode.get(), dA = dn.get(), th = ang.get(), L = lam.get();
      show(ang, md !== 'angle'); show(lam, md !== 'wave');
      var S0 = function (l) { return kStack(o, l, 0); }, S1 = function (l) { return kStack(o, l, dA); }, sv = '', rd = '';
      if (md === 'angle') {
        var ths = VL.linspace(62, 82, 400), f0 = function (t) { return R(S0(L), L, t); }, f1 = function (t) { return R(S1(L), L, t); }, a0 = dipOf(f0, 62, 82), a1 = dipOf(f1, 62, 82);
        sv = VL.plot({ id: 'int', label: 'Angular interrogation', w: 720, h: 320, x: { min: 62, max: 82, label: 'Angle (°) at a fixed wavelength of ' + L + ' nm' }, y: { min: 0, max: 1.02, label: 'R_p' }, series: [{ data: ths.map(function (t) { return [t, f0(t)]; }), color: C.au, width: 2.4, label: 'water' }, { data: ths.map(function (t) { return [t, f1(t)]; }), color: C.cyan, width: 2.4, dash: '6 4', label: 'water + Δn' }], marks: [{ x: a0.x, y: a0.v, color: C.au }, { x: a1.x, y: a1.v, color: C.cyan }], legend: true, legendX: 20, legendY: 200 });
        rd = '<div><b>' + ((a1.x - a0.x) * 1000).toFixed(1) + ' m°</b><span>shift of the dip</span></div><div><b>' + (dA ? ((a1.x - a0.x) / dA).toFixed(0) + ' °/RIU' : '—') + '</b><span>angular sensitivity</span></div><div><b>angle</b><span>monochromatic laser or LED, a fan of angles onto a detector array</span></div>';
      } else if (md === 'wave') {
        var ls = VL.linspace(520, 1000, 400), g0 = function (l) { return R(S0(l), l, th); }, g1 = function (l) { return R(S1(l), l, th); }, b0 = dipOf(g0, 520, 1000), b1 = dipOf(g1, 520, 1000);
        sv = VL.plot({ id: 'int', label: 'Wavelength interrogation', w: 720, h: 320, x: { min: 520, max: 1000, label: 'Wavelength (nm) at a fixed angle of ' + th.toFixed(1) + '°' }, y: { min: 0, max: 1.02, label: 'R_p' }, series: [{ data: ls.map(function (l) { return [l, g0(l)]; }), color: C.au, width: 2.4, label: 'water' }, { data: ls.map(function (l) { return [l, g1(l)]; }), color: C.cyan, width: 2.4, dash: '6 4', label: 'water + Δn' }], marks: [{ x: b0.x, y: b0.v, color: C.au }, { x: b1.x, y: b1.v, color: C.cyan }], legend: true, legendX: 20, legendY: 200 });
        rd = '<div><b>' + (b1.x - b0.x).toFixed(2) + ' nm</b><span>shift of the dip</span></div><div><b>' + (dA ? ((b1.x - b0.x) / dA).toFixed(0) + ' nm/RIU' : '—') + '</b><span>spectral sensitivity</span></div><div><b>wavelength</b><span>white light at one angle, a spectrometer</span></div>';
      } else if (md === 'intensity') {
        var ns = VL.linspace(0, 0.02, 200), h = function (d) { return R(kStack(o, L, d), L, th); }, sl = (h(0.0005) - h(0)) / 0.0005;
        sv = VL.plot({ id: 'int', label: 'Intensity interrogation', w: 720, h: 320, x: { min: 0, max: 0.02, label: 'Refractive-index change Δn (fixed angle ' + th.toFixed(2) + '° and wavelength ' + L + ' nm)' }, y: { min: 0, max: 1.02, label: 'R_p' }, series: [{ data: ns.map(function (d) { return [d, h(d)]; }), color: C.au, width: 2.6, label: 'reflected intensity' }], marks: [{ x: dA, y: h(dA), color: C.cyan, label: 'Δn = ' + dA.toFixed(4), dx: 10 }], legend: true, legendX: 20, legendY: 30 });
        rd = '<div><b>' + (100 * h(0)).toFixed(2) + ' %</b><span>reflectance with water</span></div><div><b>' + (100 * (h(dA) - h(0))).toFixed(2) + ' %</b><span>change for this Δn</span></div><div><b>' + sl.toFixed(1) + ' / RIU</b><span>slope dR/dn at the working point (linear only over a small range)</span></div>';
      } else {
        var tp = VL.linspace(66, 76, 500), ph = function (S, t) { return carg(rTMM(S, L, t, 'p')) / D2R; }, Sa = kStack(o, L, 0), Sb = kStack(o, L, dA), mk = function (S) { var out = [], off = 0, prev = null; tp.forEach(function (t) { var v = ph(S, t); if (prev != null) { if (v - prev > 180) off -= 360; if (v - prev < -180) off += 360; } prev = v; out.push([t, v + off]); }); var s0 = out[0][1]; return out.map(function (q) { return [q[0], q[1] - s0]; }); };
        var ra = mk(Sa), rb = mk(Sb), steep = 0, at = 0; for (var i = 1; i < ra.length; i++) { var sl2 = Math.abs((ra[i][1] - ra[i - 1][1]) / (ra[i][0] - ra[i - 1][0])); if (sl2 > steep) { steep = sl2; at = ra[i][0]; } }
        var pa = ph(Sa, th), pb = ph(Sb, th), dph = ((pb - pa + 540) % 360) - 180;
        sv = VL.plot({ id: 'int', label: 'Phase interrogation', w: 720, h: 320, x: { min: 66, max: 76, label: 'Angle (°) at ' + L + ' nm · gold ' + o.d + ' nm' }, y: (function () { var all = ra.concat(rb).map(function (q) { return q[1]; }), lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pad = 0.1 * (hi - lo || 1); return { min: Math.floor((lo - pad) / 10) * 10, max: Math.ceil((hi + pad) / 10) * 10, label: 'Phase of r_p, relative (°)' }; })(), series: [{ data: ra, color: C.au, width: 2.4, label: 'water' }, { data: rb, color: C.cyan, width: 2.2, dash: '6 4', label: 'water + Δn' }], vlines: [{ x: th, color: C.text3 }], legend: true, legendX: 20, legendY: 210 });
        rd = '<div><b>' + dph.toFixed(2) + '°</b><span>phase change at θ = ' + th.toFixed(2) + '°</span></div><div><b>' + (dA ? (dph / dA).toExponential(2) + ' °/RIU' : '—') + '</b><span>phase sensitivity at that angle</span></div><div><b>' + steep.toFixed(0) + ' °/° at ' + at.toFixed(2) + '°</b><span>steepest phase slope; it grows sharply as the dip deepens towards zero</span></div>';
      }
      plot.innerHTML = sv; read.innerHTML = rd;
    };
    var mode = VL.select(ctl, { label: 'Interrogation', value: 'angle', options: [['angle', 'angle'], ['wave', 'wavelength'], ['intensity', 'intensity'], ['phase', 'phase']], on: function () { if (mode.get() === 'intensity') ang.set(70.3); else if (mode.get() === 'phase') ang.set(72.0); else if (mode.get() === 'wave') ang.set(70); else draw(); } });
    var dn = VL.slider(ctl, { label: 'Analyte Δn', min: 0, max: 0.01, step: 0.0001, value: 0.003, fmt: function (v) { return '+' + v.toFixed(4); }, on: draw });
    var ang = VL.slider(ctl, { label: 'Fixed angle', min: 64, max: 80, step: 0.01, value: 70, fmt: function (v) { return v.toFixed(2) + '°'; }, on: draw });
    var lam = VL.slider(ctl, { label: 'Fixed wavelength', min: 600, max: 900, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 10. sensitivity and figure of merit versus wavelength (prism coupling) ═══ */
  F.sens = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), plot2 = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    // from phase matching: n_p(λ) sin θ = Re n_sp(λ, n)
    var nsR = function (m, l, n) { return nsp(epsM(m, l), n * n)[0]; };
    var angS = function (m, l) { var n = nWater(l), np = nGlass('BK7', l), s = function (dn) { return Math.asin(Math.min(1, nsR(m, l, n + dn) / np)) / D2R; }; return (s(0.001) - s(0)) / 0.001; };
    var wavS = function (m, l) { var n = nWater(l), np = nGlass('BK7', l), th = Math.asin(nsR(m, l, n) / np), f = function (L, dn) { return nsR(m, L, nWater(L) + dn) - nGlass('BK7', L) * Math.sin(th); }; var dfdn = (f(l, 0.001) - f(l, 0)) / 0.001, dfdl = (f(l + 0.5, 0) - f(l - 0.5, 0)) / 1; return -dfdn / dfdl; };
    var fom = function (m, l) { var n = nWater(l), np = nGlass('BK7', l), ns = nsp(epsM(m, l), n * n), th = Math.asin(ns[0] / np), w = 4 * ns[1] / (np * Math.cos(th)) / D2R; return { w: w, f: angS(m, l) / w }; };
    var draw = function () {
      var ls = VL.linspace(600, 1600, 140), L = lam.get();
      plot.innerHTML = VL.plot({ id: 'sens1', label: 'Angular sensitivity', w: 720, h: 260, x: { min: 600, max: 1600, label: 'Wavelength (nm)' }, y: { min: 0, max: 250, label: 'dθ/dn (°/RIU)' },
        series: [{ data: ls.map(function (l) { return [l, angS('Au', l)]; }), color: C.au, width: 2.4, label: 'gold, angular' }, { data: ls.map(function (l) { return [l, angS('Ag', l)]; }), color: '#cfd6e4', width: 2.2, dash: '6 4', label: 'silver, angular' }], vlines: [{ x: L, color: C.text3 }], legend: true, legendX: 380, legendY: 20 });
      plot2.innerHTML = VL.plot({ id: 'sens2', label: 'Spectral sensitivity', w: 720, h: 260, x: { min: 600, max: 1600, label: 'Resonance wavelength (nm)' }, y: { min: 300, max: 60000, log: true, label: 'dλ/dn (nm/RIU)' },
        series: [{ data: ls.map(function (l) { return [l, wavS('Au', l)]; }), color: C.au, width: 2.4, label: 'gold, wavelength' }, { data: ls.map(function (l) { return [l, wavS('Ag', l)]; }), color: '#cfd6e4', width: 2.2, dash: '6 4', label: 'silver, wavelength' }], vlines: [{ x: L, color: C.text3 }], legend: true, legendX: 20, legendY: 20 });
      var fa = fom('Au', L), fs = fom('Ag', L);
      read.innerHTML = '<div><b>' + angS('Au', L).toFixed(0) + ' / ' + angS('Ag', L).toFixed(0) + ' °/RIU</b><span>angular sensitivity at ' + L + ' nm (gold / silver)</span></div><div><b>' + Math.round(wavS('Au', L)) + ' / ' + Math.round(wavS('Ag', L)) + ' nm/RIU</b><span>spectral sensitivity at ' + L + ' nm (gold / silver)</span></div><div><b>' + fa.w.toFixed(2) + '° / ' + fs.w.toFixed(2) + '°</b><span>dip width at critical coupling, 4 Im n_sp / (n_p cos θ)</span></div><div><b>' + fa.f.toFixed(0) + ' / ' + fs.f.toFixed(0) + ' RIU⁻¹</b><span>figure of merit, sensitivity ÷ width (gold / silver)</span></div>';
    };
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 600, max: 1600, step: 1, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 11. bulk versus surface: what a thin layer does ═══ */
  F.surf = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout'), memo = {};
    var curve = function (L) {
      if (memo[L]) return memo[L];
      var np = nGlass('BK7', L), nw = nWater(L), d = VL.linspace(0, 600, 31), ns = nsp(epsM('Au', L), nw * nw), dd = 1 / (2 * Math.PI / L * kap(ns, [nw * nw, 0])[0]);
      var thc = Math.asin(nw / np) / D2R, DN = 0.005, dipS = function (S) { return dipOf(function (x) { return R(S, L, x); }, thc + 0.05, 89, 300).x; };
      var dip = function (t) { return dipS([{ eps: re(np) }, { eps: epsM('Au', L), d: 50 }, { eps: re(nw + DN), d: t }, { eps: re(nw) }]); };
      var base = dip(0), bulk = (dipS([{ eps: re(np) }, { eps: epsM('Au', L), d: 50 }, { eps: re(nw + 0.001) }]) - base) / 0.001 * DN;
      memo[L] = { dd: dd, pts: d.map(function (t) { return [t, (dip(t) - base) / bulk]; }) }; return memo[L];
    };
    var draw = function () {
      var t = lay.get(), Ls = [633, 850, 1000], cols = [C.red, C.cyan, C.violet], ser = [], rd = '';
      Ls.forEach(function (L, i) { var c = curve(L), xs = VL.linspace(0, 600, 120); ser.push({ data: c.pts, color: cols[i], width: 2.6, label: L + ' nm, exact (δ_d = ' + c.dd.toFixed(0) + ' nm)' }); ser.push({ data: xs.map(function (x) { return [x, 1 - Math.exp(-2 * x / c.dd)]; }), color: cols[i], width: 1.2, dash: '3 4' });
        var y = 0; for (var k = 1; k < c.pts.length; k++) if (c.pts[k][0] >= t) { var p0 = c.pts[k - 1], p1 = c.pts[k]; y = p0[1] + (p1[1] - p0[1]) * (t - p0[0]) / (p1[0] - p0[0]); break; } rd += '<div><b>' + (100 * y).toFixed(1) + ' %</b><span>of the bulk shift from a ' + t + ' nm layer at ' + L + ' nm</span></div>'; });
      plot.innerHTML = VL.plot({ id: 'surf', label: 'Response to a thin layer, as a fraction of the bulk response', w: 720, h: 330, x: { min: 0, max: 600, label: 'Thickness of a layer 0.005 above water in index (nm)' }, y: { min: 0, max: 1.05, label: 'Shift ÷ shift for an infinitely thick layer' }, series: ser, vlines: [{ x: t, color: C.text3 }], legend: true, legendX: 330, legendY: 190 });
      read.innerHTML = rd + '<div><b>dashed</b><span>the estimate 1 − exp(−2d/δ_d)</span></div>';
    };
    var lay = VL.slider(ctl, { label: 'Layer thickness', min: 0, max: 600, step: 1, value: 10, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 12. grating coupling ═══ */
  F.grating = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), cells = row2(fig), plot2 = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var nsR = function (m, l, n) { return nsp(epsM(m, l), n * n); };
    // resonance wavelengths for order m on the branch  m λ/Λ = s·n_sp − n_d sin θ
    var roots = function (m, Lam, th, dn) {
      var mt = met.get(), lmin = mt === 'Au' ? 540 : 400, out = []; [1, -1].forEach(function (s) { var f = function (l) { var n = nWater(l) + dn; return m * l / Lam - (s * nsR(mt, l, n)[0] - n * Math.sin(th * D2R)); }; var prev = f(lmin), pl = lmin; for (var l = lmin + 5; l <= 1600; l += 5) { var v = f(l); if (prev * v <= 0) { var lo = pl, hi = l; for (var k = 0; k < 40; k++) { var mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } out.push((lo + hi) / 2); } prev = v; pl = l; } });
      return out;
    };
    var Rg = function (l, th, dn, Lam, hx) {   // Lorentzian (Raether) model on top of the flat-metal reflectance
      var m = met.get(), n = nWater(l) + dn, e = epsM(m, l), ns = nsR(m, l, n), Gi = ns[1], Gr = Gi * hx * hx, kx = n * Math.sin(th * D2R), R0 = R([{ eps: re(n) }, { eps: e }], l, th), keep = 1;
      // fade the plasmon out where it is not well defined (gold's interband region, ε″ ≳ 0.5 |ε′|)
      var q = e[1] / Math.abs(e[0]), wq = q >= 0.5 ? 0 : q <= 0.3 ? 1 : Math.pow((0.5 - q) / 0.2, 2) * (3 - 2 * (0.5 - q) / 0.2);
      if (!wq) return R0;
      [1, -1, 2, -2].forEach(function (mm) { [1, -1].forEach(function (s) { var dk = kx + mm * l / Lam - s * ns[0], Gr2 = Math.abs(mm) === 2 ? Gr * 0.15 : Gr; keep *= 1 - wq * 4 * Gi * Gr2 / (dk * dk + Math.pow(Gi + Gr2, 2)); }); });
      return R0 * Math.max(0, keep);
    };
    var draw = function () {
      var Lam = per.get(), th = ang.get(), dn = dnA.get(), hx = dep.get(), ths = VL.linspace(-40, 40, 161), ser = [], cols = { '1': C.au, '-1': C.cyan, '2': C.violet, '-2': C.green };
      [1, -1, 2, -2].forEach(function (m) { var pts = []; ths.forEach(function (t) { roots(m, Lam, t, dn).forEach(function (l) { pts.push([t, l]); }); }); ser.push({ data: pts, color: cols[m], dots: true, r: 1.6, label: 'order m = ' + (m > 0 ? '+' : '') + m }); });
      cells[1].innerHTML = VL.plot({ id: 'gr1', label: 'Resonance wavelength versus angle', w: 560, h: 320, x: { min: -40, max: 40, label: 'Angle of incidence θ (°)' }, y: { min: 450, max: 1600, label: 'Resonance wavelength (nm)' }, series: ser, vlines: [{ x: th, color: '#fff' }], legend: true, legendX: 20, legendY: 16 });
      // schematic
      var s = '<svg viewBox="0 0 380 300" class="plot" role="img" aria-label="Grating coupler schematic"><rect x="10" y="20" width="360" height="170" fill="#12233a"/><text x="20" y="38" class="pl-note" fill="' + C.cyan + '">analyte (light arrives through it)</text>';
      var gp = ''; for (var x = 10; x <= 370; x += 2) gp += (x === 10 ? 'M' : 'L') + x + ' ' + (190 - 7 * hx * Math.max(-1, Math.min(1, 2.2 * Math.sin((x - 10) / 18)))).toFixed(1) + ' ';
      s += '<path d="' + gp + ' L370 260 L10 260 Z" fill="' + (met.get() === 'Ag' ? '#cfd6e4' : C.au) + '" opacity=".9"/><text x="20" y="250" class="pl-note" fill="#3d2f12">metal grating, period Λ = ' + Lam + ' nm</text>';
      var dx = Math.sin(th * D2R), dy = Math.cos(th * D2R), cx = 190, cy = 186, col = wl2rgb(roots(1, Lam, th, dn)[0] || 700);
      s += '<line x1="' + (cx - dx * 150) + '" y1="' + (cy - dy * 150) + '" x2="' + cx + '" y2="' + cy + '" stroke="' + col + '" stroke-width="3"/><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + dx * 150) + '" y2="' + (cy - dy * 150) + '" stroke="' + col + '" stroke-width="3" opacity=".35"/>';
      s += '<path d="M60 175 L320 175" stroke="#ffe39a" stroke-width="1.5" stroke-dasharray="6 4"/><path d="M320 175 l-9 -5 v10 z" fill="#ffe39a"/><text x="236" y="166" class="pl-note" fill="#ffe39a">order → plasmon</text>';
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 90) + '" stroke="' + C.text3 + '" stroke-dasharray="3 3"/><text x="' + (cx + (th >= 0 ? -8 : 8)) + '" y="' + (cy - 96) + '" class="pl-note" fill="' + C.text + '" text-anchor="' + (th >= 0 ? 'end' : 'start') + '">θ = ' + th.toFixed(1) + '°</text></svg>';
      cells[0].innerHTML = s;
      var ls = VL.linspace(450, 1600, 700);
      plot2.innerHTML = VL.plot({ id: 'gr2', label: 'Reflectance spectrum of the grating', w: 720, h: 260, x: { min: 450, max: 1600, label: 'Wavelength (nm) at θ = ' + th.toFixed(1) + '°' }, y: { min: 0, max: 1.02, label: 'R (0th order, p)' }, series: [{ data: ls.map(function (l) { return [l, Rg(l, th, 0, Lam, hx)]; }), color: C.au, width: 2.4, label: 'water' }, { data: ls.map(function (l) { return [l, Rg(l, th, 0.01, Lam, hx)]; }), color: C.cyan, width: 2, dash: '6 4', label: 'water + 0.01' }], legend: true, legendX: 20, legendY: 150 });
      var r0 = roots(1, Lam, th, 0).concat(roots(-1, Lam, th, 0)).sort(function (a, b) { return a - b; }), r1 = roots(1, Lam, th, 0.01).concat(roots(-1, Lam, th, 0.01)).sort(function (a, b) { return a - b; });
      read.innerHTML = '<div><b>' + (r0.length ? r0.map(function (v) { return Math.round(v); }).join(' & ') + ' nm' : 'none in range') + '</b><span>first-order resonances at θ = ' + th.toFixed(1) + '°</span></div><div><b>' + (r0.length && r1.length === r0.length ? r0.map(function (v, i) { return Math.round((r1[i] - v) / 0.01); }).join(' & ') + ' nm/RIU' : '—') + '</b><span>spectral sensitivity of each branch</span></div><div><b>≈ ' + Math.round(Lam * (nsR(met.get(), Lam * 1.38, 1.333)[0])) + ' nm</b><span>normal-incidence estimate λ ≈ Λ · n_sp</span></div>';
    };
    var met = VL.select(ctl, { label: 'Metal', value: 'Au', options: metalOpts, on: draw });
    var per = VL.slider(ctl, { label: 'Period Λ', min: 400, max: 1000, step: 1, value: 560, fmt: function (v) { return v + ' nm'; }, on: draw });
    var ang = VL.slider(ctl, { label: 'Angle θ', min: -40, max: 40, step: 0.1, value: 8, fmt: function (v) { return v.toFixed(1) + '°'; }, on: draw });
    var dep = VL.slider(ctl, { label: 'Groove depth (× critical)', min: 0.2, max: 2.5, step: 0.05, value: 1, fmt: function (v) { return v.toFixed(2) + '×'; }, on: draw });
    var dnA = { get: function () { return 0; } };
    draw();
  };

  /* ═══ 13. fibre-optic SPR: rays, bounces and the transmission spectrum (animated) ═══ */
  F.fibre = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), W = 880, H = 270, g = VL.canvas(fig, W, H), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var P = {}, t = 0, NR = 6;
    var Tf = function (l, na, o) {   // transmitted fraction through the coated section
      var nc = nGlass('silica', l), am = Math.asin(Math.min(0.999, o.NA / nc)), S = [{ eps: re(nc) }, { eps: epsM('Au', l), d: o.d }, { eps: re(na) }], num = 0, den = 0, K = 48;
      for (var i = 0; i < K; i++) { var a = (i + 0.5) / K * am, w = Math.sin(a) * Math.cos(a), N = o.L * 1000 * Math.tan(a) / o.D, th = 90 - a / D2R; var rp = R(S, l, th, 'p'), rs = R(S, l, th, 's'); num += w * 0.5 * (Math.pow(rp, N) + Math.pow(rs, N)); den += w; }
      return num / den;
    };
    var o = function () { return { d: dmet.get(), L: len.get(), D: core.get(), NA: na.get() }; };
    var compute = function () {
      var O = o(), n = nWater(633) + dnA.get(), ls = VL.linspace(450, 1050, 160), Tn = function (l, dn) { return Tf(l, nWater(l) + dnA.get() + dn, O) / Tf(l, 1.0003, O); }, sp = function (dn) { return ls.map(function (l) { return [l, Tn(l, dn)]; }); };
      var c0 = sp(0), c1 = sp(0.01), mn = function (c) { var b = null; c.forEach(function (q) { if (q[0] >= 520 && (!b || q[1] < b[1])) b = q; }); return b; }, m0 = mn(c0), m1 = mn(c1);
      var r0 = dipOf(function (l) { return Tn(l, 0); }, Math.max(450, m0[0] - 8), Math.min(1050, m0[0] + 8), 20), r1 = dipOf(function (l) { return Tn(l, 0.002); }, Math.max(450, m0[0] - 8), Math.min(1050, m0[0] + 30), 30);
      var nc = nGlass('silica', lamShow.get()), am = Math.asin(Math.min(0.999, O.NA / nc));
      P = { O: O, c0: c0, c1: c1, res: r0, S: (r1.x - r0.x) / 0.002, am: am, Nmax: O.L * 1000 * Math.tan(am) / O.D, n: n };
      // rays for the animation: displayed angles are exaggerated, losses are the real ones
      var lS = lamShow.get(), Sx = [{ eps: re(nc) }, { eps: epsM('Au', lS), d: O.d }, { eps: re(nWater(lS) + dnA.get()) }];
      P.rays = []; for (var k = 0; k < NR; k++) { var a = (k + 0.7) / NR * am, N = O.L * 1000 * Math.tan(a) / O.D, th = 90 - a / D2R, Rr = 0.5 * (R(Sx, lS, th, 'p') + R(Sx, lS, th, 's')); P.rays.push({ a: a, N: N, Rb: Rr, disp: 0.12 + 0.55 * (k + 0.7) / NR }); }
      P.T = Tf(lS, nWater(lS) + dnA.get(), O);
      plot.innerHTML = VL.plot({ id: 'fib', label: 'Transmission spectrum of a fibre SPR probe', w: 720, h: 300, x: { min: 450, max: 1050, label: 'Wavelength (nm)' }, y: { min: 0, max: 1.05, label: 'Transmission ÷ transmission in air' },
        series: [{ data: c0, color: C.au, width: 2.6, label: 'analyte n = ' + (nWater(633) + dnA.get()).toFixed(3) + ' (at 633 nm)' }, { data: c1, color: C.cyan, width: 2, dash: '6 4', label: '+ 0.01' }], vlines: [{ x: lS, color: wl2rgb(lS), label: 'shown above' }], marks: [{ x: r0.x, y: r0.v, color: C.au }], legend: true, legendX: 330, legendY: 200 });
      read.innerHTML = '<div><b>' + r0.x.toFixed(1) + ' nm</b><span>resonance wavelength (transmission minimum)</span></div><div><b>' + Math.round(P.S) + ' nm/RIU</b><span>spectral sensitivity at this index</span></div><div><b>' + (100 * (1 - r0.v)).toFixed(0) + ' %</b><span>depth of the dip</span></div><div><b>' + P.Nmax.toFixed(0) + '</b><span>reflections of the steepest guided ray in the ' + O.L + ' mm section</span></div><div><b>' + (90 - am / D2R).toFixed(1) + '–90°</b><span>range of angles at which rays meet the gold</span></div>';
    };
    var draw = function () {
      g.clearRect(0, 0, W, H); var cy = 135, hc = 52, xa = 30, xb = W - 70, s0 = 250, s1 = 630, lS = lamShow.get(), col = wl2rgb(lS);
      // cladding, coated section, analyte
      g.fillStyle = '#22314a'; g.fillRect(xa, cy - hc - 26, s0 - xa, 2 * hc + 52); g.fillRect(s1, cy - hc - 26, xb - s1, 2 * hc + 52);
      g.fillStyle = '#12233a'; g.fillRect(s0, cy - hc - 50, s1 - s0, 2 * hc + 100);
      g.fillStyle = '#2d3f5c'; g.fillRect(xa, cy - hc, xb - xa, 2 * hc);
      g.fillStyle = C.au; g.fillRect(s0, cy - hc - 4, s1 - s0, 4); g.fillRect(s0, cy + hc, s1 - s0, 4);
      g.fillStyle = C.text2; g.font = '12px "IBM Plex Mono", monospace'; g.textAlign = 'center';
      g.fillText('cladding', (xa + s0) / 2, cy - hc - 8); g.fillText('cladding', (s1 + xb) / 2, cy - hc - 8); g.fillStyle = C.cyan; g.fillText('analyte around a gold-coated, unclad core', (s0 + s1) / 2, cy - hc - 30);
      g.fillStyle = C.text3; g.fillText('silica core', (xa + s0) / 2, cy + 4);
      // rays: zig-zag paths with photons travelling along them
      P.rays.forEach(function (r, k) {
        var tn = Math.tan(r.disp), per = 2 * hc / tn, inSec = Math.max(1, Math.round((s1 - s0) / per)), fBounce = Math.pow(r.Rb, r.N / inSec);
        var ys = function (x) { var u = ((x - xa) / per + k * 0.17) % 1; return cy - hc + 2 * hc * (u < 0.5 ? 2 * u : 2 - 2 * u); };
        var pw = function (x) { if (x <= s0) return 1; var nb = Math.floor((Math.min(x, s1) - s0) / (per / 2)); return Math.pow(fBounce, nb / 2 * 1); };
        g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.beginPath(); for (var x = xa; x <= xb; x += 3) { var y = ys(x); x === xa ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
        for (var q = 0; q < 9; q++) { var x2 = xa + ((t * 70 + q * (xb - xa) / 9 + k * 23) % (xb - xa)), a2 = pw(x2); g.globalAlpha = Math.max(0.04, a2); g.fillStyle = col; g.beginPath(); g.arc(x2, ys(x2), 3.6, 0, 2 * Math.PI); g.fill(); }
        g.globalAlpha = 1;
      });
      // detector bar
      g.fillStyle = '#0d0818'; g.fillRect(xb + 12, cy - hc, 22, 2 * hc); g.fillStyle = col; g.fillRect(xb + 12, cy + hc - 2 * hc * P.T, 22, 2 * hc * P.T);
      g.fillStyle = C.text2; g.textAlign = 'center'; g.fillText((100 * P.T).toFixed(0) + ' %', xb + 23, cy + hc + 18); g.fillText('detector', xb + 23, cy - hc - 8);
      g.textAlign = 'left'; g.fillStyle = C.text3; g.fillText('ray angles drawn steeper than they are; each drawn bounce stands for several real ones', xa, H - 8);
    };
    var upd = function () { compute(); draw(); };
    var loop = VL.loop(fig, function (dt) { t += dt; if (P.rays) draw(); });
    VL.playButton(ctl, loop);
    var lamShow = VL.slider(ctl, { label: 'Colour shown', min: 450, max: 1000, step: 1, value: 620, fmt: function (v) { return v + ' nm'; }, on: upd });
    var dnA = VL.slider(ctl, { label: 'Analyte Δn (over water)', min: 0, max: 0.06, step: 0.001, value: 0, fmt: function (v) { return '+' + v.toFixed(3); }, on: upd });
    var dmet = VL.slider(ctl, { label: 'Gold thickness', min: 20, max: 80, step: 1, value: 50, fmt: function (v) { return v + ' nm'; }, on: upd });
    var len = VL.slider(ctl, { label: 'Sensing length L', min: 2, max: 40, step: 1, value: 15, fmt: function (v) { return v + ' mm'; }, on: upd });
    var core = VL.slider(ctl, { label: 'Core diameter D', min: 100, max: 1000, step: 10, value: 400, fmt: function (v) { return v + ' µm'; }, on: upd });
    var na = VL.slider(ctl, { label: 'Numerical aperture', min: 0.12, max: 0.5, step: 0.01, value: 0.39, fmt: function (v) { return v.toFixed(2); }, on: upd });
    upd();
  };

  /* ═══ 14. long-range SPR ═══ */
  F.lrspr = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var L = lam.get(), np = nGlass('BK7', L), nw = nWater(L), nb = nbuf.get(), db = dbuf.get(), dm = dmet.get();
      var conv = function (dn) { return [{ eps: re(np) }, { eps: epsM('Au', L), d: 50 }, { eps: re(nw + (dn || 0)) }]; }, lr = function (dn) { return [{ eps: re(np) }, { eps: re(nb), d: db }, { eps: epsM('Au', L), d: dm }, { eps: re(nw + (dn || 0)) }]; };
      var thc = Math.asin(Math.max(nw, nb) / np) / D2R, a = thc - 0.5, b = Math.min(89, thc + 14);
      var fc = function (t) { return R(conv(), L, t); }, fl = function (t) { return R(lr(), L, t); };
      var qc = dipOf(fc, thc + 0.01, b, 1500), ql = dipOf(fl, thc + 0.005, b, 4000), wc = fwhm(fc, qc.x, qc.v, thc + 0.01, b), wl = fwhm(fl, ql.x, ql.v, thc + 0.005, b);
      var sc = (dipOf(function (t) { return R(conv(0.001), L, t); }, thc + 0.01, b, 1500).x - qc.x) / 0.001, sl = (dipOf(function (t) { return R(lr(0.001), L, t); }, thc + 0.005, b, 4000).x - ql.x) / 0.001;
      var ths = []; for (var t = a; t <= b; t += (b - a) / 900) ths.push(t); for (var u = ql.x - 0.3; u <= ql.x + 0.3; u += 0.002) ths.push(u); ths.sort(function (x, y) { return x - y; });
      plot.innerHTML = VL.plot({ id: 'lr', label: 'Conventional and long-range SPR', w: 720, h: 330, x: { min: a, max: b, label: 'Angle in the prism (°) at ' + L + ' nm' }, y: { min: 0, max: 1.02, label: 'R_p' },
        series: [{ data: ths.map(function (x) { return [x, fc(x)]; }), color: C.au, width: 2.2, label: 'conventional: 50 nm gold on the prism' }, { data: ths.map(function (x) { return [x, fl(x)]; }), color: C.green, width: 2.4, label: 'long-range: buffer ' + db + ' nm + gold ' + dm + ' nm' }], legend: true, legendX: 330, legendY: 210 });
      read.innerHTML = '<div><b>' + (isFinite(wc) ? deg(wc, 3) : '—') + ' vs ' + (isFinite(wl) ? deg(wl, 3) : '—') + '</b><span>dip width: conventional vs long-range</span></div><div><b>' + (100 * qc.v).toFixed(0) + ' % vs ' + (100 * ql.v).toFixed(0) + ' %</b><span>minimum reflectance</span></div><div><b>' + sc.toFixed(0) + ' vs ' + sl.toFixed(0) + ' °/RIU</b><span>angular sensitivity</span></div><div><b>' + (isFinite(wc) && isFinite(wl) ? (sc / wc).toFixed(0) + ' vs ' + (sl / wl).toFixed(0) : '—') + ' RIU⁻¹</b><span>figure of merit</span></div>';
    };
    var lam = VL.slider(ctl, { label: 'Wavelength', min: 633, max: 1000, step: 1, value: 850, fmt: function (v) { return v + ' nm'; }, on: draw });
    var nbuf = VL.slider(ctl, { label: 'Buffer index', min: 1.31, max: 1.35, step: 0.001, value: 1.329, fmt: function (v) { return v.toFixed(3); }, on: draw });
    var dbuf = VL.slider(ctl, { label: 'Buffer thickness', min: 300, max: 3500, step: 10, value: 2200, fmt: function (v) { return v + ' nm'; }, on: draw });
    var dmet = VL.slider(ctl, { label: 'Gold thickness', min: 10, max: 30, step: 0.5, value: 20, fmt: function (v) { return v.toFixed(1) + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 15. self-test ═══ */
  var QUIZ = [
    ['A beam of s-polarised (TE) light falls on a Kretschmann chip. What happens at the angle where p-polarised light shows its dip?', ['Nothing special: R stays near 1', 'An even deeper dip', 'The dip moves to a smaller angle'], 0, 'TE light has no electric field normal to the surface, so it cannot pile up surface charge — it cannot drive the plasmon. A flat R_s is the standard reference channel.'],
    ['Why can light coming straight from the water never excite the plasmon on a flat gold surface?', ['Gold reflects it all', 'Its in-plane momentum n_d k₀ sin θ is always smaller than Re k_sp', 'Water absorbs the light'], 1, 'k_sp is always larger than n_d k₀ because ε_m < −ε_d. Light needs extra in-plane momentum: from a prism, a grating or a guided mode.'],
    ['In the Kretschmann configuration the gold is made thinner than optimal. The dip becomes…', ['narrower and deeper', 'broader and shallower', 'unchanged'], 1, 'A thin film lets the plasmon radiate back into the prism quickly (large radiative damping): the resonance broadens and the two damping rates no longer balance, so R_min rises.'],
    ['You double the grating period Λ (first order, near-normal incidence). The resonance wavelength roughly…', ['halves', 'doubles', 'stays the same'], 1, 'At normal incidence λ ≈ Λ · n_sp, so the resonance follows the period.'],
    ['A fibre probe is made longer (more reflections). The transmission dip becomes…', ['deeper, and broader once it saturates', 'shallower', 'blue-shifted'], 0, 'Each ray loses R^N; more reflections deepen the dip until it saturates, after which the wings deepen too and the dip broadens.'],
    ['Silver gives a sharper dip than gold at 633 nm because…', ['its ε″ / |ε′| is smaller (less loss)', 'it is more conductive at DC', 'it oxidises'], 0, 'The width scales with Im k_sp, set by the metal loss ε″ relative to |ε′|. Silver tarnishes, so practical chips cap it with a few nanometres of gold.'],
    ['Which change raises the angular sensitivity dθ/dn of a prism sensor at a fixed wavelength?', ['A higher-index prism', 'A lower-index prism', 'A thicker gold film'], 1, 'Larger n_p moves the resonance to a smaller angle where sin θ changes faster relative to n_sp: the dip moves less. Lower n_p means larger angles and larger dθ/dn, with a broader dip.'],
    ['A protein layer 5 nm thick binds. Which wavelength gives the larger shift as a fraction of the bulk response?', ['Near-infrared (850 nm)', 'Visible (633 nm)', 'They are equal'], 1, 'A shorter wavelength has a shorter reach δ_d, so a thin layer fills a larger share of the field. The near-infrared reaches further — better for big particles and cells, but thin layers fill a smaller fraction of its field.']
  ];
  F.sprquiz = function (fig) {
    var box = VL.part(fig, 'vl-plot'), i = 0, score = 0, done = 0, answered = false;
    var render = function (fb) {
      var q = QUIZ[i];
      box.innerHTML = '<div class="quiz"><p class="quiz-n">Question ' + (i + 1) + ' of ' + QUIZ.length + ' · score ' + score + ' / ' + done + '</p><p class="quiz-q">' + q[0] + '</p><div class="quiz-a">' +
        q[1].map(function (o, k) { return '<button type="button" class="vl-btn" data-a="' + k + '"' + (answered ? ' disabled' : '') + '>' + o + '</button>'; }).join('') +
        '</div>' + (fb || '') + '<div class="quiz-nav"><button type="button" class="vl-btn primary" data-next="1"' + (answered ? '' : ' disabled') + '>' + (i < QUIZ.length - 1 ? 'Next question →' : 'Start again') + '</button></div></div>';
      box.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { if (answered) return; answered = true; done++; var ok = +b.getAttribute('data-a') === q[2]; if (ok) score++;
        render('<p class="quiz-fb ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Correct.' : 'Not quite — the answer is: ' + q[1][q[2]] + '.') + '</b> ' + q[3] + '</p>'); }; });
      box.querySelector('[data-next]').onclick = function () { if (!answered) return; answered = false; if (i < QUIZ.length - 1) i++; else { i = 0; score = 0; done = 0; } render(); };
    };
    render();
  };

  VL.spr = { R: R, rTMM: rTMM, epsM: epsM, nWater: nWater, nGlass: nGlass, nsp: nsp, dipOf: dipOf, fwhm: fwhm };
})();
