/* ============================================================
   feed.js — the reading feed + suggested / most-viewed /
   most-liked rail. Reuses blog.js (window.LWB) for likes,
   comments and image fallbacks.
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA, B = window.LWB;

  /* Exposed as LW.bootFeed() and re-run by the app after every
     client-side navigation — see the note in common.js's LW.boot. */
  LW.bootFeed = function () {
    var main = LW.$('#feedList');
    if (!main) return;

    var heroSlot = LW.$('#feedHero');
    var me = (D.me && D.me.handle) || 'ravireads';
    var mySection = 'City';

    /* ---------- ordering per tab -------------------------- */
    function ordered(mode) {
      var list = D.posts.slice();
      if (mode === 'latest') return list;                    /* data is newest-first */
      if (mode === 'trending') {
        return list.sort(function (a, b) {
          return (b.views + b.likes * 6) - (a.views + a.likes * 6);
        });
      }
      /* "for you": your beat first, then a blend of reach + warmth */
      return list.sort(function (a, b) {
        function score(p) {
          return p.views * 0.4 + p.likes * 4 +
                 (p.cat === mySection ? 1200 : 0) +
                 (p.feature ? 1500 : 0);
        }
        return score(b) - score(a);
      });
    }

    /* ---------- the hero ---------------------------------- */
    function hero(p) {
      return '<a class="fhero" href="post.html?id=' + p.id + '">' +
        '<img src="' + LW.esc(p.img) + '" alt="' + LW.esc(p.alt) + '" onerror="this.remove()">' +
        '<div class="fhero__body">' +
          '<span class="fhero__pick">' + LW.ico('i-star', 13) + ' Top of your feed</span>' +
          '<span class="fhero__cat">' + LW.esc(p.cat) + '</span>' +
          '<h3>' + LW.esc(p.title) + '</h3>' +
          '<p>' + LW.esc(p.dek) + '</p>' +
          '<div class="fhero__foot">' +
            '<span class="fhero__by">' + B.avatar(p.author) +
              '<span><b>' + LW.esc(p.author) + '</b>' +
              '<small>' + LW.esc(p.date) + ' · ' + p.read + ' min read</small></span>' +
            '</span>' +
            '<span class="fhero__stats">' +
              '<span>' + LW.ico('i-eye', 15) + p.views.toLocaleString() + '</span>' +
              '<span>' + LW.ico('i-heart', 15) + p.likes + '</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
    }

    /* ---------- a feed card ------------------------------- */
    function card(p, i) {
      return '<article class="fcard" style="--i:' + i + '">' +
        '<a class="fcard__art art--' + B.slug(p.cat) + '" href="post.html?id=' + p.id + '" aria-label="' + LW.esc(p.title) + '">' +
          '<img src="' + LW.esc(p.img) + '" alt="' + LW.esc(p.alt) + '" loading="lazy" onerror="this.remove()">' +
          '<span class="catmark">' + LW.esc(p.cat) + '</span>' +
        '</a>' +
        '<div class="fcard__main">' +
          '<div class="fcard__meta">' + B.avatar(p.author) +
            '<b>' + LW.esc(p.author) + '</b><time>' + LW.esc(p.date) + ' · ' + p.read + ' min</time></div>' +
          '<h4><a href="post.html?id=' + p.id + '">' + LW.esc(p.title) + '</a></h4>' +
          '<p class="fcard__dek">' + LW.esc(p.dek) + '</p>' +
          '<div class="postacts" data-post="' + p.id + '">' + B.actions(p) + '</div>' +
        '</div>' +
        '<div class="thread" data-threadfor="' + p.id + '">' + B.thread(p.id) + '</div>' +
      '</article>';
    }

    function render(mode) {
      var list = ordered(mode);
      var lead = list[0];
      heroSlot.innerHTML = hero(lead);
      main.innerHTML = list.slice(1).map(function (p, i) { return card(p, i); }).join('');
    }

    /* ---------- tabs -------------------------------------- */
    var tabs = LW.$('#feedTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-sort]');
        if (!chip) return;
        LW.$$('.chip', tabs).forEach(function (c) { c.classList.toggle('is-on', c === chip); });
        render(chip.getAttribute('data-sort'));
      });
    }

    render('foryou');

    /* ================= the right rail ===================== */

    /* suggested: strong pieces from outside your own beat */
    var suggested = D.posts
      .filter(function (p) { return p.handle !== me && p.cat !== mySection; })
      .sort(function (a, b) { return b.likes - a.likes; })
      .slice(0, 3);

    LW.$('#railSuggested').innerHTML =
      '<div class="railcard"><h5>' + LW.ico('i-star', 14) + ' Suggested for you</h5>' +
        '<div class="railcard__body">' +
          suggested.map(function (p) {
            return '<a class="sugg" href="post.html?id=' + p.id + '">' +
              '<span class="sugg__art art--' + B.slug(p.cat) + '">' +
                '<img src="' + LW.esc(p.img) + '" alt="" loading="lazy" onerror="this.remove()"></span>' +
              '<span class="sugg__body"><b>' + LW.esc(p.title) + '</b>' +
                '<small>' + LW.esc(p.author) + ' · ' + LW.esc(p.cat) + '</small></span></a>';
          }).join('') +
        '</div></div>';

    /* a ranked metric list with the level-meter bar */
    function metricList(list, max, val, meta, liked) {
      return list.map(function (p, i) {
        var pct = Math.max(8, Math.round(val(p) / max * 100));
        return '<a class="metric' + (liked ? ' metric--liked' : '') + '" href="post.html?id=' + p.id + '">' +
          '<em>' + String(i + 1).padStart(2, '0') + '</em>' +
          '<span class="metric__body">' +
            '<b>' + LW.esc(p.title) + '</b>' +
            '<span class="metric__bar"><i style="width:' + pct + '%"></i></span>' +
            '<small>' + meta(p) + '</small>' +
          '</span></a>';
      }).join('');
    }

    var byViews = D.posts.slice().sort(function (a, b) { return b.views - a.views; }).slice(0, 4);
    var maxViews = byViews[0].views;
    LW.$('#railViewed').innerHTML =
      '<div class="railcard"><h5>' + LW.ico('i-eye', 14) + ' Most viewed</h5>' +
        '<div class="railcard__body">' +
          metricList(byViews, maxViews, function (p) { return p.views; },
            function (p) { return p.views.toLocaleString() + ' reads · ' + p.cat; }, false) +
        '</div></div>';

    var byLikes = D.posts.slice().sort(function (a, b) { return b.likes - a.likes; }).slice(0, 4);
    var maxLikes = byLikes[0].likes;
    LW.$('#railLiked').innerHTML =
      '<div class="railcard"><h5>' + LW.ico('i-heart', 14) + ' Most liked</h5>' +
        '<div class="railcard__body">' +
          metricList(byLikes, maxLikes, function (p) { return p.likes; },
            function (p) { return LW.ico('i-heart', 12) + p.likes + ' likes · ' + p.cat; }, true) +
        '</div></div>';

    /* topics */
    LW.$('#railTopics').innerHTML =
      '<div class="railcard"><h5>' + LW.ico('i-tag', 14) + ' Topics</h5>' +
        '<div class="railtopics">' +
          D.categories.map(function (c) {
            return '<a class="chip" href="journal.html?cat=' + encodeURIComponent(c) + '">' + LW.esc(c) + '</a>';
          }).join('') +
        '</div></div>';

    /* dark CTA, carrying the level-meter motif */
    var meter = '';
    for (var m = 0; m < 22; m++) {
      var h = 30 + Math.round(Math.abs(Math.sin(m / 2)) * 70);
      meter += '<i style="height:' + h + '%;animation-delay:-' + (Math.random() * 1.6).toFixed(2) + 's"></i>';
    }
    LW.$('#railCta').innerHTML =
      '<div class="railcta">' +
        '<div class="railcta__meter" aria-hidden="true">' + meter + '</div>' +
        '<h5>Have something to say?</h5>' +
        '<p>Draft it in the newsroom and take it to a desk. Your feed is where readers find it first.</p>' +
        '<a class="btn btn--signal btn--sm" href="dashboard.html">' + LW.ico('i-edit', 15) + ' Start writing</a>' +
      '</div>';

    /* one delegated listener powers likes + comment threads */
    B.wire(LW.$('.page'));

    /* ---------- topbar search filters the feed ------------ */
    var search = LW.$('.topbar input[type="search"]');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        if (!q) { render(currentMode()); return; }
        var hits = D.posts.filter(function (p) {
          return (p.title + ' ' + p.dek + ' ' + p.author + ' ' + p.cat).toLowerCase().indexOf(q) > -1;
        });
        heroSlot.innerHTML = '';
        main.innerHTML = hits.length
          ? hits.map(function (p, i) { return card(p, i); }).join('')
          : '<div class="card empty"><h4>Nothing matches “' + LW.esc(search.value.trim()) +
            '”</h4><p style="margin:0">Try another writer, tag or title.</p></div>';
      });
    }
    function currentMode() {
      var on = tabs && LW.$('.chip.is-on', tabs);
      return on ? on.getAttribute('data-sort') : 'foryou';
    }
  };
})();
