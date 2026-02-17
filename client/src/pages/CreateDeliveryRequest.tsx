import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

function CreateDeliveryRequest() {
  const navigate = useNavigate();
  const [_user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    buyerId: '',
    pickupLocation: {
      address: '',
      latitude: 0,
      longitude: 0,
      city: ''
    },
    deliveryLocation: {
      address: '',
      latitude: 0,
      longitude: 0,
      city: ''
    },
    itemDescription: '',
    itemValue: '',
    preferredDeliveryTime: '',
    specialInstructions: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/register');
      return;
    }
    setUser(currentUser);
    
    // Try to get buyer ID from user
    loadBuyerId(currentUser);
  }, [navigate]);

  const loadBuyerId = async (currentUser: any) => {
    try {
      // Try to find or create buyer
      const buyersResponse = await api.buyers.getAll() as any;
      const buyers = buyersResponse.data || buyersResponse || [];
      const buyer = Array.isArray(buyers) 
        ? buyers.find((b: any) => 
            b.email === currentUser.email || b.userId === currentUser.id
          )
        : null;
      
      if (buyer) {
        setFormData(prev => ({ ...prev, buyerId: buyer._id }));
      } else {
        // Create buyer if doesn't exist (with required fields)
        const newBuyer = await api.buyers.create({
          name: currentUser.name || 'User',
          email: currentUser.email,
          phone: currentUser.phone || '0000000000', // Required field
          currentCity: currentUser.city || currentUser.currentCity || 'Unknown',
          bankAccount: currentUser.bankAccount || 'N/A' // Required field
        }) as any;
        if (newBuyer.data?._id || newBuyer._id) {
          setFormData(prev => ({ ...prev, buyerId: newBuyer.data?._id || newBuyer._id }));
        }
      }
    } catch (error) {
      console.error('Error loading buyer:', error);
      setMessage({ type: 'error', text: 'Error setting up buyer account. Please try again.' });
    }
  };

  const getCurrentLocation = (type: 'pickup' | 'delivery') => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (GOOGLE_MAPS_API_KEY) {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
              );
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const address = data.results[0].formatted_address;
                const city = data.results[0].address_components.find(
                  (comp: any) => comp.types.includes('locality')
                )?.long_name || '';
                
                if (type === 'pickup') {
                  setFormData(prev => ({
                    ...prev,
                    pickupLocation: {
                      address,
                      latitude,
                      longitude,
                      city
                    }
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    deliveryLocation: {
                      address,
                      latitude,
                      longitude,
                      city
                    }
                  }));
                }
              }
            } else {
              // Fallback: use coordinates only
              const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              if (type === 'pickup') {
                setFormData(prev => ({
                  ...prev,
                  pickupLocation: {
                    address,
                    latitude,
                    longitude,
                    city: ''
                  }
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  deliveryLocation: {
                    address,
                    latitude,
                    longitude,
                    city: ''
                  }
                }));
              }
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            if (type === 'pickup') {
              setFormData(prev => ({
                ...prev,
                pickupLocation: { address, latitude, longitude, city: '' }
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                deliveryLocation: { address, latitude, longitude, city: '' }
              }));
            }
          }
        },
        (_error) => {
          setMessage({ type: 'error', text: 'Unable to get your location. Please enter manually.' });
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('pickup.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pickupLocation: { ...prev.pickupLocation, [field]: value }
      }));
    } else if (name.startsWith('delivery.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deliveryLocation: { ...prev.deliveryLocation, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.buyerId) {
      setMessage({ type: 'error', text: 'Please wait while we set up your account...' });
      return;
    }

    if (!formData.pickupLocation.latitude || !formData.pickupLocation.longitude) {
      setMessage({ type: 'error', text: 'Please set pickup location' });
      return;
    }

    if (!formData.deliveryLocation.latitude || !formData.deliveryLocation.longitude) {
      setMessage({ type: 'error', text: 'Please set delivery location' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.orders.createDeliveryRequest({
        buyerId: formData.buyerId,
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        itemDescription: formData.itemDescription,
        itemValue: formData.itemValue ? parseFloat(formData.itemValue) : undefined,
        preferredDeliveryTime: formData.preferredDeliveryTime || undefined,
        specialInstructions: formData.specialInstructions || undefined
      }) as any;

      if (response.status === 'success') {
        setMessage({ type: 'success', text: 'Delivery request created successfully! Partners will be notified.' });
        setTimeout(() => {
          navigate(`/delivery-requests/${response.data.order._id}`);
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create delivery request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Delivery Request</h1>
          <p className="text-gray-600 mb-6">Fill in the details below to request a delivery</p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pickup Location */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📍 Pickup Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="pickup.address"
                      value={formData.pickupLocation.address}
                      onChange={handleChange}
                      placeholder="Enter pickup address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => getCurrentLocation('pickup')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📍 Use Current
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="pickup.city"
                      value={formData.pickupLocation.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coordinates</label>
                    <input
                      type="text"
                      value={`${formData.pickupLocation.latitude.toFixed(6)}, ${formData.pickupLocation.longitude.toFixed(6)}`}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Delivery Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="delivery.address"
                      value={formData.deliveryLocation.address}
                      onChange={handleChange}
                      placeholder="Enter delivery address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => getCurrentLocation('delivery')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📍 Use Current
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="delivery.city"
                      value={formData.deliveryLocation.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coordinates</label>
                    <input
                      type="text"
                      value={`${formData.deliveryLocation.latitude.toFixed(6)}, ${formData.deliveryLocation.longitude.toFixed(6)}`}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">📦 Item Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Description
                </label>
                <textarea
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleChange}
                  placeholder="Describe what needs to be delivered"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Value (ETB)
                  </label>
                  <input
                    type="number"
                    name="itemValue"
                    value={formData.itemValue}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Time
                  </label>
                  <input
                    type="datetime-local"
                    name="preferredDeliveryTime"
                    value={formData.preferredDeliveryTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  placeholder="Any special instructions for the delivery partner"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Delivery Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateDeliveryRequest;
