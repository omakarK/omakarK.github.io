/**
 * Oak & Whimsy - Core Interactive Application Logic
 * Founders: Swapnil Kulkarni & Bhavya Kulkarni
 * Workshop: Jarag Nagar, Kolhapur, Maharashtra, India
 * Currency: Indian Rupee (₹ INR)
 */

// Cart & Wishlist state
const CART = [];
const savedWishlist = loadPreference('oak-wishlist', []);
const WISHLIST = new Set(Array.isArray(savedWishlist) ? savedWishlist : []);

document.addEventListener('DOMContentLoaded', () => {
  initWoodSpeciesExplorer();
  initCustomizer();
  initCartDrawer();
  initCheckout();
  initAudioToggle();
  updateCartUI();
  updateWishlistBadges();
  initNewsletter();
  initMobileMenu();
  initTraffic();
  loadShop();
});

// Helper for Indian Rupee Currency Formatting
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

/* --- 1. Product Catalog Rendering --- */
function renderProductCatalog(filterCategory = 'all') {
  const container = document.getElementById('products-container');
  if (!container) return;

  const filtered = WOODEN_PRODUCTS.filter(product => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'wishlist') return WISHLIST.has(product.id);
    return product.category === filterCategory;
  });

  window.shopUI.catalog({
    products: filtered,
    wishlist: WISHLIST,
    emptyText: filterCategory === 'wishlist' ? 'Your wishlist is empty.' : 'There are no toys in this collection yet.',
    onWishlist: toggleWishlist,
    onPreview: openQuickView,
    onAdd: addToCart,
    onLayout: window.initCardTilt
  });
}

/* --- 2. Interactive Indian Hardwood Species Explorer --- */
function initWoodSpeciesExplorer() {
  const tabs = document.querySelectorAll('.species-tab');
  const card = document.getElementById('species-card-content');
  if (!tabs.length || !card) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const woodKey = tab.getAttribute('data-wood');
      const data = WOOD_SPECIES_DATA[woodKey];
      if (!data) return;

      if (window.woodAudio) {
        window.woodAudio.playWoodClick(woodKey === 'sheesham' ? 0.75 : woodKey === 'sagwan' ? 1.0 : 1.35);
      }

      card.style.opacity = '0.4';
      setTimeout(() => {
        card.innerHTML = `
          <div class="species-visual" style="background: linear-gradient(135deg, ${data.colorHex}, #231206);">
            <div class="wood-texture-overlay"></div>
            <div class="species-visual-content">
              <h3>${data.name}</h3>
              <p>${data.botanical}</p>
            </div>
          </div>

          <div class="species-details">
            <span class="section-badge">${data.ecoRating}</span>
            <h4>${data.name}</h4>
            <p class="species-botanical">Origin: ${data.origin}</p>
            
            <p class="species-quote">"${data.quote}"</p>

            <div class="species-specs-list">
              <div class="spec-box">
                <span>Janka Hardness</span>
                <strong>${data.jankaHardness}</strong>
              </div>
              <div class="spec-box">
                <span>Grain Pattern</span>
                <strong>${data.grainCharacter}</strong>
              </div>
              <div class="spec-box">
                <span>Natural Aroma</span>
                <strong>${data.scent}</strong>
              </div>
              <div class="spec-box">
                <span>Ideal Masterpiece</span>
                <strong>${data.bestFor}</strong>
              </div>
            </div>

            <button class="btn-secondary" onclick="scrollToCatalog('${woodKey}')">
              Explore ${data.name.split(' ')[0]} Toys
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        `;
        card.style.opacity = '1';
      }, 150);
    });
  });
}

function scrollToCatalog(woodType) {
  const catalog = document.getElementById('catalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth' });
    if (window.woodAudio) window.woodAudio.playWoodClick();
  }
}

/* --- 3. Live Wooden Toy Customizer / Engraver Studio --- */
const customizerState = {
  modelId: 'toy-vintage-car',
  price: null,
  woodFinish: 'Natural CP Sagwan (Teak)',
  woodToneCss: 'sepia(0.2) saturate(1.1)',
  engravedName: 'AARAV',
  engravedDate: 'KOLHAPUR • 2026',
  fontClass: 'serif',
  image: 'assets/images/toy-vintage-car.jpg'
};

