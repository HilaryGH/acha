const WomenInitiative = require('../models/WomenInitiative');

// Get all women initiatives
exports.getAllWomenInitiatives = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    const womenInitiatives = await WomenInitiative.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      count: womenInitiatives.length,
      data: womenInitiatives
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single women initiative by ID
exports.getWomenInitiativeById = async (req, res) => {
  try {
    const womenInitiative = await WomenInitiative.findById(req.params.id);
    
    if (!womenInitiative) {
      return res.status(404).json({
        status: 'error',
        message: 'Women initiative not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: womenInitiative
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new women initiative
exports.createWomenInitiative = async (req, res) => {
  try {
    const womenInitiative = await WomenInitiative.create(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully',
      data: womenInitiative
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

// Update women initiative
exports.updateWomenInitiative = async (req, res) => {
  try {
    const womenInitiative = await WomenInitiative.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!womenInitiative) {
      return res.status(404).json({
        status: 'error',
        message: 'Women initiative not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Women initiative updated successfully',
      data: womenInitiative
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

// Delete women initiative
exports.deleteWomenInitiative = async (req, res) => {
  try {
    const womenInitiative = await WomenInitiative.findByIdAndDelete(req.params.id);
    
    if (!womenInitiative) {
      return res.status(404).json({
        status: 'error',
        message: 'Women initiative not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Women initiative deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};






























