/* =========================================================
   e-fielders Institute — site script
   ========================================================= */

/* ---------------------------------------------------------
   SITE SETTINGS — sirf yahan changes karein
   ---------------------------------------------------------
   FREE DEMO VIDEO — do tareeqe hain (choose ONE):

   1) Video file (MP4) apni hosting par:
      - Apni video ka naam "etsy-demo-class.mp4" rakhein
      - Hostinger File Manager mein  public_html/assets/video/  folder mein upload karein
      - Bas! Kuch aur change nahi karna.

   2) YouTube video (recommended agar video bari hai):
      - YouTube par video upload karein (Public ya Unlisted)
      - Link misaal: https://www.youtube.com/watch?v=AbCdEf12345
      - "v=" ke baad wala hissa (AbCdEf12345) neeche youtubeId mein likh dein
      - Agar youtubeId likha ho to website YouTube video dikhayegi
   --------------------------------------------------------- */
const SITE_CONFIG = {
  demoVideo: {
    youtubeId: "hAFMbakaUOU",                       // e.g. "AbCdEf12345"  (khali chhorein agar MP4 use kar rahe hain)
    file: "assets/video/etsy-demo-class.mp4",       // MP4 file ka path
    poster: "assets/img/demo-poster.jpg"            // optional: video ki thumbnail image
  },
  whatsappNumber: "923194436232",

  /* ---------------------------------------------------------
     GOOGLE REVIEWS SETTINGS
     - rating / totalReviews: apni Google listing se dekh kar likhein (e.g. 5.0 aur 12)
     - writeReviewUrl: Google Business Profile -> "Ask for reviews" -> link copy karke yahan paste karein
     --------------------------------------------------------- */
  google: {
    placeUrl: "https://www.google.com/maps/place/EFielders+Institute/data=!4m7!3m6!1s0x2304e2712c5c1b37:0xc67f0ca88883a825!8m2!3d32.4058626!4d74.789317!9m1!1b1",
    writeReviewUrl: "",       // e.g. "https://g.page/r/XXXXXXXX/review"
    rating: 4.8,              // e.g. 5.0   (0 = rating nahi dikhegi)
    totalReviews: 16          // e.g. 12    (0 = count nahi dikhega)
  }
};

/* ---------------------------------------------------------
   GOOGLE REVIEWS — apne ASLI Google reviews yahan add karein
   ---------------------------------------------------------
   Har review ke liye ek block { ... }, comma ke saath.
   - name:   reviewer ka naam (jaisa Google par hai)
   - rating: stars (1 se 5)
   - date:   jaisa Google par likha ho, e.g. "2 weeks ago"
   - text:   review ka text (copy-paste)
   - link:   us review ka Google link:
             Google Maps mein review par ⋮ (3 dots) -> "Share review" -> "Copy link"
             (khali chhorein to card aap ki Google listing ke reviews par khulega)

   Misaal (example) — // hata kar apna data likhein:
   { name: "Ali Raza", rating: 5, date: "1 week ago",
     text: "Very practical Etsy course...", link: "https://maps.app.goo.gl/xxxx" },
   --------------------------------------------------------- */
const REVIEWS = [
  {"name": "Zawar Sulehria", "rating": 5, "date": "October 2026", "text": "I am a student of Computer at E Fielder Institute. My experience at this institute has been very good. The teachers are kind, cooperative, and helpful. They explain computer concepts in an easy way and provide a friendly learning environment. I am learning new computer skills that will help me in my future career. I highly recommend E Fielder Institute to students who want to improve their computer skills and build a bright future.", "link": ""},
  {"name": "Rana Kabeer Sulehri", "rating": 5, "date": "October 2026", "text": "I am proud to be a student of E-Fielder Institute. My experience here has been very good. The teachers are highly cooperative, supportive, and professional. They explain everything in a simple and easy way, which makes learning enjoyable and effective. I am learning new skills, improving my computer knowledge, and gaining confidence every day. I highly recommend E-Fielder Institute to everyone who wants to learn new skills and build a better future.", "link": ""},
  {"name": "Hamid Ali", "rating": 5, "date": "September 2026", "text": "I am very happy with my experience at this institute. The teachers are highly professional, cooperative, and supportive. They explain everything clearly and always help students whenever needed. The learning environment is friendly, positive, and comfortable. Overall, it has been a great learning experience for me, and I would definitely recommend this institute to others.", "link": ""}
];

