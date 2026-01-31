import { Link } from 'react-router-dom'
import TripsAndOrdersSection from './TripsAndOrdersSection'
import CommunicationWidget from './CommunicationWidget'

function Home() {
  return (
    <div className="w-full bg-white">
      {/* Hero Section - First Page Only */}
      <section className="relative h-[25vh] min-h-[120px] md:h-[35vh] sm:min-h-[180px] md:min-h-[250px] flex items-center justify-center overflow-hidden bg-gray-100 py-1 md:py-2 mb-4 md:mb-6">
        <div className="w-[95%] max-w-7xl h-full mx-auto relative">
          <div className="h-full flex md:flex-row flex-col bg-gradient-to-br from-green-600 via-green-500 to-green-700 rounded-2xl md:rounded-3xl shadow-lg overflow-hidden relative">
            {/* Background Image for Mobile */}
            <div className="absolute inset-0 md:hidden z-0">
              <img
                src="/acha hero.jpg"
                alt="Fast & Reliable Delivery"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
                    </div>

                    {/* Left Side - Content */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-3 md:px-4 lg:px-6 xl:px-8 text-white relative z-10 py-1 md:py-0">
              <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 text-white leading-tight">
                Fast & Reliable Delivery
                        </h2>
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold mb-1 md:mb-2 text-green-100 leading-tight">
                Connect with travelers worldwide
                        </h3>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base mb-2 md:mb-3 text-white/90 leading-snug">
                Send and receive items through our trusted network of travelers
                        </p>
                    </div>

            {/* Right Side - Image (Desktop Only) */}
            <div className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/acha hero.jpg"
                  alt="Fast & Reliable Delivery"
                  className="w-full h-full object-cover object-center rounded-xl md:rounded-2xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
      </section>

      {/* Second Section - Combined: Acha Delivery (Left), Image (Center), Global Network (Right) */}
      <section className="relative py-2 md:py-3 px-3 sm:px-4 lg:px-6 xl:px-8 bg-white mb-2 md:mb-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6">
            {/* Left Side - Acha Delivery Content */}
            <div className="w-full lg:w-1/3 flex flex-col justify-start">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 text-green-600 leading-tight">
                Acha Delivery
                        </h2>
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1 md:mb-2 text-green-600 leading-tight">
                አቻ ደሊቨሪ
                        </h3>
              <p className="text-sm sm:text-base md:text-lg mb-2 md:mb-3 text-green-700 leading-snug">
                Your trusted delivery partner
                        </p>
                        <Link
                          to="/register"
                className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-1 md:px-1.5 py-0.5 md:py-1 rounded-full font-bold text-[9px] md:text-[10px] transition-colors duration-300 shadow-sm w-fit"
                        >
                Get Started
                        </Link>
                      </div>

            {/* Center - Image */}
            <div className="w-full lg:w-1/3 flex items-start justify-center self-start">
              <div className="relative w-full max-w-[280px] md:max-w-[350px]">
                <img
                  src="/Delivery.svg"
                  alt="Delivery"
                  className="w-full h-full object-contain object-top"
                />
                    </div>
                  </div>

            {/* Right Side - Global Network Content */}
            <div className="w-full lg:w-1/3 flex flex-col justify-start">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 text-green-600 leading-tight">
                Global Network
                        </h2>
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1 md:mb-2 text-green-600 leading-tight">
                Reach anywhere, anytime
                          </h3>
              <p className="text-sm sm:text-base md:text-lg mb-2 md:mb-3 text-green-700 leading-snug">
                Connect with delivery partners across the globe
              </p>
                        <Link
                          to="/register"
                className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-1 md:px-1.5 py-0.5 md:py-1 rounded-full font-bold text-[9px] md:text-[10px] transition-colors duration-300 shadow-sm w-fit"
                        >
                Join Now
                        </Link>
                      </div>
                  </div>
                </div>
      </section>

      {/* Catalogue Section - Compact */}
      <section className="relative py-6 md:py-8 px-4 sm:px-6 lg:px-8 xl:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Service Cards Grid - Compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Delivery Partners */}
            <div 
              className="relative shadow-md overflow-hidden rounded-2xl h-32 md:h-48 flex flex-row md:flex-col"
              style={{ borderRadius: '0 2rem 0 2rem' }}
            >
              {/* Background Image - Right side on mobile */}
              <div className="w-1/2 md:w-full md:absolute md:inset-0">
                <img 
                  src="/Delivery partners.png" 
                  alt="Delivery Partners"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                />
              </div>
              
              {/* Icon at top of card */}
              <div className="absolute top-0 left-0 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center z-20" style={{ borderRadius: '0 2rem 0 2rem', backgroundColor: '#2563eb' }}>
                <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              
              {/* Content - Left side on mobile, bottom on desktop */}
              <div className="w-1/2 md:w-full md:absolute md:bottom-0 flex flex-col justify-center md:justify-end px-3 py-3 md:px-4 md:py-5 z-10 bg-white md:bg-transparent md:bg-gradient-to-b md:from-transparent md:via-black/10 md:to-black/30 relative" style={{ borderRadius: '0 0 0 2rem' }}>
                <h3 className="text-xs md:text-base font-bold text-green-600 md:text-white md:drop-shadow-lg mb-1 md:mb-1.5 relative z-10">
                  Delivery Partners
                </h3>
                <p className="text-[10px] md:text-xs text-gray-700 md:text-white md:drop-shadow-md leading-tight md:leading-relaxed relative z-10">
                  Professional delivery partners ready to serve you
                </p>
              </div>
            </div>

            {/* Acha Sisters Delivery Partner */}
            <div 
              className="relative shadow-md overflow-hidden rounded-2xl h-32 md:h-48 flex flex-row md:flex-col"
              style={{ borderRadius: '0 2rem 0 2rem' }}
            >
              {/* Background Image - Right side on mobile */}
              <div className="w-1/2 md:w-full md:absolute md:inset-0">
                <img 
                  src="/Acha Sisters Delivery Partner.png" 
                  alt="Acha Sisters Delivery Partner"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                />
              </div>
              
              {/* Icon at top of card */}
              <div className="absolute top-0 left-0 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center z-20" style={{ borderRadius: '0 2rem 0 2rem', backgroundColor: '#2563eb' }}>
                <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              
              {/* Content - Left side on mobile, bottom on desktop */}
              <div className="w-1/2 md:w-full md:absolute md:bottom-0 flex flex-col justify-center md:justify-end px-3 py-3 md:px-4 md:py-5 z-10 bg-white md:bg-transparent md:bg-gradient-to-b md:from-transparent md:via-black/10 md:to-black/30 relative" style={{ borderRadius: '0 0 0 2rem' }}>
                <h3 className="text-xs md:text-base font-bold text-green-600 md:text-white md:drop-shadow-lg mb-1 md:mb-1.5 relative z-10">
                  Acha Sisters Delivery Partner
                </h3>
                <p className="text-[10px] md:text-xs text-gray-700 md:text-white md:drop-shadow-md leading-tight md:leading-relaxed relative z-10">
                  Empowering women in delivery services
                </p>
              </div>
            </div>
            
            {/* Acha Surprise Gift */}
            <div 
              className="relative shadow-md overflow-hidden rounded-2xl h-32 md:h-48 flex flex-row md:flex-col"
              style={{ borderRadius: '0 2rem 0 2rem' }}
            >
              {/* Background Image - Right side on mobile */}
              <div className="w-1/2 md:w-full md:absolute md:inset-0">
                <img 
                  src="/Acha Surprise Gift.png" 
                  alt="Acha Surprise Gift"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                />
              </div>
              
              {/* Icon at top of card */}
              <div className="absolute top-0 left-0 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center z-20" style={{ borderRadius: '0 2rem 0 2rem', backgroundColor: '#2563eb' }}>
                <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              
              {/* Content - Left side on mobile, bottom on desktop */}
              <div className="w-1/2 md:w-full md:absolute md:bottom-0 flex flex-col justify-center md:justify-end px-3 py-3 md:px-4 md:py-5 z-10 bg-white md:bg-transparent md:bg-gradient-to-b md:from-transparent md:via-black/10 md:to-black/30 relative" style={{ borderRadius: '0 0 0 2rem' }}>
                <h3 className="text-xs md:text-base font-bold text-green-600 md:text-white md:drop-shadow-lg mb-1 md:mb-1.5 relative z-10">
                  Acha Surprise Gift
                </h3>
                <p className="text-[10px] md:text-xs text-gray-700 md:text-white md:drop-shadow-md leading-tight md:leading-relaxed relative z-10">
                  Gift Products, Gift Packages, Gift Bundles - Beautifully curated gifts for every occasion
                </p>
              </div>
            </div>

            {/* Acha Movers & Packers */}
            <div 
              className="relative shadow-md overflow-hidden rounded-2xl h-32 md:h-48 flex flex-row md:flex-col"
              style={{ borderRadius: '0 2rem 0 2rem' }}
            >
              {/* Background Image - Right side on mobile */}
              <div className="w-1/2 md:w-full md:absolute md:inset-0">
                <img 
                  src="/Acha Movers & Packers.png" 
                  alt="Acha Movers & Packers"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                />
              </div>
              
              {/* Icon at top of card */}
              <div className="absolute top-0 left-0 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center z-20" style={{ borderRadius: '0 2rem 0 2rem', backgroundColor: '#2563eb' }}>
                <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              {/* Content - Left side on mobile, bottom on desktop */}
              <div className="w-1/2 md:w-full md:absolute md:bottom-0 flex flex-col justify-center md:justify-end px-3 py-3 md:px-4 md:py-5 z-10 bg-white md:bg-transparent md:bg-gradient-to-b md:from-transparent md:via-black/10 md:to-black/30 relative" style={{ borderRadius: '0 0 0 2rem' }}>
                <h3 className="text-xs md:text-base font-bold text-green-600 md:text-white md:drop-shadow-lg mb-1 md:mb-1.5 relative z-10">
                  Acha Movers & Packers
              </h3>
                <p className="text-[10px] md:text-xs text-gray-700 md:text-white md:drop-shadow-md leading-tight md:leading-relaxed relative z-10">
                  Professional moving and packing services
                  </p>
              </div>
            </div>
                </div>
              </div>
      </section>

      {/* Trips and Orders Section */}
      <TripsAndOrdersSection />

      {/* Partner With Us, Women Initiatives & Premium Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 bg-gradient-to-br from-gray-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Partner With Us */}
            <div className="bg-white p-8 rounded-3xl shadow-md text-center border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-md">
                🤝
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Partner With Us
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Invest / Partner With Us - Join us in revolutionizing the delivery and travel industry
              </p>
              <Link 
                to="/partner-with-us"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold text-base transition-colors duration-300 shadow-md"
              >
                  Join In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
              </Link>
            </div>

            {/* Women Initiatives */}
            <div className="bg-white p-8 rounded-3xl shadow-md text-center border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-md">
                👩
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Women Initiatives
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Join Women Initiatives - Empower yourself and join our community of amazing women
              </p>
              <Link 
                to="/women-initiatives"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold text-base transition-colors duration-300 shadow-md"
              >
                  Join In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
              </Link>
            </div>

            {/* Premium Community */}
            <div className="bg-white p-8 rounded-3xl shadow-md text-center border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-md">
                ⭐
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acha Premium Community
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Join our premium community - Exclusive benefits for delivery partners and corporate clients
              </p>
              <Link 
                to="/premium"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold text-base transition-colors duration-300 shadow-md"
              >
                  Join In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beautiful Compact Info Section - Before Footer */}
      <section className="relative py-8 md:py-12 px-4 sm:px-6 lg:px-8 xl:px-12 bg-gradient-to-br from-white via-green-50/30 to-gray-50 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Compact Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            
            {/* How It Works - Beautiful Card */}
            <div className="relative bg-gradient-to-br from-white to-green-50/50 p-5 md:p-6 border border-green-100/50 shadow-md overflow-hidden" style={{ borderRadius: '0 5rem 0 5rem' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-xl shadow-md">
                    ✈️
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-green-600">
                    How It Works
                  </h3>
                </div>
                
                <p className="text-xs md:text-sm text-gray-600 mb-4 leading-relaxed">
                  Connect with travelers and delivery partners to send and receive items safely and efficiently
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-white/60">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      ✈️
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800 mb-0.5">Post Your Trip</p>
                      <p className="text-xs text-gray-600 leading-relaxed">Share your travel date and destination</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-white/60">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      📦
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800 mb-0.5">Find Travelers</p>
                      <p className="text-xs text-gray-600 leading-relaxed">Search for travelers going to your destination</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-white/60">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      🤝
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800 mb-0.5">Connect & Deliver</p>
                      <p className="text-xs text-gray-600 leading-relaxed">Coordinate pickup and delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Acha - Beautiful Card */}
            <div className="relative bg-gradient-to-br from-white to-green-50/50 p-5 md:p-6 border border-green-100/50 shadow-md overflow-hidden" style={{ borderRadius: '0 5rem 0 5rem' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md overflow-hidden">
                    <img src="/acha.png" alt="Acha Logo" className="h-6 w-auto object-contain" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-green-600">
                    Why Choose Acha?
                  </h3>
                </div>
                
                <p className="text-xs md:text-sm text-gray-600 mb-4 leading-relaxed">
                  Experience the benefits of peer-to-peer delivery
                </p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/50">
                    <div className="text-lg mb-1">💰</div>
                    <p className="text-xs font-bold text-gray-800 mb-0.5">Cost Effective</p>
                    <p className="text-xs text-gray-600">Save money</p>
                  </div>
                  
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50">
                    <div className="text-lg mb-1">⚡</div>
                    <p className="text-xs font-bold text-gray-800 mb-0.5">Fast Delivery</p>
                    <p className="text-xs text-gray-600">Quick delivery</p>
                  </div>
                  
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                    <div className="text-lg mb-1">🔒</div>
                    <p className="text-xs font-bold text-gray-800 mb-0.5">Secure & Safe</p>
                    <p className="text-xs text-gray-600">Trusted travelers</p>
                  </div>
                  
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                    <div className="text-lg mb-1">🌍</div>
                    <p className="text-xs font-bold text-gray-800 mb-0.5">Global Network</p>
                    <p className="text-xs text-gray-600">Worldwide reach</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Us - Beautiful Card */}
            <div className="relative bg-gradient-to-br from-white to-green-50/50 p-5 md:p-6 border border-green-100/50 shadow-md overflow-hidden" style={{ borderRadius: '0 5rem 0 5rem' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-md">
                    ℹ️
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-green-600">
                    About Us
                  </h3>
        </div>

                <p className="text-xs md:text-sm text-gray-700 mb-3 leading-relaxed">
                  <span className="font-bold text-green-600">Acha Delivery</span> is a peer-to-peer delivery and local delivery partner marketplace platform headquartered in <span className="font-semibold text-gray-800">Addis Ababa, Ethiopia</span>.
                </p>
                
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  As a peer-to-peer marketplace, it links international and domestic travelers (acting as carriers) with buyers, senders, and recipients. Additionally, Acha Delivery serves as a delivery partner marketplace, connecting clients with verified local delivery partners.
                </p>
                
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-colors duration-300 shadow-md"
                >
                  <span>Read More About Us</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
            </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Communication Widget - Fixed at bottom right */}
      <CommunicationWidget />
    </div>
  );
}

export default Home;
