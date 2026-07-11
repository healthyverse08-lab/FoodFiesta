/**
 * FoodFiesta — Navbar & Footer Layout
 * Injected on every page. Path-aware: pass { inPages } to render correct relative URLs.
 */

import { icon } from './icons.js';
import { cart } from './utils.js';

const NAV_ITEMS = [
  { label: 'Home', href: 'index.html', icon: 'home' },
  { label: 'Restaurants', href: 'restaurants.html', icon: 'store' },
  { label: 'Offers', href: 'offers.html', icon: 'tag' },
  { label: 'Reviews', href: 'community.html', icon: 'star' },
];

export function renderNavbar(activePage, { inPages } = {}) {
  const base = inPages ? '' : 'pages/';
  const homeHref = inPages ? '../index.html' : 'index.html';

  const navLinks = NAV_ITEMS.map(item => {
    const isActive = item.label === activePage;
    const href = isActive ? '#' : base + item.href;
    return `<a class="nav-link ${isActive ? 'is-active' : ''}" href="${href}" ${isActive ? 'aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');

  const drawerLinks = NAV_ITEMS.map(item => {
    const isActive = item.label === activePage;
    const href = isActive ? '#' : base + item.href;
    return `<a class="drawer__link ${isActive ? 'is-active' : ''}" href="${href}" ${isActive ? 'aria-current="page"' : ''}>
      <span class="icon">${icon(item.icon, 22)}</span>
      <span>${item.label}</span>
    </a>`;
  }).join('');

  const count = cart.count();

  return `
  <header class="navbar" id="navbar">
    <div class="navbar__inner">
      <a class="logo" href="${homeHref}" aria-label="FoodFiesta home">
        <span class="logo__mark">${icon('utensilsCrossed', 24)}</span>
        <span class="logo__text">Food<span>Fiesta</span><span class="logo__tag">Eat. Enjoy. Repeat.</span></span>
      </a>

      <nav class="nav-links" aria-label="Main navigation">
        ${navLinks}
      </nav>

      <div class="navbar__actions">
        <button class="btn-icon" aria-label="Search" onclick="window.openSearch()">
          ${icon('search', 22)}
        </button>
        <a class="btn-icon navbar__cart" href="${base}cart.html" aria-label="Cart" id="cartLink">
          ${icon('cart', 22)}
          <span class="cart-badge" style="${count > 0 ? '' : 'display:none'}">${count}</span>
        </a>
        <button class="hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="navDrawer">
          ${icon('menu', 24)}
        </button>
      </div>
    </div>
  </header>

  <div class="drawer-overlay" id="drawerOverlay"></div>
  <aside class="drawer" id="navDrawer" aria-label="Mobile navigation">
    <div class="drawer__header">
      <a class="logo" href="${homeHref}">
        <span class="logo__mark">${icon('utensilsCrossed', 24)}</span>
        <span class="logo__text">Food<span>Fiesta</span></span>
      </a>
      <button class="modal__close drawer__close" aria-label="Close menu">
        ${icon('close', 20)}
      </button>
    </div>
    <nav class="drawer__nav" aria-label="Mobile">
      ${drawerLinks}
    </nav>
    <div class="drawer__footer">
      <a class="btn btn-outline btn-block" href="${base}cart.html">${icon('cart', 18)} View Cart</a>
      <a class="btn btn-primary btn-block" href="${base}restaurants.html">${icon('store', 18)} Browse Restaurants</a>
    </div>
  </aside>`;
}

export function renderFooter({ inPages } = {}) {
  const base = inPages ? '' : 'pages/';
  const homeHref = inPages ? '../index.html' : 'index.html';

  return `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a class="logo" href="${homeHref}">
            <span class="logo__mark">${icon('utensilsCrossed', 24)}</span>
            <span class="logo__text" style="color:#fff">Food<span>Fiesta</span></span>
          </a>
          <p class="footer__desc">Your favorite local restaurants, delivered fast and fresh. Discover delicious food, exclusive deals, and a community of food lovers — all in one place.</p>
          <div class="footer__socials">
            <a class="footer__social" href="#" aria-label="Facebook">${icon('facebook', 20)}</a>
            <a class="footer__social" href="#" aria-label="Twitter">${icon('twitter', 20)}</a>
            <a class="footer__social" href="#" aria-label="Instagram">${icon('instagram', 20)}</a>
            <a class="footer__social" href="#" aria-label="YouTube">${icon('youtube', 20)}</a>
          </div>
        </div>

        <div>
          <h4 class="footer__title">Quick Links</h4>
          <ul class="footer__list">
            <li><a href="${base}restaurants.html">Restaurants</a></li>
            <li><a href="${base}offers.html">Deals & Offers</a></li>
            <li><a href="${base}community.html">Community Reviews</a></li>
            <li><a href="${base}cart.html">Your Cart</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer__title">Contact</h4>
          <div class="footer__contact-item">${icon('mapPin', 18)}<span>24 Marina Blvd, San Francisco, CA 94123</span></div>
          <div class="footer__contact-item">${icon('phone', 18)}<span>+1 (415) 555-0182</span></div>
          <div class="footer__contact-item">${icon('mail', 18)}<span>hello@foodfiesta.com</span></div>
          <div class="footer__contact-item">${icon('clock', 18)}<span>Open daily 8 AM – 12 AM</span></div>
        </div>

        <div>
          <h4 class="footer__title">Newsletter</h4>
          <p class="footer__desc" style="margin-top:0;margin-bottom:var(--sp-2)">Get the best deals and new restaurant updates in your inbox.</p>
          <form class="footer__newsletter" id="footerNewsletter">
            <input class="input" type="email" name="email" placeholder="Your email" aria-label="Email address" required />
            <button class="btn btn-primary" type="submit" aria-label="Subscribe">${icon('send', 18)}</button>
          </form>
        </div>
      </div>

      <div class="footer__bottom">
        <span>© 2026 FoodFiesta. Crafted with care. All rights reserved.</span>
        <div class="footer__bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>`;
}
