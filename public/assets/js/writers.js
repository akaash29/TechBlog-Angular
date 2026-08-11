/* ============================================================
   writers.js — the contributor table
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA;

  /* Exposed as LW.bootWriters() and re-run by the app after every
     client-side navigation — see the note in common.js's LW.boot. */
  LW.bootWriters = function () {
    var rows = LW.$('#memberRows');
    if (!rows) return;

    var empty = LW.$('#memberEmpty');
    var count = LW.$('#memberCount');
    var search = LW.$('#memberSearch');
    var chips = LW.$('#roleChips');

    var role = 'all', query = '';

    function statusClass(s) {
      if (s === 'Active') return 'status status--on';
      if (s === 'On leave') return 'status';
      return 'status status--off';
    }

    function render() {
      var list = D.writers.filter(function (w) {
        var okRole = role === 'all' || w.role === role;
        var q = query.toLowerCase();
        var okQuery = !q ||
          w.name.toLowerCase().indexOf(q) > -1 ||
          w.handle.toLowerCase().indexOf(q) > -1 ||
          w.section.toLowerCase().indexOf(q) > -1;
        return okRole && okQuery;
      });

      rows.innerHTML = list.map(function (w, i) {
        return '<tr style="--i:' + i + '">' +
          '<td><span class="who">' +
            '<span class="av av--sm" style="background:' + LW.tint(w.name) + '">' + LW.initials(w.name) + '</span>' +
            '<span><b>' + LW.esc(w.name) + '</b><span>@' + LW.esc(w.handle) + '</span></span>' +
          '</span></td>' +
          '<td><span class="badge badge--' + w.role.toLowerCase() + '">' + LW.esc(w.role) + '</span></td>' +
          '<td>' + LW.esc(w.section) + '</td>' +
          '<td><span class="' + statusClass(w.status) + '">' + LW.esc(w.status) + '</span></td>' +
          '<td class="num">' + LW.esc(w.joined) + '</td>' +
          '<td><span class="rowacts">' +
            '<a class="rowbtn rowbtn--send" href="messages.html" title="Message ' + LW.esc(w.name) + '" ' +
              'aria-label="Message ' + LW.esc(w.name) + '">' + LW.ico('i-chat', 16) + '</a>' +
            '<button class="rowbtn" data-live="1" title="More" aria-label="More options for ' + LW.esc(w.name) + '">' +
              LW.ico('i-more', 16) + '</button>' +
          '</span></td>' +
        '</tr>';
      }).join('');

      empty.style.display = list.length ? 'none' : '';
      if (count) count.textContent = list.length;
    }

    chips.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-role]');
      if (!chip) return;
      role = chip.getAttribute('data-role');
      LW.$$('.chip', chips).forEach(function (c) { c.classList.toggle('is-on', c === chip); });
      render();
    });

    search.addEventListener('input', function () { query = search.value.trim(); render(); });

    rows.addEventListener('click', function (e) {
      var btn = e.target.closest('.rowbtn:not(a)');
      if (btn) LW.toast('Row actions aren\u2019t wired up in this template yet.');
    });

    render();
  };
})();
