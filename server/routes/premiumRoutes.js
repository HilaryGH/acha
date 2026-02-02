const express = require('express');
const router = express.Router();
const {
  createPremium,
  getAllPremium,
  getPremiumById,
  updatePremium
} = require('../controllers/premiumController');

// Create premium subscription (public)
router.post('/', createPremium);

// Get all premium subscriptions (admin only - add authentication middleware if needed)
router.get('/', getAllPremium);

// Get premium subscription by ID
router.get('/:id', getPremiumById);

// Update premium subscription
router.put('/:id', updatePremium);

module.exports = router;



























