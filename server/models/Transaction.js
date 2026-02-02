const mongoose = require('mongoose');
const generateUniqueId = require('../utils/generateUniqueId');

const transactionSchema = new mongoose.Schema({
  // Unique ID
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  // Buyer reference
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: [true, 'Buyer ID is required']
  },
  // Transaction Type
  transactionType: {
    type: String,
    enum: ['order_payment', 'delivery_fee', 'service_fee', 'refund'],
    required: [true, 'Transaction type is required']
  },
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'mobile_money', 'cash', 'card', 'acha_pay'],
    required: [true, 'Payment method is required']
  },
  // Amount Information
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'ETB', // Ethiopian Birr
    trim: true
  },
  // Fee Breakdown
  fees: {
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
    total: {
      type: Number,
      default: 0
    }
  },
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  // Payment Details
  paymentDetails: {
    transactionReference: {
      type: String,
      trim: true
    },
    bankAccount: {
      type: String,
      trim: true
    },
    mobileMoneyNumber: {
      type: String,
      trim: true
    },
    paymentProof: {
      type: String // URL or file path for payment receipt/proof
    },
    notes: {
      type: String,
      trim: true
    }
  },
  // Invoice Information
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceGeneratedAt: {
    type: Date,
    default: null
  },
  // Receipt Information
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptGeneratedAt: {
    type: Date,
    default: null
  },
  // Timestamps
  paidAt: {
    type: Date,
    default: null
  },
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

// Generate invoice number before saving
transactionSchema.pre('save', async function() {
  this.updatedAt = Date.now();
  
  // Generate unique ID if it doesn't exist
  if (!this.uniqueId) {
    try {
      this.uniqueId = await generateUniqueId(this.constructor);
    } catch (error) {
      throw error;
    }
  }
  
  // Generate invoice number when payment is completed
  if (this.status === 'completed' && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `INV-${year}${month}-${randomNum}`;
    this.invoiceGenerated = true;
    this.invoiceGeneratedAt = new Date();
  }
  
  // Generate receipt number when payment is completed
  if (this.status === 'completed' && !this.receiptNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.receiptNumber = `RCP-${year}${month}-${randomNum}`;
    this.receiptGenerated = true;
    this.receiptGeneratedAt = new Date();
  }
  
  // Set paidAt when status changes to completed
  if (this.status === 'completed' && !this.paidAt) {
    this.paidAt = new Date();
  }
});

// Index for faster queries
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ buyerId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);


