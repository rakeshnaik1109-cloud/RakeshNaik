/* Aligning an optical setup — interactive figures (uses vl-core.js helpers).
   Gaussian-beam optics (q parameter), Gaussian overlap integrals for fibre coupling
   (Joyce & DeLoach 1984), two-beam interference; laser-safety numbers are simplified
   illustrations of IEC 60825-1 / ANSI Z136.1 and never a substitute for them. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var fx = function (v, d) { return (+v).toFixed(d == null ? 2 : d); };
  var readout = function (el, rows) { el.innerHTML = rows.map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join(''); };
  var svgOpen = function (w, h, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="plot" role="img" aria-label="' + VL.esc(label) + '">'; };
  var txt = function (x, y, s, o) { o = o || {}; return '<text x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '" class="' + (o.cls || 'pl-tick') + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.fill ? ' fill="' + o.fill + '"' : '') + '>' + s + '</text>'; };
  var line = function (a, b, col, w, extra) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 1.5) + '"' + (extra || '') + '/>'; };
  var fmtLen = function (mm) { var a = Math.abs(mm); return a >= 1 ? fx(mm, 2) + ' mm' : a >= 1e-3 ? fx(mm * 1000, 1) + ' µm' : fx(mm * 1e6, 0) + ' nm'; };
  /* Gaussian beam helpers, lengths in mm */
  var cdiv = function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  var qLens = function (q, f) { var inv = cdiv([1, 0], q); return cdiv([1, 0], [inv[0] - 1 / f, inv[1]]); };
  var wOf = function (q, lam) { var inv = cdiv([1, 0], q); return Math.sqrt(-lam / (Math.PI * inv[1])); };

  /* ═══ 1. what "aligned" means (static) ═══ */
  F.alayout = function (fig) {
    var W = 720, H = 300, s = svgOpen(W, H, 'An aligned beam path');
    s += '<rect x="10" y="20" width="700" height="190" rx="8" fill="rgba(255,255,255,.035)" stroke="' + C.grid + '"/>';
    for (var x = 30; x < 700; x += 25) for (var y = 40; y < 205; y += 25) s += '<circle cx="' + x + '" cy="' + y + '" r="1.6" fill="' + C.text3 + '" opacity=".5"/>';
    var path = [[60, 165], [190, 165], [190, 65], [560, 65], [640, 65]];
    s += '<rect x="22" y="155" width="40" height="20" rx="3" fill="#30353d" stroke="' + C.text3 + '"/>' + txt(42, 192, 'laser', {});
    s += '<polyline points="' + path.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + C.red + '" stroke-width="2.4"/>';
    s += line([180, 175], [200, 155], '#cfd6e4', 5) + txt(214, 182, 'M1', { anchor: 'start' }) + line([180, 75], [200, 55], '#cfd6e4', 5) + txt(170, 52, 'M2', {});
    [[300, 'iris 1 (near)'], [520, 'iris 2 (far)']].forEach(function (q) { s += line([q[0], 50], [q[0], 61], C.au, 3) + line([q[0], 69], [q[0], 80], C.au, 3) + txt(q[0], 96, q[1], { fill: C.au }); });
    s += '<ellipse cx="420" cy="65" rx="4" ry="16" fill="rgba(69,191,214,.25)" stroke="' + C.cyan + '"/>' + txt(420, 96, 'lens', { fill: C.cyan });
    s += '<rect x="640" y="52" width="26" height="26" rx="3" fill="#30353d" stroke="' + C.text3 + '"/>' + txt(653, 96, 'camera', {});
    s += txt(370, 40, 'on the grid · centred on every optic · normal incidence · constant height', { cls: 'pl-label' });
    // side view
    s += '<rect x="10" y="222" width="700" height="70" rx="8" fill="rgba(255,255,255,.02)" stroke="' + C.grid + '"/>' + line([20, 280], [700, 280], C.text3, 2) + txt(28, 274, 'table', { anchor: 'start' });
    [80, 190, 300, 420, 520, 650].forEach(function (x) { s += line([x, 280], [x, 248], C.text3, 3); });
    s += line([60, 248], [700, 248], C.red, 2) + '<path d="M705 248 L705 280" stroke="' + C.au + '" stroke-width="1.2"/>' + txt(690, 240, 'beam height h, the same everywhere', { anchor: 'end', fill: C.au });
    s += txt(370, 236, 'side view', {});
    VL.html(fig, s + '</svg>');
  };

  /* ═══ 2. laser safety: class and optical density (simplified, visible CW) ═══ */
  F.safety = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var P = sp.get() / 1000, D = sd.get(), a = 3.5, w = D / 2, frac = 1 - Math.exp(-2 * a * a / (w * w)), Pap = P * frac;
      var Pmpe = 2.55e-3 * Math.PI * 0.35 * 0.35;   // W through a 7 mm pupil at the 0.25 s visible MPE (≈ 1 mW)
      var OD = Math.max(0, Math.log10(Pap / Pmpe)), cls = P <= 0.39e-3 ? '1' : P <= 1e-3 ? '2' : P <= 5e-3 ? '3R' : P <= 0.5 ? '3B' : '4';
      var Ps = VL.logspace(1e-5, 10, 200);
      plot.innerHTML = VL.plot({ id: 'od', label: 'Optical density needed', w: 680, h: 280, x: { min: 1e-5, max: 10, log: true, label: 'Laser power (W), visible, continuous' }, y: { min: 0, max: 6, label: 'Optical density needed (OD)' },
        bands: [{ x0: 1e-5, x1: 0.39e-3, color: C.green, label: '1', op: 0.08 }, { x0: 0.39e-3, x1: 1e-3, color: C.cyan, label: '2', op: 0.08 }, { x0: 1e-3, x1: 5e-3, color: C.au, label: '3R', op: 0.08 }, { x0: 5e-3, x1: 0.5, color: C.violet, label: '3B', op: 0.08 }, { x0: 0.5, x1: 10, color: C.red, label: '4', op: 0.08 }],
        series: [{ data: Ps.map(function (p) { return [p, Math.max(0, Math.log10(p * frac / Pmpe))]; }), color: C.au }], marks: [{ x: P, y: OD, color: C.au }] });
      readout(read, [['Class ' + cls, 'approximate class from the power (visible, continuous)'], [fx(100 * frac, 0) + ' %', 'of the beam that fits through a 7 mm pupil'], ['OD ' + fx(Math.ceil(OD * 10) / 10, 1), 'eyewear needed for a direct hit lasting 0.25 s'], [cls === '1' || cls === '2' ? 'blink reflex protects' : 'never view directly', cls === '4' ? 'diffuse reflections are hazardous too' : cls === '3B' ? 'specular reflections are hazardous too' : '']]);
    };
    var sp = VL.slider(ctl, { label: 'Power', min: -2, max: 4, step: 0.01, value: 1.7, log: true, fmt: function (v) { return v >= 1000 ? fx(v / 1000, 2) + ' W' : v >= 1 ? fx(v, 1) + ' mW' : fx(v * 1000, 0) + ' µW'; }, on: draw });
    var sd = VL.slider(ctl, { label: 'Beam diameter at the eye', min: 0.5, max: 20, step: 0.1, value: 2, fmt: function (v) { return fx(v, 1) + ' mm'; }, on: draw });
    draw();
  };

  /* ═══ 3. beam walking with two mirrors and two irises ═══ */
  F.walk = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), left = VL.part(fig, 'vl-plot'), right = VL.part(fig, 'vl-plot');
    var seed = 3, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var st = { y0: 0, a0: 0, d1: 0, d2: 0, hist: [] };
    var Z = function () { return { z1: 100, z2: 300, z3: s3.get(), z4: s4.get() }; };   // mm along the unfolded path
    var yAt = function (z) { var g = Z(), y = st.y0 + st.a0 * z; if (z > g.z1) y += 2 * st.d1 * (z - g.z1); if (z > g.z2) y += 2 * st.d2 * (z - g.z2); return y; };
    var newMis = function () { st.y0 = (rnd() - 0.5) * 3; st.a0 = (rnd() - 0.5) * 0.012; st.d1 = 0; st.d2 = 0; st.hist = []; m1.set(0); m2.set(0); };
    var errs = function () { var g = Z(); return [yAt(g.z3), yAt(g.z4)]; };
    var step = function () {   // one round of walking with the chosen pairing
      var g = Z(), pair = sw.get();
      var fixAt = function (z, k) { var y = yAt(z); var lever = 2 * (z - (k === 1 ? g.z1 : g.z2)); if (lever <= 0) return; if (k === 1) st.d1 -= y / lever; else st.d2 -= y / lever; };
      if (pair === 'good') { fixAt(g.z3, 1); fixAt(g.z4, 2); } else { fixAt(g.z3, 2); fixAt(g.z4, 1); }
      var k1 = st.d1 * 1000, k2 = st.d2 * 1000; m1.set(k1); m2.set(k2);   // set() redraws, which reads both knobs back
    };
    var draw = function () {
      st.d1 = m1.get() / 1000; st.d2 = m2.get() / 1000;
      var g = Z(), e = errs(), W = 680, H = 270, zmax = g.z4 + 80, X = function (z) { return 40 + Math.sqrt(z / zmax) * (W - 70); };
      var ymax = Math.max(0.5, Math.abs(st.y0), Math.abs(yAt(g.z1)), Math.abs(yAt(g.z2)), Math.abs(e[0]), Math.abs(e[1]), Math.abs(yAt(zmax))), ks = Math.min(16, 70 / ymax), Y = function (y) { return 135 - y * ks; };
      var s = svgOpen(W, H, 'Beam walking: unfolded beam path');
      s += line([X(0), Y(0)], [X(zmax), Y(0)], C.text3, 1, ' stroke-dasharray="3 5"') + txt((X(0) + X(g.z1)) / 2, Y(0) - 6, 'axis', {});
      var pts = [0, g.z1, g.z2, g.z3, g.z4, zmax].map(function (z) { return [X(z), Y(yAt(z))]; });
      s += '<polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="' + C.red + '" stroke-width="2.2"/>';
      s += '<rect x="' + (X(0) - 14) + '" y="' + (Y(st.y0) - 7) + '" width="16" height="14" fill="#30353d"/>' + txt(X(0), Y(0) + 96, 'laser', {});
      [[g.z1, 'M1', st.d1], [g.z2, 'M2', st.d2]].forEach(function (m) { var x = X(m[0]); s += line([x - 6, Y(yAt(m[0])) + 14], [x + 6, Y(yAt(m[0])) - 14], '#cfd6e4', 4) + txt(x, Y(0) + 96, m[1], {}) + txt(x, Y(0) + 112, fx(m[2] * 1000, 2) + ' mrad', {}); });
      [[g.z3, 'iris 1', e[0]], [g.z4, 'iris 2', e[1]]].forEach(function (q) { var x = X(q[0]), ok = Math.abs(q[2]) < 0.05; s += line([x, Y(0) - 70], [x, Y(0) - 4], ok ? C.green : C.au, 3) + line([x, Y(0) + 4], [x, Y(0) + 70], ok ? C.green : C.au, 3) + txt(x, Y(0) - 92, q[1], { fill: ok ? C.green : C.au }) + txt(x, Y(0) - 78, fx(q[2], 2) + ' mm', { fill: ok ? C.green : C.au }); });
      s += txt(W / 2, 16, 'unfolded path (distance on a square-root scale, heights exaggerated): a mirror tilt δ turns the beam by 2δ', {});
      left.innerHTML = s + '</svg>';
      var rho = (g.z3 - g.z2) / (g.z3 - g.z1) * (g.z4 - g.z1) / (g.z4 - g.z2), r = sw.get() === 'good' ? rho : 1 / rho;
      if (!st.hist.length || st.hist[st.hist.length - 1] !== Math.hypot(e[0], e[1])) st.hist.push(Math.hypot(e[0], e[1]));
      if (st.hist.length > 12) st.hist.shift();
      right.innerHTML = VL.plot({ id: 'walk', label: 'Error after each adjustment', w: 680, h: 220, x: { min: 0, max: Math.max(4, st.hist.length - 1), label: 'adjustment' }, y: { min: 1e-4, max: 100, log: true, label: 'beam error (mm)' }, series: [{ data: st.hist.map(function (v, i) { return [i, Math.max(1.1e-4, v)]; }), color: C.au, dots: true }].concat([{ data: st.hist.map(function (v, i) { return [i, Math.max(1.1e-4, v)]; }), color: C.au, width: 1 }]) });
      readout(read, [[fx(e[0], 3) + ' / ' + fx(e[1], 3) + ' mm', 'beam offset at iris 1 / iris 2'], ['× ' + fx(r, 2), 'error multiplied by this per round of walking' + (r >= 1 ? ' — it diverges!' : '')], [Math.abs(e[0]) < 0.05 && Math.abs(e[1]) < 0.05 ? 'aligned' : 'not yet', 'both irises within 50 µm']]);
    };
    var m1 = VL.slider(ctl, { label: 'M1 knob', min: -8, max: 8, step: 0.01, value: 0, fmt: function (v) { return fx(v, 2) + ' mrad'; }, on: draw });
    var m2 = VL.slider(ctl, { label: 'M2 knob', min: -8, max: 8, step: 0.01, value: 0, fmt: function (v) { return fx(v, 2) + ' mrad'; }, on: draw });
    var s3 = VL.slider(ctl, { label: 'Iris 1 position', min: 320, max: 900, step: 10, value: 450, fmt: function (v) { return v + ' mm'; }, on: function () { st.hist = []; draw(); } });
    var s4 = VL.slider(ctl, { label: 'Iris 2 position', min: 950, max: 2000, step: 10, value: 1500, fmt: function (v) { return v + ' mm'; }, on: function () { st.hist = []; draw(); } });
    var sw = VL.select(ctl, { label: 'Walking rule', options: [['good', 'M1 → iris 1, M2 → iris 2 (recommended)'], ['bad', 'M2 → iris 1, M1 → iris 2']], value: 'good', on: function () { st.hist = []; draw(); } });
    VL.button(ctl, 'One round of walking', function () { step(); draw(); });
    VL.button(ctl, 'New misalignment', function () { newMis(); draw(); });
    newMis(); draw();
  };

  /* ═══ 4. centring and tilting a lens ═══ */
  F.lens = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var d = sd.get(), tilt = st.get(), f = sf.get(), L = 2000, back = 600;
      var defl = d / f, at = d * L / f, ret = 2 * tilt * Math.PI / 180 * back;
      var W = 680, H = 250, s = svgOpen(W, H, 'Decentred and tilted lens'), cy = 115, X = function (z) { return 230 + z / L * 400; }, Y = function (y) { return cy - y * 5; };
      var ex = 25, lx = X(0), ly = Y(d * ex);
      s += line([20, cy], [660, cy], C.text3, 1, ' stroke-dasharray="3 5"');
      s += line([X(-280), Y(0)], [lx, Y(0)], C.red, 2.4) + line([lx, Y(0)], [X(L), Y(at)], C.red, 2.4)   /* a positive lens bends the ray towards its own axis */;
      s += '<g transform="rotate(' + (-tilt * 4) + ' ' + lx + ' ' + ly + ')"><ellipse cx="' + lx + '" cy="' + ly + '" rx="6" ry="40" fill="rgba(69,191,214,.2)" stroke="' + C.cyan + '"/>' + line([lx - 12, ly], [lx + 12, ly], C.cyan, 1) + '</g>';
      if (tilt) { var zr = -280, yr = ret * (-zr) / back; s += line([lx, Y(0)], [X(zr), Y(Math.sign(tilt) * yr)], C.au, 1.4, ' stroke-dasharray="4 3"') + txt(X(zr) + 4, Y(Math.sign(tilt) * yr) + (tilt > 0 ? -8 : 16), 'back-reflection', { anchor: 'start', fill: C.au }); }
      s += line([X(L), cy - 70], [X(L), cy + 70], C.text2, 3) + txt(X(L), cy + 90, 'screen 2 m away', {}) + txt(lx, cy + 90, 'lens', {}) + txt(X(-280), cy + 18, 'collimated beam', { anchor: 'start' });
      s += txt(W / 2, 18, 'not to scale: heights enlarged 25×, the decentre and the lens tilt more', {});
      plot.innerHTML = s + '</svg>';
      readout(read, [[fx(defl * 1000, 2) + ' mrad', 'beam deflection = decentre ÷ f'], [fmtLen(at), 'spot moves on a screen 2 m away (decentre × L/f)'], [fmtLen(ret), 'back-reflection lands this far from the beam, 0.6 m back towards the laser (2 × tilt × distance)']]);
    };
    var sd = VL.slider(ctl, { label: 'Decentre', min: -1, max: 1, step: 0.01, value: 0.3, fmt: function (v) { return fx(v, 2) + ' mm'; }, on: draw });
    var st = VL.slider(ctl, { label: 'Tilt', min: -5, max: 5, step: 0.1, value: 1, fmt: function (v) { return fx(v, 1) + '°'; }, on: draw });
    var sf = VL.slider(ctl, { label: 'Focal length', min: 25, max: 500, step: 5, value: 100, fmt: function (v) { return v + ' mm'; }, on: draw });
    draw();
  };

  /* ═══ 5. collimating a beam expander ═══ */
  F.collim = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var lam = 633e-6, f1 = +s1.get(), f2 = +s2.get(), dz = sz.get(), w0 = 0.4;
      var q = [0, Math.PI * w0 * w0 / lam];
      q = [q[0] + 100, q[1]]; q = qLens(q, f1); q = [q[0] + f1 + f2 + dz, q[1]]; q = qLens(q, f2);
      var zs = VL.linspace(0, 10000, 300), wz = zs.map(function (z) { return [z / 1000, wOf([q[0] + z, q[1]], lam)]; });
      var wOut = wOf(q, lam), inv = cdiv([1, 0], q), Rinv = inv[0], zR = q[1], waistAt = -q[0];
      var w10 = wOf([q[0] + 10000, q[1]], lam), M = f2 / f1, wIdeal = w0 * Math.abs(M);
      plot.innerHTML = VL.plot({ id: 'col', label: 'Beam radius after the expander', w: 680, h: 300, x: { min: 0, max: 10, label: 'Distance after the second lens (m)' }, y: { min: 0, max: Math.max(4, wIdeal * 2.2), label: 'Beam radius w (mm)' },
        series: [{ data: wz, color: C.au, label: 'this spacing' }, { data: zs.map(function (z) { return [z / 1000, wIdeal]; }), color: C.text3, dash: '4 4', label: 'perfectly collimated (ideal)' }], legend: true, legendX: 14, legendY: 22 });
      readout(read, [[fx(wOut, 2) + ' → ' + fx(w10, 2) + ' mm', 'beam radius at the lens and 10 m later'], [Math.abs(Rinv) < 1e-9 ? '∞' : fx(1 / Rinv / 1000, 2) + ' m', 'radius of curvature leaving the lens (∞ = collimated)'], [fx(Math.atan((w10 - wOut) / 10000) * 1e6, 0) + ' µrad', 'apparent divergence over 10 m'], [fx(waistAt / 1000, 2) + ' m', 'where the new waist sits (negative: behind the lens)']]);
    };
    var s1 = VL.select(ctl, { label: 'First lens', options: [['25', 'f = 25 mm'], ['50', 'f = 50 mm']], value: '50', on: draw });
    var s2 = VL.select(ctl, { label: 'Second lens', options: [['150', 'f = 150 mm'], ['200', 'f = 200 mm'], ['300', 'f = 300 mm']], value: '200', on: draw });
    var sz = VL.slider(ctl, { label: 'Spacing error from f₁ + f₂', min: -3, max: 3, step: 0.01, value: 1, fmt: function (v) { return (v > 0 ? '+' : '') + fx(v, 2) + ' mm'; }, on: draw });
    draw();
  };

  /* ═══ 6. designing a spatial filter ═══ */
  F.pinhole = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var lam = 633e-6, D = sd.get(), f = sf.get(), ph = sp.get() / 1000, per = sn.get();
      var w0 = lam * f / (Math.PI * D / 2), a = ph / 2, T = 1 - Math.exp(-2 * a * a / (w0 * w0)), rNoise = lam * f / per;
      var xs = VL.linspace(-Math.max(3 * w0, 1.4 * a, 1.3 * rNoise), Math.max(3 * w0, 1.4 * a, 1.3 * rNoise), 500);
      var prof = xs.map(function (x) { return [x * 1000, Math.exp(-2 * x * x / (w0 * w0)) + 0.06 * (Math.exp(-2 * Math.pow((x - rNoise) / (w0), 2)) + Math.exp(-2 * Math.pow((x + rNoise) / (w0), 2)))]; });
      plot.innerHTML = VL.plot({ id: 'ph', label: 'Focal plane of the spatial filter', w: 680, h: 300, x: { min: xs[0] * 1000, max: xs[xs.length - 1] * 1000, label: 'Position in the focal plane (µm)' }, y: { min: 0, max: 1.1, label: 'Intensity (normalised)' },
        bands: [{ x0: -a * 1000, x1: a * 1000, color: C.green, label: 'pinhole', op: 0.12 }], series: [{ data: prof, color: C.au }], vlines: [{ x: rNoise * 1000, color: C.red, label: 'noise' }, { x: -rNoise * 1000, color: C.red }] });
      readout(read, [[fx(2 * w0 * 1000, 1) + ' µm', 'focused spot diameter 2w₀ = 4λf/(πD)'], [fx(1.5 * 2 * w0 * 1000, 0) + ' µm', 'usual pinhole choice: about 1.5 × the spot'], [fx(100 * T, 1) + ' %', 'of the beam this pinhole passes'], [rNoise > a ? 'blocked' : 'passed', 'scatter with a ' + fx(per * 1000, 0) + ' µm period lands ' + fx(rNoise * 1000, 0) + ' µm off axis']]);
    };
    var sd = VL.slider(ctl, { label: 'Input beam diameter (1/e²)', min: 0.5, max: 5, step: 0.1, value: 1, fmt: function (v) { return fx(v, 1) + ' mm'; }, on: draw });
    var sf = VL.slider(ctl, { label: 'Focusing lens', min: 4, max: 50, step: 0.5, value: 10, fmt: function (v) { return fx(v, 1) + ' mm'; }, on: draw });
    var sp = VL.slider(ctl, { label: 'Pinhole diameter', min: 2, max: 50, step: 0.5, value: 15, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'Period of the scatter to remove', min: 0.02, max: 0.5, step: 0.005, value: 0.1, fmt: function (v) { return fx(v * 1000, 0) + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 7. coupling into a single-mode fibre ═══ */
  F.fibre = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var FIB = { '633': [633e-6, 4.3e-3, '630 nm single-mode fibre, MFD ≈ 4.3 µm'], '1550': [1550e-6, 10.4e-3, 'SMF-28 at 1550 nm, MFD 10.4 µm'] };
    var draw = function () {
      var F0 = FIB[sl.get()], lam = F0[0], w2 = F0[1] / 2, D = sd.get(), f = sf.get(), w1 = lam * f / (Math.PI * D / 2);
      var x = sx.get() / 1000, z = sz.get() / 1000, th = st.get() / 1000;
      var s2 = w1 * w1 + w2 * w2;
      var eMode = function (zz) { return 4 / (Math.pow(w1 / w2 + w2 / w1, 2) + Math.pow(lam * zz / (Math.PI * w1 * w2), 2)); };
      var eX = function (xx) { return Math.exp(-2 * xx * xx / s2); }, eT = function (tt) { return Math.exp(-2 * Math.pow(Math.PI * w1 * w2 * tt / lam, 2) / s2); };
      var eta = eMode(z) * eX(x) * eT(th);
      var xs = VL.linspace(-6, 6, 300);
      plot.innerHTML = VL.plot({ id: 'fib', label: 'Coupling efficiency against lateral offset', w: 680, h: 280, x: { min: -6, max: 6, label: 'Lateral offset of the focus from the core (µm)' }, y: { min: 0, max: 100, label: 'Coupling efficiency (%)' },
        series: [{ data: xs.map(function (u) { return [u, 100 * eMode(z) * eX(u / 1000) * eT(th)]; }), color: C.au }], marks: [{ x: x * 1000, y: 100 * eta, color: C.au }], hlines: [{ y: 100 * eMode(0) * 0.794, color: C.text3, dash: '3 4', label: '−1 dB' }] });
      var x1dB = Math.sqrt(-Math.log(0.794) * s2 / 2) * 1000;
      readout(read, [[fx(100 * eta, 1) + ' %', 'coupling efficiency (' + fx(-10 * Math.log10(Math.max(eta, 1e-9)), 2) + ' dB loss)'], [fx(2 * w1 * 1000, 2) + ' µm', 'focused spot diameter vs fibre MFD ' + fx(2 * w2 * 1000, 1) + ' µm'], [fx(100 * eMode(0), 1) + ' %', 'best possible with this lens (mode match)'], ['±' + fx(x1dB, 2) + ' µm', 'lateral tolerance for 1 dB']]);
    };
    var sl = VL.select(ctl, { label: 'Fibre', options: [['633', FIB['633'][2]], ['1550', FIB['1550'][2]]], value: '633', on: draw });
    var sd = VL.slider(ctl, { label: 'Collimated beam diameter', min: 0.5, max: 4, step: 0.05, value: 1, fmt: function (v) { return fx(v, 2) + ' mm'; }, on: draw });
    var sf = VL.slider(ctl, { label: 'Coupling lens focal length', min: 2, max: 20, step: 0.1, value: 5, fmt: function (v) { return fx(v, 1) + ' mm'; }, on: draw });
    var sx = VL.slider(ctl, { label: 'Lateral offset', min: -6, max: 6, step: 0.05, value: 0.5, fmt: function (v) { return fx(v, 2) + ' µm'; }, on: draw });
    var sz = VL.slider(ctl, { label: 'Focus error', min: -60, max: 60, step: 0.5, value: 5, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    var st = VL.slider(ctl, { label: 'Angle error', min: -20, max: 20, step: 0.1, value: 2, fmt: function (v) { return fx(v, 1) + ' mrad'; }, on: draw });
    draw();
  };

  /* ═══ 8. Michelson fringes ═══ */
  F.fringes = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var N = 160, off = document.createElement('canvas'); off.width = N; off.height = N; var g = VL.canvas(fig, 640, 320);
    var SRC = { hene: ['HeNe laser (coherence ≈ 20 cm)', 200], diode: ['laser diode, multimode (≈ 1 mm)', 1], led: ['LED (≈ 20 µm)', 0.02] };
    var draw = function () {
      var lam = 633e-6, ax = sa.get() * 1e-3, ay = sb.get() * 1e-3, dpath = sd.get() * 1e-3, Rinv = sr.get() / 1e6, Lc = SRC[ss.get()][1], FOV = 10;
      var Vis = Math.exp(-Math.pow(2 * dpath / Lc, 2)), k = 2 * Math.PI / lam;
      var ox = off.getContext('2d'), im = ox.createImageData(N, N);
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var x = (i / (N - 1) - 0.5) * FOV, y = (j / (N - 1) - 0.5) * FOV;
        var ph = k * (2 * ax * x + 2 * ay * y + 2 * dpath + (x * x + y * y) * Rinv / 2);
        var I = 0.5 * (1 + Vis * Math.cos(ph)) * Math.exp(-(x * x + y * y) / 20), q = (j * N + i) * 4;
        im.data[q] = 255 * I; im.data[q + 1] = 90 * I; im.data[q + 2] = 90 * I; im.data[q + 3] = 255;
      }
      ox.putImageData(im, 0, 0);
      g.fillStyle = '#171026'; g.fillRect(0, 0, 640, 320); g.imageSmoothingEnabled = true; g.drawImage(off, 20, 10, 300, 300);
      g.fillStyle = '#efeaf6'; g.font = '13px IBM Plex Sans, sans-serif'; g.textAlign = 'left';
      var tilt = Math.hypot(ax, ay), sp = tilt > 0 ? lam / (2 * tilt) : Infinity, nAcross = tilt * 2 * FOV / lam;
      var lines = ['Fringe spacing: ' + (isFinite(sp) ? fmtLen(sp) : '∞'), 'Tilt fringes across 10 mm: ' + fx(nAcross, 1), 'Fringe visibility: ' + fx(Vis, 2), '', nAcross < 1 && Math.abs(Rinv) < 2 ? 'Fluffed out: one fringe fills the beam —' : nAcross < 1 ? 'Rings: the two wavefronts differ' : 'Straight fringes: the returning beams', nAcross < 1 && Math.abs(Rinv) < 2 ? 'the returning beams are parallel.' : nAcross < 1 ? 'in curvature (a focus error in one arm).' : 'cross at an angle; reduce the tilt.', '', Vis < 0.2 ? 'Path difference beyond the coherence length:' : '', Vis < 0.2 ? 'equalise the arms until fringes appear.' : ''];
      lines.forEach(function (t, n) { g.fillText(t, 345, 50 + n * 24); });
      readout(read, [[fx(Vis, 2), 'visibility with ' + SRC[ss.get()][0]], [fx(2 * dpath * 1000, 1) + ' µm', 'optical path difference (twice the arm difference)']]);
    };
    var sa = VL.slider(ctl, { label: 'Mirror tilt x', min: -0.2, max: 0.2, step: 0.001, value: 0.12, fmt: function (v) { return fx(v, 3) + ' mrad'; }, on: draw });
    var sb = VL.slider(ctl, { label: 'Mirror tilt y', min: -0.2, max: 0.2, step: 0.001, value: 0, fmt: function (v) { return fx(v, 3) + ' mrad'; }, on: draw });
    var sd = VL.slider(ctl, { label: 'Arm length difference', min: -2, max: 2, step: 0.001, value: 0, fmt: function (v) { return fx(v, 3) + ' mm'; }, on: draw });
    var sr = VL.slider(ctl, { label: 'Curvature mismatch 1/R', min: -50, max: 50, step: 0.5, value: 0, fmt: function (v) { return fx(v, 1) + ' m⁻¹ ×10⁻³'; }, on: draw });
    var ss = VL.select(ctl, { label: 'Source', options: [['hene', SRC.hene[0]], ['diode', SRC.diode[0]], ['led', SRC.led[0]]], value: 'hene', on: draw });
    draw();
  };

  /* ═══ 9. thermal drift ═══ */
  F.drift = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var MAT = { al: ['Aluminium', 23.1], ss: ['Stainless steel', 17.3], steel: ['Carbon steel', 12], invar: ['Invar', 1.2] };
    var draw = function () {
      var m = MAT[sm.get()], h = sh.get(), dT = sT.get(), f = sd.get(), L = sL.get() * 1000;
      var dh = m[1] * 1e-6 * h * dT, ang = dh / f, off = ang * L;
      readout(read, [[fmtLen(dh), 'the post grows by α h ΔT: the lens moves this far relative to the beam'], [fx(ang * 1e6, 1) + ' µrad', 'beam steered by Δh / f'], [fmtLen(off), 'beam moves this far at a target ' + fx(L / 1000, 1) + ' m away'], [fx(dh / 1e-3, 1) + ' ×', 'the ≈ 1 µm lateral tolerance of single-mode fibre coupling (Figure 7)']]);
    };
    var sm = VL.select(ctl, { label: 'Post material', options: [['al', 'Aluminium (23 ppm/K)'], ['ss', 'Stainless steel (17 ppm/K)'], ['steel', 'Carbon steel (12 ppm/K)'], ['invar', 'Invar (1.2 ppm/K)']], value: 'ss', on: draw });
    var sh = VL.slider(ctl, { label: 'Beam height (post length)', min: 50, max: 200, step: 5, value: 100, fmt: function (v) { return v + ' mm'; }, on: draw });
    var sT = VL.slider(ctl, { label: 'Temperature change of this post only', min: 0.1, max: 5, step: 0.1, value: 1, fmt: function (v) { return fx(v, 1) + ' K'; }, on: draw });
    var sd = VL.slider(ctl, { label: 'Focal length of the lens on it', min: 5, max: 500, step: 5, value: 50, fmt: function (v) { return v + ' mm'; }, on: draw });
    var sL = VL.slider(ctl, { label: 'Distance to the target', min: 0.2, max: 10, step: 0.1, value: 2, fmt: function (v) { return fx(v, 1) + ' m'; }, on: draw });
    draw();
  };

  /* ═══ 10. test yourself ═══ */
  var QUIZ = [
    ['A 5 mW green laser pointer is which class (approximately)?', ['Class 1', 'Class 2', 'Class 3R', 'Class 4'], 2, 'Visible, continuous, between 1 and 5 mW: class 3R. Never look into the beam.'],
    ['Why should the beam stay well below eye level, at a fixed height?', ['To save space', 'Stray reflections then travel in the plane of the table, not into your eyes', 'Lasers work better low', 'For the camera'], 1, 'A horizontal beam at a fixed height keeps reflections in that plane; bending down to the table puts your eyes into it.'],
    ['Two mirrors, two irises after them. Which pairing converges?', ['M2 on the near iris, M1 on the far iris', 'M1 on the near iris, M2 on the far iris', 'Either', 'Neither'], 1, 'With mirrors at z₁ < z₂ and irises at z₃ < z₄ the error shrinks by (z₃−z₂)(z₄−z₁)/[(z₃−z₁)(z₄−z₂)] < 1 per round; the swapped pairing multiplies it by the inverse.'],
    ['Why do you want the two irises far apart?', ['It looks better', 'A given angle error then shows up as a large offset, and the walking converges faster', 'To block more light', 'It does not matter'], 1, 'Separation turns small angles into measurable offsets.'],
    ['A lens 0.5 mm off centre (f = 100 mm) deflects a collimated beam by…', ['0.05 mrad', '5 mrad', '50 mrad', 'nothing'], 1, 'Deflection = decentre / f = 0.5 / 100 = 5 mrad.'],
    ['How do you check that a lens is perpendicular to the beam?', ['By eye', 'Its weak back-reflection should go straight back through the iris', 'With a power meter', 'By the label'], 1, 'A surface tilted by τ sends its reflection back at 2τ.'],
    ['After a 4× beam expander the beam grows slowly over 10 m. What do you adjust?', ['The laser power', 'The spacing of the two lenses', 'The beam height', 'Nothing'], 1, 'Collimation means the spacing equals f₁ + f₂; a shear plate or a far-field size check tells you which way to go.'],
    ['What pinhole should follow a 10 mm lens focusing a 1 mm, 633 nm beam?', ['1 µm', 'about 12 µm', '100 µm', '1 mm'], 1, 'Spot diameter 4λf/(πD) ≈ 8 µm; choose about 1.5 times that.'],
    ['Coupling into a single-mode fibre is lowest-loss when…', ['the spot is as small as possible', 'the focused spot matches the fibre mode field diameter, centred and straight on', 'the beam is diverging', 'the fibre is bent'], 1, 'Efficiency is the overlap of two Gaussians: size, offset, focus and angle all matter.'],
    ['In a Michelson, the fringes "fluff out" (one fringe fills the beam). This means…', ['the laser is off', 'the two returning beams are parallel', 'the arms are unequal', 'too much light'], 1, 'No tilt between the wavefronts leaves no tilt fringes.'],
    ['Fringes vanish when one arm of a white-light interferometer is moved by 0.1 mm because…', ['the mirror is dirty', 'the path difference exceeds the coherence length of the source', 'of vibration', 'the detector saturates'], 1, 'A broadband source has a coherence length of micrometres; fringes appear only near equal paths.'],
    ['A 100 mm stainless post warms by 1 K. It grows by about…', ['1.7 nm', '1.7 µm', '17 µm', '0.17 mm'], 1, '17.3 × 10⁻⁶ /K × 100 mm × 1 K ≈ 1.7 µm — small, yet more than the ≈ 1 µm lateral tolerance of coupling into a single-mode fibre.']
  ];
  F.alnquiz = function (fig) {
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
})();
