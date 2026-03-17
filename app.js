const PRODUCTS = [
  { id: "banana",    nombre: "Banana",    emoji: "🍌", precioKg: 1800, tipo: "fruta" },
  { id: "manzana",   nombre: "Manzana",   emoji: "🍎", precioKg: 2200, tipo: "fruta" },
  { id: "naranja",   nombre: "Naranja",   emoji: "🍊", precioKg: 1950, tipo: "fruta" },
  { id: "pera",      nombre: "Pera",      emoji: "🍐", precioKg: 2400, tipo: "fruta" },
  { id: "tomate",    nombre: "Tomate",    emoji: "🍅", precioKg: 2600, tipo: "verdura" },
  { id: "zanahoria", nombre: "Zanahoria", emoji: "🥕", precioKg: 1400, tipo: "verdura" },
  { id: "cebolla",   nombre: "Cebolla",   emoji: "🧅", precioKg: 1600, tipo: "verdura" },
  { id: "palta",     nombre: "Palta",     emoji: "🥑", precioKg: 3200, tipo: "fruta" },
];

const STORAGE = {
  CART:   "demo_v2_cart",
  TICKET: "demo_v2_ticket",
};

const state = {
  selectedProductId: null,
  cart: [],
};

const el = {
  catalog:                document.querySelector("#catalog"),
  dropzone:               document.querySelector("#scaleDropzone"),
  recognitionBanner:      document.querySelector("#recognitionBanner"),
  bannerText:             document.querySelector("#bannerText"),
  cameraProduct:          document.querySelector("#cameraProduct"),
  scaleProductIcon:       document.querySelector("#scaleProductIcon"),
  weightDisplay:          document.querySelector("#weightDisplay"),
  weightRange:            document.querySelector("#weightRange"),
  weightLabel:            document.querySelector("#weightLabel"),
  addToCartBtn:           document.querySelector("#addToCartBtn"),
  cartList:               document.querySelector("#cartList"),
  totalLabel:             document.querySelector("#totalLabel"),
  finishBtn:              document.querySelector("#finishBtn"),
  clearDemoBtn:           document.querySelector("#clearDemoBtn"),
  clearTicketBtn:         document.querySelector("#clearTicketBtn"),
  ticketPrinter:          document.querySelector("#ticketPrinter"),
  ticketOutput:           document.querySelector("#ticketOutput"),
  generatedTicketSection: document.querySelector("#generatedTicketSection"),
  dropHint:               document.querySelector("#dropHint"),
};

/* ── HELPERS ── */

function money(value) {
  return `$${value.toFixed(2)}`;
}

function getProduct(productId) {
  return PRODUCTS.find((p) => p.id === productId);
}

function saveCart() {
  localStorage.setItem(STORAGE.CART, JSON.stringify(state.cart));
}

/* ── CATALOG ── */

function renderCatalog() {
  el.catalog.innerHTML = "";
  PRODUCTS.forEach((product) => {
    const card = document.createElement("article");
    card.className = "fruit-card";
    card.draggable = true;
    card.dataset.productId = product.id;
    card.innerHTML = `
      <span class="fruit-emoji">${product.emoji}</span>
      <div class="fruit-info">
        <div class="fruit-name">${product.nombre}</div>
        <div class="fruit-price">${money(product.precioKg)} / kg</div>
      </div>
      <span class="fruit-tag">${product.tipo}</span>
    `;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/product-id", product.id);
      e.dataTransfer.effectAllowed = "copy";
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    el.catalog.appendChild(card);
  });
}

/* ── PRODUCT SELECTION ── */

function selectProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  state.selectedProductId = product.id;

  el.recognitionBanner.classList.remove("idle");
  el.recognitionBanner.classList.add("active");
  el.bannerText.textContent = `ES UNA ${product.nombre.toUpperCase()} ${product.emoji}`;

  el.cameraProduct.textContent = product.emoji;
  el.scaleProductIcon.textContent = product.emoji;

  el.dropHint.style.opacity = "0";
  el.addToCartBtn.disabled = false;
}

/* ── SCALE DROPZONE ── */

function setupDropzone() {
  el.dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.dropzone.classList.add("over");
  });
  el.dropzone.addEventListener("dragleave", () => {
    el.dropzone.classList.remove("over");
  });
  el.dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.dropzone.classList.remove("over");
    const productId = e.dataTransfer.getData("text/product-id");
    if (productId) selectProduct(productId);
  });
}

/* ── WEIGHT CONTROL ── */

function setupWeight() {
  const sync = () => {
    const g = Number(el.weightRange.value);
    el.weightLabel.textContent = `${g} g`;
    el.weightDisplay.textContent = `${(g / 1000).toFixed(3)} kg`;
  };
  el.weightRange.addEventListener("input", sync);
  sync();
}

/* ── CART ── */

