/**
 * Exports the current products from MongoDB into server/data/products.json,
 * so `npm run seed -- --force` can reproduce exactly what is in the database.
 *
 * Usage: npm run catalog:export
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'clacklabs'

const here = dirname(fileURLToPath(import.meta.url))
const target = join(here, 'data', 'products.json')

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(dbName)
  const products = await db.collection('products').find().sort({ _id: 1 }).toArray()

  const payload = products.map((product) => ({
    name: product.name,
    slug: product.slug,
    category: product.category,
    subcategory: product.subcategory ?? null,
    priceCents: product.priceCents,
    stock: product.stock,
    description: product.description,
    image: product.image,
  }))

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const lofree = payload.filter((product) => /lofree/i.test(product.name)).length
  console.log(`Exported ${payload.length} products (${lofree} Lofree) → ${target}`)
} finally {
  await client.close()
}
