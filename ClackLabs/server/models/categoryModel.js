const { products, categories } = require('./collections');
const { categorySchema } = require('./schemas');

async function refreshCategories() {
  const counts = await products()
    .aggregate([
      { $match: { archived: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ])
    .toArray();
  const countByName = new Map(counts.map((entry) => [entry._id, entry.count]));
  const existing = await categories().find({}).sort({ sortOrder: 1 }).toArray();
  const now = new Date().toISOString();
  const knownNames = new Set(existing.map((category) => category.name));
  let nextSortOrder = existing.length;

  for (const category of existing) {
    await categories().updateOne(
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
    await categories().insertOne({
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

module.exports = {
  categorySchema,
  refreshCategories,
};
