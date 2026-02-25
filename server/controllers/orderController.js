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

// Helper function to calculate match score for travelers (higher = better match)
const calculateMatchScore = (traveler, buyerCity, orderDestination, preferredDate) => {
  let score = 0;
  
  // Location match (base score)
  if (locationsMatch(traveler.currentLocation, buyerCity)) {
    score += 10;
  }
  
  // Destination match
  if (orderDestination) {
    if (locationsMatch(traveler.destinationCity, orderDestination)) {
      score += 10;
    } else if (locationsMatch(traveler.destinationCity, buyerCity)) {
      score += 5; // Partial match
    }
  }
  
  // Date match - prioritize dates AFTER preferred date, then closest to preferred date
  if (preferredDate) {
    const departureDate = new Date(traveler.departureDate);
    const daysDiff = (departureDate - preferredDate) / (1000 * 60 * 60 * 24);
    
    // Bonus points for dates AFTER preferred date (not before)
    if (daysDiff >= 0) {
      // Date is on or after preferred date - give bonus
      if (daysDiff <= 1) score += 15; // Same day or next day
      else if (daysDiff <= 3) score += 12; // Within 3 days after
      else if (daysDiff <= 7) score += 10; // Within a week after
      else if (daysDiff <= 14) score += 7; // Within 2 weeks after
      else score += 3; // More than 2 weeks after (still valid but less ideal)
    } else {
      // Date is before preferred date - penalize (shouldn't happen with new filter, but just in case)
      score -= 5;
    }
  } else {
    // If no preferred date, prefer earlier departures (sooner is better)
    const departureDate = new Date(traveler.departureDate);
    const now = new Date();
    if (departureDate >= now) {
      const daysUntil = (departureDate - now) / (1000 * 60 * 60 * 24);
      if (daysUntil <= 7) score += 5;
      else if (daysUntil <= 14) score += 3;
    }
  }
  
  return score;
};

