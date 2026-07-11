/**
 * Order Tracking Page
 * Animated timeline, countdown timer, delivery partner card, map, support, review on delivery.
 */

import { breadcrumb } from '../components.js';
import { $, $$, formatPrice, formatDate, store, toast, modal, initReveal, startCountdown } from '../utils.js';
import { icon as iconFn } from '../icons.js';

const STAGES = [
  { id: 'confirmed', label: 'Order Confirmed', icon: 'check' },
  { id: 'accepted', label: 'Restaurant Accepted', icon: 'checkCircle' },
  { id: 'preparing', label: 'Preparing Food', icon: 'utensils' },
  { id: 'ready', label: 'Ready for Pickup', icon: 'clock' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: 'truck' },
  { id: 'delivered', label: 'Delivered', icon: 'checkCircle' },
];

let currentStage = 0;
let trackingTimer;

function render() {
  const host = $('#trackingContent');
  const order = store.get('orderData');
  const trackingState = store.get('trackingState', { stage: 0, startTime: Date.now() });

  if (!order) {
    host.innerHTML = `
      <section class="section-lg">
        <div class="container">
          <div class="card" style="max-width:520px;margin:0 auto">
            <div class="empty-state">
              <div class="empty-state__icon">${iconFn('truck', 96)}</div>
              <h3 class="empty-state__title">No active order to track</h3>
              <p class="empty-state__text">Place an order to see live tracking here.</p>
              <div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Start Ordering</a></div>
            </div>
          </div>
        </div>
      </section>`;
    return;
  }

  currentStage = trackingState.stage;
  const restaurantName = order.items[0]?.restaurant || 'FoodFiesta Partner';
  const deliveryEta = Date.now() + (order.estimatedDelivery || 35) * 60000;
  const deliveryPartner = {
    name: 'Ramesh Thapa',
    vehicle: 'Motorbike',
    rating: 4.9,
    photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=120',
  };

  host.innerHTML = `
  <section class="section-sm">
    <div class="container">
      ${breadcrumb([{ label: 'Home', href: '../index.html' }, { label: 'Order Success', href: 'order-success.html' }, { label: 'Track Order', href: '#' }])}

      <!-- Tracking header -->
      <div class="card card-body reveal" style="margin-top:var(--sp-4)">
        <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--sp-4)">
          <div>
            <div class="fs-caption text-tertiary">Order Number</div>
            <h2 class="fs-body-lg fw-semibold" style="margin-top:2px">${order.id}</h2>
            <div class="fs-small text-muted" style="margin-top:4px">From ${restaurantName}</div>
          </div>
          <div style="text-align:right">
            <div class="fs-caption text-tertiary">Order Total</div>
            <div class="fw-bold" style="font-family:var(--font-heading);font-size:var(--fs-h3)">${formatPrice(order.total)}</div>
          </div>
        </div>
        <div class="flex items-center gap-4" style="margin-top:var(--sp-4);flex-wrap:wrap">
          <div class="flex items-center gap-2"><span class="status-badge status-open" id="statusBadge">In Progress</span></div>
          <div class="flex items-center gap-2">
            <span class="fs-small text-muted">Estimated arrival:</span>
            <div class="countdown" id="etaTimer"></div>
          </div>
        </div>
      </div>

      <div class="split-2" style="margin-top:var(--sp-5)">
        <!-- Left: timeline -->
        <div>
          <div class="card card-body reveal">
            <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-5)">Order Status</h3>
            <div class="timeline" id="timeline">
              ${STAGES.map((s, i) => `
                <div class="timeline__step ${i < currentStage ? 'is-done' : ''} ${i === currentStage ? 'is-current' : ''}" data-stage="${i}">
                  <div class="timeline__dot">${iconFn(s.icon, 20)}</div>
                  <div class="timeline__title">${s.label}</div>
                  <div class="timeline__time" id="stageTime-${i}">${i < currentStage ? 'Completed' : i === currentStage ? 'In progress...' : 'Pending'}</div>
                </div>`).join('')}
            </div>
          </div>

          <!-- Delivery partner -->
          <div class="card card-body reveal" style="margin-top:var(--sp-5)" id="deliveryPartner">
            <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Delivery Partner</h3>
            <div class="flex items-center gap-4">
              <div class="avatar avatar-lg"><img src="${deliveryPartner.photo}" alt="${deliveryPartner.name}" /></div>
              <div style="flex:1">
                <div class="fw-semibold fs-body-lg">${deliveryPartner.name}</div>
                <div class="fs-small text-muted">${deliveryPartner.vehicle} • ${iconFn('star', 14)} ${deliveryPartner.rating} rating</div>
              </div>
              <button class="btn btn-outline" onclick="window.contactPartner()">${iconFn('phone', 18)} Call</button>
            </div>
          </div>

          <!-- Support -->
          <div class="card card-body reveal" style="margin-top:var(--sp-5)">
            <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">Need Help?</h3>
            <div class="flex gap-3" style="flex-wrap:wrap">
              <button class="btn btn-outline btn-sm" onclick="window.supportContact('restaurant')">${iconFn('store', 16)} Contact Restaurant</button>
              <button class="btn btn-outline btn-sm" onclick="window.supportContact('partner')">${iconFn('phone', 16)} Contact Partner</button>
              <button class="btn btn-outline btn-sm" onclick="window.supportContact('support')">${iconFn('message', 16)} Customer Support</button>
            </div>
          </div>
        </div>

        <!-- Right: map + ordered items -->
        <aside>
          <div class="card reveal" style="overflow:hidden;margin-bottom:var(--sp-5)">
            <iframe src="https://www.google.com/maps?q=${encodeURIComponent(order.address.street + ', ' + order.address.city)}&output=embed" width="100%" height="300" style="border:0;display:block" loading="lazy" title="Delivery map"></iframe>
          </div>

          <div class="card card-body">
            <h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Order Items</h3>
            ${order.items.map(i => `
              <div class="cart-preview__item">
                <span class="cart-preview__item-name">${i.name} ×${i.qty}</span>
                <span class="cart-preview__item-price">${formatPrice(i.price * i.qty)}</span>
              </div>`).join('')}
            <div class="cart-preview__summary">
              <div class="cart-preview__row cart-preview__row--total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- Review on delivery (hidden until delivered) -->
  <section class="section" id="reviewSection" style="display:none">
    <div class="container">
      <div class="card card-body reveal" style="max-width:560px;margin:0 auto;text-align:center">
        <h2 style="font-size:var(--fs-h2);font-weight:700">How was your order?</h2>
        <p class="text-muted" style="margin-top:var(--sp-2)">Your feedback helps us improve and helps others choose.</p>
        <div class="stars-input" id="deliveryStars" style="justify-content:center;margin:var(--sp-5) 0">
          ${[5,4,3,2,1].map(n => `<button type="button" class="star-btn" data-rating="${n}" aria-label="${n} stars">${iconFn('star', 40)}</button>`).join('')}
        </div>
        <textarea class="textarea" id="deliveryReview" placeholder="Tell us about your experience..." style="margin-bottom:var(--sp-4)"></textarea>
        <button class="btn btn-primary btn-lg btn-block" onclick="window.submitDeliveryReview()">${iconFn('send', 18)} Submit Review</button>
      </div>
    </div>
  </section>`;

  initReveal();
  requestAnimationFrame(() => $$('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible')));

  // Start countdown
  const etaEl = $('#etaTimer');
  if (etaEl) {
    startCountdown(deliveryEta, (h, m, s) => {
      etaEl.innerHTML = `<div class="countdown__unit"><div class="countdown__num">${String(m).padStart(2,'0')}</div><div class="countdown__label">Min</div></div><div class="countdown__unit"><div class="countdown__num">${String(s).padStart(2,'0')}</div><div class="countdown__label">Sec</div></div>`;
    }, () => {
      etaEl.innerHTML = `<div class="countdown__unit"><div class="countdown__num">00</div><div class="countdown__label">Delivered</div></div>`;
    });
  }

  // Start stage progression
  startStageProgression();
}

