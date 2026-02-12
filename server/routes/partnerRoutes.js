const express = require('express');
const router = express.Router();
const {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  searchNearbyPartners,
  updateAvailability,
  updateLocation
} = require('../controllers/partnerController');

// Routes
router.route('/')
  .get(getAllPartners)
  .post(createPartner);

// Location-based search endpoint
router.route('/search/nearby')
  .get(searchNearbyPartners);

router.route('/:id')
  .get(getPartnerById)
  .put(updatePartner)
  .delete(deletePartner);

// Partner availability endpoints
router.route('/:partnerId/availability')
  .put(updateAvailability);

router.route('/:partnerId/location')
  .put(updateLocation);

module.exports = router;






























