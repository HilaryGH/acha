import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

interface Traveller {
  _id: string;
  uniqueId: string;
  name: string;
  email: string;
  phone: string;
  currentLocation: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  travellerType: 'international' | 'domestic';
  status: string;
  isExpired?: boolean;
  isAssigned?: boolean;
}

interface Partner {
  _id: string;
  uniqueId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  city?: string;
  primaryLocation?: string;
  status: string;
  partner?: string;
  registrationType?: string;
}

function SearchTravelers() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const role = searchParams.get('role') || '';
  const [travelers, setTravelers] = useState<Traveller[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const [searchType, setSearchType] = useState<'destination' | 'location' | 'both'>('both');

  useEffect(() => {
    if (query || role) {
      if (query) {
        setSearchInput(query);
      }
      // Use a small delay to ensure state is updated
      const timer = setTimeout(() => {
        searchAll(query || '');
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setTravelers([]);
      setPartners([]);
    }
  }, [query, role, searchType]);

  const searchAll = async (searchQuery: string) => {
    // When coming from catalog (role only), allow empty searchQuery and just use role
    const hasTextQuery = !!searchQuery.trim();
    if (!hasTextQuery && !role) {
      setTravelers([]);
      setPartners([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build search text (used for city/location search)
      const locationQuery = hasTextQuery ? searchQuery : '';

      // Fetch orders to check which travelers are already assigned
      const ordersPromise = api.orders.getAll() as Promise<{ status?: string; data?: any[]; count?: number }>;

      // Prepare promises depending on role
      const travelerPromise = (async () => {
        // Only search travelers when no specific partner role is selected
        if (role && role !== 'traveler') {
          return { status: 'success', data: [] as Traveller[] };
        }
        const params: any = {}; // Removed status: 'active' to show all registered travelers
        if (locationQuery) {
          if (searchType === 'destination') {
            params.destinationCity = locationQuery;
          } else if (searchType === 'location') {
            params.currentLocation = locationQuery;
          } else {
            params.destinationCity = locationQuery;
            params.currentLocation = locationQuery;
          }
        }
        return api.travellers.search(params) as Promise<{ status?: string; data?: Traveller[]; count?: number; travellers?: Traveller[] }>;
      })();

      const deliveryPartnersPromise = role === '' || role === 'delivery_partner'
        ? api.partners.getAll({ 
            partner: 'Delivery Partner',
            ...(locationQuery ? { search: locationQuery } : {})
          }) as Promise<{ status?: string; data?: Partner[]; count?: number }>
        : Promise.resolve({ status: 'success', data: [] as Partner[] });

      const giftPartnersPromise = role === '' || role === 'gift_delivery_partner'
        ? api.partners.getAll({ 
            registrationType: 'Gift Delivery Partner',
            ...(locationQuery ? { search: locationQuery } : {})
          }) as Promise<{ status?: string; data?: Partner[]; count?: number }>
        : Promise.resolve({ status: 'success', data: [] as Partner[] });

      const achaSistersPromise = role === '' || role === 'acha_sisters_delivery_partner'
        ? api.users.searchByLocation({
            city: locationQuery,
            role: 'acha_sisters_delivery_partner',
            status: 'all' // Get all registered users regardless of status
          }) as Promise<{ status?: string; data?: { users?: Partner[] }; count?: number }>
        : Promise.resolve({ status: 'success', data: { users: [] as Partner[] } });

      const moversPackersPromise = role === '' || role === 'movers_packers'
        ? api.users.searchByLocation({
            city: locationQuery,
            role: 'movers_packers',
            status: 'all' // Get all registered users regardless of status
          }) as Promise<{ status?: string; data?: { users?: Partner[] }; count?: number }>
        : Promise.resolve({ status: 'success', data: { users: [] as Partner[] } });

      // Search travelers, delivery partners, and orders in parallel
      const [travelersResponse, deliveryPartnersRes, giftPartnersRes, achaSistersRes, moversPackersRes, ordersResponse] = await Promise.all([
        travelerPromise,
        deliveryPartnersPromise,
        giftPartnersPromise,
        achaSistersPromise,
        moversPackersPromise,
        ordersPromise
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

      // Extract users from User model responses and format them as partners
      const achaSistersUsers = achaSistersRes.data?.users || achaSistersRes.data || [];
      const moversPackersUsers = moversPackersRes.data?.users || moversPackersRes.data || [];
      
      // Format User model results to match Partner interface
      const formattedAchaSisters = Array.isArray(achaSistersUsers) ? achaSistersUsers.map((user: any) => ({
        _id: user._id,
        uniqueId: user.userId || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        city: user.city,
        primaryLocation: user.primaryLocation || user.location,
        status: user.status || 'active',
        partner: 'Acha Sisters Delivery Partner'
      })) : [];
      
      const formattedMoversPackers = Array.isArray(moversPackersUsers) ? moversPackersUsers.map((user: any) => ({
        _id: user._id,
        uniqueId: user.userId || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        city: user.city,
        primaryLocation: user.primaryLocation || user.location,
        status: user.status || 'active',
        partner: 'Movers & Packers'
      })) : [];

      // Combine all delivery partners (from Partner model and User model)
      const partnersResponse = {
        status: 'success',
        data: [
          ...(deliveryPartnersRes.data || []),
          ...(giftPartnersRes.data || []),
          ...formattedAchaSisters,
          ...formattedMoversPackers
        ],
        count: (deliveryPartnersRes.data?.length || 0) + 
               (giftPartnersRes.data?.length || 0) + 
               formattedAchaSisters.length + 
               formattedMoversPackers.length
      };

      // Handle travelers response (only when traveler search is active)
      if (travelersResponse.status === 'success') {
        const travellers = travelersResponse.data || travelersResponse.travellers || [];
        
        // Mark travelers as expired or assigned, but keep them in the list
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const processedTravellers = travellers.map((traveler: Traveller) => {
          const processedTraveler = { ...traveler };
          
          // Check if trip is expired based on departure date
          if (traveler.departureDate) {
            const departureDate = new Date(traveler.departureDate);
            departureDate.setHours(0, 0, 0, 0);
            processedTraveler.isExpired = departureDate < today;
          } else {
            processedTraveler.isExpired = true; // No departure date = expired
          }
          
          // Check if trip is already assigned
          processedTraveler.isAssigned = assignedTravelerIds.includes(traveler._id.toString());
          
          return processedTraveler;
        });
        
        // Filter to only show pending/active/verified trips (but keep expired/assigned ones marked)
        const validStatuses = ['pending', 'active', 'verified'];
        const filteredTravellers = processedTravellers.filter((traveler: Traveller) => {
          return validStatuses.includes(traveler.status);
        });
        
        setTravelers(filteredTravellers);
      } else {
        setTravelers([]);
      }

      // Handle partners response
      if (partnersResponse.status === 'success') {
        const partnersData = partnersResponse.data || [];
        setPartners(partnersData);
      } else {
        setPartners([]);
      }

    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching');
      setTravelers([]);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('q', searchInput.trim());
      window.location.href = `/search?${newSearchParams.toString()}`;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Search Travelers & Delivery Partners</h1>
          <p className="text-lg text-gray-600">Find travelers and delivery partners by destination or location</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter destination city or departure location..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'destination' | 'location' | 'both')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="both">Destination & Location</option>
                  <option value="destination">Destination Only</option>
                  <option value="location">Location Only</option>
                </select>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching travelers and delivery partners...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {query && (
              <div className="mb-6 flex flex-wrap gap-4">
                <p className="text-gray-600">
                  {travelers.length > 0 
                    ? `Found ${travelers.length} traveler${travelers.length !== 1 ? 's' : ''}`
                    : `No travelers found`
                  }
                </p>
                <p className="text-gray-600">
                  {partners.length > 0 
                    ? `Found ${partners.length} delivery partner${partners.length !== 1 ? 's' : ''}`
                    : `No delivery partners found`
                  }
                </p>
                <p className="text-gray-500 text-sm">for "{query}"</p>
              </div>
            )}

            {travelers.length === 0 && partners.length === 0 && !query && (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600 text-lg">Enter a search query to find travelers and delivery partners</p>
              </div>
            )}

            {travelers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {travelers.map((traveler) => {
                  const isDisabled = traveler.isExpired || traveler.isAssigned;
                  return (
                  <div
                    key={traveler._id}
                    className={`bg-white rounded-xl shadow-lg p-6 transition-shadow ${
                      isDisabled 
                        ? 'opacity-60 border-2 border-gray-300' 
                        : 'hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Traveler #{traveler.uniqueId || traveler._id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {traveler.travellerType === 'international' ? '🌍 International' : '🚗 Domestic'} Traveler
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          traveler.status === 'active' ? 'bg-green-100 text-green-800' :
                          traveler.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {traveler.status}
                        </span>
                        {traveler.isExpired && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                        {traveler.isAssigned && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Already Assigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">From</p>
                          <p className="text-sm text-gray-900">{traveler.currentLocation}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">To</p>
                          <p className="text-sm text-gray-900">{traveler.destinationCity}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Departure</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(traveler.departureDate)} at {traveler.departureTime || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Arrival</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(traveler.arrivalDate)} at {traveler.arrivalTime || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          {traveler.phone ? (
                            <>
                              <p className="text-xs text-gray-500">Contact</p>
                              <p className="text-sm text-gray-900">{traveler.phone}</p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              Contact info available after order placement
                            </p>
                          )}
                        </div>
                        {isDisabled ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-400 text-white text-sm font-semibold rounded-lg cursor-not-allowed"
                            title={traveler.isExpired ? 'This trip has expired' : 'This trip is already assigned'}
                          >
                            {traveler.isExpired ? 'Expired' : 'Already Assigned'}
                          </button>
                        ) : (
                          <Link
                            to={`/post-order`}
                            state={{
                              selectedTrip: {
                                travelerId: traveler._id,
                                travelerUniqueId: traveler.uniqueId || traveler._id.slice(-8).toUpperCase(),
                                currentLocation: traveler.currentLocation,
                                destinationCity: traveler.destinationCity,
                                departureDate: traveler.departureDate,
                                arrivalDate: traveler.arrivalDate,
                                departureTime: traveler.departureTime,
                                arrivalTime: traveler.arrivalTime,
                                travellerType: traveler.travellerType,
                                maximumKilograms: (traveler as any).maximumKilograms,
                                priceOffer: (traveler as any).priceOffer
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            Post Order
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Delivery Partners Section */}
            {partners.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Partners</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partners.map((partner) => (
                    <div
                      key={partner._id}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Partner #{partner.uniqueId || partner._id?.slice(-8).toUpperCase()}</h3>
                          {partner.companyName && (
                            <p className="text-sm text-gray-600 mt-1">{partner.companyName}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {partner.partner === 'Acha Sisters Delivery Partner' ? '👭 Acha Sisters Delivery Partner' :
                             partner.partner === 'Movers & Packers' ? '🚚 Movers & Packers' :
                             partner.registrationType === 'Gift Delivery Partner' ? '🎁 Gift Delivery Partner' :
                             '🚚 Delivery Partner'}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {partner.status}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        {partner.city && (
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-700">City</p>
                              <p className="text-sm text-gray-900">{partner.city}</p>
                            </div>
                          </div>
                        )}
                        {partner.primaryLocation && (
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Primary Location</p>
                              <p className="text-sm text-gray-900">{partner.primaryLocation}</p>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 italic">
                          Contact info available after order placement
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 italic">
                              Contact info available after order placement
                            </p>
                          </div>
                          <Link
                            to={`/post-order`}
                            state={{
                              selectedPartner: {
                                partnerId: partner._id,
                                partnerUniqueId: partner.uniqueId || partner._id?.slice(-8).toUpperCase(),
                                city: partner.city,
                                primaryLocation: partner.primaryLocation,
                                partner: partner.partner,
                                registrationType: partner.registrationType,
                                companyName: partner.companyName
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            Post Order
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchTravelers;

