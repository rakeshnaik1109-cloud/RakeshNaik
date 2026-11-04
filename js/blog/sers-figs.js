/* Label-free and labelled SERS article — interactive figures (uses vl-core.js helpers).
   All spectra are synthetic and illustrative; the models are the textbook ones given in the text. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var rng = function (seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  var gauss = function (R) { var u = 1 - R(), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  var lor = function (x, x0, w) { var t = (x - x0) / (w / 2); return 1 / (1 + t * t); };

  /* ═══ 1. distance decay and the thickness of what sits in between ═══ */
  var LAYERS = {
    direct: { name: 'Analyte adsorbed directly on the metal', d: 0.3, col: C.green },
    cyst: { name: 'Thiol linker / SAM, analyte on top', d: 1.5, col: C.cyan },
    apt: { name: 'Aptamer capture layer', d: 4, col: C.violet },
    shell: { name: 'SHINERS shell (2 nm SiO₂), analyte outside', d: 2, col: C.au },
    ab: { name: 'Antibody capture layer, antigen on top', d: 10, col: C.red }
  };
  F.sersdist = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var r = rad.get(), L = LAYERS[sel.get()], ds = VL.linspace(0, 20, 401), G = function (d) { return Math.pow(r / (r + d), 12); };
      var marks = Object.keys(LAYERS).map(function (k) { var q = LAYERS[k]; return { x: q.d, y: G(q.d), color: q.col, r: k === sel.get() ? 6 : 3.5 }; });
      plot.innerHTML = VL.plot({ id: 'sd', w: 700, h: 320, label: 'Enhancement against distance from the metal', x: { min: 0, max: 20, label: 'Distance d of the molecule from the metal surface (nm)' }, y: { min: 1e-4, max: 1, log: true, label: 'G(d) / G(0)' },
        series: [{ data: ds.map(function (d) { return [d, G(d)]; }), color: C.au, width: 2.4 }, { data: ds.map(function (d) { return [d, Math.pow(r / (r + d), 10)]; }), color: C.text3, dash: '4 4' }],
        vlines: [{ x: L.d, color: L.col, label: L.name.split(',')[0], ly: 210 }], hlines: [{ y: 0.5, color: C.text3, label: 'half lost' }], marks: marks });
      var dHalf = r * (Math.pow(2, 1 / 12) - 1);
      read.innerHTML = '<div><b>' + (100 * G(L.d)).toPrecision(3) + ' %</b><span>of the surface enhancement left at d = ' + L.d + ' nm for this layer</span></div><div><b>' + dHalf.toFixed(2) + ' nm</b><span>distance at which half the enhancement is gone (r = ' + r + ' nm)</span></div><div><b>' + (100 * G(LAYERS.ab.d)).toPrecision(2) + ' %</b><span>left on top of a 10 nm antibody layer — why label-free immunosensing by SERS is hard</span></div>';
    };
    var sel = VL.select(ctl, { label: 'What separates the molecule from the metal', value: 'cyst', options: Object.keys(LAYERS).map(function (k) { return [k, LAYERS[k].name]; }), on: draw });
    var rad = VL.slider(ctl, { label: 'Radius of curvature of the metal', min: 5, max: 60, step: 1, value: 20, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 2. adsorption isotherms: Langmuir and competition ═══ */
  F.langmuir = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var KA = kA.get(), KB = kB.get(), CB = cB.get(), cs = VL.logspace(1e-10, 1e-2, 241);
      var th = function (c) { return KA * c / (1 + KA * c); }, thc = function (c) { return KA * c / (1 + KA * c + KB * CB); };
      var c50 = 1 / KA, c50c = (1 + KB * CB) / KA, lin = 0.1 / KA;
      plot.innerHTML = VL.plot({ id: 'lg', w: 700, h: 320, label: 'Langmuir and competitive adsorption', x: { min: 1e-10, max: 1e-2, log: true, label: 'Analyte concentration C_A (mol/L)' }, y: { min: 0, max: 1, label: 'Coverage θ_A (∝ SERS signal)' },
        series: [{ data: cs.map(function (c) { return [c, th(c)]; }), color: C.green, label: 'analyte alone' }, { data: cs.map(function (c) { return [c, thc(c)]; }), color: C.red, label: 'with competing matrix molecule' }, { data: cs.map(function (c) { return [c, KB * CB / (1 + KA * c + KB * CB)]; }), color: C.text3, dash: '4 4', label: 'sites taken by the competitor' }],
        legend: true, legendX: 14, legendY: 14, vlines: [{ x: c50, color: C.green, label: '1/K_A', ly: 150 }, { x: c50c, color: C.red, label: 'shifted ×' + VL.sci(1 + KB * CB, 2), ly: 172 }] });
      read.innerHTML = '<div><b>' + VL.sci(lin, 2) + ' M</b><span>linear range ends near 0.1/K_A (θ ≈ 0.09); above it the response bends over</span></div><div><b>' + VL.sci(c50c, 2) + ' M</b><span>half-coverage concentration in the mixture, (1 + K_B C_B)/K_A</span></div><div><b>×' + VL.sci(1 + KB * CB, 2) + '</b><span>loss of low-concentration sensitivity caused by the competitor</span></div>';
    };
    var kA = VL.slider(ctl, { label: 'Analyte affinity K_A', min: 3, max: 9, step: 0.1, value: 6, log: true, fmt: function (v) { return VL.sci(v, 2) + ' M⁻¹'; }, on: draw });
    var kB = VL.slider(ctl, { label: 'Competitor affinity K_B', min: 1, max: 8, step: 0.1, value: 4, log: true, fmt: function (v) { return VL.sci(v, 2) + ' M⁻¹'; }, on: draw });
    var cB = VL.slider(ctl, { label: 'Competitor concentration C_B', min: -8, max: -2, step: 0.1, value: -3, log: true, fmt: function (v) { return VL.sci(v, 2) + ' M'; }, on: draw });
    draw();
  };

  /* ═══ 3. hot-spot statistics and the internal standard ═══ */
  // truncated power law p(η) ∝ η^-a on [m, M] (Fang, Seong & Dlott 2008: a ≈ 1.75)
  var A = 1.75, Em = 2.8e4, EM = 4.1e10;
  var drawEF = function (R) { var e = 1 - A, lo = Math.pow(Em, e), hi = Math.pow(EM, e); return Math.pow(lo + R() * (hi - lo), 1 / e); };
  F.hotspot = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var seed = 7;
    var draw = function () {
      var N = Math.round(nm.get()), gs = gsp.get(), uni = sub.get() === 'uni', emb = isd.get() === 'emb', R = rng(seed), K = 60, raw = [], rat = [];
      var ef = function () { return uni ? 1e8 * Math.exp(0.3 * gauss(R)) : drawEF(R); };
      for (var k = 0; k < K; k++) {
        var g = Math.exp(gs * gauss(R)), s = 0, t = 0;
        for (var i = 0; i < N; i++) { var e = ef(); s += e; t += emb ? e : ef(); }
        s *= 1 + 0.03 * gauss(R); t *= 1 + 0.03 * gauss(R);   // 3 % read-out noise on each band
        raw.push(g * s); rat.push(s / t);  // the standard sees the same spot-wide factor g
      }
      var mean = function (x) { return x.reduce(function (p, q) { return p + q; }, 0) / x.length; };
      var norm = function (x) { var m = mean(x); return x.map(function (v) { return v / m; }); };
      var rsd = function (x) { var m = mean(x), v = x.reduce(function (p, q) { return p + (q - m) * (q - m); }, 0) / (x.length - 1); return 100 * Math.sqrt(v) / m; };
      var a = norm(raw), b = norm(rat), ymax = Math.min(10, Math.max(2, Math.ceil(Math.max.apply(null, a.concat(b)) * 1.05)));
      plot.innerHTML = VL.plot({ id: 'hs', w: 700, h: 320, label: 'Spot-to-spot SERS intensity', x: { min: 0, max: K + 1, label: 'Measurement spot number' }, y: { min: 0, max: ymax, label: 'Signal / mean' },
        series: [{ data: a.map(function (v, i) { return [i + 1, v]; }), color: C.au, dots: true, r: 3, label: 'raw analyte band' }, { data: b.map(function (v, i) { return [i + 1, v]; }), color: C.cyan, dots: true, r: 3, label: 'ratio to internal standard' }],
        hlines: [{ y: 1, color: C.text3 }], legend: true, legendX: 14, legendY: 14 });
      var e2 = 2 - A, e1 = 1 - A, q = function (p) { var lo = Math.pow(Em, e1), hi = Math.pow(EM, e1); return Math.pow(lo + p * (hi - lo), 1 / e1); };
      var top = (Math.pow(EM, e2) - Math.pow(q(0.99), e2)) / (Math.pow(EM, e2) - Math.pow(Em, e2));
      read.innerHTML = '<div><b>' + rsd(raw).toFixed(0) + ' %</b><span>spot-to-spot RSD of the raw signal</span></div><div><b>' + rsd(rat).toFixed(0) + ' %</b><span>RSD after dividing by the internal standard</span></div><div><b>' + (uni ? '≈ 1.6 %' : (100 * top).toFixed(0) + ' %') + '</b><span>of all signal from the brightest 1 % of molecules (' + (uni ? 'log-normal, ±30 %' : 'EF ∝ η^−1.75, 2.8×10⁴–4.1×10¹⁰') + ')</span></div>';
    };
    var sub = VL.select(ctl, { label: 'Substrate', value: 'pow', options: [['pow', 'Power-law hot spots (colloid, rough film)'], ['uni', 'Uniform nanogap particles']], on: draw });
    var isd = VL.select(ctl, { label: 'Internal standard', value: 'own', options: [['own', 'Co-adsorbed, on its own sites'], ['emb', 'Embedded in the same hot spots']], on: draw });
    var nm = VL.slider(ctl, { label: 'Molecules per laser spot', min: 0, max: 5, step: 0.05, value: 2, log: true, fmt: function (v) { return Math.round(v).toLocaleString('en'); }, on: draw });
    var gsp = VL.slider(ctl, { label: 'Spot-wide variation', min: 0, max: 0.8, step: 0.02, value: 0.3, fmt: function (v) { return '±' + Math.round(100 * v) + ' %'; }, on: draw });
    VL.button(ctl, 'New substrate', function () { seed = (seed * 7 + 13) >>> 0; draw(); });
    draw();
  };

  /* ═══ 4. multiplexing: unmixing reporter spectra ═══ */
  var X = VL.linspace(400, 2400, 801);
  var band = function (list) { return X.map(function (x) { return list.reduce(function (s, b) { return s + b[1] * lor(x, b[0], b[2] || 14); }, 0); }); };
  var REP = [
    { name: 'MBA-type tag', col: C.au, s: band([[1077, 0.75], [1180, 0.12], [1587, 1]]) },
    { name: 'DTNB-type tag', col: C.violet, s: band([[1063, 0.25], [1333, 1, 16], [1556, 0.3]]) },
    { name: 'alkyne tag (silent region)', col: C.cyan, s: band([[1078, 0.25], [1590, 0.35], [2100, 1, 18]]) }
  ];
  var BIO = band([[1003, 0.5, 10], [1240, 0.25, 40], [1450, 0.45, 30], [1655, 0.55, 40]]);
  var solve = function (Am, y, cols) { // least squares on the chosen columns, normal equations
    var n = cols.length, M = [], v = [];
    for (var i = 0; i < n; i++) { M.push([]); v.push(0); for (var j = 0; j < n; j++) { var s = 0; for (var k = 0; k < y.length; k++) s += Am[cols[i]][k] * Am[cols[j]][k]; M[i].push(s); } for (var k2 = 0; k2 < y.length; k2++) v[i] += Am[cols[i]][k2] * y[k2]; }
    for (var p = 0; p < n; p++) { var mx = p; for (var r = p + 1; r < n; r++) if (Math.abs(M[r][p]) > Math.abs(M[mx][p])) mx = r; var t = M[p]; M[p] = M[mx]; M[mx] = t; var tv = v[p]; v[p] = v[mx]; v[mx] = tv; for (var r2 = p + 1; r2 < n; r2++) { var f = M[r2][p] / M[p][p]; for (var c = p; c < n; c++) M[r2][c] -= f * M[p][c]; v[r2] -= f * v[p]; } }
    var x = new Array(n); for (var q = n - 1; q >= 0; q--) { var s2 = v[q]; for (var c2 = q + 1; c2 < n; c2++) s2 -= M[q][c2] * x[c2]; x[q] = s2 / M[q][q]; }
    return x;
  };
  var nnls = function (Am, y, free) { // clamp-and-refit: drop components that come out negative (except free baseline terms)
    var cols = Am.map(function (_, i) { return i; });
    for (var it = 0; it < 6; it++) { var x = solve(Am, y, cols), drop = cols.filter(function (c, i) { return x[i] < 0 && free.indexOf(c) < 0; }); if (!drop.length) { var out = Am.map(function () { return 0; }); cols.forEach(function (c, i) { out[c] = x[i]; }); return out; } cols = cols.filter(function (c) { return drop.indexOf(c) < 0; }); }
    var o2 = Am.map(function () { return 0; }); solve(Am, y, cols).forEach(function (v, i) { o2[cols[i]] = v; }); return o2;
  };
  F.unmix = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var seed = 3;
    var draw = function () {
      var c = [s1.get(), s2.get(), s3.get()], nz = noise.get(), bg = bio.get(), R = rng(seed);
      var xs = X.map(function (x) { return (x - 1400) / 1000; });
      var base = xs.map(function (u) { return bg * (0.6 + 0.35 * u - 0.25 * u * u); });
      var y = X.map(function (_, k) { return c[0] * REP[0].s[k] + c[1] * REP[1].s[k] + c[2] * REP[2].s[k] + bg * BIO[k] + base[k] + nz * gauss(R); });
      var Am = [REP[0].s, REP[1].s, REP[2].s, BIO, X.map(function () { return 1; }), xs, xs.map(function (u) { return u * u; })];
      var est = nnls(Am, y, [4, 5, 6]);
      var fit = X.map(function (_, k) { return Am.reduce(function (s, col, i) { return s + est[i] * col[k]; }, 0); });
      var ymax = Math.max(1, Math.max.apply(null, y) * 1.08), ymin = Math.min(0, Math.min.apply(null, y));
      var ser = [{ data: X.map(function (x, k) { return [x, y[k]]; }), color: C.text2, width: 1.2, label: 'measured mixture' }, { data: X.map(function (x, k) { return [x, fit[k]]; }), color: C.text, dash: '5 3', width: 1.4, label: 'least-squares fit' }];
      REP.forEach(function (r, i) { ser.push({ data: X.map(function (x, k) { return [x, est[i] * r.s[k] + ymin]; }), color: r.col, width: 1.6, label: r.name }); });
      plot.innerHTML = VL.plot({ id: 'um', w: 700, h: 340, label: 'Spectral unmixing of three SERS tags', x: { min: 400, max: 2400, label: 'Raman shift (cm⁻¹)' }, y: { min: ymin, max: ymax, label: 'Intensity (a.u.)' }, bands: [{ x0: 1800, x1: 2400, color: C.cyan, op: 0.07, label: 'cell-silent region' }], series: ser, legend: true, legendX: 14, legendY: 14 });
      read.innerHTML = REP.map(function (r, i) { return '<div><b style="color:' + r.col + '">' + est[i].toFixed(2) + '</b><span>recovered ' + r.name + ' (true ' + c[i].toFixed(2) + ')</span></div>'; }).join('') + '<div><b>' + est[3].toFixed(2) + '</b><span>recovered tissue/protein background (true ' + bg.toFixed(2) + ')</span></div>';
    };
    var s1 = VL.slider(ctl, { label: 'Amount of tag 1 (MBA-type)', min: 0, max: 1, step: 0.01, value: 0.6, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var s2 = VL.slider(ctl, { label: 'Amount of tag 2 (DTNB-type)', min: 0, max: 1, step: 0.01, value: 0.3, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var s3 = VL.slider(ctl, { label: 'Amount of tag 3 (alkyne)', min: 0, max: 1, step: 0.01, value: 0.15, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var bio = VL.slider(ctl, { label: 'Biological background', min: 0, max: 2, step: 0.01, value: 0.6, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var noise = VL.slider(ctl, { label: 'Noise (σ)', min: 0, max: 0.2, step: 0.005, value: 0.04, fmt: function (v) { return v.toFixed(3); }, on: draw });
    VL.button(ctl, 'New noise', function () { seed = (seed * 5 + 11) >>> 0; draw(); });
    draw();
  };

  /* ═══ 5. sandwich assay: calibration and the detection limit ═══ */
  F.assay = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var KD = kd.get(), b = nsb.get(), sd = sig.get(), Smax = 1, cs = VL.logspace(1e-15, 1e-7, 241);
      var S = function (c) { return b + Smax * c / (KD + c); };
      var thr = b + 3 * sd, lod = thr - b >= Smax ? Infinity : KD * (thr - b) / (Smax - (thr - b));
      var R = rng(5), pts = VL.logspace(1e-14, 1e-8, 13).map(function (c) { return [c, S(c) + sd * gauss(R)]; });
      plot.innerHTML = VL.plot({ id: 'as', w: 700, h: 320, label: 'Sandwich SERS immunoassay calibration', x: { min: 1e-15, max: 1e-7, log: true, label: 'Antigen concentration (mol/L)' }, y: { min: 1e-4, max: 2, log: true, label: 'Reporter band intensity (a.u.)' },
        series: [{ data: cs.map(function (c) { return [c, S(c)]; }), color: C.au, width: 2.2, label: 'ideal response' }, { data: pts.filter(function (p) { return p[1] > 0; }), color: C.text, dots: true, r: 3.2, label: 'simulated replicates' }],
        hlines: [{ y: b, color: C.text3, label: 'blank (non-specific tags)' }, { y: thr, color: C.red, label: 'blank + 3σ' }], vlines: isFinite(lod) ? [{ x: lod, color: C.red, label: 'LOD', ly: 30 }] : [], legend: true, legendX: 14, legendY: 70 });
      read.innerHTML = '<div><b>' + (isFinite(lod) ? VL.sci(lod, 2) + ' M' : '—') + '</b><span>detection limit: where the curve crosses blank + 3σ</span></div><div><b>' + (isFinite(lod) ? VL.sci(lod * 3e13, 2) + ' pg/mL' : '—') + '</b><span>the same for a 30 kDa protein</span></div><div><b>' + VL.sci(3 * sd * KD / Smax, 2) + ' M</b><span>low-dose approximation LOD ≈ 3σ / slope = 3σ K_D / S_max</span></div>';
    };
    var kd = VL.slider(ctl, { label: 'Antibody dissociation constant K_D', min: -12, max: -7, step: 0.1, value: -9, log: true, fmt: function (v) { return VL.sci(v, 2) + ' M'; }, on: draw });
    var nsb = VL.slider(ctl, { label: 'Non-specific tag binding (blank)', min: -4, max: -1, step: 0.05, value: -2.5, log: true, fmt: function (v) { return VL.sci(v, 2); }, on: draw });
    var sig = VL.slider(ctl, { label: 'Blank standard deviation σ', min: -4, max: -1, step: 0.05, value: -3, log: true, fmt: function (v) { return VL.sci(v, 2); }, on: draw });
    draw();
  };
})();
