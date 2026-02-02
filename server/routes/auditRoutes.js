const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogById
} = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');

// All audit routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Get all audit logs
router.get('/', getAuditLogs);

// Get audit log by ID
router.get('/:id', getAuditLogById);

module.exports = router;



























