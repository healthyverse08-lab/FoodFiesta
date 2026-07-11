/* FoodFiesta — Home Page Script */
(function() {
  var FF = FoodFiesta;

  function restaurantCard(r) {
    var isFav = FF.favorites.hasRestaurant(r.id);
    var statusCls = r.open ? 'status-open' : 'status-closed';
    var statusText = r.open ? 'Open' : 'Closed';
    var priceLevel = '$'.repeat(r.priceLevel);
    var favIcon = isFav ? FF.icon('heart').replace('<path', '<path fill="currentColor"') : FF.icon('heart');
    return '<article class="restaurant-card clickable" data-restaurant="' + r.id + '" tabindex="0" onclick="window.goRestaurant(\'' + r.id + '\')" role="link" aria-label="' + r.name + '">' +
      '<div class="restaurant-card__cover">' +
        (r.offer ? '<span class="offer-badge">' + r.offer + '</span>' : '') +
        '<button class="fav-btn ' + (isFav ? 'is-active' : '') + '" data-fav-restaurant="' + r.id + '" aria-label="' + (isFav ? 'Remove from' : 'Add to') + ' favorites" onclick="event.stopPropagation(); window.toggleFavRestaurant(\'' + r.id + '\', this)">' + favIcon + '</button>' +
        '<img src="' + r.cover + '" alt="' + r.name + ' cover" loading="lazy" />' +
        '<div class="restaurant-card__logo"><img src="' + r.logo + '" alt="' + r.name + ' logo" loading="lazy" /></div>' +
      '</div>' +
      '<div class="restaurant-card__body">' +
        '<h3 class="restaurant-card__name">' + r.name + '</h3>' +
        '<p class="restaurant-card__cuisine">' + r.cuisine + '</p>' +
        '<div class="restaurant-card__meta">' +
          '<span class="rating-badge">' + FF.icon('star', 14) + ' ' + r.rating + '</span>' +
          '<span class="dot"></span><span>' + r.deliveryTime + ' min</span>' +
          '<span class="dot"></span><span>' + priceLevel + '</span>' +
        '</div>' +
        '<div class="restaurant-card__footer">' +
          '<span class="status-badge ' + statusCls + '">' + statusText + '</span>' +
          '<span>' + (r.deliveryFee === 0 ? 'Free Delivery' : FF.formatPrice(r.deliveryFee) + ' delivery') + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function foodCard(f) {
    var isFav = FF.favorites.hasFood(f.id);
    var favIcon = isFav ? FF.icon('heart').replace('<path', '<path fill="currentColor"') : FF.icon('heart');
    var dietBadge = f.veg ? '<span class="diet-badge diet-veg"><span class="dot"></span>Veg</span>' : '<span class="diet-badge diet-nonveg"><span class="dot"></span>Non-Veg</span>';
    var chefBadge = f.chefChoice ? '<span class="offer-badge" style="left:auto;right:64px;background:var(--color-accent);color:var(--text-on-accent)">' + FF.icon('flame', 12) + ' Chef\'s Choice</span>' : '';
    return '<article class="food-card clickable" data-food="' + f.id + '" tabindex="0" onclick="window.goFood(\'' + f.id + '\')" role="link" aria-label="' + f.name + ' from ' + f.restaurant + '">' +
      '<div class="food-card__image">' +
        chefBadge +
        '<button class="fav-btn ' + (isFav ? 'is-active' : '') + '" data-fav-food="' + f.id + '" aria-label="' + (isFav ? 'Remove from' : 'Add to') + ' favorites" onclick="event.stopPropagation(); window.toggleFavFood(\'' + f.id + '\', this)">' + favIcon + '</button>' +
        '<img src="' + f.image + '" alt="' + f.name + '" loading="lazy" />' +
      '</div>' +
      '<div class="food-card__body">' +
        '<div class="flex items-center gap-2" style="flex-wrap:wrap">' + dietBadge + '<span class="rating-badge">' + FF.icon('star', 14) + ' ' + f.rating + '</span></div>' +
        '<h3 class="food-card__name">' + f.name + '</h3>' +
        '<p class="food-card__restaurant">' + f.restaurant + '</p>' +
        '<div class="food-card__footer">' +
          '<span class="food-card__price">' + FF.formatPrice(f.price) + '</span>' +
          '<button class="food-card__add" aria-label="Add ' + f.name + ' to cart" onclick="event.stopPropagation(); window.quickAddCart(\'' + f.id + '\', this)">' + FF.icon('plus', 20) + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function offerCard(offer) {
    return '<article class="offer-card reveal">' +
      '<div class="offer-card__image"><span class="offer-badge">' + offer.badge + '</span><img src="' + offer.image + '" alt="' + offer.title + '" loading="lazy" /></div>' +
      '<div class="offer-card__body">' +
        '<h3 class="offer-card__title">' + offer.title + '</h3>' +
        '<p class="offer-card__text">' + offer.desc + '</p>' +
        '<a class="btn btn-primary btn-sm" href="pages/offers.html">' + FF.icon('arrowRight', 18) + ' Order Now</a>' +
      '</div>' +
    '</article>';
  }

  function featureCard(f) {
    return '<article class="feature-card reveal">' +
      '<div class="feature-card__icon">' + FF.icon(f.icon, 32) + '</div>' +
      '<h3 class="feature-card__title">' + f.title + '</h3>' +
      '<p class="feature-card__text">' + f.desc + '</p>' +
    '</article>';
  }

  function testimonialCard(t) {
    return '<article class="testimonial-card reveal">' +
      FF.renderStars(t.rating) +
      '<p class="testimonial-card__quote">"' + t.text + '"</p>' +
      '<div class="testimonial-card__author">' +
        '<div class="avatar"><img src="' + t.avatar + '" alt="' + t.name + '" loading="lazy" /></div>' +
        '<div><div class="testimonial-card__name">' + t.name + '</div><div class="testimonial-card__meta">' + t.role + '</div></div>' +
      '</div>' +
    '</article>';
  }

  function categoryCard(cat) {
    return '<button class="cat-card" data-category="' + cat.id + '" onclick="window.goCategory(\'' + cat.id + '\')" aria-label="Browse ' + cat.name + '">' +
      '<div class="cat-card__icon"><img src="' + cat.image + '" alt="' + cat.name + '" loading="lazy" /></div>' +
      '<span class="cat-card__name">' + cat.name + '</span>' +
      '<span class="cat-card__count">' + cat.count + ' items</span>' +
    '</button>';
  }

  function init() {
    // Categories
    var catRow = FF.$('#categoriesRow');
    if (catRow) catRow.innerHTML = FF.CATEGORIES.map(categoryCard).join('');

    // Featured restaurants (first 8)
    var featGrid = FF.$('#featuredRestaurants');
    if (featGrid) featGrid.innerHTML = FF.RESTAURANTS.slice(0, 8).map(restaurantCard).join('');

    // Popular dishes (first 8)
    var dishGrid = FF.$('#popularDishes');
    if (dishGrid) dishGrid.innerHTML = FF.FOODS.slice(0, 8).map(foodCard).join('');

    // Offers (first 3)
    var offGrid = FF.$('#offersGrid');
    if (offGrid) offGrid.innerHTML = FF.OFFERS.slice(0, 3).map(offerCard).join('');

    // Features
    var feat2Grid = FF.$('#featuresGrid');
    if (feat2Grid) feat2Grid.innerHTML = FF.FEATURES.map(featureCard).join('');

    // Testimonials
    var testGrid = FF.$('#testimonialsGrid');
    if (testGrid) testGrid.innerHTML = FF.TESTIMONIALS.map(testimonialCard).join('');

    // Hero search
    var heroForm = FF.$('#heroSearchForm');
    if (heroForm) {
      heroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = heroForm.querySelector('input').value.trim();
        window.location.href = 'pages/restaurants.html' + (q ? '?q=' + encodeURIComponent(q) : '');
      });
    }

    // Home newsletter
    var homeNews = FF.$('#homeNewsletter');
    if (homeNews) {
      homeNews.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = homeNews.querySelector('input').value.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          FF.toast({ title: 'Subscribed!', message: 'Welcome to the FoodFiesta newsletter.', type: 'success' });
          homeNews.reset();
        }
      });
    }

    // Re-trigger reveal for injected content
    requestAnimationFrame(function() {
      FF.$$('.reveal:not(.is-visible)').forEach(function(el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('is-visible');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
