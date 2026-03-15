const express = require('express');
const router = express.Router();
const {
  getSetting,
  getAllSettings,
  updateSetting
} = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Public route to get conversion rate (for Acha Pay form)
router.get('/usd_to_birr_rate', (req, res) => {
  req.params.key = 'usd_to_birr_rate';
  getSetting(req, res);
});

// Admin routes (require authentication and admin role)
router.get('/', authenticate, authorize(['admin', 'super_admin']), getAllSettings);
router.get('/:key', authenticate, authorize(['admin', 'super_admin']), getSetting);
router.put('/:key', authenticate, authorize(['admin', 'super_admin']), updateSetting);

module.exports = router;
