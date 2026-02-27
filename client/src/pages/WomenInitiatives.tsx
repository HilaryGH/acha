import { useState } from 'react';
import WomenInitiativesForm from '../components/forms/WomenInitiativesForm';
import SurveyDisplay from '../components/SurveyDisplay';

function WomenInitiatives() {
  const [activeTab, setActiveTab] = useState<'application' | 'surveys'>('application');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Women Initiatives
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Join our women empowerment initiatives
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 max-w-3xl mx-auto">
          <div className="border-b border-gray-200">
            <nav className="flex flex-col sm:flex-row -mb-px">
              <button
                onClick={() => setActiveTab('application')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium text-sm sm:text-base leading-snug whitespace-normal transition-colors ${
                  activeTab === 'application'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Application Form
              </button>
              <button
                onClick={() => setActiveTab('surveys')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium text-sm sm:text-base leading-snug whitespace-normal transition-colors ${
                  activeTab === 'surveys'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Training Questionnaires
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'application' ? (
          <WomenInitiativesForm />
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Questionnaires</h2>
              <p className="text-gray-600 mb-4">
                These questionnaires help us understand training needs, challenges, and current skills of women interested in becoming delivery partners.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">View Only - No Submissions</p>
                    <p className="text-sm text-yellow-800">
                      These questionnaires are currently <strong>view-only</strong>. You can review the questions, but responses cannot be submitted at this time. 
                      The surveys will be activated when training programs are ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <SurveyDisplay category="training_need" showInactive={true} />
            <div className="mt-6">
              <SurveyDisplay category="challenges" showInactive={true} />
            </div>
            <div className="mt-6">
              <SurveyDisplay category="skills_experience" showInactive={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WomenInitiatives;






























