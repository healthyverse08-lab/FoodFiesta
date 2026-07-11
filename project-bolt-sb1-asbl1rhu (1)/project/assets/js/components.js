/**
 * FoodFiesta — Component Renderers
 * Functions that return HTML strings for reusable components.
   Imported by page modules. Strings are injected via innerHTML.
 */

import { icon } from './icons.js';
import { renderStars, formatPrice, favorites } from './utils.js';

/* ============================================================
   Button
   ============================================================ */
export function button({ label, variant = 'primary', size, icon: iconName, block, disabled, loading, type = 'button', onclick, href, ariaLabel }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', (disabled || loading) && 'is-disabled', loading && 'is-loading'].filter(Boolean).join(' ');
  const iconHtml = iconName ? `<span class="icon">${icon(iconName)}</span>` : '';
  if (href) {
    return `<a class="${cls}" href="${href}" ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>${iconHtml}<span>${label}</span></a>`;
  }
  return `<button type="${type}" class="${cls}" ${disabled ? 'disabled' : ''} ${loading ? 'data-loading="true"' : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''} ${onclick ? `onclick="${onclick}"` : ''}>${iconHtml}<span>${label}</span></button>`;
}

/* ============================================================
   Restaurant Card
   ============================================================ */
export function restaurantCard(r, { clickable = true } = {}) {
  const isFav = favorites.hasRestaurant(r.id);
  const statusCls = r.open ? 'status-open' : 'status-closed';
  const statusText = r.open ? 'Open' : 'Closed';
  const priceLevel = '$'.repeat(r.priceLevel);
  const favIcon = isFav
    ? icon('heart').replace('<path', '<path fill="currentColor"')
    : icon('heart');
  return `
  <article class="restaurant-card ${clickable ? 'clickable' : ''}" data-restaurant="${r.id}" tabindex="${clickable ? '0' : ''}" ${clickable ? `onclick="window.goRestaurant('${r.id}')"` : ''} role="${clickable ? 'link' : ''}" aria-label="${r.name}">
    <div class="restaurant-card__cover">
      ${r.offer ? `<span class="offer-badge">${r.offer}</span>` : ''}
      <button class="fav-btn ${isFav ? 'is-active' : ''}" data-fav-restaurant="${r.id}" aria-label="${isFav ? 'Remove from' : 'Add to'} favorites" onclick="event.stopPropagation(); window.toggleFavRestaurant('${r.id}', this)">
        ${favIcon}
      </button>
      <img src="${r.cover}" alt="${r.name} cover" loading="lazy" />
      <div class="restaurant-card__logo"><img src="${r.logo}" alt="${r.name} logo" loading="lazy" /></div>
    </div>
    <div class="restaurant-card__body">
      <h3 class="restaurant-card__name">${r.name}</h3>
      <p class="restaurant-card__cuisine">${r.cuisine}</p>
      <div class="restaurant-card__meta">
        <span class="rating-badge">${icon('star', 14)} ${r.rating}</span>
        <span class="dot"></span>
        <span>${r.deliveryTime} min</span>
        <span class="dot"></span>
        <span>${priceLevel}</span>
      </div>
      <div class="restaurant-card__footer">
        <span class="status-badge ${statusCls}">${statusText}</span>
        <span>${r.deliveryFee === 0 ? 'Free Delivery' : formatPrice(r.deliveryFee) + ' delivery'}</span>
      </div>
    </div>
  </article>`;
}

/* ============================================================
   Food Card
   ============================================================ */
