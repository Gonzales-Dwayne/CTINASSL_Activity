const { MongoClient } = require('mongodb');
const { uri, dbName } = require('./config');

let client;
let db;

async function connectDatabase() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  await client.db('admin').command({ ping: 1 });
  return db;
}

function getDbInstance() {
  if (!db) {
    throw new Error('Database is not connected yet.');
  }
  return db;
}

function getDb(req, res, next) {
  if (!db) {
    return res.status(503).json({ error: 'Database is not connected yet.' });
  }
  return next();
}

async function pingDatabase() {
  await client.db('admin').command({ ping: 1 });
  return true;
}

async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}

module.exports = {
  connectDatabase,
  getDbInstance,
  getDb,
  pingDatabase,
  closeDatabase,
};
