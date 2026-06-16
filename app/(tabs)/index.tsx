import { useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../data/listings';
import { Listing } from '../../lib/types';
import { getUniqueness } from '../../lib/uniqueness';
import { useFavorites } from '../../lib/favorites';

// ─── reduced-motion check (web only) ───────────────────────────────────────
const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

// ─── tilt hook ──────────────────────────────────────────────────────────────
function useTilt() {
  const rotX = useRef(new Animated.Value(0)).current;
  const rotY = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const rotXStr = rotX.interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] });
  const rotYStr = rotY.interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] });

  const onMouseMove = (e: any) => {
    if (REDUCE_MOTION) return;
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rx = (e.nativeEvent.clientX - rect.left) / rect.width - 0.5;
      const ry = (e.nativeEvent.clientY - rect.top) / rect.height - 0.5;
      rotY.setValue(rx * 16);
      rotX.setValue(-ry * 10);
      glow.setValue(Math.min(Math.sqrt(rx * rx + ry * ry) * 2, 0.9));
    } catch {}
  };

  const onMouseLeave = () => {
    if (REDUCE_MOTION) return;
    Animated.parallel([
      Animated.spring(rotX, { toValue: 0, useNativeDriver: false, tension: 100, friction: 12 }),
      Animated.spring(rotY, { toValue: 0, useNativeDriver: false, tension: 100, friction: 12 }),
      Animated.spring(glow, { toValue: 0, useNativeDriver: false, tension: 100, friction: 12 }),
    ]).start();
  };

  const webHandlers = !REDUCE_MOTION && Platform.OS === 'web' ? { onMouseMove, onMouseLeave } : {};

  const tiltStyle = REDUCE_MOTION ? {} : ({
    transform: [{ perspective: 800 }, { rotateX: rotXStr }, { rotateY: rotYStr }],
  } as any);

  return { webHandlers, tiltStyle, glow };
}

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const SURFACE = '#141414';
const DIVIDER = '#1E1E1E';

const PRICE_OPTIONS = [
  { label: 'ANY', value: null },
  { label: 'UNDER $100', value: 100 },
  { label: 'UNDER $150', value: 150 },
  { label: 'UNDER $250', value: 250 },
] as const;

const RARITY_OPTIONS = [
  { label: 'ANY', value: null },
  { label: '70+', value: 70 },
  { label: '80+', value: 80 },
  { label: '90+', value: 90 },
] as const;

