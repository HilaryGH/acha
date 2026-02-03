import { useState } from 'react';
import IndividualForm from '../components/forms/IndividualForm';
import DeliveryPartnerForm from '../components/forms/DeliveryPartnerForm';
import AchaSistersDeliveryPartnerForm from '../components/forms/AchaSistersDeliveryPartnerForm';
import GiftDeliveryPartnerForm from '../components/forms/GiftDeliveryPartnerForm';
import AchaMoversPackersForm from '../components/forms/AchaMoversPackersForm';
import CorporateForm from '../components/forms/CorporateForm';
import AdminRoleForm from '../components/forms/AdminRoleForm';

type RegistrationType = 'individual' | 'delivery-partner' | 'acha-sisters-delivery-partner' | 'gift-delivery-partner' | 'acha-movers-packers' | 'corporate' | 'super_admin' | 'admin' | 'customer_support' | 'marketing_team' | null;

function Register() {
  const [selectedType, setSelectedType] = useState<RegistrationType>(null);

  if (selectedType === 'individual') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <IndividualForm />
        </div>
      </div>
    );
  }

  if (selectedType === 'delivery-partner') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <DeliveryPartnerForm />
        </div>
      </div>
    );
  }

  if (selectedType === 'acha-sisters-delivery-partner') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <AchaSistersDeliveryPartnerForm />
        </div>
      </div>
    );
  }

  if (selectedType === 'gift-delivery-partner') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <GiftDeliveryPartnerForm />
        </div>
      </div>
    );
  }

  if (selectedType === 'acha-movers-packers') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <AchaMoversPackersForm />
        </div>
      </div>
    );
  }

  if (selectedType === 'corporate') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <CorporateForm />
        </div>
      </div>
    );
  }

  if (selectedType === 'super_admin' || selectedType === 'admin' || selectedType === 'customer_support' || selectedType === 'marketing_team') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Registration Types
          </button>
          <AdminRoleForm role={selectedType} />
        </div>
      </div>
    );
  }

  const registrationTypes = [
    { id: 'individual' as const, title: 'Individual', description: 'Register as an individual user' },
    { id: 'delivery-partner' as const, title: 'Delivery Partner', description: 'Join our delivery network and start earning.' },
    { id: 'acha-sisters-delivery-partner' as const, title: 'Acha Sisters Delivery Partner', description: 'Join our delivery network and start earning.' },
    { id: 'gift-delivery-partner' as const, title: 'Acha Surprise Gift Delivery Partner', description: 'Register as a gift delivery partner and offer your gift services' },
    { id: 'acha-movers-packers' as const, title: 'Acha Movers & Packers', description: 'Register as a movers and packers service provider' },
    { id: 'corporate' as const, title: 'Corporate', description: 'Register as a corporate entity' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/acha.png" 
            alt="Acha Logo" 
            className="h-16 md:h-20 object-contain"
          />
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Register</h1>
          <p className="text-lg text-gray-600">
            Choose your role to get started
          </p>
        </div>

        {/* Registration Type Dropdown */}
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Role <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value as RegistrationType)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-base"
          >
            <option value="">-- Select a role --</option>
            {registrationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.title} - {type.description}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default Register;
