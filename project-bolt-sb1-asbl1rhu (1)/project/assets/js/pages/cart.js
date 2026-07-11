/**
 * Shopping Cart Page
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var formatPrice = FF.formatPrice;
  var cart = FF.cart;
  var store = FF.store;
  var toast = FF.toast;
  var initReveal = FF.initReveal;
  var FOODS = FF.FOODS;
  var COUPONS = FF.COUPONS;

  var DELIVERY_OPTIONS = [
    { id: 'standard', label: 'Standard Delivery', desc: '30-45 min', fee: 2.99 },
    { id: 'express', label: 'Express Delivery', desc: '15-25 min', fee: 5.99 },
    { id: 'pickup', label: 'Self Pickup', desc: 'No delivery fee', fee: 0 },
  ];

  var deliveryMethod = store.get('deliveryMethod', 'standard');

  function getDeliveryFee() {
    var opt = DELIVERY_OPTIONS.find(function (d) { return d.id === deliveryMethod; });
    var fee = opt ? opt.fee : 2.99;
    var coupon = store.get('appliedCoupon');
    if (coupon && coupon.type === 'delivery') fee = 0;
    return fee;
  }

  function getDiscount(subtotal) {
    var coupon = store.get('appliedCoupon');
    if (!coupon) return 0;
    if (coupon.type === 'percent') return subtotal * (coupon.value / 100);
    return 0;
  }

  function render() {
    var host = $('#cartContent');
    var items = cart.get();
    var subtotal = cart.subtotal();
    var deliveryFee = getDeliveryFee();
    var discount = getDiscount(subtotal);
    var tax = (subtotal - discount) * 0.08;
    var total = subtotal + deliveryFee + tax - discount;
    var coupon = store.get('appliedCoupon');

    if (items.length === 0) {
      host.innerHTML = '<section class="section-lg"><div class="container">' +
        '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">Cart</span></nav>' +
        '<div class="card" style="max-width:520px;margin:0 auto"><div class="empty-state"><div class="empty-state__icon">' + icon('cart', 96) + '</div><h3 class="empty-state__title">Your cart is empty</h3><p class="empty-state__text">Browse our restaurants and add some delicious food to get started.</p>' +
        '<div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Browse Restaurants</a><a class="btn btn-outline" href="../index.html">Back to Home</a></div></div></div></div></section>';
      return;
    }

    var recommended = FOODS.filter(function (f) { return !items.some(function (i) { return i.id === f.id; }); }).sort(function () { return Math.random() - 0.5; }).slice(0, 4);

    host.innerHTML =
    '<section class="section-sm"><div class="container">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span class="sep" aria-hidden="true">' + icon('chevronRight', 16) + '</span><span class="current" aria-current="page">Cart</span></nav>' +
      '<h1 style="font-size:var(--fs-h1);font-weight:700;margin-top:var(--sp-4);margin-bottom:var(--sp-6)">Your Cart</h1>' +
      '<div class="split-2"><div>' +
        '<div class="card card-body"><div class="flex items-center justify-between mb-4"><h2 class="fs-body-lg fw-semibold">' + cart.count() + ' item' + (cart.count() !== 1 ? 's' : '') + ' in cart</h2>' +
        '<button class="btn btn-text" style="color:var(--color-error-600)" onclick="window.clearCart()">' + icon('trash', 16) + ' Clear cart</button></div>' +
        '<div id="cartItems">' + items.map(function (i) {
          var customsText = '';
          if (i.customizations) {
            var entries = Object.entries(i.customizations).filter(function (kv) { return kv[1] && (Array.isArray(kv[1]) ? kv[1].length : true); });
            customsText = entries.map(function (kv) { return Array.isArray(kv[1]) ? kv[0] + ': ' + kv[1].join(', ') : kv[0] + ': ' + kv[1]; }).join(' • ');
          }
          return '<div class="cart-item"><div class="cart-item__image"><img src="' + i.image + '" alt="' + i.name + '" loading="lazy" /></div>' +
            '<div class="cart-item__body"><div class="cart-item__name">' + i.name + '</div><div class="cart-item__restaurant">' + i.restaurant + '</div>' +
            (customsText ? '<div class="cart-item__custom">' + customsText + '</div>' : '') +
            '<div class="cart-item__footer"><div class="qty"><button class="qty__btn" onclick="window.changeItemQty(\'' + i.key + '\', -1)" aria-label="Decrease">' + icon('minus', 16) + '</button><span class="qty__value">' + i.qty + '</span><button class="qty__btn" onclick="window.changeItemQty(\'' + i.key + '\', 1)" aria-label="Increase">' + icon('plus', 16) + '</button></div>' +
            '<div class="flex items-center gap-4"><span class="cart-item__price">' + formatPrice(i.price * i.qty) + '</span><button class="cart-item__remove" onclick="window.removeItem(\'' + i.key + '\')" aria-label="Remove ' + i.name + '">' + icon('trash', 16) + ' Remove</button></div></div></div></div>';
        }).join('') + '</div></div>' +

        '<div class="card card-body" style="margin-top:var(--sp-5)"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Delivery Method</h3>' +
        '<div class="grid grid-cols-1" style="gap:var(--sp-3)" id="deliveryOptions">' + DELIVERY_OPTIONS.map(function (d) {
          return '<label class="pay-option ' + (deliveryMethod === d.id ? 'is-selected' : '') + '" data-delivery="' + d.id + '"><input type="radio" name="delivery" value="' + d.id + '" ' + (deliveryMethod === d.id ? 'checked' : '') + ' style="position:absolute;opacity:0" onchange="window.selectDelivery(\'' + d.id + '\')" />' +
          '<div class="pay-option__icon">' + icon(d.id === 'pickup' ? 'store' : 'truck', 22) + '</div><div style="flex:1"><div class="pay-option__label">' + d.label + '</div><div class="pay-option__desc">' + d.desc + '</div></div><span class="fw-semibold">' + (d.fee === 0 ? 'Free' : formatPrice(d.fee)) + '</span></label>';
        }).join('') + '</div></div>' +

        '<div class="card card-body" style="margin-top:var(--sp-5)"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Have a coupon?</h3>' +
        (coupon ?
          '<div class="applied-coupon"><div><div class="applied-coupon__code">' + icon('tag', 14) + ' ' + coupon.code + '</div><div class="applied-coupon__desc">' + coupon.desc + '</div></div><button class="btn btn-text" style="color:var(--color-error-600)" onclick="window.removeCoupon()">Remove</button></div>' :
          '<div class="coupon-row"><input class="input" type="text" id="couponInput" placeholder="Enter coupon code" aria-label="Coupon code" /><button class="btn btn-primary" onclick="window.applyCoupon()">Apply</button></div>' +
          '<p class="fs-caption text-tertiary" style="margin-top:var(--sp-3)">Try: WELCOME10, SAVE20, FREEDELIVERY, STUDENT15</p>') +
        '</div>' +

        '<div style="margin-top:var(--sp-7)"><div class="section-header"><div><h2 class="section-header__title" style="font-size:var(--fs-h3)">You May Also Like</h2></div></div>' +
        '<div class="grid grid-cols-2 grid-md-cols-4" style="gap:var(--sp-4)">' + recommended.map(FF.foodCard).join('') + '</div></div>' +
      '</div>' +

      '<aside><div class="summary-card"><h3 class="summary-card__title">Order Summary</h3>' +
        '<div class="summary-row"><span>Items (' + cart.count() + ')</span><span>' + formatPrice(subtotal) + '</span></div>' +
        '<div class="summary-row"><span>Delivery fee</span><span>' + (deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)) + '</span></div>' +
        (discount > 0 ? '<div class="summary-row" style="color:var(--color-success-600)"><span>Discount</span><span>-' + formatPrice(discount) + '</span></div>' : '') +
        '<div class="summary-row"><span>Estimated tax</span><span>' + formatPrice(tax) + '</span></div>' +
        '<div class="summary-row summary-row--total"><span>Total</span><span>' + formatPrice(total) + '</span></div>' +
        '<a class="btn btn-primary btn-lg btn-block" href="checkout.html" style="margin-top:var(--sp-5)">' + icon('arrowRight', 18) + ' Proceed to Checkout</a>' +
        '<a class="btn btn-text btn-block" href="restaurants.html" style="margin-top:var(--sp-2)">Continue shopping</a></div></aside>' +
      '</div>' +
    '</div></section>';

    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('is-visible');
      });
    });
  }

  function init() {
    render();
    document.addEventListener('cart:change', render);
  }

  window.changeItemQty = function (key, delta) {
    var items = cart.get();
    var item = items.find(function (i) { return i.key === key; });
    if (!item) return;
    var newQty = item.qty + delta;
    if (newQty <= 0) {
      cart.remove(key);
      toast({ title: 'Item removed', message: item.name + ' removed from cart.', type: 'info', duration: 2200 });
    } else {
      cart.setQty(key, newQty);
    }
  };

  window.removeItem = function (key) {
    var items = cart.get();
    var item = items.find(function (i) { return i.key === key; });
    cart.remove(key);
    if (item) toast({ title: 'Item removed', message: item.name + ' removed from cart.', type: 'info', duration: 2200 });
  };

  window.clearCart = function () {
    if (cart.get().length === 0) return;
    cart.clear();
    toast({ title: 'Cart cleared', type: 'info', duration: 2000 });
  };

  window.selectDelivery = function (id) {
    deliveryMethod = id;
    store.set('deliveryMethod', id);
    $$('#deliveryOptions .pay-option').forEach(function (o) { o.classList.toggle('is-selected', o.dataset.delivery === id); });
    render();
  };

  window.applyCoupon = function () {
    var input = $('#couponInput');
    var code = (input ? input.value : '').trim().toUpperCase();
    var coupon = COUPONS.find(function (c) { return c.code === code; });
    if (!coupon) { toast({ title: 'Invalid coupon', message: 'This code is not valid.', type: 'error' }); return; }
    var subtotal = cart.subtotal();
    if (subtotal < coupon.minOrder) { toast({ title: 'Minimum not met', message: 'This coupon requires a minimum order of ' + formatPrice(coupon.minOrder) + '.', type: 'error' }); return; }
    store.set('appliedCoupon', coupon);
    toast({ title: 'Coupon applied!', message: coupon.code + ' — ' + coupon.desc, type: 'success' });
    render();
  };

  window.removeCoupon = function () {
    store.remove('appliedCoupon');
    toast({ title: 'Coupon removed', type: 'info', duration: 2000 });
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
