import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Partner {
  _id: string;
  uniqueId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  city?: string;
  primaryLocation?: string;
  distance?: number;
  distanceText?: string;
  availability?: {
    isOnline: boolean;
    isAvailable: boolean;
  };
}

function SearchDeliveryPartners() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    itemDescription: '',
    itemValue: '',
    specialInstructions: '',
  });
  const [buyerId, setBuyerId] = useState<string | null>(null);

  useEffect(() => {
    // Get buyer ID from localStorage if available
    const storedBuyer = localStorage.getItem('buyerId');
    if (storedBuyer) {
      setBuyerId(storedBuyer);
    }

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Unable to get your location. Please enter pickup location manually.');
        }
      );
    }
  }, []);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // Simple geocoding - in production, use Google Maps Geocoding API
    // For now, return null and let user enter coordinates manually
    return null;
  };

  const handleSearch = async () => {
    if (!pickupLocation) {
      setError('Please set pickup location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.partners.searchNearby({
        latitude: pickupLocation.lat,
        longitude: pickupLocation.lng,
        radius: searchRadius,
      }) as { status?: string; data?: Partner[]; message?: string };

      if (response.status === 'success' && response.data) {
        setPartners(response.data);
        if (response.data.length === 0) {
          setError('No delivery partners found nearby. Try increasing the search radius.');
        }
      } else {
        setError(response.message || 'Failed to search partners');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!buyerId) {
      setError('Please login or register as a buyer first');
      return;
    }

    if (!pickupLocation || !deliveryLocation) {
      setError('Please set both pickup and delivery locations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.orders.createDeliveryRequest({
        buyerId,
        pickupLocation: {
          latitude: pickupLocation.lat,
          longitude: pickupLocation.lng,
          address: pickupAddress,
        },
        deliveryLocation: {
          latitude: deliveryLocation.lat,
          longitude: deliveryLocation.lng,
          address: deliveryAddress,
        },
        itemDescription: requestData.itemDescription,
        itemValue: requestData.itemValue ? parseFloat(requestData.itemValue) : undefined,
        specialInstructions: requestData.specialInstructions,
      }) as { status?: string; data?: any; message?: string };

      if (response.status === 'success' && response.data) {
        alert('Delivery request created successfully! Partners have been notified.');
        navigate(`/orders/track/${response.data.order._id}`);
      } else {
        setError(response.message || 'Failed to create delivery request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setPickupLocation({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: 'Current Location',
      });
      setPickupAddress('Current Location');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Find Delivery Partners
          </h1>

          {/* Location Input Section */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Enter pickup address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {userLocation && (
                  <button
                    onClick={handleUseCurrentLocation}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Use Current Location
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Or enter coordinates manually:
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={pickupLocation?.lat || ''}
                  onChange={(e) =>
                    setPickupLocation({
                      lat: parseFloat(e.target.value) || 0,
                      lng: pickupLocation?.lng || 0,
                      address: pickupAddress,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={pickupLocation?.lng || ''}
                  onChange={(e) =>
                    setPickupLocation({
                      lat: pickupLocation?.lat || 0,
                      lng: parseFloat(e.target.value) || 0,
                      address: pickupAddress,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius (km)
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">{searchRadius} km</div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || !pickupLocation}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Nearby Partners'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Partners List */}
          {partners.length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Found {partners.length} Partner{partners.length !== 1 ? 's' : ''} Nearby
              </h2>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div
                    key={partner._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {partner.name || partner.companyName}
                        </h3>
                        {partner.companyName && partner.name && (
                          <p className="text-sm text-gray-600">{partner.companyName}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            📍 {partner.city || partner.primaryLocation || 'Location not specified'}
                          </p>
                          <p className="text-sm text-gray-600">
                            📞 {partner.phone}
                          </p>
                          {partner.distanceText && (
                            <p className="text-sm font-semibold text-green-600">
                              🚴 {partner.distanceText}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {partner.availability?.isOnline && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mb-2">
                            Online
                          </span>
                        )}
                        {partner.availability?.isAvailable && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Request Delivery Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowRequestForm(!showRequestForm)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {showRequestForm ? 'Cancel Request' : 'Request Delivery'}
                </button>
              </div>
            </div>
          )}

          {/* Delivery Request Form */}
          {showRequestForm && (
            <div className="mt-6 border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Create Delivery Request</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      onChange={(e) =>
                        setDeliveryLocation({
                          lat: parseFloat(e.target.value) || 0,
                          lng: deliveryLocation?.lng || 0,
                          address: deliveryAddress,
                        })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      onChange={(e) =>
                        setDeliveryLocation({
                          lat: deliveryLocation?.lat || 0,
                          lng: parseFloat(e.target.value) || 0,
                          address: deliveryAddress,
                        })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Description
                  </label>
                  <input
                    type="text"
                    value={requestData.itemDescription}
                    onChange={(e) =>
                      setRequestData({ ...requestData, itemDescription: e.target.value })
                    }
                    placeholder="What are you sending?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Value (ETB)
                  </label>
                  <input
                    type="number"
                    value={requestData.itemValue}
                    onChange={(e) =>
                      setRequestData({ ...requestData, itemValue: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={requestData.specialInstructions}
                    onChange={(e) =>
                      setRequestData({ ...requestData, specialInstructions: e.target.value })
                    }
                    placeholder="Any special instructions?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <button
                  onClick={handleCreateRequest}
                  disabled={loading || !deliveryLocation}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Creating Request...' : 'Create Delivery Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchDeliveryPartners;