(function () {
  "use strict";

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.getElementById("header");
  var onScroll = function () {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]:not(.btn)') : [];
  var sections = [];
  navLinks.forEach(function (a) {
    var s = document.querySelector(a.getAttribute("href"));
    if (s) sections.push({ link: a, el: s });
  });
  if ("IntersectionObserver" in window && sections.length) {
    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("is-active"); });
          sections.forEach(function (s) { if (s.el === e.target) s.link.classList.add("is-active"); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { activeObs.observe(s.el); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(
    ".section__head, .course, .why, .steps li, .member, .workshops__list li, .faq details, .fact, .demo__player, .demo__side, .form, " +
    ".sp-head--center, .sp-step, .sp-stat, .sp-prod, .sp-card, .sp-price, .sp-final, .gallery__item"
  );
  if ("IntersectionObserver" in window) {
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
      // gentle stagger for items sitting side by side in a grid
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      if (idx > 0) el.style.transitionDelay = (Math.min(idx, 5) * 80) + "ms";
    });
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var t = e.target;
          t.classList.add("is-visible"); obs.unobserve(t);
          // clear the stagger delay afterwards so hover effects stay instant
          setTimeout(function () { t.style.transitionDelay = ""; }, 1500);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Demo video ---------- */
  var player = document.getElementById("demoPlayer");
  var placeholder = document.getElementById("demoPlaceholder");
  var cfg = SITE_CONFIG.demoVideo || {};

  function showMedia(el) {
    player.classList.remove("demo__player--empty");
    if (placeholder) placeholder.remove();
    el.hidden = false;
  }

  if (player) {
    if (cfg.youtubeId) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(cfg.youtubeId) + "?rel=0&modestbranding=1";
      iframe.title = "e-fielders Etsy Mastery free demo class";
      iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.hidden = true;
      player.appendChild(iframe);
      showMedia(iframe);
    } else if (cfg.file) {
      var video = document.createElement("video");
      video.controls = true;
      video.preload = "metadata";
      video.setAttribute("playsinline", "");
      video.setAttribute("controlsList", "nodownload");
      video.hidden = true;
      if (cfg.poster) {
        // only use the poster if the image really exists
        var img = new Image();
        img.onload = function () { video.poster = cfg.poster; };
        img.src = cfg.poster;
      }
      video.addEventListener("loadedmetadata", function () { showMedia(video); });
      video.addEventListener("error", function () {
        // file not uploaded yet: keep the "coming soon" placeholder
        video.remove();
      });
      video.src = cfg.file;
      player.appendChild(video);
    }
  }

  /* ---------- Google reviews ---------- */
  var g = SITE_CONFIG.google || {};
  var placeUrl = g.placeUrl || "https://maps.google.com/?cid=14303164859536353317";

  function starsHTML(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 24 24" class="' + (i <= Math.round(n) ? "on" : "off") + '"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';
    }
    return out;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    return /^https:\/\//i.test(u || "") ? u : placeUrl;
  }

  var allBtn = document.getElementById("gAllReviews");
  var writeBtn = document.getElementById("gWriteReview");
  var summary = document.getElementById("gSummary");
  if (allBtn) allBtn.href = placeUrl;
  if (summary) summary.href = placeUrl;
  if (writeBtn) writeBtn.href = g.writeReviewUrl ? safeUrl(g.writeReviewUrl) : placeUrl;

  var gRatingEl = document.getElementById("gRating");
  var gStarsEl = document.getElementById("gStars");
  var gCountEl = document.getElementById("gCount");
  if (g.rating > 0 && gRatingEl && gStarsEl) {
    gRatingEl.textContent = Number(g.rating).toFixed(1) + " on Google";
    gStarsEl.innerHTML = starsHTML(g.rating);
  }
  if (g.totalReviews > 0 && gCountEl) {
    gCountEl.textContent = "Based on " + g.totalReviews + " review" + (g.totalReviews === 1 ? "" : "s");
  }

  var grid = document.getElementById("reviewsGrid");
  var list = (typeof REVIEWS !== "undefined" && Array.isArray(REVIEWS)) ? REVIEWS : [];
  if (grid) {
    if (!list.length) {
      grid.hidden = true;
    } else {
      grid.innerHTML = list.map(function (r) {
        var initial = esc((r.name || "?").trim().charAt(0).toUpperCase());
        return (
          '<a class="review" href="' + esc(safeUrl(r.link)) + '" target="_blank" rel="noopener" aria-label="Read ' + esc(r.name) + '\'s review on Google">' +
            '<div class="review__top">' +
              '<span class="review__avatar" aria-hidden="true">' + initial + '</span>' +
              '<span class="review__who"><strong>' + esc(r.name) + '</strong><small>' + esc(r.date) + '</small></span>' +
              '<span class="review__g" aria-hidden="true">G</span>' +
            '</div>' +
            '<div class="stars" role="img" aria-label="' + esc(r.rating) + ' out of 5 stars">' + starsHTML(r.rating || 5) + '</div>' +
            '<p class="review__text">' + esc(r.text) + '</p>' +
            '<span class="review__more">Read on Google →</span>' +
          '</a>'
        );
      }).join("");
    }
  }

  /* ---------- Course buttons pre-select the form ---------- */
  var courseSelect = document.getElementById("fCourse");
  document.querySelectorAll("[data-course]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (courseSelect) courseSelect.value = btn.getAttribute("data-course");
    });
  });

  /* ---------- Admission form -> WhatsApp ---------- */
  var form = document.getElementById("admissionForm");
  var errorEl = document.getElementById("formError");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("fName");
      var phoneEl = document.getElementById("fPhone");
      var city = document.getElementById("fCity").value.trim();
      var msg = document.getElementById("fMsg").value.trim();
      var name = nameEl.value.trim();
      var phone = phoneEl.value.trim();
      if (!name || !phone) {
        if (errorEl) errorEl.hidden = false;
        (name ? phoneEl : nameEl).focus();
        return;
      }
      if (errorEl) errorEl.hidden = true;

      var lines = [
        "Assalam o Alaikum, I want admission at e-fielders Institute.",
        "",
        "Name: " + name,
        "Phone: " + phone,
        "Course: " + courseSelect.value
      ];
      if (city) lines.push("City: " + city);
      if (msg) lines.push("Message: " + msg);

      var url = "https://wa.me/" + SITE_CONFIG.whatsappNumber + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }
})();

