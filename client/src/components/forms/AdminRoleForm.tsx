import { useState } from 'react';
import { api } from '../../services/api';

interface AdminRoleFormProps {
  role: 'super_admin' | 'admin' | 'customer_support' | 'marketing_team';
}

function AdminRoleForm({ role }: AdminRoleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    try {
      // Register user
      const registrationData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: role
      };
      
      // Only include optional fields if they're not empty
      if (formData.phone && formData.phone.trim()) {
        registrationData.phone = formData.phone.trim();
      }
      if (formData.department && formData.department.trim()) {
        registrationData.department = formData.department.trim();
      }
      
      console.log('Registering user with data:', { ...registrationData, password: '***' });
      const userResponse = await api.users.register(registrationData) as { status?: string; message?: string; data?: { user?: { id: string }; token?: string } };
      console.log('Registration response:', userResponse);
      
      if (userResponse.status === 'success') {
        // Store user data and token in localStorage
        if (userResponse.data?.user) {
          localStorage.setItem('user', JSON.stringify(userResponse.data.user));
        }
        if (userResponse.data?.token) {
          localStorage.setItem('token', userResponse.data.token);
        }
        
        setMessage({ type: 'success', text: `${role.replace('_', ' ')} registered successfully! Redirecting to dashboard...` });
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: ''
        });
      } else {
        setMessage({ type: 'error', text: userResponse.message || 'Failed to register' });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'An error occurred during registration';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    'super_admin': 'Super Admin',
    'admin': 'Admin',
    'customer_support': 'Customer Support',
    'marketing_team': 'Marketing Team'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/acha.png" 
            alt="Acha Logo" 
            className="h-12 md:h-16 object-contain"
          />
        </div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Register as {roleLabels[role]}</h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="Department name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
          >
            {loading ? 'Submitting...' : `Register as ${roleLabels[role]}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminRoleForm;

