/* FoodFiesta — Core Utilities (plain JS, global namespace) */
window.FoodFiesta = window.FoodFiesta || {};
var FF = FoodFiesta;

FF.$ = function(sel, ctx) { return (ctx || document).querySelector(sel); };
FF.$$ = function(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

FF.formatPrice = function(n) { return '$' + Number(n).toFixed(2); };
FF.formatDate = function(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
FF.pluralize = function(n, word) { return n + ' ' + word + (n !== 1 ? 's' : ''); };

/* localStorage store */
var PREFIX = 'foodfiesta:';
FF.store = {
  get: function(key, fallback) {
    try { var raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : (fallback || null); } catch(e) { return fallback || null; }
  },
  set: function(key, value) { try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch(e) {} },
  remove: function(key) { localStorage.removeItem(PREFIX + key); },
};

/* Cart */
FF.cart = {
  get: function() { return FF.store.get('cart', []); },
  save: function(items) { FF.store.set('cart', items); FF.updateCartBadge(); document.dispatchEvent(new CustomEvent('cart:change')); },
  add: function(food, qty, customizations) {
    qty = qty || 1; customizations = customizations || {};
    var items = FF.cart.get();
    var key = FF.cart.itemKey(food.id, customizations);
    var existing = items.find(function(i) { return i.key === key; });
    if (existing) { existing.qty += qty; }
    else {
      items.push({ key: key, id: food.id, name: food.name, restaurant: food.restaurant, restaurantId: food.restaurantId, price: food.price, image: food.image, qty: qty, customizations: customizations, addedAt: Date.now() });
    }
    FF.cart.save(items);
  },
  remove: function(key) { FF.cart.save(FF.cart.get().filter(function(i) { return i.key !== key; })); },
  setQty: function(key, qty) {
    var items = FF.cart.get();
    var item = items.find(function(i) { return i.key === key; });
    if (!item) return;
    if (qty <= 0) { FF.cart.remove(key); } else { item.qty = qty; FF.cart.save(items); }
  },
  clear: function() { FF.cart.save([]); },
  count: function() { return FF.cart.get().reduce(function(s, i) { return s + i.qty; }, 0); },
  subtotal: function() { return FF.cart.get().reduce(function(s, i) { return s + i.price * i.qty; }, 0); },
  itemKey: function(id, customs) {
    var c = Object.entries(customs).filter(function(kv) { return kv[1] && (Array.isArray(kv[1]) ? kv[1].length : true); }).sort();
    return id + '|' + JSON.stringify(c);
  },
};

/* Favorites */
FF.favorites = {
  get: function() { return FF.store.get('favorites', { restaurants: [], foods: [] }); },
  save: function(data) { FF.store.set('favorites', data); document.dispatchEvent(new CustomEvent('favorites:change')); },
  toggleRestaurant: function(id) {
    var f = FF.favorites.get(); var i = f.restaurants.indexOf(id);
    if (i > -1) f.restaurants.splice(i, 1); else f.restaurants.push(id);
    FF.favorites.save(f); return i === -1;
  },
  toggleFood: function(id) {
    var f = FF.favorites.get(); var i = f.foods.indexOf(id);
    if (i > -1) f.foods.splice(i, 1); else f.foods.push(id);
    FF.favorites.save(f); return i === -1;
  },
  hasRestaurant: function(id) { return FF.favorites.get().restaurants.indexOf(id) > -1; },
  hasFood: function(id) { return FF.favorites.get().foods.indexOf(id) > -1; },
};

/* Recently viewed */
FF.recentlyViewed = {
  get: function() { return FF.store.get('recentlyViewed', { restaurants: [], foods: [] }); },
  addRestaurant: function(id) { var rv = FF.recentlyViewed.get(); rv.restaurants = [id].concat(rv.restaurants.filter(function(r) { return r !== id; })).slice(0, 8); FF.store.set('recentlyViewed', rv); },
  addFood: function(id) { var rv = FF.recentlyViewed.get(); rv.foods = [id].concat(rv.foods.filter(function(f) { return f !== id; })).slice(0, 8); FF.store.set('recentlyViewed', rv); },
};

/* Cart badge */
FF.updateCartBadge = function() {
  var count = FF.cart.count();
  FF.$$('.cart-badge').forEach(function(badge) {
    var prev = badge.textContent;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
    if (prev !== String(count) && count > 0) {
      badge.classList.remove('is-pulse');
      void badge.offsetWidth;
      badge.classList.add('is-pulse');
    }
  });
};

/* Toast */
var toastContainer;
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
FF.toast = function(opts) {
  opts = opts || {};
  var type = opts.type || 'info', duration = opts.duration || 3200;
  var iconName = { success: 'checkCircle', error: 'alert', info: 'info' }[type] || 'info';
  var container = ensureToastContainer();
  var t = document.createElement('div');
  t.className = 'toast toast--' + type;
  t.setAttribute('role', 'alert');
  t.innerHTML = '<span class="toast__icon">' + FF.icon(iconName) + '</span><div class="toast__content">' +
    (opts.title ? '<div class="toast__title">' + opts.title + '</div>' : '') +
    (opts.message ? '<div class="toast__msg">' + opts.message + '</div>' : '') +
    '</div><button class="toast__close" aria-label="Close notification">' + FF.icon('close') + '</button>';
  container.appendChild(t);
  t.querySelector('.toast__close').addEventListener('click', function() { dismissToast(t); });
  if (duration > 0) setTimeout(function() { dismissToast(t); }, duration);
  return t;
};
function dismissToast(t) {
  if (!t || t.classList.contains('is-leaving')) return;
  t.classList.add('is-leaving');
  setTimeout(function() { t.remove(); }, 300);
}

/* Modal */
FF.modal = function(opts) {
  opts = opts || {};
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  var m = document.createElement('div');
  m.className = 'modal' + (opts.size ? ' modal--' + opts.size : '');
  m.innerHTML = '<div class="modal__header"><h3 class="modal__title">' + (opts.title || '') + '</h3>' +
    '<button class="modal__close" aria-label="Close dialog">' + FF.icon('close') + '</button></div>' +
    (opts.body ? '<div class="modal__body">' + (typeof opts.body === 'string' ? opts.body : '') + '</div>' : '') +
    (opts.footer ? '<div class="modal__footer">' + (typeof opts.footer === 'string' ? opts.footer : '') + '</div>' : '');
  overlay.appendChild(m);
  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function() { overlay.remove(); if (opts.onClose) opts.onClose(); }, 300);
  }
  m.querySelector('.modal__close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) { closeModal(); document.removeEventListener('keydown', esc); }
  });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(function() { overlay.classList.add('is-open'); });
  return overlay;
};

