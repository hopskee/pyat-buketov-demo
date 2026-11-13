(function () {
  const PRODUCTS = [
    { id: "nezhnyy", name: "Нежный", price: 3900, image: "assets/bouquet-ranunculus.jpg", text: "Ранункулюсы в мягких розовых тонах", kind: "bouquet" },
    { id: "korobka", name: "Коробка", price: 5400, image: "assets/bouquet-box.jpg", text: "Авторская композиция в коробке", kind: "box" },
    { id: "siren", name: "Сирень", price: 6500, image: "assets/bouquet-lilac.jpg", text: "Розы, эустома и фрезия", kind: "bouquet" },
    { id: "avtorskiy", name: "Авторский", price: 7800, image: "assets/hero-bouquet.jpg", text: "Сборный букет с сезонными цветами и ягодами", kind: "bouquet" },
    { id: "gerbera", name: "Гербера", price: 3200, image: "assets/bouquet-gerbera.jpg", text: "Яркая розовая гербера", kind: "bouquet" },
    { id: "yagodnyy", name: "Ягодный", price: 6900, image: "assets/bouquet-berry.jpg", text: "Розы, ранункулюсы и ягоды в коробке", kind: "box" },
    { id: "alyy", name: "Алый", price: 8500, image: "assets/bouquet-roses.jpg", text: "Пышная композиция из красных роз", kind: "bouquet" },
    { id: "prazdnichnyy", name: "Праздничный", price: 12500, image: "assets/bouquet-berry.jpg", text: "Пышная праздничная композиция в коробке", kind: "box" },
    { id: "premium", name: "Премиум", price: 16900, image: "assets/hero-bouquet.jpg", text: "Большой авторский букет на торжество", kind: "bouquet" }
  ];
  const TG = "https://t.me/BUKETOV5";
  const money = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " р.";

  const FILTERS = {
    "all":  { min: 0, max: Infinity },
    "0-4":  { min: 0, max: 3999 },
    "4-7":  { min: 4000, max: 6999 },
    "7-10": { min: 7000, max: 9999 },
    "10-15":{ min: 10000, max: 14999 },
    "15-20":{ min: 15000, max: 19999 }
  };
  const BOX_IDS = new Set(["korobka", "yagodnyy", "prazdnichnyy"]);

  const grid = document.querySelector("[data-catalog]");
  const defaultLimit = grid ? Number(grid.getAttribute("data-limit") || PRODUCTS.length) : PRODUCTS.length;
  let currentFilter = "all";
  let currentKind = "all";
  let currentSort = "new";

  function productById(id) { return PRODUCTS.find((p) => p.id === id); }

  function cardHTML(p) {
    return `<article class="card" data-id="${p.id}">
      <button class="card-photo js-buy" type="button" data-id="${p.id}" aria-label="Открыть ${p.name}">
        <img src="${p.image}" alt="${p.name}" width="600" height="600">
      </button>
      <div class="card-body">
        <h3>${p.name}</h3>
        <div class="card-price">${money(p.price)}</div>
        <button class="btn btn-cart js-add" type="button" data-id="${p.id}">В корзину</button>
      </div>
    </article>`;
  }

  function filteredProducts() {
    const range = FILTERS[currentFilter] || FILTERS.all;
    const list = PRODUCTS.filter((p) => {
      if (p.price < range.min || p.price > range.max) return false;
      const isBox = p.kind === "box" || BOX_IDS.has(p.id);
      if (currentKind === "box" && !isBox) return false;
      if (currentKind === "bouquet" && isBox) return false;
      return true;
    });
    if (currentSort === "price-asc") return list.slice().sort((a, b) => a.price - b.price);
    if (currentSort === "price-desc") return list.slice().sort((a, b) => b.price - a.price);
    return list;
  }

  function renderCarousel() {
    const el = document.querySelector("[data-carousel]");
    if (!el) return;
    const ids = (el.getAttribute("data-ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const list = (ids.length ? ids.map(productById).filter(Boolean) : PRODUCTS.slice(0, 4));
    el.innerHTML = list.map(cardHTML).join("");
  }

  function scrollCarousel(dir) {
    const el = document.querySelector("[data-carousel]");
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.8));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  function renderGrid() {
    if (!grid) return;
    const list = filteredProducts();
    const useLimit = currentFilter === "all" && currentKind === "all" && defaultLimit < PRODUCTS.length;
    const shown = useLimit ? list.slice(0, defaultLimit) : list;
    grid.innerHTML = shown.map(cardHTML).join("");
    const empty = document.querySelector(".catalog-empty");
    if (empty) empty.classList.toggle("is-on", shown.length === 0);
    const more = document.querySelector(".catalog-more");
    if (more) more.style.display = useLimit && list.length > defaultLimit ? "" : "none";
  }

  function setFilter(id) {
    if (!FILTERS[id]) return;
    currentFilter = id;
    document.querySelectorAll("[data-filter]").forEach((el) => {
      const on = el.getAttribute("data-filter") === id;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderGrid();
  renderCarousel();

  const params = new URLSearchParams(location.search);
  if (params.get("filter")) setFilter(params.get("filter"));
  if (params.get("kind")) setKind(params.get("kind"));
  if (params.get("sort")) currentSort = params.get("sort");
  const sortEl = document.querySelector("[data-sort]");
  if (sortEl) {
    if (currentSort) sortEl.value = currentSort;
    sortEl.addEventListener("change", () => {
      currentSort = sortEl.value;
      renderGrid();
    });
    if (params.get("sort")) renderGrid();
  }

  }

  function setKind(kind) {
    currentKind = kind;
    document.querySelectorAll("[data-kind]").forEach((el) => {
      const on = el.getAttribute("data-kind") === kind;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderGrid();
  renderCarousel();

  const params = new URLSearchParams(location.search);
  if (params.get("filter")) setFilter(params.get("filter"));
  if (params.get("kind")) setKind(params.get("kind"));
  if (params.get("sort")) currentSort = params.get("sort");
  const sortEl = document.querySelector("[data-sort]");
  if (sortEl) {
    if (currentSort) sortEl.value = currentSort;
    sortEl.addEventListener("change", () => {
      currentSort = sortEl.value;
      renderGrid();
    });
    if (params.get("sort")) renderGrid();
  }

  }

  renderGrid();
  renderCarousel();

  const params = new URLSearchParams(location.search);
  if (params.get("filter")) setFilter(params.get("filter"));
  if (params.get("kind")) setKind(params.get("kind"));
  if (params.get("sort")) currentSort = params.get("sort");
  const sortEl = document.querySelector("[data-sort]");
  if (sortEl) {
    if (currentSort) sortEl.value = currentSort;
    sortEl.addEventListener("change", () => {
      currentSort = sortEl.value;
      renderGrid();
    });
    if (params.get("sort")) renderGrid();
  }


  /* Cart */
  const storageKey = "pyat-buketov-cart";
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch { return []; }
  };
  const saveCart = (c) => localStorage.setItem(storageKey, JSON.stringify(c));
  let cart = loadCart();

  const countEl = document.querySelector(".cart-count");
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");
  const popup = document.getElementById("product-popup");
  const drawerBody = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const checkout = document.getElementById("checkout") || document.getElementById("checkout-form");
  const thanks = document.getElementById("thanks");

  function qtyOf() { return cart.reduce((s, i) => s + i.qty, 0); }
  function sumOf() { return cart.reduce((s, i) => s + i.qty * i.price, 0); }

  function paintCount() {
    const n = qtyOf();
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = n;
      el.classList.toggle("is-on", n > 0);
    });
    document.querySelectorAll("[data-cart-sum]").forEach((el) => {
      el.textContent = n ? money(sumOf()) : "";
    });
  }

  function paintCart() {
    paintCount();
    if (!drawerBody) return;
    if (!cart.length) {
      drawerBody.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
    } else {
      drawerBody.innerHTML = cart.map((i) => {
        const p = productById(i.id);
        return `<div class="cart-row">
          <img src="${p ? p.image : ""}" alt="">
          <div>
            <h4>${i.name}</h4>
            <div class="meta">${i.qty} × ${money(i.price)}</div>
            <button class="cart-remove" type="button" data-remove="${i.id}">Удалить</button>
          </div>
          <div>${money(i.qty * i.price)}</div>
        </div>`;
      }).join("");
    }
    if (totalEl) totalEl.textContent = money(sumOf());
  }

  function addToCart(id, qty) {
    const p = productById(id);
    if (!p) return;
    const row = cart.find((i) => i.id === id);
    if (row) row.qty += qty;
    else cart.push({ id: p.id, name: p.name, price: p.price, qty: qty });
    saveCart(cart);
    paintCart();
  }

  function openDrawer() {
    if (checkout) checkout.classList.remove("is-on");
    if (thanks) thanks.classList.remove("is-on");
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    overlay.dataset.mode = "cart";
  }
  function closeAll() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    popup.classList.remove("is-open");
    closeFilters();
    delete overlay.dataset.mode;
  }

  let popupQty = 1;
  let popupId = null;

  function openPopup(id) {
    const p = productById(id);
    if (!p) return;
    popupId = id;
    popupQty = 1;
    popup.querySelector("[data-pp-img]").src = p.image;
    popup.querySelector("[data-pp-img]").alt = p.name;
    popup.querySelector("[data-pp-name]").textContent = p.name;
    popup.querySelector("[data-pp-text]").textContent = p.text;
    popup.querySelector("[data-pp-price]").textContent = money(p.price);
    popup.querySelector("[data-pp-qty]").textContent = "1";
    popup.classList.add("is-open");
    overlay.classList.add("is-open");
    overlay.dataset.mode = "popup";
  }

  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
  }

  const filtersPanel = document.getElementById("filters-panel");
  function openFilters() {
    if (!filtersPanel) return;
    filtersPanel.classList.add("is-open");
    overlay.classList.add("is-open");
    overlay.dataset.mode = "filters";
  }
  function closeFilters() {
    if (filtersPanel) filtersPanel.classList.remove("is-open");
  }

  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (chip) { setFilter(chip.getAttribute("data-filter")); return; }
    const kindBtn = e.target.closest("[data-kind]");
    if (kindBtn) { setKind(kindBtn.getAttribute("data-kind")); return; }
    if (e.target.closest("[data-open-filters]")) { openFilters(); return; }
    if (e.target.closest("[data-close-filters]")) { closeFilters(); overlay.classList.remove("is-open"); delete overlay.dataset.mode; return; }
    if (e.target.closest("[data-reset-filters]")) { setFilter("all"); setKind("all"); return; }
    if (e.target.closest("[data-carousel-prev]")) { scrollCarousel(-1); return; }
    if (e.target.closest("[data-carousel-next]")) { scrollCarousel(1); return; }

    const add = e.target.closest(".js-add");
    if (add) {
      const p = productById(add.dataset.id);
      addToCart(add.dataset.id, 1);
      if (p) toast(p.name + " — в корзине");
      return;
    }
    const buy = e.target.closest(".js-buy");
    if (buy) { openPopup(buy.dataset.id); return; }

    if (e.target.closest("[data-open-cart]")) { paintCart(); openDrawer(); return; }
    if (e.target.closest("[data-close]")) { closeAll(); return; }
    if (e.target === overlay || e.target.id === "product-popup") {
      closeAll();
      return;
    }
    if (e.target.closest("[data-pp-plus]")) {
      popupQty += 1;
      popup.querySelector("[data-pp-qty]").textContent = String(popupQty);
      return;
    }
    if (e.target.closest("[data-pp-minus]")) {
      popupQty = Math.max(1, popupQty - 1);
      popup.querySelector("[data-pp-qty]").textContent = String(popupQty);
      return;
    }
    if (e.target.closest("[data-pp-add]")) {
      const p = productById(popupId);
      addToCart(popupId, popupQty);
      popup.classList.remove("is-open");
      if (p) toast(p.name + " — в корзине");
      openDrawer();
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      cart = cart.filter((i) => i.id !== rm.dataset.remove);
      saveCart(cart);
      paintCart();
      return;
    }
    if (e.target.closest("[data-checkout]")) {
      if (!cart.length) return;
      checkout.classList.add("is-on");
      return;
    }
  });

  const checkoutForm = document.getElementById("checkout-form") || checkout;
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(checkoutForm);
      const name = (fd.get("name") || "").toString().trim();
      const contact = (fd.get("contact") || "").toString().trim();
      const comment = (fd.get("comment") || "").toString().trim();
      const lines = cart.map((i) => `• ${i.name} × ${i.qty} — ${money(i.qty * i.price)}`);
      const text = encodeURIComponent(
        `Здравствуйте! Хочу оформить заказ в «Пять Букетов».\n\n${lines.join("\n")}\n\nИтого: ${money(sumOf())}\nИмя: ${name}\nСвязь: ${contact}${comment ? "\nКомментарий: " + comment : ""}`
      );
      const link = document.getElementById("thanks-link");
      if (link) link.href = `${TG}?text=${text}`;
      checkout.classList.remove("is-on");
      thanks.classList.add("is-on");
      cart = [];
      saveCart(cart);
      paintCart();
    });
  }

  const customForm = document.getElementById("custom-form");
  if (customForm) {
    customForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(customForm);
      const text = encodeURIComponent(
        `Здравствуйте! Хочу заказать букет по описанию.\n\nИмя: ${(fd.get("name") || "").toString().trim()}\nСвязь: ${(fd.get("contact") || "").toString().trim()}\nПожелания: ${(fd.get("wish") || "").toString().trim()}`
      );
      window.open(`${TG}?text=${text}`, "_blank", "noopener");
      customForm.reset();
      const ok = document.getElementById("custom-ok");
      if (ok) { ok.hidden = false; }
    });
  }

  const tog = document.querySelector(".nav-toggle");
  const header = document.querySelector(".header");
  if (tog && header) {
    tog.addEventListener("click", () => header.classList.toggle("is-open"));
  }

  const toTop = document.querySelector(".to-top");
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  paintCart();
})();
