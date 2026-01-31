import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function MatchTraveler() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchAvailableTravelers();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    try {
      const response = await api.orders.getById(orderId) as { status?: string; data?: any; message?: string };
      if (response.status === 'success') {
        setOrder(response.data);
        if (response.data.deliveryMethod !== 'traveler') {
          setError('This order is not set for traveler delivery');
        }
      } else {
        setError(response.message || 'Failed to fetch order');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const fetchAvailableTravelers = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await api.orders.getAvailableTravelers(orderId) as { status?: string; data?: any[]; message?: string };
      if (response.status === 'success') {
        setTravelers(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch travelers');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (travelerId: string) => {
    if (!orderId) return;
    
    setMatching(true);
    setMessage(null);
    
    try {
      const response = await api.orders.matchWithTraveler(orderId, travelerId) as { status?: string; message?: string };
      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Order matched with traveler successfully!' });
        setTimeout(() => {
          navigate(`/orders/track/${orderId}`);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to match order' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setMatching(false);
    }
  };

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Match with Traveler</h1>
          {order && (
            <p className="text-lg text-gray-600">Order: {order.orderInfo?.productName}</p>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Order Info */}
        {order && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Product</p>
                <p className="font-semibold text-gray-900">{order.orderInfo?.productName}</p>
              </div>
              {order.orderInfo?.preferredDeliveryDate && (
                <div>
                  <p className="text-sm text-gray-600">Preferred Delivery Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(order.orderInfo.preferredDeliveryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Travelers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Travelers</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading travelers...</p>
            </div>
          ) : travelers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No available travelers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelers.map((traveler) => (
                <div key={traveler._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{traveler.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">From:</span>
                        <span>{traveler.currentLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">To:</span>
                        <span>{traveler.destinationCity}</span>
                      </div>
                      {traveler.departureDate && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Departure:</span>
                          <span>{new Date(traveler.departureDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {traveler.arrivalDate && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Arrival:</span>
                          <span>{new Date(traveler.arrivalDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <a
                        href={`mailto:${traveler.email}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {traveler.email}
                      </a>
                    </div>
                    {traveler.phone && (
                      <div className="mb-3">
                        <a
                          href={`tel:${traveler.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {traveler.phone}
                        </a>
                      </div>
                    )}
                    <button
                      onClick={() => handleMatch(traveler._id)}
                      disabled={matching || order?.status !== 'pending'}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {matching ? 'Matching...' : 'Match with this Traveler'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchTraveler;






