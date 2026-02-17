import { useState, useEffect } from 'react';
import { api } from '../services/api';

function FindDeliveryItem() {
  const [senders, setSenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    departureCity: '',
    destinationCity: '',
    status: '' // Show all statuses by default, including 'pending'
  });

  useEffect(() => {
    fetchSenders();
  }, []);

  const fetchSenders = async () => {
    try {
      setLoading(true);
      const response = await api.senders.getAll() as { status?: string; data?: any[]; message?: string; count?: number };
      console.log('Senders API response:', response);
      
      if (response.status === 'success') {
        // Handle both response structures: data as array or data.count/data.data
        const allSenders = Array.isArray(response.data) ? response.data : [];
        console.log('Total senders fetched:', allSenders.length);
        
        // Filter senders that have delivery item information
        const sendersWithItems = allSenders.filter((sender: any) => {
          const hasItemInfo = sender.deliveryItemInfo && sender.deliveryItemInfo.productName;
          if (!hasItemInfo) {
            console.log('Sender filtered out (no deliveryItemInfo):', sender._id, sender.name);
          }
          return hasItemInfo;
        });
        
        console.log('Senders with delivery items:', sendersWithItems.length);
        setSenders(sendersWithItems);
      } else {
        setError(response.message || 'Failed to fetch delivery items');
      }
    } catch (err: any) {
      console.error('Error fetching senders:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredSenders = senders.filter((sender: any) => {
    // Filter by departure city
    if (filters.departureCity && sender.deliveryItemInfo?.departureCity) {
      if (!sender.deliveryItemInfo.departureCity.toLowerCase().includes(filters.departureCity.toLowerCase())) {
        return false;
      }
    }
    // Filter by destination city
    if (filters.destinationCity && sender.deliveryItemInfo?.destinationCity) {
      if (!sender.deliveryItemInfo.destinationCity.toLowerCase().includes(filters.destinationCity.toLowerCase())) {
        return false;
      }
    }
    // Filter by status (if status filter is set)
    if (filters.status && sender.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Delivery Item</h1>
          <p className="text-lg text-gray-600">
            Browse available delivery items and connect with senders
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="mt-4 text-gray-600">Loading delivery items...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredSenders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No delivery items found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSenders.map((sender: any) => (
              <div key={sender._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {sender.deliveryItemInfo?.productName || 'Unnamed Product'}
                  </h3>
                  {sender.deliveryItemInfo?.brand && (
                    <p className="text-sm text-gray-600">Brand: {sender.deliveryItemInfo.brand}</p>
                  )}
                </div>
                
                {sender.deliveryItemInfo?.productDescription && (
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {sender.deliveryItemInfo.productDescription}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {sender.deliveryItemInfo?.departureCity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">From:</span>
                      <span>{sender.deliveryItemInfo.departureCity}</span>
                    </div>
                  )}
                  {sender.deliveryItemInfo?.destinationCity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">To:</span>
                      <span>{sender.deliveryItemInfo.destinationCity}</span>
                    </div>
                  )}
                  {sender.deliveryItemInfo?.quantityDescription && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Quantity:</span>
                      <span>{sender.deliveryItemInfo.quantityDescription}</span>
                    </div>
                  )}
                  {sender.deliveryItemInfo?.preferredDeliveryDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Preferred Date:</span>
                      <span>{new Date(sender.deliveryItemInfo.preferredDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {sender.deliveryItemInfo?.photos && sender.deliveryItemInfo.photos.length > 0 && (
                  <div className="mb-4">
                    <img 
                      src={sender.deliveryItemInfo.photos[0]} 
                      alt={sender.deliveryItemInfo.productName}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sender.name}</p>
                    <p className="text-xs text-gray-500">{sender.currentCity}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sender.status === 'active' ? 'bg-green-100 text-green-800' :
                    sender.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sender.status}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={`tel:${sender.phone}`}
                    className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Contact
                  </a>
                  {sender.email && (
                    <a
                      href={`mailto:${sender.email}`}
                      className="flex-1 text-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindDeliveryItem;

