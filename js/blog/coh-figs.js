/* Interferometry and coherence — interactive figures (uses vl-core.js helpers).
   Two-beam interference, Young's fringes with partial spatial coherence (van Cittert–Zernike),
   temporal coherence from the spectrum (Wiener–Khinchin), interferometer layouts, quadrature
   fringe counting, Fizeau surface testing, white-light scanning, spectral-domain OCT, the
   shot-noise limit of a Michelson, Hanbury Brown–Twiss photon correlations and speckle. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var fx = function (v, d) { return (+v).toFixed(d == null ? 2 : d); };
  var readout = function (el, rows) { el.innerHTML = rows.map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join(''); };
  var svgOpen = function (w, h, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="plot" role="img" aria-label="' + VL.esc(label) + '">'; };
  var txt = function (x, y, s, o) { o = o || {}; return '<text x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '" class="' + (o.cls || 'pl-tick') + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.fill ? ' fill="' + o.fill + '"' : '') + '>' + s + '</text>'; };
  var line = function (a, b, col, w, extra) { return '<line x1="' + (+a[0]).toFixed(1) + '" y1="' + (+a[1]).toFixed(1) + '" x2="' + (+b[0]).toFixed(1) + '" y2="' + (+b[1]).toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 1.5) + '"' + (extra || '') + '/>'; };
  var fmtLen = function (m) { var a = Math.abs(m); return a >= 1 ? fx(m, 2) + ' m' : a >= 1e-3 ? fx(m * 1e3, a >= 0.1 ? 0 : 1) + ' mm' : a >= 1e-6 ? fx(m * 1e6, a >= 1e-4 ? 0 : 1) + ' µm' : a >= 1e-9 ? fx(m * 1e9, 1) + ' nm' : VL.sci(m, 1) + ' m'; };
  var sinc = function (x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; };
  /* approximate colour of a wavelength (nm) as [r, g, b] in 0..1 */
  var wlRGB = function (l) {
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
    var k = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 700 ? 0.3 + 0.7 * (780 - l) / 80 : 1;
    return [Math.max(0, r * k), Math.max(0, g * k), Math.max(0, b * k)];
  };
  var wlCss = function (l) { var c = wlRGB(l); return 'rgb(' + c.map(function (v) { return Math.round(255 * Math.pow(v, 0.8)); }).join(',') + ')'; };
  /* Bessel J1 by its integral representation */
  var J1 = function (x) { var n = 96, s = 0; for (var i = 0; i < n; i++) { var t = (i + 0.5) * Math.PI / n; s += Math.cos(t - x * Math.sin(t)); } return s / n; };
  /* in-place radix-2 FFT of re[], im[] (length a power of two) */
  var fft = function (re, im) {
    var n = re.length, i, j, k;
    for (i = 1, j = 0; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) { var cr = 1, ci = 0; for (k = 0; k < len / 2; k++) { var a = i + k, b2 = a + len / 2, xr = re[b2] * cr - im[b2] * ci, xi = re[b2] * ci + im[b2] * cr; re[b2] = re[a] - xr; im[b2] = im[a] - xi; re[a] += xr; im[a] += xi; var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
    }
  };
  var seedRnd = function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  var gauss = function (rnd) { var u = Math.max(1e-12, rnd()), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ═══ 1. adding two waves ═══ */
  F.twowave = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var r = sr.get(), g = sg.get(), th = st.get() * Math.PI / 180, I1 = 1, I2 = r, mix = 2 * Math.sqrt(I1 * I2) * g * Math.cos(th);
      var V = mix / (I1 + I2), xs = VL.linspace(0, 4, 400);
      plot.innerHTML = VL.plot({ id: 'tw', label: 'Two-beam interference', w: 680, h: 280, x: { min: 0, max: 4, label: 'Path difference (wavelengths)' }, y: { min: 0, max: 5, label: 'Intensity (units of I₁)' },
        series: [{ data: xs.map(function (u) { return [u, I1 + I2 + mix * Math.cos(2 * Math.PI * u)]; }), color: C.au, label: 'interference' }, { data: [[0, I1 + I2], [4, I1 + I2]], color: C.text3, dash: '4 4', label: 'I₁ + I₂ (no interference)' }], legend: true, legendX: 14, legendY: 14 });
      readout(read, [[fx(V, 3), 'fringe visibility V = (I_max − I_min)/(I_max + I_min)'], [fx(2 * Math.sqrt(r) / (1 + r), 3), 'from the intensity ratio alone, 2√(I₁I₂)/(I₁+I₂)'], [fx(g, 2) + ' × ' + fx(Math.cos(th), 2), 'coherence |γ| × polarisation overlap cos θ'], [fx(I1 + I2, 2), 'average intensity: energy is redistributed, not created']]);
    };
    var sr = VL.slider(ctl, { label: 'Intensity ratio I₂/I₁', min: 0, max: 1, step: 0.01, value: 1, fmt: function (v) { return fx(v, 2); }, on: draw });
    var sg = VL.slider(ctl, { label: 'Degree of coherence |γ|', min: 0, max: 1, step: 0.01, value: 1, fmt: function (v) { return fx(v, 2); }, on: draw });
    var st = VL.slider(ctl, { label: 'Angle between polarisations', min: 0, max: 90, step: 1, value: 0, fmt: function (v) { return v + '°'; }, on: draw });
    draw();
  };

  /* ═══ 2. Young's double slit with a finite source ═══ */
  F.young = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 70), plot = VL.part(fig, 'vl-plot');
    var L = 1, R = 0.5;   // slits → screen, source → slits (m)
    var draw = function () {
      var d = sd.get() * 1e-3, a = sa.get() * 1e-6, s = ss.get() * 1e-6, mode = sl.get();
      var lams = mode === 'white' ? VL.linspace(420, 680, 27) : [+mode];
      var xmax = 6e-3, N = 680, I = [], rgb = [];
      for (var i = 0; i < N; i++) {
        var x = (i / (N - 1) - 0.5) * 2 * xmax, tot = 0, c = [0, 0, 0];
        lams.forEach(function (ln) { var lam = ln * 1e-9, gam = sinc(Math.PI * s * d / (lam * R)), env = Math.pow(sinc(Math.PI * a * x / (lam * L)), 2), v = env * (1 + gam * Math.cos(2 * Math.PI * d * x / (lam * L))); tot += v; var k = wlRGB(ln); c[0] += v * k[0]; c[1] += v * k[1]; c[2] += v * k[2]; });
        I.push([x * 1e3, tot / lams.length / 2]); rgb.push(c.map(function (q) { return q / lams.length; }));
      }
      var mx = Math.max.apply(null, rgb.map(function (c) { return Math.max(c[0], c[1], c[2]); })) || 1;
      for (i = 0; i < N; i++) { g.fillStyle = 'rgb(' + rgb[i].map(function (q) { return Math.round(255 * Math.min(1, q / mx)); }).join(',') + ')'; g.fillRect(i, 0, 1.2, 70); }
      var lam0 = (mode === 'white' ? 550 : +mode) * 1e-9, gam0 = sinc(Math.PI * s * d / (lam0 * R)), dc = lam0 * R / s;
      plot.innerHTML = VL.plot({ id: 'yg', label: 'Intensity on the screen', w: 680, h: 240, x: { min: -6, max: 6, label: 'Position on a screen 1 m away (mm)' }, y: { min: 0, max: 1.05, label: 'Intensity' }, series: [{ data: I, color: mode === 'white' ? C.text : wlCss(+mode), width: 1.6 }] });
      readout(read, [[fmtLen(lam0 * L / d), 'fringe spacing λL/d'], [fx(Math.abs(gam0), 2) + (gam0 < 0 ? ' (inverted)' : ''), 'visibility set by the source: |sinc(π s d / λR)|'], [fmtLen(dc), 'slit separation at which the fringes first vanish, λR/s'], [mode === 'white' ? 'coloured fringes' : 'single colour', mode === 'white' ? 'only the central few fringes survive: white light has little temporal coherence' : 'width of the envelope set by the slit width, λL/a']]);
    };
    var sd = VL.slider(ctl, { label: 'Slit separation d', min: 0.05, max: 1, step: 0.01, value: 0.25, fmt: function (v) { return fx(v, 2) + ' mm'; }, on: draw });
    var sa = VL.slider(ctl, { label: 'Slit width a', min: 5, max: 100, step: 1, value: 40, fmt: function (v) { return v + ' µm'; }, on: draw });
    var ss = VL.slider(ctl, { label: 'Source slit width s (0.5 m before)', min: 1, max: 2000, step: 1, value: 200, fmt: function (v) { return v + ' µm'; }, on: draw });
    var sl = VL.select(ctl, { label: 'Light', options: [['633', 'red, 633 nm'], ['532', 'green, 532 nm'], ['450', 'blue, 450 nm'], ['white', 'white light']], value: '633', on: draw });
    draw();
  };

  /* ═══ 3. temporal coherence from the spectrum ═══ */
  F.temporal = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot'), plot2 = VL.part(fig, 'vl-plot');
    var c = 2.99792458e8;
    var draw = function () {
      var shape = sh.get(), l0 = shape === 'na' ? 589.29e-9 : 600e-9, dl = sw.get() * 1e-9, nu0 = c / l0, dnu = c * dl / (l0 * l0), split = shape === 'na' ? c * 0.597e-9 / (l0 * l0) : 0;
      var gam = function (opd) { var tau = Math.abs(opd) / c, e = shape === 'lor' ? Math.exp(-Math.PI * dnu * tau) : Math.exp(-Math.pow(Math.PI * dnu * tau, 2) / (4 * Math.LN2)); return shape === 'na' ? e * Math.sqrt(5 + 4 * Math.cos(2 * Math.PI * split * tau)) / 3 : e; };   // D2 : D1 ≈ 2 : 1
      var Lc = l0 * l0 / dl, span = shape === 'na' ? Math.max(1.2e-3, 3 * Lc) : 3 * Lc;
      var ls = VL.linspace(l0 - (shape === 'na' ? Math.max(1.5e-9, 4 * dl) : 4 * dl), l0 + (shape === 'na' ? Math.max(1.5e-9, 4 * dl) : 4 * dl), 500);
      var S = function (l) { var prof = function (lc) { var x = (l - lc) / dl; return shape === 'lor' ? 1 / (1 + 4 * x * x) : Math.exp(-4 * Math.LN2 * x * x); }; return shape === 'na' ? prof(588.995e-9) + 0.5 * prof(589.592e-9) : prof(l0); };
      plot.innerHTML = VL.plot({ id: 'ts', label: 'Spectrum', w: 680, h: 200, x: { min: ls[0] * 1e9, max: ls[ls.length - 1] * 1e9, label: 'Wavelength (nm)' }, y: { min: 0, max: 1.1, label: 'Spectrum' }, series: [{ data: ls.map(function (l) { return [l * 1e9, S(l)]; }), color: C.au, fill: 0.15 }] });
      var unit = span > 0.02 ? 1e-3 : 1e-6, uName = unit === 1e-3 ? 'mm' : 'µm';
      var o = so.get() / 100 * span;
      var env = VL.linspace(0, span, 400).map(function (z) { return [z / unit, Math.abs(gam(z))]; });
      plot2.innerHTML = VL.plot({ id: 'tv', label: 'Fringe visibility against path difference', w: 680, h: 220, x: { min: 0, max: span / unit, label: 'Path difference (' + uName + ')' }, y: { min: 0, max: 1.05, label: 'Visibility |γ|' },
        series: [{ data: env, color: C.cyan }], vlines: [{ x: Lc / unit, color: C.text3, label: 'λ²/Δλ' }], marks: [{ x: o / unit, y: Math.abs(gam(o)), color: C.au }] });
      readout(read, [[fmtLen(Lc), 'coherence length λ²/Δλ (definitions differ by factors near 1)'], [VL.sci(1 / dnu, 2) + ' s', 'coherence time ≈ 1/Δν'], [fx(Math.abs(gam(o)), 3), 'visibility at the marked path difference ' + fmtLen(o)], shape === 'na' ? [fx(l0 * l0 / 0.597e-9 / 2 * 1e3, 3) + ' mm', 'the D lines beat: visibility falls to 1/3 every λ²/(2δλ) of mirror travel'] : ['', '']].filter(function (r) { return r[0]; }));
    };
    var sh = VL.select(ctl, { label: 'Spectrum', options: [['gau', 'Gaussian line'], ['lor', 'Lorentzian line'], ['na', 'Sodium D doublet']], value: 'gau', on: draw });
    var sw = VL.slider(ctl, { label: 'Line width Δλ (FWHM)', min: -4, max: 1.7, step: 0.01, value: -0.3, log: true, fmt: function (v) { return v >= 1 ? fx(v, 1) + ' nm' : v >= 1e-3 ? fx(v * 1000, 1) + ' pm' : fx(v * 1e6, 0) + ' fm'; }, on: draw });
    var so = VL.slider(ctl, { label: 'Path difference (marker)', min: 0, max: 100, step: 0.5, value: 25, fmt: function (v) { return fx(v, 0) + ' % of plot'; }, on: draw });
    draw();
  };

  /* ═══ 4. spatial coherence of an extended source ═══ */
  F.spatial = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var PRE = { sun: ['The Sun (0.53°, 550 nm)', 9.3e-3, 550e-9], betel: ['Betelgeuse (0.047″, 575 nm)', 0.047 / 206265, 575e-9], pin: ['1 mm pinhole seen from 1 m (550 nm)', 1e-3, 550e-9], led: ['LED die 0.3 mm at 10 cm (630 nm)', 3e-3, 630e-9] };
    var draw = function () {
      var p = PRE[sp.get()], th = p[1], lam = p[2], d0 = 1.22 * lam / th, d = sd.get() / 100 * 3 * d0;
      var gm = function (dd) { var v = Math.PI * th * dd / lam; return Math.abs(v) < 1e-9 ? 1 : 2 * J1(v) / v; };
      var unit = d0 > 0.5 ? 1 : d0 > 5e-4 ? 1e-3 : 1e-6, un = unit === 1 ? 'm' : unit === 1e-3 ? 'mm' : 'µm';
      var xs = VL.linspace(0, 3 * d0, 300);
      plot.innerHTML = VL.plot({ id: 'sc', label: 'Degree of coherence against separation', w: 680, h: 260, x: { min: 0, max: 3 * d0 / unit, label: 'Separation of the two points (' + un + ')' }, y: { min: 0, max: 1.05, label: 'Visibility |γ₁₂|' },
        series: [{ data: xs.map(function (z) { return [z / unit, Math.abs(gm(z))]; }), color: C.cyan }], vlines: [{ x: d0 / unit, color: C.text3, label: '1.22 λ/θ' }], marks: [{ x: d / unit, y: Math.abs(gm(d)), color: C.au }] });
      readout(read, [[fmtLen(d0), 'separation where fringes first vanish, 1.22 λ/θ'], [th > 1e-4 ? fx(th * 1e3, 2) + ' mrad' : fx(th * 206265 * 1000, 0) + ' mas', 'angular diameter θ of the source'], [fx(Math.abs(gm(d)), 3), 'visibility at ' + fmtLen(d)], [sp.get() === 'betel' ? 'Michelson & Pease, 1920' : '', sp.get() === 'betel' ? 'the fringes vanished near 3 m mirror separation on the 6 m beam of the Mount Wilson interferometer' : '']].filter(function (r) { return r[0]; }));
    };
    var sp = VL.select(ctl, { label: 'Source', options: Object.keys(PRE).map(function (k) { return [k, PRE[k][0]]; }), value: 'sun', on: draw });
    var sd = VL.slider(ctl, { label: 'Separation (marker)', min: 0, max: 100, step: 0.5, value: 20, fmt: function (v) { return fx(v, 0) + ' % of plot'; }, on: draw });
    draw();
  };

  /* ═══ 5. the family of interferometers ═══ */
  F.types = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.html(fig, ''), note = VL.part(fig, 'vl-readout');
    var W = 680, H = 300, R = C.red;
    var bs = function (x, y, rot) { return '<rect x="' + (x - 14) + '" y="' + (y - 2.5) + '" width="28" height="5" fill="rgba(69,191,214,.45)" stroke="' + C.cyan + '" transform="rotate(' + (rot || -45) + ' ' + x + ' ' + y + ')"/>'; };
    var mir = function (x, y, rot) { return '<rect x="' + (x - 16) + '" y="' + (y - 3) + '" width="32" height="6" fill="#cfd6e4" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>'; };
    var det = function (x, y, lab) { return '<rect x="' + (x - 10) + '" y="' + (y - 10) + '" width="20" height="20" rx="3" fill="#30353d" stroke="' + C.text3 + '"/>' + (lab === '' ? '' : txt(x, y + 26, lab || 'detector', {})); };
    var src = function (x, y) { return '<rect x="' + (x - 34) + '" y="' + (y - 9) + '" width="34" height="18" rx="3" fill="#30353d" stroke="' + C.text3 + '"/>' + txt(x - 17, y + 26, 'source', {}); };
    var pl = function (pts, col, dash) { return '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + (col || R) + '" stroke-width="2"' + (dash ? ' stroke-dasharray="5 4"' : '') + '/>'; };
    var LAY = {
      mich: ['Michelson', function () { return src(110, 150) + pl([[110, 150], [520, 150]]) + pl([[300, 150], [300, 50]], C.au) + pl([[300, 150], [300, 260]], C.au) + bs(300, 150) + mir(520, 150, 90) + mir(300, 50, 0) + det(300, 268) + txt(540, 120, 'M1 (movable)', { anchor: 'start' }) + txt(320, 46, 'M2', { anchor: 'start' }) + txt(300, 180, 'beam splitter', { anchor: 'start' }); },
        'Amplitude division, the beams retrace their paths. Moving one mirror by λ/2 shifts one fringe. Used for displacement, FTIR spectrometers (Part 2), the Michelson–Morley experiment and, folded and enlarged, gravitational-wave detectors.'],
      mz: ['Mach–Zehnder', function () { return src(100, 230) + pl([[100, 230], [220, 230], [520, 230], [520, 70], [600, 70]]) + pl([[220, 230], [220, 70], [520, 70], [520, 30]], C.au) + bs(220, 230) + mir(520, 230, 45) + mir(220, 70, 45) + bs(520, 70) + '<rect x="330" y="215" width="60" height="30" fill="rgba(224,168,46,.15)" stroke="' + C.au + '"/>' + txt(360, 268, 'sample', {}) + det(610, 70, 'output 1') + det(520, 22, '') + txt(560, 26, 'output 2', { anchor: 'start' }); },
        'Two separate arms that are each crossed once: a sample in one arm changes the phase without being double-passed. The two outputs are complementary. Used for flow and plasma visualisation, electro-optic modulators and integrated photonics.'],
      sag: ['Sagnac', function () { return src(100, 230) + pl([[100, 230], [260, 230]]) + pl([[260, 230], [560, 230], [560, 70], [260, 70], [260, 230]], C.au) + pl([[262, 228], [558, 228], [558, 72], [262, 72], [262, 228]], C.cyan, true) + bs(260, 230) + mir(560, 230, 45) + mir(560, 70, -45) + mir(260, 70, 45) + pl([[260, 230], [260, 280]]) + det(260, 270, '') + txt(285, 280, 'detector', { anchor: 'start' }) + txt(410, 150, 'counter-propagating beams share one loop', {}); },
        'Both beams travel the same loop in opposite directions, so the paths are equal and very stable. Rotation at Ω makes them differ by 4AΩ/(λc) fringes for a loop of area A: the principle of the fibre-optic gyroscope.'],
      fiz: ['Fizeau', function () { return src(100, 60) + pl([[100, 60], [200, 60]]) + '<ellipse cx="220" cy="60" rx="5" ry="24" fill="rgba(69,191,214,.25)" stroke="' + C.cyan + '"/>' + pl([[220, 60], [340, 60]]) + bs(340, 60) + pl([[340, 60], [340, 270]]) + '<rect x="300" y="180" width="80" height="10" fill="rgba(69,191,214,.35)" stroke="' + C.cyan + '"/>' + txt(400, 189, 'reference flat', { anchor: 'start' }) + '<rect x="300" y="225" width="80" height="16" fill="#9aa3b5"/>' + txt(400, 238, 'surface under test', { anchor: 'start' }) + pl([[340, 60], [520, 60]], C.au) + det(530, 60, 'camera') + txt(240, 290, 'the thin gap between the two surfaces makes the fringes', {}); },
        'The reference and test surfaces face each other across a thin gap, so both beams share almost the whole path. Each fringe is a contour of constant gap, λ/2 apart in height. The standard test for flats, lenses and wafers (Figure 7).'],
      fp: ['Fabry–Pérot', function () { return src(110, 150) + pl([[110, 150], [600, 150]]) + '<rect x="280" y="90" width="8" height="120" fill="rgba(69,191,214,.5)" stroke="' + C.cyan + '"/><rect x="420" y="90" width="8" height="120" fill="rgba(69,191,214,.5)" stroke="' + C.cyan + '"/>' + [0, 1, 2, 3].map(function (k) { return pl([[290, 140 - k * 10], [418, 136 - k * 10], [290, 132 - k * 10]], 'rgba(226,86,110,' + (0.8 - k * 0.18) + ')'); }).join('') + det(610, 150) + txt(354, 230, 'two parallel partly reflecting mirrors', {}); },
        'Many beams instead of two: light bouncing between two mirrors gives sharp transmission peaks whose width is the free spectral range divided by the finesse. Etalons, laser cavities and the arm cavities of gravitational-wave detectors (Part 2 covers it in detail).']
    };
    var draw = function () { var k = sk.get(), L = LAY[k]; host.innerHTML = svgOpen(W, H, L[0] + ' interferometer') + L[1]() + '</svg>'; readout(note, [[L[0], L[2]]]); };
    var sk = VL.select(ctl, { label: 'Interferometer', options: Object.keys(LAY).map(function (k) { return [k, LAY[k][0]]; }), value: 'mich', on: draw });
    draw();
  };

  /* ═══ 6. counting fringes: one detector or two in quadrature ═══ */
  F.quad = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 260);
    var lam = 0.633, t = 0, hist = [], unwrapped = 0, lastPh = null, count = 0, lastSign = null;
    var reset = function () { t = 0; hist = []; unwrapped = 0; lastPh = null; count = 0; lastSign = null; };
    var sm = VL.select(ctl, { label: 'Detection', options: [['quad', 'two detectors in quadrature'], ['one', 'one detector']], value: 'quad', on: function () {} });
    var sa = VL.slider(ctl, { label: 'Mirror travel amplitude', min: 0.2, max: 3, step: 0.05, value: 1, fmt: function (v) { return fx(v, 2) + ' µm'; }, on: reset });
    var sf = VL.slider(ctl, { label: 'Speed', min: 0.05, max: 0.5, step: 0.01, value: 0.15, fmt: function (v) { return fx(v, 2) + ' Hz'; }, on: reset });
    var lp = VL.loop(fig, function (dt) {
      var A = sa.get(), f = sf.get();
      t += dt;
      var x = A * Math.sin(2 * Math.PI * f * t) + 0.15 * A * (Math.sin(2 * Math.PI * 0.31 * f * t + 1) - Math.sin(1));   // µm, starts at 0
      var ph = 4 * Math.PI * x / lam, cx = Math.cos(ph), sy = Math.sin(ph);
      // quadrature: unwrap the phase of (cos, sin)
      var a = Math.atan2(sy, cx); if (lastPh != null) { var d = a - lastPh; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; unwrapped += d; } else unwrapped = a; lastPh = a;
      // single detector: count every rising crossing of the mean, direction unknown
      var sgn = cx > 0; if (lastSign != null && sgn && !lastSign) count++; lastSign = sgn;
      hist.push([t, cx, sy, x]); while (hist.length && hist[0][0] < t - 4) hist.shift();
      // draw
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 260);
      var X = function (tt) { return 20 + (tt - (t - 4)) / 4 * 400; };
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.strokeRect(20, 26, 400, 92); g.strokeRect(20, 150, 400, 92);
      var trace = function (k, y0, col) { g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); hist.forEach(function (h, i) { var yy = y0 - h[k] * 42; if (i) g.lineTo(X(h[0]), yy); else g.moveTo(X(h[0]), yy); }); g.stroke(); };
      trace(1, 72, C.au); if (sm.get() === 'quad') trace(2, 72, C.cyan);
      g.strokeStyle = C.red; g.lineWidth = 1.6; g.beginPath(); hist.forEach(function (h, i) { var yy = 196 - h[3] / (1.2 * A) * 40; if (i) g.lineTo(X(h[0]), yy); else g.moveTo(X(h[0]), yy); }); g.stroke();
      g.fillStyle = C.text2; g.font = '12px IBM Plex Mono, monospace'; g.textAlign = 'left';
      g.fillText(sm.get() === 'quad' ? 'detector signals: cos φ (gold), sin φ (cyan)' : 'detector signal: cos φ', 20, 18); g.fillText('mirror position', 20, 143);
      // Lissajous
      var cxp = 550, cyp = 130, rr = 90; g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(cxp, cyp, rr, 0, 2 * Math.PI); g.stroke();
      if (sm.get() === 'quad') { g.fillStyle = C.au; g.beginPath(); g.arc(cxp + cx * rr, cyp - sy * rr, 6, 0, 2 * Math.PI); g.fill(); g.fillStyle = C.text2; g.textAlign = 'center'; g.fillText('sin φ against cos φ', cxp, 248); g.fillText('one turn = λ/2 of mirror travel', cxp, 26); }
      else { g.fillStyle = C.au; g.fillRect(cxp - 2, cyp - rr, 4, 2 * rr); g.beginPath(); g.arc(cxp, cyp - cx * rr, 6, 0, 2 * Math.PI); g.fill(); g.fillStyle = C.text2; g.textAlign = 'center'; g.fillText('one signal: forwards and back', cxp, 236); g.fillText('look the same', cxp, 250); }
      readout(read, [[fx(x, 3) + ' µm', 'true mirror position'], [fx(unwrapped * lam / (4 * Math.PI), 3) + ' µm', 'position from the two quadrature signals (unwrapped phase × λ/4π)'], [fx(count * lam / 2, 2) + ' µm', 'travel from counting fringes on one detector: keeps growing, because reversals are counted as forward motion']]);
    });
    VL.playButton(ctl, lp); VL.button(ctl, 'Reset counters', reset);
  };

  /* ═══ 7. testing a surface in a Fizeau interferometer ═══ */
  F.fizeau = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 300);
    var N = 220, off = document.createElement('canvas'); off.width = N; off.height = N;
    var draw = function () {
      var tx = s1.get(), df = s2.get(), as = s3.get(), co = s4.get(), sp = s5.get(), lam = 632.8;
      var ctx = off.getContext('2d'), im = ctx.createImageData(N, N), hs = [];
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var x = (i / (N - 1)) * 2 - 1, y = (j / (N - 1)) * 2 - 1, r2 = x * x + y * y, q = (j * N + i) * 4;
        if (r2 > 1) { im.data[q] = 23; im.data[q + 1] = 16; im.data[q + 2] = 38; im.data[q + 3] = 255; continue; }
        var h = df * (2 * r2 - 1) + as * (x * x - y * y) + co * (3 * r2 - 2) * y + sp * (6 * r2 * r2 - 6 * r2 + 1);   // surface error in waves (height)
        hs.push(h);
        var I = 0.5 * (1 + Math.cos(2 * Math.PI * (2 * h + tx * x)));   // double pass: 2h; tilt in fringes across the radius
        im.data[q] = 40 + 215 * I; im.data[q + 1] = 30 + 70 * I; im.data[q + 2] = 40 + 60 * I; im.data[q + 3] = 255;
      }
      ctx.putImageData(im, 0, 0);
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 300); g.imageSmoothingEnabled = true; g.drawImage(off, 20, 10, 280, 280);
      var mn = Math.min.apply(null, hs), mx = Math.max.apply(null, hs), mean = hs.reduce(function (a, b) { return a + b; }, 0) / hs.length, rms = Math.sqrt(hs.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / hs.length);
      g.fillStyle = '#efeaf6'; g.font = '13px IBM Plex Sans, sans-serif'; g.textAlign = 'left';
      ['Each fringe = λ/2 = ' + fx(lam / 2, 0) + ' nm of height', '', 'Straight, evenly spaced: flat (tilt only)', 'Circles: curved surface (power)', 'Saddle shapes: astigmatism', 'Bent fringes: coma or spherical error', '', 'Tilt only changes how many fringes', 'you see — not the surface.'].forEach(function (t2, n) { g.fillText(t2, 330, 50 + n * 24); });
      readout(read, [[fx((mx - mn) * lam, 0) + ' nm', 'peak-to-valley surface error (' + fx(mx - mn, 3) + ' λ)'], [fx(rms * lam, 1) + ' nm', 'rms surface error (' + fx(rms, 3) + ' λ)'], [rms < 1 / 14 / 2 ? 'diffraction-limited in reflection' : 'not diffraction-limited', 'Maréchal: wavefront rms ≤ λ/14; reflection doubles the surface error']]);
    };
    var s1 = VL.slider(ctl, { label: 'Tilt of the reference', min: -6, max: 6, step: 0.1, value: 3, fmt: function (v) { return fx(v, 1) + ' fringes'; }, on: draw });
    var s2 = VL.slider(ctl, { label: 'Power (defocus)', min: -1, max: 1, step: 0.01, value: 0.25, fmt: function (v) { return fx(v, 2) + ' λ'; }, on: draw });
    var s3 = VL.slider(ctl, { label: 'Astigmatism', min: -1, max: 1, step: 0.01, value: 0, fmt: function (v) { return fx(v, 2) + ' λ'; }, on: draw });
    var s4 = VL.slider(ctl, { label: 'Coma', min: -0.5, max: 0.5, step: 0.01, value: 0, fmt: function (v) { return fx(v, 2) + ' λ'; }, on: draw });
    var s5 = VL.slider(ctl, { label: 'Spherical', min: -0.5, max: 0.5, step: 0.01, value: 0, fmt: function (v) { return fx(v, 2) + ' λ'; }, on: draw });
    draw();
  };

  /* ═══ 8. white-light (coherence-scanning) interferometry ═══ */
  F.wli = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var SRC = { white: ['white LED, 450–700 nm', 575, 120], led: ['red LED, 630 ± 10 nm', 630, 20], laser: ['laser, 633 nm', 633, 0.01] };
    var draw = function () {
      var s = SRC[ss.get()], l0 = s[1], dl = s[2], step = sh.get();   // nm
      var lams = VL.linspace(l0 - 1.5 * dl, l0 + 1.5 * dl, dl < 1 ? 1 : 81), wts = lams.map(function (l) { return dl < 1 ? 1 : Math.exp(-4 * Math.LN2 * Math.pow((l - l0) / dl, 2)); }), W = wts.reduce(function (a, b) { return a + b; }, 0);
      var sig = function (z, h) { var I = 0; lams.forEach(function (l, i) { I += wts[i] * (1 + Math.cos(4 * Math.PI * (z - h) / l)); }); return I / W / 2; };
      var zs = VL.linspace(-1500, 1500 + step, 900);
      var A = zs.map(function (z) { return [z / 1000, sig(z, 0)]; }), B = zs.map(function (z) { return [z / 1000, sig(z, step) + 1.15]; });
      var env = function (z, h) { var re = 0, im = 0; lams.forEach(function (l, i) { var ph = 4 * Math.PI * (z - h) / l; re += wts[i] * Math.cos(ph); im += wts[i] * Math.sin(ph); }); return Math.hypot(re, im) / W; };   // fringe envelope
      var peak = function (h) { var best = -1, bz = 0; zs.forEach(function (z) { var e = env(z, h); if (e > best) { best = e; bz = z; } }); return bz; };
      var p0 = dl < 1 ? null : peak(0), p1 = dl < 1 ? null : peak(step);
      plot.innerHTML = VL.plot({ id: 'wl', label: 'Interference signal while scanning the objective', w: 680, h: 300, x: { min: zs[0] / 1000, max: zs[zs.length - 1] / 1000, label: 'Scan position (µm)' }, y: { min: 0, max: 2.7, label: 'Pixel signal' },
        series: [{ data: A, color: C.au, width: 1.4, label: 'pixel on the lower surface' }, { data: B, color: C.cyan, width: 1.4, label: 'pixel on the step (offset for clarity)' }], legend: true, legendX: 14, legendY: 12,
        vlines: p0 == null ? [] : [{ x: p0 / 1000, color: C.au, label: '' }, { x: p1 / 1000, color: C.cyan, label: '' }] });
      readout(read, [[fx(l0 * l0 / Math.max(dl, 1e-6) / 1000, dl < 1 ? 0 : 1) + ' µm', 'coherence length λ²/Δλ of the source'], [p0 == null ? 'ambiguous' : fx(p1 - p0, 0) + ' nm', p0 == null ? 'a laser gives fringes everywhere: the step is known only modulo λ/2 = ' + fx(l0 / 2, 0) + ' nm' : 'step height from the two envelope peaks (true: ' + step + ' nm)']]);
    };
    var ss = VL.select(ctl, { label: 'Source', options: Object.keys(SRC).map(function (k) { return [k, SRC[k][0]]; }), value: 'white', on: draw });
    var sh = VL.slider(ctl, { label: 'Step height', min: 0, max: 1200, step: 10, value: 400, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 9. spectral-domain optical coherence tomography ═══ */
  F.oct = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot'), plot2 = VL.part(fig, 'vl-plot');
    var draw = function () {
      var l0 = +sc.get() * 1e-9, dl = sb.get() * 1e-9, zt = sz.get() * 1e-6, n = 1.38;
      var NK = 2048, k0 = 2 * Math.PI / l0, dk = 2 * Math.PI * dl / (l0 * l0), kspan = 4 * dk, ks = [], re = [], im = [];
      var layers = [[150e-6, 0.03], [150e-6 + zt, 0.02], [150e-6 + zt + 60e-6, 0.012], [900e-6, 0.006]];   // optical depth (n·z) and amplitude reflectivity
      var sigk = dk / (2 * Math.sqrt(2 * Math.LN2));
      for (var i = 0; i < NK; i++) {
        var k = k0 - kspan / 2 + kspan * i / NK, S = Math.exp(-Math.pow(k - k0, 2) / (2 * sigk * sigk)), I = 1;
        layers.forEach(function (L) { I += 2 * L[1] * Math.cos(2 * k * L[0]); });
        ks.push([2 * Math.PI / k * 1e9, S * I]); re.push(S * (I - 1)); im.push(0);
      }
      fft(re, im);
      var dz = Math.PI / kspan, depth = [], mxv = 0;
      for (i = 0; i < NK / 2; i++) { var a = Math.hypot(re[i], im[i]); depth.push([i * dz / n * 1e6, a]); if (a > mxv) mxv = a; }
      depth = depth.map(function (p) { return [p[0], Math.max(-60, 20 * Math.log10(p[1] / mxv + 1e-6))]; });
      var res = 2 * Math.LN2 / Math.PI * l0 * l0 / dl;
      plot.innerHTML = VL.plot({ id: 'os', label: 'Interference spectrum on the spectrometer', w: 680, h: 200, x: { min: ks[NK - 1][0], max: ks[0][0], label: 'Wavelength (nm)' }, y: { min: 0, max: 1.2, label: 'Signal' }, series: [{ data: ks, color: C.au, width: 1 }] });
      plot2.innerHTML = VL.plot({ id: 'oa', label: 'A-scan: reflectivity against depth', w: 680, h: 240, x: { min: 0, max: 1000, label: 'Depth in tissue, n = 1.38 (µm)' }, y: { min: -60, max: 0, label: 'Reflectivity (dB)' }, series: [{ data: depth, color: C.cyan, width: 1.4 }] });
      readout(read, [[fx(res * 1e6, 1) + ' µm', 'axial resolution in air, (2 ln 2/π) λ₀²/Δλ'], [fx(res / n * 1e6, 1) + ' µm', 'in tissue (÷ n)'], [fx(zt * 1e6, 0) + ' µm', 'gap between the first two layers: ' + (zt / n < res / n ? 'not resolved' : 'resolved')], [fx(Math.PI / kspan * NK / 2 / n * 1e3, 2) + ' mm', 'imaging depth set by the spectrometer resolution (here 2048 pixels)']]);
    };
    var sc = VL.select(ctl, { label: 'Centre wavelength', options: [['840', '840 nm (retina)'], ['1060', '1060 nm'], ['1310', '1310 nm (skin, arteries)']], value: '840', on: draw });
    var sb = VL.slider(ctl, { label: 'Source bandwidth Δλ (FWHM)', min: 5, max: 150, step: 1, value: 50, fmt: function (v) { return v + ' nm'; }, on: draw });
    var sz = VL.slider(ctl, { label: 'Optical gap between layers 1 and 2', min: 2, max: 60, step: 0.5, value: 20, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 10. the shot-noise limit of a Michelson ═══ */
  F.ligo = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var h = 6.62607015e-34, c = 2.99792458e8, lam = 1064e-9;
    var hOf = function (P, L, Nb) { var Nph = P * lam / (h * c), dphi = 1 / Math.sqrt(Nph), dL = lam * dphi / (4 * Math.PI * Nb); return [Nph, dphi, dL, dL / L]; };
    var draw = function () {
      var P = sp.get(), L = sl.get(), Nb = sn.get(), r = hOf(P, L, Nb), Ps = VL.logspace(1e-3, 1e5, 120);
      plot.innerHTML = VL.plot({ id: 'lg', label: 'Shot-noise-limited strain sensitivity', w: 680, h: 280, x: { min: 1e-3, max: 1e5, log: true, label: 'Laser power at the beam splitter (W)' }, y: { min: 1e-26, max: 1e-14, log: true, label: 'Strain noise (per √Hz)' },
        series: [{ data: Ps.map(function (p) { return [p, hOf(p, L, Nb)[3]]; }), color: C.au }], marks: [{ x: P, y: r[3], color: C.au }], hlines: [{ y: 1e-22, color: C.cyan, label: 'GW150914: strain 10⁻²¹ over ≈ 100 Hz' }] });
      readout(read, [[VL.sci(r[0], 2) + ' /s', 'photons per second'], [VL.sci(r[1], 2) + ' rad/√Hz', 'phase noise 1/√N'], [VL.sci(r[2], 2) + ' m/√Hz', 'arm-length noise λ δφ / (4π N_b)'], [VL.sci(r[3], 2) + ' /√Hz', 'strain noise ΔL/L (idealised: no radiation pressure, seismic or thermal noise, no cavity bandwidth)']]);
    };
    var sp = VL.slider(ctl, { label: 'Power at the beam splitter', min: -3, max: 5, step: 0.01, value: 0, log: true, fmt: function (v) { return v >= 1000 ? fx(v / 1000, 1) + ' kW' : v >= 1 ? fx(v, 1) + ' W' : fx(v * 1000, 0) + ' mW'; }, on: draw });
    var sl = VL.slider(ctl, { label: 'Arm length', min: -1, max: 3.61, step: 0.01, value: 0, log: true, fmt: function (v) { return v >= 1000 ? fx(v / 1000, 2) + ' km' : fx(v, 1) + ' m'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'Effective round trips in each arm', min: 0, max: 3, step: 0.01, value: 0, log: true, fmt: function (v) { return fx(v, 0); }, on: draw });
    VL.button(ctl, 'Table-top Michelson', function () { sp.set(1e-3); sl.set(0.1); sn.set(1); });
    VL.button(ctl, 'LIGO-like', function () { sp.set(2000); sl.set(4000); sn.set(280); });
    draw();
  };

  /* ═══ 11. Hanbury Brown–Twiss: photon correlations ═══ */
  F.hbt = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), strip = VL.html(fig, ''), plot = VL.part(fig, 'vl-plot');
    var run = 1;
    var draw = function () {
      var kind = sk.get(), rnd = seedRnd(97 + run * 7919), T = 4000, rate = 1.5, ts = [], dt = 0.02, t;
      if (kind === 'coh') { t = 0; while (true) { t += -Math.log(Math.max(1e-12, rnd())) / rate; if (t > T) break; ts.push(t); } }
      else if (kind === 'th') { var er = 0, ei = 0, a = Math.exp(-dt), b = Math.sqrt((1 - a * a) / 2); for (t = 0; t < T; t += dt) { er = a * er + b * gauss(rnd); ei = a * ei + b * gauss(rnd); var I = er * er + ei * ei; if (rnd() < rate * I * dt) ts.push(t + rnd() * dt); } }
      else { t = 0; var kx = 1.5, eta = 0.5; T = 12000; while (t < T) { t += -Math.log(Math.max(1e-12, rnd())) / kx - Math.log(Math.max(1e-12, rnd())) / kx; if (rnd() < eta) ts.push(t); } }   // excitation then emission, each at rate kx; detection efficiency eta
      var bin = 0.1, maxT = 5, nb = Math.round(2 * maxT / bin), hist = new Array(nb).fill(0);
      for (var i = 0; i < ts.length; i++) for (var j = i + 1; j < ts.length && ts[j] - ts[i] < maxT; j++) { var d = ts[j] - ts[i]; hist[Math.floor((maxT + d) / bin)]++; hist[Math.floor((maxT - d) / bin)]++; }
      var r = ts.length / T, norm = r * r * T * bin, g2 = hist.map(function (v, k) { return [-maxT + (k + 0.5) * bin, v / norm]; });
      var theory = VL.linspace(-maxT, maxT, 300).map(function (x) { return [x, kind === 'coh' ? 1 : kind === 'th' ? 1 + Math.exp(-2 * Math.abs(x)) : 1 - Math.exp(-3 * Math.abs(x))]; });   // emitter: renewal density of an Erlang-2 process, 1 − e^(−2kτ)
      var s = svgOpen(680, 54, 'Photon arrival times') + '<rect x="10" y="10" width="660" height="34" rx="4" fill="rgba(255,255,255,.03)" stroke="' + C.grid + '"/>';
      ts.filter(function (x) { return x < 60; }).forEach(function (x) { var px = 14 + x / 60 * 652; s += line([px, 14], [px, 40], C.au, 1.2); });
      strip.innerHTML = s + '</svg>';
      plot.innerHTML = VL.plot({ id: 'hb', label: 'Second-order correlation g²(τ)', w: 680, h: 260, x: { min: -maxT, max: maxT, label: 'Delay τ (units of the correlation time of the source)' }, y: { min: 0, max: 2.4, label: 'g²(τ)' }, series: [{ data: g2, color: C.au, dots: true, r: 2.2 }, { data: theory, color: C.text3, dash: '4 4' }] });
      var g0 = (g2[nb / 2 - 1][1] + g2[nb / 2][1]) / 2;
      readout(read, [[fx(g0, 2), 'measured g²(0) — 2 for thermal light, 1 for a laser, 0 for a single emitter'], [ts.length + '', 'photons recorded'], [kind === 'th' ? 'bunched' : kind === 'coh' ? 'random (Poisson)' : 'antibunched', kind === 'th' ? 'photons tend to arrive together, within a coherence time' : kind === 'coh' ? 'arrival times are independent' : 'after one photon the emitter must be re-excited before it can emit another']]);
    };
    var sk = VL.select(ctl, { label: 'Light', options: [['th', 'thermal (lamp, star)'], ['coh', 'laser (coherent)'], ['single', 'single quantum emitter']], value: 'th', on: draw });
    VL.button(ctl, 'Record again', function () { run++; draw(); });
    draw();
  };

  /* ═══ 12. speckle ═══ */
  F.speckle = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 300);
    var N = 128, off = document.createElement('canvas'); off.width = N; off.height = N;
    var draw = function () {
      var Rp = sr.get(), M = sm.get(), rnd = seedRnd(12345), acc = new Float64Array(N * N);
      for (var m = 0; m < M; m++) {
        var re = new Float64Array(N * N), im = new Float64Array(N * N);
        for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var x = i - N / 2, y = j - N / 2; if (x * x + y * y <= Rp * Rp) { var p = 2 * Math.PI * rnd(); re[j * N + i] = Math.cos(p); im[j * N + i] = Math.sin(p); } }
        var rr = new Array(N), ii = new Array(N);
        for (j = 0; j < N; j++) { for (i = 0; i < N; i++) { rr[i] = re[j * N + i]; ii[i] = im[j * N + i]; } fft(rr, ii); for (i = 0; i < N; i++) { re[j * N + i] = rr[i]; im[j * N + i] = ii[i]; } }
        for (i = 0; i < N; i++) { for (j = 0; j < N; j++) { rr[j] = re[j * N + i]; ii[j] = im[j * N + i]; } fft(rr, ii); for (j = 0; j < N; j++) { acc[j * N + i] += rr[j] * rr[j] + ii[j] * ii[j]; } }
      }
      var mean = 0, sq = 0; for (var q = 0; q < N * N; q++) { mean += acc[q]; } mean /= N * N; for (q = 0; q < N * N; q++) sq += (acc[q] - mean) * (acc[q] - mean); var C0 = Math.sqrt(sq / (N * N)) / mean;
      var ctx = off.getContext('2d'), img = ctx.createImageData(N, N);
      for (q = 0; q < N * N; q++) { var v = Math.min(1, acc[q] / (3 * mean)); img.data[4 * q] = 30 + 225 * v; img.data[4 * q + 1] = 20 + 110 * v; img.data[4 * q + 2] = 30 + 50 * v; img.data[4 * q + 3] = 255; }
      ctx.putImageData(img, 0, 0);
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 300); g.imageSmoothingEnabled = false; g.drawImage(off, 20, 10, 280, 280);
      g.fillStyle = '#efeaf6'; g.font = '13px IBM Plex Sans, sans-serif'; g.textAlign = 'left';
      ['Laser light scattered by a rough surface:', 'every point of the image adds waves with', 'random phases.', '', 'Smaller aperture → larger speckles (≈ λz/D).', 'Averaging M independent patterns (moving', 'diffuser, several angles, wavelengths or', 'polarisations) lowers the contrast as 1/√M.'].forEach(function (t2, n) { g.fillText(t2, 330, 50 + n * 24); });
      readout(read, [[fx(C0, 2), 'speckle contrast σ/⟨I⟩ (1 for fully developed speckle)'], [fx(1 / Math.sqrt(M), 2), 'expected 1/√M'], [fx(N / (2 * Rp), 1) + ' px', 'speckle size ∝ 1/aperture']]);
    };
    var sr = VL.slider(ctl, { label: 'Aperture radius', min: 4, max: 40, step: 1, value: 14, fmt: function (v) { return v + ' px'; }, on: draw });
    var sm = VL.slider(ctl, { label: 'Patterns averaged M', min: 1, max: 16, step: 1, value: 1, fmt: function (v) { return v + ''; }, on: draw });
    draw();
  };

  /* ═══ 13. test yourself ═══ */
  var QUIZ = [
    ['Two equal beams interfere with full coherence and parallel polarisation. The fringe visibility is…', ['0', '0.5', '1', '2'], 2, 'V = 2√(I₁I₂)/(I₁+I₂) × |γ| × cos θ = 1.'],
    ['The same two beams, but with crossed polarisations (90°). The visibility is…', ['1', '0.5', '0', 'it depends on λ'], 2, 'Orthogonal polarisations do not interfere: cos 90° = 0.'],
    ['A source has Δλ = 1 nm at 600 nm. Its coherence length is about…', ['0.6 µm', '36 µm', '0.36 mm', '36 cm'], 2, 'λ²/Δλ = (600 nm)²/1 nm = 360 µm.'],
    ['Why do the fringes of a Michelson illuminated by a sodium lamp fade and return as one mirror moves?', ['Vibration', 'The two D lines beat', 'The lamp flickers', 'Polarisation changes'], 1, 'Two lines 0.6 nm apart give a visibility that oscillates with path difference, with minima every λ²/(2δλ) ≈ 0.29 mm of mirror travel.'],
    ['Sunlight is spatially coherent over about…', ['1 nm', '70 µm', '1 cm', '1 m'], 1, '1.22 λ/θ with θ = 9.3 mrad and λ = 550 nm gives ≈ 72 µm — which is why Young needed a pinhole.'],
    ['Michelson and Pease measured a star by…', ['photographing it', 'increasing the mirror separation until the fringes vanished', 'measuring its brightness', 'its spectrum'], 1, 'The separation at which |γ| first reaches zero gives the angular diameter: θ = 1.22 λ/d.'],
    ['One fringe in a Michelson corresponds to a mirror movement of…', ['λ', 'λ/2', 'λ/4', '2λ'], 1, 'The light travels the arm twice: a movement of λ/2 changes the path by λ.'],
    ['Why use two detector signals in quadrature?', ['To double the power', 'To tell forward from backward motion', 'To remove dust', 'To measure colour'], 1, 'cos φ alone looks the same in both directions; cos φ and sin φ trace a circle whose direction of rotation gives the sign.'],
    ['In a Fizeau test of a flat, adjacent fringes differ in height by…', ['λ', 'λ/2', 'λ/4', 'λ/10'], 1, 'The light crosses the gap twice.'],
    ['Why does white-light interferometry measure a 400 nm step unambiguously, when a laser cannot?', ['It is brighter', 'Its fringes exist only near zero path difference, so the envelope peak marks each surface', 'Its wavelength is shorter', 'It is polarised'], 1, 'The short coherence length localises the fringes; a laser repeats every λ/2.'],
    ['An OCT system at 840 nm with Δλ = 50 nm has an axial resolution in air of about…', ['0.6 µm', '6 µm', '60 µm', '0.6 mm'], 1, '(2 ln 2/π) λ₀²/Δλ = 0.44 × 14.1 µm ≈ 6.2 µm.'],
    ['Light from a thermal source shows g²(0) = 2. This means…', ['photons arrive in pairs exactly', 'photons tend to arrive together within a coherence time (bunching)', 'the source is a laser', 'there is no light'], 1, 'Intensity fluctuations of chaotic light make coincidences twice as likely as for random arrivals; a laser gives 1 and a single emitter 0.']
  ];
  F.cohquiz = function (fig) {
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
