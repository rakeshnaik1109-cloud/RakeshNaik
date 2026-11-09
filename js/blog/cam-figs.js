/* How cameras and light detectors work — interactive figures (uses vl-core.js helpers).
   Silicon absorption coefficients after Green (2008); everything else from the formulas in the text.
   Random numbers are seeded, so each figure is reproducible. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;

  /* ── helpers ────────────────────────────────────────────── */
  var fx = function (v, d) { return (+v).toFixed(d == null ? 2 : d); };
  var big = function (v) { return v >= 1e5 ? VL.sci(v, 2) : Math.round(v).toLocaleString('en'); };
  var readout = function (el, rows) { el.innerHTML = rows.map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join(''); };
  var svgOpen = function (w, h, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="plot" role="img" aria-label="' + VL.esc(label) + '">'; };
  var txt = function (x, y, s, o) { o = o || {}; return '<text x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '" class="' + (o.cls || 'pl-tick') + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.fill ? ' fill="' + o.fill + '"' : '') + '>' + s + '</text>'; };
  var rng = function (seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return (s + 0.5) / 4294967296; }; };
  var gauss = function (r) { var u = r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  var poisson = function (r, lam) { if (lam <= 0) return 0; if (lam > 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss(r))); var L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
  var paintGray = function (g, off, N, M, vals, x, y, w, h, tint) {
    var ox = off.getContext('2d'), im = ox.createImageData(N, M);
    for (var k = 0; k < N * M; k++) { var v = Math.max(0, Math.min(1, vals[k])) * 255; im.data[4 * k] = v * (tint ? tint[0] : 1); im.data[4 * k + 1] = v * (tint ? tint[1] : 1); im.data[4 * k + 2] = v * (tint ? tint[2] : 1); im.data[4 * k + 3] = 255; }
    ox.putImageData(im, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(off, x, y, w, h);
  };
  var label = function (g, s, x, y, al) { g.fillStyle = '#efeaf6'; g.font = '13px IBM Plex Sans, sans-serif'; g.textAlign = al || 'center'; g.fillText(s, x, y); };

  /* ═══ 1. from photon to number ═══ */
  F.camchain = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var Np = sn.get(), QE = sq.get(), FW = 30000, gain = sg.get(), bits = +sb.get(), off = 100, rn = 1.6;
      var e = QE * Np, sat = e > FW, eC = Math.min(e, FW), adu = Math.min(Math.pow(2, bits) - 1, Math.round(eC / gain + off)), noise = Math.sqrt(eC + rn * rn);
      var W = 744, H = 210, s = svgOpen(W, H, 'From photons to digital numbers');
      var box = function (k, t1, t2, t3, col) { var x = 8 + k * 150; return '<rect x="' + x + '" y="40" width="128" height="104" rx="9" fill="rgba(255,255,255,.04)" stroke="' + col + '"/>' + txt(x + 64, 62, t1, { cls: 'pl-label', fill: col }) + txt(x + 64, 90, t2, { cls: 'pl-label' }) + txt(x + 64, 114, t3, {}); };
      var arrow = function (k, t) { var x = 8 + k * 150 + 129; return '<line x1="' + x + '" y1="92" x2="' + (x + 15) + '" y2="92" stroke="' + C.text3 + '" stroke-width="1.6"/><path d="M' + (x + 15) + ' 87 L' + (x + 21) + ' 92 L' + (x + 15) + ' 97 Z" fill="' + C.text3 + '"/>' + txt(x + 10, 170, t, {}); };
      s += box(0, 'photons', big(Np), 'on the pixel', C.au) + arrow(0, '× QE');
      s += box(1, 'electrons', big(e), '± ' + fx(Math.sqrt(e), 1) + ' shot noise', C.cyan) + arrow(1, 'into the well');
      s += box(2, 'stored charge', big(eC), sat ? 'saturated!' : 'well: ' + big(FW) + ' e⁻', sat ? C.red : C.green) + arrow(2, '+ read noise');
      s += box(3, 'voltage', fx(eC * 0.00005 * 1e3, 1) + ' mV', '± ' + fx(rn, 1) + ' e⁻ read', C.violet) + arrow(3, '÷ gain + offset');
      s += box(4, 'number', big(adu) + ' ADU', bits + '-bit, max ' + big(Math.pow(2, bits) - 1), C.au);
      s += txt(W / 2, 22, 'One pixel, one exposure: where the numbers come from', { cls: 'pl-label' });
      plot.innerHTML = s + '</svg>';
      readout(read, [[fx(eC / noise, 1), 'signal-to-noise ratio √(e⁻) limited'], [fx(gain, 2) + ' e⁻/ADU', 'conversion gain'], [fx(off, 0) + ' ADU', 'offset (bias), so noise never clips at zero'], [sat ? 'yes' : 'no', 'saturated']]);
    };
    var sn = VL.slider(ctl, { label: 'Photons per pixel', min: 0, max: 5, step: 0.01, value: 3, log: true, fmt: function (v) { return big(v); }, on: draw });
    var sq = VL.slider(ctl, { label: 'Quantum efficiency', min: 0.05, max: 0.98, step: 0.01, value: 0.8, fmt: function (v) { return Math.round(v * 100) + ' %'; }, on: draw });
    var sg = VL.slider(ctl, { label: 'Conversion gain', min: 0.1, max: 4, step: 0.01, value: 0.5, fmt: function (v) { return fx(v, 2) + ' e⁻/ADU'; }, on: draw });
    var sb = VL.select(ctl, { label: 'Bit depth', options: [['12', '12-bit'], ['16', '16-bit']], value: '16', on: draw });
    draw();
  };

  /* ═══ 2. silicon: absorption depth and quantum efficiency ═══ */
  // [nm, absorption coefficient (cm⁻¹)], intrinsic Si at 300 K, after Green (2008)
  var SI = [[300, 1.73e6], [350, 1.04e6], [400, 9.52e4], [450, 2.55e4], [500, 1.11e4], [550, 6.39e3], [600, 4.14e3], [650, 2.81e3], [700, 1.90e3], [750, 1.30e3], [800, 850], [850, 535], [900, 306], [950, 157], [1000, 64], [1050, 16.3], [1100, 3.5], [1150, 0.32]];
  var alphaSi = function (nm) { if (nm <= SI[0][0]) return SI[0][1]; if (nm >= SI[SI.length - 1][0]) return SI[SI.length - 1][1]; for (var i = 0; i < SI.length - 1; i++) if (nm <= SI[i + 1][0]) { var t = (nm - SI[i][0]) / (SI[i + 1][0] - SI[i][0]); return Math.exp(Math.log(SI[i][1]) * (1 - t) + Math.log(SI[i + 1][1]) * t); } };
  F.siabs = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var T = st.get(), xs = VL.linspace(300, 1150, 300);
      var qe = function (l, front) { var a = alphaSi(l) * 1e-4; /* per µm */ var dead = front ? 0.35 : 0.01, Ts = front ? 0.62 : 0.95; var v = Ts * (Math.exp(-a * dead) - Math.exp(-a * (dead + T))); if (front) v *= l < 450 ? Math.exp(-(450 - l) / 70) : 1; return 100 * Math.max(0, v); };
      plot.innerHTML = VL.plot({ id: 'si', label: 'Quantum efficiency of silicon sensors', w: 680, h: 320, x: { min: 300, max: 1150, label: 'Wavelength (nm)' }, y: { min: 0, max: 100, label: 'Quantum efficiency (%) — model' },
        series: [{ data: xs.map(function (l) { return [l, qe(l, false)]; }), color: C.au, label: 'back-illuminated, AR-coated' }, { data: xs.map(function (l) { return [l, qe(l, true)]; }), color: C.cyan, dash: '6 4', label: 'front-illuminated (gates on top)' }],
        vlines: [{ x: 1107, color: C.red, label: 'band gap 1.12 eV' }], legend: true, legendX: 360, legendY: 22 });
      var d = function (l) { return 1e4 / alphaSi(l); };
      readout(read, [[fx(d(450), 2) + ' µm', 'depth where 63 % of 450 nm light is absorbed'], [fx(d(650), 1) + ' µm', 'the same at 650 nm'], [fx(d(900), 0) + ' µm', 'at 900 nm'], [fx(d(1000), 0) + ' µm', 'at 1000 nm — deeper than most sensors are thick']]);
    };
    var st = VL.slider(ctl, { label: 'Thickness of the light-sensitive layer', min: 2, max: 60, step: 1, value: 12, fmt: function (v) { return v + ' µm' + (v >= 30 ? ' (deep depletion)' : ''); }, on: draw });
    draw();
  };

  /* ═══ 3. PMT gain ═══ */
  F.pmt = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var delta = function (Vs) { return 0.2 * Math.pow(Vs, 0.65); };   // secondary-emission ratio per dynode (model)
    var gainOf = function (V, n) { return Math.pow(delta(V / (n + 1)), n); };
    var draw = function () {
      var V = sv.get(), n = +sn.get(), Vs = VL.linspace(400, 1500, 200);
      plot.innerHTML = VL.plot({ id: 'pmt', label: 'PMT gain versus supply voltage', w: 680, h: 300, x: { min: 400, max: 1500, label: 'Supply voltage (V)' }, y: { min: 1e2, max: 1e9, log: true, label: 'Gain (electrons per photoelectron)' },
        series: [8, 10, 12].map(function (k, i) { return { data: Vs.map(function (v) { return [v, gainOf(v, k)]; }), color: [C.cyan, C.au, C.violet][i], dash: k === n ? null : '5 4', width: k === n ? 2.4 : 1.2, label: k + ' dynodes' }; }), marks: [{ x: V, y: gainOf(V, n), color: C.au }], legend: true, legendX: 14, legendY: 22 });
      var G = gainOf(V, n), d = delta(V / (n + 1));
      readout(read, [[fx(d, 2), 'electrons released per electron at each dynode, δ'], [VL.sci(G, 2), 'gain δⁿ'], [fx(0.65 * n, 1) + ' %', 'gain change per 1 % change of voltage (≈ 0.65 n %): the supply must be very stable'], [fx(G * 1.602e-19 * 1e6 * 1e9, 2) + ' nA', 'anode current for 10⁶ photoelectrons/s']]);
    };
    var sv = VL.slider(ctl, { label: 'Supply voltage', min: 400, max: 1500, step: 10, value: 1000, fmt: function (v) { return v + ' V'; }, on: draw });
    var sn = VL.select(ctl, { label: 'Dynodes', options: [['8', '8'], ['10', '10'], ['12', '12']], value: '10', on: draw });
    draw();
  };

  /* ═══ 4. CCD versus CMOS readout (animated) ═══ */
  F.readout = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 330);
    var N = 8, img = []; for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) img.push(0.25 + 0.75 * Math.exp(-(Math.pow(i - 3.2, 2) + Math.pow(j - 4.1, 2)) / 6));
    var t = 0, lp;
    var cell = 26, oxC = 40, oyC = 40, oxM = 380, oyM = 40;
    var draw = function (dt) {
      t += dt * sp.get();
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 330);
      label(g, 'CCD: charge shifted to one output', oxC + N * cell / 2, 22); label(g, 'CMOS: every pixel has its own amplifier', oxM + N * cell / 2 + 20, 22);
      // CCD: one row moves into the serial register per N pixel times, pixels leave one at a time
      var Tccd = N * (N + 1), step = Math.floor(t) % (Tccd + 6), rowsOut = Math.floor(step / (N + 1)), inRow = step % (N + 1);
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var srcRow = r - (N - rowsOut);   // after rowsOut shifts, the image has moved down by rowsOut
        var rr = r - rowsOut, v = rr >= 0 ? img[rr * N + c] : 0;
        g.fillStyle = 'rgba(69,191,214,' + (0.15 + 0.85 * v) + ')'; g.fillRect(oxC + c * cell + 1, oyC + r * cell + 1, cell - 2, cell - 2);
      }
      // serial register holding the row that just arrived
      var serRow = rowsOut - 1;
      for (var c2 = 0; c2 < N; c2++) { var left = c2 + inRow; var v2 = serRow >= 0 && serRow < N && left < N ? img[serRow * N + left] : 0; g.fillStyle = 'rgba(224,168,46,' + (0.12 + 0.88 * v2) + ')'; g.fillRect(oxC + c2 * cell + 1, oyC + N * cell + 8, cell - 2, cell - 2); }
      g.strokeStyle = '#e0a82e'; g.strokeRect(oxC, oyC + N * cell + 7, N * cell, cell); label(g, 'serial register →  one amplifier, one ADC', oxC + N * cell / 2, oyC + N * cell + 52);
      g.fillStyle = '#7fd18b'; g.beginPath(); g.arc(oxC + N * cell + 18, oyC + N * cell + 20, 9, 0, 7); g.fill();
      // CMOS: rows read one after another, all columns in parallel
      var rowNow = Math.floor(t / (N + 1) * 1.0) % (N + 3);
      for (var r3 = 0; r3 < N; r3++) for (var c3 = 0; c3 < N; c3++) { var done = r3 < rowNow, now = r3 === rowNow, v3 = img[r3 * N + c3]; g.fillStyle = now ? 'rgba(224,168,46,' + (0.2 + 0.8 * v3) + ')' : 'rgba(69,191,214,' + ((done ? 0.05 : 0.15) + (done ? 0.2 : 0.85) * v3) + ')'; g.fillRect(oxM + c3 * cell + 1, oyM + r3 * cell + 1, cell - 2, cell - 2); g.fillStyle = '#a98bf0'; g.fillRect(oxM + c3 * cell + cell - 7, oyM + r3 * cell + 3, 4, 4); }
      for (var c4 = 0; c4 < N; c4++) { g.fillStyle = '#7fd18b'; g.fillRect(oxM + c4 * cell + 6, oyM + N * cell + 10, cell - 12, 14); }
      label(g, 'one ADC per column', oxM + N * cell / 2, oyM + N * cell + 52);
      g.fillStyle = '#b6acc8'; g.font = '11px IBM Plex Mono, monospace'; g.textAlign = 'left'; g.fillText('violet dots: in-pixel amplifiers', oxM, oyM + N * cell + 72);
    };
    var sp = VL.slider(ctl, { label: 'Speed', min: 1, max: 20, step: 1, value: 6, fmt: function (v) { return v + '×'; } });
    lp = VL.loop(fig, draw);
    VL.playButton(ctl, lp);
    var calc = function () { var px = 2048 * 2048; readout(read, [[fx(px / 20e6 * 1000, 0) + ' ms', 'to read 2048 × 2048 pixels through one CCD output at 20 MHz'], [fx(2048 * 10e-6 * 1000, 1) + ' ms', 'the same sensor read row by row with column ADCs (10 µs per row)'], ['global or rolling', 'CMOS shutters: all rows at once, or one row after another (Figure 5)']]); };
    calc();
  };

  /* ═══ 5. rolling versus global shutter ═══ */
  F.rolling = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 320);
    var N = 160, off = document.createElement('canvas'); off.width = N; off.height = N;
    var blade = function (x, y, ang) { var r = Math.hypot(x, y); if (r > 0.95 || r < 0.08) return r < 0.12 ? 1 : 0; var a = Math.atan2(y, x) - ang; a = ((a % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); return Math.abs(a - Math.PI / 4) < 0.14 * (1.2 - r * 0.6) ? 1 : 0; };
    var draw = function () {
      var rps = sr.get(), Tf = st.get() / 1000;   // frame readout time (s)
      var render = function (rolling) { var v = new Float64Array(N * N); for (var j = 0; j < N; j++) { var tj = rolling ? j / N * Tf : 0, ang = 2 * Math.PI * rps * tj; for (var i = 0; i < N; i++) v[j * N + i] = 0.1 + 0.85 * blade((i - N / 2) / (N / 2), (j - N / 2) / (N / 2), ang); } return v; };
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 320);
      paintGray(g, off, N, N, render(false), 30, 30, 280, 280); label(g, 'global shutter: the true shape', 170, 20);
      paintGray(g, off, N, N, render(true), 370, 30, 280, 280); label(g, 'rolling shutter: rows exposed top to bottom', 510, 20);
      readout(read, [[fx(360 * rps * Tf, 0) + '°', 'the propeller turns this far while the rows are read'], [fx(Tf * 1000 / N * 1000, 1) + ' µs', 'delay between neighbouring rows (160-row image)']]);
    };
    var sr = VL.slider(ctl, { label: 'Propeller speed', min: 0, max: 60, step: 0.5, value: 12, fmt: function (v) { return v + ' rev/s'; }, on: draw });
    var st = VL.slider(ctl, { label: 'Frame readout time', min: 1, max: 40, step: 0.5, value: 20, fmt: function (v) { return v + ' ms'; }, on: draw });
    draw();
  };

  /* ═══ 6. signal-to-noise of real cameras ═══ */
  var CAMS = {
    ideal: { name: 'ideal detector (QE 1, no noise)', QE: 1, rn: 0, D: 0, F2: 1, col: '#ffffff' },
    ccd: { name: 'deep-cooled CCD (−70 °C)', QE: 0.92, rn: 4, D: 0.0005, F2: 1, col: C.cyan },
    emccd: { name: 'EMCCD (gain 300)', QE: 0.92, rn: 50 / 300, D: 0.0005, F2: 2, col: C.violet },
    scmos: { name: 'back-illuminated sCMOS', QE: 0.92, rn: 1.0, D: 0.3, F2: 1, col: C.au },
    cmos: { name: 'consumer CMOS (colour pixel)', QE: 0.35, rn: 2.5, D: 5, F2: 1, col: C.red }
  };
  var snr = function (c, N, t) { var S = c.QE * N; return S / Math.sqrt(c.F2 * (S + c.D * t) + c.rn * c.rn); };
  F.snr = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var N = sn.get(), t = st.get(), xs = VL.logspace(0.1, 1e5, 220);
      plot.innerHTML = VL.plot({ id: 'snr', label: 'Signal-to-noise ratio versus photons per pixel', w: 680, h: 330, x: { min: 0.1, max: 1e5, log: true, label: 'Photons per pixel per exposure' }, y: { min: 0.01, max: 400, log: true, label: 'Signal-to-noise ratio' },
        series: Object.keys(CAMS).map(function (k) { var c = CAMS[k]; return { data: xs.map(function (x) { return [x, snr(c, x, t)]; }), color: c.col, width: k === 'ideal' ? 1 : 2, dash: k === 'ideal' ? '4 4' : null, label: c.name }; }), vlines: [{ x: N, color: C.text3 }], hlines: [{ y: 1, color: C.text3, dash: '2 3' }], legend: true, legendX: 14, legendY: 22 });
      readout(read, Object.keys(CAMS).filter(function (k) { return k !== 'ideal'; }).map(function (k) { return [fx(snr(CAMS[k], N, t), 1), CAMS[k].name + ' at ' + big(N) + ' photons']; }));
    };
    var sn = VL.slider(ctl, { label: 'Photons per pixel', min: -1, max: 5, step: 0.01, value: 1, log: true, fmt: function (v) { return v < 10 ? fx(v, 1) : big(v); }, on: draw });
    var st = VL.slider(ctl, { label: 'Exposure', min: 0.001, max: 60, step: 0.001, value: 0.1, fmt: function (v) { return v < 1 ? fx(v * 1000, 0) + ' ms' : fx(v, 1) + ' s'; }, on: draw });
    draw();
  };

  /* ═══ 7. an image built from photons ═══ */
  F.photons = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 330);
    var N = 120, off = document.createElement('canvas'); off.width = N; off.height = N;
    var truth = new Float64Array(N * N);
    (function () { for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var x = (i - 60) / 60, y = (j - 60) / 60, v = 0.04;
      v += 0.6 * Math.exp(-Math.pow(Math.hypot(x / 0.7, y / 0.5), 8)); v += 0.4 * Math.exp(-(Math.pow(x - 0.15, 2) + Math.pow(y, 2)) / 0.03);
      [[-0.4, 0.2], [-0.3, -0.25], [0.45, 0.22], [0.5, -0.2], [-0.1, 0.3]].forEach(function (c) { v += 0.5 * Math.exp(-(Math.pow(x - c[0], 2) + Math.pow(y - c[1], 2)) / 0.003); });
      truth[j * N + i] = Math.min(1, v); } })();
    var draw = function () {
      var peak = sp.get(), rn = sr.get(), r = rng(12345), img = new Float64Array(N * N), mx = 0;
      for (var k = 0; k < N * N; k++) { var e = poisson(r, truth[k] * peak * 0.8) + rn * gauss(r); img[k] = e; mx = Math.max(mx, truth[k] * peak * 0.8); }
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 330);
      paintGray(g, off, N, N, Array.prototype.map.call(truth, function (v) { return v; }), 30, 30, 280, 280, [0.55, 1, 0.6]); label(g, 'the scene', 170, 20);
      paintGray(g, off, N, N, Array.prototype.map.call(img, function (v) { return v / (mx || 1); }), 370, 30, 280, 280, [0.55, 1, 0.6]); label(g, 'one exposure: ' + big(peak) + ' photons at the brightest point', 510, 20);
      var S = 0.6 * peak * 0.8; readout(read, [[fx(S / Math.sqrt(S + rn * rn), 1), 'SNR in the cell body (QE 0.8)'], [fx(0.04 * peak * 0.8, 2) + ' e⁻', 'mean signal in the background'], [fx(rn, 1) + ' e⁻', 'read noise added to every pixel']]);
    };
    var sp = VL.slider(ctl, { label: 'Photons at the brightest point', min: -0.5, max: 3.5, step: 0.01, value: 1.3, log: true, fmt: function (v) { return v < 10 ? fx(v, 1) : big(v); }, on: draw });
    var sr = VL.slider(ctl, { label: 'Read noise', min: 0, max: 10, step: 0.1, value: 1, fmt: function (v) { return fx(v, 1) + ' e⁻'; }, on: draw });
    draw();
  };

  /* ═══ 8. the photon transfer curve ═══ */
  F.ptc = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var rn = sr.get(), FW = sf.get(), pr = sp.get() / 100, xs = VL.logspace(0.1, 3e5, 300);
      var tot = xs.map(function (S) { if (S > FW) return [S, NaN]; return [S, Math.sqrt(rn * rn + S + pr * pr * S * S)]; });
      plot.innerHTML = VL.plot({ id: 'ptc', label: 'Photon transfer curve', w: 680, h: 330, x: { min: 0.1, max: 3e5, log: true, label: 'Mean signal (electrons)' }, y: { min: 0.3, max: 1e4, log: true, label: 'Noise (electrons rms)' },
        series: [{ data: tot, color: C.au, width: 2.4, label: 'total noise' }, { data: xs.map(function (S) { return [S, rn]; }), color: C.cyan, dash: '4 4', label: 'read noise (slope 0)' }, { data: xs.map(function (S) { return [S, Math.sqrt(S)]; }), color: C.green, dash: '4 4', label: 'shot noise (slope ½)' }, { data: xs.map(function (S) { return [S, pr * S]; }), color: C.violet, dash: '4 4', label: 'pixel non-uniformity (slope 1)' }],
        vlines: [{ x: FW, color: C.red, label: 'full well' }], legend: true, legendX: 14, legendY: 22 });
      var DR = FW / rn;
      readout(read, [[big(DR) + ' : 1', 'dynamic range = full well ÷ read noise'], [fx(20 * Math.log10(DR), 1) + ' dB', 'the same in decibels'], [fx(Math.log2(DR), 1) + ' bits', 'needed to digitise it without losing the faintest step'], [pr > 0 ? big(1 / (pr * pr)) + ' e⁻' : '∞', 'signal above which pixel-to-pixel variation beats shot noise']]);
    };
    var sr = VL.slider(ctl, { label: 'Read noise', min: 0.5, max: 20, step: 0.1, value: 1.6, fmt: function (v) { return fx(v, 1) + ' e⁻'; }, on: draw });
    var sf = VL.slider(ctl, { label: 'Full well', min: 3000, max: 200000, step: 1000, value: 30000, fmt: function (v) { return big(v) + ' e⁻'; }, on: draw });
    var sp = VL.slider(ctl, { label: 'Pixel response non-uniformity', min: 0, max: 3, step: 0.05, value: 0.5, fmt: function (v) { return fx(v, 2) + ' %'; }, on: draw });
    draw();
  };

  /* ═══ 9. dark current and cooling ═══ */
  F.dark = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var Eg = function (T) { return 1.17 - 4.73e-4 * T * T / (T + 636); };   // silicon band gap (eV), Varshni form
    var kB = 8.617e-5;
    var draw = function () {
      var D25 = sd.get(), Tc = st.get(), texp = sx.get(), T0 = 298.15;
      var D = function (tc) { var T = tc + 273.15; return D25 * Math.pow(T / T0, 1.5) * Math.exp(-Eg(T) / (2 * kB * T) + Eg(T0) / (2 * kB * T0)); };
      var xs = VL.linspace(-100, 40, 200);
      plot.innerHTML = VL.plot({ id: 'dk', label: 'Dark current versus temperature', w: 680, h: 300, x: { min: -100, max: 40, label: 'Sensor temperature (°C)' }, y: { min: 1e-6, max: 1e4, log: true, label: 'Dark current (e⁻ per pixel per second)' },
        series: [{ data: xs.map(function (t) { return [t, D(t)]; }), color: C.au }], marks: [{ x: Tc, y: D(Tc), color: C.au }], hlines: [{ y: 1, color: C.text3, dash: '2 3', label: '1 e⁻/s' }] });
      var dark = D(Tc) * texp;
      readout(read, [[VL.sci(D(Tc), 2) + ' e⁻/px/s', 'dark current at ' + Tc + ' °C'], [fx(dark, 2) + ' e⁻', 'dark charge in a ' + texp + ' s exposure'], [fx(Math.sqrt(dark), 2) + ' e⁻', 'its shot noise, compared with a read noise of a few e⁻'], [fx(D(25) / D(18), 2) + '×', 'change for 7 °C near room temperature']]);
    };
    var sd = VL.slider(ctl, { label: 'Dark current at 25 °C', min: 0, max: 3, step: 0.05, value: 2, log: true, fmt: function (v) { return big(v) + ' e⁻/px/s'; }, on: draw });
    var st = VL.slider(ctl, { label: 'Temperature', min: -100, max: 40, step: 1, value: -60, fmt: function (v) { return v + ' °C'; }, on: draw });
    var sx = VL.slider(ctl, { label: 'Exposure', min: 1, max: 600, step: 1, value: 60, fmt: function (v) { return v + ' s'; }, on: draw });
    draw();
  };

  /* ═══ 10. aliasing ═══ */
  F.alias = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var p = sp.get(), a = sa.get(), f = 1 / p, fs = 1 / a, L = 40 * a;
      var xs = VL.linspace(0, L, 900), wave = xs.map(function (x) { return [x, 0.5 + 0.5 * Math.cos(2 * Math.PI * x / p)]; });
      var samples = [], st = [];
      for (var k = 0; k < 40; k++) { var x0 = k * a, v = 0.5 + 0.5 * (p / (Math.PI * a)) * Math.sin(Math.PI * a / p) * Math.cos(2 * Math.PI * (x0 + a / 2) / p); st.push([x0, v], [x0 + a, v]); samples.push([x0 + a / 2, v]); }
      var nOrd = Math.round(f / fs), fa = f - nOrd * fs, fal = Math.abs(fa), mod = (p / (Math.PI * a)) * Math.sin(Math.PI * a / p), sgn = nOrd % 2 ? -1 : 1;
      var alias = xs.map(function (x) { return [x, 0.5 + 0.5 * mod * sgn * Math.cos(2 * Math.PI * fa * x)]; });
      var under = f > fs / 2;
      plot.innerHTML = VL.plot({ id: 'al', label: 'Sampling a fine pattern with pixels', w: 680, h: 300, x: { min: 0, max: L, label: 'Position on the sensor (µm)' }, y: { min: -0.05, max: 1.15, label: 'Brightness' },
        series: [{ data: wave, color: C.text3, width: 1, label: 'pattern in the image' }, { data: st, color: C.au, width: 1.8, label: 'what each pixel records' }].concat(under ? [{ data: alias, color: C.red, dash: '6 4', label: 'the false pattern it implies' }] : []), legend: true, legendX: 14, legendY: 14 });
      var mtf = Math.abs(Math.sin(Math.PI * a / p) / (Math.PI * a / p));
      readout(read, [[fx(2 * a, 1) + ' µm', 'finest period the pixels can record (Nyquist: 2 pixels)'], [under ? fx(1 / fal, 1) + ' µm' : 'faithful', under ? 'apparent period of the aliased pattern' : 'the pattern is sampled correctly'], [fx(100 * mtf, 0) + ' %', 'contrast left after averaging over each pixel (pixel MTF)']]);
    };
    var sp = VL.slider(ctl, { label: 'Period of the pattern', min: 4, max: 40, step: 0.1, value: 14, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    var sa = VL.slider(ctl, { label: 'Pixel pitch', min: 2, max: 13, step: 0.1, value: 6.5, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 11. Bayer filter and demosaicing ═══ */
  F.bayer = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 330);
    var N = 96, off = document.createElement('canvas'); off.width = N; off.height = N;
    var scene = function (i, j) { var x = i / N, y = j / N;
      if (y < 0.45) { var h = x * 6, c = function (k) { var t = (h + k) % 6; return t < 1 ? t : t < 3 ? 1 : t < 4 ? 4 - t : 0; }; return [c(2), c(0), c(4)].map(function (v) { return 0.15 + 0.8 * v; }); }
      if (y < 0.7) { var st = Math.cos(Math.PI * i * (0.25 + 0.75 * x)) > 0 ? 0.92 : 0.08; return [st, st, st]; }
      var r = Math.hypot(i - N * 0.5, j - N * 0.85); return r < N * 0.12 ? [0.9, 0.2, 0.2] : (Math.floor(i / 6) + Math.floor(j / 6)) % 2 ? [0.9, 0.9, 0.9] : [0.1, 0.1, 0.1]; };
    var put = function (rgb, x0, title) { var ox = off.getContext('2d'), im = ox.createImageData(N, N); for (var k = 0; k < N * N; k++) { im.data[4 * k] = 255 * rgb[3 * k]; im.data[4 * k + 1] = 255 * rgb[3 * k + 1]; im.data[4 * k + 2] = 255 * rgb[3 * k + 2]; im.data[4 * k + 3] = 255; } ox.putImageData(im, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(off, x0, 34, 200, 200); label(g, title, x0 + 100, 24); };
    var draw = function () {
      var mode = sm.get(), S = new Float64Array(3 * N * N), raw = new Float64Array(N * N), mosaic = new Float64Array(3 * N * N), out = new Float64Array(3 * N * N);
      var chan = function (i, j) { return (j % 2 === 0) ? (i % 2 === 0 ? 0 : 1) : (i % 2 === 0 ? 1 : 2); };   // RGGB
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var s = scene(i, j), k = j * N + i; S[3 * k] = s[0]; S[3 * k + 1] = s[1]; S[3 * k + 2] = s[2]; var c = chan(i, j); raw[k] = s[c]; mosaic[3 * k + c] = s[c]; }
      for (var j2 = 0; j2 < N; j2++) for (var i2 = 0; i2 < N; i2++) { var k2 = j2 * N + i2;
        for (var c2 = 0; c2 < 3; c2++) { if (mode === 'mono') { out[3 * k2 + c2] = 0.3 * S[3 * k2] + 0.59 * S[3 * k2 + 1] + 0.11 * S[3 * k2 + 2]; continue; } var sum = 0, n = 0; for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var ii = i2 + di, jj = j2 + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; if (chan(ii, jj) === c2) { var w = (di === 0 && dj === 0) ? 4 : (di === 0 || dj === 0) ? 2 : 1; sum += w * raw[jj * N + ii]; n += w; } } out[3 * k2 + c2] = n ? sum / n : 0; } }
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 330);
      put(S, 15, 'the scene'); put(mosaic, 240, 'what the Bayer sensor records'); put(out, 465, mode === 'mono' ? 'monochrome sensor (no filter)' : 'after bilinear demosaicing');
      g.fillStyle = '#b6acc8'; g.font = '11px IBM Plex Mono, monospace'; g.textAlign = 'center'; g.fillText('each pixel sees only red, green or blue (RGGB); the other two are interpolated', 340, 270); g.fillText('look for false colour on the fine stripes and the checkerboard edges', 340, 290);
      readout(read, [['1 / 3', 'of the light a colour pixel passes (its filter blocks two colours)'], ['50 % · 25 % · 25 %', 'of the pixels are green · red · blue']]);
    };
    var sm = VL.select(ctl, { label: 'Sensor', options: [['bayer', 'Colour (Bayer) sensor'], ['mono', 'Monochrome sensor']], value: 'bayer', on: draw });
    draw();
  };

  /* ═══ 12. f-number: depth of field and diffraction ═══ */
  F.lens = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var f = sf.get(), N = sn.get(), u = su.get() * 1000, pix = sp.get(), c = 2 * pix / 1000, lam = 0.55e-3;   // mm
      var H = f * f / (N * c) + f, near = u * (H - f) / (H + u - 2 * f), far = u < H ? u * (H - f) / (H - u) : Infinity;
      var Ns = VL.linspace(1, 32, 300), airy = Ns.map(function (n) { return [n, 2.44 * 0.55 * n]; });
      plot.innerHTML = VL.plot({ id: 'lens', label: 'Diffraction blur versus f-number', w: 680, h: 300, x: { min: 1, max: 32, label: 'f-number N = f / D' }, y: { min: 0, max: 45, label: 'Airy disc diameter at 550 nm (µm)' },
        series: [{ data: airy, color: C.au, label: 'Airy disc 2.44 λ N' }], hlines: [{ y: 2 * pix, color: C.cyan, label: '2 pixels', dash: '4 4' }], marks: [{ x: N, y: 2.44 * 0.55 * N, color: C.au }] });
      var Ncrit = 2 * pix / (2.44 * 0.55);
      readout(read, [[isFinite(far) ? fx((far - near) / 1000, 2) + ' m' : fx(near / 1000, 2) + ' m → ∞', 'depth of field (circle of confusion = 2 pixels)'], [fx(1 / (N * N) * 100 / (1 / 4) , 0) + ' %', 'light, relative to f/2 (∝ 1/N²)'], [fx(2.44 * 0.55 * N, 1) + ' µm', 'Airy disc diameter'], ['f/' + fx(Ncrit, 1), 'beyond this, diffraction blurs more than 2 pixels']]);
    };
    var sf = VL.slider(ctl, { label: 'Focal length', min: 8, max: 200, step: 1, value: 50, fmt: function (v) { return v + ' mm'; }, on: draw });
    var sn = VL.slider(ctl, { label: 'f-number', min: 1, max: 32, step: 0.1, value: 4, fmt: function (v) { return 'f/' + fx(v, 1); }, on: draw });
    var su = VL.slider(ctl, { label: 'Subject distance', min: 0.2, max: 20, step: 0.1, value: 2, fmt: function (v) { return fx(v, 1) + ' m'; }, on: draw });
    var sp = VL.slider(ctl, { label: 'Pixel pitch', min: 1, max: 10, step: 0.1, value: 4, fmt: function (v) { return fx(v, 1) + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 13. dark frame and flat field ═══ */
  F.flat = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), g = VL.canvas(fig, 680, 330);
    var N = 120, off = document.createElement('canvas'), r = rng(99); off.width = N; off.height = N;
    var scene = new Float64Array(N * N), flat = new Float64Array(N * N), dark = new Float64Array(N * N), prnu = new Float64Array(N * N);
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var k = j * N + i, x = (i - 60) / 60, y = (j - 60) / 60;
      scene[k] = 0.35 + 0.35 * Math.exp(-(Math.pow(x + 0.2, 2) + Math.pow(y - 0.1, 2)) / 0.08) + 0.25 * (Math.cos(9 * x) > 0.6 ? 1 : 0) * (y > 0.3 ? 1 : 0);
      var vig = Math.pow(Math.cos(Math.atan(Math.hypot(x, y) * 0.8)), 4), dust = 1 - 0.35 * Math.exp(-(Math.pow(x - 0.35, 2) + Math.pow(y + 0.3, 2)) / 0.006) - 0.25 * Math.exp(-(Math.pow(x + 0.5, 2) + Math.pow(y + 0.55, 2)) / 0.003);
      prnu[k] = 1 + 0.03 * gauss(r); flat[k] = vig * dust * prnu[k]; dark[k] = 0.04 + (r() < 0.004 ? 0.5 * r() + 0.3 : 0) + 0.004 * gauss(r); }
    var draw = function () {
      var mode = sm.get(), out = new Float64Array(N * N), noise = rng(7);
      var raw = new Float64Array(N * N); for (var k = 0; k < N * N; k++) raw[k] = scene[k] * flat[k] + dark[k] + 0.006 * gauss(noise);
      var mf = 0; for (var k1 = 0; k1 < N * N; k1++) mf += flat[k1]; mf /= N * N;
      for (var k2 = 0; k2 < N * N; k2++) out[k2] = mode === 'raw' ? raw[k2] : mode === 'dark' ? raw[k2] - dark[k2] : (raw[k2] - dark[k2]) / flat[k2] * mf;
      g.fillStyle = '#171026'; g.fillRect(0, 0, 680, 330);
      paintGray(g, off, N, N, Array.prototype.map.call(flat, function (v) { return v; }), 30, 30, 200, 200); label(g, 'flat field (uniform light)', 130, 20);
      paintGray(g, off, N, N, Array.prototype.map.call(dark, function (v) { return v * 1.6; }), 250, 30, 200, 200); label(g, 'dark frame (no light)', 350, 20);
      paintGray(g, off, N, N, Array.prototype.map.call(out, function (v) { return v; }), 470, 30, 200, 200); label(g, { raw: 'raw image', dark: 'dark subtracted', full: '(raw − dark) ÷ flat' }[mode], 570, 20);
      g.fillStyle = '#b6acc8'; g.font = '11px IBM Plex Mono, monospace'; g.textAlign = 'center'; g.fillText('vignetting, dust shadows and pixel-to-pixel gain are in the flat; offset and hot pixels in the dark', 340, 262);
      readout(read, [[mode === 'full' ? 'flat' : 'uneven', 'illumination across the corrected image'], ['1 + 2', 'calibration frames: dark (same exposure and temperature), flat (uniform light)']]);
    };
    var sm = VL.select(ctl, { label: 'Show', options: [['raw', 'Raw image'], ['dark', 'Dark subtracted'], ['full', 'Dark subtracted and flat-fielded']], value: 'raw', on: draw });
    draw();
  };

  /* ═══ 14. test yourself ═══ */
  var QUIZ = [
    ['A camera records 10 000 photo-electrons in a pixel. Its shot-noise-limited SNR is…', ['10', '100', '1000', '10 000'], 1, 'Photon arrivals are Poisson distributed: noise √10 000 = 100, so SNR = 100.'],
    ['Why does a silicon sensor stop responding beyond about 1.1 µm?', ['The lens absorbs', 'The photon energy falls below silicon\'s 1.12 eV band gap', 'The pixels are too small', 'Read noise rises'], 1, 'A photon must lift an electron across the band gap; 1240 nm·eV / 1.12 eV ≈ 1.1 µm.'],
    ['Back-illuminated sensors have higher QE mainly because…', ['they are cooled', 'light no longer passes through the wiring and gates on the front', 'they have bigger pixels', 'they use EM gain'], 1, 'Flipping the sensor puts the thin, AR-coated silicon towards the light, so blue light is no longer absorbed above the pixels.'],
    ['What distinguishes a CCD from a CMOS image sensor?', ['CCDs see colour', 'A CCD moves the charge to one output amplifier; CMOS converts it in every pixel', 'CMOS needs cooling', 'CCDs have no read noise'], 1, 'Charge transfer through the array versus an amplifier in each pixel and column-parallel converters.'],
    ['A spinning propeller looks bent in a phone video because of…', ['lens distortion', 'the rolling shutter', 'aliasing in colour', 'motion blur'], 1, 'Rows are exposed one after another, so each row sees the propeller at a later moment.'],
    ['An EMCCD multiplies the charge before readout. What does it cost?', ['Resolution', 'An excess noise factor of about √2 on the signal', 'Colour', 'Speed'], 1, 'The stochastic gain doubles the variance; EMCCDs win only when read noise would otherwise dominate.'],
    ['On a photon transfer curve, noise proportional to √signal means…', ['read-noise limited', 'shot-noise limited', 'saturated', 'pixel non-uniformity'], 1, 'Slope ½ on the log–log plot: Poisson statistics of the light itself.'],
    ['A sensor has a 30 000 e⁻ full well and 1.5 e⁻ read noise. Its dynamic range is about…', ['66 dB', '86 dB', '20 dB', '120 dB'], 1, '30 000/1.5 = 20 000; 20 log₁₀(20 000) ≈ 86 dB, needing about 14.3 bits.'],
    ['Why are scientific CCDs for long exposures cooled to −70 °C or below?', ['To shrink the pixels', 'Dark current falls roughly by half for every 6–9 °C of cooling', 'To increase QE', 'To reduce read noise only'], 1, 'Thermally generated electrons fall steeply with temperature; at −70 °C dark current becomes negligible for minutes.'],
    ['A pattern finer than two pixels per period produces…', ['nothing at all', 'a false, coarser pattern (aliasing)', 'more colour', 'more resolution'], 1, 'Sampling cannot distinguish frequencies above Nyquist from lower ones: moiré.'],
    ['Why is a monochrome camera preferred for fluorescence microscopy?', ['It is cheaper', 'Every pixel collects all the light; a Bayer filter discards about two thirds', 'It has smaller pixels', 'It is faster to focus'], 1, 'Colour comes from separate filter-cube images; the mosaic would waste photons and resolution.'],
    ['Flat-field correction divides the image by…', ['a dark frame', 'an image of uniform light (after dark subtraction)', 'the read noise', 'the full well'], 1, '(raw − dark) / (flat − dark) removes vignetting, dust shadows and pixel-to-pixel gain differences.']
  ];
  F.camquiz = function (fig) {
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
