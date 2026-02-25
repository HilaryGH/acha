const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');

// Get all surveys
exports.getAllSurveys = async (req, res) => {
  try {
    const { isActive, category } = req.query;
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (category) {
      filter.category = category;
    }
    
    const surveys = await Survey.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      count: surveys.length,
      data: surveys
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single survey by ID
exports.getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new survey
exports.createSurvey = async (req, res) => {
  try {
    const survey = await Survey.create(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Survey created successfully',
      data: survey
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

// Update survey
exports.updateSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Survey updated successfully',
      data: survey
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

// Delete survey
exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    // Also delete all responses for this survey
    await SurveyResponse.deleteMany({ surveyId: req.params.id });
    
    res.status(200).json({
      status: 'success',
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Submit survey response
exports.submitSurveyResponse = async (req, res) => {
  try {
    const { surveyId, responses, respondentEmail, respondentName } = req.body;
    
    // Verify survey exists and is active
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        status: 'error',
        message: 'Survey not found'
      });
    }
    
    if (!survey.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Survey is not currently active'
      });
    }
    
    // Check if multiple submissions are allowed
    if (!survey.settings.allowMultipleSubmissions) {
      // Check if user already submitted
      const existingResponse = await SurveyResponse.findOne({
        surveyId,
        $or: [
          { respondentEmail: respondentEmail },
          { respondentId: req.user?.id }
        ]
      });
      
      if (existingResponse) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already submitted this survey'
        });
      }
    }
    
    // Get respondent ID if user is authenticated
    const respondentId = req.user?.id || null;
    
    const surveyResponse = await SurveyResponse.create({
      surveyId,
      respondentId,
      respondentEmail: respondentEmail || req.user?.email,
      respondentName: respondentName || req.user?.name,
      responses
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Survey response submitted successfully',
      data: surveyResponse
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

// Get survey responses
exports.getSurveyResponses = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    const responses = await SurveyResponse.find({ surveyId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      count: responses.length,
      data: responses
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
