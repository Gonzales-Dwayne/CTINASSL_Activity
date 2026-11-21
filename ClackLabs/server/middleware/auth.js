const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { JWT_SECRET } = require('../config');
const { readToken } = require('../utils/auth');
const { findById } = require('../models/userModel');
const { getDbInstance } = require('../db');

async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!ObjectId.isValid(payload.sub)) {
      return res.status(401).json({ error: 'Invalid session.' });
    }

    const user = await findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    if (user.passwordChangedAt) {
      const changedAt = new Date(user.passwordChangedAt).getTime();
      const issuedAt = Number(payload.iat || 0) * 1000;
      if (Number.isFinite(changedAt) && issuedAt < changedAt) {
        return res.status(401).json({ error: 'Password changed. Please sign in again.' });
      }
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}

function requireDatabase(req, res, next) {
  try {
    getDbInstance();
    return next();
  } catch {
    return res.status(503).json({ error: 'Database is not connected yet.' });
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireDatabase,
};
