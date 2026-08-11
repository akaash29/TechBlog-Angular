/* ============================================================
   common.js — shared behaviour for every page
   ============================================================ */

(function () {
  'use strict';

  var LW = window.LW = window.LW || {};

  /* ---------- tiny helpers ------------------------------- */
  LW.$  = function (sel, root) { return (root || document).querySelector(sel); };
  LW.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  LW.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  LW.initials = function (name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  };

  /* a stable colour per person, drawn from the house palette */
  var PALETTE = ['#2E7C6C', '#D6265E', '#E4A93B', '#294B42', '#3C6E9E', '#B7523F', '#6B7A8F'];
  LW.tint = function (seed) {
    var n = 0;
    for (var i = 0; i < String(seed).length; i++) n = (n * 31 + String(seed).charCodeAt(i)) % 9973;
    return PALETTE[n % PALETTE.length];
  };

  LW.ico = function (id, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '"><use href="#' + id + '"/></svg>';
  };

  /* ---------- toast -------------------------------------- */
  var toastTimer;
  LW.toast = function (msg, bad) {
    var el = LW.$('#toast');
    if (!el) return;
    LW.$('#toastMsg').textContent = msg;
    el.classList.toggle('is-bad', !!bad);
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3200);
  };

  /* ---------- validation --------------------------------- */
  LW.mark = function (input, ok, msg) {
    var field = input.closest('.field');
    if (!field) return ok;
    field.classList.toggle('is-bad', !ok);
    field.classList.toggle('is-good', !!ok && !!input.value);
    if (msg) {
      var m = field.querySelector('.field__msg');
      if (m) m.textContent = msg;
    }
    return ok;
  };

  LW.isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); };

  LW.strength = function (v) {
    var score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
    return Math.min(score, 4);
  };

  /* ---------- boot --------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {

    /* mark the current nav item + set the topbar title */
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    LW.$$('[data-nav]').forEach(function (a) {
      var on = a.getAttribute('href').toLowerCase() === here;
      a.classList.toggle('is-on', on);
      if (on) {
        var title = LW.$('#topTitle');
        if (title) title.textContent = a.textContent.trim();
      }
    });
    /* the reading view has no nav item of its own */
    if (here === 'post.html') {
      var t = LW.$('#topTitle');
      if (t) t.textContent = 'Reading';
      var j = LW.$('[data-nav][href="journal.html"]');
      if (j) j.classList.add('is-on');
    }

    /* mobile drawer */
    var side = LW.$('.side');
    if (side) {
      var scrim = document.createElement('div');
      scrim.className = 'scrim';
      document.body.appendChild(scrim);

      var topbar = LW.$('.topbar');
      if (topbar) {
        var burger = document.createElement('button');
        burger.className = 'menubtn';
        burger.setAttribute('aria-label', 'Open the menu');
        burger.innerHTML = LW.ico('i-menu', 20);
        topbar.insertBefore(burger, topbar.firstChild);
        burger.addEventListener('click', function () {
          side.classList.add('is-open');
          scrim.classList.add('is-on');
        });
      }
      function shut() { side.classList.remove('is-open'); scrim.classList.remove('is-on'); }
      scrim.addEventListener('click', shut);
      side.addEventListener('click', function (e) { if (e.target.closest('a')) shut(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }

    /* password reveal */
    LW.$$('[data-reveal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.getAttribute('data-reveal'));
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = LW.ico(show ? 'i-eye-off' : 'i-eye', 19);
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        input.focus();
      });
    });

    /* selects need a class for the floating label to lift */
    LW.$$('.field__box select').forEach(function (sel) {
      var sync = function () { sel.classList.toggle('has-val', !!sel.value); };
      sel.addEventListener('change', sync);
      sync();
    });

    /* clear the error state as soon as someone starts fixing it */
    LW.$$('.field input, .field select').forEach(function (input) {
      input.addEventListener('input', function () {
        var f = input.closest('.field');
        if (f) f.classList.remove('is-bad');
      });
    });

    /* buttons that are decorative in a static template still respond */
    LW.$$('.btn, .iconbtn').forEach(function (b) {
      if (b.dataset.live || b.type === 'submit' || b.closest('form')) return;
      var label = b.textContent.trim() || b.getAttribute('aria-label');
      if (!label) return;
      b.addEventListener('click', function () {
        if (b.closest('a')) return;
        LW.toast(label + ' isn\u2019t wired up in this template yet.');
      });
    });
  });
})();
