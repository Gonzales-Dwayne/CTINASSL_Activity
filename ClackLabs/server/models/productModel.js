const { products, categories } = require('./collections');
const { productSchema } = require('./schemas');
const { normalizeImage } = require('../utils/helpers');

async function findCartProduct(id) {
  return products().findOne({
    archived: { $ne: true },
    $or: [{ _id: id }, { id }, { slug: id }],
  });
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
  if (!(await categories().findOne({ name: category }))) {
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

module.exports = {
  productSchema,
  findCartProduct,
  parseProductInput,
};
