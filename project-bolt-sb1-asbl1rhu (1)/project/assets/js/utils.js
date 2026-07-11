/**
 * FoodFiesta — Core Utilities
 * DOM helpers, formatting, localStorage store, toast, modal, reveal, navbar.
 */

import { icon } from './icons.js';

/* ============================================================
   DOM Helpers
   ============================================================ */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

/* ============================================================
   Formatting
   ============================================================ */
export function formatPrice(n) {
  return `$${Number(n).toFixed(2)}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return formatDate(dateStr);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / 60000);
  return mins > 0 ? `${mins}m ago` : 'just now';
}

export function pluralize(n, word) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}

/* ============================================================
   LocalStorage Store — single organized namespace
   Keys: cart, favorites, appliedCoupon, deliveryMethod,
          checkoutData, orderData, reviews, recentlyViewed,
          communityData, promotions, settings
   ============================================================ */
const PREFIX = 'foodfiesta:';

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },
};

/* ============================================================
   Cart Module
   ============================================================ */
export const cart = {
  get() {
    return store.get('cart', []);
  },
  save(items) {
    store.set('cart', items);
    updateCartBadge();
    document.dispatchEvent(new CustomEvent('cart:change'));
  },
  add(food, qty = 1, customizations = {}) {
    const items = cart.get();
    const key = cart.itemKey(food.id, customizations);
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key,
        id: food.id,
        name: food.name,
        restaurant: food.restaurant,
        restaurantId: food.restaurantId,
        price: food.price,
        image: food.image,
        qty,
        customizations,
        addedAt: Date.now(),
      });
    }
    cart.save(items);
  },
  remove(key) {
    cart.save(cart.get().filter(i => i.key !== key));
  },
  setQty(key, qty) {
    const items = cart.get();
    const item = items.find(i => i.key === key);
    if (!item) return;
    if (qty <= 0) {
      cart.remove(key);
    } else {
      item.qty = qty;
      cart.save(items);
    }
  },
  clear() {
    cart.save([]);
  },
  count() {
    return cart.get().reduce((sum, i) => sum + i.qty, 0);
  },
  subtotal() {
    return cart.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  itemKey(id, customs) {
    const c = Object.entries(customs)
      .filter(([, v]) => v && (Array.isArray(v) ? v.length : true))
      .sort();
    return `${id}|${JSON.stringify(c)}`;
  },
};

/* ============================================================
   Favorites
   ============================================================ */
export const favorites = {
  get() { return store.get('favorites', { restaurants: [], foods: [] }); },
  save(data) {
    store.set('favorites', data);
    document.dispatchEvent(new CustomEvent('favorites:change'));
  },
  toggleRestaurant(id) {
    const f = favorites.get();
    const i = f.restaurants.indexOf(id);
    if (i > -1) f.restaurants.splice(i, 1);
    else f.restaurants.push(id);
    favorites.save(f);
    return i === -1;
  },
  toggleFood(id) {
    const f = favorites.get();
    const i = f.foods.indexOf(id);
    if (i > -1) f.foods.splice(i, 1);
    else f.foods.push(id);
    favorites.save(f);
    return i === -1;
  },
  hasRestaurant(id) { return favorites.get().restaurants.includes(id); },
  hasFood(id) { return favorites.get().foods.includes(id); },
};

/* ============================================================
   Recently Viewed
   ============================================================ */
export const recentlyViewed = {
  get() { return store.get('recentlyViewed', { restaurants: [], foods: [] }); },
  addRestaurant(id) {
    const rv = recentlyViewed.get();
    rv.restaurants = [id, ...rv.restaurants.filter(r => r !== id)].slice(0, 8);
    store.set('recentlyViewed', rv);
  },
  addFood(id) {
    const rv = recentlyViewed.get();
    rv.foods = [id, ...rv.foods.filter(f => f !== id)].slice(0, 8);
    store.set('recentlyViewed', rv);
  },
};

/* ============================================================
   Cart Badge Synchronization
   ============================================================ */
export function updateCartBadge() {
  const count = cart.count();
  $$('.cart-badge').forEach(badge => {
    const prev = badge.textContent;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
    if (prev !== String(count) && count > 0) {
      badge.classList.remove('is-pulse');
      void badge.offsetWidth;
      badge.classList.add('is-pulse');
    }
  });
}

/* ============================================================
   Toast Notifications
   ============================================================ */
let toastContainer;
function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'status');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast({ title, message, type = 'info', duration = 3200 }) {
  const container = ensureToastContainer();
  const iconName = { success: 'checkCircle', error: 'alert', info: 'info' }[type] || 'info';
  const t = el('div', { class: `toast toast--${type}`, role: 'alert' }, [
    el('span', { class: 'toast__icon', html: icon(iconName) }),
    el('div', { class: 'toast__content' }, [
      title && el('div', { class: 'toast__title', text: title }),
      message && el('div', { class: 'toast__msg', text: message }),
    ].filter(Boolean)),
    el('button', {
      class: 'toast__close',
      'aria-label': 'Close notification',
      onclick: () => dismissToast(t),
      html: icon('close'),
    }),
  ]);
  container.appendChild(t);
  if (duration > 0) setTimeout(() => dismissToast(t), duration);
  return t;
}

function dismissToast(t) {
  if (!t || t.classList.contains('is-leaving')) return;
  t.classList.add('is-leaving');
  setTimeout(() => t.remove(), 300);
}

/* ============================================================
   Modal
   ============================================================ */
export function modal({ title, body, footer, size, onClose } = {}) {
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const m = el('div', { class: `modal ${size ? `modal--${size}` : ''}` });
  const header = el('div', { class: 'modal__header' }, [
    el('h3', { class: 'modal__title', text: title }),
    el('button', {
      class: 'modal__close',
      'aria-label': 'Close dialog',
      html: icon('close'),
      onclick: () => closeModal(overlay, onClose),
    }),
  ]);
  m.append(header);
  if (body) {
    const bodyEl = el('div', { class: 'modal__body' });
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else bodyEl.append(body);
    m.append(bodyEl);
  }
  if (footer) {
    const footerEl = el('div', { class: 'modal__footer' });
    if (typeof footer === 'string') footerEl.innerHTML = footer;
    else footerEl.append(...(Array.isArray(footer) ? footer : [footer]));
    m.append(footerEl);
  }
  overlay.append(m);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay, onClose);
  });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeModal(overlay, onClose);
      document.removeEventListener('keydown', esc);
    }
  });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  return overlay;
}

function closeModal(overlay, onClose) {
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => {
    overlay.remove();
    if (onClose) onClose();
  }, 300);
}

/* ============================================================
   Scroll Reveal (IntersectionObserver)
   ============================================================ */
export function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(i => io.observe(i));
}

/* ============================================================
   Navbar — sticky scroll state, drawer, active link
   ============================================================ */
export function initNavbar() {
  const navbar = $('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Hamburger / drawer
  const hamburger = $('.hamburger');
  const drawer = $('#navDrawer');
  const drawerOverlay = $('#drawerOverlay');
  const drawerClose = $('.drawer__close');

  function openDrawer() {
    drawer?.classList.add('is-open');
    drawerOverlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('is-open');
    drawerOverlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);
  $$('.drawer__link', drawer).forEach(l => l.addEventListener('click', closeDrawer));

  // Escape to close drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) closeDrawer();
  });
}

/* ============================================================
   Star Rating Renderer
   ============================================================ */
export function renderStars(rating, size = 18) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '<span class="stars">';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += `<span class="star filled">${icon('star', size)}</span>`;
    else if (i === full && half) html += `<span class="star half">${icon('star', size)}</span>`;
    else html += `<span class="star">${icon('starOutline', size)}</span>`;
  }
  html += '</span>';
  return html;
}

/* ============================================================
   Debounce
   ============================================================ */
export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* ============================================================
   Query Param Helper
   ============================================================ */
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ============================================================
   Generate Order ID
   ============================================================ */
export function generateOrderId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 899999);
  return `FF-${year}-${rand}`;
}

/* ============================================================
   Copy to clipboard
   ============================================================ */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    ta.remove();
    return true;
  }
}

/* ============================================================
   Countdown timer — returns interval; calls onUpdate each second
   ============================================================ */
export function startCountdown(targetTime, onUpdate, onComplete) {
  function tick() {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      onUpdate(0, 0, 0, 0);
      onComplete?.();
      clearInterval(interval);
      return;
    }
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    onUpdate(h, m, s, remaining);
  }
  tick();
  const interval = setInterval(tick, 1000);
  return interval;
}
