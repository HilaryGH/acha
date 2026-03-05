import { Link } from 'react-router-dom';

function JoinCommunity() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Communities</h1>
          <p className="text-lg text-gray-600">
            Choose the community that best fits your interests and goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Partner With Us Card */}
          <Link to="/partner-with-us" className="block">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0" style={{ 
                  background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 100%)'
                }}>
                  🤝
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Invest / Partner With Us</h3>
              </div>
              <p className="text-gray-600 mb-6 flex-grow">
                Join us in revolutionizing the delivery and travel industry
              </p>
              <div className="flex items-center text-blue-600 font-semibold">
                <span>Join In</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Women Initiatives Card */}
          <Link to="/women-initiatives" className="block">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0" style={{ 
                  background: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)'
                }}>
                  👩
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Women Initiatives</h3>
              </div>
              <p className="text-gray-600 mb-6 flex-grow">
                Empower yourself and join our community of amazing women
              </p>
              <div className="flex items-center text-pink-600 font-semibold">
                <span>Join In</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Acha Premium Community Card */}
          <Link to="/premium" className="block">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0" style={{ 
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                }}>
                  ⭐
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Acha Premium Community</h3>
              </div>
              <p className="text-gray-600 mb-6 flex-grow">
                Join our premium community - Exclusive benefits for delivery partners and corporate clients
              </p>
              <div className="flex items-center text-yellow-600 font-semibold">
                <span>Join In</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Professionals Community Card */}
          <Link to="/professionals-community" className="block">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0" style={{ 
                  background: 'linear-gradient(135deg, #43A047 0%, #66BB6A 100%)'
                }}>
                  🏥
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Professionals Community</h3>
              </div>
              <p className="text-gray-600 mb-6 flex-grow">
                Join Professionals Community - Connect with healthcare and wellness professionals in our growing network. Generate your certificate upon registration.
              </p>
              <div className="flex items-center text-green-600 font-semibold">
                <span>Join In</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default JoinCommunity;
