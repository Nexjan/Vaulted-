import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SkeletonBlock } from '../../components/Skeleton';
import { useVault } from '../../lib/vaultContext';
import { useOnboarding } from '../../lib/onboarding';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../lib/listingsService';
import { Listing } from '../../lib/types';
import { getUniqueness } from '../../lib/uniqueness';
import { formatPrice } from '../../lib/currency';
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

// BUDGET FILTER: thresholds are compared against listing.pricePerNight in the
// listing's native currency. When user-currency selection is added, convert
// listing.pricePerNight to the user's currency before comparing these values.
const PRICE_OPTIONS = [
  { label: 'ANY', value: null },
  { label: 'UNDER 100', value: 100 },
  { label: 'UNDER 150', value: 150 },
  { label: 'UNDER 250', value: 250 },
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

type VibeId = 'remote' | 'architectural' | 'overwater' | 'offgrid' | 'cozy' | 'views';

const VIBES: { id: VibeId; label: string; tags: string[]; types: string[] }[] = [
  {
    id: 'remote',
    label: 'Remote & Wild',
    tags: ['forest', 'desert', 'farm stay', 'creek access', 'snow', 'naturally cool'],
    types: ['Treehouse', 'Yurt', 'Geodesic Dome', 'Cave House'],
  },
  {
    id: 'architectural',
    label: 'Architectural',
    tags: ['unique architecture', 'stained glass', 'high ceilings', 'glass ceiling', 'modern', 'quirky', 'eco-friendly'],
    types: ['Cave House', 'Shipping Container', 'Windmill', 'Igloo', 'Geodesic Dome', 'Train Caboose'],
  },
  {
    id: 'overwater',
    label: 'Over Water',
    tags: ['floating', 'waterfront', 'oceanfront', 'sea views', 'lake views', 'kayaks included'],
    types: ['Houseboat', 'Lighthouse'],
  },
  {
    id: 'offgrid',
    label: 'Off-Grid',
    tags: ['off-grid', 'stargazing', 'wood stove', 'glass ceiling', 'northern lights'],
    types: [],
  },
  {
    id: 'cozy',
    label: 'Cozy',
    tags: ['fireplace', 'wood stove', 'hot tub', 'sauna', 'romantic', 'four-poster bed', 'pet-friendly'],
    types: ['Cabin'],
  },
  {
    id: 'views',
    label: 'Dramatic Views',
    tags: ['panoramic views', 'mountain views', 'sea views', 'sunset views', 'city views', 'northern lights', 'lake views'],
    types: ['Lighthouse', 'Castle Tower', 'Windmill'],
  },
];

const WM_LETTERS = 'VAULTED'.split('');

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  // Destination filter: city + country pair so "Paris, TX" and "Paris, France" are distinct.
  const [selectedDestination, setSelectedDestination] = useState<{ city: string; country: string } | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minRarity, setMinRarity] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>('rarity');
  const [selectedVibes, setSelectedVibes] = useState<VibeId[]>([]);

  // Destinations: unique {city, country} pairs pulled from live listing data.
  // New locations appear automatically as inventory grows — no hardcoding.
  const destinations = useMemo(
    () =>
      Array.from(
        new Map(listings.map((l) => [`${l.city}::${l.country}`, { city: l.city, country: l.country }])).values(),
      ).sort((a, b) => a.city.localeCompare(b.city)),
    [],
  );

  // Property types: generated from whatever types exist in the data.
  // Unknown types from new inventory appear automatically in the filter.
  const propertyTypes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.propertyType))).sort(),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      // Destination filter matches by city+country so the same city name in
      // different countries is unambiguous ("Paris, TX" vs "Paris, France").
      if (
        selectedDestination &&
        (listing.city !== selectedDestination.city || listing.country !== selectedDestination.country)
      ) return false;
      if (maxPrice !== null && listing.pricePerNight > maxPrice) return false;
      if (selectedType && listing.propertyType !== selectedType) return false;
      if (minRarity !== null && getUniqueness(listing).score < minRarity) return false;
      if (q) {
        // Text search covers city, region, and country — so "Thailand", "Lapland",
        // or "Australia" all resolve even if not in the destination chip list.
        const haystack = [
          listing.name,
          listing.city,
          listing.region,
          listing.country,
          listing.propertyType,
          ...listing.amenities,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedVibes.length > 0) {
        const vibeMatch = selectedVibes.every((vibeId) => {
          const vibe = VIBES.find((v) => v.id === vibeId)!;
          return (
            vibe.types.includes(listing.propertyType) ||
            listing.amenities.some((tag) => vibe.tags.includes(tag))
          );
        });
        if (!vibeMatch) return false;
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
  }, [query, selectedDestination, maxPrice, selectedType, minRarity, sortBy, selectedVibes]);

  // Destination chips: show "CITY · COUNTRY" for every location so international
  // context is always visible (e.g. "SANTORINI · GREECE", "EDINBURGH · SCOTLAND").
  const destinationOptions = useMemo(
    () => [
      { label: 'ALL', city: null as string | null, country: null as string | null },
      ...destinations.map((d) => ({
        label: `${d.city.toUpperCase()} · ${d.country.toUpperCase()}`,
        city: d.city,
        country: d.country,
      })),
    ],
    [destinations],
  );

  const typeOptions = useMemo(
    () => [{ label: 'ALL', value: null as string | null }, ...propertyTypes.map((t) => ({ label: t.toUpperCase(), value: t }))],
    [propertyTypes],
  );

  const hasFilters = !!(query.trim() || selectedDestination || maxPrice !== null || selectedType || minRarity !== null || sortBy !== 'rarity' || selectedVibes.length > 0);
  const toggleVibe = (id: VibeId) =>
    setSelectedVibes((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  const { vaultDone } = useVault();
  const { prefs } = useOnboarding();
  const prefsApplied = useRef(false);

  useEffect(() => {
    if (!prefs || prefsApplied.current) return;
    prefsApplied.current = true;
    if (prefs.vibeIds.length > 0) setSelectedVibes(prefs.vibeIds as VibeId[]);
    if (prefs.maxPrice !== null) setMaxPrice(prefs.maxPrice);
  }, [prefs]);

  // ── Wordmark unlock-reveal animation ────────────────────────────────────────
  const letterAnims = useRef(
    WM_LETTERS.map((_, i) => ({
      opacity: new Animated.Value(REDUCE_MOTION ? 1 : 0),
      x: new Animated.Value(REDUCE_MOTION ? 0 : i === 0 ? 0 : -28),
    }))
  ).current;
  const shimmerX    = useRef(new Animated.Value(-100)).current;
  const [wmWidth, setWmWidth] = useState(0);
  const shimmerFired = useRef(false);

  useEffect(() => {
    if (REDUCE_MOTION || !vaultDone) return;
    const STAGGER = 40;
    const anims = WM_LETTERS.map((_, i) => {
      const delay = i === 0 ? 0 : 180 + (i - 1) * STAGGER;
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(letterAnims[i].opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ...(i > 0 ? [Animated.timing(letterAnims[i].x, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true })] : []),
        ]),
      ]);
    });
    Animated.parallel(anims).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultDone]);

  useEffect(() => {
    if (REDUCE_MOTION || wmWidth === 0 || !vaultDone || shimmerFired.current) return;
    shimmerFired.current = true;
    // last letter finishes at ≈ 180 + 5*40 + 320 = 700ms; add 80ms cushion
    const t = setTimeout(() => {
      shimmerX.setValue(-100);
      Animated.timing(shimmerX, { toValue: wmWidth + 100, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
    }, 780);
    return () => clearTimeout(t);
  }, [wmWidth, vaultDone]);
  // ─────────────────────────────────────────────────────────────────────────────

  const [refreshing, setRefreshing] = useState(false);

  const clearAll = () => {
    setQuery('');
    setSelectedDestination(null);
    setMaxPrice(null);
    setSelectedType(null);
    setMinRarity(null);
    setSortBy('rarity');
    setSelectedVibes([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    clearAll();
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C8A86B" colors={['#C8A86B']} />}
      >

        {/* ── Wordmark header ── */}
        <View style={styles.header}>
          <View
            style={styles.wordmarkRow}
            onLayout={(e) => setWmWidth(e.nativeEvent.layout.width)}
          >
            {WM_LETTERS.map((letter, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.wordmark,
                  { opacity: letterAnims[i].opacity, transform: [{ translateX: letterAnims[i].x }] },
                ]}
              >
                {letter}
              </Animated.Text>
            ))}
            <Animated.View
              pointerEvents="none"
              style={[styles.shimmerBar, { transform: [{ translateX: shimmerX }] }]}
            />
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerLabel}>
              {results.length === 1 ? '1 STAY' : `${results.length} STAYS`}
              {hasFilters ? ' MATCHING' : ' · A CURATED COLLECTION'}
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

          {/* ── Vibe chips ── */}
          <Text style={styles.filterLabel}>VIBE</Text>
          <View style={styles.vibeRow}>
            {VIBES.map((vibe) => {
              const active = selectedVibes.includes(vibe.id);
              return (
                <Pressable
                  key={vibe.id}
                  onPress={() => toggleVibe(vibe.id)}
                  style={[styles.vibeChip, active && styles.vibeChipActive]}
                >
                  <Text style={[styles.vibeChipText, active && styles.vibeChipTextActive]}>
                    {vibe.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>LOCATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {destinationOptions.map((opt) => {
              const active = opt.city === null
                ? selectedDestination === null
                : selectedDestination?.city === opt.city && selectedDestination?.country === opt.country;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setSelectedDestination(opt.city ? { city: opt.city, country: opt.country! } : null)}
                  style={[styles.chip, active && styles.chipActive]}
                >
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
  const imgOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={styles.heroOuter}
      {...(webHandlers as any)}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.hero, tiltStyle, pressed && styles.heroPressed]}>
          <SkeletonBlock style={StyleSheet.absoluteFill} />
          <Animated.Image
            source={{ uri: listing.imageUrls[0] }}
            style={[styles.heroImage, { opacity: imgOpacity }]}
            resizeMode="cover"
            onLoad={() => {
              if (REDUCE_MOTION) return;
              Animated.timing(imgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
            }}
          />
          <View style={styles.heroOverlay} />
          <Text style={styles.heroNumber}>{num}</Text>
          <View style={styles.heroBottom}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle} numberOfLines={2}>{listing.name}</Text>
              <Text style={styles.heroLocation}>
                {listing.city.toUpperCase()}, {listing.country.toUpperCase()} · {listing.propertyType.toUpperCase()}
              </Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroRarity}>◆ {uniqueness.score}/100</Text>
                <Text style={styles.heroPrice}>
                  {formatPrice(listing.pricePerNight, listing.currency)}
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
          {/* gold edge-glow that shifts with tilt */}
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
  const imgOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={styles.rowOuter}
      {...(webHandlers as any)}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.row, tiltStyle, pressed && styles.rowPressed]}>
          <Text style={styles.rowNumber}>{num}</Text>
          <View style={styles.rowImageWrap}>
            <SkeletonBlock style={StyleSheet.absoluteFill} />
            <Animated.Image
              source={{ uri: listing.imageUrls[0] }}
              style={[StyleSheet.absoluteFill, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={() => {
                if (REDUCE_MOTION) return;
                Animated.timing(imgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
              }}
            />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={2}>{listing.name}</Text>
            <Text style={styles.rowLocation}>
              {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowRarity}>◆ {uniqueness.score}</Text>
              <Text style={styles.rowPrice}>
                {formatPrice(listing.pricePerNight, listing.currency)}
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
  wordmarkRow: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  wordmark: {
    fontSize: 64,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -2,
    lineHeight: 66,
    fontFamily: 'Georgia',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: GOLD,
    opacity: 0.25,
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

  // Vibe chips
  vibeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  vibeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 1,
  },
  vibeChipActive: {
    backgroundColor: GOLD,
  },
  vibeChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1.5,
  },
  vibeChipTextActive: {
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
  rowImageWrap: {
    width: 90,
    height: 68,
    overflow: 'hidden',
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
