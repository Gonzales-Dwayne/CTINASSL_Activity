const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/authController');

const router = express.Router();

router.use(getDb);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', requireAuth, controller.me);

module.exports = router;
