// Property type: open string so any type appearing in live inventory is valid.
// Known types and their base rarity scores are defined in lib/uniqueness.ts.
// Unknown types fall back to a rarity score of 5.
export type PropertyType = string;

export interface QuizTags {
  vibe: string[];
  setting: string[];
  moment: string[];
  group: string[];
  detail: string[];
}

export interface QuizAnswers {
  vibe: string;
  setting: string;
  moment: string;
  group: string;
  detail: string;
}

export interface Listing {
  // ── Booking.com affiliate-aligned fields ────────────────────────────────
  id: string;
  /** Display name of the property (maps to Booking.com `name`). */
  name: string;
  propertyType: PropertyType;
  city: string;
  /** State / province / administrative region (e.g. "California", "Lapland"). */
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  /** ISO 4217 currency code, e.g. "USD", "EUR", "GBP". Rendered via lib/currency.ts formatPrice(). */
  currency: string;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  /** Primary and additional property images. Use imageUrls[0] as the hero. */
  imageUrls: string[];
  /** Direct booking URL for the property; empty string for mock data. */
  bookingUrl: string;
  description: string;
  /** Facilities and experiences (maps to Booking.com amenities / highlights). */
  amenities: string[];
  // ── Provider / source ────────────────────────────────────────────────────
  // PROVIDER FIELD: identifies which booking platform supplied this listing
  // (e.g. "booking.com", "vrbo", "agoda"). All filtering in search.tsx,
  // saved.tsx, and index.tsx runs against the central listings array
  // regardless of source — listings from any provider filter identically
  // once normalized to this interface.
  source?: string;
  // ── Vaulted-specific fields ──────────────────────────────────────────────
  emoji: string;
  quizTags?: QuizTags;
}
