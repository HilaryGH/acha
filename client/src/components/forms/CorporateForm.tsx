import { useState } from 'react';
import { api } from '../../services/api';
import FileUpload from '../FileUpload';
import VideoUpload from '../VideoUpload';

interface Branch {
  city: string;
  location: string;
}

interface BankAccount {
  bank: string;
  accountNumber: string;
}

function CorporateForm() {
  const [formData, setFormData] = useState({
    membershipLevel: 'Standard Member',
    companyName: '',
    serviceType: '',
    businessStatus: '',
    ownership: '',
    email: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    city: '',
    password: '',
    confirmPassword: '',
    license: '',
    tradeRegistration: '',
    insuranceProfileLink: '',
    tin: '',
    location: '',
    servicePriceList: '',
    country: 'Ethiopia',
    consent: false,
  });

  const [serviceCentrePhotos, setServiceCentrePhotos] = useState<string[]>([]);
  const [introVideo, setIntroVideo] = useState('');
  const [whwCard, setWhwCard] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (serviceCentrePhotos.length >= 5) {
      setMessage({ type: 'error', text: 'Maximum 5 photos allowed' });
      return;
    }
    setPhotoUploading(true);
    try {
      const filePath = await api.upload.single(file);
      setServiceCentrePhotos(prev => [...prev, filePath]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload photo' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setServiceCentrePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addBranch = () => {
    setBranches(prev => [...prev, { city: '', location: '' }]);
  };

  const removeBranch = (index: number) => {
    setBranches(prev => prev.filter((_, i) => i !== index));
  };

  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    setBranches(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, { bank: '', accountNumber: '' }]);
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(prev => prev.filter((_, i) => i !== index));
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    setBankAccounts(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
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

    // Validate consent
    if (!formData.consent) {
      setMessage({ type: 'error', text: 'Please consent to the Privacy Policy & Merchant Service Agreement' });
      setLoading(false);
      return;
    }

    try {
      // Register user first
      const registrationData: any = {
        name: formData.companyName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'corporate'
      };
      
      if (formData.phone && formData.phone.trim()) {
        registrationData.phone = formData.phone.trim();
      }
      
      const userResponse = await api.users.register(registrationData) as { status?: string; message?: string; data?: { user?: { id: string } } };
      
      if (userResponse.status === 'success') {
        // Then create corporate profile with additional data
        // TODO: Create API endpoint for corporate registration
        // const corporateData = {
        //   ...formData,
        //   serviceCentrePhotos,
        //   introVideo,
        //   whwCard,
        //   branches,
        //   bankAccounts,
        //   userId: userResponse.data.user.id
        // };
        // const response = await api.corporate.create(corporateData);
        
        setMessage({ type: 'success', text: 'Corporate registration submitted successfully!' });
        // Reset form
        setFormData({
          membershipLevel: 'Standard Member',
          companyName: '',
          serviceType: '',
          businessStatus: '',
          ownership: '',
          email: '',
          phone: '',
          whatsapp: '',
          telegram: '',
          city: '',
          password: '',
          confirmPassword: '',
          license: '',
          tradeRegistration: '',
          insuranceProfileLink: '',
          tin: '',
          location: '',
          servicePriceList: '',
          country: 'Ethiopia',
          consent: false,
        });
        setServiceCentrePhotos([]);
        setIntroVideo('');
        setWhwCard('');
        setBranches([]);
        setBankAccounts([]);
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
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Register as Corporate</h2>
        <p className="text-gray-600 mb-6">Registering as Corporate</p>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Membership Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Membership Level <span className="text-red-500">*</span>
            </label>
            <select
              name="membershipLevel"
              required
              value={formData.membershipLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Standard Member">Standard Member</option>
              <option value="Premium Member">Premium Member</option>
              <option value="Enterprise Member">Enterprise Member</option>
            </select>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service Type <span className="text-red-500">*</span>
            </label>
            <select
              name="serviceType"
              required
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select service type</option>
              <option value="delivery">Delivery</option>
              <option value="movers-packers">Movers & Packers</option>
              <option value="gift-delivery">Gift Delivery</option>
              <option value="logistics">Logistics</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Business Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Status - Leadership <span className="text-red-500">*</span>
            </label>
            <select
              name="businessStatus"
              required
              value={formData.businessStatus}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select business status</option>
              <option value="women-led">Women Led</option>
              <option value="non-women-led">Non Women Led</option>
            </select>
          </div>

          {/* Ownership */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ownership <span className="text-red-500">*</span>
            </label>
            <select
              name="ownership"
              required
              value={formData.ownership}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select ownership</option>
              <option value="women-owned">Women Owned</option>
              <option value="non-women-owned">Non Women Owned</option>
            </select>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
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
                  WhatsApp (Optional)
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
                  Telegram (Optional)
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
            </div>
          </div>

          {/* Password */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Account Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Documents */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Documents</h3>
            <div className="space-y-4">
              <FileUpload
                label="License (PDF/Image)"
                value={formData.license}
                onChange={(path) => setFormData(prev => ({ ...prev, license: path }))}
                accept="image/*,.pdf"
              />
              
              <FileUpload
                label="Trade Registration (PDF/Image)"
                value={formData.tradeRegistration}
                onChange={(path) => setFormData(prev => ({ ...prev, tradeRegistration: path }))}
                accept="image/*,.pdf"
              />

              {/* Service Centre Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Centre Photos (up to 5)
                </label>
                <div className="space-y-2">
                  {serviceCentrePhotos.map((photo, index) => (
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
                  {serviceCentrePhotos.length < 5 && (
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
                  )}
                </div>
              </div>

              <VideoUpload
                label="Intro Video (optional)"
                value={introVideo}
                onChange={setIntroVideo}
              />

              <FileUpload
                label="WHW card"
                value={whwCard}
                onChange={setWhwCard}
                accept="image/*,.pdf"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Profile Link (PDF/Image) (Optional)
                </label>
                <input
                  type="url"
                  name="insuranceProfileLink"
                  value={formData.insuranceProfileLink}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/file.pdf"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Identification Number (TIN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tin"
                  required
                  value={formData.tin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter TIN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address or area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Branches */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Branches</h3>
              <button
                type="button"
                onClick={addBranch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Branch
              </button>
            </div>
            <div className="space-y-4">
              {branches.map((branch, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Branch {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeBranch(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={branch.city}
                        onChange={(e) => updateBranch(index, 'city', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={branch.location}
                        onChange={(e) => updateBranch(index, 'location', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Location"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Bank Accounts</h3>
              <button
                type="button"
                onClick={addBankAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Bank Account
              </button>
            </div>
            <div className="space-y-4">
              {bankAccounts.map((account, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Bank Account {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeBankAccount(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Bank
                      </label>
                      <select
                        value={account.bank}
                        onChange={(e) => updateBankAccount(index, 'bank', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select bank</option>
                        <option value="cbe">Commercial Bank of Ethiopia</option>
                        <option value="awash">Awash Bank</option>
                        <option value="dashen">Dashen Bank</option>
                        <option value="abyssinia">Abyssinia Bank</option>
                        <option value="nib">NIB Bank</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={account.accountNumber}
                        onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Account number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Price List */}
          <div className="border-t pt-6">
            <FileUpload
              label="Service Price List / Quotation Document (PDF)"
              value={formData.servicePriceList}
              onChange={(path) => setFormData(prev => ({ ...prev, servicePriceList: path }))}
              accept=".pdf"
            />
          </div>

          {/* Consent */}
          <div className="border-t pt-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                I consent to the collection and processing of my personal data in line with data regulations as described in the <a href="#" className="text-blue-600 hover:underline">Privacy Policy & Merchant Service Agreement</a>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
          >
            {loading ? 'Submitting...' : 'Register as Corporate'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CorporateForm;
