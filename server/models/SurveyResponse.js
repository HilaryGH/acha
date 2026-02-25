const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const surveyResponseSchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Survey Reference
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: [true, 'Survey ID is required']
  },
  // Respondent Information (optional if not authenticated)
  respondentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  respondentEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  respondentName: {
    type: String,
    trim: true
  },
  // Responses (flexible structure)
  responses: [{
    questionId: {
      type: String,
      required: true
    },
    value: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
    text: String // For text/textarea responses
  }],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving and generate unique ID
surveyResponseSchema.pre('save', async function() {
  this.updatedAt = Date.now();
  
  // Generate unique ID if it doesn't exist
  if (!this.uniqueId) {
    try {
      this.uniqueId = await generateUniqueId(this.constructor);
    } catch (error) {
      throw error;
    }
  }
});

// Index for faster queries
surveyResponseSchema.index({ surveyId: 1, createdAt: -1 });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
