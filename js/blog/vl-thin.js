/* Vacuum & deposition article — evaporation physics, glow discharge,
   Pirani gauges, LT boat supply, the DTM (quartz crystal monitor) and
   electron-beam lithography figures. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;

  /* temperature (°C) at which the vapour pressure is 10⁻⁸, 10⁻⁶, 10⁻⁴ Torr, molar mass, density, melting point */
  var MAT = {
    Al: { T: [677, 821, 1010], M: 26.98, rho: 2.70, mp: 660, Z: 1.08, col: '#c9d3df' },
    Ag: { T: [574, 685, 832], M: 107.87, rho: 10.5, mp: 962, Z: 0.529, col: '#e8e8f0' },
    Au: { T: [807, 947, 1132], M: 196.97, rho: 19.32, mp: 1064, Z: 0.381, col: '#e0a82e' },
    Cu: { T: [727, 857, 1017], M: 63.55, rho: 8.93, mp: 1085, Z: 0.437, col: '#e2875c' },
    Cr: { T: [837, 977, 1157], M: 52.00, rho: 7.20, mp: 1907, Z: 0.305, col: '#9fb4c8' },
    Ni: { T: [927, 1072, 1262], M: 58.69, rho: 8.91, mp: 1455, Z: 0.331, col: '#b3c08f' },
    Ti: { T: [1067, 1235, 1453], M: 47.87, rho: 4.50, mp: 1668, Z: 0.628, col: '#a98bf0' },
    Pt: { T: [1292, 1492, 1747], M: 195.08, rho: 21.45, mp: 1768, Z: 0.245, col: '#d8d0c0' },
    Mo: { T: [1592, 1822, 2117], M: 95.95, rho: 10.2, mp: 2623, Z: 0.257, col: '#7d9fc4' },
    W: { T: [2117, 2407, 2757], M: 183.84, rho: 19.3, mp: 3422, Z: 0.163, col: '#45bfd6' }
  };
  Object.keys(MAT).forEach(function (k) { var m = MAT[k], T1 = m.T[0] + 273.15, T2 = m.T[2] + 273.15; m.B = 4 / (1 / T1 - 1 / T2); m.A = -4 + m.B / T2; });
  var pvap = function (m, Tk) { return Math.pow(10, m.A - m.B / Tk) * 1.33322; }; // mbar
  var Tfor = function (m, pmbar) { return m.B / (m.A - Math.log10(pmbar / 1.33322)); };
  VL.MAT = MAT;

  /* ═══ vapour pressure curves + evaporation-rate calculator ═══ */
  F.vapor = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var sel = VL.select(ctl, { label: 'Material', value: 'Au', options: Object.keys(MAT).map(function (k) { return [k, k]; }), on: function () { draw(); } });
    var ts = VL.slider(ctl, { label: 'Source temperature', min: 500, max: 3000, step: 5, value: 1400, fmt: function (v) { return v.toFixed(0) + ' °C'; }, on: function () { draw(); } });
    var hs = VL.slider(ctl, { label: 'Source–substrate distance', min: 10, max: 60, step: 1, value: 30, fmt: function (v) { return v + ' cm'; }, on: function () { draw(); } });
    function draw() {
      var k = sel.get(), m = MAT[k], Tc = ts.get(), Tk = Tc + 273.15, pv = pvap(m, Tk);
      var series = Object.keys(MAT).map(function (q) { var mm = MAT[q]; return { data: VL.linspace(300, 3300, 160).map(function (t) { return [t, pvap(mm, t + 273.15)]; }), color: mm.col, width: q === k ? 3.2 : 1.2, label: q }; });
      var marks = Object.keys(MAT).map(function (q) { var mm = MAT[q]; return { x: mm.mp, y: pvap(mm, mm.mp + 273.15), color: mm.col, r: 3.2 }; });
      marks.push({ x: Tc, y: pv, color: '#fff', r: 6, label: k + ' at ' + Tc + ' °C', dx: 10 });
      plot.innerHTML = VL.plot({ id: 'vap', label: 'Vapour pressure of metals', w: 700, h: 360, x: { min: 300, max: 3300, label: 'Temperature (°C)   ·   dots = melting point' }, y: { min: 1e-10, max: 10, log: true, label: 'Vapour pressure (mbar)' },
        series: series, marks: marks, hlines: [{ y: 1e-2, color: C.au, label: '≈10⁻² mbar: a useful evaporation rate' }], legend: true, legendX: 560, legendY: 160 });
      // Hertz–Knudsen–Langmuir flux, 1 cm² source, film rate at normal incidence above the source
      var M = m.M * 1e-3, R = 8.314, Gm = pv * 100 * Math.sqrt(M / (2 * Math.PI * R * Tk)); // kg m⁻² s⁻¹
      var As = 1e-4, h = hs.get() / 100, rate = Gm * As / (Math.PI * h * h) / (m.rho * 1000); // m/s
      read.innerHTML = '<div><b>' + VL.sci(pv, 2) + ' mbar</b><span>vapour pressure p<sub>v</sub>(T)</span></div><div><b>' + VL.sci(Gm * 0.1, 2) + ' g cm⁻² s⁻¹</b><span>evaporation flux from the melt surface</span></div><div><b>' + (rate * 1e10 < 0.01 ? VL.sci(rate * 1e10, 2) : (rate * 1e10).toPrecision(3)) + ' Å/s</b><span>film growth above a 1 cm² source</span></div><div><b>' + Tfor(m, 1e-2).toFixed(0) + ' K</b><span>temperature for p<sub>v</sub> = 10⁻² mbar (' + (Tfor(m, 1e-2) - 273).toFixed(0) + ' °C)</span></div><div><b>' + (Tc > m.mp ? 'liquid' : 'solid — sublimes') + '</b><span>melting point ' + m.mp + ' °C</span></div>';
    }
    draw();
  };

  /* ═══ Paschen curve: why glow discharge needs rough vacuum ═══ */
  F.paschen = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var A = 15, B = 365, gam = 0.01, K = Math.log(Math.log(1 + 1 / gam));
    var Vb = function (pmbar, d) { var pd = pmbar / 1.33322 * d, den = Math.log(A * pd) - K; return den > 0 ? B * pd / den : NaN; };
    var ds = VL.slider(ctl, { label: 'Electrode gap d', min: 1, max: 30, step: 0.5, value: 10, fmt: function (v) { return v + ' cm'; }, on: function () { draw(); } });
    var ps = VL.slider(ctl, { label: 'Chamber pressure', min: -4, max: 3, step: 0.02, value: -1.3, log: true, fmt: function (v) { return VL.sci(v, 2) + ' mbar'; }, on: function () { draw(); } });
    var HT = 3000;
    function draw() {
      var d = ds.get(), p = ps.get(), v = Vb(p, d), pp = VL.logspace(1e-4, 1e3, 300);
      plot.innerHTML = VL.plot({ id: 'pas', label: 'Paschen curve for air', w: 700, h: 330, x: { min: 1e-4, max: 1e3, log: true, label: 'Pressure (mbar)' }, y: { min: 100, max: 1e5, log: true, label: 'Breakdown voltage (V)' },
        series: [{ data: pp.map(function (q) { return [q, Vb(q, d)]; }), color: C.cyan, width: 2.6 }], hlines: [{ y: HT, color: C.au, label: 'HT supply ≈ 3 kV' }],
        bands: [{ x0: 1e-2, x1: 0.5, color: C.au, op: .08, label: 'glow cleaning' }], marks: isFinite(v) ? [{ x: p, y: v, color: '#fff', label: Math.round(v) + ' V', dx: 10 }] : [] });
      var pdT = p / 1.33322 * d, pmin = Math.exp(1 + K) / A, vmin = B * pmin;
      read.innerHTML = '<div><b>' + (isFinite(v) ? Math.round(v) + ' V' : 'no breakdown') + '</b><span>voltage needed to strike a discharge</span></div><div><b>' + pdT.toPrecision(3) + ' Torr·cm</b><span>p·d (the curve depends only on this product)</span></div><div><b>' + Math.round(vmin) + ' V at ' + pmin.toFixed(2) + ' Torr·cm</b><span>Paschen minimum for air (model)</span></div><div><b>' + (isFinite(v) && v < HT ? 'glows' : 'dark') + '</b><span>with a 3 kV HT supply</span></div>';
    }
    draw();
  };

  /* ═══ Pirani gauge: response and gas dependence ═══════════ */
  F.pirani = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var GAS = { N2: { k: 1, ps: 15, col: C.au, n: 'N₂ / air (calibration)' }, Ar: { k: 0.62, ps: 10, col: C.red, n: 'Argon' }, He: { k: 1.2, ps: 70, col: C.cyan, n: 'Helium' }, H2O: { k: 1.4, ps: 8, col: C.green, n: 'Water vapour' } };
    var P0 = 1e-4; // radiation + end losses (W) at zero pressure
    var loss = function (g, p) { return P0 + 3e-3 * g.k * p / (1 + p / g.ps) * (1 + 0.02 * Math.log10(1 + p)); };
    var invN2 = function (P) { var lo = 1e-6, hi = 2e3; for (var i = 0; i < 80; i++) { var mid = Math.sqrt(lo * hi); if (loss(GAS.N2, mid) < P) lo = mid; else hi = mid; } return Math.sqrt(lo * hi); };
    var gs = VL.select(ctl, { label: 'Gas in the chamber', value: 'Ar', options: Object.keys(GAS).map(function (k) { return [k, GAS[k].n]; }), on: function () { draw(); } });
    var ps = VL.slider(ctl, { label: 'True pressure', min: -4, max: 3, step: 0.02, value: -1, log: true, fmt: function (v) { return VL.sci(v, 2) + ' mbar'; }, on: function () { draw(); } });
    function draw() {
      var g = GAS[gs.get()], p = ps.get(), pp = VL.logspace(1e-4, 1e3, 200), ind = invN2(loss(g, p));
      plot.innerHTML = VL.plot({ id: 'pir', label: 'Pirani heat loss versus pressure', w: 700, h: 320, x: { min: 1e-4, max: 1e3, log: true, label: 'True pressure (mbar)' }, y: { min: 5e-5, max: 0.2, log: true, label: 'Power to keep the wire hot (W)' },
        series: Object.keys(GAS).map(function (k) { return { data: pp.map(function (q) { return [q, loss(GAS[k], q)]; }), color: GAS[k].col, width: k === gs.get() ? 3 : 1.4, label: GAS[k].n }; }),
        bands: [{ x0: 1e-4, x1: 1e-3, color: C.text3, op: .12, label: 'radiation floor' }, { x0: 30, x1: 1e3, color: C.text3, op: .12, label: 'saturated' }],
        marks: [{ x: p, y: loss(g, p), color: '#fff' }], legend: true, legendX: 14, legendY: 34 });
      read.innerHTML = '<div><b>' + VL.sci(p, 2) + ' mbar</b><span>true pressure</span></div><div><b>' + VL.sci(ind, 2) + ' mbar</b><span>what a gauge calibrated for N₂ shows</span></div><div><b>×' + (p / ind).toFixed(2) + '</b><span>correction factor (true ÷ indicated)</span></div>';
    }
    draw();
  };

  /* ═══ LT supply: the boat as a resistor ═══════════════════ */
  F.boat = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var is = VL.slider(ctl, { label: 'Boat current (LT)', min: 0, max: 300, step: 1, value: 150, fmt: function (v) { return v + ' A'; }, on: function () { draw(); } });
    var rs = VL.slider(ctl, { label: 'Boat resistance (hot)', min: 2, max: 60, step: 0.5, value: 15, fmt: function (v) { return v + ' mΩ'; }, on: function () { draw(); } });
    function draw() {
      var I = is.get(), R = rs.get() * 1e-3, V = I * R, P = I * I * R, ratio = 230 / Math.max(V, 1e-6), Ip = I / ratio, A = 2e-4, eps = 0.3, T = Math.pow(P / (eps * 5.670e-8 * A) + Math.pow(300, 4), 0.25);
      read.innerHTML = '<div><b>' + V.toFixed(2) + ' V</b><span>across the boat, V = IR</span></div><div><b>' + P.toFixed(0) + ' W</b><span>heat, P = I²R</span></div><div><b>' + (I ? Ip.toFixed(1) + ' A' : '—') + '</b><span>drawn from the 230 V mains (ideal transformer, ' + (I ? Math.round(ratio) + ' : 1' : '—') + ')</span></div><div><b>' + (I ? Math.round(T - 273) + ' °C' : '—') + '</b><span>radiation-only upper bound for a 2 cm² boat (ε = 0.3); the clamps conduct much of the heat away</span></div>';
    }
    draw();
  };

  /* ═══ DTM: quartz crystal monitor ═════════════════════════ */
  F.qcm = function (fig) {
    var top = VL.part(fig, 'qcm-top'), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var Nq = 1.668e5, rhoq = 2.648; // Hz·cm, g/cm³
    var st = { fq: 6e6, tx: 0, ts: 0, zero: 0, zeroS: 0, shutter: false, src: false, hist: [], t: 0, lastDisp: 0, rate: 0 };
    var mat = VL.select(ctl, { label: 'Material', value: 'Au', options: Object.keys(MAT).filter(function (k) { return MAT[k].Z; }).map(function (k) { return [k, k + ' (ρ ' + MAT[k].rho + ', Z ' + MAT[k].Z + ')']; }) });
    var rate = VL.slider(ctl, { label: 'Rate at substrate', min: 0.1, max: 20, step: 0.1, value: 2, fmt: function (v) { return v.toFixed(1) + ' Å/s'; } });
    var trueTF = VL.slider(ctl, { label: 'True tooling (geometry)', min: 60, max: 160, step: 1, value: 118, fmt: function (v) { return v + ' %'; } });
    var tf = VL.slider(ctl, { label: 'Tooling entered in DTM', min: 60, max: 160, step: 1, value: 100, fmt: function (v) { return v + ' %'; } });
    var bSrc = VL.button(ctl, 'Source ON', function () { st.src = !st.src; bSrc.textContent = st.src ? 'Source OFF' : 'Source ON'; }, 'primary');
    var bSh = VL.button(ctl, 'Open substrate shutter', function () { st.shutter = !st.shutter; bSh.textContent = st.shutter ? 'Close shutter' : 'Open substrate shutter'; });
    VL.button(ctl, 'Zero thickness', function () { st.zero = st.tx; st.zeroS = st.ts; });
    VL.button(ctl, 'New crystal', function () { st.tx = st.ts = st.zero = st.zeroS = 0; st.hist = []; });
    // frequency of a crystal carrying a film of areal mass m (g/cm²): Lu–Lewis (Z-match), solved by bisection
    function fOf(tFilmCm, m) {
      var rf = m.rho, Z = m.Z, fq = st.fq, lo = fq * 0.3, hi = fq;
      var T = function (fc) { return (Nq * rhoq) / (Math.PI * rf * fc * Z) * Math.atan(Z * Math.tan(Math.PI * (fq - fc) / fq)); };
      for (var i = 0; i < 70; i++) { var mid = (lo + hi) / 2; if (T(mid) > tFilmCm) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    }
    function sauer(fc, m) { return Nq * rhoq / m.rho * (1 / fc - 1 / st.fq); } // period form (cm)
    function zmatch(fc, m) { var fq = st.fq; return (Nq * rhoq) / (Math.PI * m.rho * fc * m.Z) * Math.atan(m.Z * Math.tan(Math.PI * (fq - fc) / fq)); }
    var acc = 0;
    function step(dt) {
      var m = MAT[mat.get()], sdt = dt * 20; // 20× real time
      st.t += sdt;
      if (st.src) { var r = rate.get() * 1e-8; st.tx += r / (trueTF.get() / 100) * sdt; if (st.shutter) st.ts += r * sdt; }
      acc += dt; if (acc < 0.1 && dt) return; acc = 0;
      var fc = fOf(st.tx, m), tz = zmatch(fc, m), tsb = sauer(fc, m), disp = (tz - (st.zero ? zmatch(fOf(st.zero, m), m) : 0)) * tf.get() / 100;
      var dispRate = st.src ? rate.get() / (trueTF.get() / 100) * tf.get() / 100 : 0;
      st.hist.push([st.t, (st.fq - fc)]); if (st.hist.length > 600) st.hist.shift();
      var life = VL.clamp((st.fq - fc) / 1.0e6, 0, 1);
      top.innerHTML = '<div class="dtm"><div class="dtm-row"><span>RATE</span><b>' + dispRate.toFixed(1) + '</b><i>Å/s</i></div><div class="dtm-row"><span>THICK</span><b>' + (disp * 1e8 / 10).toFixed(1) + '</b><i>nm</i></div><div class="dtm-row"><span>FREQ</span><b>' + (fc / 1e6).toFixed(5) + '</b><i>MHz</i></div><div class="dtm-row small"><span>ρ ' + m.rho + '  Z ' + m.Z + '  TF ' + tf.get() + '%</span><span>XTAL LIFE ' + Math.round(life * 100) + '%</span></div></div>' +
        '<div class="dtm-truth"><div><b>' + ((st.ts - st.zeroS) * 1e7).toFixed(1) + ' nm</b><span>actually on the substrate since zero</span></div><div><b>' + (st.tx * 1e7).toFixed(1) + ' nm</b><span>on the crystal (total)</span></div><div><b>' + (tsb * 1e7).toFixed(1) + ' / ' + (tz * 1e7).toFixed(1) + ' nm</b><span>crystal film by Sauerbrey / by Z-match</span></div><div><b>' + (st.shutter ? 'open' : 'closed') + '</b><span>substrate shutter</span></div></div>';
      read.innerHTML = '';
      plot.innerHTML = VL.plot({ id: 'qcmp', label: 'Frequency shift over time', w: 700, h: 220, m: { l: 66, r: 16, t: 12, b: 40 }, x: { min: Math.max(0, st.t - 1200), max: Math.max(60, st.t), label: 'time (s), simulated at 20× speed' }, y: { min: 0, max: Math.max(1000, (st.fq - fc) * 1.2), label: 'f₀ − f (Hz)' }, series: [{ data: st.hist, color: C.au }] });
    }
    VL.loop(fig, step);
  };

  /* ═══ EBL: wavelength, proximity effect, write time ═══════ */
  function erf(x) { var s = x < 0 ? -1 : 1; x = Math.abs(x); var t = 1 / (1 + 0.3275911 * x), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  F.lambda = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    VL.slider(ctl, { label: 'Accelerating voltage', min: 1, max: 100, step: 1, value: 30, fmt: function (v) { return v + ' kV'; }, on: function (kv) {
      var V = kv * 1e3, eV = VL.e * V, mc2 = VL.me * VL.c * VL.c, lam = VL.h / Math.sqrt(2 * VL.me * eV * (1 + eV / (2 * mc2))), lamNR = VL.h / Math.sqrt(2 * VL.me * eV);
      read.innerHTML = '<div><b>' + (lam * 1e12).toFixed(2) + ' pm</b><span>electron wavelength (relativistic)</span></div><div><b>' + ((lamNR / lam - 1) * 100).toFixed(1) + ' %</b><span>error if relativity is ignored</span></div><div><b>' + Math.round(405e-9 / lam).toLocaleString() + '×</b><span>shorter than 405 nm laser-writer light</span></div><div><b>' + (Math.sqrt(1 - Math.pow(mc2 / (mc2 + eV), 2))).toFixed(3) + ' c</b><span>electron speed</span></div>';
    } }).refresh();
  };
  F.prox = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var o = {};
    var redraw = function () { draw(); };
    o.w = VL.slider(ctl, { label: 'Line width', min: 20, max: 300, step: 5, value: 100, fmt: function (v) { return v + ' nm'; }, on: redraw });
    o.p = VL.slider(ctl, { label: 'Pitch', min: 60, max: 1000, step: 10, value: 200, fmt: function (v) { return v + ' nm'; }, on: redraw });
    o.n = VL.slider(ctl, { label: 'Number of lines', min: 1, max: 60, step: 1, value: 25, fmt: function (v) { return v; }, on: redraw });
    o.a = VL.slider(ctl, { label: 'Forward scatter α', min: 5, max: 60, step: 1, value: 20, fmt: function (v) { return v + ' nm'; }, on: redraw });
    o.b = VL.slider(ctl, { label: 'Backscatter range β', min: 0.3, max: 12, step: 0.1, value: 3, fmt: function (v) { return v.toFixed(1) + ' µm'; }, on: redraw });
    o.e = VL.slider(ctl, { label: 'Backscatter ratio η', min: 0, max: 1.2, step: 0.01, value: 0.7, fmt: function (v) { return v.toFixed(2); }, on: redraw });
    o.d = VL.slider(ctl, { label: 'Dose ÷ clearing dose', min: 0.5, max: 3, step: 0.05, value: 1.8, fmt: function (v) { return v.toFixed(2) + '×'; }, on: redraw });
    function draw() {
      var w = o.w.get(), p = o.p.get(), N = Math.round(o.n.get()), al = o.a.get(), be = o.b.get() * 1000, eta = o.e.get(), D = o.d.get();
      var xs = [], span = (N - 1) * p / 2 + Math.max(600, w * 3), M = 700;
      for (var i = 0; i < M; i++) xs.push(-span + 2 * span * i / (M - 1));
      var line = function (x, c) { var f = 0.5 * (erf((x - c + w / 2) / al) - erf((x - c - w / 2) / al)), b = 0.5 * (erf((x - c + w / 2) / be) - erf((x - c - w / 2) / be)); return (f + eta * b) / (1 + eta); };
      var cen = []; for (var j = 0; j < N; j++) cen.push((j - (N - 1) / 2) * p);
      var E = xs.map(function (x) { var s = 0; cen.forEach(function (c) { s += line(x, c); }); return D * s; });
      var designed = xs.map(function (x) { return cen.some(function (c) { return Math.abs(x - c) <= w / 2; }) ? 1 : 0; });
      var cleared = E.map(function (v) { return v >= 1 ? 1 : 0; });
      var widthAt = function (c) { var l = 0, dx = 2 * span / (M - 1); xs.forEach(function (x, i) { if (Math.abs(x - c) < p / 2 && cleared[i]) l += dx; }); return l; };
      var wc = widthAt(cen[Math.floor(N / 2)]), we = widthAt(cen[0]);
      plot.innerHTML = VL.plot({ id: 'prox', label: 'Absorbed dose along a line grating', w: 720, h: 320, x: { min: -span, max: span, label: 'position (nm)' }, y: { min: 0, max: Math.max(2, D * 1.6), label: 'absorbed dose ÷ clearing dose' },
        series: [{ data: xs.map(function (x, i) { return [x, designed[i] * 0.12]; }), color: C.text3, fill: 0.5, width: 0.5 }, { data: xs.map(function (x, i) { return [x, cleared[i] ? 0.12 : NaN]; }), color: C.green, width: 4 }, { data: xs.map(function (x, i) { return [x, E[i]]; }), color: C.au, width: 2 }],
        hlines: [{ y: 1, color: C.red, label: 'clearing dose' }] });
      read.innerHTML = '<div><b>' + wc.toFixed(0) + ' nm</b><span>developed width, centre line (designed ' + w + ' nm)</span></div><div><b>' + we.toFixed(0) + ' nm</b><span>developed width, outermost line</span></div><div><b>' + (N > 1 ? ((wc - we) / w * 100).toFixed(0) + ' %' : '—') + '</b><span>centre-to-edge difference: the proximity effect</span></div>';
    }
    draw();
  };
  F.writetime = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var A = VL.slider(ctl, { label: 'Exposed area', min: -6, max: 2, step: 0.05, value: -2, log: true, fmt: function (v) { return v >= 1 ? v.toPrecision(3) + ' cm²' : v >= 0.01 ? (v * 100).toPrecision(3) + ' mm²' : (v * 1e8).toPrecision(3) + ' µm²'; }, on: function () { draw(); } });
    var D = VL.slider(ctl, { label: 'Dose', min: 50, max: 2000, step: 10, value: 300, fmt: function (v) { return v + ' µC/cm²'; }, on: function () { draw(); } });
    var I = VL.slider(ctl, { label: 'Beam current', min: -2, max: 2, step: 0.05, value: 0, log: true, fmt: function (v) { return v.toPrecision(3) + ' nA'; }, on: function () { draw(); } });
    var S = VL.slider(ctl, { label: 'Beam step (pixel)', min: 1, max: 50, step: 1, value: 10, fmt: function (v) { return v + ' nm'; }, on: function () { draw(); } });
    function draw() { var q = D.get() * 1e-6 * A.get(), t = q / (I.get() * 1e-9), dwell = D.get() * 1e-6 * Math.pow(S.get() * 1e-7, 2) / (I.get() * 1e-9);
      read.innerHTML = '<div><b>' + VL.fmtTime(t) + '</b><span>pure exposure time t = D·A / I</span></div><div><b>' + VL.sci(q * 1e6, 3) + ' µC</b><span>total charge delivered</span></div><div><b>' + VL.fmtTime(dwell) + '</b><span>dwell time per pixel</span></div><div><b>' + VL.sci(1 / dwell / 1e6, 3) + ' MHz</b><span>pixel clock the pattern generator must reach</span></div>'; }
    draw();
  };

  /* ═══ lift-off process stepper (evaporation vs sputtering) ═ */
  F.liftoff = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), cap = VL.part(fig, 'vl-caption-live');
    var step = 0, sput = false;
    var TXT = ['1 · Spin-coat resist: a PMMA bilayer (a more sensitive bottom layer under a less sensitive top layer) on the substrate.',
      '2 · Expose: the focused beam writes the pattern. Back-scattered electrons spread wider in the sensitive bottom layer.',
      '3 · Develop (MIBK : IPA): exposed resist dissolves, leaving an undercut — the opening is narrower at the top than at the bottom.',
      '4 · Deposit metal. ' + 'Evaporation is line-of-sight: the film on the resist and the film in the trench do not touch.',
      '5 · Lift-off in acetone: the resist dissolves and carries the unwanted metal away. Only the written pattern remains.'];
    var TXTS = { 3: '4 · Deposit metal by sputtering: at ~10⁻³ mbar atoms arrive from many directions and coat the side walls too.', 4: '5 · Lift-off fails: the side-wall film welds the metal on the resist to the metal in the trench. You get torn edges and "fences", or nothing lifts at all.' };
    function draw() {
      var s = '<svg viewBox="0 0 720 300" class="plot" role="img" aria-label="Electron-beam lithography and lift-off">';
      s += '<rect x="40" y="220" width="640" height="60" fill="#3b3156"/><text x="56" y="262" class="pl-note" fill="' + C.text2 + '">substrate (Si)</text>';
      var trench = [[220, 300], [440, 520]], under = 14;
      if (step <= 4 && step < 4) {
        // resist layers
        if (step < 2) { s += '<rect x="40" y="176" width="640" height="44" fill="rgba(169,139,240,.45)"/><rect x="40" y="150" width="640" height="26" fill="rgba(69,191,214,.40)"/>'; }
        if (step === 1) trench.forEach(function (t) { s += '<rect x="' + t[0] + '" y="150" width="' + (t[1] - t[0]) + '" height="26" fill="rgba(224,168,46,.35)"/><rect x="' + (t[0] - under) + '" y="176" width="' + (t[1] - t[0] + 2 * under) + '" height="44" fill="rgba(224,168,46,.28)"/>'; s += '<path d="M' + ((t[0] + t[1]) / 2) + ' 20 L' + ((t[0] + t[1]) / 2) + ' 150" stroke="' + C.au + '" stroke-width="3" class="vl-flow" stroke-dasharray="6 5"/>'; });
        if (step >= 2) {
          var xs = [40].concat([].concat.apply([], trench)).concat([680]);
          for (var i = 0; i < xs.length; i += 2) { var a = xs[i], b = xs[i + 1]; s += '<rect x="' + a + '" y="150" width="' + (b - a) + '" height="26" fill="rgba(69,191,214,.40)"/><rect x="' + (a + (i ? under : 0)) + '" y="176" width="' + (b - a - (i ? under : 0) - (i + 2 < xs.length ? under : 0)) + '" height="44" fill="rgba(169,139,240,.45)"/>'; }
        }
        if (step === 3) {
          var metal = '#e0a82e';
          s += [[40, 220], [300, 440], [520, 680]].map(function (q) { return '<rect x="' + q[0] + '" y="138" width="' + (q[1] - q[0]) + '" height="12" fill="' + metal + '"/>'; }).join('');
          trench.forEach(function (t) { s += '<rect x="' + t[0] + '" y="208" width="' + (t[1] - t[0]) + '" height="12" fill="' + metal + '"/>'; if (sput) s += '<rect x="' + (t[0] - 2) + '" y="150" width="6" height="58" fill="' + metal + '"/><rect x="' + (t[1] - 4) + '" y="150" width="6" height="58" fill="' + metal + '"/>'; });
          if (!sput) for (var k = 0; k < 9; k++) s += '<line x1="' + (60 + k * 75) + '" y1="20" x2="' + (60 + k * 75) + '" y2="128" stroke="' + metal + '" stroke-dasharray="4 6" class="vl-flow" opacity=".7"/>';
          else for (k = 0; k < 14; k++) { var x0 = 60 + k * 45, ang = (k % 5 - 2) * 0.35; s += '<line x1="' + x0 + '" y1="20" x2="' + (x0 + Math.tan(ang) * 108) + '" y2="128" stroke="' + metal + '" stroke-dasharray="4 6" class="vl-flow" opacity=".7"/>'; }
        }
      }
      if (step === 4) {
        if (!sput) trench.forEach(function (t) { s += '<rect x="' + t[0] + '" y="208" width="' + (t[1] - t[0]) + '" height="12" fill="#e0a82e"/>'; });
        else { trench.forEach(function (t) { s += '<rect x="' + t[0] + '" y="208" width="' + (t[1] - t[0]) + '" height="12" fill="#e0a82e"/><path d="M' + (t[0] - 2) + ' 208 l2 -50 l6 4 l-2 46 Z M' + (t[1] - 4) + ' 208 l4 -44 l5 6 l-3 38 Z" fill="#e0a82e"/>'; }); s += '<rect x="300" y="160" width="140" height="12" fill="#e0a82e" opacity=".8" transform="rotate(-6 370 166)"/>'; }
      }
      host.innerHTML = s + '</svg>';
      cap.textContent = sput && TXTS[step] ? TXTS[step] : TXT[step];
      prev.disabled = step === 0; next.disabled = step === 4;
    }
    var prev = VL.button(ctl, '← Back', function () { step = Math.max(0, step - 1); draw(); });
    var next = VL.button(ctl, 'Next step →', function () { step = Math.min(4, step + 1); draw(); }, 'primary');
    VL.select(ctl, { label: 'Metal deposited by', value: 'evap', options: [['evap', 'Thermal / e-beam evaporation'], ['sput', 'Sputtering']], on: function (v) { sput = v === 'sput'; draw(); } });
    draw();
  };
})();
