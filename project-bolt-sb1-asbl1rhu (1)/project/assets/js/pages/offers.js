/**
 * Deals & Promotions Page
 * Promotional hero, featured deals carousel, limited-time offers, coupon center, restaurant promotions,
 * flash sale, seasonal campaigns, personalized recommendations, newsletter banner.
 */

import { OFFERS, COUPONS, RESTAURANTS, FOODS, IMAGES } from '../data.js';
import { offerCard, restaurantCard, couponCard, sectionHeader, button } from '../components.js';
import { $, $$, formatPrice, copyToClipboard, toast, store, recentlyViewed, favorites, initReveal, startCountdown } from '../utils.js';
import { icon as iconFn } from '../icons.js';

function render() {
  const host = $('#offersContent');
  const promoRestaurants = RESTAURANTS.filter(r => r.offer).slice(0, 4);
  const flashSaleItems = FOODS.slice(0, 4).map(f => ({
    ...f,
    originalPrice: f.price * 1.3,
    discountedPrice: f.price,
    savings: 25,
  }));

  // Personalized: use recently viewed or favorites, fallback to popular
  const rv = recentlyViewed.get();
  const fav = favorites.get();
  const personalizedIds = [...rv.restaurants, ...rv.foods, ...fav.restaurants, ...fav.foods];
  let personalized = [];
  personalizedIds.forEach(id => {
    const r = RESTAURANTS.find(x => x.id === id);
    if (r && personalized.length < 3) personalized.push(r);
  });
  if (personalized.length < 3) {
    RESTAURANTS.sort((a, b) => b.rating - a.rating).forEach(r => {
      if (personalized.length < 3 && !personalized.includes(r)) personalized.push(r);
    });
  }

  const campaigns = [
    { title: 'Summer Specials', desc: 'Fresh flavors and cool treats for the season.', image: IMAGES.promo1, badge: 'Summer' },
    { title: 'Festival Feast', desc: 'Celebrate with big family combo meals.', image: IMAGES.promo3, badge: 'Festival' },
    { title: 'Weekend Combo', desc: 'Save more every Friday to Sunday.', image: IMAGES.promo4, badge: 'Weekend' },
    { title: 'Healthy Eating Week', desc: 'Wholesome bowls, salads, and smoothies.', image: IMAGES.healthy, badge: 'Healthy' },
  ];

  // Flash sale end: 8 hours from page load
  const flashEnd = Date.now() + 8 * 3600000;

  host.innerHTML = `
  <!-- Hero banner -->
  <section class="section-sm">
    <div class="container">
      ${breadcrumb([{ label: 'Home', href: '../index.html' }, { label: 'Deals & Promotions', href: '#' }])}
      <div class="offers-hero reveal" style="margin-top:var(--sp-4)">
        <div class="offers-hero__content">
          <span class="badge badge-accent" style="margin-bottom:var(--sp-3)">${iconFn('flame', 14)} Limited time</span>
          <h1 style="font-size:var(--fs-h1);font-weight:700">Save more with exclusive offers</h1>
          <p class="text-muted" style="margin-top:var(--sp-3);max-width:480px">From free delivery to buy-one-get-one deals, FoodFiesta brings you the best promotions from your favorite restaurants.</p>
          <div class="flex gap-3" style="margin-top:var(--sp-5);flex-wrap:wrap">
            <a class="btn btn-primary btn-lg" href="#coupons">View Coupons</a>
            <a class="btn btn-outline btn-lg" href="#flash-sale">Flash Sale</a>
          </div>
        </div>
        <div class="offers-hero__image">
          <img src="${IMAGES.promoBanner}" alt="Promotional food banner" loading="eager" />
        </div>
      </div>
    </div>
  </section>

  <!-- Featured deals carousel -->
  <section class="section">
    <div class="container">
      ${sectionHeader({ title: 'Featured Deals', subtitle: "Don't miss these limited-time offers." })}
      <div class="carousel reveal" id="dealsCarousel">
        <div class="carousel__track" id="carouselTrack">
          ${OFFERS.map(o => `
            <div class="carousel__slide">
              <div class="offer-card" style="max-width:900px;margin:0 auto">
                <div class="offer-card__image" style="aspect-ratio:21/9"><span class="offer-badge">${o.badge}</span><img src="${o.image}" alt="${o.title}" /></div>
                <div class="offer-card__body" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4)">
                  <div>
                    <h3 class="offer-card__title" style="font-size:var(--fs-h3)">${o.title}</h3>
                    <p class="offer-card__text">${o.desc}</p>
                  </div>
                  ${button({ label: 'Order Now', variant: 'primary', size: 'lg', icon: 'arrowRight', href: 'restaurants.html' })}
                </div>
              </div>
            </div>`).join('')}
        </div>
        <button class="carousel__arrow carousel__arrow--prev" id="carouselPrev" aria-label="Previous slide">${iconFn('chevronLeft', 24)}</button>
        <button class="carousel__arrow carousel__arrow--next" id="carouselNext" aria-label="Next slide">${iconFn('chevronRight', 24)}</button>
        <div class="carousel__dots" id="carouselDots"></div>
      </div>
    </div>
  </section>

  <!-- Coupon center -->
  <section class="section" id="coupons">
    <div class="container">
      ${sectionHeader({ title: 'Coupon Center', subtitle: 'Copy a code and apply it at checkout.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:var(--sp-4)">
        ${COUPONS.map(c => couponCard(c)).join('')}
      </div>
    </div>
  </section>

  <!-- Restaurant promotions -->
  <section class="section">
    <div class="container">
      ${sectionHeader({ title: 'Restaurant Promotions', subtitle: 'Restaurants with active deals near you.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:24px">
        ${promoRestaurants.map(r => restaurantCard(r)).join('')}
      </div>
    </div>
  </section>

  <!-- Flash sale -->
  <section class="section" id="flash-sale" style="background:var(--color-bg-alt)">
    <div class="container">
      <div class="flex items-center justify-between gap-4 mb-5" style="flex-wrap:wrap">
        <div>
          <h2 class="section-header__title" style="font-size:var(--fs-h2)">${iconFn('flame', 28)} Flash Sale</h2>
          <p class="text-muted" style="margin-top:var(--sp-2)">Hurry! These deals end soon.</p>
        </div>
        <div class="countdown" id="flashCountdown"></div>
      </div>
      <div class="grid grid-cols-1 grid-md-cols-2" style="gap:var(--sp-4)" id="flashSaleGrid">
        ${flashSaleItems.map(f => `
          <div class="flash-card">
            <div class="flash-card__image"><img src="${f.image}" alt="${f.name}" loading="lazy" /></div>
            <div class="flash-card__body">
              <div class="flash-card__name">${f.name}</div>
              <div class="fs-caption text-tertiary">${f.restaurant}</div>
              <div class="flash-card__price">
                <span class="price-tag">${formatPrice(f.discountedPrice)}</span>
                <span class="price-tag"><span class="strike">${formatPrice(f.originalPrice)}</span></span>
                <span class="flash-card__save">-${f.savings}%</span>
              </div>
              <button class="btn btn-primary btn-sm" style="margin-top:var(--sp-2);align-self:flex-start" onclick="window.quickAddCart('${f.id}', this)">${iconFn('plus', 16)} Quick Add</button>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Seasonal campaigns -->
  <section class="section">
    <div class="container">
      ${sectionHeader({ title: 'Seasonal Campaigns', subtitle: 'Curated collections for every occasion.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:var(--sp-4)">
        ${campaigns.map(c => `
          <article class="offer-card reveal">
            <div class="offer-card__image"><span class="offer-badge">${c.badge}</span><img src="${c.image}" alt="${c.title}" loading="lazy" /></div>
            <div class="offer-card__body">
              <h3 class="offer-card__title">${c.title}</h3>
              <p class="offer-card__text">${c.desc}</p>
              <a class="btn btn-text" href="restaurants.html" style="padding-left:0">Explore ${iconFn('arrowRight', 16)}</a>
            </div>
          </article>`).join('')}
      </div>
    </div>
  </section>

  <!-- Personalized recommendations -->
  <section class="section" style="background:var(--color-bg-alt)">
    <div class="container">
      ${sectionHeader({ title: 'Recommended For You', subtitle: personalizedIds.length > 0 ? 'Based on your recent activity.' : 'Popular restaurants loved by our community.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-3" style="gap:24px">
        ${personalized.map(r => restaurantCard(r)).join('')}
      </div>
    </div>
  </section>

  <!-- Newsletter banner -->
  <section class="section">
    <div class="container">
      <div class="newsletter-banner reveal">
        <div class="newsletter-banner__content">
          <h2>Never miss a deal</h2>
          <p>Subscribe for exclusive offers and seasonal promotions.</p>
        </div>
        <form class="newsletter-banner__form" id="offersNewsletter">
          <div class="search-input search-input--lg">
            <span class="search-icon">${iconFn('mail', 22)}</span>
            <input class="input input--lg" type="email" name="email" placeholder="Enter your email" required />
            <button class="btn btn-primary" type="submit">Subscribe</button>
          </div>
        </form>
      </div>
    </div>
  </section>`;

  initReveal();
  requestAnimationFrame(() => $$('.reveal:not(.is-visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('is-visible');
  }));

  // Carousel
  setupCarousel();

  // Flash sale countdown
  const cdEl = $('#flashCountdown');
  if (cdEl) {
    startCountdown(flashEnd, (h, m, s) => {
      cdEl.innerHTML = `
        <div class="countdown__unit"><div class="countdown__num">${String(h).padStart(2,'0')}</div><div class="countdown__label">Hrs</div></div>
        <div class="countdown__unit"><div class="countdown__num">${String(m).padStart(2,'0')}</div><div class="countdown__label">Min</div></div>
        <div class="countdown__unit"><div class="countdown__num">${String(s).padStart(2,'0')}</div><div class="countdown__label">Sec</div></div>`;
    });
  }

  // Newsletter
  const newsForm = $('#offersNewsletter');
  newsForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = newsForm.querySelector('input').value.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Subscribed!', message: 'You\'ll be the first to know about new deals.', type: 'success' });
      newsForm.reset();
    }
  });
}

import { breadcrumb } from '../components.js';

let carouselIdx = 0;
let carouselTimer;

function setupCarousel() {
  const track = $('#carouselTrack');
  const dots = $('#carouselDots');
  if (!track) return;
  const slides = $$('.carousel__slide', track);
  const total = slides.length;
  if (total <= 1) return;

  // Dots
  if (dots) {
    dots.innerHTML = Array.from({ length: total }, (_, i) => `<button class="carousel__dot ${i === 0 ? 'is-active' : ''}" data-idx="${i}" aria-label="Go to slide ${i+1}"></button>`).join('');
    $$('.carousel__dot', dots).forEach(d => d.addEventListener('click', () => goToSlide(parseInt(d.dataset.idx))));
  }

  $('#carouselPrev')?.addEventListener('click', () => goToSlide(carouselIdx - 1));
  $('#carouselNext')?.addEventListener('click', () => goToSlide(carouselIdx + 1));

  // Auto play
  carouselTimer = setInterval(() => goToSlide(carouselIdx + 1), 5000);

  // Pause on hover
  $('#dealsCarousel')?.addEventListener('mouseenter', () => clearInterval(carouselTimer));
  $('#dealsCarousel')?.addEventListener('mouseleave', () => { carouselTimer = setInterval(() => goToSlide(carouselIdx + 1), 5000); });
}

function goToSlide(idx) {
  const track = $('#carouselTrack');
  if (!track) return;
  const total = $$('.carousel__slide', track).length;
  carouselIdx = (idx + total) % total;
  track.style.transform = `translateX(-${carouselIdx * 100}%)`;
  $$('.carousel__dot').forEach((d, i) => d.classList.toggle('is-active', i === carouselIdx));
}

function init() {
  render();
}

document.addEventListener('DOMContentLoaded', init);
