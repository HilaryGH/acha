import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface DeliveryRequest {
  _id: string;
  uniqueId: string;
  status: string;
  deliveryMethod: string;
  assignedPartnerId?: string;
  partnerAcceptanceStatus?: 'pending' | 'accepted' | 'rejected';
  orderInfo: {
    productName?: string;
    productDescription?: string;
    brand?: string;
    quantityDescription?: string;
    preferredDeliveryDate?: string;
    photos?: string[];
  };
  pickupLocation: {
    address: string;
    latitude?: number;
    longitude?: number;
    city?: string;
  };
  deliveryLocation: {
    address: string;
    latitude?: number;
    longitude?: number;
    city?: string;
  };
  createdAt: string;
  buyerId: {
    name: string;
    email: string;
    phone?: string;
    currentCity?: string;
  };
  partnerOffers?: Array<{
    partnerId: string;
    offerPrice?: number;
    estimatedDeliveryTime?: string;
    message?: string;
    status: string;
  }>;
}

function FindDeliveryItem() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [partnerId, setPartnerId] = useState<string>('');
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filters, setFilters] = useState({
    pickupCity: '',
    deliveryCity: '',
    status: 'all' // Show all unmatched requests by default
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      loadPartnerId(currentUser);
    }
    fetchDeliveryRequests();
  }, []);

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

  const fetchDeliveryRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch unmatched delivery requests (orders without assignedPartnerId or with pending status)
      const params: any = {};
      if (partnerId) {
        params.partnerId = partnerId;
      }
      
      const response = await api.orders.getAvailableRequests(params) as { status?: string; data?: DeliveryRequest[]; message?: string; count?: number };
      console.log('Delivery requests API response:', response);
      
      if (response.status === 'success') {
        const allRequests = response.data || [];
        console.log('Total delivery requests fetched:', allRequests.length);
        
        // Filter to show only unmatched requests (no assignedPartnerId or status is pending/offers_received)
        const unmatchedRequests = allRequests.filter((request: DeliveryRequest) => {
          // Show requests that are not assigned or are pending/offers_received
          return !request.assignedPartnerId || 
                 request.status === 'pending' || 
                 request.status === 'offers_received';
        });
        
        console.log('Unmatched delivery requests:', unmatchedRequests.length);
        setRequests(unmatchedRequests);
      } else {
        setError(response.message || 'Failed to fetch delivery requests');
      }
    } catch (err: any) {
      console.error('Error fetching delivery requests:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to accept delivery requests' });
      navigate('/register');
      return;
    }

    // Check if user is a delivery partner
    const isDeliveryPartner = user.role === 'delivery_partner' || 
                             user.role === 'acha_sisters_delivery_partner' ||
                             user.role === 'movers_packers' ||
                             user.role === 'gift_delivery_partner';

    if (!isDeliveryPartner) {
      setMessage({ 
        type: 'error', 
        text: 'You need to be registered as a delivery partner to accept requests. Please complete your partner registration.' 
      });
      return;
    }

    let currentPartnerId = partnerId;

    // If no partnerId, try to create partner profile first
    if (!currentPartnerId && isDeliveryPartner) {
      try {
        const newPartner = await api.partners.create({
          name: user.name || 'Delivery Partner',
          companyName: user.name || user.companyName || 'Delivery Partner',
          email: user.email,
          phone: user.phone || '',
          registrationType: 'Invest/Partner',
          partner: 'Delivery Partner',
          type: 'Strategic Partner',
          investmentType: 'Service Provider',
          status: 'pending',
          city: user.city || '',
          primaryLocation: user.location || user.primaryLocation || ''
        }) as any;

        if (newPartner.data?._id || newPartner._id) {
          currentPartnerId = newPartner.data?._id || newPartner._id;
          setPartnerId(currentPartnerId);
        } else {
          setMessage({ 
            type: 'error', 
            text: 'Unable to create partner profile. Please complete your partner registration in the dashboard.' 
          });
          return;
        }
      } catch (error: any) {
        console.error('Error creating partner:', error);
        setMessage({ 
          type: 'error', 
          text: error.message || 'Unable to create partner profile. Please complete your partner registration in the dashboard.' 
        });
        return;
      }
    }

    if (!currentPartnerId) {
      setMessage({ 
        type: 'error', 
        text: 'Partner ID is required. Please complete your partner registration in the dashboard.' 
      });
      return;
    }

    if (!window.confirm('Are you sure you want to accept this delivery request? This will assign the order to you.')) {
      return;
    }

    setAcceptingRequest(requestId);
    setMessage(null);

    try {
      const response = await api.orders.partnerAcceptRequest({
        orderId: requestId,
        partnerId: currentPartnerId
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Request accepted successfully! Order assigned to you.' });
        // Refresh the list
        setTimeout(() => {
          fetchDeliveryRequests();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to accept request' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept request' });
    } finally {
      setAcceptingRequest(null);
    }
  };

  const filteredRequests = requests.filter((request: DeliveryRequest) => {
    // Filter by pickup city
    if (filters.pickupCity && request.pickupLocation?.city) {
      if (!request.pickupLocation.city.toLowerCase().includes(filters.pickupCity.toLowerCase()) &&
          !request.pickupLocation.address.toLowerCase().includes(filters.pickupCity.toLowerCase())) {
        return false;
      }
    }
    // Filter by delivery city
    if (filters.deliveryCity && request.deliveryLocation?.city) {
      if (!request.deliveryLocation.city.toLowerCase().includes(filters.deliveryCity.toLowerCase()) &&
          !request.deliveryLocation.address.toLowerCase().includes(filters.deliveryCity.toLowerCase())) {
        return false;
      }
    }
    // Filter by status
    if (filters.status !== 'all' && request.status !== filters.status) {
      return false;
    }
    return true;
  });

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

  const isDeliveryPartner = user && (
    user.role === 'delivery_partner' || 
    user.role === 'acha_sisters_delivery_partner' ||
    user.role === 'movers_packers' ||
    user.role === 'gift_delivery_partner'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Delivery Requests</h1>
          <p className="text-lg text-gray-600">
            Browse unmatched delivery requests and accept them to fulfill deliveries
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p>{message.text}</p>
                {message.type === 'error' && message.text.includes('registration') && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Go to Dashboard →
                  </button>
                )}
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup City
              </label>
              <input
                type="text"
                value={filters.pickupCity}
                onChange={(e) => setFilters(prev => ({ ...prev, pickupCity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by pickup city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery City
              </label>
              <input
                type="text"
                value={filters.deliveryCity}
                onChange={(e) => setFilters(prev => ({ ...prev, deliveryCity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by delivery city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Unmatched</option>
                <option value="pending">Pending</option>
                <option value="offers_received">Offers Received</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchDeliveryRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading delivery requests...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchDeliveryRequests}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg mb-2">No unmatched delivery requests found.</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request: DeliveryRequest) => {
              const hasOffer = partnerId && request.partnerOffers?.some(
                offer => offer.partnerId === partnerId && offer.status === 'pending'
              );
              const isAssignedToMe = partnerId && request.assignedPartnerId === partnerId;

              return (
                <div key={request._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {request.orderInfo?.productName || 'Delivery Request'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.orderInfo?.brand && (
                      <p className="text-sm text-gray-600">Brand: {request.orderInfo.brand}</p>
                    )}
                  </div>
                  
                  {request.orderInfo?.productDescription && (
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {request.orderInfo.productDescription}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {request.pickupLocation?.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 mt-0.5">📍</span>
                        <div className="flex-1">
                          <span className="font-medium text-gray-700">Pickup:</span>
                          <p className="text-gray-600 line-clamp-1">{request.pickupLocation.address}</p>
                          {request.pickupLocation.city && (
                            <p className="text-xs text-gray-500">{request.pickupLocation.city}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {request.deliveryLocation?.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 mt-0.5">🎯</span>
                        <div className="flex-1">
                          <span className="font-medium text-gray-700">Delivery:</span>
                          <p className="text-gray-600 line-clamp-1">{request.deliveryLocation.address}</p>
                          {request.deliveryLocation.city && (
                            <p className="text-xs text-gray-500">{request.deliveryLocation.city}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {request.orderInfo?.quantityDescription && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Quantity:</span>
                        <span>{request.orderInfo.quantityDescription}</span>
                      </div>
                    )}
                    {request.orderInfo?.preferredDeliveryDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Preferred Date:</span>
                        <span>{new Date(request.orderInfo.preferredDeliveryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {request.orderInfo?.photos && request.orderInfo.photos.length > 0 && (
                    <div className="mb-4">
                      <img 
                        src={request.orderInfo.photos[0]} 
                        alt={request.orderInfo.productName || 'Delivery item'}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.buyerId?.name || 'Buyer'}</p>
                      {request.buyerId?.currentCity && (
                        <p className="text-xs text-gray-500">{request.buyerId.currentCity}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {isDeliveryPartner ? (
                    <div className="mt-4">
                      {isAssignedToMe ? (
                        <div className="px-4 py-2 bg-green-50 text-green-800 rounded-lg text-sm text-center font-medium">
                          ✓ Assigned to You
                        </div>
                      ) : hasOffer ? (
                        <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm text-center font-medium">
                          ✓ Offer Submitted
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          disabled={acceptingRequest === request._id}
                          className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acceptingRequest === request._id ? 'Accepting...' : '✓ Accept Delivery Request'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/delivery-requests/${request._id}`)}
                        className="w-full mt-2 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/delivery-requests/${request._id}`)}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Details →
                      </button>
                      {!user && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          <button
                            onClick={() => navigate('/register')}
                            className="text-blue-600 hover:underline"
                          >
                            Sign in as delivery partner
                          </button>
                          {' '}to accept requests
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindDeliveryItem;

