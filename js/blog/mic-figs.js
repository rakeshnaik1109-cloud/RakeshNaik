/* How microscopes work — interactive figures (uses vl-core.js helpers).
   Airy pattern from the Bessel function J1; colours of retardation from the CIE 1931 colour-matching
   functions in the analytic form of Wyman, Sloan and Shirley (2013); all other curves from the
   formulas quoted in the text. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var D2R = Math.PI / 180;

  /* ── helpers ────────────────────────────────────────────── */
  var fx = function (v, d) { return (+v).toFixed(d == null ? 2 : d); };
  var readout = function (el, rows) { el.innerHTML = rows.map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join(''); };
  var svgOpen = function (w, h, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="plot" role="img" aria-label="' + VL.esc(label) + '">'; };
  var txt = function (x, y, s, o) { o = o || {}; return '<text x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '" class="' + (o.cls || 'pl-tick') + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.fill ? ' fill="' + o.fill + '"' : '') + '>' + s + '</text>'; };
  var line = function (a, b, col, w, extra) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 1.5) + '"' + (extra || '') + '/>'; };
  var lens = function (x, y, h, col, label) { return '<path d="M' + x + ' ' + (y - h) + ' Q' + (x + 9) + ' ' + y + ' ' + x + ' ' + (y + h) + ' Q' + (x - 9) + ' ' + y + ' ' + x + ' ' + (y - h) + ' Z" fill="rgba(69,191,214,.18)" stroke="' + (col || C.cyan) + '"/>' + (label ? txt(x, y + h + 16, label, {}) : ''); };
  /* Bessel J_n (integer n) by Simpson's rule on the integral representation */
  var besselJ = function (n, x) { var N = 120, h = Math.PI / N, s = 0; for (var i = 0; i <= N; i++) { var t = i * h, f = Math.cos(n * t - x * Math.sin(t)); s += f * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2); } return s * h / 3 / Math.PI; };
  /* Airy intensity [2 J1(v)/v]² tabulated once */
  var AIRY = (function () { var t = [], dv = 0.02; for (var i = 0; i <= 4000; i++) { var v = i * dv; t.push(v < 1e-6 ? 1 : Math.pow(2 * besselJ(1, v) / v, 2)); } return function (v) { v = Math.abs(v); var k = v / dv; if (k >= 4000) return 0; var i = Math.floor(k), f = k - i; return t[i] * (1 - f) + t[i + 1] * f; }; })();
  var wl2rgb = function (w) {
    var r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else r = 1;
    var t = function (c) { return Math.round(255 * Math.pow(Math.max(0, c), 0.8)); };
    return 'rgb(' + t(r) + ',' + t(g) + ',' + t(b) + ')';
  };
  /* paraxial ray through thin lenses: ray {x, y, u}, elements [{x, f}] → points */
  var traceRay = function (y0, u0, x0, els, xEnd, ax) { ax = ax || 0; var pts = [[x0, y0]], x = x0, y = y0 - ax, u = u0; els.forEach(function (e) { if (e.x <= x) return; y += u * (e.x - x); x = e.x; pts.push([x, y + ax]); if (e.f) u -= y / e.f; if (e.stop != null && Math.abs(y) > e.stop) { u = NaN; } }); if (isFinite(u)) pts.push([xEnd, y + ax + u * (xEnd - x)]); return pts; };
  var poly = function (pts, col, w, op) { return '<polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 1.4) + '" opacity="' + (op || 0.85) + '"/>'; };

  /* ═══ 1. infinity-corrected microscope ═══ */
  F.micray = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var OBJ = { 4: 0.13, 10: 0.30, 20: 0.75, 40: 0.95, 60: 1.40, 100: 1.45 };
    var draw = function () {
      var M = +sm.get(), ft = +st.get(), fo = ft / M, NA = OBJ[M];
      var W = 700, H = 300, cy = 150, xo = 70;
      // schematic distances (not to scale): objective focal length grows on screen with 1/M
      var fobjPx = 25 + 120 / Math.sqrt(M), xObj = xo + fobjPx, xTube = 470, ftPx = 190, xImg = xTube + ftPx;
      var s = svgOpen(W, H, 'Infinity-corrected microscope');
      s += line([20, cy], [W - 10, cy], C.text3, 1, ' stroke-dasharray="3 5"');
      var hObj = 9;   // object arrow height
      s += line([xo, cy], [xo, cy - hObj], C.au, 3) + '<path d="M' + (xo - 4) + ' ' + (cy - hObj + 5) + ' L' + xo + ' ' + (cy - hObj - 2) + ' L' + (xo + 4) + ' ' + (cy - hObj + 5) + ' Z" fill="' + C.au + '"/>';
      s += lens(xObj, cy, 60, C.cyan, 'objective, f = ' + fx(fo, 1) + ' mm') + lens(xTube, cy, 70, C.cyan, 'tube lens, f = ' + ft + ' mm');
      var els = [{ x: xObj, f: fobjPx }, { x: xTube, f: ftPx }];
      var umax = (20 + 30 * Math.min(1, NA)) / fobjPx;   // cone drawn wider for higher NA (schematic)
      [-1, -0.5, 0, 0.5, 1].forEach(function (k) {
        s += poly(traceRay(cy, umax * k, xo, els, xImg, cy), C.green, 1.3, 0.8);
        s += poly(traceRay(cy - hObj, umax * k, xo, els, xImg, cy), C.violet, 1.3, 0.8);
      });
      var hImg = hObj * ftPx / fobjPx;
      s += line([xImg, cy], [xImg, cy + hImg], C.au, 3) + txt(xImg + 6, cy + hImg + 16, 'intermediate image', { anchor: 'end' }) + txt((xObj + xTube) / 2, cy - 82, '“infinity space”: parallel light, room for filters and the dichroic', {});
      s += txt(xo, cy + 26, 'specimen', {});
      plot.innerHTML = s + '</svg>';
      readout(read, [[M + '×', 'objective magnification f_tube / f_objective'], [fx(NA, 2), 'typical numerical aperture for this magnification'], [fx(22 / M, 2) + ' mm', 'field of view with a field number of 22'], [(M * 10) + '×', 'total, with a 10× eyepiece'], [fx(0.61 * 0.55 / NA, 2) + ' µm', 'resolution 0.61λ/NA at 550 nm']]);
    };
    var sm = VL.select(ctl, { label: 'Objective', options: [['4', '4× / 0.13'], ['10', '10× / 0.30'], ['20', '20× / 0.75'], ['40', '40× / 0.95'], ['60', '60× / 1.40 oil'], ['100', '100× / 1.45 oil']], value: '20', on: draw });
    var st = VL.select(ctl, { label: 'Tube lens', options: [['200', '200 mm (Nikon, Leica)'], ['180', '180 mm (Olympus/Evident)'], ['165', '165 mm (Zeiss)']], value: '200', on: draw });
    draw();
  };

  /* ═══ 2. numerical aperture and immersion ═══ */
  F.na = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var MED = { air: ['Air', 1.0, 0.95], water: ['Water', 1.333, 1.27], glyc: ['Glycerol', 1.47, 1.35], oil: ['Immersion oil', 1.518, 1.45] };
    var draw = function () {
      var m = MED[sm.get()], ni = m[1], NA = Math.min(sn.get(), m[2]), ng = 1.518;
      var W = 680, H = 320, px = 340, py = 255, glassTop = 230, s = svgOpen(W, H, 'Rays from a point under a coverslip');
      s += '<rect x="30" y="' + glassTop + '" width="620" height="20" fill="rgba(69,191,214,.16)" stroke="' + C.cyan + '"/>' + txt(60, glassTop + 14, 'coverslip, n = 1.518', { anchor: 'start' });
      s += '<rect x="30" y="250" width="620" height="40" fill="rgba(127,209,139,.08)"/>' + txt(60, 282, 'specimen in mounting medium, n = 1.518', { anchor: 'start' });
      s += '<rect x="30" y="60" width="620" height="' + (glassTop - 60) + '" fill="' + (ni > 1.01 ? 'rgba(224,168,46,.08)' : 'none') + '"/>' + txt(60, 78, m[0] + ', n = ' + ni, { anchor: 'start' });
      // objective front lens outline and its acceptance cone
      var alpha = Math.asin(NA / ni), wd = glassTop - 70;
      s += '<path d="M' + (px - 210) + ' 40 L' + (px + 210) + ' 40 L' + (px + 120) + ' 70 L' + (px - 120) + ' 70 Z" fill="rgba(255,255,255,.06)" stroke="' + C.text3 + '"/>' + txt(px, 34, 'objective, NA = ' + fx(NA, 2), {});
      var collected = 0;
      for (var a = -84; a <= 84; a += 6) {
        var th = a * D2R, p1 = [px + (py - glassTop) * Math.tan(th), glassTop];
        s += line([px, py], p1, '#ffffff', 1, ' opacity=".5"');
        var sOut = ng * Math.sin(th) / ni;
        if (Math.abs(sOut) >= 1) { s += line(p1, [p1[0] + 30 * Math.tan(th), glassTop + 20], C.red, 1.2, ' opacity=".7"'); continue; }   // totally reflected
        var to = Math.asin(sOut), ok = Math.abs(to) <= alpha + 1e-9, p2 = [p1[0] + wd * Math.tan(to), glassTop - wd];
        s += line(p1, p2, ok ? C.green : C.text3, ok ? 1.8 : 1, ok ? '' : ' opacity=".55"');
      }
      s += '<circle cx="' + px + '" cy="' + py + '" r="4" fill="' + C.au + '"/>';
      plot.innerHTML = s + '</svg>';
      var thg = Math.asin(Math.min(1, NA / ng)), frac = (1 - Math.cos(thg)) / 2;
      readout(read, [[fx(NA, 2), 'NA = n sin α (capped at what this medium allows)'], [fx(alpha / D2R, 1) + '°', 'half-angle α of the accepted cone in the immersion medium'], [fx(100 * frac, 1) + ' %', 'of the light from the point that the objective collects'], [ni < 1.518 ? fx(Math.asin(ni / ng) / D2R, 1) + '°' : 'none', 'critical angle at the coverslip (red rays: totally reflected)'], [fx(0.61 * 0.52 / NA * 1000, 0) + ' nm', 'resolution 0.61λ/NA at 520 nm']]);
    };
    var sm = VL.select(ctl, { label: 'Immersion medium', options: [['air', 'Air (dry objective)'], ['water', 'Water'], ['glyc', 'Glycerol'], ['oil', 'Immersion oil']], value: 'air', on: draw });
    var sn = VL.slider(ctl, { label: 'Objective NA', min: 0.1, max: 1.45, step: 0.01, value: 0.95, fmt: function (v) { return fx(v, 2); }, on: draw });
    draw();
  };

  /* ═══ 3. two points and the Airy pattern ═══ */
  F.psf = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), row = VL.part(fig, 'spr-row'), left = document.createElement('div'), right = document.createElement('div');
    left.className = 'spr-sch'; row.appendChild(left); row.appendChild(right);
    var N = 180, off = document.createElement('canvas'); off.width = N; off.height = N;
    var g = VL.canvas(left, 300, 300);
    var draw = function () {
      var sep = ss.get(), NA = sn.get(), lam = +sl.get(), FOV = 2000;   // nm across the image
      var k = 2 * Math.PI * NA / lam, ox = off.getContext('2d'), im = ox.createImageData(N, N), col = lam < 500 ? [80, 140, 255] : lam < 560 ? [90, 230, 120] : [255, 90, 90];
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var x = (i / (N - 1) - 0.5) * FOV, y = (j / (N - 1) - 0.5) * FOV;
        var I = 0.5 * (AIRY(k * Math.hypot(x + sep / 2, y)) + AIRY(k * Math.hypot(x - sep / 2, y)));
        var v = Math.pow(Math.min(1, I / 0.55), 0.8), q = (j * N + i) * 4;
        im.data[q] = col[0] * v; im.data[q + 1] = col[1] * v; im.data[q + 2] = col[2] * v; im.data[q + 3] = 255;
      }
      ox.putImageData(im, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, 300, 300);
      g.fillStyle = '#efeaf6'; g.font = '12px IBM Plex Mono, monospace'; g.fillText('500 nm', 16, 286); g.fillRect(16, 290, 300 * 500 / FOV, 3);
      var xs = VL.linspace(-1000, 1000, 500), prof = xs.map(function (x) { return [x, 0.5 * (AIRY(k * Math.abs(x + sep / 2)) + AIRY(k * Math.abs(x - sep / 2)))]; });
      var mx = 0; prof.forEach(function (q) { mx = Math.max(mx, q[1]); });
      var mid = 0.5 * (AIRY(k * sep / 2) * 2) / mx;
      right.innerHTML = VL.plot({ id: 'psf', label: 'Line through the two points', w: 420, h: 300, m: { l: 52 }, x: { min: -1000, max: 1000, label: 'Position (nm)' }, y: { min: 0, max: 1.08, label: 'Intensity' },
        series: [{ data: prof.map(function (q) { return [q[0], q[1] / mx]; }), color: C.au }], vlines: [{ x: -sep / 2, color: C.text3, dash: '2 3' }, { x: sep / 2, color: C.text3, dash: '2 3' }] });
      var rR = 0.61 * lam / NA, verdict = sep >= rR ? 'resolved (Rayleigh)' : mid < 0.98 ? 'barely: a shallow dip' : 'not resolved';
      readout(read, [[fx(rR, 0) + ' nm', 'Rayleigh distance 0.61λ/NA'], [fx(lam / (2 * NA), 0) + ' nm', 'Abbe limit λ/2NA'], [fx(100 * mid, 0) + ' %', 'intensity midway, relative to the peaks'], [verdict, 'at this separation']]);
    };
    var ss = VL.slider(ctl, { label: 'Separation of the two points', min: 50, max: 800, step: 5, value: 250, fmt: function (v) { return v + ' nm'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'NA', min: 0.3, max: 1.45, step: 0.01, value: 1.4, fmt: function (v) { return fx(v, 2); }, on: draw });
    var sl = VL.select(ctl, { label: 'Wavelength', options: [['450', '450 nm'], ['520', '520 nm'], ['600', '600 nm']], value: '520', on: draw });
    draw();
  };

  /* ═══ 4. Abbe: orders in the pupil build the image ═══ */
  F.abbe = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), row = VL.part(fig, 'spr-row'), left = document.createElement('div'), right = document.createElement('div');
    left.className = 'spr-sch'; row.appendChild(left); row.appendChild(right);
    var draw = function () {
      var p = sp.get(), NA = sn.get(), lam = 0.55, obl = so.get() === 'obl', s0 = obl ? -NA * 0.95 : 0;
      var orders = [];
      for (var m = -12; m <= 12; m++) { var sm = s0 + m * lam / p; if (Math.abs(sm) <= 1) orders.push({ m: m, s: sm, in: Math.abs(sm) <= NA }); }
      // pupil diagram
      var R = 120, cx = 150, cy = 150, s = svgOpen(300, 300, 'Diffraction orders in the objective pupil');
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + C.text3 + '" stroke-dasharray="3 4"/>' + txt(cx, 18, 'all directions (sin θ = ±1)', {});
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R * NA) + '" fill="rgba(69,191,214,.12)" stroke="' + C.cyan + '"/>' + txt(cx, cy + R * NA + 14, 'pupil: |sin θ| ≤ NA', { fill: C.cyan });
      orders.forEach(function (o) { var c = Math.abs(o.m) % 2 === 0 && o.m !== 0 ? null : o; if (!c) return; s += '<circle cx="' + (cx + o.s * R) + '" cy="' + cy + '" r="' + (o.m === 0 ? 7 : 5) + '" fill="' + (o.in ? C.au : C.text3) + '" opacity="' + (o.in ? 1 : 0.5) + '"/>' + (Math.abs(o.m) <= 3 ? txt(cx + o.s * R, cy - 12, o.m, {}) : ''); });
      left.innerHTML = s + '</svg>';
      // image: sum of captured orders of a 50 % amplitude grating
      var cm = function (m) { return m === 0 ? 0.5 : Math.sin(Math.PI * m / 2) / (Math.PI * m); };
      var xs = VL.linspace(0, 3 * p, 400), img = [], obj = [], mx = 0;
      xs.forEach(function (x) { var re = 0, im = 0; orders.forEach(function (o) { if (!o.in) return; var ph = 2 * Math.PI * o.m * x / p; re += cm(o.m) * Math.cos(ph); im += cm(o.m) * Math.sin(ph); }); var I = re * re + im * im; img.push([x, I]); mx = Math.max(mx, I); obj.push([x, (x / p) % 1 < 0.5 ? 1 : 0]); });
      right.innerHTML = VL.plot({ id: 'abbe', label: 'Object and image of a grating', w: 420, h: 300, m: { l: 52 }, x: { min: 0, max: 3 * p, label: 'Position (µm)' }, y: { min: 0, max: 1.15, label: 'Transmission / intensity' },
        series: [{ data: obj, color: C.text3, width: 1, label: 'object (bars)' }, { data: img.map(function (q) { return [q[0], mx ? q[1] / mx : 0]; }), color: C.au, label: 'image' }], legend: true, legendX: 170, legendY: 14 });
      var n = orders.filter(function (o) { return o.in && cm(o.m) !== 0; }).length, lim = obl ? lam / (2 * NA) : lam / NA;
      readout(read, [[n, 'orders entering the objective'], [n >= 2 ? 'yes' : 'no — only the zero order', 'are the bars resolved?'], [fx(lim, 2) + ' µm', 'smallest period this illumination resolves (' + (obl ? 'λ/2NA, oblique' : 'λ/NA, axial') + ')']]);
    };
    var sp = VL.slider(ctl, { label: 'Grating period', min: 0.2, max: 4, step: 0.01, value: 1.2, fmt: function (v) { return fx(v, 2) + ' µm'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'Objective NA', min: 0.1, max: 1.4, step: 0.01, value: 0.5, fmt: function (v) { return fx(v, 2); }, on: draw });
    var so = VL.select(ctl, { label: 'Illumination', options: [['ax', 'Axial (straight through)'], ['obl', 'Oblique (tilted to the pupil edge)']], value: 'ax', on: draw });
    draw();
  };

  /* ═══ 5. Köhler illumination ═══ */
  F.kohler = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), note = VL.part(fig, 'vl-readout');
    var X = { lamp: 20, coll: 80, field: 120, aper: 330, cond: 380, spec: 441.4, obj: 491.4, bfp: 541.4, tube: 600, img: 700 };
    var els = [{ x: X.coll, f: 48.4 }, { x: X.cond, f: 50 }, { x: X.obj, f: 50 }, { x: X.tube, f: 100 }];
    var draw = function () {
      var mode = sm.get(), cy = 150, s = svgOpen(740, 300, 'Köhler illumination');
      s += line([10, cy], [730, cy], C.text3, 1, ' stroke-dasharray="3 5"');
      s += '<circle cx="' + X.lamp + '" cy="' + cy + '" r="7" fill="' + C.au + '"/>' + txt(X.lamp + 4, cy + 50, 'lamp', {});
      s += lens(X.coll, cy, 40, C.cyan, 'collector') + lens(X.cond, cy, 55, C.cyan, 'condenser') + lens(X.obj, cy, 45, C.cyan, 'objective') + lens(X.tube, cy, 50, C.cyan, 'tube lens');
      var stop = function (x, h, label, col) { return line([x, cy - 80], [x, cy - h], col, 3) + line([x, cy + h], [x, cy + 80], col, 3) + txt(x, cy - 88, label, { fill: col }); };
      var fieldCol = mode === 'field' ? C.au : C.text3, aperCol = mode === 'aper' ? C.violet : C.text3;
      s += stop(X.field, 22, 'field diaphragm', fieldCol) + stop(X.aper, 18, 'aperture diaphragm', aperCol);
      s += line([X.spec, cy - 70], [X.spec, cy + 70], fieldCol, 1, ' stroke-dasharray="2 3"') + txt(X.spec, cy + 86, 'specimen', { fill: fieldCol });
      s += line([X.bfp, cy - 70], [X.bfp, cy + 70], aperCol, 1, ' stroke-dasharray="2 3"') + txt(X.bfp + 4, cy + 100, 'back focal plane', { fill: aperCol });
      s += line([X.img, cy - 70], [X.img, cy + 70], fieldCol, 1, ' stroke-dasharray="2 3"') + txt(X.img - 10, cy + 86, 'image', { fill: fieldCol });
      if (mode === 'field') {
        // from the edge of the field diaphragm: imaged onto the specimen and the image
        [-0.1, -0.05, 0, 0.05, 0.1].forEach(function (u) { s += poly(traceRay(cy - 20, u, X.field, els.slice(1), X.img, cy), C.au, 1.3); });
        [-0.1, 0, 0.1].forEach(function (u) { s += poly(traceRay(cy + 20, u, X.field, els.slice(1), X.img, cy), C.au, 1.1, 0.5); });
      } else {
        // from points on the lamp filament: imaged onto the aperture diaphragm and the back focal plane; parallel at the specimen
        [-0.35, -0.18, 0, 0.18, 0.35].forEach(function (u) { s += poly(traceRay(cy - 5, u, X.lamp, els, X.img, cy), C.violet, 1.3); });
        [-0.35, 0, 0.35].forEach(function (u) { s += poly(traceRay(cy + 5, u, X.lamp, els, X.img, cy), C.violet, 1.1, 0.5); });
      }
      plot.innerHTML = s + '</svg>';
      note.innerHTML = mode === 'field' ? '<div style="grid-column:1/-1"><b>Field (image-forming) planes</b><span>The field diaphragm is focused onto the specimen, and so appears sharp in the image: closing it limits the illuminated area to what you look at, which cuts glare. The lamp filament is nowhere in focus in these planes, so the field is evenly lit.</span></div>'
        : '<div style="grid-column:1/-1"><b>Aperture (illuminating) planes</b><span>The lamp filament is focused onto the condenser aperture diaphragm and again into the objective\'s back focal plane. Each filament point becomes a parallel beam through the specimen. Closing the aperture diaphragm narrows the cone of illumination: more contrast and depth of field, less resolution.</span></div>';
    };
    var sm = VL.select(ctl, { label: 'Show', options: [['field', 'Field (image-forming) planes'], ['aper', 'Aperture (illuminating) planes']], value: 'field', on: draw });
    draw();
  };

  /* ═══ 6. making a transparent cell visible ═══ */
  F.contrast = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var N = 160, g = VL.canvas(fig, 640, 330), off = document.createElement('canvas'); off.width = N; off.height = N;
    // a synthetic cell: thickness × index difference → phase (radians per unit "strength")
    var PH = new Float64Array(N * N);
    (function () { for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var x = (i - N / 2) / (N / 2), y = (j - N / 2) / (N / 2);
      var body = Math.exp(-Math.pow(Math.hypot(x / 0.75, y / 0.55), 6)) * (0.6 + 0.4 * Math.exp(-Math.pow(Math.hypot(x + 0.1, y) / 0.6, 2)));
      var nuc = 0.7 * Math.exp(-Math.pow(Math.hypot((x - 0.12) / 0.26, (y + 0.05) / 0.22), 2) * 2);
      var gran = 0; [[-0.45, 0.2], [-0.3, -0.25], [0.45, 0.25], [0.5, -0.2], [-0.15, 0.35], [0.3, 0.3]].forEach(function (c) { gran += 0.35 * Math.exp(-(Math.pow(x - c[0], 2) + Math.pow(y - c[1], 2)) / 0.0025); });
      PH[j * N + i] = body + nuc + gran; } })();
    var paint = function (I, x0, title) {
      var ox = off.getContext('2d'), im = ox.createImageData(N, N);
      for (var k = 0; k < N * N; k++) { var v = Math.max(0, Math.min(255, I[k] * 255)); im.data[4 * k] = v; im.data[4 * k + 1] = v; im.data[4 * k + 2] = v * 0.96; im.data[4 * k + 3] = 255; }
      ox.putImageData(im, 0, 0); g.drawImage(off, x0, 20, 290, 290); g.fillStyle = '#efeaf6'; g.font = '13px IBM Plex Sans, sans-serif'; g.textAlign = 'center'; g.fillText(title, x0 + 145, 14);
    };
    var draw = function () {
      var mode = sm.get(), str = ss.get(), n = N * N, I = new Float64Array(n);
      g.fillStyle = '#171026'; g.fillRect(0, 0, 640, 330);
      var mr = 0, mi = 0; for (var k = 0; k < n; k++) { mr += Math.cos(str * PH[k]); mi += Math.sin(str * PH[k]); } mr /= n; mi /= n;
      var P = new Float64Array(n); var pmax = 0; for (var k2 = 0; k2 < n; k2++) { P[k2] = PH[k2] * str; pmax = Math.max(pmax, P[k2]); }
      var phaseImg = new Float64Array(n); for (var k3 = 0; k3 < n; k3++) phaseImg[k3] = 0.08 + 0.9 * P[k3] / (pmax || 1);
      if (mode === 'bf') for (var a = 0; a < n; a++) I[a] = 0.82;
      else if (mode === 'stain') for (var b = 0; b < n; b++) I[b] = 0.85 * Math.exp(-1.2 * PH[b]);
      else if (mode === 'df') { var mx = 0; for (var c = 0; c < n; c++) { var er = Math.cos(P[c]) - mr, ei = Math.sin(P[c]) - mi; I[c] = er * er + ei * ei; mx = Math.max(mx, I[c]); } for (var c2 = 0; c2 < n; c2++) I[c2] = Math.pow(I[c2] / (mx || 1), 0.6); }
      else if (mode === 'pc') { var att = 0.5, mx2 = 0; for (var d = 0; d < n; d++) { var er2 = Math.cos(P[d]) - mr, ei2 = Math.sin(P[d]) - mi; var dr = att * (mr * 0 + mi * 1), di = att * (-mr); /* zero order shifted by −π/2 and attenuated */ var Er = er2 + att * mi, Ei = ei2 - att * mr; I[d] = Er * Er + Ei * Ei; mx2 = Math.max(mx2, I[d]); } for (var d2 = 0; d2 < n; d2++) I[d2] = 0.9 * I[d2] / (mx2 || 1); }
      else if (mode === 'dic') { var sh = 2, B = Math.PI / 6, mxd = 0; for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var i1 = Math.min(N - 1, i + sh), j1 = Math.min(N - 1, j + sh), i0 = Math.max(0, i - sh), j0 = Math.max(0, j - sh); var dp = P[j1 * N + i1] - P[j0 * N + i0]; I[j * N + i] = Math.pow(Math.sin((dp + B) / 2), 2); mxd = Math.max(mxd, I[j * N + i]); } for (var j2 = 0; j2 < n; j2++) I[j2] = 0.92 * I[j2] / (mxd || 1); }
      paint(phaseImg, 10, 'the phase the cell adds (not visible)');
      paint(I, 340, { bf: 'brightfield', stain: 'brightfield, stained cell', df: 'darkfield', pc: 'phase contrast', dic: 'DIC (Nomarski)' }[mode]);
      var mean = 0, sd = 0; for (var e = 0; e < n; e++) mean += I[e]; mean /= n; for (var e2 = 0; e2 < n; e2++) sd += Math.pow(I[e2] - mean, 2); sd = Math.sqrt(sd / n);
      readout(read, [[fx(pmax, 2) + ' rad', 'largest phase delay in the cell (' + fx(pmax / (2 * Math.PI) * 550, 0) + ' nm of path at 550 nm)'], [fx(mean > 0 ? sd / mean : 0, 2), 'image contrast (standard deviation ÷ mean)']]);
    };
    var sm = VL.select(ctl, { label: 'Method', options: [['bf', 'Brightfield'], ['stain', 'Brightfield, stained'], ['df', 'Darkfield'], ['pc', 'Phase contrast'], ['dic', 'DIC (Nomarski)']], value: 'bf', on: draw });
    var ss = VL.slider(ctl, { label: 'Phase strength', min: 0.2, max: 2.5, step: 0.05, value: 0.8, fmt: function (v) { return fx(v, 2) + '×'; }, on: draw });
    draw();
  };

  /* ═══ 7. interference colours between crossed polarisers ═══ */
  var gp = function (l, mu, s1, s2) { var t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  var cmf = function (l) {   // CIE 1931 2° observer, analytic fit (Wyman, Sloan & Shirley 2013)
    return [1.056 * gp(l, 599.8, 37.9, 31.0) + 0.362 * gp(l, 442.0, 16.0, 26.7) - 0.065 * gp(l, 501.1, 20.4, 26.2),
      0.821 * gp(l, 568.8, 46.9, 40.5) + 0.286 * gp(l, 530.9, 16.3, 31.1),
      1.217 * gp(l, 437.0, 11.8, 36.0) + 0.681 * gp(l, 459.0, 26.0, 13.8)];
  };
  var WHITE = (function () { var s = [0, 0, 0]; for (var l = 380; l <= 780; l += 4) { var c = cmf(l); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; } return s; })();
  var xyz2rgb = function (X, Y, Z) {
    var r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    var gam = function (c) { c = Math.max(0, Math.min(1, c)); return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); };
    return 'rgb(' + gam(r) + ',' + gam(g) + ',' + gam(b) + ')';
  };
  var retColour = function (G, k) {   // retardation G (nm), extra factor k = sin²2θ
    var s = [0, 0, 0]; for (var l = 380; l <= 780; l += 4) { var T = k * Math.pow(Math.sin(Math.PI * G / l), 2), c = cmf(l); s[0] += T * c[0]; s[1] += T * c[1]; s[2] += T * c[2]; }
    var n = WHITE[1]; return xyz2rgb(s[0] / n * 0.9505 / (WHITE[0] / n), s[1] / n, s[2] / n * 1.089 / (WHITE[2] / n));
  };
  F.michel = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var MAT = { quartz: ['Quartz', 0.009], collagen: ['Collagen fibre (approx.)', 0.003], calcite: ['Calcite', 0.172], mica: ['Muscovite mica', 0.04] };
    var chart = null;
    var draw = function () {
      var m = MAT[sm.get()], t = st.get(), th = so.get(), G = m[1] * t * 1000, k = Math.pow(Math.sin(2 * th * D2R), 2);
      var W = 680, H = 250, s = svgOpen(W, H, 'Michel-Lévy interference colours'), L = 30, Rr = 650, Gmax = 1800;
      if (!chart) { chart = ''; for (var i = 0; i < 310; i++) { var g0 = i / 310 * Gmax; chart += '<rect x="' + (L + i * (Rr - L) / 310).toFixed(1) + '" y="40" width="' + ((Rr - L) / 310 + 0.6).toFixed(2) + '" height="70" fill="' + retColour(g0, 1) + '"/>'; } }
      s += chart;
      for (var o = 1; o <= 3; o++) { var xo = L + o * 550 / Gmax * (Rr - L); s += line([xo, 34], [xo, 116], '#ffffff', 1, ' stroke-dasharray="2 3" opacity=".6"') + txt(xo, 30, 'order ' + o + ' ends', {}); }
      for (var gg = 0; gg <= Gmax; gg += 300) s += txt(L + gg / Gmax * (Rr - L), 130, gg, {});
      s += txt((L + Rr) / 2, 148, 'Retardation Γ = Δn · t (nm), white light, crossed polarisers, sample at 45°', { cls: 'pl-label' });
      var xm = L + Math.min(G, Gmax) / Gmax * (Rr - L);
      s += '<path d="M' + xm + ' 112 L' + (xm - 7) + ' 124 L' + (xm + 7) + ' 124 Z" fill="' + C.au + '"/>';
      s += '<rect x="250" y="184" width="180" height="56" rx="6" fill="' + retColour(G, k) + '" stroke="' + C.axis + '"/>' + txt(340, 176, 'what this sample looks like', {});
      plot.innerHTML = s + '</svg>';
      readout(read, [[fx(G, 0) + ' nm', 'retardation Γ = Δn t'], [fx(G / 550, 2), 'interference order (Γ / 550 nm)'], [fx(100 * k, 0) + ' %', 'brightness factor sin² 2θ at this orientation'], [fx(m[1], 3), 'birefringence Δn of ' + m[0]]]);
    };
    var sm = VL.select(ctl, { label: 'Material', options: [['quartz', 'Quartz (Δn 0.009)'], ['mica', 'Muscovite mica (≈ 0.04)'], ['calcite', 'Calcite (0.172)'], ['collagen', 'Collagen (≈ 0.003)']], value: 'quartz', on: draw });
    var st = VL.slider(ctl, { label: 'Thickness', min: 1, max: 60, step: 0.5, value: 30, fmt: function (v) { return v + ' µm'; }, on: draw });
    var so = VL.slider(ctl, { label: 'Angle to the polariser', min: 0, max: 90, step: 1, value: 45, fmt: function (v) { return v + '°'; }, on: draw });
    draw();
  };

  /* ═══ 8. the fluorescence filter cube ═══ */
  F.cube = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var DYE = { dapi: ['DAPI-like (358 / 461 nm)', 358, 461, 22, 38], fitc: ['FITC / GFP-like (495 / 519 nm)', 495, 519, 18, 24], tritc: ['TRITC-like (557 / 576 nm)', 557, 576, 18, 26] };
    var CUBE = { dapi: ['DAPI cube: 350/50, DM 400, 460/50', 350, 50, 400, 460, 50], fitc: ['FITC cube: 470/40, DM 495, 525/50', 470, 40, 495, 525, 50], tritc: ['TRITC cube: 545/30, DM 570, 620/60', 545, 30, 570, 620, 60] };
    var skew = function (l, pk, w, tail, side) { var t = (l - pk) / (((l - pk) * side) > 0 ? w * tail : w); return Math.exp(-t * t); };
    var draw = function () {
      var d = DYE[sd.get()], c = CUBE[sc.get()];
      var abs = function (l) { return skew(l, d[1], d[3], 1.9, -1); }, em = function (l) { return skew(l, d[2], d[4], 1.8, 1); };
      var band = function (l, c0, w) { return Math.abs(l - c0) <= w / 2 ? 0.95 : 0; }, dm = function (l) { return l > c[3] ? 0.95 : 0.04; };
      var xs = VL.linspace(300, 750, 451);
      var ex = 0, exTot = 0, col = 0, colTot = 0;
      xs.forEach(function (l) { exTot += abs(l); ex += abs(l) * band(l, c[1], c[2]); colTot += em(l); col += em(l) * band(l, c[4], c[5]) * dm(l); });
      plot.innerHTML = VL.plot({ id: 'cube', label: 'Dye spectra and filter cube', w: 680, h: 320, x: { min: 300, max: 750, label: 'Wavelength (nm)' }, y: { min: 0, max: 1.1, label: 'Normalised (model spectra)' },
        bands: [{ x0: c[1] - c[2] / 2, x1: c[1] + c[2] / 2, color: C.violet, label: 'exciter', op: 0.18 }, { x0: c[4] - c[5] / 2, x1: c[4] + c[5] / 2, color: C.green, label: 'emitter', op: 0.18 }],
        vlines: [{ x: c[3], color: C.au, label: 'dichroic edge' }],
        series: [{ data: xs.map(function (l) { return [l, abs(l)]; }), color: C.cyan, dash: '6 4', label: 'absorption' }, { data: xs.map(function (l) { return [l, em(l)]; }), color: C.red, label: 'emission' }], legend: true, legendX: 470, legendY: 24 });
      readout(read, [[fx(100 * ex / exTot, 0) + ' %', 'of the absorption band covered by the exciter'], [fx(100 * col / colTot, 0) + ' %', 'of the emission reaching the camera'], [fx(d[2] - d[1], 0) + ' nm', 'Stokes shift of the dye']]);
    };
    var sd = VL.select(ctl, { label: 'Fluorophore', options: [['dapi', DYE.dapi[0]], ['fitc', DYE.fitc[0]], ['tritc', DYE.tritc[0]]], value: 'fitc', on: draw });
    var sc = VL.select(ctl, { label: 'Filter cube', options: [['dapi', CUBE.dapi[0]], ['fitc', CUBE.fitc[0]], ['tritc', CUBE.tritc[0]]], value: 'fitc', on: draw });
    draw();
  };

  /* ═══ 9. the confocal pinhole ═══ */
  F.confocal = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), row = VL.part(fig, 'spr-row'), left = document.createElement('div'), right = document.createElement('div');
    left.className = 'spr-sch'; row.appendChild(left); row.appendChild(right);
    var draw = function () {
      var PH = sp.get(), NA = sn.get(), n = 1.518, lam = 0.52, q = n - Math.sqrt(n * n - NA * NA);
      var waveT = 0.64 * lam / q, geoT = Math.sqrt(Math.pow(0.88 * lam / q, 2) + Math.pow(Math.SQRT2 * n * PH * 1.22 * lam / NA / NA, 2));
      var fw = PH <= 0.25 ? waveT : PH >= 1 ? geoT : waveT + (geoT - waveT) * (PH - 0.25) / 0.75;
      var v = Math.PI * 1.22 * PH, ee = 1 - Math.pow(besselJ(0, v), 2) - Math.pow(besselJ(1, v), 2);
      // schematic: in-focus light passes the pinhole, out-of-focus light is mostly blocked
      var s = svgOpen(300, 300, 'Confocal pinhole'), cy = 150, ph = 3 + 14 * Math.min(PH, 3) / 3;
      s += lens(70, cy, 60, C.cyan, 'lens') + line([250, cy - 90], [250, cy - ph], C.text, 3) + line([250, cy + ph], [250, cy + 90], C.text, 3) + txt(250, cy - 98, 'pinhole', {}) + '<rect x="262" y="' + (cy - 18) + '" width="16" height="36" fill="' + C.green + '" opacity=".8"/>' + txt(270, cy + 36, 'detector', {});
      s += line([20, cy - 40], [70, cy - 40], C.text3, 1) ;
      [[-40, 0], [40, 0]].forEach(function (r) { s += poly([[30, cy], [70, cy + r[0]], [250, cy], [270, cy - r[0] * 0.1]], C.au, 1.6); });
      [[-40], [40]].forEach(function (r) { var ff = 10; s += poly([[46, cy], [70, cy + r[0]], [200, cy - r[0] * 0.55]], C.red, 1.3, 0.8); s += poly([[200, cy - r[0] * 0.55], [250, cy - r[0] * 1.0]], C.red, 1.3, 0.35); });
      s += '<circle cx="30" cy="' + cy + '" r="4" fill="' + C.au + '"/><circle cx="46" cy="' + cy + '" r="4" fill="' + C.red + '"/>' + txt(8, cy + 80, 'gold: in focus · red: out of focus', { anchor: 'start' });
      left.innerHTML = s + '</svg>';
      var zs = VL.linspace(-4, 4, 300), conf = zs.map(function (z) { return [z, 1 / (1 + Math.pow(2 * z / fw, 2))]; });
      right.innerHTML = VL.plot({ id: 'conf', label: 'Signal from a thin fluorescent plane versus its distance from focus', w: 420, h: 300, m: { l: 52 }, x: { min: -4, max: 4, label: 'Distance of the plane from focus (µm)' }, y: { min: 0, max: 1.15, label: 'Signal (normalised)' },
        series: [{ data: zs.map(function (z) { return [z, 1]; }), color: C.text3, dash: '5 4', label: 'widefield' }, { data: conf, color: C.au, label: 'confocal' }], legend: true, legendX: 230, legendY: 14 });
      readout(read, [[fx(fw, 2) + ' µm', 'optical section thickness (FWHM)'], [fx(100 * ee, 0) + ' %', 'of the in-focus light passing the pinhole'], [fx(0.51 * lam / NA * 1000, 0) + ' → ' + fx((PH <= 0.25 ? 0.37 : PH >= 1 ? 0.51 : 0.37 + 0.14 * (PH - 0.25) / 0.75) * lam / NA * 1000, 0) + ' nm', 'lateral FWHM: widefield → confocal']]);
    };
    var sp = VL.slider(ctl, { label: 'Pinhole diameter', min: 0.1, max: 3, step: 0.05, value: 1, fmt: function (v) { return fx(v, 2) + ' AU'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'NA (oil, n = 1.518)', min: 0.5, max: 1.45, step: 0.01, value: 1.4, fmt: function (v) { return fx(v, 2); }, on: draw });
    draw();
  };

  /* ═══ 10. two-photon excitation is confined to the focus ═══ */
  F.twop = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), row = VL.part(fig, 'spr-row'), left = document.createElement('div'), right = document.createElement('div');
    left.className = 'spr-sch'; row.appendChild(left); row.appendChild(right);
    var N = 120, off = document.createElement('canvas'); off.width = N; off.height = N; var g = VL.canvas(left, 300, 300);
    var draw = function () {
      var np = +so.get(), NA = sn.get(), lam = np === 1 ? 0.488 : np === 2 ? 0.92 : 1.3, nn = 1.33, w0 = lam / (Math.PI * NA / nn) / nn, zR = Math.PI * w0 * w0 * nn / lam, span = 6 * zR;
      var ox = off.getContext('2d'), im = ox.createImageData(N, N), mx = Math.pow(1, np);
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var z = (j / (N - 1) - 0.5) * span, r = (i / (N - 1) - 0.5) * span, w = w0 * Math.sqrt(1 + z * z / (zR * zR)), I = Math.pow(w0 / w, 2) * Math.exp(-2 * r * r / (w * w)), v = Math.pow(I, np) / mx, q = (j * N + i) * 4, gm = Math.pow(v, 0.45);
        im.data[q] = 120 * gm; im.data[q + 1] = 255 * gm; im.data[q + 2] = 140 * gm; im.data[q + 3] = 255; }
      ox.putImageData(im, 0, 0); g.drawImage(off, 0, 0, 300, 300); g.fillStyle = '#efeaf6'; g.font = '12px IBM Plex Mono, monospace'; g.fillText('excitation rate ∝ I' + (np > 1 ? (np === 2 ? '²' : '³') : ''), 12, 18); g.fillText('beam travels down ↓', 12, 290);
      var us = VL.linspace(-6, 6, 300);
      right.innerHTML = VL.plot({ id: 'tp', label: 'Excitation summed over each plane', w: 420, h: 300, m: { l: 52 }, x: { min: -6, max: 6, label: 'Distance from focus (Rayleigh ranges)' }, y: { min: 0, max: 1.15, label: 'Excitation per plane' },
        series: [{ data: us.map(function (u) { return [u, 1]; }), color: C.cyan, dash: '5 4', label: 'one-photon' }, { data: us.map(function (u) { return [u, 1 / (1 + u * u)]; }), color: C.green, label: 'two-photon' }, { data: us.map(function (u) { return [u, 1 / Math.pow(1 + u * u, 2)]; }), color: C.violet, dash: '2 3', label: 'three-photon' }], legend: true, legendX: 250, legendY: 14 });
      var within = np === 1 ? 0 : np === 2 ? 50 : 82;
      readout(read, [[fx(w0 * 1000, 0) + ' nm', 'beam waist w₀ at ' + fx(lam * 1000, 0) + ' nm (paraxial estimate)'], [fx(2 * zR, 2) + ' µm', 'focal depth 2z_R'], [np === 1 ? 'none' : within + ' %', 'of all excitation within ±z_R of the focus']]);
    };
    var so = VL.select(ctl, { label: 'Process', options: [['1', 'One-photon (488 nm)'], ['2', 'Two-photon (920 nm)'], ['3', 'Three-photon (1300 nm)']], value: '2', on: draw });
    var sn = VL.slider(ctl, { label: 'NA (water)', min: 0.3, max: 1.1, step: 0.01, value: 0.8, fmt: function (v) { return fx(v, 2); }, on: draw });
    draw();
  };

  /* ═══ 11. the light sheet ═══ */
  F.sheet = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var w0 = sw.get(), lam = 0.488, n = 1.33, zR = Math.PI * w0 * w0 * n / lam, L = Math.max(4 * zR, 400);
      var zs = VL.linspace(-L / 2, L / 2, 400), up = zs.map(function (z) { return [z, w0 * Math.sqrt(1 + z * z / (zR * zR))]; }), dn = up.map(function (q) { return [q[0], -q[1]]; });
      var ym = Math.max(3 * w0, 12);
      plot.innerHTML = VL.plot({ id: 'sheet', label: 'Light-sheet profile', w: 680, h: 300, x: { min: -L / 2, max: L / 2, label: 'Along the sheet (µm)' }, y: { min: -ym, max: ym, label: 'Across the sheet (µm)' },
        bands: [{ x0: -zR, x1: zR, color: C.green, label: 'usable: thinner than √2 w₀', op: 0.1 }], series: [{ data: up, color: C.cyan, label: '1/e² edge of the sheet' }, { data: dn, color: C.cyan }], hlines: [{ y: 0, color: C.text3, dash: '2 3' }] });
      readout(read, [[fx(2 * w0, 1) + ' µm', 'sheet thickness at the waist (2w₀)'], [fx(2 * zR, 0) + ' µm', 'usable length 2z_R = 2πw₀²n/λ'], [fx(lam / (Math.PI * w0) * n / n, 3), 'illumination NA ≈ λ/(πw₀)']]);
    };
    var sw = VL.slider(ctl, { label: 'Waist w₀ (half-thickness)', min: 0.5, max: 10, step: 0.1, value: 2, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 12. TIRF ═══ */
  F.tirf = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var lam = +sl.get(), n2 = sc.get(), n1 = 1.518, tc = Math.asin(n2 / n1) / D2R, th = Math.max(tc + 0.2, sa.get());
      var d = function (t) { var q = n1 * n1 * Math.pow(Math.sin(t * D2R), 2) - n2 * n2; return q > 0 ? lam / (4 * Math.PI * Math.sqrt(q)) : NaN; };
      var ts = VL.linspace(tc + 0.05, 80, 300);
      plot.innerHTML = VL.plot({ id: 'tirf', label: 'TIRF penetration depth', w: 680, h: 300, x: { min: 60, max: 80, label: 'Angle of incidence in the glass (°)' }, y: { min: 0, max: 400, label: 'Penetration depth d (nm)' },
        series: [{ data: ts.map(function (t) { return [t, d(t)]; }), color: C.cyan }], vlines: [{ x: tc, color: C.red, label: 'critical angle' }, { x: Math.asin(1.49 / n1) / D2R, color: C.text3, label: 'NA 1.49' }], marks: [{ x: th, y: d(th), color: C.au }] });
      readout(read, [[fx(tc, 1) + '°', 'critical angle (NA ' + fx(n2, 2) + ' needed just to reach it)'], [fx(d(th), 0) + ' nm', 'penetration depth (intensity, 1/e) at ' + fx(th, 1) + '°'], [fx(n1 * Math.sin(th * D2R), 2), 'objective NA this angle needs'], [fx(100 * Math.exp(-200 / d(th)), 1) + ' %', 'intensity left 200 nm into the cell']]);
    };
    var sa = VL.slider(ctl, { label: 'Angle of incidence', min: 61, max: 80, step: 0.1, value: 66, fmt: function (v) { return fx(v, 1) + '°'; }, on: draw });
    var sl = VL.select(ctl, { label: 'Laser', options: [['488', '488 nm'], ['561', '561 nm'], ['640', '640 nm']], value: '488', on: draw });
    var sc = VL.slider(ctl, { label: 'Index of the cell', min: 1.33, max: 1.40, step: 0.005, value: 1.37, fmt: function (v) { return fx(v, 3); }, on: draw });
    draw();
  };

  /* ═══ 13. beyond the diffraction limit ═══ */
  F.superres = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var mode = sm.get(), NA = 1.4, lam = 0.6;
      sx.input.parentNode.style.display = mode === 'sted' ? '' : 'none'; sN.input.parentNode.style.display = mode === 'sted' ? 'none' : '';
      if (mode === 'sted') {
        var xs = VL.logspace(0.1, 1000, 200), dd = function (s) { return lam / (2 * NA * Math.sqrt(1 + s)) * 1000; }, cur = sx.get();
        plot.innerHTML = VL.plot({ id: 'sr', label: 'STED resolution versus depletion intensity', w: 680, h: 300, x: { min: 0.1, max: 1000, log: true, label: 'Depletion intensity I / I_sat' }, y: { min: 0, max: 240, label: 'Resolution (nm)' }, series: [{ data: xs.map(function (s) { return [s, dd(s)]; }), color: C.au }], hlines: [{ y: dd(0), color: C.text3, label: 'diffraction limit λ/2NA' }], marks: [{ x: cur, y: dd(cur), color: C.au }] });
        readout(read, [[fx(dd(cur), 0) + ' nm', 'resolution λ / (2NA√(1 + I/I_sat))'], [fx(dd(0) / dd(cur), 1) + '×', 'better than the diffraction limit']]);
      } else {
        var Ns = VL.logspace(100, 1e5, 200), s = 0.21 * lam / NA * 1000, a = 100, cur2 = sN.get(), loc = function (N) { return Math.sqrt((s * s + a * a / 12) / N); };
        plot.innerHTML = VL.plot({ id: 'sr', label: 'Localisation precision versus photons', w: 680, h: 300, x: { min: 100, max: 1e5, log: true, label: 'Photons detected per molecule' }, y: { min: 0, max: 30, label: 'Localisation precision (nm, 1σ)' }, series: [{ data: Ns.map(function (N) { return [N, loc(N)]; }), color: C.green }], marks: [{ x: cur2, y: loc(cur2), color: C.green }] });
        readout(read, [[fx(loc(cur2), 1) + ' nm', 'precision ≈ √((s² + a²/12)/N), no background'], [fx(s, 0) + ' nm', 'width s of the single-molecule image (0.21λ/NA)'], [fx(2.35 * loc(cur2), 0) + ' nm', 'resolution ≈ 2.35 × precision (dense enough labelling assumed)']]);
      }
    };
    var sm = VL.select(ctl, { label: 'Method', options: [['sted', 'STED'], ['smlm', 'PALM / STORM (single-molecule localisation)']], value: 'sted', on: draw });
    var sx = VL.slider(ctl, { label: 'Depletion intensity I / I_sat', min: -1, max: 3, step: 0.01, value: 1.7, log: true, fmt: function (v) { return v < 10 ? fx(v, 1) : fx(v, 0); }, on: draw });
    var sN = VL.slider(ctl, { label: 'Photons per molecule', min: 2, max: 5, step: 0.01, value: 3, log: true, fmt: function (v) { return Math.round(v).toLocaleString('en'); }, on: draw });
    draw();
  };

  /* ═══ 14. electron wavelengths ═══ */
  F.electron = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var lamE = function (kV) { var V = kV * 1e3, e = VL.e, m = VL.me, c = VL.c, h = VL.h; return h / Math.sqrt(2 * m * e * V * (1 + e * V / (2 * m * c * c))) * 1e12; };   // pm
    var draw = function () {
      var kV = sv.get(), vs = VL.logspace(0.1, 300, 200);
      plot.innerHTML = VL.plot({ id: 'el', label: 'Electron wavelength', w: 680, h: 300, x: { min: 0.1, max: 300, log: true, label: 'Accelerating voltage (kV)' }, y: { min: 1, max: 5000, log: true, label: 'Electron wavelength (pm)' },
        bands: [{ x0: 0.5, x1: 30, color: C.cyan, label: 'SEM', op: 0.08 }, { x0: 60, x1: 300, color: C.au, label: 'TEM', op: 0.08 }], series: [{ data: vs.map(function (v) { return [v, lamE(v)]; }), color: C.violet }], marks: [{ x: kV, y: lamE(kV), color: C.violet }] });
      readout(read, [[fx(lamE(kV), 2) + ' pm', 'de Broglie wavelength (relativistic)'], [Math.round(550000 / lamE(kV)).toLocaleString('en') + '×', 'shorter than green light (550 nm)'], ['≈ 50–100 pm', 'best TEM resolution with aberration correction — set by the lenses, not λ']]);
    };
    var sv = VL.slider(ctl, { label: 'Accelerating voltage', min: 0.5, max: 300, step: 0.5, value: 200, fmt: function (v) { return fx(v, 1) + ' kV'; }, on: draw });
    draw();
  };

  /* ═══ 15. test yourself ═══ */
  var QUIZ = [
    ['A 40× objective is designed for a 200 mm tube lens. Its focal length is…', ['2 mm', '5 mm', '8 mm', '40 mm'], 1, 'M = f_tube / f_objective, so f = 200/40 = 5 mm.'],
    ['Why can a dry objective not have an NA above 1?', ['Glass absorbs', 'NA = n sin α and n = 1 in air', 'Lenses cannot be curved enough', 'Because of chromatic aberration'], 1, 'sin α ≤ 1. Rays steeper than the critical angle are totally reflected at the coverslip–air surface; oil (n = 1.518) lets them through.'],
    ['Rayleigh resolution at 520 nm with NA 1.4 is about…', ['110 nm', '230 nm', '370 nm', '520 nm'], 1, '0.61 × 520 / 1.4 ≈ 227 nm.'],
    ['In Abbe\'s picture, a grating is resolved when…', ['the zero order alone enters the objective', 'at least two diffraction orders enter the objective', 'the condenser is closed', 'the lamp is bright enough'], 1, 'Interference of at least two orders rebuilds the periodic structure in the image.'],
    ['In Köhler illumination, which diaphragm sets the illuminated area of the specimen?', ['The aperture diaphragm', 'The field diaphragm', 'The pinhole', 'The eyepiece diaphragm'], 1, 'The field diaphragm is imaged onto the specimen; the aperture diaphragm sets the angle of the illumination cone.'],
    ['Why is an unstained cell nearly invisible in brightfield?', ['It is too small', 'It changes the phase of the light, not its amplitude', 'It is fluorescent', 'Cells are opaque'], 1, 'The eye and camera see intensity; a pure phase change leaves the intensity unchanged.'],
    ['Phase contrast works by…', ['staining the cell', 'shifting the phase of the undiffracted light by a quarter wave so it interferes with the diffracted light', 'blocking the diffracted light', 'polarising the light'], 1, 'Zernike\'s phase ring shifts (and dims) the direct light in the back focal plane, turning phase into intensity.'],
    ['Between crossed polarisers, a birefringent crystal appears dark when…', ['its axis is at 45°', 'its axis is parallel to a polariser', 'it is thick', 'the light is white'], 1, 'Brightness goes as sin²2θ: zero at 0° and 90°, maximum at 45°.'],
    ['What does the confocal pinhole do?', ['Increases the brightness', 'Rejects light from planes away from the focus', 'Filters the wavelength', 'Magnifies the image'], 1, 'Out-of-focus light is defocused at the pinhole and mostly blocked: optical sectioning.'],
    ['Why does two-photon excitation give optical sectioning without a pinhole?', ['The laser is infrared', 'Excitation goes as the intensity squared, so it is confined to the focus', 'The objective is better', 'It uses a camera'], 1, 'The plane-summed excitation falls as 1/(1 + z²/z_R²); one-photon excitation does not fall at all.'],
    ['TIRF illuminates only…', ['the whole cell', 'about 100–200 nm next to the coverslip', 'the nucleus', 'a thin sheet in the middle of the sample'], 1, 'The evanescent field decays within a fraction of a wavelength beyond the totally reflecting glass surface.'],
    ['Localisation microscopy beats the diffraction limit because…', ['it uses electrons', 'the centre of an isolated molecule\'s image can be found far more precisely than its width', 'it uses shorter wavelengths', 'it uses a bigger NA'], 1, 'Precision improves as 1/√N with the photons collected; molecules are switched on a few at a time so their images do not overlap.']
  ];
  F.micquiz = function (fig) {
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
