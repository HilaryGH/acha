const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Traveller = require('../models/Traveller');
const Partner = require('../models/Partner');
const { calculateDistance, isLocalDelivery } = require('../utils/googleMaps');
const { findNearbyPartners } = require('../utils/locationUtils');

// Helper function to normalize location strings for matching
const normalizeLocation = (location) => {
  if (!location) return '';
  return location.toLowerCase().trim().replace(/[^\w\s]/g, '');
};

// Helper function to check if locations match (fuzzy matching)
const locationsMatch = (loc1, loc2) => {
  if (!loc1 || !loc2) return false;
  const normalized1 = normalizeLocation(loc1);
  const normalized2 = normalizeLocation(loc2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (for partial matches like "New York" and "New York City")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  return false;
};

// Create new order from buyer
exports.createOrder = async (req, res) => {
  try {
    console.log('Create order request received:', { body: req.body });
    const { buyerId, deliveryMethod, orderInfo } = req.body;

    if (!buyerId || !deliveryMethod || !orderInfo) {
      console.log('Missing required fields:', { buyerId: !!buyerId, deliveryMethod: !!deliveryMethod, orderInfo: !!orderInfo });
      return res.status(400).json({
        status: 'error',
        message: 'Buyer ID, delivery method, and order info are required'
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

    // Create the order
    const order = await Order.create({
      buyerId,
      deliveryMethod,
      orderInfo
    });

    // Find matching travelers or partners (return up to 4 options)
    let availableMatches = [];
    let matchType = null;

    if (deliveryMethod === 'traveler') {
      // Find matching travelers
      const buyerCity = buyer.currentCity;
      const orderDestination = orderInfo.deliveryDestination || orderInfo.countryOfOrigin || buyerCity;
      const preferredDate = orderInfo.preferredDeliveryDate ? new Date(orderInfo.preferredDeliveryDate) : null;
      
      // Find active travelers matching location
      const matchingTravelers = await Traveller.find({
        status: 'active',
        currentLocation: { $regex: new RegExp(buyerCity, 'i') }
      }).limit(20); // Get more candidates to filter

      // Filter travelers by destination and date
      const suitableTravelers = matchingTravelers.filter(traveler => {
        const destinationMatch = !orderDestination || 
          locationsMatch(traveler.destinationCity, orderDestination) ||
          locationsMatch(traveler.destinationCity, buyerCity);
        
        const departureDate = new Date(traveler.departureDate);
        const now = new Date();
        const isDateValid = departureDate >= now || 
          (departureDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        
        const isDateBeforePreferred = !preferredDate || departureDate <= preferredDate;
        
        return destinationMatch && isDateValid && isDateBeforePreferred;
      });

      // Sort by departure date (closest first) and take top 4
      suitableTravelers.sort((a, b) => {
        const dateA = new Date(a.departureDate);
        const dateB = new Date(b.departureDate);
        return dateA - dateB;
      });

      availableMatches = suitableTravelers.slice(0, 4).map(t => ({
        _id: t._id,
        uniqueId: t.uniqueId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        currentLocation: t.currentLocation,
        destinationCity: t.destinationCity,
        departureDate: t.departureDate,
        arrivalDate: t.arrivalDate,
        travellerType: t.travellerType
      }));
      matchType = 'traveler';
    } else if (deliveryMethod === 'partner') {
      // Find matching delivery partners
      const buyerCity = buyer.currentCity;
      
      // Find approved partners matching location
      const matchingPartners = await Partner.find({
        status: 'approved',
        registrationType: 'Invest/Partner',
        partner: 'Delivery Partner',
        $or: [
          { city: { $regex: new RegExp(buyerCity, 'i') } },
          { primaryLocation: { $regex: new RegExp(buyerCity, 'i') } }
        ]
      }).limit(20);

      // Filter by exact or fuzzy location match
      const suitablePartners = matchingPartners.filter(partner => {
        return locationsMatch(partner.city, buyerCity) || 
               locationsMatch(partner.primaryLocation, buyerCity);
      });

      // Take top 4 partners
      availableMatches = suitablePartners.slice(0, 4).map(p => ({
        _id: p._id,
        uniqueId: p.uniqueId,
        name: p.name || p.companyName,
        companyName: p.companyName,
        email: p.email,
        phone: p.phone,
        city: p.city,
        primaryLocation: p.primaryLocation
      }));
      matchType = 'partner';
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully. Please select a delivery option.',
      data: {
        ...order.toObject(),
        availableMatches,
        matchType,
        requiresSelection: availableMatches.length > 0
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, deliveryMethod, buyerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (deliveryMethod) filter.deliveryMethod = deliveryMethod;
    if (buyerId) filter.buyerId = buyerId;

    const orders = await Order.find(filter)
      .populate('buyerId', 'name email phone currentCity')
      .populate('assignedTravelerId', 'name email phone currentLocation destinationCity')
      .populate('assignedPartnerId', 'name companyName email phone city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email phone currentCity location')
      .populate('assignedTravelerId', 'name email phone currentLocation destinationCity departureDate arrivalDate')
      .populate('assignedPartnerId', 'name companyName email phone city primaryLocation');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get orders by buyer ID
exports.getOrdersByBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const orders = await Order.find({ buyerId })
      .populate('assignedTravelerId', 'name email phone currentLocation destinationCity')
      .populate('assignedPartnerId', 'name companyName email phone city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Match order with traveler
exports.matchWithTraveler = async (req, res) => {
  try {
    const { orderId, travelerId } = req.body;

    if (!orderId || !travelerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and Traveler ID are required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.deliveryMethod !== 'traveler') {
      return res.status(400).json({
        status: 'error',
        message: 'This order is not set for traveler delivery'
      });
    }

    const traveler = await Traveller.findById(travelerId);
    if (!traveler) {
      return res.status(404).json({
        status: 'error',
        message: 'Traveler not found'
      });
    }

    order.assignedTravelerId = travelerId;
    order.status = 'matched';
    await order.addTrackingUpdate('matched', `Order matched with traveler: ${traveler.name}`, '');
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Order matched with traveler successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Assign order to partner
exports.assignToPartner = async (req, res) => {
  try {
    const { orderId, partnerId } = req.body;

    if (!orderId || !partnerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and Partner ID are required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.deliveryMethod !== 'partner') {
      return res.status(400).json({
        status: 'error',
        message: 'This order is not set for partner delivery'
      });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    order.assignedPartnerId = partnerId;
    order.status = 'assigned';
    await order.addTrackingUpdate('assigned', `Order assigned to partner: ${partner.name || partner.companyName}`, '');
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Order assigned to partner successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, message, location } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'matched', 'assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    await order.addTrackingUpdate(status, message, location);

    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Confirm delivery
exports.confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        status: 'error',
        message: 'Order must be in delivered status before confirmation'
      });
    }

    order.deliveryConfirmed = true;
    order.deliveryConfirmedAt = new Date();
    order.status = 'completed';
    await order.addTrackingUpdate('completed', 'Delivery confirmed by user', '');
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Delivery confirmed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get available travelers for matching
exports.getAvailableTravelers = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Find travelers that match the order's destination
    // This is a simplified matching - you can enhance this with more criteria
    const travelers = await Traveller.find({
      status: 'active',
      destinationCity: { $regex: new RegExp(order.orderInfo.countryOfOrigin || '', 'i') }
    }).limit(20);

    res.status(200).json({
      status: 'success',
      count: travelers.length,
      data: travelers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get available partners for assignment
exports.getAvailablePartners = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Find active partners
    const partners = await Partner.find({
      status: 'approved'
    }).limit(20);

    res.status(200).json({
      status: 'success',
      count: partners.length,
      data: partners
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create delivery request with location-based matching (ride-sharing style)
exports.createDeliveryRequest = async (req, res) => {
  try {
    const {
      buyerId,
      pickupLocation,
      deliveryLocation,
      itemDescription,
      itemValue,
      preferredDeliveryTime,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!buyerId || !pickupLocation || !deliveryLocation) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer ID, pickup location, and delivery location are required'
      });
    }

    // Validate coordinates
    if (!pickupLocation.latitude || !pickupLocation.longitude ||
        !deliveryLocation.latitude || !deliveryLocation.longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Pickup and delivery locations must include latitude and longitude'
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

    // Create order with location data
    const order = await Order.create({
      buyerId,
      deliveryMethod: 'partner',
      orderInfo: {
        productName: itemDescription || 'Delivery Item',
        productDescription: specialInstructions || '',
        deliveryDestination: deliveryLocation.address || deliveryLocation.city || ''
      },
      pickupLocation: {
        address: pickupLocation.address || '',
        latitude: parseFloat(pickupLocation.latitude),
        longitude: parseFloat(pickupLocation.longitude),
        city: pickupLocation.city || ''
      },
      deliveryLocation: {
        address: deliveryLocation.address || '',
        latitude: parseFloat(deliveryLocation.latitude),
        longitude: parseFloat(deliveryLocation.longitude),
        city: deliveryLocation.city || ''
      },
      pricing: {
        itemValue: itemValue || 0,
        currency: 'ETB'
      }
    });

    // Find nearby available delivery partners
    const filter = {
      status: 'approved',
      registrationType: 'Invest/Partner',
      partner: 'Delivery Partner',
      'availability.isOnline': true,
      'availability.isAvailable': true
    };

    const partners = await Partner.find(filter);
    const nearbyPartners = findNearbyPartners(
      partners,
      pickupLocation.latitude,
      pickupLocation.longitude,
      15 // 15km radius
    );

    // Limit to top 5 closest partners
    const topPartners = nearbyPartners.slice(0, 5);

    res.status(201).json({
      status: 'success',
      message: 'Delivery request created successfully',
      data: {
        order: order.toObject(),
        availablePartners: topPartners,
        matchCount: topPartners.length
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
