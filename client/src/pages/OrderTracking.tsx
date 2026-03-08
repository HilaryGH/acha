import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PaymentForm from '../components/PaymentForm';
import Invoice from '../components/Invoice';

function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [downloadingGiftCard, setDownloadingGiftCard] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchTransaction();
      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        fetchOrder();
        fetchTransaction();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchTransaction = async () => {
    if (!orderId) return;
    
    try {
      const response = await api.transactions.getByOrder(orderId) as { status?: string; data?: any[] };
      if (response.status === 'success' && response.data && response.data.length > 0) {
        setTransaction(response.data[0]); // Get the most recent transaction
      }
    } catch (err) {
      // Transaction might not exist yet, that's okay
      console.log('No transaction found yet');
    }
  };

  const fetchOrder = async (retryCount = 0) => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await api.orders.getById(orderId) as { status?: string; data?: any; message?: string };
      if (response.status === 'success') {
        setOrder(response.data);
        setError(null);
      } else {
        // Check if it's a 404 error - might be a timing issue, retry up to 3 times
        if ((response.message?.includes('not found') || response.message?.includes('Order not found')) && retryCount < 3) {
          console.log(`Order not found (attempt ${retryCount + 1}/3), retrying in 2 seconds...`);
          setTimeout(async () => {
            await fetchOrder(retryCount + 1);
          }, 2000);
          return; // Don't set loading to false yet
        } else {
          // If we've exhausted retries, try to get order from transaction
          if (retryCount >= 3) {
            try {
              const transactionResponse = await api.transactions.getByOrder(orderId) as { status?: string; data?: any[] };
              if (transactionResponse.status === 'success' && transactionResponse.data && transactionResponse.data.length > 0) {
                const tx = transactionResponse.data[0];
                if (tx.orderId) {
                  const actualOrderId = typeof tx.orderId === 'string' ? tx.orderId : tx.orderId.toString();
                  console.log('Found order ID from transaction, trying:', actualOrderId);
                  const orderResponse = await api.orders.getById(actualOrderId) as { status?: string; data?: any; message?: string };
                  if (orderResponse.status === 'success') {
                    setOrder(orderResponse.data);
                    setError(null);
                    // Update URL to correct order ID
                    window.history.replaceState({}, '', `/orders/track/${actualOrderId}`);
                    return;
                  }
                }
              }
            } catch (txErr) {
              console.error('Error fetching order from transaction:', txErr);
            }
          }
          setError(response.message || 'Order not found. Please check the order ID and try again.');
        }
      }
    } catch (err: any) {
      // Check if it's a 404 error - might be a timing issue, retry up to 3 times
      if ((err.message?.includes('not found') || err.message?.includes('Order not found') || err.message?.includes('404')) && retryCount < 3) {
        console.log(`Order not found in catch (attempt ${retryCount + 1}/3), retrying in 2 seconds...`);
        setTimeout(async () => {
          await fetchOrder(retryCount + 1);
        }, 2000);
        return; // Don't set loading to false yet
      } else {
        // If we've exhausted retries, try to get order from transaction
        if (retryCount >= 3) {
          try {
            const transactionResponse = await api.transactions.getByOrder(orderId) as { status?: string; data?: any[] };
            if (transactionResponse.status === 'success' && transactionResponse.data && transactionResponse.data.length > 0) {
              const tx = transactionResponse.data[0];
              if (tx.orderId) {
                const actualOrderId = typeof tx.orderId === 'string' ? tx.orderId : tx.orderId.toString();
                console.log('Found order ID from transaction, trying:', actualOrderId);
                const orderResponse = await api.orders.getById(actualOrderId) as { status?: string; data?: any; message?: string };
                if (orderResponse.status === 'success') {
                  setOrder(orderResponse.data);
                  setError(null);
                  // Update URL to correct order ID
                  window.history.replaceState({}, '', `/orders/track/${actualOrderId}`);
                  return;
                }
              }
            }
          } catch (txErr) {
            console.error('Error fetching order from transaction:', txErr);
          }
        }
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderId) return;
    
    setConfirming(true);
    try {
      const response = await api.orders.confirmDelivery(orderId) as { status?: string; message?: string };
      if (response.status === 'success') {
        await fetchOrder();
      } else {
        setError(response.message || 'Failed to confirm delivery');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pending',
      matched: 'Matched with Traveler',
      assigned: 'Assigned to Partner',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-2">{error}</p>
            {error.includes('not found') && (
              <p className="text-sm text-red-600 mb-4">
                The order might still be processing. Please wait a moment and try again.
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  fetchOrder();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Tracking</h1>
          <p className="text-lg text-gray-600">Order ID: {order.uniqueId || order._id}</p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Order Details</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-semibold text-gray-900">{order.orderInfo?.productName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivery Method</p>
              <p className="font-semibold text-gray-900 capitalize">{order.deliveryMethod}</p>
            </div>
            {order.orderInfo?.brand && (
              <div>
                <p className="text-sm text-gray-600">Brand</p>
                <p className="font-semibold text-gray-900">{order.orderInfo.brand}</p>
              </div>
            )}
            {order.orderInfo?.quantityDescription && (
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-semibold text-gray-900">{order.orderInfo.quantityDescription}</p>
              </div>
            )}
          </div>

          {order.orderInfo?.productDescription && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-gray-900">{order.orderInfo.productDescription}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Payment Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.paymentStatus ? order.paymentStatus.toUpperCase() : 'PENDING'}
                </span>
              </div>
              {/* Show invoice button (for both pending/payment due and completed, with or without transaction) */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInvoice(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {transaction && transaction.status === 'completed' ? 'View Invoice' : 'View Payment Due Invoice'}
                </button>
                  {order.deliveryMethod === 'gift_delivery_partner' && (
                    <button
                      onClick={async () => {
                        try {
                          setError(null);
                          setDownloadingGiftCard(true);
                          console.log('Starting gift card download for order:', order._id);
                          await api.orders.downloadGiftCard(order._id);
                          console.log('Gift card download completed');
                          // Refresh order to get updated gift card URL
                          await fetchOrder();
                        } catch (error: any) {
                          console.error('Error downloading gift card:', error);
                          setError(error.message || 'Failed to download gift card');
                        } finally {
                          setDownloadingGiftCard(false);
                        }
                      }}
                      disabled={downloadingGiftCard}
                      className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2 ${
                        downloadingGiftCard ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {downloadingGiftCard ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Gift Card
                        </>
                      )}
                    </button>
                  )}
              </div>
            </div>
            {order.pricing && (
              <div className="mt-3 text-sm">
                <p className="text-gray-600">Total Amount: <span className="font-semibold">{order.pricing.totalAmount?.toFixed(2) || '0.00'} {order.pricing.currency || 'ETB'}</span></p>
              </div>
            )}
          </div>

          {/* Assigned Info */}
          {order.assignedTravelerId && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Assigned Traveler</p>
              <p className="text-blue-800">Traveler #{order.assignedTravelerId.uniqueId || order.assignedTravelerId._id?.slice(-8).toUpperCase()}</p>
              <p className="text-sm text-blue-600">{order.assignedTravelerId.email}</p>
              {order.assignedTravelerId.phone && (
                <p className="text-sm text-blue-600">
                  <a href={`tel:${order.assignedTravelerId.phone}`} className="hover:underline">
                    📞 {order.assignedTravelerId.phone}
                  </a>
                </p>
              )}
            </div>
          )}

          {order.assignedPartnerId && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900 mb-2">Assigned Partner</p>
              <p className="text-purple-800">Partner #{order.assignedPartnerId.uniqueId || order.assignedPartnerId._id?.slice(-8).toUpperCase()}</p>
              <p className="text-sm text-purple-600">{order.assignedPartnerId.email}</p>
            </div>
          )}
        </div>

        {/* Payment Form - Show if payment is pending */}
        {order.paymentStatus === 'pending' && !transaction && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Complete Payment</h2>
            {showPayment ? (
              <PaymentForm
                orderId={order._id}
                buyerId={order.buyerId._id || order.buyerId}
                amount={order.pricing?.itemValue || 0}
                fees={{
                  deliveryFee: order.pricing?.deliveryFee || 50,
                  serviceFee: order.pricing?.serviceFee || 25,
                  platformFee: order.pricing?.platformFee || 15,
                  total: (order.pricing?.deliveryFee || 50) + (order.pricing?.serviceFee || 25) + (order.pricing?.platformFee || 15)
                }}
                onSuccess={(trans) => {
                  setTransaction(trans);
                  setShowPayment(false);
                  fetchOrder();
                }}
                onCancel={() => setShowPayment(false)}
              />
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Please complete payment to proceed with your order.</p>
                <button
                  onClick={() => setShowPayment(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoice && order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <Invoice
                transactionId={transaction?._id}
                orderId={order._id}
                onClose={() => setShowInvoice(false)}
              />
            </div>
          </div>
        )}

        {/* Tracking Updates */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tracking Updates</h2>
          {order.trackingUpdates && order.trackingUpdates.length > 0 ? (
            <div className="space-y-4">
              {order.trackingUpdates
                .slice()
                .reverse()
                .map((update: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                      }`}></div>
                      {index < order.trackingUpdates.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}>
                          {getStatusLabel(update.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(update.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {update.message && (
                        <p className="text-gray-700 text-sm">{update.message}</p>
                      )}
                      {update.location && (
                        <p className="text-gray-600 text-xs mt-1">📍 {update.location}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600">No tracking updates yet.</p>
          )}
        </div>

        {/* Confirm Delivery Button */}
        {order.status === 'delivered' && !order.deliveryConfirmed && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delivery</h3>
            <p className="text-gray-600 mb-4">Please confirm that you have received your order.</p>
            <button
              onClick={handleConfirmDelivery}
              disabled={confirming}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </div>
        )}

        {order.deliveryConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 font-semibold text-lg">Delivery Confirmed!</p>
            <p className="text-green-600 mt-2">Thank you for using Acha Delivery.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTracking;





