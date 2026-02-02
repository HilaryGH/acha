const express = require('express');
const router = express.Router();
const {
  getAllTravellers,
  getTravellerById,
  createTraveller,
  updateTraveller,
  deleteTraveller
} = require('../controllers/travellerController');

// Routes
router.route('/')
  .get(getAllTravellers)
  .post(createTraveller);

router.route('/:id')
  .get(getTravellerById)
  .put(updateTraveller)
  .delete(deleteTraveller);

module.exports = router;










































