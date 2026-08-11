/* ============================================================
   messages.js — the writers' room chat
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW, D = window.LWDATA;

  /* canned replies so the thread answers back once — swap for a socket */
  var REPLIES = [
    'Got it — making that change now.',
    'Makes sense. I\u2019ll have it back to you within the hour.',
    'Agreed. Filing it under the same slug so copy edit picks it up.',
    'Noted. Give me until this afternoon and I\u2019ll send the revised version.'
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = LW.$('#msgWrap');
    if (!wrap) return;

    var list     = LW.$('#convoList');
    var scroller = LW.$('#msgScroll');
    var head     = LW.$('#threadHead');
    var info     = LW.$('#msgInfo');
    var typing   = LW.$('#typing');
    var composer = LW.$('#composer');
    var input    = LW.$('#msgInput');
    var sendBtn  = LW.$('#msgSend');
    var search   = LW.$('#convoSearch');
    var filters  = LW.$('#convoFilters');

    var threads = D.threads;
    var current = threads[0];
    var filter = 'all';
    var query = '';
    var unread = { 'city-desk': 2, nadiah: 1 };
    var replyTimer;

    function av(name, cls) {
      return '<span class="av ' + (cls || 'av--sm') + '" style="background:' + LW.tint(name) + '">' +
             LW.initials(name) + '</span>';
    }

    function lastOf(t) {
      var m = t.messages[t.messages.length - 1];
      if (!m) return { text: '', at: '' };
      var text = m.kind === 'voice' ? 'Voice note \u00B7 ' + m.len
               : m.kind === 'file'  ? m.file.name
               : m.text;
      return { text: (m.mine ? 'You: ' : '') + text, at: m.at };
    }

    /* ---------- conversation list ------------------------- */
    function renderList() {
      var shown = threads.filter(function (t) {
        if (filter === 'unread' && !unread[t.id]) return false;
        if (filter === 'groups' && t.tag !== 'Group') return false;
        if (filter === 'writers' && t.tag === 'Group') return false;
        if (!query) return true;
        var hay = (t.name + ' ' + t.role + ' ' + lastOf(t).text).toLowerCase();
        return hay.indexOf(query.toLowerCase()) > -1;
      });

      list.innerHTML = shown.length ? shown.map(function (t) {
        var last = lastOf(t);
        var n = unread[t.id];
        return '<li><button class="convo' + (t === current ? ' is-on' : '') + (n ? ' is-unread' : '') +
          '" data-thread="' + t.id + '">' +
          '<span class="presence presence--' + t.presence + '">' + av(t.name) + '</span>' +
          '<span class="convo__mid">' +
            '<span class="convo__top"><b>' + LW.esc(t.name) + '</b><time>' + LW.esc(last.at) + '</time></span>' +
            '<span class="convo__snip"><p>' + LW.esc(last.text) + '</p>' +
              (n ? '<span class="unread">' + n + '</span>' : '') + '</span>' +
            (t.tag ? '<span class="convo__tag">' + LW.esc(t.tag) + '</span>' : '') +
          '</span>' +
        '</button></li>';
      }).join('')
        : '<li class="empty"><h4>No conversations match</h4><p>Try a different name, or clear the filter.</p></li>';

      var total = Object.keys(unread).reduce(function (a, k) { return a + unread[k]; }, 0);
      var pill = LW.$('#navUnread');
      if (pill) pill.style.display = total ? '' : 'none';
      if (pill && total) pill.textContent = total;
    }

    /* ---------- one message ------------------------------- */
    function bubble(m, isHead) {
      var inner = '';

      if (!m.mine && isHead && m.who) {
        inner += '<span class="bub__name">' + LW.esc(m.who) + '</span>';
      }

      if (m.kind === 'voice') {
        var bars = '';
        for (var i = 0; i < 26; i++) {
          bars += '<i style="height:' + (18 + Math.round(Math.abs(Math.sin(i * 1.7)) * 78)) + '%"></i>';
        }
        inner += '<span class="voice">' +
            '<button class="voice__play" aria-label="Play voice note">' + LW.ico('i-mic', 16) + '</button>' +
            '<span class="wavebars">' + bars + '</span>' +
            '<span class="voice__len">' + LW.esc(m.len) + '</span>' +
          '</span>';
      } else {
        inner += '<p>' + LW.esc(m.text) + '</p>';
        if (m.kind === 'file') {
          inner += '<span class="attach">' +
              '<span class="attach__ico">' + LW.ico(m.file.ico, 17) + '</span>' +
              '<span><b>' + LW.esc(m.file.name) + '</b><span>' + LW.esc(m.file.meta) + '</span></span>' +
            '</span>';
        }
      }

      inner += '<span class="bub__meta">' + LW.esc(m.at) +
        (m.mine ? (m.seen
          ? LW.ico('i-checks', 13) + '<span class="seen">Seen</span>'
          : LW.ico('i-check', 13)) : '') +
        '</span>';

      var reacts = '';
      if (m.reacts && m.reacts.length) {
        reacts = '<span class="reacts">' + m.reacts.map(function (r) {
          return '<button class="react' + (r.on ? ' is-on' : '') + '">' + r.e + '<b>' + r.n + '</b></button>';
        }).join('') + '</span>';
      }

      return '<div class="line' + (m.mine ? ' line--me' : '') + (isHead ? ' is-head' : '') + '">' +
        av(m.mine ? D.me.name : (m.who || current.name)) +
        '<span><span class="bub">' + inner + '</span>' + reacts + '</span>' +
      '</div>';
    }

    /* ---------- the thread -------------------------------- */
    function renderThread(scroll) {
      var t = current;

      head.innerHTML =
        '<button class="thread__back" id="threadBack" aria-label="Back to conversations">' + LW.ico('i-arrow', 17) + '</button>' +
        '<span class="presence presence--' + t.presence + '">' + av(t.name, 'av') + '</span>' +
        '<span><h4>' + LW.esc(t.name) + '</h4>' +
          '<span class="status status--' + (t.presence === 'on' ? 'on' : 'off') + '">' + LW.esc(t.seen) + '</span></span>' +
        '<span class="thread__acts">' +
          '<button class="iconbtn" aria-label="Search this conversation">' + LW.ico('i-search', 17) + '</button>' +
          '<button class="iconbtn" aria-label="Conversation options">' + LW.ico('i-more', 17) + '</button>' +
        '</span>';

      var html = '', lastMine = null, lastWho = null;
      t.messages.forEach(function (m) {
        if (m.day) {
          html += '<div class="daysep">' + LW.esc(m.day) + '</div>';
          lastMine = null; lastWho = null;
        }
        var who = m.mine ? '_me' : (m.who || t.name);
        var isHead = (who !== lastWho) || (m.mine !== lastMine);
        html += bubble(m, isHead);
        lastMine = m.mine; lastWho = who;
      });
      scroller.innerHTML = html;

      /* the info rail */
      info.innerHTML =
        '<div class="infohead">' + av(t.name, 'av av--lg') +
          '<h4>' + LW.esc(t.name) + '</h4>' +
          '<p>' + LW.esc(t.role) + '</p>' +
          '<div class="infoacts">' +
            '<button>' + LW.ico('i-id', 18) + 'Profile</button>' +
            '<button>' + LW.ico('i-bell', 18) + 'Mute</button>' +
            '<button>' + LW.ico('i-star', 18) + 'Pin</button>' +
          '</div>' +
        '</div>' +
        (t.pinned ? '<div class="pinned"><h5>Pinned note</h5><p>' + LW.esc(t.pinned.text) + '</p>' +
          '<time>' + LW.esc(t.pinned.when) + '</time></div>' : '') +
        '<div class="infoblock"><h5>Shared files</h5>' +
          (t.files.length
            ? '<ul class="filelist">' + t.files.map(function (f) {
                return '<li><span class="attach__ico">' + LW.ico(f.ico, 16) + '</span>' +
                       '<span><b>' + LW.esc(f.name) + '</b><span>' + LW.esc(f.meta) + '</span></span></li>';
              }).join('') + '</ul>'
            : '<p style="font-size:13.5px;color:var(--dim);margin:0">Nothing shared here yet. Drag a file into the message box to send one.</p>') +
        '</div>';

      if (scroll !== false) {
        scroller.scrollTop = scroller.scrollHeight;
      }
      LW.$('#threadBack').addEventListener('click', function () { wrap.classList.remove('is-thread'); });
    }

    function open(t) {
      current = t;
      delete unread[t.id];
      clearTimeout(replyTimer);
      typing.classList.remove('is-on');
      renderList();
      renderThread();
      wrap.classList.add('is-thread');
    }

    /* ---------- sending ----------------------------------- */
    function push(m) {
      var t = current;
      var prev = t.messages[t.messages.length - 1];
      var who = m.mine ? '_me' : (m.who || t.name);
      var prevWho = prev ? (prev.mine ? '_me' : (prev.who || t.name)) : null;
      t.messages.push(m);
      if (m.day) {
        scroller.insertAdjacentHTML('beforeend', '<div class="daysep">' + LW.esc(m.day) + '</div>');
        prevWho = null;
      }
      scroller.insertAdjacentHTML('beforeend', bubble(m, who !== prevWho));
      scroller.scrollTop = scroller.scrollHeight;
      renderList();
    }

    function now() {
      var d = new Date();
      return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    function send() {
      var text = input.value.trim();
      if (!text) return;

      /* open today's section if the thread hasn't already */
      var seps = LW.$$('.daysep', scroller);
      var needsDay = !seps.length || seps[seps.length - 1].textContent !== 'Today';

      push({ day: needsDay ? 'Today' : null, mine: true, at: now(), kind: 'text', text: text });
      input.value = '';
      input.style.height = 'auto';
      sendBtn.disabled = true;

      /* the other side answers once */
      var t = current;
      clearTimeout(replyTimer);
      replyTimer = setTimeout(function () {
        typing.querySelector('span').textContent = t.name.split(' ')[0] + ' is typing';
        typing.classList.add('is-on');
        replyTimer = setTimeout(function () {
          typing.classList.remove('is-on');
          if (current !== t) { unread[t.id] = (unread[t.id] || 0) + 1; renderList(); return; }
          push({
            mine: false,
            who: t.tag === 'Group' ? t.role.split('·')[1].trim().split(',')[0] : null,
            at: now(), kind: 'text',
            text: REPLIES[Math.floor(Math.random() * REPLIES.length)]
          });
        }, 1900);
      }, 800);
    }

    /* ---------- events ------------------------------------ */
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-thread]');
      if (!btn) return;
      var t = threads.filter(function (x) { return x.id === btn.getAttribute('data-thread'); })[0];
      if (t) open(t);
    });

    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]');
      if (!chip) return;
      filter = chip.getAttribute('data-filter');
      LW.$$('.chip', filters).forEach(function (c) { c.classList.toggle('is-on', c === chip); });
      renderList();
    });

    search.addEventListener('input', function () { query = search.value.trim(); renderList(); });

    scroller.addEventListener('click', function (e) {
      var play = e.target.closest('.voice__play');
      if (play) {
        var voice = play.closest('.voice');
        var on = voice.classList.toggle('is-playing');
        play.innerHTML = LW.ico(on ? 'i-x' : 'i-mic', 16);
        if (on) setTimeout(function () {
          voice.classList.remove('is-playing');
          play.innerHTML = LW.ico('i-mic', 16);
        }, 3000);
        return;
      }
      var react = e.target.closest('.react');
      if (react) {
        var n = parseInt(react.querySelector('b').textContent, 10);
        var on2 = react.classList.toggle('is-on');
        react.querySelector('b').textContent = on2 ? n + 1 : n - 1;
      }
    });

    composer.addEventListener('submit', function (e) { e.preventDefault(); send(); });

    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 132) + 'px';
      sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    LW.$$('#composer .tool').forEach(function (b) {
      b.addEventListener('click', function () {
        LW.toast('Attachments aren\u2019t wired up in this template yet.');
      });
    });

    /* ---------- go --------------------------------------- */
    renderList();
    renderThread();
    sendBtn.disabled = true;

    /* on wide screens both panes are visible from the start */
    if (window.matchMedia('(min-width: 861px)').matches) wrap.classList.add('is-thread');
  });
})();
