/**
 * Community Reviews Page
 * Stats, featured reviews, review feed with filters, leaderboard, popular dishes, gallery,
 * review submission, community highlights, search.
 */

import { SEED_REVIEWS, RESTAURANTS, FOODS, CATEGORIES } from '../data.js';
import { restaurantCard, foodCard, breadcrumb, sectionHeader, button } from '../components.js';
import { $, $$, renderStars, formatDate, store, toast, initReveal, debounce } from '../utils.js';
import { icon as iconFn } from '../icons.js';

const COMMUNITY_SEED = SEED_REVIEWS;

function getReviews() {
  const userReviews = store.get('communityData', { reviews: [] }).reviews || [];
  return [...userReviews, ...COMMUNITY_SEED];
}

function getStats() {
  const reviews = getReviews();
  const restaurantIds = new Set(reviews.map(r => r.restaurantId));
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return {
    avgRating: avgRating.toFixed(1),
    restaurantsReviewed: restaurantIds.size,
    totalReviews: reviews.length,
    happyCustomers: 12500 + reviews.length,
  };
}

function getLeaderboard() {
  const reviews = getReviews();
  return RESTAURANTS.map(r => {
    const rReviews = reviews.filter(rv => rv.restaurantId === r.id);
    const avgRating = rReviews.length ? rReviews.reduce((s, rv) => s + rv.rating, 0) / rReviews.length : r.rating;
    return { ...r, avgRating, reviewCount: r.reviewCount + rReviews.length };
  }).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
}

function getPopularDishes() {
  const reviews = getReviews();
  return FOODS.map(f => {
    const fReviews = reviews.filter(rv => rv.foodId === f.id);
    const avgRating = fReviews.length ? fReviews.reduce((s, rv) => s + rv.rating, 0) / fReviews.length : f.rating;
    return { ...f, avgRating, reviewCount: fReviews.length + Math.floor(f.rating * 50) };
  }).sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount).slice(0, 4);
}

let feedState = { restaurant: 'all', cuisine: 'all', rating: 0, sort: 'recent', search: '', visible: 6 };
let allReviews = [];

function renderReviewCard(r) {
  const restaurant = RESTAURANTS.find(x => x.id === r.restaurantId);
  const food = FOODS.find(f => f.id === r.foodId) || {};
  return `
  <article class="review-card" data-restaurant="${r.restaurantId}" data-cuisine="${r.cuisine}" data-rating="${r.rating}">
    <div class="review-card__head">
      <div class="avatar"><img src="${r.avatar}" alt="${r.name}" loading="lazy" /></div>
      <div style="flex:1">
        <div class="review-card__name">${r.name} ${r.verified ? `<span class="badge badge-success" style="margin-left:4px">${iconFn('check', 12)} Verified</span>` : ''}</div>
        <div class="review-card__date">${formatDate(r.date)}</div>
      </div>
      ${renderStars(r.rating, 16)}
    </div>
    <div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:var(--sp-2)">
      <span class="badge badge-muted">${restaurant?.name || r.restaurant}</span>
      ${food.name ? `<span class="badge badge-primary">${food.name}</span>` : ''}
    </div>
    ${food.image ? `<div class="gallery-item" style="aspect-ratio:16/9;margin-bottom:var(--sp-3);border-radius:var(--radius-md)"><img src="${food.image}" alt="${food.name || r.food}" loading="lazy" /></div>` : ''}
    <p class="review-card__text">${r.text}</p>
    <div class="review-card__actions">
      <button class="review-card__action" data-review-id="${r.id}" data-type="helpful" onclick="window.interactReview('${r.id}', 'helpful', this)" aria-label="Mark helpful">
        ${iconFn('thumbsUp', 18)} Helpful (${r.helpful})
      </button>
      <button class="review-card__action" data-review-id="${r.id}" data-type="like" onclick="window.interactReview('${r.id}', 'like', this)" aria-label="Like">
        ${iconFn('heart', 18)} Like (${r.likes})
      </button>
      <button class="review-card__action" onclick="window.shareReview()" aria-label="Share">
        ${iconFn('share', 18)} Share
      </button>
    </div>
  </article>`;
}

