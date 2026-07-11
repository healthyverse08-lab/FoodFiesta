/**
 * Restaurant Details Page
 * Hero, info, gallery, sticky menu tabs, food menu, reviews, similar restaurants, map.
 */

import { getRestaurant, getFoodsByRestaurant, RESTAURANTS, FOODS, SEED_REVIEWS } from '../data.js';
import { restaurantCard, breadcrumb, button, sectionHeader } from '../components.js';
import { $, $$, renderStars, formatPrice, formatDate, getParam, cart, favorites, toast, modal, recentlyViewed, initReveal, store } from '../utils.js';
import { icon as iconFn } from '../icons.js';

function buildReviewCards(reviews, sortFn) {
  let list = [...reviews];
  if (sortFn === 'recent') list.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortFn === 'highest') list.sort((a, b) => b.rating - a.rating);
  if (sortFn === 'lowest') list.sort((a, b) => a.rating - b.rating);
  return list.slice(0, 5).map(r => `
    <article class="review-card">
      <div class="review-card__head">
        <div class="avatar"><img src="${r.avatar}" alt="${r.name}" loading="lazy" /></div>
        <div style="flex:1">
          <div class="review-card__name">${r.name} ${r.verified ? `<span class="badge badge-success" style="margin-left:4px">${iconFn('check', 12)} Verified</span>` : ''}</div>
          <div class="review-card__date">${formatDate(r.date)}</div>
        </div>
        ${renderStars(r.rating, 16)}
      </div>
      <p class="review-card__text">${r.text}</p>
      <div class="review-card__actions">
        <button class="review-card__action" aria-label="Mark helpful"><span class="icon">${iconFn('thumbsUp', 18)}</span> Helpful (${r.helpful})</button>
        <button class="review-card__action" aria-label="Like"><span class="icon">${iconFn('heart', 18)}</span> Like (${r.likes})</button>
      </div>
    </article>`).join('');
}

