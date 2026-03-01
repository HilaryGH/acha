import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import PartnerPaymentRecordForm from '../../components/PartnerPaymentRecordForm';
import { logout } from '../../utils/auth';
import FileUpload from '../../components/FileUpload';

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

interface GiftType {
  type: 'Gift Products' | 'Gift Packages' | 'Gift Bundles' | '';
  description: string;
  photo: string;
  price: string;
}

function DeliveryPartnerDashboard({ user }: DeliveryPartnerDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'payment' | 'overview' | 'orders' | 'requests' | 'earnings' | 'profile' | 'settings' | 'giftTypes'>('payment');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [ordersNeedingPayment, setOrdersNeedingPayment] = useState<Order[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<string>('');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  // Gift Types Management (for gift_delivery_partner only)
  const [giftTypes, setGiftTypes] = useState<GiftType[]>([]);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [savingGiftTypes, setSavingGiftTypes] = useState(false);
  const [loadingGiftTypes, setLoadingGiftTypes] = useState(false);
  const [giftTypesMessage, setGiftTypesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get role-specific information
  const getRoleInfo = () => {
    switch (user.role) {
      case 'gift_delivery_partner':
        return {
          title: 'Gift Delivery Partner Dashboard',
          subtitle: 'Welcome, {name}! 🎁',
          badge: 'Gift Delivery',
          badgeColor: 'bg-pink-100 text-pink-800',
          icon: '🎁'
        };
      case 'acha_sisters_delivery_partner':
        return {
          title: 'Acha Sisters Delivery Partner Dashboard',
          subtitle: 'Welcome, {name}! 👭',
          badge: 'Acha Sisters',
          badgeColor: 'bg-purple-100 text-purple-800',
          icon: '👭'
        };
      case 'movers_packers':
        return {
          title: 'Movers & Packers Dashboard',
          subtitle: 'Welcome, {name}! 📦',
          badge: 'Movers & Packers',
          badgeColor: 'bg-orange-100 text-orange-800',
          icon: '📦'
        };
      case 'delivery_partner':
      default:
        return {
          title: 'Delivery Partner Dashboard',
          subtitle: 'Welcome, {name}! 🚚',
          badge: 'Delivery Partner',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: '🚚'
        };
    }
  };

  const roleInfo = getRoleInfo();

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'giftTypes' && user.role === 'gift_delivery_partner') {
      loadPartnerData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview' || activeTab === 'orders' || activeTab === 'earnings' || activeTab === 'payment') {
        const loadedOrders = await loadOrders();
        if (loadedOrders) {
          await loadStats(loadedOrders);
          await checkPaymentRecords(loadedOrders);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentRecords = async (ordersToCheck?: Order[]) => {
    try {
      const ordersData = ordersToCheck || orders;
      
      // Get all payment records for this partner
      const transactions = await api.transactions.getByBuyer(user.id) as { status?: string; data?: any[] };
      const records = transactions.data || [];
      setPaymentRecords(records);
      
      // Auto-load existing payment for editing if on payment tab and no order selected
      if (activeTab === 'payment' && !selectedOrderForPayment && records.length > 0) {
        // Check if there's a general payment record (no orderId)
        const generalPayment = records.find(record => !record.orderId);
        if (generalPayment && !editingTransactionId) {
          setEditingTransactionId(generalPayment._id);
        }
      }
      
      // Find orders that are assigned/accepted but don't have payment records
      const assignedOrders = ordersData.filter(o => 
        (o.status === 'assigned' && o.partnerAcceptanceStatus === 'accepted') ||
        ['picked_up', 'in_transit', 'delivered'].includes(o.status)
      );
      
      // Check which orders don't have payment records
      const ordersWithoutPayment = assignedOrders.filter(order => {
        // Check if there's a payment record for this order
        const hasPaymentRecord = records.some(record => 
          record.orderId && (
            record.orderId._id === order._id || 
            record.orderId.toString() === order._id.toString()
          )
        );
        return !hasPaymentRecord;
      });
      
      setOrdersNeedingPayment(ordersWithoutPayment);
    } catch (error) {
      console.error('Error checking payment records:', error);
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
    if (!window.confirm('Are you sure you want to accept this delivery order?\n\nRemember: You will need to fill out the payment form in the "Record Delivery Payment" tab after accepting.')) {
      return;
    }

    try {
      setProcessingOrder(orderId);
      await api.orders.partnerAcceptOrder({ orderId });
      const updatedOrders = await loadOrders();
      if (updatedOrders) {
        await loadStats(updatedOrders);
        await checkPaymentRecords(updatedOrders);
      }
      alert('Order accepted successfully! The client has been notified.\n\n⚠️ IMPORTANT: Please go to the "Record Delivery Payment" tab to fill out the payment form for this delivery.');
      // Switch to payment tab to remind them
      setActiveTab('payment');
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

  // Load partner data for gift delivery partners
  const loadPartnerData = async () => {
    try {
      setLoadingGiftTypes(true);
      setGiftTypesMessage(null);
      
      // First try to get all partners and filter by email
      const response = await api.partners.getAll({ 
        registrationType: 'Gift Delivery Partner'
      }) as { status?: string; data?: any[] };
      
      if (response.status === 'success' && response.data) {
        // Find partner by email match (case-insensitive)
        const partner = response.data.find((p: any) => 
          p.email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        if (partner) {
          setPartnerData(partner);
          // Convert gift types from backend format to form format
          if (partner.giftTypes && Array.isArray(partner.giftTypes) && partner.giftTypes.length > 0) {
            setGiftTypes(partner.giftTypes.map((gt: any) => ({
              type: gt.type || '',
              description: gt.description || '',
              photo: gt.photo || '',
              price: gt.price?.toString() || ''
            })));
          } else {
            setGiftTypes([]);
          }
        } else {
          // Partner not found - might be a new registration
          setGiftTypes([]);
          setGiftTypesMessage({ 
            type: 'error', 
            text: 'Partner profile not found. Please complete your registration first.' 
          });
        }
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
      setGiftTypesMessage({ type: 'error', text: 'Failed to load gift types. Please try again later.' });
    } finally {
      setLoadingGiftTypes(false);
    }
  };

  // Gift Types Management Functions
  const addGiftType = () => {
    setGiftTypes(prev => [...prev, {
      type: '',
      description: '',
      photo: '',
      price: ''
    }]);
  };

  const removeGiftType = (index: number) => {
    setGiftTypes(prev => prev.filter((_, i) => i !== index));
  };

  const updateGiftType = (index: number, field: keyof GiftType, value: string) => {
    setGiftTypes(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveGiftTypes = async () => {
    if (!partnerData || !partnerData._id) {
      setGiftTypesMessage({ type: 'error', text: 'Partner data not found. Please contact support.' });
      return;
    }

    // Validate gift types
    if (giftTypes.length === 0) {
      setGiftTypesMessage({ type: 'error', text: 'Please add at least one gift type' });
      return;
    }

    // Validate each gift type
    for (const giftType of giftTypes) {
      if (!giftType.type || !giftType.description || !giftType.price) {
        setGiftTypesMessage({ type: 'error', text: 'Please fill all required fields for gift types' });
        return;
      }
    }

    try {
      setSavingGiftTypes(true);
      setGiftTypesMessage(null);

      const updatedGiftTypes = giftTypes.map(gt => ({
        type: gt.type,
        description: gt.description,
        photo: gt.photo,
        price: parseFloat(gt.price)
      }));

      const response = await api.partners.update(partnerData._id, {
        giftTypes: updatedGiftTypes
      }) as { status?: string; message?: string };

      if (response.status === 'success') {
        setGiftTypesMessage({ type: 'success', text: 'Gift types updated successfully!' });
        // Reload partner data to get updated version
        await loadPartnerData();
      } else {
        setGiftTypesMessage({ type: 'error', text: response.message || 'Failed to update gift types' });
      }
    } catch (error: any) {
      setGiftTypesMessage({ type: 'error', text: error.message || 'An error occurred while saving' });
    } finally {
      setSavingGiftTypes(false);
    }
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
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{roleInfo.title}</h1>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.badgeColor}`}>
                    {roleInfo.badge}
                  </span>
                </div>
                <p className="text-sm text-green-100 mt-1">
                  {roleInfo.subtitle.replace('{name}', user?.name || 'Partner')}
                </p>
              </div>
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
                { id: 'payment', label: 'Record Delivery Payment', icon: '💳', badge: ordersNeedingPayment.length > 0 ? ordersNeedingPayment.length : undefined },
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'orders', label: 'My Orders', icon: '📦' },
                { id: 'requests', label: 'Available Requests', icon: '🔔' },
                { id: 'earnings', label: 'Earnings', icon: '💰' },
                ...(user.role === 'gift_delivery_partner' ? [{ id: 'giftTypes', label: 'Gift Types', icon: '🎁' }] : []),
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notification Banner for Orders Needing Payment */}
          {ordersNeedingPayment.length > 0 && activeTab !== 'payment' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Action Required: Payment Forms Needed
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You have <strong>{ordersNeedingPayment.length}</strong> assigned delivery{ordersNeedingPayment.length !== 1 ? 'ies' : ''} that need payment information recorded.
                    </p>
                    <button
                      onClick={() => setActiveTab('payment')}
                      className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                    >
                      Fill Payment Forms Now →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-4">
              {/* Header with notification */}
              {ordersNeedingPayment.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🔔</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        Important: Payment Forms Required
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You have <strong>{ordersNeedingPayment.length}</strong> assigned delivery{ordersNeedingPayment.length !== 1 ? 'ies' : ''} that require payment information to be recorded:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          {ordersNeedingPayment.slice(0, 5).map((order) => (
                            <li key={order._id}>
                              Order #{order.uniqueId || order._id.slice(-8)} - {order.orderInfo?.productName || 'N/A'}
                            </li>
                          ))}
                          {ordersNeedingPayment.length > 5 && (
                            <li className="text-gray-600">...and {ordersNeedingPayment.length - 5} more</li>
                          )}
                        </ul>
                        <p className="mt-2 font-semibold">
                          Please fill out the payment form below for each delivery to ensure proper payment processing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Selection for Payment */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Order (Optional)
                </label>
                <select
                  value={selectedOrderForPayment}
                  onChange={(e) => {
                    const orderId = e.target.value;
                    setSelectedOrderForPayment(orderId);
                    // Find and set order details for auto-calculation
                    const order = orders.find(o => o._id === orderId);
                    setSelectedOrderDetails(order || null);
                    
                    // Check if there's an existing payment for this order
                    if (orderId) {
                      const existingPayment = paymentRecords.find(record => 
                        record.orderId && (
                          record.orderId._id === orderId || 
                          record.orderId.toString() === orderId.toString()
                        )
                      );
                      if (existingPayment) {
                        setEditingTransactionId(existingPayment._id);
                      } else {
                        setEditingTransactionId(null);
                      }
                    } else {
                      // For general payment, check if there's a general payment record
                      const generalPayment = paymentRecords.find(record => !record.orderId);
                      if (generalPayment) {
                        setEditingTransactionId(generalPayment._id);
                      } else {
                        setEditingTransactionId(null);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- General Payment (No Order) --</option>
                  {orders.filter(o => 
                    (o.status === 'assigned' && o.partnerAcceptanceStatus === 'accepted') ||
                    ['picked_up', 'in_transit', 'delivered'].includes(o.status)
                  ).map((order) => (
                      <option key={order._id} value={order._id}>
                        Order #{order.uniqueId || order._id.slice(-8)} - {order.orderInfo?.productName || 'N/A'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Show edit indicator if payment exists */}
              {editingTransactionId && (() => {
                const existingPayment = paymentRecords.find(r => r._id === editingTransactionId);
                return existingPayment ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Editing existing payment:</strong> ETB {existingPayment.amount?.toLocaleString() || '0'} 
                      ({existingPayment.paymentDetails?.paymentBasis || 'N/A'}) - 
                      <button
                        onClick={() => {
                          setEditingTransactionId(null);
                          setSelectedOrderForPayment('');
                          setSelectedOrderDetails(null);
                        }}
                        className="ml-2 text-blue-600 underline hover:text-blue-800"
                      >
                        Create New Instead
                      </button>
                    </p>
                  </div>
                ) : null;
              })()}

              {/* Payment Form - Single form for recording payment */}
              <PartnerPaymentRecordForm 
                partnerId={user.id} 
                role={user.role}
                orderId={selectedOrderForPayment || undefined}
                order={selectedOrderDetails || undefined}
                existingTransactionId={editingTransactionId || undefined}
                ordersNeedingPayment={ordersNeedingPayment}
                onPaymentRecorded={async () => {
                  // Reload orders and check payment records after form submission
                  const loadedOrders = await loadOrders();
                  if (loadedOrders) {
                    await checkPaymentRecords(loadedOrders);
                    await loadStats(loadedOrders);
                    // Reset selection after bulk calculation
                    if (!editingTransactionId) {
                      setSelectedOrderForPayment('');
                      setSelectedOrderDetails(null);
                    }
                  }
                }}
              />

            </div>
          )}

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
                        <span className="text-2xl">{roleInfo.icon}</span>
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
                  {filteredOrders.map((order) => {
                    const needsPayment = ordersNeedingPayment.some(o => o._id === order._id);
                    return (
                    <div key={order._id} className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      needsPayment ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                    }`}>
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
                            {needsPayment && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                                ⚠️ Payment Form Required
                              </span>
                            )}
                          </div>
                          {needsPayment && (
                            <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                              <p className="text-xs text-yellow-800">
                                <strong>Action Required:</strong> This order needs a payment form filled. 
                                <button
                                  onClick={() => {
                                    setActiveTab('payment');
                                    setSelectedOrderForPayment(order._id);
                                  }}
                                  className="ml-1 text-yellow-900 underline font-semibold hover:text-yellow-700"
                                >
                                  Fill Payment Form →
                                </button>
                              </p>
                            </div>
                          )}
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
                    );
                  })}
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
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Earnings & Payments</h3>
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

          {activeTab === 'giftTypes' && user.role === 'gift_delivery_partner' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Manage Gift Types</h3>
                <button
                  type="button"
                  onClick={addGiftType}
                  className="px-4 py-2 text-sm text-white rounded-lg hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
                >
                  + Add Gift Type
                </button>
              </div>

              {giftTypesMessage && (
                <div className={`mb-5 p-3 rounded-lg text-sm ${giftTypesMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {giftTypesMessage.text}
                </div>
              )}

              {loadingGiftTypes && !partnerData ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading gift types...</p>
                </div>
              ) : giftTypes.length === 0 && !loadingGiftTypes ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">No gift types added yet</p>
                  <p className="text-sm text-gray-500 mb-4">Click "Add Gift Type" to add your first gift type</p>
                  <button
                    type="button"
                    onClick={addGiftType}
                    className="px-6 py-2 text-sm text-white rounded-lg hover:shadow-md transition-all"
                    style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
                  >
                    + Add Your First Gift Type
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {giftTypes.map((giftType, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Gift Type #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeGiftType(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">Gift Type *</label>
                          <select
                            value={giftType.type}
                            onChange={(e) => updateGiftType(index, 'type', e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                          >
                            <option value="">-- Select Type --</option>
                            <option value="Gift Products">Gift Products</option>
                            <option value="Gift Packages">Gift Packages</option>
                            <option value="Gift Bundles">Gift Bundles</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">Price *</label>
                          <input
                            type="number"
                            value={giftType.price}
                            onChange={(e) => updateGiftType(index, 'price', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description *</label>
                        <textarea
                          value={giftType.description}
                          onChange={(e) => updateGiftType(index, 'description', e.target.value)}
                          required
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                          placeholder="Describe this gift type..."
                        />
                      </div>
                      
                      <div>
                        <FileUpload
                          label="Photo"
                          value={giftType.photo}
                          onChange={(filePath) => updateGiftType(index, 'photo', filePath)}
                          accept="image/*"
                        />
                        {giftType.photo && (
                          <div className="mt-2">
                            <img
                              src={getImageUrl(giftType.photo)}
                              alt={`Gift type ${index + 1}`}
                              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {giftTypes.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveGiftTypes}
                    disabled={savingGiftTypes}
                    className="px-6 py-2.5 rounded-lg text-sm text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
                  >
                    {savingGiftTypes ? 'Saving...' : 'Save Gift Types'}
                  </button>
                </div>
              )}
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
