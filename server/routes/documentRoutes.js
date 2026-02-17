const express = require('express');
const router = express.Router();
const {
  getAllDocuments,
  verifyDocuments,
  getUserDocuments
} = require('../controllers/documentController');

const { authenticate } = require('../middleware/auth');
const { isSuperAdmin, isAdmin } = require('../middleware/authorize');

// All document routes require authentication and admin access
router.use(authenticate);
router.use(isAdmin);

// Get all documents that need verification
router.get('/', getAllDocuments);

// Get documents for a specific user
router.get('/user/:userId', getUserDocuments);

// Verify/Approve/Reject documents
router.post('/verify', verifyDocuments);

module.exports = router;
