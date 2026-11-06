/* ==========================================================
   Contact: email options menu
   A plain "mailto:" link does nothing when the visitor has no
   mail app set up, so EMAIL opens a small menu instead:
   Gmail in the browser, the mail app, or copy the address.
   ========================================================== */
(function () {
  "use strict";

  var trigger = document.querySelector(".email-trigger");
  var menu = document.querySelector(".email-menu");
  if (!trigger || !menu) return;

  var copyBtn = menu.querySelector(".email-copy");
  var copyLabel = copyBtn.textContent;

  // keep the whole menu on screen (it is centred under EMAIL by default)
  function fitToScreen() {
    var EDGE = 12;
    menu.style.setProperty("--shift", "0px");
    var r = menu.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var shift = 0;
    if (r.left < EDGE) shift = EDGE - r.left;
    else if (r.right > vw - EDGE) shift = vw - EDGE - r.right;
    menu.style.setProperty("--shift", shift + "px");
  }

  function open() {
    menu.hidden = false;
    fitToScreen();
    trigger.setAttribute("aria-expanded", "true");
    menu.querySelector("a, button").focus({ preventScroll: true });
  }

  function close(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus({ preventScroll: true });
  }

  trigger.addEventListener("click", function (e) {
    e.preventDefault();
    if (menu.hidden) open();
    else close(false);
  });

  // close after choosing Gmail or the mail app
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setTimeout(function () { close(false); }, 0); });
  });

  // copy the address, with a fallback for older browsers
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function showCopied(ok) {
    copyBtn.textContent = ok ? "Copied!" : "Press Ctrl+C to copy";
    copyBtn.classList.add("is-done");
    setTimeout(function () {
      copyBtn.textContent = copyLabel;
      copyBtn.classList.remove("is-done");
    }, 1800);
  }

  copyBtn.addEventListener("click", function () {
    var email = copyBtn.dataset.email;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(
        function () { showCopied(true); },
        function () { showCopied(fallbackCopy(email)); }
      );
    } else {
      showCopied(fallbackCopy(email));
    }
  });

  // close when clicking elsewhere or pressing Esc
  document.addEventListener("click", function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !trigger.contains(e.target)) close(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close(true);
  });
  window.addEventListener("resize", function () { if (!menu.hidden) fitToScreen(); });
})();
