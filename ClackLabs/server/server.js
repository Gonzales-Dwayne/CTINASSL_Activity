const { PORT, dbName } = require('./config');
const { connectDatabase } = require('./db');
const app = require('./app');

async function start() {
  const db = await connectDatabase();

  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('carts').createIndex({ userId: 1 }, { unique: true });
    await db.collection('wishlists').createIndex({ userId: 1 }, { unique: true });
  } catch (error) {
    console.warn('Could not create account indexes:', error.message);
  }

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set; using the local development secret.');
  }

  app.listen(PORT, () => {
    console.log(`ClackLabs API running at http://localhost:${PORT}`);
    console.log(`MongoDB connected: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/'} (database: ${dbName})`);
  });
}

start().catch((error) => {
  console.error('Failed to start ClackLabs API:', error);
  process.exit(1);
});
