/* ═══════════════════════════════════════════════════════════════════
   Vacuum & deposition article — shared helpers and small figures.
   Plain JavaScript, no libraries. Every figure is found by its
   data-fig attribute and draws itself; without JavaScript the
   article still reads, only the interactive figures are missing.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var VL = window.VL = window.VL || {};
  var C = VL.col = { au: '#e0a82e', red: '#e2566e', cyan: '#45bfd6', green: '#7fd18b', violet: '#a98bf0', text: '#efeaf6', text2: '#b6acc8', text3: '#837a94', grid: 'rgba(255,255,255,.08)', axis: 'rgba(255,255,255,.35)', bg: '#171026' };
  VL.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── numbers ─────────────────────────────────────────────── */
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  VL.sup = function (s) { return String(s).split('').map(function (c) { return SUP[c] || c; }).join(''); };
  VL.sci = function (v, d) {
    if (!isFinite(v)) return '—'; if (v === 0) return '0';
    d = d == null ? 2 : d; var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    if (+m.toFixed(d - 1) >= 10) { m /= 10; e += 1; }
    if (e >= -2 && e <= 3) return (+v.toPrecision(d + 1)).toString();
    return m.toFixed(d - 1) + '×10' + VL.sup(e);
  };
  VL.fmtTime = function (s) {
    if (!isFinite(s)) return '—';
    if (s < 1e-3) return VL.sci(s * 1e6, 2) + ' µs'; if (s < 1) return (s * 1e3).toPrecision(3) + ' ms';
    if (s < 120) return s.toPrecision(3) + ' s'; if (s < 7200) return (s / 60).toPrecision(3) + ' min';
    if (s < 172800) return (s / 3600).toPrecision(3) + ' h'; if (s < 3.15e7 * 2) return (s / 86400).toPrecision(3) + ' days';
    return VL.sci(s / 3.15e7, 2) + ' years';
  };
  VL.fmtLen = function (m) {
    if (m < 1e-6) return (m * 1e9).toPrecision(3) + ' nm'; if (m < 1e-3) return (m * 1e6).toPrecision(3) + ' µm';
    if (m < 1e-2) return (m * 1e3).toPrecision(3) + ' mm'; if (m < 1) return (m * 100).toPrecision(3) + ' cm';
    if (m < 1000) return m.toPrecision(3) + ' m'; return VL.sci(m / 1000, 2) + ' km';
  };
  VL.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  VL.esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  /* ── physics constants ───────────────────────────────────── */
  VL.k = 1.380649e-23; VL.e = 1.602176634e-19; VL.me = 9.1093837e-31; VL.h = 6.62607015e-34; VL.c = 2.99792458e8; VL.amu = 1.66053907e-27; VL.NA = 6.02214076e23;
  VL.mfp = function (pmbar, T, d) { T = T || 293; d = d || 3.7e-10; return VL.k * T / (Math.SQRT2 * Math.PI * d * d * pmbar * 100); }; // metres
  VL.flux = function (pmbar, M, T) { T = T || 293; M = M || 28; return pmbar * 100 / Math.sqrt(2 * Math.PI * M * VL.amu * VL.k * T); }; // m⁻² s⁻¹

  /* ── a small SVG plotter ─────────────────────────────────── */
  function ticks(min, max, log) {
    var out = [];
    if (log) { for (var e = Math.ceil(Math.log10(min) - 1e-9); e <= Math.floor(Math.log10(max) + 1e-9); e++) out.push({ v: Math.pow(10, e), l: '10' + VL.sup(e) }); var step = Math.ceil(out.length / 9); if (step > 1) out = out.filter(function (t, i) { return i % step === 0; }); return out; }
    var span = max - min, raw = span / 6, mag = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 2.5, 5, 10].map(function (k) { return k * mag; }).find(function (k) { return span / k <= 7; });
    for (var v = Math.ceil(min / st - 1e-9) * st; v <= max + st * 1e-6; v += st) out.push({ v: v, l: +v.toPrecision(6) + '' });
    return out;
  }
  VL.plot = function (o) {
    var W = o.w || 640, Hh = o.h || 340, m = Object.assign({ l: 62, r: 18, t: 16, b: 46 }, o.m || {}), pw = W - m.l - m.r, ph = Hh - m.t - m.b;
    var X = o.x, Y = o.y, lx = X.log, ly = Y.log;
    var fx = function (v) { return m.l + (lx ? (Math.log10(v) - Math.log10(X.min)) / (Math.log10(X.max) - Math.log10(X.min)) : (v - X.min) / (X.max - X.min)) * pw; };
    var fy = function (v) { return m.t + ph - (ly ? (Math.log10(v) - Math.log10(Y.min)) / (Math.log10(Y.max) - Math.log10(Y.min)) : (v - Y.min) / (Y.max - Y.min)) * ph; };
    if (X.rev) { var fx0 = fx; fx = function (v) { return m.l + pw - (fx0(v) - m.l); }; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="plot" role="img" aria-label="' + VL.esc(o.label || '') + '"><defs><clipPath id="' + (o.id || 'p') + '-clip"><rect x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/></clipPath></defs>';
    (o.bands || []).forEach(function (b) { var x0 = fx(b.x0), x1 = fx(b.x1); s += '<rect x="' + Math.min(x0, x1) + '" y="' + m.t + '" width="' + Math.abs(x1 - x0) + '" height="' + ph + '" fill="' + b.color + '" opacity="' + (b.op || 0.1) + '"/>' + (b.label ? '<text x="' + (x0 + x1) / 2 + '" y="' + (m.t + 12) + '" class="pl-band">' + b.label + '</text>' : ''); });
    (o.hbands || []).forEach(function (b) { var y0 = fy(b.y0), y1 = fy(b.y1); s += '<rect x="' + m.l + '" y="' + Math.min(y0, y1) + '" width="' + pw + '" height="' + Math.abs(y1 - y0) + '" fill="' + b.color + '" opacity="' + (b.op || 0.1) + '"/>'; });
    ticks(X.min, X.max, lx).forEach(function (t) { var x = fx(t.v); s += '<line x1="' + x + '" x2="' + x + '" y1="' + m.t + '" y2="' + (m.t + ph) + '" stroke="' + C.grid + '"/><text x="' + x + '" y="' + (m.t + ph + 16) + '" class="pl-tick" text-anchor="middle">' + (X.fmt ? X.fmt(t.v) : t.l) + '</text>'; });
    ticks(Y.min, Y.max, ly).forEach(function (t) { var y = fy(t.v); s += '<line x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.grid + '"/><text x="' + (m.l - 7) + '" y="' + (y + 3.5) + '" class="pl-tick" text-anchor="end">' + (Y.fmt ? Y.fmt(t.v) : t.l) + '</text>'; });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="' + C.axis + '"/>';
    s += '<text x="' + (m.l + pw / 2) + '" y="' + (Hh - 8) + '" class="pl-label" text-anchor="middle">' + X.label + '</text>';
    s += '<text transform="translate(14 ' + (m.t + ph / 2) + ') rotate(-90)" class="pl-label" text-anchor="middle">' + Y.label + '</text>';
    s += '<g clip-path="url(#' + (o.id || 'p') + '-clip)">';
    (o.series || []).forEach(function (se) {
      var ok = function (q) { return isFinite(q[0]) && isFinite(q[1]) && (!lx || q[0] > 0) && (!ly || q[1] > 0); };
      var pts = se.data.filter(ok);
      if (!pts.length) return;
      var d = '', pen = false; se.data.forEach(function (q) { if (!ok(q)) { pen = false; return; } d += (pen ? 'L' : 'M') + fx(q[0]).toFixed(1) + ' ' + fy(q[1]).toFixed(1) + ' '; pen = true; });
      if (se.fill) s += '<path d="' + d + ' L' + fx(pts[pts.length - 1][0]).toFixed(1) + ' ' + (m.t + ph) + ' L' + fx(pts[0][0]).toFixed(1) + ' ' + (m.t + ph) + ' Z" fill="' + se.color + '" opacity="' + se.fill + '"/>';
      if (se.dots) pts.forEach(function (q) { s += '<circle cx="' + fx(q[0]) + '" cy="' + fy(q[1]) + '" r="' + (se.r || 2.4) + '" fill="' + se.color + '"/>'; });
      else s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="' + (se.width || 2) + '"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : '') + ' stroke-linejoin="round" stroke-linecap="round"/>';
    });
    (o.vlines || []).forEach(function (v) { var x = fx(v.x); s += '<line x1="' + x + '" x2="' + x + '" y1="' + m.t + '" y2="' + (m.t + ph) + '" stroke="' + v.color + '" stroke-dasharray="' + (v.dash || '4 3') + '" stroke-width="1.4"/>' + (v.label ? '<text x="' + (x + 5) + '" y="' + (m.t + (v.ly || 26)) + '" class="pl-note" fill="' + v.color + '">' + v.label + '</text>' : ''); });
    (o.hlines || []).forEach(function (v) { var y = fy(v.y); s += '<line x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + y + '" y2="' + y + '" stroke="' + v.color + '" stroke-dasharray="' + (v.dash || '4 3') + '" stroke-width="1.4"/>' + (v.label ? '<text x="' + (m.l + pw - 6) + '" y="' + (y - 6) + '" class="pl-note" text-anchor="end" fill="' + v.color + '">' + v.label + '</text>' : ''); });
    (o.marks || []).forEach(function (k) { var x = fx(k.x), y = fy(k.y); s += '<circle cx="' + x + '" cy="' + y + '" r="' + (k.r || 5) + '" fill="' + k.color + '" stroke="#0f0a18" stroke-width="1.5"/>' + (k.label ? '<text x="' + (x + (k.dx || 8)) + '" y="' + (y + (k.dy || -8)) + '" class="pl-note" fill="' + k.color + '"' + (k.anchor ? ' text-anchor="' + k.anchor + '"' : '') + '>' + k.label + '</text>' : ''); });
    s += '</g>';
    if (o.legend) { var lx0 = m.l + (o.legendX != null ? o.legendX : pw - 150), ly0 = m.t + (o.legendY != null ? o.legendY : 14); o.series.filter(function (se) { return se.label; }).forEach(function (se, i) { s += '<line x1="' + lx0 + '" x2="' + (lx0 + 18) + '" y1="' + (ly0 + i * 17) + '" y2="' + (ly0 + i * 17) + '" stroke="' + se.color + '" stroke-width="2.5"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : '') + '/><text x="' + (lx0 + 24) + '" y="' + (ly0 + i * 17 + 4) + '" class="pl-leg">' + se.label + '</text>'; }); }
    return s + '</svg>';
  };
  VL.logspace = function (a, b, n) { var out = [], la = Math.log10(a), lb = Math.log10(b); for (var i = 0; i < n; i++) out.push(Math.pow(10, la + (lb - la) * i / (n - 1))); return out; };
  VL.linspace = function (a, b, n) { var out = []; for (var i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1)); return out; };

  /* ── controls ────────────────────────────────────────────── */
  VL.slider = function (host, o) {
    var wrap = document.createElement('label'); wrap.className = 'vl-ctl';
    wrap.innerHTML = '<span class="vl-ctl-name">' + o.label + '</span><input type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 'any') + '" value="' + o.value + '"><output></output>';
    var inp = wrap.querySelector('input'), out = wrap.querySelector('output');
    var get = function () { var v = +inp.value; return o.log ? Math.pow(10, v) : v; };
    var upd = function () { out.textContent = o.fmt ? o.fmt(get()) : get(); if (o.on) o.on(get()); };
    inp.addEventListener('input', upd); host.appendChild(wrap); out.textContent = o.fmt ? o.fmt(get()) : get();
    return { get: get, set: function (v) { inp.value = o.log ? Math.log10(v) : v; upd(); }, input: inp, refresh: upd };
  };
  VL.select = function (host, o) {
    var wrap = document.createElement('label'); wrap.className = 'vl-ctl';
    wrap.innerHTML = '<span class="vl-ctl-name">' + o.label + '</span><select>' + o.options.map(function (q) { return '<option value="' + q[0] + '"' + (q[0] === o.value ? ' selected' : '') + '>' + q[1] + '</option>'; }).join('') + '</select>';
    var sel = wrap.querySelector('select'); sel.addEventListener('change', function () { if (o.on) o.on(sel.value); }); host.appendChild(wrap);
    return { get: function () { return sel.value; }, el: sel };
  };
  VL.button = function (host, label, on, cls) { var b = document.createElement('button'); b.type = 'button'; b.className = 'vl-btn' + (cls ? ' ' + cls : ''); b.textContent = label; b.addEventListener('click', on); host.appendChild(b); return b; };
  /* new parts go before a figure's caption, so the caption stays last */
  VL.add = function (host, el) { var cap = null; for (var i = 0; i < host.children.length; i++) if (host.children[i].tagName === 'FIGCAPTION') cap = host.children[i]; host.insertBefore(el, cap); return el; };
  VL.part = function (fig, cls, tag) { var d = document.createElement(tag || 'div'); d.className = cls; return VL.add(fig, d); };
  VL.html = function (fig, html) { var d = document.createElement('div'); d.innerHTML = html; VL.add(fig, d); return d; };

  /* animation loop that only runs while the figure is on screen */
  VL.loop = function (el, step) {
    var on = false, raf = 0, last = 0, visible = false, playing = !VL.reduced;
    function frame(t) { var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; step(dt); if (on) raf = requestAnimationFrame(frame); }
    function sync() { var want = visible && playing; if (want && !on) { on = true; last = 0; raf = requestAnimationFrame(frame); } else if (!want && on) { on = false; cancelAnimationFrame(raf); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { rootMargin: '80px' }).observe(el); else { visible = true; sync(); }
    step(0);
    return { play: function () { playing = true; sync(); }, pause: function () { playing = false; sync(); }, get playing() { return playing; }, toggle: function () { playing = !playing; sync(); return playing; } };
  };
  VL.playButton = function (host, lp) {
    var b = VL.button(host, lp.playing ? 'Pause' : 'Play', function () { b.textContent = lp.toggle() ? 'Pause' : 'Play'; });
    return b;
  };
  VL.canvas = function (host, w, h) {
    var cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = '100%'; cv.style.aspectRatio = w + ' / ' + h; cv.className = 'vl-canvas';
    VL.add(host, cv); var g = cv.getContext('2d'); g.scale(dpr, dpr); return g;
  };

  /* ═══ figure registry ═══════════════════════════════════════ */
  VL.figs = VL.figs || {};
  VL.init = function () {
    document.querySelectorAll('[data-fig]').forEach(function (fig) {
      var f = VL.figs[fig.getAttribute('data-fig')]; if (!f || fig.dataset.ready) return; fig.dataset.ready = '1';
      try { f(fig); } catch (e) { if (window.console) console.error('figure ' + fig.getAttribute('data-fig'), e); }
    });
  };

  /* ═══ 1. mean free path, flux and monolayer time ═════════════ */
  VL.figs.mfp = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout'), plot = VL.part(fig, 'vl-plot');
    var D = 0.30;
    var draw = function () {
      var p = sp.get(), lam = VL.mfp(p), Kn = lam / D, phi = VL.flux(p), n = p * 100 / (VL.k * 293), tau = 1e19 / phi; // ~10¹⁵ cm⁻² = 10¹⁹ m⁻² sites
      var regime = Kn < 0.01 ? 'viscous (continuum) flow' : Kn > 0.5 ? 'molecular flow' : 'transition (Knudsen) flow';
      read.innerHTML = '<div><b>' + VL.fmtLen(lam) + '</b><span>mean free path λ</span></div><div><b>' + VL.sci(n * 1e-6, 2) + ' cm⁻³</b><span>molecules per cm³</span></div><div><b>' + VL.sci(phi * 1e-4, 2) + '</b><span>hits per cm² per second</span></div><div><b>' + VL.fmtTime(tau) + '</b><span>to cover a clean surface with one layer</span></div><div><b>Kn = ' + VL.sci(Kn, 2) + '</b><span>' + regime + ' in a 30 cm chamber</span></div>';
      var ps = VL.logspace(1e-9, 1e3, 120);
      plot.innerHTML = VL.plot({ id: 'mfp', label: 'Mean free path and monolayer time versus pressure', w: 680, h: 340, x: { min: 1e-9, max: 1e3, log: true, rev: true, label: 'Pressure (mbar) — falling to the right, as in a pump-down' }, y: { min: 1e-8, max: 1e7, log: true, label: 'λ (m)  ·  monolayer time (s)' },
        bands: [{ x0: 1e3, x1: 1, color: C.red, label: 'rough', op: .07 }, { x0: 1, x1: 1e-3, color: C.au, label: 'medium', op: .07 }, { x0: 1e-3, x1: 1e-7, color: C.cyan, label: 'high', op: .07 }, { x0: 1e-7, x1: 1e-9, color: C.violet, label: 'UHV', op: .1 }],
        series: [{ data: ps.map(function (q) { return [q, VL.mfp(q)]; }), color: C.au, label: 'mean free path λ (m)' }, { data: ps.map(function (q) { return [q, 1e19 / VL.flux(q)]; }), color: C.cyan, dash: '6 4', label: 'monolayer time (s)' }],
        hlines: [{ y: D, color: C.text3, label: '30 cm chamber', dash: '2 3' }],
        marks: [{ x: p, y: lam, color: C.au }, { x: p, y: tau, color: C.cyan }], legend: true, legendX: 14, legendY: 34 });
    };
    var sp = VL.slider(ctl, { label: 'Pressure', min: -9, max: 3, step: 0.05, value: -5, log: true, fmt: function (v) { return VL.sci(v, 2) + ' mbar'; }, on: draw });
    sp.refresh();
  };

  /* ═══ 2. pressure ranges of pumps, gauges and processes ═════ */
  VL.figs.ranges = function (fig) {
    var rows = [['Pumps', null], ['Rotary vane (roughing / backing)', [1013, 1e-3], C.red], ['Roots blower', [30, 1e-4], C.red], ['Diffusion pump (high vacuum)', [1e-2, 1e-8], C.au], ['Turbomolecular pump', [1e-2, 1e-10], C.au], ['Cryopump', [1e-3, 1e-10], C.au], ['Ion pump', [1e-5, 1e-11], C.violet],
      ['Gauges', null], ['Bourdon / dial gauge', [1013, 1], C.green], ['Pirani (GH1, GH2)', [100, 1e-3], C.green], ['Penning (cold cathode)', [1e-2, 1e-7], C.green], ['Bayard–Alpert (hot cathode)', [1e-3, 1e-10], C.green],
      ['Processes', null], ['Glow-discharge cleaning (HT)', [0.5, 1e-2], C.cyan], ['Sputtering (process gas)', [5e-2, 1e-3], C.cyan], ['Thermal evaporation', [1e-5, 1e-7], C.cyan], ['E-beam evaporation', [1e-5, 1e-8], C.cyan], ['EBL column', [1e-6, 1e-9], C.cyan], ['Molecular beam epitaxy', [1e-8, 1e-11], C.cyan]];
    var W = 720, rowH = 22, L = 230, R = 18, T = 26, pw = W - L - R, Hh = T + rows.length * rowH + 30;
    var fx = function (p) { return L + (3 - Math.log10(p)) / 14 * pw; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="plot" role="img" aria-label="Pressure ranges of pumps, gauges and processes">';
    for (var e = 3; e >= -11; e--) { var x = fx(Math.pow(10, e)); s += '<line x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (Hh - 26) + '" stroke="' + C.grid + '"/>' + (Math.abs(e) % 2 === 1 ? '' : '<text x="' + x + '" y="' + (Hh - 10) + '" class="pl-tick" text-anchor="middle">10' + VL.sup(e) + '</text>'); }
    s += '<text x="' + (L + pw / 2) + '" y="14" class="pl-label" text-anchor="middle">Pressure (mbar) — atmosphere on the left, ultra-high vacuum on the right</text>';
    rows.forEach(function (r, i) { var y = T + i * rowH; if (!r[1]) { s += '<text x="8" y="' + (y + 15) + '" class="pl-head">' + r[0] + '</text>'; return; } var x0 = fx(r[1][0]), x1 = fx(r[1][1]); s += '<text x="' + (L - 10) + '" y="' + (y + 15) + '" class="pl-tick" text-anchor="end">' + r[0] + '</text><rect x="' + x0 + '" y="' + (y + 5) + '" width="' + (x1 - x0) + '" height="13" rx="6.5" fill="' + r[2] + '" opacity=".8"/>'; });
    VL.html(fig, s + '</svg>');
  };

  /* ═══ 3. pumping speed versus inlet pressure (illustrative) ═══ */
  VL.figs.speeds = function (fig) {
    var ps = VL.logspace(1e-9, 1e3, 200);
    var rot = function (p) { return p > 2.5e-3 ? 4.5 * (1 - 2e-3 / p) : NaN; };
    var dp = function (p) { return p < 0.3 ? 600 / (1 + Math.pow(p / 1.5e-3, 1.4)) * (p > 2e-9 ? 1 : NaN) : NaN; };
    var tmp = function (p) { return p < 0.5 ? 300 / (1 + Math.pow(p / 4e-3, 1.6)) * (1 - 1e-10 / p) : NaN; };
    VL.html(fig, VL.plot({ id: 'spd', label: 'Pumping speed versus pressure', w: 680, h: 320, x: { min: 1e-9, max: 1e3, log: true, rev: true, label: 'Inlet pressure (mbar)' }, y: { min: 0.1, max: 2000, log: true, label: 'Pumping speed S (L/s)' },
      series: [{ data: ps.map(function (p) { return [p, rot(p)]; }), color: C.red, label: 'rotary vane (16 m³/h)' }, { data: ps.map(function (p) { return [p, dp(p)]; }), color: C.au, label: 'diffusion pump (6″)' }, { data: ps.map(function (p) { return [p, tmp(p)]; }), color: C.cyan, dash: '6 4', label: 'turbo pump (300 L/s)' }],
      vlines: [{ x: 0.3, color: C.red, label: '← DP cannot work here', ly: 40 }], legend: true, legendX: 330, legendY: 196 }));
  };

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', VL.init) : setTimeout(VL.init, 0);
})();
