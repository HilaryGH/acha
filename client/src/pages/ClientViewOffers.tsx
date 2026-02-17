import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface PartnerOffer {
  _id: string;
  partnerId: {
    _id: string;
    name: string;
    companyName?: string;
    email: string;
    phone: string;
    city?: string;
    primaryLocation?: string;
  };
  offerPrice?: number;
  estimatedDeliveryTime?: string;
  message?: string;
  status: string;
  createdAt: string;
}

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
  partnerOffers: PartnerOffer[];
}

function ClientViewOffers() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [_user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingPartner, setSelectingPartner] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/register');
      return;
    }
    setUser(currentUser);
    if (orderId) {
      loadOffers(orderId);
    }
  }, [orderId, navigate]);

  const loadOffers = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.orders.getPartnerOffers(id) as any;
      if (response.status === 'success') {
        setOrder(response.data.order);
        setOffers(response.data.offers || []);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load offers' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPartner = async (partnerId: string, offerId?: string) => {
    if (!orderId) return;

    setSelectingPartner(partnerId);
    setMessage(null);

    try {
      const response = await api.orders.selectPartner({
        orderId,
        partnerId,
        offerId
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Partner selected successfully! Order status updated to confirmed.' });
        setTimeout(() => {
          navigate(`/orders/track/${orderId}`);
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to select partner' });
    } finally {
      setSelectingPartner(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h3>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Offers</h1>
            <p className="text-gray-600">Review and select a partner for your delivery request</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Item</label>
                <p className="text-gray-900">{order.orderInfo.productName}</p>
                {order.orderInfo.productDescription && (
                  <p className="text-sm text-gray-600 mt-1">{order.orderInfo.productDescription}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Pickup</label>
                  <p className="text-gray-900">{order.pickupLocation.address}</p>
                  {order.pickupLocation.city && (
                    <p className="text-xs text-gray-500">{order.pickupLocation.city}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Delivery</label>
                  <p className="text-gray-900">{order.deliveryLocation.address}</p>
                  {order.deliveryLocation.city && (
                    <p className="text-xs text-gray-500">{order.deliveryLocation.city}</p>
                  )}
                </div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'offers_received' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'assigned' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Status: {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Offers List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Offers ({offers.length})
            </h2>

            {offers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers yet</h3>
                <p className="text-gray-600">
                  Partners are reviewing your request. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div
                    key={offer._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {offer.partnerId.companyName || offer.partnerId.name}
                        </h3>
                        {offer.partnerId.companyName && (
                          <p className="text-sm text-gray-600">{offer.partnerId.name}</p>
                        )}
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>📧 {offer.partnerId.email}</p>
                          <p>📞 {offer.partnerId.phone}</p>
                          {offer.partnerId.city && (
                            <p>📍 {offer.partnerId.city}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {offer.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {offer.offerPrice && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Offer Price</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {offer.offerPrice.toLocaleString()} ETB
                          </p>
                        </div>
                      )}
                      {offer.estimatedDeliveryTime && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Estimated Time</label>
                          <p className="text-gray-900">{offer.estimatedDeliveryTime}</p>
                        </div>
                      )}
                    </div>

                    {offer.message && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{offer.message}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Submitted: {formatDate(offer.createdAt)}
                      </p>
                      {offer.status === 'pending' && order.status !== 'assigned' && (
                        <button
                          onClick={() => handleSelectPartner(offer.partnerId._id, offer._id)}
                          disabled={selectingPartner === offer.partnerId._id}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {selectingPartner === offer.partnerId._id ? 'Selecting...' : 'Select Partner'}
                        </button>
                      )}
                      {offer.status === 'accepted' && (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientViewOffers;