export function foodCard(f, { showAddBtn = true } = {}) {
  const isFav = favorites.hasFood(f.id);
  const favIcon = isFav
    ? icon('heart').replace('<path', '<path fill="currentColor"')
    : icon('heart');
  const dietBadge = f.veg
    ? `<span class="diet-badge diet-veg"><span class="dot"></span>Veg</span>`
    : `<span class="diet-badge diet-nonveg"><span class="dot"></span>Non-Veg</span>`;
  const chefBadge = f.chefChoice ? `<span class="badge badge-accent">${icon('flame', 14)} Chef's Choice</span>` : '';
  return `
  <article class="food-card clickable" data-food="${f.id}" tabindex="0" onclick="window.goFood('${f.id}')" role="link" aria-label="${f.name} from ${f.restaurant}">
    <div class="food-card__image">
      ${chefBadge ? `<span class="offer-badge" style="left:auto;right:64px;background:var(--color-accent);color:var(--text-on-accent)">${icon('flame', 12)} Chef's Choice</span>` : ''}
      <button class="fav-btn ${isFav ? 'is-active' : ''}" data-fav-food="${f.id}" aria-label="${isFav ? 'Remove from' : 'Add to'} favorites" onclick="event.stopPropagation(); window.toggleFavFood('${f.id}', this)">
        ${favIcon}
      </button>
      <img src="${f.image}" alt="${f.name}" loading="lazy" />
    </div>
    <div class="food-card__body">
      <div class="flex items-center gap-2" style="flex-wrap:wrap">
        ${dietBadge}
        <span class="rating-badge">${icon('star', 14)} ${f.rating}</span>
      </div>
      <h3 class="food-card__name">${f.name}</h3>
      <p class="food-card__restaurant">${f.restaurant}</p>
      <div class="food-card__footer">
        <span class="food-card__price">${formatPrice(f.price)}</span>
        ${showAddBtn ? `<button class="food-card__add" aria-label="Add ${f.name} to cart" onclick="event.stopPropagation(); window.quickAddCart('${f.id}', this)">${icon('plus', 20)}</button>` : ''}
      </div>
    </div>
  </article>`;
}

/* ============================================================
   Skeleton Card
   ============================================================ */
export function skeletonCard(type = 'restaurant') {
  if (type === 'food') {
    return `<div class="skel-card">
      <div class="skeleton skel-card__img" style="aspect-ratio:4/3"></div>
      <div class="skel-card__body">
        <div class="skeleton skeleton-text" style="width:60%"></div>
        <div class="skeleton skeleton-text" style="width:40%"></div>
        <div class="skeleton skeleton-text" style="width:30%;margin-top:12px"></div>
      </div>
    </div>`;
  }
  return `<div class="skel-card">
    <div class="skeleton skel-card__img"></div>
    <div class="skel-card__body">
      <div class="skeleton skeleton-text" style="width:70%"></div>
      <div class="skeleton skeleton-text" style="width:50%"></div>
      <div class="skeleton skeleton-text" style="width:40%;margin-top:12px"></div>
    </div>
  </div>`;
}

/* ============================================================
   Empty State
   ============================================================ */
export function emptyState({ title, text, actions = [], iconName = 'search' }) {
  const actionsHtml = actions.length
    ? `<div class="empty-state__actions">${actions.map(a => button(a)).join('')}</div>`
    : '';
  return `
  <div class="empty-state">
    <div class="empty-state__icon">${icon(iconName, 96)}</div>
    <h3 class="empty-state__title">${title}</h3>
    <p class="empty-state__text">${text}</p>
    ${actionsHtml}
  </div>`;
}

/* ============================================================
   Section Header
   ============================================================ */
export function sectionHeader({ title, subtitle, action }) {
  const actionHtml = action ? `<div class="section-header__action">${button(action)}</div>` : '';
  return `
  <div class="section-header reveal">
    <div>
      <h2 class="section-header__title">${title}</h2>
      ${subtitle ? `<p class="section-header__subtitle">${subtitle}</p>` : ''}
    </div>
    ${actionHtml}
  </div>`;
}

/* ============================================================
   Quantity Selector
   ============================================================ */
export function quantitySelector(value = 1, { onDecrease, onIncrease, dataAttr = '' }) {
  return `
  <div class="qty" ${dataAttr}>
    <button class="qty__btn" aria-label="Decrease quantity" ${onDecrease ? `onclick="${onDecrease}"` : ''}>${icon('minus', 16)}</button>
    <span class="qty__value">${value}</span>
    <button class="qty__btn" aria-label="Increase quantity" ${onIncrease ? `onclick="${onIncrease}"` : ''}>${icon('plus', 16)}</button>
  </div>`;
}

/* ============================================================
   Breadcrumb
   ============================================================ */
export function breadcrumb(items) {
  const sep = icon('chevronRight', 16);
  return `<nav class="breadcrumb" aria-label="Breadcrumb">
    ${items.map((it, i) => {
      const isLast = i === items.length - 1;
      if (isLast) return `<span class="current" aria-current="page">${it.label}</span>`;
      return `<a href="${it.href}">${it.label}</a><span class="sep" aria-hidden="true">${sep}</span>`;
    }).join('')}
  </nav>`;
}

/* ============================================================
   Category Card
   ============================================================ */
export function categoryCard(cat) {
  return `
  <button class="cat-card" data-category="${cat.id}" onclick="window.goCategory('${cat.id}')" aria-label="Browse ${cat.name}">
    <div class="cat-card__icon">
      <img src="${cat.image}" alt="${cat.name}" loading="lazy" />
    </div>
    <span class="cat-card__name">${cat.name}</span>
    <span class="cat-card__count">${cat.count} items</span>
  </button>`;
}

/* ============================================================
   Offer Card
   ============================================================ */
export function offerCard(offer) {
  return `
  <article class="offer-card reveal">
    <div class="offer-card__image">
      <span class="offer-badge">${offer.badge}</span>
      <img src="${offer.image}" alt="${offer.title}" loading="lazy" />
    </div>
    <div class="offer-card__body">
      <h3 class="offer-card__title">${offer.title}</h3>
      <p class="offer-card__text">${offer.desc}</p>
      ${button({ label: 'Order Now', variant: 'primary', size: 'sm', icon: 'arrowRight', href: '#', onclick: "window.goOffers && window.goOffers()" })}
    </div>
  </article>`;
}

/* ============================================================
   Testimonial Card
   ============================================================ */
export function testimonialCard(t) {
  return `
  <article class="testimonial-card reveal">
    ${renderStars(t.rating)}
    <p class="testimonial-card__quote">"${t.text}"</p>
    <div class="testimonial-card__author">
      <div class="avatar"><img src="${t.avatar}" alt="${t.name}" loading="lazy" /></div>
      <div>
        <div class="testimonial-card__name">${t.name}</div>
        <div class="testimonial-card__meta">${t.role}</div>
      </div>
    </div>
  </article>`;
}

/* ============================================================
   Feature Card
   ============================================================ */
export function featureCard(f) {
  return `
  <article class="feature-card reveal">
    <div class="feature-card__icon">${icon(f.icon, 32)}</div>
    <h3 class="feature-card__title">${f.title}</h3>
    <p class="feature-card__text">${f.desc}</p>
  </article>`;
}

/* ============================================================
   Pagination
   ============================================================ */
export function pagination({ current, total, onPage }) {
  if (total <= 1) return '';
  let html = '<nav class="pagination" aria-label="Pagination">';
  html += `<button class="pagination__btn" ${current <= 1 ? 'disabled' : ''} ${onPage ? `onclick="${onPage}(${current - 1})"` : ''} aria-label="Previous page">${icon('chevronLeft', 18)}</button>`;
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 1 && p <= current + 1)) {
      html += `<button class="pagination__btn ${p === current ? 'is-active' : ''}" ${onPage ? `onclick="${onPage}(${p})"` : ''} aria-label="Page ${p}" ${p === current ? 'aria-current="page"' : ''}>${p}</button>`;
    } else if (p === current - 2 || p === current + 2) {
      html += `<span class="pagination__ellipsis">…</span>`;
    }
  }
  html += `<button class="pagination__btn" ${current >= total ? 'disabled' : ''} ${onPage ? `onclick="${onPage}(${current + 1})"` : ''} aria-label="Next page">${icon('chevronRight', 18)}</button>`;
  html += '</nav>';
  return html;
}

/* ============================================================
   Coupon Card
   ============================================================ */
export function couponCard(c) {
  return `
  <div class="card card-body reveal" style="display:flex;flex-direction:column;gap:var(--sp-3);border:2px dashed var(--color-light-200)">
    <div class="flex items-center justify-between">
      <span class="badge badge-solid-primary">${icon('tag', 14)} ${c.code}</span>
      <button class="btn-icon btn-icon-sm" aria-label="Copy code" onclick="window.copyCode('${c.code}')">${icon('copy', 18)}</button>
    </div>
    <p class="text-muted fs-small">${c.desc}</p>
    <div class="flex items-center gap-2 fs-caption text-tertiary">
      ${icon('calendar', 14)} Expires ${new Date(c.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </div>
  </div>`;
}
