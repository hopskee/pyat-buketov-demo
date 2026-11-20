(function () {
  "use strict";
  var PRODUCTS = window.TS_PRODUCTS || [];
  var KEY = "tihiy-sad-concept-v3";
  var KIND = { bouquet: "Букет", composition: "Композиция", mono: "Монобукет" };
  var DIM = {
    peony: [689, 686], rose: [576, 522], ranunculus: [620, 575], foliage: [572, 887],
    "peony-bud": [560, 575], "rose-bud": [446, 554], anemone: [701, 681], lisianthus: [685, 678],
    "ranunculus-coral": [612, 579], "sweet-pea": [602, 637], ruscus: [521, 781], olive: [517, 908]
  };
  var cart = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0₽";
  }
  function cut(name, alt, eager) {
    var d = DIM[name];
    return '<img class="cut" src="assets/flowers/' + name + '.png" alt="' + esc(alt || "") + '" width="' + d[0] + '" height="' + d[1] + '"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  function visual(product, eager) {
    if (product.image === "still") {
      return '<div class="still" aria-hidden="true">' +
        '<img class="leaf" src="assets/flowers/foliage.png" alt="" width="572" height="887">' +
        '<img class="ranun" src="assets/flowers/ranunculus.png" alt="" width="620" height="575">' +
        '<img class="peony" src="assets/flowers/peony.png" alt="" width="689" height="686">' +
        '<img class="rose" src="assets/flowers/rose.png" alt="" width="576" height="522">' +
      "</div>";
    }
    return cut(product.image, product.alt, eager);
  }

  try {
    cart = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (item) {
      return item && byId(item.id) && item.qty > 0;
    }).map(function (item) { return { id: item.id, qty: item.qty }; });
  } catch (err) { cart = []; }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart.map(function (item) {
        return { id: item.id, qty: item.qty };
      })));
    } catch (err) {}
  }
  function count() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function total() {
    return cart.reduce(function (s, i) {
      var p = byId(i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }
  function toast(text) {
    var node = $("#toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { node.classList.remove("is-on"); }, 2200);
  }

  var drawer, shade, lastFocus;
  function mountDrawer() {
    if ($("#cart")) return;
    shade = document.createElement("div");
    shade.className = "shade";
    shade.hidden = true;
    shade.setAttribute("data-close-cart", "");
    drawer = document.createElement("aside");
    drawer.id = "cart";
    drawer.className = "drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-labelledby", "cart-title");
    drawer.inert = true;
    drawer.innerHTML =
      '<div class="drawer-head"><h2 id="cart-title">Корзина</h2><button class="icon-btn" type="button" data-close-cart>Закрыть</button></div>' +
      '<div class="drawer-body">' +
        '<div class="cart-empty" data-cart-empty><p>Корзина пуста.</p><a class="btn" href="catalog.html">Открыть каталог</a></div>' +
        '<ul class="cart-list" data-cart-list></ul>' +
        '<form class="checkout" id="checkout" hidden>' +
          '<p class="demo-banner">Демонстрация, заказ не отправляется.</p>' +
          '<div class="cart-total"><span>Итого</span><strong data-cart-total>0</strong></div>' +
          '<p class="fine">Имя и телефон не спрашиваем. Заметка не сохраняется.</p>' +
          '<label class="field"><span>Заметка к букету</span><textarea name="note" rows="3" maxlength="280"></textarea></label>' +
          '<button class="btn btn-wide" type="submit">Завершить демонстрацию</button>' +
          '<p class="form-status" data-checkout-status role="status" hidden></p>' +
        "</form></div>";
    document.body.appendChild(shade);
    document.body.appendChild(drawer);
  }
  function paint() {
    var n = count();
    $all("[data-cart-count]").forEach(function (node) { node.textContent = String(n); });
    $all("[data-cart-label]").forEach(function (node) {
      node.setAttribute("aria-label", n ? "Корзина, " + n : "Корзина, пока пусто");
    });
    if (!drawer) return;
    var list = $("[data-cart-list]", drawer);
    $("[data-cart-empty]", drawer).hidden = n > 0;
    $("#checkout", drawer).hidden = n === 0;
    list.innerHTML = cart.map(function (item) {
      var p = byId(item.id);
      var thumb = p.image === "still" ? cut("peony", "", false) : cut(p.image, "", false);
      return '<li class="cart-item"><div class="thumb">' + thumb + "</div>" +
        '<div class="ci-info"><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a><span>" + money(p.price) + " · демо</span>" +
        '<button type="button" class="text-btn" data-remove="' + p.id + '">Убрать</button></div>' +
        '<div class="qty"><button type="button" data-qty="-1" data-id="' + p.id + '" aria-label="Меньше: ' + esc(p.name) + '">−</button><span>' + item.qty +
        '</span><button type="button" data-qty="1" data-id="' + p.id + '" aria-label="Больше: ' + esc(p.name) + '">+</button></div></li>';
    }).join("");
    var totalNode = $("[data-cart-total]", drawer);
    if (totalNode) totalNode.textContent = money(total());
    if (n === 0) {
      var status = $("[data-checkout-status]", drawer);
      if (status) status.hidden = true;
    }
  }
  function add(id, qty) {
    var p = byId(id);
    if (!p) return;
    qty = Math.max(1, Math.min(12, qty || 1));
    var item = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) item = cart[i];
    if (item) item.qty = Math.min(24, item.qty + qty);
    else cart.push({ id: id, qty: qty });
    save();
    paint();
    toast("«" + p.name + "» в корзине");
  }
  function change(id, delta) {
    var item = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) item = cart[i];
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(function (row) { return row.id !== id; });
    save();
    paint();
  }
  function openCart() {
    lastFocus = document.activeElement;
    drawer.classList.add("is-on");
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;
    shade.hidden = false;
    document.body.classList.add("lock");
    var closeBtn = $("[data-close-cart]", drawer);
    if (closeBtn) closeBtn.focus();
  }
  function closeCart() {
    if (!drawer.classList.contains("is-on")) return;
    drawer.classList.remove("is-on");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    shade.hidden = true;
    document.body.classList.remove("lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function card(product) {
    return '<article class="card"><a class="card-photo" href="product.html?id=' + product.id + '">' + visual(product, false) + "</a>" +
      '<p class="kind">' + KIND[product.kind] + "</p><h3><a href=\"product.html?id=" + product.id + '">' + esc(product.name) + "</a></h3>" +
      '<div class="card-foot"><span class="price">' + money(product.price) + ' <small>демо</small></span>' +
      '<button class="btn btn-small" type="button" data-add="' + product.id + '">В корзину</button></div></article>';
  }

  function renderCatalog() {
    var grid = $("[data-catalog]");
    if (!grid) return;
    var state = { q: "", kind: "all", sort: "atelier" };
    var params = new URLSearchParams(location.search);
    state.q = params.get("q") || "";
    state.kind = params.get("kind") || "all";
    state.sort = params.get("sort") || "atelier";
    var input = $("#q");
    var sort = $("[data-sort]");
    if (input) input.value = state.q;
    if (sort) sort.value = state.sort;
    function sync() {
      $all("[data-kind]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-kind") === state.kind ? "true" : "false");
      });
    }
    function write() {
      var next = new URLSearchParams();
      if (state.q) next.set("q", state.q);
      if (state.kind !== "all") next.set("kind", state.kind);
      if (state.sort !== "atelier") next.set("sort", state.sort);
      var qs = next.toString();
      history.replaceState(null, "", qs ? "catalog.html?" + qs : "catalog.html");
    }
    function draw() {
      var q = state.q.trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        if (state.kind !== "all" && p.kind !== state.kind) return false;
        if (!q) return true;
        return (p.name + " " + p.text + " " + p.stems.join(" ") + " " + KIND[p.kind]).toLowerCase().indexOf(q) !== -1;
      });
      if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
      if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
      grid.innerHTML = list.map(card).join("");
      $("[data-grid-empty]").hidden = list.length > 0;
      $("[data-count]").textContent = list.length ? list.length + " в подборке" : "Ничего не найдено";
    }
    $all("[data-kind]").forEach(function (b) {
      b.addEventListener("click", function () { state.kind = b.getAttribute("data-kind"); sync(); write(); draw(); });
    });
    if (input) input.addEventListener("input", function () { state.q = input.value; write(); draw(); });
    var form = $("#finder");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); var f = grid.querySelector("a, button"); if (f) f.focus(); });
    if (sort) sort.addEventListener("change", function () { state.sort = sort.value; write(); draw(); });
    var reset = $("[data-reset]");
    if (reset) reset.addEventListener("click", function () {
      state = { q: "", kind: "all", sort: "atelier" };
      if (input) input.value = "";
      if (sort) sort.value = "atelier";
      sync(); write(); draw();
      if (input) input.focus();
    });
    sync();
    draw();
  }

  function renderProduct() {
    var root = $("[data-product]");
    if (!root) return;
    var product = byId(new URLSearchParams(location.search).get("id"));
    if (!product) {
      root.innerHTML = '<div class="missing"><p class="kicker">Нет такой карточки</p><h1>Сбор не найден</h1><p>Вернитесь в каталог. Заказ отсюда всё равно не отправляется.</p><a class="btn" href="catalog.html">В каталог</a></div>';
      document.title = "Сбор не найден — Тихий сад";
      return;
    }
    document.title = product.name + " — Тихий сад";
    var others = PRODUCTS.filter(function (p) { return p.id !== product.id; }).slice(0, 2);
    root.innerHTML =
      '<nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span aria-hidden="true">/</span><a href="catalog.html">Каталог</a><span aria-hidden="true">/</span><span>' + esc(product.name) + "</span></nav>" +
      '<div class="product"><div class="product-photo">' + visual(product, true) + "</div><div>" +
      '<p class="kicker">' + KIND[product.kind] + "</p><h1>" + esc(product.name) + "</h1>" +
      '<p class="product-price">' + money(product.price) + " <small>демонстрационная цена</small></p>" +
      '<p class="lead">' + esc(product.text) + "</p><ul class=\"stems\">" + product.stems.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
      '<div class="buy"><div class="qty"><button type="button" data-step="-1" aria-label="Уменьшить количество">−</button>' +
      '<input data-qty-input="' + product.id + '" type="number" min="1" max="12" value="1" inputmode="numeric" aria-label="Количество">' +
      '<button type="button" data-step="1" aria-label="Увеличить количество">+</button></div>' +
      '<button class="btn" type="button" data-add="' + product.id + '">В корзину</button></div>' +
      '<p class="fine">Демонстрация, заказ не отправляется.</p></div></div>' +
      '<section class="related"><h2>Рядом</h2><div class="related-row">' + others.map(card).join("") + "</div></section>";
    root.addEventListener("click", function (event) {
      var step = event.target.closest("[data-step]");
      if (!step) return;
      var input = $("[data-qty-input]", root);
      input.value = String(Math.max(1, Math.min(12, Number(input.value) + Number(step.getAttribute("data-step")))));
    });
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-open-cart]")) { openCart(); return; }
    if (event.target.closest("[data-close-cart]")) { closeCart(); return; }
    var addBtn = event.target.closest("[data-add]");
    if (addBtn) {
      var input = document.querySelector("[data-qty-input='" + addBtn.getAttribute("data-add") + "']");
      add(addBtn.getAttribute("data-add"), input ? Number(input.value) : 1);
      return;
    }
    var qtyBtn = event.target.closest("[data-qty]");
    if (qtyBtn) change(qtyBtn.getAttribute("data-id"), Number(qtyBtn.getAttribute("data-qty")));
    var removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      cart = cart.filter(function (row) { return row.id !== removeBtn.getAttribute("data-remove"); });
      save();
      paint();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeCart();
    if (event.key !== "Tab" || !drawer || !drawer.classList.contains("is-on")) return;
    var nodes = $all("a, button, textarea, input", drawer).filter(function (node) {
      return !node.disabled && !node.closest("[hidden]") && node.getClientRects().length > 0;
    });
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  mountDrawer();
  var form = $("#checkout");
  if (form) form.addEventListener("submit", function (event) {
    event.preventDefault();
    var note = form.querySelector("textarea");
    if (note) note.value = "";
    var status = $("[data-checkout-status]", form);
    status.hidden = false;
    status.textContent = "Демонстрация, заказ не отправляется. Заметка стёрта и никуда не записана.";
  });
  renderCatalog();
  renderProduct();
  paint();
})();
