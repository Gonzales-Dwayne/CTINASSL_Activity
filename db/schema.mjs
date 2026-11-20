/**
 * ClackLabs — core database structure (collections, validators, indexes,
 * relationship views). No documents are inserted.
 *
 * Three collections, minimal fields:
 *   users    — name, email, passwordHash, role, cart[], wishlist[]
 *   products — name, slug, category, priceCents, stock, description, image
 *   orders   — orderNumber, userId, items[], totalCents, status, placedAt
 *
 * Usage: npm run schema        (inside /db)
 *        MONGODB_URI=... MONGODB_DB=... npm run schema
 *        node schema.mjs --drop   (wipe and rebuild)
 */
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'clacklabs'

const client = new MongoClient(uri)

const SCHEMAS = {
  users: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'passwordHash', 'role'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
        passwordHash: { bsonType: 'string' },
        role: { enum: ['customer', 'admin'] },
        cart: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['productId', 'qty'],
            properties: {
              productId: { bsonType: 'objectId' },
              qty: { bsonType: 'int', minimum: 1 },
            },
          },
        },
        wishlist: { bsonType: 'array', items: { bsonType: 'objectId' } },
      },
    },
  },
  products: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'name',
        'slug',
        'category',
        'priceCents',
        'stock',
        'description',
        'image',
      ],
      properties: {
        name: { bsonType: 'string' },
        slug: { bsonType: 'string' },
        category: { bsonType: 'string' },
        subcategory: { bsonType: ['string', 'null'] },
        priceCents: { bsonType: 'int', minimum: 0 },
        stock: { bsonType: 'int', minimum: 0 },
        description: { bsonType: 'string' },
        details: { bsonType: 'array', items: { bsonType: 'string' } },
        image: { bsonType: 'string' },
      },
    },
  },
  orders: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'orderNumber',
        'userId',
        'items',
        'totalCents',
        'status',
        'placedAt',
      ],
      properties: {
        orderNumber: { bsonType: 'string' },
        userId: { bsonType: 'objectId' },
        items: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['productId', 'name', 'unitPriceCents', 'qty'],
            properties: {
              productId: { bsonType: 'objectId' },
              name: { bsonType: 'string' },
              unitPriceCents: { bsonType: 'int', minimum: 0 },
              qty: { bsonType: 'int', minimum: 1 },
            },
          },
        },
        totalCents: { bsonType: 'int', minimum: 0 },
        status: {
          enum: ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'],
        },
        placedAt: { bsonType: 'date' },
      },
    },
  },
}

const INDEXES = {
  users: [
    { keys: { email: 1 }, options: { unique: true } },
    { keys: { wishlist: 1 } },
  ],
  products: [
    { keys: { slug: 1 }, options: { unique: true } },
    { keys: { category: 1, subcategory: 1 } },
    { keys: { priceCents: 1 } },
    {
      keys: { name: 'text', description: 'text' },
      options: { name: 'product_text' },
    },
  ],
  orders: [
    { keys: { orderNumber: 1 }, options: { unique: true } },
    { keys: { userId: 1, placedAt: -1 } },
    { keys: { status: 1 } },
  ],
}

// Read-only views that resolve the references for you.
const VIEWS = {
  user_cart: {
    source: 'users',
    pipeline: [
      { $match: { cart: { $ne: [] } } },
      {
        $lookup: {
          from: 'products',
          localField: 'cart.productId',
          foreignField: '_id',
          as: 'cartProducts',
        },
      },
      { $project: { passwordHash: 0 } },
    ],
  },
  order_details: {
    source: 'orders',
    pipeline: [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'customer.passwordHash': 0,
          'customer._id': 0,
          'customer.cart': 0,
          'customer.wishlist': 0,
        },
      },
    ],
  },
}

async function ensureCollection(db, name, validator) {
  const exists = await db.listCollections({ name }).hasNext()
  if (exists) {
    await db.command({ collMod: name, validator, validationLevel: 'strict' })
    return 'updated'
  }
  await db.createCollection(name, { validator, validationLevel: 'strict' })
  return 'created'
}

async function ensureView(db, name, { source, pipeline }) {
  const exists = await db.listCollections({ name }).hasNext()
  if (exists) await db.command({ drop: name })
  await db.command({ create: name, viewOn: source, pipeline })
  return exists ? 'recreated' : 'created'
}

try {
  await client.connect()
  const db = client.db(dbName)

  console.log(`Connected to ${uri}`)
  console.log(`Database: ${dbName}\n`)

  if (process.argv.includes('--drop')) {
    await db.dropDatabase()
    console.log(`Dropped database ${dbName}\n`)
  }

  for (const [name, validator] of Object.entries(SCHEMAS)) {
    const result = await ensureCollection(db, name, validator)
    console.log(`collection ${name.padEnd(12)} ${result}`)
  }

  console.log('')
  for (const [name, indexes] of Object.entries(INDEXES)) {
    for (const { keys, options } of indexes) {
      await db.collection(name).createIndex(keys, options ?? {})
    }
    console.log(`indexes    ${name.padEnd(12)} ${indexes.length} ensured`)
  }

  console.log('')
  for (const [name, view] of Object.entries(VIEWS)) {
    const result = await ensureView(db, name, view)
    console.log(`view       ${name.padEnd(12)} ${result}`)
  }

  const all = await db.listCollections({}).toArray()
  const views = all.filter((c) => c.type === 'view').map((c) => c.name).sort()
  const collections = all
    .filter((c) => c.type !== 'view' && !c.name.startsWith('system.'))
    .map((c) => c.name)
    .sort()

  console.log('\nStructure only — no documents inserted.')
  console.log(`Collections (${collections.length}): ${collections.join(', ')}`)
  console.log(`Views (${views.length}): ${views.join(', ')}`)
} finally {
  await client.close()
}
