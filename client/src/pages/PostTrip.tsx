import { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

function PostTrip() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    telegram: '',
    currentLocation: '',
    destinationCity: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    bankAccount: '',
    travellerType: 'international' as 'international' | 'domestic' | 'intra-city',
    maximumKilograms: '',
    priceOffer: '',
    internationalDocuments: {
      flightTicket: '',
      visa: '',
      passport: ''
    },
    domesticDocuments: {
      governmentID: '',
      flightTicket: '',
      photo: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('internationalDocuments.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        internationalDocuments: {
          ...prev.internationalDocuments,
          [field]: value
        }
      }));
    } else if (name.startsWith('domesticDocuments.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        domesticDocuments: {
          ...prev.domesticDocuments,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDocumentChange = (documentType: string, filePath: string) => {
    if (formData.travellerType === 'international') {
      setFormData(prev => ({
        ...prev,
        internationalDocuments: {
          ...prev.internationalDocuments,
          [documentType]: filePath
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        domesticDocuments: {
          ...prev.domesticDocuments,
          [documentType]: filePath
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate dates before converting
      if (!formData.departureDate || !formData.arrivalDate) {
        setMessage({ type: 'error', text: 'Please provide both departure and arrival dates' });
        setLoading(false);
        return;
      }
      
      // Prepare the data
      const baseData = {
        ...formData,
        departureDate: formData.departureDate ? new Date(formData.departureDate).toISOString() : null,
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate).toISOString() : null,
        maximumKilograms: formData.maximumKilograms && formData.maximumKilograms.trim() !== '' 
          ? parseFloat(formData.maximumKilograms) 
          : null,
        priceOffer: formData.priceOffer && formData.priceOffer.trim() !== '' 
          ? parseFloat(formData.priceOffer) 
          : null
      };

      // Clean up document fields based on traveller type and remove empty values
      let submitData: any;
      
      if (formData.travellerType === 'international') {
        // Process international documents - remove empty strings
        const processedInternationalDocs: any = {};
        Object.keys(baseData.internationalDocuments).forEach(key => {
          const typedKey = key as keyof typeof baseData.internationalDocuments;
          processedInternationalDocs[typedKey] = baseData.internationalDocuments[typedKey] === '' 
            ? null 
            : baseData.internationalDocuments[typedKey];
        });
        
        // Remove domestic documents from submit data
        const { domesticDocuments, ...rest } = baseData;
        submitData = {
          ...rest,
          internationalDocuments: processedInternationalDocs
        };
      } else {
        // Process domestic documents - remove empty strings (for both domestic and intra-city)
        const processedDomesticDocs: any = {};
        Object.keys(baseData.domesticDocuments).forEach(key => {
          const typedKey = key as keyof typeof baseData.domesticDocuments;
          processedDomesticDocs[typedKey] = baseData.domesticDocuments[typedKey] === '' 
            ? null 
            : baseData.domesticDocuments[typedKey];
        });
        
        // Remove international documents from submit data
        const { internationalDocuments, ...rest } = baseData;
        submitData = {
          ...rest,
          domesticDocuments: processedDomesticDocs
        };
      }

      const response = await api.travellers.create(submitData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Trip posted successfully! Your trip is now visible to others.' });
        // Reset form after 3 seconds and redirect
        setTimeout(() => {
          setFormData({
            name: '',
            phone: '',
            email: '',
            whatsapp: '',
            telegram: '',
            currentLocation: '',
            destinationCity: '',
            departureDate: '',
            departureTime: '',
            arrivalDate: '',
            arrivalTime: '',
            bankAccount: '',
            travellerType: 'international',
            maximumKilograms: '',
            priceOffer: '',
            internationalDocuments: { flightTicket: '', visa: '', passport: '' },
            domesticDocuments: { governmentID: '', flightTicket: '', photo: '' }
          });
          navigate('/');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to post trip. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while posting your trip' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Post Your Trip</h1>
          <p className="text-lg text-gray-600">
            Share your travel plans and help others send items between cities
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp (Optional)
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram (Optional)
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankAccount"
                    required
                    value={formData.bankAccount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="Account number"
                  />
                </div>
              </div>
            </div>

            {/* Trip Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">✈️</span>
                Trip Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traveller Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="travellerType"
                    required
                    value={formData.travellerType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  >
                    <option value="international">International</option>
                    <option value="domestic">Domestic/Local</option>
                    <option value="intra-city">Intra City</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location/Departure City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="currentLocation"
                    required
                    value={formData.currentLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="destinationCity"
                    required
                    value={formData.destinationCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="London"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    required
                    value={formData.departureDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="departureTime"
                    required
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="arrivalDate"
                    required
                    value={formData.arrivalDate}
                    onChange={handleChange}
                    min={formData.departureDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="arrivalTime"
                    required
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Kilograms (Optional)
                  </label>
                  <input
                    type="number"
                    name="maximumKilograms"
                    min="0"
                    step="0.01"
                    value={formData.maximumKilograms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="e.g., 50.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum weight you can carry (in kilograms)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Offer (Optional)
                  </label>
                  <input
                    type="number"
                    name="priceOffer"
                    min="0"
                    step="0.01"
                    value={formData.priceOffer}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="e.g., 500.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your price offer for delivery service (in ETB)</p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📄</span>
                Documents {formData.travellerType === 'international' ? '(International)' : formData.travellerType === 'intra-city' ? '(Intra City)' : '(Domestic/Local)'}
              </h2>
              
              {formData.travellerType === 'international' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    label="Flight Ticket"
                    value={formData.internationalDocuments.flightTicket}
                    onChange={(path) => handleDocumentChange('flightTicket', path)}
                    accept="image/*,.pdf"
                  />
                  <FileUpload
                    label="VISA"
                    value={formData.internationalDocuments.visa}
                    onChange={(path) => handleDocumentChange('visa', path)}
                    accept="image/*,.pdf"
                  />
                  <FileUpload
                    label="Passport"
                    value={formData.internationalDocuments.passport}
                    onChange={(path) => handleDocumentChange('passport', path)}
                    accept="image/*,.pdf"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    label="Government ID/Driving License/Passport"
                    value={formData.domesticDocuments.governmentID}
                    onChange={(path) => handleDocumentChange('governmentID', path)}
                    accept="image/*,.pdf"
                  />
                  <FileUpload
                    label="Flight Ticket"
                    value={formData.domesticDocuments.flightTicket}
                    onChange={(path) => handleDocumentChange('flightTicket', path)}
                    accept="image/*,.pdf"
                  />
                  <FileUpload
                    label="Photo"
                    value={formData.domesticDocuments.photo}
                    onChange={(path) => handleDocumentChange('photo', path)}
                    accept="image/*"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting Trip...
                  </span>
                ) : (
                  'Post Trip'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostTrip;

