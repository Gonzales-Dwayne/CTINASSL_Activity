const { carts } = require('./collections');
const { cartSchema } = require('./schemas');
const { findCartProduct } = require('./productModel');

async function normalizeCartItems(rawItems) {
  const requested = new Map();

  for (const raw of Array.isArray(rawItems) ? rawItems : []) {
    const id = String(raw?.productId || raw?.id || '').trim();
    const qty = Number(raw?.qty);
    if (!id || !Number.isInteger(qty) || qty < 1) continue;
    requested.set(id, (requested.get(id) || 0) + qty);
  }

  const items = [];
  const warnings = [];

  for (const [productId, requestedQty] of requested) {
    const product = await findCartProduct(productId);
    if (!product) {
      warnings.push({ productId, message: 'A product in your cart is no longer available.' });
      continue;
    }

    const stock = Number.isInteger(product.stock) ? product.stock : 0;
    if (stock < 1) {
      warnings.push({ productId, message: `${product.name} is out of stock.` });
      continue;
    }

    const qty = Math.min(requestedQty, stock, 99);
    if (qty < requestedQty) {
      warnings.push({
        productId,
        message: `Only ${stock} of ${product.name} ${stock === 1 ? 'is' : 'are'} available.`,
      });
    }
    items.push({ productId, qty });
  }

  return { items, warnings };
}

async function buildCartResponse(items, warnings = []) {
  const lines = [];
  let subtotalCents = 0;

  for (const item of items) {
    const product = await findCartProduct(item.productId);
    if (!product) continue;
    const priceCents = Number.isInteger(product.priceCents)
      ? product.priceCents
      : Math.round((Number(product.price) || 0) * 100);
    const stock = Number.isInteger(product.stock) ? product.stock : 0;
    subtotalCents += priceCents * item.qty;
    lines.push({
      productId: String(product.id || product._id),
      name: product.name,
      category: product.category,
      price: product.price,
      priceCents,
      image: product.image,
      stock,
      qty: item.qty,
    });
  }

  return {
    items: lines,
    count: lines.reduce((total, line) => total + line.qty, 0),
    subtotalCents,
    warnings,
  };
}

async function saveAccountCart(userId, items) {
  await carts().updateOne(
    { userId },
    {
      $set: { items, updatedAt: new Date().toISOString() },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true },
  );
}

async function readAccountCart(userId) {
  const cart = await carts().findOne({ userId });
  return Array.isArray(cart?.items) ? cart.items : [];
}

module.exports = {
  cartSchema,
  normalizeCartItems,
  buildCartResponse,
  saveAccountCart,
  readAccountCart,
};
