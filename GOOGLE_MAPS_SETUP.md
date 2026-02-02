# Google Maps API Setup

To enable distance calculation for local deliveries, you need to set up Google Maps API.

## Steps:

1. **Get Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable "Distance Matrix API" and "Places API"
   - Create credentials (API Key)
   - Restrict the API key to only the APIs you need

2. **Set Environment Variables:**

   **Server (.env file):**
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

   **Client (.env file):**
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Update HTML (client/index.html):**
   Replace `YOUR_API_KEY` with your actual API key in the Google Maps script tag:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,distancematrix" async defer></script>
   ```

## Features Enabled:

- **Distance Calculation**: Calculates distance between origin and destination for local deliveries
- **Delivery Fee Calculation**: Automatically calculates delivery fees based on distance
- **Route Matching**: Helps match orders with travelers/partners based on location

## Fallback Behavior:

If Google Maps API key is not configured, the system will:
- Use estimated distances (fallback calculation)
- Still allow order creation and matching
- Display "Distance calculation unavailable" message

## Note:

The Google Maps API has usage limits and may incur charges. Make sure to:
- Set up billing alerts
- Restrict API key usage
- Monitor API usage in Google Cloud Console


