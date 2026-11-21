const { ObjectId } = require('mongodb');
const { users } = require('./collections');
const { userSchema } = require('./schemas');
const { publicUser } = require('../utils/auth');

function accountUser(user) {
  return {
    ...publicUser(user),
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
  };
}

function parseAddress(body) {
  const label = String(body.label || 'Home').trim();
  const name = String(body.name || '').trim();
  const line1 = String(body.line1 || '').trim();
  const line2 = String(body.line2 || '').trim();
  const city = String(body.city || '').trim();
  const state = String(body.state || '').trim();
  const postalCode = String(body.postalCode || '').trim();
  const country = String(body.country || '').trim();
  const phone = String(body.phone || '').trim();

  if (!name || !line1 || !city || !postalCode || !country) {
    throw new Error('Name, street, city, postal code, and country are required.');
  }
  if ([label, name, line1, line2, city, state, postalCode, country, phone].some(
    (value) => value.length > 120,
  )) {
    throw new Error('Address fields must be 120 characters or fewer.');
  }

  return {
    label,
    name,
    line1,
    line2,
    city,
    state,
    postalCode,
    country,
    phone,
    isDefault: Boolean(body.isDefault),
  };
}

async function updateAccountAddresses(userId, addresses) {
  const normalized = addresses.map((address) => ({ ...address, isDefault: false }));
  if (normalized.length > 0) {
    const preferred = addresses.findIndex((address) => address.isDefault);
    normalized[preferred >= 0 ? preferred : 0].isDefault = true;
  }
  await users().updateOne(
    { _id: userId },
    { $set: { addresses: normalized, updatedAt: new Date().toISOString() } },
  );
  return normalized;
}

async function findByEmail(email) {
  return users().findOne({ email });
}

async function findById(id) {
  const value = id instanceof ObjectId ? id : new ObjectId(id);
  return users().findOne({ _id: value });
}

async function createUser(document) {
  return users().insertOne(document);
}

async function updateUser(id, changes) {
  return users().updateOne({ _id: id }, { $set: changes });
}

module.exports = {
  userSchema,
  accountUser,
  parseAddress,
  updateAccountAddresses,
  findByEmail,
  findById,
  createUser,
  updateUser,
};
