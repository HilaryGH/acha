const Premium = require('../models/Premium');

/**
 * Create a new premium subscription application
 */
const createPremium = async (req, res) => {
  try {
    const {
      category,
      deliveryPartnerType,
      subscriptionType,
      name,
      email,
      phone,
      whatsapp,
      companyName,
      location,
      city,
      idDocument,
      license,
      tradeRegistration
    } = req.body;
    
    // Validate required fields
    if (!category || !subscriptionType || !name || !email || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }
    
    // Validate delivery partner type if category is delivery-partners
    if (category === 'delivery-partners' && !deliveryPartnerType) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery partner type is required for delivery partners'
      });
    }
    
    // Validate company name if category is corporate-clients
    if (category === 'corporate-clients' && !companyName) {
      return res.status(400).json({
        status: 'error',
        message: 'Company name is required for corporate clients'
      });
    }
    
    // Create premium subscription
    const premium = new Premium({
      category,
      deliveryPartnerType: category === 'delivery-partners' ? deliveryPartnerType : undefined,
      subscriptionType,
      name,
      email: email.toLowerCase(),
      phone,
      whatsapp,
      companyName: category === 'corporate-clients' ? companyName : undefined,
      location,
      city,
      idDocument,
      license,
      tradeRegistration: category === 'corporate-clients' ? tradeRegistration : undefined,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    await premium.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Premium subscription application submitted successfully',
      data: {
        premium: {
          id: premium._id,
          uniqueId: premium.uniqueId,
          category: premium.category,
          deliveryPartnerType: premium.deliveryPartnerType,
          subscriptionType: premium.subscriptionType,
          price: premium.price,
          name: premium.name,
          email: premium.email,
          status: premium.status,
          createdAt: premium.createdAt
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'A premium subscription with this information already exists'
      });
    }
    
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to create premium subscription'
    });
  }
};

/**
 * Get all premium subscriptions (admin only)
 */
const getAllPremium = async (req, res) => {
  try {
    const { category, status, subscriptionType, search } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (subscriptionType) query.subscriptionType = subscriptionType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const premiums = await Premium.find(query).sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: premiums.length,
      data: {
        premiums
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get premium subscriptions'
    });
  }
};

/**
 * Get premium subscription by ID
 */
const getPremiumById = async (req, res) => {
  try {
    const premium = await Premium.findById(req.params.id);
    
    if (!premium) {
      return res.status(404).json({
        status: 'error',
        message: 'Premium subscription not found'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        premium
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get premium subscription'
    });
  }
};

/**
 * Update premium subscription status
 */
const updatePremium = async (req, res) => {
  try {
    const { status, paymentStatus, subscriptionStartDate, subscriptionEndDate } = req.body;
    
    const premium = await Premium.findById(req.params.id);
    
    if (!premium) {
      return res.status(404).json({
        status: 'error',
        message: 'Premium subscription not found'
      });
    }
    
    if (status) premium.status = status;
    if (paymentStatus) {
      premium.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        premium.paymentDate = new Date();
      }
    }
    if (subscriptionStartDate) premium.subscriptionStartDate = new Date(subscriptionStartDate);
    if (subscriptionEndDate) premium.subscriptionEndDate = new Date(subscriptionEndDate);
    
    premium.updatedAt = Date.now();
    await premium.save();
    
    res.json({
      status: 'success',
      message: 'Premium subscription updated successfully',
      data: {
        premium
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update premium subscription'
    });
  }
};

module.exports = {
  createPremium,
  getAllPremium,
  getPremiumById,
  updatePremium
};



























