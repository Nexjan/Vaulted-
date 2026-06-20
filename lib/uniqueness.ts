import { Listing } from './types';

/**
 * Base rarity per property type, on a 0-10 scale.
 * Common stays (apartments, cabins, villas) score low; one-of-a-kind
 * structures (lighthouses, caves, castle towers) score high.
 * Unknown types (new inventory) fall back to the ?? 1 default below.
 */
const PROPERTY_TYPE_RARITY: Record<string, number> = {
  Apartment: 1,
  Cabin: 2,
  Villa: 3,
  'Shipping Container': 6,
  Houseboat: 6,
  Yurt: 7,
  'Train Caboose': 7,
  'Tiny Cabin': 7,
  'A-Frame': 8,
  Chalet: 8,
  Windmill: 8,
  'Geodesic Dome': 8,
  Treehouse: 8,
  'Converted Church': 8,
  Tent: 9,
  Igloo: 9,
  'Cave House': 9,
  'Castle Tower': 9,
  Lighthouse: 10,
};

/** Tags that signal an unusual stay add extra rarity points (capped). */
const RARE_TAGS = new Set([
  'off-grid',
  'floating',
  'underground',
  'historic',
  'glass ceiling',
  'northern lights',
  'unique architecture',
  'naturally cool',
  'quirky',
  'stargazing',
]);

export interface UniquenessResult {
  score: number; // 0-100
  label: string;
  reasons: string[];
}

/**
 * Computes a 0-100 "rarity score" for a listing by combining how unusual
 * its property type is with how many rare-experience tags it has, then
 * giving a small boost to highly-rated hidden gems with few reviews.
 */
export function getUniqueness(listing: Listing): UniquenessResult {
  const reasons: string[] = [];

  const typeRarity = PROPERTY_TYPE_RARITY[listing.propertyType] ?? 1;
  reasons.push(`${listing.propertyType} is a ${typeRarity >= 8 ? 'very rare' : typeRarity >= 5 ? 'uncommon' : 'common'} stay type`);

  const matchingTags = listing.amenities.filter((tag) => RARE_TAGS.has(tag));
  const tagBonus = Math.min(matchingTags.length, 4) * 2.5; // up to 10 points
  if (matchingTags.length > 0) {
    reasons.push(`Notable for: ${matchingTags.join(', ')}`);
  }

  let hiddenGemBonus = 0;
  if (listing.rating >= 4.85 && listing.reviewCount < 150) {
    hiddenGemBonus = 5;
    reasons.push('Highly rated but still under the radar');
  }

  const raw = typeRarity * 7.5 + tagBonus + hiddenGemBonus; // max ~10*7.5 + 10 + 5 = 90
  const score = Math.round(Math.min(100, raw));
  const label = score >= 90 ? 'Legendary' : score >= 75 ? 'Iconic' : score >= 60 ? 'Rare' : score >= 45 ? 'Distinct' : 'Hidden Gem';

  return { score, label, reasons };
}

export function sortByUniqueness(items: Listing[]): (Listing & { uniqueness: UniquenessResult })[] {
  return items
    .map((item) => ({ ...item, uniqueness: getUniqueness(item) }))
    .sort((a, b) => b.uniqueness.score - a.uniqueness.score);
}
