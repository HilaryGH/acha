import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { logout } from '../../utils/auth';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Order {
  _id: string;
  uniqueId: string;
  buyerId: any;
  deliveryMethod: string;
  status: string;
  orderInfo: {
    productName?: string;
    productDescription?: string;
    preferredDeliveryDate?: string;
    photos?: string[];
    video?: string;
  };
  pricing?: {
    deliveryFee?: number;
    serviceFee?: number;
    platformFee?: number;
    totalAmount?: number;
    currency?: string;
  };
  trackingUpdates: Array<{
    status: string;
    message?: string;
    location?: string;
    timestamp: string;
  }>;
  createdAt: string;
  assignedPartnerId?: any;
  partnerAcceptanceStatus?: 'pending' | 'accepted' | 'rejected';
}

interface DeliveryPartnerDashboardProps {
  user: User;
}

function DeliveryPartnerDashboard({ user }: DeliveryPartnerDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'requests' | 'earnings' | 'profile' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview' || activeTab === 'orders' || activeTab === 'earnings') {
        const loadedOrders = await loadOrders();
        if (loadedOrders) {
          await loadStats(loadedOrders);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (): Promise<Order[]> => {
    try {
      // Fetch orders assigned to this partner/user
      const response = await api.orders.getForPartner() as { status?: string; data?: Order[]; count?: number };
      if (response.status === 'success') {
        // Handle both array and object response structures
        const ordersData = Array.isArray(response.data) ? response.data : [];
        setOrders(ordersData);
        return ordersData;
      } else {
        // Fallback: fetch all orders and filter
        const fallbackResponse = await api.orders.getAll() as { data?: Order[] | { orders?: Order[] } };
        let allOrders: Order[] = [];
        if (Array.isArray(fallbackResponse.data)) {
          allOrders = fallbackResponse.data;
        } else if (fallbackResponse.data && typeof fallbackResponse.data === 'object' && 'orders' in fallbackResponse.data) {
          allOrders = Array.isArray(fallbackResponse.data.orders) ? fallbackResponse.data.orders : [];
        }
        const myOrders = allOrders.filter((o: any) => 
          o.assignedPartnerId === user.id || 
          (o.assignedPartnerId && o.assignedPartnerId.toString() === user.id) ||
          (o.assignedPartnerId?._id && o.assignedPartnerId._id.toString() === user.id)
        );
        setOrders(myOrders);
        return myOrders;
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fallback on error
      try {
        const fallbackResponse = await api.orders.getAll() as { data?: Order[] | { orders?: Order[] } };
        let allOrders: Order[] = [];
        if (Array.isArray(fallbackResponse.data)) {
          allOrders = fallbackResponse.data;
        } else if (fallbackResponse.data && typeof fallbackResponse.data === 'object' && 'orders' in fallbackResponse.data) {
          allOrders = Array.isArray(fallbackResponse.data.orders) ? fallbackResponse.data.orders : [];
        }
        const myOrders = allOrders.filter((o: any) => 
          o.assignedPartnerId === user.id || 
          (o.assignedPartnerId && o.assignedPartnerId.toString() === user.id) ||
          (o.assignedPartnerId?._id && o.assignedPartnerId._id.toString() === user.id)
        );
        setOrders(myOrders);
        return myOrders;
      } catch (fallbackError) {
        console.error('Fallback error loading orders:', fallbackError);
        setOrders([]);
        return [];
      }
    }
  };

  const loadStats = async (ordersToUse?: Order[]) => {
    try {
      const ordersData = ordersToUse || orders;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeDeliveries = ordersData.filter(o => 
        ['assigned', 'picked_up', 'in_transit'].includes(o.status)
      ).length;

      const completedToday = ordersData.filter(o => {
        if (o.status === 'completed' || o.status === 'delivered') {
          const completedDate = o.trackingUpdates?.find(t => 
            t.status === 'completed' || t.status === 'delivered'
          )?.timestamp;
          if (completedDate) {
            return new Date(completedDate) >= today;
          }
        }
        return false;
      }).length;

      // Calculate actual earnings from completed orders
      // Partner earnings = deliveryFee from completed/delivered orders
      const completedOrders = ordersData.filter(o => 
        o.status === 'completed' || o.status === 'delivered'
      );
      
      const totalEarnings = completedOrders.reduce((total, order) => {
        // Use deliveryFee if available, otherwise default to 0
        const deliveryFee = order.pricing?.deliveryFee || 0;
        return total + deliveryFee;
      }, 0);

      setStats({
        activeDeliveries,
        completedToday,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, message?: string, location?: string) => {
    try {
      await api.orders.updateStatus(orderId, status, message, location);
      const updatedOrders = await loadOrders();
      if (updatedOrders) {
        await loadStats(updatedOrders);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to accept this delivery order?')) {
      return;
    }

    try {
      setProcessingOrder(orderId);
      await api.orders.partnerAcceptOrder({ orderId });
      const updatedOrders = await loadOrders();
      if (updatedOrders) {
        await loadStats(updatedOrders);
      }
      alert('Order accepted successfully! The client has been notified.');
    } catch (error: any) {
      console.error('Error accepting order:', error);
      alert(error.message || 'Failed to accept order');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to reject this delivery order? The order will be reassigned to another partner.')) {
      return;
    }

    try {
      setProcessingOrder(orderId);
      await api.orders.partnerRejectOrder({ orderId });
      const updatedOrders = await loadOrders();
      if (updatedOrders) {
        await loadStats(updatedOrders);
      }
      alert('Order rejected. The client has been notified and the order will be reassigned.');
    } catch (error: any) {
      console.error('Error rejecting order:', error);
      alert(error.message || 'Failed to reject order');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };

  const filteredOrders = orders.filter(o => 
    filterStatus === 'all' || o.status === filterStatus
  );

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Delivery Partner Dashboard</h1>
              <p className="text-sm text-green-100 mt-1">Welcome, {user?.name || 'Partner'}! 🚚</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-green-900 bg-white border border-white rounded-lg hover:bg-green-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'orders', label: 'My Orders', icon: '📦' },
                { id: 'requests', label: 'Available Requests', icon: '🔔' },
                { id: 'earnings', label: 'Earnings', icon: '💰' },
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading statistics...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeDeliveries}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <span className="text-2xl">🚚</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed Today</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedToday}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <span className="text-2xl">✅</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">ETB {stats.totalEarnings.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Delivery Orders</h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No orders assigned yet</p>
                  <p className="text-sm text-gray-500">Orders will appear here once assigned to you</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Order #{order.uniqueId || order._id.slice(-8)}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Product:</span> {order.orderInfo?.productName || 'N/A'}</p>
                            {order.orderInfo?.productDescription && (
                              <p><span className="font-medium">Description:</span> {order.orderInfo.productDescription}</p>
                            )}
                            {order.orderInfo?.preferredDeliveryDate && (
                              <p><span className="font-medium">Preferred Date:</span> {new Date(order.orderInfo.preferredDeliveryDate).toLocaleDateString()}</p>
                            )}
                            {order.buyerId && (
                              <p><span className="font-medium">Buyer:</span> {order.buyerId.name} ({order.buyerId.email})</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Images */}
                      {order.orderInfo?.photos && order.orderInfo.photos.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Order Images:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {order.orderInfo.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={getImageUrl(photo)}
                                alt={`Order image ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                                onClick={() => window.open(getImageUrl(photo), '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video */}
                      {order.orderInfo?.video && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Order Video:</h5>
                          <video
                            src={getImageUrl(order.orderInfo.video)}
                            controls
                            className="w-full max-w-md rounded-lg border border-gray-200"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}

                      {/* Accept/Reject Actions for Assigned Orders */}
                      {order.status === 'assigned' && (!order.partnerAcceptanceStatus || order.partnerAcceptanceStatus === 'pending') && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            disabled={processingOrder === order._id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingOrder === order._id ? 'Processing...' : '✓ Accept Order'}
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order._id)}
                            disabled={processingOrder === order._id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingOrder === order._id ? 'Processing...' : '✗ Reject Order'}
                          </button>
                        </div>
                      )}

                      {/* Status Update Actions - Only show after acceptance */}
                      {order.status === 'assigned' && order.partnerAcceptanceStatus === 'accepted' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'picked_up', 'Item picked up')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Mark as Picked Up
                          </button>
                        </div>
                      )}
                      {order.status === 'picked_up' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'in_transit', 'Item in transit')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Mark as In Transit
                          </button>
                        </div>
                      )}
                      {order.status === 'in_transit' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'delivered', 'Item delivered')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Mark as Delivered
                          </button>
                        </div>
                      )}

                      {/* Tracking Updates */}
                      {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Tracking Updates</h5>
                          <div className="space-y-2">
                            {order.trackingUpdates.slice().reverse().map((update, idx) => (
                              <div key={idx} className="text-xs text-gray-600">
                                <span className="font-medium">{update.status.replace('_', ' ')}</span>
                                {update.message && <span> - {update.message}</span>}
                                {update.location && <span> at {update.location}</span>}
                                <span className="text-gray-400 ml-2">
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Available Delivery Requests</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/partner/requests')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View All Requests
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 mb-4">
                  💡 Browse available delivery requests and submit offers to get new orders.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/partner/requests')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Requests Page →
                  </button>
                  <button
                    onClick={() => navigate('/partner-with-us')}
                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Complete Partner Registration
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Earnings & Payments</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">ETB {stats.totalEarnings.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        From {orders.filter(o => o.status === 'completed' || o.status === 'delivered').length} completed delivery{orders.filter(o => o.status === 'completed' || o.status === 'delivered').length !== 1 ? 'ies' : ''}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Completed Deliveries</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {orders.filter(o => o.status === 'completed' || o.status === 'delivered').length}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Average per Delivery</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      ETB {orders.filter(o => o.status === 'completed' || o.status === 'delivered').length > 0
                        ? Math.round(stats.totalEarnings / orders.filter(o => o.status === 'completed' || o.status === 'delivered').length).toLocaleString()
                        : '0'}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status)).length}
                    </p>
                  </div>
                </div>

                {/* Recent Earnings */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading earnings...</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Completed Deliveries</h4>
                    {orders.filter(o => o.status === 'completed' || o.status === 'delivered').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No completed deliveries yet</p>
                        <p className="text-sm mt-2">Your earnings will appear here once you complete deliveries</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders
                          .filter(o => o.status === 'completed' || o.status === 'delivered')
                          .slice(0, 10)
                          .map((order) => (
                            <div key={order._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {order.orderInfo?.productName || `Order #${order.uniqueId || order._id.slice(-8)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">
                                  ETB {(order.pricing?.deliveryFee || 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Note:</strong> Earnings are calculated from completed deliveries. Payment processing and withdrawal options will be available soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Partner Profile</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={user?.phone || ''}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <input
                      type="text"
                      value={user?.status || ''}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                    />
                  </div>
                </div>
                {/* Bank Account Information */}
                {orders.length > 0 && orders[0]?.assignedPartnerId?.bankAccount && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Bank Account Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders[0].assignedPartnerId.bankAccount.accountNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                          <p className="text-sm text-gray-900">{orders[0].assignedPartnerId.bankAccount.accountNumber}</p>
                        </div>
                      )}
                      {orders[0].assignedPartnerId.bankAccount.bankName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                          <p className="text-sm text-gray-900">{orders[0].assignedPartnerId.bankAccount.bankName}</p>
                        </div>
                      )}
                      {orders[0].assignedPartnerId.bankAccount.accountHolderName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                          <p className="text-sm text-gray-900">{orders[0].assignedPartnerId.bankAccount.accountHolderName}</p>
                        </div>
                      )}
                      {orders[0].assignedPartnerId.bankAccount.branch && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                          <p className="text-sm text-gray-900">{orders[0].assignedPartnerId.bankAccount.branch}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Partner Settings</h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                  <p className="text-sm text-gray-600">Manage your delivery availability</p>
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Available for deliveries</span>
                    </label>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Notifications</h4>
                  <p className="text-sm text-gray-600">Configure delivery notifications</p>
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryPartnerDashboard;
