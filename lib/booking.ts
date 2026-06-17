import { Listing } from './types';

const KLOOK_AFFILIATE_URL = 'https://klook.tpm.lv/G8f9qZX2';

export function getBookingUrl(_listing: Listing): string {
  return KLOOK_AFFILIATE_URL;
}
