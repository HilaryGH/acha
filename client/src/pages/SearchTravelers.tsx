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
}

function SearchTravelers() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [travelers, setTravelers] = useState<Traveller[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const [searchType, setSearchType] = useState<'destination' | 'location' | 'both'>('both');

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      // Use a small delay to ensure state is updated
      const timer = setTimeout(() => {
        searchAll(query);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setTravelers([]);
      setPartners([]);
    }
  }, [query, searchType]);

  const searchAll = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTravelers([]);
      setPartners([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search both travelers and delivery partners in parallel
      const [travelersResponse, deliveryPartnersRes, giftPartnersRes] = await Promise.all([
        // Search travelers
        (async () => {
          const params: any = { status: 'active' };
          if (searchType === 'destination') {
            params.destinationCity = searchQuery;
          } else if (searchType === 'location') {
            params.currentLocation = searchQuery;
          } else {
            params.destinationCity = searchQuery;
            params.currentLocation = searchQuery;
          }
          return api.travellers.search(params) as Promise<{ status?: string; data?: Traveller[]; count?: number; travellers?: Traveller[] }>;
        })(),
        // Search delivery partners by city/location (all statuses)
        api.partners.getAll({ 
          partner: 'Delivery Partner',
          search: searchQuery 
        }) as Promise<{ status?: string; data?: Partner[]; count?: number }>,
        // Search gift delivery partners by city/location (all statuses)
        api.partners.getAll({ 
          registrationType: 'Gift Delivery Partner',
          search: searchQuery 
        }) as Promise<{ status?: string; data?: Partner[]; count?: number }>
      ]);

      // Combine delivery partners and gift delivery partners
      const partnersResponse = {
        status: 'success',
        data: [
          ...(deliveryPartnersRes.data || []),
          ...(giftPartnersRes.data || [])
        ],
        count: (deliveryPartnersRes.data?.length || 0) + (giftPartnersRes.data?.length || 0)
      };

      // Handle travelers response
      if (travelersResponse.status === 'success') {
        const travellers = travelersResponse.data || travelersResponse.travellers || [];
        setTravelers(travellers);
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
                {travelers.map((traveler) => (
                  <div
                    key={traveler._id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{traveler.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {traveler.travellerType === 'international' ? '🌍 International' : '🚗 Domestic'} Traveler
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {traveler.status}
                      </span>
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
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="text-sm text-gray-900">{traveler.phone}</p>
                        </div>
                        <Link
                          to={`/post-order`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Post Order
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
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
                          <h3 className="text-xl font-bold text-gray-900">{partner.name || partner.companyName}</h3>
                          {partner.companyName && partner.name && (
                            <p className="text-sm text-gray-600 mt-1">{partner.companyName}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">🚚 Delivery Partner</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {partner.status}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        {(partner.city || partner.primaryLocation) && (
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Location</p>
                              <p className="text-sm text-gray-900">
                                {partner.city || partner.primaryLocation || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Phone</p>
                            <p className="text-sm text-gray-900">{partner.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <Link
                          to={`/search-delivery-partners`}
                          className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          View Details
                        </Link>
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

