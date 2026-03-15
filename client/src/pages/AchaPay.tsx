import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AchaPayForm from '../components/forms/AchaPayForm';
import SignInModal from '../components/SignInModal';
import { isAuthenticated } from '../utils/auth';

function AchaPay() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const auth = isAuthenticated();
      setAuthenticated(auth);
      setLoading(false);
      
      // If user just logged in, close the modal
      if (auth && isSignInModalOpen) {
        setIsSignInModalOpen(false);
      }
    };
    checkAuth();
    
    // Listen for login events (e.g., from Google OAuth callback)
    const handleLogin = () => {
      checkAuth();
    };
    window.addEventListener('login', handleLogin);
    window.addEventListener('storage', handleLogin);
    
    return () => {
      window.removeEventListener('login', handleLogin);
      window.removeEventListener('storage', handleLogin);
    };
  }, [isSignInModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not logged in
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 py-8 md:py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Account Required</h2>
              <p className="text-gray-600 text-lg mb-2">
                You need to create an account to access Acha Pay.
              </p>
              <p className="text-gray-500 text-sm">
                Please sign in or create an account to continue with your payment request.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                to="/register"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)' }}
              >
                Create Account
              </Link>
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Sign In
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
            
            {/* Sign In Modal with custom handler to stay on Acha Pay page */}
            <SignInModal 
              isOpen={isSignInModalOpen} 
              onClose={() => setIsSignInModalOpen(false)}
              onSignInSuccess={() => {
                // Update authentication state and show the form without navigating away
                setAuthenticated(true);
                setIsSignInModalOpen(false);
                // Trigger navbar update without full page reload
                window.dispatchEvent(new Event('login'));
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 py-8 md:py-12">
      <AchaPayForm />
    </div>
  );
}

export default AchaPay;












