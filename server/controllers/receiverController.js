const Receiver = require('../models/Receiver');

// Get all receivers
exports.getAllReceivers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    const receivers = await Receiver.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      count: receivers.length,
      data: receivers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single receiver by ID
exports.getReceiverById = async (req, res) => {
  try {
    const receiver = await Receiver.findById(req.params.id);
    
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: receiver
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new receiver
exports.createReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.create(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Receiver created successfully',
      data: receiver
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

// Update receiver
exports.updateReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Receiver updated successfully',
      data: receiver
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

// Delete receiver
exports.deleteReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.findByIdAndDelete(req.params.id);
    
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Receiver deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};










































