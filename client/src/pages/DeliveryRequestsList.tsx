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

function DeliveryRequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAvailableRequests() as any;
      console.log('Delivery requests response:', response);
      
      if (response.status === 'success') {
        let filteredRequests = response.data || [];
        
        // Filter by status if not 'all'
        if (filterStatus !== 'all') {
          filteredRequests = filteredRequests.filter((r: DeliveryRequest) => r.status === filterStatus);
        }
        
        setRequests(filteredRequests);
        console.log(`Loaded ${filteredRequests.length} requests (filter: ${filterStatus})`);
      } else {
        console.error('Failed to load requests:', response.message);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'offers_received':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Requests</h1>
              <p className="text-gray-600 mt-1">
                {requests.length} request{requests.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/delivery-requests/map')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Map View
              </button>
              <button
                onClick={loadRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex gap-2">
              {['all', 'pending', 'offers_received', 'assigned'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {filterStatus !== 'all' 
                  ? `No requests with status "${filterStatus}"`
                  : 'No delivery requests available at the moment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/delivery-requests/${request._id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {request.orderInfo.productName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.orderInfo.productDescription && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {request.orderInfo.productDescription}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">📍</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {request.pickupLocation.address}
                        </p>
                        {request.pickupLocation.city && (
                          <p className="text-xs text-gray-500">{request.pickupLocation.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">🎯</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Delivery</p>
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {request.deliveryLocation.address}
                        </p>
                        {request.deliveryLocation.city && (
                          <p className="text-xs text-gray-500">{request.deliveryLocation.city}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      {formatDate(request.createdAt)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/delivery-requests/${request._id}`);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details →
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

export default DeliveryRequestsList;
