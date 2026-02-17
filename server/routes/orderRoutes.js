const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByBuyer,
  getOrdersForPartner,
  matchWithTraveler,
  assignToPartner,
  updateOrderStatus,
  confirmDelivery,
  getAvailableTravelers,
  getAvailablePartners,
  createDeliveryRequest,
  getAvailableRequests,
  submitPartnerOffer,
  getPartnerOffers,
  partnerAcceptRequest
} = require('../controllers/orderController');

console.log('✅ Order routes module loaded');

// Routes - Specific routes must come before parameterized routes
router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.route('/request')
  .post(createDeliveryRequest);

router.route('/requests/available')
  .get(getAvailableRequests);

router.route('/offer')
  .post(submitPartnerOffer);

router.route('/accept')
  .post(partnerAcceptRequest);

router.route('/match/traveler')
  .post(matchWithTraveler);

router.route('/assign/partner')
  .post(assignToPartner);

router.route('/buyer/:buyerId')
  .get(getOrdersByBuyer);

router.route('/partner/:partnerId')
  .get(authenticate, getOrdersForPartner);

router.route('/partner')
  .get(authenticate, getOrdersForPartner); // Get orders for authenticated user

router.route('/:orderId/status')
  .put(updateOrderStatus);

router.route('/:orderId/confirm')
  .post(confirmDelivery);

router.route('/:orderId/travelers')
  .get(getAvailableTravelers);

router.route('/:orderId/partners')
  .get(getAvailablePartners);

router.route('/:orderId/offers')
  .get(getPartnerOffers);

router.route('/:id')
  .get(getOrderById);

module.exports = router;

