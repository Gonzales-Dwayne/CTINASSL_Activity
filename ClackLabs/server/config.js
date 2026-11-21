require('dotenv').config();

const path = require('path');

const PORT = Number(process.env.PORT || 5000);
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const dbName = process.env.MONGODB_DB || 'clacklabs';
const JWT_SECRET = process.env.JWT_SECRET || 'clacklabs-local-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const uploadDir = path.join(__dirname, 'uploads');

module.exports = {
  PORT,
  uri,
  dbName,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  uploadDir,
};
