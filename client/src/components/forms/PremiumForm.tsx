import { useState } from 'react';
import { api } from '../../services/api';

type PlanType = 'individual-monthly' | 'individual-yearly' | 'corporate-monthly' | 'corporate-yearly';

interface Plan {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  description: string;
}

const plans: Plan[] = [
  {
    id: 'individual-monthly',
    name: 'Individual Monthly',
    price: 100,
    period: 'month',
    description: 'Holistic wellness playbook, accountability circles & partner perks.'
  },
  {
    id: 'individual-yearly',
    name: 'Individual Yearly',
    price: 1000,
    period: 'year',
    description: 'All monthly benefits plus 2 complimentary wellness retreat passes.'
  },
  {
    id: 'corporate-monthly',
    name: 'Corporate Monthly',
    price: 300,
    period: 'month',
    description: 'Employee wellness activation, HR wellness toolkits & analytics.'
  },
  {
    id: 'corporate-yearly',
    name: 'Corporate Yearly',
    price: 2500,
    period: 'year',
    description: 'All monthly benefits plus bespoke wellness strategy co-design.'
  }
];

function PremiumForm() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('individual-monthly');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    renewalStatus: 'new',
    wellnessGoals: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedPlanData = plans.find(p => p.id === selectedPlan)!;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Map the new plan structure to API expected format
      const isCorporate = selectedPlan.includes('corporate');
      const isMonthly = selectedPlan.includes('monthly');
      
      const premiumData: any = {
        category: isCorporate ? 'corporate-clients' : 'delivery-partners',
        subscriptionType: isMonthly ? 'monthly' : 'annual',
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.phone,
        location: '',
        city: '',
        price: selectedPlanData.price // Send price directly from selected plan
      };

      // Add corporate-specific fields
      if (isCorporate) {
        premiumData.companyName = formData.organization || formData.fullName;
      } else {
        // For individual plans, API requires deliveryPartnerType
        // Using 'cycle-riders' as default for wellness community individual members
        premiumData.deliveryPartnerType = 'cycle-riders';
      }

      const response = await api.premium.create(premiumData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Premium subscription request submitted successfully! Our concierge will contact you soon.' });
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          organization: '',
          role: '',
          renewalStatus: 'new',
          wellnessGoals: ''
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || (error.response?.data?.message) || 'Failed to submit request. Please try again.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Premium Community
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-6">
            Curated wellness circles, corporate innovation hubs, and exclusive access to the Acha concierge network.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
              Choose Your Subscription
            </h2>
            <p className="text-gray-600">
              Pick the plan that aligns with your goals. You can upgrade or adjust your membership anytime with our community concierge.
            </p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedPlan === plan.id
                  ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                {selectedPlan === plan.id && (
                  <span className="text-blue-600 font-semibold text-sm">Selected</span>
                )}
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-gray-900">{plan.price} ETB</span>
                <span className="text-gray-600 ml-1">/ {plan.period}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{plan.description}</p>
            </button>
          ))}
        </div>

        {/* Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Premium Concierge Intake */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Premium Concierge Intake
              </h2>
              <p className="text-gray-600 mb-6">
                Share a few details and our concierge will design your onboarding pathway, including curated programs, wellness data dashboards, and in-person experiences.
              </p>

              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization / Company (Optional)
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter organization name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role / Title (Optional)
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your role"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Renewal Status
                    </label>
                    <select
                      name="renewalStatus"
                      value={formData.renewalStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="new">New Membership</option>
                      <option value="renewal">Renewal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share your wellness goals or concierge requests
                  </label>
                  <textarea
                    name="wellnessGoals"
                    value={formData.wellnessGoals}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your wellness goals, preferences, or any specific requests..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Premium Request'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Selected Plan Snapshot */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 md:p-8 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Selected Plan Snapshot</h3>
              
              <div className="bg-white rounded-xl p-5 mb-6 border border-blue-200">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {selectedPlanData.price} ETB
                  </div>
                  <div className="text-gray-600">/ {selectedPlanData.period}</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedPlanData.name}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedPlanData.description}</p>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Curated wellness programs</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Exclusive concierge access</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Wellness data dashboards</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>In-person experiences</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>© All rights reserved by Acha Delivery</p>
        </div>
      </div>
    </div>
  );
}

export default PremiumForm;
