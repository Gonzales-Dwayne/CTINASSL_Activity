const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { normalizeEmail, slugify } = require('../utils/helpers');
const {
  parseProductInput,
} = require('../models/productModel');
const { refreshCategories } = require('../models/categoryModel');
const {
  ORDER_STATUSES,
  orderLookup,
} = require('../models/orderModel');
const {
  users,
  products,
  categories,
  orders,
} = require('../models/collections');

async function stats(req, res, next) {
  try {
    const [productCount, categoryCount, userCount, orderCount, revenue, lowStock] =
      await Promise.all([
        products().countDocuments({ archived: { $ne: true } }),
        categories().countDocuments(),
        users().countDocuments(),
        orders().countDocuments(),
        orders()
          .aggregate([{ $group: { _id: null, total: { $sum: '$totalCents' } } }])
          .toArray(),
        products()
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

    return res.json({
      products: productCount,
      categories: categoryCount,
      users: userCount,
      orders: orderCount,
      lowStock: lowStock[0]?.count || 0,
      revenueCents: revenue[0]?.total || 0,
    });
  } catch (error) {
    return next(error);
  }
}

async function listProducts(req, res, next) {
  try {
    const list = await products().find({}).sort({ sortOrder: 1, name: 1 }).toArray();
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

async function listCategories(req, res, next) {
  try {
    const list = await categories().find({}).sort({ sortOrder: 1, name: 1 }).toArray();
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
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
    if (await categories().findOne({ name })) {
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
    await categories().insertOne(category);
    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await categories().findOne({ _id: req.params.id });
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
    const duplicate = await categories().findOne({ name, _id: { $ne: category._id } });
    if (duplicate) {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }

    if (name !== category.name) {
      await products().updateMany({ category: category.name }, { $set: { category: name } });
    }
    await categories().updateOne(
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
    return res.json(await categories().findOne({ _id: category._id }));
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await categories().findOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    const productCount = await products().countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        error: `Move or archive the ${productCount} product${productCount === 1 ? '' : 's'} in this category first.`,
      });
    }
    await categories().deleteOne({ _id: category._id });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const input = await parseProductInput(req.body);
    const base = slugify(input.name) || `product-${Date.now()}`;
    let id = base;
    let suffix = 2;
    while (await products().findOne({ _id: id })) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }

    const now = new Date().toISOString();
    const last = await products()
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

    await products().insertOne(product);
    await refreshCategories();
    return res.status(201).json(product);
  } catch (error) {
    if (
      error.message.includes('Product name') ||
      error.message.includes('category') ||
      error.message.includes('Price') ||
      error.message.includes('Stock') ||
      error.message.includes('Description') ||
      error.message.includes('Low-stock') ||
      error.message.includes('SKU')
    ) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const existing = await products().findOne({
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
    await products().updateOne({ _id: existing._id }, { $set: update });
    await refreshCategories();
    return res.json(await products().findOne({ _id: existing._id }));
  } catch (error) {
    if (
      error.message.includes('Product name') ||
      error.message.includes('category') ||
      error.message.includes('Price') ||
      error.message.includes('Stock') ||
      error.message.includes('Description') ||
      error.message.includes('Low-stock') ||
      error.message.includes('SKU')
    ) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose an image to upload.' });
  }
  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
}

async function bulkArchive(req, res, next) {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((value) => String(value)).filter(Boolean)
      : [];
    const archived = Boolean(req.body?.archived);
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Select at least one product.' });
    }
    const result = await products().updateMany(
      { _id: { $in: ids } },
      { $set: { archived, updatedAt: new Date().toISOString() } },
    );
    await refreshCategories();
    return res.json({ ok: true, updated: result.modifiedCount, archived });
  } catch (error) {
    return next(error);
  }
}

async function archiveProduct(req, res, next) {
  try {
    const result = await products().updateOne(
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
}

async function restoreProduct(req, res, next) {
  try {
    const result = await products().updateOne(
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
}

async function duplicateProduct(req, res, next) {
  try {
    const product = await products().findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const base = slugify(`${product.name} copy`) || `product-copy-${Date.now()}`;
    let id = base;
    let suffix = 2;
    while (await products().findOne({ _id: id })) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }

    const now = new Date().toISOString();
    const last = await products()
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
    await products().insertOne(copy);
    await refreshCategories();
    return res.status(201).json(copy);
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const result = await products().deleteOne({
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
}

async function listOrders(req, res, next) {
  try {
    const list = await orders().find({}).sort({ placedAt: -1 }).limit(200).toArray();
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const status = String(req.body?.status || '').toLowerCase();
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Choose a valid order status.' });
    }

    const order = await orders().findOne(orderLookup(req.params.id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await orders().updateOne(
      { _id: order._id },
      { $set: { status, updatedAt: new Date().toISOString() } },
    );
    return res.json(await orders().findOne({ _id: order._id }));
  } catch (error) {
    return next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const result = await orders().deleteOne(orderLookup(req.params.id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const list = await users()
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ name: 1 })
      .toArray();
    return res.json(
      list.map((user) => ({
        ...user,
        id: user._id.toString(),
        cartCount: Array.isArray(user.cart) ? user.cart.length : 0,
        wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0,
      })),
    );
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }

    const target = await users().findOne({ _id: new ObjectId(req.params.id) });
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
      const adminCount = await users().countDocuments({ role: 'admin' });
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
    const duplicate = await users().findOne({
      email,
      _id: { $ne: target._id },
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Another account already uses that email.' });
    }

    await users().updateOne(
      { _id: target._id },
      { $set: { name, email, role, updatedAt: new Date().toISOString() } },
    );
    const updated = await users().findOne({ _id: target._id });
    return res.json({
      ...updated,
      id: updated._id.toString(),
      cartCount: Array.isArray(updated.cart) ? updated.cart.length : 0,
      wishlistCount: Array.isArray(updated.wishlist) ? updated.wishlist.length : 0,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }

    const target = await users().findOne({ _id: new ObjectId(req.params.id) });
    if (!target) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    if (target.role === 'admin') {
      const adminCount = await users().countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'The last administrator cannot be deleted.' });
      }
    }

    await users().deleteOne({ _id: target._id });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

async function resetUserPassword(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }

    const password = String(req.body?.password || '');
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
    }

    const target = await users().findOne({ _id: new ObjectId(req.params.id) });
    if (!target) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await users().updateOne(
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
}

module.exports = {
  stats,
  listProducts,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  uploadImage,
  bulkArchive,
  archiveProduct,
  restoreProduct,
  duplicateProduct,
  deleteProduct,
  listOrders,
  updateOrder,
  deleteOrder,
  listUsers,
  updateUser,
  deleteUser,
  resetUserPassword,
};
