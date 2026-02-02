const Subscription = require('../models/Subscription');

/**
 * Subscribe to newsletter
 */
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    // Check if email is already subscribed
    const existingSubscription = await Subscription.findOne({ email });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return res.status(400).json({
          status: 'error',
          message: 'This email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate subscription
        existingSubscription.status = 'active';
        existingSubscription.subscribedAt = new Date();
        existingSubscription.unsubscribedAt = undefined;
        await existingSubscription.save();

        return res.status(200).json({
          status: 'success',
          message: 'Successfully resubscribed to newsletter',
          data: {
            email: existingSubscription.email,
            status: existingSubscription.status
          }
        });
      }
    }

    // Create new subscription
    const subscription = await Subscription.create({
      email,
      status: 'active'
    });

    res.status(201).json({
      status: 'success',
      message: 'Successfully subscribed to newsletter',
      data: {
        email: subscription.email,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'This email is already subscribed'
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to subscribe to newsletter'
    });
  }
};

/**
 * Unsubscribe from newsletter
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const subscription = await Subscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Email not found in our subscription list'
      });
    }

    if (subscription.status === 'unsubscribed') {
      return res.status(400).json({
        status: 'error',
        message: 'This email is already unsubscribed'
      });
    }

    subscription.status = 'unsubscribed';
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.status(200).json({
      status: 'success',
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to unsubscribe from newsletter'
    });
  }
};

/**
 * Get all subscriptions (admin only)
 */
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const subscriptions = await Subscription.find(query)
      .sort({ subscribedAt: -1 })
      .select('-__v');

    res.status(200).json({
      status: 'success',
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get subscriptions'
    });
  }
};


