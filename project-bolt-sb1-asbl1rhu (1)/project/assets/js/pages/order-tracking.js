/**
 * Order Tracking Page
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var formatPrice = FF.formatPrice;
  var store = FF.store;
  var toast = FF.toast;
  var modal = FF.modal;
  var initReveal = FF.initReveal;
  var startCountdown = FF.startCountdown;

  var STAGES = [
    { id: 'confirmed', label: 'Order Confirmed', icon: 'check' },
    { id: 'accepted', label: 'Restaurant Accepted', icon: 'checkCircle' },
    { id: 'preparing', label: 'Preparing Food', icon: 'utensils' },
    { id: 'ready', label: 'Ready for Pickup', icon: 'clock' },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: 'truck' },
    { id: 'delivered', label: 'Delivered', icon: 'checkCircle' },
  ];

  var currentStage = 0;
  var trackingTimer = null;

  function render() {
    var host = $('#trackingContent');
    var order = store.get('orderData');
    var trackingState = store.get('trackingState', { stage: 0, startTime: Date.now() });

    if (!order) {
      host.innerHTML = '<section class="section-lg"><div class="container"><div class="card" style="max-width:520px;margin:0 auto"><div class="empty-state"><div class="empty-state__icon">' + icon('truck', 96) + '</div><h3 class="empty-state__title">No active order to track</h3><p class="empty-state__text">Place an order to see live tracking here.</p><div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Start Ordering</a></div></div></div></div></section>';
      return;
    }

    currentStage = trackingState.stage;
    var restaurantName = (order.items[0] && order.items[0].restaurant) || 'FoodFiesta Partner';
    var deliveryEta = Date.now() + (order.estimatedDelivery || 35) * 60000;
    var deliveryPartner = {
      name: 'Ramesh Thapa', vehicle: 'Motorcycle', rating: 4.9,
      photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=120',
    };

    host.innerHTML =
    '<section class="section-sm"><div class="container">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><a href="order-success.html">Order Success</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">Track Order</span></nav>' +

      '<div class="card card-body reveal" style="margin-top:var(--sp-4)"><div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--sp-4)"><div><div class="fs-caption text-tertiary">Order Number</div><h2 class="fs-body-lg fw-semibold" style="margin-top:2px">' + order.id + '</h2><div class="fs-small text-muted" style="margin-top:4px">From ' + restaurantName + '</div></div>' +
      '<div style="text-align:right"><div class="fs-caption text-tertiary">Order Total</div><div class="fw-bold" style="font-family:var(--font-heading);font-size:var(--fs-h3)">' + formatPrice(order.total) + '</div></div></div>' +
      '<div class="flex items-center gap-4" style="margin-top:var(--sp-4);flex-wrap:wrap"><div class="flex items-center gap-2"><span class="status-badge status-open" id="statusBadge">In Progress</span></div>' +
      '<div class="flex items-center gap-2"><span class="fs-small text-muted">Estimated arrival:</span><div class="countdown" id="etaTimer"></div></div></div></div>' +

      '<div class="split-2" style="margin-top:var(--sp-5)"><div>' +
        '<div class="card card-body reveal"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-5)">Order Status</h3><div class="timeline" id="timeline">' +
          STAGES.map(function (s, i) {
            return '<div class="timeline__step ' + (i < currentStage ? 'is-done' : '') + ' ' + (i === currentStage ? 'is-current' : '') + '" data-stage="' + i + '"><div class="timeline__dot">' + icon(s.icon, 20) + '</div><div class="timeline__title">' + s.label + '</div><div class="timeline__time" id="stageTime-' + i + '">' + (i < currentStage ? 'Completed' : i === currentStage ? 'In progress...' : 'Pending') + '</div></div>';
          }).join('') +
        '</div></div>' +

        '<div class="card card-body reveal" style="margin-top:var(--sp-5)" id="deliveryPartner"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Delivery Partner</h3>' +
        '<div class="flex items-center gap-4"><div class="avatar avatar-lg"><img src="' + deliveryPartner.photo + '" alt="' + deliveryPartner.name + '" /></div>' +
        '<div style="flex:1"><div class="fw-semibold fs-body-lg">' + deliveryPartner.name + '</div><div class="fs-small text-muted">' + deliveryPartner.vehicle + ' • ' + icon('star', 14) + ' ' + deliveryPartner.rating + ' rating</div></div>' +
        '<button class="btn btn-outline" onclick="window.contactPartner()">' + icon('phone', 18) + ' Call</button></div></div>' +

        '<div class="card card-body reveal" style="margin-top:var(--sp-5)"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-3)">Need Help?</h3><div class="flex gap-3" style="flex-wrap:wrap">' +
        '<button class="btn btn-outline btn-sm" onclick="window.supportContact(\'restaurant\')">' + icon('store', 16) + ' Contact Restaurant</button>' +
        '<button class="btn btn-outline btn-sm" onclick="window.supportContact(\'partner\')">' + icon('phone', 16) + ' Contact Partner</button>' +
        '<button class="btn btn-outline btn-sm" onclick="window.supportContact(\'support\')">' + icon('message', 16) + ' Customer Support</button></div></div>' +
      '</div>' +

      '<aside><div class="card reveal" style="overflow:hidden;margin-bottom:var(--sp-5)"><iframe src="https://www.google.com/maps?q=' + encodeURIComponent(order.address.street + ', ' + order.address.city) + '&output=embed" width="100%" height="300" style="border:0;display:block" loading="lazy" title="Delivery map"></iframe></div>' +
      '<div class="card card-body"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Order Items</h3>' +
      order.items.map(function (i) { return '<div class="cart-preview__item"><span class="cart-preview__item-name">' + i.name + ' ×' + i.qty + '</span><span class="cart-preview__item-price">' + formatPrice(i.price * i.qty) + '</span></div>'; }).join('') +
      '<div class="cart-preview__summary"><div class="cart-preview__row cart-preview__row--total"><span>Total</span><span>' + formatPrice(order.total) + '</span></div></div></div></aside>' +
      '</div>' +
    '</div></section>' +

    '<section class="section" id="reviewSection" style="display:none"><div class="container"><div class="card card-body reveal" style="max-width:560px;margin:0 auto;text-align:center">' +
      '<h2 style="font-size:var(--fs-h2);font-weight:700">How was your order?</h2><p class="text-muted" style="margin-top:var(--sp-2)">Your feedback helps us improve and helps others choose.</p>' +
      '<div class="stars-input" id="deliveryStars" style="justify-content:center;margin:var(--sp-5) 0">' + [5, 4, 3, 2, 1].map(function (n) { return '<button type="button" class="star-btn" data-rating="' + n + '" aria-label="' + n + ' stars">' + icon('star', 40) + '</button>'; }).join('') + '</div>' +
      '<textarea class="textarea" id="deliveryReview" placeholder="Tell us about your experience..." style="margin-bottom:var(--sp-4)"></textarea>' +
      '<button class="btn btn-primary btn-lg btn-block" onclick="window.submitDeliveryReview()">' + icon('send', 18) + ' Submit Review</button></div></div></section>';

    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) { el.classList.add('is-visible'); });
    });

    var etaEl = $('#etaTimer');
    if (etaEl) {
      startCountdown(deliveryEta, function (h, m, s) {
        etaEl.innerHTML = '<div class="countdown__unit"><div class="countdown__num">' + String(m).padStart(2, '0') + '</div><div class="countdown__label">Min</div></div><div class="countdown__unit"><div class="countdown__num">' + String(s).padStart(2, '0') + '</div><div class="countdown__label">Sec</div></div>';
      }, function () {
        etaEl.innerHTML = '<div class="countdown__unit"><div class="countdown__num">00</div><div class="countdown__label">Delivered</div></div>';
      });
    }

    startStageProgression();
  }

  function startStageProgression() {
    var order = store.get('orderData');
    if (!order) return;
    var stageDuration = 8000;

    function advance() {
      if (currentStage >= STAGES.length - 1) { onDelivered(); return; }
      var currentEl = document.querySelector('.timeline__step[data-stage="' + currentStage + '"]');
      if (currentEl) {
        currentEl.classList.remove('is-current');
        currentEl.classList.add('is-done');
        var st = document.getElementById('stageTime-' + currentStage);
        if (st) st.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      currentStage++;
      var nextEl = document.querySelector('.timeline__step[data-stage="' + currentStage + '"]');
      if (nextEl) nextEl.classList.add('is-current');
      store.set('trackingState', { stage: currentStage, startTime: Date.now() });
      if (currentStage >= STAGES.length - 1) { setTimeout(onDelivered, stageDuration); }
      else { trackingTimer = setTimeout(advance, stageDuration); }
    }

    if (currentStage >= STAGES.length - 1) { onDelivered(); }
    else { trackingTimer = setTimeout(advance, stageDuration); }
  }

  function onDelivered() {
    var statusBadge = $('#statusBadge');
    if (statusBadge) {
      statusBadge.classList.remove('status-open');
      statusBadge.classList.add('status-closed');
      statusBadge.style.color = 'var(--color-success-600)';
      statusBadge.textContent = 'Delivered';
    }
    var lastStep = document.querySelector('.timeline__step[data-stage="' + (STAGES.length - 1) + '"]');
    if (lastStep) {
      lastStep.classList.remove('is-current');
      lastStep.classList.add('is-done');
      var st = document.getElementById('stageTime-' + (STAGES.length - 1));
      if (st) st.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    var dp = $('#deliveryPartner'); if (dp) dp.style.display = 'none';
    var rs = $('#reviewSection'); if (rs) { rs.style.display = 'block'; rs.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

    var selectedRating = 0;
    var starBtns = $$('#deliveryStars .star-btn');
    starBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedRating = parseInt(btn.dataset.rating);
        starBtns.forEach(function (b) { b.classList.toggle('is-selected', parseInt(b.dataset.rating) <= selectedRating); });
      });
    });
    window._deliveryRating = function () { return selectedRating; };
  }

  function init() { render(); }

  window.contactPartner = function () {
    modal({ title: 'Contact Delivery Partner', body: '<p style="color:var(--text-secondary)">This is a demo. In a real app, this would connect you to your delivery partner.</p>', size: 'sm' });
  };

  window.supportContact = function (type) {
    var titles = { restaurant: 'Contact Restaurant', partner: 'Contact Delivery Partner', support: 'Customer Support' };
    modal({ title: titles[type] || 'Support', body: '<p style="color:var(--text-secondary)">This is a demo. In a real app, this would open a support chat or call.</p>', size: 'sm' });
  };

  window.submitDeliveryReview = function () {
    var rating = window._deliveryRating ? window._deliveryRating() : 0;
    var text = $('#deliveryReview');
    var textVal = text ? text.value.trim() : '';
    if (rating === 0) { toast({ title: 'Please rate', message: 'Select a star rating.', type: 'error' }); return; }
    if (!textVal) { toast({ title: 'Please write a review', message: 'Share your experience.', type: 'error' }); return; }

    var order = store.get('orderData');
    var review = {
      id: 'dr-' + Date.now(),
      name: order.customer.name,
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=120',
      restaurantId: '', restaurant: (order.items[0] && order.items[0].restaurant) || '',
      foodId: (order.items[0] && order.items[0].id) || '', food: (order.items[0] && order.items[0].name) || '',
      cuisine: '', rating: rating, date: new Date().toISOString().split('T')[0],
      text: textVal, likes: 0, helpful: 0, verified: true,
    };
    var data = store.get('communityData', { reviews: [] });
    data.reviews.unshift(review);
    store.set('communityData', data);
    toast({ title: 'Review submitted!', message: 'Thanks for your feedback.', type: 'success' });
    var rs = $('#reviewSection'); if (rs) rs.style.display = 'none';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
