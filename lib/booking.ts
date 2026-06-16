import { Listing } from './types';

// Swap BOOKING_AFFILIATE_ID with your Booking.com affiliate partner ID when ready.
// Format: https://www.booking.com/searchresults.html?aid=YOUR_ID&ss=...
const BOOKING_AFFILIATE_ID = '';

export function getBookingUrl(listing: Listing): string {
  const destination = encodeURIComponent(`${listing.city}, ${listing.country}`);
  if (BOOKING_AFFILIATE_ID) {
    return `https://www.booking.com/searchresults.html?aid=${BOOKING_AFFILIATE_ID}&ss=${destination}&group_adults=2&no_rooms=1`;
  }
  // Fallback: Airbnb city search until affiliate ID is set
  return `https://www.airbnb.com/s/${encodeURIComponent(listing.city)}/homes`;
}
