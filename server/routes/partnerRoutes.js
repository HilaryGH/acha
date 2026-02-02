const express = require('express');
const router = express.Router();
const {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} = require('../controllers/partnerController');

// Routes
router.route('/')
  .get(getAllPartners)
  .post(createPartner);

router.route('/:id')
  .get(getPartnerById)
  .put(updatePartner)
  .delete(deletePartner);

module.exports = router;






























