import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../lib/listingsService';
import { Listing } from '../../lib/types';
import { getUniqueness } from '../../lib/uniqueness';
import { formatPrice, convertPrice } from '../../lib/currency';
import { useFavorites } from '../../lib/favorites';
import { SkeletonBlock } from '../../components/Skeleton';
import { useVault } from '../../lib/vaultContext';
import { useOnboarding } from '../../lib/onboarding';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../lib/currencyContext';
import { CATEGORIES, Category, getCategoryForType } from '../../lib/categories';

// ─── reduced-motion check (web only) ──────────────────────────────────────────
const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

// ─── tilt hook ─────────────────────────────────────────────────────────────────
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
      rotY.setValue(rx * 16); rotX.setValue(-ry * 10);
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

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const SURFACE = '#141414';
const DIVIDER = '#1E1E1E';

// BUDGET FILTER: thresholds compared against listing.pricePerNight in native currency.
// When user-currency selection is added, convert before comparing.
const PRICE_OPTIONS = [
  { label: 'ANY',      value: null },
  { label: 'UNDER 100', value: 100 },
  { label: 'UNDER 150', value: 150 },
  { label: 'UNDER 250', value: 250 },
] as const;

const RARITY_OPTIONS = [
  { label: 'ANY', value: null },
  { label: '70+', value: 70  },
  { label: '80+', value: 80  },
  { label: '90+', value: 90  },
] as const;

const SORT_OPTIONS = [
  { label: 'RARITY',   value: 'rarity'     as const },
  { label: 'PRICE ↑',  value: 'price_asc'  as const },
  { label: 'PRICE ↓',  value: 'price_desc' as const },
  { label: 'RATING',   value: 'rating'     as const },
];
type SortValue = 'rarity' | 'price_asc' | 'price_desc' | 'rating';

type VibeId = 'remote' | 'architectural' | 'overwater' | 'offgrid' | 'cozy' | 'views';
const VIBES: { id: VibeId; label: string; tags: string[]; types: string[] }[] = [
  { id: 'remote',        label: 'Remote & Wild',  tags: ['forest','desert','farm stay','creek access','snow','naturally cool'],                              types: ['Treehouse','Yurt','Geodesic Dome','Cave House'] },
  { id: 'architectural', label: 'Architectural',  tags: ['unique architecture','stained glass','high ceilings','glass ceiling','modern','quirky','eco-friendly'], types: ['Cave House','Shipping Container','Windmill','Igloo','Geodesic Dome','Train Caboose'] },
  { id: 'overwater',     label: 'Over Water',     tags: ['floating','waterfront','oceanfront','sea views','lake views','kayaks included'],                   types: ['Houseboat','Lighthouse'] },
  { id: 'offgrid',       label: 'Off-Grid',       tags: ['off-grid','stargazing','wood stove','glass ceiling','northern lights'],                           types: [] },
  { id: 'cozy',          label: 'Cozy',           tags: ['fireplace','wood stove','hot tub','sauna','romantic','four-poster bed','pet-friendly'],            types: ['Cabin'] },
  { id: 'views',         label: 'Dramatic Views', tags: ['panoramic views','mountain views','sea views','sunset views','city views','northern lights','lake views'], types: ['Lighthouse','Castle Tower','Windmill'] },
];

const CONTINENT_OPTIONS = ['ALL','Africa','Asia','Europe','North America','South America','Oceania','Middle East'];

// Maps listing.country → continent. Extend as real inventory from booking partners is added.
const COUNTRY_CONTINENT: Record<string, string> = {
  'USA':'North America','Canada':'North America','Mexico':'North America',
  'Greece':'Europe','Scotland':'Europe','Finland':'Europe','France':'Europe',
  'Italy':'Europe','Spain':'Europe','Germany':'Europe','United Kingdom':'Europe',
  'Portugal':'Europe','Netherlands':'Europe','Norway':'Europe','Sweden':'Europe',
  'Iceland':'Europe','Ireland':'Europe','Croatia':'Europe','Austria':'Europe',
  'Japan':'Asia','Thailand':'Asia','Indonesia':'Asia','India':'Asia','Vietnam':'Asia',
  'Philippines':'Asia','Malaysia':'Asia','Sri Lanka':'Asia','Nepal':'Asia',
  'China':'Asia','South Korea':'Asia','Bali':'Asia','Cambodia':'Asia','Laos':'Asia',
  'Australia':'Oceania','New Zealand':'Oceania','Fiji':'Oceania','Samoa':'Oceania',
  'Brazil':'South America','Argentina':'South America','Colombia':'South America',
  'Peru':'South America','Chile':'South America','Ecuador':'South America','Bolivia':'South America',
  'South Africa':'Africa','Kenya':'Africa','Morocco':'Africa','Tanzania':'Africa',
  'Ethiopia':'Africa','Ghana':'Africa','Rwanda':'Africa','Madagascar':'Africa','Egypt':'Africa',
  'UAE':'Middle East','Turkey':'Middle East','Jordan':'Middle East',
  'Israel':'Middle East','Oman':'Middle East','Saudi Arabia':'Middle East','Qatar':'Middle East',
};

