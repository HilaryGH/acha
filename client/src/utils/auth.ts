/**
 * Centralized authentication utilities
 */

/**
 * Logs out the current user by:
 * 1. Removing token and user data from localStorage
 * 2. Dispatching a logout event to notify other components
 * 3. Optionally navigating to a specific route
 */
export const logout = (navigate?: (path: string) => void) => {
  // Remove authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Dispatch logout event to notify other components (like Navbar)
  window.dispatchEvent(new Event('logout'));
  
  // Navigate to home page if navigate function is provided
  if (navigate) {
    navigate('/');
  } else {
    // Fallback: reload the page to ensure clean state
    window.location.href = '/';
  }
};

/**
 * Checks if user is currently logged in
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

/**
 * Gets the current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Gets the authentication token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};





