import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

function BrowseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    productName: '',
    currentCity: '',
    deliveryMethod: '',
    status: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.orders.getAll() as any;
      
      // Handle different response structures
      if (response && response.status === 'success') {
        // Standard API response format
        const ordersData = Array.isArray(response.data) ? response.data : [];
        // Filter out cancelled, completed, and delivered orders
        const activeOrders = ordersData.filter((order: any) => 
          order.status !== 'cancelled' && 
          order.status !== 'completed' && 
          order.status !== 'delivered'
        );
        setOrders(activeOrders);
      } else if (Array.isArray(response)) {
        // If response is directly an array
        const activeOrders = response.filter((order: any) => 
          order.status !== 'cancelled' && 
          order.status !== 'completed' && 
          order.status !== 'delivered'
        );
        setOrders(activeOrders);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Handle cases where data exists but status might not be 'success'
        const activeOrders = response.data.filter((order: any) => 
          order.status !== 'cancelled' && 
          order.status !== 'completed' && 
          order.status !== 'delivered'
        );
        setOrders(activeOrders);
      } else {
        // No orders found or unexpected response format
        setOrders([]);
        if (response && response.message) {
          console.warn('API response warning:', response.message);
        }
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders. Please try again later.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    if (filters.productName && order.orderInfo?.productName) {
      if (!order.orderInfo.productName.toLowerCase().includes(filters.productName.toLowerCase())) {
        return false;
      }
    }
    if (filters.currentCity && order.buyerId?.currentCity) {
      if (!order.buyerId.currentCity.toLowerCase().includes(filters.currentCity.toLowerCase())) {
        return false;
      }
    }
    if (filters.deliveryMethod && order.deliveryMethod !== filters.deliveryMethod) {
      return false;
    }
    if (filters.status && order.status !== filters.status) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMatchOrder = (orderId: string) => {
    navigate(`/orders/match/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Browse Orders</h1>
          <p className="text-lg text-gray-600">
            Find available orders and connect with buyers
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={filters.productName}
                onChange={(e) => setFilters(prev => ({ ...prev, productName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by product..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.currentCity}
                onChange={(e) => setFilters(prev => ({ ...prev, currentCity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by location..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method
              </label>
              <select
                value={filters.deliveryMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                <option value="traveler">Traveler</option>
                <option value="partner">Partner</option>
              </select>
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
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
                <option value="assigned">Assigned</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No orders found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order: any) => (
              <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.deliveryMethod === 'traveler' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {order.deliveryMethod === 'traveler' ? '✈️ Traveler' : '🤝 Partner'}
                    </span>
                    {order.assignedTravelerId && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        ✓ Matched
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'active' ? 'bg-green-100 text-green-800' :
                      order.status === 'matched' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {order.orderInfo?.productName || 'Product Order'}
                  </h3>
                  {order.orderInfo?.brand && (
                    <p className="text-sm text-gray-600">Brand: {order.orderInfo.brand}</p>
                  )}
                </div>

                {order.orderInfo?.productDescription && (
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {order.orderInfo.productDescription}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {order.buyerId?.currentCity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Location:</span>
                      <span>{order.buyerId.currentCity}</span>
                    </div>
                  )}
                  {order.orderInfo?.countryOfOrigin && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Origin:</span>
                      <span>{order.orderInfo.countryOfOrigin}</span>
                    </div>
                  )}
                  {order.orderInfo?.preferredDeliveryDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Preferred Date:</span>
                      <span>{formatDate(order.orderInfo.preferredDeliveryDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Posted:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Buyer #{order.buyerId?.uniqueId || order.buyerId?._id?.slice(-8).toUpperCase() || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{order.buyerId?.currentCity || 'Location not specified'}</p>
                  </div>
                </div>

                {order.deliveryMethod === 'traveler' && !order.assignedTravelerId && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleMatchOrder(order._id)}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Match with Traveler
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseOrders;
