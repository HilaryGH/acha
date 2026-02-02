const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action performed
  action: {
    type: String,
    required: true,
    enum: ['user_created', 'user_updated', 'user_deleted', 'role_changed', 'code_verification_failed', 'code_verification_success']
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Target user (if applicable)
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Details about the action
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // IP address
  ipAddress: {
    type: String
  },
  
  // User agent
  userAgent: {
    type: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  
  // Error message (if failed)
  errorMessage: {
    type: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);



























