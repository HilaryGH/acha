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
  department?: string;
}

interface Partner {
  _id: string;
  uniqueId: string;
  name: string;
  email: string;
  phone: string;
  registrationType: string;
  status: string;
  createdAt: string;
  companyName?: string;
  type?: string;
  partner?: string;
  investmentType?: string;
  idDocument?: string;
  license?: string;
  tradeRegistration?: string;
}

interface AuditLog {
  _id: string;
  action: string;
  performedBy: string;
  status: string;
  timestamp: string;
  ipAddress: string;
}

interface Document {
  id: string;
  uniqueId: string;
  entityType: string;
  entityName: string;
  email: string;
  phone: string;
  status: string;
  documents: Array<{
    type: string;
    path: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
  travellerType?: string;
}

interface SuperAdminDashboardProps {
  user: User;
}

function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'partners' | 'transactions' | 'audit' | 'settings' | 'documents' | 'partner-with-us' | 'women-initiatives' | 'premium-community'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingPartners: 0,
    activeOrders: 0,
    systemStatus: 'Online'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerWithUs, setPartnerWithUs] = useState<Partner[]>([]);
  const [womenInitiatives, setWomenInitiatives] = useState<any[]>([]);
  const [premiumCommunity, setPremiumCommunity] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userDocuments, setUserDocuments] = useState<Record<string, Document[]>>({});
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [loadingUserDocs, setLoadingUserDocs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [documentFilter, setDocumentFilter] = useState<{ status?: string; type?: string }>({});
  const [partnerWithUsFilter, setPartnerWithUsFilter] = useState<{ status?: string }>({});
  const [womenInitiativesFilter, setWomenInitiativesFilter] = useState<{ status?: string }>({});
  const [premiumFilter, setPremiumFilter] = useState<{ status?: string; category?: string }>({});
  const [pdfViewer, setPdfViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
      loadTransactionStats();
    } else if (activeTab === 'documents') {
      loadDocuments();
    } else if (activeTab === 'partner-with-us') {
      loadPartnerWithUs();
    } else if (activeTab === 'women-initiatives') {
      loadWomenInitiatives();
    } else if (activeTab === 'premium-community') {
      loadPremiumCommunity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionFilters, documentFilter, partnerWithUsFilter, womenInitiativesFilter, premiumFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        await loadOverviewStats();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'partners') {
        await loadPartners();
      } else if (activeTab === 'transactions') {
        await loadTransactions();
        await loadTransactionStats();
      } else if (activeTab === 'audit') {
        await loadAuditLogs();
      } else if (activeTab === 'documents') {
        await loadDocuments();
      } else if (activeTab === 'partner-with-us') {
        await loadPartnerWithUs();
      } else if (activeTab === 'women-initiatives') {
        await loadWomenInitiatives();
      } else if (activeTab === 'premium-community') {
        await loadPremiumCommunity();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewStats = async () => {
    try {
      const [usersRes, partnersRes, ordersRes] = await Promise.all([
        api.users.getAll().catch(() => ({ data: { users: [] } })),
        api.partners.getAll().catch(() => ({ status: 'success', data: [] })),
        api.orders.getAll().catch(() => ({ data: { orders: [] } }))
      ]) as Array<{ data?: { users?: User[] } | User[]; status?: string }>;

      const allUsers = Array.isArray((usersRes as any).data) ? (usersRes as any).data : ((usersRes as any).data?.users || []);
      const allPartners = Array.isArray((partnersRes as any).data) ? (partnersRes as any).data : [];
      const allOrders = Array.isArray((ordersRes as any).data) ? (ordersRes as any).data : ((ordersRes as any).data?.orders || []);

      setStats({
        totalUsers: allUsers.length,
        pendingPartners: allPartners.filter((p: Partner) => p.status === 'pending' && p.registrationType !== 'Invest/Partner').length,
        activeOrders: allOrders.filter((o: any) => !['completed', 'cancelled'].includes(o.status)).length,
        systemStatus: 'Online'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.users.getAll() as { data?: { users?: User[] } };
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPartners = async () => {
    try {
      const response = await api.partners.getAll() as { status?: string; data?: Partner[] };
      // Filter out "Invest/Partner" registrations - those belong in "Partner With Us" tab
      const allPartners = Array.isArray(response.data) ? response.data : [];
      const filteredPartners = allPartners.filter((partner: Partner) => partner.registrationType !== 'Invest/Partner');
      setPartners(filteredPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await api.audit.getAll() as { data?: { logs?: any[] } };
      setAuditLogs(response.data?.logs || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const params: any = {};
      if (transactionFilters.status) params.status = transactionFilters.status;
      if (transactionFilters.paymentMethod) params.paymentMethod = transactionFilters.paymentMethod;
      if (transactionFilters.startDate) params.startDate = transactionFilters.startDate;
      if (transactionFilters.endDate) params.endDate = transactionFilters.endDate;
      
      const response = await api.transactions.getAll(params) as { status?: string; data?: any[] | { data?: any[] }; count?: number };
      // Handle different response structures
      if (response.status === 'success') {
        if (Array.isArray(response.data)) {
          setTransactions(response.data);
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
          setTransactions(response.data.data);
        } else {
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const loadTransactionStats = async () => {
    try {
      const params: any = {};
      if (transactionFilters.startDate) params.startDate = transactionFilters.startDate;
      if (transactionFilters.endDate) params.endDate = transactionFilters.endDate;
      
      const response = await api.transactions.getStats(transactionFilters.startDate, transactionFilters.endDate) as { status?: string; data?: any };
      // Handle different response structures
      if (response.status === 'success') {
        if (response.data && typeof response.data === 'object') {
          setTransactionStats(response.data);
        } else {
          setTransactionStats(response);
        }
      } else {
        setTransactionStats(null);
      }
    } catch (error) {
      console.error('Error loading transaction stats:', error);
      setTransactionStats(null);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await api.users.update(userId, { status: newStatus });
      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleUpdatePartnerStatus = async (partnerId: string, newStatus: string) => {
    try {
      await api.partners.update(partnerId, { status: newStatus });
      await loadPartners();
      await loadOverviewStats();
    } catch (error) {
      console.error('Error updating partner status:', error);
      alert('Failed to update partner status');
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.documents.getAll(documentFilter) as { status?: string; data?: { documents?: Document[] }; count?: number; message?: string };
      console.log('Documents API response:', response);
      
      if (response.status === 'success') {
        // Handle both response structures: data.documents or data directly as array
        if (response.data) {
          if (Array.isArray(response.data)) {
            setDocuments(response.data);
          } else if (response.data.documents && Array.isArray(response.data.documents)) {
            setDocuments(response.data.documents);
          } else {
            console.warn('Unexpected response structure:', response);
            setDocuments([]);
          }
        } else {
          setDocuments([]);
        }
      } else {
        console.error('Documents API returned error:', response.message || 'Unknown error');
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (entityType: string, entityId: string, action: 'approve' | 'reject' | 'verify', documentType?: string) => {
    try {
      await api.documents.verify({
        entityType,
        entityId,
        action,
        documentType
      });
      await loadDocuments();
      // Reload user documents if any user is expanded
      expandedUsers.forEach(userId => {
        loadUserDocuments(userId);
      });
      alert(`Document ${action}d successfully`);
    } catch (error: any) {
      console.error('Error verifying document:', error);
      alert(error.message || 'Failed to verify document');
    }
  };

  const loadUserDocuments = async (userId: string) => {
    if (userDocuments[userId]) {
      // Already loaded, just toggle expansion
      toggleUserExpansion(userId);
      return;
    }

    setLoadingUserDocs(prev => new Set(prev).add(userId));
    try {
      const response = await api.documents.getByUser(userId) as { status?: string; data?: { documents?: Document[] } };
      if (response.status === 'success' && response.data?.documents) {
        setUserDocuments(prev => ({
          ...prev,
          [userId]: response.data!.documents!
        }));
        setExpandedUsers(prev => new Set(prev).add(userId));
      } else {
        setUserDocuments(prev => ({
          ...prev,
          [userId]: []
        }));
        setExpandedUsers(prev => new Set(prev).add(userId));
      }
    } catch (error) {
      console.error('Error loading user documents:', error);
      setUserDocuments(prev => ({
        ...prev,
        [userId]: []
      }));
    } finally {
      setLoadingUserDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const loadPartnerWithUs = async () => {
    try {
      setLoading(true);
      const response = await api.partners.getAll({ registrationType: 'Invest/Partner', ...partnerWithUsFilter }) as { status?: string; data?: Partner[] };
      if (response.status === 'success' && Array.isArray(response.data)) {
        setPartnerWithUs(response.data);
      } else {
        setPartnerWithUs([]);
      }
    } catch (error) {
      console.error('Error loading Partner With Us:', error);
      setPartnerWithUs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWomenInitiatives = async () => {
    try {
      setLoading(true);
      const response = await api.womenInitiatives.getAll(womenInitiativesFilter) as { status?: string; data?: any[]; count?: number };
      if (response.status === 'success') {
        if (Array.isArray(response.data)) {
          setWomenInitiatives(response.data);
        } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).womenInitiatives)) {
          setWomenInitiatives((response.data as any).womenInitiatives);
        } else {
          setWomenInitiatives([]);
        }
      } else {
        setWomenInitiatives([]);
      }
    } catch (error) {
      console.error('Error loading Women Initiatives:', error);
      setWomenInitiatives([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumCommunity = async () => {
    try {
      setLoading(true);
      const response = await api.premium.getAll(premiumFilter) as { status?: string; data?: any[]; count?: number };
      if (response.status === 'success') {
        if (Array.isArray(response.data)) {
          setPremiumCommunity(response.data);
        } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).premiums)) {
          setPremiumCommunity((response.data as any).premiums);
        } else {
          setPremiumCommunity([]);
        }
      } else {
        setPremiumCommunity([]);
      }
    } catch (error) {
      console.error('Error loading Premium Community:', error);
      setPremiumCommunity([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePartnerWithUsStatus = async (partnerId: string, newStatus: string) => {
    try {
      await api.partners.update(partnerId, { status: newStatus });
      await loadPartnerWithUs();
      await loadOverviewStats();
    } catch (error) {
      console.error('Error updating Partner With Us status:', error);
      alert('Failed to update status');
    }
  };

  const handleUpdateWomenInitiativeStatus = async (id: string, newStatus: string) => {
    try {
      await api.womenInitiatives.update(id, { status: newStatus });
      await loadWomenInitiatives();
    } catch (error) {
      console.error('Error updating Women Initiative status:', error);
      alert('Failed to update status');
    }
  };

  const handleUpdatePremiumStatus = async (id: string, newStatus: string) => {
    try {
      await api.premium.update(id, { status: newStatus });
      await loadPremiumCommunity();
    } catch (error) {
      console.error('Error updating Premium status:', error);
      alert('Failed to update status');
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredPartners = partners.filter(partner => 
    partner.status === 'pending' || activeTab === 'partners'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="shadow-sm border-b" style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
              <p className="text-sm text-white opacity-90 mt-1">Welcome, {user?.name || 'Super Admin'}! 👑</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-[#1E88E5] border border-white hover:bg-opacity-90 transition-colors"
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
                { id: 'users', label: 'User Management', icon: '👥' },
                { id: 'documents', label: 'Documents', icon: '📄' },
                { id: 'partner-with-us', label: 'Partner With Us', icon: '🤝' },
                { id: 'women-initiatives', label: 'Women Initiatives', icon: '👩' },
                { id: 'premium-community', label: 'Premium Community', icon: '⭐' },
                { id: 'partners', label: 'Partners', icon: '🚚' },
                { id: 'transactions', label: 'Transactions', icon: '💰' },
                { id: 'audit', label: 'Audit Logs', icon: '📋' },
                { id: 'settings', label: 'System Settings', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#1E88E5]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={activeTab === tab.id ? { borderBottomColor: '#1E88E5', borderBottomWidth: '2px' } : {}}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading statistics...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#1E88E5' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(30, 136, 229, 0.1)' }}>
                        <span className="text-2xl">👥</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#26C6DA' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Partners</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingPartners}</p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(38, 198, 218, 0.1)' }}>
                        <span className="text-2xl">🤝</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#43A047' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Orders</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeOrders}</p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(67, 160, 71, 0.1)' }}>
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">System Status</p>
                        <p className="text-lg font-bold text-green-600 mt-2">✓ {stats.systemStatus}</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">⚡</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Transaction Statistics */}
              {transactionStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ETB {(transactionStats.summary?.totalRevenue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">From completed transactions</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {transactionStats.summary?.totalTransactions || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">All statuses</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#43A047' }}>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {transactionStats.summary?.completedCount || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {transactionStats.summary?.totalTransactions > 0 
                          ? `${Math.round(((transactionStats.summary?.completedCount || 0) / transactionStats.summary?.totalTransactions) * 100)}% completion rate`
                          : 'No transactions'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {transactionStats.summary?.pendingCount || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
                    </div>
                  </div>
                  
                  {/* Additional Stats for Completed Transactions */}
                  {transactionStats.summary?.completedCount > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-6 border border-green-200">
                        <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                        <p className="text-2xl font-bold text-green-700 mt-2">
                          ETB {((transactionStats.summary?.totalRevenue || 0) - (transactionStats.summary?.totalFees || 0))
                            .toFixed(2)
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">After fees deduction</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-sm p-6 border border-blue-200">
                        <p className="text-sm font-medium text-gray-600">Total Fees Collected</p>
                        <p className="text-2xl font-bold text-blue-700 mt-2">
                          ETB {(transactionStats.summary?.totalFees || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Platform + Service fees</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm p-6 border border-purple-200">
                        <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                        <p className="text-2xl font-bold text-purple-700 mt-2">
                          ETB {transactionStats.summary?.completedCount > 0
                            ? ((transactionStats.summary?.totalRevenue || 0) / transactionStats.summary?.completedCount)
                                .toFixed(2)
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : '0.00'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Per completed transaction</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filter Transactions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTransactionFilters(prev => ({ ...prev, status: transactionFilters.status === 'completed' ? '' : 'completed' }));
                        setTimeout(() => loadTransactions(), 100);
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        transactionFilters.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {transactionFilters.status === 'completed' ? '✓ Completed Only' : 'Show Completed'}
                    </button>
                    <button
                      onClick={loadTransactions}
                      className="px-4 py-2 text-white rounded-lg transition-colors text-sm hover:opacity-90"
                      style={{ backgroundColor: '#1E88E5' }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                      value={transactionFilters.status}
                      onChange={(e) => {
                        setTransactionFilters(prev => ({ ...prev, status: e.target.value }));
                        loadTransactions();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                    >
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <select
                      value={transactionFilters.paymentMethod}
                      onChange={(e) => {
                        setTransactionFilters(prev => ({ ...prev, paymentMethod: e.target.value }));
                        loadTransactions();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                    >
                      <option value="">All</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="acha_pay">Acha Pay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                      type="date"
                      value={transactionFilters.startDate}
                      onChange={(e) => {
                        setTransactionFilters(prev => ({ ...prev, startDate: e.target.value }));
                        if (e.target.value) loadTransactions();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                      type="date"
                      value={transactionFilters.endDate}
                      onChange={(e) => {
                        setTransactionFilters(prev => ({ ...prev, endDate: e.target.value }));
                        if (e.target.value) loadTransactions();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Completed Transactions Summary */}
              {transactions.filter(t => t.status === 'completed').length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ✅ Completed Transactions Summary
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      {transactions.filter(t => t.status === 'completed').length} Completed
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        ETB {transactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
                          .toFixed(2)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-medium text-gray-600">Platform Fees</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        ETB {transactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + (t.fees?.platformFee || 0), 0)
                          .toFixed(2)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-medium text-gray-600">Service Fees</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        ETB {transactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + (t.fees?.serviceFee || 0), 0)
                          .toFixed(2)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-medium text-gray-600">Net Revenue</p>
                      <p className="text-xl font-bold text-green-600 mt-1">
                        ETB {transactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => {
                            const amount = t.amount || 0;
                            const platformFee = t.fees?.platformFee || 0;
                            const serviceFee = t.fees?.serviceFee || 0;
                            return sum + (amount - platformFee - serviceFee);
                          }, 0)
                          .toFixed(2)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Transactions {transactions.length > 0 && `(${transactions.length})`}
                  </h3>
                  <button
                    onClick={loadTransactions}
                    className="px-4 py-2 text-white rounded-lg transition-colors text-sm hover:opacity-90"
                    style={{ backgroundColor: '#1E88E5' }}
                  >
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                    <p className="mt-4 text-gray-600">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          {transactions.some(t => t.status === 'completed' && t.fees) && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees Breakdown</th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          {transactions.some(t => t.status === 'completed' && (t.invoiceNumber || t.receiptNumber)) && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice/Receipt</th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions
                          .sort((a, b) => {
                            // Sort completed transactions first, then by date
                            if (a.status === 'completed' && b.status !== 'completed') return -1;
                            if (a.status !== 'completed' && b.status === 'completed') return 1;
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                          })
                          .map((transaction) => (
                          <tr key={transaction._id} className={transaction.status === 'completed' ? 'bg-green-50/30' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.uniqueId || transaction._id.slice(-8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.orderId?.uniqueId || transaction.orderId?._id?.slice(-8) || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.buyerId?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {transaction.amount?.toFixed(2) || '0.00'} {transaction.currency || 'ETB'}
                            </td>
                            {transactions.some(t => t.status === 'completed' && t.fees) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.status === 'completed' && transaction.fees ? (
                                  <div className="text-xs">
                                    <div>Platform: ETB {(transaction.fees.platformFee || 0).toFixed(2)}</div>
                                    <div>Service: ETB {(transaction.fees.serviceFee || 0).toFixed(2)}</div>
                                    <div>Delivery: ETB {(transaction.fees.deliveryFee || 0).toFixed(2)}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.status || 'N/A'}
                              </span>
                            </td>
                            {transactions.some(t => t.status === 'completed' && (t.invoiceNumber || t.receiptNumber)) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.status === 'completed' ? (
                                  <div className="text-xs">
                                    {transaction.invoiceNumber && (
                                      <div className="text-blue-600 font-medium">INV: {transaction.invoiceNumber}</div>
                                    )}
                                    {transaction.receiptNumber && (
                                      <div className="text-green-600 font-medium">RCP: {transaction.receiptNumber}</div>
                                    )}
                                    {!transaction.invoiceNumber && !transaction.receiptNumber && (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{new Date(transaction.createdAt).toLocaleDateString()}</div>
                              {transaction.status === 'completed' && transaction.paidAt && (
                                <div className="text-xs text-green-600">
                                  Paid: {new Date(transaction.paidAt).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
                <button
                  onClick={loadDocuments}
                  className="px-4 py-2 text-white rounded-lg transition-colors text-sm hover:opacity-90"
                  style={{ backgroundColor: '#1E88E5' }}
                >
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <select
                  value={documentFilter.status || ''}
                  onChange={(e) => setDocumentFilter({ ...documentFilter, status: e.target.value || undefined })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="verified">Verified</option>
                </select>
                <select
                  value={documentFilter.type || ''}
                  onChange={(e) => setDocumentFilter({ ...documentFilter, type: e.target.value || undefined })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="partner">Partners</option>
                  <option value="traveller">Travellers</option>
                  <option value="womenInitiative">Women Initiatives</option>
                  <option value="buyer">Buyers</option>
                  <option value="sender">Senders</option>
                  <option value="receiver">Receivers</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No documents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{doc.entityName}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              doc.status === 'approved' || doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.status}
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                              {doc.entityType}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Email:</span> {doc.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {doc.phone}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {doc.uniqueId}
                            </div>
                            {doc.travellerType && (
                              <div>
                                <span className="font-medium">Type:</span> {doc.travellerType}
                              </div>
                            )}
                          </div>
                          
                          {/* Documents */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Documents:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {doc.documents.map((document, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">{document.name}</span>
                                  </div>
                                  <div className="mb-2">
                                    {(() => {
                                      // Check if it's a Cloudinary URL or local path
                                      const isCloudinaryUrl = document.path.startsWith('http://') || document.path.startsWith('https://');
                                      const imageUrl = isCloudinaryUrl ? document.path : `${import.meta.env.VITE_API_BASE_URL || ''}${document.path}`;
                                      const isImage = document.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                                                     (isCloudinaryUrl && document.path.includes('image/upload'));
                                      const isVideo = document.path.match(/\.(mp4|mov|avi|webm|mkv)$/i) || 
                                                     (isCloudinaryUrl && document.path.includes('video/upload'));
                                      
                                      if (isImage) {
                                        return (
                                          <img 
                                            src={imageUrl}
                                            alt={document.name}
                                            className="w-full h-32 object-cover rounded"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                            }}
                                          />
                                        );
                                      } else if (isVideo) {
                                        return (
                                          <video 
                                            src={imageUrl}
                                            className="w-full h-32 object-cover rounded"
                                            controls
                                          />
                                        );
                                      } else {
                                        return (
                                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">📄 {document.name.includes('pdf') ? 'PDF' : 'Document'}</span>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const url = document.path.startsWith('http://') || document.path.startsWith('https://') 
                                        ? document.path 
                                        : `${import.meta.env.VITE_API_BASE_URL || ''}${document.path}`;
                                      setPdfViewer({ isOpen: true, url, title: document.name });
                                    }}
                                    className="text-xs underline transition-colors hover:opacity-80 cursor-pointer"
                                    style={{ color: '#1E88E5' }}
                                  >
                                    View Document
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {doc.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleVerifyDocument(doc.entityType, doc.id, 'verify')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleVerifyDocument(doc.entityType, doc.id, 'approve')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Please provide a reason for rejection:');
                                  if (reason) {
                                    handleVerifyDocument(doc.entityType, doc.id, 'reject', undefined);
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {doc.status === 'reviewed' && (
                            <>
                              <button
                                onClick={() => handleVerifyDocument(doc.entityType, doc.id, 'approve')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Please provide a reason for rejection:');
                                  if (reason) {
                                    handleVerifyDocument(doc.entityType, doc.id, 'reject', undefined);
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <button 
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#1E88E5' }}
                >
                  Create User
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="marketing_team">Marketing Team</option>
                  <option value="customer_support">Customer Support</option>
                  <option value="individual">Individual</option>
                  <option value="delivery_partner">Delivery Partner</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((u) => {
                        const isExpanded = expandedUsers.has(u.id);
                        const userDocs = userDocuments[u.id] || [];
                        const isLoadingDocs = loadingUserDocs.has(u.id);
                        
                        return (
                          <>
                            <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                            {u.phone && <div className="text-sm text-gray-500">{u.phone}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize" style={{ backgroundColor: 'rgba(30, 136, 229, 0.1)', color: '#1E88E5' }}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.status === 'active' ? 'bg-green-100 text-green-800' :
                              u.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => loadUserDocuments(u.id)}
                                  className="flex items-center gap-1 transition-colors hover:opacity-80"
                                  style={{ color: '#1E88E5' }}
                                  disabled={isLoadingDocs}
                                >
                                  {isLoadingDocs ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#1E88E5' }}></div>
                                      <span>Loading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>📄</span>
                                      <span>{isExpanded ? 'Hide' : 'View'} Documents</span>
                                      {userDocs.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'rgba(30, 136, 229, 0.1)', color: '#1E88E5' }}>
                                          {userDocs.length}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <select
                              value={u.status}
                              onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </td>
                        </tr>
                            {isExpanded && (
                              <tr key={`${u.id}-docs`}>
                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                  {isLoadingDocs ? (
                                    <div className="text-center py-4">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                                      <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
                                    </div>
                                  ) : userDocs.length === 0 ? (
                                    <div className="text-center py-4">
                                      <p className="text-sm text-gray-600">No documents found for this user</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Uploaded Documents:</h4>
                                      {userDocs.map((doc) => (
                                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold text-gray-900">{doc.entityName}</span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                  doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                  doc.status === 'approved' || doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                  doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                  'bg-blue-100 text-blue-800'
                                                }`}>
                                                  {doc.status}
                                                </span>
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                                                  {doc.entityType}
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                                {doc.documents.map((document, idx) => (
                                                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <span className="text-xs font-medium text-gray-700">{document.name}</span>
                                                    </div>
                                                    <div className="mb-2">
                                                      {(() => {
                                                        const isCloudinaryUrl = document.path.startsWith('http://') || document.path.startsWith('https://');
                                                        const imageUrl = isCloudinaryUrl ? document.path : `${import.meta.env.VITE_API_BASE_URL || ''}${document.path}`;
                                                        const isImage = document.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                                                                       (isCloudinaryUrl && document.path.includes('image/upload'));
                                                        const isVideo = document.path.match(/\.(mp4|mov|avi|webm|mkv)$/i) || 
                                                                       (isCloudinaryUrl && document.path.includes('video/upload'));
                                                        
                                                        if (isImage) {
                                                          return (
                                                            <img 
                                                              src={imageUrl}
                                                              alt={document.name}
                                                              className="w-full h-24 object-cover rounded"
                                                              onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                                              }}
                                                            />
                                                          );
                                                        } else if (isVideo) {
                                                          return (
                                                            <video 
                                                              src={imageUrl}
                                                              className="w-full h-24 object-cover rounded"
                                                              controls
                                                            />
                                                          );
                                                        } else {
                                                          return (
                                                            <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                                                              <span className="text-gray-500 text-xs">📄 {document.name.includes('pdf') ? 'PDF' : 'Document'}</span>
                                                            </div>
                                                          );
                                                        }
                                                      })()}
                                                    </div>
                                                    <button
                                                      onClick={() => {
                                                        const url = document.path.startsWith('http://') || document.path.startsWith('https://') 
                                                          ? document.path 
                                                          : `${import.meta.env.VITE_API_BASE_URL || ''}${document.path}`;
                                                        setPdfViewer({ isOpen: true, url, title: document.name });
                                                      }}
                                                      className="text-xs underline transition-colors hover:opacity-80 cursor-pointer"
                                                      style={{ color: '#1E88E5' }}
                                                    >
                                                      View Document
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                              {doc.status === 'pending' && (
                                                <>
                                                  <button
                                                    onClick={() => handleVerifyDocument(doc.entityType, doc.id, 'verify')}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs whitespace-nowrap hover:bg-blue-700"
                                                  >
                                                    Verify
                                                  </button>
                                                  <button
                                                    onClick={() => handleVerifyDocument(doc.entityType, doc.id, 'approve')}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs whitespace-nowrap hover:bg-green-700"
                                                  >
                                                    Approve
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      const reason = prompt('Please provide a reason for rejection:');
                                                      if (reason) {
                                                        handleVerifyDocument(doc.entityType, doc.id, 'reject', undefined);
                                                      }
                                                    }}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs whitespace-nowrap hover:bg-red-700"
                                                  >
                                                    Reject
                                                  </button>
                                                </>
                                              )}
                                              {doc.status === 'reviewed' && (
                                                <>
                                                  <button
                                                    onClick={() => handleVerifyDocument(doc.entityType, doc.id, 'approve')}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs whitespace-nowrap hover:bg-green-700"
                                                  >
                                                    Approve
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      const reason = prompt('Please provide a reason for rejection:');
                                                      if (reason) {
                                                        handleVerifyDocument(doc.entityType, doc.id, 'reject', undefined);
                                                      }
                                                    }}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs whitespace-nowrap hover:bg-red-700"
                                                  >
                                                    Reject
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'partner-with-us' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Partner With Us (Invest/Partner) Registrations</h3>
                <button
                  onClick={loadPartnerWithUs}
                  className="px-4 py-2 text-white rounded-lg transition-colors text-sm hover:opacity-90"
                  style={{ backgroundColor: '#1E88E5' }}
                >
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <select
                  value={partnerWithUsFilter.status || ''}
                  onChange={(e) => {
                    setPartnerWithUsFilter({ status: e.target.value || undefined });
                    loadPartnerWithUs();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading registrations...</p>
                </div>
              ) : partnerWithUs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No Partner With Us registrations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {partnerWithUs.map((partner) => (
                    <div key={partner._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{partner.name}</h4>
                            {partner.companyName && <span className="text-sm text-gray-600">({partner.companyName})</span>}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              partner.status === 'approved' ? 'bg-green-100 text-green-800' :
                              partner.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {partner.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Email:</span> {partner.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {partner.phone}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> {partner.type}
                            </div>
                            <div>
                              <span className="font-medium">Partner:</span> {partner.partner}
                            </div>
                            <div>
                              <span className="font-medium">Investment Type:</span> {partner.investmentType}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {partner.uniqueId}
                            </div>
                          </div>
                          
                          {/* Documents */}
                          {(partner.idDocument || partner.license || partner.tradeRegistration) && (
                            <div className="mt-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Documents:</h5>
                              <div className="flex flex-wrap gap-2">
                                {partner.idDocument && (
                                  <button
                                    onClick={() => {
                                      const docUrl = partner.idDocument!;
                                      const url = docUrl.startsWith('http') ? docUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${docUrl}`;
                                      setPdfViewer({ isOpen: true, url, title: 'ID Document' });
                                    }}
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80 cursor-pointer"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    ID Document
                                  </button>
                                )}
                                {partner.license && (
                                  <button
                                    onClick={() => {
                                      const licenseUrl = partner.license!;
                                      const url = licenseUrl.startsWith('http') ? licenseUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${licenseUrl}`;
                                      setPdfViewer({ isOpen: true, url, title: 'License' });
                                    }}
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80 cursor-pointer"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    License
                                  </button>
                                )}
                                {partner.tradeRegistration && (
                                  <button
                                    onClick={() => {
                                      const regUrl = partner.tradeRegistration!;
                                      const url = regUrl.startsWith('http') ? regUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${regUrl}`;
                                      setPdfViewer({ isOpen: true, url, title: 'Trade Registration' });
                                    }}
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80 cursor-pointer"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    Trade Registration
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {partner.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdatePartnerWithUsStatus(partner._id, 'reviewed')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleUpdatePartnerWithUsStatus(partner._id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePartnerWithUsStatus(partner._id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {partner.status === 'reviewed' && (
                            <>
                              <button
                                onClick={() => handleUpdatePartnerWithUsStatus(partner._id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePartnerWithUsStatus(partner._id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'women-initiatives' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Women Initiatives Registrations</h3>
                <button
                  onClick={loadWomenInitiatives}
                  className="px-4 py-2 text-white rounded-lg transition-colors text-sm hover:opacity-90"
                  style={{ backgroundColor: '#1E88E5' }}
                >
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <select
                  value={womenInitiativesFilter.status || ''}
                  onChange={(e) => {
                    setWomenInitiativesFilter({ status: e.target.value || undefined });
                    loadWomenInitiatives();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading registrations...</p>
                </div>
              ) : womenInitiatives.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No Women Initiatives registrations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {womenInitiatives.map((women) => (
                    <div key={women._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{women.fullName}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              women.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              women.status === 'approved' ? 'bg-green-100 text-green-800' :
                              women.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {women.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Email:</span> {women.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {women.phone || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Age:</span> {women.age}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {women.location || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">City:</span> {women.city || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {women.uniqueId}
                            </div>
                          </div>
                          
                          {/* Documents */}
                          {(women.idDocument || women.profilePhoto || women.certificates) && (
                            <div className="mt-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Documents:</h5>
                              <div className="flex flex-wrap gap-2">
                                {women.idDocument && (
                                  <button
                                    onClick={() => {
                                      const url = women.idDocument.startsWith('http') ? women.idDocument : `${import.meta.env.VITE_API_BASE_URL || ''}${women.idDocument}`;
                                      setPdfViewer({ isOpen: true, url, title: 'ID Document' });
                                    }}
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80 cursor-pointer"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    ID Document
                                  </button>
                                )}
                                {women.profilePhoto && (
                                  <button
                                    onClick={() => {
                                      const url = women.profilePhoto.startsWith('http') ? women.profilePhoto : `${import.meta.env.VITE_API_BASE_URL || ''}${women.profilePhoto}`;
                                      setPdfViewer({ isOpen: true, url, title: 'Profile Photo' });
                                    }}
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80 cursor-pointer"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    Profile Photo
                                  </button>
                                )}
                                {women.certificates && (
                                  <button
                                    onClick={() => {
                                      const url = women.certificates.startsWith('http') ? women.certificates : `${import.meta.env.VITE_API_BASE_URL || ''}${women.certificates}`;
                                      setPdfViewer({ isOpen: true, url, title: 'Certificates' });
                                    }}
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80 cursor-pointer"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    Certificates
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {women.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateWomenInitiativeStatus(women._id, 'reviewed')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleUpdateWomenInitiativeStatus(women._id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateWomenInitiativeStatus(women._id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {women.status === 'reviewed' && (
                            <>
                              <button
                                onClick={() => handleUpdateWomenInitiativeStatus(women._id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateWomenInitiativeStatus(women._id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'premium-community' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Acha Premium Community Registrations</h3>
                <button
                  onClick={loadPremiumCommunity}
                  className="px-4 py-2 text-white rounded-lg transition-colors text-sm hover:opacity-90"
                  style={{ backgroundColor: '#1E88E5' }}
                >
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <select
                  value={premiumFilter.status || ''}
                  onChange={(e) => {
                    setPremiumFilter({ ...premiumFilter, status: e.target.value || undefined });
                    loadPremiumCommunity();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={premiumFilter.category || ''}
                  onChange={(e) => {
                    setPremiumFilter({ ...premiumFilter, category: e.target.value || undefined });
                    loadPremiumCommunity();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="delivery-partners">Delivery Partners</option>
                  <option value="corporate-clients">Corporate Clients</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading registrations...</p>
                </div>
              ) : premiumCommunity.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No Premium Community registrations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {premiumCommunity.map((premium) => (
                    <div key={premium._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{premium.name}</h4>
                            {premium.companyName && <span className="text-sm text-gray-600">({premium.companyName})</span>}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              premium.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              premium.status === 'approved' || premium.status === 'active' ? 'bg-green-100 text-green-800' :
                              premium.status === 'rejected' || premium.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {premium.status}
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full capitalize" style={{ backgroundColor: 'rgba(30, 136, 229, 0.1)', color: '#1E88E5' }}>
                              {premium.category?.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Email:</span> {premium.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {premium.phone}
                            </div>
                            <div>
                              <span className="font-medium">Subscription:</span> {premium.subscriptionType}
                            </div>
                            {premium.deliveryPartnerType && (
                              <div>
                                <span className="font-medium">Partner Type:</span> {premium.deliveryPartnerType.replace('-', ' ')}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Price:</span> {premium.price} ETB
                            </div>
                            <div>
                              <span className="font-medium">Payment:</span> {premium.paymentStatus || 'pending'}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {premium.uniqueId}
                            </div>
                          </div>
                          
                          {/* Documents */}
                          {(premium.idDocument || premium.license || premium.tradeRegistration) && (
                            <div className="mt-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Documents:</h5>
                              <div className="flex flex-wrap gap-2">
                                {premium.idDocument && (
                                  <a
                                    href={premium.idDocument.startsWith('http') ? premium.idDocument : `${import.meta.env.VITE_API_BASE_URL || ''}${premium.idDocument}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    ID Document
                                  </a>
                                )}
                                {premium.license && (
                                  <a
                                    href={premium.license.startsWith('http') ? premium.license : `${import.meta.env.VITE_API_BASE_URL || ''}${premium.license}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    License
                                  </a>
                                )}
                                {premium.tradeRegistration && (
                                  <a
                                    href={premium.tradeRegistration.startsWith('http') ? premium.tradeRegistration : `${import.meta.env.VITE_API_BASE_URL || ''}${premium.tradeRegistration}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-2 py-1 rounded text-white hover:opacity-80"
                                    style={{ backgroundColor: '#1E88E5' }}
                                  >
                                    Trade Registration
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {premium.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdatePremiumStatus(premium._id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePremiumStatus(premium._id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {premium.status === 'approved' && (
                            <button
                              onClick={() => handleUpdatePremiumStatus(premium._id, 'active')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Partner Applications</h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading partners...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No partner applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPartners.map((partner) => (
                    <div key={partner._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{partner.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              partner.status === 'approved' ? 'bg-green-100 text-green-800' :
                              partner.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {partner.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Email:</span> {partner.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {partner.phone}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> {partner.registrationType}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {partner.uniqueId}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {partner.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdatePartnerStatus(partner._id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePartnerStatus(partner._id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Audit Logs</h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E88E5' }}></div>
                  <p className="mt-4 text-gray-600">Loading audit logs...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.slice(0, 50).map((log) => (
                        <tr key={log._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {log.action.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">System Configuration</h4>
                  <p className="text-sm text-gray-600">Configure system-wide settings and preferences</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Security Settings</h4>
                  <p className="text-sm text-gray-600">Manage security policies and access controls</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewer.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setPdfViewer({ isOpen: false, url: '', title: '' })}>
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{pdfViewer.title}</h3>
              <button
                onClick={() => setPdfViewer({ isOpen: false, url: '', title: '' })}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
              {(() => {
                const isImage = pdfViewer.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                               pdfViewer.url.includes('image/upload');
                
                if (isImage) {
                  return (
                    <img 
                      src={pdfViewer.url} 
                      alt={pdfViewer.title}
                      className="max-w-full max-h-full object-contain rounded"
                      onError={(e) => {
                        // Fallback to iframe if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  );
                } else {
                  return (
                    <iframe
                      src={`${pdfViewer.url}#toolbar=1`}
                      className="w-full h-full min-h-[600px] border-0 rounded"
                      title={pdfViewer.title}
                    />
                  );
                }
              })()}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <a
                href={pdfViewer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => setPdfViewer({ isOpen: false, url: '', title: '' })}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;

















