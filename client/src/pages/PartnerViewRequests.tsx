import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface DeliveryRequest {
  _id: string;
  uniqueId: string;
  status: string;
  assignedPartnerId?: string;
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
  partnerOffers?: Array<{
    partnerId: string;
    offerPrice?: number;
    estimatedDeliveryTime?: string;
    message?: string;
    status: string;
  }>;
}

function PartnerViewRequests() {
  const navigate = useNavigate();
  const [_user, setUser] = useState<any>(null);
  const [partnerId, setPartnerId] = useState<string>('');
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOffer, setSubmittingOffer] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [offerForm, setOfferForm] = useState({
    offerPrice: '',
    estimatedDeliveryTime: '',
    message: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/register');
      return;
    }
    setUser(currentUser);
    loadPartnerId(currentUser);
  }, [navigate]);

  const loadPartnerId = async (currentUser: any) => {
    try {
      setLoading(true);
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
        loadRequests(partner._id);
      } else {
        // If user has delivery_partner role but no Partner record, silently create a minimal one
        if (currentUser.role === 'delivery_partner' || currentUser.role === 'acha_sisters_delivery_partner') {
          try {
            const newPartner = await api.partners.create({
              name: currentUser.name || 'Delivery Partner',
              companyName: currentUser.name || currentUser.companyName || 'Delivery Partner',
              email: currentUser.email,
              phone: currentUser.phone || '',
              registrationType: 'Invest/Partner',
              partner: 'Delivery Partner',
              type: 'Strategic Partner',
              investmentType: 'Service Provider',
              status: 'pending', // Will need approval
              city: currentUser.city || '',
              primaryLocation: currentUser.location || currentUser.primaryLocation || ''
            }) as any;

            if (newPartner.data?._id || newPartner._id) {
              const partnerId = newPartner.data?._id || newPartner._id;
              setPartnerId(partnerId);
              // Silently load requests without showing message
              loadRequests(partnerId);
            } else {
              // Load requests without partnerId (will show all requests)
              loadRequests();
            }
          } catch (createError: any) {
            console.error('Error creating partner:', createError);
            // Silently load requests anyway - partner can still view requests
            loadRequests();
          }
        } else {
          // For non-partner users, just load requests
          loadRequests();
        }
      }
    } catch (error) {
      console.error('Error loading partner:', error);
      setMessage({ type: 'error', text: 'Error loading partner information' });
    } finally {
      setLoading(false);
    }
  };

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async (partnerIdParam?: string) => {
    try {
      setLoading(true);
      const pid = partnerIdParam || partnerId;
      
      const params: any = {};
      
      // Only add partnerId if we have one (to exclude requests where partner already submitted offer)
      if (pid) {
        params.partnerId = pid;
        
        // Try to get partner's location if available
        try {
          const partner = await api.partners.getById(pid) as any;
          const location = partner.data?.availability;
          
          if (location?.latitude && location?.longitude) {
            params.latitude = location.latitude;
            params.longitude = location.longitude;
            params.radius = 15; // 15km radius
          }
        } catch (partnerError) {
          // If we can't get partner details, continue without location filter
          console.log('Could not get partner location, showing all requests');
        }
      }

      const response = await api.orders.getAvailableRequests(params) as any;
      if (response.status === 'success') {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setMessage({ type: 'error', text: 'Failed to load delivery requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!partnerId) {
      // Try to create partner profile silently first
      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.role === 'delivery_partner' || currentUser.role === 'acha_sisters_delivery_partner')) {
        try {
          const newPartner = await api.partners.create({
            name: currentUser.name || 'Delivery Partner',
            companyName: currentUser.name || currentUser.companyName || 'Delivery Partner',
            email: currentUser.email,
            phone: currentUser.phone || '',
            registrationType: 'Invest/Partner',
            partner: 'Delivery Partner',
            type: 'Strategic Partner',
            investmentType: 'Service Provider',
            status: 'pending',
            city: currentUser.city || '',
            primaryLocation: currentUser.location || currentUser.primaryLocation || ''
          }) as any;

          if (newPartner.data?._id || newPartner._id) {
            const pid = newPartner.data?._id || newPartner._id;
            setPartnerId(pid);
            // Retry accepting request
            handleAcceptRequest(requestId);
            return;
          }
        } catch (error) {
          console.error('Error creating partner:', error);
        }
      }
      
      setMessage({ 
        type: 'error', 
        text: 'Unable to accept request. Please complete your partner profile in the dashboard.' 
      });
      return;
    }

    if (!window.confirm('Are you sure you want to accept this delivery request? This will assign the order to you.')) {
      return;
    }

    setSubmittingOffer(requestId);
    setMessage(null);

    try {
      const response = await api.orders.partnerAcceptRequest({
        orderId: requestId,
        partnerId
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Request accepted successfully! Order assigned to you.' });
        setSelectedRequest(null);
        loadRequests();
        // Redirect to orders after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept request' });
    } finally {
      setSubmittingOffer(null);
    }
  };

  const handleSubmitOffer = async (requestId: string) => {
    let currentPartnerId = partnerId;
    
    // If no partnerId, try to create partner profile first
    if (!currentPartnerId) {
      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.role === 'delivery_partner' || currentUser.role === 'acha_sisters_delivery_partner')) {
        setSubmittingOffer(requestId);
        setMessage({ type: 'success', text: 'Creating partner profile...' });
        
        try {
          const newPartner = await api.partners.create({
            name: currentUser.name || 'Delivery Partner',
            companyName: currentUser.name || currentUser.companyName || 'Delivery Partner',
            email: currentUser.email,
            phone: currentUser.phone || '',
            registrationType: 'Invest/Partner',
            partner: 'Delivery Partner',
            type: 'Strategic Partner',
            investmentType: 'Service Provider',
            status: 'pending',
            city: currentUser.city || '',
            primaryLocation: currentUser.location || currentUser.primaryLocation || ''
          }) as any;

          if (newPartner.data?._id || newPartner._id) {
            currentPartnerId = newPartner.data?._id || newPartner._id;
            setPartnerId(currentPartnerId);
          } else {
            setSubmittingOffer(null);
            setMessage({ 
              type: 'error', 
              text: 'Unable to create partner profile. Please complete your partner registration in the dashboard.' 
            });
            return;
          }
        } catch (error: any) {
          console.error('Error creating partner:', error);
          setSubmittingOffer(null);
          setMessage({ 
            type: 'error', 
            text: error.message || 'Unable to create partner profile. Please complete your partner registration in the dashboard.' 
          });
          return;
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: 'You need to be registered as a delivery partner to submit offers. Please complete your partner registration in the dashboard.' 
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

    setSubmittingOffer(requestId);
    setMessage(null);

    try {
      const response = await api.orders.submitPartnerOffer({
        orderId: requestId,
        partnerId: currentPartnerId,
        offerPrice: offerForm.offerPrice ? parseFloat(offerForm.offerPrice) : undefined,
        estimatedDeliveryTime: offerForm.estimatedDeliveryTime || undefined,
        message: offerForm.message || undefined
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Offer submitted successfully!' });
        setSelectedRequest(null);
        setOfferForm({ offerPrice: '', estimatedDeliveryTime: '', message: '' });
        loadRequests();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to submit offer' });
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'Failed to submit offer';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmittingOffer(null);
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
              <h1 className="text-3xl font-bold text-gray-900">Available Delivery Requests</h1>
              <p className="text-gray-600 mt-1">
                View and submit offers for delivery requests
              </p>
            </div>
            <button
              onClick={() => loadRequests()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p>{message.text}</p>
                  {message.type === 'error' && message.text.includes('profile') && (
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests available</h3>
              <p className="text-gray-600">
                There are no delivery requests in your area at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => {
                const hasOffer = request.partnerOffers?.some(
                  offer => offer.partnerId === partnerId && offer.status === 'pending'
                );

                return (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {request.orderInfo.productName}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'offers_received' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
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
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">🎯</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Delivery</p>
                          <p className="text-sm text-gray-900 line-clamp-1">
                            {request.deliveryLocation.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-3">
                        {formatDate(request.createdAt)}
                      </p>
                      {request.status === 'assigned' && request.assignedPartnerId === partnerId ? (
                        <div className="px-3 py-2 bg-green-50 text-green-800 rounded text-sm text-center">
                          ✓ Assigned to You
                        </div>
                      ) : hasOffer ? (
                        <div className="px-3 py-2 bg-green-50 text-green-800 rounded text-sm text-center">
                          ✓ Offer Submitted
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request._id)}
                            disabled={submittingOffer === request._id || !partnerId}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                          >
                            {submittingOffer === request._id ? 'Accepting...' : '✓ Accept Request'}
                          </button>
                          <button
                            onClick={() => setSelectedRequest(request)}
                            disabled={submittingOffer === request._id}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                          >
                            Submit Offer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Offer Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Submit Offer</h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setOfferForm({ offerPrice: '', estimatedDeliveryTime: '', message: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedRequest.orderInfo.productName}
                </h3>
                <p className="text-sm text-gray-600">
                  Pickup: {selectedRequest.pickupLocation.address}
                </p>
                <p className="text-sm text-gray-600">
                  Delivery: {selectedRequest.deliveryLocation.address}
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitOffer(selectedRequest._id);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Price (ETB)
                  </label>
                  <input
                    type="number"
                    value={offerForm.offerPrice}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, offerPrice: e.target.value }))}
                    placeholder="Enter your price"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Time
                  </label>
                  <input
                    type="text"
                    value={offerForm.estimatedDeliveryTime}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, estimatedDeliveryTime: e.target.value }))}
                    placeholder="e.g., 2 hours, 1 day"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={offerForm.message}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add any additional information"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(null);
                        setOfferForm({ offerPrice: '', estimatedDeliveryTime: '', message: '' });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingOffer === selectedRequest._id}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {submittingOffer === selectedRequest._id ? 'Submitting...' : 'Submit Offer'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRequest && partnerId) {
                        handleAcceptRequest(selectedRequest._id);
                      }
                    }}
                    disabled={submittingOffer === selectedRequest._id || !partnerId}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {submittingOffer === selectedRequest._id ? 'Processing...' : '✓ Accept Request Directly'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Accept directly to assign the order to you immediately
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerViewRequests;
