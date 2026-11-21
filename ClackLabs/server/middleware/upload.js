const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const { uploadDir } = require('../config');

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadDir),
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.webp';
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Only image uploads are allowed.'));
    }
    return callback(null, true);
  },
});

module.exports = { imageUpload };
