/* Raman variants article — interactive figures (uses vl-core.js helpers).
   Simple, stated models for teaching; not instrument-specific. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var rng = function (seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

  /* ═══ 1. choosing the laser: ν⁴, fluorescence and resonance ═══ */
  F.excite = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var shift = 1000; // cm⁻¹, a typical fingerprint band
    var nu4 = function (l) { var s = 1e7 / l - shift; return Math.pow(s / (1e7 / 785 - shift), 4); };            // relative to 785 nm
    // overlap of autofluorescence with the Raman band (illustrative): strong for visible excitation, small in the
    // deep UV (fluorescence emitted far to the red of the Raman lines) and beyond ~1000 nm (no electronic absorption)
    var fluo = function (l) { return 1 / (1 + Math.exp(-(l - 275) / 12)) * 1 / (1 + Math.exp((l - 760) / 55)); };
    var reso = function (l, l0, w) { var dn = 1e7 / l - 1e7 / l0, g = 1e7 / (l0 - w / 2) - 1e7 / (l0 + w / 2); return 1 + 3000 / (1 + Math.pow(2 * dn / g, 2)) / (1 + Math.pow(2 * dn / g, 2)); };
    var draw = function () {
      var L = las.get(), l0 = chrom.get(), has = sel.get() === 'yes', ls = VL.linspace(230, 1100, 436);
      var series = [{ data: ls.map(function (l) { return [l, nu4(l)]; }), color: C.au, width: 2.2, label: 'Raman ∝ ν⁴ (relative to 785 nm)' }, { data: ls.map(function (l) { return [l, Math.max(1e-3, 300 * fluo(l))]; }), color: C.red, width: 2.2, label: 'fluorescence background (illustrative)' }];
      if (has) series.push({ data: ls.map(function (l) { return [l, nu4(l) * reso(l, l0, 60)]; }), color: C.cyan, width: 2.2, label: 'with resonance (chromophore)' });
      plot.innerHTML = VL.plot({ id: 'ex', w: 700, h: 320, label: 'Raman signal and fluorescence against laser wavelength', x: { min: 230, max: 1100, label: 'Laser wavelength (nm)' }, y: { min: 1e-3, max: 1e4, log: true, label: 'Relative signal' }, series: series,
        bands: [{ x0: 230, x1: 270, color: C.violet, op: 0.1, label: 'deep UV' }, { x0: 1000, x1: 1100, color: C.green, op: 0.1, label: 'FT-Raman' }], vlines: [{ x: L, color: C.text, label: L + ' nm', ly: 250 }], legend: true, legendX: 250, legendY: 14 });
      var R = nu4(L) * (has ? reso(L, l0, 60) : 1), Fl = 300 * fluo(L);
      read.innerHTML = '<div><b>×' + VL.sci(nu4(L), 2) + '</b><span>Raman signal from ν⁴ alone, relative to 785 nm (band at 1000 cm⁻¹)</span></div>' + (has ? '<div><b>×' + VL.sci(reso(L, l0, 60), 2) + '</b><span>resonance enhancement of the chromophore at this laser line</span></div>' : '') + '<div><b>' + VL.sci(Fl / Math.max(R, 1e-6), 2) + '</b><span>fluorescence / Raman ratio in this model (lower is better)</span></div><div><b>' + (L >= 1000 ? 'InGaAs / Ge (FT)' : L >= 750 ? 'deep-depletion Si CCD' : 'Si CCD') + '</b><span>usual detector for the Raman light</span></div>';
    };
    var las = VL.slider(ctl, { label: 'Laser wavelength', min: 244, max: 1064, step: 1, value: 532, fmt: function (v) { return v + ' nm'; }, on: draw });
    var sel = VL.select(ctl, { label: 'Sample has a chromophore', value: 'no', options: [['no', 'No'], ['yes', 'Yes (resonance Raman)']], on: draw });
    var chrom = VL.slider(ctl, { label: 'Chromophore absorption peak', min: 250, max: 700, step: 1, value: 415, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 2. spontaneous, CARS and SRS line shapes ═══ */
  F.coherent = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var G = gam.get(), nr = bg.get(), W0 = 2850, xs = VL.linspace(2750, 2950, 801);
      var chi = function (w) { var d = W0 - w, den = d * d + G * G; return [d / den * G, G / den * G]; }; // A/(Ω−ω−iΓ), scaled so Im χ = 1 at the peak
      var spont = xs.map(function (w) { return chi(w)[1]; });
      var cars = xs.map(function (w) { var c = chi(w); return (c[0] + nr) * (c[0] + nr) + c[1] * c[1]; });
      var srs = spont.slice(), mc = Math.max.apply(null, cars);
      plot.innerHTML = VL.plot({ id: 'co', w: 700, h: 320, label: 'Line shapes of spontaneous Raman, CARS and SRS', x: { min: 2750, max: 2950, label: 'Raman shift ω_p − ω_s (cm⁻¹)' }, y: { min: 0, max: 1.08, label: 'Signal (each normalised to its maximum)' },
        series: [{ data: xs.map(function (w, i) { return [w, spont[i]]; }), color: C.text3, width: 4, label: 'spontaneous Raman' }, { data: xs.map(function (w, i) { return [w, srs[i]]; }), color: C.green, width: 1.8, dash: '6 4', label: 'SRS ∝ Im χ⁽³⁾' }, { data: xs.map(function (w, i) { return [w, cars[i] / mc]; }), color: C.red, width: 2.2, label: 'CARS ∝ |χ_R + χ_NR|²' }],
        vlines: [{ x: W0, color: C.text3, label: 'Ω_R', ly: 26 }], legend: true, legendX: 14, legendY: 14 });
      var imax = cars.indexOf(mc), base = cars[0] / mc;
      read.innerHTML = '<div><b>' + (xs[imax] - W0).toFixed(1) + ' cm⁻¹</b><span>shift of the CARS peak from the true band centre</span></div><div><b>' + (100 * base).toFixed(0) + ' %</b><span>CARS signal far from the band (non-resonant background), relative to its peak</span></div><div><b>0</b><span>SRS background away from the band: it follows the spontaneous line shape</span></div>';
    };
    var bg = VL.slider(ctl, { label: 'Background χ_NR', min: 0, max: 1.5, step: 0.01, value: 0.4, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var gam = VL.slider(ctl, { label: 'Band half-width Γ', min: 3, max: 25, step: 0.5, value: 8, fmt: function (v) { return v.toFixed(1) + ' cm⁻¹'; }, on: draw });
    draw();
  };

  /* ═══ 3. SORS: where the light has been, against the offset ═══ */
  // Random walk of photons in a turbid two-layer sample (3D, isotropic steps of one transport mean free path).
  // The Raman light each photon brings back is taken as proportional to the path it spent in each layer.
  var walk = function (top, ls, mua, seed, N) {
    var R = rng(seed), offs = VL.linspace(0, 8, 17), A = offs.map(function () { return 0; }), B = offs.map(function () { return 0; }), half = 0.25;
    for (var k = 0; k < N; k++) {
      var x = 0, y = 0, z = 0, ux = 0, uy = 0, uz = 1, pa = 0, pb = 0, w = 1, steps = 0;
      while (steps++ < 2500) {
        var s = -ls * Math.log(1 - R()), nz = z + uz * s;
        // split the step between the layers
        if (z < top && nz < top) pa += s; else if (z >= top && nz >= top) pb += s; else { var f = (top - z) / (nz - z); if (z < top) { pa += s * f; pb += s * (1 - f); } else { pb += s * f; pa += s * (1 - f); } }
        x += ux * s; y += uy * s; z = nz; w *= Math.exp(-mua * s);
        if (z < 0) { var r = Math.sqrt(x * x + y * y); for (var i = 0; i < offs.length; i++) if (Math.abs(r - offs[i]) < half) { var ring = Math.PI * (Math.pow(offs[i] + half, 2) - Math.pow(Math.max(0, offs[i] - half), 2)); A[i] += w * pa / ring; B[i] += w * pb / ring; } break; }
        if (w < 1e-3 || z > 40) break;
        var ct = 2 * R() - 1, ph = 2 * Math.PI * R(), st = Math.sqrt(1 - ct * ct); ux = st * Math.cos(ph); uy = st * Math.sin(ph); uz = ct;
      }
    }
    return { offs: offs, A: A, B: B };
  };
  F.sors = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout'), timer = 0;
    var draw = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var r = walk(th.get(), mfp.get(), 0.005, 11, 9000);
        var frac = r.offs.map(function (o, i) { var t = r.A[i] + r.B[i]; return [o, t > 0 ? r.B[i] / t : NaN]; });
        var tot = r.offs.map(function (o, i) { return [o, r.A[i] + r.B[i]]; }), t0 = tot[0][1] || 1;
        plot.innerHTML = VL.plot({ id: 'so', w: 700, h: 320, label: 'SORS: share of signal from the buried layer against the offset', x: { min: 0, max: 8, label: 'Offset Δs between laser spot and collection (mm)' }, y: { min: 0, max: 1, label: 'Share from the buried layer' },
          series: [{ data: frac, color: C.cyan, width: 2.4, label: 'share from the buried layer' }, { data: frac, color: C.cyan, dots: true, r: 3 }, { data: tot.map(function (q) { return [q[0], q[1] / t0]; }), color: C.text3, dash: '4 4', label: 'total signal (relative to Δs = 0)' }],
          legend: true, legendX: 330, legendY: 200 });
        var at = function (o) { var i = Math.round(o / 0.5); return frac[i][1]; };
        read.innerHTML = '<div><b>' + (100 * at(0)).toFixed(0) + ' %</b><span>of the signal from the buried layer at Δs = 0 (conventional Raman)</span></div><div><b>' + (100 * at(4)).toFixed(0) + ' %</b><span>at Δs = 4 mm</span></div><div><b>' + VL.sci(tot[8][1] / t0, 2) + '</b><span>total signal at 4 mm relative to 0 mm — the price of the offset</span></div>';
      }, 80);
    };
    var th = VL.slider(ctl, { label: 'Thickness of the top layer', min: 0.3, max: 3, step: 0.1, value: 1, fmt: function (v) { return v.toFixed(1) + ' mm'; }, on: draw });
    var mfp = VL.slider(ctl, { label: 'Transport mean free path', min: 0.05, max: 0.5, step: 0.01, value: 0.2, fmt: function (v) { return v.toFixed(2) + ' mm'; }, on: draw });
    draw();
  };

  /* ═══ 4. confocal resolution ═══ */
  F.confocal = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var lam = la.get() / 1000, n = imm.get(), NAmax = Math.min(n * 0.98, 1.45), NA = Math.min(na.get(), NAmax), nas = VL.linspace(0.1, NAmax, 200);
      var lat = function (a) { return 0.37 * lam / a; }, ax = function (a) { return 0.64 * lam / (n - Math.sqrt(n * n - a * a)); };
      plot.innerHTML = VL.plot({ id: 'cf', w: 700, h: 320, label: 'Confocal lateral and axial resolution against numerical aperture', x: { min: 0.1, max: 1.45, label: 'Numerical aperture NA' }, y: { min: 0.1, max: 100, log: true, label: 'Resolution, FWHM (µm)' },
        series: [{ data: nas.map(function (a) { return [a, lat(a)]; }), color: C.au, width: 2.4, label: 'lateral ≈ 0.37 λ / NA' }, { data: nas.map(function (a) { return [a, ax(a)]; }), color: C.cyan, width: 2.4, label: 'axial ≈ 0.64 λ / (n − √(n² − NA²))' }],
        vlines: [{ x: NA, color: C.text3 }], marks: [{ x: NA, y: lat(NA), color: C.au }, { x: NA, y: ax(NA), color: C.cyan }], legend: true, legendX: 300, legendY: 14 });
      read.innerHTML = '<div><b>' + (lat(NA) * 1000).toFixed(0) + ' nm</b><span>lateral resolution (ideal pinhole, at the Raman wavelength)</span></div><div><b>' + ax(NA).toFixed(2) + ' µm</b><span>axial (depth) resolution in a medium of index ' + n + '</span></div><div><b>' + (lat(NA) * lat(NA) * ax(NA)).toPrecision(2) + ' µm³</b><span>approximate probed volume — what one spectrum averages over</span></div>';
    };
    var la = VL.slider(ctl, { label: 'Wavelength of the Raman light', min: 300, max: 1100, step: 5, value: 560, fmt: function (v) { return v + ' nm'; }, on: draw });
    var na = VL.slider(ctl, { label: 'Numerical aperture', min: 0.1, max: 1.45, step: 0.01, value: 0.9, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var imm = VL.slider(ctl, { label: 'Refractive index of the immersion / sample', min: 1, max: 1.52, step: 0.01, value: 1, fmt: function (v) { return v.toFixed(2); }, on: draw });
    draw();
  };
})();
