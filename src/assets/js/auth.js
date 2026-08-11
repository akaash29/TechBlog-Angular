/* ============================================================
   auth.js — sign in / create account
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW;

  document.addEventListener('DOMContentLoaded', function () {

    /* the level meter along the floor of the stage */
    var levels = LW.$('#levels');
    if (levels) {
      var bars = 44, html = '';
      for (var i = 0; i < bars; i++) {
        html += '<i style="animation-delay:' + (-(i * 97 % 1600)) + 'ms;animation-duration:' +
                (1100 + (i * 137) % 900) + 'ms"></i>';
      }
      levels.innerHTML = html;
    }

    /* ---------------- sign in ----------------------------- */
    var login = LW.$('#formLogin');
    if (login) {
      login.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = LW.$('#liEmail'), pass = LW.$('#liPass');
        var ok = LW.mark(email, LW.isEmail(email.value), 'That address doesn\u2019t look right.');
        ok = LW.mark(pass, pass.value.length >= 8, 'Passwords are at least 8 characters.') && ok;
        if (!ok) { LW.toast('Check the highlighted fields.', true); return; }

        var btn = login.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.style.opacity = '.7';
        LW.toast('Signing you in\u2026');
        /* replace this branch with a real request */
        setTimeout(function () { location.href = 'dashboard.html'; }, 700);
      });
    }

    /* ---------------- create account ---------------------- */
    var reg = LW.$('#formRegister');
    if (reg) {
      var pass = LW.$('#rgPass'), meter = LW.$('#meter');
      var words = ['Use 8+ characters', 'Weak', 'Getting there', 'Strong', 'Very strong'];

      if (pass && meter) {
        pass.addEventListener('input', function () {
          var level = pass.value ? LW.strength(pass.value) : 0;
          meter.setAttribute('data-level', level);
          meter.querySelector('span').textContent = words[level];
        });
      }

      /* handles are letters and numbers only, lowercased as you type */
      var handle = LW.$('#rgHandle');
      if (handle) {
        handle.addEventListener('input', function () {
          handle.value = handle.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        });
      }

      reg.addEventListener('submit', function (e) {
        e.preventDefault();
        var first = LW.$('#rgFirst'), last = LW.$('#rgLast'),
            email = LW.$('#rgEmail'), role = LW.$('#rgRole'), terms = LW.$('#rgTerms');

        var ok = LW.mark(first, first.value.trim().length > 1, 'Required.');
        ok = LW.mark(last, last.value.trim().length > 1, 'Required.') && ok;
        ok = LW.mark(handle, handle.value.length >= 3, 'At least 3 letters or numbers.') && ok;
        ok = LW.mark(email, LW.isEmail(email.value), 'That address doesn\u2019t look right.') && ok;
        ok = LW.mark(role, !!role.value, 'Choose one — you can change it later.') && ok;
        ok = LW.mark(pass, LW.strength(pass.value) >= 2, 'Use at least 8 characters.') && ok;

        if (!terms.checked) {
          LW.toast('Accept the contributor guidelines to continue.', true);
          terms.focus();
          return;
        }
        if (!ok) { LW.toast('Check the highlighted fields.', true); return; }

        var btn = reg.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.style.opacity = '.7';
        LW.toast('Account created. An editor reviews new writers within a day.');
        setTimeout(function () { location.href = 'dashboard.html'; }, 1100);
      });
    }
  });
})();
