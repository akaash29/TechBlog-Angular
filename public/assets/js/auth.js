/* ============================================================
   auth.js — sign in / create account decorative bits.

   Form validation and submission for #formLogin / #formRegister
   are now owned by Angular reactive forms (see login.ts /
   register.ts) — this file only draws the level meter, so it
   doesn't fight the Angular (ngSubmit) handlers.
   ============================================================ */

(function () {
  'use strict';
  var LW = window.LW;

  /* Exposed as LW.bootAuth() and re-run by the app after every
     client-side navigation — see the note in common.js's LW.boot. */
  LW.bootAuth = function () {

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
  };
})();
