/* Vacuum & deposition article — animated figures:
   gas collisions, rotary vane pump, diffusion pump, turbo pump,
   thermal-evaporation Monte Carlo, 270° electron-beam gun. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col, F = VL.figs;

  /* ═══ why vacuum: an evaporated atom crossing the chamber ═══ */
  F.flight = function (fig) {
    var W = 680, H = 360, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var box = { x: 40, y: 30, w: 600, h: 300 }; // 600 px = 30 cm  →  20 px per cm
    var pxPerM = 2000, atoms = [], gas = [], arrived = 0, reached = 0, launched = 0, scattered = 0, spawn = 0;
    var src = { x: box.x + box.w / 2, y: box.y + box.h - 8 };
    function resetGas() {
      var p = sp.get(), n = Math.round(VL.clamp(28 * (Math.log10(p) + 6.5), 0, 260)); gas = [];
      for (var i = 0; i < n; i++) gas.push({ x: box.x + Math.random() * box.w, y: box.y + Math.random() * box.h, a: Math.random() * 6.283 });
      atoms = []; arrived = launched = scattered = reached = 0;
    }
    function launch() {
      var th = Math.asin(Math.sqrt(Math.random())) * (Math.random() < 0.5 ? -1 : 1) * 0.9; // cosine law about the vertical
      atoms.push({ x: src.x, y: src.y, vx: Math.sin(th), vy: -Math.cos(th), left: freePath(), hits: 0, trail: [[src.x, src.y]] }); launched++;
    }
    function freePath() { return -Math.log(Math.random() + 1e-12) * VL.mfp(sp.get()) * pxPerM; }
    function step(dt) {
      var speed = 260; spawn += dt;
      if (spawn > 0.12 && atoms.length < 26) { spawn = 0; launch(); }
      atoms.forEach(function (a) {
        var d = speed * dt;
        while (d > 0 && !a.done) {
          var s = Math.min(d, a.left); a.x += a.vx * s; a.y += a.vy * s; a.left -= s; d -= s;
          if (a.left <= 0) { var t = Math.random() * 6.283; a.vx = Math.cos(t); a.vy = Math.sin(t); a.left = freePath(); a.hits++; if (a.hits === 1) scattered++; a.trail.push([a.x, a.y]); }
          if (a.y <= box.y + 6) { a.done = 1; reached++; if (a.hits === 0) arrived++; a.y = box.y + 6; }
          if (a.x < box.x || a.x > box.x + box.w || a.y > box.y + box.h) { a.done = 1; }
        }
        if (a.trail.length > 60) a.trail.shift();
        a.age = (a.age || 0) + dt;
      });
      atoms = atoms.filter(function (a) { return !(a.done && (a.fade = (a.fade || 0) + dt) > 0.8); });
      gas.forEach(function (q) { q.a += (Math.random() - 0.5) * 0.8; q.x += Math.cos(q.a) * 40 * dt; q.y += Math.sin(q.a) * 40 * dt; if (q.x < box.x) q.x += box.w; if (q.x > box.x + box.w) q.x -= box.w; if (q.y < box.y) q.y += box.h; if (q.y > box.y + box.h) q.y -= box.h; });
      paint();
    }
    function paint() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#120c1e'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; g.strokeRect(box.x, box.y, box.w, box.h);
      g.fillStyle = 'rgba(69,191,214,.25)'; g.fillRect(box.x + 150, box.y, 300, 6); g.fillStyle = C.text2; g.font = '11px IBM Plex Mono, monospace'; g.fillText('substrate (30 cm above the source)', box.x + 182, box.y + 20);
      g.fillStyle = 'rgba(182,172,200,.55)'; gas.forEach(function (q) { g.fillRect(q.x - 1, q.y - 1, 2, 2); });
      g.fillStyle = '#ff9a3c'; g.fillRect(src.x - 18, src.y, 36, 5);
      atoms.forEach(function (a) {
        g.strokeStyle = a.hits ? 'rgba(226,86,110,.55)' : 'rgba(224,168,46,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a.trail[0][0], a.trail[0][1]); for (var i = 1; i < a.trail.length; i++) g.lineTo(a.trail[i][0], a.trail[i][1]); g.lineTo(a.x, a.y); g.stroke();
        g.fillStyle = a.hits ? C.red : C.au; g.beginPath(); g.arc(a.x, a.y, 3, 0, 6.283); g.fill();
      });
      var lam = VL.mfp(sp.get()), frac = Math.exp(-0.30 / lam);
      read.innerHTML = '<div><b>' + VL.fmtLen(lam) + '</b><span>mean free path</span></div><div><b>' + (frac * 100).toPrecision(3) + ' %</b><span>reach the substrate without a collision, e<sup>−L/λ</sup></span></div><div><b>' + arrived + ' / ' + launched + '</b><span>gold atoms that flew straight (this run)</span></div>';
    }
    var sp = VL.slider(ctl, { label: 'Chamber pressure', min: -6, max: -1, step: 0.05, value: -2, log: true, fmt: function (v) { return VL.sci(v, 2) + ' mbar'; }, on: function () { resetGas(); } });
    resetGas(); var lp = VL.loop(fig, step); VL.playButton(ctl, lp);
  };

  /* ═══ rotary vane pump ════════════════════════════════════ */
  F.rotary = function (fig) {
    var W = 680, H = 360, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), cap = VL.part(fig, 'vl-caption-live');
    var cx = 250, cy = 180, R = 120, r = 94, e = R - r, rc = { x: cx, y: cy - e }, th = 0, ballast = false, puffs = [];
    var inA = -2.45, outA = -0.7; // inlet at upper left, exhaust at upper right (angles from stator centre, screen coords)
    function vaneLen(a) { var ux = Math.cos(a), uy = Math.sin(a), dx = rc.x - cx, dy = rc.y - cy, b = dx * ux + dy * uy; return -b + Math.sqrt(b * b - (dx * dx + dy * dy) + R * R); }
    function step(dt) {
      th -= dt * 1.1; if (th < 0) th += 6.283;
      puffs.forEach(function (p) { p.t += dt; }); puffs = puffs.filter(function (p) { return p.t < 1.6; });
      if (Math.random() < dt * 3) puffs.push({ t: 0, k: 'in' });
      paint();
    }
    function pocket(a0, a1, col) {
      g.beginPath(); var N = 40;
      for (var i = 0; i <= N; i++) { var a = a0 + (a1 - a0) * i / N, L = vaneLen(a); g.lineTo(rc.x + Math.cos(a) * L, rc.y + Math.sin(a) * L); }
      for (i = N; i >= 0; i--) { a = a0 + (a1 - a0) * i / N; g.lineTo(rc.x + Math.cos(a) * r, rc.y + Math.sin(a) * r); }
      g.closePath(); g.fillStyle = col; g.fill();
    }
    function paint() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#120c1e'; g.fillRect(0, 0, W, H);
      // oil bath
      g.fillStyle = 'rgba(224,168,46,.13)'; g.fillRect(70, 245, 360, 95); g.strokeStyle = 'rgba(224,168,46,.4)'; g.strokeRect(70, 60, 360, 280);
      g.fillStyle = C.text3; g.font = '11px IBM Plex Mono, monospace'; g.fillText('oil', 80, 330);
      // ports
      g.fillStyle = '#2a2140'; g.fillRect(cx - 105, 10, 34, 70); g.fillRect(cx + 70, 10, 30, 64);
      g.fillStyle = C.text2; g.fillText('INLET (from chamber', cx - 175, 24); g.fillText('or foreline)', cx - 175, 38); g.fillText('EXHAUST', cx + 108, 24); g.fillText('(oil-sealed valve)', cx + 108, 38);
      // stator
      g.fillStyle = '#1d1530'; g.beginPath(); g.arc(cx, cy, R + 14, 0, 6.283); g.fill();
      g.fillStyle = '#0d0916'; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.fill();
      // gas pockets between the two vanes: v1 at th, v2 at th+π
      var a1 = th - Math.PI / 2, a2 = a1 + Math.PI;
      var norm = function (a) { a %= 6.283; return a < 0 ? a + 6.283 : a; };
      // regions measured from the contact line at the top (angle −π/2): rotation is anticlockwise,
      // so the region just left of the contact grows (inlet) and the one just right of it shrinks (exhaust)
      var top = -Math.PI / 2, u = [norm(a1 - top), norm(a2 - top)].sort(function (x, y) { return x - y; });
      pocket(top, top + u[0], 'rgba(226,86,110,.5)');          // compression → exhaust
      pocket(top + u[0], top + u[1], 'rgba(169,139,240,.35)'); // sealed pocket being carried round
      pocket(top + u[1], top + 2 * Math.PI, 'rgba(69,191,214,.45)'); // expansion ← inlet
      // inlet & exhaust openings in stator
      g.strokeStyle = C.cyan; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R + 4, inA - 0.12, inA + 0.12); g.stroke();
      g.strokeStyle = C.red; g.beginPath(); g.arc(cx, cy, R + 4, outA - 0.1, outA + 0.1); g.stroke();
      // rotor
      g.fillStyle = '#5b6578'; g.beginPath(); g.arc(rc.x, rc.y, r, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#3a4252'; g.beginPath(); g.arc(rc.x, rc.y, 12, 0, 6.283); g.fill();
      // vanes
      [a1, a2].forEach(function (a) { var L = vaneLen(a); g.strokeStyle = C.au; g.lineWidth = 7; g.lineCap = 'butt'; g.beginPath(); g.moveTo(rc.x + Math.cos(a) * (r - 34), rc.y + Math.sin(a) * (r - 34)); g.lineTo(rc.x + Math.cos(a) * (L - 1), rc.y + Math.sin(a) * (L - 1)); g.stroke(); });
      g.fillStyle = C.text2; g.fillStyle = '#e6e9f0'; g.fillText('rotor (off-centre)', rc.x - 56, rc.y + 34); g.fillText('stator', cx - 20, cy + R + 32);
      // gas ballast
      if (ballast) { g.strokeStyle = C.green; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + R + 60, cy - 10); g.lineTo(cx + R + 10, cy - 10); g.stroke(); g.fillStyle = C.green; g.fillText('gas ballast air', cx + R + 18, cy - 18); }
      // labels on the pockets
      var mid = function (a0, a1) { var a = (a0 + a1) / 2, L = (vaneLen(a) + r) / 2; return [rc.x + Math.cos(a) * L, rc.y + Math.sin(a) * L]; };
      // stroke legend
      g.fillStyle = 'rgba(69,191,214,.9)'; g.fillRect(460, 120, 14, 14); g.fillStyle = C.text2; g.fillText('volume growing: gas drawn in', 482, 131);
      g.fillStyle = 'rgba(226,86,110,.9)'; g.fillRect(460, 146, 14, 14); g.fillStyle = C.text2; g.fillText('volume shrinking: compressed', 482, 157);
      g.fillText('and pushed out at ≈1.2 bar', 482, 172);
      g.fillStyle = 'rgba(169,139,240,.9)'; g.fillRect(460, 226, 14, 14); g.fillStyle = C.text2; g.fillText('sealed pocket carried round', 482, 237);
      g.fillStyle = C.au; g.fillRect(460, 190, 14, 4); g.fillStyle = C.text2; g.fillText('vanes, pressed out by springs', 482, 196); g.fillText('and centrifugal force', 482, 211);
    }
    VL.button(ctl, 'Toggle gas ballast', function () { ballast = !ballast; cap.textContent = ballast ? 'Gas ballast open: a little air is let into the compression stroke, so the compressed gas reaches exhaust pressure before any water vapour in it can condense into the oil.' : 'Gas ballast closed: lowest ultimate pressure, but water vapour pumped from the chamber can condense into the oil during compression.'; });
    var lp = VL.loop(fig, step); VL.playButton(ctl, lp);
    cap.textContent = 'Gas ballast closed: lowest ultimate pressure, but water vapour pumped from the chamber can condense into the oil during compression.';
  };

  /* ═══ diffusion pump ══════════════════════════════════════ */
  F.diffpump = function (fig) {
    var W = 680, H = 420, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var body = { x: 190, y: 50, w: 220, h: 320 }, cx = body.x + body.w / 2, mols = [], drops = [], vap = [], stalled = false, cold = false;
    var jets = [{ y: 92, w: 70 }, { y: 175, w: 86 }, { y: 255, w: 100 }];
    var pumped = 0, back = 0;
    function newMol() { mols.push({ x: body.x + 12 + Math.random() * (body.w - 24), y: body.y - 30, vx: (Math.random() - 0.5) * 60, vy: 70 + Math.random() * 60, hit: 0 }); }
    function step(dt) {
      if (Math.random() < dt * 7) newMol();
      var working = !stalled && !cold;
      // vapour particles from the jets
      if (working) jets.forEach(function (j) { for (var k = 0; k < 2; k++) { var side = Math.random() < 0.5 ? -1 : 1; vap.push({ x: cx + side * (j.w / 2 + 2), y: j.y + 8, vx: side * (120 + Math.random() * 60), vy: 150 + Math.random() * 60, t: 0 }); } });
      vap.forEach(function (v) { v.t += dt; v.x += v.vx * dt; v.y += v.vy * dt; if (v.x < body.x + 6 || v.x > body.x + body.w - 6) { v.dead = 1; if (Math.random() < 0.05) drops.push({ x: v.x < cx ? body.x + 7 : body.x + body.w - 7, y: v.y }); } });
      vap = vap.filter(function (v) { return !v.dead && v.t < 0.6; });
      drops.forEach(function (d) { d.y += 70 * dt; }); drops = drops.filter(function (d) { return d.y < body.y + body.h - 30; });
      mols.forEach(function (m) {
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.x < body.x + 6 || m.x > body.x + body.w - 6) m.vx *= -1;
        if (working) { jets.forEach(function (j) { if (Math.abs(m.y - (j.y + 25)) < 22 && Math.abs(m.x - cx) > j.w / 2 - 4 && Math.random() < 0.25) { m.vy = 160 + Math.random() * 80; m.hit = 1; } }); }
        else if (stalled && m.y > body.y + 40 && Math.random() < dt * 2) { m.vy = -Math.abs(m.vy) - 40; m.back = 1; }
        if (Math.random() < dt * 1.5) { m.vx = (Math.random() - 0.5) * 80; if (!m.hit && !m.back) m.vy += (Math.random() - 0.45) * 60; }
        if (m.y > body.y + body.h - 64 && !m.back) { m.dead = 1; pumped++; }
        if (m.y > body.y + body.h - 30) m.vy = -Math.abs(m.vy) * 0.6;
        if (m.y < body.y - 40) { m.dead = 1; if (m.back) back++; }
      });
      mols = mols.filter(function (m) { return !m.dead; }).slice(-120);
      paint();
    }
    function paint() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#120c1e'; g.fillRect(0, 0, W, H);
      g.font = '11px IBM Plex Mono, monospace';
      // inlet flange & chamber side
      g.fillStyle = C.text2; g.fillText('from the chamber (hi-vac valve)', body.x + 10, 18);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.strokeRect(body.x - 16, body.y - 8, body.w + 32, 8);
      // body with cooling coils
      g.fillStyle = '#1b1430'; g.fillRect(body.x, body.y, body.w, body.h);
      for (var y = body.y + 20; y < body.y + body.h - 40; y += 22) { g.fillStyle = cold ? '#2c2a3a' : 'rgba(69,191,214,.55)'; g.fillRect(body.x - 12, y, 10, 10); g.fillRect(body.x + body.w + 2, y, 10, 10); }
      g.fillStyle = C.cyan; g.fillText('cooling water', body.x + body.w + 18, body.y + 60); g.fillText('(oil condenses', body.x + body.w + 18, body.y + 75); g.fillText(' on cold walls)', body.x + body.w + 18, body.y + 90);
      // boiler & heater
      g.fillStyle = 'rgba(224,168,46,.35)'; g.fillRect(body.x + 4, body.y + body.h - 28, body.w - 8, 24);
      g.fillStyle = cold ? '#3a2f2f' : '#ff6a2b'; g.fillRect(body.x - 4, body.y + body.h + 2, body.w + 8, 10);
      g.fillStyle = cold ? C.text3 : '#ff9a3c'; g.fillText(cold ? 'heater OFF / still warming up' : 'heater (oil boils at ~200 °C)', body.x + 10, body.y + body.h + 28);
      // chimney + jets
      g.fillStyle = '#3b3156'; g.fillRect(cx - 9, jets[0].y, 18, body.y + body.h - 28 - jets[0].y);
      jets.forEach(function (j) { g.beginPath(); g.moveTo(cx - 9, j.y); g.lineTo(cx - j.w / 2, j.y + 18); g.lineTo(cx - j.w / 2 + 6, j.y + 18); g.lineTo(cx, j.y + 4); g.lineTo(cx + j.w / 2 - 6, j.y + 18); g.lineTo(cx + j.w / 2, j.y + 18); g.lineTo(cx + 9, j.y); g.closePath(); g.fillStyle = '#5a4b80'; g.fill(); });
      // vapour
      vap.forEach(function (v) { g.fillStyle = 'rgba(224,168,46,' + (0.7 - v.t) + ')'; g.fillRect(v.x - 1, v.y - 1, 2.5, 2.5); });
      drops.forEach(function (d) { g.fillStyle = 'rgba(224,168,46,.7)'; g.fillRect(d.x - 1, d.y, 2, 5); });
      // foreline
      g.fillStyle = '#1b1430'; g.fillRect(body.x + body.w, body.y + body.h - 70, 120, 34); g.strokeStyle = 'rgba(255,255,255,.2)'; g.strokeRect(body.x + body.w, body.y + body.h - 70, 120, 34);
      g.fillStyle = stalled ? C.red : C.text2; g.fillText('foreline → backing (rotary) pump', body.x + body.w + 8, body.y + body.h - 80);
      if (stalled) g.fillText('foreline pressure too high!', body.x + body.w + 8, body.y + body.h - 22);
      mols.forEach(function (m) { g.fillStyle = m.back ? C.red : m.hit ? C.green : C.text; g.beginPath(); g.arc(m.x, m.y, 2.6, 0, 6.283); g.fill(); });
      g.fillStyle = C.text2; g.fillText('jet', cx + jets[0].w / 2 + 6, jets[0].y + 14); g.fillText('jet', cx + jets[1].w / 2 + 6, jets[1].y + 14); g.fillText('jet', cx + jets[2].w / 2 + 6, jets[2].y + 14);
      g.fillText('chimney', cx - 74, body.y + body.h - 40);
      read.innerHTML = '<div><b>' + pumped + '</b><span>gas molecules driven into the foreline</span></div><div><b>' + back + '</b><span>molecules (and oil) streaming back to the chamber</span></div><div><b>' + (stalled ? 'stalled' : cold ? 'cold' : 'pumping') + '</b><span>state</span></div>';
    }
    VL.button(ctl, 'Raise the foreline pressure', function (ev) { stalled = !stalled; ev.target.textContent = stalled ? 'Restore the backing pump' : 'Raise the foreline pressure'; });
    VL.button(ctl, 'Heater off', function (ev) { cold = !cold; ev.target.textContent = cold ? 'Heater on' : 'Heater off'; });
    var lp = VL.loop(fig, step); VL.playButton(ctl, lp);
  };

  /* ═══ turbomolecular pump ═════════════════════════════════ */
  F.turbo = function (fig) {
    var W = 680, H = 330, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var rows = 6, rowY = function (i) { return 60 + i * 40; }, off = 0, mols = [], through = 0, rejected = 0;
    var vs = VL.slider(ctl, { label: 'Blade tip speed', min: 0, max: 500, step: 10, value: 400, fmt: function (v) { return v + ' m/s'; } });
    function step(dt) {
      var v = vs.get(); off += v * dt * 0.25;
      if (Math.random() < dt * 9) mols.push({ x: 40 + Math.random() * 600, y: 30, vx: (Math.random() - 0.5) * 300, vy: 60 + Math.random() * 120 });
      mols.forEach(function (m) {
        m.x += m.vx * dt; m.y += m.vy * dt; if (m.x < 30) { m.x = 30; m.vx *= -1; } if (m.x > 650) { m.x = 650; m.vx *= -1; }
        for (var i = 0; i < rows; i++) { var y = rowY(i); if (m.lastRow !== i && Math.abs(m.y - y) < 4) { m.lastRow = i;
          var rotor = i % 2 === 0, rel = m.vx - (rotor ? v * 0.6 : 0), pDown = rotor ? VL.clamp(0.5 + v / 1100, 0.5, 0.95) : 0.62;
          if (Math.random() < pDown) { m.vy = Math.abs(m.vy) + 10; m.vx = (rotor ? v * 0.35 : 0) + (Math.random() - 0.5) * 150; } else { m.vy = -Math.abs(m.vy); m.vx = (Math.random() - 0.5) * 200; } } }
        if (m.y > 300) { m.dead = 1; through++; } if (m.y < 20) { m.dead = 1; rejected++; }
      });
      mols = mols.filter(function (m) { return !m.dead; }).slice(-160);
      paint();
    }
    function paint() {
      g.clearRect(0, 0, W, H); g.fillStyle = '#120c1e'; g.fillRect(0, 0, W, H); g.font = '11px IBM Plex Mono, monospace';
      for (var i = 0; i < rows; i++) {
        var y = rowY(i), rotor = i % 2 === 0, sh = rotor ? (off % 40) : 0;
        g.strokeStyle = rotor ? C.au : '#7d6fa3'; g.lineWidth = 3;
        for (var x = 20 - 40 + sh; x < 680; x += 40) { g.beginPath(); if (rotor) { g.moveTo(x, y - 8); g.lineTo(x + 14, y + 8); } else { g.moveTo(x + 14, y - 8); g.lineTo(x, y + 8); } g.stroke(); }
        g.fillStyle = rotor ? C.au : '#a99bd0'; g.fillText(rotor ? 'rotor →' : 'stator', 4, y - 12);
      }
      g.fillStyle = C.text2; g.fillText('high-vacuum side (chamber)', 250, 18); g.fillText('backing side (to the rotary pump)', 230, 322);
      mols.forEach(function (m) { g.fillStyle = m.vy > 0 ? C.cyan : C.red; g.beginPath(); g.arc(m.x, m.y, 2.6, 0, 6.283); g.fill(); });
      var tot = through + rejected; read.innerHTML = '<div><b>' + (tot ? (100 * through / tot).toFixed(0) : '—') + ' %</b><span>of molecules passed downwards</span></div><div><b>' + vs.get() + ' m/s</b><span>blade speed (N₂ moves at ≈470 m/s)</span></div>';
    }
    var lp = VL.loop(fig, step); VL.playButton(ctl, lp);
    VL.button(ctl, 'Reset count', function () { through = rejected = 0; });
  };

  /* ═══ thermal evaporation: cosine law Monte Carlo ═════════ */
  F.evapmc = function (fig) {
    var W = 680, H = 400, g = VL.canvas(fig, W, H), ctl = VL.part(fig, 'vl-controls'), read = VL.part(fig, 'vl-readout');
    var bins = 60, hist, total, atoms = [], L = 300, sx = 340, sy = 360; // the substrate spans ±L/2 world units? we use ±300 px = ±r_max
    var hs = VL.slider(ctl, { label: 'Source–substrate distance h', min: 10, max: 60, step: 1, value: 25, fmt: function (v) { return v + ' cm'; }, on: reset });
    var ss = VL.select(ctl, { label: 'Source', value: 'surf', options: [['surf', 'Small flat source (boat, crucible): cos θ'], ['point', 'Point source: isotropic']], on: reset });
    var rMax = 20; // cm half-width of the substrate shown
    function reset() { hist = new Float64Array(bins); total = 0; atoms = []; }
    reset();
    function sample() {
      var ct, phi = Math.random() * 6.283;
      if (ss.get() === 'surf') ct = Math.sqrt(1 - Math.random()); else ct = Math.random(); // upper hemisphere
      var st = Math.sqrt(1 - ct * ct); return [st * Math.cos(phi), st * Math.sin(phi), ct];
    }
    function hitPlane(d, h) { var t = h / d[2]; return [d[0] * t, d[1] * t]; }
    function step(dt) {
      var h = hs.get(), N = 4000;
      for (var i = 0; i < N; i++) { var d = sample(), q = hitPlane(d, h), r = Math.hypot(q[0], q[1]); if (r >= rMax) continue; hist[Math.floor(r / rMax * bins)] += 1; total++; }
      if (Math.random() < 0.9) for (var k = 0; k < 2; k++) { var dd = sample(); atoms.push({ x: 0, y: 0, d: dd, t: 0 }); }
      atoms.forEach(function (a) { a.t += dt * 1.2; }); atoms = atoms.filter(function (a) { return a.t < 1; });
      paint();
    }
    function paint() {
      var h = hs.get();
      g.clearRect(0, 0, W, H); g.fillStyle = '#120c1e'; g.fillRect(0, 0, W, H); g.font = '11px IBM Plex Mono, monospace';
      var sc = 300 / rMax, ox = 340, oy = 380, ytop = oy - h * sc * 0.55; // side view: vertical scale compressed
      var vy = (oy - ytop) / h;
      // substrate
      g.strokeStyle = C.cyan; g.lineWidth = 3; g.beginPath();
      g.moveTo(ox - rMax * sc, ytop); g.lineTo(ox + rMax * sc, ytop);
      g.stroke();
      // source
      g.fillStyle = '#ff9a3c'; g.fillRect(ox - 12, oy, 24, 5);
      atoms.forEach(function (a) { var d = a.d, s = a.t * h * 1.2, X = d[0] * s, Z = d[2] * s; if (Z > h) return; g.fillStyle = C.au; g.fillRect(ox + X * sc - 1.5, oy - Z * vy - 1.5, 3, 3); });
      // thickness profile (normalised)
      var prof = [], mx = 0; for (var b = 0; b < bins; b++) { prof.push(hist[b] / (b + 0.5)); }
      // normalise to centre (first 3 bins average)
      var c0 = (prof[0] * 1 + prof[1] * 3 + prof[2] * 5) / 9 || 1;
      var px0 = 40, py0 = 150, pw = 600, ph = 110;
      g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(px0, py0 - ph, pw, ph);
      g.strokeStyle = 'rgba(255,255,255,.2)'; g.strokeRect(px0, py0 - ph, pw, ph);
      g.fillStyle = C.text2; g.fillText('film thickness t/t₀ across the substrate (Monte Carlo bars, theory line)', px0 + 6, py0 - ph - 8);
      for (b = 0; b < bins; b++) { var hh = VL.clamp(prof[b] / c0, 0, 1.15) * ph * 0.85; [1, -1].forEach(function (sg) { var x = px0 + pw / 2 + sg * (b + (sg > 0 ? 0 : 1)) / bins * pw / 2; g.fillStyle = 'rgba(224,168,46,.55)'; g.fillRect(x, py0 - hh, pw / 2 / bins - 0.5, hh); }); }
      // theory
      var n = ss.get() === 'surf' ? 2 : 1.5;
      g.strokeStyle = C.cyan; g.lineWidth = 2; g.beginPath();
      for (var k = -100; k <= 100; k++) { var r = k / 100 * rMax, t = Math.pow(1 + (r / h) * (r / h), -n);
        var X = px0 + pw / 2 + r / rMax * pw / 2, Y = py0 - VL.clamp(t, 0, 1.15) * ph * 0.85; if (k === -100) g.moveTo(X, Y); else g.lineTo(X, Y); }
      g.stroke();
      g.fillStyle = C.text3; g.fillText('−' + rMax + ' cm', px0, py0 + 14); g.fillText('0', px0 + pw / 2 - 3, py0 + 14); g.fillText('+' + rMax + ' cm', px0 + pw - 40, py0 + 14);
      var edge = Math.pow(1 + (5 / h) * (5 / h), -n);
      read.innerHTML = '<div><b>' + (edge * 100).toFixed(1) + ' %</b><span>thickness 5 cm off-centre, relative to the centre</span></div><div><b>' + total.toLocaleString() + '</b><span>simulated atoms on the substrate</span></div>';
    }
    var lp = VL.loop(fig, step); VL.playButton(ctl, lp); VL.button(ctl, 'Clear', reset);
  };

  /* ═══ 270° electron-beam gun ══════════════════════════════ */
  F.ebeam = function (fig) {
    var ctl = VL.part(fig, 'vl-controls'), host = VL.part(fig, 'vl-plot'), read = VL.part(fig, 'vl-readout');
    var draw = function () {
      var V = vs.get() * 1e3, B = bs.get() * 1e-3, gamma = 1 + VL.e * V / (VL.me * VL.c * VL.c), pmom = Math.sqrt(Math.pow(VL.e * V / VL.c + VL.me * VL.c, 2) - Math.pow(VL.me * VL.c, 2)), r = pmom / (VL.e * B), v = pmom / (gamma * VL.me);
      var sc = 2200, r0 = 0.04, rp = r * sc, F = { x: 210, y: 330 }, Cc = { x: F.x, y: F.y - rp }, crX = F.x + r0 * sc, crY = 250, land = F.x + rp, off = (rp - r0 * sc) / sc;
      var path = '', N = 80; for (var i = 0; i <= N; i++) { var a = Math.PI / 2 + (1.5 * Math.PI) * i / N, x = Cc.x + rp * Math.cos(a), y = Cc.y + rp * Math.sin(a); path += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
      path += ' L' + land.toFixed(1) + ' ' + crY;
      var hit = Math.abs(off) < 0.009, I = is.get();
      var dots = ''; for (var gx = 40; gx < 640; gx += 34) for (var gy = 30; gy < 330; gy += 34) dots += '<circle cx="' + gx + '" cy="' + gy + '" r="1.6" fill="rgba(69,191,214,.35)"/>';
      host.innerHTML = '<svg viewBox="0 0 680 380" class="plot" role="img" aria-label="270 degree electron beam gun">' + dots +
        '<text x="400" y="40" class="pl-note" fill="' + C.cyan + '">⊙ magnetic field B out of the page</text>' +
        '<rect x="' + (crX - 55) + '" y="' + crY + '" width="110" height="60" rx="4" fill="#b87333" opacity=".85"/><rect x="' + (crX - 40) + '" y="' + (crY - 2) + '" width="80" height="20" rx="3" fill="#3d3550"/>' +
        '<ellipse cx="' + crX + '" cy="' + (crY + 2) + '" rx="' + 22 + '" ry="6" fill="' + (hit ? '#ffcf6b' : '#6d6290') + '"' + (hit ? ' class="vl-glow"' : '') + '/>' +
        '<text x="' + (crX - 50) + '" y="' + (crY + 46) + '" class="pl-note" fill="#f5e6d3">water-cooled Cu hearth</text>' +
        '<rect x="' + (F.x - 30) + '" y="' + (F.y - 6) + '" width="44" height="18" rx="3" fill="#3d3550" stroke="#837a94"/><path d="M' + (F.x - 20) + ' ' + (F.y + 2) + ' q 4 -6 8 0 t 8 0 t 8 0" stroke="#ff9a3c" stroke-width="2" fill="none"/>' +
        '<text x="' + (F.x - 66) + '" y="' + (F.y + 34) + '" class="pl-note" fill="' + C.text2 + '">filament (LT) + anode (HT)</text>' +
        '<path d="' + path + '" fill="none" stroke="' + C.au + '" stroke-width="3" stroke-dasharray="7 5" class="vl-flow" opacity=".95"/>' +
        (hit ? '<g opacity=".8">' + [-30, -15, 0, 15, 30].map(function (d) { return '<line x1="' + crX + '" y1="' + crY + '" x2="' + (crX + d * 2.4) + '" y2="' + (crY - 120) + '" stroke="#ffcf6b" stroke-width="1.5" stroke-dasharray="3 6" class="vl-flow"/>'; }).join('') + '<text x="' + (crX + 50) + '" y="' + (crY - 90) + '" class="pl-note" fill="#ffcf6b">vapour to the substrate</text></g>' : '<text x="' + (land - 40) + '" y="' + (crY - 12) + '" class="pl-note" fill="' + C.red + '">beam misses the melt!</text>') +
        '<text x="' + (Cc.x - 20) + '" y="' + (Cc.y + 4) + '" class="pl-note" fill="' + C.text3 + '">r = ' + (r * 100).toFixed(2) + ' cm</text></svg>';
      read.innerHTML = '<div><b>' + (v / VL.c).toFixed(3) + ' c</b><span>electron speed (' + VL.sci(v, 3) + ' m/s)</span></div><div><b>' + (r * 100).toFixed(2) + ' cm</b><span>bend radius r = p/(eB)</span></div><div><b>' + (V * I / 1e3).toFixed(2) + ' kW</b><span>beam power P = V·I</span></div><div><b>' + (hit ? 'on the melt' : (off > 0 ? '+' : '') + (off * 1000).toFixed(0) + ' mm off') + '</b><span>landing point</span></div>';
    };
    var vs = VL.slider(ctl, { label: 'Accelerating voltage (HT)', min: 2, max: 12, step: 0.1, value: 8, fmt: function (v) { return v.toFixed(1) + ' kV'; }, on: function () { draw(); } });
    var bs = VL.slider(ctl, { label: 'Magnetic field', min: 4, max: 15, step: 0.05, value: 7.6, fmt: function (v) { return v.toFixed(2) + ' mT'; }, on: function () { draw(); } });
    var is = VL.slider(ctl, { label: 'Emission current', min: 0, max: 1, step: 0.01, value: 0.3, fmt: function (v) { return (v * 1000).toFixed(0) + ' mA'; }, on: function () { draw(); } });
    draw();
  };
})();
