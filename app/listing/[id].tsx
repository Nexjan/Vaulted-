import { useMemo, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { formatPrice } from '../../lib/currency';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

function ReserveBar({ listing }: { listing: Listing }) {
  const insets = useSafeAreaInsets();
  const sheenX = useRef(new Animated.Value(-200)).current;

  const runSheen = () => {
    if (REDUCE_MOTION) return;
    sheenX.setValue(-200);
    Animated.timing(sheenX, { toValue: 500, duration: 620, useNativeDriver: true }).start();
  };

  const webProps = Platform.OS === 'web'
    ? { onMouseEnter: runSheen } as Record<string, unknown>
    : {};

  return (
    <View style={[styles.reserveBar, { paddingBottom: insets.bottom + 14 }]}>
      <View style={styles.reservePriceGroup}>
        <Text style={styles.reservePrice}>{formatPrice(listing.pricePerNight, listing.currency)}</Text>
        <Text style={styles.reservePriceUnit}>/ night</Text>
      </View>
      <Pressable
        onPress={() => Linking.openURL(getBookingUrl(listing))}
        style={({ pressed }) => [styles.reserveBtn, pressed && styles.reserveBtnPressed]}
        {...(webProps as any)}
      >
        <Text style={styles.reserveBtnText}>RESERVE THIS STAY</Text>
        <Animated.View
          pointerEvents="none"
          style={[styles.reserveSheen, { transform: [{ translateX: sheenX }] }]}
        />
      </Pressable>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const listing = useMemo(() => listings.find((item) => item.id === id), [id]);
  const heroOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>LISTING NOT FOUND</Text>
      </View>
    );
  }

  const uniqueness = getUniqueness(listing);
  const priceComparison = comparePrice(listing, listings);
  const priceHistory = getPriceHistory(listing);
  const active = isFavorite(listing.id);

  const dealTier = priceComparison.tier;
  const avgFormatted = formatPrice(Math.round(priceComparison.comparableAverage), listing.currency);
  const dealCopy =
    priceComparison.comparableCount === 0
      ? "Insufficient comparable stays in this city to benchmark the price."
      : dealTier === 'great-deal'
        ? `Priced ${Math.round(Math.abs(priceComparison.percentDiff))}% below the ${avgFormatted}/night city average — a great deal.`
        : dealTier === 'above-average'
          ? `Runs ${Math.round(Math.abs(priceComparison.percentDiff))}% above the ${avgFormatted}/night city average.`
          : `Close to the ${avgFormatted}/night city average — a fair price.`;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* ── Hero image ── */}
        <View style={styles.hero}>
          <SkeletonBlock style={StyleSheet.absoluteFill} />
          <Animated.Image
            source={{ uri: listing.imageUrls[0] }}
            style={[styles.heroImage, { opacity: heroOpacity }]}
            resizeMode="cover"
            onLoad={() => {
              if (REDUCE_MOTION) return;
              Animated.timing(heroOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
            }}
          />
          <View style={styles.heroOverlay} />
          <Pressable
            onPress={() => toggleFavorite(listing.id)}
            hitSlop={8}
            style={styles.heartBtn}
          >
            <Ionicons name={active ? 'heart' : 'heart-outline'} size={22} color={active ? GOLD : TEXT} />
          </Pressable>
          <View style={styles.heroBottom}>
            <Text style={styles.heroType}>
              {listing.propertyType.toUpperCase()} · {listing.city.toUpperCase()}, {listing.country.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Title & meta ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{listing.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>★ {listing.rating.toFixed(2)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>{listing.reviewCount} reviews</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>Up to {listing.maxGuests} guests</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Rarity ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RARITY SCORE</Text>
          <Text style={styles.rarityScore}>
            {uniqueness.score}
            <Text style={styles.rarityTotal}> / 100</Text>
          </Text>
          {uniqueness.reasons.map((reason) => (
            <Text key={reason} style={styles.bullet}>— {reason}</Text>
          ))}
          <View style={styles.tagRow}>
            {listing.amenities.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── About ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT THIS PLACE</Text>
          <Text style={styles.body}>{listing.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Price check ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRICE CHECK</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.pricePerNight, listing.currency)}</Text>
            <Text style={styles.priceUnit}>/ night</Text>
            {dealTier === 'great-deal' && (
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>GREAT DEAL</Text>
              </View>
            )}
          </View>
          <Text style={styles.dealCopy}>{dealCopy}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Price history ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRICE HISTORY</Text>
          <PriceHistoryChart history={priceHistory} currency={listing.currency} />
        </View>

        <View style={styles.divider} />

        {/* ── Reviews ── */}
        <View style={styles.section}>
          <ReviewsSection listing={listing} />
        </View>

      </ScrollView>

      {/* ── Reserve bar ── */}
      <ReserveBar listing={listing} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 108,
  },

  // Hero
  hero: {
    height: 340,
    backgroundColor: SURFACE,
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heartBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,10,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroType: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
  },

  // Title block
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    fontFamily: 'Georgia',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaItem: {
    fontSize: 12,
    color: MUTED,
    letterSpacing: 0.3,
  },
  metaDot: {
    fontSize: 12,
    color: '#333',
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
    marginBottom: 14,
  },

  // Rarity
  rarityScore: {
    fontSize: 40,
    fontWeight: '900',
    color: GOLD,
    fontFamily: 'Georgia',
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 14,
  },
  rarityTotal: {
    fontSize: 20,
    fontWeight: '400',
    color: MUTED,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 22,
    color: '#888',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
  },

  // Body text
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#888888',
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -1,
  },
  priceUnit: {
    fontSize: 13,
    color: MUTED,
  },
  dealBadge: {
    borderWidth: 1,
    borderColor: '#5DA87A',
    borderRadius: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  dealBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#5DA87A',
    letterSpacing: 1.5,
  },
  dealCopy: {
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
  },

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
    fontSize: 20,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
  },
  reservePriceUnit: {
    fontSize: 11,
    color: MUTED,
  },
  reserveBtn: {
    flex: 1,
    height: 52,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reserveBtnPressed: {
    opacity: 0.82,
  },
  reserveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 2.5,
  },
  reserveSheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  notFoundText: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2.5,
  },
});
