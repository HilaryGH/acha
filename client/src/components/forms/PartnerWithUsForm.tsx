import { useState } from 'react';
import { api } from '../../services/api';
import FileUpload from '../FileUpload';

function PartnerWithUsForm() {
  const [formData, setFormData] = useState({
    type: '', // Investor, Strategic Partner, Sponsorship
    partner: '', // Delivery Partner, Domestic Suppliers, Tour & Travel
    investmentType: '',
    name: '',
    companyName: '',
    email: '',
    phone: '',
    whatsapp: '',
    idDocument: '',
    license: '',
    tradeRegistration: '',
    enquiries: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const submitData = {
        ...formData,
        registrationType: 'Invest/Partner'
      };
      const response = await api.partners.create(submitData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Partner application submitted successfully!' });
        setFormData({
          type: '',
          partner: '',
          investmentType: '',
          name: '',
          companyName: '',
          email: '',
          phone: '',
          whatsapp: '',
          idDocument: '',
          license: '',
          tradeRegistration: '',
          enquiries: ''
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to submit partner application' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/acha.png" 
            alt="Acha Logo" 
            className="h-12 md:h-16 object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold mb-5 text-gray-900">Invest / Partner With Us</h2>
        
        {message && (
          <div className={`mb-5 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Selection */}
          <div className="border-b pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Partner Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="type"
                  value="Investor"
                  checked={formData.type === 'Investor'}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                <span className="text-sm text-gray-700 font-medium">Investor</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="type"
                  value="Strategic Partner"
                  checked={formData.type === 'Strategic Partner'}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                <span className="text-sm text-gray-700 font-medium">Strategic Partner</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="type"
                  value="Sponsorship"
                  checked={formData.type === 'Sponsorship'}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                <span className="text-sm text-gray-700 font-medium">Sponsorship</span>
              </label>
            </div>
          </div>

          {/* Partner and Investment Type */}
          <div className="border-b pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Partner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Partner *</label>
                <select
                  name="partner"
                  value={formData.partner}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Partner --</option>
                  <option value="Delivery Partner">Delivery Partner</option>
                  <option value="Domestic Suppliers">Domestic Suppliers</option>
                  <option value="Tour & Travel">Tour & Travel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Investment Type *</label>
                <select
                  name="investmentType"
                  value={formData.investmentType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Investment Type --</option>
                  <option value="Equity Investment">Equity Investment</option>
                  <option value="Debt Financing">Debt Financing</option>
                  <option value="Strategic Partnership">Strategic Partnership</option>
                  <option value="Joint Venture">Joint Venture</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="border-b pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="border-b pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Attachments</h3>
            <div className="space-y-3">
              <FileUpload
                label="ID / Passport / Driving Licence"
                value={formData.idDocument}
                onChange={(filePath) => setFormData(prev => ({ ...prev, idDocument: filePath }))}
              />
              <FileUpload
                label="License"
                value={formData.license}
                onChange={(filePath) => setFormData(prev => ({ ...prev, license: filePath }))}
              />
              <FileUpload
                label="Trade Registration"
                value={formData.tradeRegistration}
                onChange={(filePath) => setFormData(prev => ({ ...prev, tradeRegistration: filePath }))}
              />
            </div>
          </div>

          {/* Enquiries */}
          <div className="pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Enquiries</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Type your message...</label>
              <textarea
                name="enquiries"
                value={formData.enquiries}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your message..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-5 rounded-lg text-sm text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PartnerWithUsForm;

