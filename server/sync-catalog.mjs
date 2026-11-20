/**
 * Syncs server/data/products.json into the database without touching users,
 * orders, or existing prices/stock.
 *
 * - Products already in the database get their name, category, subcategory,
 *   description and image refreshed.
 * - Products missing from the database are inserted from the snapshot.
 * - Nothing is ever deleted.
 *
 * Usage: npm run catalog:sync (from the repo root)
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'clacklabs'

const here = dirname(fileURLToPath(import.meta.url))
const catalogPath = join(here, 'data', 'products.json')

const client = new MongoClient(uri)

try {
  const products = JSON.parse(await readFile(catalogPath, 'utf8'))

  await client.connect()
  const collection = client.db(dbName).collection('products')

  let updated = 0
  let inserted = 0
  let unchanged = 0

  for (const product of products) {
    const snapshot = {
      name: product.name,
      category: product.category,
      subcategory: product.subcategory ?? null,
      description: product.description,
      details: product.details,
      image: product.image,
    }

    const result = await collection.updateOne(
      { slug: product.slug },
      { $set: snapshot },
    )

    if (result.matchedCount > 0) {
      if (result.modifiedCount > 0) updated += 1
      else unchanged += 1
      continue
    }

    await collection.insertOne({
      ...snapshot,
      slug: product.slug,
      priceCents: product.priceCents,
      stock: product.stock,
    })
    inserted += 1
  }

  console.log(`Synced ${products.length} products into ${dbName}.`)
  console.log(`  updated:   ${updated}`)
  console.log(`  inserted:  ${inserted}`)
  console.log(`  unchanged: ${unchanged}`)
  console.log('Prices and stock of existing products were left untouched.')
} finally {
  await client.close()
}
