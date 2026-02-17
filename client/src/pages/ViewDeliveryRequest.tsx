import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface Order {
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
  const [_user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/register');
      return;
    }
    setUser(currentUser);
    if (orderId) {
      loadOrder(orderId, currentUser);
    }
  }, [orderId, navigate]);

  const loadOrder = async (id: string, currentUser: any) => {
    try {
      setLoading(true);
      const response = await api.orders.getById(id) as any;
      if (response.status === 'success') {
        const orderData = response.data;
        setOrder(orderData);
        
        // Check if current user is the client (buyer)
        const buyerId = orderData.buyerId?._id || orderData.buyerId;
        setIsClient(buyerId === currentUser.id || orderData.buyerId?.email === currentUser.email);
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Request not found</h3>
          <button
            onClick={() => navigate('/delivery-requests/list')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const hasOffers = order.partnerOffers && order.partnerOffers.length > 0;
  const pendingOffers = order.partnerOffers?.filter(o => o.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">📍 Pickup Location</label>
                  <p className="text-gray-900">{order.pickupLocation.address}</p>
                  {order.pickupLocation.city && (
                    <p className="text-xs text-gray-500 mt-1">{order.pickupLocation.city}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {order.pickupLocation.latitude.toFixed(6)}, {order.pickupLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">🎯 Delivery Location</label>
                  <p className="text-gray-900">{order.deliveryLocation.address}</p>
                  {order.deliveryLocation.city && (
                    <p className="text-xs text-gray-500 mt-1">{order.deliveryLocation.city}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {order.deliveryLocation.latitude.toFixed(6)}, {order.deliveryLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

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
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {offer.partnerId.companyName || offer.partnerId.name}
                        </h3>
                        {offer.offerPrice && (
                          <p className="text-sm text-gray-600">
                            Offer: {offer.offerPrice.toLocaleString()} ETB
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
            {order.status === 'assigned' && (
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
    </div>
  );
}

export default ViewDeliveryRequest;
