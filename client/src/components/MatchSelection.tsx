import { useState, useEffect } from 'react';

interface Match {
  _id: string;
  uniqueId?: string;
  name: string;
  email: string;
  phone: string;
  currentLocation?: string;
  destinationCity?: string;
  departureDate?: string;
  arrivalDate?: string;
  travellerType?: string;
  city?: string;
  primaryLocation?: string;
  companyName?: string;
}

interface MatchSelectionProps {
  matches: Match[];
  matchType: 'traveler' | 'partner';
  origin: string;
  destination: string;
  onSelect: (matchId: string) => void;
  onSkip: () => void;
  autoMatched?: boolean;
  autoAssigned?: boolean;
  assignedMatchId?: string | null;
}

function MatchSelection({ matches, matchType, origin, destination, onSelect, onSkip, autoMatched = false, autoAssigned = false, assignedMatchId = null }: MatchSelectionProps) {
  // Pre-select the assigned match if auto-matched/assigned
  const [selectedMatch, setSelectedMatch] = useState<string | null>(
    (autoMatched || autoAssigned) && assignedMatchId ? assignedMatchId : null
  );
  const [distances, setDistances] = useState<Record<string, any>>({});
  const [loadingDistances, setLoadingDistances] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    // Check if it's a local delivery
    const checkLocal = origin.toLowerCase().includes(destination.toLowerCase()) || 
                       destination.toLowerCase().includes(origin.toLowerCase());
    setIsLocal(checkLocal);

    // Calculate distances for local deliveries
    if (checkLocal && matches.length > 0) {
      calculateDistances();
    }
  }, [origin, destination, matches]);

  const calculateDistances = async () => {
    setLoadingDistances(true);
    const distanceMap: Record<string, any> = {};

    try {
      // Use Google Maps API if available, otherwise estimate
      const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      
      if (GOOGLE_MAPS_API_KEY) {
        // Calculate distance for each match
        for (const match of matches) {
          try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}&units=metric`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
              const element = data.rows[0].elements[0];
              distanceMap[match._id] = {
                distance: element.distance.value / 1000, // km
                distanceText: element.distance.text,
                duration: element.duration.value / 60, // minutes
                durationText: element.duration.text
              };
            }
          } catch (error) {
            console.error(`Error calculating distance for match ${match._id}:`, error);
          }
        }
      } else {
        // Fallback: estimate distances (you can improve this)
        matches.forEach((match, index) => {
          distanceMap[match._id] = {
            distance: 5 + (index * 2), // Rough estimate
            distanceText: `${5 + (index * 2)} km`,
            duration: 15 + (index * 5),
            durationText: `${15 + (index * 5)} mins`,
            isEstimated: true
          };
        });
      }
    } catch (error) {
      console.error('Error calculating distances:', error);
    } finally {
      setLoadingDistances(false);
      setDistances(distanceMap);
    }
  };

  const calculateDeliveryFee = (distanceKm: number) => {
    // Base fee structure for local deliveries
    const baseFee = 50;
    const perKmFee = 10;
    return baseFee + (perKmFee * distanceKm);
  };

  const handleSelect = () => {
    if (selectedMatch) {
      onSelect(selectedMatch);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          No {matchType === 'traveler' ? 'travelers' : 'delivery partners'} found matching your route. 
          Your order will be processed once a match becomes available.
        </p>
        <button
          onClick={onSkip}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue Anyway
        </button>
      </div>
    );
  }

  const isAutoMatched = autoMatched || autoAssigned;
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        {isAutoMatched ? 'Match Found!' : `Select ${matchType === 'traveler' ? 'Traveler' : 'Delivery Partner'}`}
      </h2>
      <p className="text-gray-600 mb-6">
        {isAutoMatched ? (
          <>
            We've automatically found and matched you with a {matchType === 'traveler' ? 'traveler' : 'delivery partner'}!
            Please review the details below and confirm to proceed to payment.
          </>
        ) : (
          <>
            We found {matches.length} {matchType === 'traveler' ? 'traveler' : 'partner'}{matches.length > 1 ? 's' : ''} matching your route.
            {isLocal && ' Distance and delivery fees are calculated below.'}
          </>
        )}
      </p>

      {loadingDistances && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Calculating distances...</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {matches.map((match) => {
          const distance = distances[match._id];
          const deliveryFee = distance ? calculateDeliveryFee(distance.distance) : null;

          return (
            <div
              key={match._id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMatch === match._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMatch(match._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="radio"
                      name="match"
                      checked={selectedMatch === match._id}
                      onChange={() => setSelectedMatch(match._id)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{match.name}</h3>
                    {match.companyName && (
                      <span className="text-sm text-gray-500">({match.companyName})</span>
                    )}
                  </div>

                  <div className="ml-8 space-y-1 text-sm text-gray-600">
                    <p><strong>Email:</strong> {match.email}</p>
                    <p><strong>Phone:</strong> {match.phone}</p>
                    
                    {matchType === 'traveler' ? (
                      <>
                        <p><strong>From:</strong> {match.currentLocation}</p>
                        <p><strong>To:</strong> {match.destinationCity}</p>
                        {match.departureDate && (
                          <p><strong>Departure:</strong> {new Date(match.departureDate).toLocaleDateString()}</p>
                        )}
                        {match.travellerType && (
                          <p><strong>Type:</strong> {match.travellerType === 'international' ? 'International' : 'Domestic'}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><strong>Location:</strong> {match.city || match.primaryLocation}</p>
                      </>
                    )}

                    {isLocal && distance && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p><strong>Distance:</strong> {distance.distanceText}</p>
                        <p><strong>Estimated Duration:</strong> {distance.durationText}</p>
                        {deliveryFee && (
                          <p className="text-blue-600 font-semibold">
                            <strong>Delivery Fee:</strong> {deliveryFee.toFixed(2)} ETB
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedMatch === match._id && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSelect}
          disabled={!selectedMatch}
          className="flex-1 py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
        >
          {isAutoMatched ? 'Confirm & Proceed to Payment' : 'Select & Continue'}
        </button>
        {!isAutoMatched && (
          <button
            onClick={onSkip}
            className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50"
          >
            Skip for Now
          </button>
        )}
      </div>
    </div>
  );
}

export default MatchSelection;

