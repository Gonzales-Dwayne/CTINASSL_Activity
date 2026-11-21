require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const dbName = process.env.MONGODB_DB || 'clacklabs';
const dataPath = path.join(__dirname, 'data', 'products.json');

async function seed() {
  if (!fs.existsSync(dataPath)) {
    throw new Error('Missing server/data/products.json. Run `npm run catalog:sync` first.');
  }

  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const now = new Date().toISOString();

    await db.collection('products').deleteMany({});
    await db.collection('products').insertMany(products);
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ category: 1 });

    const categories = [...new Set(products.map((product) => product.category))].map(
      (name) => ({
        _id: name.toLowerCase(),
        name,
        productCount: products.filter((product) => product.category === name).length,
        updatedAt: now,
      }),
    );

    await db.collection('categories').deleteMany({});
    await db.collection('categories').insertMany(categories);

    console.log(`Seeded ${products.length} products into ${dbName}.products`);
    console.log(
      `Seeded categories: ${categories
        .map((category) => `${category.name} (${category.productCount})`)
        .join(', ')}`,
    );
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