const GUEST_OPTIONS = [
  { label: 'ANY', value: null as null },
  { label: '1+',  value: 1 },
  { label: '2+',  value: 2 },
  { label: '4+',  value: 4 },
  { label: '6+',  value: 6 },
];
const BEDROOM_OPTIONS = [
  { label: 'ANY', value: null as null },
  { label: '1+',  value: 1 },
  { label: '2+',  value: 2 },
  { label: '3+',  value: 3 },
  { label: '4+',  value: 4 },
];

// Amenity labels mapped to search strings for substring matching against listing.amenities.
const AMENITY_OPTS: { label: string; search: string }[] = [
  { label: 'WiFi',             search: 'wifi'            },
  { label: 'Pool',             search: 'pool'            },
  { label: 'Kitchen',          search: 'kitchen'         },
  { label: 'Hot Tub',          search: 'hot tub'         },
  { label: 'Parking',          search: 'parking'         },
  { label: 'Pet Friendly',     search: 'pet'             },
  { label: 'Air Conditioning', search: 'air conditioning'},
  { label: 'Workspace',        search: 'workspace'       },
];

const WM_LETTERS = 'VAULTED'.split('');

export default function SearchScreen() {
  const { displayCurrency } = useCurrency();
  const [query,             setQuery]             = useState('');
  // Destination: city+country pair avoids ambiguity for same city name in different countries.
  const [selectedDestination, setSelectedDestination] = useState<{ city: string; country: string } | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [maxPrice,          setMaxPrice]          = useState<number | null>(null);
  const [selectedType,      setSelectedType]      = useState<string | null>(null);
  const [minGuests,         setMinGuests]         = useState<number | null>(null);
  const [minBedrooms,       setMinBedrooms]       = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  // DATES: stored in state as UI shell only.
  // Availability filtering wired in once live affiliate inventory is connected
  // (Booking.com /availability, Vrbo /listings/:id/availability, Agoda Availability API).
  const [checkIn,           setCheckIn]           = useState('');
  const [checkOut,          setCheckOut]          = useState('');
  const [minRarity,         setMinRarity]         = useState<number | null>(null);
  const [sortBy,            setSortBy]            = useState<SortValue>('rarity');
  const [selectedVibes,     setSelectedVibes]     = useState<VibeId[]>([]);
  const [selectedCategory,  setSelectedCategory]  = useState<Category>('All');
  const [sheetVisible,      setSheetVisible]      = useState(false);

  // Destinations: unique {city, country} pairs from live listing data — no hardcoding.
  const destinations = useMemo(
    () =>
      Array.from(
        new Map(listings.map((l) => [`${l.city}::${l.country}`, { city: l.city, country: l.country }])).values(),
      ).sort((a, b) => a.city.localeCompare(b.city)),
    [],
  );

  // Property types: generated from live data, new types appear automatically.
  const propertyTypes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.propertyType))).sort(),
    [],
  );

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
    () => [
      { label: 'ALL', value: null as string | null },
      ...propertyTypes.map((t) => ({ label: t.toUpperCase(), value: t })),
    ],
    [propertyTypes],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      if (selectedCategory !== 'All' && getCategoryForType(listing.propertyType) !== selectedCategory) return false;

      if (
        selectedDestination &&
        (listing.city !== selectedDestination.city || listing.country !== selectedDestination.country)
      ) return false;

      if (selectedContinent) {
        const lc = COUNTRY_CONTINENT[listing.country];
        // If country not in map, pass through rather than exclude.
        if (lc && lc !== selectedContinent) return false;
      }

      if (maxPrice !== null && convertPrice(listing.pricePerNight, listing.currency, displayCurrency) > maxPrice) return false;
      if (selectedType && listing.propertyType !== selectedType) return false;

      // Guests: listing must accommodate at least minGuests people.
      if (minGuests !== null && listing.maxGuests < minGuests) return false;

      // Bedrooms: Listing type does not include a bedrooms field yet.
      // If the field exists on future listings, filter; otherwise pass through.
      if (minBedrooms !== null) {
        const beds = (listing as any).bedrooms;
        if (beds !== undefined && beds < minBedrooms) return false;
      }

      // Amenities: all selected must be present (case-insensitive substring match).
      if (selectedAmenities.length > 0) {
        const al = listing.amenities.map((a) => a.toLowerCase());
        const allMatch = selectedAmenities.every((sel) => {
          const search = AMENITY_OPTS.find((o) => o.label === sel)?.search ?? sel.toLowerCase();
          return al.some((a) => a.includes(search));
        });
        if (!allMatch) return false;
      }

      // DATES: not applied — see state comment above.

      if (minRarity !== null && getUniqueness(listing).score < minRarity) return false;

      if (q) {
        // Text search covers city, region, and country so "Finland", "Lapland",
        // "Scotland" etc. all resolve even if not in the destination chip list.
        const haystack = [
          listing.name, listing.city, listing.region,
          listing.country, listing.propertyType, ...listing.amenities,
        ].join(' ').toLowerCase();
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
        case 'rarity':     return getUniqueness(b).score - getUniqueness(a).score;
        case 'price_asc':  return convertPrice(a.pricePerNight, a.currency, displayCurrency) - convertPrice(b.pricePerNight, b.currency, displayCurrency);
        case 'price_desc': return convertPrice(b.pricePerNight, b.currency, displayCurrency) - convertPrice(a.pricePerNight, a.currency, displayCurrency);
        case 'rating':     return b.rating - a.rating;
      }
    });

    return filtered;
  }, [query, selectedCategory, selectedDestination, selectedContinent, maxPrice, selectedType, minGuests, minBedrooms, selectedAmenities, minRarity, sortBy, selectedVibes, displayCurrency]);

  // Badge count: number of active filter groups inside the sheet.
  const filterCount = useMemo(() => [
    selectedDestination !== null,
    selectedContinent !== null,
    maxPrice !== null,
    selectedType !== null,
    minGuests !== null,
    minBedrooms !== null,
    selectedAmenities.length > 0,
    minRarity !== null,
  ].filter(Boolean).length, [selectedDestination, selectedContinent, maxPrice, selectedType, minGuests, minBedrooms, selectedAmenities, minRarity]);

  const hasFilters = !!(query.trim() || selectedVibes.length > 0 || filterCount > 0 || selectedCategory !== 'All');

  const toggleVibe    = (id: VibeId) =>
    setSelectedVibes((p) => p.includes(id) ? p.filter((v) => v !== id) : [...p, id]);
  const toggleAmenity = (label: string) =>
    setSelectedAmenities((p) => p.includes(label) ? p.filter((a) => a !== label) : [...p, label]);

  const { vaultDone } = useVault();
  const { prefs }     = useOnboarding();
  const prefsApplied  = useRef(false);

  useEffect(() => {
    if (!prefs || prefsApplied.current) return;
    prefsApplied.current = true;
    if (prefs.vibeIds.length > 0) setSelectedVibes(prefs.vibeIds as VibeId[]);
    if (prefs.maxPrice !== null)   setMaxPrice(prefs.maxPrice);
  }, [prefs]);

  // ── Wordmark unlock-reveal animation ──────────────────────────────────────────
  const letterAnims = useRef(
    WM_LETTERS.map((_, i) => ({
      opacity: new Animated.Value(REDUCE_MOTION ? 1 : 0),
      x:       new Animated.Value(REDUCE_MOTION ? 0 : i === 0 ? 0 : -28),
    }))
  ).current;
  const shimmerX     = useRef(new Animated.Value(-100)).current;
  const [wmWidth,    setWmWidth]    = useState(0);
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
    const t = setTimeout(() => {
      shimmerX.setValue(-100);
      Animated.timing(shimmerX, { toValue: wmWidth + 100, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
    }, 780);
    return () => clearTimeout(t);
  }, [wmWidth, vaultDone]);
  // ──────────────────────────────────────────────────────────────────────────────

  const [refreshing, setRefreshing] = useState(false);

  const clearAll = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedDestination(null);
    setSelectedContinent(null);
    setMaxPrice(null);
    setSelectedType(null);
    setMinGuests(null);
    setMinBedrooms(null);
    setSelectedAmenities([]);
    setCheckIn('');
    setCheckOut('');
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[GOLD]} />}
      >
        {/* ── Wordmark header ── */}
        <View style={styles.header}>
          <View style={styles.wordmarkRow} onLayout={(e) => setWmWidth(e.nativeEvent.layout.width)}>
            {WM_LETTERS.map((letter, i) => (
              <Animated.Text
                key={i}
                style={[styles.wordmark, { opacity: letterAnims[i].opacity, transform: [{ translateX: letterAnims[i].x }] }]}
              >
                {letter}
              </Animated.Text>
            ))}
            <Animated.View pointerEvents="none" style={[styles.shimmerBar, { transform: [{ translateX: shimmerX }] }]} />
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerLabel}>
              {hasFilters
                ? `${results.length} ${results.length === 1 ? 'STAY' : 'STAYS'} MATCHING`
                : 'A CURATED COLLECTION'}
            </Text>
            <View style={styles.headerLine} />
            {hasFilters && (
              <Pressable onPress={clearAll} hitSlop={8}>
                <Text style={styles.clearAll}>CLEAR ALL</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Category pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {cat.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Slim bar ── */}
        <View style={styles.slimBar}>

          {/* Search input + Filters button */}
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, place, or vibe"
              placeholderTextColor={MUTED}
              style={styles.searchInput}
            />
            <Pressable
              onPress={() => setSheetVisible(true)}
              style={[styles.filtersBtn, filterCount > 0 && styles.filtersBtnActive]}
            >
              <Ionicons name="options-outline" size={13} color={filterCount > 0 ? BG : GOLD} />
              <Text style={[styles.filtersBtnText, filterCount > 0 && styles.filtersBtnTextActive]}>
                {filterCount > 0 ? `Filters · ${filterCount}` : 'Filters'}
              </Text>
            </Pressable>
          </View>

          {/* Vibe chips — quick-access, always visible */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeRow}>
            {VIBES.map((vibe) => {
              const active = selectedVibes.includes(vibe.id);
              return (
                <Pressable
                  key={vibe.id}
                  onPress={() => toggleVibe(vibe.id)}
                  style={[styles.vibeChip, active && styles.vibeChipActive]}
                >
                  <Text style={[styles.vibeChipText, active && styles.vibeChipTextActive]}>{vibe.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sort row */}
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
            <Text style={styles.emptyHint}>
              {selectedCategory !== 'All'
                ? `No ${selectedCategory.toLowerCase()} match your filters — try another category or clear all.`
                : 'Try a different vibe or clear some filters.'}
            </Text>
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

      {/* ── Filter sheet ── */}
      <FilterSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        destinationOptions={destinationOptions}
        selectedDestination={selectedDestination}
        onDestination={setSelectedDestination}
        selectedContinent={selectedContinent}
        onContinent={setSelectedContinent}
        maxPrice={maxPrice}
        onMaxPrice={setMaxPrice}
        typeOptions={typeOptions}
        selectedType={selectedType}
        onType={setSelectedType}
        minGuests={minGuests}
        onMinGuests={setMinGuests}
        minBedrooms={minBedrooms}
        onMinBedrooms={setMinBedrooms}
        selectedAmenities={selectedAmenities}
        onToggleAmenity={toggleAmenity}
        checkIn={checkIn}
        onCheckIn={setCheckIn}
        checkOut={checkOut}
        onCheckOut={setCheckOut}
        minRarity={minRarity}
        onMinRarity={setMinRarity}
        onClearAll={clearAll}
      />
    </SafeAreaView>
  );
}

// ─── Filter sheet (bottom sheet modal) ────────────────────────────────────────
function FilterSheet({
  visible, onClose,
  destinationOptions, selectedDestination, onDestination,
  selectedContinent, onContinent,
  maxPrice, onMaxPrice,
  typeOptions, selectedType, onType,
  minGuests, onMinGuests,
  minBedrooms, onMinBedrooms,
  selectedAmenities, onToggleAmenity,
  checkIn, onCheckIn, checkOut, onCheckOut,
  minRarity, onMinRarity,
  onClearAll,
}: {
  visible: boolean;
  onClose: () => void;
  destinationOptions: { label: string; city: string | null; country: string | null }[];
  selectedDestination: { city: string; country: string } | null;
  onDestination: (v: { city: string; country: string } | null) => void;
  selectedContinent: string | null;
  onContinent: (v: string | null) => void;
  maxPrice: number | null;
  onMaxPrice: (v: number | null) => void;
  typeOptions: { label: string; value: string | null }[];
  selectedType: string | null;
  onType: (v: string | null) => void;
  minGuests: number | null;
  onMinGuests: (v: number | null) => void;
  minBedrooms: number | null;
  onMinBedrooms: (v: number | null) => void;
  selectedAmenities: string[];
  onToggleAmenity: (label: string) => void;
  checkIn: string;
  onCheckIn: (v: string) => void;
  checkOut: string;
  onCheckOut: (v: string) => void;
  minRarity: number | null;
  onMinRarity: (v: number | null) => void;
  onClearAll: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalWrap}>
        {/* Dim overlay — tap outside sheet to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Sheet panel */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>FILTERS</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={18} color={MUTED} />
            </Pressable>
          </View>

          <View style={styles.sheetDivider} />

          {/* Scrollable sections */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>

            {/* LOCATION */}
            <SheetSection title="LOCATION">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {destinationOptions.map((opt) => {
                  const active = opt.city === null
                    ? selectedDestination === null
                    : selectedDestination?.city === opt.city && selectedDestination?.country === opt.country;
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => onDestination(opt.city ? { city: opt.city, country: opt.country! } : null)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SheetSection>

            {/* REGION / CONTINENT */}
            <SheetSection title="REGION / CONTINENT">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {CONTINENT_OPTIONS.map((c) => {
                  const active = c === 'ALL' ? selectedContinent === null : selectedContinent === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => onContinent(c === 'ALL' ? null : c)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SheetSection>

            {/* BUDGET */}
            <SheetSection title="BUDGET">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {PRICE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => onMaxPrice(opt.value)}
                    style={[styles.chip, maxPrice === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, maxPrice === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </SheetSection>

            {/* PROPERTY TYPE */}
            <SheetSection title="PROPERTY TYPE">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {typeOptions.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => onType(opt.value)}
                    style={[styles.chip, selectedType === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedType === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </SheetSection>

            {/* GUESTS & BEDROOMS */}
            <SheetSection title="GUESTS & BEDROOMS">
              <Text style={styles.subLabel}>GUESTS</Text>
              <View style={styles.chipGroup}>
                {GUEST_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => onMinGuests(opt.value)}
                    style={[styles.chip, minGuests === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, minGuests === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.subLabel, { marginTop: 14 }]}>BEDROOMS</Text>
              <View style={styles.chipGroup}>
                {BEDROOM_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => onMinBedrooms(opt.value)}
                    style={[styles.chip, minBedrooms === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, minBedrooms === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </SheetSection>

            {/* AMENITIES */}
            <SheetSection title="AMENITIES">
              <View style={styles.amenityGrid}>
                {AMENITY_OPTS.map((opt) => {
                  const active = selectedAmenities.includes(opt.label);
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => onToggleAmenity(opt.label)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SheetSection>

            {/* DATES / AVAILABILITY — UI shell only */}
            <SheetSection title="DATES / AVAILABILITY">
              {/*
                DATE PICKER SHELL ─────────────────────────────────────────────────
                Dates are stored in state but NOT applied to results filtering.
                Wire real availability once live inventory APIs are connected:
                  Booking.com: /v2/availability endpoint
                  Vrbo:        /listings/{id}/availability
                  Agoda:       Property Availability API
                Replace TextInputs here with a date-range picker library at that time.
                ───────────────────────────────────────────────────────────────────
              */}
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>CHECK-IN</Text>
                  <TextInput
                    value={checkIn}
                    onChangeText={onCheckIn}
                    placeholder="Any"
                    placeholderTextColor={MUTED}
                    style={styles.dateInput}
                  />
                </View>
                <View style={styles.dateSep} />
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>CHECK-OUT</Text>
                  <TextInput
                    value={checkOut}
                    onChangeText={onCheckOut}
                    placeholder="Any"
                    placeholderTextColor={MUTED}
                    style={styles.dateInput}
                  />
                </View>
              </View>
              <Text style={styles.dateNote}>
                Availability filtering activates once live inventory is connected.
              </Text>
            </SheetSection>

            {/* RARITY */}
            <SheetSection title="RARITY">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {RARITY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => onMinRarity(opt.value)}
                    style={[styles.chip, minRarity === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, minRarity === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </SheetSection>

            {/* DISPLAY CURRENCY */}
            <CurrencySheetSection />

          </ScrollView>

          {/* Sheet footer */}
          <View style={styles.sheetFooter}>
            <Pressable
              onPress={() => { onClearAll(); onClose(); }}
              hitSlop={8}
              style={styles.clearSheetBtn}
            >
              <Text style={styles.clearSheetText}>CLEAR ALL</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>APPLY</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CurrencySheetSection() {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  return (
    <SheetSection title="DISPLAY CURRENCY">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SUPPORTED_CURRENCIES.map((c) => {
          const active = displayCurrency === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => setDisplayCurrency(c.code)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c.code} {c.symbol}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SheetSection>
  );
}

// ─── Hero listing (first result, full-width) ───────────────────────────────────
function HeroListing({ listing, number }: { listing: Listing; number: number }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { displayCurrency } = useCurrency();
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
                  {formatPrice(listing.pricePerNight, listing.currency, displayCurrency)}
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

// ─── Editorial row (subsequent results) ───────────────────────────────────────
function EditorialRow({ listing, number }: { listing: Listing; number: number }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { displayCurrency } = useCurrency();
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
                {formatPrice(listing.pricePerNight, listing.currency, displayCurrency)}
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { paddingBottom: 48 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  wordmarkRow: { flexDirection: 'row', overflow: 'hidden' },
  wordmark: {
    fontSize: 64, fontWeight: '900', color: TEXT,
    letterSpacing: -2, lineHeight: 66, fontFamily: 'Georgia',
  },
  shimmerBar: {
    position: 'absolute', top: 0, bottom: 0, width: 70,
    backgroundColor: GOLD, opacity: 0.25,
  },
  headerMeta: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLabel: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2.5 },
  headerLine:  { flex: 1, height: 1, backgroundColor: DIVIDER },
  clearAll:    { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 2, textDecorationLine: 'underline' },

  // Category pills
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 1,
  },
  categoryPillActive: {
    backgroundColor: GOLD,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },
  categoryPillTextActive: {
    color: BG,
  },

  // Slim bar
  slimBar: { paddingHorizontal: 20, paddingBottom: 4 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  searchInput: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: DIVIDER, borderRadius: 2,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: TEXT, letterSpacing: 0.3,
  },
  filtersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: GOLD, borderRadius: 2,
  },
  filtersBtnActive: { backgroundColor: GOLD },
  filtersBtnText: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1 },
  filtersBtnTextActive: { color: BG },

  vibeRow: { flexDirection: 'row', gap: 8, paddingBottom: 14 },
  vibeChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: GOLD, borderRadius: 1,
  },
  vibeChipActive:     { backgroundColor: GOLD },
  vibeChipText:       { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 1.5 },
  vibeChipTextActive: { color: BG },

  sortRow:       { flexDirection: 'row', gap: 20, paddingBottom: 14, marginTop: 2 },
  sortItem:      { alignItems: 'center' },
  sortText:      { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 2 },
  sortTextActive:{ color: GOLD },
  sortUnderline: { marginTop: 4, height: 1, width: '100%', backgroundColor: GOLD },

  divider: { height: 1, backgroundColor: DIVIDER },

  // Empty state
  empty:      { paddingTop: 72, alignItems: 'center' },
  emptyLabel: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 2.5 },
  emptyHint:  { marginTop: 10, fontSize: 13, color: MUTED, fontStyle: 'italic' },

  // ── Filter sheet modal ──────────────────────────────────────────────────────
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,168,107,0.25)',
    maxHeight: '88%',
  },
  sheetHandle: {
    width: 36, height: 4,
    backgroundColor: DIVIDER,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  sheetTitle: { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 3 },
  sheetDivider: { height: 1, backgroundColor: DIVIDER },
  sheetScroll: { paddingBottom: 8 },

  sheetSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  sheetSectionTitle: {
    fontSize: 9, fontWeight: '700', color: GOLD,
    letterSpacing: 2.5, marginBottom: 14,
  },
  subLabel: {
    fontSize: 9, fontWeight: '700', color: MUTED,
    letterSpacing: 2, marginBottom: 10,
  },

  // Chips (shared)
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 1,
  },
  chipActive:     { backgroundColor: GOLD, borderColor: GOLD },
  chipText:       { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 1.5 },
  chipTextActive: { color: BG },

  // Amenity grid (wraps)
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },

  // Date fields
  dateRow: { flexDirection: 'row', gap: 0 },
  dateField: { flex: 1 },
  dateSep: { width: 1, backgroundColor: DIVIDER, marginHorizontal: 12 },
  dateFieldLabel: { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 2, marginBottom: 8 },
  dateInput: {
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: '#2A2A2A',
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: TEXT,
  },
  dateNote: {
    marginTop: 10, marginBottom: 4,
    fontSize: 11, color: MUTED,
    fontStyle: 'italic', letterSpacing: 0.2,
  },

  // Sheet footer
  sheetFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8,
    gap: 14,
    borderTopWidth: 1, borderTopColor: DIVIDER,
  },
  clearSheetBtn: { paddingVertical: 4 },
  clearSheetText: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 2, textDecorationLine: 'underline' },
  applyBtn: {
    flex: 1, backgroundColor: GOLD,
    paddingVertical: 14, alignItems: 'center',
  },
  applyBtnText: { fontSize: 11, fontWeight: '800', color: BG, letterSpacing: 2.5 },

  // Hero listing
  heroOuter:  { marginHorizontal: 20, marginTop: 24, marginBottom: 24 },
  hero:       { height: 420, overflow: 'hidden' },
  heroPressed:{ opacity: 0.9 },
  heroGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1, borderColor: 'rgba(200,168,107,0.85)',
  },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  heroNumber: {
    position: 'absolute', top: 14, left: 16,
    fontSize: 80, fontWeight: '900', color: GOLD,
    letterSpacing: -4, lineHeight: 80, fontFamily: 'Georgia', opacity: 0.85,
  },
  heroBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18,
  },
  heroInfo:     { flex: 1, marginRight: 12 },
  heroTitle:    { fontSize: 22, fontWeight: '800', color: TEXT, fontFamily: 'Georgia', lineHeight: 28, letterSpacing: -0.5 },
  heroLocation: { fontSize: 9, fontWeight: '600', color: 'rgba(245,243,239,0.65)', letterSpacing: 2, marginTop: 7 },
  heroMeta:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  heroRarity:   { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1 },
  heroPrice:    { fontSize: 16, fontWeight: '800', color: TEXT },
  heroUnit:     { fontSize: 11, fontWeight: '400', color: 'rgba(245,243,239,0.55)' },
  heroHeart:    { padding: 4, alignSelf: 'flex-end', paddingBottom: 2 },

  // Editorial rows
  rowOuter:     { overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  rowPressed:   { backgroundColor: '#111111' },
  rowGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1, borderColor: 'rgba(200,168,107,0.6)', pointerEvents: 'none',
  },
  rowNumber:    { width: 32, fontSize: 20, fontWeight: '900', color: GOLD, fontFamily: 'Georgia', letterSpacing: -1, textAlign: 'right', opacity: 0.85 },
  rowImageWrap: { width: 90, height: 68, overflow: 'hidden' },
  rowBody:      { flex: 1 },
  rowTitle:     { fontSize: 14, fontWeight: '700', color: TEXT, lineHeight: 19, letterSpacing: -0.2 },
  rowLocation:  { fontSize: 9, fontWeight: '600', color: MUTED, letterSpacing: 1.5, marginTop: 5 },
  rowMeta:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  rowRarity:    { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  rowPrice:     { fontSize: 13, fontWeight: '700', color: TEXT },
  rowUnit:      { fontSize: 10, fontWeight: '400', color: MUTED },
  rowHeart:     { padding: 8 },
});
