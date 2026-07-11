/**
 * Restaurant Details Page
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var renderStars = FF.renderStars;
  var formatPrice = FF.formatPrice;
  var formatDate = FF.formatDate;
  var getParam = FF.getParam;
  var cart = FF.cart;
  var favorites = FF.favorites;
  var toast = FF.toast;
  var recentlyViewed = FF.recentlyViewed;
  var initReveal = FF.initReveal;
  var getRestaurant = FF.getRestaurant;
  var getFoodsByRestaurant = FF.getFoodsByRestaurant;
  var RESTAURANTS = FF.RESTAURANTS;
  var SEED_REVIEWS = FF.SEED_REVIEWS;

  function buildReviewCards(reviews, sortFn) {
    var list = reviews.slice();
    if (sortFn === 'recent') list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    if (sortFn === 'highest') list.sort(function (a, b) { return b.rating - a.rating; });
    if (sortFn === 'lowest') list.sort(function (a, b) { return a.rating - b.rating; });
    return list.slice(0, 5).map(function (r) {
      return '<article class="review-card"><div class="review-card__head"><div class="avatar"><img src="' + r.avatar + '" alt="' + r.name + '" loading="lazy" /></div>' +
        '<div style="flex:1"><div class="review-card__name">' + r.name + (r.verified ? ' <span class="badge badge-success" style="margin-left:4px">' + icon('check', 12) + ' Verified</span>' : '') + '</div>' +
        '<div class="review-card__date">' + formatDate(r.date) + '</div></div>' + renderStars(r.rating, 16) + '</div>' +
        '<p class="review-card__text">' + r.text + '</p>' +
        '<div class="review-card__actions"><button class="review-card__action" aria-label="Mark helpful">' + icon('thumbsUp', 18) + ' Helpful (' + r.helpful + ')</button>' +
        '<button class="review-card__action" aria-label="Like">' + icon('heart', 18) + ' Like (' + r.likes + ')</button></div></article>';
    }).join('');
  }

  function renderRestaurant(r) {
    var foods = getFoodsByRestaurant(r.id);
    var reviews = SEED_REVIEWS.filter(function (rv) { return rv.restaurantId === r.id; });
    var isFav = favorites.hasRestaurant(r.id);

    var menuCats = [];
    foods.forEach(function (f) { if (menuCats.indexOf(f.category) === -1) menuCats.push(f.category); });
    var catLabels = { pizza: 'Pizza', burger: 'Burgers', momo: 'Momos', biryani: 'Biryani', sushi: 'Sushi', healthy: 'Healthy', desserts: 'Desserts', drinks: 'Drinks' };

    var gallery = [r.cover].concat(foods.slice(0, 5).map(function (f) { return f.image; })).filter(Boolean);

    var ratingBreakdown = [5, 4, 3, 2, 1].map(function (stars) {
      var count = reviews.filter(function (rv) { return Math.round(rv.rating) === stars; }).length;
      var pct = reviews.length ? (count / reviews.length) * 100 : 0;
      return '<div class="rating-bar"><span class="rating-bar__label">' + stars + '★</span><div class="rating-bar__track"><div class="rating-bar__fill" style="width:' + pct + '%"></div></div><span class="rating-bar__count">' + count + '</span></div>';
    }).join('');

    var menuTabsHtml = '<button class="tab is-active" data-cat="all">All</button>' +
      menuCats.map(function (c) { return '<button class="tab" data-cat="' + c + '">' + (catLabels[c] || c) + '</button>'; }).join('');

    return (
    '<section class="section-sm" style="padding-bottom:0"><div class="container">' +
      '<div id="crumbs" style="margin-bottom:var(--sp-4)"></div>' +
      '<div class="restaurant-hero">' +
        '<div class="restaurant-hero__cover"><img src="' + r.cover + '" alt="' + r.name + ' cover" />' +
          '<button class="fav-btn ' + (isFav ? 'is-active' : '') + '" style="top:var(--sp-4);right:var(--sp-4);background:rgba(255,255,255,0.92)" data-fav-restaurant="' + r.id + '" onclick="window.toggleFavRestaurant(\'' + r.id + '\', this)" aria-label="Toggle favorite">' + icon('heart', 20) + '</button>' +
          '<button class="btn btn-light" style="position:absolute;top:var(--sp-4);right:64px" onclick="window.shareRestaurant()" aria-label="Share">' + icon('share', 18) + ' Share</button>' +
        '</div>' +
        '<div class="restaurant-hero__info"><div class="restaurant-hero__logo"><img src="' + r.logo + '" alt="' + r.name + ' logo" /></div>' +
          '<div class="restaurant-hero__head"><div style="flex:1"><h1 style="font-size:var(--fs-h1);font-weight:700">' + r.name + '</h1><p class="text-muted" style="margin-top:4px">' + r.cuisine + '</p></div>' +
          '<span class="status-badge ' + (r.open ? 'status-open' : 'status-closed') + '">' + (r.open ? 'Open Now' : 'Closed') + '</span></div>' +
          '<div class="restaurant-hero__meta"><span class="rating-badge">' + icon('star', 14) + ' ' + r.rating + ' <span style="color:var(--text-tertiary);font-weight:400">(' + r.reviewCount + ' reviews)</span></span>' +
          '<span class="restaurant-hero__meta-item">' + icon('clock', 16) + ' ' + r.deliveryTime + ' min</span>' +
          '<span class="restaurant-hero__meta-item">' + icon('truck', 16) + ' ' + (r.deliveryFee === 0 ? 'Free delivery' : formatPrice(r.deliveryFee) + ' fee') + '</span>' +
          '<span class="restaurant-hero__meta-item">' + '$'.repeat(r.priceLevel) + '</span></div>' +
          (r.offer ? '<div class="restaurant-hero__offer"><span class="offer-badge" style="position:static">' + r.offer + '</span></div>' : '') +
          '<div class="flex gap-3" style="flex-wrap:wrap;margin-top:var(--sp-4)"><a class="btn btn-primary" href="#menu">' + icon('utensils', 18) + ' Browse Menu</a>' +
          '<button class="btn btn-outline" onclick="window.shareRestaurant()">' + icon('share', 18) + ' Share</button></div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section-sm"><div class="container"><div class="grid grid-cols-1 grid-md-cols-3" style="gap:var(--sp-5)">' +
      '<div class="card card-body reveal"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">About</h3><p class="text-muted">' + r.description + '</p></div>' +
      '<div class="card card-body reveal"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">Information</h3>' +
        '<div style="display:flex;flex-direction:column;gap:var(--sp-3);font-size:var(--fs-small);color:var(--text-secondary)">' +
        '<div class="flex items-center gap-3">' + icon('mapPin', 18) + ' <span>' + r.address + '</span></div>' +
        '<div class="flex items-center gap-3">' + icon('phone', 18) + ' <span>' + r.phone + '</span></div>' +
        '<div class="flex items-center gap-3">' + icon('clock', 18) + ' <span>' + r.hours + '</span></div>' +
        '<div class="flex items-center gap-3">' + icon('truck', 18) + ' <span>' + r.deliveryTime + ' min estimated delivery</span></div></div></div>' +
      '<div class="card card-body reveal"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">Services & Payment</h3>' +
        '<div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:var(--sp-3)">' + r.services.map(function (s) { return '<span class="badge badge-muted">' + icon('check', 12) + ' ' + s + '</span>'; }).join('') + '</div>' +
        '<div class="flex items-center gap-2" style="flex-wrap:wrap">' + r.payment.map(function (p) { return '<span class="badge badge-primary">' + p + '</span>'; }).join('') + '</div></div>' +
    '</div></div></section>' +

    '<section class="section-sm"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Gallery</h2><p class="section-header__subtitle">A look at the food and ambiance.</p></div></div>' +
      '<div class="gallery-grid reveal" id="galleryGrid">' + gallery.map(function (g, i) { return '<div class="gallery-item" onclick="window.openLightbox(' + i + ')" data-img="' + g + '"><img src="' + g + '" alt="Gallery image ' + (i + 1) + '" loading="lazy" /></div>'; }).join('') + '</div>' +
    '</div></section>' +

    '<section class="section" id="menu"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Menu</h2><p class="section-header__subtitle">Explore the full menu and add items to your cart.</p></div></div>' +
      '<div class="split-2"><div><div class="menu-tabs reveal"><div class="tabs" id="menuTabs">' + menuTabsHtml + '</div></div>' +
      '<div id="menuItems" class="grid grid-cols-1 grid-md-cols-2" style="gap:var(--sp-4)"></div></div>' +
      '<aside class="cart-preview" id="cartPreview"></aside></div>' +
    '</div></section>' +

    '<section class="section-sm"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Reviews</h2><p class="section-header__subtitle">What customers say about ' + r.name + '.</p></div></div>' +
      '<div class="split-2"><div class="card card-body reveal" style="text-align:center"><div style="font-size:var(--fs-display);font-family:var(--font-heading);font-weight:700;color:var(--text-primary);line-height:1">' + r.rating + '</div>' + renderStars(r.rating, 24) + '<p class="text-muted fs-small" style="margin-top:var(--sp-2)">' + r.reviewCount + ' reviews</p></div>' +
      '<div class="card card-body reveal"><h4 class="fw-semibold" style="margin-bottom:var(--sp-4)">Rating Breakdown</h4><div class="rating-breakdown">' + ratingBreakdown + '</div></div></div>' +
      '<div class="flex items-center justify-between gap-3 mb-5" style="margin-top:var(--sp-6);flex-wrap:wrap"><h3 class="fs-body-lg fw-semibold">Customer Reviews</h3>' +
      '<select class="select" id="reviewSort" style="width:auto;min-height:40px;padding-block:var(--sp-2)"><option value="recent">Most Recent</option><option value="highest">Highest Rated</option><option value="lowest">Lowest Rated</option></select></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2" id="reviewList" style="gap:var(--sp-4)"></div>' +
    '</div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Similar Restaurants</h2><p class="section-header__subtitle">You might also like these.</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" id="similarGrid" style="gap:24px"></div>' +
    '</div></section>' +

    '<section class="section-sm"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Location</h2><p class="section-header__subtitle">' + r.address + '</p></div></div>' +
      '<div class="card reveal" style="overflow:hidden"><iframe src="https://www.google.com/maps?q=' + encodeURIComponent(r.address) + '&output=embed" width="100%" height="360" style="border:0;display:block" loading="lazy" title="' + r.name + ' location"></iframe></div>' +
    '</div></section>' +

    '<div class="floating-cart" id="floatingCart"></div>'
    );
  }

  function renderMenuItems(foods, cat) {
    cat = cat || 'all';
    var list = cat === 'all' ? foods : foods.filter(function (f) { return f.category === cat; });
    return list.map(function (f) {
      var isFav = favorites.hasFood(f.id);
      var dietBadge = f.veg ? '<span class="diet-badge diet-veg"><span class="dot"></span>Veg</span>' : '<span class="diet-badge diet-nonveg"><span class="dot"></span>Non-Veg</span>';
      return '<article class="food-card" style="flex-direction:row"><div class="food-card__image" style="width:120px;flex-shrink:0;aspect-ratio:1" onclick="window.goFood(\'' + f.id + '\')">' +
        '<button class="fav-btn ' + (isFav ? 'is-active' : '') + '" style="top:4px;right:4px;width:30px;height:30px" data-fav-food="' + f.id + '" onclick="event.stopPropagation();window.toggleFavFood(\'' + f.id + '\', this)" aria-label="Toggle favorite">' + icon('heart', 16) + '</button>' +
        '<img src="' + f.image + '" alt="' + f.name + '" loading="lazy" /></div>' +
        '<div class="food-card__body" style="padding:var(--sp-3)"><div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:4px">' + dietBadge + (f.chefChoice ? '<span class="badge badge-accent">' + icon('flame', 12) + ' Chef\'s Choice</span>' : '') + '</div>' +
        '<h3 class="food-card__name" style="font-size:var(--fs-body);cursor:pointer" onclick="window.goFood(\'' + f.id + '\')">' + f.name + '</h3>' +
        '<p class="fs-caption text-tertiary" style="margin-top:2px">' + f.desc + '</p>' +
        '<div class="flex items-center justify-between" style="margin-top:var(--sp-2)"><span class="food-card__price">' + formatPrice(f.price) + '</span>' +
        '<div class="flex items-center gap-2"><span class="rating-badge" style="padding:2px 6px">' + icon('star', 12) + ' ' + f.rating + '</span>' +
        '<button class="food-card__add" style="width:36px;height:36px" onclick="window.quickAddCart(\'' + f.id + '\', this)" aria-label="Add ' + f.name + ' to cart">' + icon('plus', 18) + '</button></div></div></div></article>';
    }).join('');
  }

  function renderCartPreview() {
    var items = cart.get();
    var preview = $('#cartPreview');
    var floating = $('#floatingCart');
    if (!preview) return;

    if (items.length === 0) {
      preview.innerHTML = '<div class="cart-preview__title">' + icon('cart', 20) + ' Your Cart</div>' +
        '<div class="empty-state" style="padding:var(--sp-5) 0"><div class="empty-state__icon" style="width:64px;height:64px">' + icon('cart', 64) + '</div>' +
        '<p class="text-muted fs-small" style="margin-top:var(--sp-2)">Your cart is empty. Add items from the menu to get started.</p></div>';
      if (floating) floating.classList.remove('is-visible');
      return;
    }

    var subtotal = cart.subtotal();
    var tax = subtotal * 0.08;
    var total = subtotal + tax;

    preview.innerHTML = '<div class="cart-preview__title">' + icon('cart', 20) + ' Your Cart (' + cart.count() + ')</div>' +
      items.map(function (i) {
        return '<div class="cart-preview__item"><span class="cart-preview__item-name">' + i.name + '</span><span class="cart-preview__item-qty">×' + i.qty + '</span><span class="cart-preview__item-price">' + formatPrice(i.price * i.qty) + '</span></div>';
      }).join('') +
      '<div class="cart-preview__summary"><div class="cart-preview__row"><span>Subtotal</span><span>' + formatPrice(subtotal) + '</span></div>' +
      '<div class="cart-preview__row"><span>Estimated tax</span><span>' + formatPrice(tax) + '</span></div>' +
      '<div class="cart-preview__row cart-preview__row--total"><span>Total</span><span>' + formatPrice(total) + '</span></div>' +
      '<a class="btn btn-primary btn-block" href="cart.html" style="margin-top:var(--sp-4)">' + icon('cart', 18) + ' View Cart</a></div>';

    if (floating) {
      floating.classList.add('is-visible');
      floating.innerHTML = '<span class="fw-semibold">' + cart.count() + ' item' + (cart.count() !== 1 ? 's' : '') + ' • ' + formatPrice(total) + '</span><a class="btn btn-primary btn-sm" href="cart.html">View Cart ' + icon('arrowRight', 16) + '</a>';
    }
  }

  function init() {
    var id = getParam('id');
    var r = getRestaurant(id);
    var host = $('#restaurantContent');
    if (!r) {
      host.innerHTML = '<div class="container section-lg"><div class="card"><div class="empty-state"><div class="empty-state__icon">' + icon('store', 96) + '</div><h3 class="empty-state__title">Restaurant not found</h3><p class="empty-state__text">This restaurant may no longer be available.</p><div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Browse Restaurants</a></div></div></div></div>';
      return;
    }
    recentlyViewed.addRestaurant(r.id);
    document.title = r.name + ' — FoodFiesta';

    host.innerHTML = renderRestaurant(r);

    // Breadcrumb
    var crumbs = $('#crumbs');
    if (crumbs) crumbs.innerHTML = '<a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><a href="restaurants.html">Restaurants</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">' + r.name + '</span>';

    var foods = getFoodsByRestaurant(r.id);
    $('#menuItems').innerHTML = renderMenuItems(foods, 'all');

    $$('#menuTabs .tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('#menuTabs .tab').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        $('#menuItems').innerHTML = renderMenuItems(foods, tab.dataset.cat);
      });
    });

    var reviewSort = $('#reviewSort');
    var renderReviews = function () { $('#reviewList').innerHTML = buildReviewCards(SEED_REVIEWS.filter(function (rv) { return rv.restaurantId === r.id; }), reviewSort.value); };
    renderReviews();
    if (reviewSort) reviewSort.addEventListener('change', renderReviews);

    var similar = RESTAURANTS.filter(function (x) { return x.id !== r.id && x.cuisines.some(function (c) { return r.cuisines.indexOf(c) > -1; }); }).slice(0, 4);
    $('#similarGrid').innerHTML = similar.map(FF.restaurantCard).join('');

    window._galleryImages = $$('#galleryGrid .gallery-item').map(function (item) { return item.dataset.img; });

    renderCartPreview();
    document.addEventListener('cart:change', renderCartPreview);

    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('is-visible');
      });
    });
  }

  window.openLightbox = function (index) {
    var imgs = window._galleryImages || [];
    if (!imgs[index]) return;
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = '<button class="lightbox__close" aria-label="Close">' + icon('close', 24) + '</button><img src="' + imgs[index] + '" alt="Gallery image" />';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    var close = function () { overlay.remove(); document.body.style.overflow = ''; };
    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  };

  window.shareRestaurant = function () {
    toast({ title: 'Link copied', message: 'Restaurant link copied to clipboard.', type: 'success', duration: 2200 });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
