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

    // For partner earnings, orderId is optional
    const isPartnerEarning = transactionType === 'partner_earning_record' || paymentMethod === 'manual_partner_entry';
    
    // For pricing rate records (price lists), amount can be 0 or minimal
    const isPricingRate = isPartnerEarning && paymentDetails && (paymentDetails.pieceRates || paymentDetails.weightRates || paymentDetails.distanceRates);
    
    if (!buyerId || !paymentMethod || (amount === undefined || amount === null)) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer ID, payment method, and amount are required'
      });
    }
    
    // Allow minimal amount (0.01) for pricing rate records
    if (!isPricingRate && amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0'
      });
    }

    // Verify order exists only if orderId is provided
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
      }
    }

    // Verify buyer/partner exists
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      // For partner earnings, buyerId might be the partner's user ID
      // Try to find user instead
      const User = require('../models/User');
      const user = await User.findById(buyerId);
      if (!user && !isPartnerEarning) {
        return res.status(404).json({
          status: 'error',
          message: 'Buyer/Partner not found'
        });
      }
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
      orderId: orderId || null, // Allow null for partner earnings
      buyerId,
      transactionType: transactionType || 'order_payment',
      paymentMethod,
      amount,
      currency: currency || 'ETB',
      fees: calculatedFees,
      paymentDetails: paymentDetails || {},
      status: isPartnerEarning ? 'completed' : 'pending' // Partner earnings are auto-completed
    });

    // Update order with transaction reference and calculated payment only if order exists
    if (order) {
      order.transactionId = transaction._id;
      order.paymentStatus = 'processing';
      
      // Update order pricing with calculated payment from form
      if (!order.pricing) {
        order.pricing = {};
      }
      
      // Set pricing based on calculated payment
      order.pricing.totalAmount = amount;
      order.pricing.deliveryFee = calculatedFees.deliveryFee || amount;
      order.pricing.serviceFee = calculatedFees.serviceFee || 0;
      order.pricing.platformFee = calculatedFees.platformFee || 0;
      order.pricing.currency = currency || 'ETB';
      
      // Store payment calculation details in order for reference
      if (paymentDetails && isPartnerEarning) {
        // Store calculation details in order (MongoDB allows flexible schema)
        order.paymentCalculationDetails = {
          paymentBasis: paymentDetails.paymentBasis,
          baseAmount: paymentDetails.baseAmount || (amount - (calculatedFees.extraFees || paymentDetails.extraFees || 0)),
          extraFees: calculatedFees.extraFees || paymentDetails.extraFees || 0,
          totalAmount: amount,
          calculatedAt: new Date(),
          unitType: paymentDetails.unitType,
          quantity: paymentDetails.quantity,
          ratePerUnit: paymentDetails.ratePerUnit,
          notes: paymentDetails.notes
        };
      }
      
      await order.save();
    }

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
    const { status, paymentProof, notes, amount, fees, paymentDetails } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status'
        });
      }
      transaction.status = status;
    }

    // Update amount and fees if provided (for editing payment records)
    if (amount !== undefined) {
      transaction.amount = amount;
    }
    if (fees) {
      transaction.fees = { ...transaction.fees, ...fees };
    }
    if (paymentDetails) {
      transaction.paymentDetails = { ...transaction.paymentDetails, ...paymentDetails };
    }
    if (paymentProof) {
      transaction.paymentDetails.paymentProof = paymentProof;
    }
    if (notes !== undefined) {
      transaction.paymentDetails.notes = notes;
    }
    
    await transaction.save();

    // Update order payment status and pricing if order exists
    const order = await Order.findById(transaction.orderId).populate('buyerId');
    if (order) {
      // Update order pricing if amount or fees were changed
      if (amount !== undefined || fees) {
        if (!order.pricing) {
          order.pricing = {};
        }
        if (amount !== undefined) {
          order.pricing.totalAmount = amount;
        }
        if (fees) {
          order.pricing.deliveryFee = fees.deliveryFee || order.pricing.deliveryFee || 0;
          order.pricing.serviceFee = fees.serviceFee || order.pricing.serviceFee || 0;
          order.pricing.platformFee = fees.platformFee || order.pricing.platformFee || 0;
        }
        
        // Update payment calculation details if paymentDetails were provided
        if (paymentDetails) {
          order.paymentCalculationDetails = {
            ...(order.paymentCalculationDetails || {}),
            paymentBasis: paymentDetails.paymentBasis,
            baseAmount: paymentDetails.baseAmount || (amount - (fees?.extraFees || paymentDetails.extraFees || 0)),
            extraFees: fees?.extraFees || paymentDetails.extraFees || 0,
            totalAmount: amount,
            calculatedAt: new Date(),
            unitType: paymentDetails.unitType,
            quantity: paymentDetails.quantity,
            ratePerUnit: paymentDetails.ratePerUnit,
            notes: paymentDetails.notes
          };
        }
      }
      
      // Update payment status based on transaction status
      if (status === 'completed') {
        order.paymentStatus = 'paid';
        
        // Generate gift card for gift delivery orders after payment
        if (order.deliveryMethod === 'gift_delivery_partner' && order.orderInfo?.recipientEmail) {
          try {
            const { generateGiftCard } = require('../utils/giftCardGenerator');
            const giftCardPath = await generateGiftCard(order, order.buyerId);
            order.giftCardUrl = giftCardPath;
            order.giftCardGeneratedAt = new Date();
            console.log(`Gift card generated for order ${order.uniqueId}: ${giftCardPath}`);
          } catch (giftCardError) {
            console.error('Error generating gift card:', giftCardError);
            // Don't fail transaction if gift card generation fails
          }
        }
        
        // Send confirmation emails for gift delivery orders when payment is completed
        if (order.deliveryMethod === 'gift_delivery_partner' && buyer) {
          try {
            const { sendGiftSenderConfirmationEmail, sendGiftRecipientEmail } = require('../utils/emailService');
            
            // Get partner information if assigned
            let partnerName = null;
            if (order.assignedPartnerId) {
              try {
                const Partner = require('../models/Partner');
                const partner = await Partner.findById(order.assignedPartnerId);
                if (partner) {
                  partnerName = partner.name || partner.companyName;
                }
              } catch (partnerError) {
                console.error('Error fetching partner for email:', partnerError);
              }
            }
            
            // Send confirmation email to gift sender
            if (buyer.email) {
              await sendGiftSenderConfirmationEmail(
                buyer.email,
                buyer.name,
                {
                  orderId: order.uniqueId,
                  uniqueId: order.uniqueId,
                  preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate
                },
                {
                  giftType: order.orderInfo?.giftType,
                  giftDescription: order.orderInfo?.giftDescription,
                  giftPrice: order.orderInfo?.giftPrice,
                  partnerName: partnerName,
                  recipientName: order.orderInfo?.recipientName,
                  recipientEmail: order.orderInfo?.recipientEmail,
                  recipientPhone: order.orderInfo?.recipientPhone,
                  recipientAddress: order.orderInfo?.recipientAddress
                }
              );
              console.log(`Gift sender confirmation email sent to: ${buyer.email}`);
            }
            
            // Send confirmation email to gift recipient (to confirm payment and delivery)
            if (order.orderInfo?.recipientEmail && order.orderInfo?.recipientName) {
              await sendGiftRecipientEmail(
                order.orderInfo.recipientEmail,
                order.orderInfo.recipientName,
                buyer.name,
                {
                  giftType: order.orderInfo.giftType,
                  giftMessage: order.orderInfo.giftMessage,
                  deliveryAddress: order.orderInfo.recipientAddress,
                  preferredDeliveryDate: order.orderInfo.preferredDeliveryDate
                }
              );
              console.log(`Gift recipient confirmation email sent to: ${order.orderInfo.recipientEmail}`);
            }
          } catch (emailError) {
            console.error('Error sending gift confirmation emails:', emailError);
            // Don't fail transaction if email fails
          }
        }
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
      .populate({
        path: 'orderId',
        select: 'uniqueId orderInfo deliveryMethod status assignedTravelerId assignedPartnerId pickupLocation deliveryLocation pricing',
        populate: [
          {
            path: 'assignedTravelerId',
            select: 'name email phone currentLocation destinationCity'
          },
          {
            path: 'assignedPartnerId',
            select: 'name companyName email phone city primaryLocation'
          }
        ]
      })
      .populate('buyerId', 'name email phone currentCity')
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


