/**
 * Oak & Whimsy - Core Interactive Application Logic
 * Manages products catalog, cart, wishlist, live customizer, and modals.
 */

// Cart & Wishlist state
let CART = [
  {
    id: 'toy-train',
    name: 'Grand Alpine Express Locomotive',
    woodType: 'Hard Rock Maple & Black Cherry',
    price: 94.00,
    qty: 1,
    image: 'assets/images/toy-train.jpg',
    engraving: null
  }
];

let WISHLIST = new Set(['toy-rocking-horse']);

document.addEventListener('DOMContentLoaded', () => {
  renderProductCatalog('all');
  initCatalogFilters();
  initWoodSpeciesExplorer();
  initCustomizer();
  initCartDrawer();
  initAudioToggle();
  updateCartUI();
  updateWishlistBadges();
  initNewsletter();
});

/* --- 1. Product Catalog Rendering --- */
function renderProductCatalog(filterCategory = 'all') {
  const container = document.getElementById('products-container');
  if (!container) return;

  const filtered = filterCategory === 'all' 
    ? WOODEN_PRODUCTS 
    : WOODEN_PRODUCTS.filter(p => p.category === filterCategory);

  container.innerHTML = filtered.map(product => {
    const isWishlisted = WISHLIST.has(product.id);
    return `
      <article class="product-card" data-id="${product.id}">
        <div class="product-media">
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='assets/images/hero-wooden-toys.jpg'">
          
          <div class="card-badges">
            <span class="card-badge gold">${product.badge}</span>
            <span class="card-badge">${product.recommendedAge}</span>
          </div>

          <div class="card-actions-overlay">
            <button class="card-icon-btn wishlist-btn ${isWishlisted ? 'active' : ''}" 
                    aria-label="Add to Wishlist" 
                    onclick="toggleWishlist('${product.id}', event)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#c45b3a' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>

          <div class="quickview-btn-wrap">
            <button class="btn-quickview" onclick="openQuickView('${product.id}', event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Quick Artisan View
            </button>
          </div>
        </div>

        <div class="product-info">
          <div class="product-meta-row">
            <span class="product-wood-tag">${product.woodType}</span>
            <div class="product-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${product.rating.toFixed(1)}</span>
            </div>
          </div>

          <h3 class="product-name">${product.name}</h3>
          <p class="product-sub">${product.subtitle}</p>

          <div class="product-price-row">
            <div class="price-wrap">
              <span class="price-current">$${product.price.toFixed(2)}</span>
              <span class="price-original">$${product.originalPrice.toFixed(2)}</span>
            </div>
            <button class="btn-add-cart" onclick="addToCart('${product.id}', event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Add to Basket
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  if (window.initCardTilt) {
    window.initCardTilt();
  }
}

function initCatalogFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-filter');
      
      if (window.woodAudio) {
        window.woodAudio.playWoodClick(1.2);
      }

      const container = document.getElementById('products-container');
      container.style.opacity = '0.3';
      container.style.transform = 'translateY(10px)';

      setTimeout(() => {
        renderProductCatalog(category);
        container.style.transition = 'all 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 150);
    });
  });
}

/* --- 2. Interactive Wood Species Explorer --- */
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
        window.woodAudio.playWoodClick(woodKey === 'walnut' ? 0.75 : woodKey === 'oak' ? 1.0 : 1.35);
      }

      card.style.opacity = '0.4';
      setTimeout(() => {
        card.innerHTML = `
          <div class="species-visual" style="background: linear-gradient(135deg, ${data.colorHex}, #2a1608);">
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

/* --- 3. Live Wooden Toy Customizer / Engraver --- */
let customizerState = {
  modelId: 'toy-vintage-car',
  modelName: '1932 Classic Roadster Speedster',
  price: 76.00,
  woodFinish: 'Golden Honey Beech',
  woodToneCss: 'sepia(0.2) saturate(1.1)',
  engravedName: 'OLIVER',
  engravedDate: 'EST. 2026',
  fontClass: 'font-fraunces',
  image: 'assets/images/toy-vintage-car.jpg'
};

function initCustomizer() {
  const modelPills = document.querySelectorAll('.model-pill');
  const swatches = document.querySelectorAll('.wood-swatch');
  const nameInput = document.getElementById('engrave-name-input');
  const dateInput = document.getElementById('engrave-date-input');
  const fontPills = document.querySelectorAll('.font-pill');
  const addCustomBtn = document.getElementById('btn-add-custom-toy');

  // Model switch
  modelPills.forEach(pill => {
    pill.addEventListener('click', () => {
      modelPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const modelId = pill.getAttribute('data-model');
      const prod = WOODEN_PRODUCTS.find(p => p.id === modelId);
      if (prod) {
        customizerState.modelId = prod.id;
        customizerState.modelName = prod.name;
        customizerState.price = prod.price;
        customizerState.image = prod.image;
        updateCustomizerPreview();
      }
      if (window.woodAudio) window.woodAudio.playWoodClick(1.1);
    });
  });

  // Finish Swatches
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      customizerState.woodFinish = swatch.getAttribute('data-finish-name');
      const tone = swatch.getAttribute('data-tone');
      customizerState.woodToneCss = tone === 'walnut' 
        ? 'brightness(0.8) contrast(1.15) sepia(0.5)'
        : tone === 'cherry'
        ? 'sepia(0.35) hue-rotate(-15deg) saturate(1.2)'
        : 'sepia(0.15) saturate(1.1)';

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
      const val = e.target.value.trim().toUpperCase() || 'EST. 2026';
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
      const customItem = {
        id: 'custom-' + Date.now(),
        name: `${customizerState.modelName} (Personalized)`,
        woodType: customizerState.woodFinish,
        price: customizerState.price,
        qty: 1,
        image: customizerState.image,
        engraving: `${customizerState.engravedName} • ${customizerState.engravedDate}`
      };

      CART.push(customItem);
      updateCartUI();
      openCartDrawer();
      if (window.woodAudio) window.woodAudio.playSuccessChime();
      showToast(`Personalized "${customizerState.engravedName}" wood toy added to cart!`);
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
  }
  if (priceEl) {
    priceEl.textContent = `$${customizerState.price.toFixed(2)}`;
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

  const checkoutBtn = document.getElementById('btn-checkout-now');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (CART.length === 0) {
        showToast('Your basket is currently empty.');
        return;
      }
      if (window.woodAudio) window.woodAudio.playSuccessChime();
      showToast('Preparing your artisanal woodcraft package! Thank you.');
      setTimeout(() => {
        closeCartDrawer();
      }, 1800);
    });
  }
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
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  }

  // Free shipping at $150
  const freeThreshold = 150.0;
  if (shippingFill && shippingText) {
    const pct = Math.min((subtotal / freeThreshold) * 100, 100);
    shippingFill.style.width = `${pct}%`;
    if (subtotal >= freeThreshold) {
      shippingText.innerHTML = '🌿 <strong>Free Carbon-Neutral Shipping Unlocked!</strong>';
    } else {
      const remaining = (freeThreshold - subtotal).toFixed(2);
      shippingText.innerHTML = `Add <strong>$${remaining}</strong> more for Free Worldwide Heirloom Shipping!`;
    }
  }

  if (!listEl) return;

  if (CART.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--timber-500);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; display: block; opacity: 0.5;">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h4 style="font-size: 1.15rem; color: var(--timber-800); margin-bottom: 6px;">Your Basket is Empty</h4>
        <p style="font-size: 0.9rem;">Explore our handcrafted heirloom collections.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = CART.map(item => `
    <div class="cart-item-card">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='assets/images/hero-wooden-toys.jpg'">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-wood">${item.woodType}</div>
        ${item.engraving ? `<div style="font-size: 0.76rem; color: var(--honey-600); font-weight: 600; margin-bottom: 6px;">✨ Engraving: "${item.engraving}"</div>` : ''}
        <div class="cart-item-bottom">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
          <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(productId, event) {
  if (event) event.stopPropagation();
  const prod = WOODEN_PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  const existing = CART.find(item => item.id === prod.id && !item.engraving);
  if (existing) {
    existing.qty += 1;
  } else {
    CART.push({
      id: prod.id,
      name: prod.name,
      woodType: prod.woodType,
      price: prod.price,
      qty: 1,
      image: prod.image,
      engraving: null
    });
  }

  updateCartUI();
  if (window.woodAudio) window.woodAudio.playSuccessChime();
  showToast(`Added "${prod.name}" to your basket!`);
}

function changeQty(itemId, delta) {
  const itemIndex = CART.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return;

  CART[itemIndex].qty += delta;
  if (CART[itemIndex].qty <= 0) {
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
      <img src="${prod.image}" alt="${prod.name}" onerror="this.src='assets/images/hero-wooden-toys.jpg'">
    </div>
    <div class="modal-details">
      <span class="section-badge">${prod.badge}</span>
      <h2 style="font-size: 1.8rem; margin-bottom: 6px;">${prod.name}</h2>
      <p style="color: var(--honey-600); font-weight: 600; margin-bottom: 16px;">${prod.woodType}</p>
      
      <p style="color: var(--timber-700); line-height: 1.7; margin-bottom: 24px;">${prod.description}</p>

      <div style="background: var(--bg-cream); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px;">
        <div style="font-size: 0.85rem; margin-bottom: 6px;"><strong>Dimensions:</strong> ${prod.dimensions}</div>
        <div style="font-size: 0.85rem; margin-bottom: 6px;"><strong>Weight:</strong> ${prod.weight}</div>
        <div style="font-size: 0.85rem; margin-bottom: 6px;"><strong>Finish:</strong> ${prod.finish}</div>
        <div style="font-size: 0.85rem;"><strong>Safety:</strong> Certified Non-Toxic & Child-Safe</div>
      </div>

      <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px;">
        <span style="font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--timber-900);">$${prod.price.toFixed(2)}</span>
        <span style="text-decoration: line-through; color: var(--timber-400);">$${prod.originalPrice.toFixed(2)}</span>
      </div>

      <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="addToCart('${prod.id}'); closeQuickView();">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        Add to Basket • $${prod.price.toFixed(2)}
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
      if (label) label.textContent = enabled ? 'Organic Wood Audio: ON' : 'Audio: OFF';
      if (enabled) window.woodAudio.playWoodClick(1.5);
    }
  });
}

/* --- 8. Newsletter & Toast Helper --- */
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (input && input.value) {
        if (window.woodAudio) window.woodAudio.playSuccessChime();
        showToast('Welcome to the Woodcraft Guild! Check your inbox for your 10% welcome token.');
        input.value = '';
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
    <span>${message}</span>
  `;

  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
