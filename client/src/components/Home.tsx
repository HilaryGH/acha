import { Link } from 'react-router-dom'
import TripsAndOrdersSection from './TripsAndOrdersSection'
import CommunicationWidget from './CommunicationWidget'

function Home() {
  return (
    <div className="w-full bg-white">
      {/* Hero Section - Professional & Modern */}
      <section className="relative min-h-[60vh] md:min-h-[75vh] flex items-start justify-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50 pt-4 md:pt-6">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 pt-4 md:pt-6 pb-8 md:pb-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-4 md:space-y-6 w-full">
              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Acha Delivery
              </h1>

              {/* Amharic Subtitle */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-green-500 to-green-700 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                አቻ ደሊቨሪ
              </h2>

              {/* Tagline */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Your trusted delivery partner
              </p>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-lg rounded-tr-2xl rounded-bl-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #0891b2 50%, #0d9488 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)';
                  }}
                >
                  <span>Get Started</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">1000+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">50+</div>
                  <div className="text-sm text-gray-600">Cities</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">97%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative lg:block flex justify-center items-center">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200 rounded-full opacity-20 blur-2xl animate-float"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-green-300 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                
                {/* Main Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-green-700/20 z-10"></div>
              <img
                src="/acha hero.jpg"
                    alt="Acha Delivery - Fast & Reliable Delivery Services"
                    className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 via-transparent to-transparent"></div>
                </div>

                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-green-100 animate-float hidden md:block" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Verified Partners</div>
                      <div className="text-sm text-gray-600">Trusted & Safe</div>
                    </div>
                        </div>
                      </div>

                {/* Another Floating Card */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-green-100 animate-float hidden lg:block" style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Fast Delivery</div>
                      <div className="text-sm text-gray-600">24/7 Service</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            className="relative block w-full h-16 md:h-24"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 C288,80 1152,40 1440,80 L1440,120 L0,120 Z"
              fill="white"
            />
          </svg>
                  </div>
      </section>

      {/* Delivery Section - Professional & Attractive */}
      <section className="relative py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 mb-2 md:mb-3 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="flex flex-col lg:flex-row items-center min-h-[300px] md:min-h-[400px] lg:min-h-[450px]">
              {/* Left Side - Content */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start px-8 md:px-12 lg:px-16 py-12 md:py-16 bg-gradient-to-br from-green-50 via-white to-green-50/30">
                <div className="text-center lg:text-left max-w-lg">
                  {/* Icon Badge */}
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-6 transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  {/* Main Heading */}
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
                    Delivery
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-lg md:text-xl lg:text-2xl text-gray-700 font-medium mb-6 leading-relaxed">
                    Fast, Reliable, and Secure Delivery Services
                  </p>
                  
                  {/* Description */}
                  <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
                    Experience seamless delivery solutions tailored to your needs. Our professional network ensures your packages reach their destination safely and on time.
                  </p>
                  
                  {/* CTA Button */}
                  <Link
                    to="/delivery-requests/list"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-bold text-base md:text-lg rounded-tr-2xl rounded-bl-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <span>Explore Delivery</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
              
              {/* Right Side - Image */}
              <div className="w-full lg:w-1/2 flex items-center justify-center px-8 md:px-12 lg:px-16 py-12 md:py-16 bg-gradient-to-br from-white via-blue-50/30 to-white relative">
                <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg">
                  {/* Floating Animation Container */}
                  <div className="relative animate-float">
                    <img
                      src="/Delivery.svg"
                      alt="Delivery Services"
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                  
                  {/* Decorative Circles */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue Section - Compact */}
      <section className="relative py-6 md:py-8 px-4 sm:px-6 lg:px-8 xl:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Service Cards Grid - Compact - Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
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
            
            {/* Wanaw Gifting */}
            <div 
              className="relative shadow-md overflow-hidden rounded-2xl h-32 md:h-48 flex flex-row md:flex-col"
              style={{ borderRadius: '0 2rem 0 2rem' }}
            >
              {/* Background Image - Right side on mobile */}
              <div className="w-1/2 md:w-full md:absolute md:inset-0">
                <img 
                  src="/Acha Surprise Gift.png" 
                  alt="Wanaw Gifting"
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
                  Acha Gifting
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

          {/* Service Cards Scrolling - Desktop */}
          <div className="hidden lg:block overflow-hidden">
            <div className="flex gap-8 animate-scroll-right">
              {/* First set of cards */}
              <div className="flex gap-8 flex-shrink-0">
                {/* Delivery Partners */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Delivery partners.png" 
                    alt="Delivery Partners"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>

                {/* Acha Sisters Delivery Partner */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Acha Sisters Delivery Partner.png" 
                    alt="Acha Sisters Delivery Partner"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>
                
                {/* Wanaw Gifting */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Acha Surprise Gift.png" 
                    alt="Wanaw Gifting"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>

                {/* Acha Movers & Packers */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Acha Movers & Packers.png" 
                    alt="Acha Movers & Packers"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>
              </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex gap-8 flex-shrink-0">
                {/* Delivery Partners */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Delivery partners.png" 
                    alt="Delivery Partners"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>

                {/* Acha Sisters Delivery Partner */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Acha Sisters Delivery Partner.png" 
                    alt="Acha Sisters Delivery Partner"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>
                
                {/* Wanaw Gifting */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Acha Surprise Gift.png" 
                    alt="Wanaw Gifting"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>

                {/* Acha Movers & Packers */}
                <div 
                  className="relative shadow-md overflow-hidden rounded-2xl h-48 flex-shrink-0 w-[280px]"
                  style={{ borderRadius: '0 2rem 0 2rem' }}
                >
                  <img 
                    src="/Acha Movers & Packers.png" 
                    alt="Acha Movers & Packers"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '0 2rem 0 2rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trips and Orders Section */}
      <TripsAndOrdersSection />

      {/* Partner With Us, Women Initiatives & Premium Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 bg-gradient-to-br from-gray-50 via-white to-green-50 overflow-hidden">
        {/* Green Wave Design at Top */}
        <div className="absolute top-0 left-0 w-full h-24 md:h-32 z-0 overflow-hidden leading-[0]">
          <svg 
            className="relative block w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M1440,0 C1152,80 288,0 0,80 L0,0 L1440,0 Z" 
              fill="url(#greenGradient)"
            />
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#22c55e', stopOpacity: 0.9 }} />
                <stop offset="100%" style={{ stopColor: '#4ade80', stopOpacity: 0.7 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Partner With Us */}
            <div className="bg-white p-8 rounded-tr-3xl rounded-bl-3xl shadow-md text-center border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Partner With Us
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Invest / Partner With Us - Join us in revolutionizing the delivery and travel industry
              </p>
              <Link 
                to="/partner-with-us"
                className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-tr-2xl rounded-bl-2xl font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #0891b2 50%, #0d9488 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)';
                }}
              >
                  Join In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
              </Link>
            </div>

            {/* Women Initiatives */}
            <div className="bg-white p-8 rounded-tr-3xl rounded-bl-3xl shadow-md text-center border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Women Initiatives
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Join Women Initiatives - Empower yourself and join our community of amazing women
              </p>
              <Link 
                to="/women-initiatives"
                className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-tr-2xl rounded-bl-2xl font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #0891b2 50%, #0d9488 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)';
                }}
              >
                  Join In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
              </Link>
            </div>

            {/* Premium Community */}
            <div className="bg-white p-8 rounded-tr-3xl rounded-bl-3xl shadow-md text-center border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acha Premium Community
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Join our premium community - Exclusive benefits for delivery partners and corporate clients
              </p>
              <Link 
                to="/premium"
                className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-tr-2xl rounded-bl-2xl font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #0891b2 50%, #0d9488 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)';
                }}
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
      <section className="relative py-8 md:py-12 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden">
        {/* Blue Wave Background */}
        <div className="absolute top-0 left-0 w-full h-24 md:h-32 z-0 overflow-hidden leading-[0]">
          <svg 
            className="relative block w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M1440,0 C1152,80 288,0 0,80 L0,0 L1440,0 Z" 
              fill="url(#blueGradient)"
            />
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#60a5fa', stopOpacity: 0.9 }} />
                <stop offset="100%" style={{ stopColor: '#93c5fd', stopOpacity: 0.7 }} />
              </linearGradient>
            </defs>
          </svg>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-semibold rounded-tr-2xl rounded-bl-2xl hover:from-green-700 hover:to-green-800 transition-colors duration-300 shadow-md"
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