// Helper function to calculate match score for partners (higher = better match)
const calculatePartnerMatchScore = (partner, buyerCity, orderDestination, preferredDate) => {
  let score = 0;
  
  // Location match (base score)
  const city = partner.city || partner.primaryLocation || partner.location;
  if (locationsMatch(city, buyerCity)) {
    score += 10;
  }
  
  // If partner has destination coverage, check that too
  if (orderDestination && partner.primaryLocation) {
    if (locationsMatch(partner.primaryLocation, orderDestination)) {
      score += 5;
    }
  }
  
  // Availability match (if partner has availability data, you can enhance this)
  // For now, all active partners get the same availability score
  if (partner.status === 'active' || partner.status === 'approved') {
    score += 5;
  }
  
  return score;
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

    // Find ALL available matches (both travelers and delivery partners)
    // Match based on location, destination, and date
    const buyerCity = buyer.currentCity;
    const orderDestination = orderInfo.deliveryDestination || orderInfo.countryOfOrigin || buyerCity;
    // Fix date handling - ensure we use the date without timezone conversion issues
    let preferredDate = null;
    if (orderInfo.preferredDeliveryDate) {
      const dateStr = orderInfo.preferredDeliveryDate;
      // If it's already a Date object, use it; otherwise parse it
      preferredDate = dateStr instanceof Date ? dateStr : new Date(dateStr);
      // Set to start of day in local timezone to avoid timezone issues
      preferredDate.setHours(0, 0, 0, 0);
    }
    const now = new Date();

    console.log('Finding ALL matches for order:', {
      deliveryMethod,
      buyerCity,
      orderDestination,
      preferredDate: preferredDate ? preferredDate.toISOString() : null
    });

    let travelerMatches = [];
    let partnerMatches = [];

    // ========== FIND MATCHING TRAVELERS ==========
    try {
      // Find active travelers matching pickup location
      // Note: We'll filter out travelers already assigned to orders later
      const matchingTravelers = await Traveller.find({
        status: 'active',
        currentLocation: { $regex: new RegExp(buyerCity, 'i') }
      }).limit(50); // Get more candidates to filter
      
      // Check which travelers are already assigned to pending/matched orders
      const assignedTravelerIds = await Order.find({
        status: { $in: ['pending', 'matched', 'assigned', 'picked_up', 'in_transit'] },
        assignedTravelerId: { $exists: true, $ne: null }
      }).distinct('assignedTravelerId');
      
      // Filter out already assigned travelers
      const unassignedTravelers = matchingTravelers.filter(t => 
        !assignedTravelerIds.some(id => id.toString() === t._id.toString())
      );

      console.log(`Found ${unassignedTravelers.length} unassigned travelers in ${buyerCity} (out of ${matchingTravelers.length} total)`);

      // Filter travelers by destination and date
      const suitableTravelers = unassignedTravelers.filter(traveler => {
        // Location match: traveler's current location should match buyer's city (pickup point)
        const pickupMatch = locationsMatch(traveler.currentLocation, buyerCity);
        
        // Destination match: traveler's destination should match order destination
        const destinationMatch = !orderDestination || 
          locationsMatch(traveler.destinationCity, orderDestination);
        
        // Date validation: traveler's departure date should be valid (not in the past)
        const departureDate = new Date(traveler.departureDate);
        const isDateValid = departureDate >= now;
        
        // Date match: traveler should depart on or AFTER preferred delivery date (not before)
        // This ensures the traveler can deliver by or after the preferred date
        const isDateAfterPreferred = !preferredDate || departureDate >= preferredDate;
        
        return pickupMatch && destinationMatch && isDateValid && isDateAfterPreferred;
      });

      // Sort travelers: prioritize those with dates AFTER preferred date, then by closest date
      suitableTravelers.sort((a, b) => {
        const dateA = new Date(a.departureDate);
        const dateB = new Date(b.departureDate);
        
        if (preferredDate) {
          const aIsAfter = dateA >= preferredDate;
          const bIsAfter = dateB >= preferredDate;
          
          // Prioritize dates after preferred date
          if (aIsAfter && !bIsAfter) return -1;
          if (!aIsAfter && bIsAfter) return 1;
          
          // If both are after or both are before, sort by closest to preferred date
          const diffA = Math.abs(dateA - preferredDate);
          const diffB = Math.abs(dateB - preferredDate);
          return diffA - diffB;
        }
        
        // If no preferred date, sort by closest to now
        return dateA - dateB;
      });

      travelerMatches = suitableTravelers.map(t => ({
        _id: t._id,
        uniqueId: t.uniqueId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        whatsapp: t.whatsapp,
        telegram: t.telegram,
        currentLocation: t.currentLocation,
        destinationCity: t.destinationCity,
        departureDate: t.departureDate,
        departureTime: t.departureTime,
        arrivalDate: t.arrivalDate,
        arrivalTime: t.arrivalTime,
        travellerType: t.travellerType,
        matchType: 'traveler',
        matchScore: calculateMatchScore(t, buyerCity, orderDestination, preferredDate)
      }));

      console.log(`Found ${travelerMatches.length} suitable travelers`);
    } catch (travelerError) {
      console.error('Error finding traveler matches:', travelerError);
    }

    // ========== FIND MATCHING DELIVERY PARTNERS ==========
    try {
      // Find all delivery partner types
      const partnerRoles = ['delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers', 'gift_delivery_partner'];
      
      // Find users with delivery partner roles matching location
      let matchingUsers = await User.find({
        role: { $in: partnerRoles },
        status: 'active',
        $or: [
          { city: { $regex: new RegExp(buyerCity, 'i') } },
          { primaryLocation: { $regex: new RegExp(buyerCity, 'i') } },
          { location: { $regex: new RegExp(buyerCity, 'i') } }
        ]
      }).limit(50);

      console.log(`Found ${matchingUsers.length} potential delivery partners (users) in ${buyerCity}`);

      // Filter by location match and date availability (if partner has availability info)
      const suitableUsers = matchingUsers.filter(user => {
        const locationMatch = locationsMatch(user.city, buyerCity) || 
                             locationsMatch(user.primaryLocation, buyerCity) ||
                             locationsMatch(user.location, buyerCity);
        
        // For partners, we can check if they have availability settings
        // If preferredDate is set, check if partner is available around that time
        // (This is a basic check - you can enhance this with actual availability data)
        return locationMatch;
      });

      // Convert to match format
      const userMatches = suitableUsers.map(u => ({
        _id: u._id,
        userId: u.userId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        city: u.city,
        primaryLocation: u.primaryLocation,
        location: u.location,
        role: u.role,
        matchType: 'partner',
        isPartnerModel: false,
        matchScore: calculatePartnerMatchScore(u, buyerCity, orderDestination, preferredDate)
      }));

      partnerMatches.push(...userMatches);

      // Also check Partner model for legacy partners and gift delivery partners
      const legacyPartners = await Partner.find({
        status: 'approved',
        $or: [
          { registrationType: 'Invest/Partner', partner: 'Delivery Partner' },
          { registrationType: 'Gift Delivery Partner' }
        ],
        $or: [
          { city: { $regex: new RegExp(buyerCity, 'i') } },
          { primaryLocation: { $regex: new RegExp(buyerCity, 'i') } }
        ]
      }).limit(50);

      console.log(`Found ${legacyPartners.length} potential legacy partners in ${buyerCity}`);

      const suitableLegacyPartners = legacyPartners.filter(partner => {
        return locationsMatch(partner.city, buyerCity) || 
               locationsMatch(partner.primaryLocation, buyerCity);
      });

      const legacyMatches = suitableLegacyPartners.map(p => ({
        _id: p._id,
        uniqueId: p.uniqueId,
        name: p.name || p.companyName,
        companyName: p.companyName,
        email: p.email,
        phone: p.phone,
        city: p.city,
        primaryLocation: p.primaryLocation,
        registrationType: p.registrationType,
        matchType: 'partner',
        isPartnerModel: true,
        matchScore: calculatePartnerMatchScore(p, buyerCity, orderDestination, preferredDate)
      }));

      partnerMatches.push(...legacyMatches);

      // Sort partners by match score (best matches first)
      partnerMatches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      console.log(`Found ${partnerMatches.length} suitable delivery partners`);
    } catch (partnerError) {
      console.error('Error finding partner matches:', partnerError);
    }

    // Combine all matches
    const availableMatches = {
      travelers: travelerMatches,
      partners: partnerMatches,
      total: travelerMatches.length + partnerMatches.length
    };

    console.log(`Order created. Found ${travelerMatches.length} travelers and ${partnerMatches.length} partners (${availableMatches.total} total matches)`);
    
    // Send email to gift recipient if this is a gift delivery order
    if (deliveryMethod === 'gift_delivery_partner' && orderInfo.recipientEmail && orderInfo.recipientName) {
      try {
        const { sendGiftRecipientEmail } = require('../utils/emailService');
        await sendGiftRecipientEmail(
          orderInfo.recipientEmail,
          orderInfo.recipientName,
          buyer.name,
          {
            giftType: orderInfo.giftType,
            giftMessage: orderInfo.giftMessage,
            deliveryAddress: orderInfo.recipientAddress,
            preferredDeliveryDate: orderInfo.preferredDeliveryDate
          }
        );
        console.log(`Gift recipient notification email sent to: ${orderInfo.recipientEmail}`);
      } catch (emailError) {
        console.error('Error sending gift recipient email:', emailError);
        // Don't fail order creation if email fails
      }
    }
    
    // Automatically match/assign based on delivery method
    let assignedPartner = null;
    let assignedTraveler = null;
    let autoAssigned = false;
    let autoMatched = false;
    
    // Auto-match with traveler if delivery method is 'traveler' and matches found
    if (deliveryMethod === 'traveler' && travelerMatches.length > 0) {
      try {
        const bestTraveler = travelerMatches[0]; // Get best matching traveler
        const travelerId = bestTraveler._id;
        
        const traveler = await Traveller.findById(travelerId);
        if (traveler && traveler.status === 'active') {
          order.assignedTravelerId = travelerId;
          order.status = 'matched';
          await order.addTrackingUpdate('matched', `Order automatically matched with traveler: ${traveler.name}`, '');
          await order.save();
          
          assignedTraveler = {
            _id: traveler._id,
            name: traveler.name,
            email: traveler.email,
            phone: traveler.phone
          };
          autoMatched = true;
          
          // Send email notification to traveler
          try {
            const { sendOrderAssignmentEmail } = require('../utils/emailService');
            await sendOrderAssignmentEmail(traveler.email, traveler.name, {
              orderId: order.uniqueId,
              uniqueId: order.uniqueId,
              productName: order.orderInfo?.productName,
              deliveryDestination: order.orderInfo?.deliveryDestination,
              preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate,
              deliveryMethod: 'traveler'
            });
          } catch (emailError) {
            console.error('Error sending match email to traveler:', emailError);
          }
          
          // Send email notification to buyer about match found
          try {
            const { sendMatchFoundEmailToBuyer } = require('../utils/emailService');
            await sendMatchFoundEmailToBuyer(buyer.email, buyer.name, {
              orderId: order.uniqueId,
              uniqueId: order.uniqueId,
              productName: order.orderInfo?.productName,
              deliveryDestination: order.orderInfo?.deliveryDestination,
              preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate
            }, {
              name: traveler.name,
              email: traveler.email,
              phone: traveler.phone,
              currentLocation: traveler.currentLocation,
              destinationCity: traveler.destinationCity,
              departureDate: traveler.departureDate
            });
          } catch (emailError) {
            console.error('Error sending match email to buyer:', emailError);
          }
          
          console.log(`Order ${order.uniqueId} automatically matched with traveler: ${traveler.name}`);
        }
      } catch (matchError) {
        console.error('Error during automatic traveler matching:', matchError);
        // Continue without matching if there's an error
      }
    }
    
    // Automatically assign order to first available partner if found (only for partner delivery methods)
    
    if (partnerMatches.length > 0 && isPartnerDeliveryMethod(deliveryMethod)) {
      try {
        const firstMatch = partnerMatches[0]; // Get best matching partner
        const partnerId = firstMatch._id;
        
        // For role-based delivery methods, assign to User or Partner model
        if (deliveryMethod === 'delivery_partner' || deliveryMethod === 'acha_sisters_delivery_partner' || 
            deliveryMethod === 'movers_packers' || deliveryMethod === 'gift_delivery_partner') {
          // Check if this match is from Partner model (for gift_delivery_partner)
          if (firstMatch.isPartnerModel && deliveryMethod === 'gift_delivery_partner') {
            const partner = await Partner.findById(partnerId);
            if (partner && partner.status === 'approved' && partner.registrationType === 'Gift Delivery Partner') {
              order.assignedPartnerId = partnerId;
              order.status = 'assigned';
              order.partnerAcceptanceStatus = 'pending';
              const partnerName = partner.name || partner.companyName || 'Partner';
              await order.addTrackingUpdate('assigned', `Order automatically assigned to ${deliveryMethod}: ${partnerName}`, '');
              await order.save();
              
              assignedPartner = {
                _id: partner._id,
                name: partner.name || partner.companyName,
                email: partner.email,
                phone: partner.phone
              };
              autoAssigned = true;
              
              // Send email notification to partner
              try {
                const { sendOrderAssignmentEmail } = require('../utils/emailService');
                await sendOrderAssignmentEmail(partner.email, partnerName, {
                  orderId: order.uniqueId,
                  uniqueId: order.uniqueId,
                  productName: order.orderInfo?.productName,
                  deliveryDestination: order.orderInfo?.deliveryDestination,
                  preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate,
                  deliveryMethod: deliveryMethod
                });
              } catch (emailError) {
                console.error('Error sending assignment email:', emailError);
              }
              
              // Send email notification to buyer about match found
              try {
                const { sendMatchFoundEmailToBuyer } = require('../utils/emailService');
                await sendMatchFoundEmailToBuyer(buyer.email, buyer.name, {
                  orderId: order.uniqueId,
                  uniqueId: order.uniqueId,
                  productName: order.orderInfo?.productName,
                  deliveryDestination: order.orderInfo?.deliveryDestination,
                  preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate
                }, {
                  name: partnerName,
                  email: partner.email,
                  phone: partner.phone,
                  city: partner.city || partner.primaryLocation
                });
              } catch (emailError) {
                console.error('Error sending match email to buyer:', emailError);
              }
              
              console.log(`Order ${order.uniqueId} automatically assigned to ${deliveryMethod}: ${partnerName}`);
            }
          } else {
            // Assign to User model
            const partner = await User.findById(partnerId);
            if (partner && partner.role === deliveryMethod && partner.status === 'active') {
              order.assignedPartnerId = partnerId;
              order.status = 'assigned';
              order.partnerAcceptanceStatus = 'pending';
              const partnerName = partner.name || partner.companyName || 'Partner';
              await order.addTrackingUpdate('assigned', `Order automatically assigned to ${deliveryMethod}: ${partnerName}`, '');
              await order.save();
              
              assignedPartner = {
                _id: partner._id,
                name: partner.name,
                email: partner.email,
                phone: partner.phone
              };
              autoAssigned = true;
              
              // Send email notification to partner
              try {
                const { sendOrderAssignmentEmail } = require('../utils/emailService');
                await sendOrderAssignmentEmail(partner.email, partnerName, {
                  orderId: order.uniqueId,
                  uniqueId: order.uniqueId,
                  productName: order.orderInfo?.productName,
                  deliveryDestination: order.orderInfo?.deliveryDestination,
                  preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate,
                  deliveryMethod: deliveryMethod
                });
              } catch (emailError) {
                console.error('Error sending assignment email:', emailError);
              }
              
              // Send email notification to buyer about match found
              try {
                const { sendMatchFoundEmailToBuyer } = require('../utils/emailService');
                await sendMatchFoundEmailToBuyer(buyer.email, buyer.name, {
                  orderId: order.uniqueId,
                  uniqueId: order.uniqueId,
                  productName: order.orderInfo?.productName,
                  deliveryDestination: order.orderInfo?.deliveryDestination,
                  preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate
                }, {
                  name: partnerName,
                  email: partner.email,
                  phone: partner.phone,
                  city: partner.city || partner.primaryLocation
                });
              } catch (emailError) {
                console.error('Error sending match email to buyer:', emailError);
              }
              
              console.log(`Order ${order.uniqueId} automatically assigned to ${deliveryMethod}: ${partnerName}`);
            }
          }
        } else {
          // For legacy partner delivery, assign to Partner model
          const partner = await Partner.findById(partnerId);
          if (partner && partner.status === 'approved') {
            order.assignedPartnerId = partnerId;
            order.status = 'assigned';
            order.partnerAcceptanceStatus = 'pending';
            const partnerName = partner.name || partner.companyName || 'Partner';
            await order.addTrackingUpdate('assigned', `Order automatically assigned to partner: ${partnerName}`, '');
            await order.save();
            
            assignedPartner = {
              _id: partner._id,
              name: partner.name || partner.companyName,
              email: partner.email,
              phone: partner.phone
            };
            autoAssigned = true;
            
            // Send email notification to partner
            try {
              const { sendOrderAssignmentEmail } = require('../utils/emailService');
              await sendOrderAssignmentEmail(partner.email, partnerName, {
                orderId: order.uniqueId,
                uniqueId: order.uniqueId,
                productName: order.orderInfo?.productName,
                deliveryDestination: order.orderInfo?.deliveryDestination,
                preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate,
                deliveryMethod: deliveryMethod
              });
            } catch (emailError) {
              console.error('Error sending assignment email:', emailError);
            }
            
            // Send email notification to buyer about match found
            try {
              const { sendMatchFoundEmailToBuyer } = require('../utils/emailService');
              await sendMatchFoundEmailToBuyer(buyer.email, buyer.name, {
                orderId: order.uniqueId,
                uniqueId: order.uniqueId,
                productName: order.orderInfo?.productName,
                deliveryDestination: order.orderInfo?.deliveryDestination,
                preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate
              }, {
                name: partnerName,
                email: partner.email,
                phone: partner.phone,
                city: partner.city || partner.primaryLocation
              });
            } catch (emailError) {
              console.error('Error sending match email to buyer:', emailError);
            }
            
            console.log(`Order ${order.uniqueId} automatically assigned to partner: ${partnerName}`);
          }
        }
      } catch (assignError) {
        console.error('Error during automatic assignment:', assignError);
        // Continue without assignment if there's an error
      }
    }
    
    // Determine match type and if match was found
    let matchType = null;
    if (deliveryMethod === 'traveler' && travelerMatches.length > 0) {
      matchType = 'traveler';
    } else if (isPartnerDeliveryMethod(deliveryMethod) && partnerMatches.length > 0) {
      matchType = 'partner';
    }
    
    const hasMatch = autoMatched || autoAssigned;
    const matchFound = (deliveryMethod === 'traveler' && travelerMatches.length > 0) || 
                      (isPartnerDeliveryMethod(deliveryMethod) && partnerMatches.length > 0);
    
    res.status(201).json({
      status: 'success',
      message: hasMatch
        ? (autoMatched ? 'Order created and automatically matched with traveler. We will email you shortly.' : 'Order created and automatically assigned to available partner. We will email you shortly.')
        : matchFound
        ? `Order created successfully. Found ${availableMatches.total} available matches. Please proceed to payment.`
        : `Order created successfully. No match found at this moment. We will email you when a match becomes available.`,
      data: {
        ...order.toObject(),
        availableMatches: {
          travelers: travelerMatches,
          partners: partnerMatches,
          all: [...travelerMatches, ...partnerMatches], // Combined list for backward compatibility
          total: availableMatches.total
        },
        matchType: matchType, // 'traveler' or 'partner' or null
        matchFound: matchFound,
        autoMatched: autoMatched,
        autoAssigned: autoAssigned,
        requiresSelection: !hasMatch && availableMatches.total > 0,
        assignedPartner: assignedPartner,
        assignedTraveler: assignedTraveler
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
    order.partnerAcceptanceStatus = 'pending';
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

    // Exclude name and other sensitive information for privacy before order is matched
    const sanitizedTravelers = travelers.map(traveler => {
      const travelerObj = traveler.toObject();
      // Remove name and other personal info, keep only necessary matching info
      delete travelerObj.name;
      return {
        _id: travelerObj._id,
        uniqueId: travelerObj.uniqueId,
        currentLocation: travelerObj.currentLocation,
        destinationCity: travelerObj.destinationCity,
        departureDate: travelerObj.departureDate,
        departureTime: travelerObj.departureTime,
        arrivalDate: travelerObj.arrivalDate,
        arrivalTime: travelerObj.arrivalTime,
        travellerType: travelerObj.travellerType,
        status: travelerObj.status
        // Note: email and phone will be revealed only after order is matched
      };
    });

    res.status(200).json({
      status: 'success',
      count: sanitizedTravelers.length,
      data: sanitizedTravelers
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
    // For public view (no auth), show all delivery methods that can use partners
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
    
    // Build filter - make pickupLocation optional for public view
    // Show all orders with partner delivery methods, regardless of location data
    // Filter out orders that are already assigned and accepted (show unmatched requests)
    const filter = {
      deliveryMethod: { $in: allowedDeliveryMethods },
      status: { $nin: ['completed', 'cancelled'] }, // Exclude only completed and cancelled orders
      // Filter to show only unmatched requests:
      // - No assignedPartnerId, OR
      // - assignedPartnerId exists but partnerAcceptanceStatus is not 'accepted' (pending/rejected)
      $or: [
        { assignedPartnerId: { $exists: false } },
        { assignedPartnerId: null },
        { partnerAcceptanceStatus: { $ne: 'accepted' } }
      ]
    };
    
    // Only require pickupLocation with coordinates if coordinates are provided (for distance filtering)
    // Otherwise, show all orders regardless of location data
    if (latitude && longitude) {
      filter.pickupLocation = { $exists: true, $ne: null };
      filter['pickupLocation.latitude'] = { $exists: true, $ne: null };
      filter['pickupLocation.longitude'] = { $exists: true, $ne: null };
    }

    console.log('Fetching delivery requests with filter:', JSON.stringify(filter, null, 2));
    
    const orders = await Order.find(filter)
      .populate('buyerId', 'name email phone currentCity')
      .sort({ createdAt: -1 });
      // Removed limit to fetch all delivery requests
    
    console.log(`Found ${orders.length} orders matching filter`);

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
    order.partnerAcceptanceStatus = 'pending';
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

// Partner accepts an assigned order
exports.partnerAcceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const User = require('../models/User');
    const Buyer = require('../models/Buyer');
    const order = await Order.findById(orderId).populate('buyerId');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Verify the order is assigned to this partner
    if (!order.assignedPartnerId || order.assignedPartnerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'This order is not assigned to you'
      });
    }

    // Check if order is in assigned status
    if (order.status !== 'assigned') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is not in assigned status'
      });
    }

    // Get partner info
    let partner = null;
    if (order.deliveryMethod === 'delivery_partner' || order.deliveryMethod === 'acha_sisters_delivery_partner' || 
        order.deliveryMethod === 'movers_packers' || order.deliveryMethod === 'gift_delivery_partner') {
      partner = await User.findById(userId);
    } else {
      const Partner = require('../models/Partner');
      partner = await Partner.findById(userId);
    }

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Update order acceptance status
    order.partnerAcceptanceStatus = 'accepted';
    const partnerName = partner.name || partner.companyName || 'Delivery Partner';
    await order.addTrackingUpdate('assigned', `Order accepted by delivery partner: ${partnerName}`, '');
    await order.save();

    // Send email to client
    try {
      const buyer = order.buyerId;
      if (buyer && buyer.email) {
        const { sendOrderAcceptedEmail } = require('../utils/emailService');
        await sendOrderAcceptedEmail(buyer.email, buyer.name || 'Client', {
          orderId: order.uniqueId,
          uniqueId: order.uniqueId,
          productName: order.orderInfo?.productName,
          productDescription: order.orderInfo?.productDescription,
          deliveryDestination: order.orderInfo?.deliveryDestination
        }, partnerName);
      }
    } catch (emailError) {
      console.error('Error sending acceptance email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Order accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to accept order'
    });
  }
};

