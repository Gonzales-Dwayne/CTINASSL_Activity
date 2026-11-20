import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { MongoClient, ObjectId } from 'mongodb'

const PORT = Number(process.env.PORT ?? 4000)
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const MONGODB_DB = process.env.MONGODB_DB ?? 'clacklabs'
const JWT_SECRET = process.env.JWT_SECRET ?? 'clacklabs-dev-secret'
const TOKEN_TTL = '7d'

const client = new MongoClient(MONGODB_URI)
await client.connect()
const db = client.db(MONGODB_DB)

const app = express()
app.use(cors())
app.use(express.json())

const users = db.collection('users')
const products = db.collection('products')
const orders = db.collection('orders')

function toProduct(doc) {
  return {
    id: doc.slug,
    name: doc.name,
    category: doc.category,
    subcategory: doc.subcategory ?? null,
    priceCents: doc.priceCents,
    stock: doc.stock,
    description: doc.description,
    image: doc.image,
  }
}

function toUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  }
}

function signToken(doc) {
  return jwt.sign(
    { sub: doc._id.toString(), role: doc.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  )
}

function authenticate(role) {
  return (req, res, next) => {
    const header = req.get('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      res.status(401).json({ error: 'Missing access token.' })
      return
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET)
      if (role && payload.role !== role) {
        res.status(403).json({ error: 'Admin access required.' })
        return
      }
      req.userId = payload.sub
      req.userRole = payload.role
      next()
    } catch {
      res.status(401).json({ error: 'Invalid or expired token.' })
    }
  }
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function validateProduct(body) {
  const name = String(body.name ?? '').trim()
  const category = String(body.category ?? '').trim()
  const priceCents = Number(body.priceCents)
  const stock = Number(body.stock)

  if (!name) return { error: 'Product name is required.' }
  if (!category) return { error: 'Category is required.' }
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    return { error: 'Price must be a whole number of cents.' }
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'Stock must be zero or more.' }
  }

  return {
    value: {
      name,
      slug: String(body.slug ?? slugify(`${category}-${name}`)),
      category,
      subcategory: body.subcategory ? String(body.subcategory) : null,
      priceCents,
      stock,
      description: String(body.description ?? ''),
      image: String(body.image ?? '#2563eb'),
    },
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: MONGODB_DB })
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    const user = await users.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Those credentials do not match an account.' })
      return
    }

    res.json({ user: toUser(user), token: signToken(user) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!name) {
      res.status(400).json({ error: 'Name is required.' })
      return
    }
    if (!/^.+@.+\..+$/.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' })
      return
    }

    const existing = await users.findOne({ email })
    if (existing) {
      res.status(409).json({ error: 'An account with that email already exists.' })
      return
    }

    const doc = {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'customer',
      cart: [],
      wishlist: [],
    }
    const result = await users.insertOne(doc)
    doc._id = result.insertedId

    res.status(201).json({ user: toUser(doc), token: signToken(doc) })
  } catch (error) {
    next(error)
  }
})

async function cartForUser(userId) {
  const user = await users.findOne({ _id: new ObjectId(userId) })
  const lines = user?.cart ?? []
  if (lines.length === 0) return []

  const docs = await products
    .find({ _id: { $in: lines.map((line) => line.productId) } })
    .toArray()
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]))

  return lines.flatMap((line) => {
    const doc = byId.get(line.productId.toString())
    if (!doc) return []
    return [{ product: toProduct(doc), qty: line.qty }]
  })
}

