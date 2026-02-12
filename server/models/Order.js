const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const orderSchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Buyer reference
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: [true, 'Buyer ID is required']
  },
  // Delivery Method
  deliveryMethod: {
    type: String,
    enum: ['traveler', 'partner'],
    required: [true, 'Delivery method is required']
  },
  // Order Information (from buyer)
  orderInfo: {
    productName: {
      type: String,
      required: true,
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
    deliveryDestination: {
      type: String,
      trim: true
    },
    preferredDeliveryDate: {
      type: Date
    },
    photos: [{
      type: String
    }],
    video: {
      type: String
    },
    link: {
      type: String,
      trim: true
    }
  },
  // Pickup and Delivery Locations (for location-based matching)
  pickupLocation: {
    address: {
      type: String,
      trim: true
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    city: {
      type: String,
      trim: true
    }
  },
  deliveryLocation: {
    address: {
      type: String,
      trim: true
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    city: {
      type: String,
      trim: true
    }
  },
  // Assignment
  assignedTravelerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Traveller',
    default: null
  },
  assignedPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    default: null
  },
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, waiting for assignment
      'matched',           // Matched with traveler (for traveler method)
      'assigned',          // Assigned to partner (for partner method)
      'picked_up',         // Item picked up by traveler/partner
      'in_transit',        // Item in transit
      'delivered',         // Item delivered
      'completed',         // Delivery completed and confirmed
      'cancelled'          // Order cancelled
    ],
    default: 'pending'
  },
  // Delivery Tracking
  trackingUpdates: [{
    status: {
      type: String,
      required: true
    },
    message: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Delivery confirmation
  deliveryConfirmed: {
    type: Boolean,
    default: false
  },
  deliveryConfirmedAt: {
    type: Date,
    default: null
  },
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  // Pricing Information
  pricing: {
    itemValue: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'ETB'
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
orderSchema.pre('save', async function() {
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

// Add tracking update method
orderSchema.methods.addTrackingUpdate = function(status, message, location) {
  this.trackingUpdates.push({
    status,
    message: message || '',
    location: location || '',
    timestamp: new Date()
  });
  this.status = status;
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);





