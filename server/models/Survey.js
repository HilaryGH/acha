const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const surveySchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Survey Information
  title: {
    type: String,
    required: [true, 'Survey title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['training_need', 'challenges', 'skills_experience', 'other'],
    default: 'other'
  },
  // Survey Questions (flexible structure)
  questions: [{
    questionId: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['rating', 'multiple_choice', 'single_choice', 'text', 'textarea', 'select'],
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    options: [{
      value: String,
      label: String
    }],
    required: {
      type: Boolean,
      default: false
    },
    minValue: Number, // For rating scales
    maxValue: Number, // For rating scales
    placeholder: String
  }],
  // Survey Status
  isActive: {
    type: Boolean,
    default: false
  },
  // Survey Settings
  settings: {
    allowMultipleSubmissions: {
      type: Boolean,
      default: false
    },
    requireAuthentication: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    }
  },
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
surveySchema.pre('save', async function() {
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

module.exports = mongoose.model('Survey', surveySchema);
