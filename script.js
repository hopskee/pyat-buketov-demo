(function () {
  "use strict";
  var TG = "https://t.me/BUKETOV5";
  var PRODUCTS = [
    { id: "autumn-basket", name: "Осенняя корзина", price: 14500, kind: "basket", tag: "Хит", image: "assets/photos/autumn-basket.jpg", text: "Большая корзина: георгины, дельфиниум, кустовые розы, подсолнухи и сухоцветы." },
    { id: "kristina-roses", name: "Облако роз", price: 16900, kind: "bouquet", tag: "Для особого дня", image: "assets/photos/kristina-roses.jpg", text: "Огромный букет из розовых и персиковых кустовых роз — эффект «вау» гарантирован." },
    { id: "berry-box", name: "Зимняя шкатулка", price: 9800, kind: "box", tag: "Новинка", image: "assets/photos/berry-box.jpg", text: "Бархатная коробка с хризантемами, розами, ягодами илекса и хвоей." },
    { id: "dahlia-garden", name: "Сад георгинов", price: 7800, kind: "bouquet", tag: "Хит", image: "assets/photos/dahlia-garden.jpg", text: "Георгины, эустома, гвоздики и зелень — яркий садовый букет." },
    { id: "kristina-coat", name: "Пудровый сад", price: 8500, kind: "bouquet", tag: "", image: "assets/photos/kristina-coat.jpg", text: "Садовые розы, хризантемы и гвоздики в пудрово-малиновой гамме." },
    { id: "kristina-basket", name: "Розовая корзина", price: 12500, kind: "basket", tag: "", image: "assets/photos/kristina-basket.jpg", text: "Корзина с розовыми георгинами, гвоздиками и эрингиумом, с атласной лентой." },
    { id: "coral-bouquet", name: "Коралловый", price: 6500, kind: "bouquet", tag: "", image: "assets/photos/coral-bouquet.jpg", text: "Коралловые садовые розы, лилии и белая эустома в нежной ленте." },
    { id: "dahlia-orange", name: "Солнечные георгины", price: 5400, kind: "bouquet", tag: "", image: "assets/photos/dahlia-orange.jpg", text: "Оранжевые и жёлтые георгины, зелёные шары диантуса и декоративная капуста." },
    { id: "peach-ilex", name: "Персиковый", price: 3900, kind: "bouquet", tag: "", image: "assets/photos/peach-ilex.jpg", text: "Персиковые розы, антуриум и ягоды илекса — тёплый осенний букет." }
  ];
  var FILTERS = { "all": [0, Infinity], "0-4": [0, 3999], "4-7": [4000, 6999], "7-10": [7000, 9999], "10-15": [10000, 14999], "15-99": [15000, Infinity] };
  var KIND = { bouquet: "Букет", basket: "Корзина", box: "Коробка" };
  var money = function (n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0₽"; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var byId = function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); };

  /* ---------- cart storage ---------- */
  var KEY = "pb-cart-v2";
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (i) { return byId(i.id); }); } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function count() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function total() { return cart.reduce(function (s, i) { return s + byId(i.id).price * i.qty; }, 0); }

  function add(id) {
    var it = cart.find(function (i) { return i.id === id; });
    if (it) it.qty++; else cart.push({ id: id, qty: 1 });
    save(); paint();
    $$("[data-cart-count]").forEach(function (b) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
    toast("«" + byId(id).name + "» в корзине", true);
  }
  function setQty(id, d) {
    var it = cart.find(function (i) { return i.id === id; });
    if (!it) return;
    it.qty += d;
    if (it.qty <= 0) cart = cart.filter(function (i) { return i.id !== id; });
    save(); paint();
  }

  /* ---------- cards ---------- */
  function card(p, lazy) {
    return '<article class="card reveal" id="' + p.id + '">' +
      '<button class="card-photo" type="button" data-open="' + p.id + '" aria-label="Подробнее: ' + p.name + '">' +
        '<img src="' + p.image + '" alt="' + p.name + ' — ' + p.text.split(" — ")[0] + '" width="900" height="1200"' + (lazy ? ' loading="lazy"' : "") + '>' +
        (p.tag ? '<span class="card-tag">' + p.tag + "</span>" : "") +
        '<span class="card-more">Подробнее</span>' +
      "</button>" +
      '<div class="card-body">' +
        '<p class="card-kind">' + KIND[p.kind] + "</p>" +
        "<h3>" + p.name + "</h3>" +
        '<div class="card-foot"><span class="card-price">' + money(p.price) + "</span>" +
        '<button class="card-add" type="button" data-add="' + p.id + '" aria-label="В корзину: ' + p.name + '"><svg><use href="#i-bag"/></svg><span>В корзину</span></button></div>' +
      "</div></article>";
  }

  var hits = $("[data-hits]");
  if (hits) {
    hits.innerHTML = ["autumn-basket", "berry-box", "dahlia-garden", "kristina-coat", "coral-bouquet", "dahlia-orange"]
      .map(function (id) { return card(byId(id), true).replace('class="card reveal"', 'class="card"'); }).join("");
  }

  var grid = $("[data-catalog]");
  var state = { filter: "all", kind: "all", sort: "popular" };
  function renderGrid() {
    if (!grid) return;
    var r = FILTERS[state.filter];
    var list = PRODUCTS.filter(function (p) {
      return p.price >= r[0] && p.price <= r[1] && (state.kind === "all" || (state.kind === "bouquet" ? p.kind === "bouquet" : p.kind !== "bouquet"));
    });
    if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    grid.innerHTML = list.map(function (p, i) { return card(p, i > 3); }).join("");
    $("[data-grid-empty]").hidden = list.length > 0;
    var n = list.length, w = n % 10 === 1 && n % 100 !== 11 ? "букет" : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "букета" : "букетов");
    $("[data-count]").textContent = n + " " + w;
    observe(grid);
  }
  $$("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.filter = b.getAttribute("data-filter");
      $$("[data-filter]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      renderGrid();
    });
  });
  $$("[data-kind]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.kind = b.getAttribute("data-kind");
      $$("[data-kind]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      renderGrid();
    });
  });
  var sortSel = $("[data-sort]");
  if (sortSel) sortSel.addEventListener("change", function () { state.sort = sortSel.value; renderGrid(); });

  /* ---------- product modal ---------- */
  var modal = $("#product-modal"), current = null, lastFocus = null;
  function openModal(id) {
    var p = byId(id);
    if (!p) return;
    if (!modal) { location.href = "shop.html#" + id; return; }
    current = p; lastFocus = document.activeElement;
    $("[data-pm-img]").src = p.image; $("[data-pm-img]").alt = p.name;
    $("[data-pm-kind]").textContent = KIND[p.kind];
    $("[data-pm-name]").textContent = p.name;
    $("[data-pm-price]").textContent = money(p.price);
    $("[data-pm-text]").textContent = p.text;
    $("[data-pm-tg]").href = TG + "?text=" + encodeURIComponent("Здравствуйте! Хочу уточнить про букет «" + p.name + "» (" + money(p.price) + ").");
    modal.classList.add("is-on"); modal.setAttribute("aria-hidden", "false");
    setLock();
    $(".modal-x", modal).focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-on"); modal.setAttribute("aria-hidden", "true");
    if (modal.querySelector(".modal-card")) modal.querySelector(".modal-card").style.transform = "";
    setLock();
    if (lastFocus) lastFocus.focus();
  }
  $$("[data-close-modal]").forEach(function (b) { b.addEventListener("click", closeModal); });
  var pmAdd = $("[data-pm-add]");
  if (pmAdd) pmAdd.addEventListener("click", function () { if (current) { add(current.id); closeModal(); } });

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]");
    if (a) { add(a.getAttribute("data-add")); return; }
    var lb = e.target.closest("[data-lightbox]");
    if (lb) { e.preventDefault(); openLightbox(lb.getAttribute("data-lightbox"), lb.getAttribute("data-lightbox-cap") || (lb.querySelector("img") && lb.querySelector("img").alt) || ""); return; }
    var o = e.target.closest("[data-open]");
    if (o) { openModal(o.getAttribute("data-open")); return; }
    var q = e.target.closest("[data-qty]");
    if (q) { setQty(q.getAttribute("data-id"), Number(q.getAttribute("data-qty"))); }
  });

  /* ---------- cart drawer ---------- */
  var drawer = $("#cart"), form = $("#checkout"), thanks = $("[data-thanks]");
  function openCart() {
    drawer.classList.add("is-on"); drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    setLock();
    if (thanks && !thanks.hidden && cart.length) thanks.hidden = true;
    if (toastEl) toastEl.classList.remove("is-on");
    paint();
  }
  function closeCart() {
    drawer.classList.remove("is-on"); drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    setLock();
  }
  $$("[data-open-cart]").forEach(function (b) { b.addEventListener("click", openCart); });
  $$("[data-close-cart]").forEach(function (b) { b.addEventListener("click", closeCart); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (lightbox && lightbox.classList.contains("is-on")) { closeLightbox(); return; }
    if (modal && modal.classList.contains("is-on")) { closeModal(); return; }
    closeCart();
  });

  function paint() {
    var n = count(), sum = total();
    $$("[data-cart-count]").forEach(function (b) { b.textContent = n; b.classList.toggle("is-on", n > 0); });
    $$("[data-cart-sum]").forEach(function (b) { b.textContent = n ? money(sum) : "Корзина"; });
    var list = $("[data-cart-list]");
    if (!list) return;
    var showThanks = thanks && !thanks.hidden;
    $("[data-cart-empty]").hidden = n > 0 || showThanks;
    form.hidden = n === 0 || showThanks;
    list.innerHTML = cart.map(function (i) {
      var p = byId(i.id);
      return '<li class="cart-item"><img src="' + p.image + '" alt="" width="64" height="80">' +
        '<div class="ci-info"><b>' + p.name + "</b><span>" + money(p.price) + "</span></div>" +
        '<div class="qty"><button type="button" data-qty="-1" data-id="' + p.id + '" aria-label="Меньше">−</button><span>' + i.qty +
        '</span><button type="button" data-qty="1" data-id="' + p.id + '" aria-label="Больше">+</button></div></li>';
    }).join("");
    $("[data-cart-total]").textContent = money(sum);
  }

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var v = function (k) { return (fd.get(k) || "").toString().trim(); };
    var lines = cart.map(function (i) { var p = byId(i.id); return "• " + p.name + " × " + i.qty + " — " + money(p.price * i.qty); });
    var msg = "Здравствуйте! Хочу заказать в «Пять Букетов»:\n\n" + lines.join("\n") +
      "\n\nИтого: " + money(total()) + "\nИмя: " + v("name") + "\nКонтакт: " + v("contact") +
      (v("when") ? "\nДоставка: " + v("when") : "") + (v("comment") ? "\nПожелания: " + v("comment") : "");
    var url = TG + "?text=" + encodeURIComponent(msg);
    $("[data-thanks-link]").href = url;
    window.open(url, "_blank", "noopener");
    cart = []; save(); form.reset();
    thanks.hidden = false; paint();
  });

  /* ---------- toast ---------- */
  var toastEl = $("#toast"), tt;
  function toast(t, withCart) {
    if (!toastEl) return;
    toastEl.innerHTML = "<span>" + t + "</span>" + (withCart ? '<button type="button" data-open-cart-toast>Открыть</button>' : "");
    var b = $("[data-open-cart-toast]", toastEl);
    if (b) b.addEventListener("click", openCart);
    toastEl.classList.add("is-on");
    clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }

  /* ---------- header on scroll ---------- */
  var header = $(".header");
  var scrolled = null, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var s = window.scrollY > 10;
      if (s !== scrolled) { scrolled = s; header.classList.toggle("is-scrolled", s); }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- reveal ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function observe(root) {
    $$(".reveal:not(.is-in)", root).forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      if (io) io.observe(el); else el.classList.add("is-in");
    });
  }
  document.documentElement.classList.add("js");
  renderGrid();
  observe(document);

  /* deep link from home: shop.html#id → open product */
  if (modal && location.hash && byId(location.hash.slice(1))) {
    setTimeout(function () { openModal(location.hash.slice(1)); }, 300);
  }

  /* pause hero video when off-screen / reduced motion */
  var vids = $$("video");
  var rm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  vids.forEach(function (v) {
    if (rm) { v.removeAttribute("autoplay"); v.pause(); return; }
    if (!io) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); });
    }).observe(v);
  });

  /* ---------- lightbox ---------- */
  var lightbox = $("#lightbox");
  var lbLast = null;
  function openLightbox(src, cap) {
    if (!lightbox || !src) return;
    if (modal && modal.classList.contains("is-on")) closeModal();
    lbLast = document.activeElement;
    $("[data-lb-img]").src = src;
    $("[data-lb-img]").alt = cap || "";
    var capEl = $("[data-lb-cap]");
    if (capEl) capEl.textContent = cap || "";
    lightbox.classList.add("is-on"); lightbox.setAttribute("aria-hidden", "false");
    setLock();
    var x = $(".lightbox-x", lightbox); if (x) x.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-on"); lightbox.setAttribute("aria-hidden", "true");
    var stage = $(".lightbox-stage"); if (stage) stage.style.transform = "";
    setLock();
    if (lbLast) lbLast.focus();
  }
  $$("[data-close-lightbox]").forEach(function (b) { b.addEventListener("click", closeLightbox); });

  function setLock() {
    var on = !!(
      (modal && modal.classList.contains("is-on")) ||
      (lightbox && lightbox.classList.contains("is-on")) ||
      (drawer && drawer.classList.contains("is-on"))
    );
    document.documentElement.classList.toggle("lock", on);
  }

  function bindSwipeDown(el, closeFn) {
    if (!el || !("ontouchstart" in window)) return;
    var y0 = 0, x0 = 0, dy = 0, active = false, dragging = false;
    el.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; active = true; dragging = false;
    }, { passive: true });
    el.addEventListener("touchmove", function (e) {
      if (!active) return;
      dy = e.touches[0].clientY - y0;
      var dx = e.touches[0].clientX - x0;
      if (!dragging) {
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) { active = false; return; }
        if (dy > 10) dragging = true;
        else if (dy < -10) { active = false; return; }
        else return;
      }
      if (dy < 0) dy = 0;
      el.style.transition = "none";
      el.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    function endSwipe() {
      if (!active && !dragging) return;
      el.style.transition = "";
      if (dy > 80) closeFn();
      el.style.transform = "";
      active = false; dragging = false; dy = 0;
    }
    el.addEventListener("touchend", endSwipe);
    el.addEventListener("touchcancel", endSwipe);
  }
  bindSwipeDown($(".lightbox-stage"), closeLightbox);
  bindSwipeDown($(".modal-card"), closeModal);

  /* ---------- background music ---------- */
  var MUSIC_KEY = "pb-music-on", MUSIC_VOL = 0.35;
  var musicBtn = $("[data-music-btn]");
  var musicWanted = false;
  try { musicWanted = localStorage.getItem(MUSIC_KEY) === "1"; } catch (e) {}
  var music = new Audio("assets/audio/bg.mp3");
  music.loop = true;
  music.preload = musicWanted ? "auto" : "metadata";
  music.volume = 0;
  var fadeId = 0, musicGen = 0;
  function fadeVolume(to, ms, done) {
    cancelAnimationFrame(fadeId);
    var from = music.volume, t0 = performance.now();
    (function step(now) {
      var k = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      var v = from + (to - from) * k;
      music.volume = v < 0 ? 0 : (v > 1 ? 1 : v);
      if (k < 1) fadeId = requestAnimationFrame(step);
      else { music.volume = to; if (done) done(); }
    })(t0);
  }
  function setMusicUi(playing) {
    if (!musicBtn) return;
    musicBtn.classList.toggle("is-playing", !!playing);
    musicBtn.setAttribute("aria-pressed", musicWanted ? "true" : "false");
    musicBtn.setAttribute("aria-label", musicWanted ? "Выключить музыку" : "Включить музыку");
  }
  function startMusic() {
    var gen = ++musicGen;
    var play = music.play();
    function go() { if (gen !== musicGen) return; fadeVolume(MUSIC_VOL, 400); setMusicUi(true); }
    if (play && play.then) play.then(go).catch(function () { if (gen === musicGen) setMusicUi(false); });
    else go();
  }
  function stopMusic() {
    var gen = ++musicGen;
    fadeVolume(0, 280, function () { if (gen === musicGen) music.pause(); });
    setMusicUi(false);
  }
  function saveMusic(on) {
    musicWanted = on;
    try { localStorage.setItem(MUSIC_KEY, on ? "1" : "0"); } catch (e) {}
  }
  if (musicBtn) {
    setMusicUi(false);
    musicBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (musicWanted && !music.paused && music.volume > 0) {
        saveMusic(false); stopMusic();
      } else if (musicWanted && (music.paused || music.ended)) {
        /* pending resume: user turned it off before first gesture */
        saveMusic(false); setMusicUi(false);
      } else {
        saveMusic(true); startMusic();
      }
    });
  }
  if (musicWanted) {
    var resume = function (e) {
      if (!musicWanted) return;
      if (e && e.target && e.target.closest && e.target.closest("[data-music-btn]")) return;
      if (!music.paused) return;
      startMusic();
      document.removeEventListener("pointerdown", resume, true);
      document.removeEventListener("keydown", resume, true);
    };
    document.addEventListener("pointerdown", resume, true);
    document.addEventListener("keydown", resume, true);
  }

  paint();
})();
