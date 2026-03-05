const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const partnerSchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Partner Registration Type - distinguishes between different partner forms
  registrationType: {
    type: String,
    enum: ['Invest/Partner', 'Gift Delivery Partner'],
    default: 'Invest/Partner'
  },
  // Partner Type (for Invest/Partner type)
  type: {
    type: String,
    enum: ['Investor', 'Strategic Partner', 'Sponsorship'],
    required: function() { return this.registrationType === 'Invest/Partner'; }
  },
  // Partner Category (for Invest/Partner type)
  partner: {
    type: String,
    enum: ['Delivery Partner', 'Acha Sisters Delivery Partner', 'Acha Gifting Delivery Partner', 'Acha Movers & Packers'],
    required: function() { return this.registrationType === 'Invest/Partner'; }
  },
  // Investment Type (for Invest/Partner type)
  investmentType: {
    type: String,
    required: function() { return this.registrationType === 'Invest/Partner'; },
    trim: true
  },
  // Partner Type (for Gift Delivery Partner) - Flower Seller, Event & Wedding Organisers, etc.
  partnerType: {
    type: String,
    enum: ['Flower Seller', 'Event & Wedding Organisers', 'Gift Articles Seller', 'Cafeteria & Others'],
    required: function() { return this.registrationType === 'Gift Delivery Partner'; }
  },
  // Gift Types with description, photo, and price
  giftTypes: [{
    type: {
      type: String,
      enum: ['Gift Products', 'Gift Packages', 'Gift Bundles'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    photo: {
      type: String, // URL or file path
      default: null
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  companyName: {
    type: String,
    required: function() { return this.registrationType === 'Invest/Partner'; },
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  telegram: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: function() { return this.registrationType === 'Gift Delivery Partner'; },
    trim: true
  },
  primaryLocation: {
    type: String,
    required: function() { return this.registrationType === 'Gift Delivery Partner'; },
    trim: true
  },
  // GPS Coordinates for location-based matching
  location: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      trim: true
    }
  },
  // Availability status for ride-sharing like matching
  availability: {
    isOnline: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    currentLocation: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    }
  },
  // Attached Documents
  idDocument: {
    type: String, // URL or file path for ID/Passport/Driving Licence
    default: null
  },
  license: {
    type: String, // URL or file path for License
    default: null
  },
  tradeRegistration: {
    type: String, // URL or file path for Trade Registration
    default: null
  },
  tin: {
    type: String, // URL or file path for TIN
    default: null
  },
  businessLicense: {
    type: String, // URL or file path for Business License
    default: null
  },
  photo: {
    type: String, // URL or file path for Photo
    default: null
  },
  video: {
    type: String, // URL or file path for Video (30 min)
    default: null
  },
  // Enquiries
  enquiries: {
    type: String,
    trim: true
  },
  // Bank Account Information
  bankAccount: {
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    accountHolderName: {
      type: String,
      trim: true
    },
    branch: {
      type: String,
      trim: true
    },
    swiftCode: {
      type: String,
      trim: true
    }
  },
  // Distance-based pricing for delivery partners
  distancePricing: [{
    minDistance: {
      type: Number,
      required: true,
      min: 0
    },
    maxDistance: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
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
partnerSchema.pre('save', async function() {
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

module.exports = mongoose.model('Partner', partnerSchema);





