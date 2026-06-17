// ─── BOOKING SOURCE INTEGRATION POINT ────────────────────────────────────────
// This is the single source of listing data for the entire app.
// To connect real inventory from any provider:
//   1. Replace (or supplement) the mock import below with calls to provider APIs:
//        Booking.com: https://developers.booking.com/affiliate/index.html
//        Vrbo / HomeAway: https://developer.vrbo.com
//        Agoda: https://partners.agoda.com
//   2. Normalize each API response to the Listing interface in lib/types.ts.
//      Set listing.source = "booking.com" | "vrbo" | "agoda" etc. so listings
//      can be traced back to their origin.
//   3. No screen, component, or lib file needs to change — all filtering
//      (search, saved, index, map) runs against this array regardless of source.
// ─────────────────────────────────────────────────────────────────────────────
import { listings as _mockListings } from '../data/listings';
import type { Listing } from './types';

export const listings: Listing[] = _mockListings;

export function getListings(): Listing[] {
  return _mockListings;
}

export function getListingById(id: string): Listing | undefined {
  return _mockListings.find((l) => l.id === id);
}
