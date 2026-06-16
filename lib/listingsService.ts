// ─── BOOKING.COM INTEGRATION POINT ───────────────────────────────────────────
// This is the single source of listing data for the entire app.
// To connect real Booking.com inventory:
//   1. Replace the mock import below with a call to the Booking.com Affiliate API.
//      Docs: https://developers.booking.com/affiliate/index.html
//   2. Map each API property to the Listing interface in lib/types.ts.
//   3. No screen, component, or lib file needs to change — only this module.
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
