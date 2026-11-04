/* Light from first principles — interactive figures (uses vl-core.js helpers).
   Each figure evaluates the closed-form result given in the text. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;
  var rng = function (seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  // complex helpers
  var cx = function (re, im) { return [re, im]; }, cmul = function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; };
  var cdiv = function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  var csqrt = function (z) { var r = Math.hypot(z[0], z[1]), re = Math.sqrt(Math.max(0, (r + z[0]) / 2)), im = Math.sqrt(Math.max(0, (r - z[0]) / 2)); return [re, z[1] < 0 ? -im : im]; };
  var cabs2 = function (z) { return z[0] * z[0] + z[1] * z[1]; };
  var sinc = function (x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; };

  /* ═══ 1. double slit, one photon at a time (animated) ═══ */
  F.dslit = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var NMAX = 10000, lo = -4, hi = 4, a = 0.25, R = rng(7), pts = [], bins = new Array(80).fill(0), hold = 0, sinceDraw = 1, carry = 0;
    var I = function (x) { var env = Math.pow(sinc(Math.PI * a * x), 2); return mode.get() === 'one' ? env : env * Math.pow(Math.cos(Math.PI * sep.get() * x), 2); };
    var addPhoton = function () { for (;;) { var x = lo + (hi - lo) * R(); if (R() < I(x)) { pts.push([x, 0.05 + 0.9 * R()]); bins[Math.min(79, Math.floor((x - lo) / (hi - lo) * 80))]++; return; } } };
    var reset = function (n) { pts = []; bins = new Array(80).fill(0); R = rng(7); for (var i = 0; i < n; i++) addPhoton(); };
    // plot geometry (VL.plot defaults: 700 × 300, margins l 62 r 18 t 16 b 46)
    var W = 700, Hh = 300, ml = 62, mt = 16, pw = W - 62 - 18, ph = Hh - 16 - 46, ymax = 1.05;
    var X = function (x) { return ml + (x - lo) / (hi - lo) * pw; }, Y = function (y) { return mt + ph - y / ymax * ph; };
    var showCount = function () { var o = np.input.parentNode.querySelector('output'); np.input.value = Math.log10(Math.max(1, pts.length)); o.textContent = pts.length.toLocaleString('en'); };
    var render = function () {
      var N = pts.length, ser = [];
      if (N >= 200) {
        var mx = Math.max.apply(null, bins) || 1;
        ser.push({ data: bins.map(function (c, i) { return [lo + (i + 0.5) * (hi - lo) / 80, c / mx]; }), color: C.au, width: 2, label: 'counts per position' },
          { data: VL.linspace(lo, hi, 600).map(function (x) { return [x, I(x)]; }), color: C.text, dash: '4 4', width: 1.2, label: 'wave prediction |ψ₁ + ψ₂|²' });
      }
      var svg = VL.plot({ id: 'ds', w: W, h: Hh, label: 'Photons arriving at a screen behind two slits', x: { min: lo, max: hi, label: 'Position on the screen (units of λL / slit separation)' }, y: { min: 0, max: ymax, label: 'Arrivals' }, series: ser, legend: N >= 200, legendX: 420, legendY: 14 });
      // the photons: one path of small squares (fast to draw even for thousands)
      var s = N > 3000 ? 1.4 : N > 500 ? 2 : 3.6, d = '';
      for (var i = 0; i < N; i++) d += 'M' + (X(pts[i][0]) - s / 2).toFixed(1) + ' ' + (Y(pts[i][1]) - s / 2).toFixed(1) + 'h' + s + 'v' + s + 'h-' + s + 'z';
      svg = svg.replace('</svg>', '<path d="' + d + '" fill="' + C.cyan + '" clip-path="url(#ds-clip)"/></svg>');
      plot.innerHTML = svg;
      var one = mode.get() === 'one';
      read.innerHTML = '<div><b>' + N.toLocaleString('en') + '</b><span>photons detected, each as a single dot</span></div><div><b>' + (one ? 'no fringes' : 'fringes') + '</b><span>' + (one ? 'one slit open: only the single-slit envelope' : 'both slits open: each photon “interferes with itself”') + '</span></div><div><b>' + (loop.playing ? 'running' : 'stopped') + '</b><span>' + (loop.playing ? 'photons keep arriving; press Stop to freeze' : 'press Start to continue') + '</span></div>';
      showCount();
    };
    var np = VL.slider(ctl, { label: 'Photons detected', min: 0, max: Math.log10(NMAX), step: 0.01, value: 0, log: true, fmt: function (v) { return Math.round(v).toLocaleString('en'); }, on: function (v) { reset(Math.round(v)); hold = 0; render(); } });
    var sep = VL.slider(ctl, { label: 'Slit separation (relative)', min: 0.6, max: 2, step: 0.05, value: 1, fmt: function (v) { return v.toFixed(2); }, on: function () { reset(pts.length); render(); } });
    var mode = VL.select(ctl, { label: 'Slits', value: 'two', options: [['two', 'Both open'], ['one', 'One open']], on: function () { reset(pts.length); render(); } });
    // the arrival rate grows with the count, so the first dots appear one by one and the fringes fill in within ~15 s
    var loop = VL.loop(plot, function (dt) {
      if (!dt) return;
      if (pts.length >= NMAX) { hold += dt; if (hold > 3) { hold = 0; reset(1); render(); } return; }
      carry += dt * Math.max(2.5, pts.length * 0.6);
      var n = Math.floor(carry); carry -= n;
      for (var i = 0; i < n && pts.length < NMAX; i++) addPhoton();
      sinceDraw += dt;
      if (n && sinceDraw > (pts.length > 2000 ? 0.12 : 0.05)) { sinceDraw = 0; render(); }
    });
    var btn = VL.button(ctl, loop.playing ? 'Stop' : 'Start', function () { var on = loop.toggle(); btn.textContent = on ? 'Stop' : 'Start'; render(); }, 'primary');
    VL.button(ctl, 'Restart', function () { reset(1); hold = 0; carry = 0; if (!loop.playing) { loop.play(); btn.textContent = 'Stop'; } render(); });
    reset(1); render();
  };

  /* ═══ 1b. a plane electromagnetic wave in 3D (animated) ═══ */
  // Oblique projection: z (propagation) to the right, x (E) up, y (B) out of the page towards the reader,
  // so that x̂ × ŷ = ẑ (E × B points along the direction of travel).
  F.emwave = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), phase = 0;
    var W = 880, H = 390, ox = 165, oy = 205, Lz = 540, A = 110, waves = 2.5, K = 2 * Math.PI * waves;
    var draw = function () {
      var ang = view.get() * Math.PI / 180, yd = [Math.cos(ang), Math.sin(ang)], tilt = 0.12, showV = vec.get() === 'yes';
      // world (x, y, z) → screen; z in [0, 1] along the travel axis, x and y in units of the amplitude
      var P = function (x, y, z) { return [ox + z * Lz + y * A * 0.95 * yd[0], oy - x * A + y * A * 0.95 * yd[1] - z * Lz * tilt * 0.25]; };
      var p2 = function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); };
      var line = function (a, b, col, w, extra) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '"' + (extra || '') + '/>'; };
      var head = function (a, b, col, size) { var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, s = size || 9, w = s * 0.45; return '<path d="M ' + p2(b) + ' L ' + (b[0] - ux * s + uy * w).toFixed(1) + ' ' + (b[1] - uy * s - ux * w).toFixed(1) + ' L ' + (b[0] - ux * s - uy * w).toFixed(1) + ' ' + (b[1] - uy * s + ux * w).toFixed(1) + ' Z" fill="' + col + '"/>'; };
      var arrow = function (a, b, col, w, s) { var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 2) return ''; var hs = Math.min(s || 7, L * 0.6), e = [b[0] - dx / L * hs * 0.7, b[1] - dy / L * hs * 0.7]; return line(a, e, col, w) + head(a, b, col, hs); };
      var red = C.red, cyan = C.cyan, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="A plane electromagnetic wave in three dimensions">';
      // planes in which the two fields oscillate
      var plane = function (u, col) { var c = [u(-1, 0), u(1, 0), u(1, 1), u(-1, 1)]; return '<path d="M ' + c.map(p2).join(' L ') + ' Z" fill="' + col + '" fill-opacity="0.07" stroke="' + col + '" stroke-opacity="0.25" stroke-dasharray="4 4"/>'; };
      s += plane(function (v, z) { return P(v, 0, z); }, red) + plane(function (v, z) { return P(0, v, z); }, cyan);
      var N = 240, ns = Math.round(waves * 16), Ecurve = [], Bcurve = [], vE = '', vB = '';
      for (var i = 0; i <= N; i++) { var z = i / N, f = Math.cos(K * z - phase); Ecurve.push(P(f, 0, z)); Bcurve.push(P(0, f, z)); }
      if (showV) for (var j = 0; j <= ns; j++) { var zz = j / ns, g = Math.cos(K * zz - phase); vE += arrow(P(0, 0, zz), P(g, 0, zz), red, 1.4, 6); vB += arrow(P(0, 0, zz), P(0, g, zz), cyan, 1.4, 6); }
      var path = function (pts, col) { return '<path d="M ' + pts.map(p2).join(' L ') + '" fill="none" stroke="' + col + '" stroke-width="2.6" stroke-linejoin="round"/>'; };
      // axes
      var ax = C.text2, o = P(0, 0, 0);
      s += arrow(P(0, 0, -0.04), P(0, 0, 1.08), ax, 1.6, 11) + arrow(P(-1.25, 0, 0), P(1.35, 0, 0), ax, 1.6, 11) + arrow(P(0, -1.25, 0), P(0, 1.45, 0), ax, 1.6, 11);
      var lab = function (q, txt, col, dx, dy) { return '<text x="' + (q[0] + (dx || 0)).toFixed(1) + '" y="' + (q[1] + (dy || 0)).toFixed(1) + '" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="600" fill="' + col + '">' + txt + '</text>'; };
      // depth order: B behind the axis first, then E, then B in front
      s += vB + path(Bcurve, cyan) + vE + path(Ecurve, red);
      s += lab(P(0, 0, 1.08), 'z (k)', C.text, 6, 20) + lab(P(1.35, 0, 0), 'x', C.text, 8, 4) + lab(P(0, 1.45, 0), 'y', C.text, 8, 16);
      s += lab(P(1.05, 0, 0.06), 'E (along x)', red, 6, -8) + lab(P(0, 1.1, 0.17), 'B (along y)', cyan, 4, 18);
      // one wavelength, marked along the axis
      var z0 = 1 / waves, a1 = P(-1.32, 0, 0.6), a2 = P(-1.32, 0, 0.6 + z0);
      s += arrow(a1, a2, C.au, 1.2, 8) + arrow(a2, a1, C.au, 1.2, 8) + lab([(a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2], 'λ', C.au, -4, -8);
      // a right-angle triad: E × B = direction of travel
      var t0 = [W - 120, 96], tx = [t0[0], t0[1] - 42], tz = [t0[0] + 46, t0[1] - 4], ty = [t0[0] + yd[0] * 40, t0[1] + yd[1] * 40];
      s += arrow(t0, tx, red, 2, 8) + arrow(t0, ty, cyan, 2, 8) + arrow(t0, tz, C.au, 2, 8) + lab(tx, 'E', red, 4, 2) + lab(ty, 'B', cyan, -14, 14) + lab(tz, 'k', C.au, 4, 4);
      s += '<text x="' + (W - 178) + '" y="28" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + C.text3 + '">E × B ∥ k, all at 90°</text>';
      host.innerHTML = s + '</svg>';
    };
    var loop = VL.loop(host, function (dt) { if (!dt) return; phase += dt * 2 * Math.PI * speed.get(); draw(); });
    var btn = VL.button(ctl, loop.playing ? 'Stop' : 'Start', function () { btn.textContent = loop.toggle() ? 'Stop' : 'Start'; }, 'primary');
    var speed = VL.slider(ctl, { label: 'Speed', min: 0.1, max: 1.5, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2) + ' cycles/s'; } });
    var view = VL.slider(ctl, { label: 'View angle of the y axis', min: 115, max: 160, step: 1, value: 140, fmt: function (v) { return v + '°'; }, on: draw });
    var vec = VL.select(ctl, { label: 'Field arrows', value: 'yes', options: [['yes', 'Shown'], ['no', 'Hidden']], on: draw });
    draw();
  };

  /* ═══ 2. polarisation ellipse ═══ */
  F.pol = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    plot.style.maxWidth = '440px'; plot.style.margin = '0 auto';
    var draw = function () {
      var th = ang.get() * Math.PI / 180, A = Math.cos(th), B = Math.sin(th), dl = ph.get() * Math.PI / 180, ts = VL.linspace(0, 2 * Math.PI, 241);
      // time evolution at a fixed point: E_x = A cos ωt, E_y = B cos(ωt − δ)  (Jones vector (A, B e^{iδ}), fields ∝ e^{i(kz − ωt)})
      var path = ts.map(function (t) { return [A * Math.cos(t), B * Math.cos(t - dl)]; });
      var arrowAt = [0, 0.35].map(function (t) { return [A * Math.cos(t), B * Math.cos(t - dl)]; });
      plot.innerHTML = VL.plot({ id: 'po', w: 420, h: 400, m: { l: 52, r: 18, t: 16, b: 46 }, label: 'Path of the electric-field vector', x: { min: -1.15, max: 1.15, label: 'E_x / E₀' }, y: { min: -1.15, max: 1.15, label: 'E_y / E₀' },
        series: [{ data: path, color: C.au, width: 2.6 }, { data: arrowAt, color: C.red, width: 3 }], marks: [{ x: arrowAt[0][0], y: arrowAt[0][1], color: C.red, r: 4, label: 't = 0' }] });
      var psi = 0.5 * Math.atan2(2 * A * B * Math.cos(dl), A * A - B * B) * 180 / Math.PI, chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, 2 * A * B * Math.sin(dl)))) * 180 / Math.PI;
      var kind = Math.abs(chi) < 0.5 ? 'linear' : Math.abs(Math.abs(chi) - 45) < 0.5 ? 'circular' : 'elliptical', hand = Math.abs(chi) < 0.5 ? '' : (chi > 0 ? ' — left-handed (counter-clockwise, seen facing the source)' : ' — right-handed (clockwise, seen facing the source)');
      read.innerHTML = '<div><b>' + kind + '</b><span>polarisation' + hand + '</span></div><div><b>' + psi.toFixed(1) + '°</b><span>orientation ψ of the major axis</span></div><div><b>' + chi.toFixed(1) + '°</b><span>ellipticity angle χ (0 linear, ±45° circular)</span></div><div><b>(' + A.toFixed(2) + ', ' + B.toFixed(2) + ' e^{i' + Math.round(dl * 180 / Math.PI) + '°})</b><span>Jones vector</span></div>';
    };
    var ang = VL.slider(ctl, { label: 'Amplitude split θ', min: 0, max: 90, step: 1, value: 45, fmt: function (v) { return v + '°'; }, on: draw });
    var ph = VL.slider(ctl, { label: 'Phase difference δ', min: -180, max: 180, step: 1, value: 60, fmt: function (v) { return v + '°'; }, on: draw });
    draw();
  };

  /* ═══ 3. Lorentz dielectric and Drude metal ═══ */
  F.lorentz = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var eps = function (lam) {
      var E = 1239.84 / lam; // photon energy in eV
      if (mdl.get() === 'metal') { var wp = 9.0, g = 0.07, einf = 9.5; return [einf - wp * wp / (E * E + g * g), wp * wp * g / (E * (E * E + g * g))]; }
      var E0 = 1239.84 / res.get(), G = 0.25, f = str.get(), den = [E0 * E0 - E * E, -G * E]; // ε = 1 + f E0² / (E0² − E² − iγE)
      var q = cdiv([f * E0 * E0, 0], den); return [1 + q[0], q[1]];
    };
    var draw = function () {
      var metal = mdl.get() === 'metal', ls = VL.linspace(150, 2000, 600), L = lam.get();
      var nk = function (l) { var z = csqrt(eps(l)); return z; };
      var nmax = Math.max.apply(null, ls.map(function (l) { var z = nk(l); return Math.max(z[0], z[1]); }));
      plot.innerHTML = VL.plot({ id: 'lo', w: 700, h: 320, label: 'Refractive index n and extinction coefficient κ against wavelength', x: { min: 150, max: 2000, label: 'Wavelength (nm)' }, y: { min: 0, max: Math.min(16, Math.ceil(nmax + 0.5)), label: 'n, κ' },
        series: [{ data: ls.map(function (l) { return [l, nk(l)[0]]; }), color: C.au, width: 2.4, label: 'n (refractive index)' }, { data: ls.map(function (l) { return [l, nk(l)[1]]; }), color: C.red, width: 2.4, label: 'κ (extinction coefficient)' }],
        vlines: [{ x: L, color: C.text3 }], legend: true, legendX: 400, legendY: 14 });
      var z = nk(L), e = eps(L), R = ((z[0] - 1) * (z[0] - 1) + z[1] * z[1]) / ((z[0] + 1) * (z[0] + 1) + z[1] * z[1]), alpha = 4 * Math.PI * z[1] / (L * 1e-7), dpen = z[1] > 1e-9 ? L / (4 * Math.PI * z[1]) : Infinity;
      read.innerHTML = '<div><b>' + e[0].toFixed(2) + (e[1] >= 0 ? ' + ' : ' − ') + Math.abs(e[1]).toFixed(2) + 'i</b><span>permittivity ε at ' + L + ' nm</span></div><div><b>' + z[0].toFixed(3) + ' + ' + z[1].toFixed(3) + 'i</b><span>complex index n + iκ</span></div><div><b>' + (100 * R).toFixed(1) + ' %</b><span>reflectance at normal incidence from air</span></div><div><b>' + (isFinite(dpen) ? (dpen < 1000 ? dpen.toFixed(1) + ' nm' : VL.fmtLen(dpen * 1e-9)) : '∞') + '</b><span>intensity penetration depth 1/α' + (metal ? ' (skin depth for the field: twice this)' : '') + '</span></div>';
    };
    var mdl = VL.select(ctl, { label: 'Material model', value: 'diel', options: [['diel', 'Dielectric (Lorentz oscillator)'], ['metal', 'Metal (Drude, gold-like)']], on: draw });
    var res = VL.slider(ctl, { label: 'Resonance (dielectric)', min: 150, max: 900, step: 5, value: 300, fmt: function (v) { return v + ' nm'; }, on: draw });
    var str = VL.slider(ctl, { label: 'Strength (dielectric)', min: 0.2, max: 4, step: 0.05, value: 1.2, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var lam = VL.slider(ctl, { label: 'Read values at', min: 150, max: 2000, step: 5, value: 633, fmt: function (v) { return v + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 4. Fresnel reflection, Brewster, total internal reflection ═══ */
  F.fresnel = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var rr = function (n1, n2, deg) {
      var t = deg * Math.PI / 180, ci = Math.cos(t), s = n1 * Math.sin(t) / n2, ct = csqrt([1 - s * s, 0]);
      var rs = cdiv([n1 * ci - n2 * ct[0], -n2 * ct[1]], [n1 * ci + n2 * ct[0], n2 * ct[1]]), rp = cdiv([n2 * ci - n1 * ct[0], -n1 * ct[1]], [n2 * ci + n1 * ct[0], n1 * ct[1]]);
      return [cabs2(rs), cabs2(rp)];
    };
    var draw = function () {
      var n1 = a.get(), n2 = b.get(), th = VL.linspace(0, 89.9, 400), T = ang.get();
      var tb = Math.atan(n2 / n1) * 180 / Math.PI, tc = n1 > n2 ? Math.asin(n2 / n1) * 180 / Math.PI : null, v = [{ x: tb, color: C.green, label: 'Brewster', ly: 160 }];
      if (tc) v.push({ x: tc, color: C.red, label: 'critical', ly: 190 });
      plot.innerHTML = VL.plot({ id: 'fr', w: 700, h: 320, label: 'Reflectance against angle of incidence', x: { min: 0, max: 90, label: 'Angle of incidence (°)' }, y: { min: 0, max: 1, label: 'Reflectance R' },
        series: [{ data: th.map(function (t) { return [t, rr(n1, n2, t)[0]]; }), color: C.cyan, width: 2.4, label: 's (TE)' }, { data: th.map(function (t) { return [t, rr(n1, n2, t)[1]]; }), color: C.au, width: 2.4, label: 'p (TM)' }],
        vlines: v.concat([{ x: T, color: C.text3 }]), legend: true, legendX: 14, legendY: 14 });
      var R = rr(n1, n2, T), s = n1 * Math.sin(T * Math.PI / 180), dp = s > n2 ? 0.633 / (2 * Math.PI * Math.sqrt(s * s - n2 * n2)) : null;
      read.innerHTML = '<div><b>' + (100 * R[0]).toFixed(1) + ' % · ' + (100 * R[1]).toFixed(1) + ' %</b><span>R_s · R_p at ' + T + '°</span></div><div><b>' + tb.toFixed(2) + '°</b><span>Brewster angle: p light is not reflected</span></div><div><b>' + (tc ? tc.toFixed(2) + '°' : '—') + '</b><span>critical angle for total internal reflection</span></div><div><b>' + (dp ? (dp * 1000).toFixed(0) + ' nm' : '—') + '</b><span>evanescent field decay length at 633 nm (1/e of the field)</span></div>';
    };
    var a = VL.slider(ctl, { label: 'Incident medium n₁', min: 1, max: 3.5, step: 0.01, value: 1.5, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var b = VL.slider(ctl, { label: 'Second medium n₂', min: 1, max: 3.5, step: 0.01, value: 1.0, fmt: function (v) { return v.toFixed(2); }, on: draw });
    var ang = VL.slider(ctl, { label: 'Angle of incidence', min: 0, max: 89, step: 0.5, value: 45, fmt: function (v) { return v + '°'; }, on: draw });
    draw();
  };

  /* ═══ 5. second-harmonic generation and phase matching ═══ */
  F.shg = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var Lc = lc.get(), dk = Math.PI / Lc, Lm = len.get(), zs = VL.linspace(0, Lm, 500), dz = zs[1] - zs[0];
      var pm = zs.map(function (z) { return [z, z * z]; });
      var mis = zs.map(function (z) { var x = Math.sin(dk * z / 2) / (dk / 2); return [z, x * x]; });
      var re = 0, im = 0, q = [[0, 0]];
      for (var i = 1; i < zs.length; i++) { var z = zs[i] - dz / 2, sgn = Math.floor(z / Lc) % 2 === 0 ? 1 : -1; re += sgn * Math.cos(dk * z) * dz; im += sgn * Math.sin(dk * z) * dz; q.push([zs[i], re * re + im * im]); }
      var ymax = Lm * Lm, rel = function (arr) { return arr.map(function (p) { return [p[0], p[1] / ymax]; }); };
      pm = rel(pm); mis = rel(mis); q = rel(q);
      plot.innerHTML = VL.plot({ id: 'sh', w: 700, h: 320, label: 'Second-harmonic power against crystal length', x: { min: 0, max: Lm, label: 'Crystal length L (µm)' }, y: { min: 1e-4, max: 1.5, log: true, label: 'SH power (relative)' },
        series: [{ data: pm, color: C.green, width: 2.2, label: 'phase matched (Δk = 0): ∝ L²' }, { data: q, color: C.au, width: 2.2, label: 'quasi-phase matched (domains flipped every L_c)' }, { data: mis, color: C.red, width: 2.2, label: 'mismatched: oscillates with period 2L_c' }],
        legend: true, legendX: 14, legendY: 14 });
      read.innerHTML = '<div><b>' + Lc.toFixed(1) + ' µm</b><span>coherence length L_c = π/Δk</span></div><div><b>' + VL.sci(mis[mis.length - 1][1], 2) + '</b><span>mismatched output at L, relative to perfect matching</span></div><div><b>' + (q[q.length - 1][1]).toFixed(3) + '</b><span>quasi-phase-matched output, relative (tends to (2/π)² ≈ 0.405)</span></div>';
    };
    var lc = VL.slider(ctl, { label: 'Coherence length L_c', min: 1, max: 30, step: 0.5, value: 4, fmt: function (v) { return v.toFixed(1) + ' µm'; }, on: draw });
    var len = VL.slider(ctl, { label: 'Crystal length shown', min: 10, max: 200, step: 5, value: 60, fmt: function (v) { return v + ' µm'; }, on: draw });
    draw();
  };

  /* ═══ 6. modes of a symmetric slab waveguide (TE) ═══ */
  var slabModes = function (n1, n2, d, lam) {
    var k0 = 2 * Math.PI / lam, V = k0 * d / 2 * Math.sqrt(n1 * n1 - n2 * n2), modes = [];
    for (var m = 0; m * Math.PI / 2 < V; m++) {
      var lo = m * Math.PI / 2 + 1e-9, hi = Math.min((m + 1) * Math.PI / 2, V) - 1e-9;
      var f = function (u) { var w = Math.sqrt(Math.max(0, V * V - u * u)); return m % 2 === 0 ? u * Math.tan(u) - w : -u / Math.tan(u) - w; };
      if (f(lo) * f(hi) > 0) continue;
      for (var it = 0; it < 80; it++) { var mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; }
      var u = (lo + hi) / 2, w = Math.sqrt(Math.max(0, V * V - u * u)), neff = Math.sqrt(n1 * n1 - Math.pow(2 * u / (k0 * d), 2));
      modes.push({ m: m, u: u, w: w, neff: neff });
    }
    return { V: V, modes: modes };
  };
  F.slab = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var n1 = nc.get(), n2 = Math.min(ncl.get(), n1 - 0.001), d = th.get(), lam = la.get(), S = slabModes(n1, n2, d, lam), xs = VL.linspace(-1.6 * d, 1.6 * d, 600), cols = [C.au, C.cyan, C.red, C.green, C.violet, C.text2];
      var field = function (M, x) { var a = Math.abs(x), h = d / 2; if (a <= h) return M.m % 2 === 0 ? Math.cos(M.u * x / h) : Math.sin(M.u * x / h); var out = Math.exp(-M.w * (a - h) / h); return M.m % 2 === 0 ? Math.cos(M.u) * out : Math.sign(x) * Math.sin(M.u) * out; };
      var ser = S.modes.slice(0, 6).map(function (M, i) { var mx = 0; xs.forEach(function (x) { mx = Math.max(mx, Math.abs(field(M, x))); }); return { data: xs.map(function (x) { return [x, field(M, x) / mx]; }), color: cols[i % cols.length], width: 2.2, label: 'TE' + M.m + '  n_eff = ' + M.neff.toFixed(4) }; });
      plot.innerHTML = VL.plot({ id: 'sl', w: 700, h: 320, label: 'Transverse field profiles of the guided TE modes', x: { min: xs[0], max: xs[xs.length - 1], label: 'Position across the guide x (µm)' }, y: { min: -1.1, max: 1.1, label: 'Field E_y (normalised)' }, series: ser,
        bands: [{ x0: -d / 2, x1: d / 2, color: C.au, op: 0.1, label: 'core n₁' }], legend: true, legendX: 14, legendY: 14 });
      var dsm = lam / (2 * Math.sqrt(n1 * n1 - n2 * n2));
      read.innerHTML = '<div><b>' + S.V.toFixed(2) + '</b><span>V = (k₀d/2)·NA</span></div><div><b>' + S.modes.length + '</b><span>guided TE mode' + (S.modes.length === 1 ? ' (single-mode)' : 's') + '</span></div><div><b>' + (dsm * 1000).toFixed(0) + ' nm</b><span>largest core thickness that stays single-mode (V &lt; π/2)</span></div><div><b>' + Math.sqrt(n1 * n1 - n2 * n2).toFixed(3) + '</b><span>numerical aperture NA = √(n₁² − n₂²)</span></div>';
    };
    var nc = VL.slider(ctl, { label: 'Core index n₁', min: 1.4, max: 3.5, step: 0.005, value: 1.5, fmt: function (v) { return v.toFixed(3); }, on: draw });
    var ncl = VL.slider(ctl, { label: 'Cladding index n₂', min: 1.0, max: 3.4, step: 0.005, value: 1.45, fmt: function (v) { return v.toFixed(3); }, on: draw });
    var th = VL.slider(ctl, { label: 'Core thickness d', min: 0.2, max: 12, step: 0.05, value: 4, fmt: function (v) { return v.toFixed(2) + ' µm'; }, on: draw });
    var la = VL.slider(ctl, { label: 'Wavelength', min: 0.4, max: 1.7, step: 0.01, value: 1.55, fmt: function (v) { return (v * 1000).toFixed(0) + ' nm'; }, on: draw });
    draw();
  };
  VL.slabModes = slabModes;

  /* ═══ 7. step-index fibre: V number, cut-off and mode field ═══ */
  F.fibre = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var a = rad.get(), NA = na.get(), L = la.get(), ls = VL.linspace(0.4, 1.8, 300), V = function (l) { return 2 * Math.PI * a * NA / l; };
      var lcut = 2 * Math.PI * a * NA / 2.405;
      plot.innerHTML = VL.plot({ id: 'fb', w: 700, h: 320, label: 'Fibre V number against wavelength', x: { min: 0.4, max: 1.8, label: 'Wavelength (µm)' }, y: { min: 0, max: Math.max(6, V(0.4) * 1.05), label: 'V = 2πa·NA/λ' },
        series: [{ data: ls.map(function (l) { return [l, V(l)]; }), color: C.au, width: 2.4 }], hlines: [{ y: 2.405, color: C.red, label: 'single-mode below V = 2.405' }], vlines: [{ x: L, color: C.text3 }],
        bands: lcut > 0.4 && lcut < 1.8 ? [{ x0: lcut, x1: 1.8, color: C.green, op: 0.08, label: 'single-mode' }] : [] });
      var v = V(L), M = v < 2.405 ? 1 : Math.max(2, Math.round(v * v / 2)), wr = 0.65 + 1.619 * Math.pow(v, -1.5) + 2.879 * Math.pow(v, -6);
      read.innerHTML = '<div><b>' + v.toFixed(2) + '</b><span>V number at ' + (L * 1000).toFixed(0) + ' nm</span></div><div><b>' + (v < 2.405 ? 'single-mode' : '≈ ' + M + ' modes') + '</b><span>' + (v < 2.405 ? 'only LP₀₁ (two polarisations) is guided' : 'mode count ≈ V²/2 for large V') + '</span></div><div><b>' + (lcut * 1000).toFixed(0) + ' nm</b><span>cut-off wavelength: single-mode above it</span></div><div><b>' + (v < 2.405 && v > 0.8 ? (2 * a * wr).toFixed(2) + ' µm' : '—') + '</b><span>mode-field diameter (Marcuse approximation)</span></div>';
    };
    var rad = VL.slider(ctl, { label: 'Core radius a', min: 1, max: 32, step: 0.1, value: 4.1, fmt: function (v) { return v.toFixed(1) + ' µm'; }, on: draw });
    var na = VL.slider(ctl, { label: 'Numerical aperture', min: 0.05, max: 0.3, step: 0.005, value: 0.12, fmt: function (v) { return v.toFixed(3); }, on: draw });
    var la = VL.slider(ctl, { label: 'Wavelength', min: 0.4, max: 1.8, step: 0.01, value: 1.55, fmt: function (v) { return (v * 1000).toFixed(0) + ' nm'; }, on: draw });
    draw();
  };

  /* ═══ 8. directional coupler (coupled-mode theory) ═══ */
  F.coupler = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), plot = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var k = kap.get(), dl = mis.get(), g = Math.sqrt(k * k + dl * dl), Fm = k * k / (g * g), zs = VL.linspace(0, 3, 400);
      plot.innerHTML = VL.plot({ id: 'cp', w: 700, h: 300, label: 'Power in the two waveguides along a directional coupler', x: { min: 0, max: 3, label: 'Distance along the coupler z (mm)' }, y: { min: 0, max: 1.02, label: 'Power (fraction)' },
        series: [{ data: zs.map(function (z) { return [z, 1 - Fm * Math.pow(Math.sin(g * z), 2)]; }), color: C.au, width: 2.4 }, { data: zs.map(function (z) { return [z, Fm * Math.pow(Math.sin(g * z), 2)]; }), color: C.cyan, width: 2.4 }],
        hlines: [{ y: 0.5, color: C.text3, label: '3 dB' }] });
      read.innerHTML = '<div><b>' + (Math.PI / (2 * k)).toFixed(3) + ' mm</b><span>coupling length L_c = π/(2κ): full transfer when matched</span></div><div><b>' + (100 * Fm).toFixed(1) + ' %</b><span>largest power that ever reaches guide 2, κ²/(κ² + δ²)</span></div><div><b>' + (Math.PI / (4 * k)).toFixed(3) + ' mm</b><span>length of a 50 : 50 (3 dB) splitter when matched</span></div>';
    };
    var kap = VL.slider(ctl, { label: 'Coupling coefficient κ', min: 0.5, max: 6, step: 0.05, value: 2, fmt: function (v) { return v.toFixed(2) + ' mm⁻¹'; }, on: draw });
    var mis = VL.slider(ctl, { label: 'Phase mismatch δ = Δβ/2', min: 0, max: 6, step: 0.05, value: 0, fmt: function (v) { return v.toFixed(2) + ' mm⁻¹'; }, on: draw });
    draw();
  };
})();
