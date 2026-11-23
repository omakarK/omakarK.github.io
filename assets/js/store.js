let WOODEN_PRODUCTS = [];
let SHOP_OFFERS = [];
let SHOP_SHIPPING = { freeAt: 149900, charge: 9900 };
let shopReady = false;

const imageFallback = '/assets/images/hero-wooden-toys.jpg';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function loadPreference(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* The shop still works when browser storage is unavailable. */ }
}

async function shopRequest(path, body) {
  const options = { signal: AbortSignal.timeout(15_000) };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || (response.status === 429
      ? 'Too many requests. Wait a moment and try again.'
      : 'The shop could not complete this request.'));
    error.status = response.status;
    throw error;
  }
  if (!data) throw new Error('The shop returned an incomplete response.');
  return data;
}

function cartEntry(product, quantity = 1, personalization = null, lineId = product.id) {
  return {
    id: lineId, productId: product.id, kind: 'product', qty: quantity, price: product.price,
    name: personalization ? `${product.name} (Personalized)` : product.name,
    image: product.image, woodType: personalization?.finish || product.woodType,
    engraving: personalization ? [personalization.name, personalization.date].filter(Boolean).join(' • ') : null,
    personalization
  };
}

function offerEntry(offer, quantity = 1) {
  return { id: `offer-${offer.id}`, productId: offer.id, kind: 'offer', qty: quantity,
    price: offer.price, name: offer.title, image: offer.image, woodType: 'Combo offer' };
}

function persistCart() {
  if (!shopReady) return;
  savePreference('oak-basket', CART.map(({ productId, kind, qty, personalization }) =>
    ({ productId, kind, qty, personalization })));
}

function restoreCart() {
  const saved = loadPreference('oak-basket', []);
  if (!Array.isArray(saved)) return;
  for (const item of saved.slice(0, 40)) {
    if (!item || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 99) continue;
    if (item.kind === 'offer') {
      const offer = SHOP_OFFERS.find(candidate => candidate.id === item.productId);
      if (offer) CART.push(offerEntry(offer, item.qty));
    } else if (item.kind === 'product') {
      const product = WOODEN_PRODUCTS.find(candidate => candidate.id === item.productId);
      if (!product) continue;
      if (item.personalization) {
        const { name, date, finish, font } = item.personalization;
        if (!product.engravable || ![name, date, finish, font].every(value => typeof value === 'string')) continue;
        CART.push(cartEntry(product, item.qty, { name, date, finish, font }, `custom-${crypto.randomUUID()}`));
      } else CART.push(cartEntry(product, item.qty));
    }
  }
  if (CART.length < saved.length) showToast('Some saved basket items are no longer available.');
}

