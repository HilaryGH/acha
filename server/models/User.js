const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if googleId is not provided
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password by default
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Role Information
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'marketing_team', 'customer_support', 'individual', 'delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers', 'gift_delivery_partner'],
    required: [true, 'Role is required'],
    default: 'individual'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Additional Information
  department: {
    type: String,
    trim: true
  },
  userId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  // Location Information
  city: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  primaryLocation: {
    type: String,
    trim: true
  },
  // Delivery Mechanism (for delivery partners)
  deliveryMechanism: {
    type: String,
    enum: ['cycle-rider', 'e-bike-rider', 'motorcycle-rider'],
    trim: true
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
  lastLogin: {
    type: Date
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

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('password') || !this.password) {
    return;
  }
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
  } catch (error) {
    throw error;
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);


