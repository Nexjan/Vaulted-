import { useRef, useState, useMemo } from 'react';
import {
  Animated, Linking, Platform, Pressable, ScrollView,
  StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listings } from '../../lib/listingsService';
import { PriceHistoryChart } from '../../components/PriceHistoryChart';
import { ReviewsSection } from '../../components/ReviewsSection';
import { getUniqueness } from '../../lib/uniqueness';
import { comparePrice } from '../../lib/pricing';
import { getPriceHistory } from '../../lib/priceHistory';
import { useFavorites } from '../../lib/favorites';
import { SkeletonBlock } from '../../components/Skeleton';
import { getBookingUrl } from '../../lib/booking';
import { Listing } from '../../lib/types';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

// ─── Amenity → icon lookup ─────────────────────────────────────────────────────────────────────────
// Substring-matched (case-insensitive) against each listing.amenities string.
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const AMENITY_ICON_MAP: { search: string; icon: IoniconsName }[] = [
  { search: 'wifi',          icon: 'wifi'                 },
  { search: 'pool',          icon: 'water'                },
  { search: 'hot tub',       icon: 'thermometer'          },
  { search: 'jacuzzi',       icon: 'thermometer'          },
  { search: 'kitchen',       icon: 'restaurant'           },
  { search: 'cooking',       icon: 'restaurant'           },
  { search: 'parking',       icon: 'car'                  },
  { search: 'garage',        icon: 'car'                  },
  { search: 'pet',           icon: 'paw'                  },
  { search: 'dog',           icon: 'paw'                  },
  { search: 'air con',       icon: 'snow'                 },
  { search: ' ac',           icon: 'snow'                 },
  { search: 'workspace',     icon: 'laptop'               },
  { search: 'desk',          icon: 'laptop'               },
  { search: 'fireplace',     icon: 'flame'                },
  { search: 'wood stove',    icon: 'flame'                },
  { search: 'fire pit',      icon: 'flame'                },
  { search: 'sauna',         icon: 'thermometer'          },
  { search: 'steam',         icon: 'thermometer'          },
  { search: 'gym',           icon: 'barbell'              },
  { search: 'exercise',      icon: 'barbell'              },
  { search: 'bbq',           icon: 'flame'                },
  { search: 'grill',         icon: 'flame'                },
  { search: 'laundry',       icon: 'shirt'                },
  { search: 'washer',        icon: 'shirt'                },
  { search: 'dryer',         icon: 'shirt'                },
  { search: 'tv',            icon: 'tv'                   },
  { search: 'netflix',       icon: 'play-circle'          },
  { search: 'streaming',     icon: 'play-circle'          },
  { search: 'balcony',       icon: 'sunny'                },
  { search: 'terrace',       icon: 'sunny'                },
  { search: 'patio',         icon: 'sunny'                },
  { search: 'deck',          icon: 'sunny'                },
  { search: 'ocean',         icon: 'water'                },
  { search: 'beach',         icon: 'water'                },
  { search: 'lake',          icon: 'water'                },
  { search: 'water',         icon: 'water'                },
  { search: 'waterfront',    icon: 'water'                },
  { search: 'floating',      icon: 'water'                },
  { search: 'kayak',         icon: 'boat'                 },
  { search: 'boat',          icon: 'boat'                 },
  { search: 'bicycle',       icon: 'bicycle'              },
  { search: 'bike',          icon: 'bicycle'              },
  { search: 'mountain',      icon: 'trail-sign'           },
  { search: 'hiking',        icon: 'trail-sign'           },
  { search: 'trail',         icon: 'trail-sign'           },
  { search: 'view',          icon: 'eye'                  },
  { search: 'panoramic',     icon: 'eye'                  },
  { search: 'stargazing',    icon: 'star'                 },
  { search: 'northern light',icon: 'star'                 },
  { search: 'forest',        icon: 'leaf'                 },
  { search: 'garden',        icon: 'leaf'                 },
  { search: 'outdoor',       icon: 'leaf'                 },
  { search: 'nature',        icon: 'leaf'                 },
  { search: 'off-grid',      icon: 'battery-charging'     },
  { search: 'solar',         icon: 'sunny'                },
  { search: 'historic',      icon: 'time'                 },
  { search: 'castle',        icon: 'shield'               },
  { search: 'concierge',     icon: 'people'               },
  { search: 'host',          icon: 'people'               },
  { search: 'breakfast',     icon: 'cafe'                 },
];

