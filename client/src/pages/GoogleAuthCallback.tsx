import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      // Handle error - redirect to home with error message
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Show error message to user
      alert(decodeURIComponent(error));
      navigate('/home');
      return;
    }

    if (token && userParam) {
      try {
        // Parse user data to verify role
        const userData = JSON.parse(decodeURIComponent(userParam));
        
        // Additional check: Ensure user has individual role
        if (userData.role !== 'individual') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('Google login is only available for individual users. Please use email/password login instead.');
          navigate('/home');
          return;
        }

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', userParam);
        
        // Dispatch login event to notify other components (like Navbar)
        window.dispatchEvent(new Event('login'));
        
        // Redirect to home page
        navigate('/home', { replace: true });
      } catch (err) {
        console.error('Error processing Google auth callback:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Failed to process authentication. Please try again.');
        navigate('/home');
      }
    } else {
      // Missing parameters
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Authentication failed. Missing parameters.');
      navigate('/home');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default GoogleAuthCallback;
