const Traveller = require('../models/Traveller');
const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const { sendTripPostedEmail, sendMatchFoundEmail } = require('../utils/emailService');

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

// Get all travellers
exports.getAllTravellers = async (req, res, next) => {
  try {
    const { travellerType, status, destinationCity, currentLocation, search } = req.query;
    const filter = {};
    
    // Build base filters
    if (travellerType) filter.travellerType = travellerType;
    if (status) filter.status = status;
    
    // Handle location search parameters
    // Priority: specific params (destinationCity/currentLocation) > general search param
    
    if (destinationCity || currentLocation) {
      // If we have specific location parameters
      if (destinationCity && currentLocation) {
        // Both provided - use OR to match either field
        filter.$or = [
          { destinationCity: { $regex: destinationCity, $options: 'i' } },
          { currentLocation: { $regex: currentLocation, $options: 'i' } }
        ];
      } else if (destinationCity) {
        // Only destination provided
        filter.destinationCity = { $regex: destinationCity, $options: 'i' };
      } else if (currentLocation) {
        // Only current location provided
        filter.currentLocation = { $regex: currentLocation, $options: 'i' };
      }
    } else if (search) {
      // General search - search both fields with OR
      filter.$or = [
        { destinationCity: { $regex: search, $options: 'i' } },
        { currentLocation: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Traveller search filter:', JSON.stringify(filter, null, 2));
    
    const travellers = await Traveller.find(filter).sort({ createdAt: -1 });
    
    console.log(`Found ${travellers.length} travellers`);
    
    // Exclude sensitive information for privacy before order is placed
    const sanitizedTravellers = travellers.map(traveller => {
      const travellerObj = traveller.toObject();
      // Keep name for display in BrowseTrips, but remove other personal contact info
      // Remove email, phone, and other contact info, keep only necessary matching info
      delete travellerObj.email;
      delete travellerObj.phone;
      delete travellerObj.whatsapp;
      delete travellerObj.telegram;
      delete travellerObj.bankAccount; // Remove bank account for privacy
      return {
        _id: travellerObj._id,
        uniqueId: travellerObj.uniqueId,
        name: travellerObj.name, // Keep name for display
        currentLocation: travellerObj.currentLocation,
        destinationCity: travellerObj.destinationCity,
        departureDate: travellerObj.departureDate,
        departureTime: travellerObj.departureTime,
        arrivalDate: travellerObj.arrivalDate,
        arrivalTime: travellerObj.arrivalTime,
        travellerType: travellerObj.travellerType,
        status: travellerObj.status,
        maximumKilograms: travellerObj.maximumKilograms || null,
        priceOffer: travellerObj.priceOffer || null
        // Note: email, phone, and other contact info will be revealed only after order is matched
      };
    });
    
    res.status(200).json({
      status: 'success',
      count: sanitizedTravellers.length,
      data: sanitizedTravellers
    });
  } catch (error) {
    console.error('Error searching travellers:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single traveller by ID
exports.getTravellerById = async (req, res, next) => {
  try {
    const traveller = await Traveller.findById(req.params.id);
    
    if (!traveller) {
      return res.status(404).json({
        status: 'error',
        message: 'Traveller not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: traveller
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new traveller
exports.createTraveller = async (req, res, next) => {
  try {
    console.log('Creating traveller - received data:', JSON.stringify(req.body, null, 2));
    
    const traveller = await Traveller.create(req.body);
    
    // Send trip posted confirmation email
    try {
      await sendTripPostedEmail(traveller.email, traveller.name, {
        currentLocation: traveller.currentLocation,
        destinationCity: traveller.destinationCity,
        departureDate: traveller.departureDate,
        departureTime: traveller.departureTime,
        arrivalDate: traveller.arrivalDate,
        arrivalTime: traveller.arrivalTime
      });
      console.log('Trip posted email sent to:', traveller.email);
    } catch (emailError) {
      console.error('Error sending trip posted email:', emailError);
      // Don't fail the request if email fails
    }
    
    // Check for matching orders
    try {
      // Find orders with deliveryMethod='traveler' that match this traveler's route
      const matchingOrders = await Order.find({
        deliveryMethod: 'traveler',
        status: { $in: ['pending', 'offers_received'] }, // Only pending orders
        assignedTravelerId: null // Not already assigned
      }).populate('buyerId', 'name email phone whatsapp telegram currentCity').limit(10);
      
      // Filter orders that match the traveler's route
      const suitableMatches = matchingOrders.filter(order => {
        const buyer = order.buyerId;
        if (!buyer) return false;
        
        // Check if buyer's city matches traveler's current location (pickup point)
        const pickupMatch = locationsMatch(traveller.currentLocation, buyer.currentCity);
        
        // Check if order destination matches traveler's destination
        const orderDestination = order.orderInfo?.deliveryDestination || order.orderInfo?.countryOfOrigin || buyer.currentCity;
        const destinationMatch = locationsMatch(traveller.destinationCity, orderDestination) ||
                                 locationsMatch(traveller.destinationCity, buyer.currentCity);
        
        // Check if traveler's departure date is before or on the preferred delivery date
        const preferredDate = order.orderInfo?.preferredDeliveryDate ? new Date(order.orderInfo.preferredDeliveryDate) : null;
        const departureDate = new Date(traveller.departureDate);
        const isDateValid = !preferredDate || departureDate <= preferredDate;
        
        // Check if departure date is not too old (within last 7 days or future)
        const now = new Date();
        const isDateNotExpired = departureDate >= now || 
          (departureDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        
        return pickupMatch && destinationMatch && isDateValid && isDateNotExpired;
      });
      
      // Sort by preferred delivery date (earliest first) and take top 5
      suitableMatches.sort((a, b) => {
        const dateA = a.orderInfo?.preferredDeliveryDate ? new Date(a.orderInfo.preferredDeliveryDate) : new Date(0);
        const dateB = b.orderInfo?.preferredDeliveryDate ? new Date(b.orderInfo.preferredDeliveryDate) : new Date(0);
        return dateA - dateB;
      });
      
      const topMatches = suitableMatches.slice(0, 5);
      
      // If matches found, send match found email
      if (topMatches.length > 0) {
        try {
          const matchesData = topMatches.map(order => ({
            buyer: order.buyerId,
            order: order
          }));
          
          await sendMatchFoundEmail(traveller.email, traveller.name, matchesData);
          console.log(`Match found email sent to ${traveller.email} with ${topMatches.length} matches`);
        } catch (matchEmailError) {
          console.error('Error sending match found email:', matchEmailError);
          // Don't fail the request if email fails
        }
      }
    } catch (matchError) {
      console.error('Error checking for matches:', matchError);
      // Don't fail the request if match checking fails
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Traveller created successfully',
      data: traveller
    });
  } catch (error) {
    console.error('Error creating traveller:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Update traveller
exports.updateTraveller = async (req, res, next) => {
  try {
    const traveller = await Traveller.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!traveller) {
      return res.status(404).json({
        status: 'error',
        message: 'Traveller not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Traveller updated successfully',
      data: traveller
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

// Delete traveller
exports.deleteTraveller = async (req, res, next) => {
  try {
    const traveller = await Traveller.findByIdAndDelete(req.params.id);
    
    if (!traveller) {
      return res.status(404).json({
        status: 'error',
        message: 'Traveller not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Traveller deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
