const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Traveller = require('../models/Traveller');
const Partner = require('../models/Partner');
const User = require('../models/User');
const { calculateDistance, isLocalDelivery } = require('../utils/googleMaps');
const { findNearbyPartners } = require('../utils/locationUtils');

// Helper function to normalize location strings for matching
const normalizeLocation = (location) => {
  if (!location) return '';
  return location.toLowerCase().trim().replace(/[^\w\s]/g, '');
};

// Helper function to check if delivery method is partner-related
const isPartnerDeliveryMethod = (deliveryMethod) => {
  return deliveryMethod === 'partner' || 
         deliveryMethod === 'delivery_partner' || 
         deliveryMethod === 'acha_sisters_delivery_partner' || 
         deliveryMethod === 'movers_packers' || 
         deliveryMethod === 'gift_delivery_partner';
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

    // Validate productName is required for non-movers_packers and non-gift_delivery_partner
    if (deliveryMethod !== 'movers_packers' && deliveryMethod !== 'gift_delivery_partner') {
      if (!orderInfo.productName || !orderInfo.productName.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Product name is required for this delivery method'
        });
      }
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

    console.log('Finding matches for deliveryMethod:', deliveryMethod);
    console.log('Buyer city:', buyer.currentCity);

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
    } else if (deliveryMethod === 'partner' || deliveryMethod === 'delivery_partner' || 
               deliveryMethod === 'acha_sisters_delivery_partner' || 
               deliveryMethod === 'movers_packers' || 
               deliveryMethod === 'gift_delivery_partner') {
      const buyerCity = buyer.currentCity;
      
      // For role-based delivery methods, find users with matching roles
      if (deliveryMethod === 'delivery_partner' || deliveryMethod === 'acha_sisters_delivery_partner' || 
          deliveryMethod === 'movers_packers' || deliveryMethod === 'gift_delivery_partner') {
        console.log('Searching for users with role:', deliveryMethod);
        
        // First, try to find users with matching role and location
        let matchingUsers = await User.find({
          role: deliveryMethod,
          status: 'active',
          $or: [
            { city: { $regex: new RegExp(buyerCity, 'i') } },
            { primaryLocation: { $regex: new RegExp(buyerCity, 'i') } },
            { location: { $regex: new RegExp(buyerCity, 'i') } }
          ]
        }).limit(20);

        console.log(`Found ${matchingUsers.length} users with role ${deliveryMethod} in ${buyerCity}`);

        // If no users found in exact location, try to find users with the role regardless of location
        if (matchingUsers.length === 0) {
          console.log('No users found in exact location, searching all users with role:', deliveryMethod);
          matchingUsers = await User.find({
            role: deliveryMethod,
            status: 'active'
          }).limit(20);
          console.log(`Found ${matchingUsers.length} total users with role ${deliveryMethod}`);
        }

        // Filter by exact or fuzzy location match
        const suitableUsers = matchingUsers.filter(user => {
          const matches = locationsMatch(user.city, buyerCity) || 
                         locationsMatch(user.primaryLocation, buyerCity) ||
                         locationsMatch(user.location, buyerCity);
          return matches || matchingUsers.length === 0; // Include all if no location matches found
        });

        console.log(`Filtered to ${suitableUsers.length} suitable users`);

        // Take top 4 users
        availableMatches = suitableUsers.slice(0, 4).map(u => ({
          _id: u._id,
          userId: u.userId,
          name: u.name,
          email: u.email,
          phone: u.phone,
          city: u.city,
          primaryLocation: u.primaryLocation,
          location: u.location,
          role: u.role
        }));
        matchType = 'partner';
        console.log(`Returning ${availableMatches.length} matches for role-based delivery`);
      } else {
        // Legacy partner matching - Find approved partners matching location
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
    }

    console.log(`Order created. Returning ${availableMatches.length} matches, matchType: ${matchType}`);
    
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

// Assign order to partner (client selects partner from offers)
exports.assignToPartner = async (req, res) => {
  try {
    const { orderId, partnerId, offerId } = req.body;
    const Transaction = require('../models/Transaction');

    if (!orderId || !partnerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and Partner ID are required'
      });
    }

    const order = await Order.findById(orderId).populate('buyerId');
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (!isPartnerDeliveryMethod(order.deliveryMethod)) {
      return res.status(400).json({
        status: 'error',
        message: 'This order is not set for partner delivery'
      });
    }

    // For role-based delivery methods, check User model; otherwise check Partner model
    let partner = null;
    if (order.deliveryMethod === 'delivery_partner' || order.deliveryMethod === 'acha_sisters_delivery_partner' || 
        order.deliveryMethod === 'movers_packers' || order.deliveryMethod === 'gift_delivery_partner') {
      partner = await User.findById(partnerId);
      if (!partner || partner.role !== order.deliveryMethod) {
        return res.status(404).json({
          status: 'error',
          message: 'Partner not found or role mismatch'
        });
      }
    } else {
      partner = await Partner.findById(partnerId);
      if (!partner) {
        return res.status(404).json({
          status: 'error',
          message: 'Partner not found'
        });
      }
    }

    let selectedOffer = null;
    // If offerId provided, mark that offer as accepted and reject others
    if (offerId) {
      order.partnerOffers.forEach(offer => {
        if (offer._id.toString() === offerId) {
          offer.status = 'accepted';
          selectedOffer = offer;
        } else if (offer.status === 'pending') {
          offer.status = 'rejected';
        }
      });
    }

    // Calculate transaction amount from selected offer or order pricing
    const itemValue = order.pricing?.itemValue || 0;
    const offerPrice = selectedOffer?.offerPrice || order.pricing?.deliveryFee || 0;
    const deliveryFee = offerPrice;
    const serviceFee = order.pricing?.serviceFee || 0;
    const platformFee = order.pricing?.platformFee || 0;
    const totalAmount = itemValue + deliveryFee + serviceFee + platformFee;

    // Create transaction if one doesn't exist
    let transaction;
    if (!order.transactionId) {
      transaction = await Transaction.create({
        orderId: order._id,
        buyerId: order.buyerId._id || order.buyerId,
        transactionType: 'order_payment',
        paymentMethod: 'cash', // Default to cash, can be updated later
        amount: totalAmount,
        currency: order.pricing?.currency || 'ETB',
        fees: {
          deliveryFee: deliveryFee,
          serviceFee: serviceFee,
          platformFee: platformFee,
          total: deliveryFee + serviceFee + platformFee
        },
        status: 'pending'
      });

      // Update order pricing and transaction reference
      if (!order.pricing) {
        order.pricing = {};
      }
      order.pricing.deliveryFee = deliveryFee;
      order.pricing.serviceFee = serviceFee;
      order.pricing.platformFee = platformFee;
      order.pricing.totalAmount = totalAmount;
      order.pricing.currency = order.pricing.currency || 'ETB';
      order.transactionId = transaction._id;
      order.paymentStatus = 'pending';
    }

    order.assignedPartnerId = partnerId;
    order.status = 'assigned'; // Confirmed status
    const partnerName = partner.name || partner.companyName || 'Partner';
    const partnerEmail = partner.email;
    await order.addTrackingUpdate('assigned', `Order confirmed and assigned to partner: ${partnerName}`, '');
    await order.save();

    // Send email notification to partner
    try {
      const { sendOrderAssignmentEmail } = require('../utils/emailService');
      await sendOrderAssignmentEmail(partnerEmail, partnerName, {
        orderId: order.uniqueId,
        uniqueId: order.uniqueId,
        productName: order.orderInfo?.productName,
        productDescription: order.orderInfo?.productDescription,
        deliveryDestination: order.orderInfo?.deliveryDestination,
        preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate,
        status: order.status
      });
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);
      // Don't fail the assignment if email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Order confirmed and assigned to partner successfully',
      data: {
        order,
        transaction: transaction || order.transactionId
      }
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
      status: 'pending', // Start as pending, waiting for partner offers
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

// Get available delivery requests for partners (pending orders with location)
exports.getAvailableRequests = async (req, res) => {
  try {
    const { partnerId, latitude, longitude, radius = 15 } = req.query;
    const User = require('../models/User');

    // Determine which delivery methods to show based on user role or partnerId
    let allowedDeliveryMethods = ['partner', 'delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers', 'gift_delivery_partner'];
    
    // If user is authenticated, filter by their role
    if (req.user && req.user.role) {
      const userRole = req.user.role;
      // Map user roles to delivery methods they can see
      if (userRole === 'acha_sisters_delivery_partner') {
        allowedDeliveryMethods = ['acha_sisters_delivery_partner'];
      } else if (userRole === 'delivery_partner') {
        allowedDeliveryMethods = ['delivery_partner'];
      } else if (userRole === 'movers_packers') {
        allowedDeliveryMethods = ['movers_packers'];
      } else if (userRole === 'gift_delivery_partner') {
        allowedDeliveryMethods = ['gift_delivery_partner'];
      }
      // If partnerId is provided but no user role, try to get user role from partnerId
    } else if (partnerId) {
      try {
        // Try to find user by partnerId
        const user = await User.findById(partnerId);
        if (user && user.role && isPartnerDeliveryMethod(user.role)) {
          allowedDeliveryMethods = [user.role];
        }
      } catch (err) {
        // If partnerId doesn't match a User, it might be a Partner model ID, show all
        console.log('PartnerId not found in User model, showing all partner methods');
      }
    }
    
    const filter = {
      deliveryMethod: { $in: allowedDeliveryMethods },
      status: { $in: ['pending', 'offers_received', 'assigned'] },
      pickupLocation: { $exists: true, $ne: null },
      'pickupLocation.latitude': { $exists: true, $ne: null },
      'pickupLocation.longitude': { $exists: true, $ne: null }
    };

    const orders = await Order.find(filter)
      .populate('buyerId', 'name email phone currentCity')
      .sort({ createdAt: -1 })
      .limit(50);

    // If partnerId is provided, exclude orders where this partner already made an offer
    let availableRequests = orders;
    if (partnerId) {
      availableRequests = orders.filter(order => {
        const hasOffer = order.partnerOffers.some(
          offer => offer.partnerId.toString() === partnerId && offer.status === 'pending'
        );
        return !hasOffer;
      });
    }

    // If coordinates provided, filter by distance
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const radiusKm = parseFloat(radius) || 15;

      availableRequests = availableRequests.filter(order => {
        if (!order.pickupLocation?.latitude || !order.pickupLocation?.longitude) {
          return false;
        }

        const distance = calculateDistance(
          lat,
          lon,
          order.pickupLocation.latitude,
          order.pickupLocation.longitude
        );

        return distance <= radiusKm;
      });

      // Sort by distance (closest first)
      availableRequests.sort((a, b) => {
        const distA = calculateDistance(
          lat,
          lon,
          a.pickupLocation.latitude,
          a.pickupLocation.longitude
        );
        const distB = calculateDistance(
          lat,
          lon,
          b.pickupLocation.latitude,
          b.pickupLocation.longitude
        );
        return distA - distB;
      });
    }

    res.status(200).json({
      status: 'success',
      count: availableRequests.length,
      data: availableRequests
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Partner submits offer on a delivery request
exports.submitPartnerOffer = async (req, res) => {
  try {
    const { orderId, partnerId, offerPrice, estimatedDeliveryTime, message } = req.body;

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

    if (!isPartnerDeliveryMethod(order.deliveryMethod)) {
      return res.status(400).json({
        status: 'error',
        message: 'This order is not for partner delivery'
      });
    }

    if (order.status !== 'pending' && order.status !== 'offers_received') {
      return res.status(400).json({
        status: 'error',
        message: 'This order is no longer accepting offers'
      });
    }

    // Check if partner already submitted an offer
    const existingOffer = order.partnerOffers.find(
      offer => offer.partnerId.toString() === partnerId && offer.status === 'pending'
    );

    if (existingOffer) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already submitted an offer for this request'
      });
    }

    // Verify partner exists
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Add partner offer
    order.partnerOffers.push({
      partnerId,
      offerPrice: offerPrice || null,
      estimatedDeliveryTime: estimatedDeliveryTime || null,
      message: message || '',
      status: 'pending'
    });

    // Update order status if first offer
    if (order.status === 'pending') {
      order.status = 'offers_received';
      await order.addTrackingUpdate('offers_received', 'Partners have submitted offers', '');
    }

    await order.save();

    res.status(201).json({
      status: 'success',
      message: 'Offer submitted successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Partner accepts/assigns themselves to a delivery request directly
exports.partnerAcceptRequest = async (req, res) => {
  try {
    const { orderId, partnerId } = req.body;

    if (!orderId || !partnerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and Partner ID are required'
      });
    }

    const Transaction = require('../models/Transaction');
    const order = await Order.findById(orderId).populate('buyerId');
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (!isPartnerDeliveryMethod(order.deliveryMethod)) {
      return res.status(400).json({
        status: 'error',
        message: 'This order is not for partner delivery'
      });
    }

    if (order.status !== 'pending' && order.status !== 'offers_received') {
      return res.status(400).json({
        status: 'error',
        message: 'This order is no longer accepting assignments'
      });
    }

    // Check if order is already assigned
    if (order.assignedPartnerId) {
      return res.status(400).json({
        status: 'error',
        message: 'This order is already assigned to another partner'
      });
    }

    // Verify partner exists - check User model for role-based partners, Partner model for others
    const User = require('../models/User');
    let partner = null;
    if (order.deliveryMethod === 'delivery_partner' || order.deliveryMethod === 'acha_sisters_delivery_partner' || 
        order.deliveryMethod === 'movers_packers' || order.deliveryMethod === 'gift_delivery_partner') {
      partner = await User.findById(partnerId);
      if (!partner || partner.role !== order.deliveryMethod) {
        return res.status(404).json({
          status: 'error',
          message: 'Partner not found or role mismatch'
        });
      }
    } else {
      partner = await Partner.findById(partnerId);
      if (!partner) {
        return res.status(404).json({
          status: 'error',
          message: 'Partner not found'
        });
      }
    }

    // Check if partner has an existing offer - if so, mark it as accepted
    const existingOffer = order.partnerOffers.find(
      offer => offer.partnerId.toString() === partnerId
    );

    let offerPrice = 0;
    if (existingOffer) {
      existingOffer.status = 'accepted';
      offerPrice = existingOffer.offerPrice || 0;
      // Reject other pending offers
      order.partnerOffers.forEach(offer => {
        if (offer.partnerId.toString() !== partnerId && offer.status === 'pending') {
          offer.status = 'rejected';
        }
      });
    } else {
      // Create an offer automatically if partner doesn't have one
      order.partnerOffers.push({
        partnerId,
        offerPrice: null,
        estimatedDeliveryTime: null,
        message: 'Partner accepted request directly',
        status: 'accepted'
      });
      // Reject other pending offers
      order.partnerOffers.forEach(offer => {
        if (offer.partnerId.toString() !== partnerId && offer.status === 'pending') {
          offer.status = 'rejected';
        }
      });
    }

    // Calculate transaction amount
    const itemValue = order.pricing?.itemValue || 0;
    const deliveryFee = offerPrice || order.pricing?.deliveryFee || 0;
    const serviceFee = order.pricing?.serviceFee || 0;
    const platformFee = order.pricing?.platformFee || 0;
    const totalAmount = itemValue + deliveryFee + serviceFee + platformFee;

    // Create transaction
    const transaction = await Transaction.create({
      orderId: order._id,
      buyerId: order.buyerId._id || order.buyerId,
      transactionType: 'order_payment',
      paymentMethod: 'cash', // Default to cash, can be updated later
      amount: totalAmount,
      currency: order.pricing?.currency || 'ETB',
      fees: {
        deliveryFee: deliveryFee,
        serviceFee: serviceFee,
        platformFee: platformFee,
        total: deliveryFee + serviceFee + platformFee
      },
      status: 'pending'
    });

    // Update order pricing and transaction reference
    if (!order.pricing) {
      order.pricing = {};
    }
    order.pricing.deliveryFee = deliveryFee;
    order.pricing.serviceFee = serviceFee;
    order.pricing.platformFee = platformFee;
    order.pricing.totalAmount = totalAmount;
    order.pricing.currency = order.pricing.currency || 'ETB';
    order.transactionId = transaction._id;
    order.paymentStatus = 'pending';

    // Assign order to partner
    order.assignedPartnerId = partnerId;
    order.status = 'assigned';
    const partnerName = partner.name || partner.companyName || 'Partner';
    const partnerEmail = partner.email;
    await order.addTrackingUpdate('assigned', `Order accepted and assigned to partner: ${partnerName}`, '');

    await order.save();

    // Send email notification to partner
    try {
      const { sendOrderAssignmentEmail } = require('../utils/emailService');
      await sendOrderAssignmentEmail(partnerEmail, partnerName, {
        orderId: order.uniqueId,
        uniqueId: order.uniqueId,
        productName: order.orderInfo?.productName,
        productDescription: order.orderInfo?.productDescription,
        deliveryDestination: order.orderInfo?.deliveryDestination,
        preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate,
        status: order.status
      });
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);
      // Don't fail the assignment if email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Request accepted successfully. Order assigned to you.',
      data: {
        order,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get orders assigned to a specific partner/user
exports.getOrdersForPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user?.id; // Get authenticated user ID
    const User = require('../models/User');

    // Use partnerId from params or authenticated user's ID
    const targetPartnerId = partnerId || userId;

    if (!targetPartnerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Partner ID is required'
      });
    }

    // Get user to determine their role for filtering available requests
    let userRole = req.user?.role;
    if (!userRole && targetPartnerId) {
      try {
        const user = await User.findById(targetPartnerId);
        if (user) {
          userRole = user.role;
        }
      } catch (err) {
        // If not found in User model, might be Partner model - that's okay
      }
    }

    // Find orders assigned to this partner/user
    const assignedOrders = await Order.find({ assignedPartnerId: targetPartnerId })
      .populate('buyerId', 'name email phone currentCity location')
      .populate('assignedTravelerId', 'name email phone currentLocation destinationCity')
      .sort({ createdAt: -1 });

    // Also get available requests matching this partner's role (if role-based partner)
    let availableRequests = [];
    if (userRole && isPartnerDeliveryMethod(userRole)) {
      const filter = {
        deliveryMethod: userRole,
        status: { $in: ['pending', 'offers_received'] },
        assignedPartnerId: { $ne: targetPartnerId }, // Not already assigned
        pickupLocation: { $exists: true, $ne: null }
      };
      
      availableRequests = await Order.find(filter)
        .populate('buyerId', 'name email phone currentCity')
        .sort({ createdAt: -1 })
        .limit(20);
    }

    res.status(200).json({
      status: 'success',
      count: assignedOrders.length,
      data: assignedOrders,
      availableRequests: availableRequests.length > 0 ? availableRequests : undefined
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get partner offers for a specific order (for client to view)
exports.getPartnerOffers = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('partnerOffers.partnerId', 'name companyName email phone city primaryLocation availability');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Filter only pending offers
    const pendingOffers = order.partnerOffers.filter(offer => offer.status === 'pending');

    res.status(200).json({
      status: 'success',
      count: pendingOffers.length,
      data: {
        order: {
          _id: order._id,
          uniqueId: order.uniqueId,
          status: order.status,
          orderInfo: order.orderInfo,
          pickupLocation: order.pickupLocation,
          deliveryLocation: order.deliveryLocation
        },
        offers: pendingOffers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
