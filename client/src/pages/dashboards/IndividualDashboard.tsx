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
  buyerId: string;
  deliveryMethod: string;
  status: string;
  orderInfo: {
    productName: string;
    productDescription?: string;
    preferredDeliveryDate?: string;
    deliveryDestination?: string;
    brand?: string;
    quantityType?: string;
    quantityDescription?: string;
  };
  trackingUpdates: Array<{
    status: string;
    message?: string;
    location?: string;
    timestamp: string;
  }>;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  orderId?: string;
  timestamp: Date;
}

interface IndividualDashboardProps {
  user: User;
}

function IndividualDashboard({ user }: IndividualDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Set up polling for order status updates every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'overview' || activeTab === 'orders') {
        checkOrderStatusUpdates();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const addNotification = (type: Notification['type'], message: string, orderId?: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      orderId,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const checkOrderStatusUpdates = async () => {
    try {
      const previousOrders = orders;
      await loadOrders();
      
      // Check for status changes and add notifications
      orders.forEach((currentOrder) => {
        const previousOrder = previousOrders.find(o => o._id === currentOrder._id);
        if (previousOrder && previousOrder.status !== currentOrder.status) {
          const statusMessages: Record<string, string> = {
            'matched': 'Your order has been matched with a traveler!',
            'assigned': 'Your order has been assigned to a delivery partner!',
            'picked_up': 'Your order has been picked up!',
            'in_transit': 'Your order is in transit!',
            'delivered': 'Your order has been delivered!',
            'completed': 'Your order has been completed!',
            'cancelled': 'Your order has been cancelled.'
          };
          
          const message = statusMessages[currentOrder.status] || `Your order status changed to ${currentOrder.status}`;
          addNotification('info', message, currentOrder._id);
        }
      });
    } catch (error) {
      console.error('Error checking order updates:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview' || activeTab === 'orders') {
        await loadOrders();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      // First, get buyer ID from user's buyer record
      const buyersResponse = await api.buyers.getAll() as { data?: any[] | { buyers?: any[] } };
      // Handle both response structures: { data: buyers[] } or { data: { buyers: [] } }
      let buyers: any[] = [];
      if (Array.isArray(buyersResponse.data)) {
        buyers = buyersResponse.data;
      } else if (buyersResponse.data?.buyers) {
        buyers = buyersResponse.data.buyers;
      }
      
      const myBuyer = buyers.find((b: any) => {
        // Match by userId (ObjectId comparison) or email
        const userIdMatch = b.userId && (
          b.userId.toString() === user.id || 
          b.userId === user.id
        );
        const emailMatch = b.email && b.email.toLowerCase() === user.email?.toLowerCase();
        return userIdMatch || emailMatch;
      });
      
      if (myBuyer) {
        const ordersResponse = await api.orders.getByBuyer(myBuyer._id) as { data?: Order[] | { orders?: Order[] } };
        // Handle both response structures: { data: orders[] } or { data: { orders: [] } }
        let myOrders: Order[] = [];
        if (Array.isArray(ordersResponse.data)) {
          myOrders = ordersResponse.data;
        } else if (ordersResponse.data?.orders) {
          myOrders = ordersResponse.data.orders;
        }
        
        setOrders(myOrders);
        setStats({
          totalOrders: myOrders.length,
          activeOrders: myOrders.filter((o: Order) => !['completed', 'cancelled'].includes(o.status)).length
        });
      } else {
        // If no buyer record, try to get orders by user ID
        const allOrdersResponse = await api.orders.getAll() as { data?: Order[] | { orders?: Order[] } };
        // Handle both response structures
        let allOrders: Order[] = [];
        if (Array.isArray(allOrdersResponse.data)) {
          allOrders = allOrdersResponse.data;
        } else if (allOrdersResponse.data?.orders) {
          allOrders = allOrdersResponse.data.orders;
        }
        
        // Filter orders where buyerId might match user
        // First, get all buyers for this user to find their buyerIds
        const userBuyers = buyers.filter((b: any) => {
          const userIdMatch = b.userId && (
            b.userId.toString() === user.id || 
            b.userId === user.id
          );
          const emailMatch = b.email && b.email.toLowerCase() === user.email?.toLowerCase();
          return userIdMatch || emailMatch;
        });
        const userBuyerIds = userBuyers.map((b: any) => b._id.toString());
        
        // Filter orders by buyerId
        const myOrders = allOrders.filter((o: any) => {
          const buyerIdStr = o.buyerId?.toString();
          return userBuyerIds.includes(buyerIdStr) || 
                 o.buyerId === user.id || 
                 buyerIdStr === user.id;
        });
        
        setOrders(myOrders);
        setStats({
          totalOrders: myOrders.length,
          activeOrders: myOrders.filter((o: Order) => !['completed', 'cancelled'].includes(o.status)).length
        });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const canEditOrCancel = (order: Order): boolean => {
    const orderCreatedAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60 * 60);
    
    // Can only edit/cancel within 8 hours and if status is pending or matched
    return hoursSinceCreation <= 8 && ['pending', 'matched'].includes(order.status);
  };

  const handleEditOrder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrCancel(order)) {
      addNotification('error', 'Order can only be edited within 8 hours of creation and when status is pending or matched');
      return;
    }
    setEditingOrder(order);
    setEditFormData({
      productName: order.orderInfo?.productName || '',
      productDescription: order.orderInfo?.productDescription || '',
      preferredDeliveryDate: order.orderInfo?.preferredDeliveryDate ? 
        new Date(order.orderInfo.preferredDeliveryDate).toISOString().split('T')[0] : '',
      deliveryDestination: order.orderInfo?.deliveryDestination || '',
      brand: order.orderInfo?.brand || '',
      quantityType: order.orderInfo?.quantityType || '',
      quantityDescription: order.orderInfo?.quantityDescription || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    
    try {
      setProcessing(true);
      const updateData = {
        orderInfo: {
          productName: editFormData.productName,
          productDescription: editFormData.productDescription,
          preferredDeliveryDate: editFormData.preferredDeliveryDate ? 
            new Date(editFormData.preferredDeliveryDate).toISOString() : undefined,
          deliveryDestination: editFormData.deliveryDestination,
          brand: editFormData.brand,
          quantityType: editFormData.quantityType,
          quantityDescription: editFormData.quantityDescription
        }
      };

      const response = await api.orders.update(editingOrder._id, updateData) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        addNotification('success', 'Order updated successfully!', editingOrder._id);
        setEditingOrder(null);
        await loadOrders();
      } else {
        addNotification('error', response.message || 'Failed to update order');
      }
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to update order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrCancel(order)) {
      addNotification('error', 'Order can only be cancelled within 8 hours of creation and when status is pending or matched');
      return;
    }
    setCancellingOrderId(order._id);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancellingOrderId) return;
    
    try {
      setProcessing(true);
      const response = await api.orders.cancel(cancellingOrderId, cancelReason) as { status?: string; message?: string };
      
      if (response.status === 'success') {
        addNotification('success', 'Order cancelled successfully!', cancellingOrderId);
        setShowCancelModal(false);
        setCancellingOrderId(null);
        setCancelReason('');
        await loadOrders();
      } else {
        addNotification('error', response.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm animate-slide-in ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Individual Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name || 'User'}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'orders', label: 'Orders', icon: '📦' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
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

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeOrders}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Status</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2 capitalize">{user?.status || 'Active'}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/post-order')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Post an Order</p>
                        <p className="text-sm text-gray-600">Create a new order request</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/post-trip')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Post a Trip</p>
                        <p className="text-sm text-gray-600">Share your travel plans</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
              )}
            </>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                <button
                  onClick={() => navigate('/post-order')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Order
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <button
                    onClick={() => navigate('/post-order')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Order
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const canEdit = canEditOrCancel(order);
                    return (
                      <div 
                        key={order._id} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                Order #{order.uniqueId || order._id.slice(-8)}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
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
                              <p><span className="font-medium">Delivery Method:</span> {order.deliveryMethod}</p>
                              {order.orderInfo?.preferredDeliveryDate && (
                                <p><span className="font-medium">Preferred Date:</span> {new Date(order.orderInfo.preferredDeliveryDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Latest Tracking Update */}
                        {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Latest Update</h5>
                            {(() => {
                              const latestUpdate = order.trackingUpdates[order.trackingUpdates.length - 1];
                              return (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">{latestUpdate.status.replace('_', ' ')}</span>
                                  {latestUpdate.message && <span> - {latestUpdate.message}</span>}
                                  {latestUpdate.location && <span> at {latestUpdate.location}</span>}
                                  <span className="text-gray-400 ml-2">
                                    {new Date(latestUpdate.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/order-tracking/${order._id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Details →
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={(e) => handleEditOrder(order, e)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleCancelOrder(order, e)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Account Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive email updates about your orders</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={editFormData.productName}
                  onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                <textarea
                  value={editFormData.productDescription}
                  onChange={(e) => setEditFormData({ ...editFormData, productDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Delivery Date</label>
                <input
                  type="date"
                  value={editFormData.preferredDeliveryDate}
                  onChange={(e) => setEditFormData({ ...editFormData, preferredDeliveryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Destination</label>
                <input
                  type="text"
                  value={editFormData.deliveryDestination}
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryDestination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Please provide a reason for cancellation..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingOrderId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={confirmCancel}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndividualDashboard;
