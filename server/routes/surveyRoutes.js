const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  submitSurveyResponse,
  getSurveyResponses
} = require('../controllers/surveyController');

// Public routes
router.route('/')
  .get(getAllSurveys); // Anyone can view surveys

router.route('/:id')
  .get(getSurveyById); // Anyone can view a survey

// Submit survey response (public, but can be authenticated)
router.route('/:id/submit')
  .post(submitSurveyResponse);

// Admin routes (require authentication)
router.route('/')
  .post(authenticate, createSurvey);

router.route('/:id')
  .put(authenticate, updateSurvey)
  .delete(authenticate, deleteSurvey);

// Get survey responses (admin only)
router.route('/:id/responses')
  .get(authenticate, getSurveyResponses);

module.exports = router;
