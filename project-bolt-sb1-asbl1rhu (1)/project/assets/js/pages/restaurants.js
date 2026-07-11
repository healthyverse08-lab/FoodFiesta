/**
 * Restaurants Listing Page
 * Live search, filtering, sorting, dynamic counter.
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var debounce = FF.debounce;
  var getParam = FF.getParam;
  var initReveal = FF.initReveal;
  var RESTAURANTS = FF.RESTAURANTS;
  var CATEGORIES = FF.CATEGORIES;

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

  function renderBreadcrumb() {
    var crumbs = $('#crumbs');
    if (!crumbs) return;
    var sep = icon('chevronRight', 16);
    crumbs.innerHTML = '<a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + sep + '</span><span class="current" aria-current="page">Restaurants</span>';
  }

  function renderFilters() {
    var panel = $('#filterPanel');
    if (!panel) return;
    var catHtml = CATEGORIES.map(function (c) {
      return '<label class="check"><input type="checkbox" name="cuisine" value="' + c.id + '" /><span class="box">' + icon('check', 14) + '</span>' + c.name + '</label>';
    }).join('');

    panel.innerHTML =
      '<div class="filter-panel__group">' +
        '<div class="filter-panel__title">Cuisine</div>' +
        '<div class="filter-options" id="cuisineFilters">' +
          '<label class="check"><input type="checkbox" name="cuisine" value="all" checked /><span class="box">' + icon('check', 14) + '</span>All</label>' +
          catHtml +
        '</div>' +
      '</div>' +
      '<div class="filter-panel__group">' +
        '<div class="filter-panel__title">Rating</div>' +
        '<div class="filter-options">' +
          '<label class="radio"><input type="radio" name="rating" value="0" checked /><span class="circle"></span>Any rating</label>' +
          '<label class="radio"><input type="radio" name="rating" value="4" /><span class="circle"></span>4★ & Above</label>' +
          '<label class="radio"><input type="radio" name="rating" value="4.5" /><span class="circle"></span>4.5★ & Above</label>' +
        '</div>' +
      '</div>' +
      '<div class="filter-panel__group">' +
        '<div class="filter-panel__title">Delivery Time</div>' +
        '<div class="filter-options">' +
          '<label class="radio"><input type="radio" name="delivery" value="0" checked /><span class="circle"></span>Any time</label>' +
          '<label class="radio"><input type="radio" name="delivery" value="20" /><span class="circle"></span>Under 20 minutes</label>' +
          '<label class="radio"><input type="radio" name="delivery" value="30" /><span class="circle"></span>Under 30 minutes</label>' +
          '<label class="radio"><input type="radio" name="delivery" value="45" /><span class="circle"></span>Under 45 minutes</label>' +
        '</div>' +
      '</div>' +
      '<div class="filter-panel__group">' +
        '<div class="filter-panel__title">Price</div>' +
        '<div class="filter-options">' +
          '<label class="check"><input type="checkbox" name="price" value="1" /><span class="box">' + icon('check', 14) + '</span>$ Budget</label>' +
          '<label class="check"><input type="checkbox" name="price" value="2" /><span class="box">' + icon('check', 14) + '</span>$$ Mid-range</label>' +
          '<label class="check"><input type="checkbox" name="price" value="3" /><span class="box">' + icon('check', 14) + '</span>$$$ Premium</label>' +
        '</div>' +
      '</div>' +
      '<div class="filter-panel__group">' +
        '<div class="filter-panel__title">Offers</div>' +
        '<div class="filter-options">' +
          '<label class="check"><input type="checkbox" name="offer" value="free-delivery" /><span class="box">' + icon('check', 14) + '</span>Free Delivery</label>' +
          '<label class="check"><input type="checkbox" name="offer" value="discount" /><span class="box">' + icon('check', 14) + '</span>Discount Available</label>' +
          '<label class="check"><input type="checkbox" name="offer" value="bogo" /><span class="box">' + icon('check', 14) + '</span>Buy 1 Get 1</label>' +
        '</div>' +
      '</div>' +
      '<div class="filter-panel__group">' +
        '<div class="filter-panel__title">Dietary</div>' +
        '<div class="filter-options">' +
          '<label class="toggle"><input type="checkbox" name="veg" id="vegToggle" /><span class="track"></span>Vegetarian only</label>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-text btn-block" id="resetFilters" style="margin-top:var(--sp-3);color:var(--color-error-600)">Reset all filters</button>';

    bindFilters();
  }

  function bindFilters() {
    var cuisineInputs = $$('#cuisineFilters input');
    cuisineInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        state.cuisines = [];
        $$('#cuisineFilters input:checked').forEach(function (c) { state.cuisines.push(c.value); });
        if (state.cuisines.length === 0) {
          $('#cuisineFilters input[value="all"]').checked = true;
          state.cuisines = ['all'];
        }
        if (input.value !== 'all' && state.cuisines.indexOf('all') > -1) {
          state.cuisines = state.cuisines.filter(function (v) { return v !== 'all'; });
          $('#cuisineFilters input[value="all"]').checked = false;
        }
        if (input.value === 'all' && state.cuisines.indexOf('all') > -1) {
          state.cuisines = ['all'];
          $$('#cuisineFilters input:not([value="all"])').forEach(function (c) { c.checked = false; });
        }
        render();
      });
    });

    $$('input[name="rating"]').forEach(function (r) {
      r.addEventListener('change', function () { state.rating = parseFloat(r.value); render(); });
    });
    $$('input[name="delivery"]').forEach(function (r) {
      r.addEventListener('change', function () { state.deliveryTime = parseInt(r.value); render(); });
    });
    $$('input[name="price"]').forEach(function (p) {
      p.addEventListener('change', function () {
        state.priceLevels = $$('input[name="price"]:checked').map(function (x) { return parseInt(x.value); });
        render();
      });
    });
    $$('input[name="offer"]').forEach(function (o) {
      o.addEventListener('change', function () {
        state.offers = $$('input[name="offer"]:checked').map(function (x) { return x.value; });
        render();
      });
    });

    var veg = $('#vegToggle');
    if (veg) veg.addEventListener('change', function (e) { state.vegOnly = e.target.checked; render(); });

    var reset = $('#resetFilters');
    if (reset) reset.addEventListener('click', resetFilters);
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
    var si = $('#restaurantSearch'); if (si) si.value = '';
    var ss = $('#sortSelect'); if (ss) ss.value = 'recommended';
    renderFilters();
    render();
  }
  window.resetFiltersPage = resetFilters;

  function matchesFilters(r) {
    if (state.search) {
      var q = state.search.toLowerCase();
      if (r.name.toLowerCase().indexOf(q) === -1 && r.cuisine.toLowerCase().indexOf(q) === -1) return false;
    }
    if (state.cuisines.indexOf('all') === -1) {
      var has = r.cuisines.some(function (c) { return state.cuisines.indexOf(c) > -1; });
      if (!has) return false;
    }
    if (state.rating > 0 && r.rating < state.rating) return false;
    if (state.deliveryTime > 0 && r.deliveryTime > state.deliveryTime) return false;
    if (state.priceLevels.length > 0 && state.priceLevels.indexOf(r.priceLevel) === -1) return false;
    if (state.vegOnly && !r.veg) return false;
    if (state.offers.length > 0) {
      var offer = (r.offer || '').toLowerCase();
      var m = (
        (state.offers.indexOf('free-delivery') > -1 && (offer.indexOf('free') > -1 || r.deliveryFee === 0)) ||
        (state.offers.indexOf('discount') > -1 && (offer.indexOf('%') > -1 || offer.indexOf('off') > -1 || offer.indexOf('student') > -1)) ||
        (state.offers.indexOf('bogo') > -1 && offer.indexOf('buy 1') > -1)
      );
      if (!m) return false;
    }
    return true;
  }

  function sortResults(list) {
    var sorted = list.slice();
    switch (state.sort) {
      case 'rating': sorted.sort(function (a, b) { return b.rating - a.rating; }); break;
      case 'delivery': sorted.sort(function (a, b) { return a.deliveryTime - b.deliveryTime; }); break;
      case 'fee': sorted.sort(function (a, b) { return a.deliveryFee - b.deliveryFee; }); break;
      case 'az': sorted.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
      default: sorted.sort(function (a, b) { return b.reviewCount - a.reviewCount; });
    }
    return sorted;
  }

  function render() {
    var filtered = sortResults(RESTAURANTS.filter(matchesFilters));
    var grid = $('#restaurantGrid');
    var countEl = $('#resultCount');
    if (countEl) countEl.textContent = 'Showing ' + filtered.length + ' restaurant' + (filtered.length !== 1 ? 's' : '');
    if (!grid) return;
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="empty-state"><div class="empty-state__icon">' + icon('search', 96) + '</div><h3 class="empty-state__title">No restaurants match your search</h3><p class="empty-state__text">Try adjusting your filters or search query to find more options.</p><div class="empty-state__actions"><button class="btn btn-primary" onclick="window.resetFiltersPage()">Reset Filters</button></div></div></div>';
    } else {
      grid.innerHTML = filtered.map(FF.restaurantCard).join('');
    }
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)', grid).forEach(function (el) { el.classList.add('is-visible'); });
    });
  }

  function init() {
    renderBreadcrumb();
    renderFilters();
    render();

    var searchInput = $('#restaurantSearch');
    var searchClear = $('#searchClear');
    if (searchInput) {
      var onSearch = debounce(function () {
        state.search = searchInput.value.trim();
        searchInput.closest('.search-input').classList.toggle('has-value', !!state.search);
        render();
      }, 200);
      searchInput.addEventListener('input', onSearch);
      if (searchClear) searchClear.addEventListener('click', function () {
        searchInput.value = '';
        state.search = '';
        searchInput.closest('.search-input').classList.remove('has-value');
        render();
        searchInput.focus();
      });
    }

    var sortSelect = $('#sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', function (e) { state.sort = e.target.value; render(); });

    var filterToggle = $('#filterToggle');
    var filterPanel = $('#filterPanel');
    if (filterToggle) filterToggle.addEventListener('click', function () {
      var open = filterPanel.classList.toggle('is-open');
      filterToggle.setAttribute('aria-expanded', open);
    });

    var q = getParam('q');
    var cat = getParam('category');
    var focus = getParam('focus');
    if (q && searchInput) { searchInput.value = q; state.search = q; render(); }
    if (cat) {
      state.cuisines = [cat];
      var allCb = $('#cuisineFilters input[value="all"]');
      if (allCb) allCb.checked = false;
      var catCb = $('#cuisineFilters input[value="' + cat + '"]');
      if (catCb) catCb.checked = true;
      render();
    }
    if (focus === 'search' && searchInput) searchInput.focus();

    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
