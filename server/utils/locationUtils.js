/**
 * Location utility functions for GPS-based matching
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearby partners within a radius
 * @param {Array} partners - Array of partner objects with location data
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} radiusKm - Search radius in kilometers (default: 10km)
 * @returns {Array} Sorted array of partners with distance information
 */
function findNearbyPartners(partners, userLat, userLon, radiusKm = 10) {
  const nearbyPartners = partners
    .map(partner => {
      // Use currentLocation if available, otherwise use location
      const lat = partner.availability?.currentLocation?.latitude || partner.location?.latitude;
      const lon = partner.availability?.currentLocation?.longitude || partner.location?.longitude;
      
      if (!lat || !lon) return null;
      
      const distance = calculateDistance(userLat, userLon, lat, lon);
      
      if (distance <= radiusKm) {
        return {
          ...partner.toObject ? partner.toObject() : partner,
          distance: parseFloat(distance.toFixed(2)),
          distanceText: distance < 1 
            ? `${Math.round(distance * 1000)}m away`
            : `${distance.toFixed(1)}km away`
        };
      }
      
      return null;
    })
    .filter(partner => partner !== null)
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)
  
  return nearbyPartners;
}

module.exports = {
  calculateDistance,
  findNearbyPartners,
  toRad
};
