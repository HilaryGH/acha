const express = require('express');
const router = express.Router();
const {
  getAllSenders,
  getSenderById,
  createSender,
  updateSender,
  deleteSender
} = require('../controllers/senderController');

// Routes
router.route('/')
  .get(getAllSenders)
  .post(createSender);

router.route('/:id')
  .get(getSenderById)
  .put(updateSender)
  .delete(deleteSender);

module.exports = router;










































