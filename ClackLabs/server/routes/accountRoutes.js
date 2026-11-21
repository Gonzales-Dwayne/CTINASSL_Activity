const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/accountController');

const router = express.Router();

router.use(getDb, requireAuth);

router.get('/', controller.getAccount);
router.patch('/', controller.updateAccount);
router.patch('/password', controller.changePassword);

router.get('/orders', controller.listOrders);
router.get('/orders/:id', controller.getOrder);

router.get('/addresses', controller.listAddresses);
router.post('/addresses', controller.createAddress);
router.patch('/addresses/:id', controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);

router.get('/wishlist', controller.getWishlist);
router.post('/wishlist/:productId', controller.addWishlist);
router.delete('/wishlist/:productId', controller.removeWishlist);

router.get('/cart', controller.getCart);
router.put('/cart', controller.putCart);
router.post('/cart/merge', controller.mergeCart);
router.delete('/cart', controller.deleteCart);

module.exports = router;
