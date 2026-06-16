import { Listing } from './types';

export type DealTier = 'great-deal' | 'fair-price' | 'above-average';

export interface PriceComparison {
  /** Average nightly price of comparable listings (same city), excluding this one. */
  comparableAverage: number;
  /** How far below (negative) or above (positive) the average this listing is, in percent. */
  percentDiff: number;
  tier: DealTier;
  comparableCount: number;
}

/**
 * Compares a listing's price to other listings in the same city to
 * surface under-priced "deals" relative to the local market.
 */
export function comparePrice(listing: Listing, all: Listing[]): PriceComparison {
  const comparables = all.filter((item) => item.city === listing.city && item.id !== listing.id);

  if (comparables.length === 0) {
    return { comparableAverage: listing.pricePerNight, percentDiff: 0, tier: 'fair-price', comparableCount: 0 };
  }

  const comparableAverage =
    comparables.reduce((sum, item) => sum + item.pricePerNight, 0) / comparables.length;

  const percentDiff = ((listing.pricePerNight - comparableAverage) / comparableAverage) * 100;

  let tier: DealTier = 'fair-price';
  if (percentDiff <= -15) tier = 'great-deal';
  else if (percentDiff >= 15) tier = 'above-average';

  return { comparableAverage, percentDiff, tier, comparableCount: comparables.length };
}

export function isGreatDeal(listing: Listing, all: Listing[]): boolean {
  return comparePrice(listing, all).tier === 'great-deal';
}

export function sortByBestDeal(items: Listing[], all: Listing[]) {
  return items
    .map((item) => ({ ...item, priceComparison: comparePrice(item, all) }))
    .sort((a, b) => a.priceComparison.percentDiff - b.priceComparison.percentDiff);
}
