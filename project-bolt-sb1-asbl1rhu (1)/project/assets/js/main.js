/**
 * FoodFiesta — App Bootstrap
 * Loaded on every page. Injects navbar/footer, sets up global handlers,
 * cart badge sync, favorites, search, reveal animations.
 */

import './icons.js';
import { $, $$, initNavbar, initReveal, updateCartBadge, toast, favorites, cart, copyToClipboard, recentlyViewed } from './utils.js';
import { renderNavbar, renderFooter } from './layout.js';
import { FOODS } from './data.js';

function pathPrefix() {
  return window.location.pathname.includes('/pages/') ? '' : 'pages/';
}

function href(path) {
  return pathPrefix() + path;
}

function init() {
  const inPages = window.location.pathname.includes('/pages/');
  const pageName = document.body.dataset.page || '';

  const navbarHost = $('#navbar-host');
  if (navbarHost) navbarHost.innerHTML = renderNavbar(pageName, { inPages });

  const footerHost = $('#footer-host');
  if (footerHost) footerHost.innerHTML = renderFooter({ inPages });

  initNavbar();
  initReveal();
  updateCartBadge();

  const newsletter = $('#footerNewsletter');
  if (newsletter) {
    newsletter.addEventListener('submit', e => {
      e.preventDefault();
      const email = newsletter.querySelector('input').value.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({ title: 'Subscribed!', message: 'Welcome to the FoodFiesta newsletter.', type: 'success' });
        newsletter.reset();
      } else {
        toast({ title: 'Invalid email', message: 'Please enter a valid email address.', type: 'error' });
      }
    });
  }

  document.addEventListener('cart:change', updateCartBadge);

  // Listen for toast events dispatched by inline scripts (e.g. homepage newsletter)
  document.addEventListener('foodfiesta:toast', e => {
    if (e.detail) toast(e.detail);
  });
}

/* Global window functions — called by inline onclick in rendered cards */

window.goRestaurant = function (id) {
  recentlyViewed.addRestaurant(id);
  window.location.href = href('restaurant.html') + `?id=${id}`;
};

window.goFood = function (id) {
  recentlyViewed.addFood(id);
  window.location.href = href('food.html') + `?id=${id}`;
};

window.goCategory = function (catId) {
  window.location.href = href('restaurants.html') + `?category=${catId}`;
};

window.goOffers = function () {
  window.location.href = href('offers.html');
};

window.toggleFavRestaurant = function (id, btn) {
  const added = favorites.toggleRestaurant(id);
  btn.classList.toggle('is-active', added);
  const p = btn.querySelector('path');
  if (p) p.setAttribute('fill', added ? 'currentColor' : 'none');
  toast({ title: added ? 'Added to favorites' : 'Removed from favorites', type: added ? 'success' : 'info', duration: 2000 });
};

window.toggleFavFood = function (id, btn) {
  const added = favorites.toggleFood(id);
  btn.classList.toggle('is-active', added);
  const p = btn.querySelector('path');
  if (p) p.setAttribute('fill', added ? 'currentColor' : 'none');
  toast({ title: added ? 'Added to favorites' : 'Removed from favorites', type: added ? 'success' : 'info', duration: 2000 });
};

window.quickAddCart = function (foodId, btn) {
  const food = FOODS.find(f => f.id === foodId);
  if (!food) return;
  cart.add(food, 1);
  if (btn) {
    btn.style.transform = 'scale(0.85)';
    setTimeout(() => { btn.style.transform = ''; }, 180);
  }
  toast({ title: 'Added to cart', message: `${food.name} added.`, type: 'success', duration: 2200 });
};

window.copyCode = async function (code) {
  await copyToClipboard(code);
  toast({ title: 'Copied!', message: `Code "${code}" copied to clipboard.`, type: 'success', duration: 2200 });
};

window.openSearch = function () {
  const onRestaurants = window.location.pathname.includes('restaurants');
  if (!onRestaurants) {
    window.location.href = href('restaurants.html') + '?focus=search';
  } else {
    document.dispatchEvent(new CustomEvent('foodfiesta:search'));
  }
};

document.addEventListener('DOMContentLoaded', init);
