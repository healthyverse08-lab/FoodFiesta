/* FoodFiesta — App Bootstrap (loaded on every page) */
(function() {
  var FF = FoodFiesta;

  function init() {
    FF.initNavbar();
    FF.initReveal();
    FF.updateCartBadge();

    // Footer newsletter
    var newsletter = FF.$('#footerNewsletter');
    if (newsletter) {
      newsletter.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = newsletter.querySelector('input').value.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          FF.toast({ title: 'Subscribed!', message: 'Welcome to the FoodFiesta newsletter.', type: 'success' });
          newsletter.reset();
        } else {
          FF.toast({ title: 'Invalid email', message: 'Please enter a valid email address.', type: 'error' });
        }
      });
    }

    // Restore favorite button states on all pages
    FF.$$('[data-fav-restaurant]').forEach(function(btn) {
      var id = btn.getAttribute('data-fav-restaurant');
      if (FF.favorites.hasRestaurant(id)) btn.classList.add('is-active');
    });
    FF.$$('[data-fav-food]').forEach(function(btn) {
      var id = btn.getAttribute('data-fav-food');
      if (FF.favorites.hasFood(id)) btn.classList.add('is-active');
    });

    document.addEventListener('cart:change', FF.updateCartBadge);
  }

  /* Global window functions for card interactions */
  window.goRestaurant = function(id) {
    FF.recentlyViewed.addRestaurant(id);
    window.location.href = FF.href('restaurant.html') + '?id=' + id;
  };
  window.goFood = function(id) {
    FF.recentlyViewed.addFood(id);
    window.location.href = FF.href('food.html') + '?id=' + id;
  };
  window.goCategory = function(catId) {
    window.location.href = FF.href('restaurants.html') + '?category=' + catId;
  };
  window.goOffers = function() {
    window.location.href = FF.href('offers.html');
  };

  window.toggleFavRestaurant = function(id, btn) {
    var added = FF.favorites.toggleRestaurant(id);
    if (btn) btn.classList.toggle('is-active', added);
    FF.toast({ title: added ? 'Added to favorites' : 'Removed from favorites', type: added ? 'success' : 'info', duration: 2000 });
  };

  window.toggleFavFood = function(id, btn) {
    var added = FF.favorites.toggleFood(id);
    if (btn) btn.classList.toggle('is-active', added);
    FF.toast({ title: added ? 'Added to favorites' : 'Removed from favorites', type: added ? 'success' : 'info', duration: 2000 });
  };

  window.quickAddCart = function(foodId, btn) {
    var food = FF.FOODS.find(function(f) { return f.id === foodId; });
    if (!food) return;
    FF.cart.add(food, 1);
    if (btn) { btn.style.transform = 'scale(0.85)'; setTimeout(function() { btn.style.transform = ''; }, 180); }
    FF.toast({ title: 'Added to cart', message: food.name + ' added.', type: 'success', duration: 2200 });
  };

  window.copyCode = function(code) {
    FF.copyToClipboard(code);
    FF.toast({ title: 'Copied!', message: 'Code "' + code + '" copied to clipboard.', type: 'success', duration: 2200 });
  };

  window.openSearch = function() {
    var onRestaurants = window.location.pathname.indexOf('restaurants') > -1;
    if (!onRestaurants) {
      window.location.href = FF.href('restaurants.html') + '?focus=search';
    } else {
      document.dispatchEvent(new CustomEvent('foodfiesta:search'));
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    init();
    var sb = FF.$('#navSearchBtn');
    if (sb) sb.addEventListener('click', window.openSearch);
  });
})();
