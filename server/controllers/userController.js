const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../middleware/auth');
const generateUserId = require('../utils/generateUserId');
const { sendRegistrationEmail } = require('../utils/emailService');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

/**
 * Register a new user
 * - All roles are allowed for public registration
 * - All role creations are logged for audit (when authenticated)
 */
const register = async (req, res) => {
  try {
    console.log('Register endpoint called with body:', { ...req.body, password: '***' });
    const { name, email, password, phone, role, department, city, location, primaryLocation, distancePricing, deliveryMechanism } = req.body;
    const creatorRole = req.user?.role;
    const creatorId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    // Validate required fields for public registration
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required'
      });
    }
    
    // Default role for public registration is 'individual' if not specified
    const requestedRole = role || 'individual';
    
    // All roles are now allowed for public registration
    // Log registration for audit (only if we have a creatorId, otherwise skip audit log for public registration)
    if (creatorId) {
      try {
        await AuditLog.create({
          action: 'user_created',
          performedBy: creatorId,
          details: {
            role: requestedRole,
            email: email?.toLowerCase(),
            registrationType: 'admin_created'
          },
          ipAddress,
          userAgent,
          status: 'success'
        });
      } catch (auditError) {
        // Don't fail registration if audit log fails
        console.error('Audit log error:', auditError);
      }
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Generate unique user ID based on role
    let userId;
    try {
      userId = await generateUserId(requestedRole);
    } catch (userIdError) {
      console.error('Error generating user ID:', userIdError);
      // Don't fail registration if ID generation fails, but log it
      // We'll continue without userId
    }
    
    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: requestedRole,
      status: 'active'
    };
    
    // Add userId if generated successfully
    if (userId) {
      userData.userId = userId;
    }
    
    // Only include optional fields if they are provided
    if (phone && phone.trim()) {
      userData.phone = phone.trim();
    }
    if (department && department.trim()) {
      userData.department = department.trim();
    }
    // Include location fields for delivery roles
    if (city && city.trim()) {
      userData.city = city.trim();
    }
    if (location && location.trim()) {
      userData.location = location.trim();
    }
    if (primaryLocation && primaryLocation.trim()) {
      userData.primaryLocation = primaryLocation.trim();
    }
    
    // Include delivery mechanism for delivery partners
    if (deliveryMechanism && deliveryMechanism.trim()) {
      userData.deliveryMechanism = deliveryMechanism.trim();
    }
    
    // Include distance-based pricing for delivery partners
    if (distancePricing && Array.isArray(distancePricing) && distancePricing.length > 0) {
      userData.distancePricing = distancePricing.map(dp => ({
        minDistance: parseFloat(dp.minDistance) || 0,
        maxDistance: parseFloat(dp.maxDistance) || 0,
        price: parseFloat(dp.price) || 0
      }));
    }
    
    const user = new User(userData);
    
    await user.save();
    
    // Security Layer 4: Audit log for successful user creation (only if creatorId exists)
    if (creatorId) {
      try {
        await AuditLog.create({
          action: 'user_created',
          performedBy: creatorId,
          targetUser: user._id,
          details: {
            role: user.role,
            email: user.email,
            name: user.name,
            department: user.department
          },
          ipAddress,
          userAgent,
          status: 'success'
        });
      } catch (auditError) {
        // Don't fail registration if audit log fails
        console.error('Audit log error:', auditError);
      }
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send registration email (don't fail registration if email fails)
    // Only send email if userId was successfully generated
    if (user.userId) {
      try {
        await sendRegistrationEmail(user.email, user.name, user.userId, user.role);
      } catch (emailError) {
        console.error('Error sending registration email:', emailError);
        // Continue even if email fails
      }
    } else {
      console.warn('User ID not generated, skipping registration email for:', user.email);
    }
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          status: user.status,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    // Log error
    console.error('Registration error caught:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    const creatorId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    // Handle Mongoose validation errors
    let errorMessage = 'Failed to register user';
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      errorMessage = validationErrors.join(', ');
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      // Duplicate key error (email already exists)
      errorMessage = 'User with this email already exists';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    if (creatorId) {
      await AuditLog.create({
        action: 'user_created',
        performedBy: creatorId,
        details: {
          error: errorMessage
        },
        ipAddress,
        userAgent,
        status: 'failed',
        errorMessage: errorMessage
      }).catch((auditError) => {
        console.error('Audit log creation failed:', auditError);
      }); // Don't fail if audit log fails
    }
    
    res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is not active. Please contact administrator.'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          status: user.status,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Login failed'
    });
  }
};

