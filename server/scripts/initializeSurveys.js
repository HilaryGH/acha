require('dotenv').config();
const mongoose = require('mongoose');
const Survey = require('../models/Survey');

// This script initializes the three questionnaires for Women Initiatives
// Run with: node server/scripts/initializeSurveys.js

const initializeSurveys = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if surveys already exist
    const existingSurveys = await Survey.find({ category: { $in: ['training_need', 'challenges', 'skills_experience'] } });
    if (existingSurveys.length > 0) {
      console.log('Surveys already exist. Skipping initialization.');
      await mongoose.connection.close();
      return;
    }

    // 1. Training Need Questionnaire
    const trainingNeedSurvey = {
      title: 'Training Need Questionnaire',
      description: 'Assess training needs and priorities for women delivery partners',
      category: 'training_need',
      isActive: false, // Inactive as requested
      questions: [
        {
          questionId: 'q1_intro',
          questionType: 'text',
          questionText: '1. How confident are you currently in these skills? (1 = Not confident at all → 5 = Very confident)',
          required: false
        },
        {
          questionId: 'q1_1',
          questionType: 'rating',
          questionText: 'Riding a bicycle/cycle safely in Addis Ababa traffic',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_2',
          questionType: 'rating',
          questionText: 'Operating an e-bike (including charging and battery management)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_3',
          questionType: 'rating',
          questionText: 'Riding a motorcycle (including gear shifting and balance with loads)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_4',
          questionType: 'rating',
          questionText: 'Using smartphone apps/GPS for navigation and route planning in congested areas',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_5',
          questionType: 'rating',
          questionText: 'Using the Acha Delivery partner app (accepting orders, updating status, handling payments)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_6',
          questionType: 'rating',
          questionText: 'Defensive/safe riding practices (avoiding accidents, obeying traffic rules)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_7',
          questionType: 'rating',
          questionText: 'Customer service (polite communication, handling complaints)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_8',
          questionType: 'rating',
          questionText: 'Basic vehicle maintenance (tire checks, chain cleaning, e-bike charging, simple fixes)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_9',
          questionType: 'rating',
          questionText: 'Managing time and routes to avoid delays in traffic',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_10',
          questionType: 'rating',
          questionText: 'Carrying packages safely (balancing loads, protecting items)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_11',
          questionType: 'rating',
          questionText: 'Personal safety strategies (e.g., avoiding risky areas, dealing with harassment)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q2',
          questionType: 'multiple_choice',
          questionText: '2. Which training topics would you prioritize? (Select top 3–5)',
          options: [
            { value: 'road_safety', label: 'Road safety and defensive riding in urban Addis Ababa' },
            { value: 'vehicle_training', label: 'Vehicle-specific hands-on training (cycle / e-bike / motorcycle)' },
            { value: 'tech_skills', label: 'Smartphone and Acha app usage (tech/digital skills)' },
            { value: 'customer_service', label: 'Customer interaction and professional behavior' },
            { value: 'gender_safety', label: 'Gender-specific safety and self-defense' },
            { value: 'eco_friendly', label: 'Eco-friendly practices (energy-efficient riding, reducing emissions)' },
            { value: 'first_aid', label: 'First aid/emergency response for accidents' },
            { value: 'financial_management', label: 'Financial management (earnings tracking, savings, taxes)' },
            { value: 'fitness', label: 'Physical fitness and stamina building for delivery work' },
            { value: 'other', label: 'Other (specify)' }
          ],
          required: true
        },
        {
          questionId: 'q2_other',
          questionType: 'text',
          questionText: 'Other (specify)',
          placeholder: 'Specify other training topic',
          required: false
        },
        {
          questionId: 'q3',
          questionType: 'multiple_choice',
          questionText: '3. What format of training would suit you best? (Select all that apply)',
          options: [
            { value: 'practical_on_road', label: 'Practical on-road sessions with female trainers' },
            { value: 'women_only_workshops', label: 'Women-only group workshops' },
            { value: 'short_sessions', label: 'Short daily/weekly sessions (to fit family schedules)' },
            { value: 'online_videos', label: 'Online videos or app-based modules' },
            { value: 'one_on_one', label: 'One-on-one mentoring from experienced women riders' },
            { value: 'refresher', label: 'Refresher/follow-up sessions after starting work' }
          ],
          required: true
        },
        {
          questionId: 'q4',
          questionType: 'single_choice',
          questionText: 'How many hours per week can you commit to training?',
          options: [
            { value: 'less_than_5', label: '<5 hours' },
            { value: '5_to_10', label: '5–10 hours' },
            { value: '10_plus', label: '10+ hours' },
            { value: 'depends', label: 'Depends on childcare/family support' }
          ],
          required: true
        },
        {
          questionId: 'q5',
          questionType: 'textarea',
          questionText: 'Open-ended: What additional training would make you feel more empowered and ready as a delivery partner?',
          placeholder: 'Share your thoughts...',
          required: false
        }
      ],
      settings: {
        allowMultipleSubmissions: false,
        requireAuthentication: false,
        showProgress: true
      }
    };

    // 2. Challenges to Access Training Questionnaire
    const challengesSurvey = {
      title: 'Challenges to Access Training Questionnaire',
      description: 'Identify barriers and support needs for women accessing training',
      category: 'challenges',
      isActive: false, // Inactive as requested
      questions: [
        {
          questionId: 'q1_intro',
          questionType: 'text',
          questionText: '1. How much do these factors challenge your ability to attend training? (1 = Not at all → 5 = Very much)',
          required: false
        },
        {
          questionId: 'q1_1',
          questionType: 'rating',
          questionText: 'Childcare or family/household responsibilities',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_2',
          questionType: 'rating',
          questionText: 'Lack of safe/affordable transport to training sites',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_3',
          questionType: 'rating',
          questionText: 'Time conflicts with other jobs, chores, or family needs',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_4',
          questionType: 'rating',
          questionText: 'Safety concerns traveling alone (especially evenings or distant locations)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_5',
          questionType: 'rating',
          questionText: 'Cost of transport, meals, or materials for training',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_6',
          questionType: 'rating',
          questionText: 'Need for family/husband approval for women doing this work',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_7',
          questionType: 'rating',
          questionText: 'Limited prior experience or confidence in riding/using tech',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_8',
          questionType: 'rating',
          questionText: 'Language, literacy, or digital access issues (e.g., no reliable smartphone/data)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q1_9',
          questionType: 'rating',
          questionText: 'Cultural or community views on women in delivery/riding jobs',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q2',
          questionType: 'multiple_choice',
          questionText: '2. Which supports would help you most? (Select top 3–5)',
          options: [
            { value: 'childcare', label: 'Free childcare during sessions' },
            { value: 'transport', label: 'Transport allowance, shuttle, or pick-up/drop-off' },
            { value: 'flexible_timing', label: 'Flexible timings (e.g., mornings, weekends, short 2–3 hour blocks)' },
            { value: 'nearby_locations', label: 'Training locations near home or in safe community centers' },
            { value: 'women_only', label: 'Women-only groups with female trainers/mentors' },
            { value: 'stipend', label: 'Small stipend or meal allowance for attendance' },
            { value: 'home_based', label: 'Home-based or mobile/online training options' },
            { value: 'family_sensitization', label: 'Family sensitization sessions (explaining benefits)' },
            { value: 'peer_support', label: 'Peer support from other women riders' },
            { value: 'other', label: 'Other (specify)' }
          ],
          required: true
        },
        {
          questionId: 'q2_other',
          questionType: 'text',
          questionText: 'Other (specify)',
          placeholder: 'Specify other support',
          required: false
        },
        {
          questionId: 'q3',
          questionType: 'textarea',
          questionText: 'Have you faced similar barriers in past jobs, training, or opportunities? If yes, what worked or would have helped?',
          placeholder: 'Share your experience...',
          required: false
        },
        {
          questionId: 'q4',
          questionType: 'textarea',
          questionText: 'Open-ended: What would make Acha Sisters training feel safe, accessible, and motivating for you?',
          placeholder: 'Share your thoughts...',
          required: false
        }
      ],
      settings: {
        allowMultipleSubmissions: false,
        requireAuthentication: false,
        showProgress: true
      }
    };

    // 3. Current Skills & Experience Questionnaire
    const skillsExperienceSurvey = {
      title: 'Current Skills & Experience Questionnaire',
      description: 'Assess current skills, experience, and improvement areas',
      category: 'skills_experience',
      isActive: false, // Inactive as requested
      questions: [
        {
          questionId: 'section1',
          questionType: 'text',
          questionText: '1. Basic profile:',
          required: false
        },
        {
          questionId: 'q1',
          questionType: 'single_choice',
          questionText: 'Age group',
          options: [
            { value: '18_24', label: '18–24' },
            { value: '25_34', label: '25–34' },
            { value: '35_plus', label: '35+' }
          ],
          required: true
        },
        {
          questionId: 'q2',
          questionType: 'single_choice',
          questionText: 'Highest education',
          options: [
            { value: 'none', label: 'None' },
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
            { value: 'tvet_college', label: 'TVET/College' }
          ],
          required: true
        },
        {
          questionId: 'q3',
          questionType: 'single_choice',
          questionText: 'Current status',
          options: [
            { value: 'unemployed', label: 'Unemployed' },
            { value: 'housework', label: 'Housework only' },
            { value: 'informal_work', label: 'Other informal work' },
            { value: 'gig_work', label: 'Gig work' }
          ],
          required: true
        },
        {
          questionId: 'section2',
          questionType: 'text',
          questionText: '2. Riding & vehicle access:',
          required: false
        },
        {
          questionId: 'q4',
          questionType: 'multiple_choice',
          questionText: 'Do you currently ride: Bicycle (daily/occasionally) / E-bike / Motorcycle?',
          options: [
            { value: 'bicycle_daily', label: 'Bicycle (daily)' },
            { value: 'bicycle_occasionally', label: 'Bicycle (occasionally)' },
            { value: 'e_bike', label: 'E-bike' },
            { value: 'motorcycle', label: 'Motorcycle' },
            { value: 'none', label: 'None' }
          ],
          required: true
        },
        {
          questionId: 'q5',
          questionType: 'single_choice',
          questionText: 'Years of riding experience (any vehicle)',
          options: [
            { value: 'none', label: 'None' },
            { value: 'less_than_1', label: '<1 year' },
            { value: '1_to_3', label: '1–3 years' },
            { value: 'more_than_3', label: '>3 years' }
          ],
          required: true
        },
        {
          questionId: 'q6',
          questionType: 'single_choice',
          questionText: 'Experience riding in Addis Ababa traffic/congestion?',
          options: [
            { value: 'none', label: 'None' },
            { value: 'limited', label: 'Limited' },
            { value: 'regular', label: 'Regular' }
          ],
          required: true
        },
        {
          questionId: 'q7',
          questionType: 'single_choice',
          questionText: 'Valid license? (Motorcycle)',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_needed', label: 'Not needed yet' }
          ],
          required: true
        },
        {
          questionId: 'q8',
          questionType: 'multiple_choice',
          questionText: 'Own or access to vehicle?',
          options: [
            { value: 'bicycle', label: 'Bicycle' },
            { value: 'e_bike', label: 'E-bike' },
            { value: 'motorcycle', label: 'Motorcycle' },
            { value: 'none', label: 'None' }
          ],
          required: true
        },
        {
          questionId: 'section3',
          questionType: 'text',
          questionText: 'Work & tech experience:',
          required: false
        },
        {
          questionId: 'q9',
          questionType: 'single_choice',
          questionText: 'Any prior delivery, courier, or transport work? (Yes/No)',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ],
          required: true
        },
        {
          questionId: 'q9_details',
          questionType: 'textarea',
          questionText: 'If yes: Type, vehicle, duration',
          placeholder: 'Type, vehicle, duration...',
          required: false
        },
        {
          questionId: 'q10',
          questionType: 'single_choice',
          questionText: 'Used delivery/ride apps or smartphones for work? (Yes/No)',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ],
          required: true
        },
        {
          questionId: 'q10_examples',
          questionType: 'text',
          questionText: 'Examples:',
          placeholder: 'Examples...',
          required: false
        },
        {
          questionId: 'q11',
          questionType: 'single_choice',
          questionText: 'Customer-facing experience (e.g., selling, hospitality)? (Yes/No)',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ],
          required: true
        },
        {
          questionId: 'q11_details',
          questionType: 'textarea',
          questionText: 'Briefly:',
          placeholder: 'Brief description...',
          required: false
        },
        {
          questionId: 'section4',
          questionType: 'text',
          questionText: '3. Rate your current level (1 = No experience → 5 = Strong/expert)',
          required: false
        },
        {
          questionId: 'q12_1',
          questionType: 'rating',
          questionText: 'Knowing Addis Ababa areas and shortcuts',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q12_2',
          questionType: 'rating',
          questionText: 'Basic vehicle care (e.g., checking tires, charging e-bike)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q12_3',
          questionType: 'rating',
          questionText: 'Balancing/carrying loads/packages',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q12_4',
          questionType: 'rating',
          questionText: 'Time management in busy/traffic conditions',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q12_5',
          questionType: 'rating',
          questionText: 'Communication (Amharic / English / other languages)',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'q12_6',
          questionType: 'rating',
          questionText: 'Using mobile money/apps for payments',
          minValue: 1,
          maxValue: 5,
          required: true
        },
        {
          questionId: 'section5',
          questionType: 'text',
          questionText: 'Open-ended:',
          required: false
        },
        {
          questionId: 'q13',
          questionType: 'textarea',
          questionText: 'What are your strongest current skills/assets for this work?',
          placeholder: 'Share your strengths...',
          required: false
        },
        {
          questionId: 'q14',
          questionType: 'textarea',
          questionText: 'Which skills do you most want to improve first?',
          placeholder: 'Share areas for improvement...',
          required: false
        },
        {
          questionId: 'q15',
          questionType: 'textarea',
          questionText: 'Any personal goals (e.g., income target, independence, family support) this job could help achieve?',
          placeholder: 'Share your goals...',
          required: false
        }
      ],
      settings: {
        allowMultipleSubmissions: false,
        requireAuthentication: false,
        showProgress: true
      }
    };

    // Create surveys
    const surveys = await Survey.insertMany([
      trainingNeedSurvey,
      challengesSurvey,
      skillsExperienceSurvey
    ]);

    console.log(`✅ Successfully created ${surveys.length} surveys:`);
    surveys.forEach(survey => {
      console.log(`   - ${survey.title} (${survey.category}) - Status: ${survey.isActive ? 'Active' : 'Inactive'}`);
    });

    await mongoose.connection.close();
    console.log('✅ Survey initialization complete');
  } catch (error) {
    console.error('❌ Error initializing surveys:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeSurveys();
}

module.exports = initializeSurveys;
