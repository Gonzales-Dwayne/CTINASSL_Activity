const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/checkoutController');

const router = express.Router();

router.use(getDb, requireAuth);
router.post('/summary', controller.summary);
router.post('/', controller.create);

module.exports = router;