/**
 * Get current user profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get user profile'
    });
  }
};

/**
 * Get all users (only admins can access)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, location, city } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    
    // Handle location-based search
    if (location || city) {
      const locationQuery = location || city;
      query.$or = [
        { city: { $regex: locationQuery, $options: 'i' } },
        { location: { $regex: locationQuery, $options: 'i' } },
        { primaryLocation: { $regex: locationQuery, $options: 'i' } }
      ];
    }
    
    // Handle general search (name, email)
    if (search && !location && !city) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    } else if (search && (location || city)) {
      // If both search and location are provided, combine them
      const existingOr = query.$or || [];
      existingOr.push(
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      );
      query.$or = existingOr;
    }
    
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get users'
    });
  }
};

/**
 * Search users by location (public endpoint for finding available users)
 */
const searchUsersByLocation = async (req, res) => {
  try {
    const { location, city, role, status } = req.query;
    
    // Build query
    const query = {};
    
    // Location search - search in city, location, or primaryLocation
    // If location/city is provided, filter by location; otherwise, if role is provided, get all users with that role
    if (location || city) {
      const locationQuery = location || city;
      query.$or = [
        { city: { $regex: locationQuery, $options: 'i' } },
        { location: { $regex: locationQuery, $options: 'i' } },
        { primaryLocation: { $regex: locationQuery, $options: 'i' } }
      ];
    }
    
    // Filter by role if provided (required if no location/city is provided)
    if (role) {
      query.role = role;
    } else if (!location && !city) {
      // If no location and no role, return error
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a location, city, or role parameter'
      });
    }
    
    // Filter by status - only add status filter if explicitly provided and not 'all'
    // If status is 'all' or not provided, don't filter by status (show all registered users)
    if (status && status !== 'all' && status !== '') {
      query.status = status;
    }
    // If status is not provided or is 'all'/'', don't add status filter (show all)
    
    // Find users matching the query
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    const locationQuery = location || city || 'all locations';
    res.json({
      status: 'success',
      count: users.length,
      message: role && !location && !city 
        ? `Found ${users.length} user(s) with role ${role}`
        : `Found ${users.length} user(s) in ${locationQuery}`,
      data: {
        users,
        searchLocation: locationQuery
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to search users by location'
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Convert user to object and add transportation mechanism from user's deliveryMechanism
    const userObject = user.toObject();
    if (user.deliveryMechanism) {
      userObject.transportationMechanism = user.deliveryMechanism;
    }
    
    res.json({
      status: 'success',
      data: {
        user: userObject
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get user'
    });
  }
};

/**
 * Update user (users can update themselves, admins can update anyone)
 */
const updateUser = async (req, res) => {
  try {
    const { name, phone, department, status, role } = req.body;
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check permissions
    // Users can only update themselves unless they are admin/super_admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      if (req.user.id.toString() !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own profile'
        });
      }
      // Regular users cannot change their role or status
      if (role || status) {
        return res.status(403).json({
          status: 'error',
          message: 'You cannot change your role or status'
        });
      }
    }
    
    // Only super_admin can change roles
    if (role && req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only super admin can change user roles'
      });
    }
    
    // Update user
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (status && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      user.status = status;
    }
    if (role && req.user.role === 'super_admin') {
      user.role = role;
    }
    
    user.updatedAt = Date.now();
    await user.save();
    
    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update user'
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password and new password'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      if (req.user.id.toString() !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only change your own password'
        });
      }
    }
    
    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to change password'
    });
  }
};

/**
 * Delete user (only super_admin)
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting yourself
    if (req.user.id.toString() === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete user'
    });
  }
};

// Track if Google OAuth is initialized
let isGoogleOAuthInitialized = false;

/**
 * Get frontend URL based on environment
 */
const getFrontendUrl = () => {
  // If explicitly set in environment, use that
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // Auto-detect: development or production
  // Development: NODE_ENV is not 'production' OR PORT is 5000
  // Production: NODE_ENV is 'production' AND PORT is not 5000
  const isDevelopment = process.env.NODE_ENV !== 'production' || 
                        !process.env.PORT || 
                        process.env.PORT === '5000';
  
  // Return appropriate URL based on environment
  if (isDevelopment) {
    return 'http://localhost:3000';
  } else {
    // Production: use Netlify URL
    return 'https://achade.netlify.app';
  }
};

