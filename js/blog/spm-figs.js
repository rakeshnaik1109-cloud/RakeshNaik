/* How spectrometers work — interactive figures (uses vl-core.js helpers).
   Glass dispersion: SCHOTT Sellmeier coefficients (N-BK7, SF11), Malitson (fused silica 1965, CaF2 1963).
   Line wavelengths: NIST Atomic Spectra Database (air wavelengths). Grating efficiencies: scalar theory. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var D2R = Math.PI / 180;

  /* ── shared helpers ─────────────────────────────────────── */
  var sell = function (B, Cc) { return function (nm) { var l2 = nm * nm / 1e6, s = 1; for (var i = 0; i < 3; i++) s += B[i] * l2 / (l2 - Cc[i]); return Math.sqrt(s); }; };
  var GLASS = {
    BK7: { name: 'N-BK7 (crown)', f: sell([1.03961212, 0.231792344, 1.01046945], [0.00600069867, 0.0200179144, 103.560653]) },
    SF11: { name: 'SF11 (dense flint)', f: sell([1.73759695, 0.313747346, 1.89878101], [0.013188707, 0.0623068142, 155.23629]) },
    silica: { name: 'Fused silica', f: sell([0.6961663, 0.4079426, 0.8974794], [0.0684043 * 0.0684043, 0.1162414 * 0.1162414, 9.896161 * 9.896161]) },
    CaF2: { name: 'CaF₂', f: sell([0.5675888, 0.4710914, 3.8484723], [0.050263605 * 0.050263605, 0.1003909 * 0.1003909, 34.649040 * 34.649040]) }
  };
  var glassOpts = [['BK7', GLASS.BK7.name], ['SF11', GLASS.SF11.name], ['silica', GLASS.silica.name], ['CaF2', GLASS.CaF2.name]];
  var wl2rgb = function (w) {
    var r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else r = 1;
    var fa = w < 420 ? 0.3 + 0.7 * (w - 380) / 40 : w > 700 ? Math.max(0.35, 0.3 + 0.7 * (780 - w) / 80) : 1;
    if (w < 380) { r = 0.55; g = 0.35; b = 0.9; fa = 1; }
    if (w > 780) { r = 0.75; g = 0.18; b = 0.22; fa = 1; }
    var t = function (c) { return Math.round(255 * Math.pow(Math.max(0, c * fa), 0.8)); };
    return 'rgb(' + t(r) + ',' + t(g) + ',' + t(b) + ')';
  };
  var sinc2 = function (x) { return Math.abs(x) < 1e-9 ? 1 : Math.pow(Math.sin(Math.PI * x) / (Math.PI * x), 2); };
  var fx = function (v, d) { return (+v).toFixed(d == null ? 2 : d); };
  var readout = function (el, rows) { el.innerHTML = rows.map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join(''); };
  var svgOpen = function (w, h, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="plot" role="img" aria-label="' + VL.esc(label) + '">'; };
  var txt = function (x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" class="' + (o.cls || 'pl-tick') + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.fill ? ' fill="' + o.fill + '"' : '') + '>' + s + '</text>'; };
  var line = function (a, b, col, w, extra) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 1.5) + '"' + (extra || '') + '/>'; };
  var show = function (ctl, on) { var el = ctl.input || ctl.el; el.parentNode.style.display = on ? '' : 'none'; };
  // Hg and Ar lines (nm, in air) used for calibration lamps — NIST ASD
  var HG = [253.652, 296.728, 302.150, 313.155, 334.148, 365.015, 404.656, 435.833, 546.074, 576.960, 579.066];
  var AR = [696.543, 706.722, 727.294, 738.398, 750.387, 763.511, 772.376, 794.818, 800.616, 811.531, 826.452, 842.465, 852.144, 912.297];

  /* ═══ 1. the four jobs of a spectrometer (static schematic) ═══ */
  F.spmanat = function (fig) {
    var W = 720, H = 250, s = svgOpen(W, H, 'Anatomy of a spectrometer');
    var box = function (x, y, w, h, t1, t2, col) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="rgba(255,255,255,.04)" stroke="' + col + '"/>' + txt(x + w / 2, y + 22, t1, { cls: 'pl-label', fill: col }) + txt(x + w / 2, y + 40, t2, {}); };
    s += box(10, 70, 120, 64, '1 · Collect', 'source, sample, slit', C.au);
    s += box(170, 70, 150, 64, '2 · Separate', 'prism, grating, interferometer', C.cyan);
    s += box(360, 70, 140, 64, '3 · Detect', 'PMT, CCD, InGaAs, MCT', C.green);
    s += box(540, 70, 170, 64, '4 · Calibrate', 'wavelength, intensity, dark', C.violet);
    [[130, 170], [320, 360], [500, 540]].forEach(function (p) { s += line([p[0] + 2, 102], [p[1] - 6, 102], C.text3, 1.6) + '<path d="M' + (p[1] - 6) + ' 97 L' + (p[1]) + ' 102 L' + (p[1] - 6) + ' 107 Z" fill="' + C.text3 + '"/>'; });
    // rainbow fan under "separate"
    for (var i = 0; i < 9; i++) { var w = 400 + i * 37.5, a = (-26 + i * 6.5) * D2R; s += line([245, 150], [245 + 70 * Math.sin(a), 150 + 70 * Math.cos(a)], wl2rgb(w), 2.4, ' opacity=".9"'); }
    // spectrum under "calibrate"
    var d = ''; for (var k = 0; k <= 80; k++) { var x = 555 + k * 1.8, lam = 400 + k * 4, y = 222 - 48 * (0.35 * Math.exp(-Math.pow((lam - 560) / 120, 2)) + 0.9 * Math.exp(-Math.pow((lam - 546) / 4, 2)) + 0.55 * Math.exp(-Math.pow((lam - 436) / 4, 2)) + 0.4 * Math.exp(-Math.pow((lam - 405) / 4, 2))); d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    s += '<path d="' + d + '" fill="none" stroke="' + C.violet + '" stroke-width="1.8"/>' + line([555, 222], [701, 222], C.axis, 1) + txt(628, 240, 'intensity vs wavelength', {});
    // detector pixels
    for (var j = 0; j < 16; j++) s += '<rect x="' + (378 + j * 6.6) + '" y="160" width="5.4" height="34" fill="' + wl2rgb(400 + j * 20) + '" opacity="' + (0.35 + 0.6 * Math.exp(-Math.pow((j - 8) / 5, 2))) + '"/>';
    s += txt(430, 210, 'one pixel per colour', {});
    // source + cuvette
    s += '<circle cx="40" cy="178" r="13" fill="' + C.au + '" opacity=".8"/>' + line([53, 178], [88, 178], C.au, 3) + '<rect x="88" y="164" width="16" height="28" fill="rgba(69,191,214,.25)" stroke="' + C.cyan + '"/>' + line([104, 178], [124, 178], C.au, 2.4) + line([126, 168], [126, 175], C.text, 2) + line([126, 181], [126, 188], C.text, 2) + txt(70, 210, 'lamp · sample · slit', {});
    s += txt(W / 2, 30, 'Every spectrometer does the same four jobs; instruments differ in how they do job 2', { cls: 'pl-label' });
    VL.html(fig, s + '</svg>');
  };

  /* ═══ 2. dispersion by a prism ═══ */
  var refract = function (d, nrm, n1, n2) {   // d unit direction, nrm unit normal pointing against d
    var cosi = -(d[0] * nrm[0] + d[1] * nrm[1]), r = n1 / n2, k = 1 - r * r * (1 - cosi * cosi);
    if (k < 0) return null;
    var t = r * cosi - Math.sqrt(k); return [r * d[0] + t * nrm[0], r * d[1] + t * nrm[1]];
  };
  var hitLine = function (p, d, a, b) {   // ray p + s d meets segment a-b
    var ex = b[0] - a[0], ey = b[1] - a[1], den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-12) return null;
    var s = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den, u = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
    return s > 1e-6 && u >= -1e-6 && u <= 1 + 1e-6 ? [p[0] + s * d[0], p[1] + s * d[1]] : null;
  };
  F.prism = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var G = GLASS[gs.get()], A = sa.get(), th1 = si.get();
      var W = 680, H = 330, cx = 300, base = 270, side = 200, half = A * D2R / 2;
      var apex = [cx, base - side * Math.cos(half)], bl = [cx - side * Math.sin(half), base], br = [cx + side * Math.sin(half), base];
      // face normals (outward)
      var nL = [-(apex[1] - bl[1]), apex[0] - bl[0]], L1 = Math.hypot(nL[0], nL[1]); nL = [nL[0] / L1, nL[1] / L1]; if (nL[0] > 0) nL = [-nL[0], -nL[1]];
      var nR = [-(br[1] - apex[1]), br[0] - apex[0]], L2 = Math.hypot(nR[0], nR[1]); nR = [nR[0] / L2, nR[1] / L2]; if (nR[0] < 0) nR = [-nR[0], -nR[1]];
      // incoming direction: angle th1 from the inward normal of the left face
      var inw = [-nL[0], -nL[1]], ang = Math.atan2(inw[1], inw[0]) - th1 * D2R, d0 = [Math.cos(ang), Math.sin(ang)];
      var hitPt = [bl[0] + (apex[0] - bl[0]) * 0.55, bl[1] + (apex[1] - bl[1]) * 0.55], start = [hitPt[0] - d0[0] * 230, hitPt[1] - d0[1] * 230];
      var s = svgOpen(W, H, 'White light dispersed by a prism');
      s += '<polygon points="' + [apex, bl, br].map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="rgba(69,191,214,.12)" stroke="' + C.cyan + '" stroke-width="1.4"/>';
      s += line(start, hitPt, '#ffffff', 3, ' opacity=".85"');
      var exits = [], tir = false;
      for (var k = 0; k <= 12; k++) {
        var lam = 400 + k * 25, n = G.f(lam);
        var d1 = refract(d0, nL, 1, n); if (!d1) continue;
        var p2 = hitLine(hitPt, d1, apex, br); if (!p2) { p2 = hitLine(hitPt, d1, bl, br); if (p2) s += line(hitPt, p2, wl2rgb(lam), 1.2, ' opacity=".5"'); continue; }
        var d2 = refract(d1, [-nR[0], -nR[1]], n, 1);
        s += line(hitPt, p2, wl2rgb(lam), 1.3, ' opacity=".75"');
        if (!d2) { tir = true; continue; }
        s += line(p2, [p2[0] + d2[0] * 260, p2[1] + d2[1] * 260], wl2rgb(lam), 2, ' opacity=".9"');
        exits.push({ lam: lam, dev: (Math.atan2(d2[1], d2[0]) - Math.atan2(d0[1], d0[0])) / D2R });
      }
      s += txt(cx, apex[1] - 8, 'A = ' + A + '°', {});
      VL.html(plot, '');
      plot.innerHTML = s + '</svg>';
      var nF = G.f(486.13), nd = G.f(587.56), nC = G.f(656.27), V = (nd - 1) / (nF - nC);
      var dn = (G.f(589.5) - G.f(588.5)) / 1;   // per nm
      var spread = exits.length > 1 ? Math.abs(exits[exits.length - 1].dev - exits[0].dev) : NaN;
      var Rp = 50e6 * Math.abs(dn);   // base 50 mm, dn per nm → b·|dn/dλ| with b in nm
      readout(read, [[fx(nd, 4), 'n at 587.6 nm (n_d)'], [fx(V, 1), 'Abbe number V_d — low = strongly dispersive'], [isFinite(spread) ? fx(spread, 2) + '°' : (tir ? 'TIR' : '—'), 'angle between 400 and 700 nm rays'],
        [Math.round(Rp).toLocaleString('en'), 'resolving power λ/Δλ at 589 nm for a 50 mm base'], [fx(589 / Rp, 3) + ' nm', 'smallest resolvable Δλ (Na D lines are 0.597 nm apart)']]);
    };
    var gs = VL.select(ctl, { label: 'Glass', options: glassOpts, value: 'SF11', on: draw });
    var sa = VL.slider(ctl, { label: 'Apex angle', min: 30, max: 70, step: 1, value: 60, fmt: function (v) { return v + '°'; }, on: draw });
    var si = VL.slider(ctl, { label: 'Angle of incidence', min: 20, max: 80, step: 0.5, value: 55, fmt: function (v) { return v + '°'; }, on: draw });
    draw();
  };

  /* ═══ 3. the grating equation: where each order goes ═══ */
  F.grating = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var G = sg.get(), d = 1e6 / G, a = sa.get(), Wmm = sw.get();   // d in nm
      var W = 680, H = 330, cx = 340, cy = 300, R = 255;
      var s = svgOpen(W, H, 'Diffraction orders of a reflection grating');
      s += '<path d="M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + '" fill="none" stroke="' + C.grid + '"/>';
      for (var t = -80; t <= 80; t += 20) { var q = t * D2R; s += txt(cx - (R + 14) * Math.sin(q), cy - (R + 14) * Math.cos(q) + 4, t + '°', {}); }
      s += line([cx, cy - R], [cx, cy], C.text3, 1, ' stroke-dasharray="3 4"');
      // grating with grooves
      s += '<rect x="' + (cx - 70) + '" y="' + cy + '" width="140" height="10" fill="' + C.au + '" opacity=".8"/>';
      for (var g = 0; g < 28; g++) s += line([cx - 70 + g * 5, cy], [cx - 67 + g * 5, cy - 4], C.au, 1);
      // incident beam from the left at angle a (positive: left of the normal)
      var ia = a * D2R; s += line([cx - R * Math.sin(ia), cy - R * Math.cos(ia)], [cx, cy], '#ffffff', 3, ' opacity=".85"') + txt(cx - (R - 30) * Math.sin(ia) - 18, cy - (R - 30) * Math.cos(ia), 'in', {});
      var lams = [[405, 'violet'], [532, 'green'], [650, 'red']], info = [];
      lams.forEach(function (L) {
        for (var m = -4; m <= 4; m++) {
          var sb = m * L[0] / d - Math.sin(ia);   // mλ = d(sin α + sin β)
          if (Math.abs(sb) > 1) continue;
          var b = Math.asin(sb), end = [cx - R * Math.sin(b), cy - R * Math.cos(b)];
          s += line([cx, cy], end, wl2rgb(L[0]), m === 0 ? 3 : 2, m === 0 ? ' opacity=".55"' : '');
          if (L[0] === 532) { s += txt(cx - (R + 30) * Math.sin(b), cy - (R + 30) * Math.cos(b) + 4, 'm=' + m, { fill: C.text2 }); info.push(m); }
        }
      });
      plot.innerHTML = s + txt(cx, cy + 26, 'grating · ' + G + ' grooves/mm', {}) + '</svg>';
      var b1 = Math.asin(VL.clamp(532 / d - Math.sin(ia), -1, 1)), ok1 = Math.abs(532 / d - Math.sin(ia)) <= 1;
      var disp = ok1 ? 1 / (d * Math.cos(b1)) / D2R : NaN;   // deg per nm, first order
      var N = Wmm * G, Rres = N * 1;
      readout(read, [[ok1 ? fx(b1 / D2R, 1) + '°' : 'evanescent', 'first-order angle β at 532 nm'], [ok1 ? fx(disp * 1000, 1) + ' mdeg/nm' : '—', 'angular dispersion dβ/dλ = m / (d cos β)'],
        [N.toLocaleString('en'), 'grooves illuminated N'], [Rres.toLocaleString('en'), 'resolving power mN (first order)'], [fx(532 / Rres * 1000, 1) + ' pm', 'smallest Δλ at 532 nm, first order'],
        ['m = ' + info.filter(function (m) { return m; }).join(', '), 'orders that exist at 532 nm (|sin β| ≤ 1)']]);
    };
    var sg = VL.slider(ctl, { label: 'Grooves per mm', min: 150, max: 2400, step: 50, value: 600, fmt: function (v) { return v + ' /mm'; }, on: draw });
    var sa = VL.slider(ctl, { label: 'Angle of incidence α', min: -70, max: 80, step: 1, value: 20, fmt: function (v) { return v + '°'; }, on: draw });
    var sw = VL.slider(ctl, { label: 'Illuminated width', min: 5, max: 100, step: 1, value: 25, fmt: function (v) { return v + ' mm'; }, on: draw });
    draw();
  };

  /* ═══ 4. blaze and efficiency (scalar theory) ═══ */
  F.blaze = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var G = sg.get(), d = 1e6 / G, th = sb.get(), lb = 2 * d * Math.sin(th * D2R);   // first-order Littrow blaze wavelength
      var xs = VL.linspace(150, 2000, 500);
      var e1 = xs.map(function (l) { return [l, 100 * sinc2(1 - lb / l)]; }), e2 = xs.map(function (l) { return [l, 2 * l <= 2 * d ? 100 * sinc2(2 - lb / l) : NaN]; }).map(function (q) { return [q[0], l2ok(q[0], d, 2) ? q[1] : NaN]; });
      var e1c = e1.map(function (q) { return [q[0], l2ok(q[0], d, 1) ? q[1] : NaN]; });
      plot.innerHTML = VL.plot({ id: 'blz', label: 'Grating efficiency versus wavelength', w: 680, h: 320, x: { min: 150, max: 2000, label: 'Wavelength (nm)' }, y: { min: 0, max: 105, label: 'Efficiency, scalar theory (%)' },
        series: [{ data: e1c, color: C.au, label: 'first order (m = 1)' }, { data: e2, color: C.cyan, dash: '6 4', label: 'second order (m = 2)' }],
        vlines: [{ x: lb, color: C.au, label: 'λ_B' }, { x: lb / 2, color: C.cyan, label: 'λ_B/2' }], hlines: [{ y: 50, color: C.text3, dash: '2 3' }], legend: true, legendX: 380, legendY: 22 });
      readout(read, [[fx(lb, 0) + ' nm', 'first-order blaze wavelength λ_B = 2d sin θ_B (Littrow)'], [fx(0.69 * lb, 0) + '–' + fx(1.8 * lb, 0) + ' nm', 'first order above 50 % (scalar theory)'], [fx(lb / 2, 0) + ' nm', 'the same facets blaze the second order here'], [fx(2 * d, 0) + ' nm', 'longest wavelength diffracted at all in Littrow, 2d']]);
    };
    var l2ok = function (l, d, m) { return m * l < 2 * d; };
    var sg = VL.slider(ctl, { label: 'Grooves per mm', min: 150, max: 2400, step: 50, value: 600, fmt: function (v) { return v + ' /mm'; }, on: draw });
    var sb = VL.slider(ctl, { label: 'Blaze angle θ_B', min: 2, max: 45, step: 0.1, value: 8.6, fmt: function (v) { return fx(v, 1) + '°'; }, on: draw });
    draw();
  };

  /* ═══ 5. overlapping orders and the order-sorting filter ═══ */
  F.overlap = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var planck = function (l, T) { var x = 1.4388e7 / (l * T); return 1 / (Math.pow(l, 5) * (Math.exp(x) - 1)); };
    var src = function (kind, l) {
      if (kind === 'hg') { var s = 0.004; HG.forEach(function (h, i) { s += [0.9, 0.2, 0.15, 0.35, 0.12, 0.8, 0.6, 0.85, 1, 0.45, 0.45][i] * Math.exp(-Math.pow((l - h) / 0.6, 2)); }); return s; }
      if (kind === 'd2') return Math.exp(-(l - 200) / 90) + 0.02;
      return planck(l, kind === 'sun' ? 5800 : 3000);
    };
    var qe = function (l) { return l < 200 || l > 1100 ? 0 : Math.max(0, Math.sin(Math.PI * (l - 200) / 900) * (l < 400 ? 0.5 + 0.5 * (l - 200) / 200 : 1)); };   // silicon CCD, schematic
    var draw = function () {
      var kind = ss.get(), osf = so.get() === 'on', lb = 500;
      var xs = VL.linspace(200, 1100, 1400), first = [], tot = [], mx = 0;
      var norm = 0; xs.forEach(function (l) { norm = Math.max(norm, src(kind, l)); });
      xs.forEach(function (l) {
        var a = src(kind, l) / norm * sinc2(1 - lb / l) * qe(l);
        var l2 = l / 2, b = l2 >= 200 ? src(kind, l2) / norm * sinc2(2 - lb / l2) * qe(l) : 0;
        if (osf && l > 560) b = 0;   // long-pass filter over the long-wavelength half of the detector
        first.push([l, a]); tot.push([l, a + b]); mx = Math.max(mx, a + b);
      });
      first = first.map(function (q) { return [q[0], q[1] / mx]; }); tot = tot.map(function (q) { return [q[0], q[1] / mx]; });
      var ghost = kind === 'hg' ? [253.652, 365.015, 404.656].filter(function (h) { return 2 * h >= 200 && 2 * h <= 1100 && !(osf && 2 * h > 560); }).map(function (h) { return { x: 2 * h, color: C.red, dash: '2 3', label: fx(2 * h, 0) }; }) : [];
      plot.innerHTML = VL.plot({ id: 'ovl', label: 'Detected spectrum with second-order light', w: 680, h: 320, x: { min: 200, max: 1100, label: 'Wavelength assigned by the first-order calibration (nm)' }, y: { min: 0, max: 1.08, label: 'Detected signal (normalised)' },
        bands: osf ? [{ x0: 560, x1: 1100, color: C.green, label: 'long-pass filter on this part of the detector', op: 0.07 }] : [],
        series: [{ data: tot, color: C.red, label: 'what the detector records' }, { data: first, color: C.au, dash: '5 4', label: 'first-order light only' }], vlines: ghost, legend: true, legendX: 380, legendY: 60 });
      var extra = 0, tot1 = 0; for (var i = 0; i < xs.length; i++) { if (xs[i] > 560) { extra += tot[i][1] - first[i][1]; tot1 += tot[i][1]; } }
      readout(read, [[tot1 ? fx(100 * extra / tot1, 1) + ' %' : '0 %', 'of the signal above 560 nm is second-order light'], ['2 × λ', 'where a line of wavelength λ reappears in second order'], [osf ? 'on' : 'off', 'order-sorting filter']]);
    };
    var ss = VL.select(ctl, { label: 'Source', options: [['hg', 'Mercury lamp (lines)'], ['d2', 'Deuterium lamp (UV continuum)'], ['halogen', 'Halogen lamp, 3000 K'], ['sun', 'Sun-like, 5800 K']], value: 'hg', on: draw });
    var so = VL.select(ctl, { label: 'Order-sorting filter', options: [['off', 'Off'], ['on', 'On (long-pass over 560 nm)']], value: 'off', on: draw });
    draw();
  };

  /* ═══ 6. layouts ═══ */
  F.layouts = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), note = VL.part(fig, 'vl-readout');
    var mirror = function (c, r, a0, a1, col) { var p0 = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)], p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)]; return '<path d="M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 ' + (a1 > a0 ? 1 : 0) + ' ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + '" fill="none" stroke="' + (col || '#cfd6e4') + '" stroke-width="5" stroke-linecap="round"/>'; };
    var grating = function (c, ang, len) { var a = ang * D2R, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2, s = line([c[0] - dx, c[1] - dy], [c[0] + dx, c[1] + dy], C.au, 6); for (var i = -5; i <= 5; i++) { var p = [c[0] + dx * i / 5.5, c[1] + dy * i / 5.5]; s += line(p, [p[0] + Math.sin(a) * 5, p[1] - Math.cos(a) * 5], C.au, 1); } return s; };
    var slit = function (p, vert) { return vert ? line([p[0], p[1] - 14], [p[0], p[1] - 3], C.text, 3) + line([p[0], p[1] + 3], [p[0], p[1] + 14], C.text, 3) : line([p[0] - 14, p[1]], [p[0] - 3, p[1]], C.text, 3) + line([p[0] + 3, p[1]], [p[0] + 14, p[1]], C.text, 3); };
    var det = function (a, b) { return line(a, b, C.green, 7, ' stroke-linecap="round" opacity=".85"'); };
    var bundle = function (pts, col, op) { var s = ''; for (var i = 0; i < pts.length - 1; i++) s += line(pts[i], pts[i + 1], col, 1.6, ' opacity="' + (op || 0.85) + '"'); return s; };
    var cols = [430, 530, 640].map(wl2rgb);
    var L = {
      ct: { name: 'Czerny–Turner', note: 'Two concave mirrors: the first collimates the light from the entrance slit onto a plane grating, the second focuses each colour onto its own place on the detector (or on an exit slit). Placing the mirrors symmetrically, at suitable angles, cancels most of the coma. The workhorse of laboratory spectrographs and monochromators [12].',
        draw: function () { var s = slit([70, 250], true) + mirror([300, 330], 260, -2.05, -1.72) + mirror([360, 330], 260, -1.42, -1.09) + grating([330, 255], 0, 90) + det([600, 205], [600, 295]);
          s += bundle([[72, 250], [205, 85]], '#ffffff') + bundle([[72, 250], [245, 75]], '#ffffff');
          s += bundle([[205, 85], [295, 255]], '#ffffff', 0.6) + bundle([[245, 75], [345, 255]], '#ffffff', 0.6);
          [-1, 0, 1].forEach(function (k, i) { s += bundle([[310 + k * 4, 255], [430 + k * 18, 78 + k * 6], [600, 250 + k * 34]], cols[i]) + bundle([[350 + k * 4, 255], [470 + k * 18, 80 + k * 6], [600, 250 + k * 34]], cols[i]); });
          return s + txt(70, 285, 'entrance slit', {}) + txt(225, 60, 'collimating mirror', {}) + txt(330, 290, 'plane grating', {}) + txt(460, 60, 'focusing mirror', {}) + txt(600, 315, 'detector', {}); } },
      crossed: { name: 'Crossed Czerny–Turner', note: 'The same two mirrors, but the beams cross between them. The instrument becomes more compact and the detector can sit far from the slit; this is the layout of most fibre-coupled CCD mini-spectrometers. The price is a little more astigmatism and stray light where the beams cross.',
        draw: function () { var s = slit([90, 260], true) + mirror([500, 330], 260, -1.72, -1.42, '#cfd6e4') + mirror([230, 330], 260, -1.72, -1.42) + grating([360, 250], 0, 90) + det([110, 110], [180, 70]);
          s += bundle([[92, 260], [475, 75]], '#ffffff') + bundle([[92, 260], [530, 75]], '#ffffff') + bundle([[475, 75], [335, 250]], '#ffffff', 0.6) + bundle([[530, 75], [385, 250]], '#ffffff', 0.6);
          [-1, 0, 1].forEach(function (k, i) { s += bundle([[340 + k * 4, 250], [205 + k * 16, 72 + k * 4], [145 + k * 30, 90 - k * 17]], cols[i]) + bundle([[380 + k * 4, 250], [250 + k * 16, 72 + k * 4], [145 + k * 30, 90 - k * 17]], cols[i]); });
          return s + txt(90, 295, 'fibre / slit', {}) + txt(500, 58, 'collimating mirror', {}) + txt(360, 285, 'grating', {}) + txt(230, 58, 'focusing mirror', {}) + txt(140, 130, 'linear CCD', {}); } },
      littrow: { name: 'Littrow', note: 'One lens or mirror does both jobs: it collimates the light onto a grating turned so that the chosen order goes almost straight back (α ≈ β), and the same optic focuses it next to the slit. Compact and efficient near the blaze; used in echelles, tunable lasers and some Raman instruments.',
        draw: function () { var s = slit([80, 150], true) + det([80, 185], [80, 245]) + '<ellipse cx="290" cy="185" rx="10" ry="80" fill="rgba(69,191,214,.18)" stroke="' + C.cyan + '"/>' + grating([520, 185], 78, 150);
          s += bundle([[82, 150], [290, 120]], '#ffffff') + bundle([[82, 150], [290, 250]], '#ffffff') + bundle([[290, 120], [505, 115]], '#ffffff', 0.55) + bundle([[290, 250], [530, 250]], '#ffffff', 0.55);
          [-1, 0, 1].forEach(function (k, i) { s += bundle([[505, 125], [290, 128 + k * 8], [80, 215 + k * 22]], cols[i]) + bundle([[530, 245], [290, 242 + k * 8], [80, 215 + k * 22]], cols[i]); });
          return s + txt(80, 125, 'slit', {}) + txt(110, 275, 'detector', {}) + txt(290, 290, 'one lens, used twice', {}) + txt(560, 285, 'grating in Littrow', {}); } },
      concave: { name: 'Concave grating (flat-field)', note: 'The grooves are on a concave surface, so the grating disperses and focuses at once: no separate mirrors, fewer surfaces, less loss. Rowland showed that slit, grating and spectrum then lie on one circle [16]; aberration-corrected holographic gratings flatten that focal curve onto a flat detector. Common in compact UV–Vis and in vacuum-UV instruments.',
        draw: function () { var s = '<circle cx="340" cy="200" r="120" fill="none" stroke="' + C.text3 + '" stroke-dasharray="3 5"/>' + txt(340, 335, 'Rowland circle', {});
          var on = function (a) { return [340 + 120 * Math.cos(a), 200 + 120 * Math.sin(a)]; }, sl0 = on(150 * D2R), g1 = [340 + 240 * Math.cos(-1.85), 320 + 240 * Math.sin(-1.85)], g2 = [340 + 240 * Math.cos(-1.29), 320 + 240 * Math.sin(-1.29)];
          s += mirror([340, 320], 240, -1.85, -1.29, C.au) + slit(sl0, false) + det(on(0.85), on(0.3));
          s += bundle([sl0, g1], '#ffffff') + bundle([sl0, g2], '#ffffff');
          [0.75, 0.6, 0.45].forEach(function (a, i) { var tgt = on(a); s += bundle([g1, tgt], cols[i]) + bundle([g2, tgt], cols[i]); });
          return s + txt(sl0[0] - 10, sl0[1] + 30, 'entrance slit', {}) + txt(340, 66, 'concave grating', {}) + txt(500, 300, 'flat detector', {}); } },
      echelle: { name: 'Echelle with cross-disperser', note: 'A coarse grating used at a steep angle in very high orders (m ≈ 30–120) gives enormous dispersion, but the orders overlap. A prism (or second grating) at right angles spreads them apart, so the spectrum lands on a 2D detector as stacked stripes, one per order — an echellogram (Figure 8) [17].',
        draw: function () { var s = slit([60, 260], true) + mirror([260, 330], 260, -1.95, -1.62) + grating([380, 250], 62, 70) + '<polygon points="440,120 500,120 470,70" fill="rgba(69,191,214,.18)" stroke="' + C.cyan + '"/>' + mirror([600, 280], 200, -2.0, -1.7);
          s += bundle([[62, 260], [180, 92]], '#ffffff') + bundle([[62, 260], [225, 80]], '#ffffff') + bundle([[180, 92], [365, 220]], '#ffffff', 0.6) + bundle([[225, 80], [395, 280]], '#ffffff', 0.6);
          [-1, 0, 1].forEach(function (k, i) { s += bundle([[385, 240], [470, 110 + k * 3], [540 + k * 10, 95], [620, 230 + k * 22]], cols[i]); });
          s += '<rect x="600" y="200" width="60" height="70" fill="none" stroke="' + C.green + '" stroke-width="2"/>'; for (var j = 0; j < 7; j++) s += line([604, 206 + j * 9.5], [656, 203 + j * 9.5], wl2rgb(420 + j * 40), 2);
          return s + txt(60, 295, 'slit', {}) + txt(250, 58, 'collimator', {}) + txt(380, 300, 'echelle', {}) + txt(470, 58, 'cross-dispersing prism', {}) + txt(560, 70, 'camera mirror', {}) + txt(630, 292, '2D detector', {}); } }
    };
    var draw = function () { var k = sl.get(), Lk = L[k]; plot.innerHTML = svgOpen(680, 340, Lk.name + ' layout') + Lk.draw() + '</svg>'; note.innerHTML = '<div style="grid-column:1/-1"><b>' + Lk.name + '</b><span>' + Lk.note + '</span></div>'; };
    var sl = VL.select(ctl, { label: 'Layout', options: [['ct', 'Czerny–Turner'], ['crossed', 'Crossed Czerny–Turner'], ['littrow', 'Littrow'], ['concave', 'Concave grating'], ['echelle', 'Echelle + cross-disperser']], value: 'ct', on: draw });
    draw();
  };

  /* ═══ 7. resolution: the sodium D doublet ═══ */
  F.resol = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var L1 = 588.995, L2 = 589.592;
    var draw = function () {
      var G = sg.get(), f = sf.get(), w = sw.get(), p = sp.get(), blur = 12;   // µm optical blur (rms)
      var d = 1e6 / G, sb = 589.3 / (2 * d); if (sb >= 1) { read.innerHTML = '<div><b>—</b><span>this groove density cannot diffract 589 nm in this geometry</span></div>'; plot.innerHTML = ''; return; }
      var beta = Math.asin(sb), rld = d * Math.cos(beta) / (f * 1e3) * 1e3;   // nm per mm (f in mm)
      var nmPerUm = rld / 1000, sigma = blur * nmPerUm, half = w / 2 * nmPerUm, pix = p * nmPerUm;
      // line profile: slit image (rectangle) ⊗ Gaussian blur → erf difference
      var erf = function (x) { var t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
      var prof = function (x) { var s2 = Math.SQRT2 * sigma; return 0.5 * (erf((x + half) / s2) - erf((x - half) / s2)); };
      var spec = function (x) { return prof(x - L1) + 0.5 * prof(x - L2); };   // D2 line twice as strong
      var x0 = 589.29 - Math.max(1.6, 6 * (half + sigma + pix)), x1 = 589.29 + Math.max(1.6, 6 * (half + sigma + pix));
      var bars = [], mx = 0, k0 = Math.floor(x0 / pix), k1 = Math.ceil(x1 / pix);
      if (k1 - k0 > 1500) { k0 = Math.floor((589.29 - 750 * pix) / pix); k1 = k0 + 1500; }
      for (var k = k0; k <= k1; k++) { var a = k * pix, sum = 0; for (var j = 0; j < 8; j++) sum += spec(a + (j + 0.5) * pix / 8); sum /= 8; bars.push([a, sum]); mx = Math.max(mx, sum); }
      var stair = []; bars.forEach(function (b) { stair.push([b[0], b[1] / mx], [b[0] + pix, b[1] / mx]); });
      var truth = VL.linspace(x0, x1, 600).map(function (x) { return [x, (Math.exp(-Math.pow((x - L1) / 0.004, 2)) + 0.5 * Math.exp(-Math.pow((x - L2) / 0.004, 2))) * 1.0]; });
      // resolved? dip between the peaks relative to the weaker peak
      var near = function (x) { var best = bars[0]; bars.forEach(function (b) { if (Math.abs(b[0] + pix / 2 - x) < Math.abs(best[0] + pix / 2 - x)) best = b; }); return best[1]; };
      var pk2 = near(L2), dip = Infinity; bars.forEach(function (b) { var c = b[0] + pix / 2; if (c > L1 && c < L2) dip = Math.min(dip, b[1]); });
      var resolved = isFinite(dip) && dip < 0.81 * pk2;
      plot.innerHTML = VL.plot({ id: 'res', label: 'Sodium D lines as recorded', w: 680, h: 320, x: { min: x0, max: x1, label: 'Wavelength (nm)' }, y: { min: 0, max: 1.1, label: 'Counts per pixel (normalised)' },
        series: [{ data: truth, color: C.text3, width: 1, label: 'true lines (588.995, 589.592 nm)' }, { data: stair, color: C.au, fill: 0.18, label: 'what the pixels record' }], legend: true, legendX: 14, legendY: 22 });
      var fw = Math.max(2 * half, 2.355 * sigma, 2 * pix);
      readout(read, [[fx(rld, 2) + ' nm/mm', 'reciprocal linear dispersion d cos β / (m f)'], [fx(2 * half * 1000, 0) + ' pm', 'bandpass of the slit image'], [fx(pix * 1000, 1) + ' pm', 'wavelength step per pixel'],
        [Math.round(589.3 / fw).toLocaleString('en'), 'approximate resolving power λ/Δλ'], [resolved ? 'resolved' : 'not resolved', 'the 0.597 nm doublet'], [fx(w / 50, 2) + '×', 'light through the slit, relative to 50 µm']]);
    };
    var sg = VL.slider(ctl, { label: 'Grooves per mm', min: 150, max: 2400, step: 50, value: 600, fmt: function (v) { return v + ' /mm'; }, on: draw });
    var sf = VL.slider(ctl, { label: 'Focal length', min: 50, max: 750, step: 10, value: 300, fmt: function (v) { return v + ' mm'; }, on: draw });
    var sw = VL.slider(ctl, { label: 'Slit width', min: 5, max: 200, step: 1, value: 25, fmt: function (v) { return v + ' µm'; }, on: draw });
    var sp = VL.slider(ctl, { label: 'Pixel size', min: 5, max: 30, step: 0.5, value: 14, fmt: function (v) { return v + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 8. echellogram ═══ */
  F.echelle = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var G = +sg.get(), d = 1e6 / G, th = 63.43 * D2R, glass = GLASS[sx.get()], twoD = 2 * d * Math.sin(th);
      var mMin = Math.ceil(twoD / 780), mMax = Math.floor(twoD / 200);
      var W = 680, H = 360, m0 = 40, s = svgOpen(W, H, 'Echellogram');
      s += '<rect x="' + m0 + '" y="20" width="' + (W - 2 * m0) + '" height="' + (H - 60) + '" fill="#0b0712" stroke="' + C.axis + '"/>';
      var nTop = glass.f(200), nBot = glass.f(780);
      var yOf = function (lam) { return 30 + (H - 80) * (nTop - glass.f(lam)) / (nTop - nBot); };
      var xOf = function (lam, m) { var lc = twoD / m, fsr = lc / m; return W / 2 + (lam - lc) / fsr * (W - 2 * m0 - 40) * 0.62; };
      for (var m = mMin; m <= mMax; m++) {
        var lc = twoD / m, fsr = lc / m, y = yOf(lc), dd = '';
        for (var k = 0; k <= 60; k++) { var lam = lc - 0.75 * fsr + 1.5 * fsr * k / 60, x = xOf(lam, m), yy = yOf(lam); dd += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1); }
        s += '<path d="' + dd + '" fill="none" stroke="' + wl2rgb(lc) + '" stroke-width="1.6" opacity=".45"/>';
        if (m % 5 === 0) s += txt(W - m0 + 16, y + 3, m, {});
      }
      // calibration-lamp lines
      HG.concat(AR).forEach(function (lam) {
        for (var m = mMin; m <= mMax; m++) { var lc = twoD / m, fsr = lc / m; if (Math.abs(lam - lc) <= 0.75 * fsr) { var e = sinc2(m - twoD / lam); s += '<circle cx="' + xOf(lam, m).toFixed(1) + '" cy="' + yOf(lam).toFixed(1) + '" r="' + (1.4 + 2.4 * e) + '" fill="#ffffff" opacity="' + (0.25 + 0.75 * e) + '"/>'; } }
      });
      s += txt(W / 2, H - 22, 'position along each order (dispersion by the echelle) →', { cls: 'pl-label' }) + '<text transform="translate(20 ' + (H / 2) + ') rotate(-90)" class="pl-label" text-anchor="middle">← red · order separation by the prism · UV →</text>' + txt(W - m0 + 16, 16, 'order m', {});
      plot.innerHTML = s + '</svg>';
      var m500 = Math.round(twoD / 500), fsr500 = 500 / m500, R = 2 * 50e6 * Math.sin(th) / 500;
      readout(read, [[mMin + '–' + mMax, 'orders covering 200–780 nm'], [fx(fsr500, 2) + ' nm', 'free spectral range near 500 nm (order ' + m500 + ')'], [Math.round(R).toLocaleString('en'), 'resolving power at 500 nm for a 50 mm echelle (2W sin θ_B / λ)'], [(mMax - mMin + 1) + ' stripes', 'on one 2D detector, read in a single exposure']]);
    };
    var sg = VL.select(ctl, { label: 'Echelle', options: [['31.6', '31.6 grooves/mm, R2 (63.4°)'], ['52.67', '52.67 grooves/mm, R2'], ['79', '79 grooves/mm, R2']], value: '79', on: draw });
    var sx = VL.select(ctl, { label: 'Cross-disperser prism', options: [['silica', 'Fused silica'], ['CaF2', 'CaF₂']], value: 'silica', on: draw });
    draw();
  };

  /* ═══ 9. Fourier-transform spectrometer ═══ */
  F.fts = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), row = VL.part(fig, 'spr-row'), sch = document.createElement('div'), plots = document.createElement('div');
    sch.className = 'spr-sch'; row.appendChild(sch); row.appendChild(plots);
    var SP = {
      doublet: { name: 'two lines 4 cm⁻¹ apart', lines: [[1000, 1, 0.3], [1004, 0.7, 0.3]] },
      band: { name: 'one broad band', lines: [[1000, 1, 18]] },
      rot: { name: 'a band of lines every 2.5 cm⁻¹', lines: (function () { var o = []; for (var k = -10; k <= 10; k++) o.push([1000 + 2.5 * k, Math.exp(-Math.pow(k / 6, 2)), 0.25]); return o; })() }
    };
    var dd = 2.5e-4;   // OPD sample step (cm): Nyquist for 2000 cm⁻¹
    var scan = 1, lp = null;
    var interf = function (sp, x) { var s = 0; sp.lines.forEach(function (L) { s += L[1] * Math.exp(-Math.pow(Math.PI * L[2] * x, 2) / (4 * Math.LN2)) * Math.cos(2 * Math.PI * L[0] * x); }); return s; };
    var apo = function (kind, x, Lm) { var u = x / Lm; if (kind === 'tri') return 1 - u; if (kind === 'hg') return 0.54 + 0.46 * Math.cos(Math.PI * u); return 1; };
    var draw = function () {
      var sp = SP[ss.get()], Lmax = sl.get(), Lnow = Lmax * scan, kind = sa.get();
      var N = Math.max(2, Math.floor(Lnow / dd)), xs = [], ys = [];
      for (var i = 0; i <= N; i++) { var x = i * dd; xs.push(x); ys.push(interf(sp, x)); }
      // the interferogram (down-sampled for display)
      var step = Math.max(1, Math.floor(N / 1600)), ig = []; for (var j = 0; j <= N; j += step) ig.push([xs[j] * 10, ys[j]]);
      var p1 = VL.plot({ id: 'fti', label: 'Interferogram', w: 680, h: 200, m: { b: 40 }, x: { min: 0, max: Lmax * 10, label: 'Optical path difference δ (mm)' }, y: { min: -1.8, max: 1.8, label: 'I(δ) − mean' }, series: [{ data: ig, color: C.cyan, width: 1 }] });
      // spectrum: cosine transform of the recorded half-interferogram
      var nu = VL.linspace(960, 1040, 420), spec = nu.map(function (v) { var s = 0; for (var k = 0; k <= N; k++) s += (k === 0 ? 0.5 : 1) * ys[k] * apo(kind, xs[k], Math.max(Lnow, 1e-6)) * Math.cos(2 * Math.PI * v * xs[k]); return [v, s * dd]; });
      var mx = 0; spec.forEach(function (q) { mx = Math.max(mx, Math.abs(q[1])); }); spec = spec.map(function (q) { return [q[0], q[1] / (mx || 1)]; });
      var truth = nu.map(function (v) { var s = 0; sp.lines.forEach(function (L) { s += L[1] * Math.exp(-Math.pow((v - L[0]) / (L[2] / 2), 2) * Math.LN2); }); return [v, s]; }); var tm = 0; truth.forEach(function (q) { tm = Math.max(tm, q[1]); }); truth = truth.map(function (q) { return [q[0], q[1] / tm]; });
      var p2 = VL.plot({ id: 'fts', label: 'Recovered spectrum', w: 680, h: 230, x: { min: 960, max: 1040, label: 'Wavenumber (cm⁻¹)' }, y: { min: -0.3, max: 1.1, label: 'B(ν̃) (normalised)' }, series: [{ data: truth, color: C.text3, width: 1, label: 'true spectrum' }, { data: spec, color: C.au, label: 'from the interferogram' }], legend: true, legendX: 14, legendY: 20 });
      plots.innerHTML = p1 + p2;
      // Michelson schematic with the moving mirror
      var mpos = 200 + 50 * scan;
      sch.innerHTML = svgOpen(300, 260, 'Michelson interferometer') + '<circle cx="30" cy="130" r="12" fill="' + C.au + '" opacity=".8"/>' + line([42, 130], [140, 130], '#ffffff', 2.4, ' opacity=".8"') +
        line([118, 152], [162, 108], C.cyan, 3) + line([140, 130], [140, 30], '#ffffff', 2, ' opacity=".7"') + line([118, 22], [162, 22], '#cfd6e4', 5) + line([140, 130], [mpos, 130], '#ffffff', 2, ' opacity=".7"') + line([mpos, 108], [mpos, 152], '#cfd6e4', 5) +
        '<path d="M' + (mpos + 12) + ' 166 L' + (mpos + 30) + ' 166" stroke="' + C.au + '" stroke-width="2" marker-end="none"/>' + line([140, 130], [140, 230], C.au, 2.4) + '<rect x="122" y="230" width="36" height="16" fill="' + C.green + '" opacity=".85"/>' +
        txt(30, 160, 'source', {}) + txt(140, 14, 'fixed mirror', {}) + txt(Math.min(mpos, 245), 186, 'moving mirror', {}) + txt(170, 100, 'beamsplitter', { anchor: 'start' }) + txt(140, 258, 'detector', {}) + '</svg>';
      var res = 1 / Lnow;
      readout(read, [[fx(Lnow * 10, 2) + ' mm', 'path difference reached'], [fx(res, 2) + ' cm⁻¹', 'resolution ≈ 1/δ_max'], [N.toLocaleString('en'), 'samples (every ' + fx(dd * 1e4, 1) + ' µm of path)'], [kind === 'box' ? 'boxcar' : kind === 'tri' ? 'triangular' : 'Happ–Genzel', 'apodisation']]);
    };
    var ss = VL.select(ctl, { label: 'Spectrum', options: [['doublet', SP.doublet.name], ['band', SP.band.name], ['rot', SP.rot.name]], value: 'doublet', on: function () { draw(); } });
    var sl = VL.slider(ctl, { label: 'Maximum path difference', min: 0.02, max: 1, step: 0.01, value: 0.4, fmt: function (v) { return fx(v * 10, 1) + ' mm'; }, on: function () { draw(); } });
    var sa = VL.select(ctl, { label: 'Apodisation', options: [['box', 'None (boxcar)'], ['tri', 'Triangular'], ['hg', 'Happ–Genzel']], value: 'box', on: function () { draw(); } });
    var t = 0, playing = false, btn = VL.button(ctl, 'Scan the mirror', function () { playing = true; t = 0; scan = 0.02; lp.play(); });
    lp = VL.loop(fig, function (dt) { if (!playing) return; t += dt; scan = Math.min(1, 0.02 + t / 4); draw(); if (scan >= 1) { playing = false; } });
    lp.pause();
    draw();
  };

  /* ═══ 10. Fabry–Pérot ═══ */
  F.fp = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var Rm = sr.get(), l = sl.get() * 1000, Fc = 4 * Rm / Math.pow(1 - Rm, 2), fin = Math.PI * Math.sqrt(Rm) / (1 - Rm);
      var xs = VL.linspace(580, 620, 2400), T = xs.map(function (lam) { var dl = 4 * Math.PI * l / lam; return [lam, 1 / (1 + Fc * Math.pow(Math.sin(dl / 2), 2))]; });
      var fsr = 600 * 600 / (2 * l), fw = fsr / fin;
      plot.innerHTML = VL.plot({ id: 'fp', label: 'Fabry–Pérot transmission', w: 680, h: 300, x: { min: 580, max: 620, label: 'Wavelength (nm)' }, y: { min: 0, max: 1.05, label: 'Transmission' }, series: [{ data: T, color: C.cyan, width: 1.6 }] });
      readout(read, [[fx(fsr, 3) + ' nm', 'free spectral range λ²/2nl at 600 nm'], [fx(fin, 1), 'finesse π√R/(1−R)'], [fw < 0.01 ? fx(fw * 1000, 2) + ' pm' : fx(fw, 3) + ' nm', 'width of each peak (FSR ÷ finesse)'], [Math.round(600 / fw).toLocaleString('en'), 'resolving power']]);
    };
    var sr = VL.slider(ctl, { label: 'Mirror reflectance R', min: 0.3, max: 0.99, step: 0.005, value: 0.9, fmt: function (v) { return fx(v, 3); }, on: draw });
    var sl = VL.slider(ctl, { label: 'Mirror spacing l', min: 2, max: 60, step: 0.5, value: 10, fmt: function (v) { return v + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 11. UV–Vis: bandwidth and stray light ═══ */
  F.uvvis = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var A0 = sa.get(), nbw = sn.get(), sbw = sb.get(), s = ss.get() / 100;
      var A = function (l) { return A0 * Math.exp(-4 * Math.LN2 * Math.pow((l - 500) / nbw, 2)); };
      var xs = VL.linspace(400, 600, 401), tru = [], meas = [], pk = 0;
      xs.forEach(function (l) {
        var num = 0, den = 0, K = 40;
        for (var k = -K; k <= K; k++) { var u = k / K, wgt = 1 - Math.abs(u), lp = l + u * sbw; num += wgt * Math.pow(10, -A(lp)); den += wgt; }
        var T = num / den, Am = -Math.log10((T + s) / (1 + s));
        tru.push([l, A(l)]); meas.push([l, Am]); if (Math.abs(l - 500) < 0.26) pk = Am;
      });
      plot.innerHTML = VL.plot({ id: 'uv', label: 'True and measured absorbance', w: 680, h: 320, x: { min: 400, max: 600, label: 'Wavelength (nm)' }, y: { min: 0, max: Math.max(1.1, A0 * 1.1), label: 'Absorbance' },
        series: [{ data: tru, color: C.text3, label: 'true band' }, { data: meas, color: C.au, label: 'what the instrument reports' }], hlines: s > 0 ? [{ y: -Math.log10(s / (1 + s)), color: C.red, label: 'stray-light ceiling', dash: '3 4' }] : [], legend: true, legendX: 14, legendY: 22 });
      readout(read, [[fx(pk, 3), 'measured peak absorbance (true ' + fx(A0, 2) + ')'], [fx(100 * (pk - A0) / A0, 1) + ' %', 'error at the peak'], [fx(sbw / nbw, 2), 'bandwidth ratio SBW/NBW (aim for ≤ 0.1)'], [s > 0 ? fx(-Math.log10(s), 1) : '∞', 'highest absorbance this stray light allows (≈ −log s)']]);
    };
    var sa = VL.slider(ctl, { label: 'True peak absorbance', min: 0.2, max: 4, step: 0.05, value: 2, fmt: function (v) { return fx(v, 2); }, on: draw });
    var sn = VL.slider(ctl, { label: 'Band width (FWHM)', min: 4, max: 60, step: 1, value: 20, fmt: function (v) { return v + ' nm'; }, on: draw });
    var sb = VL.slider(ctl, { label: 'Spectral bandwidth', min: 0.5, max: 20, step: 0.5, value: 2, fmt: function (v) { return v + ' nm'; }, on: draw });
    var ss = VL.slider(ctl, { label: 'Stray light', min: 0, max: 1, step: 0.005, value: 0.05, fmt: function (v) { return fx(v, 3) + ' %'; }, on: draw });
    draw();
  };

  /* ═══ 12. fluorescence: the inner-filter effect ═══ */
  F.inner = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var r = sr.get(), Ax = sx.get();
      var xs = VL.linspace(0, 1, 200), lin = xs.map(function (a) { return [a, a]; }), obs = xs.map(function (a) { return [a, a * Math.pow(10, -(a + r * a) / 2)]; });
      var now = Ax * Math.pow(10, -(Ax + r * Ax) / 2);
      plot.innerHTML = VL.plot({ id: 'ifx', label: 'Fluorescence signal versus absorbance', w: 680, h: 300, x: { min: 0, max: 1, label: 'Absorbance of the sample at the excitation wavelength (1 cm)' }, y: { min: 0, max: 1, label: 'Fluorescence signal (arb.)' },
        series: [{ data: lin, color: C.text3, dash: '5 4', label: 'proportional to concentration' }, { data: obs, color: C.green, label: 'observed (right-angle, centre of cuvette)' }], marks: [{ x: Ax, y: now, color: C.green }], vlines: [{ x: 0.1, color: C.text3, label: 'A = 0.1' }], legend: true, legendX: 150, legendY: 30 });
      readout(read, [[fx(100 * (1 - now / Ax), 1) + ' %', 'signal lost to the inner-filter effect at this absorbance'], [fx(Ax, 2), 'excitation absorbance'], [fx(r * Ax, 2), 'absorbance at the emission wavelength']]);
    };
    var sx = VL.slider(ctl, { label: 'Absorbance at excitation', min: 0.01, max: 1, step: 0.01, value: 0.1, fmt: function (v) { return fx(v, 2); }, on: draw });
    var sr = VL.slider(ctl, { label: 'Absorbance at emission ÷ excitation', min: 0, max: 1, step: 0.05, value: 0.2, fmt: function (v) { return fx(v, 2); }, on: draw });
    draw();
  };

  /* ═══ 13. Raman: coverage and resolution in cm⁻¹ ═══ */
  F.ramancov = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    // polystyrene, a common Raman shift standard (cm⁻¹)
    var PS = [[620.9, 0.35], [795.8, 0.3], [1001.4, 1], [1031.8, 0.3], [1155.3, 0.25], [1450.5, 0.2], [1583.1, 0.2], [1602.3, 0.45], [2852.4, 0.2], [2904.5, 0.35], [3054.3, 0.8]];
    var draw = function () {
      var l0 = +sl.get(), G = +sg.get(), f = sf.get(), cen = sc.get(), Wdet = 26.6, pix = 26, slit = 50;
      var lc = 1e7 / (1e7 / l0 - cen), d = 1e6 / G, sb = lc / (2 * d);
      if (sb >= 1) { read.innerHTML = '<div><b>—</b><span>the grating cannot diffract ' + fx(lc, 0) + ' nm in this geometry</span></div>'; plot.innerHTML = ''; return; }
      var rld = d * Math.cos(Math.asin(sb)) / f;   // nm per mm
      var la = lc - rld * Wdet / 2, lb = lc + rld * Wdet / 2, sa = 1e7 / l0 - 1e7 / la, sbb = 1e7 / l0 - 1e7 / lb;
      var cmPix = 1e7 * rld * pix / 1000 / (lc * lc), cmSlit = 1e7 * rld * slit / 1000 / (lc * lc);
      var xs = VL.linspace(100, 3400, 1300), spec = xs.map(function (x) { var s = 0; PS.forEach(function (p) { s += p[1] * Math.exp(-Math.pow((x - p[0]) / 5, 2)); }); return [x, s]; });
      plot.innerHTML = VL.plot({ id: 'rcv', label: 'Raman spectrum coverage', w: 680, h: 300, x: { min: 100, max: 3400, label: 'Raman shift (cm⁻¹) — polystyrene reference peaks' }, y: { min: 0, max: 1.1, label: 'Intensity (arb.)' },
        bands: [{ x0: Math.max(100, sa), x1: Math.min(3400, sbb), color: C.au, label: 'one detector frame', op: 0.12 }], series: [{ data: spec, color: C.violet, width: 1.4 }] });
      var hiNm = 1e7 / (1e7 / l0 - 3100);
      readout(read, [[fx(sa, 0) + ' – ' + fx(sbb, 0) + ' cm⁻¹', 'covered in one frame (26.6 mm detector)'], [fx(la, 1) + ' – ' + fx(lb, 1) + ' nm', 'the same range in wavelength'], [fx(cmPix, 2) + ' cm⁻¹', 'per 26 µm pixel'], [fx(cmSlit, 1) + ' cm⁻¹', 'slit-limited resolution (50 µm slit)'],
        [fx(hiNm, 0) + ' nm', 'where the C–H stretch (≈ 3100 cm⁻¹) lands' + (hiNm > 1000 ? ' — beyond silicon’s comfort zone' : '')]]);
    };
    var sl = VL.select(ctl, { label: 'Laser', options: [['532', '532 nm'], ['633', '633 nm'], ['785', '785 nm'], ['830', '830 nm']], value: '785', on: draw });
    var sg = VL.select(ctl, { label: 'Grating', options: [['300', '300 grooves/mm'], ['600', '600 grooves/mm'], ['1200', '1200 grooves/mm'], ['1800', '1800 grooves/mm']], value: '600', on: draw });
    var sf = VL.slider(ctl, { label: 'Focal length', min: 100, max: 750, step: 10, value: 300, fmt: function (v) { return v + ' mm'; }, on: draw });
    var sc = VL.slider(ctl, { label: 'Centre of the frame', min: 300, max: 3000, step: 10, value: 1500, fmt: function (v) { return v + ' cm⁻¹'; }, on: draw });
    draw();
  };

  /* ═══ 14. ATR: how deep the evanescent field reaches ═══ */
  F.atr = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var CR = { diamond: ['Diamond', 2.40], znse: ['ZnSe', 2.43], ge: ['Germanium', 4.0] };
    var draw = function () {
      var th = st.get() * D2R, n2 = sn.get(), series = [], at = {};
      Object.keys(CR).forEach(function (k, i) {
        var n1 = CR[k][1], q = Math.pow(Math.sin(th), 2) - Math.pow(n2 / n1, 2);
        var data = VL.linspace(600, 4000, 200).map(function (nu) { var lam = 1e4 / nu; return [nu, q > 0 ? lam / (2 * Math.PI * n1 * Math.sqrt(q)) : NaN]; });
        series.push({ data: data, color: [C.cyan, C.au, C.violet][i], label: CR[k][0] + ' (n = ' + n1 + ')' }); at[k] = q > 0 ? 10 / (2 * Math.PI * n1 * Math.sqrt(q)) : NaN;
      });
      plot.innerHTML = VL.plot({ id: 'atr', label: 'ATR penetration depth', w: 680, h: 300, x: { min: 600, max: 4000, rev: true, label: 'Wavenumber (cm⁻¹)' }, y: { min: 0, max: 5, label: 'Penetration depth d_p (µm)' }, series: series, legend: true, legendX: 14, legendY: 22 });
      readout(read, Object.keys(CR).map(function (k) { return [isFinite(at[k]) ? fx(at[k], 2) + ' µm' : 'no TIR', CR[k][0] + ' at 1000 cm⁻¹']; }));
    };
    var st = VL.slider(ctl, { label: 'Angle of incidence', min: 30, max: 65, step: 1, value: 45, fmt: function (v) { return v + '°'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'Sample index n₂', min: 1.3, max: 1.7, step: 0.01, value: 1.5, fmt: function (v) { return fx(v, 2); }, on: draw });
    draw();
  };

  /* ═══ 15. wavelength calibration with a Hg–Ar lamp ═══ */
  F.calib = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var lines = HG.filter(function (l) { return l > 300; }).concat(AR.filter(function (l) { return l < 900; }));
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var gauss = function () { var u = rnd() || 1e-9, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    var solve = function (X, y, deg) {   // least squares by normal equations (pixels scaled to [-1, 1])
      var n = deg + 1, A = [], b = []; for (var i = 0; i < n; i++) { A.push(new Array(n).fill(0)); b.push(0); }
      X.forEach(function (x, k) { for (var i = 0; i < n; i++) { b[i] += Math.pow(x, i) * y[k]; for (var j = 0; j < n; j++) A[i][j] += Math.pow(x, i + j); } });
      for (var c = 0; c < n; c++) { var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; var t = A[c]; A[c] = A[p]; A[p] = t; var tb = b[c]; b[c] = b[p]; b[p] = tb;
        for (var r2 = c + 1; r2 < n; r2++) { var f = A[r2][c] / A[c][c]; for (var j2 = c; j2 < n; j2++) A[r2][j2] -= f * A[c][j2]; b[r2] -= f * b[c]; } }
      var x = new Array(n).fill(0); for (var i2 = n - 1; i2 >= 0; i2--) { var s = b[i2]; for (var j3 = i2 + 1; j3 < n; j3++) s -= A[i2][j3] * x[j3]; x[i2] = s / A[i2][i2]; }
      return function (u) { var s = 0; for (var i = 0; i < n; i++) s += x[i] * Math.pow(u, i); return s; };
    };
    var draw = function () {
      var deg = +sd.get(), curv = sk.get(), noise = sn.get();
      // true pixel → wavelength: 2048 pixels spanning 300–900 nm with curvature (a real spectrograph is never perfectly linear)
      var lamOf = function (p) { var u = p / 2047; return 300 + 600 * u + curv * 600 * (u * u - u) + 0.15 * curv * 600 * (u * u * u - 1.5 * u * u + 0.5 * u); };
      var pixOf = function (l) { var lo = 0, hi = 2047; for (var i = 0; i < 50; i++) { var m = (lo + hi) / 2; if (lamOf(m) < l) lo = m; else hi = m; } return (lo + hi) / 2; };
      seed = 7;
      var P = lines.map(function (l) { return pixOf(l) + noise * gauss(); }), U = P.map(function (p) { return p / 1023.5 - 1; });
      var fit = solve(U, lines, deg), res = lines.map(function (l, k) { return [l, (fit(U[k]) - l) * 1000]; });
      var rms = Math.sqrt(res.reduce(function (a, q) { return a + q[1] * q[1]; }, 0) / res.length);
      var curve = VL.linspace(300, 900, 300).map(function (l) { var u = pixOf(l) / 1023.5 - 1; return [l, (fit(u) - l) * 1000]; });
      var lim = Math.max(20, Math.min(4000, 1.3 * Math.max.apply(null, res.map(function (q) { return Math.abs(q[1]); }).concat(curve.map(function (q) { return Math.abs(q[1]); })))));
      plot.innerHTML = VL.plot({ id: 'cal', label: 'Calibration residuals', w: 680, h: 300, x: { min: 300, max: 900, label: 'Wavelength of the lamp line (nm)' }, y: { min: -lim, max: lim, label: 'Fit − true wavelength (pm)' },
        series: [{ data: curve, color: C.au, width: 1.4, label: 'systematic error of the fit' }, { data: res, color: C.cyan, dots: true, r: 3.6, label: 'Hg and Ar lines' }], hlines: [{ y: 0, color: C.text3, dash: '2 3' }], legend: true, legendX: 14, legendY: 22 });
      var px = 600 / 2047 * 1000;
      readout(read, [[fx(rms, 1) + ' pm', 'rms residual of the ' + lines.length + ' lines'], [fx(px, 0) + ' pm', 'one pixel, for comparison'], [deg === 1 ? 'straight line' : deg === 2 ? 'quadratic' : 'cubic', 'calibration polynomial']]);
    };
    var sd = VL.select(ctl, { label: 'Polynomial', options: [['1', 'Linear'], ['2', 'Quadratic'], ['3', 'Cubic']], value: '1', on: draw });
    var sk = VL.slider(ctl, { label: 'Curvature of the real dispersion', min: 0, max: 0.06, step: 0.002, value: 0.03, fmt: function (v) { return fx(v * 100, 1) + ' %'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'Line-centre noise', min: 0, max: 0.5, step: 0.01, value: 0.05, fmt: function (v) { return fx(v, 2) + ' px'; }, on: draw });
    draw();
  };

  /* ═══ 16. test yourself ═══ */
  var QUIZ = [
    ['A grating has 1200 grooves/mm. At normal incidence, at what angle does 600 nm leave in first order?', ['21.1°', '36.9°', '46.1°', 'It cannot diffract'], 2, 'sin β = mλ/d − sin α = 0.6/0.833 = 0.72, so β = 46.1°.'],
    ['Why does a second-order line of 300 nm light appear at “600 nm” on a CCD spectrometer?', ['Fluorescence of the grating', 'mλ is what the grating equation fixes: 2 × 300 = 1 × 600', 'Stray light', 'Chromatic aberration'], 1, 'The grating sends every λ with the same mλ to the same angle. An order-sorting filter removes it.'],
    ['Which change improves the resolution of a dispersive spectrometer but costs light?', ['A wider slit', 'A narrower slit', 'A brighter lamp', 'A shorter integration time'], 1, 'The slit image sets the bandpass; narrowing it sharpens the lines and passes less light — the resolution–throughput trade-off.'],
    ['The resolving power of a grating used in order m with N grooves illuminated is…', ['N/m', 'mN', 'm/N', 'N²'], 1, 'R = λ/Δλ = mN. A 25 mm wide, 600 grooves/mm grating in first order: 15 000.'],
    ['An FTIR scans to a maximum path difference of 0.25 cm. Its resolution is about…', ['0.25 cm⁻¹', '4 cm⁻¹', '25 cm⁻¹', '0.04 cm⁻¹'], 1, 'Δν̃ ≈ 1/δ_max = 1/0.25 cm = 4 cm⁻¹.'],
    ['What is the Fellgett (multiplex) advantage?', ['Higher light throughput from a circular aperture', 'All wavelengths are measured at once, which helps when detector noise dominates', 'An internal laser calibrates the wavenumber axis', 'Better stray-light rejection'], 1, 'Every spectral element is recorded during the whole scan. Throughput is the Jacquinot advantage; the laser reference is Connes’.'],
    ['Why do echelle spectrometers need a cross-disperser?', ['To increase throughput', 'Because the many high orders overlap and must be separated', 'To remove fluorescence', 'To polarise the light'], 1, 'At m ≈ 30–120 the free spectral range is a few nm, so orders overlap; a prism spreads them into stripes.'],
    ['A UV–Vis spectrophotometer has 0.1 % stray light. The largest absorbance it can report reliably is near…', ['1', '2', '3', '6'], 2, 'With stray fraction s the reading saturates near −log s = 3.'],
    ['Why should fluorescence samples be dilute (absorbance below about 0.1)?', ['To avoid photobleaching', 'Because of the inner-filter effect', 'To avoid Raman scattering', 'To keep the cuvette cool'], 1, 'At higher absorbance the excitation is absorbed before the viewed volume and the emission is re-absorbed on its way out.'],
    ['Going from a 532 nm to a 785 nm laser, the same 600 grooves/mm grating covers in cm⁻¹…', ['more range, coarser resolution', 'less range, finer resolution', 'exactly the same range', 'nothing: 785 nm is invisible'], 1, 'A fixed width in nm is a smaller span in cm⁻¹ at longer wavelength (Δν̃ = Δλ/λ²): narrower coverage, finer cm⁻¹ per pixel.'],
    ['In ATR-FTIR, which crystal gives the shallowest sampling depth?', ['Diamond', 'ZnSe', 'Germanium', 'All the same'], 2, 'Its index of 4.0 makes the evanescent field decay fastest: about 0.66 µm at 1000 cm⁻¹ and 45°.'],
    ['Why fit a polynomial rather than a straight line for wavelength calibration?', ['Lamps drift', 'The pixel-to-wavelength relation of a real spectrograph is curved', 'To include intensity', 'It is faster'], 1, 'cos β changes across the detector and the focal plane is not perfectly flat, so λ(pixel) bends.']
  ];
  F.spmquiz = function (fig) {
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
  VL.spm = { GLASS: GLASS, sinc2: sinc2 };
})();
