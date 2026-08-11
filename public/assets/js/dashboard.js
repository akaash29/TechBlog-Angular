/* ============================================================
   dashboard.js — the reads curve and the live meter
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW;

  var W = 700, H = 230, PAD = 14;

  var SERIES = {
    today: [180, 120, 90, 70, 60, 95, 210, 480, 720, 810, 760, 690,
            820, 900, 870, 760, 820, 980, 1240, 1520, 1810, 2140, 1620, 900],
    week:  [640, 520, 430, 380, 360, 450, 780, 1320, 1740, 1880, 1790, 1620,
            1810, 1960, 1900, 1740, 1880, 2140, 2480, 2760, 3020, 3280, 2610, 1580]
  };

  /* a rounded path through the points — Catmull-Rom, as beziers */
  function curve(points) {
    var d = 'M' + points[0][0] + ',' + points[0][1];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i],
          p1 = points[i], p2 = points[i + 1],
          p3 = points[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }

  function draw(key) {
    var vals = SERIES[key];
    var max = Math.max.apply(null, vals) * 1.12;
    var pts = vals.map(function (v, i) {
      return [
        +(i * (W / (vals.length - 1))).toFixed(1),
        +(H - PAD - (v / max) * (H - PAD * 2)).toFixed(1)
      ];
    });

    var line = curve(pts);
    LW.$('#chartLine').setAttribute('d', line);
    LW.$('#chartArea').setAttribute('d', line + 'L' + W + ',' + H + 'L0,' + H + 'Z');

    var peakVal = Math.max.apply(null, vals);
    var peak = pts[vals.indexOf(peakVal)];
    var dot = LW.$('#chartPeak');
    dot.setAttribute('cx', peak[0]);
    dot.setAttribute('cy', peak[1]);

    /* restart the draw animation */
    var l = LW.$('#chartLine');
    l.style.animation = 'none';
    void l.offsetWidth;
    l.style.animation = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!LW.$('#chartLine')) return;

    draw('today');

    /* Today / Week */
    LW.$$('.card__head .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.parentElement;
        LW.$$('.chip', group).forEach(function (c) { c.classList.remove('is-on'); });
        chip.classList.add('is-on');
        draw(chip.textContent.trim().toLowerCase() === 'week' ? 'week' : 'today');
      });
    });

    /* the trending meter — same wave vocabulary as sign-in */
    var meter = LW.$('#nowMeter');
    if (meter) {
      var html = '';
      for (var i = 0; i < 34; i++) {
        html += '<i style="animation-delay:' + (-(i * 83 % 1400)) + 'ms;animation-duration:' +
                (900 + (i * 111) % 800) + 'ms"></i>';
      }
      meter.innerHTML = html;
    }

    /* count the stat values up on first paint */
    LW.$$('.stat__val').forEach(function (el) {
      var raw = el.textContent.trim();
      var num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return;
      var suffix = /k$/i.test(raw) ? 'k' : '';
      var comma = raw.indexOf(',') > -1;
      var start = performance.now(), dur = 900;

      function tick(now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var v = num * eased;
        var out = suffix ? v.toFixed(1) : Math.round(v).toString();
        if (comma && !suffix) out = out.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        el.textContent = out + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      }
      requestAnimationFrame(tick);
    });
  });
})();
