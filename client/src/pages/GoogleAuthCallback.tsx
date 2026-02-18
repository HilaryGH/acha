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
      // Handle error - redirect to login with error message
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/?error=' + encodeURIComponent(error));
      return;
    }

    if (token && userParam) {
      try {
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', userParam);
        
        // Redirect to home page
        navigate('/home');
        // Reload to update navbar
        window.location.reload();
      } catch (err) {
        console.error('Error processing Google auth callback:', err);
        navigate('/?error=' + encodeURIComponent('Failed to process authentication'));
      }
    } else {
      // Missing parameters
      navigate('/?error=' + encodeURIComponent('Authentication failed. Missing parameters.'));
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
