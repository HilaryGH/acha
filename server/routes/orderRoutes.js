const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByBuyer,
  getOrdersForPartner,
  getOrdersForTraveller,
  matchWithTraveler,
  assignToPartner,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  confirmDelivery,
  getAvailableTravelers,
  getAvailablePartners,
  createDeliveryRequest,
  getAvailableRequests,
  submitPartnerOffer,
  getPartnerOffers,
  partnerAcceptRequest,
  partnerAcceptOrder,
  partnerRejectOrder,
  downloadGiftCard
} = require('../controllers/orderController');

console.log('✅ Order routes module loaded');

// Routes - Specific routes must come before parameterized routes
router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.route('/request')
  .post(createDeliveryRequest);

// Optional authentication - will filter by role if authenticated
router.route('/requests/available')
  .get(async (req, res, next) => {
    // Try to authenticate, but don't fail if not authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (err) {
        // If authentication fails, continue without user
      }
    }
    next();
  }, getAvailableRequests);

router.route('/offer')
  .post(submitPartnerOffer);

router.route('/accept')
  .post(partnerAcceptRequest);

router.route('/accept-assigned')
  .post(authenticate, partnerAcceptOrder);

router.route('/reject-assigned')
  .post(authenticate, partnerRejectOrder);

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

router.route('/traveller/:travellerId')
  .get(authenticate, getOrdersForTraveller);

router.route('/traveller')
  .get(authenticate, getOrdersForTraveller); // Get orders for authenticated traveller

router.route('/:orderId/status')
  .put(updateOrderStatus);

router.route('/:orderId/cancel')
  .post(cancelOrder);

router.route('/:orderId/confirm')
  .post(confirmDelivery);

router.route('/:orderId/travelers')
  .get(getAvailableTravelers);

router.route('/:orderId/partners')
  .get(getAvailablePartners);

router.route('/:orderId/offers')
  .get(getPartnerOffers);

router.route('/:orderId/gift-card')
  .get(downloadGiftCard);

router.route('/:orderId')
  .put(updateOrder)
  .get(getOrderById);

module.exports = router;

