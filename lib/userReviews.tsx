import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'rare-stays:user-reviews';

export interface UserReview {
  id: string;
  listingId: string;
  rating: number;
  comment: string;
}

interface UserReviewsContextValue {
  isLoaded: boolean;
  getReviewsForListing: (listingId: string) => UserReview[];
  addReview: (listingId: string, rating: number, comment: string) => void;
}

const UserReviewsContext = createContext<UserReviewsContextValue | null>(null);

function isUserReview(value: unknown): value is UserReview {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.listingId === 'string' &&
    typeof candidate.rating === 'number' &&
    typeof candidate.comment === 'string'
  );
}

export function UserReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReviews(parsed.filter(isUserReview));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addReview = (listingId: string, rating: number, comment: string) => {
    setReviews((current) => {
      const next = [
        ...current,
        { id: `${listingId}-you-${Date.now()}`, listingId, rating, comment },
      ];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const value = useMemo<UserReviewsContextValue>(
    () => ({
      isLoaded,
      getReviewsForListing: (listingId) => reviews.filter((review) => review.listingId === listingId),
      addReview,
    }),
    [reviews, isLoaded],
  );

  return <UserReviewsContext.Provider value={value}>{children}</UserReviewsContext.Provider>;
}

export function useUserReviews(): UserReviewsContextValue {
  const context = useContext(UserReviewsContext);
  if (!context) {
    throw new Error('useUserReviews must be used within a UserReviewsProvider');
  }
  return context;
}
