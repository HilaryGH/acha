import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import VideoUpload from '../components/VideoUpload';
import { getCurrentUser } from '../utils/auth';

function PostDeliveryItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Sender Information
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    telegram: '',
    currentCity: '',
    location: '',
    bankAccount: '',
    idDocument: '',
    // Delivery Item Information
    productName: '',
    productDescription: '',
    brand: '',
    quantityType: 'pieces' as 'pieces' | 'weight',
    quantityDescription: '',
    departureCity: '',
    destinationCity: '',
    preferredDeliveryDate: '',
    // Attachments
    photos: [] as string[],
    video: '',
    link: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Auto-fill form with logged-in user information
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        currentCity: user.city || prev.currentCity,
        location: user.location || user.primaryLocation || prev.location,
      }));
    }
  }, []);

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

    try {
      // Prepare the data
      const submitData: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        whatsapp: formData.whatsapp || undefined,
        telegram: formData.telegram || undefined,
        currentCity: formData.currentCity,
        location: formData.location || undefined,
        bankAccount: formData.bankAccount,
        idDocument: formData.idDocument || undefined,
        status: 'active', // Set status to 'active' so it appears in find delivery immediately
        deliveryItemInfo: {
          productName: formData.productName || undefined,
          productDescription: formData.productDescription || undefined,
          brand: formData.brand || undefined,
          quantityType: formData.quantityType || undefined,
          quantityDescription: formData.quantityDescription || undefined,
          departureCity: formData.departureCity || undefined,
          destinationCity: formData.destinationCity || undefined,
          preferredDeliveryDate: formData.preferredDeliveryDate ? new Date(formData.preferredDeliveryDate).toISOString() : undefined,
          photos: formData.photos.length > 0 ? formData.photos : undefined,
          video: formData.video || undefined,
          link: formData.link || undefined
        }
      };

      // Remove undefined values from deliveryItemInfo
      Object.keys(submitData.deliveryItemInfo).forEach(key => {
        if (submitData.deliveryItemInfo[key] === undefined) {
          delete submitData.deliveryItemInfo[key];
        }
      });

      const response = await api.senders.create(submitData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Delivery item posted successfully! Your item is now visible to travelers.' });
        // Reset form after 3 seconds and redirect
        setTimeout(() => {
          setFormData({
            name: '',
            phone: '',
            email: '',
            whatsapp: '',
            telegram: '',
            currentCity: '',
            location: '',
            bankAccount: '',
            idDocument: '',
            productName: '',
            productDescription: '',
            brand: '',
            quantityType: 'pieces',
            quantityDescription: '',
            departureCity: '',
            destinationCity: '',
            preferredDeliveryDate: '',
            photos: [],
            video: '',
            link: ''
          });
          navigate('/');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to post delivery item. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while posting your delivery item' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Post Delivery Item</h1>
          <p className="text-lg text-gray-600">
            Share your delivery item details and connect with travelers
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
            {/* Sender Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Sender Information
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
                    Current City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="currentCity"
                    required
                    value={formData.currentCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="Street address"
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
                <div className="md:col-span-2">
                  <FileUpload
                    label="ID/Driving License/Passport (Optional)"
                    value={formData.idDocument}
                    onChange={(path) => setFormData(prev => ({ ...prev, idDocument: path }))}
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Item Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Delivery Item Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="productName"
                    required
                    value={formData.productName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="e.g., Smartphone, Laptop, etc."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="productDescription"
                    required
                    value={formData.productDescription}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="Describe your product in detail..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="e.g., Apple, Samsung, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pieces/Weight <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="quantityType"
                    required
                    value={formData.quantityType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="weight">Weight</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="quantityDescription"
                    required
                    value={formData.quantityDescription}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="e.g., 2 pieces, 5kg, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departureCity"
                    required
                    value={formData.departureCity}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="preferredDeliveryDate"
                    required
                    value={formData.preferredDeliveryDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📎</span>
                Attachments
              </h2>
              <div className="space-y-6">
                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (Multiple)
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

                {/* Video */}
                <VideoUpload
                  label="Video (30 seconds max)"
                  value={formData.video}
                  onChange={(path) => setFormData(prev => ({ ...prev, video: path }))}
                />

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="https://example.com/product"
                  />
                </div>
              </div>
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
                    Posting Delivery Item...
                  </span>
                ) : (
                  'Post Delivery Item'
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

export default PostDeliveryItem;

