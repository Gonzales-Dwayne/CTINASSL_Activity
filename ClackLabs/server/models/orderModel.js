const { createHash } = require('crypto');
const { ObjectId } = require('mongodb');
const { orders } = require('./collections');
const { orderSchema } = require('./schemas');
const { readAccountCart, buildCartResponse, normalizeCartItems } = require('./cartModel');

const SHIPPING_METHODS = {
  standard: { label: 'Standard delivery', priceCents: 800, freeThresholdCents: 10000 },
  express: { label: 'Express delivery', priceCents: 1800, freeThresholdCents: null },
};
const TAX_RATE = 0.08;

const ORDER_STATUSES = [
  'pending',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

function productObjectId(id) {
  const hex = createHash('md5').update(String(id)).digest('hex').slice(0, 24);
  return new ObjectId(hex);
}

function checkoutTotals(subtotalCents, shippingMethod) {
  const method = SHIPPING_METHODS[shippingMethod];
  const shippingCents =
    method.freeThresholdCents !== null && subtotalCents >= method.freeThresholdCents
      ? 0
      : method.priceCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    shippingMethod,
    shippingLabel: method.label,
    taxRate: TAX_RATE,
  };
}

async function loadCheckoutDraft(userId, shippingMethod = 'standard', itemsOverride = null) {
  const raw =
    Array.isArray(itemsOverride) && itemsOverride.length > 0
      ? itemsOverride
      : await readAccountCart(userId);
  const normalized = await normalizeCartItems(raw);
  if (normalized.items.length === 0) {
    throw new Error('Your cart is empty.');
  }
  if (normalized.warnings.length > 0) {
    return { items: [], warnings: normalized.warnings, totals: null };
  }

  const cart = await buildCartResponse(normalized.items);
  return {
    items: cart.items,
    warnings: [],
    totals: checkoutTotals(cart.subtotalCents, shippingMethod),
  };
}

function validateCheckoutContact(body) {
  const contactEmail = String(body?.contactEmail || '').trim().toLowerCase();
  const shippingAddress = body?.shippingAddress || {};
  const fullName = String(shippingAddress.name || '').trim();
  const line1 = String(shippingAddress.line1 || '').trim();
  const city = String(shippingAddress.city || '').trim();
  const postalCode = String(shippingAddress.postalCode || '').trim();
  const country = String(shippingAddress.country || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('Enter a valid contact email.');
  }
  if (!fullName || !line1 || !city || !postalCode || !country) {
    throw new Error('Complete the required shipping address fields.');
  }

  return {
    contactEmail,
    shippingAddress: {
      name: fullName,
      line1,
      line2: String(shippingAddress.line2 || '').trim(),
      city,
      state: String(shippingAddress.state || '').trim(),
      postalCode,
      country,
      phone: String(shippingAddress.phone || '').trim(),
    },
  };
}

async function nextOrderNumber() {
  const list = await orders()
    .find({ orderNumber: /^CL-\d+$/ }, { projection: { orderNumber: 1 } })
    .toArray();
  const max = list.reduce((highest, order) => {
    const value = Number.parseInt(String(order.orderNumber).replace('CL-', ''), 10);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 1000);
  return `CL-${max + 1}`;
}

function orderLookup(value) {
  const candidates = [{ orderNumber: value }, { _id: value }];
  if (ObjectId.isValid(value)) {
    candidates.push({ _id: new ObjectId(value) });
  }
  return { $or: candidates };
}

module.exports = {
  orderSchema,
  SHIPPING_METHODS,
  TAX_RATE,
  ORDER_STATUSES,
  checkoutTotals,
  loadCheckoutDraft,
  validateCheckoutContact,
  nextOrderNumber,
  productObjectId,
  orderLookup,
};
