const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Subscribe to newsletter (public)
router.post('/subscribe', subscriptionController.subscribe);

// Unsubscribe from newsletter (public)
router.post('/unsubscribe', subscriptionController.unsubscribe);

// Get all subscriptions (admin only - add authentication middleware if needed)
router.get('/', subscriptionController.getAllSubscriptions);

module.exports = router;


