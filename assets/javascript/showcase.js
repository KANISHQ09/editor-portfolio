/* ==========================================================
   Reel showcase: film-strip timeline + theater viewer
   To add a video: drop the .mp4 into assets/vid/<folder>/,
   add a thumbnail to assets/images/posters/, and add a line below.
   ========================================================== */
(function () {
  "use strict";

  // Category key -> tab label
  var CATEGORIES = {
    cafe: "Cafe & Restro",
    fun: "Fun",
    intro: "Intro",
    testimonials: "Testimonials"
  };

  // cat, folder inside assets/vid, file name (no extension), length in seconds
  var REELS = [
    { cat: "cafe", folder: "cafe and restro reels", file: "Video-23029", dur: 15.4 },
    { cat: "cafe", folder: "cafe and restro reels", file: "Video-39461", dur: 15.1 },
    { cat: "cafe", folder: "cafe and restro reels", file: "Video-47163", dur: 29.2 },
    { cat: "cafe", folder: "cafe and restro reels", file: "Video-66530", dur: 18.4 },
    { cat: "cafe", folder: "cafe and restro reels", file: "Video-6941", dur: 14.5 },
    { cat: "fun", folder: "fun-reels", file: "Video-42642", dur: 58.8 },
    { cat: "fun", folder: "fun-reels", file: "Video-59931", dur: 38.3 },
    { cat: "fun", folder: "fun-reels", file: "Video-61171", dur: 51.6 },
    { cat: "fun", folder: "fun-reels", file: "Video-70361", dur: 59.1 },
    { cat: "intro", folder: "intro reels", file: "Video-19103", dur: 56.1 },
    { cat: "intro", folder: "intro reels", file: "Video-66193", dur: 50.3 },
    { cat: "intro", folder: "intro reels", file: "Video-82858", dur: 36.2 },
    { cat: "intro", folder: "intro reels", file: "Video-99056", dur: 51.1 },
    { cat: "testimonials", folder: "testimonials-reels", file: "Video-19945", dur: 43.3 },
    { cat: "testimonials", folder: "testimonials-reels", file: "Video-52191", dur: 27.3 },
    { cat: "testimonials", folder: "testimonials-reels", file: "Video-64687", dur: 45.6 },
    { cat: "testimonials", folder: "testimonials-reels", file: "Video-7509", dur: 27.1 }
  ];

  var root = document.getElementById("reel-showcase");
  if (!root) return;

  var hasGsap = typeof window.gsap !== "undefined";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;
  var animate = hasGsap && !reduceMotion;

  var tabsEl = root.querySelector(".reel-tabs");
  var track = root.querySelector(".reel-track");
  var prevBtn = root.querySelector(".reel-arrow.prev");
  var nextBtn = root.querySelector(".reel-arrow.next");
  var ruler = root.querySelector(".reel-ruler");
  var rulerFill = root.querySelector(".reel-ruler-fill");
  var playhead = root.querySelector(".reel-playhead");

  var PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

  // ---------- helpers ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // HH:MM:SS:FF at 30 fps, like an editing timeline
  function timecode(sec) {
    var f = Math.floor((sec % 1) * 30);
    var s = Math.floor(sec);
    return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(f);
  }

  // write a timecode with each digit in its own fixed-width box (no jitter)
  function showTC(el, sec) {
    el.innerHTML = timecode(sec).replace(/\d/g, '<span class="tc-digit">$&</span>');
  }

  function shortTime(sec) {
    var s = Math.round(sec);
    return Math.floor(s / 60) + ":" + pad(s % 60);
  }

  function srcOf(r) { return encodeURI("assets/vid/" + r.folder + "/" + r.file + ".mp4"); }
  function posterOf(r) { return "assets/images/posters/" + r.folder.replace(/ /g, "-") + "-" + r.file + ".jpg"; }

  // ---------- build tabs ----------
  var counts = { all: REELS.length };
  REELS.forEach(function (r) { counts[r.cat] = (counts[r.cat] || 0) + 1; });

  var tabKeys = ["all"].concat(Object.keys(CATEGORIES));
  tabKeys.forEach(function (key) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "reel-tab";
    b.setAttribute("role", "tab");
    b.dataset.cat = key;
    b.innerHTML = (key === "all" ? "All" : CATEGORIES[key]) + "<sup>" + pad(counts[key] || 0) + "</sup>";
    tabsEl.appendChild(b);
  });

  // ---------- build cards ----------
  var cards = REELS.map(function (r, i) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "reel-card";
    card.dataset.cat = r.cat;
    card.dataset.index = i;
    card.setAttribute("aria-label", "Play reel " + pad(i + 1) + ", " + CATEGORIES[r.cat] + ", " + shortTime(r.dur));
    card.innerHTML =
      '<div class="reel-frame">' +
        '<img src="' + posterOf(r) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="reel-progress"><i></i></span>' +
        '<span class="reel-play">' + PLAY_ICON + "</span>" +
        '<span class="reel-label">' +
          '<span class="reel-no">REEL ' + pad(i + 1) + "</span>" +
          '<span class="reel-sub"><span>' + CATEGORIES[r.cat] + "</span><span>" + shortTime(r.dur) + "</span></span>" +
        "</span>" +
      "</div>";
    track.appendChild(card);
    return card;
  });

  function visibleCards() {
    return cards.filter(function (c) { return !c.hidden; });
  }

  // GSAP animates the frame inside each card, never the card itself,
  // so it can't clash with the card's CSS hover transitions
  function frameOf(c) { return c.querySelector(".reel-frame"); }
  var frames = cards.map(frameOf);

  // ---------- hover preview (muted, loads only on hover) ----------
  function startPreview(card) {
    var r = REELS[card.dataset.index];
    var v = card.querySelector("video");
    if (!v) {
      v = document.createElement("video");
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "auto";
      v.setAttribute("aria-hidden", "true");
      v.src = srcOf(r);
      var bar = card.querySelector(".reel-progress i");
      v.addEventListener("timeupdate", function () {
        if (v.duration) bar.style.transform = "scaleX(" + v.currentTime / v.duration + ")";
      });
      v.addEventListener("playing", function () {
        if (card.matches(":hover")) card.classList.add("is-previewing");
      });
      card.querySelector(".reel-frame").insertBefore(v, card.querySelector(".reel-progress"));
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    if (!v.paused) card.classList.add("is-previewing");
  }

  function stopPreview(card) {
    card.classList.remove("is-previewing");
    var v = card.querySelector("video");
    if (v) v.pause();
  }

  if (canHover) {
    cards.forEach(function (card) {
      card.addEventListener("mouseenter", function () { startPreview(card); });
      card.addEventListener("mouseleave", function () { stopPreview(card); });
    });
  }

  // ---------- category filter ----------
  var currentCat = "all";

  function applyFilter(cat) {
    cards.forEach(function (c) { c.hidden = !(cat === "all" || c.dataset.cat === cat); });
    // if the set is only slightly wider than the screen, start it centred
    var max = track.scrollWidth - track.clientWidth;
    var first = visibleCards()[0];
    track.scrollLeft = first && max > 0 && max < first.offsetWidth ? max / 2 : 0;
    updateScrollUI();
  }

  function selectCat(cat, instant) {
    tabsEl.querySelectorAll(".reel-tab").forEach(function (t) {
      var on = t.dataset.cat === cat;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (cat === currentCat && !instant) return;
    currentCat = cat;
    cards.forEach(stopPreview);

    if (!animate || instant) { applyFilter(cat); return; }

    // quick fade out, swap the set while hidden, then the new reels open out from the centre.
    // Any switch still in progress is stopped first, so rapid clicks can't overlap.
    gsap.killTweensOf([track].concat(frames));
    gsap.to(track, {
      opacity: 0,
      duration: 0.18,
      ease: "power1.in",
      onComplete: function () {
        gsap.set(frames, { clearProps: "transform,opacity,filter" });
        applyFilter(cat);
        gsap.to(track, { opacity: 1, duration: 0.3, ease: "power1.out" });
        gsap.fromTo(visibleCards().map(frameOf),
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.05, from: "center" }, ease: "power3.out", clearProps: "transform,opacity" });
      }
    });
  }

  tabsEl.addEventListener("click", function (e) {
    var t = e.target.closest(".reel-tab");
    if (t) selectCat(t.dataset.cat);
  });

  // ---------- strip scrolling: arrows, drag, ruler ----------
  function maxScroll() { return Math.max(0, track.scrollWidth - track.clientWidth); }

  function updateScrollUI() {
    var max = maxScroll();
    var p = max ? track.scrollLeft / max : 0;
    rulerFill.style.width = p * 100 + "%";
    playhead.style.left = p * 100 + "%";
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= max - 4;
    ruler.style.visibility = max ? "visible" : "hidden";
  }

  track.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);

  function step(dir) {
    var first = visibleCards()[0];
    var w = first ? first.offsetWidth + 22 : 260;
    track.scrollBy({ left: dir * w * 2, behavior: reduceMotion ? "auto" : "smooth" });
  }
  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  // mouse drag to scroll (touch already scrolls natively)
  var drag = null;
  var suppressClick = false;
  track.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      track.classList.add("is-dragging");
    }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", function () {
    if (!drag) return;
    suppressClick = drag.moved;
    drag = null;
    track.classList.remove("is-dragging");
  });

  // ruler scrubbing, like moving the playhead in an editor
  function scrubTo(clientX) {
    var rect = ruler.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    track.scrollLeft = p * maxScroll();
  }
  var scrubbing = false;
  ruler.addEventListener("pointerdown", function (e) {
    scrubbing = true;
    ruler.setPointerCapture(e.pointerId);
    scrubTo(e.clientX);
  });
  ruler.addEventListener("pointermove", function (e) { if (scrubbing) scrubTo(e.clientX); });
  ruler.addEventListener("pointerup", function () { scrubbing = false; });
  ruler.addEventListener("pointercancel", function () { scrubbing = false; });

  // ---------- theater viewer ----------
  var theater = document.getElementById("reel-theater");
  var stage = theater.querySelector(".theater-stage");
  var tVideo = stage.querySelector("video");
  var barTop = theater.querySelector(".theater-bar.top");
  var barBottom = theater.querySelector(".theater-bar.bottom");
  var tTitle = theater.querySelector(".theater-title");
  var tTc = theater.querySelector(".theater-tc");
  var tClose = theater.querySelector(".theater-close");
  var tPrev = theater.querySelector(".theater-nav.prev");
  var tNext = theater.querySelector(".theater-nav.next");
  var playlist = [];
  var pos = 0;
  var lastFocus = null;

  function loadReel(i) {
    pos = (i + playlist.length) % playlist.length;
    var idx = +playlist[pos].dataset.index;
    var r = REELS[idx];
    tVideo.src = srcOf(r);
    tVideo.poster = posterOf(r);
    tTitle.innerHTML = "<em>" + pad(pos + 1) + " / " + pad(playlist.length) + "</em>Reel " + pad(idx + 1) + " · " + CATEGORIES[r.cat];
    showTC(tTc, 0);
    var p = tVideo.play();
    if (p && p.catch) p.catch(function () {});
  }

  tVideo.addEventListener("timeupdate", function () { showTC(tTc, tVideo.currentTime); });

  function openTheater(card) {
    cards.forEach(stopPreview);
    playlist = visibleCards();
    lastFocus = card;
    theater.classList.add("is-open");
    theater.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("theater-lock");
    loadReel(playlist.indexOf(card));
    tClose.focus({ preventScroll: true });

    if (!animate) return;
    // letterbox bars slide in, then the reel grows out of the card it came from
    var from = card.querySelector(".reel-frame").getBoundingClientRect();
    var to = stage.getBoundingClientRect();
    var tl = gsap.timeline();
    tl.fromTo(theater, { backgroundColor: "rgba(0,0,0,0)" }, { backgroundColor: "rgba(0,0,0,0.95)", duration: 0.35 })
      .fromTo(barTop, { yPercent: -100 }, { yPercent: 0, duration: 0.5, ease: "expo.out" }, 0)
      .fromTo(barBottom, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "expo.out" }, 0)
      .fromTo(stage,
        {
          x: from.left + from.width / 2 - (to.left + to.width / 2),
          y: from.top + from.height / 2 - (to.top + to.height / 2),
          scale: from.width / to.width
        },
        { x: 0, y: 0, scale: 1, duration: 0.7, ease: "expo.inOut" }, 0.05)
      .fromTo([tPrev, tNext], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5);
  }

  function closeTheater() {
    if (!theater.classList.contains("is-open")) return;
    function done() {
      tVideo.pause();
      tVideo.removeAttribute("src");
      tVideo.load();
      theater.classList.remove("is-open");
      theater.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("theater-lock");
      gsap && gsap.set && gsap.set([theater, barTop, barBottom, stage, tPrev, tNext], { clearProps: "all" });
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    tVideo.pause();
    if (!animate) { done(); return; }
    gsap.timeline({ onComplete: done })
      .to(stage, { scale: 0.85, opacity: 0, duration: 0.3, ease: "power2.in" })
      .to(barTop, { yPercent: -100, duration: 0.35, ease: "expo.in" }, 0.1)
      .to(barBottom, { yPercent: 100, duration: 0.35, ease: "expo.in" }, 0.1)
      .to(theater, { backgroundColor: "rgba(0,0,0,0)", duration: 0.3 }, 0.15);
  }

  function go(dir) {
    if (!animate) { loadReel(pos + dir); return; }
    // splice transition: the frame closes to a red line and opens on the next reel
    gsap.timeline()
      .to(stage, { clipPath: "inset(0% 50% 0% 50%)", duration: 0.22, ease: "power2.in", onComplete: function () { loadReel(pos + dir); } })
      .to(stage, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "expo.out", clearProps: "clipPath" });
  }

  track.addEventListener("click", function (e) {
    if (suppressClick) { suppressClick = false; return; }
    var card = e.target.closest(".reel-card");
    if (card) openTheater(card);
  });

  tClose.addEventListener("click", closeTheater);
  tPrev.addEventListener("click", function () { go(-1); });
  tNext.addEventListener("click", function () { go(1); });
  theater.addEventListener("click", function (e) { if (e.target === theater) closeTheater(); });

  document.addEventListener("keydown", function (e) {
    if (!theater.classList.contains("is-open")) return;
    if (e.key === "Escape") closeTheater();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "Tab") {
      // keep focus inside the viewer
      var f = [tClose, tPrev, tVideo, tNext];
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // swipe left/right on phones
  var touchX = null;
  stage.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  });

  // ---------- start ----------
  selectCat("all", true);

  // entrance: reels "develop" from film negative as the strip scrolls into view
  if (animate && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(frames, { opacity: 0, y: 40, filter: "invert(1) grayscale(1) contrast(1.4)" });
    ScrollTrigger.create({
      trigger: root,
      start: "top 75%",
      once: true,
      onEnter: function () {
        gsap.to(frames, {
          opacity: 1,
          y: 0,
          filter: "invert(0) grayscale(0) contrast(1)",
          duration: 1.1,
          stagger: { each: 0.07, from: "center" },
          ease: "expo.out",
          clearProps: "transform,opacity,filter"
        });
      }
    });
  }
})();
