import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useAuth } from './auth';

const LOCAL_KEY = 'vaulted:favorite-listing-ids';

const fireVaultHaptic = () => {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = require('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
};

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track which user we've synced so we don't re-fetch on every render cycle
  const syncedUserId = useRef<string | null>(null);

  // ── 1. Load local AsyncStorage on mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LOCAL_KEY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed.filter((v): v is string => typeof v === 'string'));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // ── 2. Cloud sync once local is ready and a user is logged in ─────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) return;
    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    const userId = user.id;
    (async () => {
      const { data, error } = await supabase
        .from('vault_items')
        .select('listing_id')
        .eq('user_id', userId);

      if (error) return; // cloud unavailable — local vault still works

      const cloudIds = (data ?? []).map((r: { listing_id: string }) => r.listing_id);

      setFavoriteIds((prev) => {
        const localOnly = prev.filter((id) => !cloudIds.includes(id));

        // Push any items saved while logged out up to the cloud
        if (localOnly.length > 0) {
          supabase
            .from('vault_items')
            .upsert(
              localOnly.map((listing_id) => ({ user_id: userId, listing_id })),
              { onConflict: 'user_id,listing_id' },
            )
            .then(() => {});
        }

        const merged = Array.from(new Set([...cloudIds, ...prev]));
        AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(merged)).catch(() => {});
        return merged;
      });
    })();
  }, [user?.id, isLoaded]);

  // ── 3. Reset sync marker when user logs out ────────────────────────────────
  useEffect(() => {
    if (!user) syncedUserId.current = null;
  }, [user]);

  // ── 4. Toggle: optimistic update + optional cloud write ───────────────────
  const toggleFavorite = useCallback((id: string) => {
    const isAdding = !favoriteIds.includes(id);
    if (isAdding) fireVaultHaptic();

    setFavoriteIds((prev) => {
      const adding = !prev.includes(id);
      const next = adding ? [...prev, id] : prev.filter((x) => x !== id);
      AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    if (user?.id) {
      const userId = user.id;
      if (isAdding) {
        supabase
          .from('vault_items')
          .upsert({ user_id: userId, listing_id: id }, { onConflict: 'user_id,listing_id' })
          .then(() => {});
      } else {
        supabase
          .from('vault_items')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', id)
          .then(() => {});
      }
    }
  }, [favoriteIds, user?.id]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (id: string) => favoriteIds.includes(id),
      toggleFavorite,
      isLoaded,
    }),
    [favoriteIds, toggleFavorite, isLoaded],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
