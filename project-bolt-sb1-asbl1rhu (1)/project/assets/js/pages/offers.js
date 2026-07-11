/**
 * Deals & Promotions Page
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var formatPrice = FF.formatPrice;
  var toast = FF.toast;
  var store = FF.store;
  var recentlyViewed = FF.recentlyViewed;
  var favorites = FF.favorites;
  var initReveal = FF.initReveal;
  var startCountdown = FF.startCountdown;
  var OFFERS = FF.OFFERS;
  var COUPONS = FF.COUPONS;
  var RESTAURANTS = FF.RESTAURANTS;
  var FOODS = FF.FOODS;
  var IMAGES = FF.IMAGES;

  var carouselIdx = 0;
  var carouselTimer = null;

  function render() {
    var host = $('#offersContent');
    var promoRestaurants = RESTAURANTS.filter(function (r) { return r.offer; }).slice(0, 4);
    var flashSaleItems = FOODS.slice(0, 4).map(function (f) {
      return { id: f.id, name: f.name, restaurant: f.restaurant, image: f.image, price: f.price, originalPrice: f.price * 1.3, discountedPrice: f.price, savings: 25 };
    });

    var rv = recentlyViewed.get();
    var fav = favorites.get();
    var personalizedIds = (rv.restaurants || []).concat(rv.foods || []).concat(fav.restaurants || []).concat(fav.foods || []);
    var personalized = [];
    personalizedIds.forEach(function (id) {
      var r = RESTAURANTS.find(function (x) { return x.id === id; });
      if (r && personalized.length < 3) personalized.push(r);
    });
    if (personalized.length < 3) {
      RESTAURANTS.slice().sort(function (a, b) { return b.rating - a.rating; }).forEach(function (r) {
        if (personalized.length < 3 && personalized.indexOf(r) === -1) personalized.push(r);
      });
    }

    var campaigns = [
      { title: 'Summer Specials', desc: 'Fresh flavors and cool treats for the season.', image: IMAGES.promo1, badge: 'Summer' },
      { title: 'Festival Feast', desc: 'Celebrate with big family combo meals.', image: IMAGES.promo3, badge: 'Festival' },
      { title: 'Weekend Combo', desc: 'Save more every Friday to Sunday.', image: IMAGES.promo4, badge: 'Weekend' },
      { title: 'Healthy Eating Week', desc: 'Wholesome bowls, salads, and smoothies.', image: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=600', badge: 'Healthy' },
    ];

    var flashEnd = Date.now() + 8 * 3600000;

    host.innerHTML =
    '<section class="section-sm"><div class="container">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">Deals & Promotions</span></nav>' +
      '<div class="offers-hero reveal" style="margin-top:var(--sp-4)">' +
        '<div class="offers-hero__content">' +
          '<span class="badge badge-accent" style="margin-bottom:var(--sp-3)">' + icon('flame', 14) + ' Limited time</span>' +
          '<h1 style="font-size:var(--fs-h1);font-weight:700">Save more with exclusive offers</h1>' +
          '<p class="text-muted" style="margin-top:var(--sp-3);max-width:480px">From free delivery to buy-one-get-one deals, FoodFiesta brings you the best promotions from your favorite restaurants.</p>' +
          '<div class="flex gap-3" style="margin-top:var(--sp-5);flex-wrap:wrap">' +
            '<a class="btn btn-primary btn-lg" href="#coupons">View Coupons</a>' +
            '<a class="btn btn-outline btn-lg" href="#flash-sale">Flash Sale</a>' +
          '</div>' +
        '</div>' +
        '<div class="offers-hero__image"><img src="' + IMAGES.promoBanner + '" alt="Promotional food banner" loading="eager" /></div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Featured Deals</h2><p class="section-header__subtitle">Don\'t miss these limited-time offers.</p></div></div>' +
      '<div class="carousel reveal" id="dealsCarousel">' +
        '<div class="carousel__track" id="carouselTrack">' +
          OFFERS.map(function (o) {
            return '<div class="carousel__slide"><div class="offer-card" style="max-width:900px;margin:0 auto">' +
              '<div class="offer-card__image" style="aspect-ratio:21/9"><span class="offer-badge">' + o.badge + '</span><img src="' + o.image + '" alt="' + o.title + '" /></div>' +
              '<div class="offer-card__body" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4)">' +
                '<div><h3 class="offer-card__title" style="font-size:var(--fs-h3)">' + o.title + '</h3><p class="offer-card__text">' + o.desc + '</p></div>' +
                '<a class="btn btn-primary btn-lg" href="restaurants.html">' + icon('arrowRight') + '<span>Order Now</span></a>' +
              '</div>' +
            '</div></div>';
          }).join('') +
        '</div>' +
        '<button class="carousel__arrow carousel__arrow--prev" id="carouselPrev" aria-label="Previous slide">' + icon('chevronLeft', 24) + '</button>' +
        '<button class="carousel__arrow carousel__arrow--next" id="carouselNext" aria-label="Next slide">' + icon('chevronRight', 24) + '</button>' +
        '<div class="carousel__dots" id="carouselDots"></div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section" id="coupons"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Coupon Center</h2><p class="section-header__subtitle">Copy a code and apply it at checkout.</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:var(--sp-4)">' +
        COUPONS.map(FF.couponCard).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Restaurant Promotions</h2><p class="section-header__subtitle">Restaurants with active deals near you.</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:24px">' +
        promoRestaurants.map(FF.restaurantCard).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section" id="flash-sale" style="background:var(--color-bg-alt)"><div class="container">' +
      '<div class="flex items-center justify-between gap-4 mb-5" style="flex-wrap:wrap">' +
        '<div><h2 class="section-header__title" style="font-size:var(--fs-h2)">' + icon('flame', 28) + ' Flash Sale</h2><p class="text-muted" style="margin-top:var(--sp-2)">Hurry! These deals end soon.</p></div>' +
        '<div class="countdown" id="flashCountdown"></div>' +
      '</div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2" style="gap:var(--sp-4)" id="flashSaleGrid">' +
        flashSaleItems.map(function (f) {
          return '<div class="flash-card"><div class="flash-card__image"><img src="' + f.image + '" alt="' + f.name + '" loading="lazy" /></div>' +
            '<div class="flash-card__body"><div class="flash-card__name">' + f.name + '</div><div class="fs-caption text-tertiary">' + f.restaurant + '</div>' +
            '<div class="flash-card__price"><span class="price-tag">' + formatPrice(f.discountedPrice) + '</span><span class="price-tag"><span class="strike">' + formatPrice(f.originalPrice) + '</span></span><span class="flash-card__save">-' + f.savings + '%</span></div>' +
            '<button class="btn btn-primary btn-sm" style="margin-top:var(--sp-2);align-self:flex-start" onclick="window.quickAddCart(\'' + f.id + '\', this)">' + icon('plus', 16) + ' Quick Add</button>' +
          '</div></div>';
        }).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Seasonal Campaigns</h2><p class="section-header__subtitle">Curated collections for every occasion.</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:var(--sp-4)">' +
        campaigns.map(function (c) {
          return '<article class="offer-card reveal"><div class="offer-card__image"><span class="offer-badge">' + c.badge + '</span><img src="' + c.image + '" alt="' + c.title + '" loading="lazy" /></div>' +
            '<div class="offer-card__body"><h3 class="offer-card__title">' + c.title + '</h3><p class="offer-card__text">' + c.desc + '</p>' +
            '<a class="btn btn-text" href="restaurants.html" style="padding-left:0">Explore ' + icon('arrowRight', 16) + '</a></div></article>';
        }).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section" style="background:var(--color-bg-alt)"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Recommended For You</h2><p class="section-header__subtitle">' + (personalizedIds.length > 0 ? 'Based on your recent activity.' : 'Popular restaurants loved by our community.') + '</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-3" style="gap:24px">' +
        personalized.map(FF.restaurantCard).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="newsletter-banner reveal"><div class="newsletter-banner__content"><h2>Never miss a deal</h2><p>Subscribe for exclusive offers and seasonal promotions.</p></div>' +
      '<form class="newsletter-banner__form" id="offersNewsletter"><div class="search-input search-input--lg"><span class="search-icon">' + icon('mail', 22) + '</span>' +
      '<input class="input input--lg" type="email" name="email" placeholder="Enter your email" required /><button class="btn btn-primary" type="submit">Subscribe</button></div></form></div>' +
    '</div></section>';

    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('is-visible');
      });
    });

    setupCarousel();

    var cdEl = $('#flashCountdown');
    if (cdEl) {
      startCountdown(flashEnd, function (h, m, s) {
        cdEl.innerHTML = '<div class="countdown__unit"><div class="countdown__num">' + String(h).padStart(2, '0') + '</div><div class="countdown__label">Hrs</div></div>' +
          '<div class="countdown__unit"><div class="countdown__num">' + String(m).padStart(2, '0') + '</div><div class="countdown__label">Min</div></div>' +
          '<div class="countdown__unit"><div class="countdown__num">' + String(s).padStart(2, '0') + '</div><div class="countdown__label">Sec</div></div>';
      });
    }

    var newsForm = $('#offersNewsletter');
    if (newsForm) newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = newsForm.querySelector('input').value.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({ title: 'Subscribed!', message: 'You\'ll be the first to know about new deals.', type: 'success' });
        newsForm.reset();
      }
    });
  }

  function setupCarousel() {
    var track = $('#carouselTrack');
    var dots = $('#carouselDots');
    if (!track) return;
    var slides = $$('.carousel__slide', track);
    var total = slides.length;
    if (total <= 1) return;

    if (dots) {
      dots.innerHTML = Array.from({ length: total }, function (_, i) {
        return '<button class="carousel__dot ' + (i === 0 ? 'is-active' : '') + '" data-idx="' + i + '" aria-label="Go to slide ' + (i + 1) + '"></button>';
      }).join('');
      $$('.carousel__dot', dots).forEach(function (d) {
        d.addEventListener('click', function () { goToSlide(parseInt(d.dataset.idx)); });
      });
    }

    $('#carouselPrev')?.addEventListener('click', function () { goToSlide(carouselIdx - 1); });
    $('#carouselNext')?.addEventListener('click', function () { goToSlide(carouselIdx + 1); });

    carouselTimer = setInterval(function () { goToSlide(carouselIdx + 1); }, 5000);

    var carousel = $('#dealsCarousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', function () { clearInterval(carouselTimer); });
      carousel.addEventListener('mouseleave', function () { carouselTimer = setInterval(function () { goToSlide(carouselIdx + 1); }, 5000); });
    }
  }

  function goToSlide(idx) {
    var track = $('#carouselTrack');
    if (!track) return;
    var total = $$('.carousel__slide', track).length;
    carouselIdx = (idx + total) % total;
    track.style.transform = 'translateX(-' + (carouselIdx * 100) + '%)';
    $$('.carousel__dot').forEach(function (d, i) { d.classList.toggle('is-active', i === carouselIdx); });
  }

  function init() {
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
