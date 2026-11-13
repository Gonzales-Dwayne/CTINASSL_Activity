/**
 * Demo data for the Compass Schema / ERD tab.
 *
 * Compass builds its diagram from sampled documents, so an empty database shows
 * collapsed, field-less boxes. This builds the same structure in a SEPARATE
 * database (`clacklabs_demo`) and fills it with a small slice, leaving
 * `clacklabs` untouched.
 *
 * Usage: npm run demo   (inside /db)
 */
process.env.MONGODB_DB = process.env.MONGODB_DB ?? 'clacklabs_demo'

const dbName = process.env.MONGODB_DB
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'

const { MongoClient } = await import('mongodb')

// Wipe first, otherwise the drop below would also remove the views and
// validators that `schema.mjs` creates.
{
  const reset = new MongoClient(uri)
  await reset.connect()
  await reset.db(dbName).dropDatabase()
  await reset.close()
}

// Build the structure — same code path as `npm run schema`.
await import('./schema.mjs')

const client = new MongoClient(uri)
const now = new Date()

try {
  await client.connect()
  const db = client.db(dbName)
  console.log(`\nFilling ${dbName} for the demo…`)

  const products = [
    {
      name: 'ClackLabs Nova 75',
      slug: 'clacklabs-nova-75',
      category: 'Mechanical Keyboard',
      priceCents: 599000,
      stock: 24,
      description: '75% aluminum board with gasket mount.',
      image: '#1d4ed8',
    },
    {
      name: 'ClackLabs Flux 60 HE',
      slug: 'clacklabs-flux-60-he',
      category: 'Magnetic Keyboard',
      priceCents: 745000,
      stock: 9,
      description: '60% magnetic board with rapid trigger.',
      image: '#2563eb',
    },
    {
      name: 'ClackLabs Linear 45g',
      slug: 'clacklabs-linear-45g',
      category: 'Switch',
      priceCents: 115000,
      stock: 60,
      description: 'Smooth linear switch, 45g, pre-lubed.',
      image: '#3b82f6',
    },
    {
      name: 'ClackLabs PBT Cherry Beige',
      slug: 'clacklabs-pbt-cherry-beige',
      category: 'Keycaps',
      priceCents: 289000,
      stock: 18,
      description: 'Double-shot PBT Cherry profile set.',
      image: '#60a5fa',
    },
  ]
  const prodResult = await db.collection('products').insertMany(products)
  const prodId = (slug) => prodResult.insertedIds[products.findIndex((p) => p.slug === slug)]

  const userResult = await db.collection('users').insertMany([
    {
      name: 'Demo Customer',
      email: 'demo@clacklabs.dev',
      passwordHash: 'REPLACE_ME',
      role: 'customer',
      cart: [
        { productId: prodId('clacklabs-nova-75'), qty: 1 },
        { productId: prodId('clacklabs-linear-45g'), qty: 2 },
      ],
      wishlist: [prodId('clacklabs-flux-60-he'), prodId('clacklabs-pbt-cherry-beige')],
    },
    {
      name: 'ClackLabs Admin',
      email: 'admin@clacklabs.dev',
      passwordHash: 'REPLACE_ME',
      role: 'admin',
      cart: [],
      wishlist: [],
    },
  ])
  const customerId = userResult.insertedIds[0]

  await db.collection('orders').insertMany([
    {
      orderNumber: 'CL-1001',
      userId: customerId,
      items: [
        {
          productId: prodId('clacklabs-nova-75'),
          name: 'ClackLabs Nova 75',
          unitPriceCents: 599000,
          qty: 1,
        },
      ],
      totalCents: 599000,
      status: 'paid',
      placedAt: now,
    },
    {
      orderNumber: 'CL-1002',
      userId: customerId,
      items: [
        {
          productId: prodId('clacklabs-linear-45g'),
          name: 'ClackLabs Linear 45g',
          unitPriceCents: 115000,
          qty: 2,
        },
      ],
      totalCents: 230000,
      status: 'pending',
      placedAt: now,
    },
  ])

  const summary = {}
  for (const name of ['users', 'products', 'orders']) {
    summary[name] = await db.collection(name).countDocuments()
  }

  console.log(`\nDemo data in ${dbName}:`)
  for (const [name, count] of Object.entries(summary)) {
    console.log(`  ${name.padEnd(12)} ${count}`)
  }
  console.log('\nOpen Compass → Schema tab → pick the clacklabs_demo database.')
} finally {
  await client.close()
}
