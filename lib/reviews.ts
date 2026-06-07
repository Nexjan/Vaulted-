import { Listing } from './types';
import { hashString, mulberry32 } from './random';

export interface Review {
  id: string;
  author: string;
  rating: number;
  timeAgo: string;
  comment: string;
}

/**
 * A shared pool of generic-but-plausible guest reviews. Each listing
 * deterministically draws three distinct entries from this pool, so the
 * same listing always shows the same reviews.
 */
const REVIEW_POOL: ReadonlyArray<Omit<Review, 'id'>> = [
  { author: 'Maria T.', rating: 5, timeAgo: '2 weeks ago', comment: 'Loved waking up here — the space was even more charming in person than in the photos.' },
  { author: 'James K.', rating: 5, timeAgo: '1 month ago', comment: 'Such a unique place to stay. Everything was spotless and the host was super responsive.' },
  { author: 'Aiko S.', rating: 4, timeAgo: '3 weeks ago', comment: 'A little tricky to find at first, but absolutely worth it once we arrived.' },
  { author: 'Lucas P.', rating: 5, timeAgo: '5 days ago', comment: "We've stayed in a lot of rentals and this is easily one of our favorites." },
  { author: 'Priya N.', rating: 5, timeAgo: '2 months ago', comment: 'Cozy, quiet, and full of character. Already planning our next visit.' },
  { author: 'Noah R.', rating: 5, timeAgo: '6 weeks ago', comment: 'Great value for the price — exceeded our expectations in every way.' },
  { author: 'Elena M.', rating: 5, timeAgo: '10 days ago', comment: "The photos honestly don't do it justice. Such a memorable few nights." },
  { author: 'Tariq H.', rating: 4, timeAgo: '1 month ago', comment: "Perfect little getaway. We genuinely didn't want to leave." },
  { author: 'Sofia L.', rating: 5, timeAgo: '4 days ago', comment: 'Charming spot with thoughtful little touches throughout.' },
  { author: 'Mateo G.', rating: 4, timeAgo: '2 months ago', comment: "A bit rustic, but that's exactly what we were hoping for." },
  { author: 'Greta F.', rating: 5, timeAgo: '3 days ago', comment: 'Hosting was excellent and check-in was an absolute breeze.' },
  { author: 'Diego V.', rating: 5, timeAgo: '5 weeks ago', comment: 'One of the more unusual places we have stayed — in the very best way.' },
  { author: 'Hana W.', rating: 5, timeAgo: '1 week ago', comment: 'Comfortable beds, great views, and would absolutely recommend to friends.' },
  { author: 'Owen B.', rating: 4, timeAgo: '7 weeks ago', comment: 'Quirky, comfortable, and full of personality. Loved every minute.' },
  { author: 'Ines D.', rating: 5, timeAgo: '9 days ago', comment: 'Exactly what we needed for a relaxing weekend away from it all.' },
];

const REVIEWS_PER_LISTING = 3;

export function getMockReviews(listing: Listing): Review[] {
  const rand = mulberry32(hashString(`${listing.id}-reviews`));
  const usedIndices = new Set<number>();

  while (usedIndices.size < Math.min(REVIEWS_PER_LISTING, REVIEW_POOL.length)) {
    usedIndices.add(Math.floor(rand() * REVIEW_POOL.length));
  }

  return Array.from(usedIndices).map((index, position) => ({
    id: `${listing.id}-review-${position}`,
    ...REVIEW_POOL[index],
  }));
}
