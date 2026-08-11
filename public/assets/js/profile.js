/* ============================================================
   profile.js — cover meter, recent work, edit / save / cancel
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA;

  /* Exposed as LW.bootProfile() and re-run by the app after every
     client-side navigation — see the note in common.js's LW.boot. */
  LW.bootProfile = function () {

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

    /* ---------- edit / save / cancel ----------------------- */
    var form = LW.$('#formProfile');
    if (!form) return;

    var fields = LW.$$('input, select', form);
    var foot = LW.$('#profileFoot');
    var hint = LW.$('#editHint');
    var btnEdit = LW.$('#btnEdit');
    var btnCancel = LW.$('#btnCancel');
    var page = form.closest('.page');
    var saved = {};

    function snapshot() {
      fields.forEach(function (f) { saved[f.id] = f.value; });
    }

    function setEditing(on) {
      fields.forEach(function (f) { f.disabled = !on; });
      foot.style.display = on ? '' : 'none';
      page.classList.toggle('is-editing', on);
      hint.textContent = on ? 'Editing' : 'Read only';
      btnEdit.innerHTML = on
        ? LW.ico('i-x', 16) + ' Stop editing'
        : LW.ico('i-edit', 16) + ' Edit profile';
      if (on) fields[0].focus();
    }

    snapshot();

    btnEdit.addEventListener('click', function () {
      setEditing(fields[0].disabled);
    });

    btnCancel.addEventListener('click', function () {
      fields.forEach(function (f) {
        f.value = saved[f.id];
        f.closest('.field').classList.remove('is-bad', 'is-good');
      });
      setEditing(false);
      LW.toast('Changes discarded.');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = LW.$('#pfEmail');
      if (!LW.mark(email, LW.isEmail(email.value), 'That address doesn\u2019t look right.')) {
        LW.toast('Check the highlighted fields.', true);
        return;
      }

      /* the header follows the form */
      var name = LW.$('#pfFirst').value.trim() + ' ' + LW.$('#pfLast').value.trim();
      LW.$('#profName').textContent = name;
      LW.$('#profHandle').textContent = '@' + LW.$('#pfHandle').value.trim();
      LW.$$('.av--xl, .sideuser .av').forEach(function (av) { av.textContent = LW.initials(name); });
      var sideName = LW.$('.sideuser b');
      if (sideName) sideName.textContent = name;
      var sideHandle = LW.$('.sideuser span span');
      if (sideHandle) sideHandle.textContent = '@' + LW.$('#pfHandle').value.trim();

      snapshot();
      setEditing(false);
      LW.toast('Profile saved.');
    });
  };
})();
