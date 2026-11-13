import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const client = new MongoClient(uri)

try {
  await client.connect()
  const admin = client.db('admin')
  const { databases } = await admin.command({ listDatabases: 1, nameOnly: true })

  console.log(`Connected to ${uri}`)
  for (const { name } of databases) {
    const db = client.db(name)
    const all = await db.listCollections().toArray()
    const collections = all.filter((c) => c.type !== 'view' && !c.name.startsWith('system.'))
    const views = all.filter((c) => c.type === 'view')

    if (collections.length === 0 && views.length === 0) continue

    console.log(`\n${name}`)
    for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await db.collection(col.name).estimatedDocumentCount()
      console.log(`  collection  ${col.name.padEnd(20)} ~${count} docs`)
    }
    for (const view of views.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  view        ${view.name.padEnd(20)} -> ${view.options.viewOn}`)
    }
  }
} finally {
  await client.close()
}
