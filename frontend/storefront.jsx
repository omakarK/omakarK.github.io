import React from 'react';
import { createRoot } from 'react-dom/client';

const roots = new Map();
const fallback = '/assets/images/hero-wooden-toys.jpg';
const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0
}).format(value);

function mount(id, element) {
  if (!roots.has(id)) roots.set(id, createRoot(document.getElementById(id)));
  roots.get(id).render(element);
}

function Photo({ src, alt, ...props }) {
  return <img {...props} src={src || fallback} alt={alt} onError={event => {
    if (event.currentTarget.getAttribute('src') !== fallback) event.currentTarget.src = fallback;
  }} />;
}

function Catalog({ products, wishlist, emptyText, onWishlist, onPreview, onAdd, onLayout }) {
  React.useLayoutEffect(() => { onLayout?.(); }, [products, wishlist, onLayout]);
  if (!products.length) return <p>{emptyText}</p>;
  return products.map(product => {
    const saved = wishlist.has(product.id);
    return <article className="product-card" key={product.id} data-id={product.id}>
      <div className="product-media">
        <Photo src={product.image} alt={product.name} loading="lazy" />
        <div className="card-badges">
          {product.badge && <span className="card-badge gold">{product.badge}</span>}
          {product.recommendedAge && <span className="card-badge">{product.recommendedAge}</span>}
        </div>
        <div className="card-actions-overlay">
          <button type="button" className={`card-icon-btn wishlist-btn ${saved ? 'active' : ''}`}
            aria-label={saved ? 'Remove from Wishlist' : 'Add to Wishlist'} aria-pressed={saved} onClick={() => onWishlist(product.id)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#c45b3a' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <div className="quickview-btn-wrap">
          <button type="button" className="btn-quickview" onClick={() => onPreview(product.id)}>Quick View</button>
        </div>
      </div>
      <div className="product-info">
        <div className="product-meta-row">
          <span className="product-wood-tag">{product.woodType}</span>
          {product.rating > 0 && <span className="product-rating">★ {product.rating.toFixed(1)}</span>}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-sub">{product.subtitle}</p>
        <div className="product-price-row">
          <Price price={product.price} original={product.originalPrice} />
          <button type="button" className="btn-add-cart" disabled={!product.inStock} onClick={() => onAdd(product.id)}>
            {product.inStock ? 'Add to Basket' : 'Sold out'}
          </button>
        </div>
      </div>
    </article>;
  });
}

function Price({ price, original }) {
  return <div className="price-wrap">
    <span className="price-current">{money(price)}</span>
    {original > price && <s className="price-original">{money(original)}</s>}
  </div>;
}

function Combos({ offers, onAdd }) {
  if (!offers.length) return <p>There are no special offers available right now.</p>;
  return offers.map(offer => {
    const gallery = offer.media.filter(media => media.url !== offer.image);
    return <article className="product-card offer-card" key={offer.id}>
      <Photo className="offer-cover" src={offer.image} alt={offer.title} loading="lazy" />
      <div className="product-info">
        <h3 className="product-name">{offer.title}</h3>
        <p>{offer.description}</p>
        <ul className="combo-items">{offer.items.map(item => <li key={item.id}>{item.quantity} × {item.name}</li>)}</ul>
        <div className="product-price-row">
          <Price price={offer.price} original={offer.originalPrice} />
          <button type="button" className="btn-add-cart" disabled={!offer.inStock} onClick={() => onAdd(offer)}>
            {offer.inStock ? 'Add combo' : 'Sold out'}
          </button>
        </div>
        {gallery.length > 0 && <div className="offer-gallery">
          {gallery.map(media => media.type.startsWith('video/')
            ? <video key={media.id} controls playsInline preload="metadata" src={media.url} aria-label={`${offer.title} video`} />
            : <Photo key={media.id} src={media.url} alt={`${offer.title} photo`} loading="lazy" />)}
        </div>}
      </div>
    </article>;
  });
}

function Basket({ items, onQuantity }) {
  if (!items.length) return <div className="cart-empty"><h4>Your basket is empty</h4><p>Explore the toy collections and combo offers.</p></div>;
  return items.map(item => <div key={item.id} className="cart-item-card">
    <Photo src={item.image} alt={item.name} className="cart-item-img" />
    <div className="cart-item-info">
      <h4 className="cart-item-title">{item.name}</h4>
      <div className="cart-item-wood">{item.woodType}</div>
      {item.engraving && <div className="cart-item-wood">Engraving “{item.engraving}”</div>}
      <div className="cart-item-bottom">
        <div className="qty-control">
          <button type="button" className="qty-btn" aria-label={item.qty === 1 ? `Remove ${item.name}` : `Decrease ${item.name} quantity`}
            onClick={() => onQuantity(item.id, -1)}>−</button>
          <span className="qty-val">{item.qty}</span>
          <button type="button" className="qty-btn" aria-label={`Increase ${item.name} quantity`}
            onClick={() => onQuantity(item.id, 1)}>+</button>
        </div>
        <span className="cart-item-price">{money(item.price * item.qty)}</span>
      </div>
    </div>
  </div>);
}

function CheckoutSummary({ quote }) {
  return <ul>
    {quote.lines.map((item, index) => <li key={index}>{item.quantity} × {item.name} <strong>{money(item.unitPrice * item.quantity / 100)}</strong></li>)}
    <li>Shipping <strong>{quote.shipping ? money(quote.shipping / 100) : 'Free'}</strong></li>
    <li className="checkout-total">Total <strong>{money(quote.total / 100)}</strong></li>
  </ul>;
}

window.shopUI = {
  catalog: props => mount('products-container', <Catalog {...props} />),
  combos: props => mount('offers-list', <Combos {...props} />),
  basket: props => mount('cart-items-container', <Basket {...props} />),
  checkout: quote => mount('checkout-summary', <CheckoutSummary quote={quote} />),
  status: (id, text, retry) => mount(id, <p role="status">{text}{retry && <> <button type="button" className="shop-text-action" onClick={retry}>Try again</button></>}</p>)
};
