const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const userRoutes = require('./routes/userRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
const senderRoutes = require('./routes/senderRoutes');
const travellerRoutes = require('./routes/travellerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const auditRoutes = require('./routes/auditRoutes');
const womenInitiativeRoutes = require('./routes/womenInitiativeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const documentRoutes = require('./routes/documentRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// MongoDB connection - Only from .env file
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MongoDB connection error: MONGODB_URI is not defined in environment variables.');
  console.error('📝 Please create a .env file in the server directory with your MongoDB connection string:');
  console.error('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name');
  console.error('   (Get your connection string from MongoDB Atlas: https://www.mongodb.com/cloud/atlas)');
  process.exit(1);
}

// Validate that it's not a localhost connection
if (MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('::1')) {
  console.error('❌ MongoDB connection error: Local MongoDB connections are not supported.');
  console.error('📝 Please use a MongoDB Atlas connection string in your .env file:');
  console.error('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name');
  console.error('   (Get your connection string from MongoDB Atlas: https://www.mongodb.com/cloud/atlas)');
  process.exit(1);
}

// MongoDB connection options
// Note: SSL/TLS is automatically enabled for mongodb+srv:// connections
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  connectTimeoutMS: 30000, // Connection timeout increased to 30s
  retryWrites: true,
  w: 'majority',
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 5,
};

// Improved MongoDB connection with better error handling
mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
  })
  .catch((error) => {
    console.error('\n❌ MongoDB Connection Error:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('🔍 DNS Resolution Failed');
      console.error('   The MongoDB hostname could not be resolved.');
      console.error('\n📋 Possible causes:');
      console.error('   1. MongoDB Atlas cluster is paused or deleted');
      console.error('   2. Incorrect connection string in .env file');
      console.error('   3. Network connectivity issues');
      console.error('   4. DNS resolution problems');
      console.error('\n💡 Solutions:');
      console.error('   1. Check MongoDB Atlas dashboard: https://cloud.mongodb.com');
      console.error('   2. Verify your cluster is running (not paused)');
      console.error('   3. Check your MONGODB_URI format in server/.env:');
      console.error('      MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
      console.error('   4. Ensure your IP is whitelisted in MongoDB Atlas Network Access');
      console.error('   5. Try using the standard connection string instead of SRV');
    } else if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication Failed');
      console.error('   Check your username and password in the connection string');
    } else if (error.message.includes('timeout') || error.message.includes('secureConnect')) {
      console.error('⏱️  Connection Timeout (secureConnect)');
      console.error('   The SSL/TLS handshake timed out');
      console.error('\n📋 Possible causes:');
      console.error('   1. MongoDB Atlas cluster is paused or unreachable');
      console.error('   2. Network firewall blocking SSL connections');
      console.error('   3. Slow network connection');
      console.error('   4. MongoDB Atlas IP whitelist restrictions');
      console.error('\n💡 Solutions:');
      console.error('   1. Check MongoDB Atlas dashboard: https://cloud.mongodb.com');
      console.error('   2. Verify your cluster is running (not paused)');
      console.error('   3. Add your IP address to MongoDB Atlas Network Access whitelist');
      console.error('   4. Try allowing all IPs temporarily: 0.0.0.0/0 (for testing only)');
      console.error('   5. Check your internet connection');
      console.error('   6. Verify your MONGODB_URI is correct in server/.env');
    } else {
      console.error('   Error:', error.message);
    }
    
    console.error('\n📝 Current MONGODB_URI format (hidden):');
    const uriParts = MONGODB_URI.split('@');
    if (uriParts.length > 1) {
      console.error(`   mongodb+srv://***@${uriParts[1]}`);
    } else {
      console.error('   (Unable to parse connection string)');
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Don't exit immediately - allow server to start but log the error
    console.error('⚠️  Server will continue but database operations will fail.');
    console.error('   Fix the MongoDB connection and restart the server.\n');
  });

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/travellers', travellerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/women-initiatives', womenInitiativeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/documents', documentRoutes);

// Log route registration
console.log('✅ Routes registered: /api/orders');

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Acha API Server',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
