# Survey System Setup for Women Initiatives

## Overview

A comprehensive survey/questionnaire system has been added to the Women Initiatives application. Three questionnaires have been created as inactive surveys:

1. **Training Need Questionnaire** - Assesses training needs and priorities
2. **Challenges to Access Training Questionnaire** - Identifies barriers and support needs
3. **Current Skills & Experience Questionnaire** - Assesses current skills and improvement areas

## What Was Created

### Backend Components

1. **Models:**
   - `server/models/Survey.js` - Survey/questionnaire model
   - `server/models/SurveyResponse.js` - Survey response model

2. **Controllers:**
   - `server/controllers/surveyController.js` - CRUD operations for surveys and responses

3. **Routes:**
   - `server/routes/surveyRoutes.js` - API routes for surveys
   - Registered at `/api/surveys` in `server/index.js`

4. **Initialization Script:**
   - `server/scripts/initializeSurveys.js` - Script to create the three questionnaires

### Frontend Components

1. **Components:**
   - `client/src/components/SurveyDisplay.tsx` - Component to display surveys

2. **Updated Files:**
   - `client/src/pages/WomenInitiatives.tsx` - Added tabbed interface with surveys section
   - `client/src/services/api.ts` - Added survey API endpoints

## How to Initialize Surveys

To create the three questionnaires in the database, run the initialization script:

```bash
cd server
node scripts/initializeSurveys.js
```

**Note:** The script will:
- Check if surveys already exist (won't create duplicates)
- Create all three questionnaires as **inactive** surveys
- Connect to MongoDB using the `MONGODB_URI` from your `.env` file

## Survey Structure

Each survey contains:
- **Title** and **Description**
- **Category** (training_need, challenges, skills_experience)
- **Status** (isActive: false - currently inactive)
- **Questions** with various types:
  - Rating scales (1-5)
  - Multiple choice
  - Single choice
  - Text input
  - Textarea
- **Settings** (multiple submissions, authentication requirements, etc.)

## API Endpoints

### Public Endpoints (No Authentication Required)

- `GET /api/surveys` - Get all surveys (with optional filters: `?isActive=true&category=training_need`)
- `GET /api/surveys/:id` - Get survey by ID
- `POST /api/surveys/:id/submit` - Submit survey response

### Admin Endpoints (Authentication Required)

- `POST /api/surveys` - Create new survey
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `GET /api/surveys/:id/responses` - Get all responses for a survey

## Frontend Usage

The Women Initiatives page now has two tabs:
1. **Application Form** - Original application form
2. **Training Questionnaires** - Displays all three questionnaires

Surveys are displayed with:
- Question types and options
- Required field indicators
- Status badges (Active/Inactive)
- Category labels

## Activating Surveys

To activate a survey (make it available for responses), update the survey's `isActive` field to `true`:

```javascript
// Via API
PUT /api/surveys/:id
{
  "isActive": true
}
```

Or directly in the database:
```javascript
db.surveys.updateOne(
  { _id: ObjectId("...") },
  { $set: { isActive: true } }
)
```

## Next Steps

1. Run the initialization script to create the surveys
2. Review the surveys in the Women Initiatives page
3. Activate surveys when ready to collect responses
4. Create a survey response form component (optional) to allow users to submit responses

## Notes

- All three questionnaires are created as **inactive** by default
- Surveys can be activated individually when training programs are ready
- The system supports multiple question types and flexible response structures
- Survey responses are stored separately and can be analyzed later