/* ---------- Gallery lightbox ---------- */
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery__item"));
  var box = document.getElementById("lightbox");
  if (!items.length || !box) return;
  var img = document.getElementById("lightboxImg"), cap = document.getElementById("lightboxCap");
  var idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx];
    img.src = it.getAttribute("data-full");
    img.alt = it.querySelector("img").alt;
    cap.textContent = it.getAttribute("data-caption") || "";
  }
  function open(i) { lastFocus = document.activeElement; show(i); box.hidden = false; document.body.style.overflow = "hidden"; box.querySelector(".lightbox__close").focus(); }
  function close() { box.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  items.forEach(function (it, i) { it.addEventListener("click", function () { open(i); }); });
  box.querySelector(".lightbox__close").addEventListener("click", close);
  box.querySelector(".lightbox__prev").addEventListener("click", function () { show(idx - 1); });
  box.querySelector(".lightbox__next").addEventListener("click", function () { show(idx + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
})();

/* =========================================================
   VIDEO REELS SETTINGS
   Har video ki 3 files assets/video/reels/ aur assets/img/reels/ mein hoti hain:
     video:   poori video (popup mein awaaz ke saath chalti hai)
     preview: 8 second ki chhoti, bina awaaz video (card mein khud chalti hai)
     thumb:   cover photo
   link = original post (TikTok / Instagram / Facebook)
   ========================================================= */
const REELS_AUTOPLAY_SECONDS = 4;
const VIDEOS = [
  { name: "chobara-skills", source: "TikTok", cat: "Admissions", title: "Ab skills Chobara mein hi seekhein", link: "https://www.tiktok.com/@efieldersinstitute/video/7694687103786978612" },
  { name: "ideal-school", source: "Instagram", cat: "Workshop", title: "Digital Skills Workshop at Ideal School", link: "https://www.instagram.com/reel/DdOOjLhKjYg/" },
  { name: "etsy-batch", source: "Facebook", cat: "Etsy Mastery", title: "New Etsy batch announcement", link: "https://www.facebook.com/61593663831745/videos/1549785219807490/" },
  { name: "campus", source: "TikTok", cat: "Campus", title: "e-fielders Institute, Chobara", link: "https://www.tiktok.com/@efieldersinstitute/video/7679779859467373832" },
  { name: "first-etsy-batch", source: "Instagram", cat: "Etsy Mastery", title: "Our first Etsy Mastery batch", link: "https://www.instagram.com/reel/Ddg8VahNOrz/" },
  { name: "about", source: "TikTok", cat: "Intro", title: "About e-fielders Institute", link: "https://www.tiktok.com/@efieldersinstitute/video/7685897997841894677" }
];

(function () {
  var track = document.getElementById("vTrack"), viewport = document.getElementById("vViewport");
  if (!track || !viewport || !VIDEOS.length) return;
  var V = "assets/video/reels/", I = "assets/img/reels/";
  var items = VIDEOS.filter(function (v) { return /^[a-z0-9-]+$/.test(v.name); });
  var n = items.length;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function makeCard(v, clone) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "reel";
    if (clone) { b.setAttribute("aria-hidden", "true"); b.tabIndex = -1; }
    b.setAttribute("aria-label", "Play video: " + (v.title || ""));
    var vid = document.createElement("video");
    vid.className = "reel__video";
    vid.muted = true; vid.defaultMuted = true; vid.loop = true; vid.playsInline = true;
    vid.setAttribute("muted", ""); vid.setAttribute("playsinline", ""); vid.setAttribute("webkit-playsinline", "");
    vid.preload = "none";
    vid.poster = I + v.name + ".jpg";
    vid.setAttribute("data-src", V + v.name + "-preview.mp4");
    var src = document.createElement("span"); src.className = "reel__src"; src.textContent = v.source || "";
    var play = document.createElement("span"); play.className = "reel__play";
    play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';
    var meta = document.createElement("span"); meta.className = "reel__meta";
    var cat = document.createElement("span"); cat.className = "reel__cat"; cat.textContent = v.cat || "";
    var t = document.createElement("span"); t.className = "reel__title"; t.textContent = v.title || "";
    meta.appendChild(cat); meta.appendChild(t);
    b.appendChild(vid); b.appendChild(src); b.appendChild(play); b.appendChild(meta);
    b.addEventListener("click", function () { openModal(v); });
    return b;
  }
  items.forEach(function (v) { track.appendChild(makeCard(v, false)); });
  items.forEach(function (v) { track.appendChild(makeCard(v, true)); });

  // card previews play automatically (muted) while visible
  var vids = Array.prototype.slice.call(track.querySelectorAll(".reel__video"));
  function playVid(vid) {
    if (reduce) return;
    if (!vid.getAttribute("src")) { vid.src = vid.getAttribute("data-src"); }
    var p = vid.play(); if (p && p.catch) p.catch(function () {});
  }
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting && !modalOpen) playVid(en.target); else en.target.pause(); });
    }, { root: viewport, threshold: 0.4 });
    vids.forEach(function (v) { vio.observe(v); });
  } else { vids.forEach(playVid); }

  var index = 0, timer = null, paused = false, modalOpen = false;
  function stepPx() {
    var c = track.children[0]; if (!c) return 0;
    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return c.getBoundingClientRect().width + gap;
  }
  function render(animate) {
    track.style.transition = animate ? "" : "none";
    track.style.transform = "translateX(" + (-index * stepPx()) + "px)";
    if (!animate) { void track.offsetWidth; track.style.transition = ""; }
  }
  function go(dir) {
    if (dir < 0 && index === 0) { index = n; render(false); }
    index += dir;
    render(true);
  }
  track.addEventListener("transitionend", function (e) {
    if (e.target !== track) return;
    if (index >= n) { index -= n; render(false); }
  });
  function start() { stop(); if (!paused && !modalOpen && !reduce) timer = setInterval(function () { go(1); }, REELS_AUTOPLAY_SECONDS * 1000); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  document.getElementById("vNext").addEventListener("click", function () { go(1); start(); });
  document.getElementById("vPrev").addEventListener("click", function () { go(-1); start(); });
  var wrap = viewport.parentNode;
  wrap.addEventListener("mouseenter", function () { paused = true; stop(); });
  wrap.addEventListener("mouseleave", function () { paused = false; start(); });
  var sx = null;
  viewport.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; stop(); }, { passive: true });
  viewport.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    start();
  });
  window.addEventListener("resize", function () { render(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else stop(); }).observe(viewport);
  } else { start(); }

  // full video popup (with sound)
  var modal = document.getElementById("vModal"), frame = document.getElementById("vFrame"), link = document.getElementById("vLink"), lastFocus = null;
  function openModal(v) {
    modalOpen = true; stop(); lastFocus = document.activeElement;
    vids.forEach(function (x) { x.pause(); });
    frame.innerHTML = "";
    var f = document.createElement("video");
    f.src = V + v.name + ".mp4";
    f.poster = I + v.name + ".jpg";
    f.controls = true; f.playsInline = true; f.setAttribute("playsinline", "");
    frame.appendChild(f);
    var p = f.play();
    if (p && p.catch) p.catch(function () { f.muted = true; f.play().catch(function () {}); });
    link.href = v.link || "#";
    link.textContent = "Open on " + (v.source || "social media");
    modal.hidden = false; document.body.style.overflow = "hidden";
    document.getElementById("vClose").focus();
  }
  function closeModal() {
    var f = frame.querySelector("video"); if (f) f.pause();
    modal.hidden = true; frame.innerHTML = ""; document.body.style.overflow = "";
    modalOpen = false; start();
    vids.forEach(function (x) { var r = x.getBoundingClientRect(), vr = viewport.getBoundingClientRect(); if (r.left < vr.right && r.right > vr.left) playVid(x); });
    if (lastFocus) lastFocus.focus();
  }
  document.getElementById("vClose").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
})();