function startStageProgression() {
  const order = store.get('orderData');
  if (!order) return;
  const stageDuration = 8000; // 8 seconds per stage for demo

  function advance() {
    if (currentStage >= STAGES.length - 1) {
      onDelivered();
      return;
    }
    // Mark current as done, move to next
    const currentEl = $(`.timeline__step[data-stage="${currentStage}"]`);
    if (currentEl) {
      currentEl.classList.remove('is-current');
      currentEl.classList.add('is-done');
      $(`#stageTime-${currentStage}`).textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    currentStage++;
    const nextEl = $(`.timeline__step[data-stage="${currentStage}"]`);
    if (nextEl) nextEl.classList.add('is-current');

    // Save state
    store.set('trackingState', { stage: currentStage, startTime: Date.now() });

    if (currentStage >= STAGES.length - 1) {
      setTimeout(onDelivered, stageDuration);
    } else {
      trackingTimer = setTimeout(advance, stageDuration);
    }
  }

  // If already delivered, show review
  if (currentStage >= STAGES.length - 1) {
    onDelivered();
  } else {
    trackingTimer = setTimeout(advance, stageDuration);
  }
}

function onDelivered() {
  const statusBadge = $('#statusBadge');
  if (statusBadge) {
    statusBadge.classList.remove('status-open');
    statusBadge.classList.add('status-closed');
    statusBadge.style.color = 'var(--color-success-600)';
    statusBadge.textContent = 'Delivered';
  }
  // Mark last stage as done
  const lastStep = $(`.timeline__step[data-stage="${STAGES.length - 1}"]`);
  if (lastStep) {
    lastStep.classList.remove('is-current');
    lastStep.classList.add('is-done');
    $(`#stageTime-${STAGES.length - 1}`).textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  // Hide delivery partner, show review section
  $('#deliveryPartner')?.style.setProperty('display', 'none');
  $('#reviewSection').style.display = 'block';
  $('#reviewSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Star rating
  let selectedRating = 0;
  const starBtns = $$('#deliveryStars .star-btn');
  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating);
      starBtns.forEach(b => b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= selectedRating));
    });
  });

  window._deliveryRating = () => selectedRating;
}

