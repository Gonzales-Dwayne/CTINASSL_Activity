const fs = require('fs');
const path = require('path');
const { getProductDetails } = require('./product-details.cjs');

const sourcePath = path.join(__dirname, '..', 'client', 'src', 'data', 'products.js');
const outputPath = path.join(__dirname, 'data', 'products.json');
const source = fs.readFileSync(sourcePath, 'utf8');

const imports = new Map();
const importPattern = /import p(\d+) from '([^']+)';/g;
for (const match of source.matchAll(importPattern)) {
  imports.set(match[1], match[2].replace('../assets/images/', ''));
}

const featuredIds = new Set([
  'lofree-flow-84-white',
  'lofree-flow-lite-2-84-white',
  'lofree-tofu-68',
  'lofree-block-101',
  'lofree-edge-grey',
  'lofree-hyzen-silver',
]);

const productPattern =
  /\{\s*id:\s*("(?:[^"\\]|\\.)*")\s*,\s*name:\s*("(?:[^"\\]|\\.)*")\s*,\s*category:\s*"([^"]+)"\s*,\s*price:\s*(\d+)\s*,\s*image:\s*p(\d+)\s*,?\s*\}/g;

const now = new Date().toISOString();
const products = [];

for (const match of source.matchAll(productPattern)) {
  const id = JSON.parse(match[1]);
  const name = JSON.parse(match[2]);
  const category = match[3];
  const price = Number(match[4]);
  const imageFile = imports.get(match[5]);

  if (!imageFile) {
    throw new Error(`Missing image import for ${name}`);
  }

  const researched = getProductDetails({ name, category });

  products.push({
    _id: id,
    id,
    slug: id,
    name,
    category,
    price,
    priceCents: price * 100,
    currency: 'USD',
    stock: 12 + ((products.length * 7) % 37),
    description: researched.description,
    details: researched.details,
    specs: researched.specs,
    sourceUrl: researched.sourceUrl,
    detailsUpdatedAt: now,
    image: `/images/${imageFile.split(path.sep).join('/')}`,
    imageFile,
    featured: featuredIds.has(id),
    sortOrder: products.length,
    createdAt: now,
    updatedAt: now,
  });
}

if (products.length === 0) {
  throw new Error('No products were parsed from the client catalogue.');
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Synced ${products.length} products to ${outputPath}`);
