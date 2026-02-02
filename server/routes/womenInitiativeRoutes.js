const express = require('express');
const router = express.Router();
const {
  getAllWomenInitiatives,
  getWomenInitiativeById,
  createWomenInitiative,
  updateWomenInitiative,
  deleteWomenInitiative
} = require('../controllers/womenInitiativeController');

// Routes
router.route('/')
  .get(getAllWomenInitiatives)
  .post(createWomenInitiative);

router.route('/:id')
  .get(getWomenInitiativeById)
  .put(updateWomenInitiative)
  .delete(deleteWomenInitiative);

module.exports = router;






























