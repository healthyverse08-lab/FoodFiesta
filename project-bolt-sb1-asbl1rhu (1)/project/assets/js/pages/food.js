/**
 * Food Details Page
 * Gallery, customization, quantity, nutrition, reviews, frequently bought together, similar dishes.
 */

import { getFood, FOODS, getRestaurant, SEED_REVIEWS } from '../data.js';
import { foodCard, breadcrumb, sectionHeader } from '../components.js';
import { $, $$, renderStars, formatPrice, formatDate, getParam, cart, favorites, toast, recentlyViewed, initReveal } from '../utils.js';
import { icon as iconFn } from '../icons.js';

let currentFood = null;
let state = { qty: 1, size: 'medium', spice: 'mild', toppings: new Set(), drink: null, dessert: null };

const SIZE_PRICES = { small: 0, medium: 2, large: 4 };
const TOPPING_PRICES = { 'Extra Cheese': 1.5, Mushrooms: 1, Chicken: 2, Olives: 0.75, Jalapeños: 0.5 };
const DRINK_PRICES = { 'Coca-Cola': 1.99, Sprite: 1.99, Water: 0.99 };
const DESSERT_PRICES = { Brownie: 3.49, 'Ice Cream': 2.99 };

function calcTotal() {
  if (!currentFood) return 0;
  let total = currentFood.price;
  total += SIZE_PRICES[state.size] || 0;
  state.toppings.forEach(t => { total += TOPPING_PRICES[t] || 0; });
  if (state.drink) total += DRINK_PRICES[state.drink] || 0;
  if (state.dessert) total += DESSERT_PRICES[state.dessert] || 0;
  return total * state.qty;
}