app.get('/api/cart', authenticate(), async (req, res, next) => {
  try {
    res.json({ items: await cartForUser(req.userId) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/cart', authenticate(), async (req, res, next) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : []
    const slugs = rawItems
      .map((item) => String(item?.productId ?? ''))
      .filter(Boolean)

    const docs = slugs.length
      ? await products.find({ slug: { $in: slugs } }).toArray()
      : []
    const idBySlug = new Map(docs.map((doc) => [doc.slug, doc._id]))

    const cart = rawItems.flatMap((item) => {
      const productId = idBySlug.get(String(item?.productId ?? ''))
      const qty = Number(item?.qty)
      if (!productId || !Number.isInteger(qty) || qty < 1 || qty > 99) return []
      return [{ productId, qty }]
    })

    await users.updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { cart } },
    )

    res.json({ items: await cartForUser(req.userId) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/orders', authenticate(), async (req, res, next) => {
  try {
    const user = await users.findOne({ _id: new ObjectId(req.userId) })
    const cart = user?.cart ?? []

    if (cart.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' })
      return
    }

    const docs = await products
      .find({ _id: { $in: cart.map((line) => line.productId) } })
      .toArray()
    const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]))

    const items = []
    for (const line of cart) {
      const doc = byId.get(line.productId.toString())
      if (!doc) continue
      if (doc.stock < line.qty) {
        res.status(409).json({
          error: `${doc.name} only has ${doc.stock} left in stock.`,
        })
        return
      }
      items.push({
        productId: doc._id,
        name: doc.name,
        unitPriceCents: doc.priceCents,
        qty: line.qty,
      })
    }

    if (items.length === 0) {
      res.status(400).json({ error: 'Those products are no longer available.' })
      return
    }

    for (const item of items) {
      const result = await products.updateOne(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
      )
      if (result.modifiedCount === 0) {
        res.status(409).json({ error: `${item.name} is out of stock.` })
        return
      }
    }

    const now = new Date()
    const order = {
      orderNumber: `CL-${now.getTime().toString().slice(-7)}`,
      userId: new ObjectId(req.userId),
      items,
      totalCents: items.reduce(
        (sum, item) => sum + item.unitPriceCents * item.qty,
        0,
      ),
      status: 'pending',
      placedAt: now,
    }

    await orders.insertOne(order)
    await users.updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { cart: [] } },
    )

    res.status(201).json({
      order: {
        id: order.orderNumber,
        totalCents: order.totalCents,
        items: items.length,
        status: order.status,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/me', authenticate(), async (req, res, next) => {
  try {
    const user = await users.findOne({ _id: new ObjectId(req.userId) })
    if (!user) {
      res.status(404).json({ error: 'Account not found.' })
      return
    }
    res.json({ user: toUser(user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/products', async (_req, res, next) => {
  try {
    const docs = await products.find().sort({ _id: 1 }).toArray()
    res.json({ products: docs.map(toProduct) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/products/:slug', async (req, res, next) => {
  try {
    const doc = await products.findOne({ slug: req.params.slug })
    if (!doc) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }
    res.json({ product: toProduct(doc) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/products', authenticate('admin'), async (req, res, next) => {
  try {
    const { error, value } = validateProduct(req.body ?? {})
    if (error) {
      res.status(400).json({ error })
      return
    }

    await products.insertOne(value)
    res.status(201).json({ product: toProduct(value) })
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409).json({ error: 'A product with that slug already exists.' })
      return
    }
    next(error)
  }
})

app.put('/api/products/:slug', authenticate('admin'), async (req, res, next) => {
  try {
    const { error, value } = validateProduct({
      ...req.body,
      slug: req.params.slug,
    })
    if (error) {
      res.status(400).json({ error })
      return
    }

    const result = await products.findOneAndUpdate(
      { slug: req.params.slug },
      { $set: value },
      { returnDocument: 'after' },
    )

    if (!result) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }

    res.json({ product: toProduct(result) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/products/:slug', authenticate('admin'), async (req, res, next) => {
  try {
    const result = await products.deleteOne({ slug: req.params.slug })
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/orders', authenticate('admin'), async (_req, res, next) => {
  try {
    const docs = await orders
      .aggregate([
        { $sort: { placedAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      ])
      .toArray()

    res.json({
      orders: docs.map((order) => ({
        id: order.orderNumber,
        customer: order.customer?.name ?? 'Deleted customer',
        email: order.customer?.email ?? '—',
        items: order.items.length,
        totalCents: order.totalCents,
        status: order.status,
        placedAt: order.placedAt.toISOString().slice(0, 10),
      })),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/customers', authenticate('admin'), async (_req, res, next) => {
  try {
    const docs = await users
      .aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'userId',
            as: 'orders',
          },
        },
        { $project: { name: 1, email: 1, role: 1, orderCount: { $size: '$orders' } } },
        { $sort: { name: 1 } },
      ])
      .toArray()

    res.json({
      customers: docs.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        orders: doc.orderCount,
      })),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/stats', authenticate('admin'), async (_req, res, next) => {
  try {
    const [productAgg] = await products
      .aggregate([
        {
          $group: {
            _id: null,
            products: { $sum: 1 },
            stock: { $sum: '$stock' },
            lowStock: { $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] } },
          },
        },
      ])
      .toArray()

    const [orderAgg] = await orders
      .aggregate([
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalCents', 0],
              },
            },
          },
        },
      ])
      .toArray()

    res.json({
      stats: {
        revenueCents: orderAgg?.revenue ?? 0,
        orders: orderAgg?.orders ?? 0,
        products: productAgg?.products ?? 0,
        stock: productAgg?.stock ?? 0,
        lowStock: productAgg?.lowStock ?? 0,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Unexpected server error.' })
})

app.listen(PORT, () => {
  console.log(`ClackLabs API on http://127.0.0.1:${PORT} (${MONGODB_DB})`)
})
