import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import IndividualForm from './forms/IndividualForm';
import DeliveryPartnerForm from './forms/DeliveryPartnerForm';
import AchaSistersDeliveryPartnerForm from './forms/AchaSistersDeliveryPartnerForm';
import GiftDeliveryPartnerForm from './forms/GiftDeliveryPartnerForm';
import AchaMoversPackersForm from './forms/AchaMoversPackersForm';
import CorporateForm from './forms/CorporateForm';

type RegistrationType = 'individual' | 'delivery-partner' | 'acha-sisters-delivery-partner' | 'gift-delivery-partner' | 'acha-movers-packers' | 'corporate' | null;
type ViewMode = 'signin' | 'register';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('signin');
  const [registrationType, setRegistrationType] = useState<RegistrationType>(null);
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);

    try {
      const response = await api.users.login(signInData) as { status?: string; message?: string; data?: { user?: any; token?: string } };
      
      if (response.status === 'success' && response.data) {
        // Store user data and token
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // Close modal and redirect to home
        onClose();
        navigate('/home');
        // Reload page to update navbar
        window.location.reload();
      }
    } catch (error: any) {
      setSignInError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google sign in
    console.log('Google sign in');
  };

  const handleFacebookSignIn = async () => {
    // TODO: Implement Facebook sign in
    console.log('Facebook sign in');
  };

  const handleClose = () => {
    setViewMode('signin');
    setRegistrationType(null);
    setSignInData({ email: '', password: '' });
    onClose();
  };

  // If registration type is selected, show the registration form
  if (registrationType) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <button
              onClick={() => setRegistrationType(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            {registrationType === 'individual' && <IndividualForm />}
            {registrationType === 'delivery-partner' && <DeliveryPartnerForm />}
            {registrationType === 'acha-sisters-delivery-partner' && <AchaSistersDeliveryPartnerForm />}
            {registrationType === 'gift-delivery-partner' && <GiftDeliveryPartnerForm isModal={true} onSuccess={handleClose} />}
            {registrationType === 'acha-movers-packers' && <AchaMoversPackersForm />}
            {registrationType === 'corporate' && <CorporateForm />}
          </div>
        </div>
      </div>
    );
  }

  // Registration type selection view
  if (viewMode === 'register') {
    const registrationTypes = [
      { id: 'individual' as const, title: 'Individual', description: 'Register as an individual user' },
      { id: 'delivery-partner' as const, title: 'Delivery Partner', description: 'Join our delivery network and start earning.' },
      { id: 'acha-sisters-delivery-partner' as const, title: 'Acha Sisters Delivery Partner', description: 'Join our delivery network and start earning.' },
      { id: 'gift-delivery-partner' as const, title: 'Acha Surprise Gift Delivery Partner', description: 'Register as a gift delivery partner and offer your gift services' },
      { id: 'acha-movers-packers' as const, title: 'Acha Movers & Packers', description: 'Register as a movers and packers service provider' },
      { id: 'corporate' as const, title: 'Corporate', description: 'Register as a corporate entity' },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Register</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-6 text-center">Choose your role to get started</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Role <span className="text-red-500">*</span>
              </label>
              <select
                value={registrationType || ''}
                onChange={(e) => setRegistrationType(e.target.value as RegistrationType)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                <option value="">-- Select a role --</option>
                {registrationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setViewMode('signin')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sign In view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Sign In</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-3">
            {signInError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs">
                {signInError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3" />
                <span className="ml-1.5 text-xs text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-xs text-blue-600 hover:text-blue-800">
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              disabled={signInLoading}
              className="w-full py-2 px-4 rounded-lg text-sm text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
            >
              {signInLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            
            {/* Social Sign In Buttons */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-2 px-4 rounded-lg border-2 border-gray-300 text-xs text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button
                onClick={handleFacebookSignIn}
                className="w-full py-2 px-4 rounded-lg border-2 border-gray-300 text-xs text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setViewMode('register')}
                className="w-full py-2 px-4 rounded-lg border-2 border-gray-300 text-xs text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInModal;

