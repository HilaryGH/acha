const Settings = require('../models/Settings');

/**
 * Get a setting by key
 */
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    let setting = await Settings.findOne({ key });
    
    // If setting doesn't exist and it's the conversion rate, create it with default value
    if (!setting && key === 'usd_to_birr_rate') {
      setting = new Settings({
        key: 'usd_to_birr_rate',
        value: 185,
        description: 'USD to Birr conversion rate (1 USD = X Birr)'
      });
      await setting.save();
    }
    
    if (!setting) {
      return res.status(404).json({
        status: 'error',
        message: 'Setting not found'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        setting: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get setting'
    });
  }
};

/**
 * Get all settings
 */
const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.find().sort({ key: 1 });
    
    res.json({
      status: 'success',
      count: settings.length,
      data: {
        settings: settings.map(s => ({
          key: s.key,
          value: s.value,
          description: s.description,
          updatedAt: s.updatedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get settings'
    });
  }
};

/**
 * Update a setting by key
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const userId = req.user?.id; // Assuming user is attached by auth middleware
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Value is required'
      });
    }
    
    let setting = await Settings.findOne({ key });
    
    if (!setting) {
      // Create new setting if it doesn't exist
      setting = new Settings({
        key,
        value,
        description: description || '',
        updatedBy: userId
      });
    } else {
      // Update existing setting
      setting.value = value;
      if (description !== undefined) {
        setting.description = description;
      }
      setting.updatedBy = userId;
      setting.updatedAt = new Date();
    }
    
    await setting.save();
    
    res.json({
      status: 'success',
      message: 'Setting updated successfully',
      data: {
        setting: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update setting'
    });
  }
};

module.exports = {
  getSetting,
  getAllSettings,
  updateSetting
};