function showCategory(category) {
  for (const button of document.querySelectorAll('#catalog-filters button')) {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  renderProductCatalog(category);
}

function renderCategories(categories) {
  const filters = document.getElementById('catalog-filters');
  const footer = document.getElementById('footer-categories');
  filters.replaceChildren();
  for (const category of [{ id: 'all', name: 'All toys' }, ...categories, { id: 'wishlist', name: 'Wishlist' }]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-btn';
    button.dataset.filter = category.id;
    button.textContent = category.name;
    button.addEventListener('click', () => {
      window.woodAudio?.playWoodClick(1.2);
      showCategory(category.id);
    });
    filters.append(button);
    if (category.id === 'all' || category.id === 'wishlist') continue;
    const link = document.createElement('a');
    link.href = '#catalog';
    link.textContent = category.name;
    link.addEventListener('click', () => showCategory(category.id));
    const listItem = document.createElement('li');
    listItem.append(link);
    footer.before(listItem);
  }
  footer.hidden = true;
  document.getElementById('wishlist-trigger').onclick = () => {
    showCategory('wishlist');
    document.getElementById('catalog').scrollIntoView();
  };
  showCategory('all');
}

function renderOffers(tab) {
  document.getElementById('offers-title').textContent = tab.title;
  document.getElementById('offers-description').textContent = tab.description;
  window.shopUI.combos({ offers: SHOP_OFFERS, onAdd: addCombo });
}

function addCombo(offer) {
  const entry = offerEntry(offer);
  const existing = CART.find(item => item.id === entry.id);
  if ((existing?.qty || 0) >= Math.min(99, offer.inStock)) {
    return showToast('The available quantity is already in your basket.');
  }
  if (existing) existing.qty++;
  else if (CART.length < 40) CART.push(entry);
  else return showToast('Your basket has reached 40 lines.');
  updateCartUI();
  window.woodAudio?.playSuccessChime();
  showToast(`Added ?${offer.title}? to your basket.`);
}

async function loadShop() {
  try {
    const data = await shopRequest('/api/catalog');
    WOODEN_PRODUCTS = data.products;
    SHOP_OFFERS = data.offers;
    SHOP_SHIPPING = data.shipping;
    const productIds = new Set(WOODEN_PRODUCTS.map(product => product.id));
    for (const id of WISHLIST) {
      if (!productIds.has(id)) WISHLIST.delete(id);
    }
    savePreference('oak-wishlist', [...WISHLIST]);
    updateWishlistBadges();
    shopReady = true;
    restoreCart();
    renderCategories(data.categories);
    renderOffers(data.offersTab);
    renderCustomizerModels();
    updateCartUI();
  } catch {
    window.shopUI.status('products-container', 'The collection could not load.', loadShop);
    window.shopUI.status('offers-list', 'Special offers could not load.');
  }
}

function checkoutItems() {
  return CART.map(item => ({
    id: item.productId, kind: item.kind, quantity: item.qty,
    ...(item.personalization ? { personalization: item.personalization } : {})
  }));
}

const checkout = { items: [], quote: null, requestKey: null };
const showCheckoutStatus = text => { document.getElementById('checkout-status').textContent = text; };

async function reviewCheckout() {
  const form = document.getElementById('checkout-form');
  const button = form.querySelector('button[type="submit"]');
  checkout.quote = null;
  button.disabled = true;
  const quote = await shopRequest('/api/checkout/quote', { items: checkout.items });
  checkout.quote = quote.quote;
  window.shopUI.checkout(quote);
  form.hidden = false;
  button.disabled = false;
}

async function openCheckout() {
  if (!CART.length) return showToast('Your basket is empty.');
  closeCartDrawer();
  const dialog = document.getElementById('checkout-dialog');
  const close = dialog.querySelector('[data-close-dialog]');
  document.getElementById('checkout-form').hidden = true;
  checkout.items = checkoutItems();
  checkout.requestKey = crypto.randomUUID();
  close.disabled = true;
  dialog.showModal();
  trackShopPage('Checkout');
  showCheckoutStatus('Checking prices and availability…');
  try {
    await reviewCheckout();
    showCheckoutStatus('');
  } catch (error) {
    showCheckoutStatus(error.message);
  } finally {
    close.disabled = false;
  }
}

function initCheckout() {
  const dialog = document.getElementById('checkout-dialog');
  const form = document.getElementById('checkout-form');
  const submit = form.querySelector('button[type="submit"]');
  const close = dialog.querySelector('[data-close-dialog]');
  dialog.addEventListener('cancel', event => {
    if (close.disabled) event.preventDefault();
  });
  close.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!checkout.quote || submit.disabled) return;
    submit.disabled = true;
    close.disabled = true;
    showCheckoutStatus('Placing your order…');
    try {
      const result = await shopRequest('/api/checkout/orders', {
        items: checkout.items, quote: checkout.quote, requestKey: checkout.requestKey,
        customer: Object.fromEntries(new FormData(form))
      });
      CART.length = 0;
      updateCartUI();
      form.reset();
      form.hidden = true;
      showCheckoutStatus(`Order ${result.id} was received. Pay ${formatINR(result.total / 100)} on delivery. Save this order number for your records.`);
      window.woodAudio?.playSuccessChime();
      refreshAvailability();
    } catch (error) {
      if (error.status === 409) {
        checkout.requestKey = crypto.randomUUID();
        try {
          await reviewCheckout();
          showCheckoutStatus('The basket was updated. Review the total and place your order again.');
        } catch (refreshError) {
          showCheckoutStatus(refreshError.message);
        }
      } else {
        showCheckoutStatus(error.name === 'TimeoutError' || error instanceof TypeError
          ? 'The connection was interrupted. Try again to check whether your order went through.'
          : error.message);
        submit.disabled = false;
      }
    } finally {
      close.disabled = false;
    }
  });
}

async function refreshAvailability() {
  try {
    const data = await shopRequest('/api/catalog');
    WOODEN_PRODUCTS = data.products;
    SHOP_OFFERS = data.offers;
    renderProductCatalog(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    renderOffers(data.offersTab);
    renderCustomizerModels();
  } catch {
    // The order receipt remains available even if the catalog refresh fails.
  }
}

let trackingQueue = Promise.resolve();
function trackShopPage(page) {
  trackingQueue = trackingQueue.then(async () => {
    if (loadPreference('oak-traffic-disabled', false) || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
    await fetch('/api/traffic', { method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page }) });
  }).catch(() => {});
}

function initTraffic() {
  const dialog = document.getElementById('privacy-dialog');
  const button = document.getElementById('traffic-preference');
  const status = document.getElementById('traffic-preference-status');
  const updatePreference = () => {
    const disabled = loadPreference('oak-traffic-disabled', false);
    button.textContent = disabled ? 'Turn on traffic measurement' : 'Turn off traffic measurement';
    status.textContent = disabled ? 'Traffic measurement is off on this browser.' : '';
  };
  document.getElementById('shop-privacy').addEventListener('click', () => {
    updatePreference();
    dialog.showModal();
  });
  dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
  button.addEventListener('click', () => {
    savePreference('oak-traffic-disabled', !loadPreference('oak-traffic-disabled', false));
    updatePreference();
  });
  trackShopPage('Storefront');
  const labels = { catalog: 'Collections', offers: 'Combo offers', customizer: 'Engraving studio' };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      trackShopPage(labels[entry.target.closest('section').id]);
    }
  });
  for (const id of Object.keys(labels)) observer.observe(document.querySelector(`#${id} .section-header`));
}
