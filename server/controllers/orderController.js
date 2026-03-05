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

// Helper function to calculate delivery fee from partner's distance pricing
const calculateDeliveryFeeFromDistancePricing = async (partner, pickupLocation, deliveryLocation) => {
  if (!partner.distancePricing || !Array.isArray(partner.distancePricing) || partner.distancePricing.length === 0) {
    return null; // No distance pricing configured
  }

  try {
    // Calculate distance from pickup location to delivery location
    // For delivery partners, they pick up from buyer's location and deliver to destination
    const distanceResult = await calculateDistance(pickupLocation, deliveryLocation);
    const distanceKm = distanceResult.distance || 0;

    if (distanceKm <= 0) {
      console.log(`Could not calculate distance for partner ${partner.name || partner.email}`);
      return null;
    }

    // Find matching distance range
    for (const range of partner.distancePricing) {
      if (distanceKm >= range.minDistance && distanceKm <= range.maxDistance) {
        console.log(`Found matching distance range for partner ${partner.name || partner.email}: ${distanceKm}km falls in ${range.minDistance}-${range.maxDistance}km range, price: ${range.price}`);
        return range.price;
      }
    }

    // If distance exceeds all ranges, use the highest range price
    const sortedRanges = [...partner.distancePricing].sort((a, b) => b.maxDistance - a.maxDistance);
    if (distanceKm > sortedRanges[0].maxDistance) {
      console.log(`Distance ${distanceKm}km exceeds all ranges, using highest range price: ${sortedRanges[0].price}`);
      return sortedRanges[0].price;
    }

    // If distance is less than all ranges, use the lowest range price
    const sortedRangesAsc = [...partner.distancePricing].sort((a, b) => a.minDistance - b.minDistance);
    if (distanceKm < sortedRangesAsc[0].minDistance) {
      console.log(`Distance ${distanceKm}km is less than all ranges, using lowest range price: ${sortedRangesAsc[0].price}`);
      return sortedRangesAsc[0].price;
    }

    return null;
  } catch (error) {
    console.error(`Error calculating delivery fee from distance pricing for partner ${partner.name || partner.email}:`, error);
    return null;
  }
};

