/* ==========================================================
   Skills section interactions
   - Editing skills: a playhead scrubs across the "timeline" and
     lights up the clip under the pointer (tap on phones)
   - Software tiles: 3D tilt toward the pointer, brand colours on hover
   ========================================================== */
(function () {
  "use strict";

  var section = document.getElementById("skills");
  if (!section) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timeline = section.querySelector(".skill-timeline");
  var rows = Array.prototype.slice.call(section.querySelectorAll(".skill-tracks li"));
  var playhead = section.querySelector(".skill-playhead");
  var phLabel = playhead.querySelector("span");
  var tiles = Array.prototype.slice.call(section.querySelectorAll(".soft-tile"));

  var TRACK_START = 44; // px: where clips begin (after the track labels)
  var TIMELINE_SECONDS = 60; // the ruler's width shown as one minute

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function timecode(sec) {
    var f = Math.floor((sec % 1) * 30);
    var s = Math.floor(sec);
    return "00:" + pad(Math.floor(s / 60)) + ":" + pad(s % 60) + ":" + pad(f);
  }

  // ---------- playhead ----------
  function setPlayhead(p) {
    p = Math.min(1, Math.max(0, p));
    var span = timeline.clientWidth - TRACK_START;
    playhead.style.transform = "translateX(" + p * span + "px)";
    phLabel.textContent = timecode(p * TIMELINE_SECONDS);
  }

  function setActive(row) {
    rows.forEach(function (r) { r.classList.toggle("is-active", r === row); });
  }

  function rowAt(clientY) {
    for (var i = 0; i < rows.length; i++) {
      var b = rows[i].getBoundingClientRect();
      if (clientY >= b.top - 4 && clientY <= b.bottom + 4) return rows[i];
    }
    return null;
  }

  function progressAt(clientX) {
    var b = timeline.getBoundingClientRect();
    return (clientX - b.left - TRACK_START) / (b.width - TRACK_START);
  }

  var sweeping = false;

  timeline.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || sweeping) return;
    setPlayhead(progressAt(e.clientX));
    setActive(rowAt(e.clientY));
  });

  timeline.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse" && !sweeping) setActive(null);
  });

  // tap on touch screens: jump the playhead there and light that clip
  timeline.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" || sweeping) return;
    setPlayhead(progressAt(e.clientX));
    var row = rowAt(e.clientY);
    setActive(row && row.classList.contains("is-active") ? null : row);
  });

  // one pass of the playhead when the section first appears,
  // lighting each clip in turn like a timeline being played
  function sweep() {
    if (reduceMotion) return;
    sweeping = true;
    var start = null;
    var DURATION = 2200;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / DURATION);
      var eased = 1 - Math.pow(1 - p, 2);
      setPlayhead(eased);
      setActive(p < 1 ? rows[Math.min(rows.length - 1, Math.floor(p * rows.length))] : null);
      if (p < 1) requestAnimationFrame(frame);
      else sweeping = false;
    }
    requestAnimationFrame(frame);
  }

  // ---------- software tiles: tilt toward the pointer ----------
  tiles.forEach(function (tile) {
    var logo = tile.querySelector(".soft-logo");

    tile.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || reduceMotion) return;
      var b = tile.getBoundingClientRect();
      var x = (e.clientX - b.left) / b.width - 0.5;
      var y = (e.clientY - b.top) / b.height - 0.5;
      logo.style.setProperty("--ry", x * 30 + "deg");
      logo.style.setProperty("--rx", -y * 30 + "deg");
    });

    tile.addEventListener("pointerleave", function () {
      logo.style.removeProperty("--rx");
      logo.style.removeProperty("--ry");
    });

    // touch: tap to light a tile (one at a time)
    tile.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      var on = !tile.classList.contains("is-active");
      tiles.forEach(function (t) { t.classList.remove("is-active"); });
      tile.classList.toggle("is-active", on);
    });
  });

  // ---------- entrance ----------
  setPlayhead(0);
  window.addEventListener("resize", function () { setPlayhead(0); });

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  section.classList.add("skills-anim");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.disconnect();
      section.classList.add("is-in");
      setTimeout(sweep, 700);
    });
  }, { threshold: 0.1 });
  io.observe(section);
})();
