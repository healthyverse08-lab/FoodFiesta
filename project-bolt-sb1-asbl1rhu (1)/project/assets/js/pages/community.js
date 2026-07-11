/**
 * Community Reviews Page
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var renderStars = FF.renderStars;
  var formatDate = FF.formatDate;
  var store = FF.store;
  var toast = FF.toast;
  var initReveal = FF.initReveal;
  var debounce = FF.debounce;
  var SEED_REVIEWS = FF.SEED_REVIEWS;
  var RESTAURANTS = FF.RESTAURANTS;
  var FOODS = FF.FOODS;
  var CATEGORIES = FF.CATEGORIES;

  var feedState = { restaurant: 'all', cuisine: 'all', rating: 0, sort: 'recent', search: '', visible: 6 };
  var allReviews = [];
  var host;
  var selectedRating = 0;

  function getReviews() {
    var userReviews = (store.get('communityData', { reviews: [] }).reviews) || [];
    return userReviews.concat(SEED_REVIEWS);
  }

  function getStats() {
    var reviews = getReviews();
    var restaurantIds = {};
    reviews.forEach(function (r) { restaurantIds[r.restaurantId] = true; });
    var avgRating = reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length;
    return {
      avgRating: avgRating.toFixed(1),
      restaurantsReviewed: Object.keys(restaurantIds).length,
      totalReviews: reviews.length,
      happyCustomers: 12500 + reviews.length,
    };
  }

  function getLeaderboard() {
    var reviews = getReviews();
    return RESTAURANTS.map(function (r) {
      var rReviews = reviews.filter(function (rv) { return rv.restaurantId === r.id; });
      var avgRating = rReviews.length ? rReviews.reduce(function (s, rv) { return s + rv.rating; }, 0) / rReviews.length : r.rating;
      return { id: r.id, logo: r.logo, name: r.name, cuisine: r.cuisine, avgRating: avgRating, reviewCount: r.reviewCount + rReviews.length };
    }).sort(function (a, b) { return b.avgRating - a.avgRating; }).slice(0, 10);
  }

  function getPopularDishes() {
    var reviews = getReviews();
    return FOODS.map(function (f) {
      var fReviews = reviews.filter(function (rv) { return rv.foodId === f.id; });
      var avgRating = fReviews.length ? fReviews.reduce(function (s, rv) { return s + rv.rating; }, 0) / fReviews.length : f.rating;
      return Object.assign({}, f, { avgRating: avgRating, reviewCount: fReviews.length + Math.floor(f.rating * 50) });
    }).sort(function (a, b) { return b.avgRating - a.avgRating || b.reviewCount - a.reviewCount; }).slice(0, 4);
  }

  function renderReviewCard(r) {
    var restaurant = RESTAURANTS.find(function (x) { return x.id === r.restaurantId; });
    var food = FOODS.find(function (f) { return f.id === r.foodId; }) || {};
    return '<article class="review-card" data-restaurant="' + r.restaurantId + '" data-cuisine="' + r.cuisine + '" data-rating="' + r.rating + '">' +
      '<div class="review-card__head"><div class="avatar"><img src="' + r.avatar + '" alt="' + r.name + '" loading="lazy" /></div>' +
      '<div style="flex:1"><div class="review-card__name">' + r.name + (r.verified ? ' <span class="badge badge-success" style="margin-left:4px">' + icon('check', 12) + ' Verified</span>' : '') + '</div>' +
      '<div class="review-card__date">' + formatDate(r.date) + '</div></div>' + renderStars(r.rating, 16) + '</div>' +
      '<div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:var(--sp-2)"><span class="badge badge-muted">' + (restaurant ? restaurant.name : r.restaurant) + '</span>' +
      (food.name ? '<span class="badge badge-primary">' + food.name + '</span>' : '') + '</div>' +
      (food.image ? '<div class="gallery-item" style="aspect-ratio:16/9;margin-bottom:var(--sp-3);border-radius:var(--radius-md)"><img src="' + food.image + '" alt="' + (food.name || r.food) + '" loading="lazy" /></div>' : '') +
      '<p class="review-card__text">' + r.text + '</p>' +
      '<div class="review-card__actions">' +
        '<button class="review-card__action" data-review-id="' + r.id + '" data-type="helpful" onclick="window.interactReview(\'' + r.id + '\', \'helpful\', this)" aria-label="Mark helpful">' + icon('thumbsUp', 18) + ' Helpful (' + r.helpful + ')</button>' +
        '<button class="review-card__action" data-review-id="' + r.id + '" data-type="like" onclick="window.interactReview(\'' + r.id + '\', \'like\', this)" aria-label="Like">' + icon('heart', 18) + ' Like (' + r.likes + ')</button>' +
        '<button class="review-card__action" onclick="window.shareReview()" aria-label="Share">' + icon('share', 18) + ' Share</button>' +
      '</div></article>';
  }

  function filterReviews() {
    var list = allReviews.slice();
    if (feedState.search) {
      var q = feedState.search.toLowerCase();
      list = list.filter(function (r) {
        var restaurant = RESTAURANTS.find(function (x) { return x.id === r.restaurantId; });
        return r.text.toLowerCase().indexOf(q) > -1 || r.name.toLowerCase().indexOf(q) > -1 ||
          (restaurant ? restaurant.name : r.restaurant).toLowerCase().indexOf(q) > -1 ||
          (r.food || '').toLowerCase().indexOf(q) > -1;
      });
    }
    if (feedState.restaurant !== 'all') list = list.filter(function (r) { return r.restaurantId === feedState.restaurant; });
    if (feedState.cuisine !== 'all') list = list.filter(function (r) { return r.cuisine === feedState.cuisine; });
    if (feedState.rating > 0) list = list.filter(function (r) { return r.rating >= feedState.rating; });
    switch (feedState.sort) {
      case 'highest': list.sort(function (a, b) { return b.rating - a.rating; }); break;
      case 'lowest': list.sort(function (a, b) { return a.rating - b.rating; }); break;
      case 'helpful': list.sort(function (a, b) { return b.helpful - a.helpful; }); break;
      case 'liked': list.sort(function (a, b) { return b.likes - a.likes; }); break;
      default: list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    }
    return list;
  }

  function renderFeed() {
    var filtered = filterReviews();
    var feedEl = $('#reviewFeed');
    if (!feedEl) return;
    if (filtered.length === 0) {
      feedEl.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="empty-state"><div class="empty-state__icon">' + icon('message', 64) + '</div><h3 class="empty-state__title">No reviews found</h3><p class="empty-state__text">Try adjusting your filters or search query.</p></div></div>';
      return;
    }
    var visible = filtered.slice(0, feedState.visible);
    feedEl.innerHTML = visible.map(renderReviewCard).join('');
    var loadMore = $('#loadMore');
    if (loadMore) loadMore.style.display = filtered.length > feedState.visible ? 'inline-flex' : 'none';
  }

  function render() {
    allReviews = getReviews();
    var stats = getStats();
    var leaderboard = getLeaderboard();
    var popularDishes = getPopularDishes();
    var galleryImages = FOODS.slice(0, 8).map(function (f) { return f.image; });

    var highlights = [
      { icon: 'award', title: 'Most Reviewed', stat: 'Himalayan Momo House', desc: '1,567 reviews and counting' },
      { icon: 'star', title: 'Highest Rated Dish', stat: 'Chicken Momo', desc: '4.9 average rating' },
      { icon: 'truck', title: 'Fastest Delivery', stat: 'Urban Café', desc: '15 min average' },
      { icon: 'trending', title: 'Top Trending', stat: 'BBQ Mixed Platter', desc: '+42% orders this week' },
      { icon: 'heart', title: 'Community Favorite', stat: 'Bella Italia', desc: 'Most favorited restaurant' },
      { icon: 'cake', title: 'Most Loved Dessert', stat: 'Chocolate Cake', desc: '4.8 rating from 893 reviews' },
    ];

    host.innerHTML =
    '<section class="section-sm"><div class="container">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">Community Reviews</span></nav>' +
      '<div class="community-hero reveal" style="margin-top:var(--sp-4)"><div>' +
        '<span class="badge badge-primary" style="margin-bottom:var(--sp-3)">' + icon('star', 14) + ' Community</span>' +
        '<h1 style="font-size:var(--fs-h1);font-weight:700">Community Reviews</h1>' +
        '<p class="text-muted" style="margin-top:var(--sp-3);max-width:520px">See what food lovers are saying about their favorite restaurants. Share your experiences, discover new spots, and help others find great food.</p>' +
      '</div><div class="search-input search-input--lg" style="max-width:480px"><span class="search-icon">' + icon('search', 22) + '</span>' +
      '<input class="input input--lg" type="search" id="communitySearch" placeholder="Search reviews, restaurants or dishes..." aria-label="Search community" /></div></div>' +
    '</div></section>' +

    '<section class="section-sm" style="padding-top:0"><div class="container"><div class="grid grid-cols-2 grid-md-cols-4" style="gap:var(--sp-4)">' +
      '<div class="stat-card reveal"><div class="stat-card__num" data-count="' + stats.avgRating + '">' + stats.avgRating + '</div><div class="stat-card__label">Average Rating</div></div>' +
      '<div class="stat-card reveal"><div class="stat-card__num" data-count="' + stats.restaurantsReviewed + '">' + stats.restaurantsReviewed + '</div><div class="stat-card__label">Restaurants Reviewed</div></div>' +
      '<div class="stat-card reveal"><div class="stat-card__num" data-count="' + stats.totalReviews + '">' + stats.totalReviews + '</div><div class="stat-card__label">Customer Reviews</div></div>' +
      '<div class="stat-card reveal"><div class="stat-card__num" data-count="' + stats.happyCustomers + '">' + stats.happyCustomers.toLocaleString() + '</div><div class="stat-card__label">Happy Customers</div></div>' +
    '</div></div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Review Feed</h2><p class="section-header__subtitle">Real reviews from the FoodFiesta community.</p></div></div>' +
      '<div class="flex items-center gap-3 mb-5" style="flex-wrap:wrap">' +
        '<select class="select" id="filterRestaurant" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Filter by restaurant"><option value="all">All Restaurants</option>' + RESTAURANTS.map(function (r) { return '<option value="' + r.id + '">' + r.name + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="filterCuisine" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Filter by cuisine"><option value="all">All Cuisines</option>' + CATEGORIES.map(function (c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="filterRating" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Filter by rating"><option value="0">All Ratings</option><option value="5">5 Stars</option><option value="4">4+ Stars</option><option value="3">3+ Stars</option></select>' +
        '<select class="select" id="filterSort" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Sort reviews"><option value="recent">Most Recent</option><option value="highest">Highest Rated</option><option value="lowest">Lowest Rated</option><option value="helpful">Most Helpful</option><option value="liked">Most Liked</option></select>' +
      '</div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2" id="reviewFeed" style="gap:var(--sp-4)"></div>' +
      '<div class="text-center" style="margin-top:var(--sp-6)"><button class="btn btn-outline btn-lg" id="loadMore">' + icon('chevronDown', 18) + ' Load More Reviews</button></div>' +
    '</div></section>' +

    '<section class="section" style="background:var(--color-bg-alt)"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Top Rated Restaurants</h2><p class="section-header__subtitle">Ranked by community reviews and ratings.</p></div></div>' +
      '<div class="card reveal" id="leaderboard">' +
        leaderboard.map(function (r, i) {
          return '<div class="leader-row" onclick="window.goRestaurant(\'' + r.id + '\')" style="cursor:pointer"><div class="leader-row__rank ' + (i < 3 ? 'leader-row__rank--top' : '') + '">' + (i + 1) + '</div>' +
            '<div class="leader-row__logo"><img src="' + r.logo + '" alt="' + r.name + '" loading="lazy" /></div>' +
            '<div class="leader-row__info"><div class="leader-row__name">' + r.name + '</div><div class="leader-row__cuisine">' + r.cuisine + '</div></div>' +
            '<div style="text-align:right"><div class="rating-badge" style="background:transparent;padding:0">' + icon('star', 14) + ' ' + r.avgRating.toFixed(1) + '</div><div class="fs-caption text-tertiary">' + r.reviewCount.toLocaleString() + ' reviews</div></div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Popular Dishes</h2><p class="section-header__subtitle">Top-rated dishes loved by the community.</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:24px">' + popularDishes.map(FF.foodCard).join('') + '</div>' +
    '</div></section>' +

    '<section class="section" style="background:var(--color-bg-alt)"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Customer Food Gallery</h2><p class="section-header__subtitle">Food photos shared by our community.</p></div></div>' +
      '<div class="gallery-grid reveal" id="communityGallery">' +
        galleryImages.map(function (g, i) { return '<div class="gallery-item" onclick="window.openCommunityLightbox(' + i + ')" data-img="' + g + '"><img src="' + g + '" alt="Food photo ' + (i + 1) + '" loading="lazy" /></div>'; }).join('') +
      '</div>' +
    '</div></section>' +

    '<section class="section" id="share"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Share Your Experience</h2><p class="section-header__subtitle">Help others discover great food. Your review appears instantly.</p></div></div>' +
      '<div class="card card-body reveal" style="max-width:640px;margin:0 auto"><form id="reviewForm">' +
        '<div class="grid grid-cols-1 grid-md-cols-2" style="gap:0 var(--sp-4)">' +
          '<div class="field"><label class="field-label">Restaurant<span class="req">*</span></label><select class="select" name="restaurant" required><option value="">Select a restaurant</option>' + RESTAURANTS.map(function (r) { return '<option value="' + r.id + '">' + r.name + '</option>'; }).join('') + '</select><span class="field-error">' + icon('alert', 14) + ' Please select a restaurant.</span></div>' +
          '<div class="field"><label class="field-label">Dish<span class="req">*</span></label><select class="select" name="food" required><option value="">Select a dish</option>' + FOODS.map(function (f) { return '<option value="' + f.id + '">' + f.name + '</option>'; }).join('') + '</select><span class="field-error">' + icon('alert', 14) + ' Please select a dish.</span></div>' +
        '</div>' +
        '<div class="field"><label class="field-label">Your Rating<span class="req">*</span></label><div class="stars-input" id="reviewStars">' + [5, 4, 3, 2, 1].map(function (n) { return '<button type="button" class="star-btn" data-rating="' + n + '" aria-label="' + n + ' stars">' + icon('star', 32) + '</button>'; }).join('') + '</div><input type="hidden" name="rating" id="ratingValue" required /></div>' +
        '<div class="field"><label class="field-label">Your Review<span class="req">*</span></label><textarea class="textarea" name="text" required placeholder="Tell us about your experience..."></textarea><span class="field-error">' + icon('alert', 14) + ' Please write your review.</span></div>' +
        '<div class="field"><label class="field-label">Your Name<span class="req">*</span></label><input class="input" type="text" name="name" required placeholder="Your name" /><span class="field-error">' + icon('alert', 14) + ' Please enter your name.</span></div>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">' + icon('send', 18) + ' Submit Review</button>' +
      '</form></div>' +
    '</div></section>' +

    '<section class="section" style="background:var(--color-bg-alt)"><div class="container">' +
      '<div class="section-header reveal"><div><h2 class="section-header__title">Community Highlights</h2><p class="section-header__subtitle">Achievements and milestones from our food community.</p></div></div>' +
      '<div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-3" style="gap:var(--sp-4)">' +
        highlights.map(function (h) {
          return '<div class="feature-card reveal" style="text-align:left;flex-direction:row;align-items:center;gap:var(--sp-4)"><div class="feature-card__icon" style="margin:0">' + icon(h.icon, 28) + '</div>' +
            '<div><div class="fs-caption text-tertiary" style="text-transform:uppercase;letter-spacing:0.04em">' + h.title + '</div><div class="fw-semibold fs-body-lg" style="margin:2px 0">' + h.stat + '</div><div class="fs-small text-muted">' + h.desc + '</div></div></div>';
        }).join('') +
      '</div>' +
    '</div></section>';
  }

  function bindEvents() {
    var search = $('#communitySearch');
    if (search) search.addEventListener('input', debounce(function () {
      feedState.search = search.value.trim();
      feedState.visible = 6;
      renderFeed();
    }, 200));

    $('#filterRestaurant')?.addEventListener('change', function (e) { feedState.restaurant = e.target.value; feedState.visible = 6; renderFeed(); });
    $('#filterCuisine')?.addEventListener('change', function (e) { feedState.cuisine = e.target.value; feedState.visible = 6; renderFeed(); });
    $('#filterRating')?.addEventListener('change', function (e) { feedState.rating = parseInt(e.target.value); feedState.visible = 6; renderFeed(); });
    $('#filterSort')?.addEventListener('change', function (e) { feedState.sort = e.target.value; feedState.visible = 6; renderFeed(); });
    $('#loadMore')?.addEventListener('click', function () { feedState.visible += 6; renderFeed(); });

    var starBtns = $$('#reviewStars .star-btn');
    starBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedRating = parseInt(btn.dataset.rating);
        $('#ratingValue').value = selectedRating;
        starBtns.forEach(function (b) { b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= selectedRating); });
      });
      btn.addEventListener('mouseenter', function () {
        var hover = parseInt(btn.dataset.rating);
        starBtns.forEach(function (b) { b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= hover); });
      });
    });
    var reviewStars = $('#reviewStars');
    if (reviewStars) reviewStars.addEventListener('mouseleave', function () {
      starBtns.forEach(function (b) { b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= selectedRating); });
    });

    var reviewForm = $('#reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var valid = true;
      $$('.field', form).forEach(function (f) { f.classList.remove('is-error'); });
      var restaurant = form.querySelector('[name="restaurant"]');
      var food = form.querySelector('[name="food"]');
      var rating = form.querySelector('[name="rating"]');
      var text = form.querySelector('[name="text"]');
      var name = form.querySelector('[name="name"]');
      if (!restaurant.value) { restaurant.closest('.field').classList.add('is-error'); valid = false; }
      if (!food.value) { food.closest('.field').classList.add('is-error'); valid = false; }
      if (!rating.value) { toast({ title: 'Please rate', message: 'Select a star rating.', type: 'error' }); valid = false; }
      if (!text.value.trim()) { text.closest('.field').classList.add('is-error'); valid = false; }
      if (!name.value.trim()) { name.closest('.field').classList.add('is-error'); valid = false; }
      if (!valid) return;

      var r = RESTAURANTS.find(function (x) { return x.id === restaurant.value; });
      var f = FOODS.find(function (x) { return x.id === food.value; });
      var newReview = {
        id: 'ur-' + Date.now(),
        name: name.value.trim(),
        avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=120',
        restaurant: r.name, restaurantId: r.id,
        food: f.name, foodId: f.id, cuisine: f.category,
        rating: selectedRating, date: new Date().toISOString().split('T')[0],
        text: text.value.trim(), likes: 0, helpful: 0, verified: false,
      };
      var data = store.get('communityData', { reviews: [] });
      data.reviews.unshift(newReview);
      store.set('communityData', data);
      toast({ title: 'Review submitted!', message: 'Thanks for sharing your experience.', type: 'success' });
      form.reset();
      selectedRating = 0;
      starBtns.forEach(function (b) { b.classList.remove('is-selected'); });
      render();
      bindEvents();
      renderFeed();
      $('#reviewFeed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window._communityGalleryImages = $$('#communityGallery .gallery-item').map(function (item) { return item.dataset.img; });
  }

  function animateStats() {
    $$('.stat-card__num[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var isFloat = target % 1 !== 0;
      var isComma = el.textContent.indexOf(',') > -1;
      var duration = 1500;
      var startTime = performance.now();
      function tick(now) {
        var progress = Math.min((now - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = target * eased;
        if (isComma) el.textContent = Math.round(current).toLocaleString();
        else el.textContent = isFloat ? current.toFixed(1) : Math.round(current);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function init() {
    host = $('#communityContent');
    render();
    bindEvents();
    renderFeed();
    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('is-visible');
      });
    });
    setTimeout(animateStats, 300);
  }

  window.interactReview = function (id, type, btn) {
    var data = store.get('communityData', { reviews: [], interactions: {} });
    data.interactions = data.interactions || {};
    var key = id + ':' + type;
    var wasActive = data.interactions[key];
    data.interactions[key] = !wasActive;
    store.set('communityData', data);
    var allR = getReviews();
    var review = allR.find(function (r) { return r.id === id; });
    if (!review) return;
    var baseCount = type === 'helpful' ? review.helpful : review.likes;
    var newCount = wasActive ? baseCount - 1 : baseCount + 1;
    btn.classList.toggle('is-liked', !wasActive);
    var label = type === 'helpful' ? 'Helpful' : 'Like';
    btn.innerHTML = icon(type === 'helpful' ? 'thumbsUp' : 'heart', 18) + ' ' + label + ' (' + newCount + ')';
  };

  window.shareReview = function () {
    toast({ title: 'Link copied', message: 'Review link copied to clipboard.', type: 'success', duration: 2200 });
  };

  window.openCommunityLightbox = function (index) {
    var imgs = window._communityGalleryImages || [];
    if (!imgs[index]) return;
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = '<button class="lightbox__close" aria-label="Close">' + icon('close', 24) + '</button><img src="' + imgs[index] + '" alt="Food photo" />';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    var close = function () { overlay.remove(); document.body.style.overflow = ''; };
    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
