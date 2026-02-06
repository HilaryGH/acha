import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignInModal from './SignInModal';
import LanguageSwitcher from './LanguageSwitcher';
import { logout } from '../utils/auth';

function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserName(userData.name);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      setIsLoggedIn(false);
      setUserName(null);
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuthStatus();

    // Listen for storage changes (logout from other tabs/windows)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    // Listen for custom logout event
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom logout event dispatched from same window
    window.addEventListener('logout', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleStorageChange);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page for travelers
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLocationFinder = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (_position) => {
          // Coordinates available but not used for now - prompt user for city name
          // In a production app, you'd reverse geocode to get the city name
          try {
            const cityName = prompt('Please enter your current city name for searching travelers:');
            if (cityName) {
              navigate(`/search?q=${encodeURIComponent(cityName.trim())}`);
            }
          } catch (error) {
            console.error('Error with location:', error);
            alert('Please enter your city name manually in the search box.');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please enter your city name manually in the search box.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter your city name manually in the search box.');
    }
  };

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navbar */}
      <nav className="w-full bg-blue-50 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Desktop Navbar */}
          <div className="hidden md:block">
            <div className="relative flex justify-between items-center h-20 overflow-visible">
              {/* Left Section: Logo */}
              <Link to="/" className="flex items-center gap-2 sm:gap-3 text-gray-900 font-bold hover:opacity-80 transition-opacity duration-300">
                <img 
                  src="/acha.png" 
                  alt="Acha Logo" 
                  className="h-12 md:h-14 w-auto"
                />
                <div className="flex flex-col">
                  <span className="text-xl md:text-2xl leading-tight text-gray-900">Acha Delivery</span>
                  <span className="text-sm md:text-base leading-tight text-gray-600">አቻ ደሊቨሪ</span>
                </div>
              </Link>

              {/* Center Section: Desktop Menu */}
              <div className={`flex items-center gap-6 lg:gap-8 absolute left-[44%] transform -translate-x-1/2`}>
                <Link 
                  to="/" 
                  className="text-gray-700 font-medium text-base relative py-2 transition-colors duration-300 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Home
                </Link>
                <Link 
                  to="/post-trip" 
                  className="text-gray-700 font-medium text-base relative py-2 transition-colors duration-300 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Post Trip
                </Link>
                <Link 
                  to="/post-order" 
                  className="text-gray-700 font-medium text-base relative py-2 transition-colors duration-300 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Post Order
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-700 font-medium text-base relative py-2 transition-colors duration-300 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  About
                </Link>
              </div>

              {/* Right Section: Language Switcher + Search Input + Sign In/Dashboard Button */}
              <div className="flex items-center justify-end gap-3 sm:gap-4 flex-1">
                {/* Language Switcher */}
                <div>
                  <LanguageSwitcher />
                </div>
                
                {/* Search Input with Location Finder */}
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative w-full max-w-xs">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search travelers by destination or location..."
                      className="w-full pl-10 pr-12 py-2 border border-gray-300 bg-gray-50 rounded-tr-xl rounded-bl-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all"
                    />
                    <svg 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <button
                      type="button"
                      onClick={handleLocationFinder}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors duration-300"
                      aria-label="Find location"
                      title="Find my location"
                    >
                      <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                        />
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                        />
                      </svg>
                    </button>
                  </div>
                </form>
                {isLoggedIn ? (
                  <div className="relative group">
                    <Link
                      to="/dashboard"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:translate-y-0 whitespace-nowrap flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {userName ? userName.split(' ')[0] : 'Dashboard'}
                    </Link>
                    <div className="absolute right-0 mt-2 w-48 bg-blue-50 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => logout(navigate)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:translate-y-0 whitespace-nowrap flex items-center gap-2"
                    onClick={() => setIsSignInModalOpen(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navbar */}
          <div className="md:hidden">
            {/* Top Row: Logo, Language Switcher, Login Icon */}
            <div className="flex justify-between items-center h-14 py-2">
              {/* Left Section: Logo */}
              <Link to="/" className="flex items-center gap-2 text-gray-900 font-bold hover:opacity-80 transition-opacity duration-300">
                <img 
                  src="/acha.png" 
                  alt="Acha Logo" 
                  className="h-10 w-auto"
                />
                <div className="flex flex-col">
                  <span className="text-lg leading-tight text-gray-900">Acha Delivery</span>
                  <span className="text-xs leading-tight text-gray-600">አቻ ደሊቨሪ</span>
                </div>
              </Link>

              {/* Right Section: Language Switcher + Login Icon */}
              <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <LanguageSwitcher />
                
                {/* Login Button - Icon Only */}
                {isLoggedIn ? (
                  <div className="relative group">
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-green-600 p-2 transition-colors duration-300"
                      aria-label="Dashboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <div className="absolute right-0 mt-2 w-40 bg-blue-50 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => logout(navigate)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="text-gray-700 hover:text-green-600 p-2 transition-colors duration-300"
                    onClick={() => setIsSignInModalOpen(true)}
                    aria-label="Login"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                )}

                {/* Mobile Menu Button */}
                <button 
                  className={`flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-2 ${isMenuOpen ? 'active' : ''}`}
                  onClick={toggleMenu}
                  aria-label="Toggle menu"
                >
                  <span className={`w-6 h-0.5 bg-gray-700 rounded transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`w-6 h-0.5 bg-gray-700 rounded transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`w-6 h-0.5 bg-gray-700 rounded transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </button>
              </div>
            </div>

            {/* Search Input Row - Below Top Navbar */}
            <div className="pb-3">
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search travelers by destination or location..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-gray-50 rounded-tr-xl rounded-bl-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all"
                    />
                    <svg 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
                <button
                  type="button"
                  onClick={handleLocationFinder}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-tr-xl rounded-bl-xl transition-colors duration-300 flex-shrink-0"
                  aria-label="Find location"
                  title="Find my location"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={toggleMenu}
          ></div>
        )}
        
        {/* Mobile Menu - Slide from Left */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-blue-50 shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <img 
                  src="/acha.png" 
                  alt="Acha Logo" 
                  className="h-8 w-auto"
                />
              </div>
              <button 
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Mobile Menu Links */}
            <div className="flex flex-col flex-1 py-4 px-4 gap-2">
              <Link 
                to="/" 
                className="text-gray-700 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-green-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/post-trip" 
                className="text-gray-700 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-green-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Post Trip
              </Link>
              <Link 
                to="/post-order" 
                className="text-gray-700 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-green-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Post Order
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-green-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              {isLoggedIn ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-green-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout(navigate);
                    }}
                    className="text-left text-red-600 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSignInModalOpen(true);
                  }}
                  className="text-left text-gray-700 font-medium text-base py-3 px-4 rounded-lg transition-colors duration-300 hover:text-green-600 hover:bg-gray-50"
                >
                  Login
                </button>
              )}
              
              {/* Feature Badges */}
              <div className="flex flex-col gap-1.5 px-4 py-2 mt-1">
                <div className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.08) 0%, rgba(38, 198, 218, 0.08) 50%, rgba(67, 160, 71, 0.08) 100%)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm" style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}>
                      <span className="text-[10px]">⚡</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700">Fast Delivery</span>
                  </div>
                </div>
                <div className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(38, 198, 218, 0.08) 0%, rgba(67, 160, 71, 0.08) 50%, rgba(30, 136, 229, 0.08) 100%)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm" style={{ background: 'linear-gradient(135deg, #26C6DA 0%, #43A047 50%, #1E88E5 100%)' }}>
                      <span className="text-[10px]">🔒</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700">Secure & Safe</span>
                  </div>
                </div>
                <div className="group relative overflow-hidden px-2.5 py-1.5 rounded-lg transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(67, 160, 71, 0.08) 0%, rgba(30, 136, 229, 0.08) 50%, rgba(38, 198, 218, 0.08) 100%)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm" style={{ background: 'linear-gradient(135deg, #43A047 0%, #1E88E5 50%, #26C6DA 100%)' }}>
                      <span className="text-[10px]">🌍</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700">Global Network</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu Social Icons */}
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4">
                {/* X (Twitter) */}
                <a href="#" className="hover:text-green-600 transition-colors text-gray-600" aria-label="X (Twitter)" onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="#" className="hover:text-green-600 transition-colors text-gray-600" aria-label="TikTok" onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="hover:text-green-600 transition-colors text-gray-600" aria-label="LinkedIn" onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Facebook */}
                <a href="#" className="hover:text-green-600 transition-colors text-gray-600" aria-label="Facebook" onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="hover:text-green-600 transition-colors text-gray-600" aria-label="Instagram" onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Mobile Menu Footer */}
            <div className="p-4 border-t border-gray-200">
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="block w-full text-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap flex items-center justify-center gap-2"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSignInModalOpen(true);
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <SignInModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
    </div>
  );
}

export default Navbar;
