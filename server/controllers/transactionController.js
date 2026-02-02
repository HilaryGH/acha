const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Buyer = require('../models/Buyer');

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const {
      orderId,
      buyerId,
      transactionType,
      paymentMethod,
      amount,
      currency,
      fees,
      paymentDetails
    } = req.body;

    if (!orderId || !buyerId || !paymentMethod || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID, Buyer ID, payment method, and amount are required'
      });
    }

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Verify buyer exists
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({
        status: 'error',
        message: 'Buyer not found'
      });
    }

    // Calculate fees if not provided
    let calculatedFees = fees || {};
    if (!calculatedFees.total) {
      calculatedFees.deliveryFee = calculatedFees.deliveryFee || 0;
      calculatedFees.serviceFee = calculatedFees.serviceFee || 0;
      calculatedFees.platformFee = calculatedFees.platformFee || 0;
      calculatedFees.total = calculatedFees.deliveryFee + calculatedFees.serviceFee + calculatedFees.platformFee;
    }

    // Create transaction
    const transaction = await Transaction.create({
      orderId,
      buyerId,
      transactionType: transactionType || 'order_payment',
      paymentMethod,
      amount,
      currency: currency || 'ETB',
      fees: calculatedFees,
      paymentDetails: paymentDetails || {},
      status: 'pending'
    });

    // Update order with transaction reference
    order.transactionId = transaction._id;
    order.paymentStatus = 'processing';
    if (order.pricing) {
      order.pricing.totalAmount = amount;
      order.pricing.deliveryFee = calculatedFees.deliveryFee;
      order.pricing.serviceFee = calculatedFees.serviceFee;
      order.pricing.platformFee = calculatedFees.platformFee;
    }
    await order.save();

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update transaction status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, paymentProof, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Update transaction
    transaction.status = status;
    if (paymentProof) {
      transaction.paymentDetails.paymentProof = paymentProof;
    }
    if (notes) {
      transaction.paymentDetails.notes = notes;
    }
    await transaction.save();

    // Update order payment status
    const order = await Order.findById(transaction.orderId);
    if (order) {
      if (status === 'completed') {
        order.paymentStatus = 'paid';
      } else if (status === 'failed') {
        order.paymentStatus = 'failed';
      } else if (status === 'refunded') {
        order.paymentStatus = 'refunded';
      }
      await order.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction status updated successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, paymentMethod, buyerId, orderId, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (buyerId) filter.buyerId = buyerId;
    if (orderId) filter.orderId = orderId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('orderId', 'uniqueId orderInfo deliveryMethod status')
      .populate('buyerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('orderId')
      .populate('buyerId');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get transactions by order ID
exports.getTransactionsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const transactions = await Transaction.find({ orderId })
      .populate('buyerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get transactions by buyer ID
exports.getTransactionsByBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const transactions = await Transaction.find({ buyerId })
      .populate('orderId', 'uniqueId orderInfo deliveryMethod status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Generate invoice (returns transaction with invoice details)
exports.generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId)
      .populate('orderId')
      .populate('buyerId');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction must be completed to generate invoice'
      });
    }

    // Invoice is auto-generated when status is completed
    // This endpoint just returns the invoice data
    res.status(200).json({
      status: 'success',
      message: 'Invoice generated successfully',
      data: {
        transaction,
        invoice: {
          invoiceNumber: transaction.invoiceNumber,
          invoiceDate: transaction.invoiceGeneratedAt,
          buyer: transaction.buyerId,
          order: transaction.orderId,
          amount: transaction.amount,
          currency: transaction.currency,
          fees: transaction.fees,
          paymentMethod: transaction.paymentMethod,
          paidAt: transaction.paidAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get transaction statistics for super admin
exports.getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const allTransactions = await Transaction.find(filter);
    const completedTransactions = await Transaction.find({ ...filter, status: 'completed' });

    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = completedTransactions.reduce((sum, t) => sum + (t.fees?.total || 0), 0);
    const totalTransactions = allTransactions.length;
    const completedCount = completedTransactions.length;
    const pendingCount = allTransactions.filter(t => t.status === 'pending').length;
    const failedCount = allTransactions.filter(t => t.status === 'failed').length;

    // Group by payment method
    const byPaymentMethod = {};
    completedTransactions.forEach(t => {
      const method = t.paymentMethod;
      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { count: 0, total: 0 };
      }
      byPaymentMethod[method].count++;
      byPaymentMethod[method].total += t.amount || 0;
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalTransactions,
          completedCount,
          pendingCount,
          failedCount,
          totalRevenue,
          totalFees,
          netRevenue: totalRevenue - totalFees
        },
        byPaymentMethod,
        recentTransactions: allTransactions.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


