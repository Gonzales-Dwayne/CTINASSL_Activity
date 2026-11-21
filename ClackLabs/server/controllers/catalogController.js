const { dbName } = require('../config');
const { pingDatabase } = require('../db');
const { categories, products } = require('../models/collections');

async function health(req, res) {
  try {
    await pingDatabase();
    return res.json({ status: 'ok', database: dbName });
  } catch (error) {
    return res.status(503).json({ status: 'error', message: error.message });
  }
}

function message(req, res) {
  return res.json({ message: 'Connected to ClackLabs server!' });
}

async function listCategories(req, res, next) {
  try {
    const list = await categories()
      .find({}, { projection: { _id: 0 } })
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

async function search(req, res, next) {
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

    const [result] = await products().aggregate(pipeline).toArray();
    const total = result?.meta?.[0]?.total || 0;
    return res.json({
      items: result?.items || [],
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      query: q,
      sort,
    });
  } catch (error) {
    return next(error);
  }
}

async function listProducts(req, res, next) {
  try {
    const { category, featured, search: term, limit } = req.query;
    const query = { archived: { $ne: true } };

    if (category && category !== 'All Products') {
      query.category = category;
    }
    if (featured === 'true') {
      query.featured = true;
    }
    if (term) {
      const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escaped, $options: 'i' };
    }

    let cursor = products().find(query).sort({ sortOrder: 1, name: 1 });
    if (limit && Number.isFinite(Number(limit))) {
      cursor = cursor.limit(Math.max(1, Math.min(200, Number(limit))));
    }

    return res.json(await cursor.toArray());
  } catch (error) {
    return next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await products().findOne({
      archived: { $ne: true },
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  health,
  message,
  listCategories,
  search,
  listProducts,
  getProduct,
};
