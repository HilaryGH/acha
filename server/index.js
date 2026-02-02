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
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('📝 Please check your MONGODB_URI in the .env file');
    process.exit(1);
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
