(function () {
  "use strict";

  var PRODUCTS = window.TS_PRODUCTS || [];
  var FRAMES = window.TS_FRAMES || {};
  var KEY = "tihiy-sad-concept-v1";
  var KIND = { bouquet: "Букет", composition: "Композиция", mono: "Монобукет" };
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
  function imgTag(id, alt, pos, sizes, eager) {
    var h = FRAMES[id] || 720;
    var srcset = [640, 960, 1400].map(function (w) {
      return "assets/images/" + id + "-" + w + ".jpg " + w + "w";
    }).join(", ");
    return '<img src="assets/images/' + id + '-960.jpg" srcset="' + srcset + '" sizes="' + sizes + '" width="960" height="' + h + '" alt="' + esc(alt) + '" style="object-position:' + pos + '"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
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
    } catch (err) { /* демонстрация остаётся на экране, даже если хранилище закрыто */ }
  }
  function count() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }
  function total() {
    return cart.reduce(function (sum, item) {
      var product = byId(item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }
  function toast(text) {
    var node = $("#toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("is-on");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { node.classList.remove("is-on"); }, 2400);
  }

  var drawer = null;
  var shade = null;
  var lastFocus = null;

  function mountDrawer() {
    if ($("#cart")) return;
    shade = document.createElement("div");
    shade.className = "shade";
    shade.hidden = true;
    shade.setAttribute("data-close-cart", "");
    drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.id = "cart";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-labelledby", "cart-title");
    drawer.inert = true;
    drawer.innerHTML =
      '<div class="drawer-head"><h2 id="cart-title">Корзина</h2><button class="icon-btn" type="button" data-close-cart aria-label="Закрыть корзину">Закрыть</button></div>' +
      '<div class="drawer-body">' +
        '<div class="cart-empty" data-cart-empty><p>Корзина пуста. В каталоге восемь демонстрационных сборов.</p><a class="btn" href="catalog.html">Открыть каталог</a></div>' +
        '<ul class="cart-list" data-cart-list></ul>' +
        '<form class="checkout" id="checkout" hidden>' +
          '<p class="demo-banner">Демонстрация, заказ не отправляется.</p>' +
          '<div class="cart-total"><span>Итого</span><strong data-cart-total>0</strong></div>' +
          '<p class="fine">Имя и телефон не спрашиваем. Заметка ниже не сохраняется.</p>' +
          '<label class="field"><span>Заметка к букету</span><textarea name="note" rows="3" maxlength="280"></textarea></label>' +
          '<button class="btn btn-wide" type="submit">Завершить демонстрацию</button>' +
          '<p class="form-status" data-checkout-status role="status" hidden></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(shade);
    document.body.appendChild(drawer);
  }

  function paint() {
    var n = count();
    var sum = total();
    $all("[data-cart-count]").forEach(function (node) {
      node.textContent = String(n);
    });
    $all("[data-cart-label]").forEach(function (node) {
      node.setAttribute("aria-label", n ? "Корзина, " + n + " шт., " + money(sum) : "Корзина, пока пусто");
    });
    if (!drawer) return;
    var list = $("[data-cart-list]", drawer);
    var empty = $("[data-cart-empty]", drawer);
    var form = $("#checkout", drawer);
    var status = $("[data-checkout-status]", drawer);
    empty.hidden = n > 0;
    form.hidden = n === 0;
    list.innerHTML = cart.map(function (item) {
      var product = byId(item.id);
      return '<li class="cart-item">' +
        imgTag(product.image, "", product.pos, "72px", false) +
        '<div class="ci-info"><a href="product.html?id=' + product.id + '">' + esc(product.name) + '</a><span>' + money(product.price) + ' · демо</span></div>' +
        '<div class="qty">' +
          '<button type="button" data-qty="-1" data-id="' + product.id + '" aria-label="Меньше: ' + esc(product.name) + '">−</button>' +
          '<span>' + item.qty + '</span>' +
          '<button type="button" data-qty="1" data-id="' + product.id + '" aria-label="Больше: ' + esc(product.name) + '">+</button>' +
        '</div>' +
        '<button class="text-btn" type="button" data-remove="' + product.id + '">Убрать</button>' +
      '</li>';
    }).join("");
    var totalNode = $("[data-cart-total]", drawer);
    if (totalNode) totalNode.textContent = money(sum);
    if (n === 0 && status) status.hidden = true;
  }

  function add(id, qty) {
    var product = byId(id);
    if (!product) return;
    qty = Math.max(1, Math.min(12, qty || 1));
    var item = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) item = cart[i];
    if (item) item.qty = Math.min(24, item.qty + qty);
    else cart.push({ id: id, qty: qty });
    save();
    paint();
    toast("«" + product.name + "» в корзине");
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
    if (!drawer) return;
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
    if (!drawer || !drawer.classList.contains("is-on")) return;
    drawer.classList.remove("is-on");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    shade.hidden = true;
    document.body.classList.remove("lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function bindCart() {
    document.addEventListener("click", function (event) {
      var opener = event.target.closest("[data-open-cart]");
      if (opener) { openCart(); return; }
      if (event.target.closest("[data-close-cart]")) { closeCart(); return; }
      var addBtn = event.target.closest("[data-add]");
      if (addBtn) {
        var qtyNode = document.querySelector("[data-qty-input='" + addBtn.getAttribute("data-add") + "']");
        var qty = qtyNode ? Number(qtyNode.value) : 1;
        add(addBtn.getAttribute("data-add"), qty);
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
      var nodes = $all("a, button, textarea, input, select", drawer).filter(function (node) {
        return !node.disabled && !node.closest("[hidden]") && node.getClientRects().length > 0;
      });
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    var form = $("#checkout");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.querySelector("textarea");
      if (note) note.value = "";
      var status = $("[data-checkout-status]", form);
      status.hidden = false;
      status.textContent = "Демонстрация, заказ не отправляется. Заметка стёрта и никуда не записана.";
    });
  }

  function card(product, sizes) {
    return '<article class="card">' +
      '<a class="card-photo" href="product.html?id=' + product.id + '">' +
        imgTag(product.image, product.alt, product.pos, sizes, false) +
      '</a>' +
      '<div class="card-body">' +
        '<p class="kind">' + KIND[product.kind] + '</p>' +
        '<h3><a href="product.html?id=' + product.id + '">' + esc(product.name) + '</a></h3>' +
        '<div class="card-foot"><span class="price">' + money(product.price) + ' <small>демо</small></span>' +
        '<button class="btn btn-small" type="button" data-add="' + product.id + '">В корзину</button></div>' +
      '</div></article>';
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

    function syncButtons() {
      $all("[data-kind]").forEach(function (button) {
        var on = button.getAttribute("data-kind") === state.kind;
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    function writeQuery() {
      var next = new URLSearchParams();
      if (state.q) next.set("q", state.q);
      if (state.kind !== "all") next.set("kind", state.kind);
      if (state.sort !== "atelier") next.set("sort", state.sort);
      var qs = next.toString();
      history.replaceState(null, "", qs ? "catalog.html?" + qs : "catalog.html");
    }
    function draw() {
      var query = state.q.trim().toLowerCase();
      var list = PRODUCTS.filter(function (product) {
        if (state.kind !== "all" && product.kind !== state.kind) return false;
        if (!query) return true;
        var hay = (product.name + " " + product.text + " " + product.stems.join(" ") + " " + KIND[product.kind]).toLowerCase();
        return hay.indexOf(query) !== -1;
      });
      if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
      if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
      grid.innerHTML = list.map(function (product) {
        return card(product, "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 30vw");
      }).join("");
      var empty = $("[data-grid-empty]");
      if (empty) empty.hidden = list.length > 0;
      var countNode = $("[data-count]");
      if (countNode) countNode.textContent = list.length ? list.length + " в этой подборке" : "Ничего не найдено";
    }
    $all("[data-kind]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.kind = button.getAttribute("data-kind");
        syncButtons();
        writeQuery();
        draw();
      });
    });
    if (input) input.addEventListener("input", function () {
      state.q = input.value;
      writeQuery();
      draw();
    });
    var form = $("#finder");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      var first = grid.querySelector("a, button");
      if (first) first.focus();
    });
    if (sort) sort.addEventListener("change", function () {
      state.sort = sort.value;
      writeQuery();
      draw();
    });
    var reset = $("[data-reset]");
    if (reset) reset.addEventListener("click", function () {
      state.q = "";
      state.kind = "all";
      state.sort = "atelier";
      if (input) input.value = "";
      if (sort) sort.value = "atelier";
      syncButtons();
      writeQuery();
      draw();
      if (input) input.focus();
    });
    syncButtons();
    draw();
  }

  function renderProduct() {
    var root = $("[data-product]");
    if (!root) return;
    var id = new URLSearchParams(location.search).get("id");
    var product = byId(id);
    if (!product) {
      root.innerHTML = '<div class="missing"><p class="eyebrow">Сбор не найден</p><h1>Такой карточки нет</h1><p>Проверьте ссылку или вернитесь в каталог. Заказ отсюда всё равно не отправляется.</p><a class="btn" href="catalog.html">В каталог</a></div>';
      document.title = "Сбор не найден — Тихий сад";
      return;
    }
    document.title = product.name + " — Тихий сад";
    var others = PRODUCTS.filter(function (item) { return item.id !== product.id; }).slice(0, 2);
    root.innerHTML =
      '<nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span aria-hidden="true">/</span><a href="catalog.html">Каталог</a><span aria-hidden="true">/</span><span>' + esc(product.name) + '</span></nav>' +
      '<div class="product">' +
        '<figure class="product-photo">' + imgTag(product.image, product.alt, product.pos, "(max-width: 800px) 100vw, 58vw", true) + '</figure>' +
        '<div class="product-copy">' +
          '<p class="eyebrow">' + KIND[product.kind] + '</p>' +
          '<h1>' + esc(product.name) + '</h1>' +
          '<p class="product-price">' + money(product.price) + ' <small>демонстрационная цена</small></p>' +
          '<p class="lead">' + esc(product.text) + '</p>' +
          '<ul class="stems">' + product.stems.map(function (stem) { return "<li>" + esc(stem) + "</li>"; }).join("") + '</ul>' +
          '<div class="buy">' +
            '<div class="qty qty-lg" aria-label="Количество">' +
              '<button type="button" data-step="-1" aria-label="Уменьшить количество">−</button>' +
              '<input data-qty-input="' + product.id + '" type="number" min="1" max="12" value="1" inputmode="numeric" aria-label="Количество">' +
              '<button type="button" data-step="1" aria-label="Увеличить количество">+</button>' +
            '</div>' +
            '<button class="btn" type="button" data-add="' + product.id + '">В корзину</button>' +
          '</div>' +
          '<p class="fine">Демонстрация, заказ не отправляется. Количество живёт только в корзине этого браузера.</p>' +
        '</div>' +
      '</div>' +
      '<section class="related"><h2>Рядом в каталоге</h2><div class="related-row">' +
        others.map(function (item) { return card(item, "(max-width: 700px) 100vw, 40vw"); }).join("") +
      '</div></section>';
    root.addEventListener("click", function (event) {
      var step = event.target.closest("[data-step]");
      if (!step) return;
      var input = $("[data-qty-input]", root);
      var next = Number(input.value) + Number(step.getAttribute("data-step"));
      input.value = String(Math.max(1, Math.min(12, next)));
    });
  }

  mountDrawer();
  bindCart();
  renderCatalog();
  renderProduct();
  paint();
})();
