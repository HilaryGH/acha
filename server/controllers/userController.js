const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../middleware/auth');
const generateUserId = require('../utils/generateUserId');
const { sendRegistrationEmail } = require('../utils/emailService');

/**
 * Register a new user
 * - All roles are allowed for public registration
 * - All role creations are logged for audit (when authenticated)
 */
const register = async (req, res) => {
  try {
    console.log('Register endpoint called with body:', { ...req.body, password: '***' });
    const { name, email, password, phone, role, department, city, location, primaryLocation } = req.body;
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
    
    // Validate that at least one location parameter is provided
    if (!location && !city) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a location or city parameter'
      });
    }
    
    // Build query
    const query = {};
    
    // Location search - search in city, location, or primaryLocation
    const locationQuery = location || city;
    query.$or = [
      { city: { $regex: locationQuery, $options: 'i' } },
      { location: { $regex: locationQuery, $options: 'i' } },
      { primaryLocation: { $regex: locationQuery, $options: 'i' } }
    ];
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }
    
    // Filter by status - default to 'active' if not specified
    query.status = status || 'active';
    
    // Find users matching the location
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: users.length,
      message: `Found ${users.length} user(s) in ${locationQuery}`,
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
    
    res.json({
      status: 'success',
      data: {
        user
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

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  searchUsersByLocation
};

