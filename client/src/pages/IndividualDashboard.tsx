import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getCurrentUser } from '../utils/auth';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface BuyerProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  currentCity: string;
  status: string;
  createdAt: string;
}

interface Order {
  _id: string;
  uniqueId?: string;
  buyerId: any;
  deliveryMethod: string;
  orderInfo: {
    productName?: string;
    productDescription?: string;
    deliveryDestination?: string;
    preferredDeliveryDate?: string;
    photos?: string[];
  };
  status: string;
  paymentStatus?: string;
  assignedTravelerId?: any;
  assignedPartnerId?: any;
  trackingUpdates?: Array<{
    status: string;
    message?: string;
    location?: string;
    timestamp: string;
  }>;
  createdAt: string;
  pricing?: {
    deliveryFee?: number;
    serviceFee?: number;
    platformFee?: number;
    totalAmount?: number;
    currency?: string;
  };
}

function IndividualDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [buyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders' | 'settings'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0
  });

  useEffect(() => {
    // Get user from localStorage (token should be stored after login/registration)
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    loadUserData();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const currentUser = user || getCurrentUser();
    if (!currentUser) return;
    
    try {
      setOrdersLoading(true);
      const userEmail = currentUser.email?.toLowerCase();
      
      if (!userEmail) {
        console.error('User email not found');
        setOrders([]);
        setStats({ totalOrders: 0, activeOrders: 0 });
        return;
      }

      // Get all buyers with matching email
      const buyersResponse = await api.buyers.getAll() as { status?: string; data?: any[] };
      const buyers = Array.isArray(buyersResponse.data) 
        ? buyersResponse.data 
        : [];
      
      const myBuyers = buyers.filter((b: any) => 
        b.email?.toLowerCase() === userEmail
      );

      if (myBuyers.length === 0) {
        setOrders([]);
        setStats({ totalOrders: 0, activeOrders: 0 });
        return;
      }

      // Get all orders for all buyer IDs
      const allOrders: Order[] = [];
      for (const buyer of myBuyers) {
        try {
          const ordersResponse = await api.orders.getByBuyer(buyer._id) as { 
            status?: string; 
            data?: { orders?: Order[] } | Order[];
            message?: string;
          };
          
          if (ordersResponse.status === 'success') {
            const buyerOrders = Array.isArray(ordersResponse.data) 
              ? ordersResponse.data 
              : (ordersResponse.data as any)?.orders || [];
            allOrders.push(...buyerOrders);
          }
        } catch (error) {
          console.error(`Error fetching orders for buyer ${buyer._id}:`, error);
        }
      }

      // Sort orders by creation date (newest first)
      allOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(allOrders);
      setStats({
        totalOrders: allOrders.length,
        activeOrders: allOrders.filter((o: Order) => 
          !['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase() || '')
        ).length
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
      setStats({ totalOrders: 0, activeOrders: 0 });
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user && (activeTab === 'overview' || activeTab === 'orders')) {
      loadOrders();
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Dispatch a custom event to notify Navbar of logout
    window.dispatchEvent(new Event('logout'));
    // Navigate to home page
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
                    onClick={() => navigate('/find-delivery-item')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Find Delivery</p>
                        <p className="text-sm text-gray-600">Search for delivery items</p>
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
                      value={user?.phone || buyerProfile?.phone || ''}
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
                  {buyerProfile && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={buyerProfile.currentCity || ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <input
                          type="text"
                          value={buyerProfile.status || ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Profile
                  </button>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  + New Order
                </button>
              </div>

              {ordersLoading ? (
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.uniqueId || order._id.slice(-8)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {order.orderInfo?.productName || order.orderInfo?.productDescription || 'N/A'}
                            </div>
                            {order.orderInfo?.deliveryDestination && (
                              <div className="text-sm text-gray-500">
                                To: {order.orderInfo.deliveryDestination}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {order.deliveryMethod?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'completed' || order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : order.status === 'assigned' || order.status === 'matched'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : order.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.paymentStatus || 'unpaid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/order/${order._id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                View
                              </button>
                              {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                                <button
                                  onClick={() => navigate(`/order/${order._id}/track`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Track Order"
                                >
                                  Track
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive SMS updates about your orders</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Danger Zone</h4>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IndividualDashboard;