// Create new order from buyer
exports.createOrder = async (req, res) => {
  try {
    console.log('Create order request received:', { body: req.body });
    const { buyerId, deliveryMethod, orderInfo, assignedTravelerId } = req.body;

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
    const { pickupLocation, deliveryLocation } = req.body;
    
    const orderData = {
      buyerId,
      deliveryMethod,
      orderInfo
    };

    // Add pickup and delivery locations if provided
    if (pickupLocation) {
      orderData.pickupLocation = {
        address: pickupLocation.address || '',
        city: pickupLocation.city || '',
        latitude: pickupLocation.latitude || null,
        longitude: pickupLocation.longitude || null
      };
    }

    if (deliveryLocation) {
      orderData.deliveryLocation = {
        address: deliveryLocation.address || '',
        city: deliveryLocation.city || '',
        latitude: deliveryLocation.latitude || null,
        longitude: deliveryLocation.longitude || null
      };
    }

    // If a specific traveler is assigned, add it to the order
    let preAssignedTraveler = null;
    if (assignedTravelerId) {
      // Verify traveler exists
      const Traveller = require('../models/Traveller');
      const traveler = await Traveller.findById(assignedTravelerId);
      if (traveler) {
        orderData.assignedTravelerId = assignedTravelerId;
        orderData.status = 'assigned'; // Set status to assigned since traveler is pre-selected
        preAssignedTraveler = traveler; // Store for later use in response
      }
    }

    const order = await Order.create(orderData);

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
      // Find partners matching the specific delivery method
      // Map delivery method to the corresponding role
      let partnerRole = deliveryMethod;
      if (deliveryMethod === 'partner') {
        // Legacy 'partner' method can match any partner type
        partnerRole = ['delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers', 'gift_delivery_partner'];
      }
      
      // Find users with delivery partner roles - first get all active partners with matching role
      const roleQuery = Array.isArray(partnerRole) ? { $in: partnerRole } : partnerRole;
      let allMatchingUsers = await User.find({
        role: roleQuery,
        status: 'active'
      }).limit(100); // Get more candidates to filter

      console.log(`Found ${allMatchingUsers.length} total active delivery partners with role matching ${deliveryMethod}`);

      // Filter by city match using the locationsMatch function (more flexible than regex)
      let matchingUsers = allMatchingUsers.filter(user => {
        const city = user.city || user.primaryLocation || user.location || '';
        return locationsMatch(city, buyerCity);
      });

      console.log(`Found ${matchingUsers.length} delivery partners (users) matching city ${buyerCity}`);
      if (matchingUsers.length > 0) {
        console.log(`Partner details:`, matchingUsers.map(u => ({
          name: u.name,
          role: u.role,
          city: u.city,
          primaryLocation: u.primaryLocation,
          location: u.location,
          hasDistancePricing: !!(u.distancePricing && Array.isArray(u.distancePricing) && u.distancePricing.length > 0),
          distancePricingCount: u.distancePricing?.length || 0
        })));
      }

      // Include all city-matched partners (don't filter out those without distancePricing)
      // Partners without distancePricing can still be matched and provide pricing when accepting
      const suitableUsers = matchingUsers.filter(user => {
        // Check if partner has distancePricing (for logging purposes)
        const hasDistancePricing = user.distancePricing && 
                                   Array.isArray(user.distancePricing) && 
                                   user.distancePricing.length > 0;
        
        if (!hasDistancePricing) {
          console.log(`Partner ${user.name} (${user.email}) matched by city but doesn't have distancePricing configured - they can provide pricing when accepting`);
        }
        
        // All city-matched partners pass through - they can provide pricing when accepting the order
        return true;
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
        distancePricing: u.distancePricing || [],
        matchType: 'partner',
        isPartnerModel: false,
        matchScore: calculatePartnerMatchScore(u, buyerCity, orderDestination, preferredDate)
      }));

      partnerMatches.push(...userMatches);

      // Also check Partner model for legacy partners and gift delivery partners
      // First get all approved partners with matching registration type
      const allLegacyPartners = await Partner.find({
        status: 'approved',
        $or: [
          { registrationType: 'Invest/Partner', partner: 'Delivery Partner' },
          { registrationType: 'Gift Delivery Partner' }
        ]
      }).limit(100); // Get more candidates to filter

      console.log(`Found ${allLegacyPartners.length} total approved legacy partners`);

      // Filter by city match using the locationsMatch function (more flexible than regex)
      const legacyPartners = allLegacyPartners.filter(partner => {
        const city = partner.city || partner.primaryLocation || '';
        return locationsMatch(city, buyerCity);
      });

      console.log(`Found ${legacyPartners.length} legacy partners matching city ${buyerCity}`);

      const suitableLegacyPartners = legacyPartners.filter(partner => {
        // Check if partner has distancePricing (for logging purposes)
        const hasDistancePricing = partner.distancePricing && 
                                   Array.isArray(partner.distancePricing) && 
                                   partner.distancePricing.length > 0;
        
        if (!hasDistancePricing) {
          console.log(`Legacy partner ${partner.name || partner.companyName} (${partner.email}) matched by city but doesn't have distancePricing configured - they can provide pricing when accepting`);
        }
        
        // All city-matched partners pass through - they can provide pricing when accepting the order
        return true;
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
        distancePricing: p.distancePricing || [],
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
            phone: traveler.phone,
            priceOffer: traveler.priceOffer || null
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
          
          // Match found email will be sent after payment is successful
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
              
              // Match found email will be sent after payment is successful
              console.log(`Order ${order.uniqueId} automatically assigned to ${deliveryMethod}: ${partnerName}`);
            }
          } else {
            // Assign to User model
            const partner = await User.findById(partnerId);
            
            // Allow partners without distancePricing to be assigned - they can provide pricing when accepting
            if (partner && partner.role === deliveryMethod && partner.status === 'active') {
              order.assignedPartnerId = partnerId;
              order.status = 'assigned';
              order.partnerAcceptanceStatus = 'pending';
              const partnerName = partner.name || partner.companyName || 'Partner';
              
              // Calculate delivery fee from partner's distance pricing (if available)
              // Use pickup location (where item is picked up from) and delivery location (where item is delivered to)
              const pickupLocation = order.pickupLocation?.address 
                ? `${order.pickupLocation.address}, ${order.pickupLocation.city || order.pickupLocation.address}`
                : (order.pickupLocation?.city || buyer.city || buyerCity);
              
              const deliveryDestination = order.deliveryLocation?.address 
                ? `${order.deliveryLocation.address}, ${order.deliveryLocation.city || order.deliveryLocation.address}`
                : (order.deliveryLocation?.city || order.orderInfo?.deliveryDestination || buyerCity);
              
              // Only calculate fee if partner has distancePricing configured
              const hasDistancePricing = partner.distancePricing && 
                                         Array.isArray(partner.distancePricing) && 
                                         partner.distancePricing.length > 0;
              
              if (hasDistancePricing && pickupLocation && deliveryDestination) {
                // Calculate distance from partner location to pickup location, then from pickup to delivery
                // For delivery partners, distance is from pickup to delivery (they pick up from buyer and deliver)
                const calculatedFee = await calculateDeliveryFeeFromDistancePricing(partner, pickupLocation, deliveryDestination);
                if (calculatedFee !== null && calculatedFee > 0) {
                  // Initialize pricing if not exists
                  if (!order.pricing) {
                    order.pricing = {};
                  }
                  order.pricing.deliveryFee = calculatedFee;
                  console.log(`Calculated delivery fee ${calculatedFee} ETB for order ${order.uniqueId} from partner ${partnerName}'s distance pricing`);
                }
              } else if (!hasDistancePricing) {
                console.log(`Partner ${partnerName} doesn't have distancePricing configured - they will provide pricing when accepting the order`);
              }
              
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
              
              // Match found email will be sent after payment is successful
              console.log(`Order ${order.uniqueId} automatically assigned to ${deliveryMethod}: ${partnerName}`);
            }
          }
        } else {
          // For legacy partner delivery, assign to Partner model
          const partner = await Partner.findById(partnerId);
          
          // Allow partners without distancePricing to be assigned - they can provide pricing when accepting
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
            
            // Match found email will be sent after payment is successful
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
        assignedTraveler: assignedTraveler || (preAssignedTraveler ? {
          _id: preAssignedTraveler._id,
          name: preAssignedTraveler.name,
          email: preAssignedTraveler.email,
          phone: preAssignedTraveler.phone,
          priceOffer: preAssignedTraveler.priceOffer || null
        } : null)
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
    // The route parameter is 'orderId', not 'id'
    const id = req.params.orderId || req.params.id;
    console.log(`Fetching order with ID: ${id}`);
    
    // Check if id is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    let order = null;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Try to find by _id first
      console.log(`ID is valid ObjectId, searching by _id: ${id}`);
      order = await Order.findById(id)
        .populate('buyerId', 'name email phone currentCity location')
        .populate('assignedTravelerId', 'name email phone currentLocation destinationCity departureDate arrivalDate')
        .populate('assignedPartnerId', 'name companyName email phone city primaryLocation');
      
      if (order) {
        console.log(`Order found by _id: ${order.uniqueId || order._id}`);
      } else {
        console.log(`Order not found by _id: ${id}`);
      }
    } else {
      console.log(`ID is not a valid ObjectId, will try uniqueId: ${id}`);
    }
    
    // If not found by _id, try to find by uniqueId
    if (!order) {
      console.log(`Trying to find order by uniqueId: ${id}`);
      order = await Order.findOne({ uniqueId: id })
        .populate('buyerId', 'name email phone currentCity location')
        .populate('assignedTravelerId', 'name email phone currentLocation destinationCity departureDate arrivalDate')
        .populate('assignedPartnerId', 'name companyName email phone city primaryLocation');
      
      if (order) {
        console.log(`Order found by uniqueId: ${order.uniqueId || order._id}`);
      } else {
        console.log(`Order not found by uniqueId: ${id}`);
      }
    }

    if (!order) {
      console.log(`Order not found with ID: ${id}`);
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    console.log(`Successfully fetched order: ${order.uniqueId || order._id}, status: ${order.status}`);
    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    // Handle invalid ObjectId errors more gracefully
    if (error.name === 'CastError' || error.message?.includes('Cast to ObjectId failed')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID format'
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch order'
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

    // Calculate delivery fee from partner's distance pricing if not provided in offer
    const offerPrice = selectedOffer?.offerPrice || null;
    let deliveryFee = offerPrice || order.pricing?.deliveryFee || 0;
    
    if (!offerPrice && partner.distancePricing && Array.isArray(partner.distancePricing) && partner.distancePricing.length > 0) {
      // Use pickup location (where item is picked up from) and delivery location (where item is delivered to)
      const pickupLocation = order.pickupLocation?.address 
        ? `${order.pickupLocation.address}, ${order.pickupLocation.city || order.pickupLocation.address}`
        : (order.pickupLocation?.city || '');
      
      const deliveryDestination = order.deliveryLocation?.address 
        ? `${order.deliveryLocation.address}, ${order.deliveryLocation.city || order.deliveryLocation.address}`
        : (order.deliveryLocation?.city || order.orderInfo?.deliveryDestination || '');
      
      if (pickupLocation && deliveryDestination) {
        // For delivery partners, distance is from pickup location to delivery location
        const calculatedFee = await calculateDeliveryFeeFromDistancePricing(partner, pickupLocation, deliveryDestination);
        if (calculatedFee !== null && calculatedFee > 0) {
          deliveryFee = calculatedFee;
          console.log(`Calculated delivery fee ${calculatedFee} ETB for order ${order.uniqueId} from partner ${partner.name || partner.email}'s distance pricing (pickup: ${pickupLocation}, delivery: ${deliveryDestination})`);
        }
      }
    }
    
    // Calculate transaction amount
    const itemValue = order.pricing?.itemValue || 0;
    const serviceFee = order.pricing?.serviceFee || 25;
    const platformFee = order.pricing?.platformFee || 15;
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
    // Show only pending orders so delivery partners can browse and accept them
    // Filter out orders that are already assigned and accepted (show unmatched requests)
    const filter = {
      deliveryMethod: { $in: allowedDeliveryMethods },
      status: 'pending', // Only show pending orders for delivery partners to browse and accept
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

    // Populate buyer to get email for notification
    await order.populate('buyerId', 'name email');

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

    // Send email notification to buyer about the new offer
    try {
      if (order.buyerId && order.buyerId.email) {
        const { sendPartnerOfferNotificationEmail } = require('../utils/emailService');
        await sendPartnerOfferNotificationEmail(
          order.buyerId.email,
          order.buyerId.name || 'Client',
          {
            orderId: order._id.toString(),
            uniqueId: order.uniqueId,
            productName: order.orderInfo?.productName,
            productDescription: order.orderInfo?.productDescription,
            deliveryDestination: order.orderInfo?.deliveryDestination || order.orderInfo?.countryOfOrigin
          },
          {
            name: partner.name,
            companyName: partner.companyName,
            city: partner.city
          },
          {
            offerPrice: offerPrice || null,
            estimatedDeliveryTime: estimatedDeliveryTime || null,
            message: message || ''
          }
        );
        console.log(`Partner offer notification email sent to buyer: ${order.buyerId.email}`);
      }
    } catch (emailError) {
      console.error('Error sending partner offer notification email:', emailError);
      // Don't fail the offer submission if email fails
    }

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
    const { orderId, partnerId, offerPrice: providedOfferPrice, estimatedDeliveryTime: providedEstimatedDeliveryTime } = req.body;

    if (!orderId || !partnerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and Partner ID are required'
      });
    }

    // Validate offer price if provided
    if (providedOfferPrice !== undefined && providedOfferPrice !== null) {
      const price = parseFloat(providedOfferPrice);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Offer price must be a valid number greater than 0'
        });
      }
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
    
    console.log(`Looking up partner with ID: ${partnerId} (type: ${typeof partnerId}) for delivery method: ${order.deliveryMethod}`);
    
    if (order.deliveryMethod === 'delivery_partner' || order.deliveryMethod === 'acha_sisters_delivery_partner' || 
        order.deliveryMethod === 'movers_packers' || order.deliveryMethod === 'gift_delivery_partner') {
      // For role-based delivery methods, check User model
      // Try multiple lookup methods
      const mongoose = require('mongoose');
      
      // Method 1: Find by _id (standard MongoDB ObjectId)
      // Convert partnerId to string and check if it's a valid ObjectId
      const partnerIdStr = partnerId.toString();
      if (mongoose.Types.ObjectId.isValid(partnerIdStr)) {
        try {
          partner = await User.findById(partnerIdStr);
          console.log(`User lookup by _id (${partnerIdStr}) result: ${partner ? `Found user with role: ${partner.role}, email: ${partner.email}` : 'User not found'}`);
        } catch (err) {
          console.error(`Error looking up user by _id: ${err.message}`);
        }
      } else {
        console.log(`PartnerId ${partnerIdStr} is not a valid MongoDB ObjectId`);
      }
      
      // Method 2: Find by userId field (if partnerId is a string userId)
      if (!partner) {
        try {
          partner = await User.findOne({ userId: partnerIdStr });
          console.log(`User lookup by userId field (${partnerIdStr}) result: ${partner ? `Found user with role: ${partner.role}, email: ${partner.email}` : 'User not found'}`);
        } catch (err) {
          console.error(`Error looking up user by userId: ${err.message}`);
        }
      }
      
      // Method 3: Find by email (if partnerId is actually an email)
      if (!partner && partnerIdStr.includes('@')) {
        try {
          partner = await User.findOne({ email: partnerIdStr.toLowerCase() });
          console.log(`User lookup by email result: ${partner ? `Found user with role: ${partner.role}` : 'User not found'}`);
        } catch (err) {
          console.error(`Error looking up user by email: ${err.message}`);
        }
      }
      
      if (!partner) {
        console.error(`Failed to find partner with ID: ${partnerId} for delivery method: ${order.deliveryMethod}`);
        return res.status(404).json({
          status: 'error',
          message: 'Partner not found. Please ensure you are logged in as a registered delivery partner. If the issue persists, please log out and log back in.'
        });
      }
      
      // Check if role matches - must be exact match for role-based delivery methods
      const isDeliveryPartnerRole = ['delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers', 'gift_delivery_partner'].includes(partner.role);
      
      if (!isDeliveryPartnerRole) {
        console.log(`User is not a delivery partner role. User role: ${partner.role}, required: ${order.deliveryMethod}`);
        return res.status(403).json({
          status: 'error',
          message: `You must be registered as a delivery partner to accept orders. Your current role is: ${partner.role}`
        });
      }
      
      // Role must match the order's delivery method exactly
      if (partner.role !== order.deliveryMethod) {
        console.log(`Role mismatch: partner role is ${partner.role}, order delivery method is ${order.deliveryMethod}`);
        return res.status(403).json({
          status: 'error',
          message: `Role mismatch. Your role (${partner.role}) does not match the required delivery method (${order.deliveryMethod}). Please accept orders that match your partner type.`
        });
      }
    } else {
      // For other delivery methods, check Partner model
      partner = await Partner.findById(partnerId);
      console.log(`Partner lookup result: ${partner ? `Found partner` : 'Partner not found'}`);
      
      if (!partner) {
        return res.status(404).json({
          status: 'error',
          message: 'Partner not found'
        });
      }
    }
    
    console.log(`Partner verified: ${partner.name || partner.email}, role: ${partner.role || 'N/A'}`);

    // Check if partner has an existing offer - if so, update it
    const existingOffer = order.partnerOffers.find(
      offer => offer.partnerId.toString() === partnerId
    );

    let offerPrice = providedOfferPrice ? parseFloat(providedOfferPrice) : 0;
    
    if (existingOffer) {
      // Update existing offer with provided price if given
      if (providedOfferPrice !== undefined && providedOfferPrice !== null) {
        existingOffer.offerPrice = offerPrice;
      }
      if (providedEstimatedDeliveryTime) {
        existingOffer.estimatedDeliveryTime = providedEstimatedDeliveryTime;
      }
      existingOffer.status = 'accepted';
      existingOffer.message = existingOffer.message || 'Partner accepted request with price';
      // Use existing offer price if no new price provided
      if (!offerPrice) {
        offerPrice = existingOffer.offerPrice || 0;
      }
      // Reject other pending offers
      order.partnerOffers.forEach(offer => {
        if (offer.partnerId.toString() !== partnerId && offer.status === 'pending') {
          offer.status = 'rejected';
        }
      });
    } else {
      // Create a new offer with the provided price
      order.partnerOffers.push({
        partnerId,
        offerPrice: offerPrice || null,
        estimatedDeliveryTime: providedEstimatedDeliveryTime || null,
        message: offerPrice ? `Partner accepted request with delivery price: ${offerPrice} ETB` : 'Partner accepted request directly',
        status: 'accepted'
      });
      // Reject other pending offers
      order.partnerOffers.forEach(offer => {
        if (offer.partnerId.toString() !== partnerId && offer.status === 'pending') {
          offer.status = 'rejected';
        }
      });
    }

    // Calculate delivery fee - use provided offer price if available, otherwise calculate from distance pricing
    let deliveryFee = offerPrice || order.pricing?.deliveryFee || 0;
    if (!offerPrice && partner.distancePricing && Array.isArray(partner.distancePricing) && partner.distancePricing.length > 0) {
      // Use pickup location (where item is picked up from) and delivery location (where item is delivered to)
      const pickupLocation = order.pickupLocation?.address 
        ? `${order.pickupLocation.address}, ${order.pickupLocation.city || order.pickupLocation.address}`
        : (order.pickupLocation?.city || '');
      
      const deliveryDestination = order.deliveryLocation?.address 
        ? `${order.deliveryLocation.address}, ${order.deliveryLocation.city || order.deliveryLocation.address}`
        : (order.deliveryLocation?.city || order.orderInfo?.deliveryDestination || '');
      
      if (pickupLocation && deliveryDestination) {
        // For delivery partners, distance is from pickup location to delivery location
        const calculatedFee = await calculateDeliveryFeeFromDistancePricing(partner, pickupLocation, deliveryDestination);
        if (calculatedFee !== null && calculatedFee > 0) {
          deliveryFee = calculatedFee;
          console.log(`Calculated delivery fee ${calculatedFee} ETB for order ${order.uniqueId} from partner ${partner.name || partner.email}'s distance pricing (pickup: ${pickupLocation}, delivery: ${deliveryDestination})`);
        }
      }
    }
    
    // Calculate transaction amount
    const itemValue = order.pricing?.itemValue || 0;
    const serviceFee = order.pricing?.serviceFee || 25;
    const platformFee = order.pricing?.platformFee || 15;
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
    order.partnerAcceptanceStatus = 'accepted';
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

    // Send email notification to buyer with final price
    try {
      const { sendOrderPriceConfirmationEmail } = require('../utils/emailService');
      const buyer = order.buyerId;
      if (buyer && buyer.email) {
        await sendOrderPriceConfirmationEmail(
          buyer.email,
          buyer.name || 'Valued Customer',
          partnerName,
          {
            orderId: order.uniqueId,
            uniqueId: order.uniqueId,
            productName: order.orderInfo?.productName,
            deliveryDestination: order.deliveryLocation?.address 
              ? `${order.deliveryLocation.address}, ${order.deliveryLocation.city || ''}`
              : (order.deliveryLocation?.city || order.orderInfo?.deliveryDestination || '')
          },
          {
            itemValue: itemValue,
            deliveryFee: deliveryFee,
            serviceFee: serviceFee,
            platformFee: platformFee,
            totalAmount: totalAmount,
            currency: order.pricing?.currency || 'ETB'
          }
        );
        console.log(`Price confirmation email sent to buyer: ${buyer.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send price confirmation email to buyer:', emailError);
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
    const { orderId, deliveryFee, price } = req.body; // Accept specific price from partner
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

    // Priority 1: Use the specific price provided by partner when accepting (highest priority)
    let finalDeliveryFee = deliveryFee || price || null;
    
    if (finalDeliveryFee && finalDeliveryFee > 0) {
      console.log(`Using partner-provided price ${finalDeliveryFee} ETB for order ${order.uniqueId}`);
    } else {
      // Priority 2: Check if there's an accepted partner offer with a specific price
      if (order.partnerOffers && Array.isArray(order.partnerOffers) && order.partnerOffers.length > 0) {
        const acceptedOffer = order.partnerOffers.find(offer => 
          offer.partnerId && offer.partnerId.toString() === userId.toString() && 
          (offer.status === 'accepted' || offer.offerPrice)
        );
        if (acceptedOffer && acceptedOffer.offerPrice) {
          finalDeliveryFee = acceptedOffer.offerPrice;
          console.log(`Using offer price ${finalDeliveryFee} ETB from partner offer for order ${order.uniqueId}`);
        }
      }
      
      // Priority 3: Check if pricing is already set
      if (!finalDeliveryFee && order.pricing && order.pricing.deliveryFee) {
        finalDeliveryFee = order.pricing.deliveryFee;
      }
      
      // Priority 4: Calculate from distance pricing (fallback)
      if (!finalDeliveryFee || finalDeliveryFee === 0) {
        const requiresDistancePricing = order.deliveryMethod === 'delivery_partner' || 
                                         order.deliveryMethod === 'acha_sisters_delivery_partner' ||
                                         order.deliveryMethod === 'movers_packers';
        
        if (requiresDistancePricing && partner.distancePricing && Array.isArray(partner.distancePricing) && partner.distancePricing.length > 0) {
          try {
            const pickupLocation = order.pickupLocation?.address || order.pickupLocation?.city || '';
            const deliveryLocation = order.deliveryLocation?.address || order.deliveryLocation?.city || '';
            
            if (pickupLocation && deliveryLocation) {
              const calculatedFee = await calculateDeliveryFeeFromDistancePricing(
                partner, 
                { address: pickupLocation, city: order.pickupLocation?.city },
                { address: deliveryLocation, city: order.deliveryLocation?.city }
              );
              
              if (calculatedFee !== null && calculatedFee > 0) {
                finalDeliveryFee = calculatedFee;
                console.log(`Calculated delivery fee ${finalDeliveryFee} ETB from distance pricing for order ${order.uniqueId} when partner accepted`);
              }
            }
          } catch (pricingError) {
            console.error('Error calculating pricing when partner accepted:', pricingError);
            // Continue even if pricing calculation fails
          }
        }
      }
    }
    
    // Validate that we have a price for delivery_partner, acha_sisters_delivery_partner, and movers_packers
    const requiresPrice = order.deliveryMethod === 'delivery_partner' || 
                          order.deliveryMethod === 'acha_sisters_delivery_partner' ||
                          order.deliveryMethod === 'movers_packers';
    
    if (requiresPrice && (!finalDeliveryFee || finalDeliveryFee <= 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a delivery fee/price when accepting this order. Price is required for delivery partners, acha sisters delivery partners, and packers & movers.'
      });
    }
    
    // Update order pricing with the confirmed price
    if (finalDeliveryFee && finalDeliveryFee > 0) {
      // Initialize pricing if not exists
      if (!order.pricing) {
        order.pricing = {};
      }
      
      const itemValue = order.pricing.itemValue || 0;
      const serviceFee = order.pricing.serviceFee || 25;
      const platformFee = order.pricing.platformFee || 15;
      const totalAmount = itemValue + finalDeliveryFee + serviceFee + platformFee;
      
      order.pricing.deliveryFee = finalDeliveryFee;
      order.pricing.serviceFee = serviceFee;
      order.pricing.platformFee = platformFee;
      order.pricing.totalAmount = totalAmount;
      order.pricing.currency = order.pricing.currency || 'ETB';
      
      console.log(`Set confirmed pricing for order ${order.uniqueId}: Delivery Fee = ${finalDeliveryFee} ETB (partner-provided: ${!!(deliveryFee || price)}), Total = ${totalAmount} ETB`);
    }

    // Update order acceptance status
    order.partnerAcceptanceStatus = 'accepted';
    const partnerName = partner.name || partner.companyName || 'Delivery Partner';
    await order.addTrackingUpdate('assigned', `Order accepted by delivery partner: ${partnerName}`, '');
    await order.save();

    // Send email to client with pricing information
    try {
      const buyer = order.buyerId;
      if (buyer && buyer.email) {
        const { sendOrderAcceptedEmail } = require('../utils/emailService');
        await sendOrderAcceptedEmail(buyer.email, buyer.name || 'Client', {
          orderId: order.uniqueId,
          uniqueId: order.uniqueId,
          productName: order.orderInfo?.productName,
          productDescription: order.orderInfo?.productDescription,
          deliveryDestination: order.orderInfo?.deliveryDestination,
          // Include pricing information
          pricing: order.pricing ? {
            itemValue: order.pricing.itemValue || 0,
            deliveryFee: order.pricing.deliveryFee || 0,
            serviceFee: order.pricing.serviceFee || 0,
            platformFee: order.pricing.platformFee || 0,
            totalAmount: order.pricing.totalAmount || 0,
            currency: order.pricing.currency || 'ETB'
          } : null
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

// Update order details (only within 8 hours of creation)
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if order can be edited (within 8 hours)
    const orderCreatedAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now - orderCreatedAt) / (1000 * 60 * 60);

    if (hoursSinceCreation > 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Order can only be edited within 8 hours of creation'
      });
    }

    // Prevent editing if order is already assigned, picked up, in transit, delivered, completed, or cancelled
    const nonEditableStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'];
    if (nonEditableStatuses.includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be edited in its current status'
      });
    }

    // Update order info
    if (updateData.orderInfo) {
      if (order.orderInfo) {
        Object.assign(order.orderInfo, updateData.orderInfo);
      } else {
        order.orderInfo = updateData.orderInfo;
      }
    }

    // Update locations if provided
    if (updateData.pickupLocation) {
      Object.assign(order.pickupLocation, updateData.pickupLocation);
    }
    if (updateData.deliveryLocation) {
      Object.assign(order.deliveryLocation, updateData.deliveryLocation);
    }

    // Add tracking update
    await order.addTrackingUpdate('pending', 'Order details updated by buyer', '');

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Cancel order (only within 8 hours of creation)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled (within 8 hours)
    const orderCreatedAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now - orderCreatedAt) / (1000 * 60 * 60);

    if (hoursSinceCreation > 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Order can only be cancelled within 8 hours of creation'
      });
    }

    // Prevent cancelling if order is already delivered, completed, or cancelled
    if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled in its current status'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.addTrackingUpdate('cancelled', reason || 'Order cancelled by buyer', '');

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete expired orders (only if no transactions exist)
exports.deleteExpiredOrders = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all orders where preferredDeliveryDate has passed
    const expiredOrders = await Order.find({
      'orderInfo.preferredDeliveryDate': { $lt: today }
    });

    let deletedCount = 0;
    let keptCount = 0;
    const deletedOrderIds = [];
    const keptOrderIds = [];

    for (const order of expiredOrders) {
      // Check if order has any transactions
      const transactionCount = await Transaction.countDocuments({ orderId: order._id });

      if (transactionCount === 0) {
        // No transactions found, safe to delete
        await Order.findByIdAndDelete(order._id);
        deletedCount++;
        deletedOrderIds.push(order._id.toString());
      } else {
        // Has transactions, keep the order
        keptCount++;
        keptOrderIds.push({
          orderId: order._id.toString(),
          transactionCount: transactionCount
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Expired orders cleanup completed. Deleted ${deletedCount} orders, kept ${keptCount} orders with transactions.`,
      data: {
        deletedCount,
        keptCount,
        deletedOrderIds,
        keptOrderIds
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
