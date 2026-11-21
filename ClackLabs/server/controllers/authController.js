const bcrypt = require('bcryptjs');
const { normalizeEmail } = require('../utils/helpers');
const { authResponse, publicUser } = require('../utils/auth');
const {
  findByEmail,
  createUser,
  findById,
} = require('../models/userModel');

async function register(req, res, next) {
  try {
    const name = String(req.body?.name || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: 'Please enter a name between 2 and 80 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
    }

    if (await findByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await createUser({
      name,
      email,
      passwordHash,
      role: 'customer',
      cart: [],
      wishlist: [],
      createdAt: now,
      updatedAt: now,
    });

    const user = await findById(result.insertedId);
    return res.status(201).json(authResponse(user));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await findByEmail(email);
    if (!user?.passwordHash) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    return res.json(authResponse(user));
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, me };