function renderCart() {
  el.cartList.innerHTML = "";

  if (state.cart.length === 0) {
    const li = document.createElement("li");
    li.className = "cart-empty";
    li.innerHTML = "La lista está vacía.<br>Arrastrá productos a la balanza.";
    el.cartList.appendChild(li);
  } else {
    state.cart.forEach((item) => {
      const product = getProduct(item.productId);
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span class="cart-item-emoji">${product ? product.emoji : "📦"}</span>
        <span class="cart-item-name">${item.nombre}</span>
        <span class="cart-item-weight">${item.peso} g</span>
        <span class="cart-item-price">${money(item.subtotal)}</span>
      `;
      el.cartList.appendChild(li);
    });
  }

  const total = state.cart.reduce((acc, item) => acc + item.subtotal, 0);
  el.totalLabel.textContent = money(total);
}

function addToCart() {
  const product = getProduct(state.selectedProductId);
  if (!product) {
    alert("Arrastrá primero una fruta o verdura a la balanza.");
    return;
  }
  const grams = Number(el.weightRange.value);
  const subtotal = Number(((grams / 1000) * product.precioKg).toFixed(2));

  state.cart.push({
    id: `${product.id}-${Date.now()}`,
    productId: product.id,
    nombre: product.nombre,
    peso: grams,
    precioKg: product.precioKg,
    subtotal,
  });

  saveCart();
  renderCart();

  /* reset balanza para el proximo producto */
  el.recognitionBanner.classList.remove("active");
  el.recognitionBanner.classList.add("idle");
  el.bannerText.textContent = "Esperando producto...";
  el.cameraProduct.textContent = "—";
  el.scaleProductIcon.textContent = "—";
  el.dropHint.style.opacity = "1";
  el.addToCartBtn.disabled = true;
  state.selectedProductId = null;
}

/* ── TICKET ── */

function buildReceiptHTML() {
  const now       = new Date();
  const nroTicket = Math.floor(100000 + Math.random() * 900000);
  const total     = state.cart.reduce((acc, item) => acc + item.subtotal, 0);

  const rows = state.cart
    .map((item) => {
      const p  = getProduct(item.productId);
      const kg = (item.peso / 1000).toFixed(3);
      return `
        <tr>
          <td>${p ? p.emoji : "📦"} ${item.nombre}</td>
          <td>${kg} kg</td>
          <td>${money(item.precioKg)}/kg</td>
          <td>${money(item.subtotal)}</td>
        </tr>
      `;
    })
    .join("");

  const barcode = "▌▐▌▌▐▌▐▐▌▌▐▌▌▐▐▌▐▌▌▐▌";

  return `
    <div class="ticket-receipt">
      <div class="receipt-store">
        <h3>SUPERMERCADO DEMO</h3>
        <p>Sistema de Pesaje Inteligente</p>
        <div class="receipt-meta">
          <span>Ticket N° ${nroTicket}</span>
          <span>${now.toLocaleString("es-AR")}</span>
          <span>Caja N° 1 · Operador: Demo</span>
        </div>
      </div>
      <hr class="receipt-divider" />
      <div class="receipt-items">
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>P/kg</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <hr class="receipt-divider" />
      <div class="receipt-total-row">
        <span>TOTAL</span>
        <span>${money(total)}</span>
      </div>
      <div class="receipt-barcode">${barcode}</div>
      <div class="receipt-footer">
        <p>¡Gracias por su compra!</p>
        <p>Sistema de Pesaje Inteligente · Demo</p>
        <p>www.supermercado-demo.ar</p>
      </div>
    </div>
  `;
}

function finishPurchase() {
  if (state.cart.length === 0) {
    alert("No hay productos en la lista.");
    return;
  }

  const html = buildReceiptHTML();
  el.ticketOutput.innerHTML = html;
  localStorage.setItem(STORAGE.TICKET, html);

  /* animación ticketera */
  el.ticketPrinter.classList.add("printing");
  setTimeout(() => el.ticketPrinter.classList.remove("printing"), 1100);

  /* scroll al ticket con delay para que se vea el efecto primero */
  setTimeout(() => {
    el.generatedTicketSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 450);

  state.cart = [];
  saveCart();
  renderCart();
}

/* ── CLEAR DEMO ── */

function clearDemo() {
  state.cart               = [];
  state.selectedProductId  = null;
  localStorage.removeItem(STORAGE.CART);
  localStorage.removeItem(STORAGE.TICKET);

  el.recognitionBanner.classList.remove("active");
  el.recognitionBanner.classList.add("idle");
  el.bannerText.textContent     = "Esperando producto...";
  el.cameraProduct.textContent  = "—";
  el.scaleProductIcon.textContent = "—";
  el.dropHint.style.opacity     = "1";
  el.addToCartBtn.disabled      = true;
  el.ticketOutput.innerHTML     = `<p class="ticket-empty">Aún no se emitió ningún ticket.</p>`;
  renderCart();
}

/* ── LOAD STATE ── */

function loadState() {
  try {
    const cartRaw   = localStorage.getItem(STORAGE.CART);
    const ticketRaw = localStorage.getItem(STORAGE.TICKET);
    state.cart = cartRaw ? JSON.parse(cartRaw) : [];
    if (ticketRaw) el.ticketOutput.innerHTML = ticketRaw;
  } catch {
    state.cart = [];
  }
}

/* ── EVENTS ── */

function clearTicket() {
  localStorage.removeItem(STORAGE.TICKET);
  el.ticketOutput.innerHTML = `<p class="ticket-empty">Aún no se emitió ningún ticket.</p>`;
}

function setupEvents() {
  el.addToCartBtn.addEventListener("click", addToCart);
  el.finishBtn.addEventListener("click", finishPurchase);
  el.clearDemoBtn.addEventListener("click", clearDemo);
  el.clearTicketBtn.addEventListener("click", clearTicket);
}

/* ── INIT ── */

function init() {
  renderCatalog();
  setupDropzone();
  setupWeight();
  loadState();
  renderCart();
  setupEvents();
}

init();
