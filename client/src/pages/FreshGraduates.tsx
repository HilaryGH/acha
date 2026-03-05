import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import { getCurrentUser } from '../utils/auth';

function FreshGraduates() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    linkedin: '',
    currentLocation: '',
    graduationYear: '',
    degree: '',
    university: '',
    fieldOfStudy: '',
    cv: '',
    transcript: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // Auto-fill form with logged-in user information
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        currentLocation: user.city || user.location || user.primaryLocation || prev.currentLocation,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (documentType: 'cv' | 'transcript', filePath: string) => {
    setFormData(prev => ({ ...prev, [documentType]: filePath }));
  };

  const generateCertificate = () => {
    if (!formData.fullName || !registrationId) return;

    const certificateHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fresh Graduate Certificate - ${formData.fullName}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              @page { 
                margin: 1cm;
                size: A4 landscape;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Times New Roman', serif; 
              padding: 60px 80px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate-container {
              background: white;
              padding: 60px 80px;
              border: 20px solid #1E88E5;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 1000px;
              width: 100%;
              position: relative;
            }
            .certificate-border {
              border: 3px solid #FFD700;
              padding: 40px;
              position: relative;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .header h1 {
              color: #1E88E5;
              font-size: 42px;
              font-weight: bold;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 3px;
            }
            .header h2 {
              color: #43A047;
              font-size: 28px;
              font-weight: 600;
              margin-top: 10px;
            }
            .certificate-body {
              text-align: center;
              margin: 50px 0;
            }
            .certificate-text {
              font-size: 20px;
              line-height: 1.8;
              color: #333;
              margin-bottom: 30px;
            }
            .recipient-name {
              font-size: 36px;
              font-weight: bold;
              color: #1E88E5;
              margin: 30px 0;
              text-decoration: underline;
              text-decoration-color: #FFD700;
              text-decoration-thickness: 3px;
            }
            .details {
              margin: 40px 0;
              text-align: left;
              padding: 20px;
              background: #f8f9fa;
              border-left: 5px solid #1E88E5;
            }
            .details p {
              font-size: 16px;
              margin: 10px 0;
              color: #555;
            }
            .footer {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signature {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 2px solid #333;
              margin-top: 60px;
              width: 100%;
            }
            .signature-name {
              margin-top: 10px;
              font-weight: bold;
              font-size: 16px;
            }
            .certificate-id {
              position: absolute;
              bottom: 20px;
              right: 40px;
              font-size: 12px;
              color: #666;
            }
            .logo {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo-text {
              font-size: 24px;
              font-weight: bold;
              color: #1E88E5;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-border">
              <div class="logo">
                <div class="logo-text">ACHA DELIVERY</div>
              </div>
              <div class="header">
                <h1>Certificate of Registration</h1>
                <h2>Fresh Graduates Community</h2>
              </div>
              <div class="certificate-body">
                <div class="certificate-text">
                  This is to certify that
                </div>
                <div class="recipient-name">${formData.fullName}</div>
                <div class="certificate-text">
                  has successfully registered as a member of the Acha Delivery Fresh Graduates Community.
                </div>
                <div class="details">
                  <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Email:</strong> ${formData.email}</p>
                  <p><strong>Location:</strong> ${formData.currentLocation}</p>
                  ${formData.university ? `<p><strong>University:</strong> ${formData.university}</p>` : ''}
                  ${formData.degree ? `<p><strong>Degree:</strong> ${formData.degree}</p>` : ''}
                  ${formData.fieldOfStudy ? `<p><strong>Field of Study:</strong> ${formData.fieldOfStudy}</p>` : ''}
                  ${formData.graduationYear ? `<p><strong>Graduation Year:</strong> ${formData.graduationYear}</p>` : ''}
                </div>
                <div class="certificate-text">
                  This certificate acknowledges the member's commitment to professional growth and networking within our community.
                </div>
              </div>
              <div class="footer">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-name">Acha Delivery Team</div>
                </div>
                <div class="certificate-id">
                  Certificate ID: ${registrationId}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(certificateHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate required documents
    if (!formData.cv) {
      setMessage({ type: 'error', text: 'Please upload your CV' });
      setLoading(false);
      return;
    }
    if (!formData.transcript) {
      setMessage({ type: 'error', text: 'Please upload your transcript' });
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        registrationType: 'Fresh Graduates',
        category: 'Fresh Graduate'
      };
      const response = await api.partners.create(submitData) as { status?: string; message?: string; data?: any };
      
      if (response.status === 'success') {
        const regId = response.data?.uniqueId || response.data?.id || `FG-${Date.now()}`;
        setRegistrationId(regId);
        setMessage({ type: 'success', text: 'Registration submitted successfully! You can now generate your certificate.' });
        setCertificateGenerated(true);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to submit registration' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Fresh Graduates Community</h1>
          <p className="text-lg text-gray-600">
            Join us by filling the form below and get your certificate
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

          {certificateGenerated && (
            <div className="mb-6 p-4 rounded-lg bg-blue-100 text-blue-800 border border-blue-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  <span>Registration successful! Generate your certificate now.</span>
                </div>
                <button
                  onClick={generateCertificate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Generate Certificate
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="john@example.com"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="+1234567890"
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
                    LinkedIn Profile (Optional)
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="currentLocation"
                    required
                    value={formData.currentLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Education Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Education Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University/Institution <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="university"
                    required
                    value={formData.university}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="University Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="degree"
                    required
                    value={formData.degree}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Degree --</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    required
                    value={formData.fieldOfStudy}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="e.g., Computer Science, Business Administration"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    required
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    value={formData.graduationYear}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload
                  label="Upload CV *"
                  value={formData.cv}
                  onChange={(path) => handleDocumentChange('cv', path)}
                  accept=".pdf,.doc,.docx,image/*"
                />
                <FileUpload
                  label="Upload Transcript *"
                  value={formData.transcript}
                  onChange={(path) => handleDocumentChange('transcript', path)}
                  accept=".pdf,.doc,.docx,image/*"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
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
                    Submitting...
                  </span>
                ) : (
                  'Submit Registration'
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

export default FreshGraduates;
