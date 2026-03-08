import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function BrowseTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    departureCity: '',
    destinationCity: '',
    travellerType: '',
    status: ''
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both trips and orders in parallel
      const [tripsResponse, ordersResponse] = await Promise.all([
        api.travellers.getAll() as any,
        api.orders.getAll() as any
      ]);
      
      // Get list of assigned traveler IDs from orders
      let assignedTravelerIds: string[] = [];
      if (ordersResponse && ordersResponse.status === 'success') {
        const ordersData = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
        assignedTravelerIds = ordersData
          .filter((order: any) => order.assignedTravelerId)
          .map((order: any) => order.assignedTravelerId.toString());
      } else if (Array.isArray(ordersResponse)) {
        assignedTravelerIds = ordersResponse
          .filter((order: any) => order.assignedTravelerId)
          .map((order: any) => order.assignedTravelerId.toString());
      } else if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
        assignedTravelerIds = ordersResponse.data
          .filter((order: any) => order.assignedTravelerId)
          .map((order: any) => order.assignedTravelerId.toString());
      }
      
      // Mark trips as expired or assigned, but keep them in the list
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Handle different response structures
      let tripsData: any[] = [];
      if (tripsResponse && tripsResponse.status === 'success') {
        // Standard API response format
        tripsData = Array.isArray(tripsResponse.data) ? tripsResponse.data : [];
      } else if (Array.isArray(tripsResponse)) {
        // If response is directly an array
        tripsData = tripsResponse;
      } else if (tripsResponse && tripsResponse.data && Array.isArray(tripsResponse.data)) {
        // Handle cases where data exists but status might not be 'success'
        tripsData = tripsResponse.data;
      }
      
      // Process trips: mark as expired/assigned but keep them
      const processedTrips = tripsData.map((trip: any) => {
        const processedTrip = { ...trip };
        
        // Check if trip is expired based on departure date
        if (trip.departureDate) {
          const departureDate = new Date(trip.departureDate);
          departureDate.setHours(0, 0, 0, 0);
          processedTrip.isExpired = departureDate < today;
        } else {
          processedTrip.isExpired = true; // No departure date = expired
        }
        
        // Check if trip is already assigned
        processedTrip.isAssigned = assignedTravelerIds.includes(trip._id.toString());
        
        return processedTrip;
      });
      
      // Filter to only show pending/active/verified trips (but keep expired/assigned ones marked)
      const validStatuses = ['pending', 'active', 'verified'];
      const filteredTrips = processedTrips.filter((trip: any) => {
        return validStatuses.includes(trip.status);
      });
      
      setTrips(filteredTrips);
      
      if (tripsResponse && tripsResponse.message && filteredTrips.length === 0) {
        console.warn('API response warning:', tripsResponse.message);
      }
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      setError(err.message || 'Failed to fetch trips. Please try again later.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip: any) => {
    if (filters.departureCity && trip.currentLocation) {
      if (!trip.currentLocation.toLowerCase().includes(filters.departureCity.toLowerCase())) {
        return false;
      }
    }
    if (filters.destinationCity && trip.destinationCity) {
      if (!trip.destinationCity.toLowerCase().includes(filters.destinationCity.toLowerCase())) {
        return false;
      }
    }
    if (filters.travellerType && trip.travellerType !== filters.travellerType) {
      return false;
    }
    if (filters.status && trip.status !== filters.status) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Browse Trips</h1>
          <p className="text-lg text-gray-600">
            Find available trips and place orders with travellers
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure City
              </label>
              <input
                type="text"
                value={filters.departureCity}
                onChange={(e) => setFilters(prev => ({ ...prev, departureCity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by departure city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination City
              </label>
              <input
                type="text"
                value={filters.destinationCity}
                onChange={(e) => setFilters(prev => ({ ...prev, destinationCity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by destination city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Type
              </label>
              <select
                value={filters.travellerType}
                onChange={(e) => setFilters(prev => ({ ...prev, travellerType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="international">International</option>
                <option value="domestic">Domestic</option>
                <option value="intra_city">Intra City</option>
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
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading trips...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No trips found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip: any) => {
              const isDisabled = trip.isExpired || trip.isAssigned;
              return (
              <div 
                key={trip._id} 
                className={`bg-white rounded-xl shadow-lg p-6 transition-shadow ${
                  isDisabled 
                    ? 'opacity-60 border-2 border-gray-300' 
                    : 'hover:shadow-xl'
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.travellerType === 'international'
                        ? 'bg-blue-100 text-blue-700'
                        : trip.travellerType === 'intra_city'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {trip.travellerType === 'international' 
                        ? '🌍 International' 
                        : trip.travellerType === 'intra_city'
                        ? '🏙️ Intra City'
                        : '🏠 Domestic'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trip.status === 'active' ? 'bg-green-100 text-green-800' :
                      trip.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trip.status}
                    </span>
                    {trip.isExpired && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                    {trip.isAssigned && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        Already Assigned
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Traveler #{trip.uniqueId || trip._id.slice(-8).toUpperCase()}
                  </h3>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">From:</span>
                    <span>{trip.currentLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">To:</span>
                    <span>{trip.destinationCity}</span>
                  </div>
                  {trip.departureDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Departure:</span>
                      <span>{formatDate(trip.departureDate)}</span>
                    </div>
                  )}
                  {trip.arrivalDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Arrival:</span>
                      <span>{formatDate(trip.arrivalDate)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Traveler #{trip.uniqueId || trip._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{trip.currentLocation}</p>
                  </div>
                </div>

                <div className="mt-4">
                  {isDisabled ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
                      title={trip.isExpired ? 'This trip has expired' : 'This trip is already assigned'}
                    >
                      {trip.isExpired ? 'Expired' : 'Already Assigned'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Navigate to PostOrder page with pre-filled trip data
                        navigate('/post-order', {
                          state: {
                            selectedTrip: {
                              travelerId: trip._id,
                              travelerUniqueId: trip.uniqueId || trip._id.slice(-8).toUpperCase(),
                              currentLocation: trip.currentLocation,
                              destinationCity: trip.destinationCity,
                              departureDate: trip.departureDate,
                              arrivalDate: trip.arrivalDate,
                              departureTime: trip.departureTime,
                              arrivalTime: trip.arrivalTime,
                              travellerType: trip.travellerType,
                              maximumKilograms: trip.maximumKilograms,
                              priceOffer: trip.priceOffer
                            }
                          }
                        });
                      }}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Place Order
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseTrips;
