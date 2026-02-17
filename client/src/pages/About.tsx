import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Banner */}
      <section className="relative py-8 md:py-12 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-tr-2xl rounded-bl-2xl text-gray-700 hover:text-gray-900 hover:bg-white transition-all duration-300 font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block mb-4">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 via-cyan-100 to-green-100 rounded-full text-sm font-semibold text-gray-700 mb-4">
                Our Story
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight">
              <span className="bg-clip-text text-transparent" style={{ 
                background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                About Acha Delivery
              </span>
            </h1>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ 
              background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)'
            }}></div>
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="relative py-8 md:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-7xl mx-auto">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-green-600 rounded-tr-3xl rounded-bl-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
            
            <div className="relative bg-white rounded-tr-3xl rounded-bl-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative group/image h-full min-h-[450px] md:min-h-[550px] lg:min-h-[600px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-green-600/10 z-10"></div>
                  <img 
                    src="/about.jpg" 
                    alt="About Acha Delivery" 
                    className="w-full h-full object-cover transform group-hover/image:scale-110 transition-transform duration-700"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/20 pointer-events-none"></div>
                  
                  {/* Decorative corner elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-600/20 to-transparent rounded-bl-full"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-600/20 to-transparent rounded-tr-full"></div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50/50">
                  <div className="space-y-6 md:space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-full"></div>
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Who We Are</span>
                    </div>
                    
                    <p className="text-gray-800 text-lg md:text-xl leading-relaxed">
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 text-2xl">Acha Delivery</span> is a peer-to-peer delivery and local delivery partner marketplace platform headquartered in <span className="font-semibold text-gray-900">Addis Ababa, Ethiopia</span>.
                    </p>

                    <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
                      As a peer-to-peer marketplace, it links international and domestic travelers (acting as carriers) with buyers, senders, and recipients.
                    </p>

                    <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
                      Additionally, Acha Delivery serves as a delivery partner marketplace, connecting clients with verified local delivery partners — including bicycle riders, e-bike riders, and motorcycle couriers — for fast, on-demand delivery services within Ethiopia.
                    </p>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-medium">
                        This dual approach makes Acha Delivery a smart, sustainable solution for both cross-border and local shipping needs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-green-50/50"></div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'linear-gradient(135deg, #43A047 0%, #26C6DA 50%, #1E88E5 100%)' }}></div>
        
        <div className="relative w-full max-w-7xl mx-auto z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-block mb-4">
              <span className="inline-block px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-md">
                Our Purpose
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
              <span className="bg-clip-text text-transparent" style={{ 
                background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Mission & Vision
              </span>
            </h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ 
              background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)'
            }}></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {/* Mission Card */}
            <div className="group relative">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-tr-3xl rounded-bl-3xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <div className="relative bg-white rounded-tr-3xl rounded-bl-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 overflow-hidden p-8 md:p-10 lg:p-12 h-full">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-blue-600 to-cyan-500"></div>
                
                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg" style={{ 
                    background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 100%)',
                    boxShadow: '0 8px 25px rgba(30, 136, 229, 0.4)'
                  }}>
                    🎯
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    Mission
                  </h2>
                  <p className="text-gray-700 text-base md:text-lg leading-relaxed italic">
                    "Acha Delivery connects travelers with spare luggage space and verified local delivery partners (cycle, e-bike, and motorcycle riders) to provide affordable, reliable, and sustainable delivery solutions for domestic and international senders across Ethiopia — making every trip and ride count while saving time and money for everyone involved."
                  </p>
                </div>
              </div>
            </div>

            {/* Vision Card */}
            <div className="group relative">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-green-600 rounded-tr-3xl rounded-bl-3xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <div className="relative bg-white rounded-tr-3xl rounded-bl-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 overflow-hidden p-8 md:p-10 lg:p-12 h-full">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-cyan-500 to-green-600"></div>
                
                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg" style={{ 
                    background: 'linear-gradient(135deg, #26C6DA 0%, #43A047 100%)',
                    boxShadow: '0 8px 25px rgba(67, 160, 71, 0.4)'
                  }}>
                    👁️
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                    Vision
                  </h2>
                  <p className="text-gray-700 text-base md:text-lg leading-relaxed italic">
                    "To become the leading peer-to-peer and on-demand delivery ecosystem in Ethiopia at 2030, transforming how people and goods move efficiently, affordably, and sustainably across borders and communities."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Motto Section */}
      <section className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-green-600 rounded-tr-3xl rounded-bl-3xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white rounded-tr-3xl rounded-bl-3xl shadow-2xl p-12 md:p-16 lg:p-20 border border-gray-100 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'linear-gradient(135deg, #43A047 0%, #26C6DA 50%, #1E88E5 100%)' }}></div>
              
              <div className="relative z-10 text-center">
                <div className="inline-block mb-8">
                  <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl mx-auto shadow-2xl transform hover:scale-110 transition-transform duration-300" style={{ 
                    background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)',
                    boxShadow: '0 10px 40px rgba(30, 136, 229, 0.4)'
                  }}>
                    💎
                  </div>
                </div>
                <p className="text-base md:text-lg text-gray-600 mb-6 font-semibold uppercase tracking-wider">Our Motto</p>
                <p className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold bg-clip-text text-transparent leading-tight" style={{ 
                  background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  "Unmatched Delivery"
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="w-32 h-1 rounded-full" style={{ 
                    background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
