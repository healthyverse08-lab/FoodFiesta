/**
 * Order Success Page
 */

(function () {
  'use strict';

  var FF = window.FoodFiesta;
  var $ = FF.$;
  var $$ = FF.$$;
  var icon = FF.icon;
  var formatPrice = FF.formatPrice;
  var formatDate = FF.formatDate;
  var store = FF.store;
  var toast = FF.toast;
  var modal = FF.modal;
  var initReveal = FF.initReveal;

  function render() {
    var host = $('#successContent');
    var order = store.get('orderData');

    if (!order) {
      host.innerHTML = '<section class="section-lg"><div class="container"><div class="card" style="max-width:520px;margin:0 auto"><div class="empty-state"><div class="empty-state__icon">' + icon('info', 96) + '</div><h3 class="empty-state__title">No recent order found</h3><p class="empty-state__text">It looks like you haven\'t placed an order yet.</p><div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Start Ordering</a></div></div></div></div></section>';
      return;
    }

    var deliveryLabel = order.deliveryMethod === 'express' ? '15-25 min' : order.deliveryMethod === 'pickup' ? 'Ready in 20 min' : '30-45 min';
    var payLabel = ({ cod: 'Cash on Delivery', card: 'Credit Card', ewallet: 'eWallet', banking: 'Online Banking' })[order.payment] || order.payment;
    var delLabel = ({ standard: 'Standard', express: 'Express', pickup: 'Pickup' })[order.deliveryMethod] || order.deliveryMethod;

    host.innerHTML =
    '<section class="section-lg"><div class="container"><div style="max-width:640px;margin:0 auto">' +
      '<div class="text-center reveal"><div class="success-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
      '<h1 style="font-size:var(--fs-h1);font-weight:700">Order Placed Successfully!</h1><p class="text-muted" style="margin-top:var(--sp-3);font-size:var(--fs-body-lg)">Your delicious meal is being prepared and will be on its way soon.</p></div>' +

      '<div class="card card-body reveal" style="margin-top:var(--sp-6)"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">' + icon('receipt', 20) + ' Order Information</h3>' +
      '<div class="grid grid-cols-2" style="gap:var(--sp-3) var(--sp-4);font-size:var(--fs-small)">' +
        '<div><div class="fs-caption text-tertiary">Order ID</div><div class="fw-semibold">' + order.id + '</div></div>' +
        '<div><div class="fs-caption text-tertiary">Order Date</div><div class="fw-semibold">' + formatDate(order.date) + '</div></div>' +
        '<div><div class="fs-caption text-tertiary">Customer</div><div class="fw-semibold">' + order.customer.name + '</div></div>' +
        '<div><div class="fs-caption text-tertiary">Payment</div><div class="fw-semibold">' + payLabel + '</div></div>' +
        '<div><div class="fs-caption text-tertiary">Delivery</div><div class="fw-semibold">' + delLabel + '</div></div>' +
        '<div><div class="fs-caption text-tertiary">Est. Delivery</div><div class="fw-semibold">' + deliveryLabel + '</div></div>' +
        '<div style="grid-column:1/-1"><div class="fs-caption text-tertiary">Delivery Address</div><div class="fw-semibold">' + order.address.street + ', ' + order.address.city + ', ' + order.address.state + ' ' + order.address.postal + '</div></div>' +
        '<div style="grid-column:1/-1"><div class="fs-caption text-tertiary">Total Amount</div><div class="fw-semibold" style="font-size:var(--fs-h3);font-family:var(--font-heading)">' + formatPrice(order.total) + '</div></div>' +
      '</div></div>' +

      '<div class="card card-body reveal" style="margin-top:var(--sp-5)"><h3 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">Ordered Items</h3>' +
      order.items.map(function (i) {
        return '<div class="cart-item" style="padding:var(--sp-3) 0"><div class="cart-item__image"><img src="' + i.image + '" alt="' + i.name + '" loading="lazy" /></div>' +
          '<div class="cart-item__body"><div class="cart-item__name">' + i.name + '</div><div class="cart-item__restaurant">' + i.restaurant + '</div>' +
          '<div class="flex items-center justify-between" style="margin-top:var(--sp-2)"><span class="fs-small text-muted">Qty: ' + i.qty + '</span><span class="fw-semibold">' + formatPrice(i.price * i.qty) + '</span></div></div></div>';
      }).join('') +
      '</div>' +

      '<div class="flex gap-3 reveal" style="margin-top:var(--sp-6);flex-wrap:wrap;justify-content:center">' +
        '<a class="btn btn-primary btn-lg" href="order-tracking.html">' + icon('truck', 18) + ' Track Order</a>' +
        '<button class="btn btn-outline btn-lg" onclick="window.showReceipt()">' + icon('download', 18) + ' Download Receipt</button>' +
        '<a class="btn btn-text btn-lg" href="restaurants.html">Continue Shopping</a>' +
      '</div>' +
    '</div></div></section>';

    initReveal();
    requestAnimationFrame(function () {
      $$('.reveal:not(.is-visible)').forEach(function (el) { el.classList.add('is-visible'); });
    });
  }

  function showReceipt() {
    var order = store.get('orderData');
    if (!order) return;
    var subtotal = order.items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var delFee = order.deliveryMethod === 'express' ? 5.99 : order.deliveryMethod === 'pickup' ? 0 : 2.99;
    var discount = order.coupon && order.coupon.type === 'percent' ? subtotal * (order.coupon.value / 100) : 0;

    var receiptHtml =
      '<div style="font-family:var(--font-body);color:var(--text-primary)"><div style="text-align:center;margin-bottom:var(--sp-5)"><div style="font-family:var(--font-heading);font-weight:700;font-size:var(--fs-h3)">FoodFiesta</div><div class="fs-caption text-tertiary">Eat. Enjoy. Repeat.</div></div>' +
      '<div style="border:1px solid var(--color-light-200);border-radius:var(--radius-md);padding:var(--sp-4)">' +
      '<div class="flex justify-between" style="margin-bottom:var(--sp-2)"><span class="text-muted">Order No.</span><span class="fw-semibold">' + order.id + '</span></div>' +
      '<div class="flex justify-between" style="margin-bottom:var(--sp-2)"><span class="text-muted">Date</span><span>' + formatDate(order.date) + '</span></div>' +
      '<div class="flex justify-between" style="margin-bottom:var(--sp-2)"><span class="text-muted">Customer</span><span>' + order.customer.name + '</span></div>' +
      '<div class="flex justify-between" style="margin-bottom:var(--sp-4)"><span class="text-muted">Payment</span><span>' + order.payment + '</span></div>' +
      '<div style="border-top:1px solid var(--color-light);padding-top:var(--sp-3)">' +
      order.items.map(function (i) { return '<div class="flex justify-between" style="margin-bottom:var(--sp-2);font-size:var(--fs-small)"><span>' + i.name + ' ×' + i.qty + '</span><span>' + formatPrice(i.price * i.qty) + '</span></div>'; }).join('') +
      '</div><div style="border-top:1px solid var(--color-light);padding-top:var(--sp-3);margin-top:var(--sp-3)">' +
      '<div class="flex justify-between" style="margin-bottom:var(--sp-2)"><span class="text-muted">Subtotal</span><span>' + formatPrice(subtotal) + '</span></div>' +
      '<div class="flex justify-between" style="margin-bottom:var(--sp-2)"><span class="text-muted">Delivery</span><span>' + (delFee === 0 ? 'Free' : formatPrice(delFee)) + '</span></div>' +
      (order.coupon ? '<div class="flex justify-between" style="margin-bottom:var(--sp-2);color:var(--color-success-600)"><span>Discount</span><span>-' + formatPrice(discount) + '</span></div>' : '') +
      '<div class="flex justify-between" style="font-weight:700;font-family:var(--font-heading);font-size:var(--fs-body-lg);border-top:1px solid var(--color-light);padding-top:var(--sp-3);margin-top:var(--sp-3)"><span>Total</span><span>' + formatPrice(order.total) + '</span></div>' +
      '</div></div><p class="fs-caption text-tertiary" style="text-align:center;margin-top:var(--sp-4)">This is a computer-generated receipt. Thank you for ordering with FoodFiesta.</p></div>';

    modal({
      title: 'Receipt Preview',
      body: receiptHtml,
      size: 'sm',
      footer: '<button class="btn btn-primary" onclick="window.print()">' + icon('print', 18) + ' Print Receipt</button>',
    });
  }

  function init() { render(); }

  window.showReceipt = showReceipt;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
