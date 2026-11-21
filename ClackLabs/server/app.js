const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { uploadDir } = require('./config');
const { getDb } = require('./db');
const catalogController = require('./controllers/catalogController');
const {
  authRoutes,
  accountRoutes,
  checkoutRoutes,
  catalogRoutes,
  adminRoutes,
} = require('./routes');

const app = express();

fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/images', express.static(path.join(__dirname, '..', 'client', 'src', 'assets', 'images')));
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', catalogController.health);
app.get('/api/message', catalogController.message);

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', getDb, catalogRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
