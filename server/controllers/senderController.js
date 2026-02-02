const Sender = require('../models/Sender');

// Get all senders
exports.getAllSenders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    const senders = await Sender.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      count: senders.length,
      data: senders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single sender by ID
exports.getSenderById = async (req, res) => {
  try {
    const sender = await Sender.findById(req.params.id);
    
    if (!sender) {
      return res.status(404).json({
        status: 'error',
        message: 'Sender not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: sender
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new sender
exports.createSender = async (req, res) => {
  try {
    const sender = await Sender.create(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Sender created successfully',
      data: sender
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

// Update sender
exports.updateSender = async (req, res) => {
  try {
    const sender = await Sender.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!sender) {
      return res.status(404).json({
        status: 'error',
        message: 'Sender not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Sender updated successfully',
      data: sender
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

// Delete sender
exports.deleteSender = async (req, res) => {
  try {
    const sender = await Sender.findByIdAndDelete(req.params.id);
    
    if (!sender) {
      return res.status(404).json({
        status: 'error',
        message: 'Sender not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Sender deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};










































