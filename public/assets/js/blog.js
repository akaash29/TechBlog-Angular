/* ============================================================
   blog.js — markup shared by journal.html and post.html
   ============================================================ */

(function () {
  'use strict';

  var LW = window.LW, D = window.LWDATA;
  var B = window.LWB = {};

  /* likes and comments the reader adds live here for the session */
  B.liked = {};
  B.extra = {};

  B.slug = function (cat) { return String(cat).toLowerCase().replace(/[^a-z]/g, ''); };

  B.byId = function (id) {
    return D.posts.filter(function (p) { return String(p.id) === String(id); })[0];
  };

  B.commentsFor = function (id) {
    return (D.comments[id] || []).concat(B.extra[id] || []);
  };

  B.likesFor = function (p) { return p.likes + (B.liked[p.id] ? 1 : 0); };

  /* an <img> that quietly steps aside if it cannot load,
     leaving the category gradient underneath */
  B.art = function (p, cls) {
    return '<span class="' + cls + ' art--' + B.slug(p.cat) + '">' +
             '<img src="' + LW.esc(p.img) + '" alt="' + LW.esc(p.alt) + '" loading="lazy" ' +
             'onerror="this.remove()">' +
             '<span class="catmark">' + LW.esc(p.cat) + '</span>' +
           '</span>';
  };

  B.avatar = function (name, cls) {
    return '<span class="av ' + (cls || 'av--sm') + '" style="background:' + LW.tint(name) + '">' +
           LW.initials(name) + '</span>';
  };

  /* ---------- the feature slot ---------------------------- */
  B.feature = function (p) {
    return '<article class="feature">' +
      '<a class="feature__art art--' + B.slug(p.cat) + '" href="post.html?id=' + p.id + '" aria-label="' + LW.esc(p.title) + '">' +
        '<img src="' + LW.esc(p.img) + '" alt="' + LW.esc(p.alt) + '" onerror="this.remove()">' +
        '<span class="catmark">' + LW.esc(p.cat) + '</span>' +
      '</a>' +
      '<div class="feature__body">' +
        '<span class="onair">Lead story</span>' +
        '<h3><a href="post.html?id=' + p.id + '">' + LW.esc(p.title) + '</a></h3>' +
        '<p>' + LW.esc(p.dek) + '</p>' +
        '<div class="byline" style="margin-top:auto">' + B.avatar(p.author) +
          '<span><b>' + LW.esc(p.author) + '</b><br><span>' + LW.esc(p.date) + ' · ' + p.read + ' min read</span></span>' +
        '</div>' +
        '<div class="postacts" data-post="' + p.id + '">' + B.actions(p) + '</div>' +
      '</div>' +
    '</article>';
  };

  /* ---------- the like / comment / read row --------------- */
  B.actions = function (p) {
    var n = B.commentsFor(p.id).length;
    return '<button class="act act--like' + (B.liked[p.id] ? ' is-on' : '') + '" data-like="' + p.id + '" ' +
             'aria-pressed="' + (!!B.liked[p.id]) + '">' + LW.ico('i-heart', 17) +
             '<span data-likes>' + B.likesFor(p) + '</span></button>' +
           '<button class="act" data-thread="' + p.id + '">' + LW.ico('i-chat', 17) +
             '<span data-count>' + n + '</span></button>' +
           '<a class="act act--read" href="post.html?id=' + p.id + '">Read ' + LW.ico('i-arrow', 15) + '</a>';
  };

  /* ---------- a post card --------------------------------- */
  B.card = function (p, i) {
    return '<article class="postcard" style="--i:' + (i || 0) + '">' +
      '<a class="postcard__art art--' + B.slug(p.cat) + '" href="post.html?id=' + p.id + '" aria-label="' + LW.esc(p.title) + '">' +
        '<img src="' + LW.esc(p.img) + '" alt="' + LW.esc(p.alt) + '" loading="lazy" onerror="this.remove()">' +
        '<span class="catmark">' + LW.esc(p.cat) + '</span>' +
      '</a>' +
      '<div class="postcard__body">' +
        '<div class="postcard__meta"><span>' + LW.esc(p.date) + '</span><span>' + p.read + ' min</span></div>' +
        '<h4><a href="post.html?id=' + p.id + '">' + LW.esc(p.title) + '</a></h4>' +
        '<p class="postcard__dek">' + LW.esc(p.dek) + '</p>' +
        '<div class="byline">' + B.avatar(p.author) + '<span><b>' + LW.esc(p.author) + '</b></span></div>' +
      '</div>' +
      '<div class="postacts" data-post="' + p.id + '">' + B.actions(p) + '</div>' +
      '<div class="thread" data-threadfor="' + p.id + '">' + B.thread(p.id) + '</div>' +
    '</article>';
  };

  /* ---------- comments ------------------------------------ */
  B.comment = function (c) {
    return '<div class="comment">' + B.avatar(c.who) +
      '<div><div class="comment__who"><b>' + LW.esc(c.who) + '</b><time>' + LW.esc(c.when) + '</time></div>' +
      '<p>' + LW.esc(c.text) + '</p></div></div>';
  };

  B.thread = function (id) {
    var list = B.commentsFor(id);
    var html = '<div data-comments="' + id + '">';
    html += list.length
      ? list.map(B.comment).join('')
      : '<p style="padding:16px 0 4px;color:var(--dim);font-size:14px">No comments yet. Start the conversation.</p>';
    html += '</div>' +
      '<form class="replybox" data-reply="' + id + '">' +
        '<input type="text" placeholder="Write a comment" aria-label="Write a comment">' +
        '<button type="submit" aria-label="Post comment">' + LW.ico('i-send', 17) + '</button>' +
      '</form>';
    return html;
  };

  /* ---------- one delegated listener for all of it -------- */
  B.wire = function (root) {
    root.addEventListener('click', function (e) {
      var like = e.target.closest('[data-like]');
      if (like) {
        var id = like.getAttribute('data-like');
        var p = B.byId(id);
        B.liked[id] = !B.liked[id];
        like.classList.toggle('is-on', B.liked[id]);
        like.setAttribute('aria-pressed', String(!!B.liked[id]));
        LW.$$('[data-like="' + id + '"] [data-likes]').forEach(function (s) {
          s.textContent = B.likesFor(p);
        });
        return;
      }

      var toggle = e.target.closest('[data-thread]');
      if (toggle) {
        var tid = toggle.getAttribute('data-thread');
        var panel = root.querySelector('[data-threadfor="' + tid + '"]');
        if (panel) panel.classList.toggle('is-on');
        return;
      }
    });

    root.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-reply]');
      if (!form) return;
      e.preventDefault();
      var id = form.getAttribute('data-reply');
      var input = form.querySelector('input');
      var text = input.value.trim();
      if (!text) { input.focus(); return; }

      B.extra[id] = B.extra[id] || [];
      B.extra[id].push({ who: D.me.name, when: 'Just now', text: text });

      var box = root.querySelector('[data-comments="' + id + '"]');
      if (box) {
        if (!B.extra[id].length || box.querySelector('p[style]')) box.innerHTML = '';
        box.insertAdjacentHTML('beforeend', B.comment({ who: D.me.name, when: 'Just now', text: text }));
      }
      LW.$$('[data-thread="' + id + '"] [data-count]').forEach(function (s) {
        s.textContent = B.commentsFor(id).length;
      });
      input.value = '';
      LW.toast('Comment posted.');
    });
  };
})();