/**
 * Initialize Google OAuth Strategy
 */
const initializeGoogleStrategy = () => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  // Determine callback URL based on environment
  // If explicitly set in env, use that; otherwise detect environment
  let GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
  
  if (!GOOGLE_CALLBACK_URL) {
    // Detect environment: check NODE_ENV and PORT
    // Development: NODE_ENV is not 'production' OR PORT is 5000 (default dev port)
    // Production: NODE_ENV is 'production' AND PORT is not 5000
    const isDevelopment = process.env.NODE_ENV !== 'production' || 
                          !process.env.PORT || 
                          process.env.PORT === '5000';
    
    if (isDevelopment) {
      // Development: use localhost
      GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/users/auth/google/callback';
      console.log('🔧 Development mode: Using localhost callback URL');
    } else {
      // Production: use production URL
      GOOGLE_CALLBACK_URL = 'https://acha-eeme.onrender.com/api/users/auth/google/callback';
      console.log('🚀 Production mode: Using production callback URL');
    }
  } else {
    console.log('📝 Using custom callback URL from environment:', GOOGLE_CALLBACK_URL);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not found. Google login will be disabled.');
    console.warn('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
    isGoogleOAuthInitialized = false;
    return;
  }

  try {
    // Remove existing strategy if it exists
    passport.unuse('google');
    
    passport.use('google', new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find user by googleId or email
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value.toLowerCase() }
        ]
      });

      if (user) {
        // RESTRICTION: Only allow Google login for users with 'individual' role
        if (user.role !== 'individual') {
          return done(new Error(`Google login is only available for individual users. Your account has the role: ${user.role}. Please use email/password login instead.`), null);
        }

        // Update googleId if not set
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Create new user with 'individual' role only
      let userId;
      try {
        userId = await generateUserId('individual');
      } catch (userIdError) {
        console.error('Error generating user ID:', userIdError);
      }

      user = new User({
        name: profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName || 'User',
        email: profile.emails[0].value.toLowerCase(),
        googleId: profile.id,
        role: 'individual', // Always create as individual role
        status: 'active',
        userId: userId
      });

      await user.save();
      
      // Send registration email (don't fail registration if email fails)
      // Only send email if userId was successfully generated
      if (user.userId) {
        try {
          await sendRegistrationEmail(user.email, user.name, user.userId, user.role);
        } catch (emailError) {
          console.error('Error sending registration email for Google OAuth user:', emailError);
          // Continue even if email fails
        }
      } else {
        console.warn('User ID not generated, skipping registration email for Google OAuth user:', user.email);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
    
    isGoogleOAuthInitialized = true;
    console.log('✅ Google OAuth strategy initialized successfully');
    console.log(`   Callback URL: ${GOOGLE_CALLBACK_URL}`);
    console.log(`   Frontend URL (default): ${getFrontendUrl()}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   PORT: ${process.env.PORT || 'not set'}`);
  } catch (error) {
    console.error('❌ Error initializing Google OAuth strategy:', error);
    isGoogleOAuthInitialized = false;
  }
};

// Initialize Google Strategy
initializeGoogleStrategy();

/**
 * Google OAuth authentication - redirects to Google
 */
const googleAuth = (req, res, next) => {
  // Check if Google OAuth is initialized
  if (!isGoogleOAuthInitialized) {
    const frontendUrl = getFrontendUrl();
    return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google OAuth is not configured. Please contact administrator.')}`);
  }

  // Use passport to authenticate with Google
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

/**
 * Google OAuth callback - handles the response from Google
 * RESTRICTED: Only allows login for users with 'individual' role
 */
const googleCallback = async (req, res) => {
  const frontendUrl = getFrontendUrl();
  
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(err.message)}`);
    }

    if (!user) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Authentication failed')}`);
    }

    // RESTRICTION: Double-check role (should already be checked in strategy, but extra safety)
    if (user.role !== 'individual') {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google login is only available for individual users. Please use email/password login instead.')}`);
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Your account is not active. Please contact administrator.')}`);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    return res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      status: user.status,
      lastLogin: user.lastLogin
    }))}`);
  })(req, res);
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  searchUsersByLocation,
  googleAuth,
  googleCallback
};

