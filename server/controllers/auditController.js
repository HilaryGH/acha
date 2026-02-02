const AuditLog = require('../models/AuditLog');
const { isAdmin } = require('../middleware/authorize');

/**
 * Get audit logs (admin and super_admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { action, performedBy, targetUser, status, startDate, endDate, limit = 100, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;
    if (targetUser) query.targetUser = targetUser;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get audit logs'
    });
  }
};

/**
 * Get audit log by ID
 */
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email role');
    
    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Audit log not found'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        log
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get audit log'
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById
};



