function getAmenityIcon(amenity: string): IoniconsName {
  const lower = amenity.toLowerCase();
  const match = AMENITY_ICON_MAP.find(({ search }) => lower.includes(search));
  return match?.icon ?? 'checkmark-circle-outline';
}

// ─── Gallery slide (each image in the horizontal gallery) ──────────────────────────────────────────────
function GallerySlide({ url, width, height }: { url: string; width: number; height: number }) {
  const opacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  return (
    <View style={{ width, height }}>
      <SkeletonBlock style={StyleSheet.absoluteFill} />
      <Animated.Image
        source={{ uri: url }}
        style={[StyleSheet.absoluteFill, { opacity }]}
        resizeMode="cover"
        onLoad={() => {
          if (REDUCE_MOTION) return;
          Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        }}
      />
    </View>
  );
}

// ─── Amenity grid ───────────────────────────────────────────────────────────────────────────────────
function AmenityGrid({ amenities }: { amenities: string[] }) {
  return (
    <View style={s.amenityGrid}>
      {amenities.map((amenity) => (
        <View key={amenity} style={s.amenityItem}>
          <Ionicons name={getAmenityIcon(amenity)} size={13} color={GOLD} style={s.amenityIcon} />
          <Text style={s.amenityText}>{amenity}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Location section ─────────────────────────────────────────────────────────────────────────────
function LocationSection({ listing }: { listing: Listing }) {
  const openMaps = () => {
    const { latitude, longitude, city, country } = listing;
    const q = encodeURIComponent(`${city}, ${country}`);
    const url =
      Platform.OS === 'ios'   ? `maps:?q=${q}&ll=${latitude},${longitude}` :
      Platform.OS === 'android' ? `geo:${latitude},${longitude}?q=${q}` :
      `https://maps.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const hasCoords = listing.latitude !== 0 || listing.longitude !== 0;
  const latStr = hasCoords
    ? `${Math.abs(listing.latitude).toFixed(4)}° ${listing.latitude >= 0 ? 'N' : 'S'}`
    : null;
  const lngStr = hasCoords
    ? `${Math.abs(listing.longitude).toFixed(4)}° ${listing.longitude >= 0 ? 'E' : 'W'}`
    : null;

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>LOCATION</Text>

      {/* Branded map pin box */}
      <View style={s.mapBox}>
        {/* Subtle gold grid lines to suggest cartography */}
        <View style={[s.mapLine, s.mapLineH, { top: '25%' }]} />
        <View style={[s.mapLine, s.mapLineH, { top: '50%' }]} />
        <View style={[s.mapLine, s.mapLineH, { top: '75%' }]} />
        <View style={[s.mapLine, s.mapLineV, { left: '25%' }]} />
        <View style={[s.mapLine, s.mapLineV, { left: '50%' }]} />
        <View style={[s.mapLine, s.mapLineV, { left: '75%' }]} />
        {/* Center glow */}
        <View style={s.mapGlow} />
        {/* Gold location pin */}
        <View style={s.mapPinWrap}>
          <Ionicons name="location" size={38} color={GOLD} />
        </View>
      </View>

      {/* Info row */}
      <View style={s.locationRow}>
        <View style={s.locationLeft}>
          <Text style={s.locationCity}>
            {listing.city}{listing.region ? `, ${listing.region}` : ''}
          </Text>
          <Text style={s.locationCountry}>{listing.country}</Text>
          {latStr && lngStr && (
            <Text style={s.locationCoords}>{latStr}  {lngStr}</Text>
          )}
        </View>
        <Pressable onPress={openMaps} style={s.openMapsBtn} hitSlop={8}>
          <Text style={s.openMapsBtnText}>OPEN IN MAPS</Text>
          <Ionicons name="arrow-forward" size={9} color={GOLD} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Reserve bar (sticky) ────────────────────────────────────────────────────────────────────────────────
function ReserveBar({ listing }: { listing: Listing }) {
  const insets = useSafeAreaInsets();
  const sheenX = useRef(new Animated.Value(-200)).current;

  const runSheen = () => {
    if (REDUCE_MOTION) return;
    sheenX.setValue(-200);
    Animated.timing(sheenX, { toValue: 500, duration: 620, useNativeDriver: true }).start();
  };

  const webProps = Platform.OS === 'web' ? { onMouseEnter: runSheen } as Record<string, unknown> : {};

  const handleReserve = () => {
    // ─── AFFILIATE BOOKING URL ────────────────────────────────────────────────────────────────────────
    // getBookingUrl() is the single authoritative source for outbound booking links.
    // Once Travelpayouts / Booking.com / Vrbo / Agoda partner approvals land,
    // update lib/booking.ts with the affiliate ID — no other file needs to change.
    // The affiliate-tagged URL replaces listing.bookingUrl for real inventory.
    // ────────────────────────────────────────────────────────────────────────────
    Linking.openURL(getBookingUrl(listing));
  };

  return (
    <View style={[s.reserveBar, { paddingBottom: insets.bottom + 14 }]}>
      <View style={s.reservePriceGroup}>
        <Text style={s.reservePrice}>See current rates</Text>
      </View>
      <Pressable
        onPress={handleReserve}
        style={({ pressed }) => [s.reserveBtn, pressed && s.reserveBtnPressed]}
        {...(webProps as any)}
      >
        <Text style={s.reserveBtnText}>RESERVE THIS STAY  →</Text>
        <Animated.View
          pointerEvents="none"
          style={[s.reserveSheen, { transform: [{ translateX: sheenX }] }]}
        />
      </Pressable>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────────────────────────
export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activePhoto, setActivePhoto] = useState(0);

  const listing = useMemo(() => listings.find((item) => item.id === id), [id]);

  if (!listing) {
    return (
      <View style={s.notFound}>
        <Pressable onPress={() => router.back()} style={s.notFoundBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={14} color={GOLD} />
          <Text style={s.notFoundBackText}>BACK</Text>
        </Pressable>
        <Text style={s.notFoundText}>LISTING NOT FOUND</Text>
      </View>
    );
  }

  const uniqueness     = getUniqueness(listing);
  const priceComparison = comparePrice(listing, listings);
  const priceHistory   = getPriceHistory(listing);
  const active         = isFavorite(listing.id);
  const HERO_H         = Math.min(Math.round(width * 0.72), 460);

  const dealTier = priceComparison.tier;
  const dealCopy =
    priceComparison.comparableCount === 0
      ? 'Insufficient comparable stays in this city to benchmark the price.'
      : dealTier === 'great-deal'
        ? 'A great deal compared to similar stays in this city — see current rates on Booking.com.'
        : dealTier === 'above-average'
          ? 'Priced above average for similar stays in this city — see current rates on Booking.com.'
          : 'A fair price compared to similar stays in this city — see current rates on Booking.com.';

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Photo gallery ── */}
        <View style={[s.galleryWrap, { height: HERO_H }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ height: HERO_H }}
            onMomentumScrollEnd={(e) =>
              setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {listing.imageUrls.map((url, i) => (
              <GallerySlide key={i} url={url} width={width} height={HERO_H} />
            ))}
          </ScrollView>

          {/* Bottom gradient for legibility of overlaid elements */}
          <View style={s.heroGradient} pointerEvents="none" />

          {/* Back arrow */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={[s.backBtn, { top: insets.top + 12 }]}
          >
            <Ionicons name="chevron-back" size={16} color={TEXT} />
          </Pressable>

          {/* Save / heart */}
          <Pressable
            onPress={() => toggleFavorite(listing.id)}
            hitSlop={8}
            style={[s.heartBtn, { top: insets.top + 12 }]}
          >
            <Ionicons
              name={active ? 'heart' : 'heart-outline'}
              size={18}
              color={active ? GOLD : TEXT}
            />
          </Pressable>

          {/* Gold dot indicators */}
          {listing.imageUrls.length > 1 && (
            <View style={s.dotsRow} pointerEvents="none">
              {listing.imageUrls.map((_, i) => (
                <View key={i} style={[s.dot, i === activePhoto && s.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Title & location line ── */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{listing.name}</Text>
          <Text style={s.locationLine}>
            {listing.city.toUpperCase()}, {listing.country.toUpperCase()} · {listing.propertyType.toUpperCase()}
          </Text>
        </View>

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          <View style={s.statGroup}>
            <Text style={s.statRarity}>◆ {uniqueness.score}<Text style={s.statRarityMuted}>/100</Text></Text>
            <Text style={s.statLabel}>RARITY</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statGroup}>
            <Text style={s.statValue}>★ {listing.rating.toFixed(2)}</Text>
            <Text style={s.statLabel}>{listing.reviewCount.toLocaleString()} REVIEWS</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statGroup}>
            <Text style={s.statPrice}>See current rates</Text>
            <Text style={s.statLabel}>PER NIGHT</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Description ── */}
        {!!listing.description && (
          <>
            <View style={s.section}>
              <Text style={s.sectionLabel}>ABOUT THIS PLACE</Text>
              <Text style={s.body}>{listing.description}</Text>
            </View>
            <View style={s.divider} />
          </>
        )}

        {/* ── Amenities ── */}
        {listing.amenities.length > 0 && (
          <>
            <View style={s.section}>
              <Text style={s.sectionLabel}>AMENITIES</Text>
              <AmenityGrid amenities={listing.amenities} />
            </View>
            <View style={s.divider} />
          </>
        )}

        {/* ── Location ── */}
        <LocationSection listing={listing} />
        <View style={s.divider} />

        {/* ── What makes it rare ── */}
        {uniqueness.reasons.length > 0 && (
          <>
            <View style={s.section}>
              <Text style={s.sectionLabel}>WHAT MAKES IT RARE</Text>
              <View style={s.rarityScoreRow}>
                <Text style={s.rarityScore}>{uniqueness.score}</Text>
                <Text style={s.rarityScoreOf}> / 100</Text>
              </View>
              {uniqueness.reasons.map((reason) => (
                <Text key={reason} style={s.rarityReason}>— {reason}</Text>
              ))}
            </View>
            <View style={s.divider} />
          </>
        )}

        {/* ── Price check ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PRICE CHECK</Text>
          <View style={s.priceCheckRow}>
            <Text style={s.priceCheckValue}>See current rates</Text>
            {dealTier === 'great-deal' && (
              <View style={s.dealBadge}>
                <Text style={s.dealBadgeText}>GREAT DEAL</Text>
              </View>
            )}
          </View>
          <Text style={s.dealCopy}>{dealCopy}</Text>
        </View>

        <View style={s.divider} />

        {/* ── Price history ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PRICE HISTORY</Text>
          <PriceHistoryChart history={priceHistory} currency={listing.currency} />
        </View>

        <View style={s.divider} />

        {/* ── Reviews ── */}
        <View style={s.section}>
          <ReviewsSection listing={listing} />
        </View>

      </ScrollView>

      {/* ── Sticky reserve bar ── */}
      <ReserveBar listing={listing} />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: BG },
  content:  { paddingBottom: 112 },

  // Not found
  notFound: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundBack: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  notFoundBackText: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2 },
  notFoundText: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 2.5 },

  // Gallery
  galleryWrap: { backgroundColor: SURFACE },
  heroGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10,10,10,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    right: 16,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10,10,10,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 5, height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(245,243,239,0.35)',
  },
  dotActive: {
    backgroundColor: GOLD,
    width: 14,
  },

  // Title block
  titleBlock: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 4 },
  title: {
    fontSize: 30, fontWeight: '800', color: TEXT,
    fontFamily: 'Georgia', lineHeight: 36, letterSpacing: -0.5,
    marginBottom: 10,
  },
  locationLine: {
    fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 0,
  },
  statGroup: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: DIVIDER },
  statRarity: {
    fontSize: 20, fontWeight: '900', color: GOLD,
    fontFamily: 'Georgia', letterSpacing: -0.5,
  },
  statRarityMuted: { fontSize: 13, fontWeight: '400', color: MUTED },
  statValue: { fontSize: 16, fontWeight: '700', color: TEXT },
  statPrice: {
    fontSize: 18, fontWeight: '900', color: TEXT,
    fontFamily: 'Georgia', letterSpacing: -0.5,
  },
  statLabel: { fontSize: 8, fontWeight: '700', color: MUTED, letterSpacing: 2, marginTop: 4 },

  divider: { height: 1, backgroundColor: DIVIDER },

  // Sections
  section: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 22 },
  sectionLabel: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2.5, marginBottom: 16 },

  // Body text
  body: { fontSize: 14, lineHeight: 23, color: '#AAAAAA' },

  // Amenities
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  amenityItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingRight: 12,
  },
  amenityIcon: { marginRight: 10 },
  amenityText: { fontSize: 13, color: '#CCCCCC', flex: 1 },

  // Location map box
  mapBox: {
    height: 156,
    backgroundColor: '#0C0C0C',
    borderWidth: 1,
    borderColor: DIVIDER,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLine: {
    position: 'absolute',
    backgroundColor: 'rgba(200,168,107,0.07)',
  },
  mapLineH: { left: 0, right: 0, height: 1 },
  mapLineV: { top: 0, bottom: 0, width: 1 },
  mapGlow: {
    position: 'absolute',
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(200,168,107,0.07)',
  },
  mapPinWrap: { marginBottom: -8 },

  // Location info below map
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  locationLeft: { flex: 1 },
  locationCity: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 4 },
  locationCountry: { fontSize: 12, color: MUTED, marginBottom: 6 },
  locationCoords: { fontSize: 10, color: '#444444', letterSpacing: 0.5, fontVariant: ['tabular-nums'] },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.3)',
    marginLeft: 16,
  },
  openMapsBtnText: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2 },

  // Rarity section
  rarityScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  rarityScore: {
    fontSize: 44, fontWeight: '900', color: GOLD,
    fontFamily: 'Georgia', letterSpacing: -1, lineHeight: 48,
  },
  rarityScoreOf: { fontSize: 20, fontWeight: '400', color: MUTED },
  rarityReason: { fontSize: 13, lineHeight: 22, color: '#888888' },

  // Price check
  priceCheckRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  priceCheckValue: {
    fontSize: 32, fontWeight: '900', color: TEXT,
    fontFamily: 'Georgia', letterSpacing: -1,
  },
  priceCheckUnit: { fontSize: 13, color: MUTED },
  dealBadge: {
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  dealBadgeText: { fontSize: 8, fontWeight: '700', color: GOLD, letterSpacing: 1.5 },
  dealCopy: { fontSize: 13, lineHeight: 20, color: MUTED },

  // Reserve bar
  reserveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: BG,
    gap: 14,
  },
  reservePriceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  reservePrice: {
    fontSize: 20, fontWeight: '900', color: TEXT,
    fontFamily: 'Georgia', letterSpacing: -0.5,
  },
  reservePriceUnit: { fontSize: 11, color: MUTED },
  reserveBtn: {
    flex: 1, height: 52,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reserveBtnPressed: { opacity: 0.82 },
  reserveBtnText: { fontSize: 11, fontWeight: '800', color: BG, letterSpacing: 2.5 },
  reserveSheen: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
