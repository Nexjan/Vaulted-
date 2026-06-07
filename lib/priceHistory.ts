import { Listing } from './types';
import { hashString, mulberry32 } from './random';

export interface PricePoint {
  label: string;
  price: number;
}

export type PriceTrend = 'down' | 'up' | 'flat';

export interface PriceHistory {
  points: PricePoint[];
  trend: PriceTrend;
  changePercent: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

/**
 * Generates a deterministic 6-month mock price history that always ends at
 * the listing's current nightly price, with a per-listing drift (so some
 * stays trend cheaper, some pricier, some flat) plus a little noise.
 */
export function getPriceHistory(listing: Listing): PriceHistory {
  const rand = mulberry32(hashString(`${listing.id}-price-history`));

  const drift = (rand() - 0.5) * 0.3; // total drift across the period: -15% to +15%
  const startPrice = listing.pricePerNight / (1 + drift);
  const lastIndex = MONTH_LABELS.length - 1;

  const points: PricePoint[] = MONTH_LABELS.map((label, index) => {
    if (index === lastIndex) {
      return { label, price: listing.pricePerNight };
    }
    const progress = index / lastIndex;
    const trendValue = startPrice + (listing.pricePerNight - startPrice) * progress;
    const noise = (rand() - 0.5) * listing.pricePerNight * 0.08;
    return { label, price: Math.max(25, Math.round(trendValue + noise)) };
  });

  const earliest = points[0].price;
  const latest = points[lastIndex].price;
  const changePercent = ((latest - earliest) / earliest) * 100;

  let trend: PriceTrend = 'flat';
  if (changePercent <= -4) trend = 'down';
  else if (changePercent >= 4) trend = 'up';

  return { points, trend, changePercent };
}
