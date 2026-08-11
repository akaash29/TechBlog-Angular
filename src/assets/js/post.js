/* ============================================================
   post.js — article render, sidebar, comments, progress
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA, B = window.LWB;

  document.addEventListener('DOMContentLoaded', function () {
    var slot = LW.$('#articleSlot');
    if (!slot) return;

    var id = new URLSearchParams(location.search).get('id') || D.posts[0].id;
    var p = B.byId(id) || D.posts[0];

    document.title = p.title + ' \u00B7 Longwave';
    var top = LW.$('#topTitle');
    if (top) top.textContent = p.cat;

    /* ---------- the article ------------------------------- */
    var body = p.body.map(function (para, i) {
      /* drop the pull quote in after the second paragraph */
      var out = '<p>' + LW.esc(para) + '</p>';
      if (i === 1 && p.quote) {
        out += '<blockquote><p>' + LW.esc(p.quote) + '</p></blockquote>';
      }
      return out;
    }).join('');

    slot.innerHTML =
      '<article class="article">' +
        '<div class="article__art art--' + B.slug(p.cat) + '">' +
          '<img src="' + LW.esc(p.img) + '" alt="' + LW.esc(p.alt) + '" onerror="this.remove()">' +
        '</div>' +
        '<div class="article__head">' +
          '<span class="onair">' + LW.esc(p.cat) + '</span>' +
          '<h1>' + LW.esc(p.title) + '</h1>' +
          '<p class="article__dek">' + LW.esc(p.dek) + '</p>' +
          '<div class="article__by">' + B.avatar(p.author, 'av') +
            '<span><b>' + LW.esc(p.author) + '</b><span>@' + LW.esc(p.handle) + ' \u00B7 ' +
              LW.esc(p.date) + ' \u00B7 ' + p.read + ' min read</span></span>' +
            '<button class="btn btn--ghost btn--sm" data-live="1">' + LW.ico('i-bookmark', 15) + ' Save</button>' +
          '</div>' +
        '</div>' +
        '<div class="prose">' + body + '</div>' +
        '<div class="article__foot" data-post="' + p.id + '">' + B.actions(p) + '</div>' +
      '</article>' +
      '<section class="comments">' +
        '<div class="comments__head"><h4>Comments</h4>' +
          '<span class="eyebrow"><span data-count>' + B.commentsFor(p.id).length + '</span> so far</span></div>' +
        '<div class="comments__body">' + B.thread(p.id) + '</div>' +
      '</section>';

    /* the reading view shows its comments open */
    var t = slot.querySelector('.thread');
    if (t) t.classList.add('is-on');

    /* the "Read" link is pointless on the page you're reading */
    var readBtn = slot.querySelector('.act--read');
    if (readBtn) readBtn.remove();

    /* ---------- the rail ---------------------------------- */
    var rail = LW.$('#railSlot');
    var byViews = D.posts.slice().sort(function (a, b) { return b.views - a.views; }).slice(0, 4);
    var byTalk = D.posts.slice().sort(function (a, b) {
      return B.commentsFor(b.id).length - B.commentsFor(a.id).length || b.likes - a.likes;
    }).slice(0, 3);

    function rank(list, meta) {
      return list.map(function (q, i) {
        return '<a class="rankrow" href="post.html?id=' + q.id + '">' +
          '<em>' + String(i + 1).padStart(2, '0') + '</em>' +
          '<span><b>' + LW.esc(q.title) + '</b><small>' + meta(q) + '</small></span></a>';
      }).join('');
    }

    rail.innerHTML =
      '<div class="railcard"><h5>Sections</h5><div class="railcats">' +
        D.categories.map(function (c) {
          return '<a class="chip" href="journal.html?cat=' + encodeURIComponent(c) + '">' + LW.esc(c) + '</a>';
        }).join('') +
      '</div></div>' +

      '<div class="railcard"><h5>Most read</h5><div class="railcard__body">' +
        rank(byViews, function (q) { return q.views.toLocaleString() + ' reads \u00B7 ' + q.cat; }) +
      '</div></div>' +

      '<div class="railcard"><h5>Most discussed</h5><div class="railcard__body">' +
        rank(byTalk, function (q) { return B.commentsFor(q.id).length + ' comments \u00B7 ' + q.likes + ' likes'; }) +
      '</div></div>' +

      '<div class="railcard railcard--dark">' +
        '<h5>Writers\u2019 room</h5>' +
        '<p>Working on a piece for this section? Take it to the desk and get an editor on it.</p>' +
        '<a class="btn btn--signal btn--sm" href="messages.html">' + LW.ico('i-chat', 15) + ' Message the desk</a>' +
      '</div>';

    B.wire(LW.$('.page'));

    /* ---------- reading progress -------------------------- */
    var bar = LW.$('#progress');
    if (bar) {
      var onScroll = function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(window.scrollY / h, 1) * 100 : 0) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  });
})();
