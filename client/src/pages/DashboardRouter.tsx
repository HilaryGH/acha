import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IndividualDashboard from './dashboards/IndividualDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import MarketingTeamDashboard from './dashboards/MarketingTeamDashboard';
import CustomerSupportDashboard from './dashboards/CustomerSupportDashboard';
import DeliveryPartnerDashboard from './dashboards/DeliveryPartnerDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

function DashboardRouter() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
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

  if (!user) {
    return null;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard user={user} />;
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'marketing_team':
      return <MarketingTeamDashboard user={user} />;
    case 'customer_support':
      return <CustomerSupportDashboard user={user} />;
    case 'delivery_partner':
      return <DeliveryPartnerDashboard user={user} />;
    case 'acha_sisters_delivery_partner':
      return <DeliveryPartnerDashboard user={user} />;
    case 'individual':
    default:
      return <IndividualDashboard user={user} />;
  }
}

export default DashboardRouter;





















