/**
 * Referential integrity check.
 *
 * MongoDB has no foreign keys, so references are enforced by the app and
 * audited here. Reports documents whose reference points at nothing.
 *
 * Usage: npm run check   (inside /db) — exits 1 when an orphan is found.
 */
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'clacklabs'

const RELATIONS = [
  { collection: 'orders', field: 'userId', target: 'users' },
  { collection: 'orders', field: 'items.productId', target: 'products' },
  { collection: 'users', field: 'cart.productId', target: 'products' },
  { collection: 'users', field: 'wishlist', target: 'products' },
]

const client = new MongoClient(uri)

async function countOrphans(db, { collection, field, target }) {
  const pipeline = [
    // Ignore documents with no reference at all (missing, null, empty array).
    { $match: { [field]: { $exists: true, $nin: [null, []] } } },
    {
      $lookup: {
        from: target,
        localField: field,
        foreignField: '_id',
        as: '_ref',
      },
    },
    { $match: { _ref: { $size: 0 } } },
    { $count: 'orphans' },
  ]

  const [result] = await db.collection(collection).aggregate(pipeline).toArray()
  const total = await db.collection(collection).countDocuments()
  return { orphans: result?.orphans ?? 0, total }
}

try {
  await client.connect()
  const db = client.db(dbName)
  console.log(`Checking ${dbName} at ${uri}\n`)

  let failures = 0

  for (const relation of RELATIONS) {
    const { orphans, total } = await countOrphans(db, relation)
    const label = `${relation.collection}.${relation.field} -> ${relation.target}`
    const status = orphans === 0 ? 'ok  ' : 'FAIL'
    if (orphans > 0) failures += 1
    console.log(
      `${status} ${label.padEnd(44)} ${String(total).padStart(4)} docs, ${orphans} orphan(s)`,
    )
  }

  // Order total must equal the sum of its line items.
  const [badTotals] = await db
    .collection('orders')
    .aggregate([
      {
        $addFields: {
          computedTotal: {
            $sum: {
              $map: {
                input: '$items',
                as: 'item',
                in: { $multiply: ['$$item.unitPriceCents', '$$item.qty'] },
              },
            },
          },
        },
      },
      { $match: { $expr: { $ne: ['$totalCents', '$computedTotal'] } } },
      { $count: 'bad' },
    ])
    .toArray()

  const totalMismatches = badTotals?.bad ?? 0
  if (totalMismatches > 0) failures += 1
  console.log(
    `${totalMismatches === 0 ? 'ok  ' : 'FAIL'} ${'orders.totalCents equals sum of items'.padEnd(44)} ${totalMismatches} mismatch(es)`,
  )

  console.log(
    `\n${failures === 0 ? 'All relationships consistent.' : `${failures} relationship check(s) failed.`}`,
  )
  if (failures > 0) process.exitCode = 1
} finally {
  await client.close()
}
