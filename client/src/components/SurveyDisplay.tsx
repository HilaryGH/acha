import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Question {
  questionId: string;
  questionType: 'rating' | 'multiple_choice' | 'single_choice' | 'text' | 'textarea' | 'select';
  questionText: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
}

interface Survey {
  _id: string;
  title: string;
  description?: string;
  category: string;
  isActive: boolean;
  questions: Question[];
}

interface SurveyDisplayProps {
  surveyId?: string;
  category?: 'training_need' | 'challenges' | 'skills_experience';
  showInactive?: boolean;
}

function SurveyDisplay({ surveyId, category, showInactive = false }: SurveyDisplayProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSurveys();
  }, [surveyId, category, showInactive]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      setError(null);

      if (surveyId) {
        const response = await api.surveys.getById(surveyId) as { status?: string; data?: Survey };
        if (response.status === 'success' && response.data) {
          setSurveys([response.data]);
        } else {
          setError('Survey not found');
        }
      } else {
        const params: any = {};
        if (category) params.category = category;
        // Only filter by isActive if showInactive is false
        // If showInactive is true, don't add the filter so we get all surveys
        if (!showInactive) {
          params.isActive = 'true';
        }

        console.log('Loading surveys with params:', params);
        const response = await api.surveys.getAll(params) as { status?: string; data?: Survey[]; count?: number; message?: string };
        console.log('Survey response:', response);
        
        if (response.status === 'success') {
          const surveysData = response.data || [];
          console.log(`Loaded ${surveysData.length} surveys`);
          setSurveys(surveysData);
        } else {
          setError(response.message || 'Failed to load surveys');
        }
      }
    } catch (err: any) {
      console.error('Error loading surveys:', err);
      setError(err.message || 'An error occurred while loading surveys');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading surveys...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (surveys.length === 0 && !loading && !error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Surveys Found</h3>
        <p className="text-gray-600 mb-4">
          {category 
            ? `No ${category.replace('_', ' ')} surveys are available at this time.`
            : 'No surveys are available at this time.'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> If you're an administrator, you may need to initialize the surveys by running:
          </p>
          <code className="block mt-2 p-2 bg-blue-100 rounded text-xs text-blue-900">
            node server/scripts/initializeSurveys.js
          </code>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Surveys</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadSurveys}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {surveys.map((survey) => (
        <div key={survey._id} className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h3>
                {survey.description && (
                  <p className="text-gray-600 mb-2">{survey.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  survey.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {survey.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {survey.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
            
            {/* View-only notice */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">View Only</p>
                  <p className="text-sm text-blue-700">
                    This questionnaire is currently view-only. Responses cannot be submitted at this time. 
                    {!survey.isActive && ' The survey will be activated when training programs are ready.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Questions ({survey.questions.length})
            </h4>
            <div className="space-y-6">
              {survey.questions.map((question, index) => {
                // Handle section headers and intro questions (text type with no input needed)
                if (question.questionType === 'text' && !question.placeholder && !question.required) {
                  return (
                    <div key={question.questionId} className="border-t border-gray-200 pt-4 mt-6 first:mt-0 first:pt-0 first:border-t-0">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">{question.questionText}</h5>
                    </div>
                  );
                }
                
                return (
                  <div key={question.questionId} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-start gap-2 mb-2">
                      {!question.questionId.includes('intro') && !question.questionId.includes('section') && (
                        <span className="text-sm font-medium text-gray-500">
                          {question.questionId.startsWith('q') && question.questionId.match(/\d+/) 
                            ? `Q${question.questionId.match(/\d+/)?.[0]}`
                            : `Q${index + 1}`}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {question.questionType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{question.questionText}</p>
                  
                  {question.questionType === 'rating' && (
                    <div className="text-sm text-gray-600">
                      <span>Scale: {question.minValue || 1} - {question.maxValue || 5}</span>
                    </div>
                  )}

                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.placeholder && (
                    <div className="mt-2 text-sm text-gray-500 italic">
                      Placeholder: "{question.placeholder}"
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SurveyDisplay;
