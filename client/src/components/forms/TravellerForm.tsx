import { useState } from 'react';
import { api } from '../../services/api';

function TravellerForm() {
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
    travellerType: 'international' as 'international' | 'domestic',
    internationalDocuments: {
      flightTicket: '',
      visa: '',
      passport: '',
      yellowCard: ''
    },
    domesticDocuments: {
      governmentID: '',
      flightTicket: '',
      photo: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Prepare the data
      const submitData = {
        ...formData,
        departureDate: new Date(formData.departureDate),
        arrivalDate: new Date(formData.arrivalDate)
      };

      // Remove empty document fields
      if (formData.travellerType === 'international') {
        Object.keys(submitData.domesticDocuments).forEach(key => {
          delete submitData.domesticDocuments[key as keyof typeof submitData.domesticDocuments];
        });
      } else {
        Object.keys(submitData.internationalDocuments).forEach(key => {
          delete submitData.internationalDocuments[key as keyof typeof submitData.internationalDocuments];
        });
      }

      const response = await api.travellers.create(submitData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Traveller registered successfully!' });
        // Reset form
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
          internationalDocuments: { flightTicket: '', visa: '', passport: '', yellowCard: '' },
          domesticDocuments: { governmentID: '', flightTicket: '', photo: '' }
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to register traveller' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/acha.png" 
            alt="Acha Logo" 
            className="h-12 md:h-16 object-contain"
          />
        </div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Register as Traveller</h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account *</label>
                <input
                  type="text"
                  name="bankAccount"
                  required
                  value={formData.bankAccount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Travel Information */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Travel Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Location/Departure City *</label>
                <input
                  type="text"
                  name="currentLocation"
                  required
                  value={formData.currentLocation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination City *</label>
                <input
                  type="text"
                  name="destinationCity"
                  required
                  value={formData.destinationCity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Date *</label>
                <input
                  type="date"
                  name="departureDate"
                  required
                  value={formData.departureDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Date *</label>
                <input
                  type="date"
                  name="arrivalDate"
                  required
                  value={formData.arrivalDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Traveller Type *</label>
                <select
                  name="travellerType"
                  required
                  value={formData.travellerType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                >
                  <option value="international">International</option>
                  <option value="domestic">Domestic/Local</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Documents {formData.travellerType === 'international' ? '(International)' : '(Domestic/Local)'}
            </h3>
            
            {formData.travellerType === 'international' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flight Ticket (URL or file path)</label>
                  <input
                    type="text"
                    name="internationalDocuments.flightTicket"
                    value={formData.internationalDocuments.flightTicket}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VISA (URL or file path)</label>
                  <input
                    type="text"
                    name="internationalDocuments.visa"
                    value={formData.internationalDocuments.visa}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passport (URL or file path)</label>
                  <input
                    type="text"
                    name="internationalDocuments.passport"
                    value={formData.internationalDocuments.passport}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yellow Card (URL or file path)</label>
                  <input
                    type="text"
                    name="internationalDocuments.yellowCard"
                    value={formData.internationalDocuments.yellowCard}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Government ID/Driving License/Passport (URL or file path)</label>
                  <input
                    type="text"
                    name="domesticDocuments.governmentID"
                    value={formData.domesticDocuments.governmentID}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flight Ticket (URL or file path)</label>
                  <input
                    type="text"
                    name="domesticDocuments.flightTicket"
                    value={formData.domesticDocuments.flightTicket}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo (URL or file path)</label>
                  <input
                    type="text"
                    name="domesticDocuments.photo"
                    value={formData.domesticDocuments.photo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
          >
            {loading ? 'Submitting...' : 'Register as Traveller'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TravellerForm;












