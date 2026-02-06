import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CommunicationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Contact information - Update these with actual contact details
  const phoneNumber = '+251911508734'; // Replace with actual phone number
  const whatsappNumber = '+251911508734'; // Replace with actual WhatsApp number
  const email = 'info@achadelivery.com'; // Replace with actual email
  const appChatLink = '/dashboard'; // Link to app chat or dashboard

  const handlePhoneClick = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsAppClick = () => {
    // Open WhatsApp with the number
    const message = encodeURIComponent('Hello, I would like to get in touch with Acha Delivery.');
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`;
  };

  const handleAppChatClick = () => {
    navigate(appChatLink);
  };

  return (
    <>
      {/* Backdrop to close on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50">
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-green-600 via-green-500 to-green-700 text-white shadow-2xl hover:shadow-green-500/50 transition-all duration-300 flex items-center justify-center group ${
            isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
          }`}
          aria-label="Swift Communication - Contact us"
          title="Swift Communication"
        >
          {isOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {/* Communication Options Popup */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 mb-4 space-y-3 animate-fade-in-up z-50">
          {/* Phone Option */}
          <button
            onClick={handlePhoneClick}
            className="flex items-center gap-3 bg-white text-gray-900 px-5 py-3 rounded-full shadow-xl hover:shadow-2xl hover:bg-green-50 transition-all duration-300 hover:scale-105 w-full min-w-[220px] group"
            aria-label="Call us"
          >
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Phone</div>
              <div className="text-xs text-gray-600">{phoneNumber}</div>
            </div>
          </button>

          {/* WhatsApp Option */}
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center gap-3 bg-white text-gray-900 px-5 py-3 rounded-full shadow-xl hover:shadow-2xl hover:bg-green-50 transition-all duration-300 hover:scale-105 w-full min-w-[220px] group"
            aria-label="Chat on WhatsApp"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center group-hover:bg-[#20BA5A] transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">WhatsApp</div>
              <div className="text-xs text-gray-600">Chat with us</div>
            </div>
          </button>

          {/* Email Option */}
          <button
            onClick={handleEmailClick}
            className="flex items-center gap-3 bg-white text-gray-900 px-5 py-3 rounded-full shadow-xl hover:shadow-2xl hover:bg-green-50 transition-all duration-300 hover:scale-105 w-full min-w-[220px] group"
            aria-label="Send us an email"
          >
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Email</div>
              <div className="text-xs text-gray-600 truncate">{email}</div>
            </div>
          </button>

          {/* App Chat Option */}
          <button
            onClick={handleAppChatClick}
            className="flex items-center gap-3 bg-white text-gray-900 px-5 py-3 rounded-full shadow-xl hover:shadow-2xl hover:bg-green-50 transition-all duration-300 hover:scale-105 w-full min-w-[220px] group"
            aria-label="Open app chat"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center group-hover:from-green-700 group-hover:to-green-800 transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">App Chat</div>
              <div className="text-xs text-gray-600">Chat in app</div>
            </div>
          </button>
        </div>
        )}
      </div>
    </>
  );
}

export default CommunicationWidget;

