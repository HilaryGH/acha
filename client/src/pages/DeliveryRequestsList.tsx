import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface DeliveryRequest {
  _id: string;
  uniqueId: string;
  status: string;
  assignedPartnerId?: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [_acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [partnerId, setPartnerId] = useState<string>('');
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Check if user is a delivery partner
    if (currentUser) {
      const isPartner = currentUser.role === 'delivery_partner' || 
                       currentUser.role === 'acha_sisters_delivery_partner' ||
                       currentUser.role === 'movers_packers' ||
                       currentUser.role === 'gift_delivery_partner';
      
      if (isPartner) {
        // For role-based delivery partners, use the User ID directly
        // Handle both _id and id fields
        const userId = currentUser._id || currentUser.id;
        if (userId) {
          setPartnerId(userId.toString());
          console.log('Set partnerId from user in list:', userId.toString(), 'Role:', currentUser.role);
        }
      } else {
        // Try to find Partner document ID
        loadPartnerId(currentUser);
      }
    }
    
    loadRequests();
  }, [filterStatus]);

  const loadPartnerId = async (currentUser: any) => {
    try {
      const partnersResponse = await api.partners.getAll() as any;
      const partners = partnersResponse.data || partnersResponse || [];
      const partner = Array.isArray(partners) 
        ? partners.find((p: any) => 
            p.email?.toLowerCase() === currentUser.email?.toLowerCase() || 
            p.userId === currentUser.id ||
            p.userId?.toString() === currentUser.id
          )
        : null;
      
      if (partner) {
        setPartnerId(partner._id);
      }
    } catch (error) {
      console.error('Error loading partner:', error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAvailableRequests() as any;
      console.log('Delivery requests response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response count:', response.count);
      
      if (response.status === 'success') {
        let filteredRequests = response.data || [];
        console.log(`Received ${filteredRequests.length} requests from API`);
        
        // Filter by status if not 'all'
        if (filterStatus !== 'all') {
          filteredRequests = filteredRequests.filter((r: DeliveryRequest) => r.status === filterStatus);
          console.log(`After status filter (${filterStatus}): ${filteredRequests.length} requests`);
        }
        
        setRequests(filteredRequests);
        setError(null);
        console.log(`Loaded ${filteredRequests.length} requests (filter: ${filterStatus})`);
      } else {
        const errorMsg = response.message || 'Failed to load delivery requests';
        console.error('Failed to load requests:', errorMsg);
        console.error('Full response:', response);
        setRequests([]);
        setError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred while loading delivery requests';
      console.error('Error loading requests:', error);
      console.error('Error details:', error.message, error.stack);
      setRequests([]);
      setError(errorMsg);
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

  const handleSubmitAcceptRequest = async () => {
    if (!selectedRequestId || !user) return;

    // Validate price
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      setMessage({ 
        type: 'error', 
        text: 'Please enter a valid price (greater than 0)' 
      });
      return;
    }

    setShowPriceDialog(false);
    setAcceptingRequest(selectedRequestId);
    setMessage(null);

    try {
      // For role-based delivery partners, use the User ID directly
      // Handle both _id and id fields from user object
      const userId = user._id || user.id;
      let currentPartnerId = partnerId || userId;
      
      // Ensure we have a valid partner ID
      if (!currentPartnerId) {
        setMessage({ 
          type: 'error', 
          text: 'Unable to identify your partner account. Please ensure you are logged in as a registered delivery partner.' 
        });
        return;
      }
      
      console.log('Accepting request with:', { 
        orderId: selectedRequestId, 
        partnerId: currentPartnerId, 
        partnerIdType: typeof currentPartnerId,
        userRole: user.role,
        offerPrice: price 
      });

      const response = await api.orders.partnerAcceptRequest({
        orderId: selectedRequestId,
        partnerId: currentPartnerId.toString(), // Ensure it's a string
        offerPrice: price,
        estimatedDeliveryTime: estimatedDeliveryTime || undefined
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: `Request accepted successfully! Order assigned to you with price ${price} ETB. Buyer has been notified.` });
        // Refresh the list
        setTimeout(() => {
          loadRequests();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to accept request' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept request' });
    } finally {
      setAcceptingRequest(null);
      setSelectedRequestId(null);
      setOfferPrice('');
      setEstimatedDeliveryTime('');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p>{message.text}</p>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
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
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Requests</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
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

      {/* Price Input Dialog */}
      {showPriceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accept Delivery Request</h2>
            <p className="text-gray-600 mb-6">
              Please provide your delivery price and estimated delivery time. The buyer will be notified with this information.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Price (ETB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Enter delivery price"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery Time (Optional)
                </label>
                <input
                  type="text"
                  value={estimatedDeliveryTime}
                  onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                  placeholder="e.g., 2-3 days, 1 week"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPriceDialog(false);
                  setSelectedRequestId(null);
                  setOfferPrice('');
                  setEstimatedDeliveryTime('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAcceptRequest}
                disabled={!offerPrice || parseFloat(offerPrice) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept & Send Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryRequestsList;
