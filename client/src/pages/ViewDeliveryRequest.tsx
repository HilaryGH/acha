import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface Order {
  _id: string;
  uniqueId: string;
  status: string;
  deliveryMethod?: string;
  assignedPartnerId?: string;
  partnerAcceptanceStatus?: 'pending' | 'accepted' | 'rejected';
  orderInfo: {
    productName: string;
    productDescription?: string;
    brand?: string;
    quantityDescription?: string;
    preferredDeliveryDate?: string;
    photos?: string[];
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
    _id: string;
    name: string;
    email: string;
  };
  partnerOffers?: Array<{
    _id: string;
    partnerId: {
      _id: string;
      name: string;
      companyName?: string;
    };
    offerPrice?: number;
    estimatedDeliveryTime?: string;
    message?: string;
    status: string;
  }>;
}

function ViewDeliveryRequest() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDeliveryPartner, setIsDeliveryPartner] = useState(false);
  const [partnerId, setPartnerId] = useState<string>('');
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('');
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);
  const [acceptingOrder, setAcceptingOrder] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/register');
      return;
    }
    setUser(currentUser);
    
    // Check if user is a delivery partner
    const isPartner = currentUser.role === 'delivery_partner' || 
                     currentUser.role === 'acha_sisters_delivery_partner' ||
                     currentUser.role === 'movers_packers' ||
                     currentUser.role === 'gift_delivery_partner';
    setIsDeliveryPartner(isPartner);
    
    if (isPartner) {
      // For role-based delivery partners, use the user's ID directly
      // Handle both _id and id fields
      const userId = currentUser._id || currentUser.id;
      if (userId) {
        setPartnerId(userId.toString());
        console.log('Set partnerId from user:', userId.toString(), 'Role:', currentUser.role);
      } else {
        loadPartnerId(currentUser);
      }
    }
    
    if (orderId) {
      loadOrder(orderId, currentUser);
    }
  }, [orderId, navigate]);

  const loadPartnerId = async (currentUser: any) => {
    try {
      // For role-based delivery partners (delivery_partner, acha_sisters_delivery_partner, etc.),
      // the backend expects the User ID, not a Partner document ID
      // Handle both _id and id fields
      const userId = currentUser._id || currentUser.id;
      if (isDeliveryPartner && userId) {
        setPartnerId(userId.toString());
        console.log('Set partnerId from user in loadPartnerId:', userId.toString());
        return;
      }
      
      // For other partner types, try to find a Partner document
      const partnersResponse = await api.partners.getAll() as any;
      const partners = partnersResponse.data || partnersResponse || [];
      const partner = Array.isArray(partners) 
        ? partners.find((p: any) => 
            p.email?.toLowerCase() === currentUser.email?.toLowerCase() || 
            p.userId === userId ||
            p.userId?.toString() === userId?.toString()
          )
        : null;
      
      if (partner) {
        setPartnerId(partner._id);
        console.log('Set partnerId from Partner document:', partner._id);
      }
    } catch (error) {
      console.error('Error loading partner:', error);
    }
  };

  const loadOrder = async (id: string, currentUser: any, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.orders.getById(id) as any;
      if (response.status === 'success') {
        const orderData = response.data;
        setOrder(orderData);
        
        // Check if current user is the client (buyer)
        const buyerId = orderData.buyerId?._id || orderData.buyerId;
        setIsClient(buyerId === currentUser.id || orderData.buyerId?.email === currentUser.email);
        setLoading(false);
      } else {
        // Check if it's a 404 error - might be a timing issue, retry up to 2 times
        if ((response.message?.includes('not found') || response.message?.includes('Order not found')) && retryCount < 2) {
          console.log(`Order not found (attempt ${retryCount + 1}/2), retrying in 1 second...`);
          setTimeout(async () => {
            await loadOrder(id, currentUser, retryCount + 1);
          }, 1000);
          return; // Don't set loading to false yet
        } else {
          // Clean up error message - remove technical details
          let errorMessage = response.message || 'Failed to load order details';
          // Remove URL and technical details from error message
          errorMessage = errorMessage.replace(/Requested URL:.*?\./g, '');
          errorMessage = errorMessage.replace(/Make sure VITE_API_BASE_URL.*?\./g, '');
          errorMessage = errorMessage.trim();
          if (!errorMessage || errorMessage === 'Order not found') {
            errorMessage = 'Order not found. The delivery request may have been removed or the ID is incorrect.';
          }
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('Error loading order:', err);
      
      // Check if it's a 404 error - might be a timing issue, retry up to 2 times
      if ((err.message?.includes('not found') || err.message?.includes('Order not found') || err.message?.includes('404')) && retryCount < 2) {
        console.log(`Order not found in catch (attempt ${retryCount + 1}/2), retrying in 1 second...`);
        setTimeout(async () => {
          await loadOrder(id, currentUser, retryCount + 1);
        }, 1000);
        return; // Don't set loading to false yet
      } else {
        // Clean up error message - remove technical details
        let errorMessage = err.message || 'Failed to load order details. Please try again.';
        // Remove URL and technical details from error message
        errorMessage = errorMessage.replace(/Requested URL:.*?\./g, '');
        errorMessage = errorMessage.replace(/Make sure VITE_API_BASE_URL.*?\./g, '');
        errorMessage = errorMessage.replace(/\.\s*$/, '').trim();
        if (!errorMessage || errorMessage.includes('404') || errorMessage.includes('Route not found')) {
          errorMessage = 'Order not found. The delivery request may have been removed or the ID is incorrect.';
        }
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  const handleAcceptRequest = async () => {
    if (!user || !order) return;

    // Check if user is a delivery partner
    if (!isDeliveryPartner) {
      setMessage({ 
        type: 'error', 
        text: 'You need to be registered as a delivery partner to accept requests. Please complete your partner registration.' 
      });
      return;
    }

    // For role-based delivery partners, use the User ID directly
    // The backend expects User ID for role-based partners (delivery_partner, acha_sisters_delivery_partner, etc.)
    let currentPartnerId = partnerId || user.id;

    if (!currentPartnerId) {
      setMessage({ 
        type: 'error', 
        text: 'Unable to identify your partner account. Please ensure you are logged in as a registered delivery partner.' 
      });
      return;
    }

    // Show price input dialog
    setOfferPrice('');
    setEstimatedDeliveryTime('');
    setShowPriceDialog(true);
  };

  const handleAcceptOrder = async () => {
    if (!order || !user) return;

    if (!window.confirm('Are you sure you want to accept this order? This will confirm your commitment to deliver this order.')) {
      return;
    }

    setAcceptingOrder(true);
    setMessage(null);

    try {
      const response = await api.orders.partnerAcceptOrder({
        orderId: order._id
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Order accepted successfully! You can now track it from your dashboard.' });
        // Refresh the order data
        setTimeout(() => {
          if (orderId && user) {
            loadOrder(orderId, user);
            setMessage(null);
          }
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to accept order' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept order' });
    } finally {
      setAcceptingOrder(false);
    }
  };

  const handleAcceptOffer = async (offerId: string, partnerId: string) => {
    if (!order || !user) return;

    if (!window.confirm('Are you sure you want to accept this offer? The order will be assigned to this partner.')) {
      return;
    }

    setAcceptingOffer(offerId);
    setMessage(null);

    try {
      const response = await api.orders.assignToPartner(order._id, partnerId, offerId) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Offer accepted successfully! Order assigned to partner.' });
        // Refresh the order data
        setTimeout(() => {
          if (orderId && user) {
            loadOrder(orderId, user);
            setMessage(null);
          }
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to accept offer' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept offer' });
    } finally {
      setAcceptingOffer(null);
    }
  };

  const handleSubmitAcceptRequest = async () => {
    if (!user || !order) return;

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
    setAcceptingRequest(true);
    setMessage(null);

    try {
      // For role-based delivery partners, use the User ID directly
      // The backend expects User ID for role-based partners (delivery_partner, acha_sisters_delivery_partner, etc.)
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
        orderId: order._id, 
        partnerId: currentPartnerId, 
        partnerIdType: typeof currentPartnerId,
        userRole: user.role,
        orderDeliveryMethod: order.deliveryMethod,
        offerPrice: price 
      });
      
      const response = await api.orders.partnerAcceptRequest({
        orderId: order._id,
        partnerId: currentPartnerId.toString(), // Ensure it's a string
        offerPrice: price,
        estimatedDeliveryTime: estimatedDeliveryTime || undefined
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: `Request accepted successfully! Order assigned to you with price ${price} ETB. Buyer has been notified.` });
        // Refresh the order data
        setTimeout(() => {
          if (orderId && user) {
            loadOrder(orderId, user);
            setMessage(null);
          }
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to accept request' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept request' });
    } finally {
      setAcceptingRequest(false);
      setOfferPrice('');
      setEstimatedDeliveryTime('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request...</p>
        </div>
      </div>
    );
  }

  if (error || (!order && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Request not found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error 
              ? 'The delivery request could not be loaded. It may have been removed or the link is invalid.' 
              : 'The delivery request you are looking for could not be found.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (orderId && user) {
                  loadOrder(orderId, user, 0);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/find-delivery-item')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Browse Requests
            </button>
            <button
              onClick={() => navigate('/delivery-requests/list')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasOffers = order.partnerOffers && order.partnerOffers.length > 0;
  const pendingOffers = order.partnerOffers?.filter(o => o.status === 'pending') || [];
  // Check if order is assigned to current partner (handle both User ID and Partner ID)
  const currentPartnerId = partnerId || user?.id;
  const assignedPartnerIdStr = order.assignedPartnerId?.toString() || order.assignedPartnerId;
  const currentPartnerIdStr = currentPartnerId?.toString() || currentPartnerId;
  const isAssignedToMe = currentPartnerId && assignedPartnerIdStr === currentPartnerIdStr;
  
  // Check if current partner has a pending offer
  const hasMyOffer = currentPartnerId && order.partnerOffers?.some(
    offer => {
      const offerPartnerId = offer.partnerId?._id?.toString() || offer.partnerId?.toString() || offer.partnerId;
      return offerPartnerId === currentPartnerIdStr && offer.status === 'pending';
    }
  );
  
  // Check if order is unassigned and available
  const isUnassigned = !order.assignedPartnerId && ['pending', 'offers_received', 'active'].includes(order.status?.toLowerCase() || '');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Delivery Request</h1>
                <p className="text-gray-600 mt-1">Request ID: {order.uniqueId}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Item</label>
                <p className="text-gray-900 text-lg">{order.orderInfo.productName}</p>
                {order.orderInfo.productDescription && (
                  <p className="text-sm text-gray-600 mt-1">{order.orderInfo.productDescription}</p>
                )}
                {order.orderInfo.brand && (
                  <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Brand:</span> {order.orderInfo.brand}</p>
                )}
                {order.orderInfo.quantityDescription && (
                  <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Quantity:</span> {order.orderInfo.quantityDescription}</p>
                )}
                {order.orderInfo.preferredDeliveryDate && (
                  <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Preferred Date:</span> {new Date(order.orderInfo.preferredDeliveryDate).toLocaleDateString()}</p>
                )}
              </div>
              
              {order.orderInfo.photos && order.orderInfo.photos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Photos</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {order.orderInfo.photos.map((photo, index) => (
                      <img 
                        key={index}
                        src={photo} 
                        alt={`${order.orderInfo.productName} - ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">📍 Pickup Location</label>
                  {order.pickupLocation?.address ? (
                    <>
                      <p className="text-gray-900">{order.pickupLocation.address}</p>
                      {order.pickupLocation.city && (
                        <p className="text-xs text-gray-500 mt-1">{order.pickupLocation.city}</p>
                      )}
                      {order.pickupLocation.latitude != null && order.pickupLocation.longitude != null && (
                        <p className="text-xs text-gray-400 mt-1">
                          {order.pickupLocation.latitude.toFixed(6)}, {order.pickupLocation.longitude.toFixed(6)}
                        </p>
                      )}
                    </>
                  ) : order.pickupLocation?.city ? (
                    <p className="text-gray-900">{order.pickupLocation.city}</p>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">🎯 Delivery Location</label>
                  {order.deliveryLocation?.address ? (
                    <>
                      <p className="text-gray-900">{order.deliveryLocation.address}</p>
                      {order.deliveryLocation.city && (
                        <p className="text-xs text-gray-500 mt-1">{order.deliveryLocation.city}</p>
                      )}
                      {order.deliveryLocation.latitude != null && order.deliveryLocation.longitude != null && (
                        <p className="text-xs text-gray-400 mt-1">
                          {order.deliveryLocation.latitude.toFixed(6)}, {order.deliveryLocation.longitude.toFixed(6)}
                        </p>
                      )}
                    </>
                  ) : order.deliveryLocation?.city ? (
                    <p className="text-gray-900">{order.deliveryLocation.city}</p>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Accept Order Button for Assigned Partners - After Details */}
          {isDeliveryPartner && !isClient && isAssignedToMe && order.partnerAcceptanceStatus !== 'accepted' && (
            <div className="mb-6">
              <button
                onClick={handleAcceptOrder}
                disabled={acceptingOrder}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {acceptingOrder ? 'Accepting Order...' : '✓ Accept Order'}
              </button>
            </div>
          )}

          {/* Client Actions */}
          {isClient && (
            <div className="mb-6">
              {hasOffers && pendingOffers.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        {pendingOffers.length} Partner Offer{pendingOffers.length !== 1 ? 's' : ''} Received
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Review and select a partner to confirm your delivery
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/delivery-requests/${order._id}/offers`)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Offers
                    </button>
                  </div>
                </div>
              ) : order.status === 'assigned' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-900">Partner Selected</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your delivery request has been confirmed with a partner
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/orders/track/${order._id}`)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold text-yellow-900">Waiting for Partners</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Partners are reviewing your request. You'll be notified when offers come in.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Offers Preview */}
          {hasOffers && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Partner Offers ({order.partnerOffers?.length})
              </h2>
              <div className="space-y-3">
                {order.partnerOffers?.slice(0, 3).map((offer) => (
                  <div
                    key={offer._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {offer.partnerId.companyName || offer.partnerId.name}
                        </h3>
                        {offer.offerPrice && (
                          <p className="text-sm text-gray-600 mt-1">
                            Offer: {offer.offerPrice.toLocaleString()} ETB
                          </p>
                        )}
                        {offer.estimatedDeliveryTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Estimated: {offer.estimatedDeliveryTime}
                          </p>
                        )}
                        {offer.message && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            "{offer.message}"
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                    {isClient && offer.status === 'pending' && order.status !== 'assigned' && (
                      <button
                        onClick={() => {
                          const partnerIdValue = offer.partnerId?._id || offer.partnerId?.toString() || offer.partnerId;
                          handleAcceptOffer(offer._id, partnerIdValue);
                        }}
                        disabled={acceptingOffer === offer._id}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {acceptingOffer === offer._id ? 'Accepting...' : '✓ Accept Offer'}
                      </button>
                    )}
                  </div>
                ))}
                {order.partnerOffers && order.partnerOffers.length > 3 && (
                  <button
                    onClick={() => navigate(`/delivery-requests/${order._id}/offers`)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View All {order.partnerOffers.length} Offers →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Delivery Partner Actions */}
          {isDeliveryPartner && !isClient && (
            <div className="mb-6">
              {isAssignedToMe ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-900">✓ Assigned to You</h3>
                      <p className="text-sm text-green-700 mt-1">
                        {order.partnerAcceptanceStatus === 'accepted' 
                          ? 'You have accepted this order. You can track it from your dashboard.'
                          : 'This order has been assigned to you. Please accept it to confirm.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {order.partnerAcceptanceStatus !== 'accepted' && (
                        <button
                          onClick={handleAcceptOrder}
                          disabled={acceptingOrder}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acceptingOrder ? 'Accepting...' : '✓ Accept Order'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              ) : hasMyOffer ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold text-blue-900">✓ Offer Submitted</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You have already submitted an offer for this request. Waiting for client response.
                    </p>
                  </div>
                </div>
              ) : isUnassigned ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-yellow-900">Accept This Delivery Request</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This request is available. Accept it to assign the order to you.
                      </p>
                    </div>
                    <button
                      onClick={handleAcceptRequest}
                      disabled={acceptingRequest}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {acceptingRequest ? 'Accepting...' : '✓ Accept Request'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Request Not Available</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      This request has already been assigned to another partner.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {isClient && pendingOffers.length > 0 && (
              <button
                onClick={() => navigate(`/delivery-requests/${order._id}/offers`)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View & Select Partner
              </button>
            )}
            {isDeliveryPartner && !isClient && isAssignedToMe && order.partnerAcceptanceStatus !== 'accepted' && (
              <button
                onClick={handleAcceptOrder}
                disabled={acceptingOrder}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acceptingOrder ? 'Accepting...' : '✓ Accept Order'}
              </button>
            )}
            {order.status === 'assigned' && order.partnerAcceptanceStatus === 'accepted' && (
              <button
                onClick={() => navigate(`/orders/track/${order._id}`)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Track Delivery
              </button>
            )}
            <button
              onClick={() => navigate('/delivery-requests/list')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to List
            </button>
          </div>
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

export default ViewDeliveryRequest;
