const express = require('express');
const router = express.Router();
const {
  createTransaction,
  updateTransactionStatus,
  getAllTransactions,
  getTransactionById,
  getTransactionsByOrder,
  getTransactionsByBuyer,
  generateInvoice,
  getTransactionStats
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

console.log('✅ Transaction routes module loaded');

// Public routes
router.route('/')
  .get(getAllTransactions)
  .post(createTransaction);

router.route('/stats')
  .get(getTransactionStats);

router.route('/order/:orderId')
  .get(getTransactionsByOrder);

router.route('/buyer/:buyerId')
  .get(getTransactionsByBuyer);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransactionStatus);

router.route('/:transactionId/invoice')
  .get(generateInvoice);

module.exports = router;


