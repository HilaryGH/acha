import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Trip {
  _id: string;
  name?: string;
  currentLocation: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate?: string;
  travellerType: 'international' | 'domestic';
  status: string;
  createdAt: string;
}

interface Order {
  _id: string;
  uniqueId?: string;
  buyerId?: {
    name?: string;
    currentCity?: string;
  };
  deliveryMethod: 'traveler' | 'partner';
  orderInfo?: {
    productName?: string;
    preferredDeliveryDate?: string;
    countryOfOrigin?: string;
  };
  status: string;
  assignedTravelerId?: string | null;
  createdAt: string;
}

function TripsAndOrdersSection() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [matching, setMatching] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, locationFilter, allTrips, allOrders]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch trips
      const tripsResponse = await api.travellers.getAll() as { status?: string; data?: any[]; count?: number; message?: string };
      console.log('Trips response:', tripsResponse);
      
      // Check if response indicates an error
      if (tripsResponse.status === 'error') {
        console.error('Trips API error:', tripsResponse.message);
        setAllTrips([]);
        setTrips([]);
      } else {
        // Handle both response structures: { status: 'success', data: [...] } or direct array
        const tripsData = tripsResponse.status === 'success' 
          ? (tripsResponse.data || [])
          : Array.isArray(tripsResponse) 
            ? tripsResponse 
            : [];
        
        // Filter trips - show active, verified, pending, or if none exist, show all recent trips
        let activeTrips = tripsData
          .filter((trip: Trip) => trip.status === 'active' || trip.status === 'verified' || trip.status === 'pending')
          .sort((a: Trip, b: Trip) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // If no active trips found, show all recent trips (excluding cancelled/completed)
        if (activeTrips.length === 0) {
          activeTrips = tripsData
            .filter((trip: Trip) => trip.status !== 'cancelled' && trip.status !== 'completed')
            .sort((a: Trip, b: Trip) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        
        setAllTrips(activeTrips);
        setTrips(activeTrips.slice(0, 5)); // Keep 5 trips for display
        console.log('Active trips:', activeTrips.length, 'Total trips:', tripsData.length);
      }

      // Fetch orders from new Order API
      const ordersResponse = await api.orders.getAll() as { status?: string; data?: any[]; count?: number; message?: string };
      console.log('Orders response:', ordersResponse);
      
      // Check if response indicates an error
      if (ordersResponse.status === 'error') {
        console.error('Orders API error:', ordersResponse.message);
        setAllOrders([]);
        setOrders([]);
      } else {
        // Handle both response structures: { status: 'success', data: [...] } or direct array
        const ordersData = ordersResponse.status === 'success'
          ? (ordersResponse.data || [])
          : Array.isArray(ordersResponse)
            ? ordersResponse
            : [];
        
        // Filter orders - show pending, matched, assigned, active, or if none exist, show all recent orders
        let activeOrders = ordersData
          .filter((order: Order) => order.status === 'pending' || order.status === 'matched' || order.status === 'assigned' || order.status === 'active')
          .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // If no active orders found, show all recent orders (excluding cancelled/completed/delivered)
        if (activeOrders.length === 0) {
          activeOrders = ordersData
            .filter((order: Order) => order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'delivered')
            .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        
        setAllOrders(activeOrders);
        setOrders(activeOrders.slice(0, 5));
        console.log('Active orders:', activeOrders.length, 'Total orders:', ordersData.length);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to show "no data" message
      setAllTrips([]);
      setTrips([]);
      setAllOrders([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filteredTrips = [...allTrips];
    let filteredOrders = [...allOrders];

    // Filter trips by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTrips = filteredTrips.filter(trip => 
        trip.currentLocation?.toLowerCase().includes(query) ||
        trip.destinationCity?.toLowerCase().includes(query) ||
        trip.name?.toLowerCase().includes(query)
      );
    }

    // Filter trips by location
    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      filteredTrips = filteredTrips.filter(trip =>
        trip.currentLocation?.toLowerCase().includes(location) ||
        trip.destinationCity?.toLowerCase().includes(location)
      );
    }

    // Filter orders by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.orderInfo?.productName?.toLowerCase().includes(query) ||
        order.buyerId?.currentCity?.toLowerCase().includes(query) ||
        order.buyerId?.name?.toLowerCase().includes(query) ||
        order.orderInfo?.countryOfOrigin?.toLowerCase().includes(query)
      );
    }

    // Filter orders by location
    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.buyerId?.currentCity?.toLowerCase().includes(location) ||
        order.orderInfo?.countryOfOrigin?.toLowerCase().includes(location)
      );
    }

    setTrips(filteredTrips.slice(0, 5));
    setOrders(filteredOrders.slice(0, 5));
  };

  const handleMatchOrder = async (orderId: string) => {
    if (!orderId) return;
    
    setMatching(orderId);
    try {
      // Navigate to match page
      navigate(`/orders/match/${orderId}`);
    } catch (error) {
      console.error('Error matching order:', error);
    } finally {
      setMatching(null);
    }
  };

  const findMatchingTravelers = (order: Order) => {
    if (order.deliveryMethod !== 'traveler' || order.assignedTravelerId) {
      return [];
    }

    // Find travelers that match the order's destination
    const orderDestination = order.orderInfo?.countryOfOrigin || order.buyerId?.currentCity || '';
    return allTrips.filter(trip => 
      trip.destinationCity?.toLowerCase().includes(orderDestination.toLowerCase()) ||
      orderDestination.toLowerCase().includes(trip.destinationCity?.toLowerCase() || '')
    ).slice(0, 3); // Show top 3 matches
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <section className="relative py-12 md:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header - Vertical Layout */}
        <div className="mb-8 md:mb-10">
          {/* Title */}
          <div className="mb-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-green-600">
                Latest Activity
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Discover recent trips and orders from our community
            </p>
          </div>

          {/* Search and Filter Block - Combined */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm max-w-4xl">
            <div className="flex flex-row gap-3 md:gap-4">
              {/* Search Input */}
              <div className="flex-1 relative min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by product, name, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 md:py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:shadow-md transition-shadow"
                />
              </div>

              {/* Location Filter */}
              <div className="w-40 sm:w-48 md:w-56 relative flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 md:py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:shadow-md transition-shadow"
                />
              </div>

              {/* Clear Filters */}
              {(searchQuery || locationFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLocationFilter('');
                  }}
                  className="px-3 md:px-4 py-2.5 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors text-xs md:text-sm whitespace-nowrap shadow-sm hover:shadow-md flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Posted Trips Section - Full Width */}
        <div className="mb-8 md:mb-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 overflow-hidden">
              {/* Background Images with Dark Overlay - Posted Trips - 4 Column Grid */}
              <div className="absolute inset-0 z-0 grid grid-cols-4">
                {/* Image 1 */}
                <div className="relative opacity-20">
                  <img 
                    src="/image 1.svg" 
                    alt="Background decoration" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                </div>
                
                {/* Image 2 */}
                <div className="relative opacity-20">
                  <img 
                    src="/image 2.svg" 
                    alt="Background decoration" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                </div>
                
                {/* Image 3 */}
                <div className="relative opacity-20">
                  <img 
                    src="/image 3.svg" 
                    alt="Background decoration" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                </div>
                
                {/* Image 4 */}
                <div className="relative opacity-20">
                  <img 
                    src="/image 4.svg" 
                    alt="Background decoration" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                </div>
              </div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Posted Trips</h3>
                    <p className="text-sm text-gray-500">Latest travel plans</p>
                  </div>
                </div>
                <Link
                  to="/browse-trips"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
                >
                  View All
                </Link>
              </div>

              {/* Trips List - Horizontal Row */}
              <div className="overflow-x-auto relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : trips.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">No trips posted yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {trips.map((trip) => (
                      <div
                        key={trip._id}
                        className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50 min-w-[200px]"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              trip.travellerType === 'international'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {trip.travellerType === 'international' ? '🌍 International' : '🏠 Domestic'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-gray-900 truncate">{trip.currentLocation}</span>
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                            <span className="font-semibold text-gray-900 truncate">{trip.destinationCity}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(trip.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Departure: {formatDate(trip.departureDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posted Orders Section - Full Width */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 via-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 overflow-hidden">
            {/* Background Images with Dark Overlay - Posted Orders - 4 Column Grid */}
            <div className="absolute inset-0 z-0 grid grid-cols-4">
              {/* Image 1 */}
              <div className="relative opacity-20">
                <img 
                  src="/image 1.svg" 
                  alt="Background decoration" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
              
              {/* Image 2 */}
              <div className="relative opacity-20">
                <img 
                  src="/image 2.svg" 
                  alt="Background decoration" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
              
              {/* Image 3 */}
              <div className="relative opacity-20">
                <img 
                  src="/image 3.svg" 
                  alt="Background decoration" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
              
              {/* Image 4 */}
              <div className="relative opacity-20">
                <img 
                  src="/image 4.svg" 
                  alt="Background decoration" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
            </div>
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Posted Orders</h3>
                  <p className="text-sm text-gray-500">Latest delivery requests</p>
                </div>
              </div>
              <Link
                to="/find-delivery-item"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #43A047 0%, #26C6DA 50%, #1E88E5 100%)' }}
              >
                View All
              </Link>
            </div>

            {/* Orders List - Horizontal Row */}
            <div className="overflow-x-auto relative z-10">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">No orders posted yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {orders.map((order) => {
                    const matchingTravelers = findMatchingTravelers(order);
                    const canMatch = order.deliveryMethod === 'traveler' && !order.assignedTravelerId && matchingTravelers.length > 0;
                    
                    return (
                      <div
                        key={order._id}
                        className="p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50 min-w-[200px]"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              order.deliveryMethod === 'traveler' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {order.deliveryMethod === 'traveler' ? '✈️ Traveler' : '🤝 Partner'}
                            </span>
                            {order.assignedTravelerId && (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                ✓ Matched
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                            {order.orderInfo?.productName || 'Product Order'}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{order.buyerId?.currentCity || 'Location not specified'}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                          {order.orderInfo?.preferredDeliveryDate && (
                            <p className="text-xs text-gray-500">
                              Preferred: {formatDate(order.orderInfo.preferredDeliveryDate)}
                            </p>
                          )}
                          
                          {/* Matching Travelers Info */}
                          {canMatch && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-700 font-medium mb-1">
                                🎯 {matchingTravelers.length} traveler{matchingTravelers.length > 1 ? 's' : ''} found!
                              </p>
                              <button
                                onClick={() => handleMatchOrder(order._id)}
                                disabled={matching === order._id}
                                className="w-full mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {matching === order._id ? 'Loading...' : 'Match with Traveler'}
                              </button>
                            </div>
                          )}
                          
                          {order.deliveryMethod === 'traveler' && !order.assignedTravelerId && matchingTravelers.length === 0 && (
                            <p className="text-xs text-gray-400 mt-2 italic">
                              No matching travelers found yet
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TripsAndOrdersSection;