/* ---------- Preloader ---------- */
(function () {
  var pl = document.getElementById("preloader");
  if (!pl) return;
  if (!document.documentElement.classList.contains("pl-on")) { pl.remove(); return; }
  var bar = document.getElementById("plBar"), note = document.getElementById("plNote");
  var mark = pl.querySelector(".pl-mark"), text = document.getElementById("plText");
  var start = Date.now(), MIN = 2700, MAX = 6000, pct = 0, loaded = false, finished = false;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) MIN = 400;
  function set(p) { pct = p; if (bar) bar.style.width = p + "%"; if (note) note.textContent = "Building your future… " + Math.round(p) + "%"; }
  var tick = setInterval(function () {
    var t = Math.min(1, (Date.now() - start) / MIN);
    var target = loaded ? t * 100 : Math.min(90, t * 90);
    if (target > pct) set(target);
    if (loaded && t >= 1) finish();
  }, 40);
  function done() { document.documentElement.classList.remove("pl-on"); pl.remove(); }
  function finish() {
    if (finished) return; finished = true; clearInterval(tick); set(100);
    if (reduce) { pl.classList.add("pl-fade"); setTimeout(done, 520); return; }
    // hide the text, then morph the logo mark up into the header logo
    setTimeout(function () {
      if (text) text.classList.add("pl-hide");
      var headerLogo = document.querySelector(".brand__logo");
      var a = mark.getBoundingClientRect();
      if (headerLogo) {
        var r = headerLogo.getBoundingClientRect();
        // the emblem sits at the left of the horizontal logo, roughly a square of the logo's height
        var targetH = r.height, targetTop = r.top, targetLeft = r.left - r.height * 0.02;
        var scale = targetH / a.height;
        var dx = targetLeft - a.left, dy = targetTop - a.top;
        mark.classList.add("pl-morph");
        requestAnimationFrame(function () {
          mark.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + scale + ")";
          mark.style.opacity = "1";
        });
        // fade the whole overlay away near the end of the morph so the real header shows through
        setTimeout(function () { pl.classList.add("pl-fade"); }, 620);
        setTimeout(done, 1180);
      } else {
        pl.classList.add("pl-fade"); setTimeout(done, 520);
      }
    }, 300);
  }
  if (document.readyState === "complete") loaded = true;
  else window.addEventListener("load", function () { loaded = true; });
  setTimeout(function () { loaded = true; start = Math.min(start, Date.now() - MIN); }, MAX);
})();

/* ---------- Smooth scrolling (Lenis) ---------- */
(function () {
  if (typeof Lenis === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var lenis = new Lenis({
    duration: 1.15,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    wheelMultiplier: 1,
    prevent: function (node) { return !!(node && node.closest && node.closest(".vmodal, .lightbox, .nav.is-open")); }
  });
  window.__lenis = lenis;
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // pause smooth scrolling while the page is locked (preloader, photo lightbox, video popup)
  function sync() {
    var locked = document.body.style.overflow === "hidden" || document.documentElement.classList.contains("pl-on");
    if (locked) lenis.stop(); else lenis.start();
  }
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["style"] });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  sync();

  // smooth in-page anchor links, leaving room for the floating header
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var header = document.getElementById("header");
    var off = header ? header.offsetHeight + 18 : 90;
    var y = target.getBoundingClientRect().top + window.scrollY - off;
    lenis.scrollTo(Math.max(0, y), { duration: 1.3 });
    if (history.replaceState) history.replaceState(null, "", id);
  });
})();
