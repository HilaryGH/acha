import { useState } from 'react';
import { api } from '../../services/api';
import FileUpload from '../FileUpload';
import VideoUpload from '../VideoUpload';

interface GiftType {
  type: 'Gift Products' | 'Gift Packages' | 'Gift Bundles' | '';
  description: string;
  photo: string;
  price: string;
}

interface GiftDeliveryPartnerFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

function GiftDeliveryPartnerForm({ onSuccess, isModal = false }: GiftDeliveryPartnerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    partnerType: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    email: '',
    city: '',
    primaryLocation: '',
    tradeRegistration: '',
    tin: '',
    businessLicense: '',
    photo: '',
    video: ''
  });

  const [giftTypes, setGiftTypes] = useState<GiftType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addGiftType = () => {
    setGiftTypes(prev => [...prev, {
      type: '',
      description: '',
      photo: '',
      price: ''
    }]);
  };

  const removeGiftType = (index: number) => {
    setGiftTypes(prev => prev.filter((_, i) => i !== index));
  };

  const updateGiftType = (index: number, field: keyof GiftType, value: string) => {
    setGiftTypes(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate gift types
    if (giftTypes.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one gift type' });
      setLoading(false);
      return;
    }

    // Validate each gift type
    for (const giftType of giftTypes) {
      if (!giftType.type || !giftType.description || !giftType.price) {
        setMessage({ type: 'error', text: 'Please fill all required fields for gift types' });
        setLoading(false);
        return;
      }
    }

    try {
      const submitData = {
        ...formData,
        registrationType: 'Gift Delivery Partner',
        giftTypes: giftTypes.map(gt => ({
          type: gt.type,
          description: gt.description,
          photo: gt.photo,
          price: parseFloat(gt.price)
        }))
      };

      const response = await api.partners.create(submitData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Gift Delivery Partner application submitted successfully!' });
        // Reset form
        setFormData({
          name: '',
          partnerType: '',
          phone: '',
          whatsapp: '',
          telegram: '',
          email: '',
          city: '',
          primaryLocation: '',
          tradeRegistration: '',
          tin: '',
          businessLicense: '',
          photo: '',
          video: ''
        });
        setGiftTypes([]);
        // Close modal after a short delay if onSuccess callback is provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to submit application' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? "" : "max-w-4xl mx-auto px-4 py-8"}>
      <div className={isModal ? "" : "bg-white rounded-xl shadow-lg p-6"}>
        {/* Logo - only show if not in modal */}
        {!isModal && (
          <div className="flex justify-center mb-6">
            <img 
              src="/acha.png" 
              alt="Acha Logo" 
              className="h-12 md:h-16 object-contain"
            />
          </div>
        )}
        {!isModal && (
          <h2 className="text-2xl font-bold mb-5 text-gray-900">Register As "Wanaw Gifting Delivery Partner"</h2>
        )}
        
        {message && (
          <div className={`mb-5 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Partner Type *</label>
                <select
                  name="partnerType"
                  value={formData.partnerType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Partner Type --</option>
                  <option value="Flower Seller">Flower Seller</option>
                  <option value="Event & Wedding Organisers">Event & Wedding Organisers</option>
                  <option value="Gift Articles Seller">Gift Articles Seller</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Supermarkets">Supermarkets</option>
                  <option value="Catering">Catering</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gift Types */}
          <div className="border-b pb-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Gift Types *</h3>
              <button
                type="button"
                onClick={addGiftType}
                className="px-4 py-2 text-sm text-white rounded-lg hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
              >
                + Add Gift Type
              </button>
            </div>
            
            {giftTypes.length === 0 && (
              <p className="text-sm text-gray-500 mb-3">Click "Add Gift Type" to add your first gift type</p>
            )}

            <div className="space-y-4">
              {giftTypes.map((giftType, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Gift Type #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeGiftType(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Gift Type *</label>
                      <select
                        value={giftType.type}
                        onChange={(e) => updateGiftType(index, 'type', e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Select Type --</option>
                        <option value="Gift Products">Gift Products</option>
                        <option value="Gift Packages">Gift Packages</option>
                        <option value="Gift Bundles">Gift Bundles</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Price *</label>
                      <input
                        type="number"
                        value={giftType.price}
                        onChange={(e) => updateGiftType(index, 'price', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Description *</label>
                    <textarea
                      value={giftType.description}
                      onChange={(e) => updateGiftType(index, 'description', e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe this gift type..."
                    />
                  </div>
                  
                  <div>
                    <FileUpload
                      label="Photo"
                      value={giftType.photo}
                      onChange={(filePath) => updateGiftType(index, 'photo', filePath)}
                      accept="image/*"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Telegram</label>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
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
            </div>
          </div>

          {/* Location Information */}
          <div className="border-b pb-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Primary Location *</label>
                <input
                  type="text"
                  name="primaryLocation"
                  required
                  value={formData.primaryLocation}
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
                label="Trade Registration"
                value={formData.tradeRegistration}
                onChange={(filePath) => setFormData(prev => ({ ...prev, tradeRegistration: filePath }))}
              />
              <FileUpload
                label="TIN"
                value={formData.tin}
                onChange={(filePath) => setFormData(prev => ({ ...prev, tin: filePath }))}
              />
              <FileUpload
                label="Business License"
                value={formData.businessLicense}
                onChange={(filePath) => setFormData(prev => ({ ...prev, businessLicense: filePath }))}
              />
              <FileUpload
                label="Photo"
                value={formData.photo}
                onChange={(filePath) => setFormData(prev => ({ ...prev, photo: filePath }))}
                accept="image/*"
              />
              <VideoUpload
                label="Video (30 min)"
                value={formData.video}
                onChange={(filePath) => setFormData(prev => ({ ...prev, video: filePath }))}
                maxDuration={30}
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

export default GiftDeliveryPartnerForm;