/* Reveal animation */
FF.initReveal = function() {
  var items = FF.$$('.reveal');
  if (!items.length) return;
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function(i) { io.observe(i); });
};

/* Navbar */
FF.initNavbar = function() {
  var navbar = FF.$('.navbar');
  if (navbar) {
    var onScroll = function() { navbar.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  var hamburger = FF.$('.hamburger');
  var drawer = FF.$('#navDrawer');
  var drawerOverlay = FF.$('#drawerOverlay');
  var drawerClose = FF.$('.drawer__close');
  function openDrawer() { if (drawer) drawer.classList.add('is-open'); if (drawerOverlay) drawerOverlay.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { if (drawer) drawer.classList.remove('is-open'); if (drawerOverlay) drawerOverlay.classList.remove('is-open'); document.body.style.overflow = ''; }
  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  if (drawer) FF.$$('.drawer__link', drawer).forEach(function(l) { l.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) closeDrawer(); });
};

/* Star rating renderer */
FF.renderStars = function(rating, size) {
  size = size || 18;
  var full = Math.floor(rating);
  var half = rating % 1 >= 0.5;
  var html = '<span class="stars">';
  for (var i = 0; i < 5; i++) {
    if (i < full) html += '<span class="star filled">' + FF.icon('star', size) + '</span>';
    else if (i === full && half) html += '<span class="star half">' + FF.icon('star', size) + '</span>';
    else html += '<span class="star">' + FF.icon('starOutline', size) + '</span>';
  }
  html += '</span>';
  return html;
};

/* Debounce */
FF.debounce = function(fn, wait) {
  wait = wait || 200; var t;
  return function() { var args = arguments; clearTimeout(t); t = setTimeout(function() { fn.apply(null, args); }, wait); };
};

/* Query param */
FF.getParam = function(name) { return new URLSearchParams(window.location.search).get(name); };

/* Generate order ID */
FF.generateOrderId = function() {
  var year = new Date().getFullYear();
  var rand = Math.floor(100000 + Math.random() * 899999);
  return 'FF-' + year + '-' + rand;
};

/* Copy to clipboard */
FF.copyToClipboard = function(text) {
  try { navigator.clipboard.writeText(text); return Promise.resolve(true); }
  catch(e) {
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e2) {}
    ta.remove(); return Promise.resolve(true);
  }
};

/* Countdown */
FF.startCountdown = function(targetTime, onUpdate, onComplete) {
  function tick() {
    var remaining = targetTime - Date.now();
    if (remaining <= 0) { onUpdate(0, 0, 0, 0); if (onComplete) onComplete(); clearInterval(interval); return; }
    var h = Math.floor(remaining / 3600000);
    var m = Math.floor((remaining % 3600000) / 60000);
    var s = Math.floor((remaining % 60000) / 1000);
    onUpdate(h, m, s, remaining);
  }
  tick();
  var interval = setInterval(tick, 1000);
  return interval;
};

/* Path helper */
FF.inPages = function() { return window.location.pathname.indexOf('/pages/') > -1; };
FF.href = function(path) { return (FF.inPages() ? '' : 'pages/') + path; };
FF.homeHref = function() { return FF.inPages() ? '../index.html' : 'index.html'; };
