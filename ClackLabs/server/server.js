require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { randomUUID, createHash } = require('crypto');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const dbName = process.env.MONGODB_DB || 'clacklabs';
const JWT_SECRET = process.env.JWT_SECRET || 'clacklabs-local-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const client = new MongoClient(uri);

let db;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/images', express.static(path.join(__dirname, '..', 'client', 'src', 'assets', 'images')));
app.use('/uploads', express.static(uploadDir));

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadDir),
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.webp';
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Only image uploads are allowed.'));
    }
    return callback(null, true);
  },
});

function getDb(req, res, next) {
  if (!db) {
    return res.status(503).json({ error: 'Database is not connected yet.' });
  }
  return next();
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function authResponse(user) {
  return { token: createToken(user), user: publicUser(user) };
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!ObjectId.isValid(payload.sub)) {
      return res.status(401).json({ error: 'Invalid session.' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub) });
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    if (user.passwordChangedAt) {
      const changedAt = new Date(user.passwordChangedAt).getTime();
      const issuedAt = Number(payload.iat || 0) * 1000;
      if (Number.isFinite(changedAt) && issuedAt < changedAt) {
        return res.status(401).json({ error: 'Password changed. Please sign in again.' });
      }
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

app.get('/api/health', async (req, res) => {
  try {
    await client.db('admin').command({ ping: 1 });
    res.json({ status: 'ok', database: dbName });
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});

app.get('/api/message', (req, res) => {
  res.json({ message: 'Connected to ClackLabs server!' });
});

app.post('/api/auth/register', getDb, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: 'Please enter a name between 2 and 80 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
    }

    const users = db.collection('users');
    if (await users.findOne({ email })) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      name,
      email,
      passwordHash,
      role: 'customer',
      cart: [],
      wishlist: [],
      createdAt: now,
      updatedAt: now,
    });

    const user = await users.findOne({ _id: result.insertedId });
    return res.status(201).json(authResponse(user));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    return next(error);
  }
});

app.post('/api/auth/login', getDb, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user?.passwordHash) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    return res.json(authResponse(user));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', getDb, requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// ---------------------------------------------------------------------------
// Customer account
// ---------------------------------------------------------------------------

function accountUser(user) {
  return {
    ...publicUser(user),
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
  };
}

async function updateAccountAddresses(userId, addresses) {
  const normalized = addresses.map((address) => ({ ...address, isDefault: false }));
  if (normalized.length > 0) {
    const preferred = addresses.findIndex((address) => address.isDefault);
    normalized[preferred >= 0 ? preferred : 0].isDefault = true;
  }
  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { addresses: normalized, updatedAt: new Date().toISOString() } },
  );
  return normalized;
}

function parseAddress(body) {
  const label = String(body.label || 'Home').trim();
  const name = String(body.name || '').trim();
  const line1 = String(body.line1 || '').trim();
  const line2 = String(body.line2 || '').trim();
  const city = String(body.city || '').trim();
  const state = String(body.state || '').trim();
  const postalCode = String(body.postalCode || '').trim();
  const country = String(body.country || '').trim();
  const phone = String(body.phone || '').trim();

  if (!name || !line1 || !city || !postalCode || !country) {
    throw new Error('Name, street, city, postal code, and country are required.');
  }
  if ([label, name, line1, line2, city, state, postalCode, country, phone].some(
    (value) => value.length > 120,
  )) {
    throw new Error('Address fields must be 120 characters or fewer.');
  }

  return {
    label,
    name,
    line1,
    line2,
    city,
    state,
    postalCode,
    country,
    phone,
    isDefault: Boolean(body.isDefault),
  };
}

async function findCartProduct(id) {
  return db.collection('products').findOne({
    archived: { $ne: true },
    $or: [{ _id: id }, { id }, { slug: id }],
  });
}

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
  await db.collection('carts').updateOne(
    { userId },
    {
      $set: { items, updatedAt: new Date().toISOString() },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true },
  );
}

async function readAccountCart(userId) {
  const cart = await db.collection('carts').findOne({ userId });
  return Array.isArray(cart?.items) ? cart.items : [];
}

app.get('/api/account', getDb, requireAuth, (req, res) => {
  res.json({ user: accountUser(req.user) });
});

