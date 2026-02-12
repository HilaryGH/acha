import { useState } from 'react';
import { api } from '../../services/api';
import FileUpload from '../FileUpload';
import DeliveryFeeDisplay from '../DeliveryFeeDisplay';

function AchaSistersDeliveryPartnerForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    telegram: '',
    city: '',
    primaryLocation: '',
    deliveryMechanism: '',
    kebeleId: '',
    drivingLicense: '',
    photos: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const filePath = await api.upload.single(file);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, filePath]
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload photo' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    // Validate email is provided
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Email is required' });
      setLoading(false);
      return;
    }

    try {
      // Register user first
      const registrationData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'acha_sisters_delivery_partner'
      };
      
      // Only include phone if it's not empty
      if (formData.phone && formData.phone.trim()) {
        registrationData.phone = formData.phone.trim();
      }
      
      // Include location data for searchability
      if (formData.city && formData.city.trim()) {
        registrationData.city = formData.city.trim();
      }
      if (formData.primaryLocation && formData.primaryLocation.trim()) {
        registrationData.primaryLocation = formData.primaryLocation.trim();
        // Also set location field to primaryLocation for broader search
        registrationData.location = formData.primaryLocation.trim();
      }
      
      const userResponse = await api.users.register(registrationData) as { status?: string; message?: string; data?: { user?: { id: string } } };
      
      if (userResponse.status === 'success') {
        // Then create acha sisters delivery partner profile with additional data
        // TODO: Create API endpoint for acha sisters delivery partners
        // const partnerData = {
        //   name: formData.name,
        //   phone: formData.phone,
        //   email: formData.email,
        //   whatsapp: formData.whatsapp,
        //   telegram: formData.telegram,
        //   city: formData.city,
        //   primaryLocation: formData.primaryLocation,
        //   deliveryMechanism: formData.deliveryMechanism,
        //   kebeleId: formData.kebeleId,
        //   drivingLicense: formData.drivingLicense,
        //   photos: formData.photos,
        //   userId: userResponse.data.user.id
        // };
        // const response = await api.achaSistersDeliveryPartners.create(partnerData);
        
        // For now, just show success message
        setMessage({ type: 'success', text: 'Acha Sisters Delivery Partner registration submitted successfully!' });
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
          whatsapp: '',
          telegram: '',
          city: '',
          primaryLocation: '',
          deliveryMechanism: '',
          kebeleId: '',
          drivingLicense: '',
          photos: [],
        });
      } else {
        setMessage({ type: 'error', text: userResponse.message || 'Failed to register' });
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
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Register as Acha Sisters Delivery Partner</h2>
        
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+251911508734"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+251911508734"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram
                </label>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Addis Ababa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="primaryLocation"
                  required
                  value={formData.primaryLocation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address or area"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Mechanism <span className="text-red-500">*</span>
                </label>
                <select
                  name="deliveryMechanism"
                  required
                  value={formData.deliveryMechanism}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select delivery mechanism</option>
                  <option value="cycle-rider">Cycle Rider</option>
                  <option value="e-bike-rider">E Bike Rider</option>
                  <option value="motorcycle-rider">Motorcycle Rider</option>
                </select>
              </div>
              
              {/* Delivery Fee Display */}
              {formData.deliveryMechanism && (
                <div className="md:col-span-2 mt-2">
                  <DeliveryFeeDisplay mechanism={formData.deliveryMechanism as any} />
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Attachments</h3>
            <div className="space-y-4">
              <FileUpload
                label="Kebele ID/Fayda/Passport"
                value={formData.kebeleId}
                onChange={(path) => setFormData(prev => ({ ...prev, kebeleId: path }))}
                accept="image/*,.pdf"
              />
              
              {/* Driving Licence - Only for Motorcycle Riders */}
              {formData.deliveryMechanism === 'motorcycle-rider' && (
                <FileUpload
                  label="Driving Licence (Required for Motorcycle Riders)"
                  value={formData.drivingLicense}
                  onChange={(path) => setFormData(prev => ({ ...prev, drivingLicense: path }))}
                  accept="image/*,.pdf"
                />
              )}

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <div className="space-y-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700 flex-1 truncate">{photo}</span>
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                      disabled={photoUploading}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {photoUploading ? 'Uploading...' : '📷 Upload Photo'}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
          >
            {loading ? 'Submitting...' : 'Register as Acha Sisters Delivery Partner'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AchaSistersDeliveryPartnerForm;

