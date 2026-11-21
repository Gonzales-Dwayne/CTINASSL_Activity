const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { ObjectId } = require('mongodb');
const { normalizeEmail } = require('../utils/helpers');
const {
  accountUser,
  parseAddress,
  updateAccountAddresses,
} = require('../models/userModel');
const { findCartProduct } = require('../models/productModel');
const {
  normalizeCartItems,
  buildCartResponse,
  saveAccountCart,
  readAccountCart,
} = require('../models/cartModel');
const { users, orders, wishlists } = require('../models/collections');

function getAccount(req, res) {
  return res.json({ user: accountUser(req.user) });
}

async function updateAccount(req, res, next) {
  try {
    const name = String(req.body?.name ?? req.user.name).trim();
    const email = normalizeEmail(req.body?.email ?? req.user.email);

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const duplicate = await users().findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Another account already uses that email.' });
    }

    await users().updateOne(
      { _id: req.user._id },
      { $set: { name, email, updatedAt: new Date().toISOString() } },
    );
    const user = await users().findOne({ _id: req.user._id });
    return res.json({ user: accountUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword) {
      return res.status(400).json({ error: 'Enter your current password.' });
    }
    if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ error: 'New password must be between 8 and 72 characters.' });
    }

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await users().updateOne(
      { _id: req.user._id },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
          updatedAt: new Date().toISOString(),
        },
      },
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const list = await orders()
      .find({ userId: req.user._id })
      .sort({ placedAt: -1 })
      .toArray();
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const idCandidates = [{ _id: req.params.id }, { orderNumber: req.params.id }];
    if (ObjectId.isValid(req.params.id)) {
      idCandidates.push({ _id: new ObjectId(req.params.id) });
    }
    const order = await orders().findOne({
      userId: req.user._id,
      $or: idCandidates,
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

function listAddresses(req, res) {
  return res.json(Array.isArray(req.user.addresses) ? req.user.addresses : []);
}

async function createAddress(req, res, next) {
  try {
    const address = parseAddress(req.body);
    const existing = Array.isArray(req.user.addresses) ? req.user.addresses : [];
    const shouldDefault = address.isDefault || existing.length === 0;
    const next = existing.map((item) => ({ ...item, isDefault: false }));
    next.push({ id: randomUUID(), ...address, isDefault: shouldDefault });
    const addresses = await updateAccountAddresses(req.user._id, next);
    return res.status(201).json(addresses);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('120')) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

async function updateAddress(req, res, next) {
  try {
    const existing = Array.isArray(req.user.addresses) ? req.user.addresses : [];
    const index = existing.findIndex((address) => address.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    const current = existing[index];
    const parsed = parseAddress({ ...current, ...req.body });
    let next = existing.map((address, itemIndex) =>
      itemIndex === index ? { ...current, ...parsed } : address,
    );
    if (req.body?.isDefault) {
      next = next.map((address) => ({
        ...address,
        isDefault: address.id === req.params.id,
      }));
    }

    const addresses = await updateAccountAddresses(req.user._id, next);
    return res.json(addresses);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('120')) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const existing = Array.isArray(req.user.addresses) ? req.user.addresses : [];
    const next = existing.filter((address) => address.id !== req.params.id);
    if (next.length === existing.length) {
      return res.status(404).json({ error: 'Address not found.' });
    }
    const addresses = await updateAccountAddresses(req.user._id, next);
    return res.json(addresses);
  } catch (error) {
    return next(error);
  }
}

async function getWishlist(req, res, next) {
  try {
    const wishlist = await wishlists().findOne({ userId: req.user._id });
    const productIds = Array.isArray(wishlist?.productIds) ? wishlist.productIds : [];
    const products = await Promise.all(productIds.map((id) => findCartProduct(id)));
    const available = products.filter(Boolean);
    return res.json({
      productIds: available.map((product) => String(product.id || product._id)),
      products: available,
    });
  } catch (error) {
    return next(error);
  }
}

async function addWishlist(req, res, next) {
  try {
    const product = await findCartProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await wishlists().updateOne(
      { userId: req.user._id },
      {
        $addToSet: { productIds: String(product.id || product._id) },
        $set: { updatedAt: new Date().toISOString() },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

async function removeWishlist(req, res, next) {
  try {
    await wishlists().updateOne(
      { userId: req.user._id },
      {
        $pull: { productIds: req.params.productId },
        $set: { updatedAt: new Date().toISOString() },
      },
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

async function getCart(req, res, next) {
  try {
    const raw = await readAccountCart(req.user._id);
    const normalized = await normalizeCartItems(raw);
    await saveAccountCart(req.user._id, normalized.items);
    return res.json(await buildCartResponse(normalized.items, normalized.warnings));
  } catch (error) {
    return next(error);
  }
}

async function putCart(req, res, next) {
  try {
    const normalized = await normalizeCartItems(req.body?.items);
    await saveAccountCart(req.user._id, normalized.items);
    return res.json(await buildCartResponse(normalized.items, normalized.warnings));
  } catch (error) {
    return next(error);
  }
}

async function mergeCart(req, res, next) {
  try {
    const existing = await readAccountCart(req.user._id);
    const combined = new Map(existing.map((item) => [item.productId, item.qty]));
    for (const item of Array.isArray(req.body?.items) ? req.body.items : []) {
      const id = String(item?.productId || item?.id || '').trim();
      const qty = Number(item?.qty);
      if (!id || !Number.isInteger(qty) || qty < 1) continue;
      combined.set(id, (combined.get(id) || 0) + qty);
    }

    const normalized = await normalizeCartItems(
      [...combined.entries()].map(([productId, qty]) => ({ productId, qty })),
    );
    await saveAccountCart(req.user._id, normalized.items);
    return res.json(await buildCartResponse(normalized.items, normalized.warnings));
  } catch (error) {
    return next(error);
  }
}

async function deleteCart(req, res, next) {
  try {
    await saveAccountCart(req.user._id, []);
    return res.json(await buildCartResponse([]));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAccount,
  updateAccount,
  changePassword,
  listOrders,
  getOrder,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addWishlist,
  removeWishlist,
  getCart,
  putCart,
  mergeCart,
  deleteCart,
};
