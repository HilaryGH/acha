const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const travellerSchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
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
  currentLocation: {
    type: String,
    required: [true, 'Current location/Departure city is required'],
    trim: true
  },
  destinationCity: {
    type: String,
    required: [true, 'Destination city is required'],
    trim: true
  },
  
  // Travel Dates and Times
  departureDate: {
    type: Date,
    required: [true, 'Departure date is required']
  },
  departureTime: {
    type: String,
    required: [true, 'Departure time is required'],
    trim: true
  },
  arrivalDate: {
    type: Date,
    required: [true, 'Arrival date is required']
  },
  arrivalTime: {
    type: String,
    required: [true, 'Arrival time is required'],
    trim: true
  },
  
  // Financial Information
  bankAccount: {
    type: String,
    required: [true, 'Bank account is required'],
    trim: true
  },
  
  // Delivery Capacity and Pricing
  maximumKilograms: {
    type: Number,
    min: 0,
    default: null
  },
  priceOffer: {
    type: Number,
    min: 0,
    default: null
  },
  
  // Traveller Type
  travellerType: {
    type: String,
    enum: ['international', 'domestic'],
    required: [true, 'Traveller type is required']
  },
  
  // Documents - International Travellers
  internationalDocuments: {
    flightTicket: {
      type: String,
      default: null
    },
    visa: {
      type: String,
      default: null
    },
    passport: {
      type: String,
      default: null
    },
    yellowCard: {
      type: String,
      default: null
    }
  },
  
  // Documents - Domestic/Local Travellers
  domesticDocuments: {
    governmentID: {
      type: String,
      default: null
    },
    flightTicket: {
      type: String,
      default: null
    },
    photo: {
      type: String,
      default: null
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
travellerSchema.pre('save', async function() {
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

module.exports = mongoose.model('Traveller', travellerSchema);


