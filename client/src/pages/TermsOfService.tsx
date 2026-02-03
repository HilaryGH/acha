import { Link } from 'react-router-dom';

function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              to="/home" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              User Terms of Service (ToS) for Acha Delivery
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 lg:p-10">
            
            {/* Introduction */}
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                As a peer-to-peer delivery multi-vendor marketplace headquartered in Addis Ababa, Ethiopia, Acha Delivery operates under Ethiopian law, adhering to critical regulations, including the Civil Code, the Personal Data Protection Proclamation, the Customs Proclamation, and local traffic laws. These Terms of Service (ToS) are designed for Travellers and Delivery Partners, establishing clear guidelines and expectations for all users of the Acha Delivery platform.
              </p>
            </div>

            {/* Section 1: Travellers */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-4 pb-2 border-b-2 border-green-200">
                1. Travellers: Specific Terms of Service
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Elaboration and Description</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Travellers use personal travel itineraries to deliver parcels, acting as incidental carriers rather than professional couriers. This model allows individuals to monetize their journeys while adhering to Ethiopian regulations regarding customs and baggage allowances.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Scope of Service and Capacity</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li><strong>Delivery Services:</strong> You agree to provide delivery services only as an incidental part of your verified travel itinerary. Acha Delivery acts solely as a matching platform.</li>
                    <li><strong>Item Limits:</strong> Deliveries must consist of hand-carry items fitting personal baggage, depending on the mode of transport.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Prohibited Items and Compliance with Law</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>You must not accept or carry prohibited/restricted items, including narcotics, weapons, or hazardous materials, as per Ethiopian law and Customs Proclamations.</li>
                    <li>For international travel, you are responsible for declaring items at customs when required.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Liability</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You are liable for loss, damage, or delay caused by your negligence consistent with civil liability principles.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Protection</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You consent to the processing of your travel itinerary, location data (real-time during active delivery), and contact information in accordance with the Personal Data Protection Proclamation No. 1321/2024.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancellation and Penalties</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You may cancel a delivery up to 2 hours before pickup without penalty. However, repeated cancellations (more than three within 30 days) may result in profile suspension.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Unique Conditions by Type</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li><strong>International:</strong> You assume all customs risks/delays without compensation for missed flights.</li>
                    <li><strong>Domestic/Local:</strong> Comply with Ethiopian Roads Authority rules; avoid overloading vehicles.</li>
                    <li><strong>Urban Pick-and-Drop:</strong> Follow city traffic laws; avoid illegal parking and sidewalk riding.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Indemnity</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You indemnify Acha Delivery against any claims resulting from your breach of customs, traffic, or criminal laws.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Delivery Partners */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-4 pb-2 border-b-2 border-green-200">
                2. Delivery Partners: Specific Terms of Service
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Elaboration and Description</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Delivery Partners operate as independent contractors, providing on-demand delivery services using vehicles or specialized service techniques. They bear higher liability for the safe and timely carriage of goods.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">General for All Delivery Partners</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>You must maintain valid licenses and adhere to traffic laws, including vehicle registration/insurance.</li>
                    <li>You are responsible for ensuring the roadworthiness of your vehicle and compliance with safety regulations.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Liability</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You accept liability for loss, damage, theft, or injury that occurs during carriage.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Protection</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You consent to the processing of your vehicle, location, and other performance data per Proclamation No. 1321/2024. Unauthorized sharing of client or recipient data is strictly prohibited.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Prohibited Conduct</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>You must not carry illegal or hazardous goods and are required to report any accidents within one hour.</li>
                    <li>Consistent poor ratings or complaints can lead to deactivation of your account.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Specific Terms by Partner Type</h3>
                  
                  <div className="ml-4 space-y-4 mt-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Independent Delivery Partners (Cycle, E-Bike, Motorcycle Riders)</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>Limit loads per vehicle type (cycle &lt;5 kg, e-bike &lt;15 kg, motorcycle &lt;30 kg).</li>
                        <li>Comply with local traffic regulations and ensure the use of safety gear.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Movers & Packers Partners</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>Provide accurate volume/weight estimates and use appropriate packing equipment.</li>
                        <li>Adhere to safety standards and labor regulations.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Surprise Gift Delivery Partners</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>Maintain confidentiality and anonymity of gifts unless safety checks are necessary.</li>
                        <li>Timed deliveries are mandatory, and lateness can lead to payment denial.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Acha Sisters Delivery Partners</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>Women-only or women-led teams must prioritize safety, with features like live tracking and emergency buttons.</li>
                        <li>Empowerment bonuses are available based on platform policy.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Payments and Disputes</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Earnings are disbursed daily via mobile money after client confirmation.</li>
                    <li>Dispute resolution occurs through in-app mediation, with potential escalation to Ethiopian courts if necessary (jurisdiction in Addis Ababa).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                For questions or concerns, please contact Acha Delivery support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsOfService;
