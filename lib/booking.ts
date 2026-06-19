import { Listing } from './types';

export function getBookingUrl(listing: Listing): string {
  return listing.bookingUrl;
}