function renderRestaurant(r) {
  const foods = getFoodsByRestaurant(r.id);
  const reviews = SEED_REVIEWS.filter(rv => rv.restaurantId === r.id);
  const similar = RESTAURANTS.filter(x => x.id !== r.id && x.cuisines.some(c => r.cuisines.includes(c))).slice(0, 4);
  const isFav = favorites.hasRestaurant(r.id);

  const menuCats = [...new Set(foods.map(f => f.category))];
  const catLabels = { pizza: 'Pizza', burger: 'Burgers', momo: 'Momos', biryani: 'Biryani', sushi: 'Sushi', healthy: 'Healthy', desserts: 'Desserts', drinks: 'Drinks' };

  const gallery = [
    r.cover,
    ...foods.slice(0, 5).map(f => f.image),
  ].filter(Boolean);

  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(rv => Math.round(rv.rating) === stars).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return `<div class="rating-bar"><span class="rating-bar__label">${stars}★</span><div class="rating-bar__track"><div class="rating-bar__fill" style="width:${pct}%"></div></div><span class="rating-bar__count">${count}</span></div>`;
  }).join('');

  return `
  ${breadcrumb([
    { label: 'Home', href: '../index.html' },
    { label: 'Restaurants', href: 'restaurants.html' },
    { label: r.name, href: '#' },
  ])}

  <!-- Hero -->
  <section class="section-sm" style="padding-bottom:0">
    <div class="container">
      <div id="crumbs" style="margin-bottom:var(--sp-4)"></div>
      <div class="restaurant-hero">
        <div class="restaurant-hero__cover">
          <img src="${r.cover}" alt="${r.name} cover" />
          <button class="fav-btn ${isFav ? 'is-active' : ''}" style="top:var(--sp-4);right:var(--sp-4);background:rgba(255,255,255,0.92)" data-fav-restaurant="${r.id}" onclick="window.toggleFavRestaurant('${r.id}', this)" aria-label="Toggle favorite">
            ${iconFn('heart', 20)}
          </button>
          <button class="btn btn-light" style="position:absolute;top:var(--sp-4);right:64px" onclick="window.shareRestaurant('${r.id}')" aria-label="Share">
            ${iconFn('share', 18)} Share
          </button>
        </div>
        <div class="restaurant-hero__info">
          <div class="restaurant-hero__logo"><img src="${r.logo}" alt="${r.name} logo" /></div>
          <div class="restaurant-hero__head">
            <div style="flex:1">
              <h1 style="font-size:var(--fs-h1);font-weight:700">${r.name}</h1>
              <p class="text-muted" style="margin-top:4px">${r.cuisine}</p>
            </div>
            <span class="status-badge ${r.open ? 'status-open' : 'status-closed'}">${r.open ? 'Open Now' : 'Closed'}</span>
          </div>
          <div class="restaurant-hero__meta">
            <span class="rating-badge">${iconFn('star', 14)} ${r.rating} <span style="color:var(--text-tertiary);font-weight:400">(${r.reviewCount} reviews)</span></span>
            <span class="restaurant-hero__meta-item">${iconFn('clock', 16)} ${r.deliveryTime} min</span>
            <span class="restaurant-hero__meta-item">${iconFn('truck', 16)} ${r.deliveryFee === 0 ? 'Free delivery' : formatPrice(r.deliveryFee) + ' fee'}</span>
            <span class="restaurant-hero__meta-item">${'$'.repeat(r.priceLevel)}</span>
          </div>
          ${r.offer ? `<div class="restaurant-hero__offer"><span class="offer-badge" style="position:static">${r.offer}</span></div>` : ''}
          <div class="flex gap-3" style="flex-wrap:wrap;margin-top:var(--sp-4)">
            <a class="btn btn-primary" href="#menu">${iconFn('utensils', 18)} Browse Menu</a>
            <button class="btn btn-outline" onclick="window.shareRestaurant('${r.id}')">${iconFn('share', 18)} Share</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Info section -->
  <section class="section-sm">
    <div class="container">
      <div class="grid grid-cols-1 grid-md-cols-3" style="gap:var(--sp-5)">
        <div class="card card-body reveal">
          <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">About</h3>
          <p class="text-muted">${r.description}</p>
        </div>
        <div class="card card-body reveal">
          <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">Information</h3>
          <div style="display:flex;flex-direction:column;gap:var(--sp-3);font-size:var(--fs-small);color:var(--text-secondary)">
            <div class="flex items-center gap-3">${iconFn('mapPin', 18)} <span>${r.address}</span></div>
            <div class="flex items-center gap-3">${iconFn('phone', 18)} <span>${r.phone}</span></div>
            <div class="flex items-center gap-3">${iconFn('clock', 18)} <span>${r.hours}</span></div>
            <div class="flex items-center gap-3">${iconFn('truck', 18)} <span>${r.deliveryTime} min estimated delivery</span></div>
          </div>
        </div>
        <div class="card card-body reveal">
          <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">Services & Payment</h3>
          <div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:var(--sp-3)">
            ${r.services.map(s => `<span class="badge badge-muted">${iconFn('check', 12)} ${s}</span>`).join('')}
          </div>
          <div class="flex items-center gap-2" style="flex-wrap:wrap">
            ${r.payment.map(p => `<span class="badge badge-primary">${p}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Gallery -->
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Gallery', subtitle: 'A look at the food and ambiance.' })}
      <div class="gallery-grid reveal" id="galleryGrid">
        ${gallery.map((g, i) => `<div class="gallery-item" onclick="window.openLightbox(${i})" data-img="${g}"><img src="${g}" alt="Gallery image ${i + 1}" loading="lazy" /></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Menu -->
  <section class="section" id="menu">
    <div class="container">
      ${sectionHeader({ title: 'Menu', subtitle: 'Explore the full menu and add items to your cart.' })}

      <div class="split-2">
        <div>
          <!-- Sticky tabs -->
          <div class="menu-tabs reveal">
            <div class="tabs" id="menuTabs">
              <button class="tab is-active" data-cat="all">All</button>
              ${menuCats.map(c => `<button class="tab" data-cat="${c}">${catLabels[c] || c}</button>`).join('')}
            </div>
          </div>

          <div id="menuItems" class="grid grid-cols-1 grid-md-cols-2" style="gap:var(--sp-4)"></div>
        </div>

        <!-- Sticky cart preview -->
        <aside class="cart-preview" id="cartPreview"></aside>
      </div>
    </div>
  </section>

  <!-- Reviews -->
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Reviews', subtitle: `What customers say about ${r.name}.` })}
      <div class="split-2">
        <div class="card card-body reveal" style="text-align:center">
          <div style="font-size:var(--fs-display);font-family:var(--font-heading);font-weight:700;color:var(--text-primary);line-height:1">${r.rating}</div>
          ${renderStars(r.rating, 24)}
          <p class="text-muted fs-small" style="margin-top:var(--sp-2)">${r.reviewCount} reviews</p>
        </div>
        <div class="card card-body reveal">
          <h4 class="fw-semibold" style="margin-bottom:var(--sp-4)">Rating Breakdown</h4>
          <div class="rating-breakdown">${ratingBreakdown}</div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 mb-5" style="margin-top:var(--sp-6);flex-wrap:wrap">
        <h3 class="fs-body-lg fw-semibold">Customer Reviews</h3>
        <select class="select" id="reviewSort" style="width:auto;min-height:40px;padding-block:var(--sp-2)">
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>
      <div class="grid grid-cols-1 grid-md-cols-2" id="reviewList" style="gap:var(--sp-4)"></div>
    </div>
  </section>

  <!-- Similar restaurants -->
  <section class="section">
    <div class="container">
      ${sectionHeader({ title: 'Similar Restaurants', subtitle: 'You might also like these.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" id="similarGrid" style="gap:24px"></div>
    </div>
  </section>

  <!-- Map -->
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Location', subtitle: r.address })}
      <div class="card reveal" style="overflow:hidden">
        <iframe src="https://www.google.com/maps?q=${encodeURIComponent(r.address)}&output=embed" width="100%" height="360" style="border:0;display:block" loading="lazy" title="${r.name} location"></iframe>
      </div>
    </div>
  </section>

  <!-- Floating cart (mobile) -->
  <div class="floating-cart" id="floatingCart"></div>
  `;
}

function renderMenuItems(foods, cat = 'all') {
  const list = cat === 'all' ? foods : foods.filter(f => f.category === cat);
  return list.map(f => {
    const isFav = favorites.hasFood(f.id);
    const dietBadge = f.veg ? '<span class="diet-badge diet-veg"><span class="dot"></span>Veg</span>' : '<span class="diet-badge diet-nonveg"><span class="dot"></span>Non-Veg</span>';
    return `
    <article class="food-card" style="flex-direction:row">
      <div class="food-card__image" style="width:120px;flex-shrink:0;aspect-ratio:1" onclick="window.goFood('${f.id}')">
        <button class="fav-btn ${isFav ? 'is-active' : ''}" style="top:4px;right:4px;width:30px;height:30px" data-fav-food="${f.id}" onclick="event.stopPropagation();window.toggleFavFood('${f.id}', this)" aria-label="Toggle favorite">${iconFn('heart', 16)}</button>
        <img src="${f.image}" alt="${f.name}" loading="lazy" />
      </div>
      <div class="food-card__body" style="padding:var(--sp-3)">
        <div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:4px">
          ${dietBadge}
          ${f.chefChoice ? `<span class="badge badge-accent">${iconFn('flame', 12)} Chef's Choice</span>` : ''}
        </div>
        <h3 class="food-card__name" style="font-size:var(--fs-body);cursor:pointer" onclick="window.goFood('${f.id}')">${f.name}</h3>
        <p class="fs-caption text-tertiary" style="margin-top:2px">${f.desc}</p>
        <div class="flex items-center justify-between" style="margin-top:var(--sp-2)">
          <span class="food-card__price">${formatPrice(f.price)}</span>
          <div class="flex items-center gap-2">
            <span class="rating-badge" style="padding:2px 6px">${iconFn('star', 12)} ${f.rating}</span>
            <button class="food-card__add" style="width:36px;height:36px" onclick="window.quickAddCart('${f.id}', this)" aria-label="Add ${f.name} to cart">${iconFn('plus', 18)}</button>
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderCartPreview() {
  const items = cart.get();
  const preview = $('#cartPreview');
  const floating = $('#floatingCart');
  if (!preview) return;

  if (items.length === 0) {
    preview.innerHTML = `
      <div class="cart-preview__title">${iconFn('cart', 20)} Your Cart</div>
      <div class="empty-state" style="padding:var(--sp-5) 0">
        <div class="empty-state__icon" style="width:64px;height:64px">${iconFn('cart', 64)}</div>
        <p class="text-muted fs-small" style="margin-top:var(--sp-2)">Your cart is empty. Add items from the menu to get started.</p>
      </div>`;
    if (floating) floating.classList.remove('is-visible');
    return;
  }

  const subtotal = cart.subtotal();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  preview.innerHTML = `
    <div class="cart-preview__title">${iconFn('cart', 20)} Your Cart (${cart.count()})</div>
    ${items.map(i => `
      <div class="cart-preview__item">
        <span class="cart-preview__item-name">${i.name}</span>
        <span class="cart-preview__item-qty">×${i.qty}</span>
        <span class="cart-preview__item-price">${formatPrice(i.price * i.qty)}</span>
      </div>`).join('')}
    <div class="cart-preview__summary">
      <div class="cart-preview__row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="cart-preview__row"><span>Estimated tax</span><span>${formatPrice(tax)}</span></div>
      <div class="cart-preview__row cart-preview__row--total"><span>Total</span><span>${formatPrice(total)}</span></div>
      <a class="btn btn-primary btn-block" href="cart.html" style="margin-top:var(--sp-4)">${iconFn('cart', 18)} View Cart</a>
    </div>`;

  if (floating) {
    floating.classList.add('is-visible');
    floating.innerHTML = `
      <span class="fw-semibold">${cart.count()} item${cart.count() !== 1 ? 's' : ''} • ${formatPrice(total)}</span>
      <a class="btn btn-primary btn-sm" href="cart.html">View Cart ${iconFn('arrowRight', 16)}</a>`;
  }
}

function init() {
  const id = getParam('id');
  const r = getRestaurant(id);
  const host = $('#restaurantContent');
  if (!r) {
    host.innerHTML = `<div class="container section-lg"><div class="card"><div class="empty-state"><div class="empty-state__icon">${iconFn('store', 96)}</div><h3 class="empty-state__title">Restaurant not found</h3><p class="empty-state__text">This restaurant may no longer be available.</p><div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Browse Restaurants</a></div></div></div></div>`;
    return;
  }
  recentlyViewed.addRestaurant(r.id);
  document.title = `${r.name} — FoodFiesta`;

  host.innerHTML = renderRestaurant(r);

  const foods = getFoodsByRestaurant(r.id);
  $('#menuItems').innerHTML = renderMenuItems(foods, 'all');

  // Menu tab filtering
  $$('#menuTabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#menuTabs .tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      $('#menuItems').innerHTML = renderMenuItems(foods, tab.dataset.cat);
    });
  });

  // Reviews
  const reviewSort = $('#reviewSort');
  const renderReviews = () => { $('#reviewList').innerHTML = buildReviewCards(SEED_REVIEWS.filter(rv => rv.restaurantId === r.id), reviewSort.value); };
  renderReviews();
  reviewSort?.addEventListener('change', renderReviews);

  // Similar
  const similar = RESTAURANTS.filter(x => x.id !== r.id && x.cuisines.some(c => r.cuisines.includes(c))).slice(0, 4);
  $('#similarGrid').innerHTML = similar.map(s => restaurantCard(s)).join('');

  // Gallery lightbox data
  window._galleryImages = $$('#galleryGrid .gallery-item').map(item => item.dataset.img);

  // Cart preview
  renderCartPreview();
  document.addEventListener('cart:change', renderCartPreview);

  initReveal();
  requestAnimationFrame(() => $$('.reveal:not(.is-visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('is-visible');
  }));
}

window.openLightbox = function (index) {
  const imgs = window._galleryImages || [];
  if (!imgs[index]) return;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `<button class="lightbox__close" aria-label="Close">${iconFn('close', 24)}</button><img src="${imgs[index]}" alt="Gallery image" />`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('.lightbox__close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
};

window.shareRestaurant = function () {
  toast({ title: 'Link copied', message: 'Restaurant link copied to clipboard.', type: 'success', duration: 2200 });
};

document.addEventListener('DOMContentLoaded', init);