app.patch('/api/account', getDb, requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? req.user.name).trim();
    const email = normalizeEmail(req.body?.email ?? req.user.email);

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const duplicate = await db.collection('users').findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Another account already uses that email.' });
    }

    await db.collection('users').updateOne(
      { _id: req.user._id },
      { $set: { name, email, updatedAt: new Date().toISOString() } },
    );
    const user = await db.collection('users').findOne({ _id: req.user._id });
    return res.json({ user: accountUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/account/password', getDb, requireAuth, async (req, res, next) => {
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
    await db.collection('users').updateOne(
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
});

app.get('/api/account/orders', getDb, requireAuth, async (req, res, next) => {
  try {
    const orders = await db
      .collection('orders')
      .find({ userId: req.user._id })
      .sort({ placedAt: -1 })
      .toArray();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

app.get('/api/account/orders/:id', getDb, requireAuth, async (req, res, next) => {
  try {
    const idCandidates = [{ _id: req.params.id }, { orderNumber: req.params.id }];
    if (ObjectId.isValid(req.params.id)) {
      idCandidates.push({ _id: new ObjectId(req.params.id) });
    }
    const order = await db.collection('orders').findOne({
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
});

app.get('/api/account/addresses', getDb, requireAuth, (req, res) => {
  res.json(Array.isArray(req.user.addresses) ? req.user.addresses : []);
});

app.post('/api/account/addresses', getDb, requireAuth, async (req, res, next) => {
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
});

app.patch('/api/account/addresses/:id', getDb, requireAuth, async (req, res, next) => {
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
});

app.delete('/api/account/addresses/:id', getDb, requireAuth, async (req, res, next) => {
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
});

app.get('/api/account/wishlist', getDb, requireAuth, async (req, res, next) => {
  try {
    const wishlist = await db.collection('wishlists').findOne({ userId: req.user._id });
    const productIds = Array.isArray(wishlist?.productIds) ? wishlist.productIds : [];
    const products = await Promise.all(productIds.map((id) => findCartProduct(id)));
    const available = products.filter(Boolean);
    res.json({
      productIds: available.map((product) => String(product.id || product._id)),
      products: available,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/account/wishlist/:productId', getDb, requireAuth, async (req, res, next) => {
  try {
    const product = await findCartProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await db.collection('wishlists').updateOne(
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
});

app.delete('/api/account/wishlist/:productId', getDb, requireAuth, async (req, res, next) => {
  try {
    await db.collection('wishlists').updateOne(
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
});

app.get('/api/account/cart', getDb, requireAuth, async (req, res, next) => {
  try {
    const raw = await readAccountCart(req.user._id);
    const normalized = await normalizeCartItems(raw);
    await saveAccountCart(req.user._id, normalized.items);
    res.json(await buildCartResponse(normalized.items, normalized.warnings));
  } catch (error) {
    next(error);
  }
});

app.put('/api/account/cart', getDb, requireAuth, async (req, res, next) => {
  try {
    const normalized = await normalizeCartItems(req.body?.items);
    await saveAccountCart(req.user._id, normalized.items);
    res.json(await buildCartResponse(normalized.items, normalized.warnings));
  } catch (error) {
    next(error);
  }
});

app.post('/api/account/cart/merge', getDb, requireAuth, async (req, res, next) => {
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
    res.json(await buildCartResponse(normalized.items, normalized.warnings));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/account/cart', getDb, requireAuth, async (req, res, next) => {
  try {
    await saveAccountCart(req.user._id, []);
    res.json(await buildCartResponse([]));
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

const SHIPPING_METHODS = {
  standard: { label: 'Standard delivery', priceCents: 800, freeThresholdCents: 10000 },
  express: { label: 'Express delivery', priceCents: 1800, freeThresholdCents: null },
};
const TAX_RATE = 0.08;

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
    await saveAccountCart(userId, normalized.items);
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
  const contactEmail = normalizeEmail(body?.contactEmail);
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
  const orders = await db
    .collection('orders')
    .find({ orderNumber: /^CL-\d+$/ }, { projection: { orderNumber: 1 } })
    .toArray();
  const max = orders.reduce((highest, order) => {
    const value = Number.parseInt(String(order.orderNumber).replace('CL-', ''), 10);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 1000);
  return `CL-${max + 1}`;
}

app.post('/api/checkout/summary', getDb, requireAuth, async (req, res, next) => {
  try {
    const shippingMethod = SHIPPING_METHODS[req.body?.shippingMethod]
      ? req.body.shippingMethod
      : 'standard';
    const draft = await loadCheckoutDraft(
      req.user._id,
      shippingMethod,
      req.body?.items,
    );
    res.json(draft);
  } catch (error) {
    if (error.message === 'Your cart is empty.') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

app.post('/api/checkout', getDb, requireAuth, async (req, res, next) => {
  const purchased = [];
  try {
    const shippingMethod = SHIPPING_METHODS[req.body?.shippingMethod]
      ? req.body.shippingMethod
      : 'standard';
    const paymentMethod = String(req.body?.paymentMethod || 'cod');
    if (!['cod', 'demo-card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Choose a valid payment method.' });
    }
    const contact = validateCheckoutContact(req.body);
    const draft = await loadCheckoutDraft(
      req.user._id,
      shippingMethod,
      req.body?.items,
    );

    if (draft.warnings.length > 0) {
      return res.status(409).json({
        error: draft.warnings[0].message,
        warnings: draft.warnings,
      });
    }

    const orderNumber = await nextOrderNumber();
    const items = [];

    for (const line of draft.items) {
      const result = await db.collection('products').updateOne(
        {
          _id: line.productId,
          archived: { $ne: true },
          stock: { $gte: line.qty },
        },
        { $inc: { stock: -line.qty } },
      );
      if (result.modifiedCount !== 1) {
        for (const item of purchased) {
          await db
            .collection('products')
            .updateOne({ _id: item.productId }, { $inc: { stock: item.qty } });
        }
        return res.status(409).json({
          error: `${line.name} no longer has enough stock.`,
        });
      }
      purchased.push({ productId: line.productId, qty: line.qty });
      items.push({
        productId: productObjectId(line.productId),
        name: line.name,
        unitPriceCents: line.priceCents,
        qty: line.qty,
      });
    }

    const order = {
      orderNumber,
      userId: req.user._id,
      items,
      totalCents: draft.totals.totalCents,
      subtotalCents: draft.totals.subtotalCents,
      shippingCents: draft.totals.shippingCents,
      taxCents: draft.totals.taxCents,
      status: paymentMethod === 'demo-card' ? 'paid' : 'pending',
      paymentMethod,
      contactEmail: contact.contactEmail,
      shippingAddress: contact.shippingAddress,
      shippingMethod: draft.totals.shippingLabel,
      placedAt: new Date(),
    };

    let result;
    try {
      result = await db.collection('orders').insertOne(order);
    } catch (insertError) {
      for (const item of purchased) {
        await db
          .collection('products')
          .updateOne({ _id: item.productId }, { $inc: { stock: item.qty } });
      }
      throw insertError;
    }

    await saveAccountCart(req.user._id, []);
    await db.collection('notifications').insertOne({
      type: 'order_confirmation',
      to: contact.contactEmail,
      orderId: result.insertedId,
      status: 'pending',
      createdAt: new Date(),
    });

    const saved = await db.collection('orders').findOne({ _id: result.insertedId });
    res.status(201).json({
      order: saved,
      orderId: result.insertedId.toString(),
    });
  } catch (error) {
    if (error.message.includes('contact email') || error.message.includes('shipping address')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Your cart is empty.') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeImage(value) {
  const image = String(value || '').trim();
  if (!image) return '/images/Flow84.webp';
  if (/^https?:\/\//i.test(image)) return image;
  return image.startsWith('/') ? image : `/${image}`;
}

async function refreshCategories() {
  const counts = await db
    .collection('products')
    .aggregate([
      { $match: { archived: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ])
    .toArray();
  const countByName = new Map(counts.map((entry) => [entry._id, entry.count]));
  const existing = await db.collection('categories').find({}).sort({ sortOrder: 1 }).toArray();
  const now = new Date().toISOString();
  const knownNames = new Set(existing.map((category) => category.name));
  let nextSortOrder = existing.length;

  for (const category of existing) {
    await db.collection('categories').updateOne(
      { _id: category._id },
      {
        $set: {
          productCount: countByName.get(category.name) || 0,
          updatedAt: now,
        },
      },
    );
  }

  for (const entry of counts) {
    if (!entry._id || knownNames.has(entry._id)) continue;
    await db.collection('categories').insertOne({
      _id: String(entry._id).toLowerCase(),
      name: entry._id,
      description: '',
      image: '',
      productCount: entry.count,
      sortOrder: nextSortOrder,
      updatedAt: now,
    });
    nextSortOrder += 1;
  }
}

async function parseProductInput(body, existing = null) {
  const name = String(body.name ?? existing?.name ?? '').trim();
  const category = String(body.category ?? existing?.category ?? '').trim();
  const price = Number(body.price ?? existing?.price ?? 0);
  const stock = Number(body.stock ?? existing?.stock ?? 0);
  const description = String(
    body.description ??
      existing?.description ??
      `A ${category || 'ClackLabs'} product from the ClackLabs collection.`,
  ).trim();
  const image = normalizeImage(body.image ?? existing?.image ?? '');
  const featured = Boolean(body.featured ?? existing?.featured ?? false);
  const sku = String(body.sku ?? existing?.sku ?? '').trim();
  const barcode = String(body.barcode ?? existing?.barcode ?? '').trim();
  const restockNote = String(body.restockNote ?? existing?.restockNote ?? '').trim();
  const lowStockThreshold = Number(
    body.lowStockThreshold ?? existing?.lowStockThreshold ?? 5,
  );
  const details = Array.isArray(body.details)
    ? body.details.map((item) => String(item).trim()).filter(Boolean)
    : Array.isArray(existing?.details)
      ? existing.details
      : [];
  const specs =
    body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)
      ? Object.fromEntries(
          Object.entries(body.specs)
            .map(([key, value]) => [String(key).trim(), String(value).trim()])
            .filter(([key, value]) => key && value),
        )
      : existing?.specs && typeof existing.specs === 'object'
        ? existing.specs
        : {};

  if (name.length < 2 || name.length > 120) {
    throw new Error('Product name must be between 2 and 120 characters.');
  }
  const categoryExists = await db.collection('categories').findOne({ name: category });
  if (!categoryExists) {
    throw new Error('Choose a valid product category.');
  }
  if (!Number.isInteger(price) || price < 1 || price > 100000) {
    throw new Error('Price must be a whole dollar amount between 1 and 100000.');
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    throw new Error('Stock must be a whole number between 0 and 100000.');
  }
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 1000) {
    throw new Error('Low-stock threshold must be between 0 and 1000.');
  }
  if (description.length < 10 || description.length > 2000) {
    throw new Error('Description must be between 10 and 2000 characters.');
  }
  if (sku.length > 80 || barcode.length > 80 || restockNote.length > 500) {
    throw new Error('SKU/barcode must be 80 characters or fewer and restock note 500 or fewer.');
  }

  return {
    name,
    category,
    price,
    priceCents: price * 100,
    stock,
    description,
    image,
    imageFile: image.split('/').pop(),
    featured,
    sku,
    barcode,
    lowStockThreshold,
    restockNote,
    details,
    specs,
  };
}

app.get('/api/admin/stats', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [products, categories, users, orders, revenue, lowStock] = await Promise.all([
      db.collection('products').countDocuments({ archived: { $ne: true } }),
      db.collection('categories').countDocuments(),
      db.collection('users').countDocuments(),
      db.collection('orders').countDocuments(),
      db
        .collection('orders')
        .aggregate([{ $group: { _id: null, total: { $sum: '$totalCents' } } }])
        .toArray(),
      db
        .collection('products')
        .aggregate([
          { $match: { archived: { $ne: true } } },
          {
            $match: {
              $expr: {
                $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 5] }],
              },
            },
          },
          { $count: 'count' },
        ])
        .toArray(),
    ]);

    res.json({
      products,
      categories,
      users,
      orders,
      lowStock: lowStock[0]?.count || 0,
      revenueCents: revenue[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/products', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const products = await db
      .collection('products')
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/categories', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const categories = await db
      .collection('categories')
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/categories', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const image = String(req.body?.image || '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? 0);

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ error: 'Category name must be between 2 and 60 characters.' });
    }
    if (description.length > 500) {
      return res.status(400).json({ error: 'Category description must be 500 characters or fewer.' });
    }
    if (!Number.isInteger(sortOrder)) {
      return res.status(400).json({ error: 'Sort order must be a whole number.' });
    }
    if (await db.collection('categories').findOne({ name })) {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }

    const category = {
      _id: slugify(name) || `category-${Date.now()}`,
      name,
      description,
      image: image
        ? /^https?:\/\//i.test(image)
          ? image
          : image.startsWith('/')
            ? image
            : `/${image}`
        : '',
      productCount: 0,
      sortOrder,
      updatedAt: new Date().toISOString(),
    };
    await db.collection('categories').insertOne(category);
    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }
    return next(error);
  }
});

app.patch('/api/admin/categories/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const categories = db.collection('categories');
    const category = await categories.findOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const name = String(req.body?.name ?? category.name).trim();
    const description = String(req.body?.description ?? category.description ?? '').trim();
    const image = String(req.body?.image ?? category.image ?? '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? category.sortOrder ?? 0);

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ error: 'Category name must be between 2 and 60 characters.' });
    }
    if (description.length > 500) {
      return res.status(400).json({ error: 'Category description must be 500 characters or fewer.' });
    }
    if (!Number.isInteger(sortOrder)) {
      return res.status(400).json({ error: 'Sort order must be a whole number.' });
    }
    const duplicate = await categories.findOne({ name, _id: { $ne: category._id } });
    if (duplicate) {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }

    if (name !== category.name) {
      await db
        .collection('products')
        .updateMany({ category: category.name }, { $set: { category: name } });
    }
    await categories.updateOne(
      { _id: category._id },
      {
        $set: {
          name,
          description,
          image: image
            ? /^https?:\/\//i.test(image)
              ? image
              : image.startsWith('/')
                ? image
                : `/${image}`
            : '',
          sortOrder,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    await refreshCategories();
    return res.json(await categories.findOne({ _id: category._id }));
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/categories/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const categories = db.collection('categories');
    const category = await categories.findOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    const productCount = await db
      .collection('products')
      .countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        error: `Move or archive the ${productCount} product${productCount === 1 ? '' : 's'} in this category first.`,
      });
    }
    await categories.deleteOne({ _id: category._id });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/products', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const input = await parseProductInput(req.body);
    const base = slugify(input.name) || `product-${Date.now()}`;
    let id = base;
    let suffix = 2;
    while (await db.collection('products').findOne({ _id: id })) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }

    const now = new Date().toISOString();
    const last = await db
      .collection('products')
      .find({}, { projection: { sortOrder: 1 } })
      .sort({ sortOrder: -1 })
      .limit(1)
      .toArray();

    const product = {
      _id: id,
      id,
      slug: id,
      ...input,
      currency: 'USD',
      archived: false,
      sourceUrl: null,
      detailsUpdatedAt: now,
      sortOrder: (last[0]?.sortOrder || 0) + 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('products').insertOne(product);
    await refreshCategories();
    res.status(201).json(product);
  } catch (error) {
    if (error.message.includes('Product name') ||
        error.message.includes('category') ||
        error.message.includes('Price') ||
        error.message.includes('Stock') ||
        error.message.includes('Description') ||
        error.message.includes('Low-stock') ||
        error.message.includes('SKU')) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

app.put('/api/admin/products/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const products = db.collection('products');
    const existing = await products.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const input = await parseProductInput(req.body, existing);
    const update = {
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await products.updateOne({ _id: existing._id }, { $set: update });
    await refreshCategories();
    return res.json(await products.findOne({ _id: existing._id }));
  } catch (error) {
    if (error.message.includes('Product name') ||
        error.message.includes('category') ||
        error.message.includes('Price') ||
        error.message.includes('Stock') ||
        error.message.includes('Description') ||
        error.message.includes('Low-stock') ||
        error.message.includes('SKU')) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

app.post('/api/admin/upload', getDb, requireAuth, requireAdmin, imageUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose an image to upload.' });
  }
  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

app.post('/api/admin/products/bulk', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((value) => String(value)).filter(Boolean)
      : [];
    const archived = Boolean(req.body?.archived);
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Select at least one product.' });
    }
    const result = await db.collection('products').updateMany(
      { _id: { $in: ids } },
      { $set: { archived, updatedAt: new Date().toISOString() } },
    );
    await refreshCategories();
    return res.json({ ok: true, updated: result.modifiedCount, archived });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/products/:id/archive', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.collection('products').updateOne(
      { $or: [{ _id: req.params.id }, { slug: req.params.id }] },
      { $set: { archived: true, updatedAt: new Date().toISOString() } },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await refreshCategories();
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/products/:id/restore', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.collection('products').updateOne(
      { $or: [{ _id: req.params.id }, { slug: req.params.id }] },
      { $set: { archived: false, updatedAt: new Date().toISOString() } },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await refreshCategories();
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/products/:id/duplicate', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await db.collection('products').findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const base = slugify(`${product.name} copy`) || `product-copy-${Date.now()}`;
    let id = base;
    let suffix = 2;
    while (await db.collection('products').findOne({ _id: id })) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }

    const now = new Date().toISOString();
    const last = await db
      .collection('products')
      .find({}, { projection: { sortOrder: 1 } })
      .sort({ sortOrder: -1 })
      .limit(1)
      .toArray();
    const copy = {
      ...product,
      _id: id,
      id,
      slug: id,
      name: `${product.name} Copy`,
      stock: 0,
      featured: false,
      archived: false,
      sku: '',
      barcode: '',
      sortOrder: (last[0]?.sortOrder || 0) + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('products').insertOne(copy);
    await refreshCategories();
    return res.status(201).json(copy);
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/products/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.collection('products').deleteOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await refreshCategories();
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/orders', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await db
      .collection('orders')
      .find({})
      .sort({ placedAt: -1 })
      .limit(200)
      .toArray();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

const ORDER_STATUSES = [
  'pending',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

function orderLookup(value) {
  const candidates = [{ orderNumber: value }, { _id: value }];
  if (ObjectId.isValid(value)) {
    candidates.push({ _id: new ObjectId(value) });
  }
  return { $or: candidates };
}

app.patch('/api/admin/orders/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body?.status || '').toLowerCase();
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Choose a valid order status.' });
    }

    const orders = db.collection('orders');
    const order = await orders.findOne(orderLookup(req.params.id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await orders.updateOne(
      { _id: order._id },
      { $set: { status, updatedAt: new Date().toISOString() } },
    );
    return res.json(await orders.findOne({ _id: order._id }));
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/orders/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.collection('orders').deleteOne(orderLookup(req.params.id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/users', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await db
      .collection('users')
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ name: 1 })
      .toArray();
    res.json(
      users.map((user) => ({
        ...user,
        id: user._id.toString(),
        cartCount: Array.isArray(user.cart) ? user.cart.length : 0,
        wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0,
      })),
    );
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/users/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }

    const users = db.collection('users');
    const target = await users.findOne({ _id: new ObjectId(req.params.id) });
    if (!target) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const isSelf = target._id.equals(req.user._id);
    const role = req.body?.role ?? target.role;
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Choose a valid account role.' });
    }
    if (isSelf && role !== target.role) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }
    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await users.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'The last administrator cannot be demoted.' });
      }
    }

    const name = String(req.body?.name ?? target.name).trim();
    const email = normalizeEmail(req.body?.email ?? target.email);
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const duplicate = await users.findOne({
      email,
      _id: { $ne: target._id },
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Another account already uses that email.' });
    }

    await users.updateOne(
      { _id: target._id },
      { $set: { name, email, role, updatedAt: new Date().toISOString() } },
    );
    const updated = await users.findOne({ _id: target._id });
    return res.json({
      ...updated,
      id: updated._id.toString(),
      cartCount: Array.isArray(updated.cart) ? updated.cart.length : 0,
      wishlistCount: Array.isArray(updated.wishlist) ? updated.wishlist.length : 0,
    });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/users/:id', getDb, requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }

    const users = db.collection('users');
    const target = await users.findOne({ _id: new ObjectId(req.params.id) });
    if (!target) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    if (target.role === 'admin') {
      const adminCount = await users.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'The last administrator cannot be deleted.' });
      }
    }

    await users.deleteOne({ _id: target._id });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.patch(
  '/api/admin/users/:id/password',
  getDb,
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid customer id.' });
      }

      const password = String(req.body?.password || '');
      if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
      }

      const users = db.collection('users');
      const target = await users.findOne({ _id: new ObjectId(req.params.id) });
      if (!target) {
        return res.status(404).json({ error: 'Customer not found.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await users.updateOne(
        { _id: target._id },
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
  },
);

app.get('/api/categories', getDb, async (req, res, next) => {
  try {
    const categories = await db
      .collection('categories')
      .find({}, { projection: { _id: 0 } })
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get('/api/search', getDb, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const availability = String(req.query.availability || '').trim();
    const sort = String(req.query.sort || (q ? 'relevance' : 'featured'));
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(48, Number.parseInt(req.query.limit, 10) || 12));
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = { archived: { $ne: true } };

    if (category) query.category = category;
    if (availability === 'in-stock') query.stock = { $gt: 0 };
    if (availability === 'out-of-stock') query.stock = { $lte: 0 };
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      query.priceCents = {};
      if (Number.isFinite(minPrice)) query.priceCents.$gte = Math.round(minPrice * 100);
      if (Number.isFinite(maxPrice)) query.priceCents.$lte = Math.round(maxPrice * 100);
    }
    if (q) {
      const regex = new RegExp(escaped, 'i');
      query.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { sku: regex },
      ];
    }

    const pipeline = [{ $match: query }];
    if (q) {
      const lower = q.toLowerCase();
      pipeline.push({
        $addFields: {
          _searchScore: {
            $add: [
              { $cond: [{ $eq: [{ $toLower: '$name' }, lower] }, 120, 0] },
              {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ['$name', ''] }, regex: `^${escaped}`, options: 'i' } },
                  60,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ['$name', ''] }, regex: escaped, options: 'i' } },
                  35,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ['$category', ''] }, regex: escaped, options: 'i' } },
                  18,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: escaped, options: 'i' } },
                  6,
                  0,
                ],
              },
            ],
          },
        },
      });
    }

    const sortStages = {
      relevance: { _searchScore: -1, featured: -1, sortOrder: 1 },
      featured: { featured: -1, sortOrder: 1, name: 1 },
      'price-asc': { priceCents: 1, name: 1 },
      'price-desc': { priceCents: -1, name: 1 },
      name: { name: 1 },
      newest: { createdAt: -1 },
    };
    pipeline.push({
      $facet: {
        items: [
          { $sort: sortStages[sort] || sortStages.featured },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { _searchScore: 0 } },
        ],
        meta: [{ $count: 'total' }],
      },
    });

    const [result] = await db.collection('products').aggregate(pipeline).toArray();
    const total = result?.meta?.[0]?.total || 0;
    res.json({
      items: result?.items || [],
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      query: q,
      sort,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', getDb, async (req, res, next) => {
  try {
    const { category, featured, search, limit } = req.query;
    const query = { archived: { $ne: true } };

    if (category && category !== 'All Products') {
      query.category = category;
    }
    if (featured === 'true') {
      query.featured = true;
    }
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escaped, $options: 'i' };
    }

    let cursor = db.collection('products').find(query).sort({ sortOrder: 1, name: 1 });
    if (limit && Number.isFinite(Number(limit))) {
      cursor = cursor.limit(Math.max(1, Math.min(200, Number(limit))));
    }

    res.json(await cursor.toArray());
  } catch (error) {
    next(error);
  }
});

app.get('/api/products/:id', getDb, async (req, res, next) => {
  try {
    const product = await db.collection('products').findOne({
      archived: { $ne: true },
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

async function start() {
  await client.connect();
  db = client.db(dbName);
  await client.db('admin').command({ ping: 1 });

  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('carts').createIndex({ userId: 1 }, { unique: true });
    await db.collection('wishlists').createIndex({ userId: 1 }, { unique: true });
  } catch (error) {
    console.warn('Could not create account indexes:', error.message);
  }

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set; using the local development secret.');
  }

  app.listen(PORT, () => {
    console.log(`ClackLabs API running at http://localhost:${PORT}`);
    console.log(`MongoDB connected: ${uri} (database: ${dbName})`);
  });
}

start().catch((error) => {
  console.error('Failed to start ClackLabs API:', error);
  process.exit(1);
});
