/* FoodFiesta — Restaurants Page (filter/sort DOM cards; no innerHTML generation) */
(function() {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var debounce = FF.debounce;

  var ALL_CARDS = [];

  var state = {
    search: '',
    cuisines: ['all'],
    rating: 0,
    deliveryTime: 0,
    priceLevels: [],
    offers: [],
    vegOnly: false,
    sort: 'recommended',
  };

  function readCard(card) {
    return {
      el: card,
      id: card.dataset.id || '',
      name: (card.dataset.name || '').toLowerCase(),
      cuisine: (card.dataset.cuisine || '').split(','),
      rating: parseFloat(card.dataset.rating) || 0,
      delivery: parseInt(card.dataset.delivery) || 999,
      fee: parseFloat(card.dataset.fee) || 0,
      price: parseInt(card.dataset.price) || 1,
      offer: (card.dataset.offer || '').split(','),
      veg: card.dataset.veg === 'true',
    };
  }

  function matchesFilters(r) {
    if (state.search) {
      var q = state.search.toLowerCase();
      if (r.name.indexOf(q) === -1 && r.cuisine.join(',').indexOf(q) === -1) return false;
    }
    if (state.cuisines.indexOf('all') === -1) {
      var has = state.cuisines.some(function(c) { return r.cuisine.indexOf(c) > -1; });
      if (!has) return false;
    }
    if (state.rating > 0 && r.rating < state.rating) return false;
    if (state.deliveryTime > 0 && r.delivery > state.deliveryTime) return false;
    if (state.priceLevels.length > 0 && state.priceLevels.indexOf(r.price) === -1) return false;
    if (state.vegOnly && !r.veg) return false;
    if (state.offers.length > 0) {
      var hasOffer = state.offers.some(function(o) { return r.offer.indexOf(o) > -1; });
      if (!hasOffer) return false;
    }
    return true;
  }

  function sortCards(list) {
    var sorted = list.slice();
    switch (state.sort) {
      case 'rating':   sorted.sort(function(a,b){ return b.rating - a.rating; }); break;
      case 'delivery': sorted.sort(function(a,b){ return a.delivery - b.delivery; }); break;
      case 'fee':      sorted.sort(function(a,b){ return a.fee - b.fee; }); break;
      case 'az':       sorted.sort(function(a,b){ return a.name.localeCompare(b.name); }); break;
      default:         sorted.sort(function(a,b){ return b.rating - a.rating; });
    }
    return sorted;
  }

  function render() {
    var grid = $('#restaurantGrid');
    var countEl = $('#resultCount');
    var noResults = $('#noResults');
    if (!grid) return;

    var visible = ALL_CARDS.filter(matchesFilters);
    var sorted = sortCards(visible);

    // Reorder DOM nodes to match sort
    sorted.forEach(function(r) { grid.appendChild(r.el); });

    // Show/hide individual cards
    ALL_CARDS.forEach(function(r) {
      var show = visible.indexOf(r) > -1;
      r.el.style.display = show ? '' : 'none';
      if (show) r.el.classList.add('is-visible');
    });

    if (noResults) noResults.style.display = visible.length === 0 ? '' : 'none';
    if (countEl) countEl.textContent = 'Showing ' + visible.length + ' restaurant' + (visible.length !== 1 ? 's' : '');
  }

  function resetFilters() {
    state.search = '';
    state.cuisines = ['all'];
    state.rating = 0;
    state.deliveryTime = 0;
    state.priceLevels = [];
    state.offers = [];
    state.vegOnly = false;
    state.sort = 'recommended';

    var si = $('#restaurantSearch'); if (si) { si.value = ''; si.closest('.search-input').classList.remove('has-value'); }
    var ss = $('#sortSelect'); if (ss) ss.value = 'recommended';

    $$('input[name="cuisine"]').forEach(function(i) { i.checked = i.value === 'all'; });
    $$('input[name="rating"]').forEach(function(i) { i.checked = i.value === '0'; });
    $$('input[name="delivery"]').forEach(function(i) { i.checked = i.value === '0'; });
    $$('input[name="price"]').forEach(function(i) { i.checked = false; });
    $$('input[name="offer"]').forEach(function(i) { i.checked = false; });
    var veg = $('#vegToggle'); if (veg) veg.checked = false;

    render();
  }
  window.resetFiltersPage = resetFilters;

  function bindFilters() {
    // Cuisine (checkboxes with mutual "all" logic)
    $$('#cuisineFilters input').forEach(function(input) {
      input.addEventListener('change', function() {
        if (input.value === 'all') {
          state.cuisines = ['all'];
          $$('#cuisineFilters input:not([value="all"])').forEach(function(c) { c.checked = false; });
        } else {
          var allCb = $('#cuisineFilters input[value="all"]');
          if (allCb) allCb.checked = false;
          state.cuisines = $$('#cuisineFilters input:checked').map(function(c) { return c.value; });
          if (state.cuisines.length === 0) {
            if (allCb) allCb.checked = true;
            state.cuisines = ['all'];
          }
        }
        render();
      });
    });

    $$('input[name="rating"]').forEach(function(r) {
      r.addEventListener('change', function() { state.rating = parseFloat(r.value); render(); });
    });
    $$('input[name="delivery"]').forEach(function(r) {
      r.addEventListener('change', function() { state.deliveryTime = parseInt(r.value); render(); });
    });
    $$('input[name="price"]').forEach(function(p) {
      p.addEventListener('change', function() {
        state.priceLevels = $$('input[name="price"]:checked').map(function(x) { return parseInt(x.value); });
        render();
      });
    });
    $$('input[name="offer"]').forEach(function(o) {
      o.addEventListener('change', function() {
        state.offers = $$('input[name="offer"]:checked').map(function(x) { return x.value; });
        render();
      });
    });

    var veg = $('#vegToggle');
    if (veg) veg.addEventListener('change', function(e) { state.vegOnly = e.target.checked; render(); });

    var reset = $('#resetFilters');
    if (reset) reset.addEventListener('click', resetFilters);
    var resetEmpty = $('#resetFiltersEmpty');
    if (resetEmpty) resetEmpty.addEventListener('click', resetFilters);
  }

  function init() {
    // Collect all real restaurant cards (exclude #noResults)
    ALL_CARDS = $$('#restaurantGrid .restaurant-card').map(readCard);

    bindFilters();

    // Search
    var searchInput = $('#restaurantSearch');
    var searchClear = $('#searchClear');
    if (searchInput) {
      var onSearch = debounce(function() {
        state.search = searchInput.value.trim();
        searchInput.closest('.search-input').classList.toggle('has-value', !!state.search);
        render();
      }, 200);
      searchInput.addEventListener('input', onSearch);
      if (searchClear) searchClear.addEventListener('click', function() {
        searchInput.value = '';
        state.search = '';
        searchInput.closest('.search-input').classList.remove('has-value');
        render();
        searchInput.focus();
      });
    }

    // Sort
    var sortSelect = $('#sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', function(e) { state.sort = e.target.value; render(); });

    // Mobile filter toggle
    var filterToggle = $('#filterToggle');
    var filterPanel = $('#filterPanel');
    if (filterToggle && filterPanel) {
      filterToggle.addEventListener('click', function() {
        var open = filterPanel.classList.toggle('is-open');
        filterToggle.setAttribute('aria-expanded', String(open));
      });
    }

    // URL params
    var q = FF.getParam('q');
    var cat = FF.getParam('category');
    var focus = FF.getParam('focus');

    if (q && searchInput) {
      searchInput.value = q;
      state.search = q;
    }
    if (cat) {
      state.cuisines = [cat];
      var allCb = $('#cuisineFilters input[value="all"]');
      if (allCb) allCb.checked = false;
      var catCb = $('#cuisineFilters input[value="' + cat + '"]');
      if (catCb) catCb.checked = true;
    }
    if (focus === 'search' && searchInput) searchInput.focus();

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
