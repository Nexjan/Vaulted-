// ─── ACCOMMODATION CATEGORIES ────────────────────────────────────────────────
//
// Broad display categories used for the top-level category pills on Search.
// Each granular propertyType (as it appears in listing data) maps to exactly
// one category. The mapping lives here so it's one place to edit when new
// property types arrive from affiliate feeds (Booking.com, Vrbo, Agoda, etc.).
//
// To add a new type: find its logical home below and add it. Unknown types
// automatically fall back to 'Unique Stays' via getCategoryForType().
// ─────────────────────────────────────────────────────────────────────────────

export type Category = 'All' | 'Hotels' | 'Villas' | 'Cabins' | 'Unique Stays';

export const CATEGORIES: readonly Category[] = [
  'All',
  'Hotels',
  'Villas',
  'Cabins',
  'Unique Stays',
];

// ── Mapping: granular propertyType → broad Category ──────────────────────────
//
// Hotels  — standard/city accommodations and serviced units
// Villas  — spacious private residences, full-home rentals
// Cabins  — rustic/nature retreats (wood, mountain, forest-themed)
// Unique Stays — architecturally distinctive, rare, or hard-to-classify stays;
//               also the implicit catch-all for any type not listed here

const PROPERTY_TYPE_CATEGORY: Record<string, Exclude<Category, 'All'>> = {
  // ── Hotels ─────────────────────────────────────────────────────────────────
  'Hotel':            'Hotels',
  'Boutique Hotel':   'Hotels',
  'Apartment':        'Hotels',
  'Resort':           'Hotels',
  'Hostel':           'Hotels',
  'Bed & Breakfast':  'Hotels',
  'Guesthouse':       'Hotels',
  'Inn':              'Hotels',
  'Serviced Apartment': 'Hotels',

  // ── Villas ──────────────────────────────────────────────────────────────────
  'Villa':            'Villas',
  'Whole Home':       'Villas',
  'House':            'Villas',
  'Farmhouse':        'Villas',
  'Country House':    'Villas',
  'Manor':            'Villas',
  'Estate':           'Villas',
  'Penthouse':        'Villas',
  'Townhouse':        'Villas',

  // ── Cabins ──────────────────────────────────────────────────────────────────
  'A-Frame':          'Cabins',
  'Tiny Cabin':       'Cabins',
  'Cabin':            'Cabins',
  'Log Cabin':        'Cabins',
  'Chalet':           'Cabins',
  'Lodge':            'Cabins',
  'Cottage':          'Cabins',
  'Bungalow':         'Cabins',
  'Ski Chalet':       'Cabins',

  // ── Unique Stays ────────────────────────────────────────────────────────────
  // Remarkable, rare, or architecturally distinctive. Also the catch-all.
  'Lighthouse':           'Unique Stays',
  'Cave House':           'Unique Stays',
  'Treehouse':            'Unique Stays',
  'Igloo':                'Unique Stays',
  'Yurt':                 'Unique Stays',
  'Castle Tower':         'Unique Stays',
  'Castle':               'Unique Stays',
  'Train Caboose':        'Unique Stays',
  'Windmill':             'Unique Stays',
  'Geodesic Dome':        'Unique Stays',
  'Shipping Container':   'Unique Stays',
  'Houseboat':            'Unique Stays',
  'Boat':                 'Unique Stays',
  'Float Home':           'Unique Stays',
  'Plane':                'Unique Stays',
  'Bus':                  'Unique Stays',
  'Tower':                'Unique Stays',
  'Farm Stay':            'Unique Stays',
  'Tipi':                 'Unique Stays',
  'Tent':                 'Unique Stays',
  'Dome':                 'Unique Stays',
  'Barn':                 'Unique Stays',
  'Ryokan':               'Unique Stays',
};

/**
 * Returns the broad Category for a given granular propertyType string.
 * Unknown types fall back to 'Unique Stays'.
 */
export function getCategoryForType(propertyType: string): Exclude<Category, 'All'> {
  return PROPERTY_TYPE_CATEGORY[propertyType] ?? 'Unique Stays';
}