function renderCustomizerModels() {
  const models = WOODEN_PRODUCTS.filter(product => product.engravable && product.inStock);
  const selector = document.getElementById('customizer-models');
  const selected = models.find(product => product.id === customizerState.modelId) || models[0];
  selector.replaceChildren();
  document.getElementById('btn-add-custom-toy').disabled = !selected;
  if (!selected) {
    selector.textContent = 'No engraving models are currently available.';
    customizerState.price = null;
    updateCustomizerPreview();
    return;
  }
  for (const model of models) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'model-pill';
    button.textContent = model.name;
    button.dataset.model = model.id;
    selector.append(button);
  }
  selectCustomizerModel(selected);
}

function selectCustomizerModel(product) {
  customizerState.modelId = product.id;
  customizerState.price = product.price;
  customizerState.image = product.image;
  for (const button of document.querySelectorAll('.model-pill')) {
    const active = button.dataset.model === product.id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  updateCustomizerPreview();
}

function initCustomizer() {
  const swatches = document.querySelectorAll('.wood-swatch');
  const nameInput = document.getElementById('engrave-name-input');
  const dateInput = document.getElementById('engrave-date-input');
  const fontPills = document.querySelectorAll('.font-pill');
  const addCustomBtn = document.getElementById('btn-add-custom-toy');

  document.getElementById('customizer-models').addEventListener('click', event => {
    const product = WOODEN_PRODUCTS.find(p => p.id === event.target.dataset.model);
    if (!product) return;
    selectCustomizerModel(product);
    window.woodAudio?.playWoodClick(1.1);
  });

  // Finish Swatches
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      customizerState.woodFinish = swatch.getAttribute('data-finish-name');
      const tone = swatch.getAttribute('data-tone');
      customizerState.woodToneCss = tone === 'sheesham' 
        ? 'brightness(0.78) contrast(1.2) sepia(0.55)'
        : tone === 'haldu'
        ? 'sepia(0.3) hue-rotate(-10deg) saturate(1.25)'
        : 'sepia(0.2) saturate(1.1)';

      updateCustomizerPreview();
      if (window.woodAudio) window.woodAudio.playWoodClick(0.9);
    });
  });

  // Name Input typing with sound
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase() || 'YOUR NAME';
      customizerState.engravedName = val;
      const textEl = document.getElementById('custom-engraved-text');
      if (textEl) {
        textEl.textContent = val;
      }
      if (window.woodAudio) window.woodAudio.playCarveSound();
    });
  }

  // Date input
  if (dateInput) {
    dateInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase() || 'KOLHAPUR • 2026';
      customizerState.engravedDate = val;
      const dateEl = document.getElementById('custom-engraved-date');
      if (dateEl) {
        dateEl.textContent = val;
      }
      if (window.woodAudio) window.woodAudio.playCarveSound();
    });
  }

  // Font switch
  fontPills.forEach(pill => {
    pill.addEventListener('click', () => {
      fontPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const font = pill.getAttribute('data-font');
      customizerState.fontClass = font;
      const textEl = document.getElementById('custom-engraved-text');
      if (textEl) {
        textEl.style.fontFamily = font === 'script' ? "'Homemade Apple', cursive" : "'Fraunces', serif";
      }
      if (window.woodAudio) window.woodAudio.playWoodClick();
    });
  });

  // Add custom toy to cart
  if (addCustomBtn) {
    addCustomBtn.addEventListener('click', () => {
      const product = WOODEN_PRODUCTS.find(item => item.id === customizerState.modelId);
      if (!product) return;
      if (!nameInput.value.trim()) return showToast('Enter a name to engrave.');
      if (CART.length >= 40) return showToast('Your basket has reached 40 lines.');
      const personalization = {
        name: customizerState.engravedName.slice(0, 16),
        date: dateInput.value.trim() ? customizerState.engravedDate.slice(0, 18) : '',
        finish: customizerState.woodFinish,
        font: customizerState.fontClass
      };
      const quantity = CART.filter(item => item.kind === 'product' && item.productId === product.id)
        .reduce((sum, item) => sum + item.qty, 0);
      if (quantity >= product.inStock) return showToast('The available quantity is already in your basket.');
      CART.push(cartEntry(product, 1, personalization, `custom-${crypto.randomUUID()}`));
      updateCartUI();
      openCartDrawer();
      if (window.woodAudio) window.woodAudio.playSuccessChime();
      showToast(`Personalized "${customizerState.engravedName}" toy added to Kolhapur workshop basket!`);
    });
  }
}

