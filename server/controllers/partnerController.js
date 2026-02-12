const Partner = require('../models/Partner');
const User = require('../models/User');
const { findNearbyPartners } = require('../utils/locationUtils');

// Get all partners
exports.getAllPartners = async (req, res) => {
  try {
    const { status, type, partner, registrationType, city, primaryLocation, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (partner) filter.partner = partner;
    if (registrationType) filter.registrationType = registrationType;
    
    // Handle location search parameters
    if (city || primaryLocation || search) {
      const locationFilter = [];
      if (city) {
        locationFilter.push(
          { city: { $regex: city, $options: 'i' } },
          { primaryLocation: { $regex: city, $options: 'i' } },
          { 'location.address': { $regex: city, $options: 'i' } }
        );
      }
      if (primaryLocation) {
        locationFilter.push(
          { city: { $regex: primaryLocation, $options: 'i' } },
          { primaryLocation: { $regex: primaryLocation, $options: 'i' } },
          { 'location.address': { $regex: primaryLocation, $options: 'i' } }
        );
      }
      if (search) {
        // General search - search city, primaryLocation, and location.address fields
        // Handle null/undefined/empty fields - MongoDB regex will only match non-null fields
        // Use $or to match any of these fields that contain the search term
        const searchRegex = { $regex: search.trim(), $options: 'i' };
        locationFilter.push(
          { city: searchRegex },
          { primaryLocation: searchRegex },
          { 'location.address': searchRegex },
          // Also search in companyName as it might contain location info
          { companyName: searchRegex }
        );
      }
      if (locationFilter.length > 0) {
        filter.$or = locationFilter;
      }
    }
    
    const partners = await Partner.find(filter).sort({ createdAt: -1 });
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

// Get single partner by ID
exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: partner
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new partner
exports.createPartner = async (req, res) => {
  try {
    const partner = await Partner.create(req.body);
    
    // Also create/update User record for location-based searching
    // This ensures delivery partners are searchable via the user search endpoint
    if (partner.email) {
      try {
        const userData = {
          name: partner.name || partner.companyName || 'Partner',
          email: partner.email.toLowerCase(),
          role: partner.registrationType === 'Gift Delivery Partner' 
            ? 'gift_delivery_partner' 
            : 'delivery_partner',
          status: 'active'
        };
        
        // Include location data if available
        if (partner.city) {
          userData.city = partner.city;
        }
        if (partner.primaryLocation) {
          userData.primaryLocation = partner.primaryLocation;
          userData.location = partner.primaryLocation;
        }
        if (partner.phone) {
          userData.phone = partner.phone;
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: partner.email.toLowerCase() });
        
        if (existingUser) {
          // Update existing user with location data
          if (partner.city) existingUser.city = partner.city;
          if (partner.primaryLocation) {
            existingUser.primaryLocation = partner.primaryLocation;
            existingUser.location = partner.primaryLocation;
          }
          await existingUser.save();
        } else {
          // Create new user (without password - they can set it later if needed)
          // Use a temporary password that should be changed on first login
          const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          userData.password = tempPassword;
          await User.create(userData);
        }
      } catch (userError) {
        // Don't fail partner creation if user creation fails
        console.error('Error creating/updating user for partner:', userError);
      }
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Partner application submitted successfully',
      data: partner
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

// Update partner
exports.updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Partner updated successfully',
      data: partner
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

// Delete partner
exports.deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Search nearby delivery partners by location (ride-sharing style)
exports.searchNearbyPartners = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, city } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius) || 10;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid latitude or longitude'
      });
    }

    // Build filter for approved delivery partners
    const filter = {
      status: 'approved',
      registrationType: 'Invest/Partner',
      partner: 'Delivery Partner',
      'availability.isOnline': true,
      'availability.isAvailable': true
    };

    // If city is provided, add it to filter
    if (city) {
      filter.$or = [
        { city: { $regex: new RegExp(city, 'i') } },
        { primaryLocation: { $regex: new RegExp(city, 'i') } }
      ];
    }

    // Find all available partners
    const partners = await Partner.find(filter);

    // Filter by GPS location and calculate distances
    const nearbyPartners = findNearbyPartners(partners, lat, lon, radiusKm);

    res.status(200).json({
      status: 'success',
      count: nearbyPartners.length,
      data: nearbyPartners,
      searchLocation: {
        latitude: lat,
        longitude: lon,
        radius: radiusKm
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update partner availability status (online/offline)
exports.updateAvailability = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { isOnline, isAvailable, latitude, longitude } = req.body;

    const partner = await Partner.findById(partnerId);
    
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Update availability status
    if (typeof isOnline === 'boolean') {
      partner.availability.isOnline = isOnline;
    }
    if (typeof isAvailable === 'boolean') {
      partner.availability.isAvailable = isAvailable;
    }

    // Update current location if provided
    if (latitude !== undefined && longitude !== undefined) {
      partner.availability.currentLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
      partner.availability.lastSeen = new Date();
    } else {
      partner.availability.lastSeen = new Date();
    }

    await partner.save();

    res.status(200).json({
      status: 'success',
      message: 'Availability updated successfully',
      data: partner
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update partner location
exports.updateLocation = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const partner = await Partner.findById(partnerId);
    
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Update base location
    partner.location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || partner.location?.address || ''
    };

    // Also update current location if partner is online
    if (partner.availability.isOnline) {
      partner.availability.currentLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
      partner.availability.lastSeen = new Date();
    }

    await partner.save();

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
      data: partner
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};






