function render(f) {
  const r = getRestaurant(f.restaurantId);
  const reviews = SEED_REVIEWS.filter(rv => rv.foodId === f.id);
  const similar = FOODS.filter(x => x.id !== f.id && x.category === f.category).slice(0, 4);
  const frequentlyBought = FOODS.filter(x => x.id !== f.id && x.restaurantId === f.restaurantId).slice(0, 4);
  const isFav = favorites.hasFood(f.id);

  // Gallery: main image + related dishes from same restaurant
  const relatedImgs = FOODS.filter(x => x.restaurantId === f.restaurantId && x.id !== f.id).slice(0, 3).map(x => x.image);
  const gallery = [f.image, ...relatedImgs].slice(0, 4);

  return `
  <section class="section-sm">
    <div class="container">
      <div id="crumbs" style="margin-bottom:var(--sp-4)">${breadcrumb([
        { label: 'Home', href: '../index.html' },
        { label: 'Restaurants', href: 'restaurants.html' },
        { label: r.name, href: `restaurant.html?id=${r.id}` },
        { label: f.name, href: '#' },
      ])}</div>

      <div class="food-hero">
        <!-- Left: gallery -->
        <div>
          <div class="food-gallery__main" onclick="window.openFoodLightbox(0)">
            <img src="${gallery[0]}" alt="${f.name}" id="mainFoodImg" />
          </div>
          <div class="food-gallery__thumbs">
            ${gallery.map((g, i) => `<div class="food-gallery__thumb ${i === 0 ? 'is-active' : ''}" onclick="window.switchFoodImage(${i})" data-img="${g}"><img src="${g}" alt="${f.name} view ${i+1}" loading="lazy" /></div>`).join('')}
          </div>
        </div>

        <!-- Right: info -->
        <div class="food-info">
          <div class="flex items-center gap-2" style="flex-wrap:wrap">
            ${f.veg ? '<span class="diet-badge diet-veg"><span class="dot"></span>Veg</span>' : '<span class="diet-badge diet-nonveg"><span class="dot"></span>Non-Veg</span>'}
            ${f.chefChoice ? `<span class="badge badge-accent">${iconFn('flame', 14)} Chef's Choice</span>` : ''}
            <span class="status-badge status-open">Available</span>
          </div>
          <h1 class="food-info__name" style="margin-top:var(--sp-3)">${f.name}</h1>
          <p class="text-muted" style="margin-top:4px">From <a href="restaurant.html?id=${r.id}" style="font-weight:500">${r.name}</a> • ${f.category.charAt(0).toUpperCase() + f.category.slice(1)}</p>

          <div class="food-info__meta">
            ${renderStars(f.rating, 16)}
            <span>${f.rating} (${reviews.length} reviews)</span>
            <span class="dot" style="width:3px;height:3px;border-radius:50%;background:var(--color-muted-400)"></span>
            <span>${iconFn('clock', 14)} ${f.prepTime} min</span>
            <span class="dot" style="width:3px;height:3px;border-radius:50%;background:var(--color-muted-400)"></span>
            <span>${iconFn('flame', 14)} ${f.calories} cal</span>
          </div>

          <div class="food-info__price" id="foodPrice">${formatPrice(f.price)}</div>

          <p class="text-muted" style="margin-top:var(--sp-4);line-height:var(--lh-loose)">${f.desc}</p>

          <!-- Customization -->
          <div class="customization-group">
            <div class="customization-group__title">Size <span class="text-tertiary fs-small">(choose one)</span></div>
            <div class="customization-options" id="sizeOptions">
              ${['small', 'medium', 'large'].map(s => `<button class="option-chip ${state.size === s ? 'is-selected' : ''}" data-size="${s}" onclick="window.selectSize('${s}')">${s.charAt(0).toUpperCase() + s.slice(1)}${SIZE_PRICES[s] > 0 ? `<span class="option-chip__price">+${formatPrice(SIZE_PRICES[s])}</span>` : ''}</button>`).join('')}
            </div>
          </div>

          <div class="customization-group">
            <div class="customization-group__title">Spice Level <span class="text-tertiary fs-small">(choose one)</span></div>
            <div class="customization-options">
              ${['mild', 'medium', 'hot'].map(s => `<button class="option-chip ${state.spice === s ? 'is-selected' : ''}" data-spice="${s}" onclick="window.selectSpice('${s}')">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('')}
            </div>
          </div>

          <div class="customization-group">
            <div class="customization-group__title">Extra Toppings <span class="text-tertiary fs-small">(optional)</span></div>
            <div class="customization-options">
              ${Object.keys(TOPPING_PRICES).map(t => `<button class="option-chip" data-topping="${t}" onclick="window.toggleTopping('${t}', this)">${t}<span class="option-chip__price">+${formatPrice(TOPPING_PRICES[t])}</span></button>`).join('')}
            </div>
          </div>

          <div class="customization-group">
            <div class="customization-group__title">Add a Drink <span class="text-tertiary fs-small">(optional)</span></div>
            <div class="customization-options">
              ${Object.keys(DRINK_PRICES).map(d => `<button class="option-chip" data-drink="${d}" onclick="window.selectDrink('${d}', this)">${d}<span class="option-chip__price">+${formatPrice(DRINK_PRICES[d])}</span></button>`).join('')}
            </div>
          </div>

          <div class="customization-group">
            <div class="customization-group__title">Dessert Add-on <span class="text-tertiary fs-small">(optional)</span></div>
            <div class="customization-options">
              ${Object.keys(DESSERT_PRICES).map(d => `<button class="option-chip" data-dessert="${d}" onclick="window.selectDessert('${d}', this)">${d}<span class="option-chip__price">+${formatPrice(DESSERT_PRICES[d])}</span></button>`).join('')}
            </div>
          </div>

          <!-- Quantity + actions -->
          <div class="flex items-center gap-3" style="margin-top:var(--sp-6);flex-wrap:wrap">
            <div class="qty qty--lg">
              <button class="qty__btn" onclick="window.changeQty(-1)" aria-label="Decrease quantity">${iconFn('minus', 16)}</button>
              <span class="qty__value" id="qtyDisplay">${state.qty}</span>
              <button class="qty__btn" onclick="window.changeQty(1)" aria-label="Increase quantity">${iconFn('plus', 16)}</button>
            </div>
            <button class="btn btn-outline btn-lg" data-fav-food="${f.id}" onclick="window.toggleFavFood('${f.id}', this)" aria-label="Toggle favorite" style="${isFav ? 'color:var(--color-error);border-color:var(--color-error)' : ''}">
              ${iconFn('heart', 18)} ${isFav ? 'Saved' : 'Save'}
            </button>
            <button class="btn btn-outline btn-lg" onclick="window.shareFood()">${iconFn('share', 18)} Share</button>
          </div>

          <div class="card card-body" style="margin-top:var(--sp-5);display:flex;align-items:center;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap;background:var(--color-primary-50);border:1px solid var(--color-primary-100)">
            <div>
              <div class="fs-caption text-muted">Total for ${state.qty} item${state.qty !== 1 ? 's' : ''}</div>
              <div style="font-family:var(--font-heading);font-weight:700;font-size:var(--fs-h3)" id="totalDisplay">${formatPrice(calcTotal())}</div>
            </div>
            <button class="btn btn-primary btn-lg" onclick="window.addFoodToCart()">
              ${iconFn('cart', 18)} Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Ingredients -->
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Ingredients', subtitle: 'Everything that goes into your order.' })}
      <div class="ingredient-chips reveal">
        ${f.ingredients.map(i => `<span class="ingredient-chip">${iconFn('check', 14)} ${i}</span>`).join('')}
      </div>
    </div>
  </section>

  <!-- Nutrition -->
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Nutrition', subtitle: 'Per serving nutritional information.' })}
      <div class="nutrition-grid reveal">
        <div class="nutrition-item"><div class="nutrition-item__value">${f.calories}</div><div class="nutrition-item__label">Calories</div></div>
        <div class="nutrition-item"><div class="nutrition-item__value">${f.protein}g</div><div class="nutrition-item__label">Protein</div></div>
        <div class="nutrition-item"><div class="nutrition-item__value">${f.carbs}g</div><div class="nutrition-item__label">Carbs</div></div>
        <div class="nutrition-item"><div class="nutrition-item__value">${f.fat}g</div><div class="nutrition-item__label">Fat</div></div>
        <div class="nutrition-item"><div class="nutrition-item__value">${f.fiber}g</div><div class="nutrition-item__label">Fiber</div></div>
        <div class="nutrition-item"><div class="nutrition-item__value">${f.sodium}mg</div><div class="nutrition-item__label">Sodium</div></div>
      </div>
    </div>
  </section>

  <!-- Reviews -->
  ${reviews.length ? `
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Customer Reviews', subtitle: `${reviews.length} review${reviews.length !== 1 ? 's' : ''} for this dish.` })}
      <div class="grid grid-cols-1 grid-md-cols-2" id="foodReviewList" style="gap:var(--sp-4)">
        ${reviews.map(rv => `
          <article class="review-card">
            <div class="review-card__head">
              <div class="avatar"><img src="${rv.avatar}" alt="${rv.name}" loading="lazy" /></div>
              <div style="flex:1">
                <div class="review-card__name">${rv.name}</div>
                <div class="review-card__date">${formatDate(rv.date)}</div>
              </div>
              ${renderStars(rv.rating, 16)}
            </div>
            <p class="review-card__text">${rv.text}</p>
          </article>`).join('')}
      </div>
    </div>
  </section>` : ''}

  <!-- Frequently bought together -->
  ${frequentlyBought.length ? `
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Frequently Bought Together', subtitle: 'Customers often add these too.' })}
      <div class="grid grid-cols-2 grid-md-cols-4" id="frequentlyBought" style="gap:var(--sp-4)"></div>
    </div>
  </section>` : ''}

  <!-- Similar dishes -->
  ${similar.length ? `
  <section class="section-sm">
    <div class="container">
      ${sectionHeader({ title: 'Similar Dishes', subtitle: 'You might also enjoy these.' })}
      <div class="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4" id="similarDishes" style="gap:24px"></div>
    </div>
  </section>` : ''}
  `;
}

function updateTotal() {
  const total = calcTotal();
  $('#totalDisplay').textContent = formatPrice(total);
  $('#qtyDisplay').textContent = state.qty;
}

function init() {
  const id = getParam('id');
  const f = getFood(id);
  const host = $('#foodContent');
  if (!f) {
    host.innerHTML = `<div class="container section-lg"><div class="card"><div class="empty-state"><h3 class="empty-state__title">Dish not found</h3><p class="empty-state__text">This item may no longer be available.</p><div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Browse Restaurants</a></div></div></div></div>`;
    return;
  }
  currentFood = f;
  recentlyViewed.addFood(f.id);
  document.title = `${f.name} — FoodFiesta`;

  host.innerHTML = render(f);

  // Frequently bought + similar
  const fb = FOODS.filter(x => x.id !== f.id && x.restaurantId === f.restaurantId).slice(0, 4);
  const sim = FOODS.filter(x => x.id !== f.id && x.category === f.category).slice(0, 4);
  $('#frequentlyBought').innerHTML = fb.map(x => foodCard(x)).join('');
  $('#similarDishes').innerHTML = sim.map(x => foodCard(x)).join('');

  initReveal();
  requestAnimationFrame(() => $$('.reveal:not(.is-visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('is-visible');
  }));
}

/* Window functions for food page interactions */
window.selectSize = function(s) {
  state.size = s;
  $$('#sizeOptions .option-chip').forEach(c => c.classList.toggle('is-selected', c.dataset.size === s));
  updateTotal();
};
window.selectSpice = function(s) {
  state.spice = s;
  $$('[data-spice]').forEach(c => c.classList.toggle('is-selected', c.dataset.spice === s));
};
window.toggleTopping = function(t, btn) {
  if (state.toppings.has(t)) { state.toppings.delete(t); btn.classList.remove('is-selected'); }
  else { state.toppings.add(t); btn.classList.add('is-selected'); }
  updateTotal();
};
window.selectDrink = function(d, btn) {
  if (state.drink === d) { state.drink = null; btn.classList.remove('is-selected'); }
  else { state.drink = d; $$('[data-drink]').forEach(c => c.classList.remove('is-selected')); btn.classList.add('is-selected'); }
  updateTotal();
};
window.selectDessert = function(d, btn) {
  if (state.dessert === d) { state.dessert = null; btn.classList.remove('is-selected'); }
  else { state.dessert = d; $$('[data-dessert]').forEach(c => c.classList.remove('is-selected')); btn.classList.add('is-selected'); }
  updateTotal();
};
window.changeQty = function(delta) {
  state.qty = Math.max(1, state.qty + delta);
  updateTotal();
};
window.addFoodToCart = function() {
  if (!currentFood) return;
  const customs = {
    size: state.size,
    spice: state.spice,
    toppings: [...state.toppings],
    drink: state.drink,
    dessert: state.dessert,
  };
  const adjustedFood = { ...currentFood, price: (calcTotal() / state.qty) };
  cart.add(adjustedFood, state.qty, customs);
  toast({ title: 'Added to cart', message: `${state.qty} × ${currentFood.name} added.`, type: 'success' });
};
window.switchFoodImage = function(i) {
  const imgs = $$('[data-img]');
  if (!imgs[i]) return;
  $('#mainFoodImg').src = imgs[i].dataset.img;
  $$('.food-gallery__thumb').forEach((t, idx) => t.classList.toggle('is-active', idx === i));
};
window.openFoodLightbox = function() {
  const img = $('#mainFoodImg');
  if (!img) return;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `<button class="lightbox__close" aria-label="Close">${iconFn('close', 24)}</button><img src="${img.src}" alt="${currentFood.name}" />`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('.lightbox__close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
};
window.shareFood = function() {
  toast({ title: 'Link copied', message: 'Dish link copied to clipboard.', type: 'success', duration: 2200 });
};

document.addEventListener('DOMContentLoaded', init);
