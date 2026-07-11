/**
 * Checkout Page
 * Customer info, delivery address, delivery method, payment, notes, order summary, validation, order placement.
 */

import { COUPONS } from '../data.js';
import { breadcrumb } from '../components.js';
import { $, $$, formatPrice, cart, store, toast, generateOrderId, initReveal } from '../utils.js';
import { icon as iconFn } from '../icons.js';

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', desc: '30-45 min', fee: 2.99 },
  { id: 'express', label: 'Express Delivery', desc: '15-25 min', fee: 5.99 },
  { id: 'pickup', label: 'Self Pickup', desc: 'No delivery fee', fee: 0 },
];

let selectedPayment = 'cod';
let deliveryMethod = store.get('deliveryMethod', 'standard');

function getDeliveryFee() {
  const opt = DELIVERY_OPTIONS.find(d => d.id === deliveryMethod);
  let fee = opt ? opt.fee : 2.99;
  const coupon = store.get('appliedCoupon');
  if (coupon && coupon.type === 'delivery') fee = 0;
  return fee;
}

function getDiscount(subtotal) {
  const coupon = store.get('appliedCoupon');
  if (!coupon) return 0;
  if (coupon.type === 'percent') return subtotal * (coupon.value / 100);
  return 0;
}

function render() {
  const host = $('#checkoutContent');
  const items = cart.get();

  if (items.length === 0) {
    host.innerHTML = `
      <section class="section-lg">
        <div class="container">
          <div class="card" style="max-width:520px;margin:0 auto">
            <div class="empty-state">
              <div class="empty-state__icon">${iconFn('cart', 96)}</div>
              <h3 class="empty-state__title">Your cart is empty</h3>
              <p class="empty-state__text">Add items to your cart before checking out.</p>
              <div class="empty-state__actions"><a class="btn btn-primary" href="restaurants.html">Browse Restaurants</a></div>
            </div>
          </div>
        </div>
      </section>`;
    return;
  }

  const subtotal = cart.subtotal();
  const deliveryFee = getDeliveryFee();
  const discount = getDiscount(subtotal);
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal + deliveryFee + tax - discount;
  const coupon = store.get('appliedCoupon');

  host.innerHTML = `
  <section class="section-sm">
    <div class="container">
      ${breadcrumb([{ label: 'Home', href: '../index.html' }, { label: 'Cart', href: 'cart.html' }, { label: 'Checkout', href: '#' }])}

      <div class="steps" style="margin:var(--sp-4) 0 var(--sp-6)">
        <div class="step is-done"><span class="step__num">${iconFn('check', 14)}</span>Cart</div>
        <span class="step__sep"></span>
        <div class="step is-current"><span class="step__num">2</span>Checkout</div>
        <span class="step__sep"></span>
        <div class="step"><span class="step__num">3</span>Confirmation</div>
      </div>

      <div class="split-2">
        <!-- Left: forms -->
        <form id="checkoutForm" novalidate>
          <!-- Customer info -->
          <div class="card card-body" style="margin-bottom:var(--sp-5)">
            <h2 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">${iconFn('user', 20)} Customer Information</h2>
            <div class="grid grid-cols-1 grid-md-cols-2" style="gap:0 var(--sp-4)">
              <div class="field"><label class="field-label">Full Name<span class="req">*</span></label><input class="input" type="text" name="name" required /><span class="field-error">${iconFn('alert', 14)} Please enter your name.</span></div>
              <div class="field"><label class="field-label">Email<span class="req">*</span></label><input class="input" type="email" name="email" required /><span class="field-error">${iconFn('alert', 14)} Please enter a valid email.</span></div>
              <div class="field" style="grid-column:1/-1"><label class="field-label">Phone Number<span class="req">*</span></label><input class="input" type="tel" name="phone" required placeholder="+1 (555) 000-0000" /><span class="field-error">${iconFn('alert', 14)} Please enter a valid phone number.</span></div>
            </div>
          </div>

          <!-- Delivery address -->
          <div class="card card-body" style="margin-bottom:var(--sp-5)">
            <h2 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">${iconFn('mapPin', 20)} Delivery Address</h2>
            <div class="field"><label class="field-label">Street Address<span class="req">*</span></label><input class="input" type="text" name="street" required /><span class="field-error">${iconFn('alert', 14)} Please enter your street address.</span></div>
            <div class="grid grid-cols-1 grid-md-cols-3" style="gap:0 var(--sp-4)">
              <div class="field"><label class="field-label">City<span class="req">*</span></label><input class="input" type="text" name="city" required /><span class="field-error">${iconFn('alert', 14)} Required.</span></div>
              <div class="field"><label class="field-label">State<span class="req">*</span></label><input class="input" type="text" name="state" required /><span class="field-error">${iconFn('alert', 14)} Required.</span></div>
              <div class="field"><label class="field-label">Postal Code<span class="req">*</span></label><input class="input" type="text" name="postal" required /><span class="field-error">${iconFn('alert', 14)} Required.</span></div>
            </div>
            <div class="field" style="margin-bottom:0"><label class="field-label">Delivery Instructions <span class="text-tertiary fw-regular">(optional)</span></label><textarea class="textarea" name="instructions" placeholder="Leave delivery instructions or special requests..."></textarea></div>
          </div>

          <!-- Delivery method -->
          <div class="card card-body" style="margin-bottom:var(--sp-5)">
            <h2 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">${iconFn('truck', 20)} Delivery Method</h2>
            <div class="grid grid-cols-1" style="gap:var(--sp-3)" id="deliveryOpts">
              ${DELIVERY_OPTIONS.map(d => `
                <label class="pay-option ${deliveryMethod === d.id ? 'is-selected' : ''}" data-delivery="${d.id}">
                  <input type="radio" name="deliveryMethod" value="${d.id}" ${deliveryMethod === d.id ? 'checked' : ''} style="position:absolute;opacity:0" onchange="window.selectDeliveryCheckout('${d.id}')" />
                  <div class="pay-option__icon">${iconFn(d.id === 'pickup' ? 'store' : 'truck', 22)}</div>
                  <div style="flex:1"><div class="pay-option__label">${d.label}</div><div class="pay-option__desc">${d.desc}</div></div>
                  <span class="fw-semibold">${d.fee === 0 ? 'Free' : formatPrice(d.fee)}</span>
                </label>`).join('')}
            </div>
          </div>

          <!-- Payment method -->
          <div class="card card-body" style="margin-bottom:var(--sp-5)">
            <h2 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">${iconFn('wallet', 20)} Payment Method</h2>
            <div class="grid grid-cols-1 grid-md-cols-2" style="gap:var(--sp-3)" id="paymentOpts">
              <label class="pay-option ${selectedPayment === 'cod' ? 'is-selected' : ''}" data-pay="cod">
                <input type="radio" name="payment" value="cod" ${selectedPayment === 'cod' ? 'checked' : ''} style="position:absolute;opacity:0" onchange="window.selectPayment('cod')" />
                <div class="pay-option__icon">${iconFn('wallet', 22)}</div>
                <div><div class="pay-option__label">Cash on Delivery</div><div class="pay-option__desc">Pay when you receive</div></div>
              </label>
              <label class="pay-option ${selectedPayment === 'card' ? 'is-selected' : ''}" data-pay="card">
                <input type="radio" name="payment" value="card" ${selectedPayment === 'card' ? 'checked' : ''} style="position:absolute;opacity:0" onchange="window.selectPayment('card')" />
                <div class="pay-option__icon">${iconFn('lock', 22)}</div>
                <div><div class="pay-option__label">Credit / Debit Card</div><div class="pay-option__desc">Visa, Mastercard</div></div>
              </label>
              <label class="pay-option ${selectedPayment === 'ewallet' ? 'is-selected' : ''}" data-pay="ewallet">
                <input type="radio" name="payment" value="ewallet" ${selectedPayment === 'ewallet' ? 'checked' : ''} style="position:absolute;opacity:0" onchange="window.selectPayment('ewallet')" />
                <div class="pay-option__icon">${iconFn('phone', 22)}</div>
                <div><div class="pay-option__label">eWallet</div><div class="pay-option__desc">Apple Pay, Google Pay</div></div>
              </label>
              <label class="pay-option ${selectedPayment === 'banking' ? 'is-selected' : ''}" data-pay="banking">
                <input type="radio" name="payment" value="banking" ${selectedPayment === 'banking' ? 'checked' : ''} style="position:absolute;opacity:0" onchange="window.selectPayment('banking')" />
                <div class="pay-option__icon">${iconFn('shield', 22)}</div>
                <div><div class="pay-option__label">Online Banking</div><div class="pay-option__desc">Direct bank transfer</div></div>
              </label>
            </div>

            <div id="cardFields" style="display:none;margin-top:var(--sp-5)">
              <div class="grid grid-cols-1 grid-md-cols-2" style="gap:0 var(--sp-4)">
                <div class="field" style="grid-column:1/-1"><label class="field-label">Card Number</label><input class="input" type="text" name="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" /><span class="field-error">${iconFn('alert', 14)} Invalid card number.</span></div>
                <div class="field" style="grid-column:1/-1"><label class="field-label">Cardholder Name</label><input class="input" type="text" name="cardName" /><span class="field-error">${iconFn('alert', 14)} Required.</span></div>
                <div class="field"><label class="field-label">Expiry Date</label><input class="input" type="text" name="expiry" placeholder="MM/YY" maxlength="5" /><span class="field-error">${iconFn('alert', 14)} MM/YY.</span></div>
                <div class="field"><label class="field-label">CVV</label><input class="input" type="text" name="cvv" placeholder="123" maxlength="4" /><span class="field-error">${iconFn('alert', 14)} 3-4 digits.</span></div>
              </div>
              <p class="fs-caption text-tertiary" style="margin-top:var(--sp-2)">${iconFn('lock', 14)} This is a frontend simulation. No real payment is processed.</p>
            </div>
          </div>

          <!-- Order notes -->
          <div class="card card-body" style="margin-bottom:var(--sp-5)">
            <h2 class="fs-body-lg fw-semibold" style="margin-bottom:var(--sp-4)">${iconFn('message', 20)} Order Notes <span class="text-tertiary fw-regular fs-small">(optional)</span></h2>
            <textarea class="textarea" name="notes" placeholder="Leave delivery instructions or special requests..."></textarea>
          </div>

          <!-- Terms -->
          <label class="check" style="margin-bottom:var(--sp-5);font-size:var(--fs-small)"><input type="checkbox" id="termsCheck" required /><span class="box">${iconFn('check', 14)}</span>I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>.</label>

          <button class="btn btn-primary btn-lg btn-block" type="submit" id="placeOrderBtn">${iconFn('check', 20)} Place Order</button>
        </form>

        <!-- Right: summary -->
        <aside>
          <div class="summary-card">
            <h3 class="summary-card__title">Order Summary</h3>
            <div id="summaryItems" style="margin-bottom:var(--sp-4)">
              ${items.map(i => `<div class="cart-preview__item"><span class="cart-preview__item-name">${i.name} ×${i.qty}</span><span class="cart-preview__item-price">${formatPrice(i.price * i.qty)}</span></div>`).join('')}
            </div>
            ${coupon ? `<div class="applied-coupon" style="margin-bottom:var(--sp-3)"><div><div class="applied-coupon__code">${iconFn('tag', 14)} ${coupon.code}</div><div class="applied-coupon__desc">${coupon.desc}</div></div><button class="btn btn-text" style="color:var(--color-error-600)" onclick="window.removeCouponCheckout()">Remove</button></div>` : `
            <div class="coupon-row" style="margin-bottom:var(--sp-3)">
              <input class="input" type="text" id="checkoutCoupon" placeholder="Coupon code" aria-label="Coupon code" />
              <button class="btn btn-outline" onclick="window.applyCouponCheckout()">Apply</button>
            </div>`}
            <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
            <div class="summary-row"><span>Delivery</span><span>${deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span></div>
            ${discount > 0 ? `<div class="summary-row" style="color:var(--color-success-600)"><span>Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
            <div class="summary-row"><span>Tax</span><span>${formatPrice(tax)}</span></div>
            <div class="summary-row summary-row--total"><span>Total</span><span>${formatPrice(total)}</span></div>
            <div class="flex items-center gap-2 text-muted fs-small" style="margin-top:var(--sp-4)">
              ${iconFn('clock', 16)} Estimated delivery: ${deliveryMethod === 'express' ? '15-25 min' : deliveryMethod === 'pickup' ? 'Ready in 20 min' : '30-45 min'}
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>`;

  initReveal();

  // Form submit
  const form = $('#checkoutForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    handlePlaceOrder(form, total);
  });
}

function validateForm(form) {
  let valid = true;
  $$('.field', form).forEach(f => f.classList.remove('is-error'));

  const required = [
    { name: 'name', test: v => v.trim().length >= 2 },
    { name: 'email', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { name: 'phone', test: v => /^[\d\s+\-()]{7,}$/.test(v) },
    { name: 'street', test: v => v.trim().length >= 5 },
    { name: 'city', test: v => v.trim().length >= 2 },
    { name: 'state', test: v => v.trim().length >= 2 },
    { name: 'postal', test: v => v.trim().length >= 3 },
  ];

  required.forEach(({ name, test }) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (input && !test(input.value)) {
      input.closest('.field')?.classList.add('is-error');
      valid = false;
    }
  });

  if (selectedPayment === 'card') {
    const cardNum = form.querySelector('[name="cardNumber"]');
    if (cardNum && cardNum.value.replace(/\s/g, '').length < 15) { cardNum.closest('.field')?.classList.add('is-error'); valid = false; }
    const cardName = form.querySelector('[name="cardName"]');
    if (cardName && cardName.value.trim().length < 2) { cardName.closest('.field')?.classList.add('is-error'); valid = false; }
    const expiry = form.querySelector('[name="expiry"]');
    if (expiry && !/^\d{2}\/\d{2}$/.test(expiry.value)) { expiry.closest('.field')?.classList.add('is-error'); valid = false; }
    const cvv = form.querySelector('[name="cvv"]');
    if (cvv && cvv.value.length < 3) { cvv.closest('.field')?.classList.add('is-error'); valid = false; }
  }

  const terms = $('#termsCheck');
  if (terms && !terms.checked) {
    toast({ title: 'Please accept terms', message: 'You must agree to the Terms & Conditions.', type: 'error' });
    valid = false;
  }

  return valid;
}

function handlePlaceOrder(form, total) {
  if (!validateForm(form)) {
    toast({ title: 'Please check the form', message: 'Some fields need your attention.', type: 'error' });
    const firstError = $('.is-error', form);
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = $('#placeOrderBtn');
  btn.classList.add('is-loading');
  btn.disabled = true;

  const orderData = {
    id: generateOrderId(),
    date: new Date().toISOString(),
    items: cart.get(),
    customer: {
      name: form.querySelector('[name="name"]').value,
      email: form.querySelector('[name="email"]').value,
      phone: form.querySelector('[name="phone"]').value,
    },
    address: {
      street: form.querySelector('[name="street"]').value,
      city: form.querySelector('[name="city"]').value,
      state: form.querySelector('[name="state"]').value,
      postal: form.querySelector('[name="postal"]').value,
      instructions: form.querySelector('[name="instructions"]').value,
    },
    deliveryMethod,
    payment: selectedPayment,
    notes: form.querySelector('[name="notes"]').value,
    coupon: store.get('appliedCoupon'),
    total,
    status: 'confirmed',
    estimatedDelivery: deliveryMethod === 'express' ? 20 : deliveryMethod === 'pickup' ? 20 : 35,
  };

  store.set('orderData', orderData);
  const orders = store.get('completedOrders', []);
  orders.unshift(orderData);
  store.set('completedOrders', orders);

  setTimeout(() => {
    cart.clear();
    store.remove('appliedCoupon');
    window.location.href = 'order-success.html';
  }, 900);
}

function init() {
  render();
  document.addEventListener('cart:change', render);
}

window.selectPayment = function(id) {
  selectedPayment = id;
  $$('#paymentOpts .pay-option').forEach(o => o.classList.toggle('is-selected', o.dataset.pay === id));
  $('#cardFields').style.display = id === 'card' ? 'block' : 'none';
};

window.selectDeliveryCheckout = function(id) {
  deliveryMethod = id;
  store.set('deliveryMethod', id);
  $$('#deliveryOpts .pay-option').forEach(o => o.classList.toggle('is-selected', o.dataset.delivery === id));
  render();
};

window.applyCouponCheckout = function() {
  const input = $('#checkoutCoupon');
  const code = (input?.value || '').trim().toUpperCase();
  const coupon = COUPONS.find(c => c.code === code);
  if (!coupon) { toast({ title: 'Invalid coupon', message: 'This code is not valid.', type: 'error' }); return; }
  const subtotal = cart.subtotal();
  if (subtotal < coupon.minOrder) { toast({ title: 'Minimum not met', message: `Requires a minimum order of ${formatPrice(coupon.minOrder)}.`, type: 'error' }); return; }
  store.set('appliedCoupon', coupon);
  toast({ title: 'Coupon applied!', message: coupon.desc, type: 'success' });
  render();
};

window.removeCouponCheckout = function() {
  store.remove('appliedCoupon');
  render();
};

document.addEventListener('DOMContentLoaded', init);
