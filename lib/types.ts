export type PropertyType =
  | 'Treehouse'
  | 'Lighthouse'
  | 'Houseboat'
  | 'Yurt'
  | 'Cave House'
  | 'Geodesic Dome'
  | 'Converted Church'
  | 'Train Caboose'
  | 'Igloo'
  | 'Windmill'
  | 'Shipping Container'
  | 'Castle Tower'
  | 'Apartment'
  | 'Cabin'
  | 'Villa';

export interface Listing {
  // ── Booking.com affiliate-aligned fields ────────────────────────────────
  id: string;
  /** Display name of the property (maps to Booking.com `name`). */
  name: string;
  propertyType: PropertyType;
  city: string;
  /** State / province / administrative region. */
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  /** ISO 4217 currency code, e.g. "USD", "EUR", "GBP". */
  currency: string;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  /** Primary and additional property images. Use imageUrls[0] as the hero. */
  imageUrls: string[];
  /** Direct Booking.com property URL when available; empty string for mock data. */
  bookingUrl: string;
  description: string;
  /** Facilities and experiences (maps to Booking.com amenities / highlights). */
  amenities: string[];
  // ── Vaulted-specific fields ──────────────────────────────────────────────
  emoji: string;
}
