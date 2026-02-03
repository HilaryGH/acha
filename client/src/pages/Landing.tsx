import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNavigateToMain = () => {
    navigate('/home');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/Acha.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
              Acha Delivery
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 drop-shadow-lg">
              Fast & Reliable Delivery Services
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for trips, orders, or delivery items..."
                className="w-full px-6 py-4 text-base rounded-full bg-white/95 backdrop-blur-sm border-2 border-white/50 shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-full font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </form>

          {/* Call-to-Action Section - Transparent */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Your Journey Starts Here
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-6 leading-relaxed drop-shadow-lg">
              Connect with travelers worldwide. Send and receive items faster, safer, and smarter.
            </p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-8 drop-shadow-lg">
              Join thousands of satisfied customers who trust Acha Delivery for their shipping needs
            </p>
            
            {/* Single Action Button */}
            <button
              onClick={handleNavigateToMain}
              className="group relative px-10 py-5 bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white text-base sm:text-lg font-bold rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 transform overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Explore More
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Up Button - Navigate to Main Page */}
      <button
        onClick={handleNavigateToMain}
        className="fixed bottom-8 right-8 z-20 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 transform flex items-center justify-center group animate-bounce"
        aria-label="Go to main page"
      >
        <svg 
          className="w-8 h-8 group-hover:-translate-y-1 transition-transform duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}

export default Landing;