function filterReviews() {
  let list = [...allReviews];
  if (feedState.search) {
    const q = feedState.search.toLowerCase();
    list = list.filter(r => {
      const restaurant = RESTAURANTS.find(x => x.id === r.restaurantId);
      return r.text.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (restaurant?.name || r.restaurant).toLowerCase().includes(q) ||
        (r.food || '').toLowerCase().includes(q);
    });
  }
  if (feedState.restaurant !== 'all') list = list.filter(r => r.restaurantId === feedState.restaurant);
  if (feedState.cuisine !== 'all') list = list.filter(r => r.cuisine === feedState.cuisine);
  if (feedState.rating > 0) list = list.filter(r => r.rating >= feedState.rating);
  switch (feedState.sort) {
    case 'highest': list.sort((a, b) => b.rating - a.rating); break;
    case 'lowest': list.sort((a, b) => a.rating - b.rating); break;
    case 'helpful': list.sort((a, b) => b.helpful - a.helpful); break;
    case 'liked': list.sort((a, b) => b.likes - a.likes); break;
    default: list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return list;
}

function renderFeed() {
  const filtered = filterReviews();
  const feedEl = $('#reviewFeed');
  if (!feedEl) return;
  if (filtered.length === 0) {
    feedEl.innerHTML = `<div class="card" style="grid-column:1/-1"><div class="empty-state"><div class="empty-state__icon">${iconFn('message', 64)}</div><h3 class="empty-state__title">No reviews found</h3><p class="empty-state__text">Try adjusting your filters or search query.</p></div></div>`;
    return;
  }
  const visible = filtered.slice(0, feedState.visible);
  feedEl.innerHTML = visible.map(renderReviewCard).join('');
  const loadMore = $('#loadMore');
  if (loadMore) loadMore.style.display = filtered.length > feedState.visible ? 'inline-flex' : 'none';
}

function render() {
  allReviews = getReviews();
  const stats = getStats();
  const leaderboard = getLeaderboard();
  const popularDishes = getPopularDishes();
  const reviews = allReviews;

  // Gallery images from reviews' food images
  const galleryImages = FOODS.slice(0, 8).map(f => f.image);

  const highlights = [
    { icon: 'award', title: 'Most Reviewed', stat: 'Himalayan Momo House', desc: '1,567 reviews and counting' },
    { icon: 'star', title: 'Highest Rated Dish', stat: 'Chicken Momo', desc: '4.9 average rating' },
    { icon: 'truck', title: 'Fastest Delivery', stat: 'Urban Café', desc: '15 min average' },
    { icon: 'trending', title: 'Top Trending', stat: 'BBQ Mixed Platter', desc: '+42% orders this week' },
    { icon: 'heart', title: 'Community Favorite', stat: 'Bella Italia', desc: 'Most favorited restaurant' },
    { icon: 'cake', title: 'Most Loved Dessert', stat: 'Chocolate Cake', desc: '4.8 rating from 893 reviews' },
  ];

  const restaurantOptions = ['all', ...new Set(reviews.map(r => r.restaurantId))];

  host.innerHTML = `
  <!-- Hero -->
  <section class="section-sm">
    <div class="container">
      ${breadcrumb([{ label: 'Home', href: '../index.html' }, { label: 'Community Reviews', href: '#' }])}
      <div class="community-hero reveal" style="margin-top:var(--sp-4)">
        <div>
          <span class="badge badge-primary" style="margin-bottom:var(--sp-3)">${iconFn('star', 14)} Community</span>
          <h1 style="font-size:var(--fs-h1);font-weight:700">Community Reviews</h1>
          <p class="text-muted" style="margin-top:var(--sp-3);max-width:520px">See what food lovers are saying about their favorite restaurants. Share your experiences, discover new spots, and help others find great food.</p>
        </div>
        <div class="search-input search-input--lg" style="max-width:480px">
          <span class="search-icon">${iconFn('search', 22)}</span>
          <input class="input input--lg" type="search" id="communitySearch" placeholder="Search reviews, restaurants or dishes..." aria-label="Search community" />
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="section-sm" style="padding-top:0">
    <div class="container">
      <div class="grid grid-cols-2 grid-md-cols-4" style="gap:var(--sp-4)">
        <div class="stat-card reveal"><div class="stat-card__num" data-count="${stats.avgRating}">${stats.avgRating}</div><div class="stat-card__label">Average Rating</div></div>
        <div class="stat-card reveal"><div class="stat-card__num" data-count="${stats.restaurantsReviewed}">${stats.restaurantsReviewed}</div><div class="stat-card__label">Restaurants Reviewed</div></div>
        <div class="stat-card reveal"><div class="stat-card__num" data-count="${stats.totalReviews}">${stats.totalReviews}</div><div class="stat-card__label">Customer Reviews</div></div>
        <div class="stat-card reveal"><div class="stat-card__num" data-count="${stats.happyCustomers}">${stats.happyCustomers.toLocaleString()}</div><div class="stat-card__label">Happy Customers</div></div>
      </div>
    </div>
  </section>

  <!-- Review feed -->
  <section class="section">
    <div class="container">
      ${sectionHeader({ title: 'Review Feed', subtitle: 'Real reviews from the FoodFiesta community.' })}

      <div class="flex items-center gap-3 mb-5" style="flex-wrap:wrap">
        <select class="select" id="filterRestaurant" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Filter by restaurant">
          <option value="all">All Restaurants</option>
          ${RESTAURANTS.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
        </select>
        <select class="select" id="filterCuisine" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Filter by cuisine">
          <option value="all">All Cuisines</option>
          ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <select class="select" id="filterRating" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Filter by rating">
          <option value="0">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
        <select class="select" id="filterSort" style="width:auto;min-height:40px;padding-block:var(--sp-2)" aria-label="Sort reviews">
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
          <option value="liked">Most Liked</option>
        </select>
      </div>

      <div class="grid grid-cols-1 grid-md-cols-2" id="reviewFeed" style="gap:var(--sp-4)"></div>

      <div class="text-center" style="margin-top:var(--sp-6)">
        <button class="btn btn-outline btn-lg" id="loadMore">${iconFn('chevronDown', 18)} Load More Reviews</button>
      </div>
    </div>
  </section>

  <!-- Leaderboard -->
  <section class="section" style="background:var(--color-bg-alt)">
    <div class="container">
      ${sectionHeader({ title: 'Top Rated Restaurants', subtitle: 'Ranked by community reviews and ratings.' })}
      <div class="card reveal" id="leaderboard">
        ${leaderboard.map((r, i) => `
          <div class="leader-row" onclick="window.goRestaurant('${r.id}')" style="cursor:pointer">
            <div class="leader-row__rank ${i < 3 ? 'leader-row__rank--top' : ''}">${i + 1}</div>
            <div class="leader-row__logo"><img src="${r.logo}" alt="${r.name}" loading="lazy" /></div>
            <div class="leader-row__info">
              <div class="leader-row__name">${r.name}</div>
              <div class="leader-row__cuisine">${r.cuisine}</div>
            </div>
            <div style="text-align:right">
              <div class="rating-badge" style="background:transparent;padding:0">${iconFn('star', 14)} ${r.avgRating.toFixed(1)}</div>
              <div class="fs-caption text-tertiary">${r.reviewCount.toLocaleString()} reviews</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Popular dishes -->
  <section class="section">
    <div class="container">
      ${sectionHeader({ title: 'Popular Dishes', subtitle: 'Top-rated dishes loved by the community.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" style="gap:24px">
        ${popularDishes.map(f => foodCard(f)).join('')}
      </div>
    </div>
  </section>

  <!-- Customer food gallery -->
  <section class="section" style="background:var(--color-bg-alt)">
    <div class="container">
      ${sectionHeader({ title: 'Customer Food Gallery', subtitle: 'Food photos shared by our community.' })}
      <div class="gallery-grid reveal" id="communityGallery">
        ${galleryImages.map((g, i) => `<div class="gallery-item" onclick="window.openCommunityLightbox(${i})" data-img="${g}"><img src="${g}" alt="Food photo ${i+1}" loading="lazy" /></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Share your experience -->
  <section class="section" id="share">
    <div class="container">
      ${sectionHeader({ title: 'Share Your Experience', subtitle: 'Help others discover great food. Your review appears instantly.' })}
      <div class="card card-body reveal" style="max-width:640px;margin:0 auto">
        <form id="reviewForm">
          <div class="grid grid-cols-1 grid-md-cols-2" style="gap:0 var(--sp-4)">
            <div class="field"><label class="field-label">Restaurant<span class="req">*</span></label>
              <select class="select" name="restaurant" required>
                <option value="">Select a restaurant</option>
                ${RESTAURANTS.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
              </select>
              <span class="field-error">${iconFn('alert', 14)} Please select a restaurant.</span>
            </div>
            <div class="field"><label class="field-label">Dish<span class="req">*</span></label>
              <select class="select" name="food" required>
                <option value="">Select a dish</option>
                ${FOODS.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
              </select>
              <span class="field-error">${iconFn('alert', 14)} Please select a dish.</span>
            </div>
          </div>
          <div class="field"><label class="field-label">Your Rating<span class="req">*</span></label>
            <div class="stars-input" id="reviewStars">
              ${[5,4,3,2,1].map(n => `<button type="button" class="star-btn" data-rating="${n}" aria-label="${n} stars">${iconFn('star', 32)}</button>`).join('')}
            </div>
            <input type="hidden" name="rating" id="ratingValue" required />
          </div>
          <div class="field"><label class="field-label">Your Review<span class="req">*</span></label>
            <textarea class="textarea" name="text" required placeholder="Tell us about your experience..."></textarea>
            <span class="field-error">${iconFn('alert', 14)} Please write your review.</span>
          </div>
          <div class="field"><label class="field-label">Your Name<span class="req">*</span></label>
            <input class="input" type="text" name="name" required placeholder="Your name" />
            <span class="field-error">${iconFn('alert', 14)} Please enter your name.</span>
          </div>
          <button class="btn btn-primary btn-lg btn-block" type="submit">${iconFn('send', 18)} Submit Review</button>
        </form>
      </div>
    </div>
  </section>

  <!-- Community highlights -->
  <section class="section" style="background:var(--color-bg-alt)">
    <div class="container">
      ${sectionHeader({ title: 'Community Highlights', subtitle: 'Achievements and milestones from our food community.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-3" style="gap:var(--sp-4)">
        ${highlights.map(h => `
          <div class="feature-card reveal" style="text-align:left;flex-direction:row;align-items:center;gap:var(--sp-4)">
            <div class="feature-card__icon" style="margin:0"><span class="icon">${iconFn(h.icon, 28)}</span></div>
            <div>
              <div class="fs-caption text-tertiary" style="text-transform:uppercase;letter-spacing:0.04em">${h.title}</div>
              <div class="fw-semibold fs-body-lg" style="margin:2px 0">${h.stat}</div>
              <div class="fs-small text-muted">${h.desc}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>`;
}

let host;
let selectedRating = 0;

function bindEvents() {
  // Search
  const search = $('#communitySearch');
  if (search) {
    search.addEventListener('input', debounce(() => {
      feedState.search = search.value.trim();
      feedState.visible = 6;
      renderFeed();
    }, 200));
  }

  // Filters
  $('#filterRestaurant')?.addEventListener('change', e => { feedState.restaurant = e.target.value; feedState.visible = 6; renderFeed(); });
  $('#filterCuisine')?.addEventListener('change', e => { feedState.cuisine = e.target.value; feedState.visible = 6; renderFeed(); });
  $('#filterRating')?.addEventListener('change', e => { feedState.rating = parseInt(e.target.value); feedState.visible = 6; renderFeed(); });
  $('#filterSort')?.addEventListener('change', e => { feedState.sort = e.target.value; feedState.visible = 6; renderFeed(); });

  // Load more
  $('#loadMore')?.addEventListener('click', () => { feedState.visible += 6; renderFeed(); });

  // Review form star rating
  const starBtns = $$('#reviewStars .star-btn');
  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating);
      $('#ratingValue').value = selectedRating;
      starBtns.forEach(b => b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= selectedRating));
    });
    btn.addEventListener('mouseenter', () => {
      const hover = parseInt(btn.dataset.rating);
      starBtns.forEach(b => b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= hover));
    });
  });
  $('#reviewStars')?.addEventListener('mouseleave', () => {
    starBtns.forEach(b => b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= selectedRating));
  });

  // Review form submit
  $('#reviewForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    let valid = true;
    $$('.field', form).forEach(f => f.classList.remove('is-error'));
    const restaurant = form.querySelector('[name="restaurant"]');
    const food = form.querySelector('[name="food"]');
    const rating = form.querySelector('[name="rating"]');
    const text = form.querySelector('[name="text"]');
    const name = form.querySelector('[name="name"]');
    if (!restaurant.value) { restaurant.closest('.field').classList.add('is-error'); valid = false; }
    if (!food.value) { food.closest('.field').classList.add('is-error'); valid = false; }
    if (!rating.value) { toast({ title: 'Please rate', message: 'Select a star rating.', type: 'error' }); valid = false; }
    if (!text.value.trim()) { text.closest('.field').classList.add('is-error'); valid = false; }
    if (!name.value.trim()) { name.closest('.field').classList.add('is-error'); valid = false; }
    if (!valid) return;

    const r = RESTAURANTS.find(x => x.id === restaurant.value);
    const f = FOODS.find(x => x.id === food.value);
    const newReview = {
      id: 'ur-' + Date.now(),
      name: name.value.trim(),
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=120',
      restaurant: r.name,
      restaurantId: r.id,
      food: f.name,
      foodId: f.id,
      cuisine: f.category,
      rating: selectedRating,
      date: new Date().toISOString().split('T')[0],
      text: text.value.trim(),
      likes: 0,
      helpful: 0,
      verified: false,
    };

    const data = store.get('communityData', { reviews: [] });
    data.reviews.unshift(newReview);
    store.set('communityData', data);
    toast({ title: 'Review submitted!', message: 'Thanks for sharing your experience.', type: 'success' });
    form.reset();
    selectedRating = 0;
    starBtns.forEach(b => b.classList.remove('is-selected'));
    render();
    bindEvents();
    renderFeed();
    // Scroll to feed
    $('#reviewFeed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Gallery lightbox
  window._communityGalleryImages = $$('#communityGallery .gallery-item').map(item => item.dataset.img);
}

function animateStats() {
  $$('.stat-card__num[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const isFloat = target % 1 !== 0;
    const isComma = el.textContent.includes(',');
    let current = 0;
    const duration = 1500;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = target * eased;
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
  requestAnimationFrame(() => $$('.reveal:not(.is-visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('is-visible');
  }));
  setTimeout(animateStats, 300);
}

window.interactReview = function(id, type, btn) {
  const data = store.get('communityData', { reviews: [], interactions: {} });
  data.interactions = data.interactions || {};
  const key = `${id}:${type}`;
  const wasActive = data.interactions[key];
  data.interactions[key] = !wasActive;
  store.set('communityData', data);
  // Update count in button text
  const allReviews = getReviews();
  const review = allReviews.find(r => r.id === id);
  if (!review) return;
  const baseCount = type === 'helpful' ? review.helpful : review.likes;
  const newCount = wasActive ? baseCount - 1 : baseCount + 1;
  btn.classList.toggle('is-liked', !wasActive);
  const label = type === 'helpful' ? 'Helpful' : 'Like';
  btn.innerHTML = `${iconFn(type === 'helpful' ? 'thumbsUp' : 'heart', 18)} ${label} (${newCount})`;
};

window.shareReview = function() {
  toast({ title: 'Link copied', message: 'Review link copied to clipboard.', type: 'success', duration: 2200 });
};

window.openCommunityLightbox = function(index) {
  const imgs = window._communityGalleryImages || [];
  if (!imgs[index]) return;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `<button class="lightbox__close" aria-label="Close">${iconFn('close', 24)}</button><img src="${imgs[index]}" alt="Food photo" />`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('.lightbox__close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
};

document.addEventListener('DOMContentLoaded', init);
