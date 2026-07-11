/**
 * Food Details Page
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
  var getFood = FF.getFood;
  var getRestaurant = FF.getRestaurant;
  var FOODS = FF.FOODS;
  var SEED_REVIEWS = FF.SEED_REVIEWS;

  var currentFood = null;
  var state = { qty: 1, size: 'medium', spice: 'mild', toppings: {}, drink: null, dessert: null };

  var SIZE_PRICES = { small: 0, medium: 2, large: 4 };
  var TOPPING_PRICES = { 'Extra Cheese': 1.5, Mushrooms: 1, Chicken: 2, Olives: 0.75, 'Jalapeños': 0.5 };
  var DRINK_PRICES = { 'Coca-Cola': 1.99, Sprite: 1.99, Water: 0.99 };
  var DESSERT_PRICES = { Brownie: 3.49, 'Ice Cream': 2.99 };

  function calcTotal() {
    if (!currentFood) return 0;
    var total = currentFood.price;
    total += SIZE_PRICES[state.size] || 0;
    Object.keys(state.toppings).forEach(function (t) { if (state.toppings[t]) total += TOPPING_PRICES[t] || 0; });
    if (state.drink) total += DRINK_PRICES[state.drink] || 0;
    if (state.dessert) total += DESSERT_PRICES[state.dessert] || 0;
    return total * state.qty;
  }

  function render(f) {
    var r = getRestaurant(f.restaurantId);
    var reviews = SEED_REVIEWS.filter(function (rv) { return rv.foodId === f.id; });
    var similar = FOODS.filter(function (x) { return x.id !== f.id && x.category === f.category; }).slice(0, 4);
    var frequentlyBought = FOODS.filter(function (x) { return x.id !== f.id && x.restaurantId === f.restaurantId; }).slice(0, 4);
    var isFav = favorites.hasFood(f.id);

    var relatedImgs = FOODS.filter(function (x) { return x.restaurantId === f.restaurantId && x.id !== f.id; }).slice(0, 3).map(function (x) { return x.image; });
    var gallery = [f.image].concat(relatedImgs).slice(0, 4);

    var dietBadge = f.veg ? '<span class="diet-badge diet-veg"><span class="dot"></span>Veg</span>' : '<span class="diet-badge diet-nonveg"><span class="dot"></span>Non-Veg</span>';

    return (
    '<section class="section-sm"><div class="container">' +
      '<div id="crumbs" style="margin-bottom:var(--sp-4)"></div>' +
      '<div class="food-hero">' +
        '<div><div class="food-gallery__main" onclick="window.openFoodLightbox(0)"><img src="' + gallery[0] + '" alt="' + f.name + '" id="mainFoodImg" /></div>' +
        '<div class="food-gallery__thumbs">' + gallery.map(function (g, i) { return '<div class="food-gallery__thumb ' + (i === 0 ? 'is-active' : '') + '" onclick="window.switchFoodImage(' + i + ')" data-img="' + g + '"><img src="' + g + '" alt="' + f.name + ' view ' + (i + 1) + '" loading="lazy" /></div>'; }).join('') + '</div></div>' +
        '<div class="food-info"><div class="flex items-center gap-2" style="flex-wrap:wrap">' + dietBadge +
          (f.chefChoice ? '<span class="badge badge-accent">' + icon('flame', 14) + ' Chef\'s Choice</span>' : '') +
          '<span class="status-badge status-open">Available</span></div>' +
          '<h1 class="food-info__name" style="margin-top:var(--sp-3)">' + f.name + '</h1>' +
          '<p class="text-muted" style="margin-top:4px">From <a href="restaurant.html?id=' + r.id + '" style="font-weight:500">' + r.name + '</a> • ' + f.category.charAt(0).toUpperCase() + f.category.slice(1) + '</p>' +
          '<div class="food-info__meta">' + renderStars(f.rating, 16) + '<span>' + f.rating + ' (' + reviews.length + ' reviews)</span>' +
          '<span class="dot" style="width:3px;height:3px;border-radius:50%;background:var(--color-muted-400)"></span><span>' + icon('clock', 14) + ' ' + f.prepTime + ' min</span>' +
          '<span class="dot" style="width:3px;height:3px;border-radius:50%;background:var(--color-muted-400)"></span><span>' + icon('flame', 14) + ' ' + f.calories + ' cal</span></div>' +
          '<div class="food-info__price" id="foodPrice">' + formatPrice(f.price) + '</div>' +
          '<p class="text-muted" style="margin-top:var(--sp-4);line-height:var(--lh-loose)">' + f.desc + '</p>' +
          '<div class="customization-group"><div class="customization-group__title">Size <span class="text-tertiary fs-small">(choose one)</span></div>' +
          '<div class="customization-options" id="sizeOptions">' + ['small', 'medium', 'large'].map(function (s) { return '<button class="option-chip ' + (state.size === s ? 'is-selected' : '') + '" data-size="' + s + '" onclick="window.selectSize(\'' + s + '\')">' + s.charAt(0).toUpperCase() + s.slice(1) + (SIZE_PRICES[s] > 0 ? '<span class="option-chip__price">+' + formatPrice(SIZE_PRICES[s]) + '</span>' : '') + '</button>'; }).join('') + '</div></div>' +
          '<div class="customization-group"><div class="customization-group__title">Spice Level <span class="text-tertiary fs-small">(choose one)</span></div>' +
          '<div class="customization-options">' + ['mild', 'medium', 'hot'].map(function (s) { return '<button class="option-chip ' + (state.spice === s ? 'is-selected' : '') + '" data-spice="' + s + '" onclick="window.selectSpice(\'' + s + '\')">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>'; }).join('') + '</div></div>' +
          '<div class="customization-group"><div class="customization-group__title">Extra Toppings <span class="text-tertiary fs-small">(optional)</span></div>' +
          '<div class="customization-options">' + Object.keys(TOPPING_PRICES).map(function (t) { return '<button class="option-chip" data-topping="' + t + '" onclick="window.toggleTopping(\'' + t.replace(/'/g, "\\'") + '\', this)">' + t + '<span class="option-chip__price">+' + formatPrice(TOPPING_PRICES[t]) + '</span></button>'; }).join('') + '</div></div>' +
          '<div class="customization-group"><div class="customization-group__title">Add a Drink <span class="text-tertiary fs-small">(optional)</span></div>' +
          '<div class="customization-options">' + Object.keys(DRINK_PRICES).map(function (d) { return '<button class="option-chip" data-drink="' + d + '" onclick="window.selectDrink(\'' + d + '\', this)">' + d + '<span class="option-chip__price">+' + formatPrice(DRINK_PRICES[d]) + '</span></button>'; }).join('') + '</div></div>' +
          '<div class="customization-group"><div class="customization-group__title">Dessert Add-on <span class="text-tertiary fs-small">(optional)</span></div>' +
          '<div class="customization-options">' + Object.keys(DESSERT_PRICES).map(function (d) { return '<button class="option-chip" data-dessert="' + d + '" onclick="window.selectDessert(\'' + d + '\', this)">' + d + '<span class="option-chip__price">+' + formatPrice(DESSERT_PRICES[d]) + '</span></button>'; }).join('') + '</div></div>' +
          '<div class="flex items-center gap-3" style="margin-top:var(--sp-6);flex-wrap:wrap"><div class="qty qty--lg"><button class="qty__btn" onclick="window.changeQty(-1)" aria-label="Decrease quantity">' + icon('minus', 16) + '</button><span class="qty__value" id="qtyDisplay">' + state.qty + '</span><button class="qty__btn" onclick="window.changeQty(1)" aria-label="Increase quantity">' + icon('plus', 16) + '</button></div>' +
          '<button class="btn btn-outline btn-lg" data-fav-food="' + f.id + '" onclick="window.toggleFavFood(\'' + f.id + '\', this)" aria-label="Toggle favorite" style="' + (isFav ? 'color:var(--color-error);border-color:var(--color-error)' : '') + '">' + icon('heart', 18) + ' ' + (isFav ? 'Saved' : 'Save') + '</button>' +
          '<button class="btn btn-outline btn-lg" onclick="window.shareFood()">' + icon('share', 18) + ' Share</button></div>' +
          '<div class="card card-body" style="margin-top:var(--sp-5);display:flex;align-items:center;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap;background:var(--color-primary-50);border:1px solid var(--color-primary-100)"><div><div class="fs-caption text-muted">Total for ' + state.qty + ' item' + (state.qty !== 1 ? 's' : '') + '</div><div style="font-family:var(--font-heading);font-weight:700;font-size:var(--fs-h3)" id="totalDisplay">' + formatPrice(calcTotal()) + '</div></div>' +
          '<button class="btn btn-primary btn-lg" onclick="window.addFoodToCart()">' + icon('cart', 18) + ' Add to Cart</button></div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section-sm"><div class="container"><div class="section-header reveal"><div><h2 class="section-header__title">Ingredients</h2><p class="section-header__subtitle">Everything that goes into your order.</p></div></div>' +
    '<div class="ingredient-chips reveal">' + f.ingredients.map(function (i) { return '<span class="ingredient-chip">' + icon('check', 14) + ' ' + i + '</span>'; }).join('') + '</div></div></section>' +

    '<section class="section-sm"><div class="container"><div class="section-header reveal"><div><h2 class="section-header__title">Nutrition</h2><p class="section-header__subtitle">Per serving nutritional information.</p></div></div>' +
    '<div class="nutrition-grid reveal"><div class="nutrition-item"><div class="nutrition-item__value">' + f.calories + '</div><div class="nutrition-item__label">Calories</div></div>' +
    '<div class="nutrition-item"><div class="nutrition-item__value">' + f.protein + 'g</div><div class="nutrition-item__label">Protein</div></div>' +
    '<div class="nutrition-item"><div class="nutrition-item__value">' + f.carbs + 'g</div><div class="nutrition-item__label">Carbs</div></div>' +
    '<div class="nutrition-item"><div class="nutrition-item__value">' + f.fat + 'g</div><div class="nutrition-item__label">Fat</div></div>' +
    '<div class="nutrition-item"><div class="nutrition-item__value">' + f.fiber + 'g</div><div class="nutrition-item__label">Fiber</div></div>' +
    '<div class="nutrition-item"><div class="nutrition-item__value">' + f.sodium + 'mg</div><div class="nutrition-item__label">Sodium</div></div></div></div></section>' +

    (reviews.length ? '<section class="section-sm"><div class="container"><div class="section-header reveal"><div><h2 class="section-header__title">Customer Reviews</h2><p class="section-header__subtitle">' + reviews.length + ' review' + (reviews.length !== 1 ? 's' : '') + ' for this dish.</p></div></div>' +
    '<div class="grid grid-cols-1 grid-md-cols-2" id="foodReviewList" style="gap:var(--sp-4)">' + reviews.map(function (rv) {
      return '<article class="review-card"><div class="review-card__head"><div class="avatar"><img src="' + rv.avatar + '" alt="' + rv.name + '" loading="lazy" /></div><div style="flex:1"><div class="review-card__name">' + rv.name + '</div><div class="review-card__date">' + formatDate(rv.date) + '</div></div>' + renderStars(rv.rating, 16) + '</div><p class="review-card__text">' + rv.text + '</p></article>';
    }).join('') + '</div></div></section>' : '') +

    (frequentlyBought.length ? '<section class="section-sm"><div class="container"><div class="section-header reveal"><div><h2 class="section-header__title">Frequently Bought Together</h2><p class="section-header__subtitle">Customers often add these too.</p></div></div><div class="grid grid-cols-2 grid-md-cols-4" id="frequentlyBought" style="gap:var(--sp-4)"></div></div></section>' : '') +

    (similar.length ? '<section class="section-sm"><div class="container"><div class="section-header reveal"><div><h2 class="section-header__title">Similar Dishes</h2><p class="section-header__subtitle">You might also enjoy these.</p></div></div><div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" id="similarDishes" style="gap:24px"></div></div></section>' : '')
    );
  }

  function updateTotal() {
    var total = calcTotal();
    var td = $('#totalDisplay'); if (td) td.textContent = formatPrice(total);
    var qd = $('#qtyDisplay'); if (qd) qd.textContent = state.qty;
  }

  function init() {
    var id = getParam('id');
    var f = getFood(id);
    var host = $('#foodContent');
    if (!f) {
      host.innerHTML = '<div class="container section-lg"><div class="card"><div class="empty-state"><h3 class="empty-state__title">Dish not found</h3><p class="empty-state__text">This item may no longer be available.</p><div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Browse Restaurants</a></div></div></div></div>';
      return;
    }
    currentFood = f;
    recentlyViewed.addFood(f.id);
    document.title = f.name + ' — FoodFiesta';

    host.innerHTML = render(f);

    // Breadcrumb
    var r = getRestaurant(f.restaurantId);
    var crumbs = $('#crumbs');
    if (crumbs) crumbs.innerHTML = '<a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><a href="restaurants.html">Restaurants</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><a href="restaurant.html?id=' + r.id + '">' + r.name + '</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">' + f.name + '</span>';

    var fb = FOODS.filter(function (x) { return x.id !== f.id && x.restaurantId === f.restaurantId; }).slice(0, 4);
    var sim = FOODS.filter(function (x) { return x.id !== f.id && x.category === f.category; }).slice(0, 4);
    var fbEl = $('#frequentlyBought'); if (fbEl) fbEl.innerHTML = fb.map(FF.foodCard).join('');
    var simEl = $('#similarDishes'); if (simEl) simEl.innerHTML = sim.map(FF.foodCard).join('');

    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('is-visible');
      });
    });
  }

  window.selectSize = function (s) {
    state.size = s;
    $$('#sizeOptions .option-chip').forEach(function (c) { c.classList.toggle('is-selected', c.dataset.size === s); });
    updateTotal();
  };
  window.selectSpice = function (s) {
    state.spice = s;
    $$('[data-spice]').forEach(function (c) { c.classList.toggle('is-selected', c.dataset.spice === s); });
  };
  window.toggleTopping = function (t, btn) {
    if (state.toppings[t]) { state.toppings[t] = false; btn.classList.remove('is-selected'); }
    else { state.toppings[t] = true; btn.classList.add('is-selected'); }
    updateTotal();
  };
  window.selectDrink = function (d, btn) {
    if (state.drink === d) { state.drink = null; btn.classList.remove('is-selected'); }
    else { state.drink = d; $$('[data-drink]').forEach(function (c) { c.classList.remove('is-selected'); }); btn.classList.add('is-selected'); }
    updateTotal();
  };
  window.selectDessert = function (d, btn) {
    if (state.dessert === d) { state.dessert = null; btn.classList.remove('is-selected'); }
    else { state.dessert = d; $$('[data-dessert]').forEach(function (c) { c.classList.remove('is-selected'); }); btn.classList.add('is-selected'); }
    updateTotal();
  };
  window.changeQty = function (delta) {
    state.qty = Math.max(1, state.qty + delta);
    updateTotal();
  };
  window.addFoodToCart = function () {
    if (!currentFood) return;
    var customs = {
      size: state.size, spice: state.spice,
      toppings: Object.keys(state.toppings).filter(function (t) { return state.toppings[t]; }),
      drink: state.drink, dessert: state.dessert,
    };
    var adjustedFood = Object.assign({}, currentFood, { price: calcTotal() / state.qty });
    cart.add(adjustedFood, state.qty, customs);
    toast({ title: 'Added to cart', message: state.qty + ' × ' + currentFood.name + ' added.', type: 'success' });
  };
  window.switchFoodImage = function (i) {
    var imgs = $$('[data-img]');
    if (!imgs[i]) return;
    var main = $('#mainFoodImg'); if (main) main.src = imgs[i].dataset.img;
    $$('.food-gallery__thumb').forEach(function (t, idx) { t.classList.toggle('is-active', idx === i); });
  };
  window.openFoodLightbox = function () {
    var img = $('#mainFoodImg');
    if (!img) return;
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = '<button class="lightbox__close" aria-label="Close">' + icon('close', 24) + '</button><img src="' + img.src + '" alt="' + currentFood.name + '" />';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    var close = function () { overlay.remove(); document.body.style.overflow = ''; };
    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  };
  window.shareFood = function () {
    toast({ title: 'Link copied', message: 'Dish link copied to clipboard.', type: 'success', duration: 2200 });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
