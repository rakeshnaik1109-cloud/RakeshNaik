/* Antibody immobilisation article — interactive figures (uses vl-core.js helpers). */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var cm = function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }, cd = function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  var ca = function (a, b) { return [a[0] + b[0], a[1] + b[1]]; }, cs = function (a, b) { return [a[0] - b[0], a[1] - b[1]]; };
  var csqrt = function (z) { var r = Math.hypot(z[0], z[1]), re = Math.sqrt((r + z[0]) / 2), im = Math.sqrt(Math.max(0, (r - z[0]) / 2)); return [re, z[1] < 0 ? -im : im]; };
  var cexp = function (z) { var e = Math.exp(z[0]); return [e * Math.cos(z[1]), e * Math.sin(z[1])]; };

  /* p-polarised reflectance of a stack (Kretschmann), transfer-matrix method.
     layers: [{ eps: [re, im], d (nm) }], first = prism (semi-infinite), last = medium (semi-infinite) */
  var reflP = function (layers, lam, thDeg) {
    var n0 = Math.sqrt(layers[0].eps[0]), kx = n0 * Math.sin(thDeg * Math.PI / 180), k0 = 2 * Math.PI / lam;
    var q = layers.map(function (L) { var kz = csqrt(cs(L.eps, [kx * kx, 0])); if (kz[1] < 0) kz = [-kz[0], -kz[1]]; return { kz: kz, y: cd(L.eps, kz) }; });
    var M = [[1, 0], [0, 0], [0, 0], [1, 0]];   // m11 m12 m21 m22
    for (var j = 1; j < layers.length - 1; j++) {
      var ph = cm(q[j].kz, [k0 * layers[j].d, 0]), c = [Math.cos(ph[0]) * Math.cosh(ph[1]), -Math.sin(ph[0]) * Math.sinh(ph[1])], s = [Math.sin(ph[0]) * Math.cosh(ph[1]), Math.cos(ph[0]) * Math.sinh(ph[1])];
      var a = c, b = cd(cm([0, -1], s), q[j].y), cc = cm(cm([0, -1], s), q[j].y), dd = c;
      M = [ca(cm(M[0], a), cm(M[1], cc)), ca(cm(M[0], b), cm(M[1], dd)), ca(cm(M[2], a), cm(M[3], cc)), ca(cm(M[2], b), cm(M[3], dd))];
    }
    var y0 = q[0].y, yN = q[layers.length - 1].y;
    var num = cs(ca(cm(y0, M[0]), cm(cm(y0, yN), M[1])), ca(M[2], cm(yN, M[3]))), den = ca(ca(cm(y0, M[0]), cm(cm(y0, yN), M[1])), ca(M[2], cm(yN, M[3])));
    var r = cd(num, den); return r[0] * r[0] + r[1] * r[1];
  };
  VL.reflP = reflP;

  /* ═══ the SPR curve and how a bound layer moves it ═══ */
  F.sprcurve = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var stack = function (dAb, dAg) { var n = 1.45, w = 1.333; return [{ eps: [1.515 * 1.515, 0] }, { eps: [-11.754, 1.26], d: 50 }, { eps: [1.45 * 1.45, 0], d: 1.5 }, { eps: [n * n, 0], d: dAb }, { eps: [n * n, 0], d: dAg }, { eps: [w * w, 0] }]; };
    var dip = function (L) { var best = { th: 0, R: 9 }; for (var th = 64; th <= 80; th += 0.02) { var R = reflP(L, 633, th); if (R < best.R) best = { th: th, R: R }; } for (var th2 = best.th - 0.02; th2 <= best.th + 0.02; th2 += 0.0005) { var R2 = reflP(L, 633, th2); if (R2 < best.R) best = { th: th2, R: R2 }; } return best; };
    var draw = function () {
      var a = ab.get(), g = ag.get(), ths = VL.linspace(64, 80, 321), L0 = stack(0, 0), L1 = stack(a, 0), L2 = stack(a, g);
      var d0 = dip(L0), d1 = dip(L1), d2 = dip(L2);
      plot.innerHTML = VL.plot({ id: 'spr', w: 700, h: 320, label: 'SPR reflectance curves', x: { min: 64, max: 80, label: 'Angle of incidence in the prism (°)' }, y: { min: 0, max: 1, label: 'Reflectance R (p)' },
        series: [{ data: ths.map(function (t) { return [t, reflP(L0, 633, t)]; }), color: C.text3, dash: '4 4', label: 'bare sensor (SAM)' }, { data: ths.map(function (t) { return [t, reflP(L1, 633, t)]; }), color: C.cyan, label: '+ antibody layer' }, { data: ths.map(function (t) { return [t, reflP(L2, 633, t)]; }), color: C.au, label: '+ captured antigen' }],
        legend: true, legendX: 70, legendY: 200 });
      var mass = function (d) { return d * (1.45 - 1.333) / 0.185 * 1; }; // ng/mm² (de Feijter, dn/dc = 0.185 mL/g)
      var ru = function (dth) { return dth / 1e-4; };
      read.innerHTML = '<div><b>' + ((d1.th - d0.th) * 1000).toFixed(0) + ' m°</b><span>shift from the antibody layer (' + Math.round(ru(d1.th - d0.th)) + ' RU at 10⁻⁴ °/RU)</span></div><div><b>' + mass(a).toFixed(2) + ' ng/mm²</b><span>antibody surface mass (de Feijter); ≈ ' + Math.round(mass(a) * 1000) + ' RU at 1000 RU per ng/mm²</span></div><div><b>' + ((d2.th - d1.th) * 1000).toFixed(0) + ' m°</b><span>shift from the antigen (' + Math.round(ru(d2.th - d1.th)) + ' RU)</span></div><div><b>' + d0.th.toFixed(2) + '°</b><span>resonance of the bare sensor (Au 50 nm, BK7, 633 nm, water)</span></div>';
    };
    var ab = VL.slider(ctl, { label: 'Antibody layer thickness', min: 0, max: 12, step: 0.1, value: 4, fmt: function (v) { return v.toFixed(1) + ' nm'; }, on: draw });
    var ag = VL.slider(ctl, { label: 'Antigen layer thickness', min: 0, max: 8, step: 0.1, value: 1.5, fmt: function (v) { return v.toFixed(1) + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ antibody glyph for the scenes ═══ */
  // draw an IgG "Y" at (x, y) = Fc tip (attachment end), pointing along angle a (0 = straight up), scale s
  var igg = function (x, y, a, s, opt) {
    opt = opt || {};
    var R = function (px, py) { var c = Math.cos(a), sn = Math.sin(a); return [x + px * c - py * sn, y - (px * sn + py * c)]; };
    var P = function (pts) { return pts.map(function (p, i) { var q = R(p[0], p[1]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ') + ' Z'; };
    var fc = P([[-5 * s, 0], [5 * s, 0], [5 * s, 22 * s], [-5 * s, 22 * s]]);
    var arm = function (sg) { return P([[0, 22 * s], [sg * 5 * s, 18 * s], [sg * 24 * s, 40 * s], [sg * 17 * s, 46 * s]]); };
    var tipL = R(-20.5 * s, 43 * s), tipR = R(20.5 * s, 43 * s);
    var o = '<path d="' + fc + '" fill="' + (opt.fc || '#a98bf0') + '"/><path d="' + arm(-1) + '" fill="' + (opt.fab || '#45bfd6') + '"/><path d="' + arm(1) + '" fill="' + (opt.fab || '#45bfd6') + '"/>';
    o += '<circle cx="' + tipL[0].toFixed(1) + '" cy="' + tipL[1].toFixed(1) + '" r="' + (3 * s) + '" fill="#e0a82e"/><circle cx="' + tipR[0].toFixed(1) + '" cy="' + tipR[1].toFixed(1) + '" r="' + (3 * s) + '" fill="#e0a82e"/>';
    return { svg: o, tips: [tipL, tipR] };
  };
  VL.igg = igg;
  var rng = function (seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

  /* ═══ immobilisation methods, as cross-sections ═══ */
  var METHODS = {
    phys: { name: 'Physical adsorption', layer: [], orient: 'random', link: 'none', note: 'Hydrophobic and electrostatic adsorption on bare gold or a hydrophobic SAM. Random orientation, partial unfolding, slow leaching.' },
    amine: { name: 'Amine coupling (EDC/NHS) on carboxymethyl dextran', layer: [['dextran', '#2b3d33', 40]], orient: 'random', link: 'amide', note: 'Lysines all over the antibody form amide bonds with activated carboxyl groups: robust and universal, but orientation is random and a lysine in a binding site can be lost.' },
    protG: { name: 'Protein A / G capture of the Fc', layer: [['SAM', '#3b3156', 6], ['protein A/G', '#7d6fa3', 10]], orient: 'up', link: 'fc', note: 'Fc-binding bacterial proteins capture the antibody by its constant region: Fab arms face the solution; the capture is reversible (regenerable) unless cross-linked.' },
    biotin: { name: 'Streptavidin – biotin', layer: [['SAM', '#3b3156', 6], ['streptavidin', '#2e6b5a', 12]], orient: 'mixed', link: 'biotin', note: 'Near-irreversible (K_D ≈ 10⁻¹⁴ M). Orientation depends on where the biotins are: random on lysines, Fc-directed when biotin is put on the glycans.' },
    glycan: { name: 'Oxidised Fc glycans → hydrazide surface', layer: [['SAM / dextran-hydrazide', '#3b3156', 10]], orient: 'up', link: 'hydrazone', note: 'Periodate turns the sugar diols in the Fc into aldehydes, which react with a hydrazide surface: covalent and Fc-down, at the cost of an oxidation step.' },
    thiol: { name: 'Half-antibody or Fab′ through hinge thiols', layer: [], orient: 'half', link: 'S–Au', note: 'Mild reduction (2-MEA) splits the hinge disulfides; the free thiols bind gold or maleimide. Small, oriented, dense — but the fragments must be made and purified.' },
    his: { name: 'His-tagged fragments on Ni²⁺–NTA', layer: [['SAM / NTA', '#3b3156', 8]], orient: 'frag', link: 'His–Ni', note: 'Recombinant scFv or nanobodies with a C-terminal His-tag bind Ni²⁺–NTA: oriented and regenerable with imidazole/EDTA, but His₆–NTA binding is only micromolar; tris-NTA or covalent fixing helps.' }
  };
  F.methods = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var sel = VL.select(ctl, { label: 'Method', value: 'amine', options: Object.keys(METHODS).map(function (k) { return [k, METHODS[k].name]; }), on: function () { draw(); } });
    var antigen = true;
    VL.button(ctl, 'Antigen on / off', function () { antigen = !antigen; draw(); });
    function draw() {
      var k = sel.get(), m = METHODS[k], W = 720, H = 300, base = 250, R = rng(11), s = '';
      s += '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="' + m.name + '">';
      s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#120c1e"/>';
      s += '<rect x="0" y="' + base + '" width="' + W + '" height="16" fill="#c9a227"/><text x="10" y="' + (base + 12) + '" class="pl-note" fill="#3b2c00">gold (50 nm)</text>';
      s += '<rect x="0" y="' + (base + 16) + '" width="' + W + '" height="' + (H - base - 16) + '" fill="#5a4b80" opacity=".6"/><text x="10" y="' + (base + 30) + '" class="pl-note" fill="#d8d0ec">glass · light from below (evanescent field reaches ≈ 200 nm up)</text>';
      var top = base;
      m.layer.forEach(function (L) { top -= L[2]; s += '<rect x="0" y="' + top + '" width="' + W + '" height="' + L[2] + '" fill="' + L[1] + '"/><text x="' + (W - 8) + '" y="' + (top + L[2] / 2 + 4) + '" class="pl-note" fill="#b6acc8" text-anchor="end">' + L[0] + '</text>'; });
      var n = (m.orient === 'random' || m.orient === 'mixed') ? 7 : 9, acc = 0, tot = 0, tips = [];
      for (var i = 0; i < n; i++) {
        var x = 50 + i * (W - 120) / (n - 1) + (R() - 0.5) * 14, a, sc = 1, y = top, opt = {};
        if (m.orient === 'random' || (m.orient === 'mixed' && i % 2)) { var r = R(); a = r < 0.25 ? (R() - 0.5) * 0.6 : r < 0.5 ? Math.PI + (R() - 0.5) * 0.5 : (R() < 0.5 ? -1 : 1) * (Math.PI / 2 + (R() - 0.5) * 0.4); if (Math.abs(a) > 1.2) y = top - 8; if (Math.abs(a) > 2.6) y = top - 46; }
        else a = (R() - 0.5) * 0.35;
        if (m.orient === 'half') { sc = 1; opt.half = true; }
        if (m.orient === 'frag') { sc = 0.75; }
        if (m.link === 'fc' && !(m.orient === 'random')) s += '<ellipse cx="' + x + '" cy="' + (top - 4) + '" rx="10" ry="7" fill="#9c8fc4"/>';
        if (m.link === 'biotin') s += '<circle cx="' + x + '" cy="' + (top - 3) + '" r="4" fill="#7fd18b"/>';
        var g;
        if (m.orient === 'half') {
          var R2 = function (px, py) { return [x + px, y - py]; };
          g = { svg: '<path d="M' + (x - 4) + ' ' + y + ' L' + (x + 4) + ' ' + y + ' L' + (x + 4) + ' ' + (y - 20) + ' L' + (x - 4) + ' ' + (y - 20) + ' Z" fill="#a98bf0"/><path d="M' + x + ' ' + (y - 20) + ' L' + (x + 4) + ' ' + (y - 16) + ' L' + (x + 14) + ' ' + (y - 44) + ' L' + (x + 7) + ' ' + (y - 48) + ' Z" fill="#45bfd6"/><circle cx="' + (x + 10.5) + '" cy="' + (y - 46) + '" r="3" fill="#e0a82e"/><circle cx="' + x + '" cy="' + (y + 1) + '" r="2.5" fill="#ffcf6b"/>', tips: [[x + 10.5, y - 46]] };
        } else if (m.orient === 'frag') {
          g = { svg: '<rect x="' + (x - 6) + '" y="' + (y - 30) + '" width="12" height="26" rx="5" fill="#45bfd6"/><rect x="' + (x - 2) + '" y="' + (y - 5) + '" width="4" height="5" fill="#7fd18b"/><circle cx="' + x + '" cy="' + (y - 31) + '" r="3" fill="#e0a82e"/>', tips: [[x, y - 31]] };
        } else g = igg(x, y, a, sc, opt);
        s += g.svg;
        g.tips.forEach(function (t) {
          tot++;
          var free = t[1] < top - 22 && !(m.link === 'amide' && R() < 0.12);
          if (free) { acc++; if (antigen) s += '<circle cx="' + t[0] + '" cy="' + (t[1] - 9) + '" r="6" fill="#e2566e" stroke="#120c1e"/>'; }
          else s += '<text x="' + t[0] + '" y="' + (t[1] + 4) + '" class="pl-note" fill="#e2566e" text-anchor="middle">×</text>';
        });
      }
      s += '<text x="10" y="20" class="pl-note" fill="#efeaf6">' + m.name + '</text>';
      s += '<g transform="translate(470 8)"><rect width="242" height="62" rx="6" fill="#0f0a18" opacity=".85"/><circle cx="14" cy="16" r="5" fill="#45bfd6"/><text x="26" y="20" class="pl-note" fill="#b6acc8">Fab (antigen-binding arm)</text><circle cx="14" cy="32" r="5" fill="#a98bf0"/><text x="26" y="36" class="pl-note" fill="#b6acc8">Fc (constant region)</text><circle cx="14" cy="48" r="5" fill="#e2566e"/><text x="26" y="52" class="pl-note" fill="#b6acc8">captured antigen · × blocked site</text></g>';
      host.innerHTML = s + '</svg>';
      read.innerHTML = '<div><b>' + acc + ' / ' + tot + '</b><span>binding sites free to capture antigen in this sketch</span></div><div style="grid-column: span 2"><b>' + m.link + '</b><span>' + m.note + '</span></div>';
    }
    draw();
  };

  /* ═══ charge of an antibody and of the dextran against pH: electrostatic pre-concentration ═══ */
  F.charge = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    // illustrative IgG-like composition (counts of ionisable groups) and pKa values
    var pos = [[10.5, 86], [12.5, 38], [6.0, 30], [8.0, 4]], neg = [[3.9, 58], [4.1, 66], [3.1, 4], [10.1, 56]];
    var q = function (pH, shift) { var z = 0; pos.forEach(function (g) { z += g[1] / (1 + Math.pow(10, pH - g[0] - (shift || 0))); }); neg.forEach(function (g) { z -= g[1] / (1 + Math.pow(10, g[0] + (shift || 0) - pH)); }); return z; };
    var qd = function (pH) { return -100 / (1 + Math.pow(10, 3.5 - pH)); };   // carboxymethyl groups, pKa ≈ 3.5 (relative units)
    var pI = function (sh) { var lo = 2, hi = 12; for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (q(m, sh) > 0) lo = m; else hi = m; } return (lo + hi) / 2; };
    var draw = function () {
      var p = ps.get(), sh = shs.get(), pi = pI(sh), xs = VL.linspace(2, 11, 181);
      plot.innerHTML = VL.plot({ id: 'chg', w: 700, h: 320, label: 'Net charge against pH', x: { min: 2, max: 11, label: 'pH of the coupling buffer' }, y: { min: -110, max: 110, label: 'net charge (protein: e; dextran: relative)' },
        series: [{ data: xs.map(function (x) { return [x, q(x, sh)]; }), color: C.cyan, label: 'antibody (model, pI ' + pi.toFixed(1) + ')' }, { data: xs.map(function (x) { return [x, qd(x)]; }), color: C.au, label: 'carboxymethyl dextran' }],
        bands: [{ x0: 3.5, x1: pi, color: C.green, op: 0.16 }], hlines: [{ y: 0, color: C.text3, dash: '2 3' }], vlines: [{ x: p, color: '#fff', label: 'pH ' + p.toFixed(1) }], legend: true, legendX: 380, legendY: 24 });
      var qa = q(p, sh), qs = qd(p), att = -qa * qs;
      read.innerHTML = '<div><b>' + qa.toFixed(0) + ' e</b><span>net charge of the antibody</span></div><div><b>' + (att > 0 ? 'attraction' : 'repulsion') + '</b><span>' + (att > 0 ? 'the antibody concentrates in the negative dextran (pre-concentration)' : 'no pre-concentration: coupling will be poor') + '</span></div><div><b>' + pi.toFixed(1) + '</b><span>isoelectric point of this model antibody</span></div>';
    };
    var ps = VL.slider(ctl, { label: 'Buffer pH', min: 2, max: 11, step: 0.1, value: 5, fmt: function (v) { return v.toFixed(1); }, on: draw });
    var shs = VL.slider(ctl, { label: 'Shift every pKa (different antibody)', min: -1.5, max: 1.5, step: 0.05, value: 0, fmt: function (v) { return (v >= 0 ? '+' : '') + v.toFixed(2); }, on: draw });
    draw();
  };

  /* ═══ sensorgrams: 1:1 binding with mass transport ═══ */
  F.sensorgram = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var ka = Math.pow(10, kas.get()), kd = Math.pow(10, kds.get()), Rmax = rms.get(), km = Math.pow(10, kms.get()), tA = 180, tD = 400, dt = 0.5, KD = kd / ka;
      var concs = [0.1, 0.3, 1, 3, 10].map(function (f) { return f * KD; }), cols = ['#5f86e6', '#45bfd6', '#7fd18b', '#e0a82e', '#e2566e'];
      var series = concs.map(function (C0, j) {
        var R = 0, out = [];
        for (var t = 0; t <= tA + tD; t += dt) {
          var Cb = t <= tA ? C0 : 0;
          // quasi-steady surface concentration (two-compartment model): ka Cs (Rmax − R) − kd R = km (Cb − Cs)
          var Cs = (km * Cb + kd * R) / (km + ka * (Rmax - R)), dR = ka * Cs * (Rmax - R) - kd * R;
          R = Math.max(0, R + dR * dt); out.push([t, R]);
        }
        return { data: out, color: cols[j], label: (C0 * 1e9 < 0.01 ? (C0 * 1e12).toPrecision(2) + ' pM' : (C0 * 1e9).toPrecision(2) + ' nM') };
      });
      plot.innerHTML = VL.plot({ id: 'sg', w: 700, h: 330, label: 'Sensorgrams', x: { min: 0, max: tA + tD, label: 'time (s): injection 0–180 s, then buffer' }, y: { min: 0, max: Rmax * 1.08, label: 'response (RU)' }, series: series, vlines: [{ x: tA, color: C.text3, label: 'end of injection' }], legend: true, legendX: 470, legendY: 24 });
      var Da = ka * Rmax / km;
      read.innerHTML = '<div><b>' + VL.sci(KD, 2) + ' M</b><span>K_D = k_d / k_a</span></div><div><b>' + (Math.LN2 / kd >= 60 ? (Math.LN2 / kd / 60).toPrecision(3) + ' min' : (Math.LN2 / kd).toPrecision(3) + ' s') + '</b><span>half-life of the complex, ln 2 / k_d</span></div><div><b>' + Da.toFixed(2) + '</b><span>k_a R_max / k_m: ' + (Da > 1 ? 'mass-transport limited — curves straighten; lower R_max or raise the flow' : 'reaction limited — kinetics can be fitted') + '</span></div>';
    };
    var kas = VL.slider(ctl, { label: 'k_a (log₁₀ M⁻¹s⁻¹)', min: 3, max: 7, step: 0.05, value: 5.5, fmt: function (v) { return VL.sci(Math.pow(10, v), 2); }, on: draw });
    var kds = VL.slider(ctl, { label: 'k_d (log₁₀ s⁻¹)', min: -5, max: -1, step: 0.05, value: -3, fmt: function (v) { return VL.sci(Math.pow(10, v), 2); }, on: draw });
    var rms = VL.slider(ctl, { label: 'R_max', min: 10, max: 1000, step: 10, value: 150, fmt: function (v) { return v + ' RU'; }, on: draw });
    var kms = VL.slider(ctl, { label: 'k_m (log₁₀ RU M⁻¹s⁻¹)', min: 6, max: 10, step: 0.05, value: 8.5, fmt: function (v) { return VL.sci(Math.pow(10, v), 2); }, on: draw });
    draw();
  };

  /* ═══ how much antigen can a surface bind? ═══ */
  F.rmax = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var RL = rl.get(), MWa = mwa.get(), MWl = 150, n = 2, f = act.get() / 100, Rmax = MWa / MWl * RL * n * f, Rth = MWa / MWl * RL * n;
      var cov = RL / 1000;   // ng/mm² (1000 RU ≈ 1 ng/mm²)
      var area = 150 * 1e3 / 6.022e23 / (cov * 1e-9) * 1e12; // nm² per antibody at that surface mass (cov ng/mm²)
      var xs = VL.linspace(0, 100, 101);
      plot.innerHTML = VL.plot({ id: 'rmx', w: 700, h: 220, label: 'R_max against the active fraction', x: { min: 0, max: 100, label: 'antibodies (binding sites) still active (%)' }, y: { min: 0, max: Math.max(10, Rth * 1.05), label: 'R_max (RU)' }, series: [{ data: xs.map(function (x) { return [x, MWa / MWl * RL * n * x / 100]; }), color: C.au }], marks: [{ x: act.get(), y: Rmax, color: '#fff', label: Math.round(Rmax) + ' RU' }] });
      read.innerHTML = '<div><b>' + Math.round(Rmax) + ' RU</b><span>expected R_max = (MW_antigen / MW_antibody) × R_antibody × valency × active fraction</span></div><div><b>' + Math.round(Rth) + ' RU</b><span>if every binding site were active</span></div><div><b>' + area.toFixed(0) + ' nm²</b><span>surface area per antibody at ' + RL + ' RU (an IgG lying flat covers ≈ 120 nm², 14 × 8.5 nm)</span></div>';
    };
    var rl = VL.slider(ctl, { label: 'Antibody immobilised', min: 100, max: 15000, step: 50, value: 5000, fmt: function (v) { return v + ' RU'; }, on: draw });
    var mwa = VL.slider(ctl, { label: 'Antigen molecular weight', min: 1, max: 200, step: 1, value: 50, fmt: function (v) { return v + ' kDa'; }, on: draw });
    var act = VL.slider(ctl, { label: 'Active binding sites', min: 1, max: 100, step: 1, value: 40, fmt: function (v) { return v + ' %'; }, on: draw });
    draw();
  };
})();
