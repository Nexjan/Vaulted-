export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Approximate coordinates for each city represented in the mock listing data.
 * Listings within the same city share a single map pin.
 */
export const CITY_COORDINATES: Record<string, Coordinates> = {
  Portland: { latitude: 45.5152, longitude: -122.6784 },
  Asheville: { latitude: 35.5951, longitude: -82.5515 },
  'Joshua Tree': { latitude: 34.1347, longitude: -116.3131 },
  Santorini: { latitude: 36.3932, longitude: 25.4615 },
  Edinburgh: { latitude: 55.9533, longitude: -3.1883 },
  Rovaniemi: { latitude: 66.5039, longitude: 25.7294 },
  Austin: { latitude: 30.2672, longitude: -97.7431 },
};

export function getCityCoordinates(city: string): Coordinates | undefined {
  return CITY_COORDINATES[city];
}

/**
 * Builds a projector that maps a set of coordinates onto a 0-1 unit square,
 * fitted to their bounding box (with padding) rather than the whole globe —
 * this spreads nearby pins out nicely on a small custom map canvas.
 */
export function fitProjection(points: Coordinates[], padding = 0.15) {
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = Math.max(maxLat - minLat, 1);
  const lngSpan = Math.max(maxLng - minLng, 1);

  return ({ latitude, longitude }: Coordinates) => ({
    x: padding + ((longitude - minLng) / lngSpan) * (1 - padding * 2),
    y: padding + ((maxLat - latitude) / latSpan) * (1 - padding * 2),
  });
}
