/**
 * Restaurants Listing Page
 * Live search, filtering, sorting, dynamic counter.
 */

import { RESTAURANTS, CATEGORIES } from '../data.js';
import { restaurantCard, emptyState, breadcrumb, button } from '../components.js';
import { $, $$, debounce, getParam, initReveal } from '../utils.js';
import { icon as iconFn } from '../icons.js';

const state = {
  search: '',
  cuisines: new Set(['all']),
  rating: 0,
  deliveryTime: 0,
  priceLevels: new Set(),
  offers: new Set(),
  vegOnly: false,
  sort: 'recommended',
};

function renderBreadcrumb() {
  const crumbs = $('#crumbs');
  if (crumbs) crumbs.innerHTML = breadcrumb([
    { label: 'Home', href: '../index.html' },
    { label: 'Restaurants', href: '#' },
  ]);
}

function renderFilters() {
  const panel = $('#filterPanel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="filter-panel__group">
      <div class="filter-panel__title">Cuisine</div>
      <div class="filter-options" id="cuisineFilters">
        <label class="check"><input type="checkbox" name="cuisine" value="all" checked /><span class="box">${iconFn('check', 14)}</span>All</label>
        ${CATEGORIES.map(c => `<label class="check"><input type="checkbox" name="cuisine" value="${c.id}" /><span class="box">${iconFn('check', 14)}</span>${c.name}</label>`).join('')}
      </div>
    </div>
    <div class="filter-panel__group">
      <div class="filter-panel__title">Rating</div>
      <div class="filter-options">
        <label class="radio"><input type="radio" name="rating" value="0" checked /><span class="circle"></span>Any rating</label>
        <label class="radio"><input type="radio" name="rating" value="4" /><span class="circle"></span>4★ & Above</label>
        <label class="radio"><input type="radio" name="rating" value="4.5" /><span class="circle"></span>4.5★ & Above</label>
      </div>
    </div>
    <div class="filter-panel__group">
      <div class="filter-panel__title">Delivery Time</div>
      <div class="filter-options">
        <label class="radio"><input type="radio" name="delivery" value="0" checked /><span class="circle"></span>Any time</label>
        <label class="radio"><input type="radio" name="delivery" value="20" /><span class="circle"></span>Under 20 minutes</label>
        <label class="radio"><input type="radio" name="delivery" value="30" /><span class="circle"></span>Under 30 minutes</label>
        <label class="radio"><input type="radio" name="delivery" value="45" /><span class="circle"></span>Under 45 minutes</label>
      </div>
    </div>
    <div class="filter-panel__group">
      <div class="filter-panel__title">Price</div>
      <div class="filter-options">
        <label class="check"><input type="checkbox" name="price" value="1" /><span class="box">${iconFn('check', 14)}</span>$ Budget</label>
        <label class="check"><input type="checkbox" name="price" value="2" /><span class="box">${iconFn('check', 14)}</span>$$ Mid-range</label>
        <label class="check"><input type="checkbox" name="price" value="3" /><span class="box">${iconFn('check', 14)}</span>$$$ Premium</label>
      </div>
    </div>
    <div class="filter-panel__group">
      <div class="filter-panel__title">Offers</div>
      <div class="filter-options">
        <label class="check"><input type="checkbox" name="offer" value="free-delivery" /><span class="box">${iconFn('check', 14)}</span>Free Delivery</label>
        <label class="check"><input type="checkbox" name="offer" value="discount" /><span class="box">${iconFn('check', 14)}</span>Discount Available</label>
        <label class="check"><input type="checkbox" name="offer" value="bogo" /><span class="box">${iconFn('check', 14)}</span>Buy 1 Get 1</label>
      </div>
    </div>
    <div class="filter-panel__group">
      <div class="filter-panel__title">Dietary</div>
      <div class="filter-options">
        <label class="toggle"><input type="checkbox" name="veg" id="vegToggle" /><span class="track"></span>Vegetarian only</label>
      </div>
    </div>
    <button class="btn btn-text btn-block" id="resetFilters" style="margin-top:var(--sp-3);color:var(--color-error-600)">Reset all filters</button>
  `;
  bindFilters();
}

function bindFilters() {
  // Cuisine — "all" toggles exclusive
  $$('#cuisineFilters input').forEach(input => {
    input.addEventListener('change', () => {
      state.cuisines = new Set();
      $$('#cuisineFilters input:checked').forEach(c => state.cuisines.add(c.value));
      if (state.cuisines.size === 0) {
        $$('#cuisineFilters input[value="all"]').checked = true;
        state.cuisines.add('all');
      }
      if (input.value !== 'all' && state.cuisines.has('all')) {
        state.cuisines.delete('all');
        $$('#cuisineFilters input[value="all"]').checked = false;
      }
      if (input.value === 'all' && state.cuisines.has('all')) {
        state.cuisines = new Set(['all']);
        $$('#cuisineFilters input:not([value="all"])').forEach(c => c.checked = false);
      }
      render();
    });
  });

  $$('input[name="rating"]').forEach(r => r.addEventListener('change', () => {
    state.rating = parseFloat(r.value);
    render();
  }));

  $$('input[name="delivery"]').forEach(r => r.addEventListener('change', () => {
    state.deliveryTime = parseInt(r.value);
    render();
  }));

  $$('input[name="price"]').forEach(p => p.addEventListener('change', () => {
    state.priceLevels = new Set($$('input[name="price"]:checked').map(p => parseInt(p.value)));
    render();
  }));

  $$('input[name="offer"]').forEach(o => o.addEventListener('change', () => {
    state.offers = new Set($$('input[name="offer"]:checked').map(o => o.value));
    render();
  }));

  $('#vegToggle')?.addEventListener('change', e => {
    state.vegOnly = e.target.checked;
    render();
  });

  $('#resetFilters')?.addEventListener('click', resetFilters);
}

function resetFilters() {
  state.search = '';
  state.cuisines = new Set(['all']);
  state.rating = 0;
  state.deliveryTime = 0;
  state.priceLevels = new Set();
  state.offers = new Set();
  state.vegOnly = false;
  state.sort = 'recommended';
  $('#restaurantSearch').value = '';
  $('#sortSelect').value = 'recommended';
  renderFilters();
  render();
}

function matchesFilters(r) {
  if (state.search) {
    const q = state.search.toLowerCase();
    if (!r.name.toLowerCase().includes(q) && !r.cuisine.toLowerCase().includes(q)) return false;
  }
  if (!state.cuisines.has('all')) {
    const has = r.cuisines.some(c => state.cuisines.has(c));
    if (!has) return false;
  }
  if (state.rating > 0 && r.rating < state.rating) return false;
  if (state.deliveryTime > 0 && r.deliveryTime > state.deliveryTime) return false;
  if (state.priceLevels.size > 0 && !state.priceLevels.has(r.priceLevel)) return false;
  if (state.vegOnly && !r.veg) return false;
  if (state.offers.size > 0) {
    const offer = (r.offer || '').toLowerCase();
    const matches = (
      (state.offers.has('free-delivery') && (offer.includes('free') || r.deliveryFee === 0)) ||
      (state.offers.has('discount') && (offer.includes('%') || offer.includes('off') || offer.includes('student'))) ||
      (state.offers.has('bogo') && offer.includes('buy 1'))
    );
    if (!matches) return false;
  }
  return true;
}

function sortResults(list) {
  const sorted = [...list];
  switch (state.sort) {
    case 'rating': sorted.sort((a, b) => b.rating - a.rating); break;
    case 'delivery': sorted.sort((a, b) => a.deliveryTime - b.deliveryTime); break;
    case 'fee': sorted.sort((a, b) => a.deliveryFee - b.deliveryFee); break;
    case 'az': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  }
  return sorted;
}

function render() {
  const filtered = sortResults(RESTAURANTS.filter(matchesFilters));
  const grid = $('#restaurantGrid');
  const countEl = $('#resultCount');
  if (countEl) countEl.textContent = `Showing ${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`;
  if (!grid) return;
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1">${emptyState({
      title: 'No restaurants match your search',
      text: 'Try adjusting your filters or search query to find more options.',
      actions: [{ label: 'Reset Filters', variant: 'primary', onclick: 'window.resetFiltersPage()' }],
      iconName: 'search',
    })}</div>`;
  } else {
    grid.innerHTML = filtered.map(r => restaurantCard(r)).join('');
  }
  // Re-trigger reveal
  requestAnimationFrame(() => {
    $$('.reveal:not(.is-visible)', grid).forEach(el => el.classList.add('is-visible'));
  });
}

function init() {
  renderBreadcrumb();
  renderFilters();
  render();

  // Search
  const searchInput = $('#restaurantSearch');
  const searchClear = $('#searchClear');
  if (searchInput) {
    const onSearch = debounce(() => {
      state.search = searchInput.value.trim();
      searchInput.closest('.search-input').classList.toggle('has-value', !!state.search);
      render();
    }, 200);
    searchInput.addEventListener('input', onSearch);
    searchClear?.addEventListener('click', () => {
      searchInput.value = '';
      state.search = '';
      searchInput.closest('.search-input').classList.remove('has-value');
      render();
      searchInput.focus();
    });
  }

  // Sort
  $('#sortSelect')?.addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  // Filter toggle (mobile/tablet)
  const filterToggle = $('#filterToggle');
  const filterPanel = $('#filterPanel');
  filterToggle?.addEventListener('click', () => {
    const open = filterPanel.classList.toggle('is-open');
    filterToggle.setAttribute('aria-expanded', open);
  });

  // URL params
  const q = getParam('q');
  const cat = getParam('category');
  const focus = getParam('focus');
  if (q && searchInput) { searchInput.value = q; state.search = q; render(); }
  if (cat) {
    state.cuisines = new Set([cat]);
    const allCb = $('#cuisineFilters input[value="all"]');
    if (allCb) allCb.checked = false;
    const catCb = $(`#cuisineFilters input[value="${cat}"]`);
    if (catCb) catCb.checked = true;
    render();
  }
  if (focus === 'search' && searchInput) searchInput.focus();

  initReveal();
}

window.resetFiltersPage = resetFilters;

document.addEventListener('DOMContentLoaded', init);
