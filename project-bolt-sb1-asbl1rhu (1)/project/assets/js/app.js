/* FoodFiesta — App Bootstrap (plain JS, loaded on every page) */
(function() {
  var FF = FoodFiesta;

  function injectIcons() {
    // Navbar icons
    var navLogo = FF.$('#navLogo'); if (navLogo) navLogo.innerHTML = FF.icon('utensilsCrossed', 24);
    var drawerLogo = FF.$('#drawerLogo'); if (drawerLogo) drawerLogo.innerHTML = FF.icon('utensilsCrossed', 24);
    var footerLogo = FF.$('#footerLogo'); if (footerLogo) footerLogo.innerHTML = FF.icon('utensilsCrossed', 24);
    var searchBtn = FF.$('#navSearchBtn'); if (searchBtn) searchBtn.innerHTML = FF.icon('search', 22);
    var cartLink = FF.$('#cartLink'); if (cartLink) {
      cartLink.innerHTML = FF.icon('cart', 22) + '<span class="cart-badge" style="display:none">0</span>';
    }
    var hamburger = FF.$('#navHamburger'); if (hamburger) hamburger.innerHTML = FF.icon('menu', 24);
    var drawerClose = FF.$('#drawerCloseBtn'); if (drawerClose) drawerClose.innerHTML = FF.icon('close', 20);

    // Drawer icons
    var di = { drawerHomeIcon: 'home', drawerRestIcon: 'store', drawerOffersIcon: 'tag', drawerReviewsIcon: 'star' };
    Object.keys(di).forEach(function(id) { var el = FF.$('#' + id); if (el) el.innerHTML = FF.icon(di[id], 22); });
    var dcb = FF.$('#drawerCartBtn'); if (dcb) dcb.innerHTML = FF.icon('cart', 18) + ' View Cart';
    var dbb = FF.$('#drawerBrowseBtn'); if (dbb) dbb.innerHTML = FF.icon('store', 18) + ' Browse Restaurants';

    // Hero icons
    var hsi = FF.$('#heroSearchIcon'); if (hsi) hsi.innerHTML = FF.icon('search', 22);
    var h1i = FF.$('#heroCard1Icon'); if (h1i) h1i.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 8h4l3 3v5a1 1 0 0 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>';
    var h2i = FF.$('#heroCard2Icon'); if (h2i) h2i.innerHTML = FF.icon('check', 18);
    var ni = FF.$('#newsIcon'); if (ni) ni.innerHTML = FF.icon('mail', 22);
    var fa = FF.$('#featArrow'); if (fa) fa.innerHTML = FF.icon('arrowRight', 16);
    var da = FF.$('#dishArrow'); if (da) da.innerHTML = FF.icon('arrowRight', 16);

    // Footer contact icons
    var fa2 = FF.$('#footerAddr'); if (fa2) fa2.innerHTML = FF.icon('mapPin', 18) + '<span>24 Marina Blvd, San Francisco, CA 94123</span>';
    var fp = FF.$('#footerPhone'); if (fp) fp.innerHTML = FF.icon('phone', 18) + '<span>+1 (415) 555-0182</span>';
    var fm = FF.$('#footerMail'); if (fm) fm.innerHTML = FF.icon('mail', 18) + '<span>hello@foodfiesta.com</span>';
    var fc = FF.$('#footerClock'); if (fc) fc.innerHTML = FF.icon('clock', 18) + '<span>Open daily 8 AM – 12 AM</span>';
    var fnb = FF.$('#footerNewsBtn'); if (fnb) fnb.innerHTML = FF.icon('send', 18);

    // Social icons
    var sf = FF.$('#socialFb'); if (sf) sf.innerHTML = FF.icon('facebook', 20);
    var st = FF.$('#socialTw'); if (st) st.innerHTML = FF.icon('twitter', 20);
    var si = FF.$('#socialIg'); if (si) si.innerHTML = FF.icon('instagram', 20);
    var sy = FF.$('#socialYt'); if (sy) sy.innerHTML = FF.icon('youtube', 20);
  }

  function init() {
    injectIcons();
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

    // Listen for toast events
    document.addEventListener('foodfiesta:toast', function(e) { if (e.detail) FF.toast(e.detail); });
    document.addEventListener('cart:change', FF.updateCartBadge);
  }

  /* Global window functions for card interactions */
  window.goRestaurant = function(id) { FF.recentlyViewed.addRestaurant(id); window.location.href = FF.href('restaurant.html') + '?id=' + id; };
  window.goFood = function(id) { FF.recentlyViewed.addFood(id); window.location.href = FF.href('food.html') + '?id=' + id; };
  window.goCategory = function(catId) { window.location.href = FF.href('restaurants.html') + '?category=' + catId; };
  window.goOffers = function() { window.location.href = FF.href('offers.html'); };

  window.toggleFavRestaurant = function(id, btn) {
    var added = FF.favorites.toggleRestaurant(id);
    btn.classList.toggle('is-active', added);
    FF.toast({ title: added ? 'Added to favorites' : 'Removed from favorites', type: added ? 'success' : 'info', duration: 2000 });
  };

  window.toggleFavFood = function(id, btn) {
    var added = FF.favorites.toggleFood(id);
    btn.classList.toggle('is-active', added);
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

  // Wire up nav search button
  document.addEventListener('DOMContentLoaded', function() {
    init();
    var sb = FF.$('#navSearchBtn');
    if (sb) sb.addEventListener('click', window.openSearch);
  });
})();
