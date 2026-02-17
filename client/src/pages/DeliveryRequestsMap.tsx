import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface DeliveryRequest {
  _id: string;
  uniqueId: string;
  status: string;
  orderInfo: {
    productName: string;
    productDescription?: string;
  };
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
  };
  deliveryLocation: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
  };
  createdAt: string;
  buyerId: {
    name: string;
    email: string;
  };
}

function DeliveryRequestsMap() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 9.145, lng: 38.7667 }); // Addis Ababa default
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);

  useEffect(() => {
    loadRequests();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Use default location
        }
      );
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAvailableRequests() as any;
      if (response.status === 'success') {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Delivery Requests Map</h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/delivery-requests/list')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                List View
              </button>
              <button
                onClick={loadRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Map */}
        <div className="flex-1 relative">
          {GOOGLE_MAPS_API_KEY ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${mapCenter.lat},${mapCenter.lng}&zoom=12`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Map View</h3>
                <p className="text-gray-600 mb-4">
                  {requests.length} delivery request{requests.length !== 1 ? 's' : ''} available
                </p>
                <p className="text-sm text-gray-500">
                  Enable Google Maps API to see interactive map
                </p>
              </div>
            </div>
          )}

          {/* Request Markers Overlay */}
          {!GOOGLE_MAPS_API_KEY && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold text-gray-900 mb-2">Requests ({requests.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    onClick={() => setSelectedRequest(request)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedRequest?._id === request._id ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {request.orderInfo.productName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {request.pickupLocation.address.substring(0, 30)}...
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      View Details →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Available Requests ({requests.length})
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-gray-600">No delivery requests available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    onClick={() => setSelectedRequest(request)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedRequest?._id === request._id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {request.orderInfo.productName}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'offers_received' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📍</span>
                        <span className="truncate">{request.pickupLocation.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🎯</span>
                        <span className="truncate">{request.deliveryLocation.address}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/delivery-requests/${request._id}`);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Item</label>
                  <p className="text-gray-900">{selectedRequest.orderInfo.productName}</p>
                  {selectedRequest.orderInfo.productDescription && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRequest.orderInfo.productDescription}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pickup</label>
                    <p className="text-gray-900">{selectedRequest.pickupLocation.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedRequest.pickupLocation.city}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Delivery</label>
                    <p className="text-gray-900">{selectedRequest.deliveryLocation.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedRequest.deliveryLocation.city}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      navigate(`/delivery-requests/${selectedRequest._id}`);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Full Details
                  </button>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryRequestsMap;
