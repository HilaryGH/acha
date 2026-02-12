const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByBuyer,
  matchWithTraveler,
  assignToPartner,
  updateOrderStatus,
  confirmDelivery,
  getAvailableTravelers,
  getAvailablePartners,
  createDeliveryRequest
} = require('../controllers/orderController');

console.log('✅ Order routes module loaded');

// Routes - Specific routes must come before parameterized routes
router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.route('/request')
  .post(createDeliveryRequest);

router.route('/match/traveler')
  .post(matchWithTraveler);

router.route('/assign/partner')
  .post(assignToPartner);

router.route('/buyer/:buyerId')
  .get(getOrdersByBuyer);

router.route('/:orderId/status')
  .put(updateOrderStatus);

router.route('/:orderId/confirm')
  .post(confirmDelivery);

router.route('/:orderId/travelers')
  .get(getAvailableTravelers);

router.route('/:orderId/partners')
  .get(getAvailablePartners);

router.route('/:id')
  .get(getOrderById);

module.exports = router;

