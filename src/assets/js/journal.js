/* ============================================================
   journal.js — listing, category filter, likes, comments
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA, B = window.LWB;

  document.addEventListener('DOMContentLoaded', function () {
    var grid = LW.$('#postGrid');
    if (!grid) return;

    var rail = LW.$('#catRail');
    var slot = LW.$('#featureSlot');
    var empty = LW.$('#postEmpty');
    var count = LW.$('#postCount');

    var params = new URLSearchParams(location.search);
    var active = params.get('cat') || 'All';

    /* ---------- the rail ---------------------------------- */
    function countIn(cat) {
      return cat === 'All' ? D.posts.length
        : D.posts.filter(function (p) { return p.cat === cat; }).length;
    }

    rail.innerHTML = ['All'].concat(D.categories).map(function (cat) {
      return '<button class="chip' + (cat === active ? ' is-on' : '') + '" data-cat="' + LW.esc(cat) + '">' +
             LW.esc(cat) + '<em>' + countIn(cat) + '</em></button>';
    }).join('');

    /* ---------- render ------------------------------------ */
    function render() {
      var list = active === 'All' ? D.posts.slice()
        : D.posts.filter(function (p) { return p.cat === active; });

      if (count) count.textContent = list.length;

      /* the lead story only leads the unfiltered view */
      var lead = null;
      if (active === 'All') {
        lead = list.filter(function (p) { return p.feature; })[0] || list[0];
        list = list.filter(function (p) { return p !== lead; });
      }
      slot.innerHTML = lead ? B.feature(lead) : '';

      grid.innerHTML = list.map(B.card).join('');
      empty.style.display = (!lead && !list.length) ? '' : 'none';
    }

    rail.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-cat]');
      if (!chip) return;
      active = chip.getAttribute('data-cat');
      LW.$$('.chip', rail).forEach(function (c) { c.classList.toggle('is-on', c === chip); });
      history.replaceState(null, '', active === 'All' ? location.pathname : '?cat=' + encodeURIComponent(active));
      render();
    });

    render();
    B.wire(LW.$('.page'));

    /* the topbar search filters the grid too */
    var search = LW.$('.topbar input[type="search"]');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        if (!q) { render(); return; }
        slot.innerHTML = '';
        var hits = D.posts.filter(function (p) {
          return (p.title + ' ' + p.dek + ' ' + p.author + ' ' + p.cat).toLowerCase().indexOf(q) > -1;
        });
        grid.innerHTML = hits.map(B.card).join('');
        empty.style.display = hits.length ? 'none' : '';
        if (count) count.textContent = hits.length;
      });
    }
  });
})();