const SORT_OPTIONS = [
  { label: 'RARITY', value: 'rarity' as const },
  { label: 'PRICE ↑', value: 'price_asc' as const },
  { label: 'PRICE ↓', value: 'price_desc' as const },
  { label: 'RATING', value: 'rating' as const },
];
type SortValue = 'rarity' | 'price_asc' | 'price_desc' | 'rating';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minRarity, setMinRarity] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>('rarity');

  const cities = useMemo(
    () => Array.from(new Set(listings.map((l) => l.city))).sort(),
    [],
  );

  const propertyTypes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.propertyType))).sort(),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      if (selectedCity && listing.city !== selectedCity) return false;
      if (maxPrice !== null && listing.pricePerNight > maxPrice) return false;
      if (selectedType && listing.propertyType !== selectedType) return false;
      if (minRarity !== null && getUniqueness(listing).score < minRarity) return false;
      if (q) {
        const haystack = [listing.title, listing.city, listing.country, listing.propertyType, ...listing.tags]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rarity':    return getUniqueness(b).score - getUniqueness(a).score;
        case 'price_asc': return a.pricePerNight - b.pricePerNight;
        case 'price_desc':return b.pricePerNight - a.pricePerNight;
        case 'rating':    return b.rating - a.rating;
      }
    });

    return filtered;
  }, [query, selectedCity, maxPrice, selectedType, minRarity, sortBy]);

  const cityOptions = useMemo(
    () => [{ label: 'ALL', value: null as string | null }, ...cities.map((c) => ({ label: c.toUpperCase(), value: c }))],
    [cities],
  );

  const typeOptions = useMemo(
    () => [{ label: 'ALL', value: null as string | null }, ...propertyTypes.map((t) => ({ label: t.toUpperCase(), value: t }))],
    [propertyTypes],
  );

  const hasFilters = !!(query.trim() || selectedCity || maxPrice !== null || selectedType || minRarity !== null || sortBy !== 'rarity');

  const clearAll = () => {
    setQuery('');
    setSelectedCity(null);
    setMaxPrice(null);
    setSelectedType(null);
    setMinRarity(null);
    setSortBy('rarity');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Wordmark header ── */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>VAULTED</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerLabel}>
              {results.length === 1 ? '1 STAY' : `${results.length} STAYS`}
              {hasFilters ? ' MATCHING' : ' · CURATED RARE COLLECTION'}
            </Text>
            <View style={styles.headerLine} />
            {hasFilters && (
              <Pressable onPress={clearAll} hitSlop={8}>
                <Text style={styles.clearAll}>CLEAR ALL</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Filters ── */}
        <View style={styles.filterSection}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, place, or vibe"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />

          <Text style={styles.filterLabel}>LOCATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {cityOptions.map((opt) => {
              const active = selectedCity === opt.value;
              return (
                <Pressable key={opt.label} onPress={() => setSelectedCity(opt.value)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>BUDGET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {PRICE_OPTIONS.map((opt) => {
              const active = maxPrice === opt.value;
              return (
                <Pressable key={opt.label} onPress={() => setMaxPrice(opt.value)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>PROPERTY TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {typeOptions.map((opt) => {
              const active = selectedType === opt.value;
              return (
                <Pressable key={opt.label} onPress={() => setSelectedType(opt.value)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>RARITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {RARITY_OPTIONS.map((opt) => {
              const active = minRarity === opt.value;
              return (
                <Pressable key={opt.label} onPress={() => setMinRarity(opt.value)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Sort ── */}
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.value;
              return (
                <Pressable key={opt.value} onPress={() => setSortBy(opt.value)} style={styles.sortItem}>
                  <Text style={[styles.sortText, active && styles.sortTextActive]}>{opt.label}</Text>
                  {active && <View style={styles.sortUnderline} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Results ── */}
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyLabel}>NO STAYS MATCH</Text>
            <Text style={styles.emptyHint}>Try a different vibe.</Text>
          </View>
        ) : (
          <>
            <HeroListing listing={results[0]} number={1} />
            <View style={styles.divider} />
            {results.slice(1).map((listing, i) => (
              <View key={listing.id}>
                <EditorialRow listing={listing} number={i + 2} />
                <View style={styles.divider} />
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// Hero listing — first result, full-width
// ─────────────────────────────────────────
function HeroListing({ listing, number }: { listing: Listing; number: number }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const uniqueness = getUniqueness(listing);
  const active = isFavorite(listing.id);
  const num = String(number).padStart(2, '0');
  const { webHandlers, tiltStyle, glow } = useTilt();

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={styles.heroOuter}
      {...(webHandlers as any)}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.hero, tiltStyle, pressed && styles.heroPressed]}>
          <Image source={{ uri: listing.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <Text style={styles.heroNumber}>{num}</Text>
          <View style={styles.heroBottom}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle} numberOfLines={2}>{listing.title}</Text>
              <Text style={styles.heroLocation}>
                {listing.city.toUpperCase()}, {listing.country.toUpperCase()} · {listing.propertyType.toUpperCase()}
              </Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroRarity}>◆ {uniqueness.score}/100</Text>
                <Text style={styles.heroPrice}>
                  ${listing.pricePerNight}
                  <Text style={styles.heroUnit}> /night</Text>
                </Text>
              </View>
            </View>
            <Pressable
              onPress={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
              hitSlop={8}
              style={styles.heroHeart}
            >
              <Ionicons name={active ? 'heart' : 'heart-outline'} size={22} color={active ? GOLD : TEXT} />
            </Pressable>
          </View>
          <Animated.View pointerEvents="none" style={[styles.heroGlow, { opacity: glow }]} />
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────
// Editorial row — all subsequent listings
// ─────────────────────────────────────────
function EditorialRow({ listing, number }: { listing: Listing; number: number }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const uniqueness = getUniqueness(listing);
  const active = isFavorite(listing.id);
  const num = String(number).padStart(2, '0');
  const { webHandlers, tiltStyle, glow } = useTilt();

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={styles.rowOuter}
      {...(webHandlers as any)}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.row, tiltStyle, pressed && styles.rowPressed]}>
          <Text style={styles.rowNumber}>{num}</Text>
          <Image source={{ uri: listing.imageUrl }} style={styles.rowImage} resizeMode="cover" />
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={2}>{listing.title}</Text>
            <Text style={styles.rowLocation}>
              {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowRarity}>◆ {uniqueness.score}</Text>
              <Text style={styles.rowPrice}>
                ${listing.pricePerNight}
                <Text style={styles.rowUnit}>/nt</Text>
              </Text>
            </View>
          </View>
          <Pressable
            onPress={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
            hitSlop={8}
            style={styles.rowHeart}
          >
            <Ionicons name={active ? 'heart' : 'heart-outline'} size={16} color={active ? GOLD : MUTED} />
          </Pressable>
          <Animated.View pointerEvents="none" style={[styles.rowGlow, { opacity: glow }]} />
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: 48,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  wordmark: {
    fontSize: 64,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -2,
    lineHeight: 66,
    fontFamily: 'Georgia',
  },
  headerMeta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
  },
  clearAll: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
    textDecorationLine: 'underline',
  },

  // Filters
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: DIVIDER,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: TEXT,
    letterSpacing: 0.3,
    marginBottom: 18,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 1,
  },
  chipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.5,
  },
  chipTextActive: {
    color: BG,
  },

  // Sort row
  sortRow: {
    flexDirection: 'row',
    gap: 20,
    paddingBottom: 20,
    marginTop: 4,
  },
  sortItem: {
    alignItems: 'center',
  },
  sortText: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
  },
  sortTextActive: {
    color: GOLD,
  },
  sortUnderline: {
    marginTop: 4,
    height: 1,
    width: '100%',
    backgroundColor: GOLD,
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Empty state
  empty: {
    paddingTop: 72,
    alignItems: 'center',
  },
  emptyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2.5,
  },
  emptyHint: {
    marginTop: 10,
    fontSize: 13,
    color: MUTED,
    fontStyle: 'italic',
  },

  // Hero listing
  heroOuter: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  hero: {
    height: 420,
    overflow: 'hidden',
  },
  heroPressed: {
    opacity: 0.9,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.85)',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  heroNumber: {
    position: 'absolute',
    top: 14,
    left: 16,
    fontSize: 80,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: -4,
    lineHeight: 80,
    fontFamily: 'Georgia',
    opacity: 0.85,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  heroInfo: {
    flex: 1,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    fontFamily: 'Georgia',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  heroLocation: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(245,243,239,0.65)',
    letterSpacing: 2,
    marginTop: 7,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  heroRarity: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
  heroPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
  },
  heroUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(245,243,239,0.55)',
  },
  heroHeart: {
    padding: 4,
    alignSelf: 'flex-end',
    paddingBottom: 2,
  },

  // Editorial rows
  rowOuter: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: '#111111',
  },
  rowGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.6)',
    pointerEvents: 'none',
  },
  rowNumber: {
    width: 32,
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    fontFamily: 'Georgia',
    letterSpacing: -1,
    textAlign: 'right',
    opacity: 0.85,
  },
  rowImage: {
    width: 90,
    height: 68,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  rowLocation: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 7,
  },
  rowRarity: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
  },
  rowUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: MUTED,
  },
  rowHeart: {
    padding: 8,
  },
});
