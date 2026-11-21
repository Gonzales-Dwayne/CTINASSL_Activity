const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');
const controller = require('../controllers/adminController');

const router = express.Router();

router.use(getDb, requireAuth, requireAdmin);

router.get('/stats', controller.stats);

router.get('/products', controller.listProducts);
router.post('/products', controller.createProduct);
router.post('/products/bulk', controller.bulkArchive);
router.put('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);
router.post('/products/:id/archive', controller.archiveProduct);
router.post('/products/:id/restore', controller.restoreProduct);
router.post('/products/:id/duplicate', controller.duplicateProduct);

router.post('/upload', imageUpload.single('image'), controller.uploadImage);

router.get('/categories', controller.listCategories);
router.post('/categories', controller.createCategory);
router.patch('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.get('/orders', controller.listOrders);
router.patch('/orders/:id', controller.updateOrder);
router.delete('/orders/:id', controller.deleteOrder);

router.get('/users', controller.listUsers);
router.patch('/users/:id/password', controller.resetUserPassword);
router.patch('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

module.exports = router;