function updateCustomizerPreview() {
  const imgEl = document.getElementById('customizer-toy-image');
  const priceEl = document.getElementById('customizer-live-price');
  const textEl = document.getElementById('custom-engraved-text');

  if (imgEl) {
    imgEl.src = customizerState.image;
    imgEl.style.filter = customizerState.woodToneCss;
    // Trigger shimmer flash animation on finish change
    if (typeof window.triggerCustomizerShimmer === 'function') {
      window.triggerCustomizerShimmer(imgEl);
    }
  }
  if (priceEl) {
    priceEl.textContent = customizerState.price == null ? '—' : formatINR(customizerState.price);
  }
  if (textEl) {
    textEl.textContent = customizerState.engravedName;
  }
}

/* --- 4. Shopping Cart Drawer Logic --- */
function initCartDrawer() {
  const cartTrigger = document.getElementById('cart-drawer-trigger');
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const closeBtn = document.getElementById('cart-drawer-close');

  if (cartTrigger) {
    cartTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
      if (window.woodAudio) window.woodAudio.playWoodClick();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeCartDrawer();
      if (window.woodAudio) window.woodAudio.playWoodClick();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeCartDrawer();
      }
    });
  }

  document.getElementById('btn-checkout-now').addEventListener('click', openCheckout);
}

function openCartDrawer() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (backdrop) backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

function updateCartUI() {
  persistCart();
  const countBadges = document.querySelectorAll('.cart-count-badge');
  const listEl = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal-price');
  const shippingFill = document.getElementById('shipping-progress-fill');
  const shippingText = document.getElementById('shipping-status-text');

  const totalItems = CART.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = CART.reduce((sum, item) => sum + item.price * item.qty, 0);

  countBadges.forEach(b => {
    b.textContent = totalItems;
  });

  if (subtotalEl) {
    subtotalEl.textContent = formatINR(subtotal);
  }

  // Free shipping across India on orders above ₹1,499
  const freeThreshold = SHOP_SHIPPING.freeAt / 100;
  if (shippingFill && shippingText) {
    const free = subtotal >= freeThreshold || SHOP_SHIPPING.charge === 0;
    const pct = free ? 100 : (subtotal / freeThreshold) * 100;
    shippingFill.style.width = `${pct}%`;
    if (free) {
      shippingText.textContent = 'Free Pan-India express delivery unlocked!';
    } else {
      const remaining = freeThreshold - subtotal;
      shippingText.textContent = `Add ${formatINR(remaining)} more for free delivery across India.`;
    }
  }

  document.getElementById('btn-checkout-now').disabled = !CART.length;
  if (listEl) window.shopUI.basket({ items: [...CART], onQuantity: changeQty });
}

function addToCart(productId, event) {
  if (event) event.stopPropagation();
  const prod = WOODEN_PRODUCTS.find(p => p.id === productId);
  if (!prod || !prod.inStock) return;
  const reserved = CART.filter(item => item.kind === 'product' && item.productId === productId)
    .reduce((sum, item) => sum + item.qty, 0);
  if (reserved >= prod.inStock) return showToast('The available quantity is already in your basket.');
  const existing = CART.find(item => item.id === prod.id);
  if (existing) {
    if (existing.qty >= 99) return showToast('The maximum quantity per basket line is 99.');
    existing.qty++;
  } else {
    if (CART.length >= 40) return showToast('Your basket has reached 40 lines.');
    CART.push(cartEntry(prod));
  }

  updateCartUI();
  if (window.woodAudio) window.woodAudio.playSuccessChime();
  showToast(`Added "${prod.name}" to your basket!`);
}

function changeQty(itemId, delta) {
  const itemIndex = CART.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return;

  const item = CART[itemIndex];
  const stock = item.kind === 'offer' ? SHOP_OFFERS : WOODEN_PRODUCTS;
  const limit = Math.min(99, stock.find(product => product.id === item.productId)?.inStock ?? 0);
  if (delta > 0 && item.qty >= limit) return showToast('The available quantity is already in your basket.');
  item.qty += delta;
  if (item.qty <= 0) {
    CART.splice(itemIndex, 1);
  }

  if (window.woodAudio) window.woodAudio.playWoodClick(delta > 0 ? 1.2 : 0.8);
  updateCartUI();
}

