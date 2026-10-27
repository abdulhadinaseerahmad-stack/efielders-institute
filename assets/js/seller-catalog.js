/* =========================================================
   e-fielders Seller Program: product catalogue
   Data: assets/data/seller-catalog.json (built by tools/build_catalog.py)
   ========================================================= */
(function () {
  "use strict";

  var root = document.getElementById("catalog");
  if (!root) return;

  var BASE = "../assets/";
  var PAGE_SIZE = 24;
  var WHATSAPP = "923194436232";

  var tabsEl = document.getElementById("catMain");
  var chipsEl = document.getElementById("catSub");
  var countEl = document.getElementById("catCount");
  var gridEl = document.getElementById("catGrid");
  var moreBtn = document.getElementById("catMore");

  var products = [], order = {}, list = [], shown = 0;
  var state = { main: "all", sub: "all" };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function count(filter) {
    var n = 0;
    products.forEach(function (p) { if (filter(p)) n++; });
    return n;
  }
  function label(text, n) {
    var frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(text + " "));
    frag.appendChild(el("small", null, String(n)));
    return frag;
  }

  /* ---------- Filters ---------- */
  function renderTabs() {
    tabsEl.innerHTML = "";
    var mains = [["all", "All products", products.length]];
    Object.keys(order).forEach(function (m) {
      mains.push([m, m, count(function (p) { return p.m === m; })]);
    });
    mains.forEach(function (t) {
      var b = el("button", "cat__tab");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", state.main === t[0] ? "true" : "false");
      b.appendChild(label(t[1], t[2]));
      b.addEventListener("click", function () { state.main = t[0]; state.sub = "all"; update(true); });
      tabsEl.appendChild(b);
    });
  }

  function renderChips() {
    chipsEl.innerHTML = "";
    if (state.main === "all") { chipsEl.hidden = true; return; }
    chipsEl.hidden = false;
    var subs = [["all", "All " + state.main, count(function (p) { return p.m === state.main; })]];
    order[state.main].forEach(function (c) {
      var n = count(function (p) { return p.c === c; });
      if (n) subs.push([c, c, n]);
    });
    subs.forEach(function (c) {
      var b = el("button", "cat__chip");
      b.type = "button";
      b.setAttribute("aria-pressed", state.sub === c[0] ? "true" : "false");
      b.appendChild(label(c[1], c[2]));
      b.addEventListener("click", function () { state.sub = c[0]; update(true); });
      chipsEl.appendChild(b);
    });
  }

  // "All products" mixes categories so the first rows show the full range
  function interleave(items) {
    var groups = {}, keys = [];
    items.forEach(function (p) {
      if (!groups[p.c]) { groups[p.c] = []; keys.push(p.c); }
      groups[p.c].push(p);
    });
    var out = [], left = true;
    for (var i = 0; left; i++) {
      left = false;
      keys.forEach(function (k) { if (groups[k][i]) { out.push(groups[k][i]); left = true; } });
    }
    return out;
  }

  function filtered() {
    if (state.main === "all") return interleave(products);
    return products.filter(function (p) {
      return p.m === state.main && (state.sub === "all" || p.c === state.sub);
    });
  }

  /* ---------- Grid ---------- */
  function card(p) {
    var b = el("button", "cat-card");
    b.type = "button";
    b.setAttribute("aria-label", p.n + " (" + p.s + "), view details");
    var imgWrap = el("span", "cat-card__img");
    var img = el("img");
    img.src = BASE + "img/catalog/t/" + p.s + ".webp";
    img.alt = p.n;
    img.width = 480; img.height = 480;
    img.loading = "lazy"; img.decoding = "async";
    imgWrap.appendChild(img);
    var body = el("span", "cat-card__body");
    body.appendChild(el("span", "cat-card__cat", p.c));
    body.appendChild(el("span", "cat-card__name", p.n));
    body.appendChild(el("span", "cat-card__sku", p.s));
    b.appendChild(imgWrap);
    b.appendChild(body);
    b.addEventListener("click", function () { openModal(p); });
    return b;
  }

  function renderMore() {
    var frag = document.createDocumentFragment();
    list.slice(shown, shown + PAGE_SIZE).forEach(function (p) { frag.appendChild(card(p)); });
    gridEl.appendChild(frag);
    shown = Math.min(shown + PAGE_SIZE, list.length);
    countEl.textContent = "Showing " + shown + " of " + list.length + " products";
    moreBtn.hidden = shown >= list.length;
  }

  function update(fromClick) {
    renderTabs();
    renderChips();
    list = filtered();
    shown = 0;
    gridEl.innerHTML = "";
    renderMore();
    // keep the filters in view when the list above them shrinks
    if (fromClick && root.getBoundingClientRect().top < 0) {
      if (window.smoothScroll) window.smoothScroll.scrollTo(root, { duration: 0.8 });
      else root.scrollIntoView({ behavior: "smooth" });
    }
  }

  moreBtn.addEventListener("click", renderMore);

  /* ---------- Quick view ---------- */
  var modal = document.getElementById("catModal");
  var mImg = document.getElementById("cqImg");
  var mThumbs = document.getElementById("cqThumbs");
  var mSpecs = document.getElementById("cqSpecs");
  var mWa = document.getElementById("cqWa");
  var lastFocus = null;

  function showImage(p, n) {
    mImg.src = BASE + "img/catalog/l/" + p.s + "-" + n + ".webp";
    mImg.alt = p.n + ", photo " + n;
    Array.prototype.forEach.call(mThumbs.children, function (t, i) {
      t.setAttribute("aria-current", i + 1 === n ? "true" : "false");
    });
  }

  function spec(term, value) {
    if (!value) return;
    mSpecs.appendChild(el("dt", null, term));
    mSpecs.appendChild(el("dd", null, value));
  }

  function openModal(p) {
    lastFocus = document.activeElement;
    document.getElementById("cqCat").textContent = p.m + " / " + p.c;
    document.getElementById("cqTitle").textContent = p.n;
    document.getElementById("cqSku").textContent = "SKU: " + p.s;

    mThumbs.innerHTML = "";
    for (var n = 1; n <= p.g && p.g > 1; n++) {
      (function (n) {
        var t = el("button");
        t.type = "button";
        t.setAttribute("aria-label", "Show photo " + n);
        var ti = el("img");
        ti.src = BASE + "img/catalog/l/" + p.s + "-" + n + ".webp";
        ti.alt = "";
        ti.loading = "lazy";
        t.appendChild(ti);
        t.addEventListener("click", function () { showImage(p, n); });
        mThumbs.appendChild(t);
      })(n);
    }
    showImage(p, 1);

    mSpecs.innerHTML = "";
    spec("Material", p.mat);
    spec("Sizes", p.sz);
    (p.d || []).forEach(function (d) { spec(d[0] || "Detail", d[1]); });
    spec("Ready to ship", p.ht);
    spec("Delivery", p.st);

    mWa.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(
      "Assalam o Alaikum, I want to sell this product through the e-fielders Seller Program.\n\n" +
      "SKU: " + p.s + "\nProduct: " + p.n);

    modal.hidden = false;
    if (typeof lockScroll === "function") lockScroll(true);
    else document.body.style.overflow = "hidden";
    modal.querySelector(".cat-modal__box").scrollTop = 0;
    document.getElementById("cqClose").focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    mImg.removeAttribute("src");
    if (typeof lockScroll === "function") lockScroll(false);
    else document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.getElementById("cqClose").addEventListener("click", closeModal);
  // "Join" closes the popup first, then the page glides to the form
  document.getElementById("cqJoin").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  /* ---------- Load data ----------
     Loaded straight away (not on scroll) so the page height is settled before
     visitors use the menu links; a late jump would push #apply out of place. */
  fetch(BASE + "data/seller-catalog.json?v=1")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      products = data.products || [];
      order = data.order || {};
      var total = document.getElementById("catTotal");
      if (total) total.textContent = products.length;
      update(false);
    })
    .catch(function () {
      countEl.textContent = "The catalogue could not load. Please refresh the page or ask us on WhatsApp.";
    });
})();
