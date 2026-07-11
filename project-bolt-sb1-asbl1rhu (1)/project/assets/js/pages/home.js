/* FoodFiesta — Home Page Script (interactivity only) */
(function() {
  var FF = FoodFiesta;
  var $ = FF.$;

  function init() {
    // Hero search — redirect to restaurants page with query
    var heroForm = $('#heroSearchForm');
    if (heroForm) {
      heroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = heroForm.querySelector('input').value.trim();
        window.location.href = 'pages/restaurants.html' + (q ? '?q=' + encodeURIComponent(q) : '');
      });
    }

    // Home newsletter
    var homeNews = $('#homeNewsletter');
    if (homeNews) {
      homeNews.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = homeNews.querySelector('input').value.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          FF.toast({ title: 'Subscribed!', message: 'Welcome to the FoodFiesta newsletter.', type: 'success' });
          homeNews.reset();
        } else {
          FF.toast({ title: 'Invalid email', message: 'Please enter a valid email address.', type: 'error' });
        }
      });
    }

    // Restore favorite states on cards
    FF.$('[data-fav-restaurant]').forEach(function(btn) {
      var id = btn.getAttribute('data-fav-restaurant');
      if (FF.favorites.hasRestaurant(id)) btn.classList.add('is-active');
    });
    FF.$$('[data-fav-food]').forEach(function(btn) {
      var id = btn.getAttribute('data-fav-food');
      if (FF.favorites.hasFood(id)) btn.classList.add('is-active');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
