const express = require('express');
const router = express.Router();
const {
  getAllBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  deleteBuyer
} = require('../controllers/buyerController');

// Routes
router.route('/')
  .get(getAllBuyers)
  .post(createBuyer);

router.route('/:id')
  .get(getBuyerById)
  .put(updateBuyer)
  .delete(deleteBuyer);

module.exports = router;










































