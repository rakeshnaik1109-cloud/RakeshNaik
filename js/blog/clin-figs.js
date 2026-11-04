/* SERS in clinical diagnostics — interactive figures (uses vl-core.js helpers).
   The models are the textbook ones given in the text; all data are synthetic. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var rng = function (seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  var gauss = function (R) { var u = 1 - R(), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ═══ 1. what a positive result means: predictive values against prevalence ═══ */
  F.ppv = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var se = sens.get() / 100, sp = spec.get() / 100, pr = prev.get() / 100, ps = VL.logspace(1e-4, 0.5, 200);
      var ppv = function (p) { return se * p / (se * p + (1 - sp) * (1 - p)); }, npv = function (p) { return sp * (1 - p) / (sp * (1 - p) + (1 - se) * p); };
      plot.innerHTML = VL.plot({ id: 'pv', w: 700, h: 320, label: 'Predictive values against prevalence', x: { min: 1e-4, max: 0.5, log: true, label: 'Prevalence in the tested population', fmt: function (v) { return (v * 100 >= 1 ? +(v * 100).toPrecision(2) : +(v * 100).toPrecision(1)) + ' %'; } }, y: { min: 0, max: 1, label: 'Predictive value' },
        series: [{ data: ps.map(function (p) { return [p, ppv(p)]; }), color: C.au, width: 2.4, label: 'PPV — a positive is truly positive' }, { data: ps.map(function (p) { return [p, npv(p)]; }), color: C.cyan, width: 2.4, label: 'NPV — a negative is truly negative' }],
        vlines: [{ x: pr, color: C.text3, label: 'this population', ly: 290 }], marks: [{ x: pr, y: ppv(pr), color: C.au }, { x: pr, y: npv(pr), color: C.cyan }], legend: true, legendX: 300, legendY: 150 });
      var N = 10000, D = N * pr, TP = se * D, FN = D - TP, FP = (1 - sp) * (N - D), TN = N - D - FP;
      var r = function (v) { return Math.round(v).toLocaleString('en'); };
      read.innerHTML = '<div><b>' + (100 * ppv(pr)).toFixed(1) + ' %</b><span>of positive results are true (PPV)</span></div><div><b>' + (100 * npv(pr)).toFixed(2) + ' %</b><span>of negative results are true (NPV)</span></div><div><b>' + r(TP) + ' true · ' + r(FP) + ' false</b><span>positives among 10,000 people tested</span></div><div><b>' + r(FN) + '</b><span>cases missed (false negatives) among the same 10,000</span></div>';
    };
    var sens = VL.slider(ctl, { label: 'Sensitivity', min: 50, max: 99.9, step: 0.1, value: 95, fmt: function (v) { return v.toFixed(1) + ' %'; }, on: draw });
    var spec = VL.slider(ctl, { label: 'Specificity', min: 50, max: 99.9, step: 0.1, value: 95, fmt: function (v) { return v.toFixed(1) + ' %'; }, on: draw });
    var prev = VL.slider(ctl, { label: 'Prevalence', min: -2, max: 1.7, step: 0.01, value: 0, log: true, fmt: function (v) { return (v >= 1 ? v.toFixed(1) : v.toPrecision(2)) + ' %'; }, on: draw });
    draw();
  };

  /* ═══ 2. how a model fools you: splitting by spectrum versus by patient ═══ */
  // Synthetic patients: each spectrum = class signal + a patient's own offset + measurement noise.
  // A 1-nearest-neighbour classifier is trained on part of the data and tested on the rest.
  var simulate = function (nPat, perPat, effect, pvar, seed) {
    var R = rng(seed), D = 24, cls = [], pats = [];
    var dir = []; for (var k = 0; k < D; k++) dir.push(gauss(R)); var nd = Math.sqrt(dir.reduce(function (s, v) { return s + v * v; }, 0)); dir = dir.map(function (v) { return v / nd; });
    for (var i = 0; i < nPat; i++) { var c = i % 2, off = []; for (var k2 = 0; k2 < D; k2++) off.push(pvar * gauss(R)); pats.push({ c: c, off: off }); }
    var spectra = [];
    pats.forEach(function (p, pi) { for (var j = 0; j < perPat; j++) { var x = []; for (var k3 = 0; k3 < D; k3++) x.push((p.c ? effect / 2 : -effect / 2) * dir[k3] + p.off[k3] + 0.35 * gauss(R)); spectra.push({ x: x, c: p.c, p: pi }); } });
    var nn = function (train, test) { var ok = 0; test.forEach(function (t) { var best = 1e99, bc = 0; train.forEach(function (s) { var d = 0; for (var k = 0; k < D; k++) { var e = s.x[k] - t.x[k]; d += e * e; } if (d < best) { best = d; bc = s.c; } }); if (bc === t.c) ok++; }); return ok / test.length; };
    // random split of spectra (the same patient ends up on both sides)
    var idx = spectra.map(function (_, i) { return i; }); for (var a = idx.length - 1; a > 0; a--) { var b = Math.floor(R() * (a + 1)); var t = idx[a]; idx[a] = idx[b]; idx[b] = t; }
    var cut = Math.floor(idx.length * 0.7), trS = idx.slice(0, cut).map(function (i) { return spectra[i]; }), teS = idx.slice(cut).map(function (i) { return spectra[i]; });
    // split by patient (no patient on both sides)
    var pid = pats.map(function (_, i) { return i; }); for (var a2 = pid.length - 1; a2 > 0; a2--) { var b2 = Math.floor(R() * (a2 + 1)); var t2 = pid[a2]; pid[a2] = pid[b2]; pid[b2] = t2; }
    var trainP = {}; pid.slice(0, Math.max(2, Math.floor(nPat * 0.7))).forEach(function (q) { trainP[q] = 1; });
    var trP = spectra.filter(function (s) { return trainP[s.p]; }), teP = spectra.filter(function (s) { return !trainP[s.p]; });
    return { leaky: nn(trS, teS), honest: teP.length ? nn(trP, teP) : NaN };
  };
  F.leak = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var timer = 0;
    var draw = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var Ns = [10, 16, 24, 32, 44, 60], reps = 4, L = [], Hn = [];
        Ns.forEach(function (N) { var a = 0, b = 0; for (var r = 0; r < reps; r++) { var s = simulate(N, Math.round(per.get()), eff.get(), pv.get(), 1000 * N + 17 * r + 3); a += s.leaky; b += s.honest; } L.push([N, a / reps]); Hn.push([N, b / reps]); });
        plot.innerHTML = VL.plot({ id: 'lk', w: 700, h: 320, label: 'Accuracy with two ways of splitting the data', x: { min: 8, max: 62, label: 'Number of patients in the study' }, y: { min: 0.3, max: 1.02, label: 'Test accuracy' },
          series: [{ data: L, color: C.red, width: 2.4, label: 'random split of spectra (leaky)' }, { data: Hn, color: C.green, width: 2.4, label: 'split by patient (honest)' }, { data: L, color: C.red, dots: true, r: 3.2 }, { data: Hn, color: C.green, dots: true, r: 3.2 }],
          hlines: [{ y: 0.5, color: C.text3, label: 'coin toss' }], legend: true, legendX: 14, legendY: 230 });
        var last = L.length - 1;
        read.innerHTML = '<div><b style="color:' + C.red + '">' + (100 * L[last][1]).toFixed(0) + ' %</b><span>accuracy reported with a random split of spectra (60 patients)</span></div><div><b style="color:' + C.green + '">' + (100 * Hn[last][1]).toFixed(0) + ' %</b><span>accuracy on patients the model has never seen</span></div><div><b>' + (100 * (L[last][1] - Hn[last][1])).toFixed(0) + ' points</b><span>of apparent accuracy that came from recognising patients, not disease</span></div>';
      }, 60);
    };
    var eff = VL.slider(ctl, { label: 'Real disease signal', min: 0, max: 4, step: 0.05, value: 2, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var pv = VL.slider(ctl, { label: 'Patient-to-patient variation', min: 0, max: 1.2, step: 0.02, value: 0.6, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var per = VL.slider(ctl, { label: 'Spectra per patient', min: 1, max: 20, step: 1, value: 10, fmt: function (v) { return Math.round(v); }, on: draw });
    draw();
  };
})();
