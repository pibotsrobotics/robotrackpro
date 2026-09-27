// Geolocation and Geofencing utilities for RoboTrack Pro

/**
 * Calculates distance between two coordinates using the Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // 1 decimal place in meters
}

/**
 * Checks whether user coordinates are within school geofence radius
 */
export function checkGeofence(userLat, userLng, schoolLat, schoolLng, radiusMeters) {
  const distance = calculateDistance(userLat, userLng, schoolLat, schoolLng);
  return {
    isInside: distance <= radiusMeters,
    distanceMeters: distance,
    radiusMeters: radiusMeters,
    diffMeters: Math.round(distance - radiusMeters)
  };
}

/**
 * Format distance in a human readable string (e.g. "45 m" or "1.8 km")
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return "--";
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format coordinates to neat string
 */
export function formatCoords(lat, lng) {
  if (!lat || !lng) return "Unknown";
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * Get current browser GPS location with Promise
 */
export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          source: "BROWSER_GPS",
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        let msg = "Could not fetch GPS location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Location permission denied. Please allow location access or use the GPS simulator.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out.";
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Generate simulated coordinates near a target location for desktop testing
 * offset: 'inside' (~30m), 'gate' (~160m), 'far' (~2.2km)
 */
export function getSimulatedCoords(targetLat, targetLng, offsetType = "inside") {
  // 1 degree latitude ~ 111,000 meters
  // 1 degree longitude ~ 111,000 * cos(lat) meters
  const latMeters = 111000;
  const lngMeters = 111000 * Math.cos((targetLat * Math.PI) / 180);

  let distanceMeters = 35; // default inside
  if (offsetType === "gate") distanceMeters = 160;
  if (offsetType === "outside") distanceMeters = 850;
  if (offsetType === "far") distanceMeters = 2800;

  // random angle for realism
  const angle = Math.random() * Math.PI * 2;
  const dLat = (distanceMeters * Math.cos(angle)) / latMeters;
  const dLng = (distanceMeters * Math.sin(angle)) / lngMeters;

  return {
    lat: Number((targetLat + dLat).toFixed(6)),
    lng: Number((targetLng + dLng).toFixed(6)),
    accuracy: Math.floor(Math.random() * 8) + 8, // 8-15m accuracy
    source: `SIMULATION_${offsetType.toUpperCase()}`,
    offsetType,
    simulatedDistance: distanceMeters,
    timestamp: new Date().toISOString()
  };
}
