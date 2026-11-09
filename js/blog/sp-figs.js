/* Spectroscopy article — interactive figures (uses vl-core.js helpers).
   Optical constants of Au and Ag: Johnson & Christy, Phys. Rev. B 6, 4370 (1972), interpolated every 10 nm. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var NK = {"Au":[[300,1.5258,1.8878],[310,1.53,1.8927],[320,1.5396,1.8978],[330,1.4881,1.885],[340,1.48,1.8737],[350,1.4928,1.8678],[360,1.4915,1.8783],[370,1.4769,1.9009],[380,1.4622,1.9288],[390,1.4653,1.9432],[400,1.4684,1.953],[410,1.4621,1.9568],[420,1.4561,1.9541],[430,1.4503,1.9483],[440,1.4174,1.9322],[450,1.3831,1.9155],[460,1.3489,1.8851],[470,1.3148,1.8534],[480,1.2152,1.8434],[490,1.105,1.8369],[500,0.9711,1.8737],[510,0.8031,1.9729],[520,0.6351,2.0721],[530,0.5576,2.2039],[540,0.489,2.3389],[550,0.4241,2.4721],[560,0.3824,2.5938],[570,0.3406,2.7156],[580,0.2988,2.8374],[590,0.2718,2.9561],[600,0.2487,3.074],[610,0.2257,3.1919],[620,0.2048,3.3039],[630,0.1884,3.4034],[640,0.172,3.5029],[650,0.1556,3.6024],[660,0.1399,3.7015],[670,0.1377,3.7917],[680,0.1354,3.882],[690,0.1332,3.9722],[700,0.131,4.0624],[710,0.1311,4.1499],[720,0.133,4.2351],[730,0.135,4.3204],[740,0.1369,4.4056],[750,0.1388,4.4909],[760,0.1409,4.575],[770,0.1431,4.6574],[780,0.1453,4.7398],[790,0.1475,4.8223],[800,0.1497,4.9047],[810,0.1519,4.9871],[820,0.1541,5.0695],[830,0.1563,5.152],[840,0.1585,5.2344],[850,0.1607,5.3168],[860,0.1629,5.3992],[870,0.1651,5.4817],[880,0.1674,5.5641],[890,0.1696,5.6465],[900,0.1743,5.7227],[910,0.1798,5.7974],[920,0.1852,5.8721],[930,0.1907,5.9468],[940,0.1961,6.0214],[950,0.2015,6.0961],[960,0.207,6.1708],[970,0.2124,6.2455],[980,0.2178,6.3201],[990,0.2229,6.3962],[1000,0.2277,6.4731],[1010,0.2325,6.55],[1020,0.2373,6.6269],[1030,0.2421,6.7038],[1040,0.2469,6.7808],[1050,0.2517,6.8577],[1060,0.2565,6.9346],[1070,0.2613,7.0115],[1080,0.2662,7.0885],[1090,0.2711,7.1656],[1100,0.2767,7.2433],[1110,0.2822,7.3211],[1120,0.2878,7.3989],[1130,0.2933,7.4767],[1140,0.2989,7.5544],[1150,0.3044,7.6322],[1160,0.31,7.71],[1170,0.3156,7.7878],[1180,0.3211,7.8656],[1190,0.3267,7.9433],[1200,0.3322,8.0211]],"Ag":[[300,1.3453,0.9849],[310,1.145,0.6409],[320,0.8232,0.4012],[330,0.2565,0.7699],[340,0.1468,1.0709],[350,0.1144,1.3196],[360,0.0873,1.5198],[370,0.0669,1.689],[380,0.0522,1.8412],[390,0.05,1.9739],[400,0.05,2.1031],[410,0.05,2.2323],[420,0.0461,2.3478],[430,0.0403,2.4566],[440,0.04,2.5528],[450,0.04,2.6484],[460,0.0444,2.7511],[470,0.0493,2.8545],[480,0.05,2.9481],[490,0.05,3.04],[500,0.05,3.1319],[510,0.05,3.2238],[520,0.05,3.3157],[530,0.0533,3.4101],[540,0.0569,3.5047],[550,0.0596,3.5974],[560,0.0566,3.6786],[570,0.0536,3.7598],[580,0.0506,3.8409],[590,0.0523,3.9249],[600,0.0552,4.0097],[610,0.058,4.0944],[620,0.0593,4.1771],[630,0.0572,4.2554],[640,0.055,4.3337],[650,0.0528,4.412],[660,0.0507,4.4903],[670,0.0485,4.5686],[680,0.0464,4.6469],[690,0.0442,4.7252],[700,0.0421,4.8035],[710,0.0399,4.8818],[720,0.0378,4.9601],[730,0.0356,5.0384],[740,0.0334,5.1167],[750,0.0313,5.195],[760,0.0306,5.2718],[770,0.0322,5.3463],[780,0.0337,5.4208],[790,0.0352,5.4953],[800,0.0368,5.5698],[810,0.0383,5.6443],[820,0.0398,5.7188],[830,0.04,5.8004],[840,0.04,5.8829],[850,0.04,5.9655],[860,0.04,6.048],[870,0.04,6.1305],[880,0.04,6.213],[890,0.04,6.2955],[900,0.04,6.3711],[910,0.04,6.445],[920,0.04,6.519],[930,0.04,6.5929],[940,0.04,6.6668],[950,0.04,6.7407],[960,0.04,6.8146],[970,0.04,6.8885],[980,0.04,6.9624],[990,0.04,7.0383],[1000,0.04,7.1155],[1010,0.04,7.1928],[1020,0.04,7.27],[1030,0.04,7.3472],[1040,0.04,7.4244],[1050,0.04,7.5016],[1060,0.04,7.5788],[1070,0.04,7.656],[1080,0.04,7.7332],[1090,0.0408,7.8111],[1100,0.0447,7.8918],[1110,0.0486,7.9725],[1120,0.0525,8.0533],[1130,0.0564,8.134],[1140,0.0603,8.2147],[1150,0.0642,8.2954],[1160,0.0681,8.3761],[1170,0.072,8.4568],[1180,0.0759,8.5375],[1190,0.0798,8.6182],[1200,0.0837,8.6989]]};
  var nkAt = function (m, lam) { var a = NK[m]; if (lam <= a[0][0]) return [a[0][1], a[0][2]]; if (lam >= a[a.length - 1][0]) { var z = a[a.length - 1]; return [z[1], z[2]]; } var i = Math.floor((lam - a[0][0]) / 10), p = a[i], q = a[i + 1], t = (lam - p[0]) / 10; return [p[1] + t * (q[1] - p[1]), p[2] + t * (q[2] - p[2])]; };
  var epsAt = function (m, lam) { var q = nkAt(m, lam); return [q[0] * q[0] - q[1] * q[1], 2 * q[0] * q[1]]; };
  /* complex helpers */
  var cm = function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }, cd = function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  var ca = function (a, b) { return [a[0] + b[0], a[1] + b[1]]; }, cs = function (a, b) { return [a[0] - b[0], a[1] - b[1]]; }, cabs2 = function (a) { return a[0] * a[0] + a[1] * a[1]; };
  /* Mie efficiencies of a sphere (Bohren & Huffman): m = n_particle / n_medium (complex), x = 2π n_medium r / λ */
  VL.mie = function (m, x) {
    var N = Math.ceil(x + 4 * Math.cbrt(x) + 2), mx = cm(m, [x, 0]), nst = Math.max(N, Math.ceil(Math.hypot(mx[0], mx[1]))) + 16, D = [];
    D[nst] = [0, 0];
    for (var n = nst; n > 0; n--) { var nz = cd([n, 0], mx); D[n - 1] = cs(nz, cd([1, 0], ca(D[n], nz))); }
    var psi0 = Math.cos(x), psi1 = Math.sin(x), chi0 = -Math.sin(x), chi1 = Math.cos(x), qe = 0, qs = 0;
    for (n = 1; n <= N; n++) {
      var psi = (2 * n - 1) / x * psi1 - psi0, chi = (2 * n - 1) / x * chi1 - chi0, xi = [psi, -chi], xi1 = [psi1, -chi1];
      var Dm = ca(cd(D[n], m), [n / x, 0]), Dn = ca(cm(D[n], m), [n / x, 0]);
      var a = cd(cs(cm(Dm, [psi, 0]), [psi1, 0]), cs(cm(Dm, xi), xi1)), b = cd(cs(cm(Dn, [psi, 0]), [psi1, 0]), cs(cm(Dn, xi), xi1));
      qe += (2 * n + 1) * (a[0] + b[0]); qs += (2 * n + 1) * (cabs2(a) + cabs2(b));
      psi0 = psi1; psi1 = psi; chi0 = chi1; chi1 = chi;
    }
    return { ext: 2 / (x * x) * qe, sca: 2 / (x * x) * qs, abs: 2 / (x * x) * (qe - qs) };
  };
  VL.epsAt = epsAt; VL.nkAt = nkAt;

  /* ═══ the electromagnetic spectrum and what each region probes ═══ */
  F.emspec = function (fig) {
    var W = 760, H = 210, L = 20, R = 740, regs = [['γ-rays', -12, -10.5, '#7f5fbf'], ['X-rays', -10.5, -8, '#6d6ad6'], ['UV', -8, -6.4, '#5f86e6'], ['Vis', -6.4, -6.1, null], ['NIR', -6.1, -5.6, '#c45a5a'], ['Mid-IR', -5.6, -4.6, '#a8473f'], ['Far-IR / THz', -4.6, -3, '#87403d'], ['Microwave', -3, -1, '#6b4a3a'], ['Radio', -1, 1, '#5a4a3a']];
    var X = function (l) { return L + (l + 12) / 13 * (R - L); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="Electromagnetic spectrum"><defs><linearGradient id="vis" x1="0" x2="1"><stop offset="0" stop-color="#7a3cff"/><stop offset=".2" stop-color="#2f6bff"/><stop offset=".4" stop-color="#21c25b"/><stop offset=".6" stop-color="#f2e03c"/><stop offset=".8" stop-color="#ff8a1f"/><stop offset="1" stop-color="#e62b2b"/></linearGradient></defs>';
    regs.forEach(function (r) { var x0 = X(r[1]), x1 = X(r[2]); s += '<rect x="' + x0 + '" y="40" width="' + (x1 - x0) + '" height="34" fill="' + (r[3] || 'url(#vis)') + '" opacity=".9"/>'; s += '<text x="' + (x0 + x1) / 2 + '" y="' + (r[0] === 'Vis' ? 30 : 61) + '" class="pl-note" fill="' + (r[0] === 'Vis' ? '#efeaf6' : '#fff') + '" text-anchor="middle">' + r[0] + '</text>'; });
    for (var e = -12; e <= 1; e += 1) { var x = X(e); s += '<line x1="' + x + '" x2="' + x + '" y1="74" y2="80" stroke="' + C.text3 + '"/>' + (e % 2 === 0 ? '<text x="' + x + '" y="92" class="pl-tick" text-anchor="middle">10' + VL.sup(e) + ' m</text>' : ''); }
    var lab = [['electronic: UV–Vis absorption, fluorescence', -8, -5.9, C.cyan], ['vibrations: IR absorption (Raman reads them with visible light)', -6.4, -4.4, C.au], ['rotations', -4.6, -1.5, C.green]];
    lab.forEach(function (q, i) { var y = 118 + i * 30; s += '<line x1="' + X(q[1]) + '" x2="' + X(q[2]) + '" y1="' + y + '" y2="' + y + '" stroke="' + q[3] + '" stroke-width="6" stroke-linecap="round"/><text x="' + (X(q[2]) + 10) + '" y="' + (y + 4) + '" class="pl-note" fill="' + q[3] + '">' + q[0] + '</text>'; });
    VL.html(fig, s + '</svg>');
  };

  /* ═══ harmonic and Morse oscillator (HCl) ═══ */
  F.osc = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var we = 2990.9, wexe = xs.get() * 52.8, De = we * we / (4 * Math.max(wexe, 1e-6)), mu = 0.9796 * 1.66054e-27, c = 2.99792458e10, re = 1.2746;
      var k = mu * Math.pow(2 * Math.PI * c * we, 2), a = Math.sqrt(k / (2 * De * 1.98645e-23)) * 1e-10; // Å⁻¹ (De in cm⁻¹ → J)
      var rs = VL.linspace(0.75, 3.2, 240), Vh = function (r) { return 0.5 * k * Math.pow((r - re) * 1e-10, 2) / 1.98645e-23; }, Vm = function (r) { return De * Math.pow(1 - Math.exp(-a * (r - re)), 2); };
      var lev = []; for (var v = 0; v < 25; v++) { var E = we * (v + 0.5) - wexe * Math.pow(v + 0.5, 2); if (E > De || (v > 0 && E < lev[lev.length - 1])) break; lev.push(E); }
      var ymax = Math.min(De * 1.15, 45000), hl = lev.filter(function (E) { return E < ymax; }).map(function (E) { var lo = re, hi = re; for (var r = re; r > 0.6; r -= 0.002) { if (Vm(r) > E) break; lo = r; } for (r = re; r < 3.2; r += 0.002) { if (Vm(r) > E) break; hi = r; } return { x0: lo, x1: hi, y: E }; });
      var s = VL.plot({ id: 'osc', w: 700, h: 340, label: 'Potential energy of HCl', x: { min: 0.75, max: 3.2, label: 'Bond length r (Å)' }, y: { min: 0, max: ymax, label: 'Energy (cm⁻¹)' },
        series: [{ data: rs.map(function (r) { return [r, Vh(r)]; }), color: C.cyan, dash: '6 4', label: 'harmonic' }, { data: rs.map(function (r) { return [r, Vm(r)]; }), color: C.au, label: 'Morse (anharmonic)' }], legend: true, legendX: 470, legendY: 30 });
      var lines = ''; hl.forEach(function (h, i) { lines += '<g class="osc-lev" data-i="' + i + '"></g>'; });
      plot.innerHTML = s;
      var svg = plot.querySelector('svg'), pw = 700 - 62 - 18, ph = 340 - 16 - 46, fx = function (r) { return 62 + (r - 0.75) / 2.45 * pw; }, fy = function (E) { return 16 + ph - E / ymax * ph; };
      var g = ''; hl.forEach(function (h, i) { g += '<line x1="' + fx(h.x0) + '" x2="' + fx(h.x1) + '" y1="' + fy(h.y) + '" y2="' + fy(h.y) + '" stroke="' + (i < 3 ? C.text : C.text3) + '" stroke-width="' + (i < 3 ? 1.6 : 0.8) + '"/>' + (i < 4 ? '<text x="' + (fx(h.x1) + 6) + '" y="' + (fy(h.y) + 4) + '" class="pl-note" fill="' + C.text2 + '">v = ' + i + '</text>' : ''); });
      if (hl.length > 2) { var xa = fx(re) - 30; g += '<line x1="' + xa + '" x2="' + xa + '" y1="' + fy(hl[0].y) + '" y2="' + (fy(hl[1].y) + 6) + '" stroke="' + C.red + '" stroke-width="2.5" marker-end="url(#oscA)"/><line x1="' + (xa - 14) + '" x2="' + (xa - 14) + '" y1="' + fy(hl[0].y) + '" y2="' + (fy(hl[2].y) + 6) + '" stroke="' + C.violet + '" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#oscB)"/>'; }
      g += '<defs><marker id="oscA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + C.red + '"/></marker><marker id="oscB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + C.violet + '"/></marker></defs>';
      svg.insertAdjacentHTML('beforeend', g);
      var f01 = lev[1] - lev[0], f02 = lev[2] - lev[0];
      read.innerHTML = '<div><b>' + f01.toFixed(1) + ' cm⁻¹</b><span>fundamental v = 0 → 1 (red); HCl gas: 2885.9 measured</span></div><div><b>' + f02.toFixed(1) + ' cm⁻¹</b><span>first overtone v = 0 → 2 (violet), less than 2 × fundamental</span></div><div><b>' + Math.round(De) + ' cm⁻¹</b><span>well depth Dₑ (' + (De * 1.23984e-4).toFixed(2) + ' eV)</span></div><div><b>' + lev.length + '</b><span>bound vibrational levels</span></div>';
    };
    var xs = VL.slider(ctl, { label: 'Anharmonicity (× HCl)', min: 0.2, max: 2, step: 0.05, value: 1, fmt: function (v) { return v.toFixed(2) + '×'; }, on: draw });
    draw();
  };

  /* ═══ bond-stretch wavenumber from masses and stiffness ═══ */
  F.bond = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var M = { H: 1.008, D: 2.014, C: 12.0, N: 14.007, O: 15.999, Si: 28.086, S: 32.06, Cl: 35.45 };
    // typical force constants (N/m)
    var kOf = function (a, b, o) { var hy = (a === 'H' || a === 'D' || b === 'H' || b === 'D'), other = (a === 'H' || a === 'D') ? b : a;
      if (hy) return ({ C: 490, N: 640, O: 780, S: 400, Si: 270, Cl: 480, H: 570, D: 570 })[other] || 480;
      if (o === 3) return (a === 'N' || b === 'N') ? 1790 : 1560; if (o === 2) return (a === 'O' || b === 'O') ? 1200 : 960; return (a === 'S' || b === 'S' || a === 'Si' || b === 'Si') ? 300 : (a === 'O' || b === 'O') ? 500 : 450; };
    var opts = Object.keys(M).map(function (k) { return [k, k]; });
    var A = VL.select(ctl, { label: 'Atom 1', value: 'C', options: opts, on: function () { draw(); } }), B = VL.select(ctl, { label: 'Atom 2', value: 'H', options: opts, on: function () { draw(); } });
    var O = VL.select(ctl, { label: 'Bond', value: '1', options: [['1', 'single'], ['2', 'double'], ['3', 'triple']], on: function () { draw(); } });
    function draw() {
      var a = A.get(), b = B.get(), o = +O.get(), hy = /H|D/.test(a + b);
      if (hy) o = 1;
      var mu = M[a] * M[b] / (M[a] + M[b]) * 1.66054e-27, k = kOf(a, b, o), nu = Math.sqrt(k / mu) / (2 * Math.PI * 2.99792458e10);
      var W = 720, H = 150, L = 20, R = 700, X = function (v) { return L + v / 4000 * (R - L); };
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="Where a bond vibrates">';
      [[400, 1800, C.au, 'fingerprint'], [1800, 2800, C.violet, 'silent region'], [2800, 3700, C.cyan, 'X–H stretches']].forEach(function (r) { s += '<rect x="' + X(r[0]) + '" y="30" width="' + (X(r[1]) - X(r[0])) + '" height="60" fill="' + r[2] + '" opacity=".14"/><text x="' + (X(r[0]) + X(r[1])) / 2 + '" y="24" class="pl-band">' + r[3] + '</text>'; });
      for (var v = 0; v <= 4000; v += 500) s += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="90" y2="96" stroke="' + C.text3 + '"/><text x="' + X(v) + '" y="110" class="pl-tick" text-anchor="middle">' + v + '</text>';
      s += '<text x="' + (L + R) / 2 + '" y="134" class="pl-label" text-anchor="middle">Wavenumber (cm⁻¹)</text>';
      var refs = [['C–C', 1100], ['C=C', 1650], ['C=O', 1720], ['C≡C', 2150], ['C≡N', 2250], ['C–D', 2200], ['C–H', 2950], ['O–H', 3400]];
      refs.forEach(function (r, i) { s += '<line x1="' + X(r[1]) + '" x2="' + X(r[1]) + '" y1="' + (80 - (i % 3) * 14) + '" y2="90" stroke="' + C.text3 + '"/><text x="' + X(r[1]) + '" y="' + (76 - (i % 3) * 14) + '" class="pl-tick" text-anchor="middle">' + r[0] + '</text>'; });
      s += '<line x1="' + X(nu) + '" x2="' + X(nu) + '" y1="30" y2="90" stroke="' + C.red + '" stroke-width="3"/><circle cx="' + X(nu) + '" cy="40" r="5" fill="' + C.red + '"/>';
      plot.innerHTML = s + '</svg>';
      var region = nu < 1800 ? 'fingerprint region' : nu < 2800 ? 'silent region' : 'high-wavenumber (X–H) region';
      read.innerHTML = '<div><b>' + Math.round(nu) + ' cm⁻¹</b><span>' + a + (o === 3 ? '≡' : o === 2 ? '=' : '–') + b + ' stretch (harmonic estimate)</span></div><div><b>' + (mu / 1.66054e-27).toFixed(3) + ' u</b><span>reduced mass μ</span></div><div><b>' + k + ' N/m</b><span>typical force constant k</span></div><div><b>' + region + '</b><span>where it lands</span></div>';
    }
    draw();
  };

  /* ═══ normal modes, animated ═══ */
  F.modes = function (fig) {
    var W = 700, H = 300, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), t = 0;
    // atoms: [x, y, mass label, radius, colour]; modes: displacement [dx, dy, dz(out of plane)] per atom
    var MOL = {
      h2o: { name: 'H₂O', atoms: [[0, -10, 'O', 18, '#e2566e'], [-46, 26, 'H', 11, '#efeaf6'], [46, 26, 'H', 11, '#efeaf6']], bonds: [[0, 1], [0, 2]], modes: [
        ['Symmetric stretch', 3657, true, true, [[0, -0.12, 0], [-0.6, 0.48, 0], [0.6, 0.48, 0]]], ['Antisymmetric stretch', 3756, true, true, [[0.1, 0, 0], [-0.6, 0.47, 0], [-0.6, -0.47, 0]]], ['Bend (scissoring)', 1595, true, true, [[0, -0.15, 0], [0.5, 0.62, 0], [-0.5, 0.62, 0]]]] },
      co2: { name: 'CO₂', atoms: [[-62, 0, 'O', 17, '#e2566e'], [0, 0, 'C', 15, '#9a93a8'], [62, 0, 'O', 17, '#e2566e']], bonds: [[0, 1], [1, 2]], modes: [
        ['Symmetric stretch', 1333, false, true, [[-1, 0, 0], [0, 0, 0], [1, 0, 0]]], ['Antisymmetric stretch', 2349, true, false, [[0.7, 0, 0], [-0.9, 0, 0], [0.7, 0, 0]]], ['Bend (doubly degenerate)', 667, true, false, [[0, 0.6, 0], [0, -0.8, 0], [0, 0.6, 0]]]] },
      ch2: { name: 'CH₂ group', atoms: [[0, 0, 'C', 16, '#9a93a8'], [-40, -34, 'H', 10, '#efeaf6'], [40, -34, 'H', 10, '#efeaf6'], [-62, 28, 'R', 12, '#5a4b80'], [62, 28, 'R', 12, '#5a4b80']], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]], modes: [
        ['Symmetric stretch', 2850, true, true, [[0, 0.1, 0], [-0.55, -0.5, 0], [0.55, -0.5, 0], [0, 0, 0], [0, 0, 0]]], ['Antisymmetric stretch', 2920, true, true, [[0.06, 0, 0], [-0.55, -0.47, 0], [-0.55, 0.47, 0], [0, 0, 0], [0, 0, 0]]],
        ['Scissoring', 1465, true, true, [[0, 0, 0], [0.5, -0.4, 0], [-0.5, -0.4, 0], [0, 0, 0], [0, 0, 0]]], ['Rocking', 720, true, true, [[0, 0, 0], [0.6, -0.5, 0], [0.6, 0.5, 0], [0, 0, 0], [0, 0, 0]]],
        ['Wagging (out of plane)', 1350, true, true, [[0, 0, 0], [0, 0, 1], [0, 0, 1], [0, 0, 0], [0, 0, 0]]], ['Twisting (out of plane)', 1300, false, true, [[0, 0, 0], [0, 0, 1], [0, 0, -1], [0, 0, 0], [0, 0, 0]]]] }
    };
    var mol = VL.select(ctl, { label: 'Molecule', value: 'co2', options: [['co2', 'CO₂ (linear: 3N − 5 = 4 modes)'], ['h2o', 'H₂O (bent: 3N − 6 = 3 modes)'], ['ch2', 'CH₂ group in a chain (6 motions)']], on: function () { fill(); } });
    var modeSel = VL.select(ctl, { label: 'Mode', value: '0', options: [['0', '']], on: function () {} });
    function fill() { var m = MOL[mol.get()]; modeSel.el.innerHTML = m.modes.map(function (q, i) { return '<option value="' + i + '">' + q[0] + '</option>'; }).join(''); modeSel.el.value = '0'; }
    fill();
    function step(dt) {
      t += dt; var m = MOL[mol.get()], md = m.modes[+modeSel.get()] || m.modes[0], amp = 16, ph = Math.sin(t * 2 * Math.PI * 0.9), cx = W / 2, cy = H / 2 + 6;
      g.clearRect(0, 0, W, H); g.fillStyle = '#120c1e'; g.fillRect(0, 0, W, H);
      var pos = m.atoms.map(function (a, i) { var d = md[4][i]; return [cx + a[0] * 1.6 + amp * d[0] * ph, cy + a[1] * 1.6 + amp * d[1] * ph, d[2] * ph]; });
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 5; m.bonds.forEach(function (b) { g.beginPath(); g.moveTo(pos[b[0]][0], pos[b[0]][1]); g.lineTo(pos[b[1]][0], pos[b[1]][1]); g.stroke(); });
      m.atoms.forEach(function (a, i) {
        var p = pos[i], r = a[3] * (1 + 0.25 * p[2]);
        g.fillStyle = a[4]; g.beginPath(); g.arc(p[0], p[1], r, 0, 6.283); g.fill();
        g.fillStyle = '#120c1e'; g.font = '600 12px IBM Plex Mono, monospace'; g.textAlign = 'center'; g.fillText(a[2], p[0], p[1] + 4);
        var d = md[4][i];
        if (Math.abs(d[2]) > 0) { g.fillStyle = C.au; g.font = '14px IBM Plex Mono'; g.fillText(p[2] > 0 ? '⊙' : '⊗', p[0] + r + 10, p[1] - r); }
        else if (Math.hypot(d[0], d[1]) > 0.05) { var x0 = cx + a[0] * 1.6, y0 = cy + a[1] * 1.6; g.strokeStyle = C.au; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + d[0] * 40, y0 + d[1] * 40); g.stroke(); g.beginPath(); var an = Math.atan2(d[1], d[0]); g.moveTo(x0 + d[0] * 40, y0 + d[1] * 40); g.lineTo(x0 + d[0] * 40 - 7 * Math.cos(an - 0.4), y0 + d[1] * 40 - 7 * Math.sin(an - 0.4)); g.lineTo(x0 + d[0] * 40 - 7 * Math.cos(an + 0.4), y0 + d[1] * 40 - 7 * Math.sin(an + 0.4)); g.closePath(); g.fillStyle = C.au; g.fill(); }
      });
      g.textAlign = 'left'; g.fillStyle = C.text2; g.font = '12px IBM Plex Mono, monospace'; g.fillText(m.name + ' · ' + md[0], 14, 22);
      read.innerHTML = '<div><b>≈ ' + md[1] + ' cm⁻¹</b><span>wavenumber' + (mol.get() === 'ch2' ? ' (typical, in a hydrocarbon chain)' : ' (gas phase)') + '</span></div><div><b style="color:' + (md[2] ? C.green : C.red) + '">' + (md[2] ? 'IR active' : 'IR inactive') + '</b><span>dipole moment changes?</span></div><div><b style="color:' + (md[3] ? C.green : C.red) + '">' + (md[3] ? 'Raman active' : 'Raman inactive') + '</b><span>polarisability changes?</span></div>';
    }
    var lp = VL.loop(fig, step); VL.playButton(ctl, lp);
  };

  /* ═══ classical Raman: an oscillating polarisability mixes frequencies ═══ */
  F.mix = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot');
    var draw = function () {
      var r = rs.get(), w = ws.get(), ts = VL.linspace(0, 6, 600), wl = 2 * Math.PI * 4, wv = wl * w;
      var E = ts.map(function (t) { return [t, Math.cos(wl * t) + 5]; }), al = ts.map(function (t) { return [t, 1 + r * Math.cos(wv * t) + 2.4]; }), mu = ts.map(function (t) { return [t, (1 + r * Math.cos(wv * t)) * Math.cos(wl * t) - 0.4]; });
      var s1 = VL.plot({ id: 'mix1', w: 700, h: 300, label: 'Induced dipole', x: { min: 0, max: 6, label: 'time (periods of the vibration ÷ ' + (4 * w).toFixed(2) + ')' }, y: { min: -2.6, max: 9.2, label: '' },
        series: [{ data: E, color: C.cyan, label: 'E(t): the light, ω₀' }, { data: al, color: C.au, label: 'α(t) = α₀ + α′Q₀ cos ω_v t' }, { data: mu, color: C.red, label: 'μ(t) = α(t)E(t)' }], legend: true, legendX: 14, legendY: 16 });
      var lines = [[1 - w, r / 2, 'Stokes ω₀ − ω_v', C.red], [1, 1, 'Rayleigh ω₀', C.cyan], [1 + w, r / 2, 'anti-Stokes ω₀ + ω_v', C.violet]];
      var W = 700, H = 170, L = 60, R = 680, X = function (v) { return L + (v - 0.4) / 1.2 * (R - L); }, Y = function (a) { return 140 - a * 110; };
      var s2 = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="Frequencies in the scattered light"><line x1="' + L + '" x2="' + R + '" y1="140" y2="140" stroke="' + C.axis + '"/>';
      lines.forEach(function (l) { s2 += '<line x1="' + X(l[0]) + '" x2="' + X(l[0]) + '" y1="140" y2="' + Y(l[1]) + '" stroke="' + l[3] + '" stroke-width="4"/><text x="' + X(l[0]) + '" y="' + (Y(l[1]) - 8) + '" class="pl-note" fill="' + l[3] + '" text-anchor="middle">' + l[2] + '</text>'; });
      s2 += '<text x="' + (L + R) / 2 + '" y="162" class="pl-label" text-anchor="middle">frequency of the scattered light (÷ ω₀); amplitudes: α₀E₀ and α′Q₀E₀/2</text></svg>';
      plot.innerHTML = s1 + s2;
    };
    var rs = VL.slider(ctl, { label: 'α′Q₀ / α₀', min: 0, max: 0.6, step: 0.01, value: 0.35, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var ws = VL.slider(ctl, { label: 'ω_v / ω₀', min: 0.08, max: 0.45, step: 0.01, value: 0.2, fmt: function (v) { return v.toFixed(2); }, on: draw });
    draw();
  };

  /* ═══ anti-Stokes / Stokes ratio ═══ */
  F.ratio = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var T = ts.get(), l0 = +ls.get(), n0 = 1e7 / l0, sh = VL.linspace(50, 3200, 160);
      var ratio = function (v) { return Math.pow((n0 + v) / (n0 - v), 4) * Math.exp(-1.4388 * v / T); };
      plot.innerHTML = VL.plot({ id: 'ratio', w: 700, h: 300, label: 'anti-Stokes to Stokes ratio', x: { min: 50, max: 3200, label: 'Raman shift (cm⁻¹)' }, y: { min: 1e-7, max: 2, log: true, label: 'I(anti-Stokes) / I(Stokes)' },
        series: [{ data: sh.map(function (v) { return [v, ratio(v)]; }), color: C.au, label: T + ' K' }, { data: sh.map(function (v) { return [v, ratio(v) * Math.exp(1.4388 * v / T - 1.4388 * v / 77)]; }), color: C.cyan, dash: '5 4', label: '77 K' }],
        marks: [{ x: 520.7, y: ratio(520.7), color: C.red, label: 'Si 520.7 cm⁻¹' }, { x: 1003, y: ratio(1003), color: C.green, label: 'Phe 1003' }], legend: true, legendX: 470, legendY: 30 });
      read.innerHTML = '<div><b>' + ratio(520.7).toFixed(3) + '</b><span>silicon line, ' + T + ' K</span></div><div><b>' + VL.sci(ratio(1003), 2) + '</b><span>1003 cm⁻¹ (phenylalanine)</span></div><div><b>' + VL.sci(ratio(2930), 2) + '</b><span>2930 cm⁻¹ (C–H)</span></div>';
    };
    var ts = VL.slider(ctl, { label: 'Temperature', min: 77, max: 900, step: 1, value: 295, fmt: function (v) { return v + ' K'; }, on: draw });
    var ls = VL.select(ctl, { label: 'Laser', value: '532', options: [['532', '532 nm'], ['633', '633 nm'], ['785', '785 nm']], on: draw });
    draw();
  };

  /* ═══ FTIR: from interferogram to spectrum ═══ */
  F.ftir = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var lines = [[1655, 0.8, 12], [1545, 0.55, 12], [1740, 0.45, 8], [2925, 0.6, 15], [2855, 0.45, 10], [1080, 0.5, 14]];
    var B = function (v) { var s = 0.05; lines.forEach(function (l) { s += l[1] * Math.exp(-Math.pow((v - l[0]) / l[2], 2)); }); return s; };
    var draw = function () {
      var opd = os.get() / 10, nd = 1600, ds = VL.linspace(0, opd, nd), vs = VL.linspace(800, 3200, 1201);
      var I = ds.map(function (dl) { var s = 0; for (var k = 0; k < vs.length; k += 2) s += B(vs[k]) * Math.cos(2 * Math.PI * vs[k] * dl); return s; });
      var spec = VL.linspace(800, 3200, 600).map(function (v) { var s = 0; for (var i = 0; i < nd; i++) { var w = 0.5 + 0.5 * Math.cos(Math.PI * i / nd); s += I[i] * w * Math.cos(2 * Math.PI * v * ds[i]) * (i === 0 ? 0.5 : 1); } return [v, s]; });
      var mx = Math.max.apply(null, spec.map(function (p) { return p[1]; })), Im = Math.max.apply(null, I.map(Math.abs));
      plot.innerHTML = VL.plot({ id: 'ftA', w: 700, h: 220, label: 'Interferogram', x: { min: 0, max: opd * 10, label: 'Mirror path difference δ (mm)' }, y: { min: -1.05, max: 1.05, label: 'signal' }, series: [{ data: ds.map(function (dl, i) { return [dl * 10, I[i] / Im]; }), color: C.cyan, width: 1 }] }) +
        VL.plot({ id: 'ftB', w: 700, h: 240, label: 'Recovered spectrum', x: { min: 800, max: 3200, label: 'Wavenumber (cm⁻¹)' }, y: { min: -0.1, max: 1.1, label: 'absorbance (norm.)' }, series: [{ data: vs.map(function (v) { return [v, B(v) / 0.85]; }), color: C.text3, dash: '3 3', label: 'true' }, { data: spec.map(function (p) { return [p[0], p[1] / mx]; }), color: C.au, label: 'Fourier transform' }], legend: true, legendX: 470, legendY: 20 });
      read.innerHTML = '<div><b>' + (1 / opd).toFixed(1) + ' cm⁻¹</b><span>resolution ≈ 1 / δ_max</span></div><div><b>' + (opd * 10).toFixed(2) + ' mm</b><span>maximum path difference</span></div>';
    };
    var os = VL.slider(ctl, { label: 'Maximum mirror path difference', min: 0.05, max: 2, step: 0.01, value: 0.5, fmt: function (v) { return v.toFixed(2) + ' mm'; }, on: draw });
    draw();
  };

  /* ═══ a biological Raman spectrum, built from its bands ═══ */
  var BANDS = {
    lipid: { name: 'Lipids', col: '#e0a82e', b: [[719, .25, 6, 'choline C–N'], [1065, .35, 10, 'C–C str.'], [1080, .3, 10, ''], [1128, .4, 8, 'C–C str. (trans)'], [1265, .4, 14, '=C–H bend'], [1300, .65, 10, 'CH₂ twist'], [1440, .9, 14, 'CH₂ scissor'], [1658, .55, 12, 'C=C str.'], [1745, .2, 10, 'C=O ester'], [2850, 1.4, 12, 'CH₂ sym. str.'], [2885, 1.1, 14, 'CH₂ asym. str.'], [3010, .3, 12, '=C–H str.']] },
    protein: { name: 'Proteins', col: '#45bfd6', b: [[621, .12, 6, 'Phe'], [644, .14, 6, 'Tyr'], [759, .25, 8, 'Trp'], [828, .15, 8, 'Tyr'], [853, .2, 8, 'Tyr'], [938, .25, 14, 'C–C α-helix'], [1003, .9, 5, 'Phe ring breathing'], [1031, .25, 6, 'Phe'], [1250, .35, 20, 'amide III'], [1340, .35, 12, 'CH wag'], [1450, .6, 14, 'CH₂/CH₃ def.'], [1606, .2, 8, 'Phe/Tyr'], [1658, .7, 16, 'amide I'], [2935, 1.5, 22, 'CH₃ str.']] },
    dna: { name: 'DNA / RNA', col: '#a98bf0', b: [[728, .35, 8, 'adenine'], [785, .7, 8, 'O–P–O + cytosine/uracil'], [1095, .55, 10, 'PO₂⁻ sym. str.'], [1340, .35, 10, 'A, G'], [1375, .2, 8, 'T, A, G'], [1490, .25, 10, 'G, A'], [1578, .5, 10, 'G, A ring']] },
    sugar: { name: 'Carbohydrates', col: '#7fd18b', b: [[480, .4, 14, 'glycogen'], [850, .25, 12, 'C–O–C'], [940, .25, 14, 'C–O–C'], [1085, .45, 18, 'C–O str.'], [1125, .4, 14, 'C–O / C–C']] },
    carot: { name: 'Carotenoids', col: '#ff8a3d', b: [[1007, .4, 6, 'C–CH₃'], [1157, 1.0, 7, 'C–C str.'], [1525, 1.3, 9, 'C=C str.']] },
    water: { name: 'Water', col: '#5f86e6', b: [[1640, .12, 45, 'H–O–H bend'], [3250, 1.0, 110, 'O–H str.'], [3420, 1.0, 120, 'O–H str.']] },
    tag: { name: 'Alkyne tag (silent region)', col: '#e2566e', b: [[2125, .9, 8, 'C≡C str.']] }
  };
  F.bio = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), on = { lipid: true, protein: true, dna: true, sugar: false, carot: false, water: false, tag: false };
    Object.keys(BANDS).forEach(function (k) { var lab = document.createElement('label'); lab.className = 'vl-ctl'; lab.style.flex = '0 0 auto'; lab.innerHTML = '<input type="checkbox"' + (on[k] ? ' checked' : '') + '> <span class="vl-ctl-name" style="color:' + BANDS[k].col + '">' + BANDS[k].name + '</span>'; lab.querySelector('input').onchange = function (e) { on[k] = e.target.checked; draw(); }; ctl.appendChild(lab); });
    var lor = function (x, c, w) { return 1 / (1 + Math.pow((x - c) / w, 2)); };
    function draw() {
      var xs = VL.linspace(400, 3600, 1400), keys = Object.keys(BANDS).filter(function (k) { return on[k]; });
      var comp = keys.map(function (k) { return xs.map(function (x) { var s = 0; BANDS[k].b.forEach(function (b) { s += b[1] * lor(x, b[0], b[2]); }); return s; }); });
      var tot = xs.map(function (x, i) { var s = 0; comp.forEach(function (c) { s += c[i]; }); return s; }), mx = Math.max.apply(null, tot.concat([0.5]));
      var series = keys.map(function (k, j) { return { data: xs.map(function (x, i) { return [x, comp[j][i] / mx]; }), color: BANDS[k].col, width: 1.2 }; }).concat([{ data: xs.map(function (x, i) { return [x, tot[i] / mx]; }), color: '#efeaf6', width: 1.8 }]);
      var s = VL.plot({ id: 'bio', w: 760, h: 380, label: 'Composite Raman spectrum', m: { l: 50, r: 16, t: 26, b: 46 }, x: { min: 400, max: 3600, label: 'Raman shift (cm⁻¹)' }, y: { min: 0, max: 1.18, label: 'intensity (normalised)' }, series: series,
        bands: [{ x0: 400, x1: 1800, color: C.au, op: .06, label: 'fingerprint' }, { x0: 1800, x1: 2800, color: C.violet, op: .1, label: 'silent region' }, { x0: 2800, x1: 3600, color: C.cyan, op: .06, label: 'high wavenumber' }] });
      plot.innerHTML = s;
      var svg = plot.querySelector('svg'), fx = function (x) { return 50 + (x - 400) / 3200 * (760 - 66); }, fy = function (v) { return 26 + (380 - 72) * (1 - v / 1.18); };
      var labs = [];
      keys.forEach(function (k) { BANDS[k].b.forEach(function (b) { if (!b[3]) return; var i = Math.round((b[0] - 400) / 3200 * 1399), v = tot[i] / mx; if (b[1] / mx < 0.18) return; labs.push({ x: b[0], v: v, t: b[0] + ' ' + b[3], c: BANDS[k].col }); }); });
      labs.sort(function (a, b) { return b.v - a.v; });
      var placed = [], g = '';
      labs.forEach(function (l) { var x = fx(l.x); if (placed.some(function (p) { return Math.abs(p - x) < 15; })) return; placed.push(x); g += '<text transform="translate(' + (x + 3) + ' ' + Math.max(40, fy(l.v) - 6) + ') rotate(-62)" class="pl-note" fill="' + l.c + '" style="font-size:9.5px">' + l.t + '</text>'; });
      svg.insertAdjacentHTML('beforeend', g);
    }
    draw();
  };

  /* ═══ metals: permittivity, measured and Drude ═══ */
  F.drude = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var DR = { Au: { einf: 9.5, wp: 9.0, g: 0.07 }, Ag: { einf: 4.0, wp: 9.2, g: 0.03 } };
    var draw = function () {
      var m = ms.get(), p = DR[m], ls = VL.linspace(300, 1200, 181);
      var dr = function (lam) { var w = 1239.84 / lam, d = w * w + p.g * p.g; return [p.einf - p.wp * p.wp / d, p.wp * p.wp * p.g / (w * d)]; };
      var e = ls.map(function (l) { return epsAt(m, l); });
      plot.innerHTML = VL.plot({ id: 'drR', w: 700, h: 260, label: 'Real part of permittivity', x: { min: 300, max: 1200, label: 'Wavelength (nm)' }, y: { min: -70, max: 10, label: 'Re ε' },
        series: [{ data: ls.map(function (l, i) { return [l, e[i][0]]; }), color: C.au, label: m + ' measured (Johnson & Christy)' }, { data: ls.map(function (l) { return [l, dr(l)[0]]; }), color: C.cyan, dash: '6 4', label: 'Drude model' }],
        hlines: [{ y: -2 * 1.77, color: C.red, label: 'Re ε = −2 ε_d (water): sphere resonance', dash: '3 3' }], legend: true, legendX: 20, legendY: 150 }) +
        VL.plot({ id: 'drI', w: 700, h: 220, label: 'Imaginary part of permittivity', x: { min: 300, max: 1200, label: 'Wavelength (nm)' }, y: { min: 0, max: 8, label: 'Im ε (losses)' },
        series: [{ data: ls.map(function (l, i) { return [l, e[i][1]]; }), color: C.au, label: 'measured' }, { data: ls.map(function (l) { return [l, dr(l)[1]]; }), color: C.cyan, dash: '6 4', label: 'Drude (free electrons only)' }],
        bands: m === 'Au' ? [{ x0: 300, x1: 520, color: C.red, op: .1, label: 'interband' }] : [{ x0: 300, x1: 330, color: C.red, op: .1, label: '' }], legend: true, legendX: 430, legendY: 20 });
      var r = 0, best = 1e9; ls.forEach(function (l, i) { var dd = Math.abs(e[i][0] + 2 * 1.77); if (dd < best) { best = dd; r = l; } });
      read.innerHTML = '<div><b>' + p.wp + ' eV</b><span>plasma energy ħωp (≈ ' + Math.round(1239.84 / p.wp) + ' nm)</span></div><div><b>' + r + ' nm</b><span>where Re ε = −2 × 1.77 (small sphere in water)</span></div><div><b>' + p.g + ' eV</b><span>damping ħγ of the Drude fit</span></div>';
    };
    var ms = VL.select(ctl, { label: 'Metal', value: 'Au', options: [['Au', 'Gold'], ['Ag', 'Silver']], on: draw });
    draw();
  };

  /* ═══ surface plasmon polaritons: dispersion and prism coupling ═══ */
  F.spp = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var ed = es.get(), np = ns.get(), th = as.get() * Math.PI / 180, ws = VL.linspace(0.01, 0.999 / Math.sqrt(1 + ed), 300);
      var kspp = function (w) { var em = 1 - 1 / (w * w); return w * Math.sqrt(em * ed / (em + ed)); };
      var spp = ws.map(function (w) { return [kspp(w), w]; }).filter(function (p) { return isFinite(p[0]) && p[0] < 3.5; });
      var kx = np * Math.sin(th), wsp = 1 / Math.sqrt(1 + ed), cross = null;
      for (var i = 1; i < ws.length; i++) { var a = kspp(ws[i - 1]) - kx * ws[i - 1], b = kspp(ws[i]) - kx * ws[i]; if (a * b <= 0 && isFinite(a) && isFinite(b)) { cross = ws[i]; break; } }
      plot.innerHTML = VL.plot({ id: 'spp', w: 700, h: 340, label: 'Surface plasmon dispersion', x: { min: 0, max: 3, label: 'In-plane wavevector  c k∥ / ωp' }, y: { min: 0, max: 0.8, label: 'Frequency ω / ωp' },
        series: [{ data: spp, color: C.au, label: 'surface plasmon' }, { data: [[0, 0], [3, 3 / Math.sqrt(ed)]], color: C.text3, dash: '4 4', label: 'light in the dielectric' }, { data: [[0, 0], [3, 3 / kx]], color: C.cyan, label: 'light through the prism at θ' }],
        hlines: [{ y: wsp, color: C.red, label: 'ω_sp = ωp / √(1 + ε_d)', dash: '3 3' }], marks: cross ? [{ x: kspp(cross), y: cross, color: '#fff', label: 'coupling' }] : [], legend: true, legendX: 380, legendY: 200 });
      read.innerHTML = '<div><b>' + (cross ? (138 / cross).toFixed(0) + ' nm' : 'no crossing') + '</b><span>wavelength that couples (for ħωp ≈ 9 eV, free-electron metal)</span></div><div><b>' + kx.toFixed(3) + '</b><span>n_p sin θ</span></div><div><b>' + Math.sqrt(ed).toFixed(3) + '</b><span>n_d: without the prism, light never reaches the plasmon</span></div>';
    };
    var es = VL.slider(ctl, { label: 'Dielectric ε_d (sensing medium)', min: 1, max: 2.25, step: 0.01, value: 1.77, fmt: function (v) { return v.toFixed(2) + ' (n = ' + Math.sqrt(v).toFixed(3) + ')'; }, on: function () { draw(); } });
    var ns = VL.slider(ctl, { label: 'Prism index n_p', min: 1.4, max: 1.9, step: 0.01, value: 1.52, fmt: function (v) { return v.toFixed(2); }, on: function () { draw(); } });
    var as = VL.slider(ctl, { label: 'Angle θ', min: 40, max: 89, step: 0.1, value: 72, fmt: function (v) { return v.toFixed(1) + '°'; }, on: function () { draw(); } });
    draw();
  };

  /* ═══ Mie spectra of gold and silver spheres ═══ */
  F.mie = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var m = ms.get(), D = ds.get(), nm = ns.get(), ls = VL.linspace(300, 1000, 281), q = ls.map(function (l) { var k = nkAt(m, l); return VL.mie([k[0] / nm, k[1] / nm], 2 * Math.PI * nm * D / 2 / l); });
      var mx = Math.max.apply(null, q.map(function (v) { return v.ext; })), ip = q.map(function (v) { return v.ext; }).indexOf(mx);
      plot.innerHTML = VL.plot({ id: 'mie', w: 700, h: 320, label: 'Mie efficiencies', x: { min: 300, max: 1000, label: 'Wavelength (nm)' }, y: { min: 0, max: Math.max(1, mx * 1.1), label: 'Efficiency Q = C / πR²' },
        series: [{ data: ls.map(function (l, i) { return [l, q[i].ext]; }), color: C.au, label: 'extinction' }, { data: ls.map(function (l, i) { return [l, q[i].sca]; }), color: C.cyan, label: 'scattering' }, { data: ls.map(function (l, i) { return [l, q[i].abs]; }), color: C.red, dash: '5 4', label: 'absorption' }],
        vlines: [{ x: ls[ip], color: '#fff', label: ls[ip] + ' nm' }], legend: true, legendX: 470, legendY: 24 });
      read.innerHTML = '<div><b>' + ls[ip] + ' nm</b><span>extinction peak (localized surface plasmon)</span></div><div><b>' + (q[ip].sca / q[ip].ext * 100).toFixed(0) + ' %</b><span>of the extinction is scattering at the peak</span></div><div><b>' + mx.toFixed(2) + '</b><span>Q_ext: the particle removes light from ' + mx.toFixed(1) + '× its own cross-section</span></div>';
    };
    var ms = VL.select(ctl, { label: 'Metal', value: 'Au', options: [['Au', 'Gold'], ['Ag', 'Silver']], on: draw });
    var ds = VL.slider(ctl, { label: 'Diameter', min: 5, max: 200, step: 1, value: 40, fmt: function (v) { return v + ' nm'; }, on: draw });
    var ns = VL.slider(ctl, { label: 'Medium index', min: 1, max: 1.7, step: 0.01, value: 1.33, fmt: function (v) { return v.toFixed(2); }, on: draw });
    draw();
  };

  /* ═══ near field of a small sphere ═══ */
  F.near = function (fig) {
    var W = 680, H = 400, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var m = ms.get(), lam = ls.get(), em = 1.33 * 1.33, e = epsAt(m, lam), gq = cd(cs(e, [em, 0]), ca(e, [2 * em, 0])), R = 120, cx = W / 2, cy = H / 2;
      var img = g.createImageData(W, H), mx = cabs2(ca([1, 0], [2 * gq[0], 2 * gq[1]]));
      var INF = [[0, 0, 4], [27, 12, 65], [74, 12, 107], [120, 28, 109], [165, 44, 96], [207, 68, 70], [237, 105, 37], [251, 155, 6], [247, 209, 61], [252, 255, 164]];
      var col = function (v) { var t = Math.max(0, Math.min(1, v)) * 9, i = Math.min(8, Math.floor(t)), u = t - i, a = INF[i], b = INF[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; };
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var X = (x - cx) / R, Y = (cy - y) / R, r2 = X * X + Y * Y, o = (y * W + x) * 4, c;
        if (r2 < 1) { c = m === 'Au' ? [201, 162, 39] : [190, 195, 205]; }
        else { var r = Math.sqrt(r2), ct = Y / r, k = 1 / (r2 * r), Ez = [1 + gq[0] * k * (3 * ct * ct - 1), gq[1] * k * (3 * ct * ct - 1)], Ex = [gq[0] * k * 3 * ct * (X / r), gq[1] * k * 3 * ct * (X / r)]; var I = cabs2(Ez) + cabs2(Ex); c = col(Math.log10(Math.max(I, 0.01)) / Math.log10(Math.max(mx, 10)) * 0.95 + 0.05); }
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, H - 30); g.lineTo(40, H - 90); g.stroke(); g.beginPath(); g.moveTo(40, H - 96); g.lineTo(34, H - 84); g.lineTo(46, H - 84); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.font = '12px IBM Plex Mono'; g.fillText('E₀', 50, H - 60);
      read.innerHTML = '<div><b>' + mx.toFixed(1) + '</b><span>|E|²/|E₀|² at the poles = |1 + 2g|²</span></div><div><b>' + VL.sci(mx * mx, 2) + '</b><span>|E|⁴ — the SERS enhancement there</span></div><div><b>' + 'g = ' + gq[0].toFixed(2) + (gq[1] >= 0 ? ' + ' : ' − ') + Math.abs(gq[1]).toFixed(2) + 'i</b><span>(ε − ε_d)/(ε + 2ε_d)</span></div>';
    };
    var ms = VL.select(ctl, { label: 'Metal', value: 'Au', options: [['Au', 'Gold'], ['Ag', 'Silver']], on: draw });
    var ls = VL.slider(ctl, { label: 'Wavelength', min: 350, max: 900, step: 1, value: 520, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ SERS: enhancement against distance and against wavelength ═══ */
  F.sers = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var em = 1.33 * 1.33;
    var E2 = function (m, lam, R, dd) { var e = epsAt(m, lam), gq = cd(cs(e, [em, 0]), ca(e, [2 * em, 0])), f = Math.pow(R / (R + dd), 3); return cabs2([1 + 2 * gq[0] * f, 2 * gq[1] * f]); };
    var draw = function () {
      var m = ms.get(), R = 20, sh = ss.get(), l0 = ls.get(), lr = 1 / (1 / l0 - sh * 1e-7), lams = VL.linspace(350, 900, 221), dds = VL.linspace(0, 20, 120);
      var ef = function (lam) { var lR = 1 / (1 / lam - sh * 1e-7); return E2(m, lam, R, 0) * E2(m, lR, R, 0); };
      plot.innerHTML = VL.plot({ id: 'sersA', w: 700, h: 260, label: 'SERS enhancement against excitation', x: { min: 350, max: 900, label: 'Excitation wavelength (nm)' }, y: { min: 1, max: 1e6, log: true, label: 'enhancement at the surface' },
        series: [{ data: lams.map(function (l) { return [l, E2(m, l, R, 0)]; }), color: C.cyan, dash: '5 4', label: '|E(λ)|²' }, { data: lams.map(function (l) { return [l, ef(l)]; }), color: C.au, label: '|E(λ)|² |E(λ_R)|²' }], vlines: [{ x: l0, color: '#fff', label: l0 + ' nm' }], legend: true, legendX: 460, legendY: 24 }) +
        VL.plot({ id: 'sersB', w: 700, h: 240, label: 'SERS enhancement against distance', x: { min: 0, max: 20, label: 'Distance of the molecule from the surface d (nm), 40 nm sphere' }, y: { min: 1, max: Math.max(10, ef(l0) * 2), log: true, label: 'enhancement' },
        series: [{ data: dds.map(function (dd) { return [dd, E2(m, l0, R, dd) * E2(m, lr, R, dd)]; }), color: C.au, label: 'G(d) ∝ |1 + 2g(R/(R+d))³|⁴' }], legend: true, legendX: 400, legendY: 24 });
      var half = 0; for (var i = 0; i < dds.length; i++) { if (E2(m, l0, R, dds[i]) * E2(m, lr, R, dds[i]) < 0.5 * ef(l0)) { half = dds[i]; break; } }
      read.innerHTML = '<div><b>' + VL.sci(ef(l0), 2) + '</b><span>at ' + l0 + ' nm on the surface (single isolated sphere)</span></div><div><b>' + lr.toFixed(1) + ' nm</b><span>Raman line at ' + sh + ' cm⁻¹</span></div><div><b>' + half.toFixed(1) + ' nm</b><span>distance at which half the enhancement is gone</span></div>';
    };
    var ms = VL.select(ctl, { label: 'Metal', value: 'Ag', options: [['Ag', 'Silver'], ['Au', 'Gold']], on: draw });
    var ls = VL.slider(ctl, { label: 'Laser', min: 350, max: 900, step: 1, value: 405, fmt: function (v) { return v + ' nm'; }, on: draw });
    var ss = VL.slider(ctl, { label: 'Raman shift', min: 0, max: 3000, step: 10, value: 1000, fmt: function (v) { return v + ' cm⁻¹'; }, on: draw });
    draw();
  };

  /* ═══ cross-sections, log scale ═══ */
  F.xsec = function (fig) {
    var rows = [['UV–Vis absorption (strong dye)', -16, C.cyan], ['Fluorescence (good dye, effective)', -16.5, C.green], ['IR absorption (strong band)', -19, C.au], ['Resonance Raman', -24, C.violet], ['Normal (spontaneous) Raman', -29, C.red], ['SERS, effective, in a hot spot', -16, '#ff8a3d']];
    var W = 720, H = 40 + rows.length * 34, L = 270, R = 700, X = function (e) { return L + (e + 31) / 17 * (R - L); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + (H + 44) + '" class="plot" role="img" aria-label="Typical cross-sections">';
    for (var e = -31; e <= -14; e++) s += '<line x1="' + X(e) + '" x2="' + X(e) + '" y1="20" y2="' + H + '" stroke="' + C.grid + '"/>' + (Math.abs(e) % 3 === 1 ? '<text x="' + X(e) + '" y="' + (H + 14) + '" class="pl-tick" text-anchor="middle">10' + VL.sup(e) + '</text>' : '');
    rows.forEach(function (r, i) { var y = 30 + i * 34; s += '<text x="' + (L - 10) + '" y="' + (y + 13) + '" class="pl-tick" text-anchor="end">' + r[0] + '</text><rect x="' + L + '" y="' + y + '" width="' + (X(r[1]) - L) + '" height="18" rx="4" fill="' + r[2] + '" opacity=".85"/>'; });
    s += '<text x="' + (L + R) / 2 + '" y="' + (H + 36) + '" class="pl-label" text-anchor="middle">cross-section per molecule (cm²), order of magnitude</text>';
    VL.html(fig, s + '</svg>');
  };
})();
