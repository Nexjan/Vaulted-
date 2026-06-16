import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Listing } from './types';

const STORAGE_KEY = 'vaulted:price-alerts';

// Deterministic daily price variation ±15% — consistent within a calendar day,
// different across days so vaulted items eventually show drops.
export function getLivePrice(listing: Listing): number {
  const day = new Date().getDate();
  const seed = parseInt(listing.id.replace(/\D/g, ''), 10) || 1;
  const factor = 1 + 0.15 * Math.sin(seed * 1.7 + day * 0.4);
  return Math.round(listing.pricePerNight * factor);
}

export interface PriceDrop {
  lastSeen: number;
  live: number;
  pctOff: number;
}

export function getPriceDrop(listing: Listing, lastSeen: number): PriceDrop | null {
  const live = getLivePrice(listing);
  if (live >= lastSeen) return null;
  return { lastSeen, live, pctOff: Math.round(((lastSeen - live) / lastSeen) * 100) };
}

type PriceRecord = Record<string, number>;

interface Ctx {
  alerts: PriceRecord;
  recordPrice: (listingId: string, price: number) => void;
  isLoaded: boolean;
}

const PriceAlertsContext = createContext<Ctx>({ alerts: {}, recordPrice: () => {}, isLoaded: false });

export function PriceAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<PriceRecord>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') setAlerts(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const recordPrice = (listingId: string, price: number) => {
    setAlerts((current) => {
      if (current[listingId] !== undefined) return current;
      const next = { ...current, [listingId]: price };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const value = useMemo(() => ({ alerts, recordPrice, isLoaded }), [alerts, isLoaded]);
  return <PriceAlertsContext.Provider value={value}>{children}</PriceAlertsContext.Provider>;
}

export function usePriceAlerts() {
  return useContext(PriceAlertsContext);
}
