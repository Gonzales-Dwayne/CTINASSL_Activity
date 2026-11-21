const express = require('express');
const { getDb } = require('../db');
const controller = require('../controllers/catalogController');

const router = express.Router();

router.use(getDb);
router.get('/categories', controller.listCategories);
router.get('/search', controller.search);
router.get('/products', controller.listProducts);
router.get('/products/:id', controller.getProduct);

module.exports = router;
