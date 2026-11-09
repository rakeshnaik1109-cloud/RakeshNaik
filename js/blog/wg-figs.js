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
    var view = VL.slider(ctl, { label: 'Camera (viewing direction)', min: 115, max: 160, step: 1, value: 140, fmt: function (v) { return 'turn ' + (v - 140 >= 0 ? '+' : '') + (v - 140) + '°'; }, on: draw });
    var vec = VL.select(ctl, { label: 'Field arrows', value: 'yes', options: [['yes', 'Shown'], ['no', 'Hidden']], on: draw });
    draw();
  };

  /* ═══ 2. polarisation ellipse: how two oscillations make a line, a circle or an ellipse (animated) ═══ */
  F.pol = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout'), wt = 0;
    var W = 880, H = 400, cx = 205, cy = 200, R = 150, tx0 = 470, tw = 390;
    var f1 = function (v) { return v.toFixed(1); };
    var arrow = function (x1, y1, x2, y2, col, w) { var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 3) return ''; var ux = dx / L, uy = dy / L, hs = Math.min(11, L * 0.5), hw = hs * 0.45, ex = x2 - ux * hs * 0.7, ey = y2 - uy * hs * 0.7;
      return '<line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '" stroke="' + col + '" stroke-width="' + w + '"/><path d="M ' + f1(x2) + ' ' + f1(y2) + ' L ' + f1(x2 - ux * hs + uy * hw) + ' ' + f1(y2 - uy * hs - ux * hw) + ' L ' + f1(x2 - ux * hs - uy * hw) + ' ' + f1(y2 - uy * hs + ux * hw) + ' Z" fill="' + col + '"/>'; };
    var txt = function (x, y, s, col, size, anchor, weight) { return '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="IBM Plex Mono, monospace" font-size="' + (size || 12) + '" fill="' + col + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + (weight ? ' font-weight="' + weight + '"' : '') + '>' + s + '</text>'; };
    var draw = function () {
      var th = ang.get() * Math.PI / 180, A = Math.cos(th), B = Math.sin(th), dl = ph.get() * Math.PI / 180;
      // at a fixed point: E_x = A cos ωt, E_y = B cos(ωt − δ)   (Jones vector (A, B e^{iδ}), fields ∝ e^{i(kz − ωt)})
      var Ex = function (t) { return A * Math.cos(t); }, Ey = function (t) { return B * Math.cos(t - dl); };
      var gold = C.au, red = C.red, cxc = C.cyan, ink = C.text2;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="How the two field components make the polarisation ellipse">';
      // ── left: the plane across the beam ──
      s += '<rect x="' + (cx - R - 25) + '" y="' + (cy - R - 25) + '" width="' + (2 * R + 50) + '" height="' + (2 * R + 50) + '" rx="8" fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.1)"/>';
      s += arrow(cx - R - 12, cy, cx + R + 18, cy, ink, 1.2) + arrow(cx, cy + R + 12, cx, cy - R - 18, ink, 1.2) + txt(cx + R + 4, cy - 8, 'x', ink, 13) + txt(cx + 8, cy - R - 8, 'y', ink, 13);
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="none" stroke="' + ink + '"/><circle cx="' + cx + '" cy="' + cy + '" r="1.6" fill="' + ink + '"/>' + txt(cx - R - 18, cy + R + 18, 'light travels towards you (out of the screen)', C.text3, 10.5);
      var path = []; for (var q = 0; q <= 240; q++) { var tt = 2 * Math.PI * q / 240; path.push(f1(cx + R * Ex(tt)) + ' ' + f1(cy - R * Ey(tt))); }
      s += '<path d="M ' + path.join(' L ') + '" fill="none" stroke="' + gold + '" stroke-width="2.4" stroke-opacity="0.9"/>';
      // direction of travel round the path: a small arrowhead a little after the current point
      var px = cx + R * Ex(wt), py = cy - R * Ey(wt);
      s += '<line x1="' + f1(px) + '" y1="' + f1(cy) + '" x2="' + f1(px) + '" y2="' + f1(py) + '" stroke="' + cxc + '" stroke-dasharray="3 3" stroke-opacity="0.7"/><line x1="' + f1(cx) + '" y1="' + f1(py) + '" x2="' + f1(px) + '" y2="' + f1(py) + '" stroke="' + gold + '" stroke-dasharray="3 3" stroke-opacity="0.7"/>';
      s += arrow(cx, cy, px, cy, gold, 3) + arrow(cx, cy, cx, py, cxc, 3) + arrow(cx, cy, px, py, red, 3.4);
      s += txt(px + (Ex(wt) >= 0 ? 6 : -6), cy + 16, 'E_x', gold, 12, Ex(wt) >= 0 ? 'start' : 'end', 600) + txt(cx + 8, py + (Ey(wt) >= 0 ? -6 : 14), 'E_y', cxc, 12, 'start', 600) + txt(px + 8, py - 8, 'E', red, 14, 'start', 700);
      // ── right: E_x(t) and E_y(t) ──
      var row = function (y0, f, col, name) {
        var h = 70, o = '', pts = [];
        o += '<line x1="' + tx0 + '" y1="' + y0 + '" x2="' + (tx0 + tw) + '" y2="' + y0 + '" stroke="rgba(255,255,255,.18)"/>' + txt(tx0 - 10, y0 + 4, name, col, 12, 'end', 600);
        for (var q = 0; q <= 200; q++) { var tt = 4 * Math.PI * q / 200; pts.push(f1(tx0 + tw * q / 200) + ' ' + f1(y0 - h * f(tt))); }
        o += '<path d="M ' + pts.join(' L ') + '" fill="none" stroke="' + col + '" stroke-width="2.2"/>';
        var tc = ((wt % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI), xc = tx0 + tw * tc / (4 * Math.PI);
        o += '<line x1="' + f1(xc) + '" y1="' + (y0 - h - 6) + '" x2="' + f1(xc) + '" y2="' + (y0 + h + 6) + '" stroke="' + red + '" stroke-opacity="0.5"/><circle cx="' + f1(xc) + '" cy="' + f1(y0 - h * f(wt)) + '" r="5" fill="' + col + '" stroke="#0f0a18"/>';
        return o;
      };
      s += txt(tx0 + tw / 2, 28, 'the two components against time', ink, 12, 'middle', 600);
      s += row(115, Ex, gold, 'E_x(t)') + row(290, Ey, cxc, 'E_y(t)');
      s += txt(tx0 + tw, H - 12, 'time → (two periods)', C.text3, 10.5, 'end');
      // mark the delay between the first peaks
      if (A > 0.05 && B > 0.05 && Math.abs(dl) > 0.05) {
        var tpx = tx0, d0 = ((dl % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), tpy = tx0 + tw * d0 / (4 * Math.PI);
        s += '<line x1="' + f1(tpx) + '" y1="45" x2="' + f1(tpx) + '" y2="360" stroke="' + gold + '" stroke-dasharray="2 4" stroke-opacity="0.5"/><line x1="' + f1(tpy) + '" y1="45" x2="' + f1(tpy) + '" y2="360" stroke="' + cxc + '" stroke-dasharray="2 4" stroke-opacity="0.5"/>';
        s += arrow(tpx, 200, tpy, 200, C.text, 1.4) + txt((tpx + tpy) / 2, 194, 'delay δ', C.text, 11, 'middle');
      }
      host.innerHTML = s + '</svg>';
      var psi = 0.5 * Math.atan2(2 * A * B * Math.cos(dl), A * A - B * B) * 180 / Math.PI, chi = -0.5 * Math.asin(Math.max(-1, Math.min(1, 2 * A * B * Math.sin(dl)))) * 180 / Math.PI;
      var kind = Math.abs(chi) < 0.5 ? 'linear' : Math.abs(Math.abs(chi) - 45) < 0.5 ? 'circular' : 'elliptical', hand = Math.abs(chi) < 0.5 ? ' — the tip moves back and forth on a line' : (chi > 0 ? ' — right-handed: clockwise as you look towards the source' : ' — left-handed: anticlockwise as you look towards the source');
      read.innerHTML = '<div><b>' + kind + '</b><span>polarisation' + hand + '</span></div><div><b>' + psi.toFixed(1) + '°</b><span>tilt ψ of the long axis of the path</span></div><div><b>' + chi.toFixed(1) + '°</b><span>roundness χ: 0° line, ±45° circle</span></div><div><b>(' + A.toFixed(2) + ', ' + B.toFixed(2) + ' e^{i' + Math.round(dl * 180 / Math.PI) + '°})</b><span>Jones vector</span></div>';
    };
    var ang = VL.slider(ctl, { label: 'Amplitude split θ', min: 0, max: 90, step: 1, value: 45, fmt: function (v) { return v + '°'; }, on: draw });
    var ph = VL.slider(ctl, { label: 'Phase difference δ', min: -180, max: 180, step: 1, value: 0, fmt: function (v) { return v + '°'; }, on: draw });
    var loop = VL.loop(host, function (dt) { if (!dt) return; wt += dt * 2 * Math.PI * 0.25; draw(); });
    var btn = VL.button(ctl, loop.playing ? 'Stop' : 'Start', function () { btn.textContent = loop.toggle() ? 'Stop' : 'Start'; }, 'primary');
    [['Linear 45°', 45, 0], ['Linear 0° (H)', 0, 0], ['Circular (left)', 45, 90], ['Circular (right)', 45, -90], ['Elliptical', 30, 60]].forEach(function (p) { VL.button(ctl, p[0], function () { ang.set(p[1]); ph.set(p[2]); }); });
    draw();
  };

  /* ═══ 2b. Jones calculator: an optical bench of polarisation elements (animated) ═══ */
  // Convention: E = Re[J e^{i(kz − ωt)}], J = (E_x, E_y). A retarder with its fast axis along x is diag(e^{−iΓ/2}, e^{iΓ/2}).
  var J2 = {
    mul: function (M, v) { return [cadd(cmul(M[0][0], v[0]), cmul(M[0][1], v[1])), cadd(cmul(M[1][0], v[0]), cmul(M[1][1], v[1]))]; },
    mm: function (A, B) { var r = [[0, 0], [0, 0]]; for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) r[i][j] = cadd(cmul(A[i][0], B[0][j]), cmul(A[i][1], B[1][j])); return r; },
    R: function (th) { var c = Math.cos(th), s = Math.sin(th); return [[[c, 0], [s, 0]], [[-s, 0], [c, 0]]]; },
    pol: function (th) { var c = Math.cos(th), s = Math.sin(th); return [[[c * c, 0], [c * s, 0]], [[c * s, 0], [s * s, 0]]]; },
    ret: function (G, th) { var D = [[[Math.cos(G / 2), -Math.sin(G / 2)], [0, 0]], [[0, 0], [Math.cos(G / 2), Math.sin(G / 2)]]]; return J2.mm(J2.R(-th), J2.mm(D, J2.R(th))); },
    rot: function (ph) { var c = Math.cos(ph), s = Math.sin(ph); return [[[c, 0], [-s, 0]], [[s, 0], [c, 0]]]; }
  };
  function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  var JIN = { H: [[1, 0], [0, 0]], V: [[0, 0], [1, 0]], D: [[Math.SQRT1_2, 0], [Math.SQRT1_2, 0]], A: [[Math.SQRT1_2, 0], [-Math.SQRT1_2, 0]], R: [[Math.SQRT1_2, 0], [0, -Math.SQRT1_2]], L: [[Math.SQRT1_2, 0], [0, Math.SQRT1_2]] };
  var JNAME = { H: 'horizontal (H)', V: 'vertical (V)', D: 'diagonal +45° (D)', A: 'anti-diagonal −45° (A)', R: 'right circular (R)', L: 'left circular (L)' };
  var stokes = function (J) { var ex = J[0], ey = J[1], s0 = cabs2(ex) + cabs2(ey), s1 = cabs2(ex) - cabs2(ey), p = cmul([ex[0], -ex[1]], ey); return [s0, s1, 2 * p[0], -2 * p[1]]; };
  var describe = function (J) {
    var S = stokes(J); if (S[0] < 1e-6) return { I: 0, txt: 'blocked (no light)' };
    var psi = 0.5 * Math.atan2(S[2], S[1]) * 180 / Math.PI, chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S[3] / S[0]))) * 180 / Math.PI;
    var kind = Math.abs(chi) < 0.5 ? 'linear ' + (Math.abs(psi) < 0.5 ? '0° (H)' : Math.abs(Math.abs(psi) - 90) < 0.5 ? '90° (V)' : psi.toFixed(1) + '°') : Math.abs(Math.abs(chi) - 45) < 0.5 ? (chi > 0 ? 'right circular' : 'left circular') : (chi > 0 ? 'right' : 'left') + ' elliptical, axis ' + psi.toFixed(0) + '°';
    return { I: S[0], txt: kind, S: S, psi: psi, chi: chi };
  };
  var JPRESETS = {
    malus: { name: "Malus's law: one polariser", input: 'H', els: [['pol', 30], ['none', 0], ['none', 0]], G: 90, note: 'Rotate element 1: the transmitted intensity is cos²θ.' },
    crossed: { name: 'Crossed polarisers', input: 'H', els: [['pol', 0], ['pol', 90], ['none', 0]], G: 90, note: 'Nothing gets through two polarisers at 90°.' },
    three: { name: 'Three polarisers (the paradox)', input: 'H', els: [['pol', 0], ['pol', 45], ['pol', 90]], G: 90, note: 'Adding a polariser at 45° between crossed ones lets 1/4 of the light after the first through: the middle one re-creates a component along 90°. Set element 2 to “none” to block it again.' },
    hwp: { name: 'Half-wave plate rotates polarisation', input: 'H', els: [['hwp', 22.5], ['none', 0], ['none', 0]], G: 90, note: 'A half-wave plate at θ turns linear light at 0° into linear light at 2θ: 22.5° → 45°.' },
    qwp: { name: 'Quarter-wave plate: linear → circular', input: 'H', els: [['qwp', 45], ['none', 0], ['none', 0]], G: 90, note: 'Linear light at 45° to the axes of a quarter-wave plate leaves circular. At any other angle it leaves elliptical.' },
    circlin: { name: 'Quarter-wave plate: circular → linear', input: 'R', els: [['qwp', 0], ['none', 0], ['none', 0]], G: 90, note: 'The same plate turns circular light back into linear light at ±45° to its axes.' },
    lcd: { name: 'Retarder between crossed polarisers (LCD pixel)', input: 'H', els: [['pol', 0], ['ret', 45], ['pol', 90]], G: 120, note: 'T = sin²(2θ)·sin²(Γ/2): change the retardance Γ, as a liquid crystal does with voltage, to switch the pixel from dark to bright.' },
    qwpiso: { name: 'Quarter-wave-plate isolator (double pass)', input: 'H', els: [['qwp', 45], ['qwp', 45], ['pol', 0]], G: 90, note: 'Unfolded double pass: going through a quarter-wave plate twice equals a half-wave plate at 45°, so H returns as V and the input polariser blocks it.' },
    faraday: { name: 'Faraday isolator, backward pass', input: 'D', els: [['rot', 45], ['pol', 0], ['none', 0]], G: 90, note: 'Light that went forward through a 45° Faraday rotator (H → D) is rotated another 45° on the way back — the Faraday effect does not reverse — arriving at 90° and blocked.' },
    ellip: { name: 'General retarder: elliptical light', input: 'D', els: [['ret', 0], ['none', 0], ['none', 0]], G: 60, note: 'A retardance that is neither λ/4 nor λ/2 gives elliptical light; the state moves around the Poincaré sphere about the plate axis.' }
  };
  F.jones = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout'), wt = 0;
    var ELN = { none: 'none', pol: 'polariser', hwp: 'half-wave plate', qwp: 'quarter-wave plate', ret: 'retarder Γ', rot: 'rotator' };
    var mat = function (k, deg) { var th = deg * Math.PI / 180; return k === 'pol' ? J2.pol(th) : k === 'hwp' ? J2.ret(Math.PI, th) : k === 'qwp' ? J2.ret(Math.PI / 2, th) : k === 'ret' ? J2.ret(gam.get() * Math.PI / 180, th) : k === 'rot' ? J2.rot(th) : null; };
    var draw = function () {
      var states = [JIN[inp.get()]], labels = ['Input: ' + inp.get()];
      for (var i = 0; i < 3; i++) { var k = els[i].sel.get(), M = mat(k, els[i].ang.get()); if (!M) continue; states.push(J2.mul(M, states[states.length - 1])); labels.push((states.length - 1) + ': ' + ELN[k].replace('retarder Γ', 'retarder ' + gam.get() + '°') + (k === 'none' ? '' : ' @ ' + els[i].ang.get() + '°')); }
      var Wd = 980, Hd = 300, pw = 168, ns = states.length, s = '<svg viewBox="0 0 ' + Wd + ' ' + Hd + '" class="plot" role="img" aria-label="Polarisation after each element">';
      var cols = [C.text, C.au, C.cyan, C.green];
      states.forEach(function (J, i) {
        var x0 = 8 + i * (pw + 10), cx0 = x0 + pw / 2, cy0 = 150, R = 62, d = describe(J), col = cols[i % cols.length];
        s += '<rect x="' + x0 + '" y="40" width="' + pw + '" height="220" rx="8" fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.12)"/>';
        s += '<text x="' + cx0 + '" y="30" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11.5" fill="' + col + '">' + labels[i] + '</text>';
        s += '<line x1="' + (cx0 - 72) + '" y1="' + cy0 + '" x2="' + (cx0 + 72) + '" y2="' + cy0 + '" stroke="rgba(255,255,255,.18)"/><line x1="' + cx0 + '" y1="' + (cy0 - 72) + '" x2="' + cx0 + '" y2="' + (cy0 + 72) + '" stroke="rgba(255,255,255,.18)"/>';
        s += '<text x="' + (cx0 + 70) + '" y="' + (cy0 - 4) + '" font-family="IBM Plex Mono, monospace" font-size="10" fill="' + C.text3 + '">x</text><text x="' + (cx0 + 4) + '" y="' + (cy0 - 66) + '" font-family="IBM Plex Mono, monospace" font-size="10" fill="' + C.text3 + '">y</text>';
        if (d.I > 1e-6) {
          var pts = []; for (var q = 0; q <= 120; q++) { var t = 2 * Math.PI * q / 120, ex = J[0][0] * Math.cos(t) + J[0][1] * Math.sin(t), ey = J[1][0] * Math.cos(t) + J[1][1] * Math.sin(t); pts.push((cx0 + R * ex).toFixed(1) + ' ' + (cy0 - R * ey).toFixed(1)); }
          s += '<path d="M ' + pts.join(' L ') + '" fill="none" stroke="' + col + '" stroke-width="2.2"/>';
          var exn = J[0][0] * Math.cos(wt) + J[0][1] * Math.sin(wt), eyn = J[1][0] * Math.cos(wt) + J[1][1] * Math.sin(wt), tx = cx0 + R * exn, ty = cy0 - R * eyn;
          s += '<line x1="' + cx0 + '" y1="' + cy0 + '" x2="' + tx.toFixed(1) + '" y2="' + ty.toFixed(1) + '" stroke="' + C.red + '" stroke-width="2"/><circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="4.5" fill="' + C.red + '"/>';
        } else s += '<text x="' + cx0 + '" y="' + (cy0 + 4) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" fill="' + C.red + '">blocked</text>';
        s += '<text x="' + cx0 + '" y="236" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + C.text2 + '">I = ' + d.I.toFixed(3) + '</text><text x="' + cx0 + '" y="251" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="' + C.text3 + '">' + d.txt + '</text>';
      });
      // Poincaré sphere
      var cxs = Wd - 125, cys = 160, rs = 100, az = 35 * Math.PI / 180, el = 18 * Math.PI / 180;
      var Pp = function (S1, S2, S3) { var X = S2 * Math.cos(az) - S1 * Math.sin(az), dep = S2 * Math.sin(az) + S1 * Math.cos(az), Y = S3 * Math.cos(el) - dep * Math.sin(el); return [cxs + rs * X, cys - rs * Y, dep]; };
      var ring = function (f, dash) { var p = []; for (var q = 0; q <= 90; q++) { var t = 2 * Math.PI * q / 90, v = f(t), r = Pp(v[0], v[1], v[2]); p.push(r[0].toFixed(1) + ' ' + r[1].toFixed(1)); } return '<path d="M ' + p.join(' L ') + '" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1"' + (dash ? ' stroke-dasharray="3 3"' : '') + '/>'; };
      s += '<circle cx="' + cxs + '" cy="' + cys + '" r="' + rs + '" fill="rgba(69,191,214,.05)" stroke="rgba(255,255,255,.35)"/>';
      s += ring(function (t) { return [Math.cos(t), Math.sin(t), 0]; }) + ring(function (t) { return [Math.cos(t), 0, Math.sin(t)]; }, true) + ring(function (t) { return [0, Math.cos(t), Math.sin(t)]; }, true);
      [[1, 0, 0, 'H'], [-1, 0, 0, 'V'], [0, 1, 0, 'D'], [0, -1, 0, 'A'], [0, 0, 1, 'R'], [0, 0, -1, 'L']].forEach(function (a) { var p = Pp(a[0] * 1.16, a[1] * 1.16, a[2] * 1.16); s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="' + C.text2 + '">' + a[3] + '</text>'; });
      s += '<text x="' + cxs + '" y="22" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="' + C.text2 + '">Poincaré sphere</text>';
      var prev = null;
      states.forEach(function (J, i) { var d = describe(J); if (d.I < 1e-6) { prev = null; return; } var S = d.S, p = Pp(S[1] / S[0], S[2] / S[0], S[3] / S[0]);
        if (prev) s += '<line x1="' + prev[0].toFixed(1) + '" y1="' + prev[1].toFixed(1) + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 3"/>';
        s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (p[2] >= 0 ? 6 : 4.5) + '" fill="' + cols[i % cols.length] + '" fill-opacity="' + (p[2] >= 0 ? 1 : 0.55) + '" stroke="#0f0a18"/><text x="' + (p[0] + 7).toFixed(1) + '" y="' + (p[1] - 6).toFixed(1) + '" font-family="IBM Plex Mono, monospace" font-size="10" fill="' + cols[i % cols.length] + '">' + i + '</text>'; prev = p; });
      host.innerHTML = s + '</svg>';
      var out = states[states.length - 1], d = describe(out), fmt = function (z) { return (Math.abs(z[0]) < 5e-4 ? '0' : z[0].toFixed(3)) + (Math.abs(z[1]) < 5e-4 ? '' : (z[1] >= 0 ? ' + ' : ' − ') + Math.abs(z[1]).toFixed(3) + 'i'); };
      var p0 = JPRESETS[pre.get()];
      read.innerHTML = '<div><b>' + d.I.toFixed(3) + '</b><span>transmitted intensity (input = 1)</span></div><div><b>(' + fmt(out[0]) + ', ' + fmt(out[1]) + ')</b><span>output Jones vector (E_x, E_y)</span></div><div><b>' + d.txt + '</b><span>output state</span></div>' + (p0 ? '<div style="grid-column:1/-1"><b>' + p0.name + '</b><span>' + p0.note + '</span></div>' : '');
    };
    var pre = VL.select(ctl, { label: 'Example', value: 'three', options: Object.keys(JPRESETS).map(function (k) { return [k, JPRESETS[k].name]; }).concat([['custom', 'Custom (set the elements yourself)']]), on: function (v) { apply(v); } });
    var applying = false, manual = function () { if (!applying && pre.get() !== 'custom') pre.el.value = 'custom'; draw(); };
    var inp = VL.select(ctl, { label: 'Input light', value: 'H', options: Object.keys(JNAME).map(function (k) { return [k, JNAME[k]]; }), on: manual });
    var els = [0, 1, 2].map(function (i) {
      var sel = VL.select(ctl, { label: 'Element ' + (i + 1), value: 'none', options: Object.keys(ELN).map(function (k) { return [k, ELN[k]]; }), on: manual });
      var ang = VL.slider(ctl, { label: 'Angle of element ' + (i + 1), min: -90, max: 90, step: 0.5, value: 0, fmt: function (v) { return v + '°'; }, on: manual });
      return { sel: sel, ang: ang };
    });
    var gam = VL.slider(ctl, { label: 'Retardance Γ of “retarder”', min: 0, max: 360, step: 1, value: 90, fmt: function (v) { return v + '°'; }, on: function () { draw(); } });
    var apply = function (k) { var p = JPRESETS[k]; if (!p) { draw(); return; } applying = true; inp.el.value = p.input; p.els.forEach(function (e, i) { els[i].sel.el.value = e[0]; els[i].ang.set(e[1]); }); gam.set(p.G); applying = false; draw(); };
    var loop = VL.loop(host, function (dt) { if (!dt) return; wt += dt * 2 * Math.PI * 0.4; draw(); });
    var btn = VL.button(ctl, loop.playing ? 'Stop' : 'Start', function () { btn.textContent = loop.toggle() ? 'Stop' : 'Start'; }, 'primary');
    apply('three');
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

  /* ═══ 4b. TE and TM in different structures (animated 3D) ═══ */
  // Scene coordinates: x to the right, v up, y into the page (drawn back and to the right).
  var V3 = { add: function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }, mul: function (a, s) { return [a[0] * s, a[1] * s, a[2] * s]; },
    cross: function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
    norm: function (a) { var L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; } };
  var TETM = {
    iface: { name: 'Plane interface (reflection, refraction)', angle: true,
      ref: 'the plane of incidence — the plane that contains the incoming ray k and the surface normal n',
      te: 'E sticks out of the plane of incidence: it is parallel to the surface (s polarisation, from German “senkrecht”).',
      tm: 'E lies in the plane of incidence and H sticks out of it (p polarisation, “parallel”). Only this polarisation has a Brewster angle.',
      comps: ['E_y only (H_x, H_v)', 'H_y only (E_x, E_v)'] },
    grating: { name: '1D grating, classical mounting', angle: true,
      ref: 'the plane of incidence, which here is perpendicular to the grooves',
      te: 'E is parallel to the grooves (lines along y).',
      tm: 'E is perpendicular to the grooves, in the plane of incidence; H is parallel to the grooves. TM pushes charge across the ridges — the polarisation that excites surface plasmons on metal gratings and that a wire-grid polariser transmits.',
      comps: ['E ∥ grooves', 'H ∥ grooves'] },
    conical: { name: '1D grating, conical mounting', angle: true, azi: true,
      ref: 'the plane of incidence, which is now rotated away from the grating vector',
      te: 'E is perpendicular to the (rotated) plane of incidence — no longer parallel to the grooves.',
      tm: 'E lies in the rotated plane of incidence. In conical mounting the grating mixes TE and TM: diffracted orders contain both, so the labels describe the input only.',
      comps: ['E ⟂ plane of incidence', 'E in plane of incidence'] },
    slab: { name: 'Slab waveguide', ref: 'the plane containing the propagation direction (x) and the direction in which the index changes (v)',
      te: 'E points along y, parallel to the layers; there is no E along the propagation direction.',
      tm: 'H points along y; E lies in the x–v plane, mostly across the layers (with a small component along x).',
      comps: ['E_y, H_x, H_v', 'H_y, E_x, E_v'] },
    strip: { name: 'Silicon strip waveguide (quasi-TE / quasi-TM)', ref: 'the chip surface: a rectangular wire is guided in two directions, so the modes are hybrid and named by their dominant E',
      te: 'quasi-TE: the main E points across the width, parallel to the substrate (higher effective index in a 450 × 220 nm wire).',
      tm: 'quasi-TM: the main E points vertically, perpendicular to the substrate.',
      comps: ['dominant E_y (horizontal)', 'dominant E_v (vertical)'] },
    spp: { name: 'Metal surface: surface plasmon', ref: 'the plane containing the propagation direction (x) and the surface normal (v)',
      te: 'TE: E would be parallel to the surface along y — it cannot pile up surface charge, so no surface plasmon exists. (A TE wave only reflects.)',
      tm: 'TM: E has a component normal to the surface, which drives the oscillating surface charge (+ − + −) of the surface plasmon. Surface plasmons are TM only; in the Kretschmann SPR geometry only p light shows the dip.',
      comps: ['not supported', 'E_v and E_x, H_y'] },
    phc: { name: '2D photonic crystal of rods', ref: 'the plane of periodicity (x–y); the rods are uniform along v. NOTE: this convention is opposite to gratings',
      te: 'TE (photonic-crystal convention): E lies in the plane of periodicity, H along the rods. Hole lattices tend to have TE band gaps.',
      tm: 'TM (photonic-crystal convention): E along the rods, H in the plane. Lattices of dielectric rods tend to have TM band gaps.',
      comps: ['E in x–y plane, H ∥ rods', 'E ∥ rods, H in x–y plane'] },
    metalwg: { name: 'Hollow metal waveguide (TE₁₀ / TM₁₁)', ref: 'the propagation direction x: TE has no E along x, TM has no H along x',
      te: 'TE₁₀: E is purely transverse (vertical here), largest in the middle and zero at the side walls; H has a component along x.',
      tm: 'TM₁₁: E has a component along the propagation direction (drawn here), zero on all four walls; H is purely transverse.',
      comps: ['E_x = 0, H_x ≠ 0', 'H_x = 0, E_x ≠ 0'] },
    fibre: { name: 'Optical fibre, cross-section (TE₀₁ / TM₀₁)', ref: 'the fibre axis: TE has no E along the axis, TM has no H along it. Most fibre modes are hybrid (HE, EH); TE₀₁ and TM₀₁ are the pure ones',
      te: 'TE₀₁: E circles around the axis (azimuthal).',
      tm: 'TM₀₁: E points radially, out from the axis and back.',
      comps: ['E azimuthal', 'E radial'] }
  };
  F.tetm = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout'), t0 = 0;
    var W = 780, H = 420, S = 150, ox = 380, oy = 250, S0 = 150, ox0 = 380, oy0 = 250, depth = [0.55 * Math.cos(Math.PI / 6), -0.55 * Math.sin(Math.PI / 6)];
    var cam = null;   // null: oblique view; {a, e}: rotated view (azimuth a, elevation e, radians)
    var P = function (q) {
      if (!cam) return [ox + S * (q[0] + q[1] * depth[0]), oy - S * q[2] + S * q[1] * depth[1]];
      var X = q[0] * Math.cos(cam.a) + q[1] * Math.sin(cam.a), Dp = -q[0] * Math.sin(cam.a) + q[1] * Math.cos(cam.a);
      return [ox + S * X, oy - S * (q[2] * Math.cos(cam.e) + Dp * Math.sin(cam.e))];
    };
    var f1 = function (n) { return n.toFixed(1); }, pt = function (q) { var p = P(q); return f1(p[0]) + ' ' + f1(p[1]); };
    var poly = function (qs, fill, op, stroke) { return '<path d="M ' + qs.map(pt).join(' L ') + ' Z" fill="' + fill + '" fill-opacity="' + op + '" stroke="' + (stroke || fill) + '" stroke-opacity="' + Math.min(1, op * 3 + 0.15) + '" stroke-width="1"/>'; };
    var box = function (x0, x1, y0, y1, v0, v1, col, op) {
      return poly([[x0, y0, v0], [x1, y0, v0], [x1, y0, v1], [x0, y0, v1]], col, op) + poly([[x0, y0, v1], [x1, y0, v1], [x1, y1, v1], [x0, y1, v1]], col, op * 0.8) + poly([[x1, y0, v0], [x1, y1, v0], [x1, y1, v1], [x1, y0, v1]], col, op * 0.6);
    };
    var arrow2 = function (a, b, col, w, hs, dash) { var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1.5) return ''; hs = Math.min(hs || 9, L * 0.7); var ux = dx / L, uy = dy / L, e = [b[0] - ux * hs * 0.7, b[1] - uy * hs * 0.7], hw = hs * 0.45;
      return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(e[0]) + '" y2="' + f1(e[1]) + '" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/><path d="M ' + f1(b[0]) + ' ' + f1(b[1]) + ' L ' + f1(b[0] - ux * hs + uy * hw) + ' ' + f1(b[1] - uy * hs - ux * hw) + ' L ' + f1(b[0] - ux * hs - uy * hw) + ' ' + f1(b[1] - uy * hs + ux * hw) + ' Z" fill="' + col + '"/>'; };
    var arrow3 = function (a, b, col, w, hs, dash) { return arrow2(P(a), P(b), col, w, hs, dash); };
    var label = function (q, s, col, dx, dy, size) { var p = P(q); return '<text x="' + f1(p[0] + (dx || 0)) + '" y="' + f1(p[1] + (dy || 0)) + '" font-family="IBM Plex Mono, monospace" font-size="' + (size || 13) + '" font-weight="600" fill="' + col + '">' + s + '</text>'; };
    var axes = function () { var o = [-1.75, -0.95, -0.55], L = 0.28; return arrow3(o, [o[0] + L, o[1], o[2]], C.text2, 1.4, 7) + arrow3(o, [o[0], o[1], o[2] + L], C.text2, 1.4, 7) + arrow3(o, [o[0], o[1] + L * 1.4, o[2]], C.text2, 1.4, 7) + label([o[0] + L, o[1], o[2]], 'x', C.text2, 3, 4, 11) + label([o[0], o[1], o[2] + L], 'v', C.text2, -4, -4, 11) + label([o[0], o[1] + L * 1.4, o[2]], 'y', C.text2, 3, 0, 11); };
    var draw = function () {
      var key = st.get(), D = TETM[key], both = pol.get() === 'both' && D.angle, te = pol.get() === 'te' || (pol.get() === 'both' && !D.angle), th = (D.angle ? ang.get() : 0) * Math.PI / 180, ph = (D.azi ? azi.get() : 0) * Math.PI / 180, showH = hsel.get() === 'yes';
      var wt = t0 * 2 * Math.PI * 0.6, red = C.red, cyan = C.cyan, gold = C.au, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plot" role="img" aria-label="' + D.name + '">';
      var Ecol = red, Hcol = cyan, TMcol = C.green;
      // interface and gratings: a camera that turns slowly back and forth, so the plane E lies in shows in 3D
      var orbitCase = key === 'iface' || key === 'grating' || key === 'conical';
      if (orbitCase) { cam = { a: (-10 + (view.get() === 'turn' ? 16 * Math.sin(0.45 * t0) : 0)) * Math.PI / 180, e: 24 * Math.PI / 180 }; S = 128; ox = 300; oy = 262; }
      else { cam = null; S = S0; ox = ox0; oy = oy0; }
      // the E field as a filled wave sheet along a ray: it lies in whatever plane E oscillates in
      var sheet = function (pos0, kdir, Edir, len, amp, lam, colS) { colS = colS || Ecol;
        var tips = [], axis = [];
        for (var i = 0; i <= 48; i++) { var sa = len * i / 48, c = Math.cos(2 * Math.PI * sa / lam - wt), p = V3.add(pos0, V3.mul(kdir, sa)); axis.push(p); tips.push(V3.add(p, V3.mul(Edir, 1.45 * amp * c))); }
        var d = 'M ' + tips.map(pt).join(' L ') + ' L ' + axis.slice().reverse().map(pt).join(' L ') + ' Z';
        return '<path d="' + d + '" fill="' + colS + '" fill-opacity="0.22" stroke="none"/><path d="M ' + tips.map(pt).join(' L ') + '" fill="none" stroke="' + colS + '" stroke-width="1.6" stroke-opacity="0.9"/>';
      };
      // the same field seen along the beam: the plane of incidence is a vertical gold line
      var beamEye = function (te2) {
        var bx = W - 112, by = 118, r = 62, c = Math.cos(wt), L = 50 * c, o = '';
        o += '<rect x="' + (bx - 94) + '" y="' + (by - 98) + '" width="188" height="200" rx="10" fill="#0f0a18" fill-opacity="0.85" stroke="rgba(255,255,255,.18)"/>';
        o += '<text x="' + bx + '" y="' + (by - 78) + '" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="' + C.text2 + '">seen along the beam</text>';
        o += '<circle cx="' + bx + '" cy="' + by + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.22)" stroke-dasharray="3 4"/>';
        o += '<line x1="' + bx + '" y1="' + (by - r - 6) + '" x2="' + bx + '" y2="' + (by + r + 6) + '" stroke="' + gold + '" stroke-width="3" stroke-opacity="0.85"/>';
        o += '<text x="' + bx + '" y="' + (by + r + 22) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="' + gold + '">plane of incidence</text>';
        o += '<circle cx="' + bx + '" cy="' + by + '" r="3" fill="' + gold + '"/>';
        var one = function (isTE, colI) { var a = isTE ? [bx - L, by] : [bx, by - L], b2 = isTE ? [bx + L, by] : [bx, by + L];
          return Math.abs(L) > 3 ? arrow2([bx, by], b2, colI, 3.4, 12) + '<line x1="' + bx + '" y1="' + by + '" x2="' + f1(a[0]) + '" y2="' + f1(a[1]) + '" stroke="' + colI + '" stroke-width="1.4" stroke-opacity="0.45" stroke-dasharray="3 3"/>' : ''; };
        if (both) { o += one(true, red) + one(false, TMcol);
          o += '<text x="' + (bx - 46) + '" y="' + (by + r + 38) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="' + red + '">TE: across</text><text x="' + (bx + 46) + '" y="' + (by + r + 38) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="' + TMcol + '">TM: along</text>'; }
        else o += one(te2, Ecol) + '<text x="' + bx + '" y="' + (by + r + 38) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="' + Ecol + '">' + (te2 ? 'E across the plane' : 'E along the plane') + '</text>';
        return o;
      };
      var fieldAlong = function (pos0, kdir, Edir, n, len, amp, opts) { // arrows of E (and H) at points along a ray, travelling wave
        var out = '', Hdir = V3.norm(V3.cross(kdir, Edir));
        for (var i = 0; i < n; i++) { var sAlong = len * i / (n - 1), c = Math.cos(2 * Math.PI * (sAlong / (opts && opts.lam || 0.5)) - wt), p = V3.add(pos0, V3.mul(kdir, sAlong));
          out += arrow3(p, V3.add(p, V3.mul(Edir, 1.45 * amp * c)), Ecol, 2.8, 10);
          if (showH) out += arrow3(p, V3.add(p, V3.mul(Hdir, amp * c)), Hcol, 2, 8); }
        return out; };
      if (key === 'iface' || key === 'grating' || key === 'conical') {
        var hor = [Math.cos(ph), Math.sin(ph), 0], k = V3.norm([Math.sin(th) * hor[0], Math.sin(th) * hor[1], -Math.cos(th)]), n = [0, 0, 1];
        var Ete = V3.norm(Math.sin(th) < 1e-6 ? [ -hor[1], hor[0], 0] : V3.cross(n, k)), Etm = V3.norm(V3.cross(Ete, k)), E = te ? Ete : Etm;
        // substrate (and grating ridges)
        var yd = 0.55;   // a shallower block reads better in the turning view
        s += box(-1.6, 1.6, -yd, yd, -0.42, key === 'iface' ? 0 : -0.06, key === 'iface' ? C.cyan : C.violet, 0.16);
        if (key !== 'iface') for (var gx = -1.5; gx < 1.6; gx += 0.36) s += box(gx, gx + 0.18, -yd, yd, -0.06, 0.06, C.violet, 0.3);
        // plane of incidence
        var pl = [V3.mul(hor, -1.55), V3.mul(hor, 1.55)];
        s += poly([[pl[0][0], pl[0][1], 0], [pl[1][0], pl[1][1], 0], [pl[1][0], pl[1][1], 1.25], [pl[0][0], pl[0][1], 1.25]], gold, 0.06, gold);
        s += label([pl[0][0], pl[0][1], 1.25], 'plane of incidence', gold, 4, -8, 12);
        s += arrow3([0, 0, 0], [0, 0, 1.15], C.text2, 1.2, 8, true) + label([0, 0, 1.15], 'n', C.text2, 5, 4);
        // incoming ray and its fields
        var start = V3.mul(k, -1.35);
        s += arrow3(start, V3.mul(k, -0.04), gold, 2.2, 10) + label(start, 'k', gold, -16, 10);
        var r = [k[0], k[1], -k[2]]; s += arrow3([0, 0, 0], V3.mul(r, 0.9), gold, 1.2, 8, true);
        if (both) { s += sheet(start, k, Etm, 1.25, 0.26, 0.6, TMcol) + sheet(start, k, Ete, 1.25, 0.26, 0.6, red); Ecol = TMcol; s += fieldAlong(start, k, Etm, 4, 1.2, 0.26, { lam: 0.6 }); Ecol = red; s += fieldAlong(start, k, Ete, 4, 1.2, 0.26, { lam: 0.6 }); }
        else s += sheet(start, k, E, 1.25, 0.26, 0.6) + fieldAlong(start, k, E, 4, 1.2, 0.26, { lam: 0.6 });
        if (key !== 'iface') s += '<text x="16" y="' + (H - 14) + '" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600" fill="' + C.violet + '">grating lines (grooves) run along y</text>';
        s += beamEye(te);
      } else if (key === 'slab') {
        s += box(-1.6, 1.6, -0.9, 0.9, -0.5, -0.12, C.cyan, 0.12) + box(-1.6, 1.6, -0.9, 0.9, -0.12, 0.0, gold, 0.28);
        s += label([1.6, 0.9, -0.06], 'core', gold, 6, 0, 12) + label([1.6, 0.9, -0.35], 'substrate', C.cyan, 6, 0, 12);
        s += arrow3([-1.75, 0, -0.06], [-1.45, 0, -0.06], gold, 2.2, 10) + label([-1.75, 0, -0.06], 'k', gold, -12, -6);
        s += fieldAlong([-1.4, 0, -0.06], [1, 0, 0], te ? [0, 1, 0] : [0, 0, 1], 9, 2.8, 0.3);
      } else if (key === 'strip') {
        s += box(-1.6, 1.6, -0.9, 0.9, -0.35, 0, C.cyan, 0.12) + box(-1.6, 1.6, -0.22, 0.22, 0, 0.16, gold, 0.4);
        s += label([1.6, 0.22, 0.16], 'Si wire', gold, 6, 0, 12) + label([1.6, 0.9, -0.2], 'SiO₂', C.cyan, 6, 0, 12);
        s += arrow3([-1.8, 0, 0.08], [-1.5, 0, 0.08], gold, 2.2, 10) + label([-1.8, 0, 0.08], 'k', gold, -12, -6);
        s += fieldAlong([-1.4, 0, 0.08], [1, 0, 0], te ? [0, 1, 0] : [0, 0, 1], 9, 2.8, 0.28);
      } else if (key === 'spp') {
        s += box(-1.6, 1.6, -0.9, 0.9, -0.42, 0, '#b9bec8', 0.22) + label([1.6, 0.9, -0.2], 'metal', C.text2, 6, 0, 12) + label([1.6, 0.9, 0.3], 'dielectric', C.text2, 6, 0, 12);
        s += arrow3([-1.8, 0, 0.12], [-1.5, 0, 0.12], gold, 2.2, 10) + label([-1.8, 0, 0.12], 'k', gold, -12, -6);
        if (te) { for (var i = 0; i < 9; i++) { var x = -1.4 + 2.8 * i / 8, c = Math.cos(2 * Math.PI * x / 0.7 - wt); s += arrow3([x, 0, 0.12], [x, 0.28 * c, 0.12], red, 1.6, 7, true); }
          s += label([-0.6, 0, 0.75], 'no surface plasmon for TE', red, 0, 0, 14);
        } else {
          for (var j = 0; j < 13; j++) { var xx = -1.5 + 3.0 * j / 12, ph2 = 2 * Math.PI * xx / 0.9 - wt, cv = Math.cos(ph2), sx = Math.sin(ph2);
            [0.05, 0.3, 0.6].forEach(function (h, hi) { var a = Math.exp(-h / 0.35) * 0.3; s += arrow3([xx, 0, h], [xx + a * 0.6 * sx, 0, h + a * cv], red, hi ? 1.2 : 1.8, 6); });
            var p0 = P([xx, 0, 0]); s += '<text x="' + f1(p0[0] - 4) + '" y="' + f1(p0[1] + 14) + '" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="700" fill="' + (cv > 0 ? '#e0a82e' : '#45bfd6') + '" opacity="' + Math.abs(cv).toFixed(2) + '">' + (cv > 0 ? '+' : '−') + '</text>'; }
        }
      } else if (key === 'phc') {
        s += box(-1.6, 1.6, -0.9, 0.9, -0.12, -0.04, C.text3, 0.15);
        for (var gx2 = -1.4; gx2 <= 1.41; gx2 += 0.35) for (var gy = -0.7; gy <= 0.71; gy += 0.35) if (Math.abs(gy) > 0.01) s += box(gx2 - 0.05, gx2 + 0.05, gy - 0.05, gy + 0.05, -0.04, 0.75, gold, 0.2);
        s += label([1.6, 0.7, 0.75], 'rods along v', gold, 6, 0, 12) + label([-1.6, -0.9, -0.12], 'one row removed: a line-defect waveguide', C.text3, 0, 18, 11);
        s += arrow3([-1.85, 0, 0.35], [-1.55, 0, 0.35], C.au, 2.2, 10) + label([-1.85, 0, 0.35], 'k', C.au, -12, -6);
        s += fieldAlong([-1.45, 0, 0.35], [1, 0, 0], te ? [0, 1, 0] : [0, 0, 1], 9, 2.9, 0.26);
      } else if (key === 'metalwg') {
        var a = 0.55, b = 0.28;
        s += box(-1.6, 1.6, -a, a, -b, b, '#b9bec8', 0.12) + label([1.6, a, b], 'metal walls', C.text2, 6, 0, 12);
        s += arrow3([-1.85, 0, 0], [-1.55, 0, 0], gold, 2.2, 10) + label([-1.85, 0, 0], 'k', gold, -12, -6);
        for (var ix = 0; ix < 7; ix++) { var X = -1.35 + 2.7 * ix / 6, cc = Math.cos(2 * Math.PI * X / 1.2 - wt);
          for (var iy = 0; iy < 5; iy++) { var Y = -a + 2 * a * (iy + 0.5) / 5;
            if (te) { var amp = Math.cos(Math.PI * Y / (2 * a)) * 0.22 * cc; s += arrow3([X, Y, -amp / 2], [X, Y, amp / 2], red, 1.6, 6); }
            else [-b / 2, b / 2].forEach(function (Z) { var am = Math.cos(Math.PI * Y / (2 * a)) * Math.cos(Math.PI * Z / (2 * b)) * 0.22 * Math.sin(2 * Math.PI * X / 1.2 - wt); s += arrow3([X - am / 2, Y, Z], [X + am / 2, Y, Z], red, 1.4, 6); }); } }
      } else if (key === 'fibre') {
        var cx2 = W / 2, cy2 = H / 2 + 10, R = 120, osc = Math.cos(wt);
        s += '<circle cx="' + cx2 + '" cy="' + cy2 + '" r="' + (R * 1.55) + '" fill="' + C.cyan + '" fill-opacity="0.08" stroke="' + C.cyan + '" stroke-opacity="0.35"/><circle cx="' + cx2 + '" cy="' + cy2 + '" r="' + R + '" fill="' + gold + '" fill-opacity="0.16" stroke="' + gold + '" stroke-opacity="0.6"/>';
        s += '<text x="' + (cx2 + R * 1.1) + '" y="' + (cy2 - R * 1.3) + '" font-family="IBM Plex Mono, monospace" font-size="12" fill="' + C.cyan + '">cladding</text><text x="' + (cx2 - 22) + '" y="' + (cy2 - R + 18) + '" font-family="IBM Plex Mono, monospace" font-size="12" fill="' + gold + '">core</text>';
        s += '<circle cx="' + cx2 + '" cy="' + cy2 + '" r="5" fill="none" stroke="' + C.text2 + '"/><circle cx="' + cx2 + '" cy="' + cy2 + '" r="1.6" fill="' + C.text2 + '"/><text x="' + (cx2 + 9) + '" y="' + (cy2 + 18) + '" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + C.text2 + '">k (out of the page)</text>';
        [0.35, 0.7, 1.05, 1.35].forEach(function (rr) { var prof = rr < 1 ? Math.sin(Math.PI * rr * 0.8) : Math.sin(Math.PI * 0.8) * Math.exp(-(rr - 1) * 3), nA = Math.round(8 + rr * 8);
          for (var q = 0; q < nA; q++) { var t2 = 2 * Math.PI * q / nA, px = cx2 + R * rr * Math.cos(t2), py = cy2 + R * rr * Math.sin(t2), L = 26 * prof * osc;
            var dir = te ? [-Math.sin(t2), Math.cos(t2)] : [Math.cos(t2), Math.sin(t2)];
            s += arrow2([px - dir[0] * L / 2, py - dir[1] * L / 2], [px + dir[0] * L / 2, py + dir[1] * L / 2], red, 1.6, 7); } });
      }
      if (key !== 'fibre') s += axes();
      s += '<text x="16" y="24" font-family="IBM Plex Sans, sans-serif" font-size="15" font-weight="700" fill="' + (te ? C.red : C.au) + '">' + (both ? 'TE and TM' : key === 'strip' ? (te ? 'quasi-TE' : 'quasi-TM') : te ? 'TE' : 'TM') + '</text><text x="16" y="44" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + C.text3 + '">' + (both ? 'red: E of TE · green: E of TM' : 'red: E' + (showH && key !== 'fibre' && key !== 'metalwg' && key !== 'spp' ? ' · cyan: H' : '')) + '</text>';
      host.innerHTML = s + '</svg>';
      read.innerHTML = '<div style="grid-column:1/-1"><b>Reference</b><span>TE and TM are defined relative to ' + D.ref + '.</span></div>' + (both
        ? '<div style="grid-column:1/-1"><b style="color:' + C.red + '">TE</b><span>' + D.te + '</span></div><div style="grid-column:1/-1"><b style="color:' + C.green + '">TM</b><span>' + D.tm + '</span></div>'
        : '<div style="grid-column:1/-1"><b style="color:' + (te ? C.red : C.au) + '">' + (te ? 'TE' : 'TM') + ' here</b><span>' + (te ? D.te : D.tm) + '</span></div><div><b>' + D.comps[te ? 0 : 1] + '</b><span>field components</span></div>');
    };
    var st = VL.select(ctl, { label: 'Structure', value: 'iface', options: Object.keys(TETM).map(function (k) { return [k, TETM[k].name]; }), on: function () { sync(); draw(); } });
    var pol = VL.select(ctl, { label: 'Polarisation', value: 'te', options: [['te', 'TE'], ['tm', 'TM'], ['both', 'TE and TM together']], on: draw });
    var ang = VL.slider(ctl, { label: 'Angle of incidence', min: 0, max: 75, step: 1, value: 40, fmt: function (v) { return v + '°'; }, on: draw });
    var azi = VL.slider(ctl, { label: 'Azimuth (conical)', min: 0, max: 80, step: 1, value: 40, fmt: function (v) { return v + '°'; }, on: draw });
    var hsel = VL.select(ctl, { label: 'Show H', value: 'no', options: [['no', 'No'], ['yes', 'Yes']], on: draw });
    var view = VL.select(ctl, { label: 'View', value: 'turn', options: [['turn', 'turning slowly (3D)'], ['fixed', 'fixed']], on: draw });
    var sync = function () { var D = TETM[st.get()]; ang.input.closest('.vl-ctl').style.display = D.angle ? '' : 'none'; azi.input.closest('.vl-ctl').style.display = D.azi ? '' : 'none'; view.el.closest('.vl-ctl').style.display = D.angle ? '' : 'none'; };
    var loop = VL.loop(host, function (dt) { if (!dt) return; t0 += dt; draw(); });
    var btn = VL.button(ctl, loop.playing ? 'Stop' : 'Start', function () { btn.textContent = loop.toggle() ? 'Stop' : 'Start'; }, 'primary');
    sync(); draw();
  };

  /* ═══ 4c. TE or TM? a self-test ═══ */
  var QUIZ = [
    ['Light hits a glass plate at 45°. Its electric field points out of the plane of incidence, parallel to the surface.', 'TE', 'E ⟂ plane of incidence = TE (s).'],
    ['Same plate; now E lies in the plane of incidence.', 'TM', 'E in the plane of incidence = TM (p).'],
    ['At Brewster’s angle one polarisation is not reflected at all. Which?', 'TM', 'r_p = 0 at Brewster’s angle: TM (p) is fully transmitted.'],
    ['In a Kretschmann SPR measurement, the reflectance dip appears for which polarisation?', 'TM', 'Surface plasmons need E normal to the metal surface: only TM (p) excites them.'],
    ['A grating has its lines along y; the light travels in the x–z plane with E along y.', 'TE', 'Classical mounting: E parallel to the grooves = TE.'],
    ['Same grating; E now oscillates along x, across the grooves.', 'TM', 'E perpendicular to the grooves (H parallel to them) = TM.'],
    ['A wire-grid polariser (metal wires along y) transmits light with E along x. In grating language, the transmitted light is…', 'TM', 'E across the wires = TM; E along the wires (TE) drives currents in the wires and is reflected.'],
    ['A slab waveguide mode has only E_y, H_x and H_z (propagation along z, layers normal to x).', 'TE', 'No E along the propagation direction and E parallel to the layers = TE.'],
    ['A 450 × 220 nm silicon wire guides a mode whose main electric field is horizontal, parallel to the chip.', 'TE', 'Dominant E parallel to the substrate = quasi-TE (the fundamental mode of a standard Si wire).'],
    ['A hollow rectangular metal waveguide mode has E_z = 0 and H_z ≠ 0 (propagation along z).', 'TE', 'No electric field along the propagation direction = TE (e.g. TE₁₀).'],
    ['A 2D photonic crystal of dielectric rods: the mode has E along the rod axis.', 'TM', 'Photonic-crystal convention: E along the uniform axis (H in the periodic plane) = TM — opposite to the grating naming.'],
    ['A fibre mode whose electric field points purely radially.', 'TM', 'Radial E, no H along the axis: TM₀₁ (azimuthal E would be TE₀₁).'],
    ['Light falls on a flat surface at exactly normal incidence. Is it TE or TM?', 'Neither', 'At normal incidence the plane of incidence is undefined: every polarisation reflects identically, and the labels lose their meaning.'],
    ['The fundamental mode of a coaxial cable has neither E nor H along the cable.', 'Neither', 'That is a TEM mode (transverse electric and magnetic), possible only with two conductors.']
  ];
  F.tetmquiz = function (fig) {
    var box = VL.part(fig, 'vl-plot'), i = 0, score = 0, done = 0, answered = false;
    var order = QUIZ.map(function (_, k) { return k; });
    var render = function (fb) {
      var q = QUIZ[order[i]];
      box.innerHTML = '<div class="quiz"><p class="quiz-n">Question ' + (i + 1) + ' of ' + QUIZ.length + ' · score ' + score + ' / ' + done + '</p><p class="quiz-q">' + q[0] + '</p><div class="quiz-a">' +
        ['TE', 'TM', 'Neither'].map(function (o) { return '<button type="button" class="vl-btn" data-a="' + o + '"' + (answered ? ' disabled' : '') + '>' + (o === 'Neither' ? 'Neither / both' : o) + '</button>'; }).join('') +
        '</div>' + (fb || '') + '<div class="quiz-nav"><button type="button" class="vl-btn primary" data-next="1"' + (answered ? '' : ' disabled') + '>' + (i < QUIZ.length - 1 ? 'Next question →' : 'Start again') + '</button></div></div>';
      box.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { if (answered) return; answered = true; done++; var ok = b.getAttribute('data-a') === q[1]; if (ok) score++;
        render('<p class="quiz-fb ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Correct.' : 'Not quite — the answer is ' + (q[1] === 'Neither' ? 'neither / both' : q[1]) + '.') + '</b> ' + q[2] + '</p>'); }; });
      var nx = box.querySelector('[data-next]'); nx.onclick = function () { if (!answered) return; answered = false; if (i < QUIZ.length - 1) i++; else { i = 0; score = 0; done = 0; } render(); };
    };
    render();
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
