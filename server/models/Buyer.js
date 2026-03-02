const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const buyerSchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  // User reference (to link buyer to user account)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  whatsapp: {
    type: String,
    trim: true
  },
  telegram: {
    type: String,
    trim: true
  },
  
  // Location Information
  currentCity: {
    type: String,
    required: [true, 'Current city is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  
  // Financial Information
  bankAccount: {
    type: String,
    trim: true,
    default: null
  },
  
  // Attached Documents
  idDocument: {
    type: String, // URL or file path for ID/Driving licence/Passport
    default: null
  },
  
  // Delivery Method
  deliveryMethod: {
    type: String,
    enum: ['traveler', 'partner', 'delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers', 'gift_delivery_partner'],
    default: 'traveler'
  },
  // Order Information
  orderInfo: {
    productName: {
      type: String,
      trim: true
    },
    productDescription: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    quantityType: {
      type: String,
      enum: ['pieces', 'weight'],
      trim: true
    },
    quantityDescription: {
      type: String,
      trim: true
    },
    manufacturingDate: {
      type: Date
    },
    countryOfOrigin: {
      type: String,
      trim: true
    },
    preferredDeliveryDate: {
      type: Date
    },
    photos: [{
      type: String // Array of file paths/URLs
    }],
    video: {
      type: String // Video file path/URL
    },
    link: {
      type: String,
      trim: true
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'active', 'inactive'],
    default: 'active'
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
buyerSchema.pre('save', async function() {
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

module.exports = mongoose.model('Buyer', buyerSchema);






