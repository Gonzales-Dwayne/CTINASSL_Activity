/**
 * Seeds the ClackLabs database from server/data/products.json (exported from
 * the live database with `npm run catalog:export`) plus demo users and orders.
 *
 * Usage: npm run seed -- --force
 * The seed refuses to run against a non-empty database unless --force is given.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'clacklabs'

const here = dirname(fileURLToPath(import.meta.url))
const catalogPath = join(here, 'data', 'products.json')

const USERS = [
  { name: 'ClackLabs Admin', email: 'admin@clacklabs.dev', password: 'admin123', role: 'admin' },
  { name: 'Demo Customer', email: 'demo@clacklabs.dev', password: 'demo123', role: 'customer' },
  { name: 'Angelo Reyes', email: 'angelo@example.com', password: 'angelo123', role: 'customer' },
  { name: 'Mika Santos', email: 'mika@example.com', password: 'mika123', role: 'customer' },
  { name: 'Bea Lim', email: 'bea@example.com', password: 'bea123', role: 'customer' },
  { name: 'Paolo Cruz', email: 'paolo@example.com', password: 'paolo123', role: 'customer' },
  { name: 'Rafael Tan', email: 'rafael@example.com', password: 'rafael123', role: 'customer' },
  { name: 'Jasmine Ong', email: 'jasmine@example.com', password: 'jasmine123', role: 'admin' },
]

const STATUSES = ['paid', 'packed', 'shipped', 'delivered', 'pending', 'delivered']

const client = new MongoClient(uri)

try {
  const products = JSON.parse(await readFile(catalogPath, 'utf8'))

  await client.connect()
  const db = client.db(dbName)

  const existing = await db.collection('products').countDocuments()
  if (existing > 0 && !process.argv.includes('--force')) {
    console.error(
      `Refusing to wipe ${existing} products. Re-run with --force if you really mean it:\n` +
        '  npm run seed -- --force',
    )
    await client.close()
    process.exit(1)
  }

  await Promise.all([
    db.collection('orders').deleteMany({}),
    db.collection('products').deleteMany({}),
    db.collection('users').deleteMany({}),
  ])
  console.log(`Wiped products/users/orders in ${dbName}`)

  const now = new Date()

  const userDocs = await Promise.all(
    USERS.map(async (user) => ({
      name: user.name,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
      cart: [],
      wishlist: [],
    })),
  )
  const userResult = await db.collection('users').insertMany(userDocs)
  const userIdByEmail = new Map(
    USERS.map((user, index) => [user.email, userResult.insertedIds[index]]),
  )
  console.log(`inserted ${userDocs.length} users`)

  const productResult = await db.collection('products').insertMany(products)
  const productIdBySlug = new Map(
    products.map((product, index) => [product.slug, productResult.insertedIds[index]]),
  )
  console.log(`inserted ${products.length} products`)

  const customers = USERS.filter((user) => user.role === 'customer')
  const drafted = Array.from({ length: 24 }, (_, index) => {
    const customer = customers[index % customers.length]
    const first = products[(index * 7) % products.length]
    const second = products[(index * 13 + 5) % products.length]
    const picks = index % 3 === 0 ? [first, second] : [first]

    const items = picks.map((product, itemIndex) => ({
      productId: productIdBySlug.get(product.slug),
      name: product.name,
      unitPriceCents: product.priceCents,
      qty: itemIndex === 0 ? (index % 3) + 1 : 1,
    }))

    return {
      userId: userIdByEmail.get(customer.email),
      items,
      totalCents: items.reduce((sum, item) => sum + item.unitPriceCents * item.qty, 0),
      status: index % 11 === 10 ? 'cancelled' : STATUSES[index % STATUSES.length],
      placedAt: new Date(now.getTime() - ((index % 21) + 1) * 86400000),
    }
  })

  const orders = drafted
    .sort((a, b) => b.placedAt - a.placedAt)
    .map((order, index) => ({ ...order, orderNumber: `CL-${1042 - index}` }))

  await db.collection('orders').insertMany(orders)
  console.log(`inserted ${orders.length} orders`)
  console.log('\nLogins:')
  for (const user of USERS.slice(0, 2)) {
    console.log(`  ${user.role.padEnd(8)} ${user.email} / ${user.password}`)
  }
} finally {
  await client.close()
}
