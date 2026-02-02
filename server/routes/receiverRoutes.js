const express = require('express');
const router = express.Router();
const {
  getAllReceivers,
  getReceiverById,
  createReceiver,
  updateReceiver,
  deleteReceiver
} = require('../controllers/receiverController');

// Routes
router.route('/')
  .get(getAllReceivers)
  .post(createReceiver);

router.route('/:id')
  .get(getReceiverById)
  .put(updateReceiver)
  .delete(deleteReceiver);

module.exports = router;










































