/* Vacuum & deposition article — the coating-unit simulator.
   A rotary pump, a diffusion pump, roughing / backing / hi-vac valves,
   a vent (purge) valve, two Pirani heads (GH1 chamber, GH2 foreline)
   and a Penning gauge. Gas flow is solved from Q = C·Δp and S·p
   throughputs on three volumes, so wrong sequences behave wrongly. */
(function () {
  'use strict';
  var VL = window.VL, C = VL.col;

  VL.figs.sim = function (fig) {
    var top = VL.part(fig, 'sim-top'), diag = VL.part(top, 'sim-diag'), side = VL.part(top, 'sim-side');
    var ctl = VL.part(fig, 'vl-controls'), plotEl = VL.part(fig, 'vl-plot'), log = VL.part(fig, 'sim-log');
    var ATM = 1013;
    var S0 = {
      t: 0, pc: ATM, pf: ATM, pr: ATM, warm: 0, water: false, rotary: false, heater: false,
      v: { RV: false, BV: false, HV: false, AV: false }, sinceVent: 0, hist: [], warned: {}, stalled: false, damage: 0, done: {}
    };
    var st, speed = 30, auto = null, hot = false;
    function reset() { st = JSON.parse(JSON.stringify(S0)); log.innerHTML = ''; say('All valves closed. The chamber, and the diffusion pump’s foreline, are at atmosphere. Follow the numbered steps, or press “Show me”.', 'info'); auto = null; }
    function say(msg, kind) { var p = document.createElement('p'); p.className = 'sim-msg ' + (kind || ''); p.innerHTML = '<span>' + fmtClock(st ? st.t : 0) + '</span> ' + msg; log.insertBefore(p, log.firstChild); while (log.children.length > 40) log.removeChild(log.lastChild); }
    function warnOnce(key, msg) { if (st.warned[key]) return; st.warned[key] = 1; say(msg, 'warn'); }
    function fmtClock(t) { var m = Math.floor(t / 60), s = Math.floor(t % 60); return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

    /* ── physics ───────────────────────────────────────────── */
    var Vc = 40, Vf = 1.5, Vr = 0.5;               // litres
    var cond = function (p1, p2, cmol, kvis, cmax) { var pm = (p1 + p2) / 2; return Math.min(cmax, cmol + kvis * pm); };
    var rotS = function (p) { return st.rotary ? Math.max(0, 4.5 * (1 - 2e-3 / Math.max(p, 1e-9))) : 0; };
    var Pcrit = 0.4;
    function dpWorking() { return st.warm > 0.8 && st.water !== null && st.pf < Pcrit; }
    function dpS(p) { var w = VL.clamp((st.warm - 0.8) / 0.2, 0, 1); return 550 * w / (1 + Math.pow(p / 2e-3, 1.3)); }
    function substep(dt) {
      var v = st.v, Qc = 0, Qf = 0, Qr = 0;
      var out = 0.05 / (1 + st.sinceVent / 60) + 2e-7; // water desorbing from the walls (falls roughly as 1/t) + a small leak, mbar·L/s
      Qc += out; Qf += 3e-5;
      if (v.AV) { var q = cond(ATM, st.pc, 0.5, 0.02, 4) * (ATM - st.pc); Qc += q; }
      if (v.RV) { q = cond(st.pc, st.pr, 1.5, 0.4, 30) * (st.pc - st.pr); Qc -= q; Qr += q; }
      if (v.BV) { q = cond(st.pf, st.pr, 2, 0.6, 30) * (st.pf - st.pr); Qf -= q; Qr += q; }
      var working = dpWorking();
      if (v.HV) {
        if (working && st.pc < 2) { q = dpS(st.pc) * st.pc; Qc -= q; Qf += q; }
        else { q = cond(st.pc, st.pf, 120, 4, 400) * (st.pc - st.pf); Qc -= q; Qf += q; }
      }
      Qr -= rotS(st.pr) * st.pr;
      if (!st.rotary && (v.RV || v.BV)) { Qr += 0.02; } // a stopped rotary leaks air (and oil) back
      st.pc = VL.clamp(st.pc + Qc / Vc * dt, 1e-9, 1100); st.pf = VL.clamp(st.pf + Qf / Vf * dt, 1e-6, 1100); st.pr = VL.clamp(st.pr + Qr / Vr * dt, 1e-6, 1100);
      // diffusion-pump heater
      if (st.heater) st.warm = Math.min(1.15, st.warm + dt / 900 * (st.water ? 1 : 1.3)); else st.warm = Math.max(0, st.warm - dt / (st.water ? 1300 : 3600));
      if (st.pc < 1) st.sinceVent += dt; else st.sinceVent = 0;
      st.t += dt;
    }
    function maxDt() {
      var v = st.v, rates = [1];
      if (v.AV) rates.push(4 / Vc); if (v.RV) rates.push(30 / Vr); if (v.BV) rates.push(30 / Vr, 30 / Vf); if (v.HV) rates.push(400 / Vf, 550 / Vc); rates.push(4.5 / Vr);
      return 0.25 / Math.max.apply(null, rates);
    }
    function checks() {
      var v = st.v;
      if (v.HV && st.warm > 0.5 && st.pc > 0.5) { warnOnce('hvatm', '<b>Hi-vac valve opened with the chamber at ' + VL.sci(st.pc, 2) + ' mbar while the diffusion pump is hot.</b> Air floods the boiler: the jets collapse, the hot oil oxidises and cracks, and oil vapour is blown back into the chamber. Rough the chamber below ≈0.1 mbar first.'); st.damage++; }
      if (st.warm > 0.8 && st.pf > Pcrit) { if (!st.stalled) { st.stalled = true; warnOnce('stall' + Math.floor(st.t / 300), '<b>Foreline (GH2) above the critical backing pressure (' + Pcrit + ' mbar).</b> The diffusion pump stalls: the lowest jet cannot compress the gas against that pressure, and oil backstreams towards the chamber. Keep the backing valve open whenever the pump is hot.'); } } else st.stalled = false;
      if (v.RV && v.BV && st.pc > 1) warnOnce('rvbv', '<b>Roughing and backing valves open together</b> with the chamber at ' + VL.sci(st.pc, 2) + ' mbar: chamber air rushes back into the diffusion-pump foreline. Use one at a time.');
      if (v.AV && v.HV) warnOnce('venthv', '<b>Venting with the hi-vac valve open</b> pushes nitrogen straight into the diffusion pump. Close the hi-vac valve before you vent.');
      if (!st.rotary && (v.RV || v.BV) && st.pr < 500) warnOnce('suck' + Math.floor(st.t / 600), '<b>Rotary pump stopped with a valve open.</b> Without an anti-suck-back valve, oil is drawn up the line into the foreline or chamber. Close the valves before stopping the rotary.');
      if (st.heater && !st.water && st.warm > 0.6) warnOnce('water', '<b>Heater on with no cooling water.</b> The oil vapour no longer condenses on the walls; the pump overheats and the thermal cut-out should trip. Water first, heater second.');
    }
    function stepsDone() {
      var v = st.v, d = st.done;
      if (st.water) d.w = 1; if (st.rotary) d.r = 1; if (v.BV && st.pf < 0.1) d.b = 1; if (st.heater && st.warm > 0.8) d.h = 1;
      if (d.h && v.RV && !v.BV && st.pc < 0.05) d.rough = 1; if (d.rough && v.BV && !v.RV) d.back = 1; if (d.back && v.HV) d.hv = 1; if (d.hv && st.pc < 2e-5) d.base = 1;
      return d;
    }
    var STEPS = [['w', 'Cooling water on'], ['r', 'Rotary pump on'], ['b', 'Backing valve open — foreline (GH2) below 0.1 mbar'], ['h', 'DP heater on — wait ~15 min to warm up'], ['rough', 'Close backing, open roughing — chamber (GH1) below 0.05 mbar'], ['back', 'Close roughing, open backing again'], ['hv', 'Open the hi-vac valve'], ['base', 'Penning below 2×10⁻⁵ mbar — ready to deposit']];

    /* ── automatic correct sequence ────────────────────────── */
    var AUTO = [
      function () { st.water = true; return 'Cooling water on.'; }, function () { st.rotary = true; return 'Rotary pump on.'; },
      function () { st.v.BV = true; return 'Backing valve open: the rotary evacuates the diffusion pump and its foreline.'; },
      function () { return st.pf < 0.1 ? (st.heater = true, 'Foreline below 0.1 mbar — diffusion-pump heater on. It needs ~15 minutes to boil the oil.') : null; },
      function () { return st.warm > 0.85 ? (st.v.BV = false, st.v.RV = true, 'Pump warm. Backing closed, roughing open: the rotary now pumps the chamber directly.') : null; },
      function () { return st.pc < 0.05 ? (st.v.RV = false, st.v.BV = true, 'Chamber below 0.05 mbar. Roughing closed, backing open again.') : null; },
      function () { return st.pf < 0.1 ? (st.v.HV = true, 'Hi-vac valve open: the diffusion pump now takes the chamber into high vacuum.') : null; },
      function () { return st.pc < 2e-5 ? (auto = null, 'Base pressure reached — the Penning reads ' + VL.sci(st.pc, 2) + ' mbar. Ready to deposit.') : null; }];
    function runAuto() { if (!auto) return; var f = AUTO[auto.i]; if (!f) { auto = null; return; } var m = f(); if (m) { say(m, 'ok'); if (auto) auto.i++; } }

    /* ── drawing ───────────────────────────────────────────── */
    var pcol = function (p) { var t = VL.clamp((Math.log10(p) + 7) / 10, 0, 1); var r = Math.round(69 + (226 - 69) * t), g = Math.round(191 + (86 - 191) * t), b = Math.round(214 + (110 - 214) * t); return 'rgb(' + r + ',' + g + ',' + b + ')'; };
    var pirani = function (p) { return p > 300 ? 'ATM' : p < 1e-3 ? '<1.0E-3' : sciE(p); };
    var penning = function (p) { return p > 1e-2 ? '— —' : p < 1e-7 ? '<1.0E-7' : sciE(p); };
    function sciE(p) { var e = Math.floor(Math.log10(p)), m = p / Math.pow(10, e); if (m >= 9.95) { m = 1; e++; } return m.toFixed(1) + 'E' + (e < 0 ? '-' : '+') + Math.abs(e); }
    function valve(id, x, y, label, vert) {
      var open = st.v[id];
      return '<g class="sim-valve" data-v="' + id + '" tabindex="0" role="button" aria-pressed="' + open + '" aria-label="' + label + ' valve"><rect x="' + (x - 17) + '" y="' + (y - 13) + '" width="34" height="26" rx="5" fill="#0f0a18" stroke="' + (open ? C.green : C.red) + '" stroke-width="2"/>' +
        '<path d="M' + (x - 11) + ' ' + (y - 7) + ' L' + (x + 11) + ' ' + (y + 7) + ' L' + (x + 11) + ' ' + (y - 7) + ' L' + (x - 11) + ' ' + (y + 7) + ' Z" fill="' + (open ? C.green : C.red) + '" transform="rotate(' + (vert ? 90 : 0) + ' ' + x + ' ' + y + ')" opacity=".9"/>' +
        '<text x="' + x + '" y="' + (y + 27) + '" class="sim-lbl" text-anchor="middle">' + id + '</text></g>';
    }
    function gauge(x, y, name, val, col) { return '<g><rect x="' + x + '" y="' + y + '" width="86" height="36" rx="5" fill="#0b0814" stroke="rgba(255,255,255,.25)"/><text x="' + (x + 6) + '" y="' + (y + 12) + '" class="sim-gname">' + name + '</text><text x="' + (x + 80) + '" y="' + (y + 29) + '" class="sim-gval" fill="' + col + '" text-anchor="end">' + val + '</text></g>'; }
    function drawDiag() {
      var v = st.v, w = VL.clamp(st.warm, 0, 1), working = dpWorking();
      var s = '<svg viewBox="0 0 600 430" class="sim-svg" role="img" aria-label="Coating unit plumbing diagram">';
      // pipes
      var pipe = function (d, p) { return '<path d="' + d + '" fill="none" stroke="#2b2242" stroke-width="13" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="' + pcol(p) + '" stroke-width="7" stroke-linejoin="round" opacity=".85"/>'; };
      s += pipe('M250 150 H360 V250', st.pc) + pipe('M360 250 V318 H470', st.pr) + pipe('M220 380 H300', st.pf) + pipe('M300 380 H360 V318', st.pr) + pipe('M150 230 V262', st.pc) + pipe('M60 120 H30 V60', st.pc);
      // chamber (bell jar)
      s += '<path d="M60 230 V110 Q60 40 155 40 Q250 40 250 110 V230 Z" fill="' + pcol(st.pc) + '" fill-opacity=".14" stroke="rgba(255,255,255,.55)" stroke-width="2.5"/>';
      s += '<rect x="45" y="230" width="220" height="10" fill="#3b3156"/>';
      s += '<rect x="105" y="70" width="100" height="6" fill="' + C.cyan + '" opacity=".8"/><text x="155" y="64" class="sim-lbl" text-anchor="middle">substrates</text>';
      s += '<rect x="138" y="200" width="34" height="6" fill="' + (v.HV && st.pc < 5e-5 ? '#ffb347' : '#8a7aa8') + '"/><text x="155" y="222" class="sim-lbl" text-anchor="middle">boat</text>';
      s += '<text x="155" y="140" class="sim-big" text-anchor="middle">CHAMBER</text>';
      // diffusion pump
      s += '<rect x="122" y="262" width="56" height="112" rx="4" fill="#1d1530" stroke="' + (working ? C.au : 'rgba(255,255,255,.35)') + '" stroke-width="2"/>';
      for (var i = 0; i < 5; i++) s += '<rect x="114" y="' + (272 + i * 18) + '" width="6" height="10" fill="' + (st.water ? C.cyan : '#3a3550') + '"/><rect x="180" y="' + (272 + i * 18) + '" width="6" height="10" fill="' + (st.water ? C.cyan : '#3a3550') + '"/>';
      s += '<rect x="118" y="376" width="64" height="9" fill="' + (st.heater ? 'rgb(255,' + Math.round(150 - 80 * w) + ',40)' : '#3a2f2f') + '"/>';
      s += '<rect x="132" y="300" width="36" height="' + (60 * w) + '" y2="0" fill="' + C.au + '" opacity="' + (0.15 + 0.4 * w) + '" transform="translate(0 ' + (60 - 60 * w) + ')"/>';
      s += '<text x="150" y="405" class="sim-lbl" text-anchor="middle">diffusion pump ' + Math.round(w * 100) + ' %' + (st.stalled ? ' · STALLED' : '') + '</text>';
      // rotary
      s += '<g transform="translate(470 318)"><rect x="0" y="-26" width="104" height="52" rx="8" fill="#2a5c9c" stroke="' + (st.rotary ? C.green : 'rgba(255,255,255,.3)') + '" stroke-width="2"/><circle cx="34" cy="0" r="15" fill="#173a66"/><path d="M34 -12 V12 M22 0 H46" stroke="#cfd8e6" stroke-width="3" class="' + (st.rotary ? 'sim-spin' : '') + '" style="transform-origin:34px 0px"/><text x="74" y="5" class="sim-lbl" text-anchor="middle">ROTARY</text></g>';
      // N2 vent
      s += '<rect x="14" y="20" width="32" height="40" rx="6" fill="#4a5568"/><text x="30" y="16" class="sim-lbl" text-anchor="middle">N₂</text>';
      // valves
      s += valve('RV', 310, 150, 'Roughing') + valve('BV', 260, 380, 'Backing') + valve('HV', 150, 246, 'Hi-vac', true) + valve('AV', 30, 92, 'Vent (air admittance)', true);
      s += '<text x="310" y="128" class="sim-lbl" text-anchor="middle">roughing</text><text x="236" y="384" class="sim-lbl" text-anchor="end">backing</text><text x="196" y="250" class="sim-lbl">hi-vac</text><text x="52" y="96" class="sim-lbl">vent</text>';
      // gauges
      s += '<line x1="290" y1="150" x2="290" y2="182" stroke="rgba(255,255,255,.3)"/>' + gauge(266, 182, 'GH1 Pirani · chamber', pirani(st.pc), C.green);
      s += '<line x1="240" y1="380" x2="240" y2="350" stroke="rgba(255,255,255,.3)"/>' + gauge(196, 314, 'GH2 Pirani · foreline', pirani(st.pf), C.green);
      s += '<line x1="250" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,.3)"/>' + gauge(300, 62, 'Penning · chamber', penning(st.pc), C.au);
      s += '<text x="430" y="20" class="sim-lbl">time ' + fmtClock(st.t) + ' (×' + speed + ')</text>';
      diag.innerHTML = s + '</svg>';
    }
    function drawSide() {
      var d = stepsDone(), b = function (on, lbl, key) { return '<button type="button" class="vl-btn sim-sw' + (on ? ' on' : '') + '" data-sw="' + key + '">' + lbl + ': ' + (on ? 'ON' : 'OFF') + '</button>'; };
      var html = '<div class="sim-switches">' + b(st.water, 'Water', 'water') + b(st.rotary, 'Rotary', 'rotary') + b(st.heater, 'DP heater', 'heater') + '</div>';
      html += '<div class="sim-valves">' + ['RV', 'BV', 'HV', 'AV'].map(function (k) { return '<button type="button" class="vl-btn sim-sw' + (st.v[k] ? ' on' : '') + '" data-vb="' + k + '">' + { RV: 'Roughing', BV: 'Backing', HV: 'Hi-vac', AV: 'Vent N₂' }[k] + ' ' + (st.v[k] ? 'open' : 'closed') + '</button>'; }).join('') + '</div>';
      html += '<ol class="sim-steps">' + STEPS.map(function (s) { return '<li class="' + (d[s[0]] ? 'ok' : '') + '">' + s[1] + '</li>'; }).join('') + '</ol>';
      side.innerHTML = html;
    }
    function drawPlot() {
      var h = st.hist; if (h.length < 2) { plotEl.innerHTML = ''; return; }
      var tmax = Math.max(5, st.t / 60);
      plotEl.innerHTML = VL.plot({ id: 'simp', label: 'Pressure history', w: 720, h: 250, m: { l: 62, r: 16, t: 12, b: 42 }, x: { min: Math.max(0, tmax - 90), max: tmax, label: 'time (minutes)' }, y: { min: 1e-7, max: 2e3, log: true, label: 'pressure (mbar)' },
        series: [{ data: h.map(function (q) { return [q[0], q[1]]; }), color: C.au, label: 'chamber' }, { data: h.map(function (q) { return [q[0], q[2]]; }), color: C.cyan, dash: '5 4', label: 'foreline (GH2)' }],
        hlines: [{ y: Pcrit, color: C.red, label: 'critical backing pressure', dash: '2 3' }], legend: true, legendX: 12, legendY: 14 });
    }
    var acc = 0, sacc = 0, pacc = 0;
    function step(dt) {
      var simDt = dt * speed;
      while (simDt > 1e-9) { var h = Math.min(simDt, maxDt()); substep(h); simDt -= h; }
      checks(); runAuto();
      sacc += dt * speed; if (sacc >= 5) { sacc = 0; st.hist.push([st.t / 60, st.pc, st.pf]); if (st.hist.length > 2400) st.hist.shift(); }
      acc += dt; if (acc > 0.12 || dt === 0) { acc = 0; drawDiag(); drawSide(); }
      pacc += dt; if (pacc > 0.6 || dt === 0) { pacc = 0; drawPlot(); }
    }
    function toggle(kind, k) {
      if (kind === 'v') { st.v[k] = !st.v[k]; say({ RV: 'Roughing', BV: 'Backing', HV: 'Hi-vac', AV: 'Vent' }[k] + ' valve ' + (st.v[k] ? 'opened' : 'closed') + '.'); }
      else { st[k] = !st[k]; say({ water: 'Cooling water', rotary: 'Rotary pump', heater: 'Diffusion-pump heater' }[k] + (st[k] ? ' on.' : ' off.')); }
      auto = null; checks(); drawDiag(); drawSide();
    }
    fig.addEventListener('click', function (e) {
      var t = e.target.closest('[data-v],[data-vb],[data-sw]'); if (!t) return;
      if (t.dataset.v || t.dataset.vb) toggle('v', t.dataset.v || t.dataset.vb); else toggle('s', t.dataset.sw);
    });
    fig.addEventListener('keydown', function (e) { var t = e.target.closest('[data-v]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle('v', t.dataset.v); } });
    reset();
    var lp = VL.loop(fig, step);
    VL.button(ctl, 'Show me (correct start-up)', function () { reset(); auto = { i: 0 }; lp.play(); }, 'primary');
    VL.button(ctl, 'Reset', function () { reset(); step(0); });
    VL.playButton(ctl, lp);
    VL.select(ctl, { label: 'Speed', value: '30', options: [['1', 'real time'], ['10', '×10'], ['30', '×30'], ['120', '×120']], on: function (v) { speed = +v; } });
    step(0);
  };
})();
