/* ============================================================
   profile.js — cover meter, recent work, edit / save / cancel
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA;

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- the cover level-meter (the house motif) ---- */
    var eq = LW.$('#profEq');
    if (eq) {
      var BARS = 56, html = '';
      for (var i = 0; i < BARS; i++) {
        /* a smooth waveform envelope, plus a little life */
        var wave = Math.sin(i / BARS * Math.PI * 3.2) * 0.5 + 0.5;
        var h = 22 + wave * 62 + Math.random() * 12;      /* 22%–96% */
        var dur = (1.5 + Math.random() * 1.4).toFixed(2);
        var del = (Math.random() * 1.6).toFixed(2);
        html += '<i style="height:' + h.toFixed(0) + '%;' +
                'animation-duration:' + dur + 's;animation-delay:-' + del + 's"></i>';
      }
      eq.innerHTML = html;
    }

    /* ---------- recent work, pulled from the author's posts - */
    var work = LW.$('#workList');
    if (work && D && D.posts) {
      var me = (D.me && D.me.handle) || 'ravireads';
      var mine = D.posts.filter(function (p) { return p.handle === me; }).slice(0, 4);
      if (!mine.length) mine = D.posts.slice(0, 3);

      work.innerHTML = mine.map(function (p) {
        return '<a class="workrow" href="post.html?id=' + p.id + '">' +
          '<span class="workrow__art">' +
            '<img src="' + LW.esc(p.img) + '" alt="" loading="lazy" onerror="this.remove()">' +
          '</span>' +
          '<span class="workrow__body">' +
            '<b>' + LW.esc(p.title) + '</b>' +
            '<span class="workrow__meta"><span>' + LW.esc(p.cat) + '</span>' +
              '<span>' + LW.esc(p.date) + '</span><span>' + p.read + ' min</span></span>' +
          '</span>' +
          '<span class="workrow__stat">' + LW.ico('i-heart', 14) + p.likes + '</span>' +
        '</a>';
      }).join('');
    }

    /* Edit / save / cancel for "Your details" and the profile photo picker
     * are owned by the Angular component (MyProfile) now \u2014 it talks to the
     * real API instead of this file's old client-only mock state. */
  });
})();