// Partner rejects an assigned order
exports.partnerRejectOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const User = require('../models/User');
    const Buyer = require('../models/Buyer');
    const order = await Order.findById(orderId).populate('buyerId');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Verify the order is assigned to this partner
    if (!order.assignedPartnerId || order.assignedPartnerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'This order is not assigned to you'
      });
    }

    // Check if order is in assigned status
    if (order.status !== 'assigned') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is not in assigned status'
      });
    }

    // Get partner info
    let partner = null;
    if (order.deliveryMethod === 'delivery_partner' || order.deliveryMethod === 'acha_sisters_delivery_partner' || 
        order.deliveryMethod === 'movers_packers' || order.deliveryMethod === 'gift_delivery_partner') {
      partner = await User.findById(userId);
    } else {
      const Partner = require('../models/Partner');
      partner = await Partner.findById(userId);
    }

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    const partnerName = partner.name || partner.companyName || 'Delivery Partner';

    // Update order - reject and unassign
    order.partnerAcceptanceStatus = 'rejected';
    order.assignedPartnerId = null;
    // Change status back to pending or offers_received based on whether there are offers
    if (order.partnerOffers && order.partnerOffers.length > 0) {
      order.status = 'offers_received';
    } else {
      order.status = 'pending';
    }
    await order.addTrackingUpdate('pending', `Order rejected by delivery partner: ${partnerName}. Order will be reassigned.`, '');
    await order.save();

    // Send email to client
    try {
      const buyer = order.buyerId;
      if (buyer && buyer.email) {
        const { sendOrderRejectedEmail } = require('../utils/emailService');
        await sendOrderRejectedEmail(buyer.email, buyer.name || 'Client', {
          orderId: order.uniqueId,
          uniqueId: order.uniqueId,
          productName: order.orderInfo?.productName,
          productDescription: order.orderInfo?.productDescription,
          deliveryDestination: order.orderInfo?.deliveryDestination
        }, partnerName);
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Order rejected successfully. Order will be reassigned.',
      data: { order }
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to reject order'
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
      .populate('assignedPartnerId', 'name companyName email phone city primaryLocation bankAccount')
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

// Get orders assigned to a traveller
exports.getOrdersForTraveller = async (req, res) => {
  try {
    const { travellerId } = req.params;
    const userId = req.user?.id; // Get authenticated user ID if available

    // Use travellerId from params or try to find traveller by user email/phone
    let targetTravellerId = travellerId;
    
    if (!targetTravellerId && userId) {
      // Try to find traveller by user ID or email
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user) {
        // Find traveller by email or phone
        const traveller = await Traveller.findOne({
          $or: [
            { email: user.email },
            { phone: user.phone }
          ]
        });
        if (traveller) {
          targetTravellerId = traveller._id.toString();
        }
      }
    }

    if (!targetTravellerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Traveller ID is required'
      });
    }

    // Find orders assigned to this traveller
    const assignedOrders = await Order.find({ assignedTravelerId: targetTravellerId })
      .populate('buyerId', 'name email phone currentCity location')
      .populate('assignedTravelerId', 'name email phone currentLocation destinationCity departureDate arrivalDate bankAccount')
      .populate('assignedPartnerId', 'name companyName email phone city primaryLocation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: assignedOrders.length,
      data: assignedOrders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Download gift card for an order
exports.downloadGiftCard = async (req, res) => {
  try {
    const { orderId } = req.params;
    const path = require('path');
    const fs = require('fs');

    const order = await Order.findById(orderId).populate('buyerId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if this is a gift delivery order
    if (order.deliveryMethod !== 'gift_delivery_partner') {
      return res.status(400).json({
        status: 'error',
        message: 'This order is not a gift delivery order'
      });
    }

    // Check if gift card exists
    if (!order.giftCardUrl) {
      return res.status(404).json({
        status: 'error',
        message: 'Gift card has not been generated yet. Please complete payment first.'
      });
    }

    // Get the file path
    const filePath = path.join(__dirname, '..', order.giftCardUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Gift card file not found'
      });
    }

    // Set headers for PDF download
    const filename = `gift-card-${order.uniqueId || order._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading gift card:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to download gift card'
    });
  }
};