function init() {
  render();
}

window.contactPartner = function() {
  modal({ title: 'Contact Delivery Partner', body: '<p style="color:var(--text-secondary)">This is a demo. In a real app, this would connect you to your delivery partner.</p>', size: 'sm' });
};

window.supportContact = function(type) {
  const titles = { restaurant: 'Contact Restaurant', partner: 'Contact Delivery Partner', support: 'Customer Support' };
  modal({ title: titles[type] || 'Support', body: '<p style="color:var(--text-secondary)">This is a demo. In a real app, this would open a support chat or call.</p>', size: 'sm' });
};

window.submitDeliveryReview = function() {
  const rating = window._deliveryRating ? window._deliveryRating() : 0;
  const text = $('#deliveryReview')?.value.trim();
  if (rating === 0) { toast({ title: 'Please rate', message: 'Select a star rating.', type: 'error' }); return; }
  if (!text) { toast({ title: 'Please write a review', message: 'Share your experience.', type: 'error' }); return; }

  const order = store.get('orderData');
  const review = {
    id: 'dr-' + Date.now(),
    name: order.customer.name,
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=120',
    restaurantId: '',
    restaurant: order.items[0]?.restaurant || '',
    foodId: order.items[0]?.id || '',
    food: order.items[0]?.name || '',
    cuisine: '',
    rating,
    date: new Date().toISOString().split('T')[0],
    text,
    likes: 0,
    helpful: 0,
    verified: true,
  };

  const data = store.get('communityData', { reviews: [] });
  data.reviews.unshift(review);
  store.set('communityData', data);

  toast({ title: 'Review submitted!', message: 'Thanks for your feedback.', type: 'success' });
  $('#reviewSection').style.display = 'none';
};

document.addEventListener('DOMContentLoaded', init);