/* --- 5. Wishlist --- */
function toggleWishlist(productId, event) {
  if (event) event.stopPropagation();
  if (WISHLIST.has(productId)) {
    WISHLIST.delete(productId);
    showToast('Removed from Heirloom Wishlist.');
  } else {
    WISHLIST.add(productId);
    showToast('Saved to Heirloom Wishlist!');
  }

  if (window.woodAudio) window.woodAudio.playWoodClick(1.4);
  savePreference('oak-wishlist', [...WISHLIST]);
  updateWishlistBadges();
  renderProductCatalog(document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all');
}

function updateWishlistBadges() {
  const badge = document.querySelector('.wishlist-count-badge');
  if (badge) {
    badge.textContent = WISHLIST.size;
  }
}

/* --- 6. Quick View Modal --- */
function openQuickView(productId, event) {
  if (event) event.stopPropagation();
  const prod = WOODEN_PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  if (window.woodAudio) window.woodAudio.playWoodThud();

  const modalContainer = document.getElementById('quickview-modal-content');
  const backdrop = document.getElementById('quickview-modal-backdrop');
  if (!modalContainer || !backdrop) return;

  modalContainer.innerHTML = `
    <button class="modal-close-btn" onclick="closeQuickView()">✕</button>
    <div class="modal-media">
      <img src="${escapeHTML(prod.image)}" alt="${escapeHTML(prod.name)}" onerror="this.onerror=null; this.src=imageFallback">
    </div>
    <div class="modal-details">
      ${prod.badge ? `<span class="section-badge">${escapeHTML(prod.badge)}</span>` : ''}
      <h2 style="font-size: 1.8rem; margin-bottom: 6px;">${escapeHTML(prod.name)}</h2>
      <p style="color: var(--honey-600); font-weight: 600; margin-bottom: 16px;">${escapeHTML(prod.woodType)}</p>
      
      <p style="color: var(--timber-700); line-height: 1.7; margin-bottom: 24px;">${escapeHTML(prod.description)}</p>

      <div style="background: var(--bg-cream); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px;">
        ${[['Dimensions', prod.dimensions], ['Weight', prod.weight], ['Finish', prod.finish], ['Dispatch', prod.leadTime]]
          .filter(([, value]) => value).map(([label, value]) => `<div style="font-size: 0.85rem; margin-bottom: 6px;"><strong>${label}:</strong> ${escapeHTML(value)}</div>`).join('')}
        <div style="font-size: 0.85rem;">${prod.inStock ? `${prod.inStock} in stock` : 'Sold out'}</div>
      </div>

      <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px;">
        <span style="font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--timber-900);">${formatINR(prod.price)}</span>
        ${prod.originalPrice > prod.price ? `<span class="price-original">${formatINR(prod.originalPrice)}</span>` : ''}
      </div>

      <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="addToCart('${prod.id}'); closeQuickView();" ${prod.inStock ? '' : 'disabled'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        ${prod.inStock ? `Add to Basket • ${formatINR(prod.price)}` : 'Sold out'}
      </button>
    </div>
  `;

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const backdrop = document.getElementById('quickview-modal-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

/* --- 7. Audio Controls --- */
function initAudioToggle() {
  const btn = document.getElementById('audio-toggle-btn');
  const pulse = document.querySelector('.audio-pulse');
  const label = document.getElementById('audio-status-label');

  if (!btn) return;

  btn.addEventListener('click', () => {
    if (window.woodAudio) {
      const enabled = window.woodAudio.toggleSound();
      if (pulse) pulse.classList.toggle('muted', !enabled);
      if (label) label.textContent = enabled ? 'Wood Audio: ON' : 'Audio: OFF';
      if (enabled) window.woodAudio.playWoodClick(1.5);
    }
  });
}

/* --- 8. Newsletter & Toast Helper --- */
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const button = form.querySelector('button');
      button.disabled = true;
      try {
        await shopRequest('/api/newsletter', { email: input.value });
        if (window.woodAudio) window.woodAudio.playSuccessChime();
        showToast('You’re on the workshop mailing list.');
        input.value = '';
      } catch (error) {
        showToast(error.message);
      } finally {
        button.disabled = false;
      }
    });
  }
}

function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="toast-icon">✓</span>
    <span>${escapeHTML(message)}</span>
  `;

  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* --- 9. Dynamic Mobile Menu Drawer --- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  const backdrop = document.getElementById('mobile-menu-backdrop');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      openMobileMenu();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeMobileMenu();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeMobileMenu();
      }
    });
  }
}

function openMobileMenu() {
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (window.woodAudio) window.woodAudio.playWoodClick(1.2);
}

function closeMobileMenu() {
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
  if (window.woodAudio) window.woodAudio.playWoodClick(0.9);
}

// Auto-handle dynamic screen resizing smoothly
window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) {
    const backdrop = document.getElementById('mobile-menu-backdrop');
    if (backdrop && backdrop.classList.contains('active')) {
      closeMobileMenu();
    }
  }
  if (window.initCardTilt) {
    window.initCardTilt();
  }
}, { passive: true });
